'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import ResetPasswordForm from './components/ResetPasswordForm';

function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();
  const { verifyPasswordResetToken, authLoading } = useAuth();
  const [tokenStatus, setTokenStatus] = useState('verifying'); // 'verifying', 'valid', 'invalid'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenStatus('invalid');
        setErrorMessage('No reset token provided');
        return;
      }

      const result = await verifyPasswordResetToken(token);
      if (result.success && result.valid) {
        setTokenStatus('valid');
      } else {
        setTokenStatus('invalid');
        setErrorMessage(result.message || 'Invalid or expired reset token');
      }
    };

    verifyToken();
  }, [token, verifyPasswordResetToken]);

  if (tokenStatus === 'verifying' || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 to-purple-50">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/10 to-purple-300/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative text-center">
          <div className="bg-white/80 backdrop-blur-sm border border-violet-100 rounded-3xl p-8 shadow-2xl shadow-primary/10">
            {/* Animated Loading Icon */}
            <div className="relative mx-auto w-16 h-16 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-full animate-spin"></div>
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>

            <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
              Verifying Reset Token
            </h3>
            <p className="text-gray-600 text-sm">
              Please wait while we validate your password reset link...
            </p>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 to-purple-50">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-200/20 to-red-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative text-center max-w-lg mx-auto p-8">
          <div className="bg-white/80 backdrop-blur-sm border border-red-100 rounded-3xl p-8 shadow-2xl shadow-red-500/10">
            {/* Animated Error Icon */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-500 rounded-full animate-pulse"></div>
              <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-pink-500 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-white animate-bounce"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              {/* Floating particles */}
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-orange-400 rounded-full animate-ping"></div>
              <div className="absolute -bottom-1 -left-2 w-2 h-2 bg-red-400 rounded-full animate-ping delay-500"></div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent mb-3">
              Invalid Reset Link
            </h2>
            
            {/* Error Message */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm text-red-700 font-medium">Reset Link Issue</p>
                  <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                </div>
              </div>
            </div>

            {/* Helpful Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-6 text-left">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                What happened?
              </h4>
              <div className="space-y-2 text-xs text-blue-700">
                {[
                  { icon: "⏰", text: "Your reset link may have expired (valid for 1 hour)" },
                  { icon: "🔗", text: "The link may have been used already" },
                  { icon: "✉️", text: "The link might be incomplete or corrupted" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth/forgot-password')}
                className="w-full py-4 bg-gradient-to-r from-primary to-purple-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Get New Reset Link
                </span>
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full py-4 border-2 border-primary/20 text-primary font-medium rounded-2xl hover:bg-primary/5 transition-all duration-200"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Login
                </span>
              </button>
            </div>

            {/* Help Link */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Still having trouble? 
                <Link href="/contact" className="text-primary hover:text-purple-700 font-medium ml-1 hover:underline">
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-50 to-purple-50">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-8 w-full">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}

export default ResetPasswordPage;
