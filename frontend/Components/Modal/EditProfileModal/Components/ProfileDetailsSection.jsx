"use client";

import { motion } from "framer-motion";
import { FiInfo, FiAlertCircle, FiCheck, FiUser, FiCalendar, FiMessageSquare } from "react-icons/fi";

const ProfileDetailsSection = ({ formData, setFormData, validationErrors, setValidationErrors, setHasUnsavedChanges }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    setHasUnsavedChanges(true);
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
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
      {/* Profile Details */}
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
              <FiInfo className="h-4 w-4 text-violet-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Profile Details</h4>
          </div>
          
          <div className="space-y-6">
            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Bio
                <span className="ml-2 text-xs text-gray-400">(Brief introduction, max 500 chars)</span>
              </label>
              <div className="relative">
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl text-gray-900 text-sm border transition-colors duration-200 ${getStatusStyles(getInputStatus("bio"))}`}
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
              {validationErrors.bio && (
                <motion.p 
                  className="text-xs text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle className="w-3 h-3" />
                  {validationErrors.bio}
                </motion.p>
              )}
            </div>

            {/* About */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                About
                <span className="ml-2 text-xs text-gray-400">(Detailed description, max 2000 chars)</span>
              </label>
              <div className="relative">
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl text-gray-900 text-sm border transition-colors duration-200 ${getStatusStyles(getInputStatus("about"))}`}
                  rows="5"
                  maxLength={2000}
                  placeholder="Share more details about yourself, your background, experience, etc."
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  <span className={formData.about.length > 1800 ? "text-amber-500" : ""}>
                    {formData.about.length}
                  </span>/2000
                </p>
              </div>
              {validationErrors.about && (
                <motion.p 
                  className="text-xs text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle className="w-3 h-3" />
                  {validationErrors.about}
                </motion.p>
              )}
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Headline
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="headline"
                  value={formData.headline || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border transition-colors duration-200 ${getStatusStyles(getInputStatus("headline"))}`}
                  maxLength={100}
                  placeholder="e.g., Senior Developer at Tech Co."
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiUser className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Gender
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiUser className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Birth Date
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border transition-colors duration-200 ${getStatusStyles(getInputStatus("birthDate"))}`}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiCalendar className="w-4 h-4" />
                </div>
              </div>
              {validationErrors.birthDate && (
                <motion.p 
                  className="text-xs text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle className="w-3 h-3" />
                  {validationErrors.birthDate}
                </motion.p>
              )}
            </div>

            {/* Preferred Contact Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Preferred Contact Method
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="preferredContact"
                  value={formData.preferredContact || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border transition-colors duration-200 ${getStatusStyles(getInputStatus("preferredContact"))}`}
                  maxLength={100}
                  placeholder="e.g., Email, Phone, LinkedIn"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiMessageSquare className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Open to Work */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="openToWork"
                name="openToWork"
                checked={formData.openToWork || false}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
              />
              <label htmlFor="openToWork" className="ml-2 block text-sm text-gray-700">
                I am open to work opportunities
              </label>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileDetailsSection;
