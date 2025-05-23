import mongoose from "mongoose";
import logger from "../../utils/logging/logger.js";

const recommendationInteractionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true,
  },
  recommendationType: {
    type: String,
    enum: [
      "personalized",
      "trending",
      "new",
      "category",
      "tag",
      "history",
      "collaborative",
      "maker",
      "similar",
      "diversified-feed",
      "discovery",
      "hybrid",
      "unknown",
      "feed",
      "popular",
      "interests",
      "similar-products",
      "history-based",
      "diversified",
      "similar_section",
      "view_similar",
      "direct"
    ],
    default: "unknown",
    required: true,
    index: true,
  },
  interactionType: {
    type: String,
    enum: [
      "impression",
      "click",
      "view",
      "upvote",
      "bookmark",
      "share",
      "comment",
      "conversion",
      "dismiss",
      "feedback",
      "engagement",
      "interaction",
      "search",
      "signup",
      "login",
      "direct",
      "remove_upvote",
      "remove_bookmark"
    ],
    required: true,
    index: true,
  },
  position: {
    type: Number,
    min: 0,
  },
  // Add success tracking
  isSuccessful: {
    type: Boolean,
    default: false,
  },
  // Add tags tracking
  tags: [
    {
      type: String,
      index: true,
    },
  ],
  // Add performance metrics
  performance: {
    responseTime: Number,
    cacheHit: Boolean,
    rank: Number,
    position: Number,
  },
  // Add user session context
  sessionContext: {
    sessionId: String,
    isActive: Boolean,
    lastActiveAt: Date,
  },
  metadata: {
    // Recommendation context
    score: Number,
    explanationText: String,
    source: String,

    // Engagement metrics
    timeOnPage: Number,
    scrollDepth: Number,
    sessionDuration: Number,
    interactionDelay: Number,

    // Enhanced engagement tracking
    engagementMetrics: {
      timeOnProduct: Number,
      scrollDepth: Number,
      clickCount: Number,
      hasShared: Boolean,
      hasFollowedMaker: Boolean,
      timeToAction: Number,
      successfulConversion: Boolean,
      conversionValue: Number,
      bounced: Boolean,
      dwellTime: Number,
    },

    // Enhanced recommendation context
    recommendationContext: {
      position: Number,
      page: String,
      section: String,
      strategy: String,
      scores: {
        relevance: Number,
        recency: Number,
        popularity: Number,
      },
    },

    // User context
    userAgent: String,
    referrer: String,
    deviceType: String,
    platform: String,

    // Content relevance
    categoryMatch: Boolean,
    tagMatches: Number,
    userPreferenceScore: Number,

    // A/B testing
    experimentId: String,
    variantId: String,

    // A/B testing enhancements
    experiment: {
      id: String,
      variant: String,
      cohort: String,
      parameters: Map,
    },

    // Conversion tracking
    conversion: {
      type: {
        type: String,
        enum: ["view", "click", "bookmark", "upvote", "purchase", "share"],
      },
      value: Number,
      funnel: {
        stage: String,
        previousStage: String,
        nextStage: String,
      },
    },

    // Quality metrics
    engagementQuality: {
      type: Number,
      min: 0,
      max: 10,
      default: 5,
    },

    // Add tag relevance
    tagRelevance: {
      matchedTags: [String],
      tagOverlapScore: Number,
      primaryTag: String,
    },

    // Add dismissal tracking
    dismissal: {
      reason: String,
      timestamp: Date,
      permanentDismissal: Boolean,
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// === Indexes for performance ===
recommendationInteractionSchema.index({ user: 1, timestamp: -1 });
recommendationInteractionSchema.index({ product: 1, timestamp: -1 });
recommendationInteractionSchema.index({
  recommendationType: 1,
  interactionType: 1,
  timestamp: -1,
});
recommendationInteractionSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 } // 90-day TTL
);
recommendationInteractionSchema.index({ timestamp: 1 });
recommendationInteractionSchema.index({
  "metadata.recommendationContext.strategy": 1,
});
recommendationInteractionSchema.index({ product: 1 });
recommendationInteractionSchema.index({ user: 1 });

// === Methods ===
recommendationInteractionSchema.statics.recordInteraction = async function (
  data
) {
  try {
    // Ensure we have required data
    if (!data.user || !data.product || !data.interactionType) {
      logger.error("Missing required fields for recommendation interaction", {
        hasUser: !!data.user,
        hasProduct: !!data.product,
        hasInteractionType: !!data.interactionType,
      });
      throw new Error("Missing required fields for recommendation interaction");
    }

    // Ensure we have metadata object
    if (!data.metadata) {
      data.metadata = {};
    }

    // Calculate engagement quality score with improved robustness
    const engagementQuality = calculateEngagementQuality(data);

    // Add tag relevance data if missing
    if (!data.metadata.tagRelevance) {
      data.metadata.tagRelevance = {
        matchedTags: data.tags || [],
        tagOverlapScore: 0,
      };
    }

    // Create interaction with quality score
    const interaction = new this({
      ...data,
      recommendationType: data.recommendationType || "unknown",
      metadata: {
        ...data.metadata,
        engagementQuality,
        timestamp: new Date(),
      },
    });

    await interaction.save();
    logger.debug(
      `Recorded interaction with engagement quality: ${engagementQuality}`,
      {
        user: data.user,
        product: data.product,
        interactionType: data.interactionType,
        recommendationType: data.recommendationType || "unknown",
      }
    );
    return interaction;
  } catch (error) {
    logger.error("Error recording recommendation interaction:", error);
    throw error;
  }
};

recommendationInteractionSchema.statics.getInteractionStats = async function (
  userId,
  options = {}
) {
  const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } =
    options;

  try {
    return await this.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            recommendationType: "$recommendationType",
            interactionType: "$interactionType",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          },
          count: { $sum: 1 },
          avgEngagementQuality: { $avg: "$metadata.engagementQuality" },
        },
      },
      {
        $sort: {
          "_id.date": -1,
          count: -1,
        },
      },
    ]);
  } catch (error) {
    logger.error("Error getting interaction stats:", error);
    throw error;
  }
};

// Add new aggregate method for comprehensive stats
recommendationInteractionSchema.statics.getDetailedStats = async function (
  options = {}
) {
  const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } =
    options;

  try {
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $facet: {
          performance: [
            {
              $group: {
                _id: null,
                avgResponseTime: { $avg: "$performance.responseTime" },
                cacheHitRate: {
                  $avg: { $cond: ["$performance.cacheHit", 1, 0] },
                },
              },
            },
          ],
          tagStats: [
            { $unwind: "$tags" },
            {
              $group: {
                _id: "$tags",
                count: { $sum: 1 },
                avgEngagement: { $avg: "$metadata.engagementQuality" },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
        },
      },
    ];

    return await this.aggregate(pipeline);
  } catch (error) {
    logger.error("Error getting detailed stats:", error);
    throw error;
  }
};

// === Helper Functions ===
function calculateEngagementQuality(data) {
  // Default to moderate score if calculation fails
  try {
    let score = 0;
    const { interactionType, metadata = {} } = data;

    // Enhanced base scores - ensure these values are sensible
    const baseScores = {
      conversion: 10,
      bookmark: 8,
      upvote: 7,
      comment: 6,
      share: 5,
      click: 3,
      view: 2,
      impression: 1,
      dismiss: 0, // Add explicit dismiss score
    };

    // Base interaction score - default to at least 1 for valid interactions
    score += baseScores[interactionType] || 1;

    // Add engagement metrics with robust null checking
    if (
      metadata.timeOnPage &&
      typeof metadata.timeOnPage === "number" &&
      metadata.timeOnPage > 0
    ) {
      score += Math.min(4, metadata.timeOnPage / 60);
    }

    if (
      metadata.scrollDepth &&
      typeof metadata.scrollDepth === "number" &&
      metadata.scrollDepth > 0
    ) {
      score += metadata.scrollDepth * 3;
    }

    // Add session duration metric if available
    if (
      metadata.sessionDuration &&
      typeof metadata.sessionDuration === "number" &&
      metadata.sessionDuration > 0
    ) {
      score += Math.min(3, metadata.sessionDuration / 300); // max 3 points for 5+ minutes
    }

    // Add click count metric if available
    if (
      metadata.engagementMetrics?.clickCount &&
      typeof metadata.engagementMetrics.clickCount === "number"
    ) {
      score += Math.min(2, metadata.engagementMetrics.clickCount);
    }

    // Log scoring details for debugging
    logger.debug(`Calculated engagement quality score: ${score}`, {
      interactionType,
      baseScore: baseScores[interactionType] || 0,
      timeOnPage: metadata.timeOnPage,
      scrollDepth: metadata.scrollDepth,
    });

    // Normalize to 0-10 scale
    return Math.max(0, Math.min(10, score));
  } catch (error) {
    logger.error("Error calculating engagement quality score:", error);
    // Return a default middle score for robustness
    return 5;
  }
}

// Add new helper method for calculating tag relevance
recommendationInteractionSchema.methods.calculateTagRelevance = function () {
  if (!this.tags || !this.metadata?.tagRelevance?.matchedTags) {
    return 0;
  }
  const overlap = this.tags.filter((t) =>
    this.metadata.tagRelevance.matchedTags.includes(t)
  ).length;
  return (
    overlap /
    Math.max(this.tags.length, this.metadata.tagRelevance.matchedTags.length)
  );
};

const RecommendationInteraction = mongoose.model(
  "RecommendationInteraction",
  recommendationInteractionSchema
);

export default RecommendationInteraction;
