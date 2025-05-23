import logger from '../logger.js';

/**
 * Get device and network capabilities for optimization
 * @returns {Promise<Object>} Optimization parameters
 */
export const getOptimizationParams = async () => {
  const params = {
    maxWidth: 1200,
    quality: 0.85,
    format: 'webp'
  };

  try {
    // Check WebP support
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') !== 0) {
      params.format = 'jpeg';
    }

    // Check connection speed
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      if (connection.saveData) {
        // Data saver is enabled
        params.maxWidth = 800;
        params.quality = 0.7;
      } else if (connection.effectiveType) {
        // Adjust based on connection speed
        switch (connection.effectiveType) {
          case 'slow-2g':
          case '2g':
            params.maxWidth = 600;
            params.quality = 0.6;
            break;
          case '3g':
            params.maxWidth = 800;
            params.quality = 0.75;
            break;
          case '4g':
            // Keep defaults
            break;
        }
      }
    }

    // Check device memory
    if ('deviceMemory' in navigator) {
      if (navigator.deviceMemory < 4) {
        // Lower memory devices
        params.maxWidth = Math.min(params.maxWidth, 800);
      }
    }

  } catch (error) {
    logger.warn('Error detecting optimization capabilities:', error);
  }

  return params;
};

/**
 * Optimize an image by resizing and compressing it with adaptive quality
 * @param {File} file - The original image file
 * @param {Object} options - Optimization options
 * @param {number} [options.maxWidth=1200] - Maximum width in pixels
 * @param {number} [options.maxSizeMB=2] - Maximum size in MB
 * @param {string} [options.format='webp'] - Output format (webp, jpeg, png)
 * @returns {Promise<File>} - The optimized image file
 */
export const optimizeImage = async (file, options = {}) => {
  // Get dynamic parameters based on device/network
  const deviceParams = await getOptimizationParams();
  
  // Merge with provided options, preferring provided options
  const {
    maxWidth = deviceParams.maxWidth,
    maxHeight = deviceParams.maxWidth * (3/4), // Maintain aspect ratio
    quality = deviceParams.quality,
    format = deviceParams.format,
    maxSizeMB = 2 // Default to 2MB max size
  } = options;

  // If not an image or already small enough, return original
  if (!file.type.startsWith('image/') || file.size <= maxSizeMB * 0.5 * 1024 * 1024) {
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
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = Math.round(height * ratio);
          }
          
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Determine output format and mime type
          let outputFormat = format.toLowerCase();
          let mimeType;
          
          switch (outputFormat) {
            case 'webp':
              mimeType = 'image/webp';
              break;
            case 'png':
              mimeType = 'image/png';
              break;
            case 'jpeg':
            case 'jpg':
              mimeType = 'image/jpeg';
              break;
            default:
              mimeType = 'image/webp';
              outputFormat = 'webp';
          }
          
          // Adaptive quality based on image size and dimensions
          const baseQuality = Math.min(0.92, Math.max(0.7, 1 - (width * height) / (4000 * 3000)));
          let quality = baseQuality;
          
          const tryCompress = (currentQuality) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to create image blob'));
                  return;
                }
                
                // If still too large and quality can be reduced, try again
                if (blob.size > maxSizeMB * 1024 * 1024 && currentQuality > 0.3) {
                  // Adaptive quality reduction based on how far we are from target size
                  const reduction = Math.min(0.15, Math.max(0.05, 
                    (blob.size - maxSizeMB * 1024 * 1024) / (blob.size * 2)));
                  tryCompress(currentQuality - reduction);
                  return;
                }
                
                // Create new file with correct extension
                const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
                const newFilename = file.name.replace(/\.[^.]+$/, '') + '.' + extension;
                
                const optimizedFile = new File([blob], newFilename, {
                  type: mimeType,
                  lastModified: Date.now()
                });
                
                logger.info(`Image optimized: ${file.size} → ${optimizedFile.size} bytes (${Math.round((1 - optimizedFile.size / file.size) * 100)}% reduction)`);
                resolve(optimizedFile);
              },
              mimeType,
              currentQuality
            );
          };
          
          // Start compression with adaptive base quality
          tryCompress(quality);
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
 * Validates an image file
 * @param {File} file - The file to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
export const validateImageFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!file) {
    return { valid: false, error: "No file provided" };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: `Image too large (max ${maxSize/1024/1024}MB)` };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type (must be JPEG, PNG, GIF or WebP)" };
  }
  
  return { valid: true };
};

/**
 * Creates a preview URL for an image file
 * @param {File} file - The image file
 * @returns {Promise<string>} - Preview URL
 */
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to create image preview'));
    reader.readAsDataURL(file);
  });
};
