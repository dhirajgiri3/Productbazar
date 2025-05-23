"use client";

import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import NumberedProductList from "./NumberedProductList";
import { useRecommendation } from "@/lib/contexts/recommendation-context";
import { globalRecommendationTracker } from "@/lib/utils/recommendation-utils";
import logger from "@/lib/utils/logger";

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

const HybridFeedSection = ({ componentName = 'home', products = [], isLoading: externalLoading = false, error: externalError = null }) => {
  const { getFeedRecommendations } = useRecommendation();
  const [isLoading, setIsLoading] = useState(externalLoading);
  const [hybridProducts, setHybridProducts] = useState(products);
  const [error, setError] = useState(externalError);

  // Update local state when props change
  useEffect(() => {
    if (products.length > 0) {
      setHybridProducts(products);
      setIsLoading(false);
    }
    if (externalError) {
      setError(externalError);
    }
  }, [products, externalError]);

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    // Skip fetching if we already have products from props
    if (products.length > 0) {
      return;
    }

    const fetchHybridFeed = async () => {
      // Only show loading state if we don't have any data yet
      if (hybridProducts.length === 0) {
        if (isMounted) setIsLoading(true);
      }

      try {
        // Check if we've fetched recently to avoid excessive API calls
        const lastFetchKey = `hybrid_feed_last_fetch_${componentName || 'home'}`;
        const lastFetch = parseInt(sessionStorage.getItem(lastFetchKey) || '0');
        const now = Date.now();
        const refreshInterval = 2 * 60 * 1000; // 2 minutes

        // If we have data and fetched recently, skip the fetch
        if (hybridProducts.length > 0 && now - lastFetch < refreshInterval) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // Use the hybrid feed endpoint with discovery blend for more diverse recommendations
        const options = {
          blend: "discovery", // Use discovery blend for more diverse recommendations
          sortBy: "score", // Sort by recommendation score
          // Add source distribution parameters to ensure consistent distribution
          sourceDistribution: {
            trending: 0.4, // 40% trending
            interests: 0.3, // 30% interests
            discovery: 0.3  // 30% discovery
          },
          signal: abortController.signal // Add abort signal for cleanup
        };

        // The context now handles caching, in-flight requests, and rate limiting
        // Request more recommendations to ensure we have enough distinct ones
        const results = await getFeedRecommendations(12, 0, options, false);

        // Only update state if component is still mounted and we got results
        if (isMounted && results && results.length > 0) {
          // Get distinct recommendations that haven't been seen in other sections
          const distinctResults = globalRecommendationTracker.getDistinct(
            results,
            6
          );

          setHybridProducts(distinctResults);

          // Store the fetch time
          try {
            sessionStorage.setItem(lastFetchKey, now.toString());
          } catch (e) {
            // Ignore storage errors
          }

          // Log the source distribution for debugging - but only in development
          if (process.env.NODE_ENV === 'development') {
            const sourceDistribution = {};
            distinctResults.forEach(item => {
              const source = item.source || 'unknown';
              sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
            });

            // Only log once per component mount and only in development
            const logKey = `hybrid_feed_log_${componentName || 'home'}`;
            const lastLog = parseInt(sessionStorage.getItem(logKey) || '0');

            // Only log once every 30 seconds
            if (now - lastLog > 30000) {
              logger.debug(`Loaded ${distinctResults.length} hybrid feed recommendations`);
              logger.debug(`Feed recommendations source distribution: ${JSON.stringify(sourceDistribution)}`);

              try {
                sessionStorage.setItem(logKey, now.toString());
              } catch (e) {
                // Ignore storage errors
              }
            }
          }
        } else if (isMounted) {
          logger.warn("No hybrid feed recommendations returned");
        }
      } catch (error) {
        if (
          error.name !== "CanceledError" &&
          error.code !== "ERR_CANCELED" &&
          !abortController.signal.aborted &&
          isMounted
        ) {
          logger.error("Failed to fetch hybrid feed recommendations:", error);
          setError("Failed to load hybrid feed recommendations");
        }
        // Keep showing existing data if we have it
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHybridFeed();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [getFeedRecommendations, hybridProducts.length, componentName, products.length]);

  // Always render the section, even with empty data
  // The NumberedProductList component will handle showing the empty state

  return (
    <SectionWrapper delay={0.6}>
      <div className="bg-white rounded-xl overflow-hidden p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-violet-600 mr-2">
              <Zap className="w-6 h-6" />
            </span>
            <h2 className="text-2xl font-bold text-gray-900">Discover More</h2>
          </div>
        </div>
        <NumberedProductList
          products={hybridProducts}
          isLoading={isLoading}
          emptyMessage="We're curating a diverse selection of products for you. Check back soon!"
          viewAllLink="/discover"
          recommendationType="discovery"
        />
      </div>
    </SectionWrapper>
  );
};

export default HybridFeedSection;
