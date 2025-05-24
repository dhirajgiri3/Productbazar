// src/Components/Product/ProfileProductCard.jsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FiEye, FiCalendar, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiImage, FiBarChart2 } from "react-icons/fi";
import { format, parseISO, isValid } from "date-fns";

// --- Helper Functions ---

// Safely format dates
const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = typeof dateString === 'number' ? new Date(dateString) : parseISO(dateString);
    return isValid(date) ? format(date, "MMM d, yyyy") : null;
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return null;
  }
};

// Generate product URL safely
const getProductUrl = (product) => {
  if (!product) return "#";
  return product.slug ? `/product/${product.slug}` : `/product/${product._id || product.id || '#'}`;
};

// Robustly extract and order gallery images
const getGalleryImages = (product) => {
  const images = new Set(); // Use Set to avoid duplicates
  const fallbackImage = "https://via.placeholder.com/600x400/f3e8ff/a855f7?text=No+Image"; // Cleaner placeholder

  // Priority 1: Explicit thumbnail field (string)
  if (product.thumbnail && typeof product.thumbnail === 'string') {
    images.add(product.thumbnail);
  }
  // Priority 2: Thumbnail object (Cloudinary format or similar)
  else if (product.thumbnailImage?.url) {
    images.add(product.thumbnailImage.url);
  }
  else if (product.thumbnailImage && typeof product.thumbnailImage === 'string') {
    images.add(product.thumbnailImage); // Handle if thumbnailImage is just a URL string
  }

  // Priority 3: Gallery array
  if (Array.isArray(product.gallery)) {
    product.gallery.forEach(img => {
      if (img?.url) images.add(img.url);
      else if (typeof img === 'string') images.add(img);
    });
  }

  // Priority 4: Images array (often used in older structures)
  if (Array.isArray(product.images)) {
      product.images.forEach(img => {
          if (img?.url) images.add(img.url);
          else if (typeof img === 'string') images.add(img);
      });
  }

  const imageArray = Array.from(images);

  // If still empty, use the fallback
  return imageArray.length > 0 ? imageArray : [fallbackImage];
};


// --- Component ---

const ProfileProductCard = ({
  product,
  minimal = false,
  onEdit,
  onDelete,
  isOwner = false,
  className = ""
}) => {
  if (!product || !product._id) return null; // Basic validation

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState(false);

  // Memoize derived data for performance
  const {
    productName,
    shortDescription,
    viewCount,
    formattedDate,
    productUrl,
    categoryName,
    productStatus,
    productTags,
    productTagsAll,
    galleryImages,
    launchDate,
  } = useMemo(() => {
    const name = product.name || product.title || "Unnamed Product";
    const description = product.tagline || product.description || "";
    const views = product.views?.count ?? 0; // Safer view count access
    const date = formatDate(product.launchedAt || product.createdAt);
    const launchDate = formatDate(product.launchedAt) || formatDate(product.createdAt);
    const url = getProductUrl(product);
    const category = (typeof product.category === 'object' ? product.category.name : product.category) || null; // Null if no category
    const status = product.status || "Published";
    const tags = Array.isArray(product.tags) ? product.tags : (typeof product.tags === 'string' ? product.tags.split(',').map(t => t.trim()) : []);
    const images = getGalleryImages(product);

    return {
      productName: name,
      shortDescription: description,
      viewCount: views,
      formattedDate: date,
      launchDate: launchDate,
      productUrl: url,
      categoryName: category,
      productStatus: status,
      productTags: tags.slice(0, minimal ? 1 : 3), // Show fewer tags in minimal mode
      productTagsAll: tags,
      galleryImages: images,
    };
  }, [product, minimal]);

  // Slider navigation with improved touch support
  const changeImage = (direction, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newIndex = (currentImageIndex + direction + galleryImages.length) % galleryImages.length;
    setCurrentImageIndex(newIndex);
    setImageLoading(true); // Reset loading state for new image
  };

  const setImageIndex = (index, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (index !== currentImageIndex) {
      setCurrentImageIndex(index);
      setImageLoading(true); // Reset loading state for new image
    }
  };

  // Handle image load events
  const handleImageLoad = () => {
    setImageLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setError(true);
  };

  // Enhanced animation variants with more elegant approach
  const cardVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    hover: {
      y: -4,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { delay: 0.1, duration: 0.3 } },
  };

  const imageVariants = {
    initial: { opacity: 0, scale: 1.05 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
    hover: { scale: 1.05, transition: { duration: 0.5, ease: "easeOut" } }
  };

  // Button hover animations
  const buttonVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 }
  };

  // Removed TagIcon as it's not needed in the minimalistic design

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className={`relative overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-lg hover:shadow-violet-100/20 ${minimal ? 'h-full' : ''} ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      layout // Add layout animation for smoother updates if list changes
    >
      {/* Status Badge (Top Right) - Minimalistic design */}
      {productStatus && productStatus !== "Published" && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className={`absolute top-3 right-3 z-10 text-xs font-medium px-2 py-0.5 rounded-full backdrop-blur-sm ${
            productStatus === "Draft"
              ? "bg-amber-50/90 text-amber-600 border border-amber-100/50"
              : productStatus === "Archived"
                ? "bg-gray-50/90 text-gray-500 border border-gray-200/50"
                : "bg-blue-50/90 text-blue-500 border border-blue-100/50" // For any other status
          }`}
        >
          {productStatus}
        </motion.span>
      )}

      {/* Owner Action Buttons (Top Left) - Enhanced with improved animations and accessibility */}
      {isOwner && (
        <div className="absolute top-3 left-3 z-20 flex gap-2">
           {onEdit && (
             <motion.button
                  aria-label="Edit Product"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(product); }}
                  variants={buttonVariants}
                  initial="initial"
                  animate={isHovering ? "animate" : "initial"}
                  whileHover="hover"
                  whileTap="tap"
                  className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:text-violet-600 flex items-center justify-center transition-all duration-200 border border-violet-100/30 shadow-sm"
                  title="Edit Product"
              >
                  <FiEdit2 className="w-3.5 h-3.5" />
              </motion.button>
           )}
           {onDelete && (
              <motion.button
                  aria-label="Delete Product"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(product); }}
                  variants={buttonVariants}
                  initial="initial"
                  animate={isHovering ? "animate" : "initial"}
                  whileHover="hover"
                  whileTap="tap"
                  className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:text-red-600 flex items-center justify-center transition-all duration-200 border border-red-100/30 shadow-sm"
                  title="Delete Product"
              >
                  <FiTrash2 className="w-3.5 h-3.5" />
              </motion.button>
           )}
           <motion.a
                href={`/product/viewanalytics/${product._id}`}
                onClick={(e) => { e.stopPropagation(); }}
                variants={buttonVariants}
                initial="initial"
                animate={isHovering ? "animate" : "initial"}
                whileHover="hover"
                whileTap="tap"
                className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:text-violet-600 flex items-center justify-center transition-all duration-200 border border-violet-100/30 shadow-sm"
                title="View Analytics"
                aria-label="View Product Analytics"
            >
                <FiBarChart2 className="w-3.5 h-3.5" />
            </motion.a>
        </div>
      )}

      <Link href={productUrl} passHref legacyBehavior>
        <a className="group cursor-pointer h-full flex flex-col" aria-label={`View details for ${productName}`}>
          {/* Image Area - Enhanced with better loading states and accessibility */}
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/30">
             {/* Loading state */}
             {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                  <div className="w-6 h-6 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin shadow-sm"></div>
                </div>
             )}

             {/* Fallback Icon if no image or error */}
             {(error || (galleryImages.length === 1 && galleryImages[0].includes('via.placeholder.com'))) && (
                <div className="absolute inset-0 flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white z-5 flex">
                    <FiImage className="w-10 h-10 text-gray-300 mb-1 opacity-60" />
                    <span className="text-xs text-gray-400 font-medium">No image</span>
                </div>
             )}

            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentImageIndex}
                variants={imageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0"
              >
                <Image
                  src={galleryImages[currentImageIndex]}
                  alt={`${productName} - Image ${currentImageIndex + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-cover transition-transform duration-500 ease-in-out ${isHovering ? 'scale-105' : 'scale-100'}`}
                  onLoadingComplete={handleImageLoad}
                  onError={handleImageError}
                  priority={currentImageIndex === 0} // Prioritize first image
                  loading="eager"
                />
              </motion.div>
            </AnimatePresence>

            {/* Image Counter Badge - Minimalistic design */}
            {galleryImages.length > 1 && (
              <div className="absolute top-3 left-3 z-10 bg-black/30 text-white text-xs px-1.5 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                {currentImageIndex + 1}/{galleryImages.length}
              </div>
            )}

            {/* Image Navigation (Show on hover if multiple images) - Enhanced for accessibility */}
            {galleryImages.length > 1 && (
              <AnimatePresence>
                {isHovering && (
                  <>
                    <motion.button
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white transition-all z-10 border border-white/20 shadow-sm"
                      initial={{ opacity: 0, scale: 0.8, x: -5 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -5 }}
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => changeImage(-1, e)}
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white transition-all z-10 border border-white/20 shadow-sm"
                      initial={{ opacity: 0, scale: 0.8, x: 5 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 5 }}
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => changeImage(1, e)}
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </motion.button>
                  </>
                )}
              </AnimatePresence>
            )}

            {/* Image Indicator Dots - Enhanced for better visibility */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
                {galleryImages.map((_, index) => (
                  <motion.button
                    key={`${product._id}-image-${index}`}
                    aria-label={`Go to image ${index + 1}`}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      currentImageIndex === index
                        ? 'bg-white scale-110 shadow-sm border border-white/20'
                        : 'bg-white/30 hover:bg-white/60 border border-white/10'
                    }`}
                    onClick={(e) => setImageIndex(index, e)}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: currentImageIndex === index ? 1.25 : 1 }}
                    transition={{ delay: index * 0.05 }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content Area - Enhanced layout and responsive design */}
          <motion.div variants={contentVariants} className="p-4 space-y-3 flex-grow flex flex-col">
            {/* Top Row: Title & Category */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-gray-800 text-base leading-tight line-clamp-2 group-hover:text-violet-600 transition-colors tracking-tight">
                {productName}
              </h3>
              {!minimal && categoryName && (
                 <span className="text-[11px] font-medium px-2 py-0.5 bg-violet-50 text-violet-500 rounded-full whitespace-nowrap flex-shrink-0 mt-0.5 border border-violet-100/30">
                    {categoryName}
                </span>
              )}
            </div>

            {/* Description */}
            {!minimal && shortDescription && (
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed tracking-wide">{shortDescription}</p>
            )}

            {/* Minimal mode: Show only short description */}
            {minimal && shortDescription && (
              <p className="text-xs text-gray-500 line-clamp-1 leading-relaxed tracking-wide">{shortDescription}</p>
            )}

            {/* Tags Cloud - Enhanced layout */}
            {!minimal && productTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                {productTags.map((tag, index) => (
                  <motion.span
                    key={`${product._id}-tag-${index}-${tag}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-500 rounded-full border border-violet-100/30"
                  >
                    {tag}
                  </motion.span>
                ))}
                {productTagsAll.length > productTags.length && (
                  <span key="more-tags" className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded-full border border-gray-100/30">
                    +{productTagsAll.length - productTags.length} more
                  </span>
                )}
              </div>
            )}

            {/* Bottom Row: Stats - Enhanced with clearer metrics */}
            <div className={`flex flex-wrap items-center ${minimal ? 'justify-center mt-auto' : 'justify-between'} gap-x-3 gap-y-2 pt-2 mt-auto border-t border-gray-50`}>
              {/* Stats - Removed upvote info */}
              <div className="flex items-center gap-2">
                {!minimal && (
                  <>
                    <span className="flex items-center text-gray-400 text-xs gap-1 hover:text-violet-500 transition-colors" title={`${viewCount} Views`}>
                      <FiEye className="w-3 h-3 text-violet-400" />
                      {viewCount}
                    </span>
                    {formattedDate && (
                      <>
                        <span className="text-gray-200">•</span>
                        <span className="flex items-center text-gray-400 text-xs gap-1 hover:text-violet-500 transition-colors" title={`${launchDate ? 'Launched' : 'Created'} on ${formattedDate}`}>
                           <FiCalendar className="w-3 h-3 text-violet-400" />
                           {formattedDate}
                       </span>
                      </>
                    )}
                    {isOwner && (
                      <>
                        <span className="text-gray-200">•</span>
                        <a
                          href={`/product/viewanalytics/${product._id}`}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/product/viewanalytics/${product._id}`; }}
                          className="flex items-center text-violet-500 text-xs gap-1 hover:text-violet-700 transition-colors font-medium"
                          title="View product analytics"
                        >
                          <FiBarChart2 className="w-3 h-3" />
                          Analytics
                        </a>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Minimal Tags */}
              {minimal && productTags.length > 0 && (
                 <span className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-500 rounded-full border border-violet-100/30">
                    {productTags[0]}
                    {productTagsAll.length > 1 && ` +${productTagsAll.length - 1}`}
                </span>
              )}

              {/* View indicator for larger cards */}
              {!minimal && (
                <motion.span
                  className="text-xs font-medium text-violet-500 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 group-hover:translate-x-0.5"
                  initial={{ x: -5, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  View Details
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.span>
              )}
            </div>
          </motion.div>
        </a>
      </Link>
    </motion.div>
  );
};

export default ProfileProductCard;