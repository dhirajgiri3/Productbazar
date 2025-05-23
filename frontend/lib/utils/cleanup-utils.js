"use client";

/**
 * Utility functions to clean up stale data and prevent memory leaks
 */

/**
 * Cleans up stale recommendation data from sessionStorage
 * This helps prevent excessive API calls due to stale rate limiting data
 */
export const cleanupRecommendationData = () => {
  if (typeof window === 'undefined') return;

  try {
    // Get all keys from sessionStorage
    const keys = Object.keys(sessionStorage);

    // Find and remove stale recommendation-related data
    const recommendationKeys = keys.filter(key =>
      key.startsWith('request_count_') ||
      key.startsWith('last_api_request_') ||
      key.startsWith('rate_limit_warning_shown_') ||
      key.startsWith('feed_distribution_') ||
      key.includes('_feed_last_fetch_') ||
      key.includes('_products_last_fetch_') ||
      key.includes('_log_') ||
      key.startsWith('hybrid_feed_') ||
      key.startsWith('trending_') ||
      key.startsWith('new_products_') ||
      key.startsWith('community_picks_')
    );

    // Remove stale keys
    recommendationKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });

    if (recommendationKeys.length > 0 && process.env.NODE_ENV === 'development') {
      console.log(`Cleaned up ${recommendationKeys.length} stale recommendation items from sessionStorage`);
    }
  } catch (error) {
    // Ignore errors in cleanup
    console.error('Error cleaning up recommendation data:', error);
  }
};

/**
 * Cleans up stale socket data from localStorage
 */
export const cleanupSocketData = () => {
  if (typeof window === 'undefined') return;

  try {
    // Reset socket-related data in localStorage
    const socketKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('socket_') ||
      key.includes('_socket_')
    );

    socketKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    if (socketKeys.length > 0 && process.env.NODE_ENV === 'development') {
      console.log(`Cleaned up ${socketKeys.length} stale socket items from localStorage`);
    }
  } catch (error) {
    // Ignore errors in cleanup
    console.error('Error cleaning up socket data:', error);
  }
};

/**
 * Cleans up stale button state logging data from sessionStorage
 * This helps prevent excessive logging from button components
 */
export const cleanupButtonStateData = () => {
  if (typeof window === 'undefined') return;

  try {
    // Get all keys from sessionStorage
    const keys = Object.keys(sessionStorage);

    // Find and remove stale button state logging data
    const buttonStateKeys = keys.filter(key =>
      key.startsWith('upvote_log_') ||
      key.startsWith('bookmark_log_')
    );

    // Remove stale keys
    buttonStateKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });

    if (buttonStateKeys.length > 0 && process.env.NODE_ENV === 'development') {
      console.log(`Cleaned up ${buttonStateKeys.length} stale button state logging items from sessionStorage`);
    }
  } catch (error) {
    // Ignore errors in cleanup
    console.error('Error cleaning up button state data:', error);
  }
};

/**
 * Cleans up global window variables used for logging and tracking
 */
export const cleanupWindowVariables = () => {
  if (typeof window === 'undefined') return;

  try {
    // List of window variables to clean up
    const variablesToCleanup = [
      '_loggedHybridFeedLoad',
      '_loggedTrendingLoad',
      '_loggedNewProductsLoad',
      '_homepageViewTracking',
      '_loggedHomepageViewSkipped',
      'hybrid_feed_distribution_home',
      '_loggedInterestsLoad',
      '_loggedCommunityPicksLoad',
      'community_picks_distribution_home'
    ];

    // Remove each variable
    let cleanedCount = 0;
    variablesToCleanup.forEach(varName => {
      if (window[varName] !== undefined) {
        delete window[varName];
        cleanedCount++;
      }
    });

    if (cleanedCount > 0 && process.env.NODE_ENV === 'development') {
      console.log(`Cleaned up ${cleanedCount} stale window variables`);
    }
  } catch (error) {
    // Ignore errors in cleanup
    console.error('Error cleaning up window variables:', error);
  }
};

/**
 * Run all cleanup functions
 * Call this on application startup
 */
export const runAllCleanup = () => {
  cleanupRecommendationData();
  cleanupSocketData();
  cleanupButtonStateData();
  cleanupWindowVariables();
};

export default runAllCleanup;
