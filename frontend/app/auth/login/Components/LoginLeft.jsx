"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineArrowLeft,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import { useAuth } from "@/lib/contexts/auth-context";
import EmailLoginForm from './EmailLoginForm';
import { debounce } from "lodash"; // For performance optimization

const LoginLeft = () => {
  // Auth context for login methods and state
  const {
    requestOtp,
    verifyOtpForLogin,
    authLoading,
    error,
    loginWithEmail,
    clearError
  } = useAuth();

  // Component state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(120);
  const [formErrors, setFormErrors] = useState({});
  const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'

  // Clear context errors when component unmounts or method changes
  useEffect(() => {
    return () => {
      if (clearError) clearError();
    }
  }, [clearError, authMethod]);

  // Clear errors when changing auth method
  useEffect(() => {
    if (clearError) clearError();
    setFormErrors({});
  }, [authMethod, clearError]);

  // OTP countdown timer
  useEffect(() => {
    if (!isOtpSent || otpCountdown <= 0) return;

    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOtpSent, otpCountdown]);

  // Handle Google login error messages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const errorMsg = params.get('error');

      if (errorMsg) {
        const errorMessages = {
          'google_auth_failed': 'Google authentication failed. Please try again.',
          'no_user': 'Unable to retrieve user information from Google.',
          'internal_error': 'An internal error occurred. Please try again.',
        };

        setFormErrors(prev => ({
          ...prev,
          google: errorMessages[errorMsg] || 'Authentication failed. Please try again.'
        }));

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Function to handle requesting OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setFormErrors({});
    if (clearError) clearError();

    // Phone validation with international format support
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      setFormErrors({ phone: "Invalid phone number (e.g., +1234567890)" });
      return;
    }

    try {
      // Use requestOtp with 'login' type instead of loginWithPhone
      const success = await requestOtp(phone, 'login');
      if (success && success.success) {
        setIsOtpSent(true);
        setOtpCountdown(120);
      }
    } catch (error) {
      console.error("OTP request failed:", error);
    }
  };

  // Function to handle verifying OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFormErrors({ phone: "", otp: "", google: "" });
    if (clearError) clearError();

    // OTP validation - ensure it's 4-6 digits only
    if (!/^\d{4,6}$/.test(otp)) {
      setFormErrors({ otp: "OTP must be 4-6 digits" });
      return;
    }

    await verifyOtpForLogin(phone, otp);
    // Redirect is now handled in verifyOtpForLogin via handleAuthSuccess
  };

  // Function to handle resending OTP
  const resendOtp = async () => {
    try {
      if (clearError) clearError();
      const success = await requestOtp(phone, 'login');
      if (success && success.success) setOtpCountdown(120);
    } catch (error) {
      console.error("Resend OTP failed:", error);
    }
  };

  // Debounced resend OTP to prevent spam
  const debouncedResendOtp = debounce(resendOtp, 300);

  // Handle email login
  const handleEmailLogin = async (credentials) => {
    await loginWithEmail(credentials);
    // Redirect is handled in AuthContext
  };

  // Toggle between auth methods
  const toggleAuthMethod = (method) => {
    if (method === authMethod) return;

    setAuthMethod(method);
    if (isOtpSent) setIsOtpSent(false);
    setFormErrors({});
    if (clearError) clearError();
  };

  // Phone number input change handler with validation
  const handlePhoneChange = (e) => {
    // Allow only numbers, plus sign, and limit length
    const value = e.target.value;
    // Only set phone if it's a valid format (empty, or starts with + followed by numbers)
    if (value === "" || /^\+?\d*$/.test(value)) {
      setPhone(value);

      // Clear error when user starts correcting input
      if (formErrors.phone) {
        setFormErrors((prev) => ({ ...prev, phone: undefined }));
      }
    }
  };

  // OTP input change handler with validation
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(value);

    // Clear error when user starts correcting input
    if (formErrors.otp) {
      setFormErrors((prev) => ({ ...prev, otp: undefined }));
    }
  };

  // Animation variants for consistent animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.12,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.4 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  const tabVariants = {
    inactive: {
      backgroundColor: "rgb(243 244 246)",
      color: "rgb(75 85 99)",
      boxShadow: "none",
    },
    active: {
      backgroundColor: "rgb(124 58 237)",
      color: "white",
      boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="relative h-full w-full rounded-2xl bg-white/95 backdrop-blur-md border border-white/20 shadow-xl p-6 sm:p-8 overflow-hidden">
        {/* Decorative elements with improved blur effect */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-100 rounded-full opacity-30 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full opacity-30 blur-3xl pointer-events-none"></div>

        {/* Glass card effect */}
        <div className="absolute inset-0 rounded-2xl bg-white/40 backdrop-blur-xl -z-10"></div>

        <div className="relative z-10">
          {/* Header section with pulsing logo effect */}
          <motion.div
            className="text-center mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >

            <motion.h2
              variants={itemVariants}
              className="text-2xl font-bold bg-gradient-to-br from-violet-700 to-indigo-600 bg-clip-text text-transparent tracking-tight"
            >
              Welcome Back
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-gray-600 text-sm mt-2.5"
            >
              Sign in to continue to your account
            </motion.p>

            {/* Error message display with improved animation */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 mt-5 mb-1 text-xs text-red-700 bg-red-50 rounded-xl border border-red-100 flex items-center"
              >
                <svg
                  className="w-4 h-4 text-red-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="font-medium">{error}</span>
                {error.includes("no password") && (
                  <button
                    type="button"
                    className="ml-2 text-violet-600 font-medium underline"
                    onClick={() => toggleAuthMethod("phone")}
                  >
                    Switch to phone login
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Improved tab animations with consistent spacing */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex p-1.5 bg-gray-100 rounded-xl w-full shadow-sm">
              <motion.button
                type="button"
                role="tab"
                id="email-tab"
                aria-selected={authMethod === "email"}
                aria-controls="email-panel"
                tabIndex={authMethod === "email" ? 0 : -1}
                variants={tabVariants}
                initial={authMethod === "email" ? "active" : "inactive"}
                animate={authMethod === "email" ? "active" : "inactive"}
                whileHover={{ scale: authMethod !== "email" ? 1.02 : 1 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 flex-1"
                onClick={() => toggleAuthMethod("email")}
              >
                <HiOutlineMail className="text-lg" aria-hidden="true" />
                <span>Email</span>
              </motion.button>
              <motion.button
                type="button"
                role="tab"
                id="phone-tab"
                aria-selected={authMethod === "phone"}
                aria-controls="phone-panel"
                tabIndex={authMethod === "phone" ? 0 : -1}
                variants={tabVariants}
                initial={authMethod === "phone" ? "active" : "inactive"}
                animate={authMethod === "phone" ? "active" : "inactive"}
                whileHover={{ scale: authMethod !== "phone" ? 1.02 : 1 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 flex-1"
                onClick={() => toggleAuthMethod("phone")}
              >
                <HiOutlinePhone className="text-lg" />
                <span>Phone</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Form section with enhanced transitions and optimized height */}
          <div className="relative w-full h-full">
            <AnimatePresence mode="wait">
              {authMethod === "email" ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  role="tabpanel"
                  id="email-panel"
                  aria-labelledby="email-tab"
                  className="w-full"
                >
                  <EmailLoginForm
                    onSubmit={handleEmailLogin}
                    isLoading={authLoading}
                    onToggleMethod={() => toggleAuthMethod("phone")}
                  />
                </motion.div>
              ) : !isOtpSent ? (
                <motion.form
                  key="phoneInput"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-6 w-full"
                  onSubmit={handleRequestOtp}
                  role="tabpanel"
                  id="phone-panel"
                  aria-labelledby="phone-tab"
                >
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Phone Number
                    </label>
                    <div className="relative group">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="+1234567890"
                        className={`w-full px-4 py-3.5 pl-12 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-300 ${
                          formErrors.phone
                            ? "border-red-300 ring-red-100 bg-red-50/30"
                            : "border-gray-200 group-hover:border-violet-300 bg-white/60"
                        }`}
                        value={phone}
                        onChange={handlePhoneChange}
                        disabled={authLoading}
                        aria-invalid={!!formErrors.phone}
                        aria-describedby={
                          formErrors.phone ? "phone-error" : undefined
                        }
                      />
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
                        <HiOutlinePhone className={`text-lg transition-colors duration-300 ${
                          formErrors.phone ? "text-red-400" : "text-gray-400 group-hover:text-violet-500"
                        }`} />
                      </div>
                    </div>
                    {formErrors.phone && (
                      <motion.p
                        id="phone-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2.5 text-xs text-red-500 flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                        {formErrors.phone}
                      </motion.p>
                    )}
                  </div>

                  {/* Phone format guidance with improved visual */}
                  <div className="flex items-center space-x-2.5 py-2.5 px-4 bg-amber-50/50 rounded-lg border border-amber-100/50">
                    <HiOutlineLightningBolt className="text-amber-500 flex-shrink-0" />
                    <span className="text-xs text-amber-700">
                      Enter number with country code (e.g., +1 for US)
                    </span>
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-br from-violet-600 to-violet-700 text-white font-medium rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all duration-300 shadow-md hover:shadow-xl disabled:opacity-70 disabled:shadow-none disabled:from-violet-400 disabled:to-violet-500 mt-8"
                    disabled={authLoading}
                    whileHover={{ scale: authLoading ? 1 : 1.02 }}
                    whileTap={{ scale: authLoading ? 1 : 0.98 }}
                  >
                    {authLoading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending OTP...
                      </span>
                    ) : (
                      "Request Verification Code"
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="otpInput"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-6 w-full"
                  onSubmit={handleVerifyOtp}
                >
                  <motion.button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="flex items-center text-sm text-violet-600 hover:text-violet-800 transition-colors mb-3 font-medium"
                    whileHover={{ x: -3 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <HiOutlineArrowLeft className="mr-1.5" /> Back to phone entry
                  </motion.button>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label
                        htmlFor="otp"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Verification Code
                      </label>
                      <span className="text-xs text-gray-500 font-medium">
                        Sent to {phone}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric" // Better mobile keyboard for numbers
                        id="otp"
                        name="otp"
                        placeholder="••••••"
                        className={`w-full px-5 py-4 border rounded-xl text-base text-center tracking-widest font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-300 ${
                          formErrors.otp
                            ? "border-red-300 ring-red-100 bg-red-50/30"
                            : "border-gray-200 bg-white/60"
                        }`}
                        value={otp}
                        onChange={handleOtpChange}
                        disabled={authLoading}
                        maxLength={6}
                        aria-invalid={!!formErrors.otp}
                        aria-describedby={
                          formErrors.otp ? "otp-error" : undefined
                        }
                      />

                      {/* OTP countdown progress indicator with improved animation */}
                      <motion.div
                        className="absolute -top-2 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        initial={{ width: "100%" }}
                        animate={{
                          width: `${Math.max((otpCountdown / 120) * 100, 0)}%`,
                        }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <div className="text-xs text-gray-500">
                        {otpCountdown > 0 && (
                          <span>
                            Code expires in{" "}
                            <span className="font-medium text-violet-600">
                              {otpCountdown}s
                            </span>
                          </span>
                        )}
                        {otpCountdown <= 0 && (
                          <span className="text-red-500">Code expired</span>
                        )}
                      </div>

                      <motion.button
                        type="button"
                        className={`text-xs text-violet-600 font-medium hover:text-violet-800 flex items-center gap-1.5 transition-all ${
                          otpCountdown > 0 || authLoading
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={debouncedResendOtp}
                        disabled={otpCountdown > 0 || authLoading}
                        whileHover={{
                          scale: otpCountdown > 0 || authLoading ? 1 : 1.05,
                        }}
                      >
                        {otpCountdown > 0 ? "Resend soon" : "Resend Code"}
                      </motion.button>
                    </div>

                    {formErrors.otp && (
                      <motion.p
                        id="otp-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 text-xs text-red-500 flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                        {formErrors.otp}
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-br from-violet-600 to-violet-700 text-white font-medium rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all duration-300 shadow-md hover:shadow-xl disabled:opacity-70 disabled:shadow-none disabled:from-violet-400 disabled:to-violet-500 mt-6"
                    disabled={authLoading}
                    whileHover={{ scale: authLoading ? 1 : 1.02 }}
                    whileTap={{ scale: authLoading ? 1 : 0.98 }}
                  >
                    {authLoading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Footer section with improved spacing */}
          <motion.div
            className="mt-6 text-center space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="text-sm text-gray-600 flex justify-center items-center space-x-1.5"
            >
              <span>Don't have an account?</span>
              <Link
                href="/auth/register"
                className="text-violet-600 hover:text-violet-800 font-medium transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-sm"
              >
                Register
              </Link>
            </motion.div>              <motion.div
              variants={itemVariants}
              className="flex justify-center"
            >
              <Link
                href="/auth/forgot-password"
                className="text-sm text-violet-600 hover:text-violet-800 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-sm"
              >
                Forgot your password?
              </Link>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-xs text-gray-500 mt-4 px-4"
            >
              By signing in, you agree to our{" "}
              <Link
                href="/terms"
                className="text-violet-600 hover:text-violet-800 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-sm"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-violet-600 hover:text-violet-800 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-sm"
              >
                Privacy Policy
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginLeft;
