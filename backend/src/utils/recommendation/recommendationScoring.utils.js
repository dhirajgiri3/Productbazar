// file: backend/Utils/recommendationScoring.utils.js
import mongoose from "mongoose";
import { generateScoreExplanation } from "../data/generateExplanation.js";
import { SCORING_CONSTANTS } from "../constants/scoring/scoring.constants.js";
import logger from "../logging/logger.js";

// Helper function to get similarity features between two products
const getSimilarityFeatures = (sourceProduct, targetProduct) => {
  if (!sourceProduct || !targetProduct)
    return { commonTags: [], sameCategory: false, sameMaker: false };

  return {
    commonTags:
      sourceProduct.tags?.filter((tag) => targetProduct.tags?.includes(tag)) ||
      [],
    sameCategory:
      sourceProduct.category?._id?.toString() ===
      targetProduct.category?._id?.toString(),
    sameMaker:
      sourceProduct.maker?._id?.toString() ===
      targetProduct.maker?._id?.toString(),
  };
};

/**
 * Calculate base engagement score from views, upvotes, bookmarks, and comments
 */
export const calculateEngagementScore = (product) => {
  if (!product) return 0;

  const views = product.views?.count || 0;
  const upvotes = product.upvoteCount || 0;
  const bookmarks = product.bookmarkCount || 0; // Use the virtual field
  const comments = product.comments?.length || product.commentCount || 0;

  const viewScore =
    views > 0 ? Math.log10(views) * SCORING_CONSTANTS.viewsWeight : 0;
  const upvoteScore =
    upvotes > 0 ? Math.log10(1 + upvotes) * SCORING_CONSTANTS.upvotesWeight : 0;
  const bookmarkScore =
    bookmarks > 0
      ? Math.log10(1 + bookmarks) * SCORING_CONSTANTS.bookmarkWeight
      : 0;
  const commentScore =
    comments > 0
      ? Math.log10(1 + comments) * SCORING_CONSTANTS.commentWeight
      : 0;

  return viewScore + upvoteScore + bookmarkScore + commentScore;
};

/**
 * Calculate recency score (higher for newer products)
 */
export const calculateRecencyScore = (createdAt, options = {}) => {
  if (!createdAt) return 0;

  const { maxAgeDays = 90, recentDaysBoost = 7 } = options;
  const now = new Date();
  const ageInDays = Math.max(
    0,
    (now - new Date(createdAt)) / (1000 * 60 * 60 * 24)
  );

  // Higher score for very recent items (last week)
  if (ageInDays <= recentDaysBoost) {
    return SCORING_CONSTANTS.recencyWeight * (1 - ageInDays / recentDaysBoost);
  }

  // Linear decay for older items
  return (
    SCORING_CONSTANTS.recencyWeight *
    0.5 *
    Math.max(0, 1 - ageInDays / maxAgeDays)
  );
};

/**
 * Normalize score to 0-1 range with improved differentiation
 */
export const normalizeScore = (score) => {
  if (score <= 0) return 0.01;

  // Use a less aggressive sigmoid curve that maintains more differentiation
  // This function will map scores while preserving more of their relative differences
  const normalizedScore = 0.1 + 0.9 * (1 - 1 / (1 + Math.pow(score/3, 0.8)));

  // Add slight random jitter to prevent identical scores (max 1% variation)
  return normalizedScore * (0.995 + Math.random() * 0.01);
};

/**
 * Calculate psychological factors for recommendation scoring
 */
export const calculatePsychologicalFactors = (product, userContext = {}) => {
  const { timeContext = {} } = userContext;
  let multiplier = 1.0;

  const hour = timeContext.hour ?? new Date().getHours();
  if (hour >= 8 && hour <= 22) multiplier *= SCORING_CONSTANTS.peakHoursBoost;

  const isWeekend =
    timeContext.isWeekend ?? [0, 6].includes(new Date().getDay());
  if (isWeekend) multiplier *= SCORING_CONSTANTS.weekendBoost;

  const season = timeContext.season || getSeason();
  if (season === "spring" || season === "fall")
    multiplier *= SCORING_CONSTANTS.seasonalBoost;

  const categoryName = product?.category?.name?.toLowerCase() || "";
  if (categoryName) {
    if (
      hour >= 8 &&
      hour <= 12 &&
      ["tech", "productivity", "software"].some((k) => categoryName.includes(k))
    ) {
      multiplier *= 1.2;
    }
    if (
      hour >= 18 &&
      hour <= 23 &&
      ["entertainment", "game", "media"].some((k) => categoryName.includes(k))
    ) {
      multiplier *= 1.3;
    }
    if (
      isWeekend &&
      ["creative", "art", "craft", "hobby"].some((k) =>
        categoryName.includes(k)
      )
    ) {
      multiplier *= 1.25;
    }
    if (
      !isWeekend &&
      hour >= 9 &&
      hour <= 17 &&
      ["business", "professional", "enterprise"].some((k) =>
        categoryName.includes(k)
      )
    ) {
      multiplier *= 1.3;
    }
    if (
      (season === "winter" &&
        ["cozy", "indoor"].some((k) => categoryName.includes(k))) ||
      (season === "summer" &&
        ["outdoor", "travel"].some((k) => categoryName.includes(k)))
    ) {
      multiplier *= 1.2;
    }
  }

  if (userContext.sessionContext) {
    const { sessionDuration, lastAction, deviceType } =
      userContext.sessionContext;
    if (
      deviceType === "mobile" &&
      ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19))
    ) {
      multiplier *= 1.15;
    }
    if (sessionDuration > 10 * 60) multiplier *= 1.1;
    if (["search", "category_browse"].includes(lastAction)) multiplier *= 1.1;
  }

  return multiplier;
};

/**
 * Calculate trending score based on recent engagement
 */
export const calculateTrendingScore = (product, options = {}) => {
  if (!product) return 0;

  const { recentDays = 7, timeContext = {} } = options;
  const now = new Date();
  const recentDate = new Date(now.getTime() - recentDays * 24 * 60 * 60 * 1000);

  // Extract recent engagement metrics
  const totalViews = product.views?.count || 0;
  const recentViews = product.views?.recentCount || Math.round(totalViews * 0.5); // Fallback if recentCount not available
  
  // Use upvoteCount directly if available, or fallback to upvotes array
  const totalUpvotes = product.upvoteCount || (product.upvotes?.length || 0);
  const recentUpvotes = product.upvotes?.filter(
    (u) => new Date(u.createdAt) >= recentDate
  ).length || Math.round(totalUpvotes * 0.3); // Estimate if filtering not possible
  
  // Use commentCount directly if available, or fallback to comments array
  const totalComments = product.commentCount || (product.comments?.length || 0);
  const recentComments = product.comments?.filter(
    (c) => new Date(c.createdAt) >= recentDate
  ).length || Math.round(totalComments * 0.3); // Estimate if filtering not possible
  
  // Get bookmarks for additional signal
  const totalBookmarks = product.bookmarkCount || 0;

  // Calculate velocity metrics (engagement per day)
  const daysWindow = Math.max(1, recentDays);
  const viewsPerDay = recentViews / daysWindow;
  const upvotesPerDay = recentUpvotes / daysWindow;
  const commentsPerDay = recentComments / daysWindow;
  
  // Calculate engagement acceleration (comparing recent to historical)
  const viewsAcceleration = totalViews > 0 ? (recentViews / totalViews) * daysWindow : 0;
  const upvotesAcceleration = totalUpvotes > 0 ? (recentUpvotes / totalUpvotes) * daysWindow : 0;
  const commentsAcceleration = totalComments > 0 ? (recentComments / totalComments) * daysWindow : 0;
  
  // Calculate engagement growth factor (boosting products with accelerating metrics)
  const accelerationFactor = (viewsAcceleration + upvotesAcceleration + commentsAcceleration) / 3;
  const growthBoost = Math.min(2.0, 1.0 + accelerationFactor);

  // Calculate base trending score with velocity components
  let trendingScore =
    viewsPerDay * SCORING_CONSTANTS.viewsTrendingWeight +
    upvotesPerDay * SCORING_CONSTANTS.upvotesTrendingWeight * 1.5 + // Increase upvote importance
    commentsPerDay * SCORING_CONSTANTS.commentsTrendingWeight +
    (totalBookmarks / daysWindow) * SCORING_CONSTANTS.bookmarkWeight;

  // Boost brand new products
  const ageInDays = (now - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
  
  // Apply recency boost with a curve that decays over time
  let recencyBoost = 1.0;
  if (ageInDays <= 3) {
    recencyBoost = 1.5; // Significant boost for very new products (0-3 days)
  } else if (ageInDays <= 7) {
    recencyBoost = 1.3; // Good boost for products less than a week old
  } else if (ageInDays <= 14) {
    recencyBoost = 1.1; // Slight boost for products less than two weeks old
  }
  
  // Apply growth boost based on acceleration factor
  trendingScore *= recencyBoost * growthBoost;
  
  // Apply a quality floor to ensure minimum engagement
  const minQualityThreshold = 0.05;
  if (trendingScore < minQualityThreshold && (totalViews < 5 || totalUpvotes < 2)) {
    trendingScore *= 0.5; // Reduce score for products with very low engagement
  }

  // Normalize score to 0-1 range
  const normalizedScore = Math.min(
    1,
    trendingScore / SCORING_CONSTANTS.trendingNormalizationFactor
  );

  return normalizedScore;
};

/**
 * Calculate similarity score for similar products
 */
export const calculateSimilarityScore = (
  product,
  similarToProduct = {},
  userPreferences = {}
) => {
  if (!product) return 0;

  // Calculate base engagement and recency
  const baseEngagementScore = calculateEngagementScore(product) * 0.3;
  const baseRecencyScore = calculateRecencyScore(product.createdAt) * 0.2;
  let similarityScore = baseEngagementScore + baseRecencyScore;

  // If we have a source product, evaluate similarity
  if (similarToProduct._id) {
    const { commonTags, sameCategory, sameMaker } = getSimilarityFeatures(
      similarToProduct,
      product
    );

    // Tag similarity (primary factor)
    const tagSimilarity = commonTags.length
      ? commonTags.length / Math.max(
          1,
          Math.max(
            (similarToProduct.tags || []).length,
            (product.tags || []).length
          )
        )
      : 0;

    similarityScore += tagSimilarity * SCORING_CONSTANTS.tagSimilarityWeight;

    // Category match
    if (sameCategory) {
      similarityScore += SCORING_CONSTANTS.categorySimilarityWeight;
    }

    // Maker match
    if (sameMaker) {
      similarityScore += SCORING_CONSTANTS.makerSimilarityWeight;
    }

    // Penalize identical products
    if (similarToProduct._id.toString() === product._id.toString()) {
      similarityScore *= 0.01; // Effectively exclude
    }
  }

  // Include user preferences if available
  if (userPreferences.categories?.length) {
    const categoryMatch = userPreferences.categories.find(
      (c) => c.category?.toString() === product.category?._id?.toString()
    );
    if (categoryMatch) {
      similarityScore += categoryMatch.score * 0.2; // Smaller weight than direct similarity
    }
  }

  return Math.min(1, Math.max(0, similarityScore));
};

/**
 * Calculate personalized score based on user preferences and history
 */
export const calculatePersonalizedScore = (product, options = {}) => {
  if (!product) return 0;

  const { userPreferences = {}, userHistory = {}, timeContext = {} } = options;
  let score = 0;

  // Base engagement and recency scores
  const baseEngagementScore = calculateEngagementScore(product);
  const baseRecencyScore = calculateRecencyScore(product.createdAt);
  score += baseEngagementScore * 0.3 + baseRecencyScore * 0.2;

  // Category preferences
  const categoryMatch = userPreferences.categories?.find(
    (c) => c.category?.toString() === product.category?._id?.toString()
  );
  if (categoryMatch) {
    score += categoryMatch.score * SCORING_CONSTANTS.categoryPreferenceWeight;
  }

  // Tag preferences
  const tagMatches = product.tags?.filter((tag) =>
    userPreferences.tags?.some(
      (t) => (t.tag || t).toLowerCase() === tag.toLowerCase()
    )
  );
  if (tagMatches?.length) {
    score +=
      (tagMatches.length / Math.max(1, product.tags.length)) *
      SCORING_CONSTANTS.tagPreferenceWeight;
  }

  // Recent view history (avoid showing too similar items)
  const recentViewIds = userHistory.recentViews?.map((p) => p._id.toString()) || [];
  if (recentViewIds.includes(product._id.toString())) {
    score *= 0.2; // Significantly lower score for recently viewed items
  }

  // Recently viewed categories (temporal boost)
  const recentCatIds = userHistory.recentCategories?.map((c) => c.category) || [];
  if (recentCatIds.includes(product.category?._id?.toString())) {
    score *= 1.5; // Boost for active category interests
  }

  // Time of day adjustments
  if (timeContext.isWeekend && product.category?.name?.toLowerCase().includes("hobby")) {
    score *= 1.2; // Boost hobby products on weekends
  }

  // Temporal decay for user preferences (prefer recent interactions)
  const lastActivityMs = userHistory.lastActivityTime
    ? Date.now() - new Date(userHistory.lastActivityTime).getTime()
    : 0;
  if (lastActivityMs > 0) {
    const daysSinceActivity = lastActivityMs / (1000 * 60 * 60 * 24);
    // Apply stronger decay for longer inactivity
    if (daysSinceActivity > 30) {
      score *= 0.8;
    }
  }

  return Math.min(1, Math.max(0, score));
};

/**
 * Get current season
 */
export const getSeason = () => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  if (
    (month === 2 && day >= 1) ||
    month === 3 ||
    month === 4 ||
    (month === 5 && day < 1)
  )
    return "spring";
  if (
    (month === 5 && day >= 1) ||
    month === 6 ||
    month === 7 ||
    (month === 8 && day < 1)
  )
    return "summer";
  if (
    (month === 8 && day >= 1) ||
    month === 9 ||
    month === 10 ||
    (month === 11 && day < 1)
  )
    return "fall";
  return "winter";
};

/**
 * Calculate content quality score
 */
export const calculateContentQualityScore = (product) => {
  if (!product) return 0;

  const views = product.views?.count || 0;
  const upvotes = product.upvoteCount || 0;
  const bookmarks = product.bookmarkCount || 0; // Use the virtual field
  const comments = product.comments?.length || product.commentCount || 0;

  const upvoteRatio = views > 0 ? upvotes / views : 0;
  const bookmarkRatio = views > 0 ? bookmarks / views : 0;
  const commentRatio = views > 0 ? comments / views : 0;

  let qualityScore = 5;
  qualityScore += upvoteRatio * 20 + bookmarkRatio * 15 + commentRatio * 10;
  if (upvotes > 10) qualityScore += 1;
  if (upvotes > 50) qualityScore += 1;
  if (views > 1000) qualityScore += 0.5;
  if (views > 20 && upvotes === 0) qualityScore -= 2;

  return Math.max(0, Math.min(10, qualityScore));
};

/**
 * Calculate diversity score to prevent recommendation homogeneity
 */
export const calculateDiversityScore = (
  product,
  currentRecommendations = []
) => {
  if (!product || !currentRecommendations.length) return 1;

  const categoryId = product.category?._id?.toString();
  const categoryDiversity = categoryId
    ? Math.max(
        0.2,
        1 -
          currentRecommendations.filter(
            (r) => r.product?.category?._id?.toString() === categoryId
          ).length *
            0.2
      )
    : 1;

  const makerId = product.maker?._id?.toString();
  const makerDiversity = makerId
    ? Math.max(
        0.1,
        1 -
          currentRecommendations.filter(
            (r) => r.product?.maker?._id?.toString() === makerId
          ).length *
            0.3
      )
    : 1;

  let tagDiversity = 1;
  if (product.tags?.length) {
    const productTags = product.tags.map((t) => t.toLowerCase());
    const avgOverlap =
      currentRecommendations.reduce((sum, rec) => {
        const recTags = rec.product?.tags?.map((t) => t.toLowerCase()) || [];
        const overlap = productTags.filter((tag) =>
          recTags.includes(tag)
        ).length;
        return (
          sum +
          overlap / Math.max(1, Math.min(productTags.length, recTags.length))
        );
      }, 0) / currentRecommendations.length;
    tagDiversity = Math.max(0.3, 1 - avgOverlap);
  }

  return (
    categoryDiversity * SCORING_CONSTANTS.categoryDiversityFactor +
    makerDiversity * SCORING_CONSTANTS.makerDiversityFactor +
    tagDiversity *
      (1 -
        SCORING_CONSTANTS.categoryDiversityFactor -
        SCORING_CONSTANTS.makerDiversityFactor)
  );
};

/**
 * Fetch and score products
 */
export const fetchAndScoreProducts = async (
  query,
  context,
  limit,
  options = {}
) => {
  const {
    sort = { createdAt: -1 },
    offset = 0,
    includeScoreDetail = false,
    diversify = true,
    Model = mongoose.model("Product"),
  } = options;

  try {
    if (!query.status && !query["$or"]?.some((clause) => clause.status))
      query.status = "Published";

    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: "views",
          let: { productId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$product", "$$productId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 100 },
          ],
          as: "viewsData",
        },
      },
      {
        $lookup: {
          from: "upvotes",
          let: { productId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$product", "$$productId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 100 },
          ],
          as: "upvoteData",
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { productId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$product", "$$productId"] } } },
            { $count: "count" },
          ],
          as: "commentData",
        },
      },
      {
        $lookup: {
          from: "bookmarks",
          let: { productId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$product", "$$productId"] } } },
            { $count: "count" }
          ],
          as: "bookmarkData"
        }
      },
      {
        $addFields: {
          bookmarkCount: { $ifNull: [{ $arrayElemAt: ["$bookmarkData.count", 0] }, 0] }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "maker",
          foreignField: "_id",
          as: "makerData",
        },
      },
      {
        $addFields: {
          views: {
            count: { $size: "$viewsData" },
            unique: { $size: { $setUnion: ["$viewsData.user"] } },
            history: "$viewsData",
          },
          upvoteCount: { $size: "$upvoteData" },
          commentCount: {
            $cond: {
              if: { $gt: [{ $size: "$commentData" }, 0] },
              then: { $arrayElemAt: ["$commentData.count", 0] },
              else: 0,
            },
          },
          category: { $arrayElemAt: ["$categoryData", 0] },
          maker: { $arrayElemAt: ["$makerData", 0] },
        },
      },
      {
        $project: {
          name: 1,
          tagline: 1,
          slug: 1,
          thumbnail: 1,
          description: 1,
          category: { _id: 1, name: 1, slug: 1 },
          maker: { _id: 1, firstName: 1, lastName: 1, profilePicture: 1 },
          tags: 1,
          views: 1,
          upvoteCount: 1,
          commentCount: 1,
          bookmarkCount: 1, // Include the calculated bookmark count
          bookmarks: 1,
          createdAt: 1,
          status: 1,
          launchedAt: 1,
          parentCategory: 1,
        },
      },
      { $sort: sort },
      { $skip: offset },
      { $limit: Math.max(limit * 3, 50) },
    ];

    const products = await Model.aggregate(pipeline);
    if (!products.length) return [];

    const scoredProducts = products
      .map((product) => {
        if (!product) return null;

        const scoreDetail = includeScoreDetail
          ? {
              base: 0,
              engagement: 0,
              recency: 0,
              similarity: 0,
              psychological: 0,
              diversity: 0,
              quality: 0,
              penalty: 0,
              explanation: "",
            }
          : null;
        let score;

        switch (context.reason) {
          case "trending":
            score = calculateTrendingScore(product, {
              recentDays: 7,
              timeContext: context.timeContext,
            });
            if (scoreDetail) scoreDetail.base = scoreDetail.engagement = score;
            break;
          case "new":
            score =
              calculateRecencyScore(product.createdAt, 14) * 2 +
              calculateEngagementScore(product) * 0.3;
            if (scoreDetail) {
              scoreDetail.recency =
                calculateRecencyScore(product.createdAt, 14) * 2;
              scoreDetail.engagement = calculateEngagementScore(product) * 0.3;
              scoreDetail.base = score;
            }
            break;
          case "similar":
            if (context.similarToProduct) {
              const similarity = getSimilarityFeatures(
                context.similarToProduct,
                product
              );
              score =
                similarity.commonTags.length * SCORING_CONSTANTS.tagMatch +
                (similarity.sameCategory
                  ? SCORING_CONSTANTS.categoryMatch
                  : 0) +
                calculateEngagementScore(product) * 0.3;
              if (scoreDetail) {
                scoreDetail.similarity =
                  similarity.commonTags.length * SCORING_CONSTANTS.tagMatch +
                  (similarity.sameCategory
                    ? SCORING_CONSTANTS.categoryMatch
                    : 0);
                scoreDetail.engagement =
                  calculateEngagementScore(product) * 0.3;
                scoreDetail.base = score;
              }
            } else {
              score = calculateEngagementScore(product);
              if (scoreDetail)
                scoreDetail.base = scoreDetail.engagement = score;
            }
            break;
          case "category":
            score = calculateEngagementScore(product) * 1.2;
            if (scoreDetail) scoreDetail.base = scoreDetail.engagement = score;
            break;
          case "tag":
            score =
              (context.tags?.filter((t) => product.tags?.includes(t)).length ||
                0) *
                SCORING_CONSTANTS.tagMatch +
              calculateEngagementScore(product) * 0.5;
            if (scoreDetail) {
              scoreDetail.similarity =
                (context.tags?.filter((t) => product.tags?.includes(t))
                  .length || 0) * SCORING_CONSTANTS.tagMatch;
              scoreDetail.engagement = calculateEngagementScore(product) * 0.5;
              scoreDetail.base = score;
            }
            break;
          case "personalized":
            score = calculatePersonalizedScore(product, {
              userPreferences: context.userContext?.preferences || {},
              userHistory: context.userContext?.history || [],
              timeContext: context.timeContext,
            });
            if (scoreDetail) scoreDetail.base = score;
            break;
          default:
            score =
              (calculateEngagementScore(product) +
                calculateRecencyScore(product.createdAt) * 0.8) *
              calculatePsychologicalFactors(product, {
                timeContext: context.timeContext,
              });
            if (scoreDetail) {
              scoreDetail.engagement = calculateEngagementScore(product);
              scoreDetail.recency =
                calculateRecencyScore(product.createdAt) * 0.8;
              scoreDetail.psychological = calculatePsychologicalFactors(
                product,
                { timeContext: context.timeContext }
              );
              scoreDetail.base = score;
            }
            break;
        }

        const qualityScore = calculateContentQualityScore(product);
        score *= 0.8 + qualityScore / 50;
        if (scoreDetail) scoreDetail.quality = qualityScore;

        if (diversify && context.currentRecommendations?.length) {
          const diversityScore = calculateDiversityScore(
            product,
            context.currentRecommendations
          );
          score *= diversityScore;
          if (scoreDetail) scoreDetail.diversity = diversityScore;
        }

        score *= SCORING_CONSTANTS.typeMultipliers[context.reason] || 1;
        const normalizedScore = normalizeScore(score);

        // Use the imported generateScoreExplanation directly
        const explanation = generateScoreExplanation(
          product,
          context,
          normalizedScore
        );

        return {
          product,
          score: normalizedScore,
          rawScore: score,
          reason: context.reason || "recommendation",
          explanation, // Use the imported function's result
          ...(includeScoreDetail && { scoreDetail }),
          ...(context.similarToProduct && {
            similarityFeatures: getSimilarityFeatures(
              context.similarToProduct,
              product
            ),
          }),
        };
      })
      .filter(Boolean);

    return scoredProducts.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    logger.error(`Error in fetchAndScoreProducts: ${error.message}`);
    return [];
  }
};

/**
 * Get strategy weight for normalization
 */
export const getStrategyWeight = (strategy) =>
  SCORING_CONSTANTS.typeMultipliers[strategy] || 1;
