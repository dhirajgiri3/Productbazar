// file: backend/Controllers/recommendation.controller.js
import mongoose from "mongoose";
import RecommendationService from "../../services/recommendation/recommendations.service.js";
import logger from "../../utils/logging/logger.js";
import RecommendationInteraction from "../../models/recommendation/recommendationInteraction.model.js";
import Recommendation from "../../models/recommendation/recommendation.model.js";
import StrategyRecommendationService from "../../services/recommendation/strategyRecommendation.service.js";
import UserContextService from "../../services/recommendation/userContext.service.js";
import { parseStatsPeriod } from "../../utils/common/statsHelpers.js";
import RecommendationStatsService from "../../services/recommendation/recommendationStats.service.js";
import recommendationCacheService from "../../services/recommendation/recommendationCache.service.js";
import { enrichProductsWithUserInteractions } from "../../utils/data/productEnrichment.utils.js";

class RecommendationController {
  // Helper method for parameter validation
  static validatePaginationParams(rawLimit, rawOffset) {
    const limit = Math.min(Math.max(parseInt(rawLimit) || 10, 1), 100);
    const offset = Math.max(parseInt(rawOffset) || 0, 0);
    return { limit, offset };
  }

  static async getTrending(req, res, next) {
    try {
      const {
        limit: rawLimit,
        offset: rawOffset,
        days = "7",
        categoryId,
      } = req.query;
      const userId = req.user?._id || null;
      const { limit, offset } =
        RecommendationController.validatePaginationParams(rawLimit, rawOffset);
      const parsedDays = Math.max(parseInt(days) || 7, 1);

      if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid categoryId format" });
      }

      // Add debug logging
      logger.info("Fetching trending recommendations", {
        userId: userId?.toString() || 'anonymous',
        limit,
        offset,
        days: parsedDays,
        categoryId,
      });

      let recommendations =
        await StrategyRecommendationService.getTrendingRecommendations(userId, {
          limit,
          offset,
          days: parsedDays,
          categoryId,
          context: {
            sessionId: req.headers["x-session-id"],
            deviceType: req.headers["x-device-type"] || "unknown",
            source: "trending",
          },
        });

      // If no recommendations found, try with discovery candidates as fallback
      if (!recommendations || recommendations.length === 0) {
        logger.info(`No trending products found, falling back to discovery recommendations`);

        // Try to get discovery candidates
        try {
          recommendations = await StrategyRecommendationService.getDiscoveryCandidates({
            limit,
            offset,
            userId,
            context: {
              sessionId: req.headers["x-session-id"],
              deviceType: req.headers["x-device-type"] || "unknown",
              source: "discovery_fallback"
            }
          });

          // Mark these as trending for consistency in the frontend
          if (recommendations.length > 0) {
            recommendations = recommendations.map(rec => ({
              ...rec,
              reason: "trending",
              originalReason: rec.reason || "discovery"
            }));
          }
        } catch (fallbackError) {
          logger.error("Error in trending fallback to discovery:", fallbackError);
        }
      }

      // Debug log the score distribution
      if (process.env.NODE_ENV === "development" && recommendations.length > 0) {
        const scores = recommendations.map((rec) => rec.score);
        logger.debug("Trending score distribution", {
          min: Math.min(...scores),
          max: Math.max(...scores),
          avg: scores.reduce((a, b) => a + b, 0) / scores.length,
          count: scores.length,
          unique: new Set(scores.map((s) => s.toFixed(4))).size,
        });
      }

      // Preserve original scores but format for response
      let formattedRecommendations = recommendations
        .map((rec) => ({
          ...rec,
          score: parseFloat(rec.score.toFixed(4)),
          // Include raw score for tracking differentiation issues
          rawScore: rec.rawScore,
          productData: {
            ...rec.productData,
            trendingScore: rec.score,
            engagementMetrics: {
              views: rec.productData.views?.count || 0,
              upvotes: rec.productData.upvoteCount || 0,
              bookmarks: rec.productData.bookmarks?.length || 0,
            },
          },
        }))
        .sort((a, b) => b.score - a.score);

      // Enrich products with user interaction data if we have recommendations
      if (formattedRecommendations.length > 0) {
        const enrichedProducts = await enrichProductsWithUserInteractions(
          formattedRecommendations.map(rec => rec.productData),
          userId
        );

        // Update the recommendations with enriched product data
        formattedRecommendations = formattedRecommendations.map((rec, index) => ({
          ...rec,
          productData: enrichedProducts[index]
        }));
      }

      // Log the response size
      logger.info(`Returning ${formattedRecommendations.length} trending/fallback products`);

      res.status(200).json({
        success: true,
        data: formattedRecommendations,
        metadata: {
          total: formattedRecommendations.length,
          limit,
          offset,
          days: parsedDays,
          categoryId,
          strategy: "trending",
          hasFallback: formattedRecommendations.length > 0 &&
                      formattedRecommendations[0].originalReason &&
                      formattedRecommendations[0].originalReason !== "trending",
          scoreRange: {
            min: formattedRecommendations.length
              ? formattedRecommendations[formattedRecommendations.length - 1]
                  .score
              : 0,
            max: formattedRecommendations.length
              ? formattedRecommendations[0].score
              : 0,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error in getTrending", {
        userId: req.user?._id,
        error: error.message,
        stack: error.stack,
      });

      // Return an empty array with success status instead of error
      // This ensures the frontend gets a valid response
      res.status(200).json({
        success: true,
        data: [],
        metadata: {
          total: 0,
          limit: parseInt(rawLimit) || 10,
          offset: parseInt(rawOffset) || 0,
          days: parseInt(days) || 7,
          categoryId,
          strategy: "trending",
          error: true,
          errorMessage: "Failed to retrieve trending products",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getNew(req, res, next) {
    try {
      const { limit: rawLimit, offset: rawOffset, days = "14" } = req.query;
      const userId = req.user?._id || null;
      const { limit, offset } =
        RecommendationController.validatePaginationParams(rawLimit, rawOffset);
      const parsedDays = Math.max(parseInt(days) || 14, 1);

      // Log the request parameters
      logger.info(`New products request received`, {
        userId: userId?.toString() || 'anonymous',
        limit,
        offset,
        days: parsedDays
      });

      let recommendations =
        await StrategyRecommendationService.getNewProductRecommendations(
          userId,
          {
            limit,
            offset,
            days: parsedDays,
            context: { sessionId: req.headers["x-session-id"] },
          }
        );

      // If no recommendations found, try trending as a fallback
      if (!recommendations || recommendations.length === 0) {
        logger.info(`No new products found, falling back to trending recommendations`);
        recommendations = await StrategyRecommendationService.getTrendingRecommendations(
          userId,
          {
            limit,
            offset,
            days: 30, // Use a longer timeframe for fallback
            context: {
              sessionId: req.headers["x-session-id"],
              source: "trending_fallback"
            }
          }
        );
      }

      // Enrich products with user interaction data
      if (recommendations.length > 0) {
        const productsToEnrich = recommendations.map(rec => rec.productData || rec.product);
        const enrichedProducts = await enrichProductsWithUserInteractions(productsToEnrich, userId);

        // Update recommendations with enriched product data
        recommendations = recommendations.map((rec, index) => ({
          ...rec,
          productData: enrichedProducts[index]
        }));
      }

      // Log the response size
      logger.info(`Returning ${recommendations.length} new/fallback products`);

      res.status(200).json({
        success: true,
        data: recommendations,
        metadata: {
          total: recommendations.length,
          limit,
          offset,
          days: parsedDays,
          hasFallback: recommendations.length > 0 && recommendations[0].reason !== 'new',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error in getNew", {
        userId: req.user?._id,
        error: error.message,
        stack: error.stack
      });

      // Return an empty array with success status instead of error
      // This ensures the frontend gets a valid response
      res.status(200).json({
        success: true,
        data: [],
        metadata: {
          total: 0,
          limit: parseInt(rawLimit) || 10,
          offset: parseInt(rawOffset) || 0,
          days: parseInt(days) || 14,
          error: true,
          errorMessage: "Failed to retrieve new products",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static async getSimilar(req, res, next) {
    try {
      const { productId } = req.params;
      const { limit: rawLimit, offset: rawOffset } = req.query;
      const userId = req.user?._id || null;
      const { limit, offset } =
        RecommendationController.validatePaginationParams(rawLimit, rawOffset);

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid productId format" });
      }

      let recommendations =
        await StrategyRecommendationService.getSimilarProducts(
          userId,
          productId,
          { limit, offset }
        );

      // Enrich products with user interaction data
      if (recommendations.length > 0) {
        const productsToEnrich = recommendations.map(rec => rec.productData || rec.product);
        const enrichedProducts = await enrichProductsWithUserInteractions(productsToEnrich, userId);

        // Update recommendations with enriched product data
        recommendations = recommendations.map((rec, index) => ({
          ...rec,
          productData: enrichedProducts[index]
        }));
      }

      res.status(200).json({
        success: true,
        data: recommendations,
        metadata: {
          total: recommendations.length,
          productId,
          limit,
          offset,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error in getSimilar", {
        userId: req.user?._id,
        productId: req.params.productId,
        error: error.message,
      });
      next(error);
    }
  }

  static async getCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { limit: rawLimit, offset: rawOffset } = req.query;
      const userId = req.user?._id || null;
      const { limit, offset } =
        RecommendationController.validatePaginationParams(rawLimit, rawOffset);

      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid categoryId format" });
      }

      let recommendations =
        await StrategyRecommendationService.getCategoryRecommendations(
          userId,
          categoryId,
          { limit, offset }
        );

      // Enrich products with user interaction data
      if (recommendations.length > 0) {
        const productsToEnrich = recommendations.map(rec => rec.productData || rec.product);
        const enrichedProducts = await enrichProductsWithUserInteractions(productsToEnrich, userId);

        // Update recommendations with enriched product data
        recommendations = recommendations.map((rec, index) => ({
          ...rec,
          productData: enrichedProducts[index]
        }));
      }

      res.status(200).json({
        success: true,
        data: recommendations,
        metadata: {
          total: recommendations.length,
          categoryId,
          limit,
          offset,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error in getCategory", {
        userId: req.user?._id,
        categoryId: req.params.categoryId,
        error: error.message,
      });
      next(error);
    }
  }

  static async getTags(req, res, next) {
    try {
      const { tags, limit: rawLimit, offset: rawOffset } = req.query;
      const userId = req.user?._id || null;
      const { limit, offset } =
        RecommendationController.validatePaginationParams(rawLimit, rawOffset);

      const tagArray = tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];
      if (!tagArray.length) {
        return res
          .status(400)
          .json({ success: false, message: "At least one tag is required" });
      }

      let recommendations =
        await StrategyRecommendationService.getTagRecommendations(
          userId,
          tagArray,
          { limit, offset }
        );

      // Enrich products with user interaction data
      if (recommendations.length > 0) {
        const productsToEnrich = recommendations.map(rec => rec.productData || rec.product);
        const enrichedProducts = await enrichProductsWithUserInteractions(productsToEnrich, userId);

        // Update recommendations with enriched product data
        recommendations = recommendations.map((rec, index) => ({
          ...rec,
          productData: enrichedProducts[index]
        }));
      }

      res.status(200).json({
        success: true,
        data: recommendations,
        metadata: {
          total: recommendations.length,
          tags: tagArray,
          limit,
          offset,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error in getTags", {
        userId: req.user?._id,
        tags: req.query.tags,
        error: error.message,
      });
      next(error);
    }
  }

  static async getMaker(req, res, next) {
    try {
      const { makerId } = req.params;
      const { limit: rawLimit, offset: rawOffset } = req.query;
      const userId = req.user?._id || null;
      const { limit, offset } =
        RecommendationController.validatePaginationParams(rawLimit, rawOffset);

      if (!mongoose.Types.ObjectId.isValid(makerId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid makerId format" });
      }

      let recommendations =
        await StrategyRecommendationService.getMakerRecommendations(
          userId,
          makerId,
          { limit, offset }
        );

      // Enrich products with user interaction data
      if (recommendations.length > 0) {
        const productsToEnrich = recommendations.map(rec => rec.productData || rec.product);
        const enrichedProducts = await enrichProductsWithUserInteractions(productsToEnrich, userId);

        // Update recommendations with enriched product data
        recommendations = recommendations.map((rec, index) => ({
          ...rec,
          productData: enrichedProducts[index]
        }));
      }

      res.status(200).json({
        success: true,
        data: recommendations,
        metadata: {
          total: recommendations.length,
          makerId,
          limit,
          offset,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error in getMaker", {
        userId: req.user?._id,
        makerId: req.params.makerId,
        error: error.message,
      });
      next(error);
    }
  }

  static async getPersonalized(req, res, next) {
    try {
      const userId = req.user?._id;
      const isAuthenticated = !!userId;
      const {
        limit: rawLimit = 10,
        offset: rawOffset = 0,
        strategy = "personalized",
      } = req.query;
      const { limit, offset } =
        RecommendationController.validatePaginationParams(rawLimit, rawOffset);

      // Convert strategy to string to avoid issues with boolean values
      // This fixes the issue with strategy=false in the query params
      const normalizedStrategy = strategy === "false" || strategy === false
        ? "personalized"
        : String(strategy);

      // If user is not authenticated, fall back to trending recommendations
      if (!isAuthenticated) {
        logger.info(`User not authenticated, falling back to trending recommendations for personalized endpoint`);

        // Get trending recommendations as fallback
        let trendingRecommendations = await StrategyRecommendationService.getTrendingRecommendations(
          null, // No user ID for anonymous users
          {
            limit,
            offset,
            days: 30, // Use a longer timeframe for trending
            context: {
              sessionId: req.headers["x-session-id"],
              source: "trending_fallback_for_anonymous"
            }
          }
        );

        return res.status(200).json({
          success: true,
          data: trendingRecommendations,
          metadata: {
            total: trendingRecommendations.length,
            strategy: "trending_fallback",
            limit,
            offset,
            isAuthenticated: false,
            fallbackReason: "anonymous_user",
            timestamp: new Date().toISOString(),
          },
        });
      }

      logger.info(`Getting personalized recommendations with strategy: ${normalizedStrategy}`, {
        userId: userId.toString(),
        limit,
        offset
      });

      let recommendations =
        await RecommendationService.getRecommendationsForStrategy(
          normalizedStrategy,
          userId,
          {
            limit,
            offset,
            context: {
              source: "personalized",
              sessionId: req.headers["x-session-id"],
            },
          }
        );

      // Enrich products with user interaction data
      if (recommendations.length > 0) {
        const productsToEnrich = recommendations.map(rec => rec.productData || rec.product);
        const enrichedProducts = await enrichProductsWithUserInteractions(productsToEnrich, userId);

        // Update recommendations with enriched product data
        recommendations = recommendations.map((rec, index) => ({
          ...rec,
          productData: enrichedProducts[index]
        }));
      }

      await RecommendationController.trackFeedImpression(
        userId,
        recommendations,
        {
          type: "personalized",
          strategy,
          sessionId: req.headers["x-session-id"],
        }
      );

      res.status(200).json({
        success: true,
        data: recommendations,
        metadata: {
          total: recommendations.length,
          strategy,
          limit,
          offset,
          isAuthenticated: true,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error in getPersonalized", {
        userId: req.user?._id,
        error: error.message,
      });
      next(error);
    }
  }

  static async getHistory(req, res, next) {
    try {
      const userId = req.user._id;
      const userHistory = await UserContextService.getUserHistory(userId);

      if (!userHistory.viewedProducts?.length) {
        return res.status(200).json({
          success: true,
          message: "No history found",
          data: {
            interactionStats: { totalViews: 0, uniqueProducts: 0 },
            recentHistory: {},
          },
        });
      }

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const peakViewingTimes = Object.entries(userHistory.viewPatterns)
        .map(([day, hours]) => {
          const [maxHour, count] = Object.entries(hours).sort(
            ([, a], [, b]) => b - a
          )[0];
          return {
            day: dayNames[parseInt(day.replace("day", "")) - 1],
            hour: parseInt(maxHour.replace("hour", "")),
            count,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      res.status(200).json({
        success: true,
        data: {
          interactionStats: {
            totalViews: userHistory.stats.totalViews,
            uniqueProducts: userHistory.stats.uniqueProducts,
          },
          recentHistory: {
            viewedProducts: userHistory.viewedProducts.slice(0, 10),
            categories: userHistory.categories.slice(0, 5),
            tags: userHistory.tags.slice(0, 10),
          },
          insights: { peakViewingTimes },
        },
      });
    } catch (error) {
      logger.error("Error in getHistory", {
        userId: req.user._id,
        error: error.message,
      });
      next(error);
    }
  }

  static async getCollaborative(req, res, next) {
    try {
      const { limit: rawLimit, offset: rawOffset } = req.query;
      const userId = req.user?._id;
      const isAuthenticated = !!userId;
      const { limit, offset } =
        RecommendationController.validatePaginationParams(rawLimit, rawOffset);

      // If user is not authenticated, fall back to trending recommendations
      if (!isAuthenticated) {
        logger.info(`User not authenticated, falling back to trending recommendations for collaborative endpoint`);

        // Get trending recommendations as fallback
        let trendingRecommendations = await StrategyRecommendationService.getTrendingRecommendations(
          null, // No user ID for anonymous users
          {
            limit,
            offset,
            days: 30, // Use a longer timeframe for trending
            context: {
              sessionId: req.headers["x-session-id"],
              source: "trending_fallback_for_anonymous"
            }
          }
        );

        return res.status(200).json({
          success: true,
          data: trendingRecommendations,
          metadata: {
            total: trendingRecommendations.length,
            strategy: "trending_fallback",
            limit,
            offset,
            isAuthenticated: false,
            fallbackReason: "anonymous_user",
            timestamp: new Date().toISOString(),
          },
        });
      }

      let recommendations =
        await StrategyRecommendationService.getCollaborativeRecommendations(
          userId,
          { limit, offset }
        );

      // Enrich products with user interaction data
      if (recommendations.length > 0) {
        const productsToEnrich = recommendations.map(rec => rec.productData || rec.product);
        const enrichedProducts = await enrichProductsWithUserInteractions(productsToEnrich, userId);

        // Update recommendations with enriched product data
        recommendations = recommendations.map((rec, index) => ({
          ...rec,
          productData: enrichedProducts[index]
        }));
      }

      res.status(200).json({
        success: true,
        data: recommendations,
        metadata: {
          total: recommendations.length,
          limit,
          offset,
          isAuthenticated: true,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error in getCollaborative", {
        userId: req.user?._id,
        error: error.message,
      });
      next(error);
    }
  }

  static async getPreferences(req, res, next) {
    try {
      const { limit: rawLimit, offset: rawOffset } = req.query;
      const userId = req.user?._id;
      const { limit, offset } =
        RecommendationController.validatePaginationParams(rawLimit, rawOffset);

      let recommendations =
        await StrategyRecommendationService.getPreferenceRecommendations(
          userId,
          { limit, offset }
        );

      // Enrich products with user interaction data
      if (recommendations.length > 0) {
        const productsToEnrich = recommendations.map(rec => rec.productData || rec.product);
        const enrichedProducts = await enrichProductsWithUserInteractions(productsToEnrich, userId);

        // Update recommendations with enriched product data
        recommendations = recommendations.map((rec, index) => ({
          ...rec,
          productData: enrichedProducts[index]
        }));
      }

      res.status(200).json({
        success: true,
        data: recommendations,
        metadata: {
          total: recommendations.length,
          limit,
          offset,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error in getPreferences", {
        userId: req.user?._id,
        error: error.message,
      });
      next(error);
    }
  }

  static async getInterests(req, res, next) {
    try {
      const { limit: rawLimit, offset: rawOffset } = req.query;
      const userId = req.user?._id;
      const isAuthenticated = !!userId;
      const { limit, offset } =
        RecommendationController.validatePaginationParams(rawLimit, rawOffset);

      // If user is not authenticated, fall back to trending recommendations
      if (!isAuthenticated) {
        logger.info(`User not authenticated, falling back to trending recommendations for interests endpoint`);

        // Get trending recommendations as fallback
        let trendingRecommendations = await StrategyRecommendationService.getTrendingRecommendations(
          null, // No user ID for anonymous users
          {
            limit,
            offset,
            days: 30, // Use a longer timeframe for trending
            context: {
              sessionId: req.headers["x-session-id"],
              source: "trending_fallback_for_anonymous"
            }
          }
        );

        return res.status(200).json({
          success: true,
          data: trendingRecommendations,
          metadata: {
            total: trendingRecommendations.length,
            strategy: "trending_fallback",
            limit,
            offset,
            isAuthenticated: false,
            fallbackReason: "anonymous_user",
            timestamp: new Date().toISOString(),
          },
        });
      }

      let recommendations =
        await StrategyRecommendationService.getInterestBasedRecommendations(
          userId,
          { limit, offset }
        );

      // Enrich products with user interaction data
      if (recommendations.length > 0) {
        const productsToEnrich = recommendations.map(rec => rec.productData || rec.product);
        const enrichedProducts = await enrichProductsWithUserInteractions(productsToEnrich, userId);

        // Update recommendations with enriched product data
        recommendations = recommendations.map((rec, index) => ({
          ...rec,
          productData: enrichedProducts[index]
        }));
      }

      res.status(200).json({
        success: true,
        data: recommendations,
        metadata: {
          total: recommendations.length,
          limit,
          offset,
          isAuthenticated: true,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error in getInterests", {
        userId: req.user?._id,
        error: error.message,
      });
      next(error);
    }
  }

  static async updateInteraction(req, res, next) {
    try {
      const { productId, type, metadata = {} } = req.body;
      const userId = req.user?._id;

      // Add validation for productId
      if (!productId || productId === 'homepage' || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: "Valid product ID is required"
        });
      }

      if (!type) {
        return res.status(400).json({
          success: false,
          message: "Interaction type is required"
        });
      }

      const result = await UserContextService.updateAfterInteraction(
        userId,
        productId,
        type,
        {
          ...metadata,
          timestamp: metadata.timestamp || new Date().toISOString()
        }
      );

      await RecommendationInteraction.recordInteraction({
        user: userId,
        product: new mongoose.Types.ObjectId(productId),
        interactionType: type,
        recommendationType: metadata.recommendationType || metadata.source || "unknown",
        position: Number.isInteger(metadata.position) ? metadata.position : null,
        metadata: {
          ...metadata,
          timestamp: metadata.timestamp || new Date().toISOString(),
          requestUrl: metadata.url,
          referrer: metadata.referrer
        }
      });

      res.status(200).json({
        success: true,
        message: "Interaction recorded"
      });
    } catch (error) {
      logger.error("Error in updateInteraction", {
        userId: req.user?._id,
        error: error.message
      });
      next(error);
    }
  }

  static async dismissRecommendation(req, res, next) {
    try {
      const { productId, reason, source } = req.body;
      const userId = req.user?._id;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: "Valid productId is required",
        });
      }

      let rec =
        (await Recommendation.findOne({ user: userId })) ||
        new Recommendation({ user: userId });

      if (!rec.dismissedProducts.includes(productId)) {
        rec.dismissedProducts.push(productId);
        await rec.save();

        await RecommendationInteraction.recordInteraction({
          user: userId,
          product: new mongoose.Types.ObjectId(productId),
          interactionType: "dismiss",
          recommendationType: source || "unknown",
          metadata: {
            dismissal: {
              reason: reason || "unspecified",
              timestamp: new Date().toISOString(),
            },
          },
        });
      }

      res.status(200).json({
        success: true,
        message: "Recommendation dismissed",
      });
    } catch (error) {
      logger.error("Error in dismissRecommendation", {
        userId: req.user?._id,
        productId: req.body.productId,
        error: error.message,
      });
      next(error);
    }
  }

  static async getRecommendationStats(req, res, next) {
    try {
      const {
        period = "30d",
        groupBy = "day",
        strategy,
        includeSummary = "true",
        includeDetails = "true",
        includeEngagement = "true",
        includePerformance = "true",
        segmentBy = "all", // New: e.g., 'activeUsers', 'newUsers'
        forceRefresh = "false", // New: bypass cache
      } = req.query;

      // Validate period
      const startDate = parseStatsPeriod(period);
      if (!startDate) {
        return res.status(400).json({
          success: false,
          message: "Invalid period format (use 7d, 30d, etc.)",
        });
      }

      // Validate groupBy
      const validGroupings = [
        "day",
        "week",
        "month",
        "strategy",
        "category",
        "tag",
      ];
      if (!validGroupings.includes(groupBy)) {
        return res.status(400).json({
          success: false,
          message: `Invalid groupBy. Use: ${validGroupings.join(", ")}`,
        });
      }

      // Define user segment
      const userSegments = {
        all: {},
        activeUsers: { "metadata.sessionContext.isActive": true },
        newUsers: {
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      };
      const userSegment = userSegments[segmentBy] || userSegments.all;
      if (!userSegments[segmentBy]) {
        logger.warn(`Unknown segmentBy value: ${segmentBy}, defaulting to all`);
      }

      const options = {
        startDate,
        groupBy,
        strategy: strategy || undefined,
        userSegment,
        includeSummary: includeSummary === "true",
        includeDetails: includeDetails === "true",
        includeEngagement: includeEngagement === "true",
        includePerformance: includePerformance === "true",
        forceRefresh: forceRefresh === "true",
      };

      const [stats, insights] = await Promise.all([
        RecommendationStatsService.getComprehensiveStats(options),
        RecommendationStatsService.generateInsights(options),
      ]);

      const response = {
        success: true,
        data: {
          ...(options.includeSummary && {
            summary: {
              totalImpressions: stats.summary.totalImpressions,
              totalClicks: stats.summary.totalClicks,
              totalViews: stats.summary.totalViews,
              totalConversions: stats.summary.totalConversions,
              uniqueUsers: stats.summary.uniqueUsers,
              clickThroughRate: stats.summary.clickThroughRate,
              conversionRate: stats.summary.conversionRate,
              engagementRate: stats.summary.engagementRate,
              cacheStats: stats.summary.cacheStats,
              performanceStats: stats.summary.performanceStats,
              effectiveness: stats.summary.effectiveness,
              relevance: stats.summary.relevance,
              benchmarks: await RecommendationStatsService.getBenchmarks({
                timestamp: { $gte: startDate },
              }),
            },
          }),
          timeSeriesData: stats.timeSeriesData.map((d) => ({
            date: d._id,
            impressions: d.impressions,
            clicks: d.clicks,
            clickThroughRate: d.clickThroughRate,
            avgEngagementQuality: d.avgEngagementQuality,
          })),
          ...(options.includePerformance && {
            strategyPerformance: stats.strategyPerformance,
          }),
          ...(options.includeEngagement && {
            engagementMetrics: stats.engagementMetrics,
          }),
          ...(options.includeDetails && {
            categoryBreakdown: stats.categoryBreakdown,
            tagAnalysis: stats.tagAnalysis,
          }),
          insights: {
            topPerforming: insights.topPerforming,
            recommendations: insights.improvements,
            trends: insights.trends,
            anomalies: insights.anomalies,
            dataQuality: insights.cleanupImpact,
            effectiveness: insights.effectiveness,
            relevance: insights.relevance,
          },
        },
        metadata: {
          period,
          groupBy,
          segmentBy,
          startDate: startDate.toISOString(),
          generatedAt: new Date().toISOString(),
          cacheStatus: options.forceRefresh ? "fresh" : "cached",
          dataQuality: insights.cleanupImpact,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error("Error fetching recommendation stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch stats",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  static async regenerateRecommendations(req, res, next) {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid userId format",
        });
      }

      const result = await Recommendation.generateRecommendations(userId, {
        forceRefresh: true,
      });

      res.status(200).json({
        success: !!result,
        message: result
          ? "Recommendations regenerated"
          : "Failed to regenerate recommendations",
        count: result?.recommendedProducts?.length || 0,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error in regenerateRecommendations", {
        userId: req.params.userId,
        error: error.message,
      });
      next(error);
    }
  }

  static async trackFeedImpression(userId, recommendations, options = {}) {
    try {
      const { type = "default", sessionId = null, strategy = null } = options;
      if (!recommendations?.length || !userId) return;

      const impressions = recommendations.map((rec, index) => ({
        user: userId,
        product: rec.product?._id || rec.product,
        recommendationType: type,
        strategy,
        interactionType: "impression",
        position: index,
        score: rec.score || 0,
        reason: rec.reason || "unknown",
        metadata: { sessionId, timestamp: new Date().toISOString() },
      }));

      await RecommendationInteraction.insertMany(impressions);
    } catch (error) {
      logger.error("Error in trackFeedImpression", {
        userId,
        type,
        error: error.message,
      });
    }
  }

  static async getHybridRecommendations(req, res, next) {
    try {
      const {
        limit: rawLimit = 20,
        offset: rawOffset = 0,
        blend = "standard", // Options: standard, discovery, trending, personalized
        category = null, // Filter by category ID
        tags = null, // Filter by tags (comma-separated)
        sortBy = "score", // Sort option (score, created, upvotes, trending)
        forceRefresh = "false", // Option to force refresh cache
      } = req.query;

      const userId = req.user?._id || null;
      const isAuthenticated = !!userId;
      const { limit, offset } =
        RecommendationController.validatePaginationParams(rawLimit, rawOffset);

      // If user is not authenticated and blend is personalized, switch to standard
      const effectiveBlend = (!isAuthenticated && blend === 'personalized') ? 'standard' : blend;

      // Validate category if provided
      if (category && !mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID format",
        });
      }

      // Parse tags if provided
      const parsedTags = tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      // Validate sort option
      const validSortOptions = ["score", "created", "upvotes", "trending"];
      const validatedSortBy = validSortOptions.includes(sortBy)
        ? sortBy
        : "score";

      // Parse forceRefresh option
      const shouldForceRefresh = forceRefresh === "true";

      // Enhanced context with more metadata
      const context = {
        sessionId: req.headers["x-session-id"],
        deviceType: req.headers["x-device-type"] || "unknown",
        userAgent: req.headers["user-agent"],
        isAuthenticated,
        blend,
        requestTime: new Date().toISOString(),
        category,
        tags: parsedTags,
        sortBy: validatedSortBy,
      };

      // Set cache control headers based on authentication status
      if (!shouldForceRefresh) {
        res.setRecommendationCacheHeaders(isAuthenticated ? 300 : 900); // 5 min for auth, 15 min for anon
      }

      const startTime = Date.now();
      let recommendations =
        await RecommendationService.getHybridRecommendations(userId, {
          limit,
          offset,
          blend: effectiveBlend,
          category,
          tags: parsedTags,
          sortBy: validatedSortBy,
          context: {
            ...context,
            blend: effectiveBlend // Update context with effective blend
          },
          forceRefresh: shouldForceRefresh,
        });

      // Enrich products with user interaction data
      if (recommendations.length > 0) {
        const productsToEnrich = recommendations.map(rec => rec.productData || rec.product);
        const enrichedProducts = await enrichProductsWithUserInteractions(productsToEnrich, userId);

        // Update recommendations with enriched product data
        recommendations = recommendations.map((rec, index) => ({
          ...rec,
          productData: enrichedProducts[index]
        }));
      }

      // Track impressions for authenticated users
      if (userId) {
        // Use a non-blocking approach to avoid delaying the response
        RecommendationController.trackFeedImpression(
          userId,
          recommendations,
          {
            type: "hybrid",
            sessionId: context.sessionId,
            blend: effectiveBlend,
          }
        ).catch(err => {
          logger.warn("Failed to track impression", { error: err.message, userId });
        });
      }

      const responseTime = Date.now() - startTime;

      // Calculate source distribution
      const sourceDistribution = recommendations.reduce((acc, rec) => {
        const source = rec.reason || "unknown";
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      // Get categories represented in results
      const categoryDistribution = recommendations.reduce((acc, rec) => {
        const categoryName = rec.productData?.category?.name;
        if (categoryName) {
          acc[categoryName] = (acc[categoryName] || 0) + 1;
        }
        return acc;
      }, {});

      // Calculate score statistics
      const scores = recommendations.map((rec) => rec.score);
      const scoreStats = scores.length
        ? {
            min: Math.min(...scores),
            max: Math.max(...scores),
            avg: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(4)),
          }
        : { min: 0, max: 0, avg: 0 };

      // Generate next offset for pagination
      // If we got fewer results than requested, there are likely no more results
      const nextOffset = offset + recommendations.length;
      const hasMore = recommendations.length >= limit && recommendations.length > 0;

      res.status(200).json({
        success: true,
        data: recommendations,
        metadata: {
          total: recommendations.length,
          limit,
          offset,
          nextOffset: hasMore ? nextOffset : null,
          hasMore,
          isPersonalized: isAuthenticated,
          blend: effectiveBlend,
          originalBlend: blend,
          performanceMs: responseTime,
          scoreStats,
          sourceDistribution,
          filters: {
            category: category || null,
            tags: parsedTags.length ? parsedTags : null,
            sortBy: validatedSortBy,
          },
          categoryDistribution,
          timestamp: new Date().toISOString(),
          cacheStatus: shouldForceRefresh ? "fresh" : "cached",
        },
      });

      // Log performance metrics
      logger.info("Hybrid recommendation served", {
        isAuthenticated,
        responseTime,
        itemCount: recommendations.length,
        blend,
        sourceDistribution,
        cacheStatus: shouldForceRefresh ? "fresh" : "cached",
      });
    } catch (error) {
      logger.error("Error in getHybridRecommendations", {
        userId: req.user?._id,
        error: error.message,
      });
      next(error);
    }
  }

  // Process user feedback on recommendations
  static async processRecommendationFeedback(req, res, next) {
    try {
      const { productId, action, source } = req.body;
      const userId = req.user?._id;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: "Valid productId is required",
        });
      }

      if (!["like", "dislike", "not_interested"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Action must be 'like', 'dislike', or 'not_interested'",
        });
      }

      // Process feedback based on action
      let result;
      const productIdObj = new mongoose.Types.ObjectId(productId);

      switch (action) {
        case "like":
          // Similar to an upvote, boost this content type
          result = await UserContextService.updateAfterInteraction(
            userId,
            productId,
            "upvote",
            {
              source: source || "feedback",
              feedbackType: "like",
            }
          );
          break;

        case "dislike":
          // Reduce preference for this type of content
          result = await UserContextService.updatePreferences(
            userId,
            productIdObj,
            { adjustScore: -5 }, // Significantly reduce score for this category/tags
            {
              source: source || "feedback",
              feedbackType: "dislike",
            }
          );
          break;

        case "not_interested":
          // Add to dismissed products
          result = await RecommendationController.dismissRecommendation(
            {
              user: { _id: userId },
              body: {
                productId,
                reason: "user_feedback",
                source: source || "feedback",
              },
            },
            {
              status: () => ({ json: () => {} }), // Mock response object
            }
          );
          break;
      }

      // Record the feedback interaction
      await RecommendationInteraction.recordInteraction({
        user: userId,
        product: productIdObj,
        interactionType: "feedback",
        recommendationType: source || "unknown",
        metadata: {
          feedbackType: action,
          timestamp: new Date().toISOString(),
        },
      });

      // Invalidate relevant caches
      await recommendationCacheService.invalidateUserCache(userId, {
        invalidateAll: true,
      });

      res.status(200).json({
        success: true,
        message: `Feedback "${action}" recorded successfully`,
        action,
        productId,
      });
    } catch (error) {
      logger.error("Error processing recommendation feedback", {
        userId: req.user?._id,
        productId: req.body.productId,
        action: req.body.action,
        error: error.message,
      });
      next(error);
    }
  }
}

export default RecommendationController;
