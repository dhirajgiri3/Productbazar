// File: backend/Utils/cloudinary.utils.js
import { v2 as cloudinary } from 'cloudinary';
import logger from '../logging/logger.js';
import fs from 'fs/promises';

// Export cloudinary for direct use
export { cloudinary };

/**
 * @typedef {Object} UploadResult
 * @property {string} url - Secure URL of the uploaded file
 * @property {string} publicId - Cloudinary public ID
 * @property {string} [originalname] - Original filename
 * @property {number} [width] - Width of the uploaded image
 * @property {number} [height] - Height of the uploaded image
 * @property {string} [format] - Format of the uploaded image
 * @property {number} [size] - Size of the uploaded image in bytes
 */

/**
 * @typedef {Object} FileObject
 * @property {Buffer} [buffer] - File buffer for memory storage
 * @property {string} [path] - File path for disk storage
 * @property {string} mimetype - File MIME type
 * @property {string} originalname - Original filename
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const UPLOAD_PRESETS = {
  products: {
    transformation: [
      { width: 1200, height: 800, crop: 'fill', gravity: 'auto' },
      { quality: 'auto:eco', fetch_format: 'auto' }
    ]
  },
  gallery: {
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' },
      { quality: 'auto:eco', fetch_format: 'auto' }
    ]
  },
  profile: {
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:eco', fetch_format: 'auto' }
    ]
  },
  banner: {
    transformation: [
      { width: 1920, height: 480, crop: 'fill', gravity: 'auto' },
      { quality: 'auto:eco', fetch_format: 'auto' }
    ]
  },
  'job-applications': {
    // No transformations for documents
    resource_type: 'auto' // Automatically detect resource type (image, pdf, etc.)
  },
  'client-logos': {
    transformation: [
      { width: 400, height: 400, crop: 'limit' },
      { quality: 'auto:eco', fetch_format: 'auto' }
    ]
  },
  'job-logos': {
    transformation: [
      { width: 400, height: 400, crop: 'limit' },
      { quality: 'auto:eco', fetch_format: 'auto' }
    ]
  }
};

/**
 * Uploads a file to Cloudinary with optimization
 * @param {FileObject} file - File object to upload
 * @param {string} [folder='products'] - Cloudinary folder name
 * @returns {Promise<UploadResult>}
 */
export const uploadToCloudinary = async (file, folder = 'products') => {
  try {
    // Add proper validation and debugging
    if (!file) {
      throw new Error('File is undefined or null');
    }

    if (!file.buffer && !file.path) {
      console.error('Invalid file object:', typeof file, Object.keys(file));
      throw new Error('Invalid file object: buffer or path required');
    }

    // For memory storage (multer.memoryStorage), file will have a buffer property
    // For disk storage (multer.diskStorage), file will have a path property
    let dataURI;
    if (file.buffer) {
      // Handle memory-stored file
      dataURI = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      logger.info(`Processing memory-stored file: ${file.originalname}`);
    } else if (file.path) {
      // Handle disk-stored file
      dataURI = file.path;
      logger.info(`Processing disk-stored file: ${file.path}`);
    } else {
      // Handle direct URL or base64 string
      dataURI = typeof file === 'string' ? file : null;
      if (!dataURI) {
        throw new Error('Invalid file format: neither buffer nor path provided');
      }
      logger.info('Processing direct URL or base64 string');
    }

    // Determine if this is a document upload
    const isDocument = file.mimetype === 'application/pdf' ||
                      file.mimetype === 'application/msword' ||
                      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Get preset options based on folder
    const presetOptions = UPLOAD_PRESETS[folder] || UPLOAD_PRESETS.products;

    // Set upload options
    const uploadOptions = {
      folder,
      resource_type: isDocument ? 'raw' : 'auto', // Use 'raw' for documents, 'auto' for images
      flags: !isDocument ? 'progressive' : undefined, // Only use progressive flag for images
      ...presetOptions,
      timeout: 30000
    };

    logger.info(`Uploading ${isDocument ? 'document' : 'image'} to Cloudinary folder: ${folder}`);

    const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

    // Return a standardized result object with consistent property names
    const uploadResult = {
      url: result.secure_url,
      publicId: result.public_id,
      originalname: file.originalname || 'unknown',
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    };

    logger.info(`Successfully uploaded to Cloudinary: ${uploadResult.url}`);
    return uploadResult;
  } catch (error) {
    logger.error(`Cloudinary upload error: ${error.message}`, {
      folder,
      fileType: file.mimetype || 'unknown',
      fileName: file.originalname || 'unknown',
      error: error.stack
    });

    // Return null instead of throwing to allow graceful fallback
    return null;
  }
};

/**
 * Cleans up temporary files after upload
 * @param {FileObject} file - File object to clean up
 */
const cleanupTempFile = async (file) => {
  try {
    if (file && file.path) {
      await fs.unlink(file.path);
      logger.debug(`Cleaned up temporary file: ${file.path}`);
    }
  } catch (error) {
    logger.error(`Error cleaning up temporary file: ${error.message}`);
  }
};

export const cloudinaryUploader = (type = 'product', multiple = false) => {
  return async (req, res, next) => {
    try {
      // Skip if no files are present
      if ((!multiple && !req.file) || (multiple && (!req.files || req.files.length === 0))) {
        return next();
      }

      // Debug information for troubleshooting
      logger.debug(`Cloudinary uploader: Processing ${multiple ? 'multiple files' : 'single file'} for type: ${type}`);

      if (multiple && req.files && req.files.length > 0) {
        // Process multiple files
        const uploads = [];

        for (const file of req.files) {
          if (!file || (!file.buffer && !file.path)) {
            logger.warn('Invalid file object received in cloudinary uploader:', file);
            continue;
          }

          try {
            const result = await uploadToCloudinary(file, type);
            uploads.push(result);
          } catch (uploadError) {
            logger.error(`Error uploading file ${file.originalname}:`, uploadError);
          } finally {
            await cleanupTempFile(file);
          }
        }

        req.cloudinaryFiles = uploads;
        next();
      } else if (!multiple && req.file) {
        // Process single file
        if (!req.file.buffer && !req.file.path) {
          logger.warn('Invalid file object received in cloudinary uploader:', req.file);
          return next(new Error('Invalid file format or missing data'));
        }

        try {
          req.cloudinaryFile = await uploadToCloudinary(req.file, type);
          next();
        } catch (error) {
          next(error);
        } finally {
          await cleanupTempFile(req.file);
        }
      } else {
        // Skip if no files to process
        next();
      }
    } catch (error) {
      logger.error('Cloudinary uploader middleware error:', error);
      return res.status(400).json({
        success: false,
        message: 'Error processing image upload: ' + error.message
      });
    }
  };
};

/**
 * Deletes a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID or URL
 * @returns {Promise<boolean>} - True if deletion was successful, false otherwise
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      logger.warn('Attempted to delete from Cloudinary with empty publicId');
      return false;
    }

    // Extract the public ID from a URL if needed
    let id;
    if (publicId.includes('cloudinary.com')) {
      // Handle full Cloudinary URL
      const urlParts = publicId.split('/');
      const fileNameWithExt = urlParts.pop() || '';
      id = fileNameWithExt.split('.')[0];

      // If we couldn't extract an ID, try another approach for v2 URLs
      if (!id && urlParts.length > 0) {
        // Try to get the last meaningful segment
        const uploadSegmentIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadSegmentIndex >= 0 && uploadSegmentIndex < urlParts.length - 1) {
          id = urlParts.slice(uploadSegmentIndex + 1).join('/');
        }
      }
    } else {
      // Already a public ID
      id = publicId;
    }

    if (!id) {
      logger.warn(`Could not extract valid public ID from: ${publicId}`);
      return false;
    }

    logger.info(`Attempting to delete from Cloudinary: ${id}`);
    const result = await cloudinary.uploader.destroy(id, { invalidate: true });

    if (result.result === 'ok') {
      logger.info(`Successfully deleted from Cloudinary: ${id}`);
      return true;
    } else {
      logger.warn(`Cloudinary reported non-success for deletion: ${result.result}`);
      return false;
    }
  } catch (error) {
    logger.error('Cloudinary deletion failed:', {
      publicId,
      message: error.message,
      stack: error.stack
    });
    return false; // Don't throw, just return false to allow graceful fallback
  }
};