"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import viewService from "../../services/viewService";
import recommendationService from "../../services/recommendationService";
import LoaderComponent from "../UI/LoaderComponent";

// --- Icons (Using Lucide React for consistency with reference) ---
import {
  LayoutGrid,
  List,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  ImageOff,
  RotateCw,
  SearchX,
  ArrowRight,
  Sparkles,
  Layers,
  Loader2,
  ServerCrash,
  Tag,
  Star,
  Info,
  Calendar as CalendarLucideIcon, // Calendar icon for dates
} from "lucide-react";

// Extend dayjs with relativeTime
dayjs.extend(relativeTime);

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 15,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  hover: {
    y: -3,
    transition: { type: "spring", stiffness: 200, damping: 10 },
  },
};

const fadeIn = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// --- Helper Component for Device Icons ---
const DeviceIcon = ({ device, className = "w-3.5 h-3.5" }) => {
  const iconProps = { className: `${className} inline-block mr-1.5` };
  switch (device?.toLowerCase()) {
    case "mobile":
      return <Smartphone {...iconProps} />;
    case "tablet":
      return <Tablet {...iconProps} />;
    case "desktop":
      return <Laptop {...iconProps} />;
    default:
      return <Monitor {...iconProps} />;
  }
};

// --- Error Component ---
const ErrorState = ({ error, onRetry }) => (
  <motion.div
    className="h-[90vh] flex flex-col items-center justify-center p-8 text-center bg-red-50 border border-red-100 rounded-xl shadow-sm relative overflow-hidden"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    {/* Background decoration */}
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 via-red-500 to-red-600"></div>
    <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-red-50 opacity-50"></div>
    <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-red-50 opacity-50"></div>

    <div className="relative z-10">
      <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center shadow-sm">
        <ServerCrash className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Oops! Something went wrong
      </h3>
      <p className="text-gray-600 mb-6 max-w-md">
        {error || "We couldn't load your view history. Please try again."}
      </p>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all flex items-center gap-2 shadow-sm"
      >
        <RotateCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  </motion.div>
);

// --- Empty State Component ---
const EmptyState = () => (
  <motion.div
    className="bg-white p-10 rounded-xl text-center border border-violet-100 relative overflow-hidden h-[90vh] flex flex-col justify-center"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    {/* Background decoration */}
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-400 via-purple-500 to-violet-600"></div>
    <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-violet-50 opacity-50"></div>
    <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-violet-50 opacity-50"></div>

    <div className="relative z-10 max-w-lg mx-auto">
      <div className="w-24 h-24 mx-auto mb-6 bg-violet-50 rounded-full flex items-center justify-center shadow-sm">
        <SearchX className="w-12 h-12 text-violet-400" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-3">
        <span className="bg-gradient-to-r from-violet-700 to-violet-500 bg-clip-text text-transparent">Your Browsing History is Empty</span>
      </h2>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        Start exploring products to build your personalized recommendations and
        view history. Items you've viewed will appear here.
      </p>

      <p className="text-xs text-gray-500 mb-8 max-w-sm mx-auto">
        Your browsing history helps us recommend products that match your interests
        and preferences. All data is kept private and secure.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">

        <Link href="/app" passHref legacyBehavior>
          <motion.a
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-all duration-300 font-medium shadow-sm"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            View Recommendations
          </motion.a>
        </Link>
      </div>
    </div>
  </motion.div>
);

// --- Stat Card Component ---
const StatCard = ({ icon: Icon, label, value, unit }) => (
  <motion.div
    className="bg-white p-5 rounded-xl border border-violet-100 duration-300"
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    whileHover="hover"
    // transition={{ delay: delay * 0.1 }} // Delay handled by containerVariants
  >
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-violet-50 flex items-center justify-center">
        <Icon className="w-6 h-6 text-violet-600" />
      </div>
      <div>
        <div className="text-sm text-violet-600 font-medium mb-0.5">{label}</div>
        <div className="text-2xl font-semibold text-gray-900">
          {value}
          {unit && (
            <span className="text-lg ml-1 text-violet-400">{unit}</span>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

// Gallery thumbnail component
const GalleryThumbnail = ({ images, productName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use the main thumbnail as the first image, and additional gallery images if available
  const imageUrls = useMemo(() => {
    if (!images) return [];
    const validImages = Array.isArray(images) ? images : [images];
    return validImages.filter(Boolean); // Ensure no null/undefined URLs
  }, [images]);

  if (!imageUrls.length) {
     return (
       <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center">
         <ImageOff className="w-8 h-8 text-gray-400" />
       </div>
     );
  }

  return (
    <div className="relative group aspect-[4/3]"> {/* Added aspect ratio here */}
      <div className="relative w-full h-full overflow-hidden rounded-t-lg"> {/* Ensure full size */}
        {imageUrls[currentIndex] ? (
          <Image
            src={imageUrls[currentIndex]}
            alt={productName || "Product Image"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={currentIndex === 0} // Prioritize first image
            onError={(e) => { e.target.style.display = 'none'; /* Hide broken image */ }}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {/* Fallback div in case image fails to load AND onError doesn't hide it */}
        {!imageUrls[currentIndex] && (
           <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
             <ImageOff className="w-8 h-8 text-gray-400" />
           </div>
        )}

        {/* Image count indicator */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full flex items-center gap-1 backdrop-blur-sm">
            <Layers className="w-3 h-3" /> {/* Changed icon */}
            {currentIndex + 1}/{imageUrls.length}
          </div>
        )}
      </div>

      {/* Thumbnail navigation - only show if there are multiple images */}
      {imageUrls.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 p-2 bg-gradient-to-t from-black/50 to-transparent">
          {imageUrls.slice(0, 5).map((_, idx) => ( // Limit dots
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault(); // Prevent link navigation if inside <a>
                e.stopPropagation(); // Prevent event bubbling
                setCurrentIndex(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ease-in-out transform ${
                currentIndex === idx
                  ? "bg-white scale-125"
                  : "bg-white/60 hover:bg-white/80 scale-100"
              }`}
              aria-label={`View image ${idx + 1}`}
            />
          ))}
          {imageUrls.length > 5 && <span className="text-white/70 text-[10px] self-center">...</span>}
        </div>
      )}
    </div>
  );
};

// --- Enhanced History Item Card Component ---
const HistoryItemCard = ({ view, viewMode }) => {
  const isGrid = viewMode === "grid";
  const productLink = view.product ? `/product/${view.product.slug || view.product._id}` : '#'; // Fallback link

  // Client-side only state
  const [currentListImageIndex, setCurrentListImageIndex] = useState(0); // Separate state for list view image index
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state on client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prepare gallery images - use product images if available
  const galleryImages = useMemo(() => {
    if (!view.product) return [];

    const images = [];
    // Add main thumbnail
    if (view.product.thumbnail) {
      images.push(view.product.thumbnail);
    }

    // Add gallery images if available
    if (view.product.gallery && Array.isArray(view.product.gallery)) {
      view.product.gallery.forEach(img => {
        // Ensure image exists and is not the same as the thumbnail already added
        if (img && (!view.product.thumbnail || img !== view.product.thumbnail)) {
          images.push(img);
        }
      });
    }
    // De-duplicate just in case
    return [...new Set(images)].filter(Boolean);
  }, [view.product]);

  // Extract pricing information
  const getPricingInfo = () => {
    if (!view.product?.pricing) return null;
    const pricing = view.product.pricing;
    // ... (pricing logic remains the same)
    switch(pricing.type) {
      case 'free':
        return { label: 'Free', bgColor: 'bg-green-50', textColor: 'text-green-600' };
      case 'paid':
        return {
          label: pricing.amount ? `$${typeof pricing.amount === 'number' ? pricing.amount.toFixed(2) : pricing.amount}` : 'Paid',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-600'
        };
      case 'subscription':
        return {
          label: pricing.amount ? `$${typeof pricing.amount === 'number' ? pricing.amount.toFixed(2) : pricing.amount}/${pricing.interval || 'mo'}` : 'Subscription',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600'
        };
      case 'freemium':
        return { label: 'Freemium', bgColor: 'bg-purple-50', textColor: 'text-purple-600' };
      case 'contact':
        return { label: 'Contact for Price', bgColor: 'bg-gray-50', textColor: 'text-gray-600' };
      default:
        return null;
    }
  };
  const pricingInfo = getPricingInfo();

  // Get maker name robustly
  const getMakerName = () => {
    if (!view.product?.maker) return 'Maker';
    if (typeof view.product.maker === 'object') {
        if (view.product.maker.firstName && view.product.maker.lastName) {
            return `${view.product.maker.firstName} ${view.product.maker.lastName}`;
        }
        return view.product.maker.username || 'Maker';
    }
    return view.product.makerProfile?.name || 'Maker';
  }
  const makerName = getMakerName();

  // Get category name robustly
  const getCategoryName = () => {
      if (!view.product?.category) return null;
      if (typeof view.product.category === 'object') {
          return view.product.category.name || null;
      }
      return view.product.categoryName || null; // Assuming categoryName might exist directly
  }
  const categoryName = getCategoryName();

  // Get tags robustly
  const getTags = () => {
      if (!view.product?.tags) return [];
      if (Array.isArray(view.product.tags)) return view.product.tags;
      if (typeof view.product.tags === 'string') return [view.product.tags];
      return [];
  }
  const tags = getTags();

  return (
    <motion.div
      layout // Enable layout animations
      key={view._id}
      variants={cardVariants}
      initial="hidden" // Add initial state for entrance animation
      animate="visible" // Add visible state for entrance animation
      exit="exit" // Add exit state for AnimatePresence
      whileHover="hover"
      className={`bg-white rounded-xl border border-violet-100 duration-300 overflow-hidden flex ${ // Added shadow effects
        isGrid ? "flex-col" : "flex-row items-stretch" // Ensure items stretch in list view
      }`}
    >
      {/* Product Image/Gallery Area */}
      <div className={`relative block group ${ // Make this a div container
            isGrid
              ? "w-full"
              : "flex-shrink-0 w-32 h-auto sm:w-40 md:w-48" // Let height be auto in list view, controlled by content later
          }`}
      >
        <Link href={productLink} passHref legacyBehavior>
          <a className={`block relative overflow-hidden ${isGrid ? 'rounded-t-lg' : 'rounded-l-lg h-full'}`}> {/* Ensure link takes full height in list view */}
            {isGrid ? (
              <GalleryThumbnail
                images={galleryImages} // Pass the processed array
                productName={view.product?.name}
              />
            ) : (
              // List View Image Area
              <div className="relative w-full h-full aspect-square"> {/* Maintain aspect ratio for list image */}
                  {(isMounted && galleryImages.length > 0 && galleryImages[currentListImageIndex]) ? (
                      <Image
                      src={galleryImages[currentListImageIndex]}
                      alt={view.product?.name || "Product Image"}
                      fill
                      sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 192px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { e.target.style.display = 'none'; }}
                      />
                  ) : view.product?.thumbnail ? (
                      <Image
                      src={view.product.thumbnail}
                      alt={view.product.name || "Product Image"}
                      fill
                      sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 192px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { e.target.style.display = 'none'; }}
                      />
                  ) : (
                      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                          <ImageOff className="w-8 h-8 text-gray-400" />
                      </div>
                  )}
                  {/* Fallback div in case image fails */}
                  {!(isMounted && galleryImages.length > 0 && galleryImages[currentListImageIndex]) && !view.product?.thumbnail && (
                      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                          <ImageOff className="w-8 h-8 text-gray-400" />
                      </div>
                  )}
              </div>
            )}
          </a>
        </Link>

        {/* Image navigation for list view - only render on client side */}
        {!isGrid && isMounted && galleryImages.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
            {galleryImages.slice(0, Math.min(5, galleryImages.length)).map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentListImageIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  currentListImageIndex === idx
                    ? "bg-white scale-125"
                    : "bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`View list image ${idx + 1}`}
              />
            ))}
            {galleryImages.length > 5 && (
              <span className="text-white/80 text-[10px] ml-1 self-center">+{galleryImages.length - 5}</span>
            )}
          </div>
        )}

        {/* View time badge - always show */}
        {view.viewDuration && (
          <div className={`absolute z-10 ${isGrid ? 'top-2 left-2' : 'top-1 right-1'} px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded-full flex items-center gap-1 backdrop-blur-sm`}>
            <Clock className="w-2.5 h-2.5" />
            {view.viewDuration}s
          </div>
        )}

        {/* Category badge - only for grid view */}
        {isGrid && categoryName && (
          <div className="absolute z-10 top-2 right-2 px-2 py-0.5 bg-indigo-600/90 text-white text-xs rounded-full flex items-center gap-1 backdrop-blur-sm">
            {categoryName}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col flex-1 min-w-0 ${isGrid ? "p-4" : "p-3 sm:p-4"}`}> {/* Adjust padding for list */}
        <div className="flex flex-col mb-auto"> {/* Push metadata/action bar down */}
          {/* Product Name and View Time */}
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <Link href={productLink} passHref legacyBehavior>
              <a className="font-semibold text-gray-800 hover:text-violet-600 transition-colors text-base leading-tight line-clamp-2 flex-1" title={view.product?.name || "Product Not Available"}>
                {view.product?.name || "Product Not Available"}
              </a>
            </Link>

            <div className="flex-shrink-0 flex items-center gap-1 whitespace-nowrap text-xs text-gray-400 pt-0.5">
              <CalendarLucideIcon className="w-3 h-3" />
              {isMounted ? dayjs(view.createdAt).fromNow() : '...'}
            </div>
          </div>

          {/* Tagline */}
          {view.product?.tagline && (
            <p className="text-sm text-violet-700 mb-2 line-clamp-1 font-medium">
              {view.product.tagline}
            </p>
          )}

          {/* Product details - pricing, status, category, tags */}
          {view.product && (
            <div className="flex flex-wrap gap-x-2 gap-y-1 items-center mb-3 text-xs">
              {/* Pricing Badge */}
              {pricingInfo && (
                <div className={`inline-flex items-center px-2 py-0.5 ${pricingInfo.bgColor} ${pricingInfo.textColor} rounded-full font-medium`}>
                  {pricingInfo.label}
                </div>
              )}

              {/* Status Badge */}
              {view.product.status && (
                <div className={`inline-flex items-center px-2 py-0.5 ${
                  view.product.status === 'Published' ? 'bg-green-50 text-green-600' :
                  view.product.status === 'Draft' ? 'bg-amber-50 text-amber-600' :
                  'bg-gray-50 text-gray-600'
                } rounded-full font-medium`}>
                  {view.product.status}
                </div>
              )}

              {/* Category Badge - for list view */}
              {!isGrid && categoryName && (
                <div className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                  {categoryName}
                </div>
              )}

              {/* Tags Badge */}
              {tags.length > 0 && (
                <div className="inline-flex items-center px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full font-medium">
                  <Tag className="w-3 h-3 mr-1" />
                  {tags[0]}
                  {tags.length > 1 && ` +${tags.length - 1}`}
                </div>
              )}
            </div>
          )}

          {/* Maker Info */}
          {view.product?.maker && (
            <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
               {/* Add maker avatar if available later */}
               <span>By</span>
               <span className="font-medium text-gray-700">{makerName}</span>
            </div>
           )}

          {/* Description (Optional, for list view maybe?) */}
          {/* {!isGrid && view.product?.description && (
             <p className="text-sm text-gray-500 line-clamp-2 mb-3">
               {view.product.description}
             </p>
           )} */}
        </div>

        {/* Action bar and metadata */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100"> {/* Added top border */}
          {/* Device/Referrer Metadata */}
          <div className="flex flex-wrap gap-1 items-center">
            {view.device && (
              <div className="inline-flex items-center px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded-full text-[11px] border border-violet-100" title={`Viewed on ${view.device}`}>
                <DeviceIcon device={view.device} className="w-3 h-3" />
                <span className="ml-0.5 capitalize">{view.device}</span>
              </div>
            )}

            {view.referrer && (
              <div className="inline-flex items-center px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded-full text-[11px] truncate max-w-[100px] sm:max-w-[120px] border border-violet-100" title={`Referred by ${view.referrer}`}>
                <LinkIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{view.referrer.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</span>
              </div>
            )}
          </div>

          {/* View Details Action */}
          <Link href={productLink} passHref legacyBehavior>
            <a className="text-xs text-violet-600 hover:text-violet-700 transition-colors flex items-center group/link ml-auto flex-shrink-0 pl-2">
              Details
              <ArrowRight className="w-3 h-3 ml-1 group-hover/link:translate-x-0.5 transition-transform" />
            </a>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};


// --- Enhanced Recommendation Item Card Component ---
// (RecommendationItemCard component structure mostly remains the same,
//  ensure GalleryThumbnail is used correctly and add robust data checks like in HistoryItemCard)
const RecommendationItemCard = ({ product }) => {
  const productLink = `/product/${product.slug || product._id}`;

  const galleryImages = useMemo(() => {
      if (!product) return [];
      const images = [];
      if (product.thumbnail) images.push(product.thumbnail);
      if (product.gallery && Array.isArray(product.gallery)) {
          product.gallery.forEach(img => {
              if (img && img !== product.thumbnail) images.push(img);
          });
      }
      return [...new Set(images)].filter(Boolean);
  }, [product]);

  const getPricingInfo = () => {
    if (!product?.pricing) return null;
    const pricing = product.pricing;
    // ... (pricing logic remains the same)
     switch(pricing.type) {
      case 'free': return { label: 'Free', bgColor: 'bg-green-50', textColor: 'text-green-600' };
      case 'paid': return { label: pricing.amount ? `$${typeof pricing.amount === 'number' ? pricing.amount.toFixed(2) : pricing.amount}` : 'Paid', bgColor: 'bg-amber-50', textColor: 'text-amber-600' };
      case 'subscription': return { label: pricing.amount ? `$${typeof pricing.amount === 'number' ? pricing.amount.toFixed(2) : pricing.amount}/${pricing.interval || 'mo'}` : 'Subscription', bgColor: 'bg-blue-50', textColor: 'text-blue-600' };
      case 'freemium': return { label: 'Freemium', bgColor: 'bg-purple-50', textColor: 'text-purple-600' };
      case 'contact': return { label: 'Contact for Price', bgColor: 'bg-gray-50', textColor: 'text-gray-600' };
      default: return null;
    }
  };
  const pricingInfo = getPricingInfo();

   const getMakerName = () => {
    if (!product?.maker) return 'Maker';
    if (typeof product.maker === 'object') {
        if (product.maker.firstName && product.maker.lastName) {
            return `${product.maker.firstName} ${product.maker.lastName}`;
        }
        return product.maker.username || 'Maker';
    }
    return product.makerProfile?.name || 'Maker';
  }
  const makerName = getMakerName();

  const getCategoryName = () => {
      if (!product?.category) return null;
      if (typeof product.category === 'object') {
          return product.category.name || null;
      }
      return product.categoryName || null;
  }
  const categoryName = getCategoryName();

  const getTags = () => {
      if (!product?.tags) return [];
      if (Array.isArray(product.tags)) return product.tags;
      if (typeof product.tags === 'string') return [product.tags];
      return [];
  }
  const tags = getTags();

  const [isMounted, setIsMounted] = useState(false);
   useEffect(() => {
     setIsMounted(true);
   }, []);

  return (
    <motion.div
      key={product._id}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    //   transition={{ delay: delay * 0.1 }} // Delay handled by containerVariants
      className="bg-white rounded-xl border border-violet-100 transition-shadow duration-300 overflow-hidden flex flex-col shadow-sm hover:shadow-md"
    >
      {/* Product Image/Gallery */}
      <Link href={productLink} passHref legacyBehavior>
        <a className="relative block overflow-hidden group"> {/* Added group */}
          <GalleryThumbnail
            images={galleryImages}
            productName={product.name}
          />

          {/* Category badge */}
          {categoryName && (
            <div className="absolute z-10 top-2 right-2 px-2 py-0.5 bg-violet-600/90 text-white text-xs rounded-full flex items-center gap-1 backdrop-blur-sm">
              {categoryName}
            </div>
          )}

          {/* New badge if product is recent */}
          {product.createdAt && dayjs(product.createdAt).diff(dayjs(), 'day') > -14 && (
            <div className="absolute z-10 top-2 left-2 px-1.5 py-0.5 bg-violet-500/90 text-white text-[10px] rounded-full flex items-center gap-1 backdrop-blur-sm">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              New
            </div>
          )}
        </a>
      </Link>

      <div className="p-4 flex-grow flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <Link href={productLink} passHref legacyBehavior>
            <a className="font-semibold text-gray-800 hover:text-violet-600 transition-colors text-base leading-tight line-clamp-1 block flex-1" title={product.name}>
              {product.name}
            </a>
          </Link>

          {/* Date */}
          {product.createdAt && (
            <div className="flex-shrink-0 text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap pt-0.5">
              <CalendarLucideIcon className="w-3 h-3" />
              {isMounted ? dayjs(product.createdAt).fromNow(true) : '...'}
            </div>
          )}
        </div>

        {/* Tagline */}
        {product.tagline && (
          <p className="text-sm text-violet-700 mb-2 line-clamp-1 font-medium">
            {product.tagline}
          </p>
        )}

        <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-grow"> {/* Added flex-grow */}
          {product.description || "No description available."}
        </p>

        {/* Product details - pricing, status, tags */}
        <div className="flex flex-wrap gap-x-2 gap-y-1 items-center mb-3 text-xs">
          {/* Pricing Badge */}
          {pricingInfo && (
            <div className={`inline-flex items-center px-2 py-0.5 ${pricingInfo.bgColor} ${pricingInfo.textColor} rounded-full font-medium`}>
              {pricingInfo.label}
            </div>
          )}

          {/* Fallback to price if pricing object not available */}
          {!pricingInfo && product.price && (
            <div className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">
              ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </div>
          )}

          {/* Status Badge */}
          {product.status && (
            <div className={`inline-flex items-center px-2 py-0.5 ${
              product.status === 'Published' ? 'bg-green-50 text-green-600' :
              product.status === 'Draft' ? 'bg-amber-50 text-amber-600' :
              'bg-gray-50 text-gray-600'
            } rounded-full font-medium`}>
              {product.status}
            </div>
          )}

          {/* Tags Badge */}
          {tags.length > 0 && (
            <div className="inline-flex items-center px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full font-medium">
              <Tag className="w-3 h-3 mr-1" />
              {tags[0]}
              {tags.length > 1 && ` +${tags.length - 1}`}
            </div>
          )}
        </div>

        {/* Maker Info */}
        {product.maker && (
           <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
             <span>By</span>
             <span className="font-medium text-gray-700">{makerName}</span>
           </div>
         )}

        {/* Action bar */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100"> {/* Added top border */}
          {/* Stats */}
          <div className="flex items-center gap-3">
            {/* Upvotes */}
            <div className="text-xs text-gray-600 font-medium flex items-center gap-1" title={`${product.upvotes?.length || 0} Upvotes`}>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
              {product.upvotes?.length || 0}
            </div>

            {/* Views if available */}
            {(product.views?.count ?? 0) > 0 && (
              <div className="text-xs text-gray-500 flex items-center gap-1" title={`${product.views.count} Views`}>
                <Eye className="w-3.5 h-3.5 text-gray-400" />
                {product.views.count}
              </div>
            )}
          </div>

          <Link href={productLink} passHref legacyBehavior>
            <a className="text-xs text-violet-600 hover:text-violet-700 transition-colors flex items-center group/link">
              Details
              <ArrowRight className="w-3 h-3 ml-1 group-hover/link:translate-x-0.5 transition-transform" />
            </a>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// --- Enhanced Page Header Component ---
const PageHeader = () => (
  <div className="mb-8 bg-white rounded-xl border border-violet-100 p-6 relative overflow-hidden">
    {/* Decorative background elements */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-100/50 to-transparent rounded-full -mr-32 -mt-32 opacity-70"></div>
    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-50/50 to-transparent rounded-full -ml-24 -mb-24 opacity-60"></div>

    <div className="relative z-10 mb-4">
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium mb-3 shadow-sm">
        <Clock className="w-3.5 h-3.5 mr-1.5" />
        Browsing History
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
        <span className="bg-gradient-to-r from-violet-700 to-violet-500 bg-clip-text text-transparent">Your Viewing History</span>
      </h1>
      <p className="text-gray-600 text-sm max-w-2xl">
        Review products you've recently explored and discover related items tailored for you. Your browsing patterns help us recommend products that match your interests.
      </p>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-violet-50 relative z-10">
      <div className="flex items-center text-xs text-violet-700 bg-violet-50 px-3 py-2 rounded-lg border border-violet-100 shadow-sm">
        <Info className="w-3.5 h-3.5 mr-1.5 text-violet-500 flex-shrink-0" />
        <span>Your view history is private and used only to improve your recommendations.</span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0"> {/* Added flex-shrink */}
        <Link href="/app" passHref legacyBehavior>
          <a className="text-sm text-violet-600 hover:text-violet-800 transition-all flex items-center gap-1 px-3 py-1.5 rounded-lg border border-violet-200 bg-white hover:bg-violet-50 shadow-sm">
            <Sparkles className="w-4 h-4" />
            Recommendations
          </a>
        </Link>
      </div>
    </div>
  </div>
);


// --- Main Component ---
const UserViewHistory = ({
  disableFetch = false, // If true, component won't fetch data automatically
  productId = null, // Optional product ID to filter history
  initialData = null, // Optional pre-fetched data
  showRecommendations = true // Whether to show recommendations section
}) => {
  const [viewHistory, setViewHistory] = useState(initialData?.data || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(initialData?.pagination || { page: 1, pages: 1, total: 0, limit: 12 });
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // 'grid' or 'list'
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(!!initialData); // Track initial fetch
  const fetchTimeRef = useRef(null); // Track last fetch time for debouncing

  // <<<--- MOVE SCROLLBAR STYLE INJECTION HERE --->>>
  useEffect(() => {
    const styleId = "custom-scrollbar-styles";
    // Check if the style already exists
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.textContent = `
        .hide-scrollbar {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: rgba(99, 102, 241, 0.4) transparent; /* Firefox */
        }
        /* Webkit (Chrome, Safari, Edge) */
        .hide-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 2px;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(99, 102, 241, 0.4);
          border-radius: 10px;
          border: 1px solid transparent; /* Optional: adds padding */
        }
        .hide-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(99, 102, 241, 0.6);
        }
      `;
      document.head.appendChild(styleElement);
    }

    // Optional: Cleanup function to remove the style if the component unmounts
    // return () => {
    //   const existingStyle = document.getElementById(styleId);
    //   if (existingStyle) {
    //     document.head.removeChild(existingStyle);
    //   }
    // };
  }, []); // Empty dependency array ensures this runs only once on mount


  // Fetch view history with debouncing and caching
  const fetchViewHistory = async (page = 1, limit = 12) => {
    // Implement debouncing to prevent rapid successive calls
    const now = Date.now();
    if (fetchTimeRef.current && now - fetchTimeRef.current < 500) {
      console.log('Debouncing view history fetch - too frequent');
      return; // Skip if called too frequently
    }
    fetchTimeRef.current = now;

    setLoading(true); // Set loading true at the start
    try {
      // Add product ID to params if provided
      const params = { page, limit };
      if (productId) {
        params.productId = productId;
      }

      const result = await viewService.getUserViewHistory(params);
      setHasFetchedOnce(true); // Mark that initial fetch attempt completed

      // Sort by date descending before setting state
      const sortedHistory = (result.data || []).sort(
        (a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf() // Use valueOf for robustness
      );

      setViewHistory(sortedHistory);

      // Ensure pagination data is properly structured
      const paginationData = {
        page: result.pagination?.page || 1, // Default to 1 if missing
        pages: result.pagination?.pages || 1, // Default to 1
        total: result.pagination?.total || sortedHistory.length,
        limit: result.pagination?.limit || limit
      };
      setPagination(paginationData);
      setError(null); // Clear previous errors

      // Cache the result in sessionStorage
      try {
        sessionStorage.setItem('viewHistoryData', JSON.stringify({
          data: sortedHistory,
          pagination: paginationData,
          timestamp: Date.now()
        }));
        sessionStorage.setItem('viewHistoryLastFetch', Date.now().toString());
      } catch (cacheErr) {
        console.warn('Failed to cache view history:', cacheErr);
      }

      // Fetch recommendations only ONCE after the first successful history fetch with data
      if (showRecommendations && sortedHistory.length > 0 && recommendations.length === 0 && !loadingRecommendations) {
        fetchRecommendations();
      }

    } catch (err) {
      console.error("Failed to fetch view history:", err);
      setError(err.message || "Unable to load your view history. Please try again later.");
      setViewHistory([]); // Clear history on error
      setPagination({ page: 1, pages: 1, total: 0, limit: 12 }); // Reset pagination
      setHasFetchedOnce(true); // Also mark fetch attempt completed on error
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch effect - only run if not disabled and no initial data
  useEffect(() => {
    if (!disableFetch && !initialData) {
      // Check if we've fetched recently (within last 30 seconds)
      const lastFetchTime = sessionStorage.getItem('viewHistoryLastFetch');
      const now = Date.now();
      const shouldFetch = !lastFetchTime || (now - parseInt(lastFetchTime)) > 30000;

      if (shouldFetch) {
        fetchViewHistory(1); // Fetch page 1 on initial mount
        sessionStorage.setItem('viewHistoryLastFetch', now.toString());
      } else {
        // Try to get cached data from sessionStorage
        try {
          const cachedData = JSON.parse(sessionStorage.getItem('viewHistoryData'));
          if (cachedData && cachedData.data && cachedData.data.length > 0) {
            console.log('Using cached view history data');
            setViewHistory(cachedData.data);
            setPagination(cachedData.pagination);
            setHasFetchedOnce(true);
            setLoading(false);

            // Still fetch recommendations if needed
            if (showRecommendations && cachedData.data.length > 0 && recommendations.length === 0) {
              fetchRecommendations();
            }
          } else {
            fetchViewHistory(1);
          }
        } catch (err) {
          console.error('Error parsing cached view history:', err);
          fetchViewHistory(1);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableFetch, initialData, showRecommendations]); // Only run when these props change

  // Fetch recommendations based on history with caching
  const fetchRecommendations = async () => {
    if (!showRecommendations) return;

    // Check for cached recommendations
    try {
      const cachedRecs = JSON.parse(sessionStorage.getItem('viewHistoryRecommendations'));
      const now = Date.now();
      if (cachedRecs && cachedRecs.timestamp && (now - cachedRecs.timestamp < 300000)) { // 5 minute cache
        console.log('Using cached recommendations');
        setRecommendations(cachedRecs.data || []);
        return; // Skip fetch if we have recent cached data
      }
    } catch (err) {
      // Ignore cache errors and proceed with fetch
    }

    setLoadingRecommendations(true);
    try {
      const result = await recommendationService.getHistoryBasedRecommendations({ limit: 3 }); // Limit to 3 for the preview
      const recData = result.data || [];
      setRecommendations(recData);

      // Cache recommendations
      try {
        sessionStorage.setItem('viewHistoryRecommendations', JSON.stringify({
          data: recData,
          timestamp: Date.now()
        }));
      } catch (cacheErr) {
        console.warn('Failed to cache recommendations:', cacheErr);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      // Don't show a user-facing error for recommendations failing
      setRecommendations([]); // Ensure it's an empty array on error
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Handler for page change (triggers fetch via state update)
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages && newPage !== pagination.page) {
      // Update pagination state first
      setPagination(prev => ({ ...prev, page: newPage }));

      // Check if we have this page cached
      try {
        const cachedData = JSON.parse(sessionStorage.getItem(`viewHistoryPage${newPage}`));
        const now = Date.now();
        if (cachedData && cachedData.timestamp && (now - cachedData.timestamp < 60000)) {
          console.log(`Using cached data for page ${newPage}`);
          setViewHistory(cachedData.data);
          return; // Skip fetch if we have recent cached data
        }
      } catch (err) {
        // Ignore cache errors and proceed with fetch
      }

      // Fetch new page data
      fetchViewHistory(newPage, pagination.limit);
    }
  };

  // Retry handler
  const handleRetry = () => {
    setError(null);
    setHasFetchedOnce(false); // Reset fetch tracker
    fetchViewHistory(1); // Retry from page 1
  };

  // Memoized stats calculation
  const stats = useMemo(() => {
    const totalViewTime = viewHistory.reduce(
      (total, item) => total + (item.viewDuration || 0),
      0
    );
    const devices = [
      ...new Set(viewHistory.map((item) => item.device?.toLowerCase()).filter(Boolean)),
    ].sort();
    const uniqueProducts = new Set(
      viewHistory.map((item) => item.product?._id).filter(Boolean)
    );

    return {
      totalItems: pagination.total, // Use total from pagination for accuracy across pages
      uniqueProductsCount: uniqueProducts.size, // This is only for the current page
      avgViewTime: viewHistory.length
        ? Math.round(totalViewTime / viewHistory.length)
        : 0,
      devices,
      deviceCount: devices.length,
    };
  }, [viewHistory, pagination.total]); // Depend on viewHistory and total count

  // Filter view history based on active filter (client-side filtering of current page)
  const filteredHistory = useMemo(() => {
    if (activeFilter === "all") return viewHistory;
    return viewHistory.filter((view) => view.device?.toLowerCase() === activeFilter);
  }, [viewHistory, activeFilter]);


  // --- Render Logic ---

  // Initial loading state (before first fetch attempt completes)
  if (loading && !hasFetchedOnce) {
    return (
      <div className="min-h-[calc(100vh-200px)] bg-gradient-to-b from-violet-50 to-white p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-violet-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4">
            <LoaderComponent className="text-violet-600" />
          </div>
          <h3 className="text-lg font-medium text-violet-800 mb-2">Loading your history...</h3>
          <p className="text-sm text-violet-500">Preparing your personalized view history</p>
        </div>
      </div>
    );
  }

  // Error state (after first fetch attempt failed)
  if (error && hasFetchedOnce && viewHistory.length === 0) {
    return (
      <div className="min-h-[calc(100vh-200px)] bg-gradient-to-b from-violet-50 to-white p-6">
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // Empty state (after first fetch succeeded but returned no items)
  if (!loading && hasFetchedOnce && viewHistory.length === 0 && !error) {
     return (
       <div className="min-h-[calc(100vh-200px)] bg-gradient-to-b from-violet-50 to-white p-4 sm:p-6">
         {/* Keep header visible even when empty */}
         <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4 }}
         >
           <PageHeader />
         </motion.div>
         <EmptyState />
       </div>
     );
  }

  // Main Content Render (data exists or subsequent loading)
  return (
    <div className="min-h-screen text-gray-900">
      <div className="w-full">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <PageHeader />
        </motion.div>

        {/* Stats Cards - Only show if history exists */}
        {viewHistory.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <StatCard
              icon={Layers}
              label="Total Views" // Changed label
              value={stats.totalItems}
            />
            <StatCard
              icon={Clock}
              label="Avg. View Time (Page)"
              value={stats.avgViewTime}
              unit="s"
            />
            <StatCard
              icon={Laptop}
              label="Devices Used (Page)"
              value={stats.deviceCount}
            />
          </motion.div>
        )}

        {/* Controls and Filters */}
        <motion.div
          className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 py-3 px-4 sm:px-6 bg-white rounded-xl border border-violet-100 relative overflow-hidden"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }} // Slight delay after stats
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-50/40 to-transparent rounded-full -mr-24 -mt-24 opacity-70"></div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-violet-50 rounded-lg p-1 self-start md:self-center relative z-10"> {/* Align left on mobile */}
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 text-sm ${
                viewMode === "grid"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-violet-700 hover:bg-violet-100"
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} /> Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 text-sm ${
                viewMode === "list"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-violet-700 hover:bg-violet-100"
              }`}
              aria-label="List view"
            >
              <List size={16} /> List
            </button>
          </div>

          {/* Device Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar max-w-full w-full md:w-auto md:justify-center relative z-10"> {/* Take full width on mobile */}
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-all duration-200 flex items-center gap-1 flex-shrink-0 ${ // Added flex-shrink
                activeFilter === "all"
                  ? "bg-violet-100 text-violet-700 font-medium ring-1 ring-violet-200 shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-violet-50 hover:text-violet-600"
              }`}
            >
              All Devices
            </button>
            {stats.devices.map((device) => (
              <button
                key={device}
                onClick={() => setActiveFilter(device)}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-all duration-200 flex items-center flex-shrink-0 ${ // Added flex-shrink
                  activeFilter === device
                    ? "bg-violet-100 text-violet-700 font-medium ring-1 ring-violet-200 shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                }`}
              >
                <DeviceIcon device={device} className="w-4 h-4 mr-1" /> {/* Adjusted margin */}
                <span className="capitalize">{device}</span>
              </button>
            ))}
          </div>

          {/* Total items count */}
           <div className="text-sm text-violet-700 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100 flex items-center gap-1.5 self-end md:self-center whitespace-nowrap shadow-sm relative z-10"> {/* Align right on mobile */}
             <CalendarLucideIcon className="w-4 h-4 text-violet-500" />
             Showing {filteredHistory.length}
             {activeFilter !== 'all' && ` on ${activeFilter}`}
             {` of ${stats.totalItems} total`}
           </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl border border-violet-100 p-4 sm:p-6 mb-8 relative min-h-[300px] shadow-sm">
          {/* Loading Overlay for page changes */}
          <AnimatePresence>
              {loading && hasFetchedOnce && (
                  <motion.div
                      key="loading-overlay"
                      className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                  >
                      <div className="flex items-center justify-center gap-2 text-violet-700 bg-violet-50 px-4 py-2 rounded-lg border border-violet-100 shadow-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                      <span>Loading page {pagination.page}...</span>
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>

          {/* Empty Filter State */}
          {!loading && filteredHistory.length === 0 && activeFilter !== "all" && viewHistory.length > 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchX className="w-8 h-8 text-violet-400" />
              </div>
              <p className="text-gray-800 font-medium mb-2">No history found for '{activeFilter}' device.</p>
              <p className="text-gray-500 mb-5 text-sm">Try selecting 'All Devices' to see your full history.</p>
              <button
                onClick={() => setActiveFilter("all")}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all inline-flex items-center gap-2 text-sm shadow-sm"
              >
                <RotateCw className="w-4 h-4" />
                Show All Devices
              </button>
            </div>
          )}

          {/* History Grid/List */}
          {filteredHistory.length > 0 && (
             <motion.div
               layout // Enable layout animation for add/remove/reorder
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               exit="hidden" // Apply exit animation variant
               className={
                 viewMode === "grid"
                   ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" // Responsive gaps
                   : "space-y-4"
               }
             >
               <AnimatePresence mode="popLayout">
                 {filteredHistory.map((view) => (
                   <HistoryItemCard key={view._id} view={view} viewMode={viewMode} />
                 ))}
               </AnimatePresence>
             </motion.div>
           )}

        </div>

        {/* Recommendations Section */}
        {showRecommendations && (recommendations.length > 0 || loadingRecommendations) && viewHistory.length > 0 && ( // Only show if history isn't empty and recommendations are enabled
          <motion.div
            className="mt-12 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    <span className="bg-gradient-to-r from-violet-700 to-violet-500 bg-clip-text text-transparent">Recommended For You</span>
                  </h2>
                </div>
                <p className="text-sm text-gray-600">
                  Based on your recent browsing history
                </p>
              </div>

              <Link href="/recommendations" passHref legacyBehavior>
                <a className="text-sm text-violet-600 hover:text-violet-800 transition-all flex items-center gap-1 px-3 py-1.5 rounded-lg border border-violet-200 bg-white hover:bg-violet-50 shadow-sm flex-shrink-0 self-start sm:self-center group">
                  View All ({recommendations.length}+) {/* Indicate more */}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </a>
              </Link>
            </div>

            {loadingRecommendations ? (
              <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-violet-100 shadow-sm">
                <div className="flex flex-col items-center text-center px-4">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
                  <p className="text-sm text-gray-700 font-medium">Finding recommendations...</p>
                  <p className="text-xs text-gray-500 mt-1">Analyzing your viewing patterns.</p>
                </div>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {recommendations.map((product, index) => ( // Already limited to 3 by fetch
                  <RecommendationItemCard
                    key={product._id}
                    product={product}
                    delay={index} // Pass index for potential stagger animation
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}


        {/* Enhanced Pagination - Only show if needed */}
        {pagination.pages > 1 && (
           <motion.div
             className="flex justify-center py-8"
             variants={fadeIn}
             initial="hidden"
             animate="visible"
             transition={{ delay: 0.3 }}
           >
             <nav aria-label="Pagination" className="flex flex-wrap justify-center items-center gap-3">
               <div className="flex items-center bg-white rounded-lg shadow-sm border border-violet-100">
                 <button
                   onClick={() => handlePageChange(pagination.page - 1)}
                   disabled={pagination.page <= 1 || loading} // Disable while loading
                   className="p-2 rounded-l-lg disabled:opacity-40 disabled:cursor-not-allowed text-violet-600 hover:bg-violet-50 transition-all focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-1"
                   aria-label="Previous page"
                 >
                   <ChevronLeft className="w-5 h-5" />
                 </button>

                 {/* Page Numbers Logic */}
                 <div className="flex items-center border-l border-r border-violet-100">
                   {(() => {
                      const pageNumbers = [];
                      const totalPages = pagination.pages;
                      const currentPage = pagination.page;
                      const maxVisible = 5; // Max visible page buttons (including ellipsis)

                      if (totalPages <= maxVisible) {
                        for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
                      } else {
                        pageNumbers.push(1); // Always show first page
                        const startEllipsis = currentPage > 3;
                        const endEllipsis = currentPage < totalPages - 2;
                        const startRange = startEllipsis ? Math.max(2, currentPage - 1) : 2;
                        const endRange = endEllipsis ? Math.min(totalPages - 1, currentPage + 1) : totalPages - 1;

                        if (startEllipsis) pageNumbers.push('...');

                        for (let i = startRange; i <= endRange; i++) {
                          if (i > 1 && i < totalPages) pageNumbers.push(i);
                        }

                        if (endEllipsis) pageNumbers.push('...');

                        pageNumbers.push(totalPages); // Always show last page
                      }

                      // Remove duplicate ellipsis if range touches edges
                      const uniquePageNumbers = pageNumbers.filter((page, index, self) =>
                         page !== '...' || self.indexOf(page) === index || (index > 0 && self[index - 1] !== '...')
                       );


                     return uniquePageNumbers.map((page, index) =>
                       typeof page === "number" ? (
                         <button
                           key={`page-${page}`}
                           onClick={() => handlePageChange(page)}
                           disabled={loading} // Disable while loading
                           className={`w-9 h-9 flex items-center justify-center text-sm transition-all border-l border-violet-100 first:border-l-0 ${
                             currentPage === page
                               ? "bg-violet-600 text-white font-medium z-10 relative"
                               : "text-gray-700 hover:bg-violet-50 disabled:hover:bg-transparent"
                           } focus:outline-none focus:ring-1 focus:ring-violet-300 focus:z-10`}
                            aria-current={currentPage === page ? 'page' : undefined}
                         >
                           {page}
                         </button>
                       ) : (
                         <span
                           key={`ellipsis-${index}`}
                           className="w-9 h-9 flex items-center justify-center text-gray-500 text-sm border-l border-violet-100 first:border-l-0"
                           aria-hidden="true"
                         >
                           {page}
                         </span>
                       )
                     );
                   })()}
                 </div>

                 <button
                   onClick={() => handlePageChange(pagination.page + 1)}
                   disabled={pagination.page >= pagination.pages || loading} // Disable while loading
                   className="p-2 rounded-r-lg disabled:opacity-40 disabled:cursor-not-allowed text-violet-600 hover:bg-violet-50 transition-all focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-1"
                   aria-label="Next page"
                 >
                   <ChevronRight className="w-5 h-5" />
                 </button>
               </div>

               {/* Page size indicator */}
               {/* <div className="text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                 Page {pagination.page} of {pagination.pages}
               </div> */}
             </nav>
           </motion.div>
         )}

      </div>
    </div>
  );
};

export default UserViewHistory; // Keep default export