import { makePriorityRequest } from '../api/api';

/**
 * Generate a unique session ID if not exists
 * @returns {string} Session ID
 */
const getSessionId = () => {
  if (typeof window === "undefined") return null;

  let sessionId = sessionStorage.getItem("viewSessionId");
  if (!sessionId) {
    sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("viewSessionId", sessionId);
  }
  return sessionId;
};

/**
 * Record a product view
 * @param {string} productId - The ID of the product being viewed
 * @param {Object} viewData - Data about the view (source, referrer, etc.)
 * @returns {Promise} Promise object representing the API response
 */
export const recordProductView = async (productId, viewData = {}) => {
  try {
    if (!productId) {
      console.warn('Attempted to record view without productId');
      return { success: false, error: 'Missing productId' };
    }

    console.log('Recording view for product:', productId, 'with data:', viewData);

    // Get referrer information
    const referrer = typeof document !== 'undefined' ? (document.referrer || window.location.pathname) : '';

    // Get device information
    const deviceInfo = {};
    if (typeof window !== 'undefined') {
      deviceInfo.viewport = `${window.innerWidth}x${window.innerHeight}`;
      deviceInfo.userAgent = navigator.userAgent;
    }

    // Merge provided data with automatically detected data
    const viewPayload = {
      source: viewData.source || 'direct',
      referrer: viewData.referrer || referrer,
      recommendationType: viewData.recommendationType || null,
      position: viewData.position || null,
      sessionId: viewData.sessionId || getSessionId(),
      ...deviceInfo,
      ...viewData,
    };

    // Use a retry mechanism for reliability
    let retries = 2;
    let lastError = null;

    while (retries >= 0) {
      try {
        console.log(`Attempt ${2-retries}: Sending view request to /api/v1/views/product/${productId}`);
        // Use makePriorityRequest instead of direct API call
        const response = await makePriorityRequest('post', `/views/product/${productId}`, {
          data: viewPayload
        });
        console.log('View recorded successfully:', response.data);
        return response.data;
      } catch (err) {
        console.error(`Attempt ${2-retries} failed:`, err.message);
        lastError = err;
        if (retries > 0) {
          // Wait before retrying (exponential backoff with jitter)
          const delay = Math.min(1000 * Math.pow(2, 2 - retries), 3000) + Math.random() * 200;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        retries--;
      }
    }

    console.error('All view recording attempts failed:', lastError);
    throw lastError; // Throw the last error if all retries failed
  } catch (error) {
    console.error('Error recording product view:', error);
    // Silent fail - don't interrupt user experience for tracking errors
    return { success: false, error: error.message };
  }
};

/**
 * Update view duration and engagement metrics after a user leaves the page
 * @param {string} productId - The ID of the product viewed
 * @param {number} startTime - The timestamp when the view started
 * @param {Object} engagementData - Additional engagement data
 * @returns {Promise} Promise object representing the API response
 */
export const updateViewDuration = async (productId, startTime, engagementData = {}) => {
  try {
    if (!productId || !startTime) return;

    const viewDuration = Math.floor((Date.now() - startTime) / 1000); // duration in seconds
    if (viewDuration < 1) return; // Ignore very short views

    const payload = {
      viewDuration,
      sessionId: getSessionId(),
      ...engagementData
    };

    // Use makePriorityRequest instead of direct API call
    const response = await makePriorityRequest('post', `/views/product/${productId}/duration`, {
      data: payload
    });
    return response.data;
  } catch (error) {
    console.error('Error updating view duration:', error);
    // Silent fail - likely happens during page unload
    return { success: false, error: error.message };
  }
};

/**
 * Record view duration when user leaves the page
 * @param {string} productId - The ID of the product
 * @param {number} startTime - The timestamp when the view started
 * @param {string} exitPage - The page the user navigated to
 * @returns {Promise} Promise object representing the API response
 */
export const recordViewDuration = async (productId, startTime, exitPage = null) => {
  try {
    if (!productId || !startTime) return;

    const viewDuration = Math.floor((Date.now() - startTime) / 1000); // duration in seconds

    if (viewDuration < 1) return; // Ignore very short views

    const viewPayload = {
      viewDuration,
      sessionId: getSessionId(),
      exitPage: exitPage || (typeof window !== 'undefined' ? window.location.pathname : ''),
    };

    // Use a beacon for reliability during page unload if in browser
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(viewPayload)], { type: 'application/json' });
      // Use the correct API endpoint with /api/v1 prefix
      navigator.sendBeacon(`/api/v1/views/product/${productId}/duration`, blob);
    } else {
      // Fallback to priority request
      await makePriorityRequest('post', `/views/product/${productId}/duration`, {
        data: viewPayload
      });
    }
  } catch (error) {
    console.error('Error recording view duration:', error);
    // Silent fail - this happens during page unload
  }
};

/**
 * Get user's view history
 * @param {Object} options - Options for the request
 * @param {number} options.page - The page number for pagination
 * @param {number} options.limit - Number of items per page
 * @param {string} options.productId - Optional product ID to filter history
 * @returns {Promise} Promise object representing the API response
 */
export const getUserViewHistory = async (options = {}) => {
  const { page = 1, limit = 10, productId = null } = options;

  // Generate a cache key based on parameters
  const cacheKey = `viewHistory:${page}:${limit}${productId ? `:${productId}` : ''}`;

  try {
    // Check browser storage for cached data
    if (typeof window !== 'undefined') {
      try {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          // Use cached data if it's less than 30 seconds old
          if (Date.now() - timestamp < 30000) {
            console.log(`Using cached data for ${cacheKey}`);
            return data;
          }
        }
      } catch (cacheError) {
        console.warn('Cache read error:', cacheError);
        // Continue with API call if cache fails
      }
    }

    // Prepare request parameters
    const params = { page, limit };
    if (productId) {
      params.productId = productId;
    }

    // Use makePriorityRequest instead of direct API call
    const response = await makePriorityRequest('get', `/views/history`, {
      params,
      // Add a unique timestamp to prevent browser caching
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    // Cache the response
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }));

        // Also cache per-page data for pagination
        sessionStorage.setItem(`viewHistoryPage${page}`, JSON.stringify({
          data: response.data.data,
          timestamp: Date.now()
        }));
      } catch (cacheError) {
        console.warn('Cache write error:', cacheError);
      }
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching view history:', error);
    throw error;
  }
};

/**
 * Get product view statistics (for product owners)
 * @param {string} productId - The ID of the product
 * @param {Object} options - Options for fetching stats
 * @param {number} options.days - Number of days to include in the stats
 * @returns {Promise} Promise object representing the API response
 */
export const getProductViewStats = async (productId, options = {}) => {
  try {
    // Validate the product ID before making the request
    if (!productId || typeof productId !== 'string') {
      console.error('Invalid product ID provided to getProductViewStats:', productId);
      throw new Error('Invalid product ID');
    }

    // Use makePriorityRequest instead of direct API call
    const params = {};
    if (options.days) params.days = options.days;

    const response = await makePriorityRequest('get', `/views/product/${productId}/stats`, {
      params
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch view statistics');
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching view stats for product ${productId}:`, error);
    // Return a structured error response instead of throwing
    return {
      success: false,
      error: error.message || 'Failed to fetch view statistics',
      stats: {
        // Provide fallback empty data structure
        totals: { totalViews: 0, uniqueViewers: 0 },
        dailyViews: [],
        devices: [],
        sources: [],
        referrers: [],
        engagementMetrics: {
          totalViews: 0,
          uniqueViewers: 0,
          averageViewDuration: 0
        },
        insights: {
          summary: ['No data available.'],
          recommendations: []
        }
      }
    };
  }
};

/**
 * Get device analytics for a product
 * @param {string} productId - The ID of the product
 * @param {Object} options - Options for fetching analytics
 * @param {number} options.days - Number of days to include in the analytics
 * @returns {Promise} Promise object representing the API response
 */
export const getProductDeviceAnalytics = async (productId, options = {}) => {
  try {
    const params = {};
    if (options.days) params.days = options.days;

    const response = await makePriorityRequest('get', `/views/product/${productId}/devices`, {
      params
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching device analytics for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Get user engagement metrics
 * @param {string} userId - The ID of the user (optional - defaults to current user)
 * @param {number} days - Number of days to include in the metrics
 * @returns {Promise} Promise object representing the API response
 */
export const getUserEngagementMetrics = async (userId = null, days = 30) => {
  try {
    const endpoint = userId ? `/views/user/${userId}/engagement` : '/views/engagement';
    const response = await makePriorityRequest('get', endpoint, {
      params: { days }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user engagement metrics:', error);
    throw error;
  }
};

/**
 * Clear user view history
 * @returns {Promise} Promise object representing the API response
 */
export const clearUserViewHistory = async () => {
  try {
    const response = await makePriorityRequest('delete', '/views/history');
    return response.data;
  } catch (error) {
    console.error('Error clearing view history:', error);
    throw error;
  }
};

/**
 * Get popular products based on views
 * @param {number} limit - Number of products to return
 * @param {string} period - Time period ('day', 'week', 'month', 'year')
 * @returns {Promise} Promise object representing the API response
 */
export const getPopularProducts = async (limit = 10, period = 'week') => {
  try {
    const response = await makePriorityRequest('get', '/views/popular', {
      params: { limit, period }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching popular products:', error);
    throw error;
  }
};

/**
 * Get related products based on co-viewing patterns
 * @param {string} productId - The ID of the product
 * @param {number} limit - Number of products to return
 * @returns {Promise} Promise object representing the API response
 */
export const getRelatedProducts = async (productId, limit = 5) => {
  try {
    const response = await makePriorityRequest('get', `/views/related/${productId}`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching related products:', error);
    throw error;
  }
};

/**
 * Get admin daily analytics
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Promise object representing the API response
 */
export const getAdminDailyAnalytics = async (startDate, endDate) => {
  try {
    const response = await makePriorityRequest('get', '/views/analytics/daily', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    throw error;
  }
};

/**
 * Get product engagement metrics
 * @param {string} productId - The ID of the product
 * @param {number} days - Number of days to include in the metrics
 * @returns {Promise} Promise object representing the API response
 */
export const getProductEngagementMetrics = async (productId, days = 30) => {
  try {
    const response = await makePriorityRequest('get', `/views/product/${productId}/engagement`, {
      params: { days }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching product engagement metrics:', error);
    throw error;
  }
};

/**
 * React hook for tracking product views
 * @param {string} productId - The ID of the product being viewed
 * @param {Object} viewData - Additional data about the view
 * @returns {void}
 */
export const useProductView = (productId, viewData = {}) => {
  useEffect(() => {
    if (!productId) return;

    // Check if this view was already tracked in this session
    const isAlreadyTracked = () => {
      if (typeof window === 'undefined') return false;

      const viewKey = `view-${productId}-${viewData.source || 'direct'}`;
      const lastView = sessionStorage.getItem(viewKey);
      const SESSION_TTL = 5 * 60 * 1000; // 5 minutes - reduced from 30 minutes to allow more frequent tracking

      return lastView && (Date.now() - parseInt(lastView)) < SESSION_TTL;
    };

    // Skip if already tracked in this session
    if (isAlreadyTracked()) return;

    const startTime = Date.now();

    // Record the initial view
    recordProductView(productId, viewData).then(result => {
      if (result.success) {
        // Mark as tracked in this session
        if (typeof window !== 'undefined') {
          const viewKey = `view-${productId}-${viewData.source || 'direct'}`;
          sessionStorage.setItem(viewKey, Date.now().toString());
        }
      }
    });

    // Return cleanup function to record view duration when component unmounts
    return () => {
      if (productId) {
        recordViewDuration(productId, startTime);
      }
    };
  }, [productId, viewData.source]); // Re-run if productId or source changes
};

export default {
  recordProductView,
  updateViewDuration,
  recordViewDuration,
  getUserViewHistory,
  getProductViewStats,
  getProductDeviceAnalytics,
  getUserEngagementMetrics,
  clearUserViewHistory,
  getPopularProducts,
  getRelatedProducts,
  getAdminDailyAnalytics,
  getProductEngagementMetrics,
  useProductView
};