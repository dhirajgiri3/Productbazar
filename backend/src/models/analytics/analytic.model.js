import mongoose from 'mongoose';
import logger from '../../utils/logging/logger.js';

const analyticSchema = new mongoose.Schema({
  // Base tracking info
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'view', 'upvote', 'bookmark', 'comment',
      'recommendation_impression', 'recommendation_click',
      'recommendation_trending', 'recommendation_new',
      'recommendation_similar', 'recommendation_category',
      'recommendation_tags', 'recommendation_maker',
      'recommendation_personalized', 'recommendation_history',
      'recommendation_collaborative', 'recommendation_preferences',
      'recommendation_interaction', 'recommendation_dismiss',
      'recommendation_feed', 'recommendation_feed_generation',
      'recommendation_diversified_feed', 'search', 'signup', 
      'product_submission', 'interaction'
    ],
    index: true
  },

  // User info
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: String,
  device: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet']
    },
    browser: String,
    os: String
  },

  // Content info
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [String],

  // Recommendation tracking
  recommendationType: {
    type: String,
    enum: [
      'personalized', 'category', 'tag', 
      'trending', 'new', 'similar', 'maker', 'mixed',
      'content', 'collaborative', 'history' // Added missing types
    ]
  },
  recommendationPosition: Number,
  recommendationScore: Number,

  // Search analytics
  searchQuery: String,
  searchFilters: mongoose.Schema.Types.Mixed,
  searchResultsCount: Number,

  // Interaction details
  interactionDetails: {
    viewDuration: Number, // in seconds
    scrollDepth: Number, // percentage
    commentLength: Number,
    exitPage: String,
    referrer: String
  },

  // Performance metrics
  performanceMetrics: {
    loadTime: Number,
    firstInteractionTime: Number,
    timeToFirstByte: Number
  }
}, { 
  timestamps: true 
});

// Indexes for faster querying
analyticSchema.index({ timestamp: -1, type: 1 });
analyticSchema.index({ type: 1, 'device.type': 1 });
analyticSchema.index({ product: 1, type: 1, timestamp: -1 });
analyticSchema.index({ user: 1, type: 1, timestamp: -1 });
analyticSchema.index({ category: 1, timestamp: -1 });
analyticSchema.index({ recommendationType: 1, timestamp: -1 });
analyticSchema.index({ searchQuery: 1, timestamp: -1 });

// Method to log a view event
analyticSchema.statics.logView = async function(data) {
  try {
    return await this.create({
      type: 'view',
      ...data,
    });
  } catch (error) {
    logger.error('Error logging view:', error);
    throw error;
  }
};

// Method to log recommendation impressions
analyticSchema.statics.logRecommendationImpression = async function(userId, recommendationType, count) {
  try {
    return await this.create({
      type: 'recommendation_impression',
      user: userId,
      recommendationType,
      interactionDetails: { count }
    });
  } catch (error) {
    logger.error('Error logging recommendation impression:', error);
    throw error;
  }
};

// Method to get product performance metrics
analyticSchema.statics.getProductPerformance = async function(productId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          timestamp: { $gte: startDate },
          type: { $in: ['view', 'upvote', 'bookmark', 'comment'] }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
          avgDuration: {
            $avg: {
              $cond: [
                { $eq: ['$type', 'view'] },
                '$interactionDetails.viewDuration',
                null
              ]
            }
          }
        }
      }
    ]);

    return metrics;
  } catch (error) {
    logger.error('Error getting product performance:', error);
    throw error;
  }
};

// Method to get recommendation effectiveness
analyticSchema.statics.getRecommendationAnalytics = async function(days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          type: { $in: ['recommendation_impression', 'recommendation_click'] }
        }
      },
      {
        $group: {
          _id: {
            type: '$recommendationType',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          impressions: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'recommendation_impression'] },
                1,
                0
              ]
            }
          },
          clicks: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'recommendation_click'] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          type: '$_id.type',
          date: '$_id.date',
          impressions: 1,
          clicks: 1,
          ctr: {
            $cond: [
              { $eq: ['$impressions', 0] },
              0,
              { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] }
            ]
          }
        }
      },
      { $sort: { date: 1, type: 1 } }
    ]);
  } catch (error) {
    logger.error('Error getting recommendation analytics:', error);
    throw error;
  }
};

// Method to get search analytics
analyticSchema.statics.getSearchAnalytics = async function(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.aggregate([
      {
        $match: {
          type: 'search',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$searchQuery',
          count: { $sum: 1 },
          avgResults: { $avg: '$searchResultsCount' },
          noResults: {
            $sum: {
              $cond: [{ $eq: ['$searchResultsCount', 0] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          query: '$_id',
          count: 1,
          avgResults: 1,
          noResults: 1,
          failureRate: {
            $multiply: [
              { $divide: ['$noResults', '$count'] },
              100
            ]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
  } catch (error) {
    logger.error('Error getting search analytics:', error);
    throw error;
  }
};

// Method to get user engagement metrics
analyticSchema.statics.getUserEngagement = async function(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 },
          avgDuration: {
            $avg: '$interactionDetails.viewDuration'
          }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          dailyAvg: { $avg: '$count' },
          totalCount: { $sum: '$count' },
          avgDuration: { $avg: '$avgDuration' }
        }
      }
    ]);
  } catch (error) {
    logger.error('Error getting user engagement:', error);
    throw error;
  }
};

const Analytic = mongoose.model('Analytic', analyticSchema);
export default Analytic;