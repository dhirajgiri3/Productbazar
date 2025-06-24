'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';

function ForgotPasswordForm() {
  const router = useRouter();
  const { forgotPassword, authLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState('request'); // 'request' or 'success'

  const validateForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid';
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
    clearError(); // Clear any previous errors

    const result = await forgotPassword(email);
    if (result.success) {
      setSuccessMessage(result.message || 'If your email is registered, you will receive password reset instructions shortly.');
      setEmail('');
      setStep('success');
    } else {
      // Error is already set in the auth context
      console.error('Forgot password failed:', result.message);
    }
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  // Success view with enhanced design
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto space-y-8">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/10 to-purple-300/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative w-full bg-white/80 backdrop-blur-sm border border-violet-100 rounded-3xl p-8 shadow-2xl shadow-primary/10">
          {/* Success Icon with Animation */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg animate-bounce">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              {/* Floating particles */}
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute -bottom-1 -left-2 w-2 h-2 bg-pink-400 rounded-full animate-ping delay-500"></div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Check Your Email
              </h2>
              <p className="text-gray-600 text-sm">
                We've sent you password reset instructions
              </p>
            </div>

            {/* Enhanced Success Message Card */}
            <div className="w-full space-y-4 bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-2xl border border-violet-200 shadow-inner">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {successMessage}
                </p>
              </div>
              
              <div className="border-t border-violet-200 pt-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2A5 5 0 0011 9H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Next Steps
                </h4>
                <div className="space-y-2">
                  {[
                    { icon: "📧", text: "Check your email inbox (including spam folder)" },
                    { icon: "⏰", text: "Click the reset link within 1 hour" },
                    { icon: "🔄", text: "Didn't receive it? Check if email is registered" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 text-xs text-gray-600">
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-white/60 rounded-lg border border-violet-100">
                  <p className="text-xs text-gray-600">
                    Still no email? 
                    <Link href="/auth/register" className="text-primary hover:text-purple-700 font-medium ml-1 hover:underline">
                      Create a new account
                    </Link>
                    {" "}or try again with a different email.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              <button
                onClick={handleBackToLogin}
                className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Back to Login
              </button>
              <button
                onClick={() => setStep('request')}
                className="w-full py-3 border-2 border-primary/20 text-primary font-medium rounded-2xl hover:bg-primary/5 transition-all duration-200"
              >
                Try Different Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced request form view
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
            Enter your email address and we'll send you secure instructions to reset your password.
          </p>
          <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secure and private - we protect your information</span>
          </div>
        </div>

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
                <p className="text-sm text-red-700 font-medium">Oops! Something went wrong</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Enhanced Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className={`h-5 w-5 transition-colors duration-200 ${
                    formErrors.email ? "text-red-400" : email ? "text-primary" : "text-gray-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="your@email.com"
                className={`w-full pl-12 pr-4 py-4 border-2 transition-all duration-200 ${
                  formErrors.email 
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200" 
                    : "border-violet-200 bg-white focus:border-primary focus:ring-primary/20"
                } rounded-2xl text-sm focus:outline-none focus:ring-4 placeholder-gray-400 shadow-inner`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={authLoading}
              />
              {email && !formErrors.email && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              )}
            </div>
            {formErrors.email && (
              <div className="flex items-center space-x-2 text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-xs font-medium">{formErrors.email}</p>
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
                  Sending secure link...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Send Reset Link
                </span>
              )}
            </button>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Secure</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Instant</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
                <span>Private</span>
              </div>
            </div>
          </div>
        </form>

        {/* Enhanced Footer Links */}
        <div className="mt-8 pt-6 border-t border-violet-100">
          <div className="flex items-center justify-between text-sm">
            <Link
              href="/auth/login"
              className="flex items-center space-x-2 text-primary hover:text-purple-700 transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Login</span>
            </Link>
            <Link
              href="/auth/register"
              className="text-gray-500 hover:text-primary transition-colors duration-200"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;