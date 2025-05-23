"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FiCamera, FiUpload, FiTrash2 } from "react-icons/fi";
import { useAuth } from "@/lib/contexts/auth-context";
import { optimizeImage } from "../../../../Utils/Image/imageUtils";
import toast from "react-hot-toast";

const ProfileImageSection = ({ formData, setFormData, setHasUnsavedChanges }) => {
  const { user, updateProfilePicture } = useAuth();
  const [previewImage, setPreviewImage] = useState(formData.profilePicture?.url || user?.profilePicture?.url || "");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file.type.match(/image\/(jpeg|png|gif|webp)/)) {
      toast.error("Please upload a valid image (JPEG, PNG, GIF, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large (max 10MB)");
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading("Processing image...");

    try {
      const optimizedFile = await optimizeImage(file, 1200, 2);
      const formDataImage = new FormData();
      formDataImage.append("profileImage", optimizedFile);

      const updatedProfile = await updateProfilePicture(formDataImage);
      if (updatedProfile?.success) {
        // Get the URL from either the url property or from the profilePicture object
        const imageUrl = updatedProfile.url || updatedProfile.profilePicture?.url;
        if (imageUrl) {
          setFormData((prev) => ({
            ...prev,
            profilePicture: { url: imageUrl }
          }));
          setPreviewImage(imageUrl);
          setHasUnsavedChanges(true);
        }
        toast.dismiss(loadingToast);
        toast.success("Profile picture updated successfully");
      } else {
        toast.dismiss(loadingToast);
        toast.error(updatedProfile?.message || "Failed to update profile picture");
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to update image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage("");
    setFormData((prev) => ({
      ...prev,
      profilePicture: null
    }));
    setHasUnsavedChanges(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Current Profile Picture */}
        <div className="relative group">
          <div className={`w-40 h-40 rounded-full overflow-hidden border-4 ${isDragging ? 'border-violet-500 border-dashed' : 'border-white'} shadow-lg transition-all duration-200`}>
            {previewImage ? (
              <Image
                src={previewImage}
                alt="Profile"
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
                <span className="text-4xl font-medium text-violet-300">
                  {formData.firstName?.charAt(0) || user?.firstName?.charAt(0) || "?"}
                </span>
              </div>
            )}
          </div>

          {/* Overlay Controls */}
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white rounded-full text-violet-600 hover:text-violet-700 hover:bg-violet-50 transition-colors"
              disabled={isUploading}
            >
              <FiCamera className="w-5 h-5" />
            </button>
            {previewImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-2 bg-white rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full max-w-md p-8 border-2 border-dashed rounded-xl text-center transition-colors ${
            isDragging ? 'border-violet-500 bg-violet-50' : 'border-gray-300 hover:border-violet-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
          />

          <FiUpload className={`w-8 h-8 mx-auto mb-4 ${isDragging ? 'text-violet-500' : 'text-gray-400'}`} />

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? "Drop your image here" : "Drag & drop your profile picture here"}
            </p>
            <p className="text-xs text-gray-500">or</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-violet-600 hover:text-violet-700"
              disabled={isUploading}
            >
              Browse files
            </button>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Maximum file size: 10MB (JPEG, PNG, GIF, WebP)
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileImageSection;