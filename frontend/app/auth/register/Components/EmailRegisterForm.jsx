"use client";

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi";
import Link from 'next/link';
import GoogleAuthButton from '@/Components/common/Auth/GoogleAuthButton';
import SocialDivider from '@/Components/common/Auth/SocialDivider';
import RoleFields from './RoleFields';

const EmailRegisterForm = ({ 
  onSubmit, 
  isLoading, 
  onToggleMethod,
  role,
  setRole,
  roleDetails,
  setRoleDetails
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeField, setActiveField] = useState(null);

  // Role options consistent with backend
  const roleOptions = [
    { value: "user", label: "General User", description: "Browse and discover products" },
    { value: "startupOwner", label: "Startup Owner", description: "Showcase your startup and products" },
    { value: "investor", label: "Investor", description: "Discover investment opportunities" },
    { value: "agency", label: "Agency", description: "Offer your agency services" },
    { value: "freelancer", label: "Freelancer", description: "Showcase your skills and find work" },
    { value: "jobseeker", label: "Job Seeker", description: "Find your next opportunity" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setRoleDetails({}); // Reset role details when role changes
  };

  const updateRoleDetails = (field, value) => {
    setRoleDetails(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email address is invalid';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length === 0) {
      onSubmit({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: role,
        roleDetails: role !== 'user' ? roleDetails : {}
      });
    } else {
      setFormErrors(errors);
    }
  };

  // Animation variants
  const inputVariants = {
    focused: {
      scale: 1.01,
      boxShadow: "0 0 0 2px rgba(124, 58, 237, 0.3)",
      borderColor: "rgba(124, 58, 237, 0.8)"
    },
    error: {
      scale: 1.01,
      boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.2)",
      borderColor: "rgba(239, 68, 68, 0.8)"
    },
    normal: {
      scale: 1,
      boxShadow: "none",
      borderColor: "rgba(229, 231, 235, 1)"
    }
  };

  const formControlVariants = {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500"
      >
        <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>{error}</span>
      </motion.div>
    );
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Google Authentication Button - First */}
      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        <GoogleAuthButton 
          isLogin={false} 
          isLoading={isLoading}
          size="default"
        />
      </motion.div>

      {/* Social Divider */}
      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <SocialDivider text="Or create account with email" />
      </motion.div>

      {/* Role Selection */}
      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <label className="block text-sm font-medium text-gray-700">
          Account Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {roleOptions.map((roleOption) => (
            <motion.button
              key={roleOption.value}
              type="button"
              onClick={() => handleRoleChange(roleOption.value)}
              className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                role === roleOption.value
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-medium text-sm">{roleOption.label}</div>
              <div className="text-xs text-gray-500 mt-1">{roleOption.description}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Role-specific fields */}
      <RoleFields
        role={role}
        roleDetails={roleDetails}
        updateRoleDetails={updateRoleDetails}
        isLoading={isLoading}
        formControlVariants={formControlVariants}
      />

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          variants={formControlVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
            First Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              onFocus={() => setActiveField('firstName')}
              onBlur={() => setActiveField(null)}
              placeholder="John"
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-all duration-300 ${
                formErrors.firstName
                  ? "border-red-300 ring-red-100 bg-red-50/30"
                  : activeField === 'firstName'
                  ? "border-violet-500 ring-violet-100 bg-violet-50/30"
                  : "border-gray-200 bg-white/60"
              }`}
              disabled={isLoading}
            />
            <HiOutlineUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          <ErrorMessage error={formErrors.firstName} />
        </motion.div>

        <motion.div
          variants={formControlVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
            Last Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              onFocus={() => setActiveField('lastName')}
              onBlur={() => setActiveField(null)}
              placeholder="Doe"
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-all duration-300 ${
                formErrors.lastName
                  ? "border-red-300 ring-red-100 bg-red-50/30"
                  : activeField === 'lastName'
                  ? "border-violet-500 ring-violet-100 bg-violet-50/30"
                  : "border-gray-200 bg-white/60"
              }`}
              disabled={isLoading}
            />
            <HiOutlineUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          <ErrorMessage error={formErrors.lastName} />
        </motion.div>
      </div>

      {/* Email Field */}
      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.6 }}
      >
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => setActiveField('email')}
            onBlur={() => setActiveField(null)}
            placeholder="john@example.com"
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-all duration-300 ${
              formErrors.email
                ? "border-red-300 ring-red-100 bg-red-50/30"
                : activeField === 'email'
                ? "border-violet-500 ring-violet-100 bg-violet-50/30"
                : "border-gray-200 bg-white/60"
            }`}
            disabled={isLoading}
          />
          <HiOutlineMail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        </div>
        <ErrorMessage error={formErrors.email} />
      </motion.div>

      {/* Password Field */}
      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.7 }}
      >
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => setActiveField('password')}
            onBlur={() => setActiveField(null)}
            placeholder="Enter your password"
            className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm focus:outline-none transition-all duration-300 ${
              formErrors.password
                ? "border-red-300 ring-red-100 bg-red-50/30"
                : activeField === 'password'
                ? "border-violet-500 ring-violet-100 bg-violet-50/30"
                : "border-gray-200 bg-white/60"
            }`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
          </button>
        </div>
        <ErrorMessage error={formErrors.password} />
      </motion.div>

      {/* Confirm Password Field */}
      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.8 }}
      >
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onFocus={() => setActiveField('confirmPassword')}
            onBlur={() => setActiveField(null)}
            placeholder="Confirm your password"
            className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm focus:outline-none transition-all duration-300 ${
              formErrors.confirmPassword
                ? "border-red-300 ring-red-100 bg-red-50/30"
                : activeField === 'confirmPassword'
                ? "border-violet-500 ring-violet-100 bg-violet-50/30"
                : "border-gray-200 bg-white/60"
            }`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
          </button>
        </div>
        <ErrorMessage error={formErrors.confirmPassword} />
      </motion.div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        className="w-full py-3.5 mt-6 bg-gradient-to-br from-violet-600 to-violet-700 text-white font-medium rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:shadow-none disabled:from-violet-400 disabled:to-violet-500"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.9 }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Creating Account...
          </span>
        ) : (
          "Create Account"
        )}
      </motion.button>

      {/* Toggle to Phone Registration */}
      <motion.button
        type="button"
        onClick={onToggleMethod}
        className="w-full py-2.5 mt-2 text-sm text-gray-600 hover:text-violet-700 transition-colors text-center"
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 1.0 }}
        whileHover={{ scale: 1.01 }}
      >
        Register with phone number instead
      </motion.button>

      {/* Terms and Privacy */}
      <motion.p
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 1.1 }}
        className="text-xs text-gray-500 mt-4 text-center"
      >
        By creating an account, you agree to our{" "}
        <Link
          href="/terms"
          className="text-violet-600 hover:text-violet-800 transition-colors hover:underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-violet-600 hover:text-violet-800 transition-colors hover:underline"
        >
          Privacy Policy
        </Link>
      </motion.p>
    </motion.form>
  );
};

export default EmailRegisterForm;
