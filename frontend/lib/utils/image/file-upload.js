import api from '../../api/api.js';
import logger from '../logger.js';

/**
 * Validates an image file
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSize - Maximum file size in bytes (default: 2MB)
 * @param {Array<string>} options.allowedTypes - Allowed MIME types
 * @returns {Object} - { valid: boolean, error?: string }
 */
export const validateImageFile = (file, options = {}) => {
  const maxSize = options.maxSize || 2 * 1024 * 1024; // 2MB default
  const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!file) {
    return { valid: false, error: "No file provided" };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds maximum allowed (${maxSize/1024/1024}MB)` };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}` 
    };
  }
  
  return { valid: true };
};

/**
 * Creates an image preview from a file
 * @param {File} file - The image file
 * @returns {Promise<string>} - Promise resolving to the image data URL
 */
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      resolve(e.target.result);
    };
    fileReader.onerror = (e) => {
      logger.error("Error creating image preview", e);
      reject(new Error("Failed to create image preview"));
    };
    
    fileReader.readAsDataURL(file);
  });
};

/**
 * Prepares a FormData object with user data and files
 * @param {Object} userData - User data object
 * @param {Object} files - Object with file fields as keys and File objects as values
 * @returns {FormData} - Prepared FormData object
 */
export const prepareFormDataWithFiles = (userData, files = {}) => {
  const formData = new FormData();
  
  // Add JSON stringified user data
  formData.append('userData', JSON.stringify(userData));
  
  // Add files
  Object.entries(files).forEach(([fieldName, file]) => {
    if (file) {
      formData.append(fieldName, file);
    }
  });
  
  return formData;
};

/**
 * Helper function to optimize an image before upload
 * @param {File} file - Original file object
 * @param {Object} options - Optimization options
 * @param {number} options.maxWidth - Maximum width in pixels
 * @param {number} options.maxHeight - Maximum height in pixels
 * @param {number} options.quality - JPEG quality (0-1)
 * @param {string} options.format - Output format (jpeg, png, webp)
 * @returns {Promise<File>} - Optimized file
 */
export const optimizeImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'webp'
  } = options;
  
  // Return original file for non-images or unsupported formats
  if (!file.type.startsWith('image/') || 
      (!file.type.includes('jpeg') && 
       !file.type.includes('jpg') && 
       !file.type.includes('png') && 
       !file.type.includes('webp'))) {
    return file;
  }
  
  // Skip optimization for small files
  if (file.size <= 150 * 1024) { // 150KB
    return file;
  }
  
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = Math.round(height * ratio);
          }
          
          if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = Math.round(width * ratio);
          }
          
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to proper MIME type
          let outputType = 'image/jpeg';
          if (format === 'png') outputType = 'image/png';
          if (format === 'webp') outputType = 'image/webp';
          
          // Create blob from canvas
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }
            
            // Create new file from blob
            const optimizedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now()
            });
            
            logger.info(`Image optimized: ${file.size} → ${optimizedFile.size} bytes (${Math.round((1 - optimizedFile.size / file.size) * 100)}% reduction)`);
            resolve(optimizedFile);
          }, outputType, quality);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    } catch (error) {
      logger.error('Image optimization error:', error);
      // Fall back to original file on error
      resolve(file);
    }
  });
};

/**
 * Retry wrapper for upload attempts
 * @param {Function} uploadFn - Upload function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay between retries in ms
 * @returns {Promise} Upload result
 */
const withRetry = async (uploadFn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      lastError = error;
      logger.warn(`Upload attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Upload product images with progress tracking and retry logic
 * @param {string} productId - Product ID or slug
 * @param {Object} files - Object containing main image and gallery images
 * @param {File} files.mainImage - Main product image
 * @param {File[]} files.galleryImages - Array of gallery images
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload results
 */
export const uploadProductImages = async (productId, files, options = {}) => {
  try {
    const formData = new FormData();
    let optimizedCount = 0;
    
    // Add main image if provided
    if (files.mainImage) {
      const optimizedMain = await optimizeImage(files.mainImage, {
        maxWidth: 1200,
        quality: 0.85,
        format: 'webp'
      });
      optimizedCount++;
      formData.append('thumbnail', optimizedMain);
    }
    
    // Add gallery images if provided
    if (files.galleryImages && files.galleryImages.length > 0) {
      // Process images in batches to avoid memory issues
      const BATCH_SIZE = 3;
      for (let i = 0; i < files.galleryImages.length; i += BATCH_SIZE) {
        const batch = files.galleryImages.slice(i, i + BATCH_SIZE);
        
        const optimizedBatch = await Promise.all(batch.map(img => 
          optimizeImage(img, {
            maxWidth: 1000,
            quality: 0.8,
            format: 'webp'
          })
        ));
        
        optimizedCount += optimizedBatch.length;
        optimizedBatch.forEach(file => {
          formData.append('images', file);
        });
      }
    }
    
    logger.info(`Uploading ${optimizedCount} optimized images for product ${productId}`);
    
    // Upload with retry logic
    const uploadFn = () => api.uploadFormData(
      `/products/${productId}/gallery`, 
      formData,
      {
        onUploadProgress: options.onProgress,
        timeout: 30000 // 30 second timeout
      }
    );
    
    return await withRetry(uploadFn);
  } catch (error) {
    logger.error('Product image upload error:', error);
    throw error;
  }
};

/**
 * Upload a profile or banner image
 * @param {File} file - Image file to upload
 * @param {string} type - Type of image ('profile' or 'banner')
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
export const uploadProfileImage = async (file, type = 'profile', options = {}) => {
  try {
    const formData = new FormData();
    
    // Use appropriate optimization settings based on type
    const optimizationOptions = type === 'profile' 
      ? { maxWidth: 400, maxHeight: 400, quality: 0.9, format: 'webp' }
      : { maxWidth: 1500, quality: 0.85, format: 'webp' };
    
    const optimizedFile = await optimizeImage(file, optimizationOptions);
    formData.append(`${type}Image`, optimizedFile);
    
    // Send request
    const response = await api.uploadFormData(
      `/auth/update-${type}`,
      formData,
      {
        onUploadProgress: options.onProgress
      }
    );
    
    return response.data;
  } catch (error) {
    logger.error(`${type} image upload error:`, error);
    throw error;
  }
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result {valid, error}
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  } = options;
  
  // Validate file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  // Validate file size
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is ${(maxSize / (1024 * 1024)).toFixed(1)}MB` 
    };
  }
  
  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { valid: true };
};

export default {
  optimizeImage,
  uploadProductImages,
  uploadProfileImage,
  validateFile
};
