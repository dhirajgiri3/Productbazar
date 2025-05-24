"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import logger from '@/lib/utils/logger';

/**
 * Enhanced Product Image Slider with better image handling and UX
 */
export default function ProductImageSlider({
  product,
  className = '',
  showControls = true,
  autoplay = false,
  interval = 5000,
  onImageClick = null,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef(null);

  // Extract all available images from the product with proper handling of gallery objects
  const images = useMemo(() => {
    if (!product) return [];

    const allImages = [];
    const processedUrls = new Set(); // To avoid duplicate images

    // First add the thumbnail/main image if it exists
    if (product.thumbnail) {
      allImages.push(product.thumbnail);
      processedUrls.add(product.thumbnail);
    }

    // Process gallery items - they could be objects with url property or direct strings
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      product.gallery.forEach(item => {
        // Handle different gallery item structures
        const imageUrl = typeof item === 'string' ? item : item?.url;

        // Skip if it's not a valid string or it's already included
        if (typeof imageUrl !== 'string' || !imageUrl || processedUrls.has(imageUrl)) {
          return;
        }

        // Add new unique image URL
        allImages.push(imageUrl);
        processedUrls.add(imageUrl);
      });
    }

    return allImages;
  }, [product]);

  // Clean up autoplay interval on unmount
  useEffect(() => {
    if (autoplay && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoplay, interval, images.length]);

  // Handle manual navigation
  const navigate = (direction) => {
    if (images.length <= 1) return;

    // Reset autoplay timer when manually navigating
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (direction === 'prev') {
      setCurrentIndex(prevIndex => (prevIndex - 1 + images.length) % images.length);
    } else {
      setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
    }

    // Restart autoplay if enabled
    if (autoplay) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
      }, interval);
    }
  };

  // Generic fallback image URL
  const fallbackImageUrl = '/images/placeholder-product.png';

  // If there are no images, show placeholder
  if (!images.length) {
    return (
      <div
        className={`relative flex items-center justify-center bg-gray-100 ${className}`}
        aria-label="No product image available"
      >
        <FiImage className="w-10 h-10 text-gray-300" />
      </div>
    );
  }

  // If there's only one image, don't use the slider
  if (images.length === 1) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => onImageClick && onImageClick(images[0])}
        style={{ cursor: onImageClick ? 'pointer' : 'default' }}
      >
        <div className="relative w-full h-full">
          <Image
            src={images[0]}
            alt={product?.name || 'Product image'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 ease-in-out"
            onError={(e) => {
              logger.warn('Error loading product image:', images[0]);
              e.target.src = fallbackImageUrl;
            }}
          />
        </div>
      </div>
    );
  }

  // For multiple images, use the slider
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative w-full h-full">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`product-slider-${currentIndex}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => onImageClick && onImageClick(images[currentIndex])}
            style={{ cursor: onImageClick ? 'pointer' : 'default' }}
          >
            <Image
              src={images[currentIndex]}
              alt={`${product?.name || 'Product'} image ${currentIndex + 1} of ${images.length}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              className="object-cover"
              quality={80}
              onError={(e) => {
                logger.warn('Error loading product image:', images[currentIndex]);
                e.target.src = fallbackImageUrl;
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Controls - Only show when hovering or explicitly enabled */}
        {(showControls || isHovering) && images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('prev'); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white/80 transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 shadow-sm"
              aria-label="Previous image"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('next'); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white/80 transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 shadow-sm"
              aria-label="Next image"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots indicator for multiple images */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                  // Reset autoplay timer when manually selecting
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    if (autoplay) {
                      intervalRef.current = setInterval(() => {
                        setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
                      }, interval);
                    }
                  }
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  currentIndex === idx
                    ? 'bg-white w-4'
                    : 'bg-white/50'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
