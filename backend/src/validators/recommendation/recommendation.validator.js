import Joi from 'joi';
import mongoose from 'mongoose';

/**
 * Validation schemas for recommendation endpoints
 */
export const recommendationValidator = {
  /**
   * Validate get recommendations request
   */
  getRecommendations: {
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(50).default(20),
      offset: Joi.number().integer().min(0).default(0),
      diversityLevel: Joi.string().valid('low', 'medium', 'high').default('medium')
    })
  },

  /**
   * Validate get personalized recommendations request
   */
  getPersonalizedRecommendations: {
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(50).default(20),
      offset: Joi.number().integer().min(0).default(0)
    })
  },

  /**
   * Validate get trending recommendations request
   */
  getTrendingRecommendations: {
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(50).default(20),
      offset: Joi.number().integer().min(0).default(0),
      timeframe: Joi.number().integer().min(1).max(30).default(7)
    })
  },

  /**
   * Validate get similar products request
   */
  getSimilarProducts: {
    params: Joi.object({
      productId: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('Invalid product ID');
        }
        return value;
      }).required()
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(50).default(10)
    })
  },

  /**
   * Validate get category recommendations request
   */
  getCategoryRecommendations: {
    params: Joi.object({
      categoryId: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('Invalid category ID');
        }
        return value;
      }).required()
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(50).default(20),
      offset: Joi.number().integer().min(0).default(0)
    })
  },

  /**
   * Validate get tag recommendations request
   */
  getTagRecommendations: {
    params: Joi.object({
      tag: Joi.string().required().min(1).max(50)
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(50).default(20),
      offset: Joi.number().integer().min(0).default(0)
    })
  },

  /**
   * Validate get maker recommendations request
   */
  getMakerRecommendations: {
    params: Joi.object({
      makerId: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('Invalid maker ID');
        }
        return value;
      }).required()
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(50).default(20),
      offset: Joi.number().integer().min(0).default(0)
    })
  },

  /**
   * Validate track interaction request
   */
  trackInteraction: {
    body: Joi.object({
      productId: Joi.string().required()
        .custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error('Invalid product ID format');
          }
          return value;
        }),
      type: Joi.string().required().valid(
        'view', 'click', 'upvote', 'bookmark',
        'comment', 'share', 'impression', 'dismiss',
        'remove_upvote', 'remove_bookmark'
      ),
      metadata: Joi.object({
        source: Joi.string(),
        position: Joi.number().min(0),
        recommendationType: Joi.string(),
        timestamp: Joi.string().isoDate(),
        url: Joi.string().uri(),
        referrer: Joi.string(),
      }).default({})
    })
  },

  /**
   * Validate get recommendation insights request
   */
  getRecommendationInsights: {
    params: Joi.object({
      productId: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('Invalid product ID');
        }
        return value;
      }).required()
    }),
    query: Joi.object({
      timeframe: Joi.number().integer().min(1).max(90).default(30),
      includeHistory: Joi.boolean().default(false)
    })
  }
};

/**
 * Custom validation helpers
 */
export const validateObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('Invalid ObjectId');
  }
  return value;
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  objectId: Joi.string().custom(validateObjectId),
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(50).default(20),
    offset: Joi.number().integer().min(0).default(0)
  }),
  timeframe: Joi.object({
    timeframe: Joi.number().integer().min(1).max(90).default(30)
  })
};
