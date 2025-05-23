import mongoose from "mongoose";
import Recommendation from "../../models/recommendation/recommendation.model.js";
import Product from "../../models/product/product.model.js";
import recommendationCacheService from "./recommendationCache.service.js";
import logger from '../../utils/logging/logger.js';

/**
 * Service handling user context, preferences, and interaction updates.
 */
class UserContextService {

  static async buildUserContext(userId, options = {}) {
    try {
      if (!userId) {
        return {
          preferences: {},
          history: {
            viewedProducts: [],
            upvotedProducts: []
          },
          categories: {}
        };
      }

      const userContext = await this.getUserPreferences(userId);
      const userHistory = await this.getUserHistory(userId); // Use local method instead

      return {
        preferences: userContext.preferences || {},
        history: {
          viewedProducts: userHistory.viewedProducts || [],
          upvotedProducts: userHistory.upvotedProducts || []
        },
        categories: userContext.categories || {}
      };
    } catch (error) {
      logger.error('Error building user context:', error);
      // Return safe defaults
      return {
        preferences: {},
        history: {
          viewedProducts: [],
          upvotedProducts: []
        },
        categories: {}
      };
    }
  }

  static async getUserHistory(userId) {
    try {
      logger.debug(`Fetching enhanced user history for ${userId}`);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get view history with product details
      const viewHistory = await mongoose.model("View").aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: thirtyDaysAgo },
            isBot: false
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productData'
          }
        },
        {
          $unwind: '$productData'
        },
        {
          $group: {
            _id: '$product',
            lastViewed: { $first: '$createdAt' },
            viewCount: { $sum: 1 },
            productData: { $first: '$productData' },
            viewTimestamps: { $push: '$createdAt' }
          }
        },
        {
          $sort: { lastViewed: -1 }
        }
      ]);

      // Get categories with view counts
      const categoryStats = await mongoose.model("View").aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $group: {
            _id: '$product.category',
            count: { $sum: 1 },
            lastViewed: { $max: '$createdAt' }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryData'
          }
        },
        {
          $unwind: '$categoryData'
        },
        {
          $sort: { count: -1, lastViewed: -1 }
        }
      ]);

      // Get tags with frequencies
      const tagCounts = await mongoose.model("View").aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $unwind: '$product.tags'
        },
        {
          $group: {
            _id: '$product.tags',
            count: { $sum: 1 },
            lastViewed: { $max: '$createdAt' }
          }
        },
        {
          $sort: { count: -1, lastViewed: -1 }
        }
      ]);

      // Get hourly view patterns
      const viewPatterns = await mongoose.model("View").aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              hour: { $hour: '$createdAt' },
              dayOfWeek: { $dayOfWeek: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 }
        }
      ]);

      // Transform view patterns into a more useful format
      const formattedViewPatterns = viewPatterns.reduce((acc, pattern) => {
        const dayKey = `day${pattern._id.dayOfWeek}`;
        const hourKey = `hour${pattern._id.hour}`;
        if (!acc[dayKey]) acc[dayKey] = {};
        acc[dayKey][hourKey] = pattern.count;
        return acc;
      }, {});

      // Format the history data
      const historyData = {
        viewedProducts: viewHistory.map(view => ({
          productId: view._id,
          name: view.productData.name,
          category: view.productData.category,
          tags: view.productData.tags,
          lastViewed: view.lastViewed,
          viewCount: view.viewCount
        })),
        viewPatterns: formattedViewPatterns,
        categories: categoryStats.map(cat => ({
          id: cat._id,
          name: cat.categoryData.name,
          count: cat.count,
          lastViewed: cat.lastViewed
        })),
        tags: tagCounts.map(tag => ({
          tag: tag._id,
          count: tag.count,
          lastViewed: tag.lastViewed
        })),
        stats: {
          totalViews: viewHistory.reduce((sum, v) => sum + v.viewCount, 0),
          uniqueProducts: viewHistory.length,
          uniqueCategories: categoryStats.length,
          uniqueTags: tagCounts.length
        },
        lastUpdated: new Date()
      };

      return historyData;
    } catch (error) {
      logger.error("Error fetching user history:", {
        userId,
        error: error.message,
        stack: error.stack
      });
      return {
        viewedProducts: [],
        viewPatterns: {},
        categories: [],
        tags: [],
        stats: {
          totalViews: 0,
          uniqueProducts: 0,
          uniqueCategories: 0,
          uniqueTags: 0
        },
        lastUpdated: new Date()
      };
    }
  }

  static async getUserPreferences(userId) {
    try {
      const [recommendationPrefs, userInterests] = await Promise.all([
        Recommendation.findOne({ user: userId })
          .select('categories tags dismissedProducts')
          .lean(),
        mongoose.model('User').findById(userId)
          .select('interests')
          .lean()
      ]);

      // Merge recommendation preferences with user interests
      const preferences = {
        scores: {
          categories: (recommendationPrefs?.categories || []).reduce(
            (acc, { category, score }) => ({ ...acc, [category]: score }),
            {}
          ),
          tags: (recommendationPrefs?.tags || []).reduce(
            (acc, { tag, score }) => ({ ...acc, [tag.toLowerCase()]: score }),
            {}
          ),
        },
        // Convert user interests to weighted preferences
        interests: (userInterests?.interests || []).reduce((acc, interest) => ({
          ...acc,
          [interest.name.toLowerCase()]: interest.strength / 10 // Normalize to 0-1
        }), {}),
        dismissedProducts: recommendationPrefs?.dismissedProducts || []
      };

      return preferences;
    } catch (error) {
      logger.error(`Error getting user preferences for ${userId}:`, error);
      return {
        scores: { categories: {}, tags: {} },
        interests: {},
        dismissedProducts: []
      };
    }
  }

  /**
   * Update recommendation profile based on user interest changes
   */
  static async updateFromInterests(userId, interests) {
    try {
      const Recommendation = mongoose.model('Recommendation');
      let rec = await Recommendation.findOne({ user: userId });
      if (!rec) {
        rec = new Recommendation({ user: userId });
      }

      // Separate interests into potential categories and regular tag interests
      const categoryInterests = [];
      const tagInterests = [];

      // Process each interest to determine if it's a category ID or regular tag
      interests.forEach(i => {
        if (mongoose.Types.ObjectId.isValid(i.name)) {
          // Potential category ID
          categoryInterests.push({
            category: new mongoose.Types.ObjectId(i.name),
            score: (i.strength / 10), // Normalize to 0-1 scale
            lastInteraction: new Date(),
            interactionCount: 1
          });
        } else {
          // Regular tag interest
          tagInterests.push({
            tag: i.name.toLowerCase(),
            score: (i.strength / 10), // Normalize to 0-1 scale
            lastInteraction: new Date(),
            interactionCount: 1
          });
        }
      });

      // Update or add new category scores
      categoryInterests.forEach(newCategory => {
        const existingIdx = rec.categories.findIndex(c =>
          c.category && c.category.toString() === newCategory.category.toString()
        );

        if (existingIdx >= 0) {
          // Update existing category
          rec.categories[existingIdx].score = Math.max(rec.categories[existingIdx].score, newCategory.score);
          rec.categories[existingIdx].lastInteraction = new Date();
        } else {
          // Add new category
          rec.categories.push(newCategory);
        }
      });

      // Update or add new tag scores while preserving existing interaction data
      tagInterests.forEach(newTag => {
        const existingIdx = rec.tags.findIndex(t => t.tag === newTag.tag);
        if (existingIdx >= 0) {
          rec.tags[existingIdx].score = Math.max(rec.tags[existingIdx].score, newTag.score);
          rec.tags[existingIdx].lastInteraction = new Date();
        } else {
          rec.tags.push(newTag);
        }
      });

      await rec.save();
      await recommendationCacheService.invalidateUserCache(userId, { invalidateAll: true });

      logger.debug('Updated recommendation profile from interests', {
        userId,
        categoryCount: categoryInterests.length,
        tagCount: tagInterests.length
      });

      return true;
    } catch (error) {
      logger.error('Error updating recommendation profile from interests:', error);
      return false;
    }
  }

  /**
   * Update user's recommendation profile after an interaction with a product
   * @param {string} userId - The user ID
   * @param {string} productId - The product ID
   * @param {string} interactionType - The type of interaction (view, upvote, bookmark, etc)
   * @param {Object} metadata - Additional metadata about the interaction
   */
  static async updateAfterInteraction(userId, productId, interactionType, metadata = {}) {
    try {
      logger.debug(`Processing ${interactionType} interaction`, { userId, productId });

      // Get interaction weights based on type
      const weights = {
        view: 0.2,
        click: 0.3,
        upvote: 0.8,
        bookmark: 0.7,
        comment: 0.5,
        share: 0.6,
        dismiss: -0.5,
        remove_upvote: -0.8, // Negative of upvote weight
        remove_bookmark: -0.7 // Negative of bookmark weight
      };

      // Default to moderate weight if type not defined
      const weight = weights[interactionType] || 0.3;
      const now = new Date();

      // Fetch the product to get its category and tags
      const product = await Product.findById(productId).select('category tags').lean();
      if (!product) {
        logger.warn('Product not found for interaction', { productId });
        return false;
      }

      // Find or create user's recommendation document
      let rec = await Recommendation.findOne({ user: userId });
      if (!rec) {
        rec = new Recommendation({ user: userId });
      }

      // Update category scores
      if (product.category) {
        const categoryId = product.category.toString();
        const catIndex = rec.categories.findIndex(c =>
          c.category && c.category.toString() === categoryId
        );

        if (catIndex >= 0) {
          // Update existing category
          rec.categories[catIndex].score += weight;
          rec.categories[catIndex].interactionCount += 1;
          rec.categories[catIndex].lastInteraction = now;
        } else {
          // Add new category
          rec.categories.push({
            category: product.category,
            score: Math.max(0.1, weight), // Ensure positive base score
            interactionCount: 1,
            lastInteraction: now
          });
        }
      }

      // Update tag scores
      if (product.tags && Array.isArray(product.tags)) {
        for (const tag of product.tags) {
          const tagName = tag.toLowerCase();
          const tagIndex = rec.tags.findIndex(t =>
            t.tag && t.tag.toLowerCase() === tagName
          );

          if (tagIndex >= 0) {
            // Update existing tag
            rec.tags[tagIndex].score += weight;
            rec.tags[tagIndex].interactionCount += 1;
            rec.tags[tagIndex].lastInteraction = now;
          } else {
            // Add new tag
            rec.tags.push({
              tag: tagName,
              score: Math.max(0.1, weight), // Ensure positive base score
              interactionCount: 1,
              lastInteraction: now
            });
          }
        }
      }

      // Add to recent interactions
      rec.recentInteractions.unshift({
        product: productId,
        type: interactionType,
        timestamp: now,
        metadata
      });

      // Keep only the most recent 100 interactions
      if (rec.recentInteractions.length > 100) {
        rec.recentInteractions = rec.recentInteractions.slice(0, 100);
      }

      // Update interaction counts
      if (!rec.interactionCounts) {
        rec.interactionCounts = {
          views: 0, upvotes: 0, bookmarks: 0, comments: 0, shares: 0
        };
      }

      // Update the appropriate counter
      if (interactionType === 'view') rec.interactionCounts.views += 1;
      else if (interactionType === 'upvote') rec.interactionCounts.upvotes += 1;
      else if (interactionType === 'bookmark') rec.interactionCounts.bookmarks += 1;
      else if (interactionType === 'comment') rec.interactionCounts.comments += 1;
      else if (interactionType === 'share') rec.interactionCounts.shares += 1;
      else if (interactionType === 'remove_upvote' && rec.interactionCounts.upvotes > 0) rec.interactionCounts.upvotes -= 1;
      else if (interactionType === 'remove_bookmark' && rec.interactionCounts.bookmarks > 0) rec.interactionCounts.bookmarks -= 1;

      rec.lastUpdated = now;

      // Use findOneAndUpdate instead of save to avoid version conflicts
      await mongoose.model('Recommendation').findOneAndUpdate(
        { user: userId },
        {
          $set: {
            categories: rec.categories,
            tags: rec.tags,
            lastUpdated: now,
            interactionCounts: rec.interactionCounts
          },
          $push: {
            recentInteractions: {
              $each: [{
                product: productId,
                type: interactionType,
                timestamp: now,
                metadata
              }],
              $position: 0,
              $slice: 100 // Keep only the most recent 100 interactions
            }
          }
        },
        { new: true, upsert: true }
      );

      // Invalidate caches
      await recommendationCacheService.invalidateUserCache(userId, { invalidateAll: true });

      // Trigger cache invalidation for affected recommendation types
      await recommendationCacheService.smartInvalidateCache(interactionType, {
        userId,
        productId,
        ...metadata
      });

      return true;
    } catch (error) {
      logger.error("Error updating after interaction:", error);
      return false;
    }
  }
}

export default UserContextService; // Export class instead of instance