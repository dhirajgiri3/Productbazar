import { useState, useCallback, useEffect } from 'react';
import api from '../Utils/api';
import { useAuth } from "@/lib/contexts/auth-context";
import { useRecommendation } from "@/lib/contexts/recommendation-context";

/**
 * Custom hook for managing product data and interactions
 * Provides methods for fetching products and handling user interactions
 */
const useProductData = (options = {}) => {
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    hasMore: false
  });
  
  const { isAuthenticated, user } = useAuth();
  const { recordInteraction } = useRecommendation();
  
  const { initialLoad = true } = options;

  // Clear any existing error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch multiple products with filtering options
  const fetchProducts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await api.get('/products', { params });
      
      if (response.data.success) {
        setProducts(response.data.data);
        setPagination({
          page: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
          hasMore: response.data.pagination.currentPage < response.data.pagination.totalPages
        });
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to fetch products');
        return [];
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching products');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Fetch a single product by ID
  const fetchProductById = useCallback(async (id, trackView = true) => {
    if (!id) {
      setError('Product ID is required');
      return null;
    }
    
    try {
      setLoading(true);
      clearError();
      
      const response = await api.get(`/products/${id}`);
      
      if (response.data.success) {
        setProduct(response.data.data);
        
        // Track view if needed and user is authenticated
        if (trackView && isAuthenticated && response.data.data._id) {
          try {
            await recordInteraction(response.data.data._id, 'view');
          } catch (error) {
            // Silently fail - don't interrupt user experience for tracking errors
            console.error('Failed to record view:', error);
          }
        }
        
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to fetch product');
        return null;
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching the product');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError, isAuthenticated, recordInteraction]);

  // Fetch a single product by slug
  const fetchProductBySlug = useCallback(async (slug, trackView = true) => {
    if (!slug) {
      setError('Product slug is required');
      return null;
    }
    
    try {
      setLoading(true);
      clearError();
      
      const response = await api.get(`/products/slug/${slug}`);
      
      if (response.data.success) {
        setProduct(response.data.data);
        
        // Track view if needed and user is authenticated
        if (trackView && isAuthenticated && response.data.data._id) {
          try {
            await recordInteraction(response.data.data._id, 'view', {
              source: 'product-page',
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            // Silently fail - don't interrupt user experience for tracking errors
            console.error('Failed to record view:', error);
          }
        }
        
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to fetch product');
        return null;
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching the product');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError, isAuthenticated, recordInteraction]);

  // Handle product upvoting
  const toggleUpvote = useCallback(async (productIdOrSlug) => {
    if (!isAuthenticated) {
      setError('You must be logged in to upvote products');
      return { success: false, message: 'Authentication required' };
    }
    
    try {
      const response = await api.post(`/products/${productIdOrSlug}/upvote`);
      
      if (response.data.success) {
        // Record interaction for recommendation system
        if (response.data.data.productId) {
          try {
            await recordInteraction(response.data.data.productId, 'upvote', {
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            // Silently fail
            console.error('Failed to record upvote interaction:', error);
          }
        }
        
        return response.data;
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Failed to upvote product' };
    }
  }, [isAuthenticated, recordInteraction]);

  // Handle product bookmarking
  const toggleBookmark = useCallback(async (productIdOrSlug) => {
    if (!isAuthenticated) {
      setError('You must be logged in to bookmark products');
      return { success: false, message: 'Authentication required' };
    }
    
    try {
      const response = await api.post(`/products/${productIdOrSlug}/bookmark`);
      
      if (response.data.success) {
        // Record interaction for recommendation system
        if (response.data.data.productId) {
          try {
            await recordInteraction(response.data.data.productId, 'bookmark', {
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            // Silently fail
            console.error('Failed to record bookmark interaction:', error);
          }
        }
        
        return response.data;
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Failed to bookmark product' };
    }
  }, [isAuthenticated, recordInteraction]);

  // Fetch user's bookmarked products
  const fetchBookmarkedProducts = useCallback(async (params = {}) => {
    if (!isAuthenticated) {
      setError('You must be logged in to view bookmarked products');
      return [];
    }
    
    try {
      setLoading(true);
      clearError();
      
      const response = await api.get('/products/bookmarked', { params });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to fetch bookmarked products');
        return [];
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching bookmarked products');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError, isAuthenticated]);

  // Get trending products through recommendation system
  const getTrendingProducts = useCallback(async (limit = 10) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await api.get('/recommendations/trending', {
        params: { limit }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to fetch trending products');
        return [];
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching trending products');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Get similar products through recommendation system
  const getSimilarProducts = useCallback(async (productId, limit = 5) => {
    if (!productId) {
      setError('Product ID is required');
      return [];
    }
    
    try {
      setLoading(true);
      clearError();
      
      const response = await api.get(`/recommendations/similar/${productId}`, {
        params: { limit }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to fetch similar products');
        return [];
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching similar products');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Load initial data if requested
  useEffect(() => {
    if (initialLoad) {
      fetchProducts();
    }
  }, [initialLoad, fetchProducts]);

  return {
    products,
    product,
    loading,
    error,
    pagination,
    clearError,
    fetchProducts,
    fetchProductById,
    fetchProductBySlug,
    toggleUpvote,
    toggleBookmark,
    fetchBookmarkedProducts,
    getTrendingProducts,
    getSimilarProducts
  };
};

export default useProductData;