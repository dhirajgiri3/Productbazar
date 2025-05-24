// file: frontend/components/ProductCard.jsx
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowUp, FiEye } from "react-icons/fi";

// Memoize the component to prevent unnecessary re-renders
const ProductCard = React.memo(function ProductCard({ product, viewMode = "grid" }) {
  // Destructure product data with fallbacks
  const {
    _id,
    slug,
    name = "Unnamed Product",
    tagline = "No description available",
    description = "No description available",
    thumbnail = "https://via.placeholder.com/300x200?text=No+Image",
    image = thumbnail,
    upvotes = { count: 0 },
    views = { count: 0 },
    categoryName = "Uncategorized",
    category = { name: categoryName },
    tags = [],
  } = product;

  // Use the appropriate image source
  const imageUrl = thumbnail || image;
  // Ensure upvote count is properly initialized from all possible sources
  const upvoteCount = product.upvoteCount ?? upvotes?.count ?? 0;
  // Ensure view count is properly initialized
  const viewCount = product.viewCount ?? views?.count ?? 0;
  // Ensure bookmark count is properly initialized (for future use)
  const bookmarkCount = product.bookmarkCount ?? product.bookmarks?.count ?? 0;

  // Determine if we're using grid or list view
  const isGridView = viewMode === "grid";

  if (isGridView) {
    // Grid View Layout
    return (
      <Link href={`/product/${slug}`} className="block">
        <motion.div
          whileHover={{ y: -5 }}
          className="min-w-[280px] w-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          {/* Image Section with gradient overlay for better text visibility */}
          <div className="relative w-full h-40 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70"></div>

            {/* Category Badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-white/90 backdrop-blur-sm text-violet-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                {category.name || categoryName}
              </span>
            </div>

            {/* Product Name - positioned at bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2 text-shadow">
                {name}
              </h3>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4">
            {/* Tagline/Description */}
            <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
              {tagline || description}
            </p>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span key="more" className="text-xs text-gray-500 px-1">+{tags.length - 2}</span>
                )}
              </div>
            )}

            {/* Footer with Stats */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center text-gray-500 text-xs">
                  <FiArrowUp className="mr-1" />
                  <span>{upvoteCount}</span>
                </div>
                <div className="flex items-center text-gray-500 text-xs">
                  <FiEye className="mr-1" />
                  <span>{viewCount}</span>
                </div>
              </div>

              <span className="text-xs font-medium text-violet-600 group-hover:text-violet-800 transition-colors flex items-center">
                View Details
                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>

          {/* Add a global style for text shadow */}
          <style jsx global>{`
            .text-shadow {
              text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
          `}</style>
        </motion.div>
      </Link>
    );
  } else {
    // List View Layout
    return (
      <Link href={`/product/${slug}`} className="block">
        <motion.div
          whileHover={{ y: -5 }}
          className="w-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <div className="flex">
            {/* Image Section */}
            <div className="w-1/4 min-w-[120px]">
              <div className="relative h-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-70"></div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-white/90 backdrop-blur-sm text-violet-800 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                    {category.name || categoryName}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-violet-600 transition-colors">{name}</h3>

              {/* Tagline/Description */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {tagline || description}
              </p>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {tags.length > 2 && (
                    <span key="more" className="text-xs text-gray-500 px-1">+{tags.length - 2}</span>
                  )}
                </div>
              )}

              {/* Footer with Stats */}
              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-gray-500 text-xs">
                    <FiArrowUp className="mr-1" />
                    <span>{upvoteCount}</span>
                  </div>
                  <div className="flex items-center text-gray-500 text-xs">
                    <FiEye className="mr-1" />
                    <span>{viewCount}</span>
                  </div>
                </div>

                <span className="text-xs font-medium text-violet-600 group-hover:text-violet-800 transition-colors flex items-center">
                  View Details
                  <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Add a global style for text shadow */}
          <style jsx global>{`
            .text-shadow {
              text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
          `}</style>
        </motion.div>
      </Link>
    );
  }
});

export default ProductCard;
