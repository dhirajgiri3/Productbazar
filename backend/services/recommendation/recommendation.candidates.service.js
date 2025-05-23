// file: recommendation.candidates.service.js
import mongoose from "mongoose";
import Product from "../../models/product/product.model.js";
import recommendationCacheService from "./recommendationCache.service.js";
import logger from "../../utils/logging/logger.js";
import { SCORING_CONSTANTS } from "../../utils/constants/scoring/scoring.constants.js";
import { buildAggregationPipeline } from "../../utils/recommendation/recommendationPipelines.js";
import {
  calculateEngagementScore,
  calculateTrendingScore,
  calculateRecencyScore,
  calculatePersonalizedScore,
  calculateSimilarityScore,
  normalizeScore,
  getUserPreferences,
} from "../../utils/recommendation/recommendation.utils.js";

// Generic fetchCandidates function to handle all candidate types
const fetchCandidates = async (type, config = {}) => {
  const {
    query,
    limit = 50,
    cacheTTL = 3600,
    scoreFn,
    sort = { createdAt: -1 },
    extraFields = {},
    postProcess,
  } = config;
  
  // Ensure we only fetch published products regardless of source
  const finalQuery = { ...query, status: "Published" };

  // Add a timestamp to the cache key to ensure we don't get stale data
  const cacheKey = `${type}:${JSON.stringify({ finalQuery, limit, sort })}:${Math.floor(
    Date.now() / 3600000
  )}`;

  // Log the query for debugging
  logger.debug(`Fetching ${type} candidates with query:`, {
    query: finalQuery,
    sort,
    limit,
    extraFields: Object.keys(extraFields)
  });

  try {
    // Try to get from cache first
    const cached = await recommendationCacheService.get(cacheKey);
    if (cached && cached.length > 0) {
      logger.debug(`Retrieved ${cached.length} ${type} candidates from cache`);
      return cached;
    }

    // Build the aggregation pipeline
    const pipeline = buildAggregationPipeline({
      match: finalQuery,
      extraFields,
      sort,
      limit: limit * 2, // Fetch extra for scoring/diversity
    });

    // Execute the query
    let candidates = await Product.aggregate(pipeline);

    // Log the raw results
    logger.debug(`Raw ${type} query returned ${candidates.length} products`);

    if (candidates.length === 0) {
      logger.warn(`No ${type} candidates found with query:`, { query, sort });
      return [];
    }

    // Apply scoring function if provided
    if (scoreFn) {
      try {
        candidates = candidates
          .map((c) => {
            try {
              const scoreResult = scoreFn(c);
              const score = typeof scoreResult === 'object' ? scoreResult.score : scoreResult;

              return {
                product: c._id,
                score: normalizeScore(score),
                reason: type,
                productData: c,
                // Include any additional data from the scoring function
                ...(typeof scoreResult === 'object' && {
                  scoreComponents: scoreResult.components,
                  rawScore: score
                })
              };
            } catch (scoreError) {
              logger.warn(`Error scoring ${type} candidate ${c._id}:`, scoreError);
              return {
                product: c._id,
                score: 0.5, // Default score if scoring fails
                reason: type,
                productData: c,
              };
            }
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      } catch (scoringError) {
        logger.error(`Error applying scoring function for ${type}:`, scoringError);
        // Fall back to no scoring
        candidates = candidates
          .map((c) => ({
            product: c._id,
            score: 1.0,
            reason: type,
            productData: c,
          }))
          .slice(0, limit);
      }
    } else {
      candidates = candidates
        .map((c) => ({
          product: c._id,
          score: 1.0, // Default score if no scoring function
          reason: type,
          productData: c,
        }))
        .slice(0, limit);
    }

    // Apply post-processing if provided
    if (postProcess && typeof postProcess === 'function') {
      try {
        candidates = postProcess(candidates);
      } catch (postProcessError) {
        logger.error(`Error in post-processing for ${type}:`, postProcessError);
      }
    }

    // Only cache if we have results
    if (candidates.length > 0) {
      await recommendationCacheService.set(cacheKey, candidates, cacheTTL);
      logger.debug(`Cached ${candidates.length} ${type} candidates`);
    }

    return candidates;
  } catch (error) {
    logger.error(`Error fetching ${type} candidates:`, {
      error: error.message,
      stack: error.stack,
      query,
      sort
    });
    return [];
  }
};

export const getTrendingCandidates = async (options = {}) => {
  const { limit = 50, days = 7, categoryId = null, debug = false, userId = null, excludeIds = [] } = options;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Log the cutoff date for debugging
  logger.debug(`Trending products cutoff date: ${cutoff.toISOString()}, days: ${days}`);

  // Build the query
  const query = {
    status: "Published", // Always ensure we only get published products
    createdAt: { $gte: cutoff },
    ...(categoryId &&
      mongoose.Types.ObjectId.isValid(categoryId) && {
        category: new mongoose.Types.ObjectId(categoryId),
      }),
    ...(excludeIds.length > 0 && {
      _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) }
    })
  };
  
  // Add extra fields to the pipeline for better scoring
  const extraFields = {
    // Add field to track engagement metrics
    engagementScore: {
      $add: [
        { $multiply: [{ $ifNull: ["$upvoteCount", 0] }, SCORING_CONSTANTS.upvotesWeight] },
        { $multiply: [{ $ifNull: [{ $ifNull: ["$views.count", 0] }, 0] }, SCORING_CONSTANTS.viewsWeight] },
        { $multiply: [{ $ifNull: ["$bookmarkCount", 0] }, SCORING_CONSTANTS.bookmarkWeight] },
        { $multiply: [{ $ifNull: ["$commentCount", 0] }, SCORING_CONSTANTS.commentWeight] }
      ]
    },
    // Add a field to estimate recent views
    recentViewsEstimate: {
      $multiply: [
        { $ifNull: [{ $ifNull: ["$views.count", 0] }, 0] },
        // Estimate that 30-50% of views are recent
        { $add: [0.3, { $multiply: [0.2, { $rand: {} }] }] }
      ]
    }
  };

  if (debug) {
    logger.debug(`Trending candidates query:`, { query, limit, days, extraFields: Object.keys(extraFields) });
  }

  // First try with the standard query and time window
  let candidates = await fetchCandidates("trending", {
    query,
    limit,
    extraFields,
    // Sort first by upvotes and views to prioritize engagement
    sort: { upvoteCount: -1, "views.count": -1, createdAt: -1 },
    scoreFn: (product) => {
      const score = calculateTrendingScore(product, { days });

      // Return both the score and components for analysis
      if (debug) {
        return {
          score,
          components: {
            views: product.views?.count || 0,
            recentViews: product.views?.recentCount || product.recentViewsEstimate || 0,
            upvotes: product.upvoteCount || 0,
            bookmarks: product.bookmarkCount || 0,
            comments: product.commentCount || 0,
            engagementScore: product.engagementScore || 0,
            ageInDays: (new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24)
          }
        };
      }

      return score;
    }
  });

  // If no results, try with an extended date range
  if (candidates.length === 0) {
    const extendedDays = days * 2;
    const extendedCutoff = new Date(Date.now() - extendedDays * 24 * 60 * 60 * 1000);
    logger.info(`No trending products found in last ${days} days, extending to ${extendedDays} days`);

    // Update the query with extended date range
    query.createdAt = { $gte: extendedCutoff };

    candidates = await fetchCandidates("trending", {
      query,
      limit,
      extraFields,
      sort: { upvoteCount: -1, "views.count": -1, createdAt: -1 },
      scoreFn: (product) => calculateTrendingScore(product, { days: extendedDays })
    });
  }

  // If still no results, try with a more relaxed query (no date filter)
  if (candidates.length === 0) {
    logger.info(`No trending products found with date filter, trying without date filter`);

    // Remove the date filter
    const relaxedQuery = { ...query };
    delete relaxedQuery.createdAt;

    candidates = await fetchCandidates("trending", {
      query: relaxedQuery,
      limit, 
      extraFields,
      // Sort by upvotes and views for trending without date filter
      sort: { upvoteCount: -1, "views.count": -1, createdAt: -1 },
      scoreFn: (product) => calculateTrendingScore(product, { days: 30 })
    });
  }

  // If we have candidates but need more diversity, check if user is specified
  if (candidates.length > 0 && candidates.length < limit && userId) {
    logger.debug(`Got ${candidates.length} trending products, adding diversity products`);
    
    // Get existing product IDs to exclude
    const existingIds = candidates.map(c => c.product.toString());
    
    // Get additional diverse products
    const diverseQuery = { 
      status: "Published",
      _id: { $nin: existingIds.map(id => new mongoose.Types.ObjectId(id)) }
    };
    
    const diverseCandidates = await fetchCandidates("trending_diverse", {
      query: diverseQuery,
      limit: limit - candidates.length,
      extraFields,
      sort: { upvoteCount: -1, "views.count": -1 },
      scoreFn: (product) => calculateTrendingScore(product, { days: 30 }) * 0.9 // Slightly lower score
    });
    
    // Append diverse candidates
    candidates = [...candidates, ...diverseCandidates];
  }

  // Log the result
  logger.debug(`getTrendingCandidates found ${candidates.length} products`);

  // Ensure scores are properly differentiated and randomized slightly for diversity
  return candidates.map((c, index) => ({
    ...c,
    // Keep original score for reference
    rawScore: c.score,
    // Apply a small diversity factor based on index position
    score: c.score * (1 - (index * 0.01)) * (0.97 + Math.random() * 0.06)
  }));
};

export const getNewCandidates = async (options = {}) => {
  const { 
    limit = 50, 
    days = 14, 
    minQualityScore = 0, 
    userId = null,
    categoryId = null,
    excludeIds = []
  } = options;
  
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Log the cutoff date for debugging
  logger.debug(`New products cutoff date: ${cutoff.toISOString()}, days: ${days}`);

  // Build the base query
  const query = { 
    status: "Published", // Always ensure we only get published products
    createdAt: { $gte: cutoff },
    ...(excludeIds.length > 0 && {
      _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) }
    })
  };
  
  // Add category filter if specified
  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    query.category = new mongoose.Types.ObjectId(categoryId);
  }

  // Define extra fields for aggregation
  const extraFields = {
    qualityScore: {
      $add: [
        { $multiply: [{ $ifNull: ["$upvoteCount", 0] }, SCORING_CONSTANTS.upvotesWeight * 0.1] },
        { $multiply: [{ $ifNull: [{ $ifNull: ["$views.count", 0] }, 0] }, SCORING_CONSTANTS.viewsWeight * 0.1] },
        { $multiply: [{ $ifNull: ["$bookmarkCount", 0] }, SCORING_CONSTANTS.bookmarkWeight * 0.1] },
        { $multiply: [{ $ifNull: ["$commentCount", 0] }, SCORING_CONSTANTS.commentWeight * 0.1] }
      ],
    },
    // Calculate days since creation for better sorting
    daysSinceCreation: {
      $divide: [
        { $subtract: [new Date(), "$createdAt"] },
        1000 * 60 * 60 * 24 // Convert ms to days
      ]
    }
  };

  // First attempt: Get new products with good quality score
  let candidates = await fetchCandidates("new", {
    query: { ...query },
    limit,
    extraFields,
    // Sort primarily by creation date, but factor in quality
    sort: { createdAt: -1, qualityScore: -1 },
    scoreFn: (product) => {
      // Balance recency (70%) with engagement (30%)
      const recencyScore = calculateRecencyScore(product.createdAt, {
        maxAgeDays: days,
        recentDaysBoost: 3 // Boost products from last 3 days
      });
      
      const engagementScore = calculateEngagementScore(product);
      
      // Calculate days since creation (for exponential recency decay)
      const daysSinceCreation = product.daysSinceCreation || 
        (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      
      // Exponential decay based on days since creation (favors very new products)
      const recencyFactor = Math.exp(-0.15 * daysSinceCreation);
      
      // Combined score (70% recency, 30% engagement)
      return (recencyScore * 0.7 * recencyFactor) + (engagementScore * 0.3);
    }
  });

  // If no results, try again without the quality score filter
  if (candidates.length === 0) {
    logger.info(`No new products found with quality score filter, trying without filter`);
    candidates = await fetchCandidates("new", {
      query,
      limit,
      extraFields,
      sort: { createdAt: -1 },
      scoreFn: (product) => {
        const recencyScore = calculateRecencyScore(product.createdAt, { maxAgeDays: days });
        const engagementScore = calculateEngagementScore(product);
        
        // Calculate days since creation (for exponential recency decay)
        const daysSinceCreation = product.daysSinceCreation || 
          (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        
        // Exponential decay based on days since creation (favors very new products)
        const recencyFactor = Math.exp(-0.15 * daysSinceCreation);
        
        return (recencyScore * recencyFactor) + (engagementScore * 0.3);
      }
    });
  }

  // If still no results, extend the date range
  if (candidates.length === 0) {
    const extendedDays = days * 2;
    const extendedCutoff = new Date(Date.now() - extendedDays * 24 * 60 * 60 * 1000);
    logger.info(`No new products found in last ${days} days, extending to ${extendedDays} days`);

    // Update the query with extended date range
    const extendedQuery = { ...query, createdAt: { $gte: extendedCutoff } };
    
    candidates = await fetchCandidates("new", {
      query: extendedQuery,
      limit,
      extraFields,
      sort: { createdAt: -1 },
      scoreFn: (product) => {
        const recencyScore = calculateRecencyScore(product.createdAt, { maxAgeDays: extendedDays });
        const engagementScore = calculateEngagementScore(product);
        return recencyScore + engagementScore * 0.3;
      }
    });
  }

  // If we have candidates but need more diversity, check if user is specified
  if (candidates.length > 0 && candidates.length < limit && userId) {
    logger.debug(`Got ${candidates.length} new products, adding diversity products`);
    
    // Get existing product IDs to exclude
    const existingIds = candidates.map(c => c.product.toString());
    
    // Get additional diverse products with good engagement
    const diverseQuery = { 
      status: "Published",
      _id: { $nin: existingIds.map(id => new mongoose.Types.ObjectId(id)) }
    };
    
    const diverseCandidates = await fetchCandidates("new_diverse", {
      query: diverseQuery,
      limit: limit - candidates.length,
      extraFields,
      // For diverse candidates, prioritize a mix of recency and engagement
      sort: { upvoteCount: -1, "views.count": -1, createdAt: -1 },
      scoreFn: (product) => {
        const recencyScore = calculateRecencyScore(product.createdAt);
        const engagementScore = calculateEngagementScore(product);
        // Give more weight to engagement for diversity products
        return (recencyScore * 0.4) + (engagementScore * 0.6);
      }
    });
    
    // Append diverse candidates
    candidates = [...candidates, ...diverseCandidates];
  }

  // Log the result
  logger.debug(`getNewCandidates found ${candidates.length} products`);

  // Apply a small random factor to diversify results
  return candidates.map((c, index) => ({
    ...c,
    // Add a small random factor for diversity while maintaining general ordering
    score: c.score * (0.98 + Math.random() * 0.04)
  }));
};

export const getPersonalizedCandidates = async (userId, options = {}) => {
  const { limit = 50, context = {} } = options;

  const preferences = await getUserPreferences(userId);
  // Ensure preferences object has the expected structure with defaults
  const safePreferences = {
    dismissedProducts: [],
    scores: {
      categories: {},
      tags: {}
    },
    ...preferences
  };

  // Build base query with null checks
  const query = {
    // Only add dismissed products filter if there are any
    ...(safePreferences.dismissedProducts?.length > 0 && {
      _id: {
        $nin: safePreferences.dismissedProducts.map(
          id => new mongoose.Types.ObjectId(id)
        )
      }
    })
  };

  // Get category and tag filters if available
  const categoryIds = Object.keys(safePreferences.scores.categories || {});
  const tags = Object.keys(safePreferences.scores.tags || {});

  // Only add $or clause if we have categories or tags to filter by
  if (categoryIds.length > 0 || tags.length > 0) {
    query.$or = [
      ...(categoryIds.length > 0 ? [{
        category: {
          $in: categoryIds.map(id => new mongoose.Types.ObjectId(id))
        }
      }] : []),
      ...(tags.length > 0 ? [{ tags: { $in: tags } }] : [])
    ];
  }

  return fetchCandidates("personalized", {
    query,
    limit,
    scoreFn: (product) => calculatePersonalizedScore(product, {
      userPreferences: safePreferences,
      ...context
    })
  });
};

export const getDiscoveryCandidates = async (options = {}) => {
  const { limit = 20, userId, context = {} } = options;
  const requestLimit = Math.ceil(limit * 3);

  const strategies = [
    {
      name: "trending-new",
      query: {
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      sort: { upvoteCount: -1 },
      count: Math.floor(requestLimit * 0.3),
    },
    {
      name: "highly-rated",
      query: { upvoteCount: { $gte: 3 } },
      sort: { upvoteCount: -1, createdAt: -1 },
      count: Math.floor(requestLimit * 0.3),
    },
    {
      name: "serendipity",
      query: {},
      sort: { createdAt: -1 },
      count: Math.floor(requestLimit * 0.4),
    },
  ];

  const candidatePromises = strategies.map(async (strategy) => {
    const pipeline = buildAggregationPipeline({
      match: strategy.query,
      sort: strategy.sort,
      limit: strategy.count * 2,
    });
    if (strategy.name === "serendipity")
      pipeline.unshift({ $sample: { size: strategy.count * 2 } });

    const candidates = await Product.aggregate(pipeline);
    return candidates.map((c) => ({
      product: c._id,
      score: 1.0, // Base score, adjusted later if needed
      reason: "discovery", // Use consistent reason for better source diversity
      originalStrategy: "discovery", // Add originalStrategy for consistency
      subReason: strategy.name, // Store the specific strategy as subReason
      productData: c,
    }));
  });

  const results = (await Promise.all(candidatePromises)).flat();
  const uniqueCandidates = [
    ...new Map(results.map((c) => [c.product.toString(), c])).values(),
  ];

  // Sort by a more stable method than random to ensure consistent results
  // Use product ID as a stable sort key
  return uniqueCandidates
    .sort((a, b) => {
      // First sort by score (descending)
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > 0.0001) {
        return scoreDiff;
      }
      // If scores are very close, use product ID for stable ordering
      return a.product.toString().localeCompare(b.product.toString());
    })
    .slice(0, limit);
};

export const getInterestExplorationCandidates = async (
  userId,
  limit = 20,
  context = {}
) => {
  try {
    // Get user preferences with proper fallback
    const preferences = await getUserPreferences(userId);

    // Ensure preferences has the expected structure
    const safePreferences = {
      scores: {
        categories: {},
        tags: {},
        ...(preferences.scores || {})
      },
      ...(preferences || {})
    };

    // Now safely access categories and tags
    const topCategories = Object.keys(safePreferences.scores.categories || {})
      .slice(0, 5)
      .map((id) => new mongoose.Types.ObjectId(id));
    const topTags = Object.keys(safePreferences.scores.tags || {}).slice(0, 10);

    logger.debug(`InterestExploration: Found ${topCategories.length} categories and ${topTags.length} tags for user ${userId}`);


  const excludedIds = [
    ...(context.userHistory?.viewedProducts || []),
    ...(context.userHistory?.upvotedProducts || []),
  ].map((id) => new mongoose.Types.ObjectId(id));

  const query = {
    ...(excludedIds.length > 0 && { _id: { $nin: excludedIds } }),
    $or: [
      ...(topCategories.length > 0
        ? [{ category: { $in: topCategories } }]
        : []),
      ...(topTags.length > 0 ? [{ tags: { $in: topTags } }] : []),
    ],
    upvoteCount: { $gte: SCORING_CONSTANTS.minExplorationUpvotes },
  };

  if (topCategories.length === 0 && topTags.length === 0) {
    query.createdAt = { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) };
  }

  return fetchCandidates("interest-exploration", {
    query,
    limit,
    scoreFn: (product) =>
      calculatePersonalizedScore(product, { userPreferences: safePreferences }),
  });
  } catch (error) {
    logger.error(`InterestExploration error: ${error.message}`);
    // Fall back to trending products
    return getTrendingCandidates({ limit, days: 14 });
  }
};

export const getSimilarToRecentCandidates = async (
  userId,
  limit = 20,
  context = {}
) => {
  try {
    // Ensure we have a valid user history object
    if (!context.userHistory || !Array.isArray(context.userHistory.viewedProducts) || context.userHistory.viewedProducts.length === 0) {
      logger.debug(`No recent products found for user ${userId}`);
      return [];
    }

    // Safely convert string IDs to ObjectIds
    const recentProductIds = [];
    for (const id of context.userHistory.viewedProducts.slice(0, 5)) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          recentProductIds.push(new mongoose.Types.ObjectId(id));
        }
      } catch (err) {
        logger.warn(`Invalid product ID in user history: ${id}`);
      }
    }

    if (!recentProductIds.length) {
      logger.debug(`No valid recent product IDs found for user ${userId}`);
      return [];
    }

  const recentProducts = await Product.find({ _id: { $in: recentProductIds } })
    .select("category tags")
    .lean();
  const recentCategories = [
    ...new Set(recentProducts.map((p) => p.category?.toString())),
  ].map((id) => new mongoose.Types.ObjectId(id));
  const recentTags = [...new Set(recentProducts.flatMap((p) => p.tags || []))];

  // Safely convert excluded IDs to ObjectIds
  const excludedIds = [];
  const viewedProducts = context.userHistory?.viewedProducts || [];
  const upvotedProducts = context.userHistory?.upvotedProducts || [];

  [...viewedProducts, ...upvotedProducts].forEach(id => {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        excludedIds.push(new mongoose.Types.ObjectId(id));
      }
    } catch (err) {
      // Skip invalid IDs
    }
  });

  const query = {
    ...(excludedIds.length > 0 && { _id: { $nin: excludedIds } }),
    $or: [
      ...(recentCategories.length > 0
        ? [{ category: { $in: recentCategories } }]
        : []),
      ...(recentTags.length > 0 ? [{ tags: { $in: recentTags } }] : []),
    ],
  };

  return fetchCandidates("similar-to-recent", {
    query,
    limit,
    scoreFn: (product) =>
      calculateSimilarityScore(product, {
        tags: recentTags,
        categoryIds: recentCategories,
      }),
  });
  } catch (error) {
    logger.error(`SimilarToRecent error: ${error.message}`);
    return [];
  }
};

export const getCategorySpotlightCandidates = async (
  limit = 20,
  userId = null
) => {
  try {
    // Get user preferences with proper fallback
    const preferences = userId
      ? await getUserPreferences(userId)
      : { scores: { categories: {} } };

    // Ensure preferences has the expected structure
    const safePreferences = {
      scores: {
        categories: {},
        ...(preferences.scores || {})
      },
      ...(preferences || {})
    };

    // Now safely access categories
    const excludedCategoryIds = Object.keys(safePreferences.scores.categories || {})
      .slice(0, 3)
      .map((id) => new mongoose.Types.ObjectId(id));

    logger.debug(`CategorySpotlight: Found ${excludedCategoryIds.length} excluded categories for user ${userId || 'anonymous'}`);


  const pipeline = [
    { $match: { status: "Published" } },
    {
      $group: {
        _id: "$category",
        upvoteTotal: { $sum: "$upvoteCount" },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 2 },
        ...(excludedCategoryIds.length > 0 && {
          _id: { $nin: excludedCategoryIds },
        }),
      },
    },
    {
      $addFields: { categoryQuality: { $divide: ["$upvoteTotal", "$count"] } },
    },
    { $sort: { categoryQuality: -1 } },
    { $limit: 10 },
    { $sample: { size: 5 } },
    {
      $lookup: {
        from: "products",
        let: { categoryId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$category", "$$categoryId"] },
              status: "Published",
              upvoteCount: { $gte: SCORING_CONSTANTS.minExplorationUpvotes },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
        ],
        as: "products",
      },
    },
    { $unwind: "$products" },
    { $replaceRoot: { newRoot: "$products" } },
    ...buildAggregationPipeline({ match: {}, limit }).slice(1), // Reuse lookups and fields
  ];

  const candidates = await Product.aggregate(pipeline);
  return candidates
    .map((c) => ({
      product: c._id,
      score: 1.0,
      reason: "category-spotlight",
      productData: c,
    }))
    .slice(0, limit);
  } catch (error) {
    logger.error(`CategorySpotlight error: ${error.message}`);
    // Try again with a simpler approach as fallback
    try {
      logger.info(`CategorySpotlight retry with fallback approach`);
      const pipeline = [
        { $match: { status: "Published", upvoteCount: { $gte: 1 } } },
        { $sample: { size: limit * 2 } },
        ...buildAggregationPipeline({ match: {}, limit }).slice(1), // Reuse lookups and fields
      ];

      const fallbackCandidates = await Product.aggregate(pipeline);
      return fallbackCandidates
        .map((c) => ({
          product: c._id,
          score: 1.0,
          reason: "category-spotlight",
          productData: c,
        }))
        .slice(0, limit);
    } catch (fallbackError) {
      logger.error(`CategorySpotlight retry failed: ${fallbackError.message}`);
      return [];
    }
  }
};

export const getSerendipityCandidates = async (
  limit = 20,
  userHistory = {}
) => {
  // Safely convert excluded IDs to ObjectIds
  const excludedIds = [];
  const viewedProducts = userHistory?.viewedProducts || [];
  const upvotedProducts = userHistory?.upvotedProducts || [];

  [...viewedProducts, ...upvotedProducts].forEach(id => {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        excludedIds.push(new mongoose.Types.ObjectId(id));
      }
    } catch (err) {
      // Skip invalid IDs
    }
  });

  const query = {
    ...(excludedIds.length > 0 && { _id: { $nin: excludedIds } }),
    $or: [
      { upvoteCount: { $gte: SCORING_CONSTANTS.minExplorationUpvotes } },
      { bookmarkCount: { $gte: SCORING_CONSTANTS.minExplorationUpvotes } },
    ],
  };

  return fetchCandidates("serendipity", {
    query,
    limit,
    scoreFn: (product) => calculateEngagementScore(product) + Math.random() * 2, // Add slight randomness
  });
};
