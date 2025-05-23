import api from '../../api/api.js';
import logger from '../logger.js';

/**
 * Helper function to optimize an image before upload
 * @param {File} file - Original file object
 * @param {Object} options - Optimization options
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
 * Upload both profile and banner images in a single request
 * @param {Object} files - Object containing profile and/or banner files
 * @param {File} [files.profileImage] - Profile image file
 * @param {File} [files.bannerImage] - Banner image file
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
export const uploadProfileImages = async (files, options = {}) => {
  try {
    if (!files.profileImage && !files.bannerImage) {
      throw new Error('No files provided for upload');
    }
    
    const formData = new FormData();
    let optimizedCount = 0;
    
    // Show optimization progress if callback provided
    if (options.onOptimizationStart) {
      options.onOptimizationStart();
    }
    
    // Process profile image if provided
    if (files.profileImage) {
      // Validate first
      if (!files.profileImage.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
        throw new Error('Invalid profile image type. Please upload a JPEG, PNG, GIF, or WebP image.');
      }
      
      if (files.profileImage.size > 5 * 1024 * 1024) {
        throw new Error(`Profile image size (${(files.profileImage.size/1024/1024).toFixed(2)}MB) exceeds the maximum limit of 5MB.`);
      }
      
      // Optimize the image
      const optimizedProfile = await optimizeImage(files.profileImage, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.9,
        format: 'webp'
      });
      
      formData.append('profileImage', optimizedProfile);
      optimizedCount++;
    }
    
    // Process banner image if provided
    if (files.bannerImage) {
      // Validate first
      if (!files.bannerImage.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
        throw new Error('Invalid banner image type. Please upload a JPEG, PNG, GIF, or WebP image.');
      }
      
      if (files.bannerImage.size > 5 * 1024 * 1024) {
        throw new Error(`Banner image size (${(files.bannerImage.size/1024/1024).toFixed(2)}MB) exceeds the maximum limit of 5MB.`);
      }
      
      // Optimize the image
      const optimizedBanner = await optimizeImage(files.bannerImage, {
        maxWidth: 1500,
        maxHeight: 500,
        quality: 0.85,
        format: 'webp'
      });
      
      formData.append('bannerImage', optimizedBanner);
      optimizedCount++;
    }
    
    if (options.onOptimizationComplete) {
      options.onOptimizationComplete();
    }
    
    logger.info(`Uploading ${optimizedCount} optimized profile images`);
    
    // Make request with progress tracking
    const response = await api.uploadFormData(
      '/auth/update-profile-full', 
      formData,
      {
        onUploadProgress: options.onProgress
      }
    );
    
    return response.data;
  } catch (error) {
    logger.error('Profile images upload error:', error);
    throw error;
  }
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {string} type - Type of image ('profile' or 'banner')
 * @returns {Object} - Validation result {valid, error}
 */
export const validateProfileImage = (file, type = 'profile') => {
  // Maximum sizes
  const maxSize = type === 'profile' ? 5 * 1024 * 1024 : 5 * 1024 * 1024; // 5MB for both
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
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
      error: `Unsupported file type: ${file.type}. Allowed types: JPG, PNG, GIF, WebP` 
    };
  }
  
  // Recommend image dimensions based on type
  if (type === 'profile') {
    return { 
      valid: true, 
      recommendation: 'For best results, use a square image (1:1 ratio) at least 200x200 pixels'
    };
  } else {
    return { 
      valid: true, 
      recommendation: 'For best results, use an image with 3:1 ratio (like 1500x500 pixels)'
    };
  }
};

/**
 * Validates an image file for profile/banner uploads
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSizeMB - Maximum file size in MB
 * @param {string[]} options.allowedTypes - Allowed MIME types
 * @returns {Object} Validation result
 */
export const validateImageFile = (file, options = {}) => {
  const maxSizeMB = options.maxSizeMB || 2; // Default 2MB
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const allowedTypes = options.allowedTypes || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Image must be smaller than ${maxSizeMB}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Only ${allowedTypes.map(t => t.split('/')[1]).join(', ')} images are allowed` 
    };
  }

  return { valid: true };
};

/**
 * Creates a preview URL for an image file
 * @param {File} file - The image file
 * @returns {Promise<string>} - Promise that resolves to the preview URL
 */
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to create image preview'));
    reader.readAsDataURL(file);
  });
};

/**
 * Prepares FormData with user data and files for auth requests
 * @param {Object} userData - User data object
 * @param {Object} files - Object containing file objects
 * @returns {FormData} - FormData instance with all data
 */
export const prepareFormDataWithFiles = (userData, files = {}) => {
  const formData = new FormData();
  
  // Add user data as JSON
  formData.append('userData', JSON.stringify(userData));
  
  // Add profile image if exists
  if (files.profileImage) {
    formData.append('profileImage', files.profileImage);
  }
  
  // Add banner image if exists
  if (files.bannerImage) {
    formData.append('bannerImage', files.bannerImage);
  }
  
  // Add any other files
  Object.entries(files).forEach(([key, file]) => {
    if (key !== 'profileImage' && key !== 'bannerImage' && file) {
      formData.append(key, file);
    }
  });
  
  return formData;
};

/**
 * Upload profile or banner image to server
 * @param {File} file - The image file to upload
 * @param {string} type - Type of image ('profile' or 'banner')
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - Promise that resolves to server response
 */
export const uploadProfileImage = async (file, type = 'profile', onProgress) => {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const formData = new FormData();
    formData.append(`${type}Image`, file);

    const response = await api.uploadFormData(
      `/auth/update-${type}`,
      formData,
      { onProgress }
    );

    return response.data;
  } catch (error) {
    logger.error(`Failed to upload ${type} image:`, error);
    throw error;
  }
};

export default {
  optimizeImage,
  uploadProfileImage,
  uploadProfileImages,
  validateProfileImage,
  validateImageFile,
  createImagePreview,
  prepareFormDataWithFiles
};
