"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/contexts/auth-context";
import Image from "next/image";
import {
  FiAlertCircle,
  FiCheck,
  FiUser,
  FiPhone,
  FiMail,
  FiCamera,
  FiEdit3,
  FiTrash2,
  FiX,
  FiShield,
} from "react-icons/fi";
import LoaderComponent from "../../../UI/LoaderComponent";
import { optimizeImage } from "@/lib/utils/image/file-upload";
// Import the updateProfilePicture function from the appropriate service
// import { updateProfilePicture } from "../../../../Services/userService";
import toast from "react-hot-toast";
import logger from "@/lib/utils/logger";

const ProfileBasicsSection = ({
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
  setHasUnsavedChanges,
}) => {
  const { user, updateProfilePicture } = useAuth();
  const fileInputRef = useRef(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");

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

  // Handle profile image upload
  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error("No file selected");
      return;
    }

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, or WEBP)");
      return;
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    try {
      // Set loading state to true
      setImageLoading(true);

      // Optimize the image
      const optimizedFile = await optimizeImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
      });

      // Create a local preview immediately for better UX
      const localPreview = URL.createObjectURL(optimizedFile);

      // Create FormData for upload
      const formDataToUpload = new FormData();
      formDataToUpload.append("profileImage", optimizedFile);

      // Upload the image to the server
      const result = await updateProfilePicture(formDataToUpload);

      if (result && result.success) {
        // Use the server URL for the profile picture
        // Check both the url property and the profilePicture object
        const serverUrl = result.url || result.profilePicture?.url || result.profilePicture;

        // Update the form data with the server URL as an object with url property
        setFormData((prev) => ({
          ...prev,
          profilePicture: {
            url: serverUrl,
            publicId: result.profilePicture?.publicId || null
          },
          // We don't need to store the file anymore since it's already uploaded
          profileImageFile: null,
        }));

        // Revoke the local blob URL to free up memory
        URL.revokeObjectURL(localPreview);

        setHasUnsavedChanges(true);
        toast.success("Profile picture updated successfully");
      } else {
        // If server upload fails, use the local preview
        setFormData((prev) => ({
          ...prev,
          profilePicture: localPreview,
          profileImageFile: optimizedFile, // Store the file for later submission
        }));

        setHasUnsavedChanges(true);
        toast("Image saved locally. Changes will be applied when you save the form.", {
          icon: '⚠️',
          style: {
            backgroundColor: '#FEF3C7',
            color: '#92400E'
          }
        });
      }
    } catch (err) {
      toast.error(
        "Image processing failed: " + (err.message || "Unknown error")
      );
      logger.error("Image processing error:", err);
    } finally {
      // Always set loading state back to false when done
      setImageLoading(false);
      setShowImageOptions(false);
    }
  };

  const handleRemoveProfileImage = async () => {
    try {
      // Set loading state
      setImageLoading(true);

      // If the profile picture is a blob URL, revoke it to free up memory
      if (
        typeof formData.profilePicture === "string" &&
        formData.profilePicture.startsWith("blob:")
      ) {
        URL.revokeObjectURL(formData.profilePicture);
      }

      // Update the form data locally first for immediate UI feedback
      setFormData((prev) => ({
        ...prev,
        profilePicture: null,
        profileImageFile: null,
      }));

      // If the user has a profile picture on the server, we need to update it
      if (user?.profilePicture) {
        // Call the updateProfile function to remove the profile picture
        const result = await updateProfile({ profilePicture: null });

        if (result && result.success) {
          toast.success("Profile picture removed successfully");
        } else {
          // If the server update fails, we'll still keep the local state updated
          // but inform the user that they need to save the form
          toast("Profile picture will be removed when you save the form", {
            icon: '⚠️',
            style: {
              backgroundColor: '#FEF3C7',
              color: '#92400E'
            }
          });
          setFormData((prev) => ({
            ...prev,
            removeProfilePicture: true, // Set flag for form submission
          }));
          setHasUnsavedChanges(true);
        }
      } else {
        // If there's no profile picture on the server, just update the local state
        toast.success("Profile picture removed");
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      toast.error("Failed to remove profile picture: " + (error.message || "Unknown error"));
      logger.error("Error removing profile picture:", error);
    } finally {
      setImageLoading(false);
      setShowImageOptions(false);
    }
  };

  // Email verification functions
  const handleSendEmailVerification = async () => {
    if (!formData.email) {
      toast.error("Please enter an email address first");
      return;
    }

    setVerificationLoading(true);
    setVerificationError("");

    try {
      // Simulate API call to send verification code
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real implementation, you would call your API here
      // const response = await sendEmailVerificationCode(formData.email);

      setShowEmailVerification(true);
      toast.success("Verification code sent to your email");
    } catch (error) {
      setVerificationError(
        "Failed to send verification code. Please try again."
      );
      toast.error("Failed to send verification code");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode) {
      setVerificationError("Please enter the verification code");
      return;
    }

    setVerificationLoading(true);
    setVerificationError("");

    try {
      // Simulate API call to verify code
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real implementation, you would call your API here
      // const response = await verifyEmailCode(formData.email, verificationCode);

      // Simulate successful verification
      if (verificationCode === "123456") {
        // Update user context in a real implementation
        // updateUser({ ...user, isEmailVerified: true });

        toast.success("Email verified successfully");
        setShowEmailVerification(false);
        setVerificationCode("");
      } else {
        setVerificationError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      setVerificationError("Failed to verify code. Please try again.");
      toast.error("Verification failed");
    } finally {
      setVerificationLoading(false);
    }
  };

  // Phone verification functions
  const handleSendPhoneVerification = async () => {
    if (!formData.phone) {
      toast.error("Please enter a phone number first");
      return;
    }

    setVerificationLoading(true);
    setVerificationError("");

    try {
      // Simulate API call to send verification code
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real implementation, you would call your API here
      // const response = await sendPhoneVerificationCode(formData.phone);

      setShowPhoneVerification(true);
      toast.success("Verification code sent to your phone");
    } catch (error) {
      setVerificationError(
        "Failed to send verification code. Please try again."
      );
      toast.error("Failed to send verification code");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!verificationCode) {
      setVerificationError("Please enter the verification code");
      return;
    }

    setVerificationLoading(true);
    setVerificationError("");

    try {
      // Simulate API call to verify code
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real implementation, you would call your API here
      // const response = await verifyPhoneCode(formData.phone, verificationCode);

      // Simulate successful verification
      if (verificationCode === "123456") {
        // Update user context in a real implementation
        // updateUser({ ...user, isPhoneVerified: true });

        toast.success("Phone verified successfully");
        setShowPhoneVerification(false);
        setVerificationCode("");
      } else {
        setVerificationError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      setVerificationError("Failed to verify code. Please try again.");
      toast.error("Verification failed");
    } finally {
      setVerificationLoading(false);
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
      {/* Profile Basics Section */}
      <motion.div
        className="bg-white rounded-xl shadow-sm border border-gray-50 p-6 overflow-hidden relative"
        whileHover={{ boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}
        transition={{ duration: 0.3 }}
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-md bg-violet-50 flex items-center justify-center mr-3 shadow-sm">
                <FiUser className="h-4 w-4 text-violet-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-800">
                Profile Basics
              </h4>
            </div>

            {user?.role && (
              <motion.div
                className="inline-flex items-center px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium border border-violet-100/50 shadow-sm"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
              >
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-violet-500"></span>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </motion.div>
            )}
          </div>

          {/* Profile Image and Name Layout */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="w-36 h-36 rounded-full overflow-hidden border border-gray-100 shadow-md flex items-center justify-center bg-gray-50 relative"
                  onMouseEnter={() => setShowImageOptions(true)}
                  onMouseLeave={() => setShowImageOptions(false)}
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none"></div>

                  {imageLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm z-10">
                      <LoaderComponent size="small" color="violet" text="" />
                    </div>
                  ) : null}

                  {formData.profilePicture ? (
                    <div className="relative w-full h-full">
                      {/* Render profile image based on its type */}
                      {(() => {
                        try {
                          // Case 1: Blob URL (local file preview)
                          if (
                            typeof formData.profilePicture === "string" &&
                            formData.profilePicture.startsWith("blob:")
                          ) {
                            return (
                              <img
                                src={formData.profilePicture}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            );
                          }

                          // Case 2: String URL (server URL)
                          if (typeof formData.profilePicture === "string") {
                            return (
                              <Image
                                src={formData.profilePicture}
                                alt="Profile"
                                fill
                                sizes="144px"
                                className="object-cover"
                                priority
                                onError={() => {
                                  console.error(
                                    "Failed to load image:",
                                    formData.profilePicture
                                  );
                                }}
                              />
                            );
                          }

                          // Case 3: Object with URL property
                          if (
                            formData.profilePicture &&
                            formData.profilePicture.url
                          ) {
                            return (
                              <Image
                                src={formData.profilePicture.url}
                                alt="Profile"
                                fill
                                sizes="144px"
                                className="object-cover"
                                priority
                                onError={() => {
                                  console.error(
                                    "Failed to load image:",
                                    formData.profilePicture.url
                                  );
                                }}
                              />
                            );
                          }

                          // Fallback: If we can't determine the type
                          return (
                            <div className="w-full h-full flex items-center justify-center bg-violet-50">
                              <FiUser className="w-16 h-16 text-violet-300" />
                            </div>
                          );
                        } catch (error) {
                          console.error(
                            "Error rendering profile image:",
                            error
                          );
                          return (
                            <div className="w-full h-full flex items-center justify-center bg-violet-50">
                              <FiUser className="w-16 h-16 text-violet-300" />
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-50 to-gray-50">
                      <FiUser className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  {/* Hover overlay with options */}
                  <AnimatePresence>
                    {showImageOptions && !imageLoading && (
                      <motion.div
                        className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-[2px] flex items-center justify-center gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-3 bg-white rounded-full text-violet-600 hover:bg-violet-50 transition-all duration-200 shadow-sm"
                          whileHover={{
                            scale: 1.08,
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                          }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="Change profile picture"
                        >
                          <FiEdit3 className="w-5 h-5" />
                        </motion.button>

                        {formData.profilePicture && (
                          <motion.button
                            type="button"
                            onClick={handleRemoveProfileImage}
                            className="p-3 bg-white rounded-full text-red-500 hover:bg-red-50 transition-all duration-200 shadow-sm"
                            whileHover={{
                              scale: 1.08,
                              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                            }}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Remove profile picture"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfileImageChange}
                  className="hidden"
                  accept="image/*"
                  disabled={imageLoading}
                />
              </motion.div>

              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageLoading}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-violet-600 bg-violet-50 rounded-full hover:bg-violet-100 transition-all duration-200 shadow-sm border border-violet-100/50"
                whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.05)" }}
                whileTap={{ y: 0 }}
                aria-label={
                  formData.profilePicture
                    ? "Change profile picture"
                    : "Upload profile picture"
                }
              >
                <FiCamera className="w-3.5 h-3.5" />
                {formData.profilePicture ? "Change Photo" : "Upload Photo"}
              </motion.button>

              <p className="mt-2 text-xs text-gray-400 text-center max-w-[180px]">
                Square image, 400×400px or larger
              </p>
            </div>

            {/* Basic Info Fields */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                  First Name
                  <span className="text-violet-600 text-xs bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100/50">
                    Required
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-gray-900 text-sm transition-all duration-200 border focus:ring-1 focus:ring-violet-400 focus:border-violet-400 bg-white
                      ${getStatusStyles(getInputStatus("firstName"))}`}
                    maxLength={50}
                    placeholder="Your first name"
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
              </motion.div>

              {/* Last Name */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                  Last Name
                  <span className="text-violet-600 text-xs bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100/50">
                    Required
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-gray-900 text-sm transition-all duration-200 border focus:ring-1 focus:ring-violet-400 focus:border-violet-400 bg-white
                      ${getStatusStyles(getInputStatus("lastName"))}`}
                    maxLength={50}
                    placeholder="Your last name"
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
              </motion.div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                  Email
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex items-center
                    ${
                      user?.isEmailVerified
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
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
                    className={`w-full pl-10 pr-24 py-2.5 rounded-lg border text-gray-900 text-sm transition-colors bg-white
                      ${getStatusStyles(getInputStatus("email"))}`}
                    placeholder="your@email.com"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <FiMail className="w-4 h-4" />
                  </div>
                  {!user?.isEmailVerified && formData.email && (
                    <motion.button
                      type="button"
                      onClick={handleSendEmailVerification}
                      disabled={verificationLoading}
                      className="absolute right-2 top-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1.5 rounded-md transition-colors shadow-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {verificationLoading ? (
                        <span className="flex items-center">
                          <LoaderComponent size="tiny" color="violet" text="" />
                          <span className="ml-1">Sending...</span>
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <FiShield className="w-3 h-3 mr-1" />
                          Verify Now
                        </span>
                      )}
                    </motion.button>
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

              {/* Email Verification Modal */}
              <AnimatePresence>
                {showEmailVerification && (
                  <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() =>
                      !verificationLoading && setShowEmailVerification(false)
                    }
                  >
                    <motion.div
                      className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full"
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Verify Your Email
                        </h3>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500"
                          onClick={() =>
                            !verificationLoading &&
                            setShowEmailVerification(false)
                          }
                          disabled={verificationLoading}
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-4">
                          We've sent a verification code to{" "}
                          <span className="font-medium">{formData.email}</span>.
                          Please enter the code below to verify your email
                          address.
                        </p>

                        <div className="space-y-3">
                          <label className="text-sm font-medium text-gray-700">
                            Verification Code
                          </label>
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) =>
                              setVerificationCode(e.target.value)
                            }
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 bg-white"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            disabled={verificationLoading}
                          />
                          {verificationError && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <FiAlertCircle className="w-3 h-3" />
                              {verificationError}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            For testing, use code: 123456
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          onClick={() => setShowEmailVerification(false)}
                          disabled={verificationLoading}
                        >
                          Cancel
                        </button>
                        <motion.button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center min-w-[100px]"
                          onClick={handleVerifyEmail}
                          disabled={verificationLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {verificationLoading ? (
                            <LoaderComponent
                              size="small"
                              color="white"
                              text=""
                            />
                          ) : (
                            <span className="flex items-center">
                              <FiCheck className="w-4 h-4 mr-1.5" />
                              Verify
                            </span>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                  Phone
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex items-center
                    ${
                      user?.isPhoneVerified
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
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
                    className={`w-full pl-10 pr-24 py-2.5 rounded-lg border text-gray-900 text-sm transition-colors bg-white
                      ${getStatusStyles(getInputStatus("phone"))}`}
                    placeholder="+1 (555) 123-4567"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <FiPhone className="w-4 h-4" />
                  </div>
                  {!user?.isPhoneVerified && formData.phone && (
                    <motion.button
                      type="button"
                      onClick={handleSendPhoneVerification}
                      disabled={verificationLoading}
                      className="absolute right-2 top-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1.5 rounded-md transition-colors shadow-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {verificationLoading ? (
                        <span className="flex items-center">
                          <LoaderComponent size="tiny" color="violet" text="" />
                          <span className="ml-1">Sending...</span>
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <FiShield className="w-3 h-3 mr-1" />
                          Verify Now
                        </span>
                      )}
                    </motion.button>
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

              {/* Phone Verification Modal */}
              <AnimatePresence>
                {showPhoneVerification && (
                  <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() =>
                      !verificationLoading && setShowPhoneVerification(false)
                    }
                  >
                    <motion.div
                      className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full"
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Verify Your Phone
                        </h3>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500"
                          onClick={() =>
                            !verificationLoading &&
                            setShowPhoneVerification(false)
                          }
                          disabled={verificationLoading}
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-4">
                          We've sent a verification code to{" "}
                          <span className="font-medium">{formData.phone}</span>.
                          Please enter the code below to verify your phone
                          number.
                        </p>

                        <div className="space-y-3">
                          <label className="text-sm font-medium text-gray-700">
                            Verification Code
                          </label>
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) =>
                              setVerificationCode(e.target.value)
                            }
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 bg-white"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            disabled={verificationLoading}
                          />
                          {verificationError && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <FiAlertCircle className="w-3 h-3" />
                              {verificationError}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            For testing, use code: 123456
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          onClick={() => setShowPhoneVerification(false)}
                          disabled={verificationLoading}
                        >
                          Cancel
                        </button>
                        <motion.button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center min-w-[100px]"
                          onClick={handleVerifyPhone}
                          disabled={verificationLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {verificationLoading ? (
                            <LoaderComponent
                              size="small"
                              color="white"
                              text=""
                            />
                          ) : (
                            <span className="flex items-center">
                              <FiCheck className="w-4 h-4 mr-1.5" />
                              Verify
                            </span>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* End of form fields */}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileBasicsSection;
