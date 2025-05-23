"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import viewService from 'services/viewService.js';
import { useAuth } from './auth-context.jsx';
import { useSocket } from './socket-context.jsx';
import eventBus, { EVENT_TYPES } from '../utils/event-bus.js';

// Create context
const ViewContext = createContext();

/**
 * Provider component for view tracking functionality
 */
export const ViewProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { subscribeToProductUpdates, isConnected } = useSocket();
  const [viewHistory, setViewHistory] = useState([]);
  const [viewStats, setViewStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const currentProductId = useRef(null);
  const viewStatsCache = useRef(new Map());

  // Track a product view
  const trackProductView = useCallback(async (productId, viewData = {}) => {
    if (!productId) return { success: false, error: 'Missing productId' };

    try {
      // Check if this view was already tracked in this session
      const viewKey = `view-${productId}-${viewData.source || 'direct'}`;
      const lastView = sessionStorage.getItem(viewKey);
      const SESSION_TTL = 5 * 60 * 1000; // 5 minutes - reduced from 30 minutes to allow more frequent tracking

      if (lastView && (Date.now() - parseInt(lastView)) < SESSION_TTL) {
        console.log('View already tracked in this session, skipping');
        return { success: true, message: 'View already tracked in this session' };
      }

      console.log('Recording new view for product:', productId);

      // Record the view
      try {
        const result = await viewService.recordProductView(productId, {
          ...viewData,
          userId: user?._id
        });

        // Mark as tracked in this session
        if (result.success) {
          sessionStorage.setItem(viewKey, Date.now().toString());
          console.log(`View successfully recorded for product ${productId}:`, result);
        } else {
          console.warn(`Failed to record view for product ${productId}:`, result);
        }

        return result;
      } catch (viewError) {
        console.error(`Error recording view for product ${productId}:`, viewError);
        return { success: false, error: viewError.message };
      }

    } catch (error) {
      console.error('Error tracking product view:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Get view statistics for a product (for product owners)
  const getProductViewStats = useCallback(async (productId, days = 7) => {
    if (!productId) {
      setError('Missing product ID');
      setLoading(false);
      return { success: false, error: 'Missing product ID' };
    }

    // Check if productId is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(productId);
    if (!isValidObjectId) {
      console.error('Invalid product ID format:', productId);
      setError('Invalid product ID format');
      setLoading(false);
      return { success: false, error: 'Invalid product ID format' };
    }

    try {
      setLoading(true);
      setError(null);

      // Store current product ID for real-time updates
      currentProductId.current = productId;

      // Check cache first
      const cacheKey = `${productId}:${days}`;
      const cachedStats = viewStatsCache.current.get(cacheKey);
      const now = Date.now();
      const CACHE_TTL = 60 * 1000; // 1 minute

      if (cachedStats && (now - cachedStats.timestamp) < CACHE_TTL) {
        setViewStats(cachedStats.data);
        setLoading(false);
        return { success: true, stats: cachedStats.data };
      }

      const result = await viewService.getProductViewStats(productId, { days });

      if (result.success) {
        setViewStats(result.stats);

        // Cache the result
        viewStatsCache.current.set(cacheKey, {
          data: result.stats,
          timestamp: Date.now()
        });

        // Subscribe to real-time updates if enabled
        if (realTimeEnabled && isConnected) {
          subscribeToProductUpdates(productId);
        }
      } else {
        setError(result.error || 'Failed to fetch view statistics');
      }

      return result;
    } catch (error) {
      setError(error.message || 'An error occurred while fetching view statistics');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [realTimeEnabled, isConnected, subscribeToProductUpdates]);

  // Get user's view history
  const getUserViewHistory = useCallback(async (page = 1, limit = 10) => {
    if (!isAuthenticated) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      const result = await viewService.getUserViewHistory(page, limit);

      if (result.success) {
        setViewHistory(result.data);
      } else {
        setError(result.error || 'Failed to fetch view history');
      }

      return result;
    } catch (error) {
      setError(error.message || 'An error occurred while fetching view history');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Clear user's view history
  const clearViewHistory = useCallback(async () => {
    if (!isAuthenticated) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      const result = await viewService.clearUserViewHistory();

      if (result.success) {
        setViewHistory([]);
      } else {
        setError(result.error || 'Failed to clear view history');
      }

      return result;
    } catch (error) {
      setError(error.message || 'An error occurred while clearing view history');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get popular products based on views
  const getPopularProducts = useCallback(async (limit = 10, period = 'week') => {
    try {
      return await viewService.getPopularProducts(limit, period);
    } catch (error) {
      console.error('Error fetching popular products:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Get related products based on co-viewing patterns
  const getRelatedProducts = useCallback(async (productId, limit = 5) => {
    if (!productId) return { success: false, error: 'Missing productId' };

    try {
      return await viewService.getRelatedProducts(productId, limit);
    } catch (error) {
      console.error('Error fetching related products:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Listen for real-time view updates
  useEffect(() => {
    const handleViewUpdate = (data) => {
      if (!data || !data.productId) return;

      // Only update if we're currently viewing this product's stats
      if (currentProductId.current === data.productId) {
        // Update the stats with real-time data
        setViewStats(prevStats => {
          if (!prevStats) return prevStats;

          // Create a deep copy of the stats
          const updatedStats = JSON.parse(JSON.stringify(prevStats));

          // Update totals
          if (updatedStats.totals) {
            if (typeof data.count === 'number') {
              updatedStats.totals.totalViews = data.count;
            }
            if (typeof data.unique === 'number') {
              updatedStats.totals.uniqueViewers = data.unique;
            }
          }

          // Update engagement metrics if available
          if (data.viewDuration && updatedStats.engagementMetrics) {
            // We'd need more complex logic to properly update averages
            // This is a simplified update
            updatedStats.engagementMetrics.lastViewDuration = data.viewDuration;
          }

          // Update daily views if it's a new view
          if (data.viewType === 'new' && updatedStats.dailyViews && updatedStats.dailyViews.length > 0) {
            // Find today's entry and increment it
            const today = new Date().toISOString().split('T')[0];
            const todayEntry = updatedStats.dailyViews.find(entry => entry.date === today);

            if (todayEntry) {
              todayEntry.count += 1;
              // If it's a unique view, increment that too
              if (data.isUnique) {
                todayEntry.uniqueCount = (todayEntry.uniqueCount || 0) + 1;
              }
            }
          }

          return updatedStats;
        });
      }
    };

    // Subscribe to view updates
    const unsubscribe = eventBus.subscribe(EVENT_TYPES.VIEW_UPDATED, handleViewUpdate);

    return () => {
      unsubscribe();
    };
  }, []);

  // Toggle real-time updates
  const toggleRealTimeUpdates = useCallback((enabled) => {
    setRealTimeEnabled(enabled);
  }, []);

  // Context value
  const value = {
    trackProductView,
    getProductViewStats,
    getUserViewHistory,
    clearViewHistory,
    getPopularProducts,
    getRelatedProducts,
    toggleRealTimeUpdates,
    viewHistory,
    viewStats,
    loading,
    error,
    realTimeEnabled
  };

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
};

// Custom hook to use the view context
export const useView = () => {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};

export default ViewContext;