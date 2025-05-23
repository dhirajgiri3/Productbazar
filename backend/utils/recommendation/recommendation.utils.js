// file: recommendation.utils.js
import mongoose from "mongoose";
import Product from "../../models/product/product.model.js";
import { getTimeOfDay, getSeason } from "../formatting/time.utils.js";
import {
  calculatePsychologicalFactors,
  calculateEngagementScore,
  calculateRecencyScore,
  calculateTrendingScore,
  calculateSimilarityScore,
  calculatePersonalizedScore,
  normalizeScore,
} from "./recommendationScoring.utils.js";
import recommendationCacheService from "../../services/recommendation/recommendationCache.service.js";
import logger from "../logging/logger.js";
import { buildAggregationPipeline } from "./recommendationPipelines.js";
import { generateScoreExplanation } from "../data/generateExplanation.js";

const validate = {
  id: (id, name = "ID") => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`Invalid ${name}: ${id}`);
      return null;
    }
    return new mongoose.Types.ObjectId(id);
  },
  options: (options = {}) => {
    const defaults = {
      limit: 10,
      offset: 0,
      days: 7,
      sort: { createdAt: -1 },
      includeDetails: false,
      minQualityScore: 0.1,
      context: {},
      sessionId: null,
      productId: null,
      categoryId: null,
      tags: [],
      makerId: null,
    };
    const opts = { ...defaults, ...options };
    opts.limit = Math.min(Math.max(1, parseInt(opts.limit)), 100);
    opts.offset = Math.max(0, parseInt(opts.offset));
    opts.days = Math.min(Math.max(1, parseInt(opts.days)), 90);
    opts.tags = Array.isArray(opts.tags)
      ? opts.tags.filter((tag) => typeof tag === "string")
      : [];
    opts.productId = opts.productId
      ? validate.id(opts.productId, "Product ID")
      : null;
    opts.categoryId = opts.categoryId
      ? validate.id(opts.categoryId, "Category ID")
      : null;
    opts.makerId = opts.makerId ? validate.id(opts.makerId, "Maker ID") : null;
    return opts;
  },
};

export const buildTimeContext = () => {
  const now = new Date();
  return {
    hour: now.getHours(),
    day: now.getDay(),
    date: now.getDate(),
    month: now.getMonth(),
    year: now.getFullYear(),
    isWeekend: [0, 6].includes(now.getDay()),
    isBusinessHours: now.getHours() >= 9 && now.getHours() < 18,
    timeOfDay: getTimeOfDay(),
    season: getSeason(),
    timestamp: now.getTime(),
  };
};

export const fetchAndScoreProducts = async (
  query,
  context,
  limit,
  options = {}
) => {
  const {
    sort = { createdAt: -1 },
    offset = 0,
    days,
  } = validate.options(options);
  const fetchLimit = Math.max(limit * 2, 20);

  // Ensure we always fetch only published products
  const finalQuery = { ...query, status: "Published" };

  // Add a default date range if not specified
  if (!finalQuery.createdAt || finalQuery.createdAt.$gte === null) {
    const defaultDays = context.reason === "trending" ? days || 30 : days || 14;
    finalQuery.createdAt = {
      $gte: new Date(Date.now() - defaultDays * 24 * 60 * 60 * 1000),
    };
  }

  // Add lookup for bookmark count
  const pipeline = buildAggregationPipeline({
    match: finalQuery, // Use finalQuery to ensure published status
    sort,
    skip: offset,
    limit: fetchLimit,
  });

  // Add lookup for bookmark count
  pipeline.splice(1, 0, {
    $lookup: {
      from: "bookmarks",
      let: { productId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$product", "$$productId"] } } },
        { $count: "count" }
      ],
      as: "bookmarkData"
    }
  });

  // Add field for bookmark count
  pipeline.splice(2, 0, {
    $addFields: {
      bookmarkCount: { $ifNull: [{ $arrayElemAt: ["$bookmarkData.count", 0] }, 0] }
    }
  });

  try {
    const products = await Product.aggregate(pipeline);
    if (!products.length) return [];

    const scoredProducts = products
      .map((product) => {
        const timeContext = context.timeContext || buildTimeContext();
        let score;
        switch (context.reason) {
          case "trending":
            score = calculateTrendingScore(product, {
              recentDays: days || 7,
              timeContext,
            });
            break;
          case "new":
            score =
              calculateRecencyScore(product.createdAt) +
              calculateEngagementScore(product) * 0.8;
            break;
          case "similar":
          case "category":
          case "tag":
          case "maker":
            score = calculateSimilarityScore(
              product,
              context.similarToProduct || {},
              context.userPreferences || {}
            );
            break;
          case "personalized":
            score = calculatePersonalizedScore(product, {
              userPreferences: context.userPreferences || {},
              userHistory: context.userHistory || {},
              timeContext,
            });
            break;
          default:
            score =
              calculateEngagementScore(product) +
              calculateRecencyScore(product.createdAt) * 0.8;
        }
        const psychMultiplier = calculatePsychologicalFactors(product, {
          timeContext,
        });
        const finalScore = Math.max(
          0.1,
          score * Math.max(0.1, psychMultiplier)
        );

        return {
          product: product._id,
          score: normalizeScore(finalScore),
          reason: context.reason || "general",
          explanationText: generateScoreExplanation(
            product,
            context,
            finalScore
          ),
          productData: product,
        };
      })
      .sort((a, b) => b.score - a.score);

    return scoredProducts.slice(0, limit);
  } catch (error) {
    logger.error(`Error in fetchAndScoreProducts: ${error.message}`);
    return [];
  }
};

export const diversifyResults = (results, limit) => {
  if (!results?.length || results.length <= limit) return results;

  const seenCategories = new Set();
  const diversified = [];
  for (const result of results.sort((a, b) => b.score - a.score)) {
    const categoryId = result.productData?.category?._id?.toString();
    if (!seenCategories.has(categoryId) || diversified.length < limit) {
      diversified.push(result);
      if (categoryId) seenCategories.add(categoryId);
    }
    if (diversified.length >= limit) break;
  }
  return diversified;
};

export const createRecommendationItem = (productData, context, score) => {
  if (!productData?._id) {
    logger.warn("Invalid product data for recommendation item");
    return null;
  }

  // Normalize score to 0-100 scale
  const normalizedScore = normalizeScore(parseFloat(score) || 1.0);
  const productId = productData._id.toString();

  // Use provided explanation text or generate one
  const explanationText = context.explanationText ||
    generateScoreExplanation(productData, context, normalizedScore) ||
    "Recommended for you";

  // Use provided score context or generate one
  const scoreContext = context.scoreContext || (() => {
    switch(context.reason) {
      case "trending":
        return `Popularity: ${normalizedScore.toFixed(4)} - Based on recent engagement`;
      case "personalized":
        return `Relevance: ${normalizedScore.toFixed(4)} - Matched to your interests`;
      case "new":
        return `Freshness: ${normalizedScore.toFixed(4)} - Recently launched`;
      case "similar":
        return `Similarity: ${normalizedScore.toFixed(4)} - Related to items you've viewed`;
      case "backup":
        return `Discovery: ${normalizedScore.toFixed(4)} - Selected for exploration`;
      case "discovery":
        return `Discovery: ${normalizedScore.toFixed(4)} - Expanding your interests`;
      default:
        return `Relevance: ${normalizedScore.toFixed(4)}`;
    }
  })();

  // Determine if this is a time-sensitive recommendation
  const isTopTrending = context.reason === "trending" && normalizedScore > 0.85;
  const trendingSince = isTopTrending ?
    (context.trendingMetrics?.[productId]?.startTime || new Date()) :
    null;

  // Get time window from context or metrics
  const timeWindow = context.timeWindow ||
    (context.trendingMetrics?.[productId]?.timeWindow || "recent");

  return {
    product: productId,
    score: normalizedScore,
    reason: context.reason || "mixed",
    explanationText: explanationText,
    scoreContext: scoreContext,
    productData: {
      _id: productId,
      name: productData.name || "Unnamed Product",
      tagline: productData.tagline || "",
      slug: productData.slug || productId,
      thumbnail: productData.thumbnail || "",
      description: productData.description || "",
      category: productData.category
        ? {
            _id: productData.category._id,
            name: productData.category.name,
            slug: productData.category.slug,
          }
        : null,
      maker: productData.maker
        ? {
            _id: productData.maker._id,
            firstName: productData.maker.firstName,
            lastName: productData.maker.lastName,
            profilePicture: productData.maker.profilePicture,
          }
        : null,
      tags: Array.isArray(productData.tags) ? productData.tags : [],
      upvoteCount: productData.upvoteCount || 0,
      bookmarkCount: productData.bookmarkCount || 0,
      createdAt: productData.createdAt || new Date(),
    },
    metadata: {
      source: context.reason || "mixed",
      subSource: productData.source || context.subReason || null,
      generatedAt: new Date(),
      diversityFactors: context.diversityFactors || {},
      isTopTrending: isTopTrending,
      trendingSince: trendingSince,
      timeWindow: timeWindow,
    },
  };
};

export const getUserPreferences = async (userId, options = {}) => {
  const { refresh = false } = options;
  const cacheKey = `user_prefs:${userId}`;

  // Default preferences structure
  const defaultPreferences = {
    scores: {
      categories: {},
      tags: {}
    },
    dismissedProducts: [],
    viewedProducts: [],
    upvotedProducts: [],
    bookmarkedProducts: []
  };

  if (!refresh) {
    try {
      const cached = await recommendationCacheService.get(cacheKey);
      if (cached) {
        // Ensure cached data has the expected structure
        return {
          ...defaultPreferences,
          ...cached,
          scores: {
            ...defaultPreferences.scores,
            ...(cached.scores || {})
          }
        };
      }
    } catch (cacheError) {
      logger.warn(`Cache error for user preferences ${userId}: ${cacheError.message}`);
      // Continue to fetch from database
    }
  }

  try {
    const userIdObj = validate.id(userId, "User ID");
    if (!userIdObj) {
      logger.warn(`Invalid user ID: ${userId}, returning default preferences`);
      return defaultPreferences;
    }

    const Recommendation = mongoose.model("Recommendation");
    const rec = await Recommendation.findOne({ user: userIdObj })
      .select("categories tags dismissedProducts viewedProducts upvotedProducts bookmarkedProducts")
      .lean();

    if (!rec) {
      logger.info(`No recommendation record found for user ${userId}, returning default preferences`);
      return defaultPreferences;
    }

    // Safely extract categories and tags with error handling
    let categoryScores = {};
    let tagScores = {};

    try {
      if (Array.isArray(rec.categories)) {
        categoryScores = rec.categories.reduce(
          (acc, item) => {
            if (item && item.category && typeof item.score === 'number') {
              return { ...acc, [item.category.toString()]: item.score };
            }
            return acc;
          },
          {}
        );
      }
    } catch (categoryError) {
      logger.error(`Error processing categories for user ${userId}: ${categoryError.message}`);
    }

    try {
      if (Array.isArray(rec.tags)) {
        tagScores = rec.tags.reduce(
          (acc, item) => {
            if (item && item.tag && typeof item.score === 'number') {
              return { ...acc, [item.tag.toString().toLowerCase()]: item.score };
            }
            return acc;
          },
          {}
        );
      }
    } catch (tagError) {
      logger.error(`Error processing tags for user ${userId}: ${tagError.message}`);
    }

    // Build the preferences object with safe defaults
    const preferences = {
      ...defaultPreferences,
      scores: {
        categories: categoryScores,
        tags: tagScores
      },
      dismissedProducts: Array.isArray(rec.dismissedProducts) ? rec.dismissedProducts : [],
      viewedProducts: Array.isArray(rec.viewedProducts) ? rec.viewedProducts : [],
      upvotedProducts: Array.isArray(rec.upvotedProducts) ? rec.upvotedProducts : [],
      bookmarkedProducts: Array.isArray(rec.bookmarkedProducts) ? rec.bookmarkedProducts : []
    };

    // Cache the preferences
    try {
      await recommendationCacheService.set(cacheKey, preferences, 1800); // 30 min TTL
    } catch (setCacheError) {
      logger.warn(`Failed to cache preferences for user ${userId}: ${setCacheError.message}`);
    }

    return preferences;
  } catch (error) {
    logger.error(
      `Error fetching preferences for user ${userId}: ${error.message}`
    );
    return defaultPreferences;
  }
};

export {
  calculatePsychologicalFactors,
  calculateEngagementScore,
  calculateRecencyScore,
  calculateTrendingScore,
  calculateSimilarityScore,
  calculatePersonalizedScore,
  normalizeScore,
  validate,
};
