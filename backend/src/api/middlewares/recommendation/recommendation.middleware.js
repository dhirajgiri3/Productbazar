// server/middleware/recommendation.middleware.js
import logger from "../../../utils/logging/logger.js";
import mongoose from 'mongoose';

/**
 * Validates and sanitizes query parameters for recommendation requests
 */
export const validateQueryParams = (req, res, next) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);

  req.query.limit = limit;
  req.query.offset = offset;

  // Validate additional parameters for hybrid
  if (req.path === '/hybrid' || req.path === '/feed') {
    // Validate blend parameter
    const validBlends = ['standard', 'trending', 'discovery', 'personalized'];
    if (req.query.blend && !validBlends.includes(req.query.blend)) {
      req.query.blend = 'standard';
    }

    // Validate category parameter
    if (req.query.category && !mongoose.Types.ObjectId.isValid(req.query.category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    // Validate sortBy parameter
    const validSortOptions = ['score', 'created', 'upvotes', 'trending'];
    if (req.query.sortBy && !validSortOptions.includes(req.query.sortBy)) {
      req.query.sortBy = 'score';
    }

    // Process tags parameter
    if (req.query.tags) {
      req.query.parsedTags = req.query.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
    }
  }

  next();
};

/**
 * Enriches request with strategy-specific context and parameters
 */
export const recommendationMiddleware = (strategy) => {
  return (req, res, next) => {
    // Track request
    logger.info(`Recommendation Request: ${strategy}`, {
      strategy,
      user: req.user?._id || 'anonymous',
      session: req.headers['x-session-id'],
      device: req.headers['x-device-type'],
      limit: req.query.limit,
      offset: req.query.offset,
      blend: req.query.blend,
      category: req.query.category,
      tags: req.query.parsedTags,
      sortBy: req.query.sortBy
    });

    // Create a validator function to verify if products in recommendations still exist
    // This helps prevent stale cache issues with deleted products
    req.validateRecommendations = async (recommendations) => {
      if (!recommendations || !Array.isArray(recommendations)) return [];

      const Product = require('../../../models/product/product.model.js').default;

      // Get all product IDs from recommendations
      const productIds = recommendations
        .filter(r => r && r.product && r._id)
        .map(r => r.product._id || r.product);

      if (!productIds.length) return recommendations;

      // Check which products actually exist
      const existingProducts = await Product.find(
        { _id: { $in: productIds }, status: 'Published' },
        { _id: 1 }
      );

      const existingIds = new Set(existingProducts.map(p => p._id.toString()));

      // Filter out recommendations for products that don't exist
      return recommendations.filter(r => {
        const id = (r.product._id || r.product).toString();
        return existingIds.has(id);
      });
    };

    // Add a function to the response to set cache control headers
    res.setRecommendationCacheHeaders = (maxAge = 300) => {
      res.set({
        'Cache-Control': `public, max-age=${maxAge}`,
        'X-Recommendation-Strategy': strategy,
        'X-Recommendation-Time': new Date().toISOString()
      });
    };

    next();
  };
};

/**
 * Sanitizes recommendation responses for security and consistency
 */
export const sanitizeRecommendationResponse = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Only process JSON responses
    if (res.getHeader('content-type')?.includes('application/json')) {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;

        // If it contains recommendation data that needs sanitizing
        if (parsed.data && Array.isArray(parsed.data)) {
          parsed.data = parsed.data.map(item => {
            // Strip any sensitive data that might have leaked in
            if (item.productData?.maker) {
              // Remove sensitive maker data
              delete item.productData.maker.email;
              delete item.productData.maker.password;
              delete item.productData.maker.isVerified;
            }

            return item;
          });

          data = JSON.stringify(parsed);
        }
      } catch (e) {
        // If parsing fails, continue with original data
        logger.warn('Error sanitizing recommendation response', e);
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Handles errors in recommendation routes
 */
export const handleRecommendationError = (err, req, res, next) => {
  const errorId = `err_${Math.random().toString(36).substr(2, 9)}`;

  logger.error('Recommendation error:', {
    errorId,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    query: req.query,
    userId: req.user?._id
  });

  res.status(500).json({
    success: false,
    error: {
      message: 'Error fetching recommendations',
      details: err.message,
      errorId
    },
    meta: {
      strategy: req.query.strategy || 'unknown',
      params: {
        limit: parseInt(req.query.limit) || 10,
        offset: parseInt(req.query.offset) || 0
      }
    }
  });
};

/**
 * Applies multiple recommendation middleware functions
 */
export const applyRecommendationMiddleware = (...middlewares) => {
  return (req, res, next) => {
    // Execute middleware functions in sequence
    const executeMiddleware = (index) => {
      if (index >= middlewares.length) {
        return next();
      }

      try {
        middlewares[index](req, res, (err) => {
          if (err) {
            return next(err);
          }
          executeMiddleware(index + 1);
        });
      } catch (error) {
        next(error);
      }
    };

    executeMiddleware(0);
  };
};

/**
 * Validates interaction body for recommendation requests
 */
export const validateInteractionBody = (req, res, next) => {
  const { productId, type, metadata } = req.body;

  // Validate required fields
  if (!productId || !type) {
    return res.status(400).json({
      success: false,
      message: "Product ID and interaction type are required"
    });
  }

  // Validate productId format
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID format"
    });
  }

  // Validate interaction type
  const validTypes = [
    'view', 'click', 'upvote', 'bookmark',
    'comment', 'share', 'impression', 'dismiss',
    'remove_upvote', 'remove_bookmark'
  ];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid interaction type. Must be one of: ${validTypes.join(', ')}`
    });
  }

  // Validate metadata if provided
  if (metadata) {
    if (typeof metadata !== 'object') {
      return res.status(400).json({
        success: false,
        message: "Metadata must be an object"
      });
    }

    // Validate position if provided
    if (metadata.position !== undefined &&
        (!Number.isInteger(metadata.position) || metadata.position < 0)) {
      return res.status(400).json({
        success: false,
        message: "Position must be a non-negative integer"
      });
    }

    // Validate timestamp if provided
    if (metadata.timestamp && !isValidISODate(metadata.timestamp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timestamp format. Must be ISO date string"
      });
    }
  }

  next();
};

function isValidISODate(str) {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str);
  return d.toISOString() === str;
}

export default recommendationMiddleware;
