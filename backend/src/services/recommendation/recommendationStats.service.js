// RecommendationStatsService.js
import RecommendationInteraction from "../../models/recommendation/recommendationInteraction.model.js";
import logger from "../../utils/logging/logger.js";
import {
  calculateCTR,
  calculateEngagementRate,
} from "../../utils/common/statsHelpers.js";
import { cache, generateCacheKey } from "../../utils/cache/cache.js";
import AnalyticsCleanupService from "./analyticsCleanup.service.js";

class RecommendationStatsService {
  /**
   * Get comprehensive recommendation statistics
   * @param {Object} options - Options for statistics generation
   * @returns {Promise<Object>} Comprehensive statistics
   */
  static async getComprehensiveStats({
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    groupBy = "day",
    strategy,
    userSegment = {},
    includeSummary = true,
    includeDetails = true,
    includeEngagement = true,
    includePerformance = true,
    forceRefresh = false,
  } = {}) {
    try {
      // Generate cache key based on parameters
      const cacheKey = generateCacheKey(
        "stats",
        JSON.stringify({ startDate, groupBy, strategy, userSegment })
      );

      // Check cache if not forcing refresh
      if (!forceRefresh) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          logger.info(`Redis cache hit for ${cacheKey}`);
          return cached;
        }
      }

      logger.debug("Generating recommendation stats", {
        startDate,
        groupBy,
        strategy,
      });

      // Build match condition for MongoDB queries
      const matchCondition = { timestamp: { $gte: startDate }, ...userSegment };
      if (strategy) matchCondition.recommendationType = strategy;

      // Run queries in parallel for better performance
      const [
        summary,
        timeSeriesData,
        strategyPerformance,
        engagementMetrics,
        categoryBreakdown,
        tagAnalysis,
      ] = await Promise.all([
        includeSummary ? this.getSummaryMetrics(matchCondition) : {},
        this.getTimeSeriesData(matchCondition, groupBy),
        includePerformance ? this.getStrategyPerformance(matchCondition) : [],
        includeEngagement ? this.getEngagementMetrics(matchCondition) : {},
        includeDetails ? this.getCategoryBreakdown(matchCondition) : [],
        includeDetails ? this.getTagAnalysis(matchCondition) : [],
      ]);

      // Combine all the data
      const stats = {
        summary,
        timeSeriesData,
        strategyPerformance,
        engagementMetrics,
        categoryBreakdown,
        tagAnalysis,
      };

      // Cache the results for 1 hour
      await cache.set(cacheKey, stats, 3600);
      logger.info(`Cached stats at ${cacheKey}`);
      return stats;
    } catch (error) {
      logger.error("Error generating stats:", error);
      throw error;
    }
  }

  /**
   * Generate insights based on recommendation statistics
   * @param {Object} options - Options for insight generation
   * @returns {Promise<Object>} Insights
   */
  static async generateInsights(options = {}) {
    try {
      // Get stats and run cleanup in parallel
      const [stats, cleanupResults] = await Promise.all([
        this.getComprehensiveStats({
          ...options,
          includeSummary: true,
          includeDetails: options.includeDetails !== false,
        }),
        AnalyticsCleanupService.runComprehensiveCleanup(),
      ]);

      // Create changelog entry for cleanup
      const changelog = await AnalyticsCleanupService.createChangelogEntry(
        cleanupResults
      );

      // Derive insights from stats
      const insights = {
        topPerforming: {
          strategy: this.findTopPerformingStrategy(stats),
          category: this.findTopPerformingCategory(stats),
          timeOfDay: this.findBestTimeOfDay(stats),
        },
        improvements: this.generateImprovementSuggestions(stats),
        trends: this.identifyTrends(stats),
        anomalies: this.detectAnomalies(stats),
        cleanupImpact: changelog.summary,
        effectiveness: stats.summary.effectiveness,
        relevance: stats.summary.relevance,
      };

      // Cache insights
      const insightsCacheKey = generateCacheKey(
        "insights",
        JSON.stringify(options)
      );
      await cache.set(insightsCacheKey, insights, 3600);
      return insights;
    } catch (error) {
      logger.error("Error generating insights:", error);
      return {
        topPerforming: {},
        improvements: [],
        trends: [],
        anomalies: [],
        cleanupImpact: {},
        effectiveness: {},
        relevance: {},
      };
    }
  }

  /**
   * Get summary metrics for recommendations
   * @param {Object} matchCondition - MongoDB match condition
   * @returns {Promise<Object>} Summary metrics
   */
  static async getSummaryMetrics(matchCondition) {
    try {
      // Get counts for different interaction types
      const [counts, uniqueUsers] = await Promise.all([
        RecommendationInteraction.aggregate([
          { $match: matchCondition },
          { $group: { _id: "$interactionType", count: { $sum: 1 } } },
        ]),
        RecommendationInteraction.distinct("user", matchCondition),
      ]);

      // Get performance metrics
      const [cacheStats, effectiveness, relevance] = await Promise.all([
        this.getCacheStats(),
        this.calculateEffectivenessMetrics(matchCondition),
        this.calculateContentRelevanceMetrics(matchCondition),
      ]);

      // Count by interaction type
      const impressions =
        counts.find((c) => c._id === "impression")?.count || 0;
      const clicks = counts.find((c) => c._id === "click")?.count || 0;
      const views = counts.find((c) => c._id === "view")?.count || 0;
      const conversions =
        counts.find((c) => c._id === "conversion")?.count || 0;

      // Calculate derived metrics
      return {
        totalImpressions: impressions,
        totalClicks: clicks,
        totalViews: views,
        totalConversions: conversions,
        uniqueUsers: uniqueUsers.length,
        clickThroughRate: calculateCTR(clicks, impressions),
        conversionRate: clicks > 0 ? conversions / clicks : 0,
        engagementRate: calculateEngagementRate(
          clicks + views + conversions,
          impressions
        ),
        cacheStats,
        effectiveness,
        relevance,
      };
    } catch (error) {
      logger.error("Error in getSummaryMetrics:", error);
      return {};
    }
  }

  /**
   * Get time series data for recommendations
   * @param {Object} matchCondition - MongoDB match condition
   * @param {string} groupBy - Grouping period ('day', 'week', 'month')
   * @returns {Promise<Array>} Time series data
   */
  static async getTimeSeriesData(matchCondition, groupBy) {
    try {
      // Set appropriate date format based on groupBy
      const dateFormat =
        {
          day: "%Y-%m-%d",
          week: "%G-%V", // ISO week format
          month: "%Y-%m",
        }[groupBy] || "%Y-%m-%d";

      // Aggregation pipeline for time series data
      const pipeline = [
        { $match: matchCondition },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: "$timestamp" } },
            impressions: {
              $sum: {
                $cond: [{ $eq: ["$interactionType", "impression"] }, 1, 0],
              },
            },
            clicks: {
              $sum: { $cond: [{ $eq: ["$interactionType", "click"] }, 1, 0] },
            },
            conversions: {
              $sum: {
                $cond: [{ $eq: ["$interactionType", "conversion"] }, 1, 0],
              },
            },
            avgEngagementQuality: { $avg: "$metadata.engagementQuality" },
            avgResponseTime: { $avg: "$performance.responseTime" },
          },
        },
        {
          $addFields: {
            clickThroughRate: {
              $cond: [
                { $gt: ["$impressions", 0] },
                { $divide: ["$clicks", "$impressions"] },
                0,
              ],
            },
            conversionRate: {
              $cond: [
                { $gt: ["$clicks", 0] },
                { $divide: ["$conversions", "$clicks"] },
                0,
              ],
            },
          },
        },
        { $sort: { _id: 1 } },
      ];

      return await RecommendationInteraction.aggregate(pipeline);
    } catch (error) {
      logger.error("Error getting time series data:", error);
      return [];
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  static async getCacheStats() {
    try {
      // Query interactions with response time data for the past week
      const [stats] = await RecommendationInteraction.aggregate([
        {
          $match: {
            "performance.responseTime": { $exists: true },
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: "$performance.responseTime" },
            hits: { $sum: { $cond: ["$performance.cacheHit", 1, 0] } },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            avgResponseTime: 1,
            hitRate: {
              $cond: [
                { $gt: ["$total", 0] },
                { $divide: ["$hits", "$total"] },
                0,
              ],
            },
            missRate: {
              $cond: [
                { $gt: ["$total", 0] },
                { $divide: [{ $subtract: ["$total", "$hits"] }, "$total"] },
                1,
              ],
            },
          },
        },
      ]);

      return stats || { avgResponseTime: 0, hitRate: 0, missRate: 1 };
    } catch (error) {
      logger.error("Error getting cache stats:", error);
      return { avgResponseTime: 0, hitRate: 0, missRate: 1 };
    }
  }

  /**
   * Get recommendation performance benchmarks with typical ranges
   * @returns {Promise<Object>} Benchmark values for different metrics
   */
  static async getBenchmarks() {
    // Return recommendation performance benchmarks with typical ranges
    return {
      clickThroughRate: {
        low: 0.01, // Below 1% is considered low
        average: 0.03, // 3% is typical for recommendations
        good: 0.05, // 5% is good performance
        excellent: 0.08, // 8% and above is excellent
      },
      conversionRate: {
        low: 0.005, // Below 0.5% is considered low
        average: 0.01, // 1% is typical
        good: 0.02, // 2% is good
        excellent: 0.04, // 4% and above is excellent
      },
      cacheHitRate: {
        low: 0.5, // Below 50% is considered low
        average: 0.7, // 70% is a reasonable target
        good: 0.85, // 85% is good
        excellent: 0.95, // 95% and above is excellent
      },
      responseTime: {
        excellent: 100, // Under 100ms is excellent
        good: 250, // Under 250ms is good
        average: 500, // Under 500ms is acceptable
        poor: 1000, // Above 1000ms is poor
      },
      engagementQuality: {
        low: 3,
        average: 5,
        good: 7,
        excellent: 9,
      },
    };
  }

  /**
   * Get performance stats by strategy
   * @param {Object} matchCondition - MongoDB match condition
   * @returns {Promise<Array>} Strategy performance stats
   */
  static async getStrategyPerformance(matchCondition) {
    try {
      return await RecommendationInteraction.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: {
              strategy: "$recommendationType",
              type: "$interactionType",
            },
            count: { $sum: 1 },
            avgEngagementQuality: { $avg: "$metadata.engagementQuality" },
            avgResponseTime: { $avg: "$performance.responseTime" },
          },
        },
        {
          $group: {
            _id: "$_id.strategy",
            interactions: {
              $push: {
                type: "$_id.type",
                count: "$count",
                avgEngagementQuality: "$avgEngagementQuality",
                avgResponseTime: "$avgResponseTime",
              },
            },
          },
        },
        // Project and calculate KPIs
        {
          $project: {
            strategy: "$_id",
            impressions: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: { $eq: ["$$item.type", "impression"] },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
            clicks: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: { $eq: ["$$item.type", "click"] },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
            conversions: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: { $eq: ["$$item.type", "conversion"] },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
            engagementQuality: {
              $avg: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: { $ne: ["$$item.avgEngagementQuality", null] },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.avgEngagementQuality",
                },
              },
            },
            responseTime: {
              $avg: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: { $ne: ["$$item.avgResponseTime", null] },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.avgResponseTime",
                },
              },
            },
          },
        },
        {
          $addFields: {
            clickThroughRate: {
              $cond: [
                { $gt: ["$impressions", 0] },
                { $divide: ["$clicks", "$impressions"] },
                0,
              ],
            },
            conversionRate: {
              $cond: [
                { $gt: ["$clicks", 0] },
                { $divide: ["$conversions", "$clicks"] },
                0,
              ],
            },
            effectiveness: {
              $cond: [
                { $gt: ["$impressions", 0] },
                {
                  $divide: [
                    { $add: ["$clicks", "$conversions"] },
                    "$impressions",
                  ],
                },
                0,
              ],
            },
          },
        },
        { $sort: { impressions: -1 } },
      ]);
    } catch (error) {
      logger.error("Error getting strategy performance:", error);
      return [];
    }
  }

  /**
   * Get engagement metrics for recommendations
   * @param {Object} matchCondition - MongoDB match condition
   * @returns {Promise<Object>} Engagement metrics
   */
  static async getEngagementMetrics(matchCondition) {
    try {
      // Get metrics by interaction type
      const byType = await RecommendationInteraction.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: "$interactionType",
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: "$user" },
            avgEngagementQuality: { $avg: "$metadata.engagementQuality" },
          },
        },
        {
          $project: {
            type: "$_id",
            count: 1,
            uniqueUsers: { $size: "$uniqueUsers" },
            avgEngagementQuality: 1,
          },
        },
      ]);

      // Get hourly distribution
      const hourly = await RecommendationInteraction.aggregate([
        {
          $match: {
            ...matchCondition,
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              hour: { $hour: "$timestamp" },
              type: "$interactionType",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.hour",
            interactions: { $push: { type: "$_id.type", count: "$count" } },
          },
        },
        // Project and calculate metrics for each hour
        {
          $project: {
            hour: "$_id",
            impressions: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: { $eq: ["$$item.type", "impression"] },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
            clicks: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: { $eq: ["$$item.type", "click"] },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
            engagementTotal: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: {
                        $in: [
                          "$$item.type",
                          [
                            "click",
                            "view",
                            "upvote",
                            "bookmark",
                            "comment",
                            "conversion",
                          ],
                        ],
                      },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
          },
        },
        {
          $addFields: {
            engagementRate: {
              $cond: [
                { $gt: ["$impressions", 0] },
                { $divide: ["$engagementTotal", "$impressions"] },
                0,
              ],
            },
            clickThroughRate: {
              $cond: [
                { $gt: ["$impressions", 0] },
                { $divide: ["$clicks", "$impressions"] },
                0,
              ],
            },
          },
        },
        { $sort: { hour: 1 } },
      ]);

      // Get content relevance metrics
      const relevanceMetrics = await this.calculateContentRelevanceMetrics(
        matchCondition
      ).catch((err) => {
        logger.warn("Error calculating content relevance metrics:", err);
        return { categoryMatchRate: 0, tagRelevanceScore: 0 };
      });

      return {
        byType,
        hourlyDistribution: hourly,
        relevanceMetrics,
      };
    } catch (error) {
      logger.error("Error getting engagement metrics:", error);
      return { byType: [], hourlyDistribution: [], relevanceMetrics: {} };
    }
  }

  /**
   * Calculate effectiveness metrics for recommendations
   * @param {Object} matchCondition - MongoDB match condition
   * @returns {Promise<Object>} Effectiveness metrics
   */
  static async calculateEffectivenessMetrics(matchCondition) {
    try {
      // Count impressions that led to actions (clicks, conversions)
      const [results] = await RecommendationInteraction.aggregate([
        {
          $match: {
            ...matchCondition,
            interactionType: "impression",
          },
        },
        {
          $lookup: {
            from: "recommendationinteractions",
            let: {
              productId: "$product",
              userId: "$user",
              impTime: "$timestamp",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$product", "$$productId"] },
                      { $eq: ["$user", "$$userId"] },
                      {
                        $in: [
                          "$interactionType",
                          ["click", "upvote", "bookmark", "conversion"],
                        ],
                      },
                      { $gt: ["$timestamp", "$$impTime"] },
                      {
                        $lt: [
                          { $subtract: ["$timestamp", "$$impTime"] },
                          24 * 60 * 60 * 1000,
                        ],
                      },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: "subsequentActions",
          },
        },
        {
          $group: {
            _id: null,
            totalImpressions: { $sum: 1 },
            actionsCount: {
              $sum: {
                $cond: [{ $gt: [{ $size: "$subsequentActions" }, 0] }, 1, 0],
              },
            },
            avgTimeToAction: {
              $avg: {
                $cond: [
                  { $gt: [{ $size: "$subsequentActions" }, 0] },
                  {
                    $divide: [
                      {
                        $subtract: [
                          { $arrayElemAt: ["$subsequentActions.timestamp", 0] },
                          "$timestamp",
                        ],
                      },
                      1000, // Convert to seconds
                    ],
                  },
                  null,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            recommendationToActionRate: {
              $cond: [
                { $gt: ["$totalImpressions", 0] },
                { $divide: ["$actionsCount", "$totalImpressions"] },
                0,
              ],
            },
            avgTimeToAction: 1,
          },
        },
      ]);

      return results || { recommendationToActionRate: 0, avgTimeToAction: 0 };
    } catch (error) {
      logger.warn("Error calculating effectiveness metrics:", error);
      return { recommendationToActionRate: 0, avgTimeToAction: 0 };
    }
  }

  /**
   * Calculate content relevance metrics for recommendations
   * @param {Object} matchCondition - MongoDB match condition
   * @returns {Promise<Object>} Content relevance metrics
   */
  static async calculateContentRelevanceMetrics(matchCondition) {
    try {
      // Get tag and category match rates to evaluate content relevance
      const [results] = await RecommendationInteraction.aggregate([
        {
          $match: {
            ...matchCondition,
            "metadata.categoryMatch": { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            totalWithCategoryData: { $sum: 1 },
            categoryMatches: {
              $sum: { $cond: ["$metadata.categoryMatch", 1, 0] },
            },
            avgTagMatches: { $avg: "$metadata.tagMatches" },
            avgUserPreferenceScore: { $avg: "$metadata.userPreferenceScore" },
          },
        },
        {
          $project: {
            _id: 0,
            categoryMatchRate: {
              $cond: [
                { $gt: ["$totalWithCategoryData", 0] },
                { $divide: ["$categoryMatches", "$totalWithCategoryData"] },
                0,
              ],
            },
            tagRelevanceScore: { $ifNull: ["$avgTagMatches", 0] },
            userPreferenceScore: { $ifNull: ["$avgUserPreferenceScore", 0] },
          },
        },
      ]);

      return (
        results || {
          categoryMatchRate: 0,
          tagRelevanceScore: 0,
          userPreferenceScore: 0,
        }
      );
    } catch (error) {
      logger.warn("Error calculating content relevance metrics:", error);
      return {
        categoryMatchRate: 0,
        tagRelevanceScore: 0,
        userPreferenceScore: 0,
      };
    }
  }

  /**
   * Get category breakdown of recommendations
   * @param {Object} matchCondition - MongoDB match condition
   * @returns {Promise<Array>} Category breakdown
   */
  static async getCategoryBreakdown(matchCondition) {
    try {
      return await RecommendationInteraction.aggregate([
        { $match: matchCondition },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productData",
          },
        },
        {
          $unwind: { path: "$productData", preserveNullAndEmptyArrays: false },
        },
        {
          $lookup: {
            from: "categories",
            localField: "productData.category",
            foreignField: "_id",
            as: "categoryData",
          },
        },
        {
          $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: false },
        },
        // Group by category and interaction type
        {
          $group: {
            _id: {
              id: "$categoryData._id",
              name: "$categoryData.name",
              type: "$interactionType",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: { id: "$_id.id", name: "$_id.name" },
            interactions: { $push: { type: "$_id.type", count: "$count" } },
          },
        },
        // Project and calculate metrics
        {
          $project: {
            categoryId: "$_id.id",
            categoryName: "$_id.name",
            impressions: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: { $eq: ["$$item.type", "impression"] },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
            clicks: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: { $eq: ["$$item.type", "click"] },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
            conversions: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: {
                        $in: [
                          "$$item.type",
                          ["upvote", "bookmark", "comment", "conversion"],
                        ],
                      },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
          },
        },
        {
          $addFields: {
            clickThroughRate: {
              $cond: [
                { $gt: ["$impressions", 0] },
                { $divide: ["$clicks", "$impressions"] },
                0,
              ],
            },
            conversionRate: {
              $cond: [
                { $gt: ["$clicks", 0] },
                { $divide: ["$conversions", "$clicks"] },
                0,
              ],
            },
          },
        },
        { $sort: { impressions: -1 } },
        { $limit: 20 },
      ]);
    } catch (error) {
      logger.error("Error getting category breakdown:", error);
      return [];
    }
  }

  /**
   * Get tag analysis of recommendations
   * @param {Object} matchCondition - MongoDB match condition
   * @returns {Promise<Array>} Tag analysis
   */
  static async getTagAnalysis(matchCondition) {
    try {
      return await RecommendationInteraction.aggregate([
        { $match: matchCondition },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productData",
          },
        },
        {
          $unwind: { path: "$productData", preserveNullAndEmptyArrays: false },
        },
        // Safely handle products without tags
        { $match: { "productData.tags": { $exists: true, $ne: [] } } },
        { $unwind: "$productData.tags" },
        // Group by tag and interaction type
        {
          $group: {
            _id: {
              tag: "$productData.tags",
              type: "$interactionType",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.tag",
            interactions: { $push: { type: "$_id.type", count: "$count" } },
          },
        },
        // Project and calculate metrics
        {
          $project: {
            tag: "$_id",
            impressions: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: { $eq: ["$$item.type", "impression"] },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
            clicks: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: { $eq: ["$$item.type", "click"] },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
            conversions: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$interactions",
                      as: "item",
                      cond: {
                        $in: [
                          "$$item.type",
                          ["upvote", "bookmark", "comment", "conversion"],
                        ],
                      },
                    },
                  },
                  as: "filteredItem",
                  in: "$$filteredItem.count",
                },
              },
            },
          },
        },
        {
          $addFields: {
            clickThroughRate: {
              $cond: [
                { $gt: ["$impressions", 0] },
                { $divide: ["$clicks", "$impressions"] },
                0,
              ],
            },
            conversionRate: {
              $cond: [
                { $gt: ["$clicks", 0] },
                { $divide: ["$conversions", "$clicks"] },
                0,
              ],
            },
          },
        },
        { $sort: { impressions: -1 } },
        { $limit: 30 },
      ]);
    } catch (error) {
      logger.error("Error getting tag analysis:", error);
      return [];
    }
  }

  /**
   * Find top performing recommendation strategy
   * @param {Object} stats - Recommendation statistics
   * @returns {Object|null} Top performing strategy
   */
  static findTopPerformingStrategy(stats) {
    if (
      !stats?.strategyPerformance ||
      !Array.isArray(stats.strategyPerformance)
    ) {
      return null;
    }

    // Get strategies with sufficient data
    const validStrategies = stats.strategyPerformance.filter(
      (s) => s.impressions > 20 && s.clickThroughRate > 0
    );

    // Sort by CTR and return the top performer
    return validStrategies.length > 0
      ? validStrategies.sort(
          (a, b) => b.clickThroughRate - a.clickThroughRate
        )[0]
      : null;
  }

  /**
   * Find top performing category
   * @param {Object} stats - Recommendation statistics
   * @returns {Object|null} Top performing category
   */
  static findTopPerformingCategory(stats) {
    if (!stats?.categoryBreakdown || !Array.isArray(stats.categoryBreakdown)) {
      return null;
    }

    // Get categories with sufficient data
    const validCategories = stats.categoryBreakdown.filter(
      (c) => c.impressions >= 15 && c.clickThroughRate > 0
    );

    // Sort by CTR and return the top performer
    return validCategories.length > 0
      ? validCategories.sort(
          (a, b) => b.clickThroughRate - a.clickThroughRate
        )[0]
      : null;
  }

  /**
   * Find best time of day for recommendations
   * @param {Object} stats - Recommendation statistics
   * @returns {Object|null} Best time of day
   */
  static findBestTimeOfDay(stats) {
    const hourly = stats?.engagementMetrics?.hourlyDistribution;
    if (!hourly || !Array.isArray(hourly) || hourly.length === 0) {
      return null;
    }

    // Get hours with sufficient data
    const validHours = hourly.filter((h) => h.impressions >= 10);
    if (validHours.length === 0) {
      return null;
    }

    // Sort by engagement metrics
    const bestHour = validHours.sort(
      (a, b) =>
        b.clickThroughRate - a.clickThroughRate ||
        b.engagementRate - a.engagementRate
    )[0];

    return bestHour
      ? {
          hour: bestHour.hour,
          clickThroughRate: bestHour.clickThroughRate,
          engagementRate: bestHour.engagementRate,
        }
      : null;
  }

  /**
   * Generate improvement suggestions based on statistics
   * @param {Object} stats - Recommendation statistics
   * @returns {Array} Improvement suggestions
   */
  static generateImprovementSuggestions(stats) {
    const suggestions = [];

    if (stats?.summary) {
      // Check click-through rate
      if (stats.summary.clickThroughRate < 0.015) {
        suggestions.push({
          type: "lowCTR",
          message: `Click-through rate is very low (${(
            stats.summary.clickThroughRate * 100
          ).toFixed(2)}%). Consider improving recommendation relevance.`,
          value: stats.summary.clickThroughRate,
          severity: "high",
        });
      } else if (stats.summary.clickThroughRate < 0.03) {
        suggestions.push({
          type: "moderateCTR",
          message: `Click-through rate is below average (${(
            stats.summary.clickThroughRate * 100
          ).toFixed(
            2
          )}%). Consider testing different recommendation strategies.`,
          value: stats.summary.clickThroughRate,
          severity: "medium",
        });
      }

      // Check cache hit rate
      if (stats.summary.cacheStats?.hitRate < 0.5) {
        suggestions.push({
          type: "lowCacheHitRate",
          message: `Cache hit rate is very low (${(
            stats.summary.cacheStats.hitRate * 100
          ).toFixed(2)}%). Review caching strategy to improve performance.`,
          value: stats.summary.cacheStats.hitRate,
          severity: "high",
        });
      }

      // Check response time
      if (stats.summary.performanceStats?.avgResponseTime > 500) {
        suggestions.push({
          type: "highResponseTime",
          message: `Average response time is high (${Math.round(
            stats.summary.performanceStats.avgResponseTime
          )}ms). Optimize recommendation generation for better user experience.`,
          value: stats.summary.performanceStats.avgResponseTime,
          severity: "high",
        });
      }
    }

    // Check strategies
    if (stats?.strategyPerformance?.length > 0) {
      const worstStrategy = stats.strategyPerformance
        .filter((s) => s.impressions >= 100)
        .sort((a, b) => a.clickThroughRate - b.clickThroughRate)[0];

      if (worstStrategy && worstStrategy.clickThroughRate < 0.01) {
        suggestions.push({
          type: "poorStrategyPerformance",
          message: `The '${
            worstStrategy.strategy
          }' strategy has very low engagement (CTR: ${(
            worstStrategy.clickThroughRate * 100
          ).toFixed(2)}%). Consider adjusting or reducing its weight.`,
          value: worstStrategy.clickThroughRate,
          strategy: worstStrategy.strategy,
          severity: "high",
        });
      }
    }

    return suggestions;
  }

  /**
   * Identify trends in recommendation statistics
   * @param {Object} stats - Recommendation statistics
   * @returns {Array} Identified trends
   */
  static identifyTrends(stats) {
    if (!stats?.timeSeriesData?.length) return [];

    const trends = [];

    // Need at least 3 data points for trend analysis
    if (stats.timeSeriesData.length >= 3) {
      // Analyze CTR trend
      const ctrValues = stats.timeSeriesData
        .slice(-7)
        .map((d) => d.clickThroughRate || 0);
      const ctrTrend = this.calculateTrend(ctrValues);

      if (Math.abs(ctrTrend) > 0.05) {
        trends.push({
          type: `ctr${ctrTrend > 0 ? "Improving" : "Declining"}`,
          message: `Click-through rate is ${
            ctrTrend > 0 ? "increasing" : "decreasing"
          } (${Math.abs(ctrTrend * 100).toFixed(1)}% change).`,
          trend: ctrTrend,
          metric: "clickThroughRate",
          severity: ctrTrend < 0 ? "medium" : "low",
        });
      }

      // Analyze engagement quality trend
      const engagementValues = stats.timeSeriesData
        .slice(-7)
        .filter((d) => d.avgEngagementQuality)
        .map((d) => d.avgEngagementQuality);

      if (engagementValues.length >= 3) {
        const engagementTrend = this.calculateTrend(engagementValues);

        if (Math.abs(engagementTrend) > 0.1) {
          trends.push({
            type: `engagement${
              engagementTrend > 0 ? "Improving" : "Declining"
            }`,
            message: `User engagement quality is ${
              engagementTrend > 0 ? "increasing" : "decreasing"
            } (${Math.abs(engagementTrend * 100).toFixed(1)}% change).`,
            trend: engagementTrend,
            metric: "avgEngagementQuality",
            severity: engagementTrend < 0 ? "medium" : "low",
          });
        }
      }
    }

    return trends;
  }

  /**
   * Detect anomalies in recommendation statistics
   * @param {Object} stats - Recommendation statistics
   * @returns {Array} Detected anomalies
   */
  static detectAnomalies(stats) {
    if (!stats?.timeSeriesData?.length) return [];

    const anomalies = [];

    // Need at least 5 data points for anomaly detection
    if (stats.timeSeriesData.length >= 5) {
      // Analyze impressions
      const impressions = stats.timeSeriesData.map((d) => d.impressions || 0);
      const impressionAnomaly = this.detectAnomaly(impressions, 2.5);

      if (impressionAnomaly) {
        const latest = stats.timeSeriesData[stats.timeSeriesData.length - 1];
        anomalies.push({
          type: impressionAnomaly.isHigh ? "impressionSpike" : "impressionDrop",
          message: `Unusual ${
            impressionAnomaly.isHigh ? "spike" : "drop"
          } in impressions (${Math.abs(
            impressionAnomaly.deviationPercent
          ).toFixed(1)}% ${
            impressionAnomaly.isHigh ? "above" : "below"
          } normal).`,
          value: impressionAnomaly.value,
          mean: impressionAnomaly.mean,
          date: latest.date,
          severity: "high",
          deviationPercent: impressionAnomaly.deviationPercent,
        });
      }

      // Analyze CTR
      const ctrs = stats.timeSeriesData.map((d) => d.clickThroughRate || 0);
      const ctrAnomaly = this.detectAnomaly(ctrs, 3.0);

      if (ctrAnomaly) {
        const latest = stats.timeSeriesData[stats.timeSeriesData.length - 1];
        anomalies.push({
          type: ctrAnomaly.isHigh ? "ctrSpike" : "ctrDrop",
          message: `Unusual ${
            ctrAnomaly.isHigh ? "spike" : "drop"
          } in click-through rate (${Math.abs(
            ctrAnomaly.deviationPercent
          ).toFixed(1)}% ${ctrAnomaly.isHigh ? "above" : "below"} normal).`,
          value: ctrAnomaly.value,
          mean: ctrAnomaly.mean,
          date: latest.date,
          severity: "medium",
          deviationPercent: ctrAnomaly.deviationPercent,
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect an anomaly in a series of values
   * @param {Array<number>} values - Array of numeric values
   * @param {number} threshold - Z-score threshold for anomaly detection
   * @returns {Object|null} Detected anomaly or null
   */
  static detectAnomaly(values, threshold = 2) {
    if (!values || !values.length) return null;

    // Calculate mean and standard deviation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length
    );

    // Get the latest value and calculate Z-score
    const latest = values[values.length - 1];
    const zScore = stdDev > 0 ? (latest - mean) / stdDev : 0;

    // Return anomaly if Z-score exceeds threshold and mean is positive
    if (Math.abs(zScore) > threshold && mean > 0) {
      const deviationPercent = ((latest - mean) / mean) * 100;
      return {
        value: latest,
        mean,
        stdDev,
        zScore,
        isHigh: zScore > 0,
        deviationPercent,
      };
    }

    return null;
  }

  /**
   * Calculate the trend of a series of values
   * @param {Array<number>} values - Array of numeric values
   * @returns {number} Trend slope
   */
  static calculateTrend(values) {
    if (!values || values.length < 2) return 0;

    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    // Simple linear regression
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    // Calculate normalized slope
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avg = sumY / n;

    return avg !== 0 ? slope / avg : 0;
  }
}

export default RecommendationStatsService;
