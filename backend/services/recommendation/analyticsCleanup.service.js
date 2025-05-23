// AnalyticsCleanupService.js
import mongoose from 'mongoose';
import RecommendationInteraction from "../../models/recommendation/recommendationInteraction.model.js";
import logger from "../../utils/logging/logger.js";
import {
  normalizeEngagementQuality,
  standardizeStrategyName,
  inferImpressionForEvent
} from "../../utils/common/statsHelpers.js";

class AnalyticsCleanupService {
  /**
   * Run a comprehensive cleanup of analytics data
   * @returns {Promise<Object>} Results of the cleanup operation
   */
  static async runComprehensiveCleanup() {
    try {
      logger.info('Starting comprehensive analytics cleanup');
      const startTime = Date.now();
      
      const results = await Promise.allSettled([
        this.removeInvalidInteractions(),
        this.deduplicateInteractions(),
        this.cleanupOrphanedReferences()
      ]);
      
      const summary = {
        duration: Date.now() - startTime,
        removedInvalid: results[0].status === 'fulfilled' ? results[0].value : 0,
        deduplicatedRecords: results[1].status === 'fulfilled' ? results[1].value : 0,
        removedOrphanedReferences: results[2].status === 'fulfilled' ? results[2].value : 0
      };
      
      logger.info('Completed comprehensive analytics cleanup', summary);
      return summary;
    } catch (error) {
      logger.error('Error during comprehensive analytics cleanup:', error);
      return {
        error: error.message,
        duration: 0,
        removedInvalid: 0,
        deduplicatedRecords: 0,
        removedOrphanedReferences: 0
      };
    }
  }
  
  /**
   * Remove invalid interaction records
   * @returns {Promise<number>} Number of removed records
   */
  static async removeInvalidInteractions() {
    try {
      const deleteResult = await RecommendationInteraction.deleteMany({
        $or: [
          { user: { $exists: false } },
          { user: null },
          { product: { $exists: false } },
          { product: null },
          { recommendationType: { $exists: false } },
          { interactionType: { $exists: false } }
        ]
      });
      
      logger.info(`Removed ${deleteResult.deletedCount} invalid interaction records`);
      return deleteResult.deletedCount;
    } catch (error) {
      logger.error('Error removing invalid interactions:', error);
      return 0;
    }
  }
  
  /**
   * Find and remove duplicate interaction records
   * @returns {Promise<number>} Number of deduplicated records
   */
  static async deduplicateInteractions() {
    try {
      // Find duplicates using aggregation
      const duplicates = await RecommendationInteraction.aggregate([
        {
          $group: {
            _id: {
              user: '$user',
              product: '$product',
              interactionType: '$interactionType',
              timestamp: {
                $dateToString: {
                  format: '%Y-%m-%d %H:%M', // Group by minute
                  date: '$timestamp'
                }
              }
            },
            ids: { $push: '$_id' },
            count: { $sum: 1 }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ]);
      
      let removedCount = 0;
      
      // For each group of duplicates, keep the first one and delete the rest
      for (const group of duplicates) {
        // Skip the first ID (keep it)
        const idsToRemove = group.ids.slice(1);
        
        if (idsToRemove.length > 0) {
          const deleteResult = await RecommendationInteraction.deleteMany({
            _id: { $in: idsToRemove }
          });
          
          removedCount += deleteResult.deletedCount;
        }
      }
      
      logger.info(`Removed ${removedCount} duplicate interaction records`);
      return removedCount;
    } catch (error) {
      logger.error('Error deduplicating interactions:', error);
      return 0;
    }
  }
  
  /**
   * Clean up interactions with references to deleted products or users
   * @returns {Promise<number>} Number of removed references
   */
  static async cleanupOrphanedReferences() {
    try {
      // Find interactions with references to non-existent products or users
      const Product = mongoose.model('Product');
      const User = mongoose.model('User');
      
      // Get distinct product and user IDs used in interactions
      const productIds = await RecommendationInteraction.distinct('product');
      const userIds = await RecommendationInteraction.distinct('user');
      
      // Find which products and users actually exist
      const existingProducts = await Product.find({ _id: { $in: productIds } }).distinct('_id');
      const existingUsers = await User.find({ _id: { $in: userIds } }).distinct('_id');
      
      // Convert ObjectIDs to strings for comparison
      const existingProductIdSet = new Set(existingProducts.map(id => id.toString()));
      const existingUserIdSet = new Set(existingUsers.map(id => id.toString()));
      
      // Find orphaned product and user IDs
      const orphanedProductIds = productIds
        .filter(id => !existingProductIdSet.has(id.toString()));
        
      const orphanedUserIds = userIds
        .filter(id => !existingUserIdSet.has(id.toString()));
      
      // Delete interactions with orphaned references
      const deleteProductResult = orphanedProductIds.length > 0 ?
        await RecommendationInteraction.deleteMany({ product: { $in: orphanedProductIds } }) :
        { deletedCount: 0 };
        
      const deleteUserResult = orphanedUserIds.length > 0 ?
        await RecommendationInteraction.deleteMany({ user: { $in: orphanedUserIds } }) :
        { deletedCount: 0 };
      
      const totalDeleted = deleteProductResult.deletedCount + deleteUserResult.deletedCount;
      logger.info(`Removed ${totalDeleted} interactions with orphaned references`);
      return totalDeleted;
    } catch (error) {
      logger.error('Error cleaning up orphaned references:', error);
      return 0;
    }
  }
  
  /**
   * Normalize engagement scores across all interactions
   */
  static async normalizeEngagementScores() {
    try {
      const stats = { processed: 0, updated: 0, failed: 0 };
      const interactions = await RecommendationInteraction.find({});

      await Promise.all(
        interactions.map(async (interaction) => {
          stats.processed++;
          
          try {
            const newScore = normalizeEngagementQuality(
              interaction.interactionType,
              interaction.metadata?.engagementQuality
            );
            
            if (!interaction.metadata?.engagementQuality ||
                Math.abs(newScore - interaction.metadata.engagementQuality) > 0.1) {
              interaction.metadata = interaction.metadata || {};
              interaction.metadata.engagementQuality = newScore;
              await interaction.save();
              stats.updated++;
            }
          } catch(err) {
            logger.warn(`Failed to normalize score for interaction ${interaction._id}`, err);
            stats.failed++;
          }
        })
      );

      logger.info("Engagement score normalization complete:", stats);
      return stats;
    } catch (error) {
      logger.error("Error normalizing scores:", error);
      return { processed: 0, updated: 0, failed: 0 };
    }
  }

  /**
   * Create a changelog entry for cleanup operations
   * @param {Object} cleanupResults Results from the cleanup operation
   * @returns {Promise<Object>} Changelog entry
   */
  static async createChangelogEntry(cleanupResults) {
    try {
      const changelog = {
        timestamp: new Date(),
        operation: 'cleanup',
        duration: cleanupResults.duration || 0,
        summary: {
          totalRecordsRemoved: 
            (cleanupResults.removedInvalid || 0) + 
            (cleanupResults.deduplicatedRecords || 0) + 
            (cleanupResults.removedOrphanedReferences || 0),
          invalidRemoved: cleanupResults.removedInvalid || 0,
          duplicatesRemoved: cleanupResults.deduplicatedRecords || 0,
          orphanedReferencesRemoved: cleanupResults.removedOrphanedReferences || 0
        }
      };
      
      logger.info('Created cleanup changelog entry', changelog);
      return changelog;
    } catch (error) {
      logger.error('Error creating changelog entry:', error);
      return {
        timestamp: new Date(),
        operation: 'cleanup',
        error: error.message,
        summary: {
          totalRecordsRemoved: 0,
          invalidRemoved: 0,
          duplicatesRemoved: 0,
          orphanedReferencesRemoved: 0
        }
      };
    }
  }
}

export default AnalyticsCleanupService;
