/**
 * Utility functions for form validation
 */

/**
 * Validate a URL string
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export const validateUrl = (url) => {
  if (!url) return true; // Allow empty values
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

/**
 * Validate a GitHub repository URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is a valid GitHub repository URL
 */
export const validateGitHubUrl = (url) => {
  if (!url) return true; // Allow empty values
  
  try {
    const parsed = new URL(url);
    
    // Must be GitHub domain
    if (parsed.hostname !== 'github.com') {
      return false;
    }
    
    // Must have username and repository in path
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return false;
    }
    
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Format a URL string by adding protocol if missing
 * @param {string} url - The URL to format
 * @returns {string} - The formatted URL
 */
export const formatUrl = (url) => {
  if (!url) return '';
  
  // Return as is if it already has http:// or https://
  if (url.match(/^https?:\/\//i)) {
    return url;
  }
  
  // Check if it's a valid domain-like string
  if (url.includes('.') && !url.includes(' ')) {
    return `https://${url}`;
  }
  
  return url;
};

/**
 * Validate an email address
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
export const validateEmail = (email) => {
  if (!email) return true; // Allow empty values
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

/**
 * Validate a phone number
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
export const validatePhone = (phone) => {
  if (!phone) return true; // Allow empty values
  
  const phonePattern = /^[+]?[0-9\s()-]{8,}$/;
  return phonePattern.test(phone);
};

/**
 * Validate all product data
 * @param {object} product - The product data to validate
 * @returns {object} - Object with isValid and errors properties
 */
export const validateProductData = (product) => {
  const errors = {};
  
  // Required fields
  if (!product.name?.trim()) {
    errors.name = 'Product name is required';
  } else if (product.name.trim().length < 3) {
    errors.name = 'Product name must be at least 3 characters';
  } else if (product.name.trim().length > 100) {
    errors.name = 'Product name cannot exceed 100 characters';
  }
  
  if (!product.description?.trim()) {
    errors.description = 'Product description is required';
  } else if (product.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (product.description.trim().length > 10000) {
    errors.description = 'Description cannot exceed 10,000 characters';
  }
  
  if (!product.category) {
    errors.category = 'Category is required';
  }
  
  // Optional fields with validation
  if (product.tagline && product.tagline.trim().length > 200) {
    errors.tagline = 'Tagline cannot exceed 200 characters';
  }
  
  // URL validation
  if (product.links?.website && !validateUrl(product.links.website)) {
    errors['links.website'] = 'Invalid website URL';
  }
  
  if (product.links?.github && !validateGitHubUrl(product.links.github)) {
    errors['links.github'] = 'Invalid GitHub repository URL';
  }
  
  if (product.links?.demo && !validateUrl(product.links.demo)) {
    errors['links.demo'] = 'Invalid demo URL';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
