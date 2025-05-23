"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUserCircle } from "react-icons/hi";
import RoleFields from './RoleFields';

const EmailRegistrationForm = ({ onSubmit, isLoading, onToggleMethod }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "user", // Default role
    roleDetails: {} // Add roleDetails object
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const roles = [
    { value: "user", label: "Regular User" },
    { value: "startupOwner", label: "Startup Owner" },
    { value: "investor", label: "Investor" },
    { value: "agency", label: "Agency" },
    { value: "freelancer", label: "Freelancer" },
    { value: "jobseeker", label: "Job Seeker" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email format";

    if (!formData.password) errors.password = "Password is required";
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(formData.password))
      errors.password = "Password must include uppercase, lowercase, number, and special character";

    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length === 0) {
      // Include roleDetails in submission
      onSubmit({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        roleDetails: formData.role !== "user" ? formData.roleDetails : undefined
      });
    } else {
      setFormErrors(errors);
    }
  };

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

  const passwordStrength = (password) => {
    if (!password) return { width: "0%", color: "bg-gray-200" };

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const isLongEnough = password.length >= 8;

    const strength = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;

    const strengthMap = {
      1: { width: "20%", color: "bg-red-400" },
      2: { width: "40%", color: "bg-red-300" },
      3: { width: "60%", color: "bg-yellow-400" },
      4: { width: "80%", color: "bg-green-300" },
      5: { width: "100%", color: "bg-green-500" },
    };

    return strengthMap[strength] || { width: "0%", color: "bg-gray-200" };
  };

  const strength = passwordStrength(formData.password);

  // Animation variants
  const formControlVariants = {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500"
      >
        <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>{error}</span>
      </motion.div>
    );
  };

  const renderPasswordRequirements = (password) => {
    const requirements = [
      { met: /[a-z]/.test(password), text: "One lowercase character" },
      { met: /[A-Z]/.test(password), text: "One uppercase character" },
      { met: /\d/.test(password), text: "One number" },
      { met: /[!@#$%^&*]/.test(password), text: "One special character" },
      { met: password.length >= 8, text: "8+ characters" }
    ];

    return (
      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className={req.met ? 'text-gray-600' : 'text-gray-400'}>{req.text}</span>
          </div>
        ))}
      </div>
    );
  };

  // Add a function to handle role-specific fields
  const updateRoleDetails = (field, value) => {
    setFormData(prev => ({
      ...prev,
      roleDetails: {
        ...prev.roleDetails,
        [field]: value
      }
    }));
  };

  const renderRoleFields = () => (
    <RoleFields
      role={formData.role}
      roleDetails={formData.roleDetails}
      updateRoleDetails={updateRoleDetails}
      isLoading={isLoading}
      formControlVariants={formControlVariants}
    />
  );

  return (
    <motion.form
      className="space-y-4 w-full mx-auto"
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
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <div className="relative group">
          <motion.input
            type="email"
            id="email"
            name="email"
            placeholder="your@email.com"
            className={`w-full px-4 py-2.5 pl-10 border rounded-xl text-sm text-gray-800 transition-all duration-300 ${
              formErrors.email ? "border-red-300" : "border-gray-200 group-hover:border-violet-300"
            }`}
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            variants={inputVariants}
            animate={formErrors.email ? "error" : activeField === "email" ? "focused" : "normal"}
            onFocus={() => setActiveField("email")}
            onBlur={() => setActiveField(null)}
          />
          <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
        </div>
        <ErrorMessage error={formErrors.email} />
      </motion.div>

      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Account Type
        </label>
        <div className="relative group">
          <motion.select
            id="role"
            name="role"
            className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
            value={formData.role}
            onChange={handleChange}
            disabled={isLoading}
            variants={inputVariants}
            animate={activeField === "role" ? "focused" : "normal"}
            onFocus={() => setActiveField("role")}
            onBlur={() => setActiveField(null)}
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </motion.select>
          <HiOutlineUserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative group">
          <motion.input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="••••••••"
            className={`w-full px-4 py-2.5 pl-10 pr-10 border rounded-xl text-sm text-gray-800 transition-all duration-300 ${
              formErrors.password ? "border-red-300" : "border-gray-200 group-hover:border-violet-300"
            }`}
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            variants={inputVariants}
            animate={formErrors.password ? "error" : activeField === "password" ? "focused" : "normal"}
            onFocus={() => setActiveField("password")}
            onBlur={() => setActiveField(null)}
          />
          <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
          {/* Fixed eye icon - removed hover animation */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-600 transition-colors"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {formData.password && (
          <div className="mt-1 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
            <motion.div
              className={`h-full ${strength.color}`}
              initial={{ width: "0%" }}
              animate={{ width: strength.width }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
        <ErrorMessage error={formErrors.password} />
        {formData.password && !formErrors.password && renderPasswordRequirements(formData.password)}
      </motion.div>

      <motion.div
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.4 }}
      >
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <div className="relative group">
          <motion.input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            placeholder="••••••••"
            className={`w-full px-4 py-2.5 pl-10 pr-10 border rounded-xl text-sm text-gray-800 transition-all duration-300 ${
              formErrors.confirmPassword ? "border-red-300" : "border-gray-200 group-hover:border-violet-300"
            }`}
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            variants={inputVariants}
            animate={formErrors.confirmPassword ? "error" : activeField === "confirmPassword" ? "focused" : "normal"}
            onFocus={() => setActiveField("confirmPassword")}
            onBlur={() => setActiveField(null)}
          />
          <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
          {/* Fixed eye icon - removed hover animation */}
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-600 transition-colors"
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        <ErrorMessage error={formErrors.confirmPassword} />
      </motion.div>

      {/* Add role-specific fields based on selected role */}
      {renderRoleFields()}

      <motion.button
        type="submit"
        className="w-full py-3 mt-4 bg-gradient-to-br from-violet-600 to-violet-700 text-white font-medium rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:shadow-none disabled:from-violet-400 disabled:to-violet-500"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        variants={formControlVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.5 }}
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
            Registering...
          </span>
        ) : (
          "Create Account"
        )}
      </motion.button>
    </motion.form>
  );
};


export default EmailRegistrationForm;