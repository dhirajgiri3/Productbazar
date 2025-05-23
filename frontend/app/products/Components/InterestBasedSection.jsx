"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import NumberedProductList from "./NumberedProductList";
import { useRecommendation } from "@/lib/contexts/recommendation-context";
import { useAuth } from "@/lib/contexts/auth-context";
import { globalRecommendationTracker } from "@/lib/utils/recommendation-utils";
import logger from "@/lib/utils/logger";
import { Star } from "lucide-react";

// Section wrapper for consistent styling and animations
const SectionWrapper = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={`w-full ${className}`}
  >
    {children}
  </motion.div>
);

const InterestBasedSection = ({ componentName = 'home', products = [], isLoading: externalLoading = false, error: externalError = null }) => {
  const { isAuthenticated } = useAuth();
  const { getInterestsRecommendations } = useRecommendation();
  const [isLoading, setIsLoading] = useState(externalLoading);
  const [interestProducts, setInterestProducts] = useState(products);
  const [error, setError] = useState(externalError);

  // Update local state when props change
  useEffect(() => {
    if (products.length > 0) {
      setInterestProducts(products);
      setIsLoading(false);
    }
    if (externalError) {
      setError(externalError);
    }
  }, [products, externalError]);

  useEffect(() => {
    let isMounted = true;

    // Skip fetching if we already have products from props
    if (products.length > 0) {
      return;
    }

    const fetchRecommendations = async () => {
      // Only show loading state if we don't have any data yet
      if (interestProducts.length === 0) {
        if (isMounted) setIsLoading(true);
      }

      try {
        // The context now handles caching, in-flight requests, and rate limiting
        // Request more recommendations to ensure we have enough distinct ones
        const results = await getInterestsRecommendations(12, 0, false);

        // Only update state if component is still mounted and we got results
        if (isMounted && results && results.length > 0) {
          // Get distinct recommendations that haven't been seen in other sections
          const distinctResults = globalRecommendationTracker.getDistinct(
            results,
            6
          );
          globalRecommendationTracker.markAsSeen(distinctResults);

          setInterestProducts(distinctResults);

          // Only log once per component mount
          if (!window._loggedInterestsLoad) {
            logger.debug(`Loaded ${distinctResults.length} interest-based recommendations`);
            window._loggedInterestsLoad = true;
          }
        }
      } catch (error) {
        if (
          error.name !== "CanceledError" &&
          error.code !== "ERR_CANCELED" &&
          isMounted
        ) {
          console.error(
            "Failed to fetch interest-based recommendations:",
            error
          );
          setError("Failed to load recommendations based on your interests");
        }
        // Keep showing existing data if we have it
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Only fetch if authenticated
    if (isAuthenticated) {
      fetchRecommendations();
    } else if (isMounted) {
      setIsLoading(false);
    }

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, getInterestsRecommendations, products.length, interestProducts.length]);

  if (!isAuthenticated) return null;

  // Always render the section, even with empty data
  // The NumberedProductList component will handle showing the empty state

  return (
    <SectionWrapper delay={0.4}>
      <div className="bg-white rounded-xl overflow-hidden p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-violet-600 mr-2">
              <Star className="w-6 h-6" />
            </span>
            <h2 className="text-2xl font-bold text-gray-900">Based on Your Interests</h2>
          </div>
        </div>
        <NumberedProductList
          products={interestProducts}
          isLoading={isLoading}
          emptyMessage="We're analyzing your interests to find the perfect products for you. Explore more to get better recommendations!"
          viewAllLink="/recommendations?filter=interests"
          recommendationType="interests"
        />
      </div>
    </SectionWrapper>
  );
};
export default InterestBasedSection;
