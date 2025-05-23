import mongoose from 'mongoose';
import logger from '../../utils/logging/logger.js';

const searchAnalyticsSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sessionId: String,
    resultsCount: {
      type: Number,
      default: 0
    },
    selectedResultIndex: Number,
    selectedProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    filters: {
      category: String,
      tags: [String],
      pricing_type: String,
      price_range: [Number],
      date_range: [Date]
    },
    natural_language: {
      type: Boolean,
      default: false
    },
    platform: {
      device: String,
      browser: String,
      os: String
    }
  },
  { 
    timestamps: true,
    // Use TTL index to automatically delete old search analytics
    expires: 90 * 24 * 60 * 60 // 90 days
  }
);

// Indexes for improved query performance
searchAnalyticsSchema.index({ query: 1 });
searchAnalyticsSchema.index({ createdAt: -1 });
searchAnalyticsSchema.index({ 'filters.category': 1 });
searchAnalyticsSchema.index({ 'filters.tags': 1 });
searchAnalyticsSchema.index({ resultsCount: 1 });

// Static methods for analytics

/**
 * Get top searched queries
 * @param {number} limit - Number of top queries to return
 * @param {number} days - Number of days to consider
 * @returns {Promise<Array>} - Top search queries
 */
searchAnalyticsSchema.statics.getTopQueries = async function(limit = 10, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await this.aggregate([
      { $match: { 
        createdAt: { $gte: startDate },
        query: { $ne: '' }
      }},
      { $group: {
        _id: { $toLower: '$query' },
        count: { $sum: 1 },
        avgResults: { $avg: '$resultsCount' },
        lastUsed: { $max: '$createdAt' }
      }},
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: {
        query: '$_id',
        count: 1,
        avgResults: 1,
        lastUsed: 1,
        _id: 0
      }}
    ]);
  } catch (error) {
    logger.error('Error getting top search queries:', error);
    throw error;
  }
};

/**
 * Get zero-result queries
 * @param {number} limit - Number of queries to return
 * @param {number} days - Number of days to consider
 * @returns {Promise<Array>} - Zero-result search queries
 */
searchAnalyticsSchema.statics.getZeroResultQueries = async function(limit = 10, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await this.aggregate([
      { $match: { 
        createdAt: { $gte: startDate },
        resultsCount: 0,
        query: { $ne: '' }
      }},
      { $group: {
        _id: { $toLower: '$query' },
        count: { $sum: 1 },
        lastUsed: { $max: '$createdAt' }
      }},
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: {
        query: '$_id',
        count: 1,
        lastUsed: 1,
        _id: 0
      }}
    ]);
  } catch (error) {
    logger.error('Error getting zero-result search queries:', error);
    throw error;
  }
};

const SearchAnalytics = mongoose.model('SearchAnalytics', searchAnalyticsSchema);

export default SearchAnalytics;
