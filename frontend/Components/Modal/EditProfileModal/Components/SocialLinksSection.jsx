"use client";

import { motion } from "framer-motion";
import { FiFacebook, FiTwitter, FiLinkedin, FiInstagram, FiGithub, FiGlobe, FiAlertCircle, FiCheck } from "react-icons/fi";

const SocialLinksSection = ({ formData, setFormData, validationErrors, setValidationErrors, setHasUnsavedChanges }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    const field = name.split(".")[1];
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: value },
    }));
    setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    setHasUnsavedChanges(true);
  };

  const socialLinks = [
    {
      key: "website",
      label: "Website",
      icon: FiGlobe,
      color: "indigo",
      placeholder: "https://yourwebsite.com",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: FiLinkedin,
      color: "blue",
      placeholder: "https://linkedin.com/in/username",
    },
    {
      key: "twitter",
      label: "Twitter",
      icon: FiTwitter,
      color: "sky",
      placeholder: "https://twitter.com/username",
    },
    {
      key: "github",
      label: "GitHub",
      icon: FiGithub,
      color: "gray",
      placeholder: "https://github.com/username",
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: FiFacebook,
      color: "blue",
      placeholder: "https://facebook.com/username",
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: FiInstagram,
      color: "pink",
      placeholder: "https://instagram.com/username",
    },
  ];

  const getInputStatus = (fieldName) => {
    if (validationErrors[`socialLinks.${fieldName}`]) return "error";
    if (formData.socialLinks[fieldName]?.length > 0) return "success";
    return "normal";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {socialLinks.map(({ key, label, icon: Icon, color, placeholder }) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-${color}-200 transition-colors`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`p-2 rounded-xl bg-${color}-50 text-${color}-500`}>
                <Icon className="w-5 h-5" />
              </span>
              <label className="text-sm font-medium text-gray-700">{label}</label>
            </div>
            
            <div className="relative">
              <input
                type="url"
                name={`socialLinks.${key}`}
                value={formData.socialLinks[key]}
                onChange={handleChange}
                placeholder={placeholder}
                className={`w-full pl-4 pr-10 py-2.5 rounded-xl text-gray-900 text-sm border transition-colors ${
                  validationErrors[`socialLinks.${key}`]
                    ? "border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500"
                    : formData.socialLinks[key]
                    ? "border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500"
                    : "border-gray-200 focus:ring-violet-500 focus:border-violet-500"
                }`}
              />
              {getInputStatus(key) === "success" && (
                <FiCheck className="absolute right-3 top-3 text-green-500 w-4 h-4" />
              )}
              {getInputStatus(key) === "error" && (
                <FiAlertCircle className="absolute right-3 top-3 text-red-500 w-4 h-4" />
              )}
            </div>
            
            {validationErrors[`socialLinks.${key}`] && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <FiAlertCircle className="w-3 h-3" />
                {validationErrors[`socialLinks.${key}`]}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SocialLinksSection;