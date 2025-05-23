"use client";

import React, { useEffect, useState } from "react";

import NumberedProductList from "./NumberedProductList";
import { useRecommendation } from "@/lib/contexts/recommendation-context";
import { globalRecommendationTracker } from "@/lib/utils/recommendation-utils";
import logger from "@/lib/utils/logger";
import { makePriorityRequest } from "@/lib/api/api";



const NewProductsSection = ({ products = [], isLoading: externalLoading = false, error: externalError = null }) => {
  const { getNewRecommendations } = useRecommendation();
  const [newProducts, setNewProducts] = useState(products);
  const [isLoading, setIsLoading] = useState(externalLoading);
  const [error, setError] = useState(externalError);

  // Update local state when props change
  useEffect(() => {
    // Log the products received from props for debugging
    logger.debug('NewProductsSection received products:', {
      count: products?.length || 0,
      isArray: Array.isArray(products),
      firstItem: products && products.length > 0 ? {
        id: products[0]._id || products[0].product || (products[0].productData && products[0].productData._id),
        hasProductData: !!products[0].productData,
        reason: products[0].reason,
        keys: Object.keys(products[0])
      } : null
    });

    // Only update if we have valid products
    if (Array.isArray(products) && products.length > 0) {
      setNewProducts(products);
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

    const fetchNewProducts = async () => {
      // Only show loading state if we don't have any data yet
      if (newProducts.length === 0) {
        if (isMounted) setIsLoading(true);
      }

      try {
        // Check if we've fetched recently to avoid excessive API calls
        const lastFetchKey = 'new_products_last_fetch';
        const lastFetch = parseInt(sessionStorage.getItem(lastFetchKey) || '0');
        const now = Date.now();
        const refreshInterval = 2 * 60 * 1000; // 2 minutes

        // If we have data and fetched recently, skip the fetch
        if (newProducts.length > 0 && now - lastFetch < refreshInterval) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // The context now handles caching, in-flight requests, and rate limiting
        // Request more recommendations to ensure we have enough distinct ones
        const options = {
          signal: abortController.signal // Add abort signal for cleanup
        };

        const results = await getNewRecommendations(12, 0, 14, false, options);

        // Only update state if component is still mounted and we got valid results
        if (isMounted) {
          if (Array.isArray(results)) {
            // Log the results for debugging
            logger.debug(`New products results received: ${results.length}`, {
              isEmpty: results.length === 0,
              firstItem: results.length > 0 ? {
                hasProductData: !!results[0].productData,
                hasProduct: !!results[0].product,
                keys: Object.keys(results[0])
              } : null
            });

            // Even if results array is empty, update the state to reflect the current data
            // This ensures we show the empty state message instead of loading indefinitely
            const distinctResults = results.length > 0
              ? globalRecommendationTracker.getDistinct(results, 6)
              : [];

            if (distinctResults.length > 0) {
              globalRecommendationTracker.markAsSeen(distinctResults);
            }

            setNewProducts(distinctResults);

            // Store the fetch time
            try {
              sessionStorage.setItem(lastFetchKey, now.toString());
            } catch (e) {
              // Ignore storage errors
            }

            // Only log in development and with rate limiting
            if (process.env.NODE_ENV === 'development') {
              const logKey = 'new_products_log';
              const lastLog = parseInt(sessionStorage.getItem(logKey) || '0');

              // Only log once every 30 seconds
              if (now - lastLog > 30000) {
                logger.debug(`Loaded ${distinctResults.length} new product recommendations`);

                try {
                  sessionStorage.setItem(logKey, now.toString());
                } catch (e) {
                  // Ignore storage errors
                }
              }
            }

            // Clear any previous errors
            if (error) setError(null);
          } else if (newProducts.length === 0) {
            // Only show warning if we don't have existing data
            logger.warn("No new products found or invalid response format");

            // Try to fetch new products directly from the products API as fallback
            try {
              // Use the API utility for better error handling and consistency
              // First try the recommendations endpoint with higher priority
              const response = await makePriorityRequest('GET', '/recommendations/new', {
                params: {
                  limit: 6,
                  days: 30,
                  _t: Date.now(), // Cache busting
                  _priority: 'high' // Ensure high priority
                },
                signal: abortController.signal,
                retryCount: 1 // Start with retry count 1 to enable automatic retries
              });

              if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                // The data is already in the correct format for recommendations API
                const transformedData = response.data.data;
                // Mark these recommendations as seen to prevent duplicates
                globalRecommendationTracker.markAsSeen(transformedData);
                setNewProducts(transformedData);

                // Store the fetch time for the fallback as well
                try {
                  sessionStorage.setItem(lastFetchKey, now.toString());
                } catch (e) {
                  // Ignore storage errors
                }

                // Only log in development
                if (process.env.NODE_ENV === 'development') {
                  logger.info(`Loaded ${transformedData.length} new products from fallback API`);
                }

                if (error) setError(null);
              }
            } catch (fallbackError) {
              if (!abortController.signal.aborted) {
                logger.error("Fallback new products fetch failed:", fallbackError);

                // Try one more fallback to the direct products API
                try {
                  // Use the API utility for better error handling and consistency
                  // Try the recent products endpoint first
                  const response = await makePriorityRequest('GET', '/products/recent', {
                    params: {
                      limit: 6,
                      days: 30,
                      _t: Date.now(), // Cache busting
                      _priority: 'high' // Ensure high priority
                    },
                    signal: abortController.signal,
                    retryCount: 1 // Start with retry count 1 to enable automatic retries
                  });

                  if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                    // Transform the data to match the expected format
                    const transformedData = response.data.data.map(product => ({
                      productData: product,
                      product: product._id,
                      score: 1.0,
                      reason: 'new',
                      explanationText: 'Recently added product'
                    }));

                    logger.info(`Successfully fetched ${transformedData.length} new products from recent products API`);
                    setNewProducts(transformedData);

                    // Store the fetch time for the second fallback as well
                    try {
                      sessionStorage.setItem(lastFetchKey, now.toString());
                    } catch (e) {
                      // Ignore storage errors
                    }

                    // Only log in development
                    if (process.env.NODE_ENV === 'development') {
                      logger.info(`Loaded ${transformedData.length} new products from second fallback API`);
                    }

                    if (error) setError(null);
                  }
                } catch (secondFallbackError) {
                  if (!abortController.signal.aborted) {
                    logger.error("Second fallback new products fetch failed:", secondFallbackError);

                    // Try one last fallback to trending products
                    try {
                      const response = await makePriorityRequest('GET', '/products/trending', {
                        params: {
                          limit: 6,
                          timeRange: '30d',
                          _t: Date.now(), // Cache busting
                          _priority: 'high' // Ensure high priority
                        },
                        signal: abortController.signal,
                        retryCount: 1 // Start with retry count 1 to enable automatic retries
                      });

                      if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                        // Transform the data to match the expected format
                        const transformedData = response.data.data.map(product => ({
                          productData: product,
                          product: product._id,
                          score: 1.0,
                          reason: 'new',
                          explanationText: 'Recently added product'
                        }));

                        logger.info(`Successfully fetched ${transformedData.length} new products from trending products API as last resort`);
                        setNewProducts(transformedData);

                        // Store the fetch time for the third fallback as well
                        try {
                          sessionStorage.setItem(lastFetchKey, now.toString());
                        } catch (e) {
                          // Ignore storage errors
                        }

                        if (error) setError(null);
                      }
                    } catch (thirdFallbackError) {
                      if (!abortController.signal.aborted) {
                        logger.error("All fallback attempts for new products failed", thirdFallbackError);
                      }
                    }
                  }
                }
              }
            }
          }
          if (isMounted) setIsLoading(false);
        }
      } catch (error) {
        if (error.name !== 'CanceledError' &&
            error.code !== 'ERR_CANCELED' &&
            !abortController.signal.aborted &&
            isMounted) {
          logger.error("Failed to fetch new products:", error);
          // Only set error if we don't have existing data and component is mounted
          if (isMounted && newProducts.length === 0) {
            setError("Failed to load new products");
          }
        }
        // Set loading to false if component is still mounted
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchNewProducts();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [getNewRecommendations, error, newProducts.length, products.length]);

  return (
    <div>
      {error ? (
        <div className="text-center py-4">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-violet-600 hover:text-violet-700 text-sm font-medium px-4 py-2 bg-violet-50 rounded-lg"
          >
            Try again
          </button>
        </div>
      ) : (
        <NumberedProductList
          products={newProducts}
          isLoading={isLoading}
          emptyMessage="No new products available at the moment. Check back soon!"
          viewAllLink="/new"
          recommendationType="new"
        />
      )}
    </div>
  );
};

export default NewProductsSection;
