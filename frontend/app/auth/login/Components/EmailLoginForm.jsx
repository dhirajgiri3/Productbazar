'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import Link from 'next/link';
import SocialDivider from 'Components/common/Auth/SocialDivider';
import GoogleAuthButton from 'Components/common/Auth/GoogleAuthButton';

const EmailLoginForm = ({ onSubmit, isLoading, onToggleMethod }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    // Update form data when input changes
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email address is invalid';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length === 0) {
      onSubmit({
        email: formData.email,
        password: formData.password,
      });
    } else {
      setFormErrors(errors);
    }
  };

  // Animation variants
  const inputVariants = {
    focused: {
      scale: 1.01,
      boxShadow: '0 0 0 2px rgba(124, 58, 237, 0.3)',
      borderColor: 'rgba(124, 58, 237, 0.8)',
    },
    error: {
      scale: 1.01,
      boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)',
      borderColor: 'rgba(239, 68, 68, 0.8)',
    },
    normal: {
      scale: 1,
      boxShadow: 'none',
      borderColor: 'rgba(229, 231, 235, 1)',
    },
  };

  const formControlVariants = {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500"
      >
        <svg
          className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>{error}</span>
      </motion.div>
    );
  };

  return (
    <motion.form
      className="space-y-5 w-full mx-auto"
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email Address
        </label>
        <div className="relative group">
          <motion.input
            type="email"
            id="email"
            name="email"
            placeholder="your@email.com"
            className={`w-full px-4 py-3 pl-11 border rounded-xl text-sm text-gray-800 transition-all duration-300 ${
              formErrors.email
                ? 'border-red-300 ring-red-100 bg-red-50/30'
                : 'border-gray-200 group-hover:border-violet-300 bg-white/60'
            }`}
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            variants={inputVariants}
            animate={formErrors.email ? 'error' : activeField === 'email' ? 'focused' : 'normal'}
            onFocus={() => setActiveField('email')}
            onBlur={() => setActiveField(null)}
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
            <HiOutlineMail
              className={`text-lg transition-colors duration-300 ${
                formErrors.email ? 'text-red-400' : 'text-gray-400 group-hover:text-violet-500'
              }`}
            />
          </div>
        </div>
        <ErrorMessage error={formErrors.email} />
      </motion.div>

      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
        className="mt-5"
      >
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-violet-600 hover:text-violet-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative group">
          <motion.input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            placeholder="••••••••"
            className={`w-full px-4 py-3 pl-11 pr-10 border rounded-xl text-sm text-gray-800 transition-all duration-300 ${
              formErrors.password
                ? 'border-red-300 ring-red-100 bg-red-50/30'
                : 'border-gray-200 group-hover:border-violet-300 bg-white/60'
            }`}
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            variants={inputVariants}
            animate={
              formErrors.password ? 'error' : activeField === 'password' ? 'focused' : 'normal'
            }
            onFocus={() => setActiveField('password')}
            onBlur={() => setActiveField(null)}
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
            <HiOutlineLockClosed
              className={`text-lg transition-colors duration-300 ${
                formErrors.password ? 'text-red-400' : 'text-gray-400 group-hover:text-violet-500'
              }`}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-600 transition-colors"
          >
            {showPassword ? (
              <FaEyeSlash className="text-base opacity-70 hover:opacity-100" />
            ) : (
              <FaEye className="text-base opacity-70 hover:opacity-100" />
            )}
          </button>
        </div>
        <ErrorMessage error={formErrors.password} />
      </motion.div>

      <motion.button
        type="submit"
        className="w-full py-3.5 mt-5 bg-gradient-to-br from-violet-600 to-violet-700 text-white font-medium rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:shadow-none disabled:from-violet-400 disabled:to-violet-500"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white"
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
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </motion.button>

      <motion.button
        type="button"
        onClick={onToggleMethod}
        className="w-full py-2.5 mt-2 text-sm text-gray-600 hover:text-violet-700 transition-colors text-center"
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.01 }}
      >
        Sign in with phone number instead
      </motion.button>

      {/* Social Divider */}
      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.5 }}
      >
        <SocialDivider text="Or sign in with" />
      </motion.div>

      <motion.div
        variants={formControlVariants}
        initial="initial" 
        animate="animate"
        transition={{ delay: 0.6 }}
      >
        <GoogleAuthButton isLogin={true} isLoading={isLoading} size="default" />
      </motion.div>
    </motion.form>
  );
};

export default EmailLoginForm;
