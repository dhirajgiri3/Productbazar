/**
 * Utility functions for handling recommendations in the frontend
 */

/**
 * Ensures that recommendations from different sections are distinct
 * by filtering out products that have already been seen in other sections
 * 
 * @param {Array} recommendations - The current recommendations to filter
 * @param {Set} seenProductIds - Set of product IDs that have already been seen
 * @param {Number} minCount - Minimum number of recommendations to return
 * @returns {Array} Filtered recommendations with no duplicates
 */
export const getDistinctRecommendations = (recommendations, seenProductIds = new Set(), minCount = 3) => {
  if (!recommendations || !Array.isArray(recommendations)) {
    return [];
  }

  // Filter out products that have already been seen
  const distinctRecommendations = recommendations.filter(product => {
    const productId = product._id || (product.productData && product.productData._id);
    if (!productId || seenProductIds.has(productId.toString())) {
      return false;
    }
    // Add to seen set
    seenProductIds.add(productId.toString());
    return true;
  });

  // If we don't have enough distinct recommendations, add some from the original set
  // but mark them as duplicates
  if (distinctRecommendations.length < minCount && recommendations.length > distinctRecommendations.length) {
    const remainingRecommendations = recommendations.filter(product => {
      const productId = product._id || (product.productData && product.productData._id);
      return !distinctRecommendations.some(p => 
        (p._id && p._id.toString() === productId.toString()) || 
        (p.productData && p.productData._id.toString() === productId.toString())
      );
    });

    // Add remaining recommendations up to minCount
    const additionalNeeded = Math.min(minCount - distinctRecommendations.length, remainingRecommendations.length);
    if (additionalNeeded > 0) {
      const additionalRecommendations = remainingRecommendations.slice(0, additionalNeeded).map(product => ({
        ...product,
        isDuplicate: true // Mark as duplicate for potential UI treatment
      }));
      
      return [...distinctRecommendations, ...additionalRecommendations];
    }
  }

  return distinctRecommendations;
};

/**
 * Tracks seen product IDs across recommendation sections to prevent duplicates
 */
export class RecommendationTracker {
  constructor() {
    this.seenProductIds = new Set();
  }

  /**
   * Get distinct recommendations that haven't been seen in other sections
   * 
   * @param {Array} recommendations - The recommendations to filter
   * @param {Number} minCount - Minimum number of recommendations to return
   * @returns {Array} Filtered recommendations with no duplicates
   */
  getDistinct(recommendations, minCount = 3) {
    return getDistinctRecommendations(recommendations, this.seenProductIds, minCount);
  }

  /**
   * Reset the tracker to clear all seen product IDs
   */
  reset() {
    this.seenProductIds.clear();
  }

  /**
   * Add product IDs to the seen set without filtering
   * 
   * @param {Array} recommendations - Recommendations to mark as seen
   */
  markAsSeen(recommendations) {
    if (!recommendations || !Array.isArray(recommendations)) {
      return;
    }

    recommendations.forEach(product => {
      const productId = product._id || (product.productData && product.productData._id);
      if (productId) {
        this.seenProductIds.add(productId.toString());
      }
    });
  }
}

// Create a singleton instance for global use
export const globalRecommendationTracker = new RecommendationTracker();
