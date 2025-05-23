import sharp from 'sharp';
import { AppError } from '../logging/error.js';
import logger from '../logging/logger.js';

const TRANSFORM_PRESETS = {
  product: {
    width: 1200,
    height: 800,
    fit: 'cover',
    format: 'webp',
    quality: 80
  },
  thumbnail: {
    width: 400,
    height: 300,
    fit: 'cover',
    format: 'webp',
    quality: 75
  },
  profile: {
    width: 400,
    height: 400,
    fit: 'cover',
    format: 'webp',
    quality: 85
  },
  banner: {
    width: 1920,
    height: 480,
    fit: 'cover',
    format: 'webp',
    quality: 80
  },
  gallery: {
    width: 1920,
    height: 1080,
    fit: 'inside',
    format: 'webp',
    quality: 85
  }
};

export const transformImage = async (buffer, preset = 'product', customOptions = {}) => {
  try {
    const options = { ...TRANSFORM_PRESETS[preset], ...customOptions };
    const { width, height, fit } = options;
    let { format, quality } = options;

    let transformer = sharp(buffer);
    
    // Get original metadata
    const metadata = await transformer.metadata();
    
    // Determine format - use original format if not specified
    format = format || metadata.format || 'webp';
    
    // Validate format
    const validFormats = ['webp', 'jpeg', 'jpg', 'png', 'avif'];
    if (!validFormats.includes(format.toLowerCase())) {
      format = 'webp'; // Default to webp if invalid format
      logger.warn(`Invalid format specified, defaulting to webp`);
    }

    // Resize image
    transformer = transformer.resize(width, height, {
      fit,
      withoutEnlargement: true,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    });

    // Convert format and set quality
    switch (format.toLowerCase()) {
      case 'webp':
        transformer = transformer.webp({ quality: quality || 80, effort: 6 });
        break;
      case 'jpeg':
      case 'jpg':
        transformer = transformer.jpeg({ quality: quality || 80, progressive: true });
        break;
      case 'png':
        transformer = transformer.png({ quality: quality || 80, progressive: true });
        break;
      case 'avif':
        transformer = transformer.avif({ quality: quality || 80 });
        break;
      default:
        // This shouldn't happen due to earlier validation
        transformer = transformer.webp({ quality: 80, effort: 6 });
    }

    const optimizedBuffer = await transformer.toBuffer();

    // Log optimization results
    const reduction = ((buffer.length - optimizedBuffer.length) / buffer.length * 100).toFixed(1);
    logger.info(`Image optimized: ${buffer.length} → ${optimizedBuffer.length} bytes (${reduction}% reduction)`);

    return {
      buffer: optimizedBuffer,
      format,
      width: metadata.width,
      height: metadata.height,
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length
    };
  } catch (error) {
    logger.error('Image transformation error:', error);
    throw new AppError(`Image transformation failed: ${error.message}`, 500);
  }
};

export const generateThumbnail = async (buffer) => {
  return transformImage(buffer, 'thumbnail');
};

export const processProfileImage = async (buffer) => {
  return transformImage(buffer, 'profile');
};

export const processBannerImage = async (buffer) => {
  return transformImage(buffer, 'banner');
};

export const processGalleryImage = async (buffer) => {
  return transformImage(buffer, 'gallery');
};

export default {
  transformImage,
  generateThumbnail,
  processProfileImage,
  processBannerImage,
  processGalleryImage
};