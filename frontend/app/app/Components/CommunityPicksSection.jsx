"use client";

import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import NumberedProductList from "./NumberedProductList";
import { useRecommendation } from "@/lib/contexts/recommendation-context";
import { useAuth } from "@/lib/contexts/auth-context";
import { globalRecommendationTracker } from "@/lib/utils/recommendation-utils";
import logger from "@/lib/utils/logger";

const CommunityPicksSection = ({ componentName = 'home', products = [], isLoading: externalLoading = false, error: externalError = null }) => {
  const { getCollaborativeRecommendations } = useRecommendation();
  const { isAuthenticated } = useAuth();
  const [communityPicks, setCommunityPicks] = useState(products);
  const [isLoading, setIsLoading] = useState(externalLoading);
  const [error, setError] = useState(externalError);

  // Update local state when props change
  useEffect(() => {
    if (products.length > 0) {
      setCommunityPicks(products);
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

    const fetchCommunityPicks = async () => {
      // Only show loading state if we don't have any data yet
      if (communityPicks.length === 0) {
        if (isMounted) setIsLoading(true);
      }

      setError(null);

      try {
        // Check if we've fetched recently to avoid excessive API calls
        const lastFetchKey = `community_picks_last_fetch_${componentName}`;
        const lastFetch = parseInt(sessionStorage.getItem(lastFetchKey) || '0');
        const now = Date.now();
        const refreshInterval = 2 * 60 * 1000; // 2 minutes

        // If we have data and fetched recently, skip the fetch
        if (communityPicks.length > 0 && now - lastFetch < refreshInterval) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // Call the getCollaborativeRecommendations function directly
        // It already has caching and error handling built in
        const recommendations = await getCollaborativeRecommendations(10, 0, false);

        // Note: The signal is handled internally by the fetchRecommendations function

        if (isMounted && recommendations && recommendations.length > 0) {
          setCommunityPicks(recommendations);
          // Mark these recommendations as seen to prevent duplicates in other sections
          globalRecommendationTracker.markAsSeen(recommendations);

          // Store the fetch time
          try {
            sessionStorage.setItem(lastFetchKey, now.toString());
          } catch (e) {
            // Ignore storage errors
          }

          // Only log in development and with rate limiting
          if (process.env.NODE_ENV === 'development') {
            const logKey = `community_picks_log_${componentName}`;
            const lastLog = parseInt(sessionStorage.getItem(logKey) || '0');

            // Only log once every 30 seconds
            if (now - lastLog > 30000) {
              logger.debug(`Loaded ${recommendations.length} community picks recommendations for ${componentName}`);

              try {
                sessionStorage.setItem(logKey, now.toString());
              } catch (e) {
                // Ignore storage errors
              }
            }
          }
        } else if (isMounted && (!recommendations || recommendations.length === 0)) {
          // Only log a warning if we don't have existing data
          if (communityPicks.length === 0) {
            logger.warn("No community picks found or invalid response format");
          }
        }
      } catch (err) {
        if (isMounted && !abortController.signal.aborted) {
          logger.error("Error fetching community picks:", err);
          // Only set error if we don't have existing data
          if (communityPicks.length === 0) {
            setError("Failed to load community picks. Please try again later.");
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchCommunityPicks();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [getCollaborativeRecommendations, isAuthenticated, communityPicks.length, componentName, products.length]);

  if (!isAuthenticated) return null;

  // Always render the section, even with empty data
  // The NumberedProductList component will handle showing the empty state

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center">
          <Users className="w-6 h-6 text-violet-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Community Picks</h2>
        </div>
        <NumberedProductList
          products={communityPicks}
          isLoading={isLoading}
          emptyMessage="We're gathering community favorites. Check back soon!"
          viewAllLink="/recommendations?filter=community"
          recommendationType="community"
        />
      </div>
    </motion.div>
  );
};

export default CommunityPicksSection;
