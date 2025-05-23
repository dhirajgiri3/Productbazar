import mongoose from "mongoose";
import logger from "../../utils/logging/logger.js";

const viewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required for a view."],
      // Removed index: true since it's defined below in compound indexes
    },
    user: {
      // User who viewed (optional, for logged-in users)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Removed index: true since it's defined below in compound indexes
      default: null, // Explicitly null for anonymous views
    },
    clientId: {
      // Client identifier for anonymous users (browser fingerprint or generated ID)
      type: String,
      // Removed index: true since it's defined in compound indexes
      default: null,
    },
    // Session & Source Tracking
    sessionId: { type: String }, // Optional: Track user sessions, removed index
    source: {
      // Where the view originated from
      type: String,
      enum: [
        "direct",
        "search",
        "social",
        "email",
        "referral",
        "advertisement",
        "recommendation_feed",
        "recommendation_similar",
        "recommendation_trending",
        "recommendation_new",
        "recommendation_category",
        "recommendation_tag",
        "recommendation_maker",
        "recommendation_history",
        "recommendation_collaborative",
        "recommendation_personalized",
        "recommendation_discovery",
        "internal_navigation",
        "unknown",
      ],
      default: "unknown",
      // Removed index: true since it's defined in compound indexes
    },
    referrer: String, // Full referrer URL
    // User Environment
    userAgent: String,
    ip: String, // Store IP carefully due to privacy regulations (consider anonymizing/hashing)
    isBot: { type: Boolean, default: false }, // Flag identified bots, removed index
    // Geolocation
    country: { type: String }, // Removed index since it's in compound indexes
    region: String,
    city: String,
    // Device Information
    device: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "other"],
      // Removed index since it's in compound indexes
    },
    os: { type: String }, // Removed index
    browser: { type: String }, // Removed index
    // Engagement Metrics within the View
    viewDuration: { type: Number, min: 0 }, // Duration on the product page (seconds)
    engagement: {
      scrollDepth: { type: Number, min: 0, max: 100 }, // Max scroll percentage
      timeToFirstInteraction: { type: Number, min: 0 }, // Time until first click/scroll (ms)
      // Add more specific interactions if needed
      // clicks: { type: Number, default: 0 },
      // formSubmissions: { type: Number, default: 0 }
    },
    exitPage: String, // Where the user went after this view (if tracked)
    createdAt: {
      // Use createdAt for TTL index
      type: Date,
      default: Date.now,
      index: { expireAfterSeconds: 60 * 24 * 60 * 60 }, // Automatically delete after 60 days
    },
  },
  {
    // timestamps: true // `createdAt` is already defined for TTL, `updatedAt` might not be needed
    timestamps: { createdAt: true, updatedAt: false }, // Only enable createdAt if not explicitly defined
  }
);

// === Indexes ===
// Compound indexes for common analytics queries
viewSchema.index({ product: 1, createdAt: -1 }); // Views for a product over time
viewSchema.index({ user: 1, createdAt: -1 }); // User's history (if keeping longer than TTL)
viewSchema.index({ source: 1, createdAt: -1 }); // Views by source over time
viewSchema.index({ product: 1, user: 1, createdAt: -1 }); // Specific user views for product
viewSchema.index({ country: 1, product: 1, createdAt: -1 }); // Geo analysis per product
viewSchema.index({ device: 1, product: 1, createdAt: -1 }); // Device analysis per product

// Track recent syncs to prevent duplicate operations
const recentSyncs = new Map();

// Enhanced sync method with transaction support and better error handling
viewSchema.statics.syncViewsWithProduct = async function(productId) {
  // Debounce frequent calls to the same product ID
  // If we've synced this product in the last 10 seconds, skip processing
  const now = Date.now();
  const lastSyncTime = recentSyncs.get(productId);
  
  if (lastSyncTime && (now - lastSyncTime < 10000)) { // 10 second cooldown
    logger.debug(`Skipping duplicate view sync for product ${productId} - last sync was ${(now - lastSyncTime)/1000}s ago`);
    return { skipped: true, reason: 'recently_synced' };
  }
  
  // Record this sync attempt
  recentSyncs.set(productId, now);
  
  // Clean up the recentSyncs map occasionally to prevent memory leaks
  if (recentSyncs.size > 1000) {
    const oneMinuteAgo = now - 60000;
    for (const [pid, time] of recentSyncs.entries()) {
      if (time < oneMinuteAgo) {
        recentSyncs.delete(pid);
      }
    }
  }
  
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid Product ID format provided to syncViewsWithProduct.");
    }

    const Product = mongoose.model('Product');

    // Get product first to check if it exists
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error(`Product ${productId} not found during view sync`);
    }

    // Get counts from views collection - exclude bot views
    // For total views, count all non-bot views
    const totalViewsResult = await this.countDocuments({
      product: productId,
      isBot: false
    }).session(session);

    // For unique views, we need to count unique users AND unique clientIds for anonymous users
    // First, get all unique logged-in users
    const uniqueLoggedInUsers = await this.distinct('user', {
      product: productId,
      user: { $ne: null },
      isBot: false
    }).session(session);

    // Then, get unique clientIds for anonymous users (where user is null)
    const uniqueClientIds = await this.distinct('clientId', {
      product: productId,
      user: null,
      clientId: { $ne: null },
      isBot: false
    }).session(session);

    // For anonymous users without clientId, count by IP as a fallback
    const uniqueIps = await this.distinct('ip', {
      product: productId,
      user: null,
      clientId: null,
      ip: { $ne: null },
      isBot: false
    }).session(session);

    const totalCount = totalViewsResult;
    const uniqueCount = uniqueLoggedInUsers.length + uniqueClientIds.length + uniqueIps.length;

    logger.info(`View sync for product ${productId}: Found ${totalCount} total views and ${uniqueCount} unique viewers in View collection`, {
      uniqueLoggedInUsers: uniqueLoggedInUsers.length,
      uniqueClientIds: uniqueClientIds.length,
      uniqueIps: uniqueIps.length
    });

    // Check if counts are different from what's in the product
    const productViewCount = product.views?.count || 0;
    const productUniqueCount = product.views?.unique || 0;

    logger.info(`View sync for product ${productId}: Product has ${productViewCount} total views and ${productUniqueCount} unique viewers`);

    // Detect significant discrepancy (more than 10% difference or absolute difference > 5)
    const countDifference = Math.abs(productViewCount - totalCount);
    const percentDifference = productViewCount > 0 ? (countDifference / productViewCount) * 100 : 0;

    if (countDifference > 0) {
      logger.warn(`View count mismatch for product ${productId}:
          Product.views.count=${productViewCount},
          View collection count=${totalCount} {"service":"product-bazar","timestamp":"${new Date().toISOString()}"}`);
    }

    // Always update if there's any difference - even small ones
    const needsUpdate = (
      productViewCount !== totalCount ||
      productUniqueCount !== uniqueCount
    );

    if (needsUpdate) {
      logger.info(`View sync for product ${productId}: Update needed - counts differ between View collection and Product`);

      // Update product model with accurate counts
      product.views = product.views || {};
      product.views.count = totalCount;
      product.views.unique = uniqueCount;

      // Ensure history array exists
      if (!Array.isArray(product.views.history)) {
        product.views.history = [];
      }

      // Update daily history
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find today's entry in history
      const todayEntryIndex = product.views.history.findIndex(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.toDateString() === today.toDateString();
      });

      // Get today's view count
      const todayViewCount = await this.countDocuments({
        product: productId,
        createdAt: { $gte: today },
        isBot: false
      }).session(session);

      if (todayEntryIndex >= 0) {
        // Update existing entry
        product.views.history[todayEntryIndex].count = todayViewCount;
      } else if (todayViewCount > 0) {
        // Add new entry for today
        product.views.history.push({
          date: today,
          count: todayViewCount
        });
      }

      // Limit history size to prevent document growth (keep last 90 days)
      product.views.history.sort((a, b) => new Date(b.date) - new Date(a.date));
      product.views.history = product.views.history.slice(0, 90);

      // Save the updated product
      await product.save({ session });

      logger.info(`Successfully synced views for product ${productId}: ${totalCount} total, ${uniqueCount} unique`);
    } else {
      logger.debug(`View sync not needed for product ${productId} - counts already match`);
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return { totalCount, uniqueCount, updated: needsUpdate };
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();

    logger.error(`Error syncing views for product ${productId}: ${error.message}`);
    throw error;
  }
};

// Enhance product stats calculation to maintain consistency with product model
viewSchema.statics.getProductStats = async function (productId, days = 30) {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid Product ID format provided to getProductStats.");
    }

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get product to check if we need to reconcile
    const Product = mongoose.model('Product');
    const product = await Product.findById(productId).select('views').lean();
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    
    // Only sync if it's been more than 10 seconds since the last sync
    // This leverages the debounce mechanism we added to syncViewsWithProduct
    const totalInViews = await this.countDocuments({
      product: mongoose.Types.ObjectId(productId),
      createdAt: { $gte: startDate, $lte: endDate },
      isBot: false,
    });
    
    const productViews = product.views?.count || 0;
    const viewDifference = Math.abs(totalInViews - productViews);
    
    // If there's a significant discrepancy, trigger a sync (but respect the cooldown)
    if (viewDifference > 5) {
      // The sync function will check if it's too soon and skip if needed
      try {
        await this.syncViewsWithProduct(productId);
      } catch (error) {
        // Don't fail the stats if sync fails, just log it
        logger.warn(`View sync skipped before stats for product ${productId}: ${error.message}`);
      }
    }

    // ENHANCEMENT: Use transactions to ensure consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Daily Views Aggregation
      const dailyData = await this.aggregate([
        {
          $match: {
            product: mongoose.Types.ObjectId(productId),
            createdAt: { $gte: startDate, $lte: endDate },
            isBot: false,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
            uniqueCount: { $addToSet: "$user" },
            avgDuration: { $avg: "$viewDuration" }, // Average duration of views with duration recorded
          },
        },
        {
          $addFields: {
            date: "$_id",
            uniqueCount: { $size: "$uniqueCount" },
          },
        },
        { $sort: { date: 1 } },
        {
          $project: {
            _id: 0,
            date: 1,
            count: 1,
            uniqueCount: 1,
            avgDuration: 1,
          },
        },
      ]);

      // Get geographic data
      const geoData = await this.aggregate([
        {
          $match: {
            product: mongoose.Types.ObjectId(productId),
            createdAt: { $gte: startDate, $lte: endDate },
            country: { $ne: null, $exists: true },
            isBot: false,
          },
        },
        {
          $group: {
            _id: "$country",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            country: "$_id",
            count: 1,
            _id: 0,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      // Get referrer data
      const referrerData = await this.aggregate([
        {
          $match: {
            product: mongoose.Types.ObjectId(productId),
            createdAt: { $gte: startDate, $lte: endDate },
            referrer: { $ne: null, $exists: true },
            isBot: false,
          },
        },
        {
          $group: {
            _id: "$referrer",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            referrer: "$_id",
            count: 1,
            _id: 0,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      // Get source data
      const sourceData = await this.aggregate([
        {
          $match: {
            product: mongoose.Types.ObjectId(productId),
            createdAt: { $gte: startDate, $lte: endDate },
            isBot: false,
          },
        },
        {
          $group: {
            _id: "$source",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            source: "$_id",
            count: 1,
            _id: 0,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // Get hourly distribution
      const hourlyData = await this.aggregate([
        {
          $match: {
            product: mongoose.Types.ObjectId(productId),
            createdAt: { $gte: startDate, $lte: endDate },
            isBot: false,
          },
        },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            hour: "$_id",
            count: 1,
            _id: 0,
          },
        },
        { $sort: { hour: 1 } },
      ]);

      // Calculate totals
      const totalViews = await this.countDocuments({
        product: mongoose.Types.ObjectId(productId),
        createdAt: { $gte: startDate, $lte: endDate },
        isBot: false,
      });

      const uniqueViewers = await this.distinct("user", {
        product: mongoose.Types.ObjectId(productId),
        createdAt: { $gte: startDate, $lte: endDate },
        isBot: false,
      });

      // Ensure stats data is never empty
      if (dailyData.length === 0 && totalViews === 0) {
        // If no views are found in time period but product has views,
        // we might need to reconcile historical data
        if (product.views && product.views.count > 0) {
          logger.warn(`No recent views for product ${productId} but product has ${product.views.count} total views. May need historical backfill.`);
        }

        // Add default data point for today even if no views
        const today = new Date().toISOString().split('T')[0];
        dailyData.push({
          date: today,
          count: 0,
          uniqueCount: 0,
          avgDuration: 0
        });
      }

      await session.commitTransaction();
      session.endSession();

      // Get device breakdown after transaction completes
      const deviceData = await this.aggregate([
        {
          $match: {
            product: mongoose.Types.ObjectId(productId),
            createdAt: { $gte: startDate, $lte: endDate },
            isBot: false,
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$device", "unknown"] },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            device: "$_id",
            count: 1,
            _id: 0,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      return {
        timeframe: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          days,
        },
        totals: {
          totalViews: totalViews,
          uniqueViewers: uniqueViewers.length,
          countries: geoData.length,
          referrers: referrerData.length,
          avgDuration: dailyData.reduce((acc, day) => acc + (day.avgDuration || 0), 0) / Math.max(dailyData.length, 1),
        },
        dailyViews: dailyData,
        geography: geoData,
        referrers: referrerData,
        devices: deviceData,
        sources: sourceData,
        hourlyDistribution: hourlyData,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    logger.error(`Error generating product stats for ${productId}: ${error.message}`);

    // Return empty but valid structure with error flag
    return {
      error: error.message,
      timeframe: {
        start: new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        days,
      },
      totals: {
        totalViews: 0,
        uniqueViewers: 0,
        countries: 0,
        referrers: 0,
        avgDuration: 0,
      },
      dailyViews: [],
      geography: [],
      referrers: [],
      devices: [],
      sources: [],
      hourlyDistribution: [],
    };
  }
};

/**
 * Get aggregated view statistics for a specific product over a period.
 * @param {string|mongoose.Types.ObjectId} productId - Product ID.
 * @param {number} [days=30] - Number of past days to include.
 * @returns {Promise<Object>} Formatted statistics object.
 */
viewSchema.statics.getProductStats = async function (productId, days = 30) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid Product ID format provided to getProductStats.");
  }
  const productIdObj = new mongoose.Types.ObjectId(productId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0); // Start at the beginning of the day

  logger.debug(
    `Getting product stats for ${productId} from ${startDate.toISOString()}`
  );

  try {
    // Use Promise.all for parallel aggregation queries
    const [
      dailyData,
      totalData,
      geoData,
      referrerData,
      deviceData,
      sourceData,
      hourlyData,
    ] = await Promise.all([
      // Daily Views Aggregation
      this.aggregate([
        {
          $match: {
            product: productIdObj,
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
            }, // Use UTC for consistency
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: "$user" }, // Count unique logged-in users
            avgDuration: { $avg: "$viewDuration" }, // Average duration of views with duration recorded
          },
        },
        {
          $project: {
            date: "$_id",
            count: 1,
            uniqueCount: {
              $size: {
                $filter: {
                  input: "$uniqueUsers",
                  cond: { $ne: ["$$this", null] },
                },
              },
            },
            avgDuration: { $ifNull: ["$avgDuration", 0] },
            _id: 0,
          },
        },
        { $sort: { date: 1 } },
      ]),
      // Total Stats Aggregation
      this.aggregate([
        {
          $match: {
            product: productIdObj,
            createdAt: { $gte: startDate },
            isBot: false,
          },
        },
        {
          $group: {
            _id: null,
            totalViews: { $sum: 1 },
            uniqueViewers: { $addToSet: "$user" }, // Includes null for anonymous
            countries: { $addToSet: "$country" },
            referrers: { $addToSet: "$referrer" },
            avgDuration: { $avg: "$viewDuration" },
          },
        },
        {
          $project: {
            _id: 0,
            totalViews: 1,
            // Count unique logged-in + 1 for anonymous if any null users exist
            uniqueViewers: { $size: "$uniqueViewers" },
            countries: {
              $size: {
                $filter: {
                  input: "$countries",
                  cond: { $ne: ["$$this", null] },
                },
              },
            }, // Count non-null countries
            referrers: {
              $size: {
                $filter: {
                  input: "$referrers",
                  cond: {
                    $and: [{ $ne: ["$$this", null] }, { $ne: ["$$this", ""] }],
                  },
                },
              },
            }, // Count non-null/empty referrers
            avgDuration: { $ifNull: ["$avgDuration", 0] },
          },
        },
      ]),
      // Geography Aggregation (Top 10 Countries)
      this.aggregate([
        {
          $match: {
            product: productIdObj,
            createdAt: { $gte: startDate },
            country: { $exists: true, $ne: null },
            isBot: false,
          },
        },
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { country: "$_id", count: 1, _id: 0 } },
      ]),
      // Referrer Aggregation (Top 10 Referrers)
      this.aggregate([
        {
          $match: {
            product: productIdObj,
            createdAt: { $gte: startDate },
            referrer: { $exists: true, $ne: null, $ne: "" },
            isBot: false,
          },
        },
        // Basic Domain Extraction (can be improved)
        {
          $addFields: {
            referrerDomain: {
              $arrayElemAt: [
                {
                  $split: [
                    { $arrayElemAt: [{ $split: ["$referrer", "://"] }, 1] },
                    "/",
                  ],
                },
                0,
              ],
            },
          },
        },
        { $group: { _id: "$referrerDomain", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { source: "$_id", count: 1, _id: 0 } },
      ]),
      // Device Aggregation
      this.aggregate([
        {
          $match: {
            product: productIdObj,
            createdAt: { $gte: startDate },
            device: { $exists: true },
            isBot: false,
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$device", "other"] },
            count: { $sum: 1 },
          },
        }, // Group nulls as 'other'
        { $sort: { count: -1 } },
        { $project: { device: "$_id", count: 1, _id: 0 } },
      ]),
      // Source Aggregation
      this.aggregate([
        {
          $match: {
            product: productIdObj,
            createdAt: { $gte: startDate },
            source: { $exists: true },
            isBot: false,
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$source", "unknown"] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $project: { source: "$_id", count: 1, _id: 0 } },
      ]),
      // Hourly Distribution Aggregation
      this.aggregate([
        {
          $match: {
            product: productIdObj,
            createdAt: { $gte: startDate },
            isBot: false,
          },
        },
        {
          $group: {
            _id: { $hour: { date: "$createdAt", timezone: "UTC" } },
            count: { $sum: 1 },
          },
        }, // Group by UTC hour
        { $sort: { _id: 1 } },
        { $project: { hour: "$_id", count: 1, _id: 0 } },
      ]),
    ]);

    // Format the results
    const formattedTotals =
      totalData.length > 0
        ? totalData[0]
        : {
            totalViews: 0,
            uniqueViewers: 0,
            countries: 0,
            referrers: 0,
            avgDuration: 0,
          };

    // Attempt to sync counts with product for data consistency
    try {
      await this.syncViewsWithProduct(productId);
    } catch (syncError) {
      logger.warn(`Failed to sync view counts for product ${productId}: ${syncError.message}`);
    }

    return {
      timeframe: {
        start: startDate.toISOString().split("T")[0],
        end: new Date().toISOString().split("T")[0],
        days,
      },
      totals: formattedTotals,
      dailyViews: dailyData,
      geography: geoData,
      referrers: referrerData,
      devices: deviceData,
      sources: sourceData,
      hourlyDistribution: hourlyData,
    };
  } catch (error) {
    logger.error(`Error getting view stats for product ${productId}:`, {
      message: error.message,
      stack: error.stack,
    });
    // Don't throw, return an error structure or empty object
    return { error: `Failed to retrieve stats: ${error.message}` };
  }
};

/**
 * Get daily analytics for platform-wide views
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Daily analytics data
 */
viewSchema.statics.getDailyAnalytics = async function (startDate, endDate) {
  try {
    return await this.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          isBot: false,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalViews: { $sum: 1 },
          uniqueUsers: { $addToSet: "$user" },
          avgDuration: { $avg: "$viewDuration" },
          uniqueProducts: { $addToSet: "$product" },
          devices: {
            $push: {
              $cond: [{ $ne: ["$device", null] }, "$device", "unknown"],
            },
          },
          sources: {
            $push: {
              $cond: [{ $ne: ["$source", null] }, "$source", "direct"],
            },
          },
        },
      },
      {
        $addFields: {
          deviceCounts: {
            $objectToArray: {
              $arrayToObject: {
                $map: {
                  input: {
                    $setUnion: "$devices",
                  },
                  as: "deviceType",
                  in: {
                    k: "$$deviceType",
                    v: {
                      $size: {
                        $filter: {
                          input: "$devices",
                          cond: { $eq: ["$$this", "$$deviceType"] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          sourceCounts: {
            $objectToArray: {
              $arrayToObject: {
                $map: {
                  input: {
                    $setUnion: "$sources",
                  },
                  as: "sourceType",
                  in: {
                    k: "$$sourceType",
                    v: {
                      $size: {
                        $filter: {
                          input: "$sources",
                          cond: { $eq: ["$$this", "$$sourceType"] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          date: "$_id",
          totalViews: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
          uniqueProducts: { $size: "$uniqueProducts" },
          avgDuration: 1,
          deviceBreakdown: { $arrayToObject: "$deviceCounts" },
          sourceBreakdown: { $arrayToObject: "$sourceCounts" },
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);
  } catch (error) {
    logger.error("Error getting daily analytics:", error);
    throw error;
  }
};

/**
 * Get most popular products based on views
 * @param {number} limit - Number of products to return
 * @param {number} days - Number of days to consider
 * @returns {Promise<Array>} - Popular products with view data
 */
viewSchema.statics.getPopularProducts = async function (limit = 10, days = 7) {
  if (isNaN(limit) || limit <= 0 || isNaN(days) || days <= 0) {
    throw new Error("Invalid limit or days parameter for getPopularProducts.");
  }
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  try {
    const popular = await this.aggregate([
      { $match: { createdAt: { $gte: startDate }, isBot: false } },
      {
        $group: {
          _id: "$product",
          views: { $sum: 1 },
          uniqueUsers: { $addToSet: "$user" }, // Includes nulls for anon
          lastViewed: { $max: "$createdAt" },
        },
      },
      { $sort: { views: -1 } }, // Sort by total views primarily
      { $limit: limit * 2 }, // Fetch more candidates initially
      // --- Lookup Product Details ---
      {
        $lookup: {
          from: "products", // Collection name for products
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" }, // Deconstruct the array
      { $match: { "productInfo.status": "Published" } }, // Ensure product is published
      // --- Lookup Upvotes --- (Optional but useful)
      {
        $lookup: {
          from: "upvotes",
          localField: "_id",
          foreignField: "product",
          as: "upvotesData",
        },
      },
      // --- Project Final Shape ---
      {
        $project: {
          _id: 0, // Exclude default _id from grouping stage
          product: "$productInfo", // Embed the whole product document
          metrics: {
            views: "$views",
            uniqueViewers: { $size: "$uniqueUsers" }, // Total unique sessions/users (incl. anon)
            lastViewed: "$lastViewed",
            upvotes: { $size: "$upvotesData" }, // Calculate upvote count
          },
        },
      },
      { $limit: limit }, // Apply final limit
    ]);

    // Populate Maker/Category details in application code if needed after aggregation
    // This avoids overly complex aggregation pipelines.
    await mongoose.model("Product").populate(popular, [
      {
        path: "product.maker",
        select: "firstName lastName profilePicture.url",
      },
      { path: "product.category", select: "name slug" },
    ]);

    return popular;
  } catch (error) {
    logger.error(`Error getting popular products (last ${days} days):`, {
      message: error.message,
      stack: error.stack,
    });
    return []; // Return empty array on error
  }
};

/**
 * Calculate engagement metrics for a product
 * @param {string} productId - Product ID
 * @param {number} days - Number of days for the calculation
 * @returns {Promise<Object>} - Engagement metrics
 */
viewSchema.statics.calculateEngagementMetrics = async function (productId, days = 30) {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error(`Invalid product ID format: ${productId}`);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          createdAt: { $gte: startDate },
          isBot: false
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          uniqueViewers: { $addToSet: '$user' },
          averageViewDuration: { $avg: '$viewDuration' },
          maxScrollDepth: { $max: '$engagement.scrollDepth' },
          timeToFirstInteraction: { $avg: '$engagement.timeToFirstInteraction' }
        }
      },
      {
        $project: {
          _id: 0,
          totalViews: 1,
          uniqueViewers: 1, // Keep the array for processing
          averageViewDuration: 1,
          maxScrollDepth: 1,
          timeToFirstInteraction: 1
        }
      }
    ]);

    // Process metrics before returning
    const result = metrics[0] || {
      totalViews: 0,
      uniqueViewers: [],
      averageViewDuration: 0,
      maxScrollDepth: 0,
      timeToFirstInteraction: 0
    };

    // Process uniqueViewers to return its size instead of the array
    const uniqueViewersCount = Array.isArray(result.uniqueViewers) ?
      result.uniqueViewers.filter(id => id !== null).length : 0;

    // Get Product model stats for comparison
    try {
      const Product = mongoose.model('Product');
      const product = await Product.findById(productId).select('views').lean();

      if (product && Math.abs(product.views.count - result.totalViews) > 3) {
        logger.warn(`View count mismatch for product ${productId}:
          Product.views.count=${product.views.count},
          View collection count=${result.totalViews}`);
      }
    } catch (compareError) {
      logger.error(`Error comparing view counts: ${compareError.message}`);
    }

    return {
      ...result,
      uniqueViewersCount // Add the processed count
    };
  } catch (error) {
    logger.error('Failed to calculate engagement metrics:', {
      productId,
      error: error.message,
      stack: error.stack
    });
    return {
      totalViews: 0,
      uniqueViewers: [],
      uniqueViewersCount: 0,
      averageViewDuration: 0,
      maxScrollDepth: 0,
      timeToFirstInteraction: 0,
      error: error.message
    };
  }
};

// Export the model
const View = mongoose.model('View', viewSchema);
export default View;
