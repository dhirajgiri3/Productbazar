import mongoose from "mongoose";
import logger from "../../utils/logging/logger.js";
import StrategyRecommendationService from "../../services/recommendation/strategyRecommendation.service.js";
import { normalizeScore, getStrategyWeight } from "../../utils/recommendation/recommendationScoring.utils.js";
import { getDiscoveryCandidates } from "../../services/recommendation/recommendation.candidates.service.js";
import recommendationCacheService from "../../services/recommendation/recommendationCache.service.js";

// Define Schema
const recommendationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recommendedProducts: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        score: { type: Number, default: 0, min: 0 },
        scores: {
          relevance: { type: Number, default: 0 },
          popularity: { type: Number, default: 0 },
          quality: { type: Number, default: 0 },
          recency: { type: Number, default: 0 },
          velocity: { type: Number, default: 0 },
        },
        reason: {
          type: String,
          enum: [
            "category",
            "tag",
            "history",
            "collaborative",
            "trending",
            "new",
            "maker",
            "preference",
            "discovery",
            "similar",
            "personalized",
          ],
          default: "similar",
        },
        explanationText: String,
        lastCalculated: { type: Date, default: Date.now },
      },
    ],
    categories: [
      {
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        score: Number,
        lastInteraction: Date,
        interactionCount: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
      },
    ],
    tags: [
      {
        tag: String,
        score: Number,
        lastInteraction: Date,
        interactionCount: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
      },
    ],
    dismissedProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],
    recentInteractions: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        type: {
          type: String,
          required: true,
          enum: [
            "view",
            "click",
            "upvote",
            "bookmark",
            "comment",
            "share",
            "impression",
            "remove_upvote",
            "remove_bookmark"
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
          required: true,
        },
        metadata: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          default: () => new Map(),
        },
      },
    ],
    interactionCounts: {
      views: { type: Number, default: 0 },
      upvotes: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
    interactionMetrics: {
      categoryEngagement: {
        type: Map,
        of: {
          views: Number,
          upvotes: Number,
          conversions: Number,
          lastEngaged: Date,
        },
      },
      tagEngagement: {
        type: Map,
        of: {
          views: Number,
          upvotes: Number,
          conversions: Number,
          lastEngaged: Date,
        },
      },
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

recommendationSchema.index({ "recommendedProducts.product": 1 });
recommendationSchema.index({ lastUpdated: -1 });
recommendationSchema.index({ user: 1, "categories.category": 1 });
recommendationSchema.index({ user: 1, "tags.tag": 1 });
recommendationSchema.index({ user: 1, "recentInteractions.timestamp": -1 });

// Static Methods
recommendationSchema.statics.getRecommendationsForUser = async function (
  userId,
  limit = 10
) {
  try {
    logger.debug("Getting recommendations for user:", { userId, limit });

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.error("Invalid user ID format in getRecommendationsForUser");
      return [];
    }

    const rec = await this.findOne({ user: userId })
      .populate({
        path: "recommendedProducts.product",
        match: { status: "Published" },
        select:
          "name slug tagline description thumbnail category tags maker createdAt upvoteCount views",
        populate: [
          { path: "category", select: "name" },
          { path: "maker", select: "firstName lastName" },
        ],
      })
      .lean();

    if (!rec || !rec.recommendedProducts?.length) {
      logger.debug("No existing recommendations, generating new ones", {
        userId,
      });
      await this.generateRecommendations(userId);
      return this.getRecommendationsForUser(userId, limit);
    }

    const validRecs = rec.recommendedProducts
      .filter((r) => r.product)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    logger.debug("Retrieved recommendations:", {
      userId,
      totalFound: validRecs.length,
      requestedLimit: limit,
    });

    return validRecs;
  } catch (error) {
    logger.error("Error in getRecommendationsForUser:", {
      userId,
      error: error.message,
      stack: error.stack,
    });
    return [];
  }
};

recommendationSchema.statics.generateRecommendations = async function(userId, options = {}) {
  const { maxRecommendations = 50, forceRefresh = false } = options;

  // Add rate limiting check
  const cacheKey = `recommendations:${userId}`;
  const cacheTTL = 5 * 60 * 1000; // 5 minutes

  try {
    // Check cache first
    const cachedRecs = await recommendationCacheService.get(cacheKey);
    if (cachedRecs && !forceRefresh) {
      logger.debug('Using cached recommendations', { userId });
      return cachedRecs;
    }

    let rec = await this.findOne({ user: userId }) || new this({ user: userId });

    // Check if refresh needed
    if (!forceRefresh &&
        rec.lastUpdated &&
        Date.now() - rec.lastUpdated < 24 * 60 * 60 * 1000 &&
        rec.recommendedProducts?.length >= Math.min(20, maxRecommendations)) {
      logger.debug('Using cached recommendations', { userId });
      return rec;
    }

    // Get user exclusions with error handling
    const exclusions = await this.getUserExclusions(userId).catch(err => {
      logger.error('Failed to get exclusions:', err);
      return rec.dismissedProducts || [];
    });

    // Enhanced recommendation gathering with parallel fetching
    const recommendationPromises = [
      // History based
      StrategyRecommendationService.getUserRecommendations(userId, {
        limit: Math.ceil(maxRecommendations / 4),
        excludeIds: exclusions,
        reason: 'history'
      }),

      // Trending content
      StrategyRecommendationService.getTrendingRecommendations(userId, {
        limit: Math.ceil(maxRecommendations / 4),
        excludeIds: exclusions,
        days: 7
      }),

      // Personalized content
      StrategyRecommendationService.getUserRecommendations(userId, {
        limit: Math.ceil(maxRecommendations / 4),
        excludeIds: exclusions,
        reason: 'personalized'
      }),

      // Discovery content
      getDiscoveryCandidates({
        userId,
        limit: Math.ceil(maxRecommendations / 4),
        excludeIds: exclusions
      })
    ];

    // Process results with improved error handling
    const results = await Promise.allSettled(recommendationPromises);
    let allRecs = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        allRecs = allRecs.concat(result.value);
      } else {
        logger.error(`Failed to get recommendations for strategy ${index}:`, result.reason);
      }
    });

    // Enhanced scoring with strategy weights
    const scoredRecs = allRecs.map(rec => ({
      ...rec,
      score: normalizeScore(rec.score || rec.preliminaryScore || 0) * getStrategyWeight(rec.reason)
    }));

    // Improved deduplication with Map
    const uniqueRecs = Array.from(
      new Map(scoredRecs.map(r => [r.product.toString(), r])).values()
    );

    // Sort and limit results
    rec.recommendedProducts = uniqueRecs
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations)
      .map(r => ({
        product: r.product,
        score: r.score,
        reason: r.reason,
        explanationText: r.explanationText || `Recommended based on ${r.reason}`,
        lastCalculated: new Date()
      }));

    // Update interaction tracking
    rec.recentInteractions = (rec.recentInteractions || [])
      .slice(0, 100)
      .filter(i => Date.now() - i.timestamp < 30 * 24 * 60 * 60 * 1000);

    rec.lastUpdated = new Date();
    await rec.save();

    // Cache the results
    await recommendationCacheService.set(cacheKey, rec, cacheTTL);

    logger.info('Generated recommendations successfully', {
      userId,
      count: rec.recommendedProducts.length,
      strategies: [...new Set(rec.recommendedProducts.map(r => r.reason))]
    });

    return rec;
  } catch (error) {
    logger.error('Error generating recommendations:', {
      userId,
      error: error.message
    });
    throw error;
  }
};

recommendationSchema.statics.getUserExclusions = async function (userId) {
  const Product = mongoose.model("Product");

  // Get products user has already interacted with
  const [viewedProducts, upvotedProducts, bookmarkedProducts, userProducts] =
    await Promise.all([
      mongoose.model("View").find({ user: userId }).distinct("product"),
      mongoose.model("Upvote").find({ user: userId }).distinct("product"),
      Product.find({ bookmarks: userId }).distinct("_id"),
      Product.find({ maker: userId }).distinct("_id"),
    ]);

  return [
    ...new Set([
      ...viewedProducts,
      ...upvotedProducts,
      ...bookmarkedProducts,
      ...userProducts,
    ]),
  ];
};

// Helper method to get recent activity for a user
recommendationSchema.statics.getRecentActivity = async function (
  userId,
  limit = 20
) {
  const rec = await this.findOne({ user: userId })
    .select("recentInteractions")
    .populate({
      path: "recentInteractions.product",
      select: "name slug thumbnail category tags",
      populate: { path: "category", select: "name" },
    })
    .lean();

  if (!rec || !rec.recentInteractions.length) {
    return [];
  }

  return rec.recentInteractions
    .filter((i) => i.product) // Filter out deleted products
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

// Helper method to find users with similar tastes
recommendationSchema.statics.findSimilarUsers = async function (
  userId,
  limit = 5
) {
  const userPrefs = await this.findOne({ user: userId })
    .select("categories tags")
    .lean();
  if (!userPrefs) return [];

  // If user has no preferences yet, can't find similar users
  if (!userPrefs.categories?.length && !userPrefs.tags?.length) return [];

  const userCategoryIds = userPrefs.categories.map((c) =>
    c.category.toString()
  );
  const userTags = userPrefs.tags.map((t) => t.tag);

  const similarUsers = await this.aggregate([
    {
      $match: {
        user: { $ne: new mongoose.Types.ObjectId(userId) },
        $or: [
          {
            "categories.category": {
              $in: userPrefs.categories.map((c) => c.category),
            },
          },
          { "tags.tag": { $in: userPrefs.tags.map((t) => t.tag) } },
        ],
      },
    },
    {
      $project: {
        user: 1,
        similarity: {
          $add: [
            // Category similarity
            {
              $size: {
                $filter: {
                  input: "$categories",
                  as: "cat",
                  cond: {
                    $in: [
                      "$$cat.category",
                      userPrefs.categories.map((c) => c.category),
                    ],
                  },
                },
              },
            },
            // Tag similarity
            {
              $size: {
                $filter: {
                  input: "$tags",
                  as: "tag",
                  cond: {
                    $in: ["$$tag.tag", userPrefs.tags.map((t) => t.tag)],
                  },
                },
              },
            },
          ],
        },
      },
    },
    { $sort: { similarity: -1 } },
    { $limit: limit },
  ]);

  return similarUsers;
};

// Add new method to track feed performance
recommendationSchema.statics.trackFeedPerformance = async function (
  userId,
  feedItems,
  options = {}
) {
  try {
    const { feedType = "default", sessionId = null } = options;

    // Get or create user's recommendation document
    let rec = await this.findOne({ user: userId });
    if (!rec) {
      rec = new this({ user: userId });
    }

    // Record each feed item as an impression
    const impressions = feedItems.map((item, index) => ({
      product: item.product,
      type: "impression",
      timestamp: new Date(),
      position: index,
      metadata: {
        feedType,
        sessionId,
        reason: item.reason,
        score: item.score,
      },
    }));

    // Add to recent interactions
    rec.recentInteractions.unshift(...impressions);

    // Keep only the last 100 interactions
    if (rec.recentInteractions.length > 100) {
      rec.recentInteractions = rec.recentInteractions.slice(0, 100);
    }

    // Update feed impression count
    if (!rec.interactionCounts.feedImpressions) {
      rec.interactionCounts.feedImpressions = 0;
    }
    rec.interactionCounts.feedImpressions += feedItems.length;

    // Save the updated document
    rec.lastUpdated = new Date();
    await rec.save();

    return true;
  } catch (error) {
    console.error(`Error tracking feed performance: ${error.message}`);
    return false;
  }
};

// Add new method to analyze feed effectiveness
recommendationSchema.statics.analyzeFeedEffectiveness = async function (
  userId,
  days = 7
) {
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get recommendation document
    const rec = await this.findOne({ user: userId });
    if (!rec) return null;

    // Get recent impressions
    const impressions = rec.recentInteractions.filter(
      (interaction) =>
        interaction.type === "impression" && interaction.timestamp >= cutoff
    );

    // Get recent interactions (clicks, upvotes, etc.)
    const engagement = rec.recentInteractions.filter(
      (interaction) =>
        interaction.type !== "impression" && interaction.timestamp >= cutoff
    );

    // Calculate conversion rates by reason
    const reasonStats = {};

    impressions.forEach((impression) => {
      const reason = impression.metadata?.reason || "unknown";

      if (!reasonStats[reason]) {
        reasonStats[reason] = {
          impressions: 0,
          engagements: 0,
          conversions: 0,
        };
      }

      reasonStats[reason].impressions++;

      // Check if this impression led to engagement
      const hasEngagement = engagement.some(
        (eng) => eng.product.toString() === impression.product.toString()
      );

      if (hasEngagement) {
        reasonStats[reason].engagements++;
      }
    });

    // Calculate overall metrics
    const totalImpressions = impressions.length;
    const totalEngagements = Object.values(reasonStats).reduce(
      (sum, stat) => sum + stat.engagements,
      0
    );

    return {
      overall: {
        impressions: totalImpressions,
        engagements: totalEngagements,
        engagementRate:
          totalImpressions > 0 ? totalEngagements / totalImpressions : 0,
      },
      byReason: reasonStats,
      period: {
        days,
        from: cutoff,
        to: new Date(),
      },
    };
  } catch (error) {
    console.error(`Error analyzing feed effectiveness: ${error.message}`);
    return null;
  }
};

const Recommendation = mongoose.model("Recommendation", recommendationSchema);
export default Recommendation;
