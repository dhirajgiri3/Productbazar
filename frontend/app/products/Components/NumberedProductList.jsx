"use client";

import React from "react";
import NumberedProductCard from "./NumberedProductCard";
import { motion } from "framer-motion";
import { Inbox, ArrowRight } from "lucide-react";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const NumberedProductList = ({
  products = [],
  title,
  description,
  emptyMessage = "No products found",
  viewAllLink,
  isLoading = false,
  recommendationType = null,
}) => {
  // Loading State
  if (isLoading) {
    return (
      <div className="w-full h-full">
        {title && (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              {description && (
                <p className="text-gray-600 mt-1 text-sm">{description}</p>
              )}
            </div>
            {viewAllLink && (
              <Link
                href={viewAllLink}
                className="text-violet-600 hover:text-violet-800 text-sm font-medium flex items-center shrink-0 ml-4 bg-violet-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                View All <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            )}
          </div>
        )}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={`skel-${i}`}
              className="bg-white rounded-xl h-24 animate-pulse border border-gray-100 overflow-hidden"
            >
              <div className="flex p-5">
                <div className="w-12 h-12 rounded-lg bg-gray-200 mr-4"></div>
                <div className="w-14 h-14 rounded-lg bg-gray-200 mr-4"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <div className="w-16 h-6 bg-gray-200 rounded-lg"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (!products || products.length === 0) {
    return (
      <div className="w-full h-full">
        {title && (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              {description && (
                <p className="text-gray-600 mt-1 text-sm">{description}</p>
              )}
            </div>
            {viewAllLink && (
              <Link
                href={viewAllLink}
                className="text-violet-600 hover:text-violet-800 text-sm font-medium flex items-center shrink-0 ml-4 bg-violet-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                View All <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            )}
          </div>
        )}
        <motion.div
          className="text-center py-8 px-6 bg-white rounded-xl border border-gray-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-4">{emptyMessage}</p>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="inline-flex items-center px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors text-sm font-medium"
            >
              Browse All <ArrowRight className="ml-1.5 w-4 h-4" />
            </Link>
          )}
        </motion.div>
      </div>
    );
  }

  // Normalize product data structure
  const normalizedProducts = products.map((item) => {
    // Handle null or undefined items
    if (!item) return null;

    // Log the item structure for debugging
    if (process.env.NODE_ENV === 'development') {
      console.debug('Normalizing product item:', {
        hasProductData: !!item.productData,
        hasProduct: !!item.product,
        itemType: typeof item,
        id: item._id || (item.productData && item.productData._id) || (typeof item.product === 'object' ? item.product._id : item.product),
        keys: Object.keys(item)
      });
    }

    // Check if the item has a productData property (from recommendation API)
    if (item.productData) {
      return {
        ...item.productData,
        _id: item.productData._id || item.product || item._id,
        score: item.score,
        reason: item.reason,
        explanationText: item.explanationText || item.reason,
        scoreContext: item.scoreContext,
        metadata: item.metadata,
        userInteractions: item.productData.userInteractions || {},
      };
    }
    // Check if the item has a product property (from older recommendation API)
    else if (item.product) {
      // Handle both string IDs and object references
      if (typeof item.product === 'string') {
        // If product is just an ID string, we need to ensure we have the rest of the data
        return {
          ...item, // Keep all original properties
          _id: item.product, // Use the product ID as the main ID
          score: item.score || 1.0,
          reason: item.reason || 'recommendation',
          explanationText: item.explanationText || item.reason || item.explanation || 'Recommended product',
        };
      } else {
        // If product is an object, use its properties
        return {
          ...(item.product || {}),
          _id: item._id || item.product._id,
          score: item.score,
          reason: item.reason,
          explanationText: item.explanationText || item.reason || item.explanation,
          scoreContext: item.scoreContext,
          userInteractions: (item.product.userInteractions) || {},
        };
      }
    }
    // Handle case where the item itself is the product (direct API response)
    else if (item._id) {
      return {
        ...item,
        score: item.score || 1.0,
        reason: item.reason || 'product',
        explanationText: item.explanationText || item.reason || 'Product',
        userInteractions: item.userInteractions || {},
      };
    }
    // Return the item as is if it's already a product
    return item;
  }).filter(Boolean); // Remove any null items

  // Render List
  return (
    <div className="w-full h-full">
      {title && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="text-gray-600 mt-1 text-sm">{description}</p>
            )}
          </div>
          {viewAllLink && (
            <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={viewAllLink}
                className="text-violet-600 hover:text-violet-800 text-sm font-medium flex items-center shrink-0 ml-4 bg-violet-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                View All <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </div>
      )}
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {normalizedProducts.map((product, index) => (
          <NumberedProductCard
            key={`${product._id || 'unknown'}-${index}`}
            product={product}
            position={index}
            recommendationType={recommendationType}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default NumberedProductList;
