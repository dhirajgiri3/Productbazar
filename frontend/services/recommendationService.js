import { makePriorityRequest } from "@/lib/api/api";

const recommendationService = {
  /**
   * Get recommendations based on user's view history
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of recommendations to fetch
   * @param {number} params.offset - Offset for pagination
   * @returns {Promise<Object>} - Recommendations data with pagination
   */
  getHistoryBasedRecommendations: async (params = {}) => {
    try {
      const response = await makePriorityRequest('get', '/recommendations/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching history-based recommendations:', error);
      throw error;
    }
  },

  /**
   * Get personalized recommendations for the current user
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of recommendations to fetch
   * @param {number} params.offset - Offset for pagination
   * @returns {Promise<Object>} - Recommendations data with pagination
   */
  getPersonalizedRecommendations: async (params = {}) => {
    try {
      const response = await makePriorityRequest('get', '/recommendations/personalized', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      throw error;
    }
  },

  /**
   * Get trending recommendations across the platform
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of recommendations to fetch
   * @param {number} params.offset - Offset for pagination
   * @returns {Promise<Object>} - Recommendations data with pagination
   */
  getTrendingRecommendations: async (params = {}) => {
    try {
      const response = await makePriorityRequest('get', '/recommendations/trending', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending recommendations:', error);
      throw error;
    }
  },

  /**
   * Get recommendations based on specific category
   * @param {string} categoryId - Category ID to fetch recommendations for
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of recommendations to fetch
   * @returns {Promise<Object>} - Recommendations data with pagination
   */
  getCategoryRecommendations: async (categoryId, params = {}) => {
    try {
      const response = await makePriorityRequest('get', `/recommendations/category/${categoryId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching category recommendations:', error);
      throw error;
    }
  },

  /**
   * Get similar products recommendations
   * @param {string} productId - Product ID to find similar products for
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of recommendations to fetch
   * @returns {Promise<Object>} - Recommendations data with pagination
   */
  getSimilarProducts: async (productId, params = {}) => {
    try {
      const response = await makePriorityRequest('get', `/recommendations/similar/${productId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching similar products:', error);
      throw error;
    }
  },

  /**
   * Dismiss a specific recommendation
   * @param {string} productId - Product ID to dismiss from recommendations
   * @returns {Promise<Object>} - Response confirmation
   */
  dismissRecommendation: async (productId) => {
    try {
      const response = await makePriorityRequest('post', '/recommendations/dismiss', { productId });
      return response.data;
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
      throw error;
    }
  }
};

export default recommendationService;
