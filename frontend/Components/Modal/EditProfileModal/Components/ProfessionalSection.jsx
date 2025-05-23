"use client";

import { motion } from "framer-motion";
import { FiBriefcase, FiAlertCircle, FiGlobe, FiUsers, FiTrendingUp } from "react-icons/fi";
import { useAuth } from "@/lib/contexts/auth-context";

const ProfessionalSection = ({ formData, setFormData, validationErrors, setValidationErrors, setHasUnsavedChanges }) => {
  const { user } = useAuth();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  // Industry options
  const industryOptions = [
    "Technology", "Finance", "Healthcare", "Education", "E-commerce", 
    "Manufacturing", "Real Estate", "Entertainment", "Food & Beverage", 
    "Travel", "Fashion", "Media", "Consulting", "Energy", "Transportation"
  ];

  // Company size options
  const companySizeOptions = [
    "1-10 employees", "11-50 employees", "51-200 employees", 
    "201-500 employees", "501-1000 employees", "1000+ employees"
  ];

  // Funding stage options (for startup owners)
  const fundingStageOptions = [
    "Pre-seed", "Seed", "Series A", "Series B", "Series C+", 
    "Bootstrapped", "Profitable", "Acquired", "Public"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Professional Information */}
      <motion.div 
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden relative"
        whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        transition={{ duration: 0.2 }}
      >
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full opacity-20 -mr-8 -mt-8"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 rounded-md bg-amber-100 flex items-center justify-center mr-3">
              <FiBriefcase className="h-4 w-4 text-amber-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Professional Information</h4>
          </div>
          
          <div className="space-y-6">
            {/* Company Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Company/Organization Name
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border transition-colors duration-200 ${getStatusStyles(getInputStatus("companyName"))}`}
                  maxLength={100}
                  placeholder="e.g., Acme Corporation"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiBriefcase className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Company Website */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Company Website
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  name="companyWebsite"
                  value={formData.companyWebsite || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border transition-colors duration-200 ${getStatusStyles(getInputStatus("companyWebsite"))}`}
                  placeholder="https://example.com"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiGlobe className="w-4 h-4" />
                </div>
              </div>
              {validationErrors.companyWebsite && (
                <motion.p 
                  className="text-xs text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle className="w-3 h-3" />
                  {validationErrors.companyWebsite}
                </motion.p>
              )}
            </div>

            {/* Role/Position */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Your Role/Position
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="companyRole"
                  value={formData.companyRole || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border transition-colors duration-200 ${getStatusStyles(getInputStatus("companyRole"))}`}
                  maxLength={100}
                  placeholder="e.g., Software Engineer, CEO, Marketing Manager"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiBriefcase className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Industry
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <select
                  name="industry"
                  value={formData.industry || ""}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select an industry</option>
                  {industryOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiTrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Company Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Company Size
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <select
                  name="companySize"
                  value={formData.companySize || ""}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select company size</option>
                  {companySizeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiUsers className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Funding Stage - Only for startup owners */}
            {user?.role === "startupOwner" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  Funding Stage
                  <span className="ml-2 text-xs text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <select
                    name="fundingStage"
                    value={formData.fundingStage || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select funding stage</option>
                    {fundingStageOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <FiTrendingUp className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            {/* Company Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Company Description
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <textarea
                  name="companyDescription"
                  value={formData.companyDescription || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                  rows="3"
                  maxLength={500}
                  placeholder="Briefly describe your company or organization..."
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  <span className={formData.companyDescription?.length > 400 ? "text-amber-500" : ""}>
                    {formData.companyDescription?.length || 0}
                  </span>/500
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfessionalSection;
