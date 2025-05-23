"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./auth-context";
import { useToast } from "./toast-context";
import api, { makePriorityRequest } from "../api/api.js"; 
import logger from "../utils/logger.js"; 
import { AlertCircle } from "lucide-react";
import { addProductsToMapping } from "../utils/product/product-mapping-utils.js";

const RecommendationContext = createContext();

export const RecommendationProvider = ({ children }) => {
  const { showToast } = useToast();
  // Helper methods for request handling
  const fetchRecommendationsInBackground = async (endpoint, params, cacheType, _cacheParams, requestId, cacheKey, cacheTTL = 60) => {
    try {
      // Create a new request promise but don't await it here
      const requestPromise = createRequestPromise(endpoint, params, cacheType, cacheKey, requestId, cacheTTL);

      // Store the promise in our in-flight tracking
      inFlightRequests.current[requestId] = requestPromise;

      // Execute the promise in the background
      const result = await requestPromise;

      // Update the last fetch time for this request
      lastFetchTimes.current[requestId] = Date.now();

      // The cache is already updated inside createRequestPromise
      return result;
    } catch (err) {
      // Just log the error, don't throw since this is a background operation
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        logger.error(`Background fetch error for ${cacheType}:`, err);
      }
      return null;
    }
  };

  const createRequestPromise = async (endpoint, params, cacheType, cacheKey, requestId, _cacheTTL = 60) => {
    try {
      logger.info(`Fetching ${cacheType} recommendations from API: ${endpoint}`);

      // Add a timestamp to prevent browser caching
      const requestParams = {
        ...params,
        _t: Date.now(), // Add timestamp to bust cache
        _priority: 'high' // Always use high priority for recommendation requests
      };

      // Use makePriorityRequest for important recommendation requests
      // This prevents them from being canceled by less important requests
      const response = await makePriorityRequest('get', endpoint, {
        params: requestParams,
        retryCount: 1 // Start with retry count 1 to enable automatic retries
      });

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            `Failed to fetch ${cacheType} recommendations`
        );
      }

      const recommendations = response.data.data || []; // Default to empty array

      // Add products to the global mapping for socket updates
      addProductsToMapping(recommendations);

      // Cache the data with the specified TTL
      cacheData(cacheKey, recommendations);

      // Log the source distribution for debugging - only once per request
      if (recommendations.length > 0 && cacheType === 'feed') {
        // Create a unique key for this feed request to avoid duplicate logs
        const requestKey = `feed_distribution_${requestId}`;

        // Check if we've already logged this distribution recently
        const lastLogged = sessionStorage.getItem(requestKey);
        const now = Date.now();

        if (!lastLogged || (now - parseInt(lastLogged)) > 5000) { // Only log once every 5 seconds
          const sources = {};
          recommendations.forEach(item => {
            const source = item.reason || 'unknown';
            sources[source] = (sources[source] || 0) + 1;
          });

          logger.debug(`${cacheType} recommendations source distribution:`, sources);

          // Mark as logged
          try {
            sessionStorage.setItem(requestKey, now.toString());
            // Clean up after 10 seconds
            setTimeout(() => sessionStorage.removeItem(requestKey), 10000);
          } catch (e) {
            // Ignore storage errors
          }
        }
      }

      return recommendations;
    } catch (err) {
      // Don't log canceled errors as they're expected during navigation
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        logger.error(`Error fetching ${cacheType} recommendations:`, err);
      }

      // Optionally return stale cache if available on error
      const staleCache = getCachedData(cacheKey);
      if (staleCache) {
        logger.warn(
          `Returning stale cache for ${cacheType} due to fetch error`
        );
        return staleCache;
      }
      throw err; // Re-throw to be caught by the caller
    } finally {
      // Clean up the in-flight request tracking when done
      delete inFlightRequests.current[requestId];
    }
  };
  const { isAuthenticated, user } = useAuth();
  const [settings, setSettings] = useState({
    enablePersonalized: true, // Controls if personalized recommendations are allowed
    diversityLevel: "medium", // Controls diversity in feed (low, medium, high)
    refreshInterval: 15 * 60 * 1000, // Cache refresh interval: 15 minutes in ms
    blend: "standard", // Feed blend strategy (standard, discovery, trending, personalized)
  });
  const [cache, setCache] = useState({ data: {}, lastUpdated: {} });

  // Track in-flight requests to prevent duplicate API calls
  const inFlightRequests = useRef({});

  // Track last successful fetch time for each endpoint to prevent excessive refreshes
  const lastFetchTimes = useRef({});

  // --- Settings Management ---

  // Load settings from localStorage on mount/auth change
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      try {
        const savedSettings = localStorage.getItem(
          `recommendation_settings_${user._id}`
        );
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          // Merge saved settings with defaults to ensure all keys exist
          setSettings((prev) => ({ ...prev, ...parsedSettings }));
        }
      } catch (error) {
        logger.error("Error loading recommendation settings:", error);
        // Clear potentially corrupted settings
        localStorage.removeItem(`recommendation_settings_${user._id}`);
      }
    } else {
      // Reset to defaults if not authenticated
      setSettings({
        enablePersonalized: true,
        diversityLevel: "medium",
        refreshInterval: 15 * 60 * 1000,
        blend: "standard",
      });
      // Optionally clear cache on logout
      setCache({ data: {}, lastUpdated: {} });
    }
  }, [isAuthenticated, user?._id]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      try {
        localStorage.setItem(
          `recommendation_settings_${user._id}`,
          JSON.stringify(settings)
        );
      } catch (error) {
        logger.error("Error saving recommendation settings:", error);
      }
    }
  }, [settings, isAuthenticated, user?._id]);

  // Function to update specific settings
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // --- Caching Logic ---

  const isCacheValid = useCallback(
    (cacheKey) => {
      const lastUpdated = cache.lastUpdated[cacheKey];
      // Check if lastUpdated exists and is within the refresh interval
      return lastUpdated && Date.now() - lastUpdated < settings.refreshInterval;
    },
    [cache.lastUpdated, settings.refreshInterval]
  );

  const getCachedData = useCallback(
    (cacheKey) => {
      return cache.data[cacheKey] || null; // Return null if not found
    },
    [cache.data]
  );

  const cacheData = useCallback((cacheKey, data) => {
    setCache((prev) => ({
      data: { ...prev.data, [cacheKey]: data },
      lastUpdated: { ...prev.lastUpdated, [cacheKey]: Date.now() },
    }));
  }, []);

  const clearCache = useCallback((cacheKey = null) => {
    if (!cacheKey) {
      // Clear all cache
      setCache({ data: {}, lastUpdated: {} });
      logger.info("Cleared all recommendation cache.");
      return;
    }
    // Clear specific cache key
    setCache((prev) => {
      const newData = { ...prev.data };
      const newLastUpdated = { ...prev.lastUpdated };
      delete newData[cacheKey];
      delete newLastUpdated[cacheKey];
      logger.info(`Cleared recommendation cache for key: ${cacheKey}`);
      return { data: newData, lastUpdated: newLastUpdated };
    });
  }, []);

  // Mark cache as stale without clearing it
  // This prevents automatic refetching but ensures fresh data on next explicit request
  const markCacheAsStale = useCallback((cacheType) => {
    if (!cacheType) return;

    // Create the cache key
    const cacheKey = createCacheKey(cacheType);

    // Update the lastUpdated time to be older than the cache TTL
    // This will make the cache appear stale but won't trigger a refetch
    setCache((prev) => {
      // If the cache key doesn't exist, don't do anything
      if (!prev.data[cacheKey]) return prev;

      // Set the lastUpdated time to be 1 hour ago
      // This ensures it will be refreshed on next explicit request
      const newLastUpdated = { ...prev.lastUpdated };
      newLastUpdated[cacheKey] = Date.now() - (60 * 60 * 1000); // 1 hour ago

      logger.debug(`Marked cache as stale for key: ${cacheKey}`);
      return { ...prev, lastUpdated: newLastUpdated };
    });
  }, []);

  // Helper to create cache keys consistently
  const createCacheKey = (type, params = {}) => {
    // Create a consistent cache key based on type and params
    const paramsKey = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}_${value}`)
      .join("_");

    return paramsKey ? `${type}_${paramsKey}` : type;
  };

  // --- Fetch Functions ---

  // Generic fetch helper with caching and in-flight request tracking
  const fetchRecommendations = useCallback(
    async (
      endpoint,
      params,
      cacheType,
      cacheParams = {},
      requiresAuth = false,
      refresh = false,
      cacheTTL = 300 // Increased TTL to 5 minutes to reduce API calls
    ) => {
      if (requiresAuth && !isAuthenticated) {
        logger.warn(
          `Attempted to fetch ${cacheType} recommendations without authentication.`
        );
        return []; // Return empty array if auth is required but user is not logged in
      }

      // Check if we're making too many requests in a short time
      const requestTypeCountKey = `request_count_${cacheType}`;
      const requestTypeCount = parseInt(sessionStorage.getItem(requestTypeCountKey) || '0');

      // If we're making excessive requests and this isn't a forced refresh, show a warning
      if (requestTypeCount > 10 && !refresh) {
        logger.warn(`Excessive ${cacheType} recommendation requests detected. Consider implementing better caching.`);

        // Show a toast notification to the user
        const rateLimitWarningKey = `rate_limit_warning_shown_${cacheType}`;
        const lastWarningTime = parseInt(sessionStorage.getItem(rateLimitWarningKey) || '0');
        const now = Date.now();

        // Only show the warning once every 30 seconds to avoid spamming the user
        if (now - lastWarningTime > 30000) {
          showToast(
            "warning",
            "Refreshing too frequently. Please wait a moment before refreshing again.",
            <AlertCircle className="w-5 h-5 text-amber-500" />,
            5000
          );

          // Remember that we showed the warning
          try {
            sessionStorage.setItem(rateLimitWarningKey, now.toString());
          } catch (e) {
            // Ignore storage errors
          }
        }
      }

      const cacheKey = createCacheKey(cacheType, cacheParams);

      // Create a unique request identifier for tracking in-flight requests
      const requestId = `${endpoint}_${JSON.stringify(params)}`;

      // Check if we've fetched this data recently (within 30 seconds) to prevent excessive refreshes
      const now = Date.now();
      const minRefreshInterval = 30000; // 30 seconds
      const lastFetchTime = lastFetchTimes.current[requestId] || 0;
      const timeSinceLastFetch = now - lastFetchTime;

      // Check if we already have a valid cache (if not forced refresh)
      if (!refresh && isCacheValid(cacheKey)) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          // If we've fetched this data very recently, use the cache without checking for updates
          if (timeSinceLastFetch < minRefreshInterval) {
            // Use cache without logging to reduce console spam
            return params.limit ? cached.slice(0, params.limit) : cached;
          }

          // Otherwise, we'll still return the cache but continue with the fetch in the background
          // This provides immediate response while ensuring data freshness
          // Only log in development to reduce console spam
          if (process.env.NODE_ENV === 'development') {
            logger.debug(`Using cached ${cacheType} recommendations while checking for updates`);
          }

          // Start a background fetch if there isn't already one in progress
          if (!inFlightRequests.current[requestId]) {
            // Don't await this - let it run in the background
            fetchRecommendationsInBackground(endpoint, params, cacheType, cacheParams, requestId, cacheKey, cacheTTL);
          }

          return params.limit ? cached.slice(0, params.limit) : cached;
        }
      }

      // Check if there's already an in-flight request for this exact endpoint+params
      if (inFlightRequests.current[requestId]) {
        // Only log in development to reduce console spam
        if (process.env.NODE_ENV === 'development') {
          logger.debug(`Reusing in-flight request for ${cacheType}`);
        }
        try {
          // Wait for the existing request to complete instead of making a new one
          const result = await inFlightRequests.current[requestId];
          return params.limit ? result.slice(0, params.limit) : result;
        } catch (error) {
          // If the in-flight request fails, we'll try again below
          logger.debug(`In-flight request for ${cacheType} failed, retrying`);
        }
      }

      // Enhanced rate limiting with better caching strategy
      // This helps prevent excessive API calls even with deduplication
      const rateLimitKey = `last_api_request_${endpoint}`;
      const requestCountKey = `request_count_${endpoint}`;
      const lastRequestTime = parseInt(sessionStorage.getItem(rateLimitKey) || '0');
      const requestCount = parseInt(sessionStorage.getItem(requestCountKey) || '0');

      // Calculate time since last request
      const timeSinceLastRequest = now - lastRequestTime;

      // Check if we have a valid cached response first
      const cachedResponse = getCachedData(cacheKey);
      if (cachedResponse && !refresh) {
        // If we have a valid cache and this isn't a forced refresh, use the cache without logging
        // This reduces console spam for frequent cache hits
        return cachedResponse;
      }

      // If we're making too many requests in a short time, implement stronger rate limiting
      if (timeSinceLastRequest < 10000) { // 10 seconds window - increased from 5s
        // Increase delay based on how many requests we've made recently
        const baseDelay = 1000; // 1000ms base delay - increased from 500ms
        const progressiveFactor = Math.min(requestCount, 15); // Cap at 15x - increased from 10x
        const randomFactor = 0.5 + Math.random(); // 0.5-1.5 randomization

        // Calculate delay: more requests = longer delay
        const delay = baseDelay * progressiveFactor * randomFactor;

        // Log the delay
        logger.info(`Adding ${Math.floor(delay)}ms delay for ${cacheType} to avoid rate limiting (request #${requestCount+1})`);

        await new Promise(resolve => setTimeout(resolve, delay));

        // Increment request count
        try {
          sessionStorage.setItem(requestCountKey, (requestCount + 1).toString());
        } catch (e) {
          // Ignore storage errors
        }

        // If we're making too many requests, show a toast warning
        if (requestCount > 5) {
          showToast(
            "warning",
            "Refreshing too frequently. Please wait a moment before refreshing again.",
            <AlertCircle className="w-5 h-5 text-amber-500" />,
            5000
          );
        }

        // If we're making too many requests and have a slightly stale cache, use it anyway
        // This prevents excessive API calls when rapidly switching between pages
        const staleCachedResponse = getCachedData(cacheKey);
        if (requestCount > 1 && staleCachedResponse) { // Reduced threshold from 2 to 1 to be more aggressive with caching
          logger.info(`Using slightly stale cache for ${cacheType} to prevent rate limiting`);
          return staleCachedResponse;
        }
      } else if (timeSinceLastRequest >= 10000) {
        // Reset counter if it's been a while (10+ seconds)
        try {
          sessionStorage.setItem(requestCountKey, '1');
        } catch (e) {
          // Ignore storage errors
        }
      }

      // Update last request time
      try {
        sessionStorage.setItem(rateLimitKey, Date.now().toString());
      } catch (e) {
        // Ignore storage errors
      }

      // Create a promise for this request and store it in our in-flight tracking
      const requestPromise = createRequestPromise(endpoint, params, cacheType, cacheKey, requestId, cacheTTL);

      // Store the promise in our in-flight tracking
      inFlightRequests.current[requestId] = requestPromise;

      try {
        // Wait for the request to complete
        const result = await requestPromise;
        // Update the last fetch time for this request
        lastFetchTimes.current[requestId] = Date.now();
        // Return a slice based on limit if provided in params
        return params.limit ? result.slice(0, params.limit) : result;
      } catch (err) {
        // If all else fails, return an empty array
        return [];
      }
    },
    [isAuthenticated, isCacheValid, getCachedData, cacheData, showToast]
  );

  // Fetch Feed (Hybrid)
  const getFeedRecommendations = useCallback(
    async (limit = 20, offset = 0, options = {}, refresh = false) => {
      const {
        blend = settings.blend,
        category = null,
        tags = null,
        sortBy = "score",
      } = options;

      const params = {
        limit,
        offset,
        blend,
        ...(category && { category }),
        ...(tags &&
          Array.isArray(tags) &&
          tags.length > 0 && { tags: tags.join(",") }),
        sortBy,
      };

      const cacheParams = {
        limit,
        offset,
        blend,
        category: category || "all",
        tags: tags ? tags.sort().join("_") : "none",
        sortBy,
      };

      // Use a longer cache TTL for feed recommendations to improve stability
      const result = await fetchRecommendations(
        "/recommendations/feed",
        params,
        "feed",
        cacheParams,
        false, // Optional auth
        refresh,
        60 * 15 // 15 minute cache TTL - increased from 5 minutes
      );

      // Log source distribution for debugging - with deduplication
      if (result.length > 0) {
        // Create a unique key for this feed request
        const distributionKey = `feed_distribution_${limit}_${offset}`;
        const lastLogged = sessionStorage.getItem(distributionKey);
        const now = Date.now();

        // Only log once every 5 seconds for the same parameters
        if (!lastLogged || (now - parseInt(lastLogged)) > 5000) {
          const sources = {};
          result.forEach(item => {
            const source = item.reason || 'unknown';
            sources[source] = (sources[source] || 0) + 1;
          });

          logger.debug(`Feed recommendations source distribution:`, sources);

          // Mark as logged
          try {
            sessionStorage.setItem(distributionKey, now.toString());
            // Clean up after 10 seconds
            setTimeout(() => sessionStorage.removeItem(distributionKey), 10000);
          } catch (e) {
            // Ignore storage errors
          }
        }
      }

      return result;
    },
    [settings.blend, fetchRecommendations]
  );

  // Fetch Personalized
  const getPersonalizedRecommendations = useCallback(
    async (
      limit = 10,
      offset = 0,
      strategy = "personalized",
      refresh = false
    ) => {
      if (!settings.enablePersonalized) {
        logger.info("Personalized recommendations disabled in settings");
        return [];
      }

      // Make sure strategy is a string to avoid issues with boolean values
      const normalizedStrategy = strategy === false ? "personalized" : String(strategy);

      const params = {
        limit,
        offset,
        strategy: normalizedStrategy,
      };

      const cacheParams = {
        limit,
        offset,
        strategy: normalizedStrategy,
      };

      try {
        const result = await fetchRecommendations(
          "/recommendations/personalized",
          params,
          "personalized",
          cacheParams,
          true, // Requires auth
          refresh
        );

        // Log the result for debugging
        logger.debug("Personalized recommendations result:", {
          count: result?.length || 0,
          isEmpty: !result || result.length === 0,
          firstItem: result && result.length > 0 ? {
            hasProductData: !!result[0].productData,
            hasProduct: !!result[0].product,
            keys: Object.keys(result[0])
          } : null
        });

        return result;
      } catch (error) {
        logger.error("Error fetching personalized recommendations:", error);
        // Return empty array on error to avoid breaking the UI
        return [];
      }
    },
    [settings.enablePersonalized, fetchRecommendations]
  );

  // Fetch Trending
  const getTrendingRecommendations = useCallback(
    async (
      limit = 10,
      offset = 0,
      days = 7,
      categoryId = null,
      refresh = false,
      options = {}
    ) => {
      const params = {
        limit,
        offset,
        days,
      };

      if (categoryId) {
        params.categoryId = categoryId;
      }

      const cacheParams = {
        limit,
        offset,
        days,
        categoryId: categoryId || "all",
      };

      try {
        const result = await fetchRecommendations(
          "/recommendations/trending",
          params,
          "trending",
          cacheParams,
          false, // Optional auth
          refresh,
          60 * 30 // 30 minute cache TTL for trending - trending doesn't change that often
        );

        // Validate the response format
        if (!Array.isArray(result)) {
          logger.warn("[WARN] Invalid trending response format", { result });
          throw new Error("Invalid trending response format");
        }

        if (result.length === 0) {
          logger.warn("[WARN] No trending products returned for " + (days === 1 ? "day" : days === 7 ? "week" : "month"));
        } else {
          logger.info(`[INFO] Successfully loaded ${result.length} trending products`);

          // Log the structure of the first item to help with debugging
          if (result.length > 0) {
            logger.debug("Trending product structure:", {
              hasProductData: !!result[0].productData,
              hasProduct: !!result[0].product,
              keys: Object.keys(result[0]),
              id: result[0]._id || result[0].product || (result[0].productData && result[0].productData._id)
            });
          }

          // Ensure the data is in the expected format
          const normalizedResult = result.map(item => {
            // If the item already has productData, return it as is
            if (item.productData) {
              return item;
            }

            // If the item has a product field that's a string (ID), transform it
            if (item.product && typeof item.product === 'string') {
              return {
                ...item,
                productData: {
                  ...item,
                  _id: item.product
                },
                reason: item.reason || 'trending',
                explanationText: item.explanationText || 'Trending product'
              };
            }

            // If the item is a direct product object, transform it
            if (item._id) {
              return {
                productData: item,
                product: item._id,
                score: item.score || 1.0,
                reason: item.reason || 'trending',
                explanationText: item.explanationText || 'Trending product'
              };
            }

            return item;
          });

          return normalizedResult;
        }

        return result;
      } catch (error) {
        // If the main trending endpoint fails, try the products/trending endpoint as fallback
        if ((error.response?.status === 404 || error.response?.status === 429 || error.message === "Invalid trending response format") && !options.isRetry) {
          logger.warn("Trending recommendations failed, falling back to products/trending", error);
          try {
            // Convert days to timeRange format expected by products/trending
            const timeRange = days === 1 ? '1d' : days === 7 ? '7d' : '30d';

            // Make direct request to products/trending
            const response = await makePriorityRequest('GET', '/products/trending', {
              params: {
                limit,
                timeRange,
                _t: Date.now(),
                _priority: 'high'
              },
              retryCount: 2 // Increased retry count
            });

            if (response.data && response.data.success && Array.isArray(response.data.data)) {
              // Transform to match recommendation format
              const transformedData = response.data.data.map(product => ({
                productData: product,
                product: product._id,
                score: 1.0,
                reason: 'trending',
                explanationText: 'Trending product'
              }));

              if (transformedData.length > 0) {
                logger.info(`[INFO] Successfully loaded ${transformedData.length} trending products from fallback endpoint`);
                return transformedData;
              } else {
                logger.warn("[WARN] No trending products returned from fallback endpoint");
                return [];
              }
            } else {
              logger.warn("[WARN] Invalid response format from products/trending endpoint", {
                success: response.data?.success,
                isArray: Array.isArray(response.data?.data),
                dataLength: response.data?.data?.length
              });
              return [];
            }
          } catch (fallbackError) {
            logger.error("Fallback to products/trending failed", fallbackError);

            // Try one more fallback to the discovery endpoint
            try {
              logger.info("Attempting second fallback to discovery endpoint for trending products");
              const discoveryResponse = await makePriorityRequest('GET', '/recommendations/feed', {
                params: {
                  limit,
                  blend: 'trending',
                  _t: Date.now(),
                  _priority: 'high'
                },
                retryCount: 1
              });

              if (discoveryResponse.data && discoveryResponse.data.success && Array.isArray(discoveryResponse.data.data)) {
                const discoveryData = discoveryResponse.data.data;
                logger.info(`[INFO] Successfully loaded ${discoveryData.length} trending products from discovery fallback`);
                return discoveryData;
              }
            } catch (discoveryError) {
              logger.error("All fallbacks failed for trending recommendations", discoveryError);
            }
            return [];
          }
        }
        logger.error("Error fetching trending recommendations", error);
        return [];
      }
    },
    [fetchRecommendations]
  );

  // Fetch New Products
  const getNewRecommendations = useCallback(
    async (limit = 10, offset = 0, days = 14, refresh = false, options = {}) => {
      const params = {
        limit,
        offset,
        days,
      };

      const cacheParams = {
        limit,
        offset,
        days,
      };

      try {
        const result = await fetchRecommendations(
          "/recommendations/new",
          params,
          "new",
          cacheParams,
          false, // Optional auth
          refresh
        );

        // Validate the response format
        if (!Array.isArray(result)) {
          logger.warn("[WARN] No new products found or invalid response format", { result });
          throw new Error("Invalid new products response format");
        }

        if (result.length === 0) {
          logger.warn("[WARN] No new products found for the last " + days + " days");
        } else {
          logger.info(`[INFO] Successfully loaded ${result.length} new products`);

          // Log the structure of the first item to help with debugging
          if (result.length > 0) {
            logger.debug("New product structure:", {
              hasProductData: !!result[0].productData,
              hasProduct: !!result[0].product,
              keys: Object.keys(result[0]),
              id: result[0]._id || result[0].product || (result[0].productData && result[0].productData._id)
            });
          }

          // Ensure the data is in the expected format
          const normalizedResult = result.map(item => {
            // If the item already has productData, return it as is
            if (item.productData) {
              return item;
            }

            // If the item has a product field that's a string (ID), transform it
            if (item.product && typeof item.product === 'string') {
              return {
                ...item,
                productData: {
                  ...item,
                  _id: item.product
                },
                reason: item.reason || 'new',
                explanationText: item.explanationText || 'Recently added product'
              };
            }

            // If the item is a direct product object, transform it
            if (item._id) {
              return {
                productData: item,
                product: item._id,
                score: item.score || 1.0,
                reason: item.reason || 'new',
                explanationText: item.explanationText || 'Recently added product'
              };
            }

            return item;
          });

          return normalizedResult;
        }

        return result;
      } catch (error) {
        // If the main new endpoint fails, try the products/recent endpoint as fallback
        if ((error.response?.status === 404 || error.response?.status === 429 || error.message === "Invalid new products response format") && !options.isRetry) {
          logger.warn("New recommendations failed, falling back to products/recent", error);
          try {
            // Make direct request to products/recent
            const response = await makePriorityRequest('GET', '/products/recent', {
              params: {
                limit,
                days,
                _t: Date.now(),
                _priority: 'high'
              },
              retryCount: 2 // Increased retry count
            });

            if (response.data && response.data.success && Array.isArray(response.data.data)) {
              // Transform to match recommendation format
              const transformedData = response.data.data.map(product => ({
                productData: product,
                product: product._id,
                score: 1.0,
                reason: 'new',
                explanationText: 'Recently added product'
              }));

              if (transformedData.length > 0) {
                logger.info(`[INFO] Successfully loaded ${transformedData.length} new products from fallback endpoint`);
                return transformedData;
              } else {
                logger.warn("[WARN] No new products returned from fallback endpoint");
                return [];
              }
            } else {
              logger.warn("[WARN] Invalid response format from products/recent endpoint", {
                success: response.data?.success,
                isArray: Array.isArray(response.data?.data),
                dataLength: response.data?.data?.length
              });
              return [];
            }
          } catch (fallbackError) {
            logger.error("Fallback to products/recent failed", fallbackError);

            // Try one more fallback to the discovery endpoint
            try {
              logger.info("Attempting second fallback to discovery endpoint for new products");
              const discoveryResponse = await makePriorityRequest('GET', '/recommendations/feed', {
                params: {
                  limit,
                  blend: 'discovery',
                  _t: Date.now(),
                  _priority: 'high'
                },
                retryCount: 1
              });

              if (discoveryResponse.data && discoveryResponse.data.success && Array.isArray(discoveryResponse.data.data)) {
                const discoveryData = discoveryResponse.data.data.filter(item => {
                  // Filter to include only items with 'new' or 'discovery' reason
                  return item.reason === 'new' || item.reason === 'discovery';
                });
                logger.info(`[INFO] Successfully loaded ${discoveryData.length} new products from discovery fallback`);
                return discoveryData;
              }
            } catch (discoveryError) {
              logger.error("All fallbacks failed for new recommendations", discoveryError);
            }
            return [];
          }
        }
        logger.error("Error fetching new recommendations", error);
        return [];
      }
    },
    [fetchRecommendations]
  );

  // Fetch Similar Products
  const getSimilarRecommendations = useCallback(
    async (productId, limit = 5, refresh = false) => {
      if (!productId) {
        logger.warn(
          "Cannot fetch similar recommendations: productId is required"
        );
        return [];
      }

      const params = { limit };
      const cacheParams = {
        productId,
        limit,
      };

      return fetchRecommendations(
        `/recommendations/similar/${productId}`,
        params,
        "similar",
        cacheParams,
        false, // Optional auth
        refresh
      );
    },
    [fetchRecommendations]
  );

  // Fetch Category Recommendations
  const getCategoryRecommendations = useCallback(
    async (categoryId, limit = 10, offset = 0, refresh = false) => {
      if (!categoryId) {
        logger.warn(
          "Cannot fetch category recommendations: categoryId is required"
        );
        return [];
      }

      const params = { limit, offset };
      const cacheParams = {
        categoryId,
        limit,
        offset,
      };

      return fetchRecommendations(
        `/recommendations/category/${categoryId}`,
        params,
        "category",
        cacheParams,
        false, // Optional auth
        refresh
      );
    },
    [fetchRecommendations]
  );

  // Fetch Maker Recommendations
  const getMakerRecommendations = useCallback(
    async (makerId, limit = 10, offset = 0, refresh = false) => {
      if (!makerId) {
        logger.warn("Cannot fetch maker recommendations: makerId is required");
        return [];
      }

      const params = { limit, offset };
      const cacheParams = {
        makerId,
        limit,
        offset,
      };

      return fetchRecommendations(
        `/recommendations/maker/${makerId}`,
        params,
        "maker",
        cacheParams,
        false, // Optional auth
        refresh
      );
    },
    [fetchRecommendations]
  );

  // Fetch Recommendations by Tags
  const getRecommendationsByTags = useCallback(
    async (tags = [], limit = 10, offset = 0, refresh = false) => {
      if (!Array.isArray(tags) || tags.length === 0) {
        logger.warn("Cannot fetch tag recommendations: tags array is empty");
        return [];
      }

      const tagsParam = tags.join(","); // Convert array to comma-separated string
      const params = { tags: tagsParam, limit, offset };

      // Create cache params with sorted tags for consistency
      const sortedTags = [...tags].sort().join("_");
      const cacheParams = {
        tags: sortedTags,
        limit,
        offset,
      };

      return fetchRecommendations(
        "/recommendations/tags",
        params,
        "tags",
        cacheParams,
        false, // Optional auth
        refresh
      );
    },
    [fetchRecommendations]
  );

  // Fetch Collaborative Filtering Recommendations
  const getCollaborativeRecommendations = useCallback(
    async (limit = 10, offset = 0, refresh = false) => {
      if (!isAuthenticated) {
        logger.warn(
          "Cannot fetch collaborative recommendations: authentication required"
        );
        return [];
      }

      const params = { limit, offset };
      const cacheParams = { limit, offset };

      try {
        // Use a longer cache TTL (10 minutes) for collaborative recommendations
        // since they're more expensive to compute and change less frequently
        return await fetchRecommendations(
          "/recommendations/collaborative",
          params,
          "collaborative",
          cacheParams,
          true, // Requires auth
          refresh,
          60 * 10 // 10 minute cache TTL
        );
      } catch (error) {
        // If collaborative recommendations fail, try to fall back to trending
        if (error.response?.status === 500 || error.response?.status === 429) {
          logger.warn("Collaborative recommendations failed, falling back to trending", error);
          try {
            // Try to get trending recommendations as fallback
            return await fetchRecommendations(
              "/recommendations/trending",
              { limit, offset, days: 7 },
              "trending",
              { limit, offset, days: 7 },
              false, // Optional auth
              refresh
            );
          } catch (fallbackError) {
            // If that fails too, try new products as a last resort
            logger.error("Trending fallback failed, using new products as last resort", fallbackError);
            return fetchRecommendations(
              "/recommendations/new",
              { limit, offset, days: 14 },
              "new",
              { limit, offset, days: 14 },
              false, // Optional auth
              refresh
            );
          }
        }
        // For other errors, just rethrow
        throw error;
      }
    },
    [fetchRecommendations, isAuthenticated]
  );

  // Fetch Preferences-Based Recommendations
  const getPreferencesRecommendations = useCallback(
    async (limit = 10, offset = 0, refresh = false) => {
      if (!isAuthenticated) {
        logger.warn(
          "Cannot fetch preferences recommendations: authentication required"
        );
        return [];
      }

      const params = { limit, offset };
      const cacheParams = { limit, offset };

      return fetchRecommendations(
        "/recommendations/preferences",
        params,
        "preferences",
        cacheParams,
        true, // Requires auth
        refresh
      );
    },
    [fetchRecommendations, isAuthenticated]
  );

  // Fetch Interest-Based Recommendations
  const getInterestsRecommendations = useCallback(
    async (limit = 10, offset = 0, refresh = false) => {
      if (!isAuthenticated) {
        logger.warn(
          "Cannot fetch interests recommendations: authentication required"
        );
        return [];
      }

      const params = { limit, offset };
      const cacheParams = { limit, offset };

      return fetchRecommendations(
        "/recommendations/interests",
        params,
        "interests",
        cacheParams,
        true, // Requires auth
        refresh
      );
    },
    [fetchRecommendations, isAuthenticated]
  );

  // --- Interaction & History Functions ---

  // Fetch User History
  const getUserHistory = useCallback(
    async (refresh = false) => {
      if (!isAuthenticated) {
        logger.warn("Cannot fetch user history: authentication required");
        return null;
      }

      const cacheKey = createCacheKey("history");
      if (!refresh && isCacheValid(cacheKey)) {
        return getCachedData(cacheKey);
      }

      try {
        logger.info("Fetching user history from API");
        const response = await api.get("/recommendations/history", {
          params: { _t: Date.now() } // Add timestamp to prevent caching
        });
        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch history");
        }
        const historyData = response.data.data || null;
        cacheData(cacheKey, historyData);
        return historyData;
      } catch (err) {
        logger.error("Error fetching user history:", err);
        return null; // Return null on error
      }
    },
    [isAuthenticated, isCacheValid, getCachedData, cacheData]
  );

  // Record Interaction
  const recordInteraction = useCallback(
    async (productId, type, metadata = {}, event = null) => {
      // If an event is provided, prevent default behavior
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
        event.stopPropagation();
      }

      if (!productId || !type) {
        logger.warn("Missing required parameters for interaction recording");
        return { success: false, error: "Missing required parameters" };
      }

      // For page interactions, we'll allow them even if not authenticated
      // This helps with analytics for anonymous users
      const isPageInteraction = (
        typeof productId === 'string' && [
          'homepage', 'search', 'category', 'collection', 'profile',
          'settings', 'notifications', 'dashboard'
        ].includes(productId) ||
        (typeof productId === 'string' && !/^[0-9a-fA-F]{24}$/.test(productId))
      );

      // Only require authentication for product-specific interactions
      if (!isAuthenticated && !isPageInteraction) {
        logger.warn("Cannot record product interaction: authentication required");
        return { success: false, error: "Authentication required" };
      }

      try {
        const enrichedMetadata = {
          ...metadata,
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "",
          referrer: typeof document !== "undefined" ? document.referrer : "",
        };

        // Determine if this is a page interaction or product interaction
        // Page interactions: explicit page types or non-MongoDB ObjectId strings
        const isPageInteraction = (
          // Check if it's a known page type
          typeof productId === 'string' && [
            'homepage', 'search', 'category', 'collection', 'profile',
            'settings', 'notifications', 'dashboard'
          ].includes(productId) ||
          // Or if it's not a valid MongoDB ObjectId format
          (typeof productId === 'string' && !/^[0-9a-fA-F]{24}$/.test(productId))
        );

        // Handle page interactions
        if (isPageInteraction) {
          logger.debug(`Recording page interaction: ${type} for ${productId}`);

          // Use a rate limiter for page interactions to prevent excessive API calls
          // Only send one page_view interaction per page per 30 seconds
          if (type === 'page_view') {
            const now = Date.now();
            const lastViewKey = `last_page_view_${productId}`;
            const lastViewTime = parseInt(sessionStorage.getItem(lastViewKey) || '0');

            if (now - lastViewTime < 30000) { // 30 seconds
              logger.debug(`Skipping duplicate page_view for ${productId} (rate limited)`);
              return { success: true, rateLimited: true };
            }

            // Update last view time
            try {
              sessionStorage.setItem(lastViewKey, now.toString());
            } catch (e) {
              // Ignore storage errors
            }
          }

          // Record page interactions
          try {
            const response = await makePriorityRequest('POST', "/analytics/page-interaction", {
              data: {
                pageType: productId, // Use productId as pageType
                type,
                metadata: enrichedMetadata,
              },
              params: { _t: Date.now() }, // Add timestamp to prevent caching
              retryCount: 1 // Add retry for better reliability
            });

            return { success: response.data.success };
          } catch (err) {
            // For page interactions, we'll silently fail to avoid disrupting the user experience
            logger.warn(`Failed to record page interaction (${type}) for ${productId}:`, err);
            return { success: false, error: err.message };
          }
        }

        // Regular product interaction
        // Add rate limiting for product views too
        if (type === 'view') {
          const now = Date.now();
          const lastViewKey = `last_product_view_${productId}`;
          const lastViewTime = parseInt(sessionStorage.getItem(lastViewKey) || '0');

          if (now - lastViewTime < 30000) { // 30 seconds
            logger.debug(`Skipping duplicate product view for ${productId} (rate limited)`);
            return { success: true, rateLimited: true };
          }

          // Update last view time
          try {
            sessionStorage.setItem(lastViewKey, now.toString());
          } catch (e) {
            // Ignore storage errors
          }
        }

        try {
          // Check if the server is reachable before making the request
          const response = await makePriorityRequest('POST', "/recommendations/interaction", {
            data: {
              productId,
              type,
              metadata: enrichedMetadata,
            },
            params: { _t: Date.now() }, // Add timestamp to prevent caching
            retryCount: 3, // Increase retries for better reliability
            timeout: 10000, // Longer timeout to allow for server recovery
            fallbackValue: { success: false, silent: true } // Provide fallback value if request fails
          });
  
          if (!response.data.success) {
            logger.warn(`Record interaction response not successful for ${productId}, type: ${type}`);
            // Don't throw, just log and continue
          }
        } catch (apiError) {
          // Log but don't throw - interactions should be best effort and not block UI
          logger.warn(`Failed to record interaction (${type}) for ${productId}:`, apiError);
          // Silent failure - we don't want to break the UI for tracking failures
          return { success: false, error: apiError.message, silent: true };
        }

        // Mark caches as stale but don't trigger immediate refetches
        if (["upvote", "bookmark", "purchase", "follow", "remove_upvote", "remove_bookmark"].includes(type)) {
          // Instead of clearing cache, mark it as stale by updating the lastUpdated time
          // This prevents automatic refetching but ensures fresh data on next explicit request
          markCacheAsStale("personalized");
          markCacheAsStale("feed");
          markCacheAsStale("collaborative");
          markCacheAsStale("interests");

          // If it's a removal action, also mark trending as stale
          if (["remove_upvote", "remove_bookmark"].includes(type)) {
            markCacheAsStale("trending");
          }

          // Log that we're marking caches as stale instead of clearing them
          logger.debug(`Marked recommendation caches as stale after ${type} interaction`);
        }

        return { success: true };
      } catch (error) {
        logger.error(
          `Error recording ${type} interaction for product ${productId}:`,
          error
        );
        // Don't throw - we don't want to break the UI for tracking failures
        return { success: false, error: error.message };
      }
    },
    [isAuthenticated, clearCache]
  );

  // Submit Recommendation Feedback (like, dislike, not_interested)
  const submitRecommendationFeedback = useCallback(
    async (productId, feedbackType, reason = "", source = "") => {
      if (!isAuthenticated || !productId || !feedbackType) {
        logger.warn(
          "Feedback not submitted: Missing auth, productId, or feedbackType."
        );
        return { success: false, error: "Missing required parameters" };
      }

      try {
        logger.info(
          `Submitting feedback: ${feedbackType} for product ${productId}`
        );
        const response = await makePriorityRequest('POST', "/recommendations/feedback", {
          data: {
            productId,
            action: feedbackType, // Matches backend expectation: 'like', 'dislike', 'not_interested'
            reason,
            source, // Source of the recommendation (e.g., 'feed', 'personalized')
          }
        });

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to submit recommendation feedback"
          );
        }

        // Clear personalized and potentially feed/interest/preference caches
        clearCache(createCacheKey("personalized"));
        clearCache(createCacheKey("feed"));
        clearCache(createCacheKey("interests"));
        clearCache(createCacheKey("preferences"));

        // If feedback implies dismissal, clear similar cache too
        if (feedbackType === "dislike" || feedbackType === "not_interested") {
          clearCache(createCacheKey("similar", { productId }));
        }

        logger.info(`Successfully submitted feedback for product ${productId}`);
        return { success: true };
      } catch (err) {
        logger.error(
          `Error submitting feedback for product ${productId}:`,
          err
        );
        return { success: false, error: err.message };
      }
    },
    [isAuthenticated, clearCache]
  );

  // Dismiss Recommendation
  const dismissRecommendation = useCallback(
    async (productId, reason = "user_dismissed", source = "") => {
      if (!isAuthenticated || !productId) {
        logger.warn("Dismissal not recorded: Missing auth or productId.");
        return { success: false, error: "Missing required parameters" };
      }

      try {
        logger.info(`Dismissing recommendation for product ${productId}`);
        const response = await makePriorityRequest('POST', "/recommendations/dismiss", {
          data: {
            productId,
            reason,
            source, // Include source where it was dismissed from
          }
        });

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to dismiss recommendation"
          );
        }

        // Clear personalized, feed, interest, preference, and similar caches
        clearCache(createCacheKey("personalized"));
        clearCache(createCacheKey("feed"));
        clearCache(createCacheKey("interests"));
        clearCache(createCacheKey("preferences"));
        clearCache(createCacheKey("similar", { productId }));

        logger.info(
          `Successfully dismissed recommendation for product ${productId}`
        );
        return { success: true };
      } catch (err) {
        logger.error(
          `Error dismissing recommendation for product ${productId}:`,
          err
        );
        return { success: false, error: err.message };
      }
    },
    [isAuthenticated, clearCache]
  );

  // --- Context Value ---

  const value = {
    settings,
    updateSettings,
    clearCache, // Expose cache clearing function
    markCacheAsStale, // Expose cache stale marking function

    // Recommendation Fetching Functions
    getFeedRecommendations,
    getPersonalizedRecommendations,
    getTrendingRecommendations,
    getNewRecommendations,
    getSimilarRecommendations,
    getCategoryRecommendations,
    getMakerRecommendations,
    getRecommendationsByTags,
    getCollaborativeRecommendations,
    getPreferencesRecommendations,
    getInterestsRecommendations,

    // History & Interaction Functions
    getUserHistory,
    recordInteraction,
    submitRecommendationFeedback,
    dismissRecommendation,
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
};

// --- Custom Hook ---
export const useRecommendation = () => {
  const context = useContext(RecommendationContext);
  if (!context) {
    throw new Error(
      "useRecommendation must be used within a RecommendationProvider"
    );
  }
  return context;
};

export default RecommendationContext;
