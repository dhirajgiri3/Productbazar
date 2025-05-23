import api from '../Utils/api';
import logger from '../Utils/logger';
import { optimizeImage } from '../Utils/Image/fileUpload';

/**
 * Upload gallery images for a product
 * 
 * @param {string} slug - Product slug
 * @param {File[]} images - Array of image files to upload
 * @returns {Promise} - Promise resolving to the response data
 */
export const uploadProductGalleryImages = async (slug, images) => {
  try {
    if (!slug || !images || images.length === 0) {
      throw new Error('Missing required parameters for gallery upload');
    }
    
    const galleryFormData = new FormData();
    
    // Process images in batches if there are many
    const BATCH_SIZE = 3;
    let processedCount = 0;
    
    // For smaller sets, process all at once
    if (images.length <= BATCH_SIZE) {
      await Promise.all(images.map(async (file, index) => {
        try {
          // Optimize image before upload
          const optimizedFile = await optimizeImage(file, {
            maxWidth: 1200,
            quality: 0.85,
            format: 'webp'
          });
          
          // Use the correct field name 'images' that backend expects
          galleryFormData.append('images', optimizedFile);
          processedCount++;
          
          logger.info(`[${index + 1}/${images.length}] Gallery image optimized and added to form data`);
        } catch (err) {
          logger.error(`Error processing gallery image: ${err.message}`);
        }
      }));
    } else {
      // For larger sets, process in batches
      for (let i = 0; i < images.length; i += BATCH_SIZE) {
        const batch = images.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (file) => {
          try {
            const optimizedFile = await optimizeImage(file, {
              maxWidth: 1200,
              quality: 0.85,
              format: 'webp'
            });
            
            galleryFormData.append('images', optimizedFile);
            processedCount++;
          } catch (err) {
            logger.error(`Error processing gallery image: ${err.message}`);
          }
        }));
        
        logger.info(`Processed batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(images.length/BATCH_SIZE)}`);
      }
    }
    
    if (processedCount === 0) {
      throw new Error('Failed to process any gallery images');
    }
    
    logger.info(`Uploading ${processedCount} gallery images for product ${slug}`);
    
    const response = await api.post(`/products/${slug}/gallery`, galleryFormData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error uploading gallery images:', error);
    throw error;
  }
};

/**
 * Delete a gallery image from a product
 * 
 * @param {string} slug - Product slug
 * @param {string} imageId - ID of the image to delete
 * @returns {Promise} - Promise resolving to the response data
 */
export const deleteProductGalleryImage = async (slug, imageId) => {
  try {
    const response = await api.delete(`/products/${slug}/gallery/${imageId}`);
    return response.data;
  } catch (error) {
    logger.error('Error deleting gallery image:', error);
    throw error;
  }
};

export default {
  uploadProductGalleryImages,
  deleteProductGalleryImage
};
