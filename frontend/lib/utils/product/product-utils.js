// file : frontend/Utils/productUtils.js

/**
 * Utility functions for handling product data
 */

/**
 * Format product data for submission to API
 * @param {Object} productData - The product data to format
 * @returns {FormData} - Formatted FormData object ready for submission
 */
export const formatProductForSubmission = (productData) => {
  // Create FormData object
  const formData = new FormData();

  // Add basic product fields
  formData.append('name', productData.name?.trim() || '');
  formData.append('tagline', productData.tagline?.trim() || '');
  formData.append('description', productData.description?.trim() || '');
  formData.append('category', productData.category || 'Other');

  // Handle pricing
  if (productData.pricingType) {
    formData.append('pricingType', productData.pricingType);

    if (productData.pricingType === 'paid') {
      formData.append('pricingAmount', productData.pricingAmount || '0');
      formData.append('pricingCurrency', productData.pricingCurrency || 'USD');
    }
  }

  // Handle status
  formData.append('status', productData.status || 'Draft');

  // Handle links
  if (productData.links) {
    if (typeof productData.links === 'object') {
      formData.append('links', JSON.stringify(productData.links));
    } else {
      formData.append('links', productData.links);
    }
  }

  // Handle tags
  if (productData.tags) {
    if (Array.isArray(productData.tags)) {
      formData.append('tags', productData.tags.join(','));
    } else {
      formData.append('tags', productData.tags);
    }
  }

  // Handle main product image
  if (productData.thumbnail instanceof File) {
    formData.append('productImage', productData.thumbnail);
  } else if (productData.productImage instanceof File) {
    formData.append('productImage', productData.productImage);
  } else if (productData.image instanceof File) {
    formData.append('productImage', productData.image);
  } else if (productData.thumbnail && !productData.thumbnail.startsWith('http')) {
    // If thumbnail is provided as a data URL
    formData.append('thumbnail', productData.thumbnail);
  }

  // Handle gallery images
  if (productData.gallery && Array.isArray(productData.gallery)) {
    for (let i = 0; i < productData.gallery.length; i++) {
      const galleryItem = productData.gallery[i];
      if (galleryItem instanceof File) {
        formData.append('galleryImages', galleryItem);
      }
    }
  }

  return formData;
};

/**
 * Normalize product data for consistent use in the frontend
 * @param {Object|Array} products - Product object or array of products
 * @returns {Object|Array} - Normalized product data
 */
export const normalizeProducts = (products) => {
  if (!products) return [];

  // Handle single product case
  if (!Array.isArray(products)) {
    return normalizeProduct(products);
  }

  // Handle array of products
  return products.map(normalizeProduct);
};

/**
 * Normalize a single product object
 * @param {Object} product - Product object to normalize
 * @returns {Object} - Normalized product
 */
const normalizeProduct = (product) => {
  if (!product) return null;

  // Handle clone to avoid modifying original
  const normalized = { ...product };

  // Ensure userInteractions data exists
  normalized.userInteractions = normalized.userInteractions || {};

  // Ensure upvotes data exists and has correct structure
  normalized.upvotes = {
    count: normalized.upvotes?.count || 0,
    userHasUpvoted: normalized.userInteractions?.hasUpvoted || normalized.upvotes?.userHasUpvoted || false,
    users: normalized.upvotes?.users || []
  };

  // Ensure bookmarks data exists
  normalized.bookmarks = {
    count: normalized.bookmarks?.count || 0,
    userHasBookmarked: normalized.userInteractions?.hasBookmarked || normalized.bookmarks?.userHasBookmarked || false,
    users: normalized.bookmarks?.users || []
  };

  // Ensure userInteractions has the correct structure and is in sync with upvotes/bookmarks
  normalized.userInteractions = {
    hasUpvoted: normalized.upvotes.userHasUpvoted,
    hasBookmarked: normalized.bookmarks.userHasBookmarked,
    ...normalized.userInteractions
  };

  // Ensure views data exists
  normalized.views = {
    count: normalized.views?.count || 0,
    unique: normalized.views?.unique || {}
  };

  // Ensure links data exists
  normalized.links = {
    website: normalized.links?.website || normalized.link || '',
    github: normalized.links?.github || '',
    demo: normalized.links?.demo || ''
  };

  // Ensure comments array exists
  normalized.comments = normalized.comments || [];

  // Ensure gallery array exists
  normalized.gallery = normalized.gallery || [];

  // Ensure pricing data exists
  normalized.pricing = {
    type: normalized.pricing?.type || 'free',
    amount: normalized.pricing?.amount || 0,
    currency: normalized.pricing?.currency || 'USD'
  };

  return normalized;
};

/**
 * Calculate product popularity score based on views, upvotes, comments
 * @param {Object} product - Product object
 * @returns {number} - Popularity score
 */
export const calculatePopularityScore = (product) => {
  if (!product) return 0;

  // Weight factors
  const UPVOTE_WEIGHT = 3;
  const VIEW_WEIGHT = 1;
  const COMMENT_WEIGHT = 2;
  const BOOKMARK_WEIGHT = 2;

  // Get counts
  const upvotes = product.upvotes?.count || 0;
  const views = product.views?.count || 0;
  const comments = product.comments?.length || 0;
  const bookmarks = product.bookmarks?.count || 0;

  // Calculate basic score
  let score = (upvotes * UPVOTE_WEIGHT) +
              (views * VIEW_WEIGHT) +
              (comments * COMMENT_WEIGHT) +
              (bookmarks * BOOKMARK_WEIGHT);

  // Adjust for recency - items decay over time
  const createdAt = new Date(product.createdAt);
  const now = new Date();
  const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0.5, 1 - (ageInDays / 30)); // Max 50% penalty for old items

  // Apply recency adjustment
  score *= recencyFactor;

  return score;
};

/**
 * Sort products by a specified criterion
 * @param {Array} products - Array of products to sort
 * @param {string} sortBy - Sorting criterion
 * @returns {Array} - Sorted products
 */
export const sortProducts = (products, sortBy = 'newest') => {
  if (!products || !Array.isArray(products)) return [];

  const sortedProducts = [...products];

  switch (sortBy) {
    case 'newest':
      return sortedProducts.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    case 'popular':
      return sortedProducts.sort((a, b) =>
        b.upvotes.count - a.upvotes.count
      );
    case 'views':
      return sortedProducts.sort((a, b) =>
        (b.views?.count || 0) - (a.views?.count || 0)
      );
    case 'name':
      return sortedProducts.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    default:
      return sortedProducts;
  }
};

/**
 * Filter products based on criteria
 * @param {Array} products - Array of products to filter
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered products
 */
export const filterProducts = (products, filters = {}) => {
  if (!products || !Array.isArray(products)) return [];

  return products.filter(product => {
    // Filter by category
    if (filters.category && product.category !== filters.category) {
      return false;
    }

    // Filter by pricing type
    if (filters.pricingType && product.pricing?.type !== filters.pricingType) {
      return false;
    }

    // Filter by search query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const nameMatch = product.name.toLowerCase().includes(query);
      const descriptionMatch = product.description.toLowerCase().includes(query);
      const taglineMatch = product.tagline?.toLowerCase().includes(query);
      const tagsMatch = product.tags?.some(tag => tag.toLowerCase().includes(query));

      if (!nameMatch && !descriptionMatch && !taglineMatch && !tagsMatch) {
        return false;
      }
    }

    // Filter by status (for admin/owner views)
    if (filters.status && product.status !== filters.status) {
      return false;
    }

    // Filter by featured status
    if (filters.featured === true && !product.featured) {
      return false;
    }

    // All filters passed
    return true;
  });
};

/**
 * Group products by category
 * @param {Array} products - Array of products
 * @returns {Object} - Products grouped by category
 */
export const groupProductsByCategory = (products) => {
  if (!products || !Array.isArray(products)) return {};

  const grouped = {};

  products.forEach(product => {
    const category = product.category || 'Other';

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(product);
  });

  return grouped;
};

export default {
  normalizeProduct,
  normalizeProducts,
  formatProductForSubmission,
  calculatePopularityScore,
  sortProducts,
  filterProducts,
  groupProductsByCategory
};
