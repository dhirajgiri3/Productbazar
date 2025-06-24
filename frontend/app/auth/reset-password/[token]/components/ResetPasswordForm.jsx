"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";

function ResetPasswordForm({ token }) {
  const router = useRouter();
  const { resetPassword, authLoading, error } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const validateForm = () => {
    const errors = {};

    // Password validation
    if (!password) {
      errors.password = "Password is required";
    }
    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    const result = await resetPassword(password, token);
    if (result.success) {
      setSuccessMessage(result.message || "Your password has been reset successfully.");
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } else {
      // Error is already set in the auth context, but we can also handle it locally if needed
      console.error('Reset password failed:', result.message);
    }
  };

  const renderPasswordStrengthIndicator = () => {
    if (!password) return null;

    let strength = 0;
    const indicators = [
      { regex: /.{8,}/, text: "Length (8+ chars)", icon: "📏" },
      { regex: /[A-Z]/, text: "Uppercase", icon: "🔤" },
      { regex: /[a-z]/, text: "Lowercase", icon: "🔡" },
      { regex: /[0-9]/, text: "Number", icon: "🔢" },
      { regex: /[^A-Za-z0-9]/, text: "Special char", icon: "🔣" },
    ];

    const checks = indicators.map((item) => {
      const valid = item.regex.test(password);
      if (valid) strength++;
      return { ...item, valid };
    });

    const strengthPercentage = (strength / indicators.length) * 100;
    let strengthClass = "from-red-400 to-red-500";
    let strengthText = "Weak";
    let strengthTextColor = "text-red-600";
    
    if (strengthPercentage >= 40) {
      strengthClass = "from-yellow-400 to-orange-500";
      strengthText = "Fair";
      strengthTextColor = "text-yellow-600";
    }
    if (strengthPercentage >= 60) {
      strengthClass = "from-blue-400 to-blue-500";
      strengthText = "Good";
      strengthTextColor = "text-blue-600";
    }
    if (strengthPercentage >= 80) {
      strengthClass = "from-green-400 to-emerald-500";
      strengthText = "Strong";
      strengthTextColor = "text-green-600";
    }
    if (strengthPercentage === 100) {
      strengthClass = "from-emerald-500 to-green-600";
      strengthText = "Excellent";
      strengthTextColor = "text-emerald-600";
    }

    return (
      <div className="mt-3 space-y-3">
        {/* Strength Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Password Strength</span>
            <span className={`text-xs font-bold ${strengthTextColor}`}>{strengthText}</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-2 bg-gradient-to-r ${strengthClass} rounded-full transition-all duration-500 ease-out shadow-sm`}
              style={{ width: `${strengthPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Requirements */}
        <div className="grid grid-cols-2 gap-2">
          {checks.map((check, i) => (
            <div
              key={i}
              className={`flex items-center space-x-2 text-xs px-3 py-2 rounded-xl transition-all duration-200 ${
                check.valid
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                  : "bg-gray-50 text-gray-500 border border-gray-200"
              }`}
            >
              <span className="text-sm">{check.icon}</span>
              <span className="font-medium">{check.text}</span>
              {check.valid && (
                <svg className="w-3 h-3 ml-auto text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto space-y-8">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/10 to-purple-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full bg-white/80 backdrop-blur-sm border border-violet-100 rounded-3xl p-8 shadow-2xl shadow-primary/10">
        {/* Header with Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
            Create New Password
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Choose a strong password to secure your account
          </p>
          <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Your password will be encrypted and stored securely</span>
          </div>
        </div>

        {/* Enhanced Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-inner">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Password Reset Successful!</p>
                <p className="text-xs text-green-600 mt-1">{successMessage}</p>
                <p className="text-xs text-green-600 mt-2">Redirecting to login page...</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-inner">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-red-700 font-medium">Unable to reset password</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Enhanced Password Input */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700"
            >
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className={`h-5 w-5 transition-colors duration-200 ${
                    formErrors.password ? "text-red-400" : password ? "text-primary" : "text-gray-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••••••"
                className={`w-full pl-12 pr-4 py-4 border-2 transition-all duration-200 ${
                  formErrors.password 
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200" 
                    : "border-violet-200 bg-white focus:border-primary focus:ring-primary/20"
                } rounded-2xl text-sm focus:outline-none focus:ring-4 placeholder-gray-400 shadow-inner`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={authLoading}
              />
            </div>
            {renderPasswordStrengthIndicator()}
            {formErrors.password && (
              <div className="flex items-center space-x-2 text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-xs font-medium">{formErrors.password}</p>
              </div>
            )}
          </div>

          {/* Enhanced Confirm Password Input */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-gray-700"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className={`h-5 w-5 transition-colors duration-200 ${
                    formErrors.confirmPassword 
                      ? "text-red-400" 
                      : confirmPassword && password === confirmPassword 
                        ? "text-green-500" 
                        : "text-gray-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••••••"
                className={`w-full pl-12 pr-4 py-4 border-2 transition-all duration-200 ${
                  formErrors.confirmPassword 
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200" 
                    : confirmPassword && password === confirmPassword
                      ? "border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-200"
                      : "border-violet-200 bg-white focus:border-primary focus:ring-primary/20"
                } rounded-2xl text-sm focus:outline-none focus:ring-4 placeholder-gray-400 shadow-inner`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={authLoading}
              />
              {confirmPassword && password === confirmPassword && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            {confirmPassword && password === confirmPassword && (
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-xs font-medium">Passwords match!</p>
              </div>
            )}
            {formErrors.confirmPassword && (
              <div className="flex items-center space-x-2 text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-xs font-medium">{formErrors.confirmPassword}</p>
              </div>
            )}
          </div>

          {/* Enhanced Submit Button */}
          <div className="space-y-4">
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-primary to-purple-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:from-gray-400 disabled:to-gray-500 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed"
              disabled={authLoading}
            >
              {authLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3 text-white"
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
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  Securing your account...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update Password
                </span>
              )}
            </button>

            {/* Security Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>After updating your password, you'll be logged out of all devices for security. Please log in again with your new password.</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Enhanced Footer */}
        <div className="mt-8 pt-6 border-t border-violet-100">
          <div className="flex justify-center">
            <Link
              href="/auth/login"
              className="flex items-center space-x-2 text-primary hover:text-purple-700 transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordForm;
