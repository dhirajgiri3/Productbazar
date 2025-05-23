/**
 * Utility for maintaining a global mapping between product IDs and slugs
 * This helps with real-time updates via socket.io
 */

// Global mapping between product IDs and slugs
const productIdToSlugMap = new Map();
const productSlugToIdMap = new Map();

/**
 * Add a product to the global mapping
 * @param {Object} product - The product object containing _id and slug
 */
export const addProductToMapping = (product) => {
  if (!product) return;

  // Extract ID and slug from the product
  const id = product._id;
  const slug = product.slug;

  // Only add valid mappings
  if (id && slug) {
    productIdToSlugMap.set(id, slug);
    productSlugToIdMap.set(slug, id);
  }
};

/**
 * Add multiple products to the global mapping
 * @param {Array} products - Array of product objects
 */
export const addProductsToMapping = (products) => {
  if (!Array.isArray(products)) return;

  products.forEach(product => {
    // Handle both direct product objects and recommendation objects
    if (product.productData) {
      addProductToMapping(product.productData);
    } else {
      addProductToMapping(product);
    }
  });
};

/**
 * Get the slug for a product ID
 * @param {String} id - The product ID
 * @returns {String|null} - The product slug or null if not found
 */
export const getSlugFromId = (id) => {
  return productIdToSlugMap.get(id) || null;
};

/**
 * Get the ID for a product slug
 * @param {String} slug - The product slug
 * @returns {String|null} - The product ID or null if not found
 */
export const getIdFromSlug = (slug) => {
  return productSlugToIdMap.get(slug) || null;
};

/**
 * Check if a product ID exists in the mapping
 * @param {String} id - The product ID
 * @returns {Boolean} - Whether the ID exists in the mapping
 */
export const hasProductId = (id) => {
  return productIdToSlugMap.has(id);
};

/**
 * Check if a product slug exists in the mapping
 * @param {String} slug - The product slug
 * @returns {Boolean} - Whether the slug exists in the mapping
 */
export const hasProductSlug = (slug) => {
  return productSlugToIdMap.has(slug);
};

/**
 * Get the current size of the mapping
 * @returns {Number} - The number of products in the mapping
 */
export const getMappingSize = () => {
  return productIdToSlugMap.size;
};

/**
 * Clear the mapping
 */
export const clearMapping = () => {
  productIdToSlugMap.clear();
  productSlugToIdMap.clear();
};

/**
 * Get all product IDs in the mapping
 * @returns {Array} - Array of product IDs
 */
export const getAllProductIds = () => {
  return Array.from(productIdToSlugMap.keys());
};

/**
 * Get all product slugs in the mapping
 * @returns {Array} - Array of product slugs
 */
export const getAllProductSlugs = () => {
  return Array.from(productSlugToIdMap.keys());
};



export default {
  addProductToMapping,
  addProductsToMapping,
  getSlugFromId,
  getIdFromSlug,
  hasProductId,
  hasProductSlug,
  getMappingSize,
  clearMapping,
  getAllProductIds,
  getAllProductSlugs
};
