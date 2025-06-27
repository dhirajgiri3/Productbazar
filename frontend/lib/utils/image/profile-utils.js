/**
 * Normalize product data from the API response
 * @param {Array} products - Array of product objects from the API
 * @returns {Array} Normalized product objects with temporary IDs
 */
export const normalizeUserProducts = (products = []) => {
  if (!Array.isArray(products)) return [];
  
  return products.map(product => ({
    ...product,
    _tempId: typeof window !== 'undefined'
      ? `temp-${product._id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      : `temp-${product._id || 'ssr'}-staticid`,
    links: {
      website: product.links?.website || product.link || '',
      github: product.links?.github || '',
      demo: product.links?.demo || ''
    }
  }));
};

/**
 * Normalize user data from the API response
 * @param {Object} user - User object from the API
 * @returns {Object} Normalized user data
 */
export const normalizeUserData = (user) => {
  if (!user) return {};

  return {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    bio: user.bio || '',
    about: user.about || '',
    openToWork: !!user.openToWork,
    skills: user.skills ? user.skills.join(', ') : '',
    socialLinks: {
      facebook: user.socialLinks?.facebook || '',
      twitter: user.socialLinks?.twitter || '',
      linkedin: user.socialLinks?.linkedin || '',
      instagram: user.socialLinks?.instagram || '',
      github: user.socialLinks?.github || '',
      website: user.socialLinks?.website || ''
    },
    badges: user.badges || [],
    activity: user.activity || [],
    // Handle both object format and string format for backward compatibility
    profilePicture: user.profilePicture || null
  };
};

/**
 * Check if a product is an existing one (has an _id)
 * @param {Object} product - Product object
 * @returns {boolean} True if product is existing
 */
export const isExistingProduct = (product) => {
  return !!product && !!product._id;
};
