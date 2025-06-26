"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '@/lib/contexts/auth-context';
import dotEnv from 'dotenv';
dotEnv.config(); // Load environment variables

const GoogleAuthButton = ({ 
  isLogin = true, 
  isLoading = false, 
  className = "",
  size = "default", // "default", "large", "small"
  onSuccess,
  onError,
  showEmailVerificationReminder = true
}) => {
  const { error, clearError } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGoogleAuth = () => {
    if (isLoading || isProcessing) return;
    
    setIsProcessing(true);
    clearError();
    
    try {
      // Store callback handlers in sessionStorage for OAuth callback
      if (onSuccess) {
        sessionStorage.setItem('oauth_success_callback', 'google_auth_success');
      }
      if (onError) {
        sessionStorage.setItem('oauth_error_callback', 'google_auth_error');
      }

      // Store current page for redirect after auth
      sessionStorage.setItem('oauth_redirect_url', window.location.pathname);
      
      // Redirect to Google OAuth endpoint
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004';
      window.location.href = `${backendUrl}/api/v1/auth/google?mode=${isLogin ? 'login' : 'register'}`;
    } catch (err) {
      console.error('Error initiating Google auth:', err);
      setIsProcessing(false);
      if (onError) {
        onError(err);
      }
    }
  };

  // Size variants
  const sizeClasses = {
    small: "py-2 px-3 text-sm",
    default: "py-3 px-4 text-base",
    large: "py-3.5 px-5 text-lg"
  };

  const iconSizes = {
    small: 14,
    default: 16,
    large: 18
  };

  // Handle OAuth callback effects
  React.useEffect(() => {
    // Listen for OAuth completion events
    const handleOAuthSuccess = (event) => {
      if (event.data.type === 'OAUTH_SUCCESS' && onSuccess) {
        onSuccess(event.data.user);
      }
    };

    const handleOAuthError = (event) => {
      if (event.data.type === 'OAUTH_ERROR' && onError) {
        onError(event.data.error);
      }
    };

    window.addEventListener('message', handleOAuthSuccess);
    window.addEventListener('message', handleOAuthError);

    return () => {
      window.removeEventListener('message', handleOAuthSuccess);
      window.removeEventListener('message', handleOAuthError);
    };
  }, [onSuccess, onError]);

  const currentlyLoading = isLoading || isProcessing;

  return (
    <motion.button
      type="button"
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={`
        w-full flex items-center justify-center gap-3 
        ${sizeClasses[size]}
        bg-white border border-gray-300 rounded-xl
        text-gray-700 font-medium
        hover:bg-gray-50 hover:border-gray-400
        focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-300
        shadow-sm hover:shadow-md
        ${className}
      `}
      whileHover={!isLoading ? { scale: 1.02 } : {}}
      whileTap={!isLoading ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8v8H4z" 
            />
          </svg>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <FaGoogle 
            size={iconSizes[size]} 
            className="text-[#4285F4] flex-shrink-0" 
          />
          <span className="text-gray-700">
            {isLogin ? "Continue with Google" : "Sign up with Google"}
          </span>
        </>
      )}
    </motion.button>
  );
};

export default GoogleAuthButton;
