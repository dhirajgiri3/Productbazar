"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

/**
 * OptimizedGallery - A high-performance image gallery component
 *
 * @param {Object} props
 * @param {Array} props.images - Array of image objects or strings
 * @param {string} props.productName - Name of the product for alt text
 * @param {boolean} props.isOwner - Whether the current user is the owner
 * @param {Function} props.onManageClick - Callback for when the manage button is clicked
 */
const OptimizedGallery = ({
  images = [],
  productName = "Product",
  isOwner = false,
  onManageClick = () => {}
}) => {
  // Create a stable reference to the images array
  const imagesRef = useRef(images);

  // State for gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullScreenMode, setIsFullScreenMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Update images ref when images prop changes
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Process images to ensure consistent format
  const processedImages = images.map(image => {
    if (typeof image === 'string') {
      return { url: image };
    }
    return image;
  });

  // Handle image navigation
  const navigateImage = useCallback((direction) => {
    setCurrentImageIndex(prevIndex => {
      const newIndex = direction === 'next'
        ? Math.min(prevIndex + 1, processedImages.length - 1)
        : Math.max(prevIndex - 1, 0);
      return newIndex;
    });
  }, [processedImages.length]);

  // Handle keyboard navigation and touch gestures
  useEffect(() => {
    if (!isFullScreenMode) return;

    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFullScreenMode(false);
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      }
    };

    // Touch gesture handling
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      // Minimum swipe distance (in pixels) to trigger navigation
      const minSwipeDistance = 50;

      if (touchEndX < touchStartX - minSwipeDistance) {
        // Swiped left, go to next image
        navigateImage('next');
      } else if (touchEndX > touchStartX + minSwipeDistance) {
        // Swiped right, go to previous image
        navigateImage('prev');
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Clean up event listeners
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isFullScreenMode, navigateImage]);

  // Handle image loading state
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle image error
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Open fullscreen mode
  const openFullScreen = useCallback((index) => {
    setCurrentImageIndex(index);
    setIsFullScreenMode(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }, []);

  // Close fullscreen mode
  const closeFullScreen = useCallback(() => {
    setIsFullScreenMode(false);
    // Restore body scrolling
    document.body.style.overflow = 'auto';
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // If no images, show empty state
  if (!processedImages.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center p-8 bg-gradient-to-br from-violet-50 to-violet-100/30 rounded-2xl border border-dashed border-violet-200 my-8 flex flex-col items-center justify-center min-h-[300px]"
      >
        <div className="text-violet-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Images Available</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          This product doesn't have any gallery images yet.
        </p>
        {isOwner && (
          <motion.button
            onClick={onManageClick}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Images
          </motion.button>
        )}
      </motion.div>
    );
  }

  return (
    <>
      {/* Grid Gallery */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedImages.map((image, index) => (
            <motion.div
              key={`gallery-${image.url}-${index}`}
              className="relative group h-64 overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openFullScreen(index)}
              layoutId={`gallery-image-${index}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

              <div className="relative w-full h-full">
                <Image
                  src={image.url}
                  alt={`${productName} - ${image.caption || `Image ${index + 1}`}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading={index < 6 ? "eager" : "lazy"}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>

              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm font-medium">{image.caption}</p>
                </div>
              )}

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-full">
                  <ZoomIn className="h-4 w-4 text-gray-700" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {processedImages.length > 6 && (
          <div className="mt-6 text-center">
            <motion.button
              className="px-6 py-2.5 bg-violet-100 text-violet-700 rounded-full font-medium hover:bg-violet-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openFullScreen(0)}
            >
              View All Images
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Owner Controls */}
      {isOwner && (
        <div className="mt-6 flex justify-end">
          <motion.button
            onClick={onManageClick}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-violet-700"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Manage Gallery
          </motion.button>
        </div>
      )}

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullScreenMode && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeFullScreen}
          >
            {/* Large Close Button in Top-Right Corner */}
            <div className="absolute top-4 right-4 z-[60] flex flex-col items-center">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  closeFullScreen();
                }}
                className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white shadow-lg"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                aria-label="Close fullscreen view"
              >
                <X className="h-7 w-7" />
              </motion.button>
              <motion.span
                className="text-xs text-white/70 mt-2 bg-black/30 px-2 py-1 rounded-md hidden sm:block"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
              >
                Press ESC to close
              </motion.span>
            </div>
            <div
              className="relative w-full h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 flex justify-between items-center text-white">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium">
                    {currentImageIndex + 1} / {processedImages.length}
                  </h3>
                  {processedImages[currentImageIndex]?.caption && (
                    <p className="ml-4 text-gray-300 hidden sm:block">
                      {processedImages[currentImageIndex].caption}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isOwner && (
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFullScreen();
                        onManageClick();
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </motion.button>
                  )}

                  <motion.button
                    onClick={closeFullScreen}
                    className="p-2.5 rounded-full bg-black/30 hover:bg-black/50 text-white shadow-lg"
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </div>
              </div>

              {/* Image Container */}
              <div className="flex-1 flex justify-center items-center">
                {/* Mobile swipe hint */}
                <motion.div
                  className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  <div className="bg-black/40 text-white/80 text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Swipe to navigate
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </motion.div>
                <div className="relative w-full h-full max-w-5xl max-h-[80vh] mx-auto flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`fullscreen-${currentImageIndex}`}
                      className="relative w-full h-full flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                        </div>
                      )}

                      <Image
                        src={processedImages[currentImageIndex]?.url}
                        alt={`${productName} - ${
                          processedImages[currentImageIndex]?.caption ||
                          `Image ${currentImageIndex + 1}`
                        }`}
                        fill
                        className="object-contain"
                        sizes="100vw"
                        priority
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  {processedImages.length > 1 && (
                    <>
                      <motion.button
                        className="absolute left-4 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateImage("prev");
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={currentImageIndex === 0}
                        style={{
                          opacity: currentImageIndex === 0 ? 0.5 : 1,
                        }}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </motion.button>

                      <motion.button
                        className="absolute right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateImage("next");
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={
                          currentImageIndex === processedImages.length - 1
                        }
                        style={{
                          opacity:
                            currentImageIndex ===
                            processedImages.length - 1
                              ? 0.5
                              : 1,
                        }}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              {/* Thumbnails Bar */}
              {processedImages.length > 1 && (
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-violet-300 hover:scrollbar-thumb-violet-400 scrollbar-track-violet-50 scrollbar-thumb-rounded-full">
                    {processedImages.map((image, index) => (
                      <motion.div
                        key={`thumb-${index}`}
                        className={`flex-shrink-0 h-16 w-24 rounded-md overflow-hidden cursor-pointer snap-start ${
                          currentImageIndex === index
                            ? "ring-2 ring-violet-500"
                            : "opacity-70"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        whileHover={{ opacity: 1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Image
                          src={image.url}
                          alt={`Thumbnail ${index + 1}`}
                          width={96}
                          height={64}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OptimizedGallery;
