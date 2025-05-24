"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiX } from "react-icons/hi";
import {
  FiUser,
  FiLink,
  FiBriefcase,
  FiSave,
  FiSettings,
  FiHeart,
  FiMapPin,
  FiInfo
} from "react-icons/fi";
import { useAuth } from "@/lib/contexts/auth-context";
import ProfileBasicsSection from "./Components/ProfileBasicsSection";
import ProfileDetailsSection from "./Components/ProfileDetailsSection";
import SkillsInterestsSection from "./Components/SkillsInterestsSection";
import SocialLinksSection from "./Components/SocialLinksSection";
import LocationSection from "./Components/LocationSection";
import ProfessionalSection from "./Components/ProfessionalSection";
import RoleSpecificSection from "./Components/RoleSpecificSection";
import LoaderComponent from "../../UI/LoaderComponent";
import toast from "react-hot-toast";

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile, authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("basics");
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    birthDate: "",

    // Profile Details
    bio: "",
    about: "",
    headline: "",
    openToWork: false,
    preferredContact: "",

    // Location
    address: {
      country: "",
      city: "",
      street: ""
    },

    // Skills & Interests
    skills: [],
    interests: [],

    // Professional Info
    companyName: "",
    companyWebsite: "",
    companyRole: "",
    industry: "",
    companySize: "",
    fundingStage: "",
    companyDescription: "",

    // Role-specific details
    roleDetails: {
      // Will be populated based on user role
    },

    // Social Links
    socialLinks: {
      website: "",
      twitter: "",
      linkedin: "",
      github: "",
      facebook: "",
      instagram: ""
    },

    // Media
    profilePicture: null,
    profileImageFile: null, // Store the actual file for upload
    removeProfilePicture: false, // Flag to indicate if profile picture should be removed
    bannerImage: null
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      // Format interests properly
      const formattedInterests = Array.isArray(user.interests)
        ? user.interests.map(interest => {
            if (typeof interest === 'string') return { name: interest, strength: 5 };
            return interest;
          })
        : [];

      setFormData({
        // Basic Info
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "",
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",

        // Profile Details
        bio: user.bio || "",
        about: user.about || "",
        headline: user.headline || "",
        openToWork: user.openToWork || false,
        preferredContact: user.preferredContact || "",

        // Location
        address: typeof user.address === 'object' ? {
          country: user.address?.country || "",
          city: user.address?.city || "",
          street: user.address?.street || ""
        } : {
          country: "",
          city: "",
          street: user.address || "" // If it's a string, put it in street field for backward compatibility
        },

        // Skills & Interests
        skills: user.skills || [],
        interests: formattedInterests,

        // Professional Info
        companyName: user.companyName || "",
        companyWebsite: user.companyWebsite || "",
        companyRole: user.companyRole || "",
        industry: user.industry || "",
        companySize: user.companySize || "",
        fundingStage: user.fundingStage || "",
        companyDescription: user.companyDescription || "",

        // Role-specific details
        roleDetails: user.roleDetails || {},

        // Social Links
        socialLinks: {
          website: user.socialLinks?.website || "",
          twitter: user.socialLinks?.twitter || "",
          linkedin: user.socialLinks?.linkedin || "",
          github: user.socialLinks?.github || "",
          facebook: user.socialLinks?.facebook || "",
          instagram: user.socialLinks?.instagram || ""
        },

        // Media
        profilePicture: user.profilePicture || null,
        profileImageFile: null, // Initialize with null
        removeProfilePicture: false, // Initialize with false
        bannerImage: user.bannerImage || null
      });
    }
  }, [user, isOpen]);

  const validateForm = () => {
    const errors = {};

    // Basic Info validation
    if (!formData.firstName) errors.firstName = "First name is required";
    if (!formData.lastName) errors.lastName = "Last name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      errors.phone = "Invalid phone format";
    }

    // Date validation
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        errors.birthDate = "Birth date must be in the past";
      }
      // Check if date is valid
      if (isNaN(birthDate.getTime())) {
        errors.birthDate = "Invalid date format";
      }
    }

    // Bio length validation
    if (formData.bio && formData.bio.length > 500) {
      errors.bio = "Bio must be less than 500 characters";
    }

    // About length validation
    if (formData.about && formData.about.length > 2000) {
      errors.about = "About must be less than 2000 characters";
    }

    // Validate URLs in social links
    Object.entries(formData.socialLinks).forEach(([key, value]) => {
      if (value && !/^https?:\/\/[^\s]+/.test(value)) {
        errors[`socialLinks.${key}`] = "Invalid URL format";
      }
    });

    // Validate company website if provided
    if (formData.companyWebsite && !/^https?:\/\/[^\s]+/.test(formData.companyWebsite)) {
      errors.companyWebsite = "Invalid URL format";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clean social links before submitting
  const cleanSocialLinks = (links) => {
    const cleaned = {};
    Object.entries(links).forEach(([key, value]) => {
      // Only include non-empty values
      if (value && value.trim()) {
        cleaned[key] = value.trim();
      }
    });
    return cleaned;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      const loadingToast = toast.loading("Saving changes...");

      // Format interests properly
      const formattedInterests = formData.interests.map(interest => {
        if (typeof interest === 'string') {
          return { name: interest, strength: 5 };
        }
        return interest;
      });

      // We don't need to handle profile image separately anymore
      // The image is already uploaded to the server when the user selects it
      // We just need to make sure we don't send any blob URLs or file objects to the backend

      // Handle profile picture
      let profilePictureData = formData.profilePicture;

      // Handle profile picture removal or update
      if (formData.removeProfilePicture) {
        // If the removeProfilePicture flag is set, explicitly set profilePicture to null
        // This ensures the backend knows to remove the profile picture
        profilePictureData = null;
      } else if (!profilePictureData) {
        // If profilePictureData is null or undefined but removeProfilePicture is not set,
        // we should exclude profilePicture from the update to avoid overwriting it
        profilePictureData = undefined;
      } else if (profilePictureData && typeof profilePictureData === 'string') {
        // If it's a string URL, ensure it's properly formatted as an object for the backend
        if (profilePictureData.startsWith('blob:')) {
          // Don't send blob URLs to the backend
          profilePictureData = undefined;
        } else {
          // Format as object with url property
          profilePictureData = {
            url: profilePictureData,
            publicId: user?.profilePicture?.publicId || null
          };
        }
      } else if (profilePictureData && typeof profilePictureData === 'object' && !profilePictureData.url) {
        // If it's an object but doesn't have a url property, it might be invalid
        profilePictureData = undefined;
      }

      // Clean the form data
      const cleanedFormData = {
        ...formData,
        interests: formattedInterests,
        socialLinks: cleanSocialLinks(formData.socialLinks),
        // Convert birthDate string to Date object if it exists
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
        // Set the properly formatted profilePicture
        profilePicture: profilePictureData,
        // Remove fields that shouldn't be sent to the backend
        profileImageFile: undefined,
        removeProfilePicture: undefined
      };

      // Fix companySize format if it includes "employees"
      if (cleanedFormData.companySize && cleanedFormData.companySize.includes(" employees")) {
        cleanedFormData.companySize = cleanedFormData.companySize.replace(/ employees$/, "");
      }

      // profilePicture is already set in cleanedFormData above
      // We don't need to do anything else with it here

      // Remove any undefined values to prevent issues
      Object.keys(cleanedFormData).forEach(key => {
        // Only remove undefined values
        // Keep null values for fields that should be explicitly cleared (like profilePicture)
        if (cleanedFormData[key] === undefined) {
          delete cleanedFormData[key];
        }
      });

      // We don't need to upload the profile image here anymore
      // It's already uploaded when the user selects it

      await updateProfile(cleanedFormData);
      toast.dismiss(loadingToast);
      toast.success("Profile updated successfully");
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
      console.error("Failed to update profile:", error);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, type: "spring", damping: 25, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2, ease: "easeInOut" } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  // We're using layoutId for the tab indicator, so we don't need these variants

  // Tab content animation variants
  const tabContentVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 10, transition: { duration: 0.2 } }
  };

  const tabs = [
    { id: "basics", label: "Profile Basics", icon: FiUser },
    { id: "details", label: "Profile Details", icon: FiInfo },
    { id: "interests", label: "Skills & Interests", icon: FiHeart },
    { id: "social", label: "Social Links", icon: FiLink },
    { id: "location", label: "Location", icon: FiMapPin },
    { id: "professional", label: "Professional", icon: FiBriefcase },
    { id: "role", label: "Role Details", icon: FiSettings }
  ];

  // Filter tabs based on user role
  const filteredTabs = tabs.filter(tab => {
    // Everyone sees profile basics, details, interests, social links, and location
    if (['basics', 'details', 'interests', 'social', 'location'].includes(tab.id)) {
      return true;
    }

    // Only show professional tab for relevant roles
    if (tab.id === 'professional') {
      return ['startupOwner', 'investor', 'agency', 'freelancer', 'jobseeker'].includes(user?.role);
    }

    // Only show role details tab for roles that have specific details
    if (tab.id === 'role') {
      return ['startupOwner', 'investor', 'agency', 'freelancer', 'jobseeker'].includes(user?.role);
    }

    return false;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="h-full fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-[12px]"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex items-center justify-center w-full px-4 py-6">
            <motion.div
              className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden fixed top-[5rem] border border-gray-100"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)"
              }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full opacity-20 -mr-32 -mt-32 z-0"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full opacity-20 -ml-32 -mb-32 z-0"></div>

              {/* Header */}
              <motion.div
                className="relative z-10 p-6 bg-gradient-to-r from-violet-100/50 to-white border-b border-gray-100 flex justify-between items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
              >
                <div>
                  <motion.h2
                    className="text-2xl font-bold text-gray-800 flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <motion.span
                      className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shadow-sm"
                      initial={{ scale: 0.8, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
                    >
                      <FiUser className="w-5 h-5 text-violet-600" />
                    </motion.span>
                    <span className="bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">Edit Profile</span>
                  </motion.h2>
                  <motion.p
                    className="text-gray-500 mt-1 ml-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    Update your personal information and preferences
                  </motion.p>
                </div>
                <motion.button
                  onClick={onClose}
                  className="text-gray-400 hover:text-violet-600 p-2 rounded-full hover:bg-violet-50 transition-all duration-200"
                  aria-label="Close modal"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, rotate: 45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <HiX className="w-6 h-6" />
                </motion.button>
              </motion.div>

              {/* Tabs */}
              <motion.div
                className="relative z-10 border-b border-gray-100 px-6 bg-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="flex space-x-1 py-2 w-full overflow-x-auto hide-scrollbar">
                  {filteredTabs.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center space-x-1.5 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                          isActive
                            ? "text-violet-700"
                            : "text-gray-500 hover:text-violet-600"
                        }`}
                        whileHover={{
                          backgroundColor: isActive ? "rgba(237, 233, 254, 0.4)" : "rgba(237, 233, 254, 0.2)",
                          y: -1
                        }}
                        whileTap={{ y: 0, backgroundColor: "rgba(237, 233, 254, 0.5)" }}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: 0.1 + (index * 0.05), duration: 0.2 }
                        }}
                      >
                        {/* Active tab background */}
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 bg-violet-50/80 rounded-md border border-violet-100/50"
                            layoutId="tabBackground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}

                        <motion.div
                          className="flex items-center space-x-1.5 relative z-10"
                          animate={isActive ? { scale: 1.02 } : { scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? "text-violet-600" : "text-gray-400"}`} />
                          <span className="whitespace-nowrap">{tab.label}</span>
                        </motion.div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Bottom indicator line */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-100">
                  <motion.div
                    className="absolute bottom-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"
                    layoutId="tabIndicator"
                    style={{
                      left: `${(100 / filteredTabs.length) * filteredTabs.findIndex(t => t.id === activeTab)}%`,
                      width: `${100 / filteredTabs.length}%`
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </div>
              </motion.div>

              {/* Content */}
              <motion.div
                className="relative z-10 p-6 max-h-[calc(100vh-20rem)] overflow-y-auto bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  <AnimatePresence mode="wait">
                    {activeTab === "basics" && (
                      <motion.div
                        key="basics-tab"
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <ProfileBasicsSection
                          formData={formData}
                          setFormData={setFormData}
                          validationErrors={validationErrors}
                          setValidationErrors={setValidationErrors}
                          setHasUnsavedChanges={setHasUnsavedChanges}
                        />
                      </motion.div>
                    )}
                    {activeTab === "details" && (
                      <motion.div
                        key="details-tab"
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <ProfileDetailsSection
                          formData={formData}
                          setFormData={setFormData}
                          validationErrors={validationErrors}
                          setValidationErrors={setValidationErrors}
                          setHasUnsavedChanges={setHasUnsavedChanges}
                        />
                      </motion.div>
                    )}
                    {activeTab === "interests" && (
                      <motion.div
                        key="interests-tab"
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <SkillsInterestsSection
                          formData={formData}
                          setFormData={setFormData}
                          validationErrors={validationErrors}
                          setValidationErrors={setValidationErrors}
                          setHasUnsavedChanges={setHasUnsavedChanges}
                        />
                      </motion.div>
                    )}
                    {activeTab === "social" && (
                      <motion.div
                        key="social-tab"
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <SocialLinksSection
                          formData={formData}
                          setFormData={setFormData}
                          validationErrors={validationErrors}
                          setValidationErrors={setValidationErrors}
                          setHasUnsavedChanges={setHasUnsavedChanges}
                        />
                      </motion.div>
                    )}
                    {activeTab === "location" && (
                      <motion.div
                        key="location-tab"
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <LocationSection
                          formData={formData}
                          setFormData={setFormData}
                          validationErrors={validationErrors}
                          setValidationErrors={setValidationErrors}
                          setHasUnsavedChanges={setHasUnsavedChanges}
                        />
                      </motion.div>
                    )}
                    {activeTab === "professional" && (
                      <motion.div
                        key="professional-tab"
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <ProfessionalSection
                          formData={formData}
                          setFormData={setFormData}
                          validationErrors={validationErrors}
                          setValidationErrors={setValidationErrors}
                          setHasUnsavedChanges={setHasUnsavedChanges}
                        />
                      </motion.div>
                    )}
                    {activeTab === "role" && (
                      <motion.div
                        key="role-tab"
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <RoleSpecificSection
                          formData={formData}
                          setFormData={setFormData}
                          setHasUnsavedChanges={setHasUnsavedChanges}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </motion.div>

              {/* Footer */}
              <motion.div
                className="relative z-10 flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-white to-violet-50/30 rounded-b-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <div className="flex text-sm">
                  <AnimatePresence mode="wait">
                    {hasUnsavedChanges && (
                      <motion.span
                        key="profile-unsaved-changes"
                        className="text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 flex items-center gap-1 shadow-sm"
                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -10 }}
                        transition={{ duration: 0.3, type: "spring" }}
                      >
                        <FiInfo className="w-4 h-4" />
                        You have unsaved changes
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex space-x-4">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow font-medium"
                    disabled={authLoading}
                    whileHover={{ y: -2, backgroundColor: "#f9fafb" }}
                    whileTap={{ y: 0, scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.2 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={authLoading || !hasUnsavedChanges}
                    className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg hover:from-violet-700 hover:to-violet-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow font-medium"
                    whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                    whileTap={{ y: 0, scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.2 }}
                  >
                    {authLoading ? (
                      <>
                        <LoaderComponent size="small" color="white" text="" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <motion.div
                          initial={{ rotate: -10, scale: 0.9 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FiSave className="w-5 h-5" />
                        </motion.div>
                        <span>Save Changes</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;
