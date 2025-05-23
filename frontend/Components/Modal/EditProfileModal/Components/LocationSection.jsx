"use client";

import { motion } from "framer-motion";
import { FiMapPin, FiAlertCircle, FiGlobe, FiHome } from "react-icons/fi";

const LocationSection = ({ formData, setFormData, validationErrors, setValidationErrors, setHasUnsavedChanges }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested address object
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
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
    
    // Clear validation errors
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setValidationErrors((prev) => ({ ...prev, [`address.${addressField}`]: undefined }));
    } else {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    
    setHasUnsavedChanges(true);
  };

  const getInputStatus = (fieldName) => {
    if (validationErrors[fieldName]) return "error";
    
    // Handle nested address fields
    if (fieldName.startsWith("address.")) {
      const addressField = fieldName.split(".")[1];
      const value = formData.address?.[addressField];
      if (value && value.length > 0) return "success";
    } else {
      if (formData[fieldName]?.length > 0) return "success";
    }
    
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
      {/* Location Information */}
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
              <FiMapPin className="h-4 w-4 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Location Information</h4>
          </div>
          
          <div className="space-y-6">
            {/* Country */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Country
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="address.country"
                  value={formData.address?.country || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border transition-colors duration-200 ${getStatusStyles(getInputStatus("address.country"))}`}
                  maxLength={50}
                  placeholder="e.g., United States"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiGlobe className="w-4 h-4" />
                </div>
              </div>
              {validationErrors["address.country"] && (
                <motion.p 
                  className="text-xs text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle className="w-3 h-3" />
                  {validationErrors["address.country"]}
                </motion.p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                City
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="address.city"
                  value={formData.address?.city || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border transition-colors duration-200 ${getStatusStyles(getInputStatus("address.city"))}`}
                  maxLength={50}
                  placeholder="e.g., New York"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiMapPin className="w-4 h-4" />
                </div>
              </div>
              {validationErrors["address.city"] && (
                <motion.p 
                  className="text-xs text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle className="w-3 h-3" />
                  {validationErrors["address.city"]}
                </motion.p>
              )}
            </div>

            {/* Street Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Street Address
                <span className="ml-2 text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="address.street"
                  value={formData.address?.street || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm border transition-colors duration-200 ${getStatusStyles(getInputStatus("address.street"))}`}
                  maxLength={100}
                  placeholder="e.g., 123 Main St"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FiHome className="w-4 h-4" />
                </div>
              </div>
              {validationErrors["address.street"] && (
                <motion.p 
                  className="text-xs text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiAlertCircle className="w-3 h-3" />
                  {validationErrors["address.street"]}
                </motion.p>
              )}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                <strong>Privacy Note:</strong> Your location information helps us provide you with relevant opportunities and connections. Only your country and city will be visible to other users.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LocationSection;
