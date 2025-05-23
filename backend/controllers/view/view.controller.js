import mongoose from "mongoose";
import View from "../../models/view/view.model.js";
import Product from "../../models/product/product.model.js";
import RecommendationService from "../../services/recommendation/recommendations.service.js";
import { AppError } from "../../utils/logging/error.js"; // Assuming standard error class
import logger from "../../utils/logging/logger.js";
import { detectBot } from "../../utils/auth/botDetection.js";
import { generateViewInsights } from "../../utils/data/viewInsights.utils.js";
import {io} from "../../socket/socket.js";

// For caching
let cache;
try {
  cache = await import('../../utils/cache/cache.js').then(module => module.cache);
} catch (err) {
  logger.warn('Cache module not available, proceeding without caching');
  cache = { del: () => Promise.resolve() };
}

/**
 * Broadcast view updates to connected clients
 * @param {string} productId - The product ID
 * @param {Object} viewData - View data to broadcast
 */
const broadcastViewUpdate = (productId, viewData) => {
  try {
    if (!io) {
      logger.warn('Socket.io not initialized, skipping view broadcast');
      return;
    }

    // Broadcast to product room
    io.to(`product:${productId}`).emit('product:view:update', {
      productId,
      ...viewData,
      timestamp: Date.now()
    });

    // If we have maker ID, also broadcast to maker
    if (viewData.makerId) {
      io.to(`user:${viewData.makerId}`).emit('product:view:update', {
        productId,
        ...viewData,
        timestamp: Date.now()
      });
    }

    logger.debug(`Broadcasted view update for product ${productId}`);
  } catch (error) {
    logger.error(`Failed to broadcast view update: ${error.message}`);
    // Don't throw - this is a non-critical operation
  }
};

// === Helper Functions ===

const createError = (status, message) => {
  const error = new AppError(message, status);
  return error;
};

// === Controller Methods ===

/**
 * Records a view, updates product stats (implicitly via service), and recommendation profile.
 * @route POST /api/views/product/:id
 * @access Public
 */
export const recordProductView = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user?._id;
    const {
      source,
      referrer,
      viewDuration,
      scrollDepth,
      timeOnPage,
      recommendationType,
      position,
      clientId,
      metadata,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(createError(400, "Invalid product ID format."));
    }

    // Find product and ensure it exists before creating a view
    const product = await Product.findById(productId);
    if (!product) {
      return next(createError(404, "Product not found."));
    }

    const userAgent = req.headers["user-agent"] || "Unknown";
    const isBot = detectBot(userAgent);

    if (isBot) {
      logger.debug(`Bot view detected and skipped for product: ${productId}`);
      return res
        .status(200)
        .json({ success: true, message: "Bot view ignored." });
    }

    // Enhanced deduplication: Check for recent views from this client/user
    // to prevent duplicate view counts from page refreshes or component re-renders
    const deduplicationWindow = new Date();
    deduplicationWindow.setMinutes(deduplicationWindow.getMinutes() - 30); // 30-minute window

    const existingViewQuery = {
      product: productId,
      createdAt: { $gte: deduplicationWindow },
      isBot: false,
    };

    // Add user ID if available for logged-in users
    if (userId) {
      existingViewQuery.user = userId;
    }
    // Otherwise use clientId for anonymous users if available
    else if (clientId) {
      existingViewQuery.clientId = clientId;
    }
    // If neither is available, use IP address as fallback
    else {
      existingViewQuery.ip = req.ip;
    }

    const existingView = await View.findOne(existingViewQuery).sort({ createdAt: -1 });

    if (existingView) {
      logger.info(`Duplicate view detected for product ${productId} within deduplication window`, {
        userId: userId || 'anonymous',
        existingViewId: existingView._id,
        timeSinceLastView: (new Date() - existingView.createdAt) / 1000 + ' seconds'
      });

      // Return success but indicate it was a duplicate
      return res.status(200).json({
        success: true,
        message: "View already recorded recently.",
        isDuplicate: true,
        productViews: {
          count: product.views.count,
          unique: product.views.unique,
        },
      });
    }

    const geoData = {
      country:
        req.headers["cf-ipcountry"] || req.headers["x-country-code"] || null,
      region: req.headers["cf-region"] || null,
      city: req.headers["cf-city"] || null,
    };

    const viewData = {
      product: productId,
      user: userId || null,
      clientId: clientId || null, // Store client ID for anonymous user tracking
      source: source || "unknown",
      referrer: referrer || null,
      userAgent: userAgent,
      ip: req.ip,
      isBot: false,
      ...geoData,
      viewDuration: typeof viewDuration === "number" ? viewDuration : null,
      engagement: {
        scrollDepth:
          typeof scrollDepth === "number"
            ? Math.min(Math.max(scrollDepth, 0), 100)
            : null,
      },
      metadata: metadata || {}, // Store additional metadata
    };

    // Create the view document
    const view = new View(viewData);
    await view.save();

    logger.info(`View recorded for product ${productId}`, { userId, viewId: view._id });

    // CRITICAL FIX: Update product and manually sync values to ensure consistency
    // Pass both userId and clientId to properly track unique views
    const updateResult = await product.recordView(userId, clientId);

    logger.info(`Product view count updated for ${productId}`, {
      count: product.views.count,
      unique: product.views.unique,
      isNewUniqueUser: updateResult.isNewUniqueUser
    });

    // Selectively synchronize if needed - this will be debounced by the syncViewsWithProduct method
    if (updateResult.isNewUniqueUser) {
      // Only do full sync for new unique users or every 5th view
      try {
        const syncResult = await View.syncViewsWithProduct(productId);
        if (!syncResult?.skipped) {
          logger.info(`View synchronized with product ${productId}`, {
            productViews: product.views.count,
            productUniqueViews: product.views.unique
          });
        }
      } catch (error) {
        // Non-critical error, just log it
        logger.warn(`View sync failed for product ${productId}: ${error.message}`);
      }
    }

    // Cache the view count for quick access
    if (cache) {
      try {
        // First, invalidate any existing cache keys related to this product's views
        const countKey = cache.generateKey('views', `product:${productId}:count`, null);
        const statsKey = cache.generateKey('views', `product:${productId}:stats`, null);
        const popularKey = cache.generateKey('views', 'popular', null);

        await Promise.all([
          cache.del(countKey),
          cache.del(statsKey),
          cache.del(popularKey)
        ]);

        logger.info(`Invalidated cache keys for product ${productId} views`);

        // Then set the new cache
        await cache.set(countKey, {
          count: product.views.count,
          unique: product.views.unique,
          lastUpdated: new Date().toISOString()
        }, 3600); // Cache for 1 hour

        logger.info(`Updated cache for product ${productId} view count: ${product.views.count}`);
      } catch (cacheError) {
        logger.error(`Error updating view cache for product ${productId}: ${cacheError.message}`);
        // Continue execution - don't fail the request due to cache error
      }
    }

    // Broadcast view update to connected clients
    broadcastViewUpdate(productId, {
      count: product.views.count,
      unique: product.views.unique,
      makerId: product.maker?.toString(),
      viewType: 'new',
      isUnique: updateResult.isNewUniqueUser
    });

    if (userId) {
      await RecommendationService.updateAfterInteraction(
        userId,
        productId,
        "view",
        {
          viewDuration,
          scrollDepth,
          timeOnPage,
          referrer,
          source,
          recommendationType,
          position,
        }
      );
    }

    res
      .status(201)
      .json({
        success: true,
        message: "View recorded successfully.",
        productViews: {
          count: product.views.count,
          unique: product.views.unique,
        },
      });
  } catch (error) {
    logger.error("Failed to record product view:", {
      message: error.message,
      stack: error.stack,
      productId: req.params.id,
      userId: req.user?._id,
    });
    next(createError(500, "Failed to record view. Please try again later."));
  }
};

/**
 * Get user's view history with pagination.
 * @route GET /api/views/history
 * @access Private
 */
export const getUserViewHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Limit max page size
    const skip = (page - 1) * limit;

    const [views, total] = await Promise.all([
      View.find({ user: userId, isBot: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "product",
          select: "name slug thumbnail tagline maker category",
          populate: {
            path: "maker",
            select: "firstName lastName profilePicture.url",
          },
        })
        .lean(),
      View.countDocuments({ user: userId, isBot: false }),
    ]);

    const response = {
      success: true,
      data: views,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Failed to get user view history for ${req.user._id}:`, error);
    next(createError(500, "Failed to fetch view history."));
  }
};

/**
 * Get aggregated view statistics for a product with enhanced data and optimization.
 * @route GET /api/views/product/:id/stats
 * @access Private (Product owner or admin)
 */
export const getProductViewStats = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const days = parseInt(req.query.days, 10) || 7; // Default to 7 days
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(createError(400, "Invalid product ID format."));
    }
    // Fetch product to check ownership/existence
    const product = await Product.findById(productId)
      .select("maker status name thumbnail views")
      .lean();
    if (!product) {
      return next(createError(404, "Product not found."));
    }
    
    // Authorization check - only required if product is not public or is draft
    if (product.status === 'draft' && req.user) {
      if (
        req.user.role !== "admin" &&
        product.maker?.toString() !== req.user._id.toString()
      ) {
        return next(
          createError(403, "You are not authorized to view these statistics.")
        );
      }
    } else if (product.status === 'draft' && !req.user) {
      return next(createError(403, "Authentication required to view draft product statistics."));
    }

    // Try to get stats from cache first
    let stats = null;
    const cacheKey = cache ? cache.generateKey('views', `product:${productId}:stats`, `days:${days}`) : null;

    if (cache) {
      stats = await cache.get(cacheKey);
      if (stats) {
        logger.debug(`Using cached view stats for product ${productId}`);
      }
    }

    if (!stats) {
      // Get stats without unnecessary sync which might already be happening
      try {
        // Fetch stats using the model's static method
        stats = await View.getProductStats(productId, days);

        // Cache the results
        if (cache && stats) {
          await cache.set(cacheKey, stats, 1800); // Cache for 30 minutes
          logger.debug(`Cached view stats for product ${productId}`);
        }
      } catch (error) {
        logger.error(`Error getting product stats: ${error.message}`);
        stats = { error: error.message };
      }
    }
    if (stats.error) {
      // Handle errors reported by the static method
      logger.error(`Error getting product stats: ${stats.error}`);
    }
    // Calculate engagement metrics
    let engagementMetrics = {};
    try {
      engagementMetrics = await View.calculateEngagementMetrics(
        productId,
        days
      );
      // Check if metrics are incomplete but product has data
      if (
        engagementMetrics.totalViews === 0 &&
        product.views &&
        product.views.count > 0
      ) {
        logger.warn(
          `View stats missing for product ${productId}, but product has ${product.views.count} views. Attempting to sync...`
        );
        // Use product view counts as fallback
        engagementMetrics = {
          ...engagementMetrics,
          totalViews: product.views.count,
          uniqueViewersCount: product.views.unique,
        };
        // Trigger background sync
        View.syncViewsWithProduct(productId).catch((err) => {
          logger.error(
            `Background view sync failed for ${productId}: ${err.message}`
          );
        });
      }
    } catch (engagementError) {
      logger.error(`Error calculating engagement metrics for ${productId}:`, {
        message: engagementError.message,
        stack: engagementError.stack,
      });
      // Continue without engagement metrics rather than failing the entire request
      engagementMetrics = {
        totalViews: product.views?.count || 0,
        uniqueViewers: [],
        uniqueViewersCount: product.views?.unique || 0,
        averageViewDuration: 0,
        maxScrollDepth: 0,
        timeToFirstInteraction: 0,
      };
    }
    // Format engagement metrics for response
    const formattedEngagementMetrics = {
      totalViews: engagementMetrics.totalViews,
      uniqueViewers: engagementMetrics.uniqueViewersCount || 0,
      averageViewDuration: engagementMetrics.averageViewDuration || 0,
      maxScrollDepth: engagementMetrics.maxScrollDepth || 0,
      timeToFirstInteraction: engagementMetrics.timeToFirstInteraction || 0,
    };
    // Generate insights based on the stats
    const insights = generateViewInsights(stats, formattedEngagementMetrics);

    const response = {
      success: true,
      stats: {
        ...stats,
        engagementMetrics: formattedEngagementMetrics,
        insights,
      },
      productDetails: {
        // Include basic product info for context
        _id: product._id,
        name: product.name,
        status: product.status,
        thumbnail: product.thumbnail,
      },
    };
    // Caching is handled by middleware `viewCache('product_stats', ...)`

    res.status(200).json(response);
  } catch (error) {
    // Log detailed error but send generic message
    logger.error(`Failed to get product view stats for ${req.params.id}:`, {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id?.toString() || 'anonymous',
    });
    next(createError(500, "Failed to fetch view statistics."));
  }
};

/**
 * Get platform-wide daily view analytics.
 * @route GET /api/views/analytics/daily
 * @access Private (Admin only)
 */
export const getDailyViewAnalytics = async (req, res, next) => {
  // Admin check is handled by middleware `restrictTo('admin')`
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return next(
        createError(
          400,
          "startDate and endDate query parameters are required (YYYY-MM-DD)."
        )
      );
    }
    // Basic date validation (more robust validation can be added)
    if (
      isNaN(new Date(startDate).getTime()) ||
      isNaN(new Date(endDate).getTime())
    ) {
      return next(
        createError(400, "Invalid date format. Please use YYYY-MM-DD.")
      );
    }

    const analytics = await View.getDailyAnalytics(startDate, endDate);

    const response = { success: true, data: analytics };

    // Caching handled by middleware `viewCache('daily_analytics', ...)`

    res.status(200).json(response);
  } catch (error) {
    logger.error("Failed to get daily view analytics:", error);
    next(createError(500, "Failed to fetch daily analytics data."));
  }
};

/**
 * Get popular products based on recent views.
 * @route GET /api/views/popular
 * @access Public
 */
export const getPopularProducts = async (req, res, next) => {
  try {
    let { limit = 10, period = "week" } = req.query;
    limit = Math.min(parseInt(limit) || 10, 30); // Sanitize limit
    const validPeriods = ["day", "week", "month", "year"];
    if (!validPeriods.includes(period)) period = "week"; // Default to week if invalid
    const periodDays = { day: 1, week: 7, month: 30, year: 365 }[period];

    // Try to get from cache first
    let popularProducts = null;
    const cacheKey = cache ? cache.generateKey('views', 'popular', `period:${period}:limit:${limit}`) : null;

    if (cache) {
      popularProducts = await cache.get(cacheKey);
      if (popularProducts) {
        logger.debug(`Using cached popular products for period ${period}`);
      }
    }

    if (!popularProducts) {
      popularProducts = await View.getPopularProducts(limit, periodDays);

      // Cache the results
      if (cache && popularProducts && popularProducts.length > 0) {
        // Cache for different durations based on period
        const cacheTTL = {
          day: 900,     // 15 minutes for daily
          week: 3600,   // 1 hour for weekly
          month: 7200,  // 2 hours for monthly
          year: 14400   // 4 hours for yearly
        }[period] || 3600;

        await cache.set(cacheKey, popularProducts, cacheTTL);
        logger.debug(`Cached popular products for period ${period}`);
      }
    }

    const response = {
      success: true,
      results: popularProducts.length,
      data: popularProducts,
      meta: { period: period, limit: limit },
    };
    // Caching handled by middleware `viewCache('popular', ...)`

    res.status(200).json(response);
  } catch (error) {
    logger.error("Failed to get popular products:", error);
    next(createError(500, "Failed to fetch popular products."));
  }
};

/**
 * Get device/browser/OS breakdown for a product's views.
 * @route GET /api/views/product/:id/devices
 * @access Private (Product owner or admin)
 */
export const getProductDeviceAnalytics = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const days = parseInt(req.query.days, 10) || 30;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(createError(400, "Invalid product ID format."));
    }

    // Fetch product for auth check
    const product = await Product.findById(productId).select("maker status").lean();
    if (!product) {
      return next(createError(404, "Product not found."));
    }
    
    // Authorization check - only required if product is not public or is draft
    if (product.status === 'draft' && req.user) {
      if (
        req.user.role !== "admin" &&
        product.maker?.toString() !== req.user._id.toString()
      ) {
        return next(
          createError(403, "You are not authorized to view these statistics.")
        );
      }
    } else if (product.status === 'draft' && !req.user) {
      return next(createError(403, "Authentication required to view draft product statistics."));
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Use aggregate queries to get counts for each dimension
    const [deviceData, browserData, osData] = await Promise.all([
      View.aggregate([
        {
          $match: {
            product: product._id,
            createdAt: { $gte: startDate },
            isBot: false,
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$device", "other"] },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, device: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
      View.aggregate([
        {
          $match: {
            product: product._id,
            createdAt: { $gte: startDate },
            isBot: false,
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$browser", "other"] },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, browser: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
      View.aggregate([
        {
          $match: {
            product: product._id,
            createdAt: { $gte: startDate },
            isBot: false,
          },
        },
        {
          $group: { _id: { $ifNull: ["$os", "other"] }, count: { $sum: 1 } },
        },
        { $project: { _id: 0, os: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const response = {
      success: true,
      data: {
        devices: deviceData,
        browsers: browserData,
        operatingSystems: osData,
      },
      meta: { productId, days },
    };
    // Caching handled by middleware `viewCache('product_device_analytics', ...)`

    res.status(200).json(response);
  } catch (error) {
    logger.error(
      `Failed to get device analytics for product ${req.params.id}:`,
      {
        message: error.message,
        stack: error.stack,
        userId: req.user?._id?.toString() || 'anonymous'
      }
    );
    next(createError(500, "Failed to fetch device analytics."));
  }
};

/**
 * Get engagement metrics for a specific user.
 * @route GET /api/views/user/:id/engagement (or /api/views/engagement for self)
 * @access Private (Self or admin)
 */
export const getUserEngagementMetrics = async (req, res, next) => {
  try {
    const targetUserId = req.params.id || req.user._id; // Allow admin to specify ID
    const days = parseInt(req.query.days, 10) || 30;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return next(createError(400, "Invalid user ID format."));
    }

    // Authorization: Allow self or admin
    if (
      req.user.role !== "admin" &&
      targetUserId.toString() !== req.user._id.toString()
    ) {
      return next(
        createError(403, "You are not authorized to view these metrics.")
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const userObjectId = new mongoose.Types.ObjectId(targetUserId);

    // --- Fetch various engagement stats using aggregations ---
    // Example: Views over time (can reuse parts from View model static if preferred)
    const viewsOverTime = await View.aggregate([
      {
        $match: {
          user: userObjectId,
          createdAt: { $gte: startDate },
          isBot: false,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "UTC",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $project: { date: "$_id", count: 1, _id: 0 } },
      { $sort: { date: 1 } },
    ]);

    // Example: Top categories viewed
    const categoryViews = await View.aggregate([
      {
        $match: {
          user: userObjectId,
          createdAt: { $gte: startDate },
          isBot: false,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },
      { $group: { _id: "$productData.category", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      { $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } }, // Keep if category deleted
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { category: "$categoryData.name", count: 1, _id: 0 } },
    ]);

    // Example: Summary counts
    const [totalViewsData, uniqueProductsData, avgDurationData] =
      await Promise.all([
        View.countDocuments({
          user: userObjectId,
          createdAt: { $gte: startDate },
          isBot: false,
        }),
        View.distinct("product", {
          user: userObjectId,
          createdAt: { $gte: startDate },
          isBot: false,
        }),
        View.aggregate([
          {
            $match: {
              user: userObjectId,
              createdAt: { $gte: startDate },
              viewDuration: { $exists: true, $ne: null },
              isBot: false,
            },
          },
          { $group: { _id: null, avg: { $avg: "$viewDuration" } } },
        ]),
      ]);

    const response = {
      success: true,
      data: {
        summary: {
          totalViews: totalViewsData,
          uniqueProductsViewed: uniqueProductsData.length,
          averageViewDuration: avgDurationData[0]?.avg || 0,
          timeframeDays: days,
        },
        viewsOverTime,
        topCategories: categoryViews,
      },
    };
    // Caching handled by middleware `viewCache('user_engagement', ...)`

    res.status(200).json(response);
  } catch (error) {
    logger.error(
      `Failed to get user engagement metrics for ${
        req.params.id || req.user._id
      }:`,
      error
    );
    next(createError(500, "Failed to fetch engagement metrics."));
  }
};

/**
 * Clear the calling user's view history.
 * @route DELETE /api/views/history
 * @access Private
 */
export const clearUserViewHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Perform deletion
    const { deletedCount } = await View.deleteMany({ user: userId });

    logger.info(`User ${userId} cleared ${deletedCount} view history records.`);

    // Clear relevant user caches (history pagination etc.)
    // Using a pattern assumes Redis and SCAN/KEYS capability
    try {
      const cacheKeys = await cache.getClient().keys(`view:user:${userId}:*`);
      if (cacheKeys && cacheKeys.length > 0) {
        await cache.del(cacheKeys);
        logger.info(
          `Cleared ${cacheKeys.length} view cache entries for user ${userId}`
        );
      }
    } catch (cacheError) {
      logger.warn(
        `Could not clear view cache for user ${userId} after history deletion: ${cacheError.message}`
      );
    }
    res.status(200).json({
      success: true,
      message: `Successfully cleared ${deletedCount} view history records.`,
    });
  } catch (error) {
    logger.error(
      `Failed to clear user view history for ${req.user._id}:`,
      error
    );
    next(createError(500, "Failed to clear view history."));
  }
};

/**
 * Update view duration and engagement metrics for an existing view
 * @route POST /api/views/product/:id/duration
 * @access Public (with optional auth)
 */
export const updateViewDuration = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user?._id;
    const { viewDuration, scrollDepth, exitPage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(createError(400, "Invalid product ID format."));
    }

    if (!viewDuration || typeof viewDuration !== 'number' || viewDuration < 1) {
      return res.status(200).json({
        success: true,
        message: "Skipped recording view duration (too short or invalid)."
      });
    }

    // Find the most recent view for this product by this user/session
    const filter = {
      product: productId,
      isBot: false
    };

    // If user is authenticated, use their ID
    if (userId) {
      filter.user = userId;
    } else if (req.body.sessionId) {
      // Otherwise use session ID if provided
      filter.sessionId = req.body.sessionId;
    } else {
      // If neither user ID nor session ID, use IP as fallback
      filter.ip = req.ip;
    }

    // Find the most recent view to update
    const recentView = await View.findOne(filter).sort({ createdAt: -1 });

    if (!recentView) {
      // If no view found, create a new one with duration
      logger.info(`No existing view found for duration update. Creating new view record for product ${productId}`);

      // Create a new view with duration included
      const viewData = {
        product: productId,
        user: userId || null,
        viewDuration,
        exitPage: exitPage || null,
        engagement: {
          scrollDepth: typeof scrollDepth === 'number' ? Math.min(Math.max(scrollDepth, 0), 100) : null
        },
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "Unknown",
        isBot: false
      };

      const view = new View(viewData);
      await view.save();

      return res.status(201).json({
        success: true,
        message: "New view with duration recorded successfully."
      });
    }

    // Update the existing view with duration and engagement data
    recentView.viewDuration = viewDuration;

    if (exitPage) {
      recentView.exitPage = exitPage;
    }

    if (typeof scrollDepth === 'number') {
      recentView.engagement = recentView.engagement || {};
      recentView.engagement.scrollDepth = Math.min(Math.max(scrollDepth, 0), 100);
    }

    await recentView.save();

    // Get product for maker ID and view counts
    const product = await Product.findById(productId).select('maker views').lean();

    // Update cache with the latest engagement data
    if (cache && product) {
      // Cache engagement data
      const engagementCacheKey = cache.generateKey('views', `product:${productId}:engagement`, null);
      await cache.set(engagementCacheKey, {
        viewDuration,
        scrollDepth,
        exitPage,
        lastUpdated: new Date().toISOString()
      }, 3600); // Cache for 1 hour
    }

    // Broadcast view duration update to connected clients
    if (product) {
      broadcastViewUpdate(productId, {
        viewDuration,
        scrollDepth,
        makerId: product.maker?.toString(),
        viewType: 'duration',
        count: product.views?.count || 0,
        unique: product.views?.unique || 0
      });
    }

    // Update recommendation data if user is authenticated
    if (userId) {
      try {
        await RecommendationService.updateAfterInteraction(
          userId,
          productId,
          "view_complete",
          {
            viewDuration,
            scrollDepth,
            exitPage
          }
        );
      } catch (recError) {
        logger.warn(`Failed to update recommendation data for view duration: ${recError.message}`);
        // Continue execution - don't fail the request due to recommendation error
      }
    }

    res.status(200).json({
      success: true,
      message: "View duration updated successfully."
    });
  } catch (error) {
    logger.error("Failed to update view duration:", {
      message: error.message,
      stack: error.stack,
      productId: req.params.id,
      userId: req.user?._id
    });

    // For view duration updates, we want to fail silently to the client
    // since these often happen during page unload
    res.status(200).json({
      success: false,
      message: "Could not update view duration, but request acknowledged."
    });
  }
};

/**
 * Get related products based on collaborative filtering (users who viewed X also viewed Y).
 * @route GET /api/views/related/:productId
 * @access Public
 */
export const getRelatedProducts = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 15); // Sanitize limit
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(createError(400, "Invalid product ID format."));
    }
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Try to get from cache first
    let relatedProductsData = null;
    const cacheKey = cache ? cache.generateKey('views', `product:${productId}:related`, `limit:${limit}`) : null;

    if (cache) {
      relatedProductsData = await cache.get(cacheKey);
      if (relatedProductsData) {
        logger.debug(`Using cached related products for product ${productId}`);
        return res.status(200).json(relatedProductsData);
      }
    }

    // --- Co-view based related items ---
    // 1. Find users who viewed the target product (limit scope for performance)
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Look at recent 30 days
    const targetProductViewers = await View.distinct("user", {
      product: productObjectId,
      createdAt: { $gte: recentDate },
      user: { $ne: null }, // Only consider logged-in users for co-viewing
      isBot: false,
    }).limit(1000); // Limit users considered for performance

    if (targetProductViewers.length === 0) {
      logger.debug(
        `No recent logged-in viewers found for related products query: ${productId}`
      );
      // Fallback: Could return products from the same category here
      return res.status(200).json({
        success: true,
        results: 0,
        data: [],
        meta: { source: "co-view-fallback" },
      });
    }

    // 2. Find other products viewed by these users
    const relatedViews = await View.aggregate([
      {
        $match: {
          user: { $in: targetProductViewers }, // Viewed by the same users
          product: { $ne: productObjectId }, // Not the original product
          createdAt: { $gte: recentDate }, // Within the same recent period
          isBot: false,
        },
      },
      {
        $group: {
          _id: "$product",
          coViewers: { $addToSet: "$user" }, // Collect users who co-viewed
        },
      },
      {
        $project: {
          // Calculate strength based on overlap
          product: "$_id",
          strength: { $size: "$coViewers" }, // Strength = number of co-viewers
          _id: 0,
        },
      },
      { $sort: { strength: -1 } }, // Sort by highest overlap
      { $limit: limit * 2 }, // Fetch more candidates
    ]);

    if (relatedViews.length === 0) {
      logger.debug(
        `No co-viewed products found for related products query: ${productId}`
      );
      return res.status(200).json({
        success: true,
        results: 0,
        data: [],
        meta: { source: "co-view-empty" },
      });
    }

    // 3. Fetch Product Details and Combine
    const relatedProductIds = relatedViews.map((v) => v.product);
    const relatedProducts = await Product.find({
      _id: { $in: relatedProductIds },
      status: "Published",
    })
      .select("name slug thumbnail tagline maker category")
      .populate({
        path: "maker",
        select: "firstName lastName profilePicture.url",
      })
      .populate({ path: "category", select: "name" })
      .lean();

    // Map strength back to product details
    const strengthMap = new Map(
      relatedViews.map((v) => [v.product.toString(), v.strength])
    );
    const finalResults = relatedProducts
      .map((p) => ({
        ...p,
        relationStrength: strengthMap.get(p._id.toString()) || 0,
      }))
      .sort((a, b) => b.relationStrength - a.relationStrength) // Re-sort after fetching details
      .slice(0, limit); // Apply final limit

    const response = {
      success: true,
      results: finalResults.length,
      data: finalResults,
    };

    // Cache the results
    if (cache && finalResults.length > 0) {
      await cache.set(cacheKey, response, 7200); // Cache for 2 hours
      logger.debug(`Cached related products for product ${productId}`);
    }

    res.status(200).json(response);
  } catch (error) {
    logger.error(
      `Failed to get related products for ${req.params.productId}:`,
      error
    );
    next(createError(500, "Failed to fetch related products."));
  }
};
