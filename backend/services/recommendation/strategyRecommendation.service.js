// file: backend/Services/strategyRecommendation.service.js
import Product from "../../models/product/product.model.js";
import User from "../../models/user/user.model.js";
import UserContextService from "./userContext.service.js";
import logger from "../../utils/logging/logger.js";
import mongoose from "mongoose";
import {
  fetchAndScoreProducts,
  createRecommendationItem,
  getUserPreferences,
  buildTimeContext,
  validate,
} from "../../utils/recommendation/recommendation.utils.js";
import {
  getTrendingCandidates,
  getNewCandidates,
  getPersonalizedCandidates,
  getDiscoveryCandidates,
  getSerendipityCandidates,
  getCategorySpotlightCandidates,
} from "./recommendation.candidates.service.js";

// Constants for collaborative filtering
const SIMILARITY_THRESHOLD = 0.3; // Minimum similarity score to consider users similar
const MAX_SIMILAR_USERS = 10; // Maximum number of similar users to consider

class StrategyRecommendationService {
  static async getTrendingRecommendations(userId, options = {}) {
    const opts = validate.options(options);

    // Add debug mode to track the scoring process
    const debug = process.env.NODE_ENV === "development";
    if (debug) {
      logger.debug(`Fetching trending candidates with options:`, opts);
    }

    // Ensure we only get published products
    const candidates = await getTrendingCandidates({ 
      ...opts, 
      userId, 
      debug,
      status: "Published",
      excludeIds: opts.excludeIds || []
    });

    // Track raw scores and enhance the response
    return candidates.map((c) => {
      const recommendationItem = createRecommendationItem(
        c.productData,
        { reason: "trending" },
        c.score
      );

      // Preserve raw score data for debugging and analysis
      return {
        ...recommendationItem,
        rawScore: c.rawScore || c.score,
        scoreComponents: c.scoreComponents || null,
      };
    });
  }

  static async getNewProductRecommendations(userId, options = {}) {
    const opts = validate.options(options);
    // Ensure we only get published products
    const candidates = await getNewCandidates({ 
      ...opts, 
      userId,
      status: "Published",
      excludeIds: opts.excludeIds || []
    });
    return candidates.map((c) =>
      createRecommendationItem(c.productData, { reason: "new" }, c.score)
    );
  }

  static async getSimilarProducts(_, productId, options = {}) {
    const { limit = 20, offset = 0 } = validate.options(options);
    const sourceProduct = await Product.findById(productId)
      .select("category tags maker")
      .lean();
    if (!sourceProduct) throw new Error("Source product not found");

    const query = {
      status: "Published",
      _id: { $ne: productId },
      $or: [
        { category: sourceProduct.category },
        { tags: { $in: sourceProduct.tags } },
      ],
    };
    const context = {
      reason: "similar",
      timeContext: buildTimeContext(),
      similarToProduct: sourceProduct,
    };
    const recommendations = await fetchAndScoreProducts(query, context, limit, {
      offset,
    });
    return recommendations.map((r) =>
      createRecommendationItem(r.productData, context, r.score)
    );
  }

  static async getCategoryRecommendations(_, categoryId, options = {}) {
    const { limit = 20, offset = 0 } = validate.options(options);
    const query = {
      status: "Published",
      category: validate.id(categoryId, "Category ID"),
    };
    const context = {
      reason: "category",
      timeContext: buildTimeContext(),
      categoryId,
    };
    const recommendations = await fetchAndScoreProducts(query, context, limit, {
      offset,
    });
    return recommendations.map((r) =>
      createRecommendationItem(r.productData, context, r.score)
    );
  }

  static async getTagRecommendations(_, tags, options = {}) {
    const { limit = 20, offset = 0 } = validate.options(options);
    const query = { status: "Published", tags: { $in: tags } };
    const context = { reason: "tag", timeContext: buildTimeContext(), tags };
    const recommendations = await fetchAndScoreProducts(query, context, limit, {
      offset,
    });
    return recommendations.map((r) =>
      createRecommendationItem(r.productData, context, r.score)
    );
  }

  static async getUserRecommendations(userId, options = {}) {
    const opts = validate.options(options);
    const candidates = await getPersonalizedCandidates(userId, opts);
    return candidates.map((c) =>
      createRecommendationItem(
        c.productData,
        { reason: "personalized" },
        c.score
      )
    );
  }

  static async getCollaborativeRecommendations(userId, options = {}) {
    const { limit = 20, offset = 0 } = validate.options(options);
    if (!userId) {
      throw new Error("User ID required for collaborative recommendations");
    }

    try {
      // Get the user's context and preferences
      const userContext = await UserContextService.buildUserContext(userId);
      const userPreferences = await getUserPreferences(userId);

      // Find similar users based on interactions and preferences
      const similarUsers = await this.findSimilarUsers(userId, userPreferences);

      if (!similarUsers.length) {
        logger.info(`No similar users found for user ${userId}, falling back to discovery recommendations`);
        // Use discovery candidates instead of personalized to avoid duplicate recommendations
        return getDiscoveryCandidates({ ...options, userId });
      }

      logger.info(`Found ${similarUsers.length} similar users for user ${userId}`);

      // Simplified approach: Use categories and tags from similar users to find products
      // This avoids relying on the recommendationInteraction collection

      // Extract common interests from similar users
      const commonInterests = similarUsers.flatMap(user => user.commonInterests || []);

      // Get unique categories and tags
      const categories = [...new Set(commonInterests.filter(interest =>
        userPreferences.scores?.categories && interest in userPreferences.scores.categories
      ))];

      const tags = [...new Set(commonInterests.filter(interest =>
        userPreferences.scores?.tags && interest in userPreferences.scores.tags
      ))];

      // Build query based on similar users' interests
      const query = { status: "Published" };

      // Add filters to exclude products the user has already seen
      if (userContext.history?.viewedProducts?.length) {
        query._id = { $nin: userContext.history.viewedProducts };
      }

      // Add category and tag filters
      const conditions = [];

      if (categories.length > 0) {
        conditions.push({
          category: { $in: categories.map(c => new mongoose.Types.ObjectId(c)) }
        });
      }

      if (tags.length > 0) {
        conditions.push({ tags: { $in: tags } });
      }

      // If we have conditions, add them to the query
      if (conditions.length > 0) {
        query.$or = conditions;
      } else {
        // If no specific interests, fall back to serendipity recommendations
        logger.info(`No common interests found for user ${userId}, falling back to serendipity recommendations`);
        // Use getSerendipityCandidates for more diversity
        return getSerendipityCandidates(options.limit || 20, userContext.history || {});
      }

      // Create context with similarity data for better explanations
      const context = {
        reason: "collaborative",
        timeContext: buildTimeContext(),
        userContext,
        similarUsers: similarUsers.map(u => ({
          userId: u.userId,
          similarity: u.similarity,
          commonInterests: u.commonInterests
        })),
        categories,
        tags
      };

      // Score and fetch the products
      const recommendations = await fetchAndScoreProducts(query, context, limit * 2, { offset });

      if (recommendations.length === 0) {
        logger.info(`No collaborative products found for user ${userId}, falling back to category spotlight recommendations`);
        // Use getCategorySpotlightCandidates for more diversity
        return getCategorySpotlightCandidates(options.limit || 20, userId);
      }

      // Create recommendation items with enhanced explanations
      return recommendations.slice(0, limit).map(r => {
        const product = r.productData;
        let explanation = "Recommended based on similar users' interests";

        // Create more specific explanation based on product attributes
        if (product.category && categories.includes(product.category.toString())) {
          const categoryName = product.category.name || "this category";
          explanation = `Popular with users who also like ${categoryName}`;
        } else if (product.tags && product.tags.some(tag => tags.includes(tag))) {
          const matchingTag = product.tags.find(tag => tags.includes(tag));
          if (matchingTag) {
            explanation = `Liked by users with similar interest in ${matchingTag}`;
          }
        }

        return createRecommendationItem(
          product,
          {
            ...context,
            reason: "collaborative",
            explanationText: explanation,
            scoreContext: `Relevance: ${r.score.toFixed(4)} - Based on similar users' preferences`
          },
          r.score
        );
      });
    } catch (error) {
      logger.error(`Error in collaborative recommendations for user ${userId}:`, error);
      // Fallback to trending candidates if discovery fails
      try {
        logger.info(`Attempting to use discovery candidates as fallback for user ${userId}`);
        return getDiscoveryCandidates({ ...options, userId });
      } catch (fallbackError) {
        logger.error(`Discovery fallback failed for user ${userId}, using trending instead:`, fallbackError);
        return getTrendingCandidates({ ...options, userId });
      }
    }
  }

  /**
   * Find users similar to the given user based on interactions and preferences
   */
  static async findSimilarUsers(userId, userPreferences) {
    try {
      // Get the user's category and tag preferences
      const userCategories = Object.keys(userPreferences.scores?.categories || {});
      const userTags = userPreferences.scores?.tags ?
        Object.keys(userPreferences.scores.tags) : [];

      if (!userCategories.length && !userTags.length) {
        logger.info(`User ${userId} has no category or tag preferences`);
        return [];
      }

      // Simplified approach: Find users with similar interests directly from user preferences
      // This avoids complex aggregation that might fail if the recommendationinteractions collection is empty

      // Get all users
      const allUsers = await User.find({
        _id: { $ne: new mongoose.Types.ObjectId(userId) }
      })
      .select('_id firstName lastName')
      .limit(100) // Limit to 100 users for performance
      .lean();

      // Get preferences for each user
      const userPreferencesPromises = allUsers.map(user =>
        getUserPreferences(user._id.toString())
      );

      const allUserPreferences = await Promise.all(userPreferencesPromises);

      // Calculate similarity scores
      const usersWithScores = allUsers.map((user, index) => {
        const preferences = allUserPreferences[index];

        // Get categories and tags
        const theirCategories = Object.keys(preferences.scores?.categories || {});
        const theirTags = preferences.scores?.tags ?
          Object.keys(preferences.scores.tags) : [];

        // Calculate category overlap
        const commonCategories = userCategories.filter(cat =>
          theirCategories.includes(cat)
        );

        // Calculate tag overlap
        const commonTags = userTags.filter(tag =>
          theirTags.includes(tag)
        );

        // Calculate similarity score
        const totalUserInterests = userCategories.length + userTags.length;
        const totalCommonInterests = commonCategories.length + commonTags.length;

        // Avoid division by zero
        const similarityScore = totalUserInterests > 0 ?
          totalCommonInterests / totalUserInterests : 0;

        return {
          userId: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          similarity: similarityScore,
          commonCategories: commonCategories.length,
          commonTags: commonTags.length,
          commonInterests: [...commonCategories, ...commonTags].slice(0, 5)
        };
      });

      // Filter and sort by similarity score
      return usersWithScores
        .filter(user => user.similarity >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, MAX_SIMILAR_USERS);
    } catch (error) {
      logger.error(`Error finding similar users for ${userId}:`, error);
      return [];
    }
  }

  static async getPreferenceRecommendations(userId, options = {}) {
    const { limit = 20, offset = 0 } = validate.options(options);
    if (!userId)
      throw new Error("User ID required for preference recommendations");

    const userPreferences = await getUserPreferences(userId);
    const query = {
      status: "Published",
      _id: { $nin: userPreferences?.viewedProducts || [] },
    };
    const context = {
      reason: "preferences",
      timeContext: buildTimeContext(),
      userPreferences,
    };
    const recommendations = await fetchAndScoreProducts(query, context, limit, {
      offset,
    });
    return recommendations.map((r) =>
      createRecommendationItem(r.productData, context, r.score)
    );
  }

  static async getInterestBasedRecommendations(userId, options = {}) {
    const { limit = 20, offset = 0 } = validate.options(options);
    if (!userId) {
      throw new Error("User ID required for interest-based recommendations");
    }

    try {
      // Get user preferences and context
      const userPreferences = await getUserPreferences(userId);
      const userContext = await UserContextService.buildUserContext(userId);

      // Extract user interests from preferences
      const categoryInterests = userPreferences.scores?.categories || {};
      const tagInterests = userPreferences.scores?.tags || {};

      // Check if user has enough interests
      const hasCategories = Object.keys(categoryInterests).length > 0;
      const hasTags = Object.keys(tagInterests).length > 0;

      if (!hasCategories && !hasTags) {
        logger.info(`User ${userId} has no interests, falling back to discovery recommendations`);
        try {
          return getDiscoveryCandidates({ ...options, userId });
        } catch (fallbackError) {
          logger.error(`Discovery fallback failed for user ${userId}, using trending instead:`, fallbackError);
          return getTrendingCandidates({ ...options, userId });
        }
      }

      // Build query based on user interests
      const query = { status: "Published" };

      // Add filters to exclude products the user has already seen
      if (userContext.history?.viewedProducts?.length) {
        query._id = { $nin: userContext.history.viewedProducts };
      }

      // Create a scoring context with user interests
      const context = {
        reason: "interests",
        timeContext: buildTimeContext(),
        userPreferences,
        userContext,
        interestData: {
          categories: Object.entries(categoryInterests)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, score]) => ({ id, score })),
          tags: Object.entries(tagInterests)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, score]) => ({ tag, score }))
        }
      };

      // Create a weighted query based on interests
      // We'll use an $or query to find products that match either categories or tags
      const categoryIds = context.interestData.categories.map(c => new mongoose.Types.ObjectId(c.id));
      const tags = context.interestData.tags.map(t => t.tag);

      // If we have no interests to query, fall back to new products instead of trending
      if (!categoryIds.length && !tags.length) {
        logger.info(`User ${userId} has no queryable interests, falling back to new product recommendations`);
        return getNewCandidates({ ...options, days: 30 }); // Use a longer timeframe for new products
      }

      // Build the query with interests
      query.$or = [];

      if (categoryIds.length) {
        query.$or.push({ category: { $in: categoryIds } });
      }

      if (tags.length) {
        query.$or.push({ tags: { $in: tags } });
      }

      // Add recency boost - prefer newer products
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Custom scoring function that prioritizes matches with user's top interests
      const customScoring = (product) => {
        let score = 0;

        // Category match score
        if (product.category) {
          const categoryId = product.category.toString();
          const categoryScore = categoryInterests[categoryId] || 0;
          score += categoryScore * 0.6; // 60% weight to category match
        }

        // Tag match score
        if (product.tags && product.tags.length) {
          const matchingTags = product.tags.filter(tag => tagInterests[tag]);
          const tagScore = matchingTags.reduce((sum, tag) => sum + (tagInterests[tag] || 0), 0);
          score += tagScore * 0.4; // 40% weight to tag matches
        }

        // If no score yet, give a small base score
        if (score === 0) {
          score = 0.1; // Small base score for products that don't match interests directly
        }

        // Recency boost
        if (product.createdAt > thirtyDaysAgo) {
          const daysAgo = Math.max(1, Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
          score *= (1 + (30 - daysAgo) / 30 * 0.3); // Up to 30% boost for newest products
        }

        // Engagement boost
        if (product.upvoteCount > 0) {
          score *= (1 + Math.min(product.upvoteCount / 10, 0.5)); // Up to 50% boost for popular products
        }

        return score;
      };

      // Fetch and score products
      const recommendations = await fetchAndScoreProducts(query, context, limit * 3, {
        offset,
        customScoring
      });

      // If we don't have enough recommendations, try a more general query
      if (recommendations.length < limit) {
        logger.info(`Not enough interest-based recommendations (${recommendations.length}/${limit}), adding trending products`);

        // Get trending products to supplement
        const trendingOptions = { ...options, limit: limit * 2 };
        const trendingProducts = await getTrendingCandidates(trendingOptions);

        // Filter out products we already have
        const existingIds = new Set(recommendations.map(r => r.product.toString()));
        const filteredTrending = trendingProducts.filter(p => !existingIds.has(p.product.toString()));

        // Combine the results
        recommendations.push(...filteredTrending);
      }

      // Generate personalized explanations
      return recommendations.slice(0, limit).map(r => {
        const product = r.productData;
        let explanation = "Matches your interests";

        // Check for category match
        if (product.category) {
          const categoryId = product.category.toString();
          const matchingCategory = context.interestData.categories.find(c => c.id === categoryId);

          if (matchingCategory) {
            // Get category name
            const categoryName = product.category.name || "this category";
            explanation = `Matches your interest in ${categoryName}`;
          }
        }

        // Check for tag matches
        if (product.tags && product.tags.length) {
          const matchingTags = product.tags.filter(tag =>
            context.interestData.tags.some(t => t.tag === tag)
          );

          if (matchingTags.length > 0) {
            explanation = `Matches your interests: ${matchingTags[0]}`;
          }
        }

        return createRecommendationItem(
          product,
          {
            ...context,
            reason: "interests",
            explanationText: explanation,
            scoreContext: `Relevance: ${r.score.toFixed(4)} - Based on your interests`
          },
          r.score
        );
      });
    } catch (error) {
      logger.error(`Error in interest-based recommendations for user ${userId}:`, error);
      // Fallback to new products instead of trending
      return getNewCandidates({ ...options, days: 14 });
    }
  }

  static async getMakerRecommendations(_, makerId, options = {}) {
    const { limit = 20, offset = 0 } = validate.options(options);
    const query = {
      status: "Published",
      maker: validate.id(makerId, "Maker ID"),
    };
    const context = {
      reason: "maker",
      timeContext: buildTimeContext(),
      makerId,
    };
    const recommendations = await fetchAndScoreProducts(query, context, limit, {
      offset,
    });
    return recommendations.map((r) =>
      createRecommendationItem(r.productData, context, r.score)
    );
  }
}

export default StrategyRecommendationService;
