"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { oauthHandler } from '@/lib/utils/oauth';
import Image from 'next/image';

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
    sm: "px-4 py-2.5 text-sm h-10",
    default: "px-6 py-3 text-base h-12",
    lg: "px-8 py-4 text-lg h-14"
  };

  // Icon size variants
  const iconSizes = {
    sm: "w-4 h-4",
    default: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  // Image dimensions for Next.js Image component
  const imageDimensions = {
    sm: { width: 16, height: 16 },
    default: { width: 20, height: 20 },
    lg: { width: 24, height: 24 }
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
          // Base styles - Minimalistic design
          "w-full relative flex items-center justify-center gap-3 font-medium rounded-lg",
          "border border-gray-200 bg-white text-gray-700 shadow-sm",
          "transition-all duration-300 ease-out",
          "hover:border-gray-300 hover:shadow-md hover:bg-gray-50/50",
          "focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:ring-offset-1 focus:border-violet-300",
          "active:scale-[0.98] active:shadow-sm",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:bg-white",
          "group overflow-hidden backdrop-blur-sm",
          
          // Size classes
          sizeClasses[size],
          
          // Custom classes
          className
        )}
        whileHover={{ 
          y: disabled || isLoading ? 0 : -1,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        whileTap={{ 
          scale: disabled || isLoading ? 1 : 0.98,
          transition: { duration: 0.1 }
        }}
        aria-label={`${isLogin ? 'Sign in' : 'Sign up'} with Google`}
      >
        {/* Loading overlay with improved animation */}
        {isLoading && (
          <motion.div 
            className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600 font-medium">Connecting...</span>
            </div>
          </motion.div>
        )}

        {/* Google Logo */}
        <motion.div
          className={cn(
            "flex items-center justify-center flex-shrink-0",
            iconSizes[size]
          )}
          animate={isLoading ? { scale: 0.9, opacity: 0.5 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Image
            src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp"
            alt="Google"
            width={imageDimensions[size].width}
            height={imageDimensions[size].height}
            className={cn(
              "object-contain transition-all duration-200",
              iconSizes[size],
              "group-hover:scale-105 filter drop-shadow-sm"
            )}
            priority
            unoptimized
          />
        </motion.div>

        {/* Button text with improved typography */}
        <span className="flex-1 text-center font-medium tracking-wide select-none">
          {isLoading 
            ? '' 
            : `${isLogin ? 'Continue' : 'Sign up'} with Google`
          }
        </span>

        {/* Subtle hover effect with improved gradient */}
        <motion.div 
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "linear-gradient(90deg, rgba(139, 69, 224, 0.02), rgba(139, 69, 224, 0.05), rgba(139, 69, 224, 0.02))"
          }}
        />
      </motion.button>

      {/* Enhanced error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mt-3 text-sm text-red-600 bg-red-50/80 border border-red-200/50 rounded-lg p-3 backdrop-blur-sm"
        >
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            </div>
            <span className="leading-relaxed">{error}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GoogleAuthButton;
