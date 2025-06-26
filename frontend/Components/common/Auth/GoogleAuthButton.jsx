"use client";

import { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const GoogleAuthButton = ({ 
  text = "Continue with Google",
  variant = "primary", // primary, secondary, outline
  size = "md", // sm, md, lg
  disabled = false,
  loading = false,
  className = "",
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (disabled || loading) return;
    
    if (onClick) {
      onClick();
    } else {
      // Default behavior - redirect to Google OAuth
      const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5004/api/v1'}/auth/google`;
      window.location.href = googleAuthUrl;
    }
  };

  // Size variants
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  // Variant styles
  const variantClasses = {
    primary: "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md",
    secondary: "bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100 hover:border-gray-300",
    outline: "bg-transparent text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
  };

  const baseClasses = `
    relative
    inline-flex
    items-center
    justify-center
    font-medium
    rounded-lg
    transition-all
    duration-200
    ease-in-out
    focus:outline-none
    focus:ring-2
    focus:ring-purple-500
    focus:ring-opacity-50
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  return (
    <motion.button
      type="button"
      className={baseClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      aria-label={text}
    >
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Button content */}
      <div className={`flex items-center space-x-3 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <motion.div
          animate={{
            rotate: isHovered && !disabled && !loading ? 360 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <FaGoogle 
            className="text-red-500" 
            size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
          />
        </motion.div>
        <span className="font-medium">{text}</span>
      </div>

      {/* Hover effect background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg opacity-0"
        animate={{
          opacity: isHovered && !disabled && !loading ? 0.1 : 0
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
};

export default GoogleAuthButton;
