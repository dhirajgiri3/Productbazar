// file: backend/Services/recommendation.service.js
import mongoose from "mongoose";
import recommendationCacheService from "./recommendationCache.service.js";
import {
  validate,
  buildTimeContext,
  fetchAndScoreProducts,
  createRecommendationItem,
  getUserPreferences,
} from "../../utils/recommendation/recommendation.utils.js";
import StrategyRecommendationService from "./strategyRecommendation.service.js";
import UserContextService from "./userContext.service.js";
import {
  getTrendingCandidates,
  getNewCandidates,
  getPersonalizedCandidates,
  getDiscoveryCandidates,
  getSimilarToRecentCandidates,
  getCategorySpotlightCandidates,
  getSerendipityCandidates,
} from "./recommendation.candidates.service.js";
import { diversifyRecommendations, tagRecommendationsWithSource } from "./recommendation.diversity.service.js";
import { SCORING_CONSTANTS } from "../../utils/constants/scoring/scoring.constants.js";
import logger from "../../utils/logging/logger.js";

class RecommendationService {
  static async getRecommendationsForStrategy(strategy, userId, options = {}) {
    const validatedOptions = validate.options(options);
    const userIdObj = validate.id(userId, "User ID");

    const strategies = {
      feed: () => this.getDiversifiedFeed(userIdObj, validatedOptions),
      trending: () =>
        StrategyRecommendationService.getTrendingRecommendations(
          userIdObj,
          validatedOptions
        ),
      new: () =>
        StrategyRecommendationService.getNewProductRecommendations(
          userIdObj,
          validatedOptions
        ),
      similar: () => this.validateAndGetSimilar(userIdObj, validatedOptions),
      category: () => this.validateAndGetCategory(userIdObj, validatedOptions),
      tag: () => this.validateAndGetTags(userIdObj, validatedOptions),
      personalized: () =>
        this.validateAndGetPersonalized(userIdObj, validatedOptions),
      hybrid: () => this.getHybridRecommendations(userIdObj, validatedOptions),
    };

    const handler = strategies[strategy.toLowerCase()];
    if (!handler) {
      logger.warn(
        `Unknown strategy: ${strategy}, falling back to diversified feed`
      );
      return this.getDiversifiedFeed(userIdObj, validatedOptions);
    }

    return handler();
  }

  static async getHybridRecommendations(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      context: initialContext = {},
      category = null, // Category filter
      tags = [], // Tags filter
      sortBy = "score", // Sort option
      forceRefresh = false, // Added: option to force refresh
    } = validate.options(options);

    const userIdObj = validate.id(userId, "User ID");
    const isAuthenticated = !!userIdObj;
    const blend = initialContext.blend || "standard"; // Default blend

    // Remove time-based cache invalidation to improve cache stability and performance
    const cacheKey = `hybrid:${
      isAuthenticated ? 'auth' : 'anon'
    }:${userId || "anon"}:${limit}:${offset}:${blend}:${
      category ? `cat:${category}` : ''
    }:${tags.length ? `tags:${tags.sort().join('.')}` : ''}:${sortBy}`;

    const startTime = Date.now();

    // Skip cache if forceRefresh is true
    const cached = forceRefresh ? null : await recommendationCacheService.get(cacheKey);

    if (cached && cached.length >= Math.min(5, limit)) {
      const sourceCount = new Set(cached.map((item) => item.reason)).size;
      if (sourceCount >= 2) {
        logger.info(
          `[Cache] HIT for hybrid key: ${cacheKey} (${
            Date.now() - startTime
          }ms)`
        );
        return cached;
      }
    }

    const timeContext = buildTimeContext();
    const context = { ...initialContext, timeContext };

    // Enhanced user context for authenticated users
    if (userIdObj) {
      try {
        const userContext = await UserContextService.buildUserContext(userIdObj);
        context.userPreferences = await getUserPreferences(userIdObj);
        context.userHistory = userContext.history;
        context.categories = userContext.categories;

        // Add richer user context data for better explanations
        context.recentViews = userContext.history?.viewedProducts?.slice(0, 5) || [];
        context.recentCategories = userContext.categories || [];
        context.lastActivityTime = userContext.history?.lastActivity || null;

        // Add session context if available
        if (initialContext.sessionId) {
          context.sessionContext = {
            id: initialContext.sessionId,
            deviceType: initialContext.deviceType || 'unknown',
            userAgent: initialContext.userAgent,
          };
        }

        // Exclude dismissed products from results
        context.dismissedProducts = context.userPreferences?.dismissedProducts || [];
      } catch (error) {
        logger.warn(`Failed to load user context: ${error.message}`);
        // Continue with limited context rather than failing
      }
    }

    // Adjust strategy weights based on authentication, blend type and userContext
    let strategyWeights = this.getBlendWeights(blend, isAuthenticated, context);

    // Increase candidate multiplier to ensure we have enough candidates
    const parallelOptions = {
      ...options,
      limit: Math.ceil(limit * 4), // Increased from 2x to 4x to ensure enough candidates
      category, // Pass category filter
      tags, // Pass tags filter
      context,
    };

    // Only fetch new metrics every hour to improve cache stability and performance
    const trendingMetricsKey = `trending_metrics:${Math.floor(Date.now() / (60 * 60 * 1000))}`;
    let trendingMetrics = await recommendationCacheService.get(trendingMetricsKey);

    if (!trendingMetrics) {
      trendingMetrics = await this.getTrendingMetrics();
      // Cache trending metrics for 1 hour
      await recommendationCacheService.set(trendingMetricsKey, trendingMetrics, 3600);
    }

    context.trendingMetrics = trendingMetrics;

    // Define strategies to fetch with improved error handling and retry logic
    const fetchWithRetry = async (fetchFn, name) => {
      try {
        return await fetchFn();
      } catch (error) {
        logger.error(`${name} error: ${error.message}`);
        // Wait briefly and retry once
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          return await fetchFn();
        } catch (retryError) {
          logger.error(`${name} retry failed: ${retryError.message}`);
          return [];
        }
      }
    };

    // Define candidate sources with enhanced personalization for authenticated users
    let promises = [
      fetchWithRetry(() => getTrendingCandidates(parallelOptions), "Trending"),
      fetchWithRetry(() => getNewCandidates(parallelOptions), "New"),
      fetchWithRetry(() => getDiscoveryCandidates({...parallelOptions, userId: userIdObj}), "Discovery")
    ];

    let strategyNames = ["trending", "new", "discovery"];

    // Add personalized sources for authenticated users
    if (userIdObj) {
      // Add basic personalized recommendations
      promises.push(fetchWithRetry(() => getPersonalizedCandidates(userIdObj, parallelOptions), "Personalized"));
      strategyNames.push("personalized");

      // Add collaborative filtering recommendations
      promises.push(fetchWithRetry(() =>
        StrategyRecommendationService.getCollaborativeRecommendations(userIdObj, parallelOptions),
        "Collaborative"));
      strategyNames.push("collaborative");

      // Add interest-based recommendations
      promises.push(fetchWithRetry(() =>
        StrategyRecommendationService.getInterestBasedRecommendations(userIdObj, parallelOptions),
        "Interests"));
      strategyNames.push("interests");

      // Add similar-to-recent recommendations based on recent views
      promises.push(fetchWithRetry(() =>
        getSimilarToRecentCandidates(userIdObj, Math.ceil(limit * 2), context),
        "SimilarToRecent"));
      strategyNames.push("similar");
    }

    // Add category spotlight as a backup source
    promises.push(fetchWithRetry(() =>
      getCategorySpotlightCandidates(limit, userIdObj),
      "CategorySpotlight"));
    strategyNames.push("spotlight");

    // Add serendipity recommendations for more diversity
    promises.push(fetchWithRetry(() =>
      getSerendipityCandidates(limit, context.userHistory || {}),
      "Serendipity"));
    strategyNames.push("serendipity");

    // Process results with better deduplication and filtering
    const results = await Promise.all(promises);
    const allCandidates = [];
    const seenProductIds = new Set();
    const dismissedProducts = context.dismissedProducts || [];

    // Generate enhanced explanation texts based on product data and context
    const generateExplanationText = (product, strategy, _, context) => {
      const { trendingMetrics = {} } = context;
      const productId = product._id.toString();
      const metrics = trendingMetrics[productId] || {};

      // Get days since creation
      const createdAt = new Date(product.createdAt);
      const now = new Date();
      const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

      // Get upvotes and bookmarks
      const upvotes = product.upvoteCount || 0;
      // const bookmarks = product.bookmarkCount || 0; // Uncomment if needed
      const views = product.views?.count || 0;

      // Get category name
      const categoryName = product.category?.name || "";

      // Get maker name
      const makerName = product.maker?.firstName ?
        `${product.maker.firstName} ${product.maker.lastName || ''}`.trim() :
        "";

      // Get tags
      const tags = product.tags || [];
      const topTag = tags.length > 0 ? tags[0] : null;

      // Check if user has viewed this product before
      const userHasViewed = context.userHistory?.viewedProducts?.some?.(p =>
        p.productId && p.productId.toString() === productId
      );

      // Check if product is in user's interests
      const isInUserInterests = context.userPreferences?.scores?.categories?.[product.category?._id?.toString()];

      switch(strategy) {
        case "trending":
          if (daysSinceCreation <= 7) {
            if (upvotes >= 5) {
              return `⭐ New ${categoryName} product gaining traction with ${upvotes} upvotes in just ${daysSinceCreation} days`;
            } else {
              return `⭐ Recently launched ${categoryName} product showing early engagement`;
            }
          } else if (metrics.recentUpvotes && metrics.recentUpvotes > 0) {
            return `📊 Trending with ${metrics.recentUpvotes} upvotes in the past week`;
          } else if (upvotes > 0) {
            return `📈 Popular ${categoryName} product with ${upvotes} community upvotes`;
          } else {
            return `📊 Getting attention on Product Bazar since ${daysSinceCreation} days ago`;
          }

        case "new":
          if (makerName) {
            return `🆕 New product by ${makerName} launched ${daysSinceCreation} days ago`;
          } else if (topTag) {
            return `🆕 New ${topTag} product launched ${daysSinceCreation} days ago`;
          } else {
            return `🆕 Recently launched ${categoryName} product (${daysSinceCreation} days ago)`;
          }

        case "personalized":
          if (isInUserInterests) {
            return `✨ Recommended based on your interest in ${categoryName}`;
          } else if (topTag && context.userPreferences?.scores?.tags?.[topTag]) {
            return `✨ Matches your interest in ${topTag}`;
          } else if (userHasViewed) {
            return `✨ Similar to products you've viewed recently`;
          } else {
            return `✨ Personalized recommendation based on your activity`;
          }

        case "collaborative":
          if (upvotes > 5) {
            return `👥 Popular with users who have similar interests to you`;
          } else {
            return `👥 Discovered by users with similar interests to you`;
          }

        case "interests":
          if (isInUserInterests) {
            return `🎯 Matches your interest in ${categoryName}`;
          } else if (topTag && context.userPreferences?.scores?.tags?.[topTag]) {
            return `🎯 Aligns with your interest in ${topTag}`;
          } else {
            return `🎯 Matches your interests and preferences`;
          }

        case "similar":
          if (context.recentViews?.length > 0) {
            const recentProduct = context.recentViews[0];
            return `🔄 Similar to ${recentProduct.name || 'a product'} you recently viewed`;
          } else {
            return `🔄 Similar to products you've shown interest in`;
          }

        case "discovery":
          if (views > 100) {
            return `🔍 Discovered by ${views}+ users in the ${categoryName} category`;
          } else if (topTag) {
            return `🔍 Expanding your interests with this ${topTag} product`;
          } else {
            return `🔍 Curated to expand your product discovery`;
          }

        default:
          return `✨ Quality ${categoryName} product for you`;
      }
    };

    // Generate score context based on strategy and metrics
    const generateScoreContext = (product, strategy, score, context) => {
      const { trendingMetrics = {} } = context;
      const productId = product._id.toString();
      const metrics = trendingMetrics[productId] || {};

      // Format score to 4 decimal places
      const formattedScore = score.toFixed(4);

      // Get product metrics
      const upvotes = product.upvoteCount || 0;
      const views = product.views?.count || 0;
      const daysSinceCreation = Math.floor((new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24));

      switch(strategy) {
        case "trending":
          if (metrics.recentUpvotes) {
            return `Popularity: ${formattedScore} - ${metrics.recentUpvotes} upvotes in the last week`;
          } else if (upvotes > 0) {
            return `Popularity: ${formattedScore} - Based on ${upvotes} upvotes and ${views} views`;
          } else {
            return `Popularity: ${formattedScore} - Based on recent engagement`;
          }

        case "new":
          return `Recency: ${formattedScore} - Added ${daysSinceCreation} days ago`;

        case "personalized":
          if (context.userPreferences?.scores?.categories?.[product.category?._id?.toString()]) {
            return `Relevance: ${formattedScore} - Matches your category preferences`;
          } else if (product.tags?.some(tag => context.userPreferences?.scores?.tags?.[tag])) {
            return `Relevance: ${formattedScore} - Matches your tag preferences`;
          } else {
            return `Relevance: ${formattedScore} - Matched to your interests`;
          }

        case "collaborative":
          return `Similarity: ${formattedScore} - Based on similar users' activity`;

        case "interests":
          return `Interest: ${formattedScore} - Based on your explicit interests`;

        case "similar":
          return `Similarity: ${formattedScore} - Similar to products you've viewed`;

        case "discovery":
          return `Discovery: ${formattedScore} - Selected for exploration`;

        default:
          return `Score: ${formattedScore}`;
      }
    };

    results.forEach((candidates, index) => {
      const strategy = strategyNames[index];
      const weight = strategyWeights[strategy] || 0.1;

      // Apply strategy-specific weighting and filter dismissed items
      candidates.forEach((c) => {
        const productId = c.product.toString();
        if (!seenProductIds.has(productId) && !dismissedProducts.includes(productId)) {
          seenProductIds.add(productId);

          // Apply additional filters if specified
          if (category && c.productData.category?._id?.toString() !== category) {
            return; // Skip if category doesn't match
          }

          if (tags.length > 0) {
            const productTags = c.productData.tags || [];
            const hasMatchingTag = tags.some(tag => productTags.includes(tag));
            if (!hasMatchingTag) return; // Skip if no matching tags
          }

          // Calculate a more stable score with less randomness
          // Use a base multiplier that's more predictable
          const baseMultiplier = SCORING_CONSTANTS.typeMultipliers?.[strategy] || 1;
          const stableScore = c.score * weight * baseMultiplier;

          // Generate better explanation text and score context
          const explanationText = generateExplanationText(c.productData, strategy, stableScore, context);
          const scoreContext = generateScoreContext(c.productData, strategy, stableScore, context);

          // Tag the recommendation with its source for better tracking
          const taggedRecommendation = tagRecommendationsWithSource([{
            ...c,
            score: stableScore,
            originalStrategy: strategy,
            reason: strategy,
            explanationText,
            scoreContext
          }], strategy)[0];

          allCandidates.push(taggedRecommendation);
        }
      });
    });

    // Handle empty results with fallback
    if (!allCandidates.length) {
      logger.warn("[Hybrid] No candidates, using emergency fallback");
      return await this.getEmergencyRecommendations(limit);
    }

    // Set minimum source count based on authentication status
    // Authenticated users should see at least 4 different sources
    // Anonymous users should see at least 3 different sources
    const minSourceCount = isAuthenticated ? 4 : 3;

    // Check if we have enough candidates from different sources
    const uniqueSources = new Set(allCandidates.map(c => c.originalStrategy || c.reason));
    logger.info(`Available sources before diversity enforcement: ${uniqueSources.size}`, {
      sources: Array.from(uniqueSources),
      candidateCount: allCandidates.length
    });

    // If we don't have enough sources, try to fetch more candidates
    if (uniqueSources.size < minSourceCount && !forceRefresh) {
      logger.warn(`Not enough source diversity (${uniqueSources.size}/${minSourceCount}), forcing refresh`);
      // Recursively call with forceRefresh=true to bypass cache and get fresh data
      return this.getHybridRecommendations(userId, {
        ...options,
        forceRefresh: true
      });
    }

    // Apply enhanced diversity algorithm with minimum source count using our new utility
    // Tag each recommendation with its source for better tracking
    const taggedCandidates = allCandidates.map(candidate => ({
      ...candidate,
      source: candidate.originalStrategy || candidate.reason || 'unknown'
    }));

    // Use our new diversity utility to ensure a good mix of recommendations
    const diversifiedResults = diversifyRecommendations(
      taggedCandidates,
      {
        limit: limit * 3, // Get 3x the limit to ensure enough candidates
        minSourceCount, // Ensure minimum source diversity
        prioritySources: [
          'trending',
          'personalized',
          'interests',
          'new',
          'discovery',
          'collaborative',
          'similar'
        ]
      }
    );

    // Apply sorting based on sortBy parameter
    let sortedResults = [...diversifiedResults];
    switch(sortBy) {
      case "created":
        sortedResults.sort((a, b) =>
          new Date(b.productData.createdAt) - new Date(a.productData.createdAt)
        );
        break;
      case "upvotes":
        sortedResults.sort((a, b) =>
          (b.productData.upvoteCount || 0) - (a.productData.upvoteCount || 0)
        );
        break;
      case "trending":
        sortedResults.sort((a, b) => {
          if (a.reason === "trending" && b.reason !== "trending") return -1;
          if (a.reason !== "trending" && b.reason === "trending") return 1;
          return b.score - a.score;
        });
        break;
      case "score":
      default:
        // Already sorted by score in diversity function
        break;
    }

    // Format final results
    let finalResults = sortedResults
      .slice(offset, offset + limit)
      .map((c) =>
        createRecommendationItem(
          c.productData,
          { ...context, reason: c.reason },
          c.score
        )
      );

    // Check if we have enough results to satisfy the requested limit
    if (finalResults.length < limit) {
      logger.warn(`Not enough results after slicing: ${finalResults.length}/${limit}. Adding emergency recommendations.`);

      // Get emergency recommendations to fill the gap
      const emergencyCount = limit - finalResults.length;
      const emergencyRecs = await this.getEmergencyRecommendations(emergencyCount * 2);

      // Filter out any duplicates
      const existingIds = new Set(finalResults.map(item => item.product));
      const filteredEmergencyRecs = emergencyRecs.filter(item => !existingIds.has(item.product));

      // Add emergency recommendations to fill up to the limit
      finalResults = [
        ...finalResults,
        ...filteredEmergencyRecs.slice(0, emergencyCount)
      ];

      logger.info(`Added ${Math.min(emergencyCount, filteredEmergencyRecs.length)} emergency recommendations`);
    }

    // Check final source diversity
    const finalSourceCount = new Set(finalResults.map(item => item.reason)).size;

    logger.info(`Final source diversity in recommendations: ${finalSourceCount} sources`, {
      sourceDistribution: finalResults.reduce((acc, item) => {
        const source = item.reason;
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {}),
      totalItems: finalResults.length
    });

    // Only cache if we have good source diversity and enough items
    if (finalResults.length >= Math.min(5, limit) &&
        finalSourceCount >= Math.min(minSourceCount, uniqueSources.size) &&
        finalResults.length >= limit * 0.8) { // At least 80% of requested limit

      // Cache results with longer TTL for better stability
      await recommendationCacheService.set(
        cacheKey,
        finalResults,
        userIdObj ? 1800 : 3600 // 30 min for auth users, 1 hour for anon
      );

      // Also cache a subset of results with different keys for partial matches
      // This helps with pagination and reduces redundant calculations
      if (offset === 0 && finalResults.length > 5) {
        // Cache first 5 items with a shorter key
        const shortKey = `hybrid:${isAuthenticated ? 'auth' : 'anon'}:${userId || "anon"}:5:0:${blend}`;
        await recommendationCacheService.set(shortKey, finalResults.slice(0, 5), userIdObj ? 3600 : 7200);
      }
    } else if (finalSourceCount < Math.min(minSourceCount, uniqueSources.size)) {
      logger.warn(`Not caching results due to insufficient source diversity: ${finalSourceCount}/${minSourceCount}`);
    } else if (finalResults.length < limit * 0.8) {
      logger.warn(`Not caching results due to insufficient item count: ${finalResults.length}/${limit}`);
    }

    logger.info(
      `[Hybrid] Generated ${finalResults.length} recommendations in ${
        Date.now() - startTime
      }ms`
    );

    return finalResults;
  }

  // Get blend weights based on blend type, authentication status, and user context
  // Enhanced to ensure more diverse source distribution and better personalization
  static getBlendWeights(blend, isAuthenticated, context = {}) {
    // Check if user has strong preferences that should influence weights
    const hasStrongPreferences = isAuthenticated &&
      context.userPreferences?.scores?.categories &&
      Object.keys(context.userPreferences.scores.categories).length > 2;

    // Check if user has recent activity that should influence weights
    const hasRecentActivity = isAuthenticated &&
      context.userPreferences?.recentActivity &&
      context.userPreferences.recentActivity.length > 0;

    // Check time of day to adjust weights (users may prefer different content at different times)
    const hour = new Date().getHours();
    const isEvening = hour >= 18 || hour < 6; // Evening/night hours

    if (isAuthenticated) {
      // Authenticated user strategy weights - more balanced for better diversity
      // and enhanced with new personalization sources
      switch(blend) {
        case 'discovery':
          return {
            trending: 0.15,
            new: 0.15,
            personalized: hasStrongPreferences ? 0.20 : 0.15,
            collaborative: 0.15,
            interests: 0.15,
            similar: hasRecentActivity ? 0.15 : 0.10,
            discovery: 0.15,
            backup: 0.05
          };
        case 'trending':
          return {
            trending: 0.25,
            new: 0.15,
            personalized: 0.15,
            collaborative: 0.10,
            interests: 0.10,
            similar: hasRecentActivity ? 0.10 : 0.05,
            discovery: 0.10,
            backup: 0.05
          };
        case 'personalized':
          return {
            trending: 0.10,
            new: 0.10,
            personalized: 0.20,
            collaborative: 0.20,
            interests: 0.15,
            similar: hasRecentActivity ? 0.15 : 0.10,
            discovery: 0.10,
            backup: 0.05
          };
        default: // standard - ensure all sources are well-represented
          // Adjust weights based on time of day - more discovery in evenings
          return {
            trending: isEvening ? 0.15 : 0.20,
            new: 0.15,
            personalized: hasStrongPreferences ? 0.15 : 0.10,
            collaborative: 0.15,
            interests: 0.15,
            similar: hasRecentActivity ? 0.15 : 0.10,
            discovery: isEvening ? 0.15 : 0.10,
            backup: 0.05
          };
      }
    } else {
      // Non-authenticated user strategy weights - more balanced for better diversity
      // Note: In the future, we could use session data for lightweight personalization
      // const hasSessionData = context.sessionId && context.sessionHistory && context.sessionHistory.length > 0;

      switch(blend) {
        case 'discovery':
          return {
            trending: 0.25,
            new: 0.30,
            discovery: 0.35,
            backup: 0.10
          };
        case 'new':
          return {
            trending: 0.20,
            new: 0.40,
            discovery: 0.30,
            backup: 0.10
          };
        case 'trending':
          return {
            trending: 0.40,
            new: 0.25,
            discovery: 0.25,
            backup: 0.10
          };
        default: // standard - ensure at least 3 sources are well-represented
          // Adjust weights based on time of day - more discovery in evenings
          return {
            trending: isEvening ? 0.30 : 0.35,
            new: 0.25,
            discovery: isEvening ? 0.35 : 0.30,
            backup: 0.10
          };
      }
    }
  }

  // Get trending metrics for better explanations with optimized query
  static async getTrendingMetrics() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get upvote history for trending calculations with optimized query
      // Use projection to limit data returned
      const upvoteStats = await mongoose.model("Upvote").aggregate([
        // Only match upvotes from the last 30 days
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        // Group by product and period (recent vs prior)
        {
          $group: {
            _id: {
              product: "$product",
              period: {
                $cond: [
                  { $gte: ["$createdAt", sevenDaysAgo] },
                  "recent",
                  "prior"
                ]
              }
            },
            count: { $sum: 1 }
          }
        },
        // Group by product to get recent and prior counts
        {
          $group: {
            _id: "$_id.product",
            recentCount: {
              $sum: { $cond: [{ $eq: ["$_id.period", "recent"] }, "$count", 0] }
            },
            priorCount: {
              $sum: { $cond: [{ $eq: ["$_id.period", "prior"] }, "$count", 0] }
            }
          }
        },
        // Project to calculate percentage increase
        {
          $project: {
            product: "$_id",
            recentCount: 1,
            priorCount: 1,
            percentIncrease: {
              $cond: [
                { $gt: ["$priorCount", 0] },
                {
                  $multiply: [
                    { $divide: [{ $subtract: ["$recentCount", "$priorCount"] }, "$priorCount"] },
                    100
                  ]
                },
                null
              ]
            }
          }
        },
        // Limit to products with at least some activity
        { $match: { recentCount: { $gt: 0 } } }
      ]);

      // Format into a map for easy lookup
      const metrics = {};
      upvoteStats.forEach(stat => {
        metrics[stat.product.toString()] = {
          upvoteIncrease: stat.percentIncrease ? Math.round(stat.percentIncrease) : null,
          recentUpvotes: stat.recentCount,
          priorUpvotes: stat.priorCount,
          startTime: sevenDaysAgo,
          timeWindow: "recent"
        };
      });

      return metrics;
    } catch (error) {
      logger.error("Error fetching trending metrics:", error);
      return {};
    }
  }

  // Enhanced enforceSourceDiversity with category caps, improved stability, and minimum source diversity
  static async enforceSourceDiversity(candidates, limit, options = {}) {
    // Validate input
    if (!Array.isArray(candidates)) {
      logger.error('Invalid candidates array:', candidates);
      return [];
    }

    if (candidates.length === 0) {
      return [];
    }

    const { strategyWeights = {}, maxPerCategory = 3, minSourceCount = 3 } = options;

    const finalList = [];
    const includedProductIds = new Set();
    const sourceCounts = new Map();
    const categoryCounts = new Map();

    // Group candidates by source
    const candidatesBySource = candidates.reduce((acc, c) => {
      const source = c.originalStrategy || "unknown";
      acc[source] = acc[source] || [];
      acc[source].push(c);
      return acc;
    }, {});

    // Sort candidates by score within each source for stability
    // Use a secondary sort by ID to ensure consistent ordering
    Object.values(candidatesBySource).forEach((cs) =>
      cs.sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (Math.abs(scoreDiff) < 0.0001) { // If scores are very close
          // Use product ID as a tiebreaker for stability
          return a.product.toString().localeCompare(b.product.toString());
        }
        return scoreDiff;
      })
    );

    // Calculate target counts based on weights
    const targetCounts = Object.keys(candidatesBySource).reduce(
      (acc, source) => {
        const weight = strategyWeights[source] || 0.1;
        acc[source] = Math.min(
          Math.max(1, Math.floor(limit * weight)),
          candidatesBySource[source].length
        );
        return acc;
      },
      {}
    );

    // First pass: Ensure minimum representation from each source
    // Prioritize sources with higher weights but ensure at least 1 item from each source
    const availableSources = Object.keys(candidatesBySource).filter(
      source => candidatesBySource[source].length > 0
    );

    // Sort sources by their target counts (descending)
    const sortedSources = availableSources.sort(
      (a, b) => (targetCounts[b] || 0) - (targetCounts[a] || 0)
    );

    // First ensure we have at least one item from each source (up to minSourceCount)
    const sourcesToEnsure = sortedSources.slice(0, Math.min(minSourceCount, sortedSources.length));

    for (const source of sourcesToEnsure) {
      if (candidatesBySource[source].length === 0) continue;

      const candidate = candidatesBySource[source][0];
      const categoryId = candidate.productData.category?._id?.toString();

      finalList.push(candidate);
      includedProductIds.add(candidate.product.toString());
      sourceCounts.set(source, 1);

      if (categoryId) {
        categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
      }

      // Remove this candidate from the source list
      candidatesBySource[source] = candidatesBySource[source].slice(1);
    }

    // Second pass: Fill according to source weights while respecting category caps
    Object.entries(targetCounts).forEach(([source, count]) => {
      // Adjust count based on what we've already taken in the first pass
      const adjustedCount = count - (sourceCounts.get(source) || 0);
      let taken = 0;

      for (const c of candidatesBySource[source]) {
        if (taken >= adjustedCount || includedProductIds.has(c.product.toString()))
          continue;

        const categoryId = c.productData.category?._id?.toString();
        const categoryCount = categoryCounts.get(categoryId) || 0;

        // Skip if we've hit the category cap
        if (categoryId && categoryCount >= maxPerCategory) {
          continue;
        }

        finalList.push(c);
        includedProductIds.add(c.product.toString());
        sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);

        if (categoryId) {
          categoryCounts.set(categoryId, categoryCount + 1);
        }

        taken++;
      }
    });

    // Third pass: Fill remaining slots with highest scored items, still respecting category caps
    const remaining = candidates.filter(
      (c) => !includedProductIds.has(c.product.toString())
    );

    // Sort by score with a stable secondary sort
    remaining.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) < 0.0001) { // If scores are very close
        // Use product ID as a tiebreaker for stability
        return a.product.toString().localeCompare(b.product.toString());
      }
      return scoreDiff;
    });

    // Add remaining items while respecting category caps
    for (const c of remaining) {
      if (finalList.length >= limit) break;

      const categoryId = c.productData.category?._id?.toString();
      const categoryCount = categoryCounts.get(categoryId) || 0;

      if (!categoryId || categoryCount < maxPerCategory) {
        finalList.push(c);
        includedProductIds.add(c.product.toString());

        if (categoryId) {
          categoryCounts.set(categoryId, categoryCount + 1);
        }
      }
    }

    // Check if we have enough source diversity
    const uniqueSourceCount = new Set(finalList.map(item => item.originalStrategy || item.reason)).size;

    // Log source distribution for debugging
    const sourceDistribution = {};
    finalList.forEach(item => {
      const source = item.originalStrategy || item.reason;
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
    });

    logger.info(`Source diversity in recommendations: ${uniqueSourceCount} sources`, {
      sourceDistribution,
      totalItems: finalList.length
    });

    // Check if we have enough items to satisfy the requested limit
    const requestedLimit = options.requestedLimit || limit;
    if (finalList.length < requestedLimit) {
      logger.warn(`Not enough items after diversity enforcement: ${finalList.length}/${requestedLimit}. Adding fallback items.`);

      // Add fallback items from any source to reach the requested limit
      const allRemainingCandidates = candidates.filter(
        (c) => !includedProductIds.has(c.product.toString())
      );

      // Sort by score for best quality fallback items
      allRemainingCandidates.sort((a, b) => b.score - a.score);

      // Add items until we reach the requested limit
      for (const candidate of allRemainingCandidates) {
        if (finalList.length >= requestedLimit) break;

        finalList.push(candidate);
        includedProductIds.add(candidate.product.toString());

        // Update source counts for logging
        const source = candidate.originalStrategy || candidate.reason;
        sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
      }

      // Log the updated distribution after adding fallback items
      const updatedUniqueSourceCount = new Set(finalList.map(item => item.originalStrategy || item.reason)).size;
      logger.info(`Source diversity after adding fallback items: ${updatedUniqueSourceCount} sources`, {
        sourceDistribution,
        totalItems: finalList.length
      });
    }

    return finalList.slice(0, limit);
  }

  // Enhanced category exploration for better discovery with stable scoring
  static async getCategoryExplorationCandidates(limit, userId = null) {
    try {
      // If user is authenticated, exclude categories they've already seen a lot
      let excludedCategoryIds = [];

      if (userId) {
        const preferences = await getUserPreferences(userId);
        // Get top 3 most viewed categories to exclude
        excludedCategoryIds = Object.entries(preferences.scores?.categories || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([categoryId]) => new mongoose.Types.ObjectId(categoryId));
      }

      // Find categories with good engagement but not over-represented in the user's feed
      // Optimized pipeline with better performance
      const pipeline = [
        { $match: { status: "Published" } },
        // Project only the fields we need to improve performance
        { $project: {
            _id: 1,
            name: 1,
            tagline: 1,
            slug: 1,
            thumbnail: 1,
            description: 1,
            category: 1,
            maker: 1,
            tags: 1,
            upvoteCount: 1,
            bookmarkCount: 1,
            createdAt: 1
          }
        },
        {
          $group: {
            _id: "$category",
            productCount: { $sum: 1 },
            avgUpvotes: { $avg: "$upvoteCount" },
            avgBookmarks: { $avg: "$bookmarkCount" },
            products: { $push: "$$ROOT" }
          }
        },
        ...(excludedCategoryIds.length > 0 ? [
          { $match: { _id: { $nin: excludedCategoryIds } } }
        ] : []),
        {
          $match: {
            productCount: { $gte: 3 },
            avgUpvotes: { $gte: 3 } // Lowered threshold for better coverage
          }
        },
        { $sort: { avgUpvotes: -1 } },
        { $limit: 5 },
        { $unwind: "$products" },
        { $replaceRoot: { newRoot: "$products" } },
        // Sort by a combination of upvotes and recency for better diversity
        { $addFields: {
            combinedScore: {
              $add: [
                { $multiply: ["$upvoteCount", 0.7] },
                { $multiply: [
                    { $divide: [
                        { $subtract: [new Date(), "$createdAt"] },
                        1000 * 60 * 60 * 24 * 30 // 30 days in ms
                    ] },
                    -0.3 // Negative weight for age (newer is better)
                ]}
              ]
            }
          }
        },
        { $sort: { combinedScore: -1 } },
        { $limit: limit }
      ];

      const products = await mongoose.model("Product").aggregate(pipeline);

      // Format as candidates with stable scoring
      return products.map((p, index) => {
        // Calculate a stable score based on position and upvotes
        // This ensures consistent ordering between requests
        const positionScore = 0.8 - (index / (products.length * 2));
        const upvoteScore = Math.min(p.upvoteCount / 20, 0.2); // Cap at 0.2
        const stableScore = positionScore + upvoteScore;

        // Use "discovery" as the reason instead of "backup" for better source diversity
        return {
          product: p._id,
          score: stableScore,
          reason: "discovery", // Changed from "backup" to "discovery"
          originalStrategy: "discovery", // Add originalStrategy for consistency
          productData: p
        };
      });
    } catch (error) {
      logger.error("Error getting category exploration candidates:", error);
      return this.getBackupRecommendations(limit);
    }
  }

  static calculateFeedProportions(userId, options = {}) {
    const { includeNew = true, includeTrending = true, strategy = 'balanced' } = options;

    // Enhanced proportions with strategy variations
    if (userId) {
      // Authenticated user proportions
      switch(strategy) {
        case 'personalized':
          return {
            personalized: 0.65,
            trending: includeTrending ? 0.15 : 0,
            new: includeNew ? 0.1 : 0,
            discovery: 0.1 + (!includeTrending ? 0.15 : 0) + (!includeNew ? 0.1 : 0)
          };
        case 'discovery':
          return {
            personalized: 0.3,
            trending: includeTrending ? 0.2 : 0,
            new: includeNew ? 0.2 : 0,
            discovery: 0.3 + (!includeTrending ? 0.2 : 0) + (!includeNew ? 0.2 : 0)
          };
        case 'trending':
          return {
            personalized: 0.3,
            trending: includeTrending ? 0.5 : 0,
            new: includeNew ? 0.1 : 0,
            discovery: 0.1 + (!includeTrending ? 0.5 : 0) + (!includeNew ? 0.1 : 0)
          };
        default: // balanced
          return {
            personalized: 0.55, // Increased from 0.65
            trending: includeTrending ? 0.2 : 0,
            new: includeNew ? 0.1 : 0,
            discovery: 0.15 + (!includeTrending ? 0.2 : 0) + (!includeNew ? 0.1 : 0)
          };
      }
    } else {
      // Non-authenticated user proportions
      switch(strategy) {
        case 'discovery':
          return {
            trending: includeTrending ? 0.3 : 0,
            new: includeNew ? 0.3 : 0,
            discovery: 0.4 + (!includeTrending ? 0.3 : 0) + (!includeNew ? 0.3 : 0)
          };
        case 'new':
          return {
            trending: includeTrending ? 0.2 : 0,
            new: includeNew ? 0.6 : 0,
            discovery: 0.2 + (!includeTrending ? 0.2 : 0) + (!includeNew ? 0.6 : 0)
          };
        case 'trending':
          return {
            trending: includeTrending ? 0.6 : 0,
            new: includeNew ? 0.2 : 0,
            discovery: 0.2 + (!includeTrending ? 0.6 : 0) + (!includeNew ? 0.2 : 0)
          };
        default: // balanced
          return {
            trending: includeTrending ? 0.5 : 0,
            new: includeNew ? 0.3 : 0,
            discovery: 0.2 + (!includeTrending ? 0.5 : 0) + (!includeNew ? 0.3 : 0)
          };
      }
    }
  }

  static async assembleDiversifiedFeed(
    candidatesMap,
    proportions,
    limit,
    offset,
    context
  ) {
    // Validate candidatesMap
    if (!candidatesMap || typeof candidatesMap !== 'object') {
      logger.error('Invalid candidatesMap:', candidatesMap);
      return [];
    }

    // Ensure all candidates are arrays
    Object.keys(candidatesMap).forEach(key => {
      if (!Array.isArray(candidatesMap[key])) {
        logger.warn(`Invalid candidates for ${key}, resetting to empty array`);
        candidatesMap[key] = [];
      }
    });

    const finalFeed = [];
    const includedProductIds = new Set();
    const sourceCounts = new Map();

    const activeSources = Object.keys(proportions).filter(
      (s) => proportions[s] > 0 && candidatesMap[s]?.length > 0
    );

    if (!activeSources.length) return [];

    while (finalFeed.length < limit + offset && activeSources.length > 0) {
      const source = activeSources.reduce(
        (best, s) => {
          const target = Math.ceil(proportions[s] * (finalFeed.length + 1));
          const current = sourceCounts.get(s) || 0;
          return target - current > best.target - (sourceCounts.get(best.source) || 0)
            ? { source: s, target }
            : best;
        },
        { source: activeSources[0], target: 0 }
      ).source;

      const candidates = candidatesMap[source].filter(
        (c) => !includedProductIds.has(c.product.toString())
      );
      if (!candidates.length) {
        activeSources.splice(activeSources.indexOf(source), 1);
        continue;
      }

      const bestCandidate = candidates[0];
      const recommendationItem = createRecommendationItem(
        bestCandidate.productData,
        { ...context, reason: source },
        bestCandidate.score
      );

      finalFeed.push(recommendationItem);
      includedProductIds.add(bestCandidate.product.toString());
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
      candidatesMap[source] = candidates.slice(1);
    }

    return finalFeed.slice(offset, offset + limit);
  }

  // Removed duplicate enforceSourceDiversity method

  static async getEmergencyRecommendations(limit) {
    try {
      logger.info(`Getting emergency recommendations for limit: ${limit}`);

      // Use a more aggressive approach to ensure we get enough products
      // First try to get products with some engagement
      const engagedQuery = {
        status: "Published",
        $or: [
          { upvoteCount: { $gt: 0 } },
          { bookmarkCount: { $gt: 0 } },
          { views: { $exists: true } }
        ]
      };

      // Get a larger number of products to ensure we have enough after filtering
      const pipeline = buildAggregationPipeline({
        match: engagedQuery,
        sort: { upvoteCount: -1, createdAt: -1 },
        limit: limit * 5, // Get 5x the limit to ensure we have enough
      });

      // Add some randomness to avoid always returning the same products
      pipeline.unshift({ $sample: { size: limit * 5 } });

      let products = await mongoose.model("Product").aggregate(pipeline);

      // If we don't have enough products, try a more lenient query
      if (products.length < limit) {
        logger.warn(`Not enough engaged products (${products.length}/${limit}), falling back to any published products`);

        const anyQuery = { status: "Published" };
        const fallbackPipeline = buildAggregationPipeline({
          match: anyQuery,
          sort: { createdAt: -1 },
          limit: limit * 5,
        });

        // Add randomness to the fallback query too
        fallbackPipeline.unshift({ $sample: { size: limit * 5 } });

        const fallbackProducts = await mongoose.model("Product").aggregate(fallbackPipeline);

        // Combine the results, prioritizing engaged products
        const existingIds = new Set(products.map(p => p._id.toString()));
        const uniqueFallbackProducts = fallbackProducts.filter(p => !existingIds.has(p._id.toString()));

        products = [...products, ...uniqueFallbackProducts];
      }

      // Ensure we have enough products
      if (products.length < limit) {
        logger.error(`Critical: Only found ${products.length} emergency products for limit ${limit}`);
      } else {
        logger.info(`Found ${products.length} emergency products for limit ${limit}`);
      }

      // Create recommendation items with diverse source types
      return products.slice(0, limit).map((p, index) => {
        // Distribute products across different source types for diversity
        // Use a more even distribution to ensure better source diversity
        let sourceType;
        if (index % 5 === 0) {
          sourceType = "trending";
        } else if (index % 5 === 1) {
          sourceType = "new";
        } else if (index % 5 === 2) {
          sourceType = "discovery";
        } else if (index % 5 === 3) {
          sourceType = "personalized";
        } else {
          sourceType = "interests";
        }

        // Calculate a score based on engagement and recency
        const upvoteScore = Math.min((p.upvoteCount || 0) / 10, 0.3);
        const recencyScore = Math.min(1 - ((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) * 0.2, 0.2);
        const baseScore = 0.3 + upvoteScore + recencyScore;

        // Create recommendation item with the assigned source type
        return createRecommendationItem(p, {
          reason: sourceType,
          originalStrategy: sourceType, // Add originalStrategy for consistency
          explanationText: `✨ Recommended ${p.category?.name || ""} product for you`,
          scoreContext: `${sourceType.charAt(0).toUpperCase() + sourceType.slice(1)}: ${baseScore.toFixed(4)} - Selected for you`
        }, baseScore);
      });
    } catch (error) {
      logger.error(`Error in emergency recommendations: ${error.message}`, error);

      // Last resort: Create empty recommendation items if we can't get any products
      // This should never happen, but it's better than crashing
      return Array(limit).fill(null).map((_, index) => ({
        product: `emergency-fallback-${index}`,
        score: 0.1,
        reason: index % 2 === 0 ? "trending" : "discovery",
        explanationText: "Recommended product",
        scoreContext: "Score: 0.1000",
        metadata: {
          source: index % 2 === 0 ? "trending" : "discovery",
          generatedAt: new Date().toISOString(),
        }
      }));
    }
  }

  static async getBackupRecommendations(limit) {
    const query = {
      status: "Published",
      $or: [{ upvoteCount: { $gt: 0 } }, { bookmarkCount: { $gte: 1 } }],
    };

    // Get products with a different source type for better diversity
    const products = await fetchAndScoreProducts(
      query,
      { reason: "backup", timeContext: buildTimeContext() },
      limit
    );

    // Assign different source types to ensure diversity
    return products.map((product, index) => {
      // Distribute products across different source types
      // This ensures we have multiple sources in the feed
      let sourceType;
      if (index % 4 === 0) {
        sourceType = "new";
      } else if (index % 4 === 1) {
        sourceType = "discovery";
      } else if (index % 4 === 2) {
        sourceType = "trending";
      } else {
        sourceType = "backup";
      }

      return {
        ...product,
        reason: sourceType,
        originalStrategy: sourceType
      };
    });
  }

  static validateAndGetSimilar(userId, options) {
    if (!options.productId)
      throw new Error("Product ID required for similar recommendations");
    return StrategyRecommendationService.getSimilarProducts(
      userId,
      options.productId,
      options
    );
  }

  static validateAndGetCategory(userId, options) {
    if (!options.categoryId)
      throw new Error("Category ID required for category recommendations");
    return StrategyRecommendationService.getCategoryRecommendations(
      userId,
      options.categoryId,
      options
    );
  }

  static validateAndGetTags(userId, options) {
    if (!options.tags?.length)
      throw new Error("Tags array required for tag recommendations");
    return StrategyRecommendationService.getTagRecommendations(
      userId,
      options.tags,
      options
    );
  }

  static validateAndGetPersonalized(userId, options) {
    if (!userId)
      throw new Error("User ID required for personalized recommendations");
    return StrategyRecommendationService.getUserRecommendations(
      userId,
      options
    );
  }

  /**
   * Get a diversified feed of recommendations from multiple sources
   * @param {ObjectId} userId - User ID (optional)
   * @param {Object} options - Options for the feed
   * @returns {Promise<Array>} - Array of recommendation objects
   */
  static async getDiversifiedFeed(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      context = {},
      blend = "standard"
    } = options;

    // Get recommendations from multiple sources
    const isAuthenticated = !!userId;
    const parallelOptions = { ...options, limit: Math.ceil(limit * 1.5) };

    // Fetch new arrivals first
    const newArrivals = await StrategyRecommendationService.getNewProductRecommendations(userId, parallelOptions);
    const newArrivalIds = newArrivals.map(item => item.product);

    // Fetch trending, excluding new arrivals
    const trending = await StrategyRecommendationService.getTrendingRecommendations(userId, { ...parallelOptions, excludeIds: newArrivalIds });

    // Fetch other strategies in parallel
    const otherPromises = [];
    const strategyNames = [];
    if (isAuthenticated) {
      otherPromises.push(StrategyRecommendationService.getUserRecommendations(userId, parallelOptions));
      strategyNames.push("personalized");
      otherPromises.push(StrategyRecommendationService.getCollaborativeRecommendations(userId, parallelOptions));
      strategyNames.push("collaborative");
      otherPromises.push(StrategyRecommendationService.getInterestBasedRecommendations(userId, parallelOptions));
      strategyNames.push("interests");
    }
    const otherResults = await Promise.allSettled(otherPromises);
    const candidatesMap = {
      trending,
      new: newArrivals
    };
    otherResults.forEach((result, idx) => {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        candidatesMap[strategyNames[idx]] = result.value;
      } else {
        candidatesMap[strategyNames[idx]] = [];
      }
    });

    // Get blend weights based on the requested blend type
    const blendWeights = this.getBlendWeights(blend, isAuthenticated, context);

    // Use the diversity utility to ensure a good mix of recommendations
    const allCandidates = Object.values(candidatesMap).flat();

    // Tag each recommendation with its source
    const taggedCandidates = allCandidates.map(candidate => ({
      ...candidate,
      source: candidate.originalStrategy || candidate.reason || 'unknown'
    }));

    // Apply diversity algorithm
    const diversified = diversifyRecommendations(
      taggedCandidates,
      {
        limit: limit + offset,
        minSourceCount: isAuthenticated ? 3 : 2,
        prioritySources: Object.keys(blendWeights).sort(
          (a, b) => blendWeights[b] - blendWeights[a]
        )
      }
    );

    // Apply pagination
    return diversified.slice(offset, offset + limit);
  }
}

export default RecommendationService;
