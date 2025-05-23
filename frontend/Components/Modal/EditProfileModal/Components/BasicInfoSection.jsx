"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/auth-context";
import Link from "next/link";
import { FiAlertCircle, FiCheck, FiUser, FiPhone, FiMail, FiMapPin, FiMessageSquare } from "react-icons/fi";

const BasicInfoSection = ({ formData, setFormData, validationErrors, setValidationErrors, setHasUnsavedChanges }) => {
  const { user } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    setHasUnsavedChanges(true);
  };

  const getInputStatus = (fieldName) => {
    if (validationErrors[fieldName]) return "error";
    if (formData[fieldName]?.length > 0) return "success";
    return "normal";
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "error":
        return "border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500";
      case "success":
        return "border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500";
      default:
        return "border-gray-200 focus:ring-violet-500 focus:border-violet-500";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Personal Information */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden relative"
        whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        transition={{ duration: 0.2 }}
      >
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-full opacity-20 -mr-8 -mt-8"></div>

        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 rounded-md bg-violet-100 flex items-center justify-center mr-3">
              <FiUser className="h-4 w-4 text-violet-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                First Name
                <span className="text-red-500 text-xs">Required</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm transition-colors
                    ${getStatusStyles(getInputStatus("firstName"))}`}
                  maxLength={50}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiUser className="w-4 h-4" />
                </div>
                {getInputStatus("firstName") === "success" && (
                  <FiCheck className="absolute right-3 top-3 text-green-500 w-4 h-4" />
                )}
              </div>
              {validationErrors.firstName && (
                <motion.p
                  className="text-xs text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle className="w-3 h-3" />
                  {validationErrors.firstName}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                Last Name
                <span className="text-red-500 text-xs">Required</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm transition-colors
                    ${getStatusStyles(getInputStatus("lastName"))}`}
                  maxLength={50}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiUser className="w-4 h-4" />
                </div>
                {getInputStatus("lastName") === "success" && (
                  <FiCheck className="absolute right-3 top-3 text-green-500 w-4 h-4" />
                )}
              </div>
              {validationErrors.lastName && (
                <motion.p
                  className="text-xs text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle className="w-3 h-3" />
                  {validationErrors.lastName}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact Information */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden relative"
        whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        transition={{ duration: 0.2 }}
      >
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full opacity-20 -mr-8 -mt-8"></div>

        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center mr-3">
              <FiMail className="h-4 w-4 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                Email
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center
                  ${user?.isEmailVerified
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"}`}
                >
                  {user?.isEmailVerified ? (
                    <>
                      <FiCheck className="w-3 h-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>Unverified</>
                  )}
                </span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-20 py-2.5 rounded-xl text-gray-900 text-sm transition-colors
                    ${getStatusStyles(getInputStatus("email"))}`}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiMail className="w-4 h-4" />
                </div>
                {!user?.isEmailVerified && formData.email && (
                  <Link
                    href="/auth/verify-email"
                    className="absolute right-3 top-2.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 px-2 py-1 rounded-md"
                  >
                    Verify Now
                  </Link>
                )}
              </div>
              {validationErrors.email && (
                <motion.p
                  className="text-xs text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle className="w-3 h-3" />
                  {validationErrors.email}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                Phone
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center
                  ${user?.isPhoneVerified
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"}`}
                >
                  {user?.isPhoneVerified ? (
                    <>
                      <FiCheck className="w-3 h-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>Unverified</>
                  )}
                </span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-20 py-2.5 rounded-xl text-gray-900 text-sm transition-colors
                    ${getStatusStyles(getInputStatus("phone"))}`}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiPhone className="w-4 h-4" />
                </div>
                {!user?.isPhoneVerified && formData.phone && (
                  <Link
                    href="/auth/verify-phone"
                    className="absolute right-3 top-2.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 px-2 py-1 rounded-md"
                  >
                    Verify Now
                  </Link>
                )}
              </div>
              {validationErrors.phone && (
                <motion.p
                  className="text-xs text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle className="w-3 h-3" />
                  {validationErrors.phone}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Additional Information */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden relative"
        whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        transition={{ duration: 0.2 }}
      >
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full opacity-20 -mr-8 -mt-8"></div>

        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 rounded-md bg-indigo-100 flex items-center justify-center mr-3">
              <FiMessageSquare className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Additional Information</h4>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Bio
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                  rows="3"
                  maxLength={500}
                  placeholder="Write a short bio about yourself..."
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  <span className={formData.bio.length > 400 ? "text-amber-500" : ""}>
                    {formData.bio.length}
                  </span>/500
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  Address
                  <span className="ml-2 text-xs text-gray-400">(Optional)</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address?.country || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                      maxLength={50}
                      placeholder="Country"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <FiMapPin className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address?.city || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                      maxLength={50}
                      placeholder="City"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <FiMapPin className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address?.street || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                      maxLength={100}
                      placeholder="Street address"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <FiMapPin className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  Preferred Contact Method
                  <span className="ml-2 text-xs text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="preferredContact"
                    value={formData.preferredContact}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                    maxLength={100}
                    placeholder="e.g., Email, Phone, LinkedIn"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <FiMessageSquare className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BasicInfoSection;