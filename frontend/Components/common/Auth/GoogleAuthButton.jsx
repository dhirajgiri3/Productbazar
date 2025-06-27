"use client";

import React, { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { oauthHandler } from '@/lib/utils/oauth';

/**
 * Google OAuth Button Component
 * 
 * Features:
 * - Handles both login and signup flows
 * - Loading states with animations
 * - Error handling
 * - Responsive design
 * - Accessibility compliant
 */

const GoogleAuthButton = ({ 
  isLogin = true, 
  size = "default", 
  className = "",
  onError = null,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Size variants
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    default: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  // Icon size variants
  const iconSizes = {
    sm: "w-4 h-4",
    default: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  /**
   * Handle Google OAuth initiation
   * Uses the OAuth handler utility for better state management
   */
  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Clear any previous auth errors from URL
      if (oauthHandler.isOAuthCallback()) {
        oauthHandler.clearOAuthParams();
      }

      // Generate OAuth URL and redirect
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004';
      const type = isLogin ? 'login' : 'register';
      const oauthUrl = oauthHandler.generateOAuthUrl('google', type, baseUrl);

      if (oauthUrl) {
        // Redirect to Google OAuth
        window.location.href = oauthUrl;
      } else {
        throw new Error('Failed to generate OAuth URL');
      }

    } catch (err) {
      console.error('Google OAuth error:', err);
      const errorMessage = oauthHandler.getErrorMessage('oauth_error');
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <motion.button
        onClick={handleGoogleAuth}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles
          "w-full relative flex items-center justify-center gap-3 font-medium rounded-xl",
          "border-2 border-gray-200 bg-white text-gray-700",
          "transition-all duration-200 ease-in-out",
          "hover:border-gray-300 hover:bg-gray-50",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "group",
          
          // Size classes
          sizeClasses[size],
          
          // Custom classes
          className
        )}
        whileHover={{ 
          scale: disabled || isLoading ? 1 : 1.02,
          transition: { duration: 0.2 }
        }}
        whileTap={{ 
          scale: disabled || isLoading ? 1 : 0.98,
          transition: { duration: 0.1 }
        }}
        aria-label={`${isLogin ? 'Sign in' : 'Sign up'} with Google`}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Google Icon */}
        <motion.div
          className={cn(
            "flex items-center justify-center",
            iconSizes[size]
          )}
          animate={isLoading ? { rotate: 0 } : { rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FaGoogle 
            className={cn(
              "text-red-500 group-hover:text-red-600 transition-colors duration-200",
              iconSizes[size]
            )}
          />
        </motion.div>

        {/* Button text */}
        <span className="flex-1 text-center font-medium">
          {isLoading 
            ? 'Connecting...' 
            : `${isLogin ? 'Sign in' : 'Sign up'} with Google`
          }
        </span>

        {/* Visual indicator for hover state */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/0 via-violet-500/0 to-violet-500/0 group-hover:from-violet-500/5 group-hover:via-violet-500/10 group-hover:to-violet-500/5 transition-all duration-300" />
      </motion.button>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default GoogleAuthButton;
