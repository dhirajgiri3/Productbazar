import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/lib/contexts/auth-context";
import { validateImageFile, optimizeImage } from '../../../../Utils/authFileUpload';

function Banner() {
  const { user, updateBannerImage, getCurrentUser } = useAuth();
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  
  const defaultBanner = "/Assets/Image/ProfileBg.png";
  const bannerImageUrl = user?.bannerImage?.url || defaultBanner;

  const handleBannerUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    await processAndUploadFile(file);
  };

  const processAndUploadFile = async (file) => {
    // Validate the file
    const validation = validateImageFile(file, {
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    });
    
    if (!validation.valid) {
      setUploadError(validation.error);
      setTimeout(() => setUploadError(''), 4000);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
    
    try {
      setIsUploading(true);
      setUploadError('');
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Optimize the image before upload
      const optimizedImage = await optimizeImage(file, {
        maxWidth: 1500,
        maxHeight: 500,
        quality: 0.85,
        format: 'webp'
      });
      
      // Create FormData and append the optimized image
      const formData = new FormData();
      formData.append('bannerImage', optimizedImage);
      
      // Upload the banner image
      const success = await updateBannerImage(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (success) {
        setUploadSuccess(true);
        setPreviewImage(null);
        setTimeout(() => {
          setUploadSuccess(false);
          setUploadProgress(0);
        }, 3000);
        await getCurrentUser(); // Refresh user data to get the updated banner
      } else {
        setUploadError('Failed to update banner image');
        setTimeout(() => setUploadError(''), 4000);
      }
    } catch (error) {
      console.error('Banner upload error:', error);
      setUploadError(error.message || 'Failed to update banner image');
      setTimeout(() => setUploadError(''), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragging(true);
    }
  }, [isUploading]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isUploading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndUploadFile(e.dataTransfer.files[0]);
    }
  }, [isUploading]);

  // Cancel upload preview
  const cancelUpload = () => {
    setPreviewImage(null);
  };

  return (
    <div className="relative w-full">
      {/* Banner Image Container */}
      <div 
        className={`relative h-48 md:h-64 w-full overflow-hidden rounded-xl transition-all duration-300 ${isDragging ? 'ring-4 ring-violet-400' : ''}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        role="button"
        aria-label="Update banner image"
        onClick={() => !isUploading && triggerFileInput()}
        onKeyDown={(e) => e.key === 'Enter' && !isUploading && triggerFileInput()}
      >
        {/* Banner Image */}
        <Image
          src={previewImage || bannerImageUrl}
          alt="Profile Banner"
          fill
          priority
          style={{ objectFit: "cover" }}
          className={`transition-all duration-500 ${isHovering || isDragging ? 'scale-105' : 'scale-100'}`}
        />
        
        {/* Drag & Drop Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center z-20"
            >
              <div className="bg-white rounded-xl p-6 text-center">
                <svg className="w-12 h-12 text-violet-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <p className="text-gray-800 font-medium">Drop your image here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Hover Overlay */}
        <AnimatePresence>
          {(isHovering && !isUploading && !isDragging) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10 flex items-center justify-center"
            >
              <div className="absolute bottom-0 w-full p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">Click or drag image to update banner</p>
                  <p className="text-white/80 text-xs">Recommended size: 1500×500px</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white hover:bg-violet-50 text-gray-800 rounded-full p-3 shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="hidden sm:inline font-medium">Update Banner</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Mobile Edit Button (always visible on mobile) */}
        <div className="absolute top-4 right-4 sm:hidden z-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isUploading) triggerFileInput();
            }}
            className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full p-2 shadow-md"
            aria-label="Edit banner image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </motion.button>
        </div>
        
        {/* Preview Controls */}
        <AnimatePresence>
          {previewImage && !isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30"
            >
              <p className="text-white font-medium mb-6">Preview</p>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    processAndUploadFile(fileInputRef.current.files[0]);
                  }}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg font-medium"
                >
                  Confirm
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelUpload();
                  }}
                  className="bg-white hover:bg-gray-100 text-gray-700 px-5 py-2 rounded-lg font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Loading Overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex items-center justify-center z-30"
            >
              <div className="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center max-w-xs w-full">
                <div className="mb-4 w-full">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium text-gray-700">Uploading banner</p>
                    <p className="text-sm font-medium text-gray-700">{uploadProgress}%</p>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-violet-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ type: "tween" }}
                    />
                  </div>
                </div>
                <p className="text-gray-500 text-sm text-center">Please wait while we process your image</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Hidden File Input */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleBannerUpload}
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          aria-label="Upload banner image"
        />
      </div>
      
      {/* Error Message */}
      <AnimatePresence>
        {uploadError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-lg text-sm max-w-sm w-full flex justify-between"
          >
            <div className="flex gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{uploadError}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setUploadError('');
              }}
              className="text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Message */}
      <AnimatePresence>
        {uploadSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-md shadow-lg text-sm max-w-sm w-full flex justify-between items-center"
          >
            <div className="flex gap-2 items-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Banner updated successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Banner;