"use client";

import React, { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import LoaderComponent from "../../../Components/UI/LoaderComponent";

const ProfileImageUpload = forwardRef(
  ({ profileImagePreview, imageLoading, handleProfileImageChange, disabled, user }, ref) => {
    const [imgError, setImgError] = useState(false);

    const handleClick = () => {
      if (!disabled && ref.current) {
        ref.current.click();
      }
    };

    // Get the profile image URL with proper fallback logic
    const getProfileImageUrl = () => {
      // First priority: preview image (when user is uploading new image)
      if (profileImagePreview) {
        return profileImagePreview;
      }

      // Second priority: existing user profile picture
      if (user?.profilePicture?.url && !imgError) {
        return user.profilePicture.url;
      }

      // Third priority: string profile picture (legacy support)
      if (typeof user?.profilePicture === 'string' && user.profilePicture && !imgError) {
        return user.profilePicture;
      }

      // Fourth priority: Google profile picture (for OAuth users)
      if (user?.googleProfile?.profilePicture && !imgError) {
        return user.googleProfile.profilePicture;
      }

      return null;
    };

    // Generate initials as fallback
    const getInitials = () => {
      if (!user) return 'U';
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    };

    const profileImageUrl = getProfileImageUrl();
    const initials = getInitials();

    return (
      <motion.div
        className="flex flex-col items-center w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative w-36 h-36 cursor-pointer mb-4" onClick={handleClick}>
          {/* Profile Image Container */}
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-violet-100 shadow-sm transition-all duration-300 group hover:border-violet-300">
            {imageLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-violet-50">
                <LoaderComponent size="small" color="violet" text="" />
              </div>
            ) : profileImageUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={profileImageUrl}
                  alt="Profile Preview"
                  fill
                  className="object-cover"
                  priority
                  onError={() => setImgError(true)}
                  unoptimized={profileImageUrl.includes('ui-avatars.com')}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-violet-50">
                <div className="text-center">
                  {/* Show initials if user exists, otherwise show default icon */}
                  {user ? (
                    <div className="text-2xl font-bold text-violet-600">
                      {initials}
                    </div>
                  ) : (
                    <svg className="w-16 h-16 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
              </div>
            )}

            {/* Hover Overlay */}
            {!imageLoading && (
              <div className="absolute inset-0 rounded-full bg-violet-900 bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                <div className="text-white text-center">
                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs font-medium">{profileImageUrl ? "Change Photo" : "Add Photo"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={ref}
          onChange={handleProfileImageChange}
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          disabled={disabled || imageLoading}
        />

        {/* Upload Button */}
        <motion.button
          type="button"
          onClick={handleClick}
          disabled={disabled || imageLoading}
          className={`text-sm ${disabled || imageLoading ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-violet-700 bg-violet-50 hover:bg-violet-100'} px-4 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2 border border-violet-100 shadow-sm`}
          whileHover={!disabled && !imageLoading ? { y: -1 } : {}}
          whileTap={!disabled && !imageLoading ? { y: 0 } : {}}
        >
          {imageLoading ? (
            <>
              <div className="h-4 w-4 mr-1.5"><LoaderComponent size="small" color="violet" text="" /></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
              </svg>
              <span>{profileImageUrl ? "Change Profile Picture" : "Upload Profile Picture"}</span>
            </>
          )}
        </motion.button>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 mt-2 text-center max-w-xs">
          Upload a clear photo of yourself. A professional headshot works best.
        </p>
      </motion.div>
    );
  }
);

ProfileImageUpload.displayName = "ProfileImageUpload";

export default ProfileImageUpload;