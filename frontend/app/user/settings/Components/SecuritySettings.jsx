"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSave,
  FiCheck,
  FiKey,
  FiShield,
  FiAlertTriangle,
  FiLock,
  FiEye,
  FiEyeOff,
  FiX,
  FiInfo,
  FiRefreshCw,
  FiCalendar,
  FiMonitor,
  FiTrash2,
} from "react-icons/fi";
import { makePriorityRequest } from "@/lib/api/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter } from "next/navigation";
import DeleteAccountModal from "../../../../Components/Modal/DeleteAccountModal";

const SecuritySettings = ({ user }) => {
  const { deleteAccount } = useAuth();
  const router = useRouter();
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    user?.securitySettings?.twoFactorEnabled || false
  );
  const [loginAlerts, setLoginAlerts] = useState(
    user?.securitySettings?.loginAlerts || false
  );

  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isSubmittingSecurity, setIsSubmittingSecurity] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({});

  // Added states for password visibility and strength
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Calculate password strength
  useEffect(() => {
    if (!passwordData.newPassword) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;

    // Length check
    if (passwordData.newPassword.length >= 8) strength += 1;
    if (passwordData.newPassword.length >= 12) strength += 1;
    
    // Character variety checks
    if (/[a-z]/.test(passwordData.newPassword)) strength += 1;
    if (/[A-Z]/.test(passwordData.newPassword)) strength += 1;
    if (/\d/.test(passwordData.newPassword)) strength += 1;
    if (/[!@#$%^&*]/.test(passwordData.newPassword)) strength += 1;
    
    setPasswordStrength(Math.min(5, strength));
  }, [passwordData.newPassword]);

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength === 1) return "Very weak";
    if (passwordStrength === 2) return "Weak";
    if (passwordStrength === 3) return "Moderate";
    if (passwordStrength === 4) return "Strong";
    return "Very strong";
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-200";
    if (passwordStrength === 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-orange-500";
    if (passwordStrength === 3) return "bg-yellow-500";
    if (passwordStrength === 4) return "bg-green-500";
    return "bg-emerald-500";
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(
        passwordData.newPassword
      )
    ) {
      errors.newPassword =
        "Password must include uppercase, lowercase, number, and special character";
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    setIsSubmittingPassword(true);
    setPasswordSuccess("");

    try {
      await makePriorityRequest("put", "/auth/change-password", passwordData);

      setPasswordSuccess("Password changed successfully");
      toast.success("Password changed successfully");

      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");

      if (error.response?.data?.field) {
        setPasswordErrors({
          [error.response.data.field]: error.response.data.message,
        });
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingSecurity(true);
    setSecuritySuccess("");

    try {
      await makePriorityRequest("put", "/auth/security-settings", {
        securitySettings: {
          twoFactorEnabled,
          loginAlerts,
        },
      });

      setSecuritySuccess("Security settings updated successfully");
      toast.success("Security settings updated");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSecuritySuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error updating security settings:", error);
      toast.error(
        error.response?.data?.message || "Failed to update security settings"
      );
    } finally {
      setIsSubmittingSecurity(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    setLogoutAllLoading(true);
    try {
      await makePriorityRequest("post", "/auth/logout-all");
      toast.success("Successfully logged out of all other sessions");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error logging out all sessions:", error);
      toast.error(
        error.response?.data?.message || "Failed to logout all sessions"
      );
    } finally {
      setLogoutAllLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const result = await deleteAccount();
      
      if (result.success) {
        toast.success("Account deleted successfully");
        // Redirect to home page since user is logged out
        router.push('/');
      } else {
        toast.error(result.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Security Settings
        </h2>
        <p className="text-gray-600 text-sm">
          Manage your account security, password, and authentication methods
        </p>
      </motion.div>

      {/* Password Change Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-white border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-violet-100 rounded-lg">
              <FiKey className="text-violet-600 w-5 h-5" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-800">
              Change Password
            </h3>
          </div>
        </div>

        <AnimatePresence>
          {passwordSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center justify-between border border-green-100"
            >
              <div className="flex items-center">
                <FiCheck className="mr-2 text-green-500" />
                {passwordSuccess}
              </div>
              <button
                onClick={() => setPasswordSuccess("")}
                className="text-green-500 hover:text-green-700"
              >
                <FiX className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2.5 border ${
                    passwordErrors.currentPassword
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-gray-300"
                  } rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1.5 text-sm text-red-600 flex items-start"
                >
                  <FiAlertTriangle className="mr-1.5 flex-shrink-0 mt-0.5" />
                  {passwordErrors.currentPassword}
                </motion.p>
              )}
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2.5 border ${
                    passwordErrors.newPassword
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-gray-300"
                  } rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              
              {/* Password strength meter */}
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-grow flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-grow rounded-full transition-all ${
                            level <= passwordStrength ? getStrengthColor() : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs ml-2 ${
                      passwordStrength <= 2 ? "text-red-600" : 
                      passwordStrength === 3 ? "text-yellow-600" : 
                      "text-green-600"
                    }`}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 flex items-start">
                    <FiInfo className="mr-1.5 mt-0.5 flex-shrink-0" />
                    <span>Use 8+ characters with a mix of letters, numbers & symbols</span>
                  </div>
                </div>
              )}
              
              {passwordErrors.newPassword && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1.5 text-sm text-red-600 flex items-start"
                >
                  <FiAlertTriangle className="mr-1.5 flex-shrink-0 mt-0.5" />
                  {passwordErrors.newPassword}
                </motion.p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2.5 border ${
                    passwordErrors.confirmPassword
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-gray-300"
                  } rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1.5 text-sm text-red-600 flex items-start"
                >
                  <FiAlertTriangle className="mr-1.5 flex-shrink-0 mt-0.5" />
                  {passwordErrors.confirmPassword}
                </motion.p>
              )}
            </div>

            <div className="pt-2">
              <motion.button
                type="submit"
                disabled={isSubmittingPassword}
                className={`px-5 py-2.5 bg-violet-600 text-white rounded-lg shadow-sm hover:bg-violet-700 transition-all flex items-center justify-center ${
                  isSubmittingPassword ? "opacity-70 cursor-not-allowed" : ""
                }`}
                whileHover={{ scale: isSubmittingPassword ? 1 : 1.02 }}
                whileTap={{ scale: isSubmittingPassword ? 1 : 0.98 }}
              >
                {isSubmittingPassword ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  <>
                    <FiKey className="mr-2" />
                    Update Password
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Additional Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-white border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-violet-100 rounded-lg">
              <FiShield className="text-violet-600 w-5 h-5" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-800">
              Security Options
            </h3>
          </div>
        </div>

        <AnimatePresence>
          {securitySuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center justify-between border border-green-100"
            >
              <div className="flex items-center">
                <FiCheck className="mr-2 text-green-500" />
                {securitySuccess}
              </div>
              <button
                onClick={() => setSecuritySuccess("")}
                className="text-green-500 hover:text-green-700"
              >
                <FiX className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6">
          <form onSubmit={handleSecuritySubmit}>
            <div className="divide-y divide-gray-100">
              <div className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <h4 className="text-base font-medium text-gray-800">
                        Two-Factor Authentication
                      </h4>
                      <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-800 text-xs font-medium rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Add an extra layer of security to your account by requiring a verification code
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={twoFactorEnabled}
                      onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      disabled={true}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600 opacity-70"></div>
                  </label>
                </div>

                {twoFactorEnabled && (
                  <div className="mt-4 p-3.5 bg-amber-50 rounded-lg flex items-start border border-amber-200">
                    <FiAlertTriangle className="text-amber-500 mt-0.5 mr-2.5 flex-shrink-0" />
                    <div className="text-sm text-amber-700">
                      <p className="font-medium mb-1">Two-factor authentication setup required</p>
                      <p>After saving your settings, you'll need to complete the setup process by scanning a QR code and verifying your authentication app.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <h4 className="text-base font-medium text-gray-800">
                        Login Alerts
                      </h4>
                      <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-800 text-xs font-medium rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Receive email notifications when your account is accessed from a new device or location
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={loginAlerts}
                      onChange={() => setLoginAlerts(!loginAlerts)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>
                
                {loginAlerts && (
                  <div className="mt-4 p-3.5 bg-blue-50 rounded-lg flex items-start border border-blue-200">
                    <FiInfo className="text-blue-500 mt-0.5 mr-2.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      You'll receive email notifications when someone logs into your account from an unrecognized device or location.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-5">
                <h4 className="text-base font-medium text-gray-800 mb-3">
                  Active Sessions
                </h4>

                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-4">
                  <div className="bg-gradient-to-r from-green-50 to-white p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-base font-medium text-gray-900 flex items-center">
                          <FiMonitor className="mr-2 text-green-600" />
                          Current Session
                        </p>
                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center text-sm text-gray-500">
                          <div className="flex items-center">
                            <FiCalendar className="mr-1.5 text-gray-400" />
                            <span>{new Date().toLocaleString()}</span>
                          </div>
                          <span className="hidden sm:inline mx-2">•</span>
                          <div className="flex items-center mt-0.5 sm:mt-0">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                            <span>{navigator.platform}</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        Active Now
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        This is your current active session
                      </p>
                      <span className="text-xs text-gray-400">Last Login: {user?.lastLogin || "Unknown"}</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleLogoutAllSessions}
                  disabled={logoutAllLoading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {logoutAllLoading ? (
                    <>
                      <FiRefreshCw className="mr-2 animate-spin" />
                      Signing out...
                    </>
                  ) : (
                    <>
                      <FiLock className="mr-2" />
                      Sign out of all other sessions
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100">
              <motion.button
                type="submit"
                disabled={isSubmittingSecurity}
                className={`px-5 py-2.5 bg-violet-600 text-white rounded-lg shadow-sm hover:bg-violet-700 transition-all flex items-center justify-center ${
                  isSubmittingSecurity ? "opacity-70 cursor-not-allowed" : ""
                }`}
                whileHover={{ scale: isSubmittingSecurity ? 1 : 1.02 }}
                whileTap={{ scale: isSubmittingSecurity ? 1 : 0.98 }}
              >
                {isSubmittingSecurity ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    Save Security Settings
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Danger Zone Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white border-b border-red-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiAlertTriangle className="text-red-600 w-5 h-5" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-800">
              Danger Zone
            </h3>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-red-50 rounded-lg border border-red-200 p-4 mb-4">
            <div className="flex items-start">
              <FiAlertTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-base font-medium text-red-800 mb-1">
                  Delete Account
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  Once you delete your account, there is no going back. This action will permanently delete your account and all associated data including products, projects, comments, and preferences.
                </p>
                <ul className="text-sm text-red-600 space-y-1 mb-4">
                  <li>• All your products and projects will be permanently removed</li>
                  <li>• Your comments and interactions will be deleted</li>
                  <li>• Your profile and personal information will be erased</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 hover:border-red-300"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <FiTrash2 className="mr-2" />
            Delete My Account
          </motion.button>
        </div>
      </motion.div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        user={user}
      />
    </div>
  );
};

export default SecuritySettings;
