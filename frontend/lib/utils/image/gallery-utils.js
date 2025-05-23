// file: frontend/Utils/galleryUtils.js

import api from '../../api/api';
import logger from '../logger';

/**
 * Upload gallery images for a product
 * 
 * @param {string} productId - Product ID
 * @param {File[]} images - Array of image files
 * @returns {Promise} Promise resolving to uploaded gallery data
 */
export const uploadGalleryImages = async (productId, images) => {
  try {
    if (!productId || !images || images.length === 0) {
      throw new Error('Missing required parameters for gallery upload');
    }
    
    const galleryFormData = new FormData();
    
    // Append all images
    images.forEach((file, index) => {
      galleryFormData.append('galleryImages', file);
    });
    
    const response = await api.post(`/products/${productId}/gallery`, galleryFormData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error uploading gallery images:', error);
    throw error;
  }
};

/**
 * Delete a specific gallery image
 * 
 * @param {string} productId - Product ID
 * @param {string} imageId - Image ID to delete
 * @returns {Promise} Promise resolving when image is deleted
 */
export const deleteGalleryImage = async (productId, imageId) => {
  try {
    const response = await api.delete(`/products/${productId}/gallery/${imageId}`);
    return response.data;
  } catch (error) {
    logger.error('Error deleting gallery image:', error);
    throw error;
  }
};

/**
 * Reorder gallery images
 * 
 * @param {string} productId - Product ID
 * @param {string[]} imageIds - Array of image IDs in the desired order
 * @returns {Promise} Promise resolving to updated gallery
 */
export const reorderGalleryImages = async (productId, imageIds) => {
  try {
    const response = await api.put(`/products/${productId}/gallery/reorder`, { imageIds });
    return response.data;
  } catch (error) {
    logger.error('Error reordering gallery images:', error);
    throw error;
  }
};

export default {
  uploadGalleryImages,
  deleteGalleryImage,
  reorderGalleryImages
};
