"use client";

import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api, { makePriorityRequest } from '../api/api';
import logger from '../utils/logger';

const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all categories
  const fetchCategories = useCallback(async (force = false) => {
    // If we already have categories and force is not true, don't fetch again
    if (categories.length > 0 && !force) {
      return categories;
    }

    try {
      setLoading(true);

      // Use the makePriorityRequest utility to ensure this request isn't canceled
      const response = await makePriorityRequest('get', '/categories');

      const fetchedCategories = response.data.data;
      setCategories(fetchedCategories);
      setError(null);
      return fetchedCategories;
    } catch (err) {
      // Check if this is a canceled request and handle it gracefully
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        // If this was an intentional cancellation (due to deduplication), don't log a warning
        if (err.isIntentionalCancel) {
          logger.debug('Categories request was intentionally canceled (duplicate request)');
        } else {
          logger.warn('Categories request was canceled');
        }

        // If we already have categories, just use them
        if (categories.length > 0) {
          return categories;
        }
      } else {
        // For other errors, log and set error state
        logger.error('Error fetching categories:', err);
        setError('Failed to fetch categories');
      }
      return categories; // Return existing categories even on error
    } finally {
      setLoading(false);
    }
  }, [categories]);

  // Fetch subcategories for a specific parent category
  const fetchSubcategories = useCallback(async (parentSlug, force = false) => {
    if (!parentSlug) return [];

    try {
      // Check if we already have these subcategories cached and not forcing refresh
      if (!force && subcategories[parentSlug]) {
        return subcategories[parentSlug];
      }

      setLoading(true);
      // Use the makePriorityRequest utility to ensure this request isn't canceled
      const response = await makePriorityRequest('get', `/subcategories/parent/${parentSlug}`);

      // Cache the results
      const fetchedSubcategories = response.data.data;
      setSubcategories(prev => ({
        ...prev,
        [parentSlug]: fetchedSubcategories
      }));

      return fetchedSubcategories;
    } catch (err) {
      // Check if this is a canceled request and handle it gracefully
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        // If this was an intentional cancellation (due to deduplication), don't log a warning
        if (err.isIntentionalCancel) {
          logger.debug(`Subcategories request for ${parentSlug} was intentionally canceled (duplicate request)`);
        } else {
          logger.warn(`Subcategories request for ${parentSlug} was canceled`);
        }

        // If we already have subcategories for this parent, just use them
        if (subcategories[parentSlug]) {
          return subcategories[parentSlug];
        }
      } else {
        // For other errors, log and set error state
        logger.error(`Error fetching subcategories for ${parentSlug}:`, err);
        setError('Failed to fetch subcategories');
      }

      // Return existing subcategories or empty array
      return subcategories[parentSlug] || [];
    } finally {
      setLoading(false);
    }
  }, [subcategories]);

  // Clear any cached subcategories
  const clearSubcategoryCache = useCallback(() => {
    setSubcategories({});
  }, []);

  // Load categories on mount
  useEffect(() => {
    // Only fetch if we don't already have categories
    if (categories.length === 0) {
      // Add a small delay to prevent multiple simultaneous requests on initial load
      const timer = setTimeout(() => {
        fetchCategories();
      }, Math.random() * 500); // Random delay between 0-500ms

      return () => clearTimeout(timer);
    }
  }, [fetchCategories, categories.length]);

  // Set up a refresh interval for categories
  useEffect(() => {
    // Only set up refresh if we have categories already
    if (categories.length === 0) return;

    // Set up a refresh interval for categories (every 5 minutes)
    const refreshInterval = setInterval(() => {
      // Only refresh if the user is active (not if the tab is in the background)
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchCategories(true); // Force refresh
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [fetchCategories, categories.length]);

  // Fetch products by category slug
  const fetchProductsByCategory = useCallback(async (slug, page = 1, limit = 12, sort = 'newest', force = false, additionalParams = {}) => {
    if (!slug) return { products: [], pagination: { total: 0 } };

    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sort
    });

    // Add any additional filter parameters
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
    }

    // Create a cache key based on all parameters
    const cacheKey = `${slug}:${queryParams.toString()}`;

    // Check if we already have these products cached and not forcing refresh
    if (!force && categoryProducts[cacheKey]) {
      logger.info(`Using cached products for ${slug} with params: ${queryParams.toString()}`);
      return categoryProducts[cacheKey];
    }

    // Check if we're already loading products for this category
    // This helps prevent duplicate requests
    if (productsLoading) {
      logger.info(`Already loading products for a category, using cached data if available`);
      if (categoryProducts[cacheKey]) {
        return categoryProducts[cacheKey];
      }

      // If we don't have cached data for this specific query but have data for this category,
      // return the most recent data we have for this category as a fallback
      const fallbackData = Object.keys(categoryProducts)
        .filter(key => key.startsWith(`${slug}:`))
        .map(key => categoryProducts[key])
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];

      if (fallbackData) {
        logger.info(`Using fallback cached data for ${slug}`);
        return fallbackData;
      }
    }

    try {
      setProductsLoading(true);

      // Add a timestamp to avoid browser caching
      const timestamp = Date.now();

      // Use the makePriorityRequest utility to ensure this request isn't canceled
      const response = await makePriorityRequest(
        'get',
        `/products/category/${slug}?${queryParams.toString()}`,
        {
          // Add a small random delay to prevent multiple simultaneous requests
          delay: Math.floor(Math.random() * 100)
        }
      );

      // Extract the data
      const { data: products, pagination, category, relatedCategories } = response.data;

      // Normalize the products to ensure all interaction data is properly initialized
      const normalizedProducts = products.map(product => ({
        ...product,
        // Ensure upvote count is properly initialized
        upvoteCount: product.upvoteCount ?? product.upvotes?.count ?? 0,
        // Ensure bookmark count is properly initialized
        bookmarkCount: product.bookmarkCount ?? product.bookmarks?.count ?? 0,
        // Ensure nested structures are properly initialized
        upvotes: {
          ...(product.upvotes || {}),
          count: product.upvoteCount ?? product.upvotes?.count ?? 0,
          userHasUpvoted: product.upvoted ?? product.upvotes?.userHasUpvoted ?? product.userInteractions?.hasUpvoted ?? false
        },
        bookmarks: {
          ...(product.bookmarks || {}),
          count: product.bookmarkCount ?? product.bookmarks?.count ?? 0,
          userHasBookmarked: product.bookmarked ?? product.bookmarks?.userHasBookmarked ?? product.userInteractions?.hasBookmarked ?? false
        },
        // Ensure user interactions are properly initialized
        userInteractions: {
          ...(product.userInteractions || {}),
          hasUpvoted: product.upvoted ?? product.upvotes?.userHasUpvoted ?? product.userInteractions?.hasUpvoted ?? false,
          hasBookmarked: product.bookmarked ?? product.bookmarks?.userHasBookmarked ?? product.userInteractions?.hasBookmarked ?? false
        }
      }));

      // Create a result object with all the data
      const result = {
        products: normalizedProducts,
        pagination,
        category,
        relatedCategories,
        sort,
        timestamp: Date.now() // Add timestamp for cache freshness tracking
      };

      // Cache the results
      setCategoryProducts(prev => ({
        ...prev,
        [cacheKey]: result
      }));

      return result;
    } catch (err) {
      // Check if this is a canceled request and handle it gracefully
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        if (err.isIntentionalCancel) {
          logger.debug(`Products request for category ${slug} was intentionally canceled (duplicate request)`);
        } else {
          logger.warn(`Products request for category ${slug} was canceled`);
        }

        // If we already have products for this category, just use them
        if (categoryProducts[cacheKey]) {
          return categoryProducts[cacheKey];
        }
      } else {
        // For other errors, log and set error state
        logger.error(`Error fetching products for category ${slug}:`, err);
        setError(`Failed to fetch products for category ${slug}`);
      }

      // Return empty result on error
      return { products: [], pagination: { total: 0 } };
    } finally {
      setProductsLoading(false);
    }
  }, [categoryProducts]);

  // Clear product cache for a specific category or all categories
  const clearProductCache = useCallback((slug = null) => {
    if (slug) {
      // Clear only products for this category
      const newCache = {};
      Object.keys(categoryProducts).forEach(key => {
        if (!key.startsWith(`${slug}:`)) {
          newCache[key] = categoryProducts[key];
        }
      });
      setCategoryProducts(newCache);
    } else {
      // Clear all product cache
      setCategoryProducts({});
    }
  }, [categoryProducts]);

  // Add a function to retry fetching categories if there was an error
  const retryFetchCategories = useCallback(() => {
    setError(null);
    return fetchCategories(true); // Force refresh
  }, [fetchCategories]);

  return (
    <CategoryContext.Provider value={{
      categories,
      subcategories,
      categoryProducts,
      loading,
      productsLoading,
      error,
      fetchCategories,
      fetchSubcategories,
      fetchProductsByCategory,
      clearSubcategoryCache,
      clearProductCache,
      retryFetchCategories
    }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => useContext(CategoryContext);

export default CategoryContext;
