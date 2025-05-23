// file: frontend/components/SimilarProductsSection.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRecommendation } from "@/lib/contexts/recommendation-context";
import ProductCard from "Components/Product/ProductCard";
import logger from "@/lib/utils/logger";
import { motion } from "framer-motion";
import { FiArrowRight, FiArrowLeft, FiPackage } from "react-icons/fi";

const SimilarProductsSection = ({ productId, limit = 5 }) => {
  const { getSimilarRecommendations } = useRecommendation();
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);

  // Scroll controls for horizontal scrolling
  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Skip if no productId
    if (!productId) {
      setError("No product ID provided");
      setLoading(false);
      return;
    }

    // Create a unique ID for this fetch operation to prevent duplicate logs
    const fetchId = `similar-${productId}-${Date.now()}`;

    // Check if we've already fetched this data recently
    const fetchKey = `similar_products_${productId}`;
    const lastFetch = sessionStorage.getItem(fetchKey);
    const now = Date.now();
    const FETCH_TTL = 60000; // 1 minute cache

    if (lastFetch && (now - parseInt(lastFetch)) < FETCH_TTL) {
      // If we've fetched this recently, don't log to reduce console spam
      // This is just a silent early return
      return;
    }

    const fetchSimilarProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mark as fetched before the API call to prevent duplicate requests
        try {
          sessionStorage.setItem(fetchKey, now.toString());
        } catch (e) {
          // Ignore storage errors
        }

        // Fetch similar products using the context function
        // Force refresh=false to use cache if available
        const recommendations = await getSimilarRecommendations(
          productId,
          limit,
          false // Don't force refresh
        );

        if (!Array.isArray(recommendations)) {
          throw new Error("Invalid response format from recommendations");
        }

        // Only log once per session to reduce console spam
        const logKey = `similar_log_${productId}`;
        if (!sessionStorage.getItem(logKey)) {
          logger.debug(`Similar products recommendations (${fetchId}):`,
            recommendations.map(rec => ({
              id: rec._id || rec.productId,
              hasUpvoted: rec.productData?.userInteractions?.hasUpvoted || rec.productData?.upvotes?.userHasUpvoted,
              hasBookmarked: rec.productData?.userInteractions?.hasBookmarked || rec.productData?.bookmarks?.userHasBookmarked
            }))
          );

          // Mark as logged
          try {
            sessionStorage.setItem(logKey, '1');
            // Clean up after 10 seconds
            setTimeout(() => sessionStorage.removeItem(logKey), 10000);
          } catch (e) {
            // Ignore storage errors
          }
        }

        setSimilarProducts(recommendations);
      } catch (err) {
        logger.error(`Error fetching similar products (${fetchId}):`, err);
        setError(err.message || "Failed to load similar products");
        setSimilarProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarProducts();

    // Clean up function
    return () => {
      // Optional: Clean up any resources if needed
    };
  }, [productId, limit]); // Removed getSimilarRecommendations from deps to prevent unnecessary re-fetches

  // Section header component
  const SectionHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-lg text-white shadow-sm">
          <FiPackage size={20} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Similar Products</h2>
      </div>

      {similarProducts.length > 2 && (
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-violet-600 transition-colors shadow-sm"
            aria-label="Scroll left"
          >
            <FiArrowLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-violet-600 transition-colors shadow-sm"
            aria-label="Scroll right"
          >
            <FiArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="mt-12 py-8">
        <SectionHeader />
        <div className="flex space-x-6 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[280px] w-[280px] animate-pulse">
              <div className="h-40 bg-gray-200 rounded-xl mb-3"></div>
              <div className="h-5 bg-gray-200 rounded-full w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-full w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-full w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-12 py-8">
        <SectionHeader />
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-sm">
          <div className="text-red-500 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load recommendations</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!similarProducts.length) {
    return (
      <div className="mt-12 py-8">
        <SectionHeader />
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-sm">
          <div className="text-gray-400 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No similar products found</h3>
          <p className="text-gray-600">We couldn't find any products similar to this one.</p>
        </div>
      </div>
    );
  }

  // Success state with horizontal scrolling
  return (
    <motion.div
      className="mt-12 py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SectionHeader />

      <div
        ref={scrollContainerRef}
        className="flex space-x-6 overflow-x-auto pb-4 hide-scrollbar snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {similarProducts.map((product, index) => (
          <div key={product._id || product.productId || index} className="snap-start">
            <ProductCard
              product={product.productData || product}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SimilarProductsSection;
