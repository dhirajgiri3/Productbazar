"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineArrowLeft,
  HiOutlineLightningBolt,
  HiOutlineUserCircle,
  HiOutlineOfficeBuilding,
  HiOutlineCash,
  HiOutlineBriefcase,
} from "react-icons/hi";
import { useAuth } from "@/lib/contexts/auth-context";
import EmailRegistrationForm from "./EmailRegistrationForm";
import { debounce } from "lodash";

const RegisterLeft = () => {
  const {
    registerWithPhone,
    verifyOtpForRegister,
    registerWithEmail, // Left unchanged
    authLoading,
    error,
    clearError,
  } = useAuth();

  // State for phone registration
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("user"); // Default role
  const [roleDetails, setRoleDetails] = useState({}); // Role-specific details
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(120); // 2 minutes
  const [formErrors, setFormErrors] = useState({});
  const [authMethod, setAuthMethod] = useState("email");

  // Role options consistent with backend
  const roles = [
    { value: "user", label: "Regular User" },
    { value: "startupOwner", label: "Startup Owner" },
    { value: "investor", label: "Investor" },
    { value: "agency", label: "Agency" },
    { value: "freelancer", label: "Freelancer" },
    { value: "jobseeker", label: "Job Seeker" },
  ];

  // Role-specific fields configuration
  const roleFields = {
    startupOwner: [
      {
        name: "companyName",
        label: "Company Name",
        type: "text",
        icon: HiOutlineOfficeBuilding,
        required: true,
      },
      {
        name: "industry",
        label: "Industry",
        type: "text",
        icon: HiOutlineBriefcase,
      },
      {
        name: "fundingStage",
        label: "Funding Stage",
        type: "text",
        icon: HiOutlineCash,
      },
    ],
    investor: [
      {
        name: "investorType",
        label: "Investor Type (e.g., Angel, VC)",
        type: "text",
        icon: HiOutlineCash,
        required: true,
      },
    ],
    agency: [
      {
        name: "companyName",
        label: "Company Name",
        type: "text",
        icon: HiOutlineOfficeBuilding,
        required: true,
      },
    ],
    freelancer: [
      {
        name: "skills",
        label: "Skills (comma-separated)",
        type: "text",
        icon: HiOutlineBriefcase,
        required: true,
      },
    ],
    jobseeker: [
      {
        name: "jobTitle",
        label: "Desired Job Title",
        type: "text",
        icon: HiOutlineBriefcase,
        required: true,
      },
    ],
  };

  // Cleanup error state on unmount or auth method change
  useEffect(() => {
    return () => clearError?.();
  }, [clearError, authMethod]);

  // OTP countdown timer
  useEffect(() => {
    if (!isOtpSent || otpCountdown <= 0) return;

    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOtpSent, otpCountdown]);

  // Handle OTP request
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      setFormErrors({ phone: "Invalid phone number (e.g., +1234567890)" });
      return;
    }

    // Validate roleDetails if role requires it
    if (role !== "user" && roleFields[role]) {
      const requiredFields = roleFields[role].filter((field) => field.required);
      for (const field of requiredFields) {
        if (!roleDetails[field.name] || roleDetails[field.name].trim() === "") {
          setFormErrors({ [field.name]: `${field.label} is required` });
          return;
        }
      }
    }

    try {
      const result = await registerWithPhone(phone, role, roleDetails);
      if (result.success) {
        setIsOtpSent(true);
        setOtpCountdown(120);
      } else {
        setFormErrors({ phone: result.message || "Failed to send OTP" });
      }
    } catch (error) {
      setFormErrors({ phone: "Failed to request OTP. Please try again." });
      console.error("OTP request failed:", error);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!/^\d{4,6}$/.test(otp)) {
      setFormErrors({ otp: "OTP must be 4-6 digits" });
      return;
    }

    try {
      const result = await verifyOtpForRegister(phone, otp, role, roleDetails);
      if (!result.success) {
        setFormErrors({ otp: result.message || "OTP verification failed" });
      }
    } catch (error) {
      setFormErrors({ otp: "OTP verification failed. Please try again." });
      console.error("OTP verification failed:", error);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    try {
      const result = await registerWithPhone(phone, role, roleDetails);
      if (result.success) {
        setOtpCountdown(120);
        setFormErrors({});
      } else {
        setFormErrors({ otp: result.message || "Failed to resend OTP" });
      }
    } catch (error) {
      setFormErrors({ otp: "Failed to resend OTP. Please try again." });
      console.error("Resend OTP failed:", error);
    }
  };

  const debouncedResendOtp = debounce(resendOtp, 300);

  // Toggle between email and phone methods
  const toggleAuthMethod = (method) => {
    if (method === authMethod) return;
    setAuthMethod(method);
    setIsOtpSent(false);
    setPhone("");
    setOtp("");
    setRole("user");
    setRoleDetails({});
    setFormErrors({});
    setOtpCountdown(120);
    clearError?.();
  };

  // Handle phone input change
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\+?\d*$/.test(value)) {
      setPhone(value);
      if (formErrors.phone) {
        setFormErrors((prev) => ({ ...prev, phone: undefined }));
      }
    }
  };

  // Handle OTP input change
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(value);
    if (formErrors.otp) {
      setFormErrors((prev) => ({ ...prev, otp: undefined }));
    }
  };

  // Handle roleDetails input change
  const handleRoleDetailsChange = (e) => {
    const { name, value } = e.target;
    setRoleDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5, staggerChildren: 0.1 },
    },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  const tabVariants = {
    inactive: {
      backgroundColor: "rgb(243 244 246)",
      color: "rgb(75 85 99)",
      boxShadow: "none",
    },
    active: {
      backgroundColor: "rgb(124 58 237)",
      color: "white",
      boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg"
    >
      <div className="relative h-full min-h-[600px] max-h-[800px] w-full rounded-2xl bg-white/95 backdrop-blur-md border border-violet-600/10 p-6 sm:p-8 overflow-auto scrollbar-thin scrollbar-thumb-violet-200 scrollbar-track-transparent">
        <div className="absolute inset-0 rounded-2xl bg-white/40 backdrop-blur-xl -z-10"></div>
        <div className="relative z-10">
          {/* Header */}
          <motion.div
            className="text-center mb-7"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="flex justify-center mb-3"
              variants={itemVariants}
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Image
                  src="/Assets/Image/logo/pb-logo.png"
                  alt="Product Bazar Logo"
                  width={52}
                  height={52}
                  className="object-contain drop-shadow-md"
                  quality={90}
                  priority
                />
              </motion.div>
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="text-2xl font-bold bg-gradient-to-br from-violet-700 to-indigo-600 bg-clip-text text-transparent mt-1 tracking-tight"
            >
              Create Your Account
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-gray-600 text-sm mt-2 mb-1"
            >
              Join our community of innovative makers
            </motion.p>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 mt-4 text-xs text-red-700 bg-red-50 rounded-xl border border-red-100 flex items-center"
              >
                <svg
                  className="w-4 h-4 text-red-500 mr-1.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="font-medium">{error}</span>
              </motion.div>
            )}
          </motion.div>

          {/* Tabs */}
          <motion.div variants={itemVariants} className="mb-7">
            <div className="flex p-1 bg-gray-100 rounded-xl w-full shadow-sm">
              <motion.button
                type="button"
                variants={tabVariants}
                initial={authMethod === "email" ? "active" : "inactive"}
                animate={authMethod === "email" ? "active" : "inactive"}
                whileHover={{ scale: authMethod !== "email" ? 1.02 : 1 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex-1"
                onClick={() => toggleAuthMethod("email")}
              >
                <HiOutlineMail className="text-lg" /> Email
              </motion.button>
              <motion.button
                type="button"
                variants={tabVariants}
                initial={authMethod === "phone" ? "active" : "inactive"}
                animate={authMethod === "phone" ? "active" : "inactive"}
                whileHover={{ scale: authMethod !== "phone" ? 1.02 : 1 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex-1"
                onClick={() => toggleAuthMethod("phone")}
              >
                <HiOutlinePhone className="text-lg" /> Phone
              </motion.button>
            </div>
          </motion.div>

          {/* Form Section */}
          <div className="min-h-[320px]">
            <AnimatePresence mode="wait">
              {authMethod === "email" ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full"
                >
                  <EmailRegistrationForm
                    onSubmit={registerWithEmail} // Left unchanged
                    isLoading={authLoading}
                    onToggleMethod={() => toggleAuthMethod("phone")}
                  />
                </motion.div>
              ) : !isOtpSent ? (
                <motion.form
                  key="phoneInput"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-5 w-full"
                  onSubmit={handleRequestOtp}
                >
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Phone Number
                    </label>
                    <div className="relative group">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="+1234567890"
                        className={`w-full px-4 py-3 pl-11 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-300 ${
                          formErrors.phone
                            ? "border-red-300 ring-red-100 bg-red-50/30"
                            : "border-gray-200 group-hover:border-violet-300 bg-white/60"
                        }`}
                        value={phone}
                        onChange={handlePhoneChange}
                        disabled={authLoading}
                        aria-invalid={!!formErrors.phone}
                        aria-describedby={
                          formErrors.phone ? "phone-error" : undefined
                        }
                      />
                      <HiOutlinePhone
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-lg ${
                          formErrors.phone
                            ? "text-red-400"
                            : "text-gray-400 group-hover:text-violet-500"
                        }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <motion.p
                        id="phone-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 text-xs text-red-500 flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                        {formErrors.phone}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Account Type
                    </label>
                    <div className="relative group">
                      <select
                        id="role"
                        name="role"
                        className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300 bg-white/60"
                        value={role}
                        onChange={(e) => {
                          setRole(e.target.value);
                          setRoleDetails({}); // Reset roleDetails when role changes
                        }}
                        disabled={authLoading}
                      >
                        {roles.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <HiOutlineUserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500" />
                    </div>
                  </div>

                  {/* Role-specific fields */}
                  {role !== "user" && roleFields[role] && (
                    <div className="space-y-4">
                      {roleFields[role].map((field) => (
                        <div key={field.name}>
                          <label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700 mb-1.5"
                          >
                            {field.label}{" "}
                            {field.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <div className="relative group">
                            <input
                              type={field.type}
                              id={field.name}
                              name={field.name}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              className={`w-full px-4 py-3 pl-11 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-300 ${
                                formErrors[field.name]
                                  ? "border-red-300 ring-red-100 bg-red-50/30"
                                  : "border-gray-200 group-hover:border-violet-300 bg-white/60"
                              }`}
                              value={roleDetails[field.name] || ""}
                              onChange={handleRoleDetailsChange}
                              disabled={authLoading}
                              aria-invalid={!!formErrors[field.name]}
                              aria-describedby={
                                formErrors[field.name]
                                  ? `${field.name}-error`
                                  : undefined
                              }
                            />
                            <field.icon
                              className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-lg ${
                                formErrors[field.name]
                                  ? "text-red-400"
                                  : "text-gray-400 group-hover:text-violet-500"
                              }`}
                            />
                          </div>
                          {formErrors[field.name] && (
                            <motion.p
                              id={`${field.name}-error`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 text-xs text-red-500 flex items-center gap-1.5"
                            >
                              <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                              {formErrors[field.name]}
                            </motion.p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 py-1.5 px-3 bg-amber-50/50 rounded-lg border border-amber-100/50">
                    <HiOutlineLightningBolt className="text-amber-500 flex-shrink-0" />
                    <span className="text-xs text-amber-700">
                      Enter number with country code (e.g., +1 for US)
                    </span>
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-br from-violet-600 to-violet-700 text-white font-medium rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:shadow-none disabled:from-violet-400 disabled:to-violet-500 mt-6"
                    disabled={authLoading}
                    whileHover={{ scale: authLoading ? 1 : 1.02 }}
                    whileTap={{ scale: authLoading ? 1 : 0.98 }}
                  >
                    {authLoading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending OTP...
                      </span>
                    ) : (
                      "Request Verification Code"
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="otpInput"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-5 w-full"
                  onSubmit={handleVerifyOtp}
                >
                  <motion.button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="flex items-center text-sm text-violet-600 hover:text-violet-800 transition-colors mb-2"
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <HiOutlineArrowLeft className="mr-1" /> Back to phone entry
                  </motion.button>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label
                        htmlFor="otp"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Verification Code
                      </label>
                      <span className="text-xs text-gray-500 font-medium">
                        Sent to {phone}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        id="otp"
                        name="otp"
                        placeholder="••••••"
                        className={`w-full px-4 py-3.5 border rounded-xl text-sm text-center tracking-widest font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-300 ${
                          formErrors.otp
                            ? "border-red-300 ring-red-100 bg-red-50/30"
                            : "border-gray-200 bg-white/60"
                        }`}
                        value={otp}
                        onChange={handleOtpChange}
                        disabled={authLoading}
                        maxLength={6}
                        aria-invalid={!!formErrors.otp}
                        aria-describedby={
                          formErrors.otp ? "otp-error" : undefined
                        }
                      />
                      <motion.div
                        className="absolute -top-2 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        initial={{ width: "100%" }}
                        animate={{
                          width: `${Math.max((otpCountdown / 120) * 100, 0)}%`,
                        }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-500">
                        {otpCountdown > 0 && (
                          <span>
                            Code expires in{" "}
                            <span className="font-medium text-violet-600">
                              {otpCountdown}s
                            </span>
                          </span>
                        )}
                        {otpCountdown <= 0 && (
                          <span className="text-red-500">Code expired</span>
                        )}
                      </div>
                      <motion.button
                        type="button"
                        className={`text-xs text-violet-600 font-medium hover:text-violet-800 flex items-center gap-1 transition-all ${
                          otpCountdown > 0 || authLoading
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={debouncedResendOtp}
                        disabled={otpCountdown > 0 || authLoading}
                        whileHover={{
                          scale: otpCountdown > 0 || authLoading ? 1 : 1.05,
                        }}
                      >
                        {otpCountdown > 0 ? "Resend soon" : "Resend Code"}
                      </motion.button>
                    </div>
                    {formErrors.otp && (
                      <motion.p
                        id="otp-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                        {formErrors.otp}
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-br from-violet-600 to-violet-700 text-white font-medium rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:shadow-none disabled:from-violet-400 disabled:to-violet-500 mt-3"
                    disabled={authLoading}
                    whileHover={{ scale: authLoading ? 1 : 1.02 }}
                    whileTap={{ scale: authLoading ? 1 : 0.98 }}
                  >
                    {authLoading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      "Verify & Create Account"
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <motion.div
            className="mt-8 text-center space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="text-sm text-gray-600 flex justify-center items-center space-x-1"
            >
              <span>Already have an account?</span>
              <Link
                href="/auth/login"
                className="text-violet-600 hover:text-violet-800 font-medium transition-colors hover:underline"
              >
                Sign In
              </Link>
            </motion.div>
            <motion.p
              variants={itemVariants}
              className="text-xs text-gray-500 mt-4 px-4"
            >
              By signing up, you agree to our{" "}
              <Link
                href="/terms"
                className="text-violet-600 hover:text-violet-800 transition-colors hover:underline"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-violet-600 hover:text-violet-800 transition-colors hover:underline"
              >
                Privacy Policy
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterLeft;
