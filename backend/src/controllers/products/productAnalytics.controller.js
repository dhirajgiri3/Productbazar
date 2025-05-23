import Product from "../../models/product/product.model.js";
import User from "../../models/user/user.model.js";
import Upvote from "../../models/product/upvote.model.js";
import Comment from "../../models/product/comment.model.js";
import View from "../../models/view/view.model.js";
import { AppError } from "../../utils/logging/error.js";
import logger from "../../utils/logging/logger.js";
import mongoose from "mongoose";
import Recommendation from "../../models/recommendation/recommendation.model.js";

/**
 * Get product analytics
 * @route GET /api/v1/products/:slug/analytics
 * @access Private (product owner or admin)
 */
export const getProductAnalytics = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { period = "30days" } = req.query;

    const product = req.product;

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // Determine the time range
    const startDate = new Date();
    let days = 30;

    switch (period) {
      case "7days":
        days = 7;
        break;
      case "30days":
        days = 30;
        break;
      case "90days":
        days = 90;
        break;
      case "all":
        days = null;
        break;
      default:
        days = 30;
    }

    if (days) {
      startDate.setDate(startDate.getDate() - days);
    } else {
      // If 'all', set to product creation date
      startDate.setTime(product.createdAt.getTime());
    }

    // Get views data
    const View = mongoose.model("View");
    const viewData = await View.aggregate([
      {
        $match: {
          product: product._id,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get upvotes data
    const Upvote = mongoose.model("Upvote");
    const upvoteData = await Upvote.aggregate([
      {
        $match: {
          product: product._id,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get comments data
    const Comment = mongoose.model("Comment");
    const commentData = await Comment.aggregate([
      {
        $match: {
          product: product._id,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get referrer sources
    const referrerData = await View.aggregate([
      {
        $match: {
          product: product._id,
          createdAt: { $gte: startDate },
          referrer: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$referrer",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get geographical distribution
    const geoData = await View.aggregate([
      {
        $match: {
          product: product._id,
          createdAt: { $gte: startDate },
          country: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$country",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get key metrics
    const totalViews = viewData.reduce((sum, item) => sum + item.count, 0);
    const totalUpvotes = upvoteData.reduce((sum, item) => sum + item.count, 0);
    const totalComments = commentData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    // Calculate conversion rate (upvotes per view)
    const conversionRate =
      totalViews > 0 ? (totalUpvotes / totalViews) * 100 : 0;

    // Calculate engagement rate (comments + upvotes per view)
    const engagementRate =
      totalViews > 0 ? ((totalComments + totalUpvotes) / totalViews) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        period,
        timeframe: {
          start: startDate,
          end: new Date(),
        },
        metrics: {
          totalViews,
          totalUpvotes,
          totalComments,
          bookmarks: product.bookmarks.length,
          conversionRate: conversionRate.toFixed(2),
          engagementRate: engagementRate.toFixed(2),
        },
        timeSeries: {
          views: viewData,
          upvotes: upvoteData,
          comments: commentData,
        },
        referrers: referrerData,
        geography: geoData,
      },
    });
  } catch (error) {
    logger.error(`Error getting product analytics:`, error);
    next(new AppError("Failed to get product analytics", 500));
  }
};

// Add real-time recommendation generation after product interaction
export const getPostInteractionRecommendations = async (req, res, next) => {
  try {
    // Only provide recommendations for authenticated users
    if (!req.user) {
      return res.status(200).json({
        success: true,
        results: 0,
        data: [],
      });
    }

    const userId = req.user._id;
    const { productId, interactionType } = req.body;
    const limit = parseInt(req.query.limit, 10) || 5;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return next(new AppError("Valid product ID is required", 400));
    }

    // Find the product to get its category and tags
    const product = await Product.findById(productId).select(
      "category tags maker"
    );

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // Based on interaction type, prioritize different recommendation types
    let recommendations = [];

    switch (interactionType) {
      case "upvote":
        // After upvoting, recommend products with similar tags, then from the same category
        const upvoteSimilarProducts = await Product.find({
          _id: { $ne: productId },
          status: "Published",
          $or: [
            { tags: { $in: product.tags } },
            { category: product.category },
          ],
        })
          .sort({ trendingScore: -1 })
          .limit(limit * 2)
          .select(
            "_id name tagline slug thumbnail description maker category tags views"
          )
          .populate("maker", "firstName lastName profilePicture");

        recommendations = upvoteSimilarProducts.map((p) => ({
          product: p,
          reason: p.tags.some((t) => product.tags.includes(t))
            ? "tag"
            : "category",
          explanationText: p.tags.some((t) => product.tags.includes(t))
            ? `Similar to what you just upvoted`
            : `More from this category`,
        }));
        break;

      case "bookmark":
        // After bookmarking, recommend other popular products from the same maker
        const makerRecommendation =
          await Recommendation.getMakerRecommendations(userId, product.maker, {
            limit: 3,
            excludeIds: [productId],
          });

        // Also recommend from same category
        const categoryRecommendation =
          await Recommendation.getCategoryRecommendations(
            userId,
            product.category,
            {
              limit: limit - makerRecommendation.length,
              excludeIds: [productId],
            }
          );

        // Combine and populate recommendations
        const combinedRecs = [
          ...makerRecommendation,
          ...categoryRecommendation,
        ];
        for (const rec of combinedRecs) {
          const recProduct = await Product.findById(rec.product)
            .select(
              "_id name tagline slug thumbnail description maker category tags views"
            )
            .populate("maker", "firstName lastName profilePicture");

          if (recProduct) {
            recommendations.push({
              product: recProduct,
              reason: rec.reason,
              explanationText: rec.explanationText,
            });
          }
        }
        break;

      case "view":
      default:
        // For views, use the regular recommendation system but exclude the current product
        const user = await User.findById(userId);
        const userRecs = await user.getRecommendations(limit, false);

        // Filter out the current product
        recommendations = userRecs
          .filter((rec) => rec.product._id.toString() !== productId.toString())
          .map((rec) => ({
            product: rec.product,
            reason: rec.reason,
            explanationText: rec.explanationText,
          }));

        // If we don't have enough recommendations, add some based on the product's category
        if (recommendations.length < limit) {
          const catRecs = await Recommendation.getCategoryRecommendations(
            userId,
            product.category,
            {
              limit: limit - recommendations.length,
              excludeIds: [
                productId,
                ...recommendations.map((r) => r.product._id),
              ],
            }
          );

          for (const rec of catRecs) {
            const recProduct = await Product.findById(rec.product)
              .select(
                "_id name tagline slug thumbnail description maker category tags views"
              )
              .populate("maker", "firstName lastName profilePicture");

            if (recProduct) {
              recommendations.push({
                product: recProduct,
                reason: "category",
                explanationText: "More from this category",
              });
            }
          }
        }
        break;
    }

    // Deduplicate and limit recommendations
    const uniqueRecommendations = [];
    const seenIds = new Set();

    for (const rec of recommendations) {
      const productId = rec.product._id.toString();
      if (!seenIds.has(productId)) {
        seenIds.add(productId);
        uniqueRecommendations.push(rec);
        if (uniqueRecommendations.length >= limit) break;
      }
    }

    res.status(200).json({
      success: true,
      results: uniqueRecommendations.length,
      data: uniqueRecommendations,
    });
  } catch (error) {
    logger.error("Failed to get post-interaction recommendations:", error);
    next(error);
  }
};

/**
 * Get trending products using advanced algorithm
 * @route GET /api/v1/products/trending
 * @access Public
 */
export const getTrendingProducts = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const timeRange = req.query.timeRange || "7d"; // Default to last 7 days
    const excludedIds = req.query.exclude ? req.query.exclude.split(",") : [];

    // Convert excluded IDs to ObjectIds, filtering out invalid ones
    const excludedObjectIds = excludedIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => mongoose.Types.ObjectId(id));

    // Calculate date range for trending period
    const startDate = new Date();
    switch (timeRange) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24);
        break;
      case "3d":
        startDate.setDate(startDate.getDate() - 3);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to 7 days
    }

    // Build complex aggregation pipeline for trending calculation
    const pipeline = [
      // Initial match: only published products not in excluded list
      {
        $match: {
          status: "Published",
          _id: { $nin: excludedObjectIds },
          createdAt: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // At least 2 hours old
        },
      },

      // Lookup upvotes
      {
        $lookup: {
          from: "upvotes",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product", "$$productId"] },
                    { $gte: ["$createdAt", startDate] },
                  ],
                },
              },
            },
          ],
          as: "recentUpvotes",
        },
      },

      // Lookup comments
      {
        $lookup: {
          from: "comments",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product", "$$productId"] },
                    { $gte: ["$createdAt", startDate] },
                  ],
                },
              },
            },
          ],
          as: "recentComments",
        },
      },

      // Lookup views
      {
        $lookup: {
          from: "views",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product", "$$productId"] },
                    { $gte: ["$createdAt", startDate] },
                  ],
                },
              },
            },
          ],
          as: "recentViews",
        },
      },

      // Add calculated fields for trending algorithm
      {
        $addFields: {
          // Count metrics
          upvoteCount: { $size: "$recentUpvotes" },
          commentCount: { $size: "$recentComments" },
          viewCount: { $size: "$recentViews" },
          bookmarkCount: { $size: "$bookmarks" },

          // Calculate age decay factor (newer products get boost)
          ageInHours: {
            $divide: [
              { $subtract: [new Date(), "$createdAt"] },
              1000 * 60 * 60,
            ],
          },

          // Calculate velocity (rate of change) - Fixed bracket placement
          upvoteVelocity: {
            $cond: [
              { $gt: [{ $size: "$recentUpvotes" }, 0] },
              {
                $divide: [
                  { $size: "$recentUpvotes" },
                  {
                    $max: [
                      {
                        $divide: [
                          { $subtract: [new Date(), startDate] },
                          1000 * 60 * 60 * 24,
                        ],
                      },
                      1,
                    ],
                  },
                ],
              },
              0,
            ],
          },

          // Calculate unique user engagement
          uniqueUsers: {
            $size: {
              $setUnion: [
                {
                  $map: {
                    input: "$recentUpvotes",
                    as: "upvote",
                    in: "$$upvote.user",
                  },
                },
                {
                  $map: {
                    input: "$recentComments",
                    as: "comment",
                    in: "$$comment.user",
                  },
                },
                {
                  $map: {
                    input: "$recentViews",
                    as: "view",
                    in: "$$view.user",
                  },
                },
              ],
            },
          },
        },
      },

      // Calculate final trending score using complex formula
      {
        $addFields: {
          trendingScore: {
            $let: {
              vars: {
                // Configuration weights for different factors
                upvoteWeight: 3,
                commentWeight: 2,
                viewWeight: 0.5,
                bookmarkWeight: 2.5,

                // Decay settings
                halfLifeHours: 72,
                recencyBoost: { $cond: [{ $lt: ["$ageInHours", 48] }, 1.5, 1] },

                // Activity score (weighted sum of all activities)
                activityScore: {
                  $add: [
                    { $multiply: ["$upvoteCount", 3] },
                    { $multiply: ["$commentCount", 2] },
                    { $multiply: ["$viewCount", 0.5] },
                    { $multiply: ["$bookmarkCount", 2.5] },
                  ],
                },

                // Velocity impact (how quickly gaining traction)
                velocityMultiplier: {
                  $add: [
                    1,
                    { $min: [{ $multiply: ["$upvoteVelocity", 5] }, 3] },
                  ],
                },

                // Engagement diversity factor
                userDiversityFactor: {
                  $min: [{ $divide: ["$uniqueUsers", 5] }, 1.5],
                },

                // Long-term popularity baseline (total upvotes overall)
                basePopularity: {
                  $divide: [{ $add: [{ $size: "$bookmarks" }, 1] }, 10],
                },
              },
              in: {
                $multiply: [
                  // Main activity score
                  "$$activityScore",

                  // Velocity boost
                  "$$velocityMultiplier",

                  // User diversity factor
                  "$$userDiversityFactor",

                  // Recency boost
                  "$$recencyBoost",

                  // Time decay (Wilson score inspired)
                  {
                    $divide: [
                      1,
                      {
                        $pow: [
                          { $add: ["$ageInHours", "$$halfLifeHours"] },
                          1.5,
                        ],
                      },
                    ],
                  },

                  // Add baseline popularity to prevent cold start
                  { $add: [1, "$$basePopularity"] },
                ],
              },
            },
          },
        },
      },

      // For products with very few engagements, give a small boost to newer ones
      {
        $addFields: {
          finalScore: {
            $cond: [
              { $lt: [{ $add: ["$upvoteCount", "$commentCount"] }, 3] },
              {
                $add: [
                  "$trendingScore",
                  { $divide: [1, { $add: ["$ageInHours", 1] }] },
                ],
              },
              "$trendingScore",
            ],
          },
        },
      },

      // Sort by final score
      { $sort: { finalScore: -1 } },

      // Limit results
      { $limit: limit },

      // Lookup maker details
      {
        $lookup: {
          from: "users",
          localField: "maker",
          foreignField: "_id",
          as: "makerDetails",
        },
      },

      // Combined project stage for final fields and maker formatting
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          tagline: 1,
          description: 1,
          thumbnail: 1,
          category: 1,
          categoryName: 1,
          views: 1,
          tags: 1,
          pricing: 1,
          links: 1,
          trendingScore: "$finalScore",
          createdAt: 1,
          maker: {
            $let: {
              vars: {
                makerDetail: { $arrayElemAt: ["$makerDetails", 0] },
              },
              in: {
                _id: "$$makerDetail._id",
                firstName: "$$makerDetail.firstName",
                lastName: "$$makerDetail.lastName",
                profilePicture: "$$makerDetail.profilePicture",
              },
            },
          },
        },
      },
    ];

    // Execute the aggregation pipeline
    const trendingProducts = await Product.aggregate(pipeline);

    // Handle user-specific data if user is authenticated
    if (req.user) {
      const userId = req.user._id.toString();
      const productIds = trendingProducts.map((p) => p._id);

      // Get user upvotes for these products
      const userUpvotes = await Upvote.find({
        user: userId,
        product: { $in: productIds },
      });

      // Get user bookmarks from user model
      const user = await User.findById(userId).select("bookmarks");
      const userBookmarks = user?.bookmarks || [];

      // Create sets for faster lookups
      const upvotedProductIds = new Set(
        userUpvotes.map((u) => u.product.toString())
      );
      const bookmarkedProductIds = new Set(
        userBookmarks.map((b) => b.toString())
      );

      // Add user-specific fields to each product
      trendingProducts.forEach((product) => {
        product.userInteractions = {
          hasUpvoted: upvotedProductIds.has(product._id.toString()),
          hasBookmarked: bookmarkedProductIds.has(product._id.toString()),
        };
      });
    }

    // Log the success for monitoring
    logger.info(
      `Trending products fetched successfully. Count: ${trendingProducts.length}, timeRange: ${timeRange}`
    );

    res.status(200).json({
      success: true,
      results: trendingProducts.length,
      data: trendingProducts,
      meta: {
        timeRange,
        calculatedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error("Error fetching trending products:", error);
    next(new AppError("Failed to fetch trending products", 500));
  }
};

/**
 * Get trending rank and insights for a specific product
 * @route GET /api/v1/products/:slug/trending-insights
 * @access Public
 */
export const getTrendingRankInsights = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { timeRange = "7d" } = req.query;

    // First, get the product details
    const targetProduct = await Product.findOne({ slug }).select(
      "_id name slug tagline description thumbnail upvoteCount views bookmarks createdAt trendingScore category"
    );

    if (!targetProduct) {
      return next(new AppError("Product not found", 404));
    }

    // Calculate date range for trending period
    const startDate = new Date();
    switch (timeRange) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24);
        break;
      case "3d":
        startDate.setDate(startDate.getDate() - 3);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to 7 days
    }

    // Get upvote metrics
    const upvotesCount = await Upvote.countDocuments({
      product: targetProduct._id,
    });

    const recentUpvotesCount = await Upvote.countDocuments({
      product: targetProduct._id,
      createdAt: { $gte: startDate },
    });

    // Get comment metrics
    const commentsCount = await Comment.countDocuments({
      product: targetProduct._id,
    });

    const recentCommentsCount = await Comment.countDocuments({
      product: targetProduct._id,
      createdAt: { $gte: startDate },
    });

    // Get view metrics
    const viewsCount = targetProduct.views?.count || 0;

    const recentViewsCount = await View.aggregate([
      {
        $match: {
          product: targetProduct._id,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: "$viewCount" },
        },
      },
    ]);

    // Get bookmark metrics
    const bookmarksCount = targetProduct.bookmarks?.length || 0;

    // Calculate age in hours since creation
    const ageInHours =
      (new Date() - targetProduct.createdAt) / (1000 * 60 * 60);
    const ageInDays = ageInHours / 24;

    // Calculate velocity metrics
    const timeRangeInDays =
      timeRange === "24h"
        ? 1
        : timeRange === "3d"
        ? 3
        : timeRange === "7d"
        ? 7
        : timeRange === "30d"
        ? 30
        : 7;

    const upvoteVelocity = recentUpvotesCount / timeRangeInDays;
    const commentVelocity = recentCommentsCount / timeRangeInDays;
    const viewVelocity = (recentViewsCount[0]?.count || 0) / timeRangeInDays;

    // Get unique users who engaged with this product in the timeframe
    const uniqueEngagements = await mongoose.connection.db
      .collection("views")
      .aggregate([
        {
          $match: {
            product: targetProduct._id,
            createdAt: { $gte: startDate },
          },
        },
        { $group: { _id: "$user" } },
        { $count: "count" },
      ])
      .toArray();

    const uniqueUserCount = uniqueEngagements[0]?.count || 0;

    // Calculate a trending score using the same algorithm as the getTrendingProducts function
    // This ensures consistency between endpoints
    const halfLifeHours = 72;
    const recencyBoost = ageInHours < 48 ? 1.5 : 1;

    const activityScore =
      recentUpvotesCount * 3 +
      recentCommentsCount * 2 +
      (recentViewsCount[0]?.count || 0) * 0.5 +
      bookmarksCount * 2.5;

    const velocityMultiplier = 1 + Math.min(upvoteVelocity * 5, 3);

    const userDiversityFactor = Math.min(uniqueUserCount / 5, 1.5);

    const basePopularity = (bookmarksCount + 1) / 10;

    const timeDecay = 1 / Math.pow(ageInHours / halfLifeHours + 1, 1.5);

    const trendingScore =
      activityScore *
      velocityMultiplier *
      userDiversityFactor *
      recencyBoost *
      timeDecay *
      (1 + basePopularity);

    // Now, get a ranking by fetching all trending products and finding the position
    const trendingProducts = await Product.aggregate([
      {
        $match: {
          status: "Published",
          createdAt: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // At least 2 hours old
        },
      },
      // Simplified pipeline that follows the same logic as getTrendingProducts
      // but only calculates the score for ranking purposes
      {
        $lookup: {
          from: "upvotes",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product", "$$productId"] },
                    { $gte: ["$createdAt", startDate] },
                  ],
                },
              },
            },
          ],
          as: "recentUpvotes",
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product", "$$productId"] },
                    { $gte: ["$createdAt", startDate] },
                  ],
                },
              },
            },
          ],
          as: "recentComments",
        },
      },
      {
        $lookup: {
          from: "views",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product", "$$productId"] },
                    { $gte: ["$createdAt", startDate] },
                  ],
                },
              },
            },
          ],
          as: "recentViews",
        },
      },
      {
        $addFields: {
          trendingScore: {
            $let: {
              vars: {
                upvoteCount: { $size: "$recentUpvotes" },
                commentCount: { $size: "$recentComments" },
                viewCount: { $size: "$recentViews" },
                bookmarkCount: { $size: "$bookmarks" },
                ageInHours: {
                  $divide: [
                    { $subtract: [new Date(), "$createdAt"] },
                    1000 * 60 * 60,
                  ],
                },
              },
              in: {
                $multiply: [
                  {
                    $add: [
                      { $multiply: ["$$upvoteCount", 3] },
                      { $multiply: ["$$commentCount", 2] },
                      { $multiply: ["$$viewCount", 0.5] },
                      { $multiply: ["$$bookmarkCount", 2.5] },
                    ],
                  },
                  {
                    $add: [
                      1,
                      {
                        $min: [
                          {
                            $multiply: [
                              {
                                $divide: [
                                  "$$upvoteCount",
                                  {
                                    $max: [
                                      {
                                        $divide: [
                                          {
                                            $subtract: [new Date(), startDate],
                                          },
                                          1000 * 60 * 60 * 24,
                                        ],
                                      },
                                      1,
                                    ],
                                  },
                                ],
                              },
                              5,
                            ],
                          },
                          3,
                        ],
                      },
                    ],
                  },
                  {
                    $divide: [
                      1,
                      {
                        $pow: [
                          { $add: [{ $divide: ["$$ageInHours", 72] }, 1] },
                          1.5,
                        ],
                      },
                    ],
                  },
                  { $cond: [{ $lt: ["$$ageInHours", 48] }, 1.5, 1] },
                ],
              },
            },
          },
        },
      },
      { $sort: { trendingScore: -1 } },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          trendingScore: 1,
        },
      },
    ]);

    // Find the rank of the target product
    let rank = 0;
    let percentile = 0;
    let totalProducts = trendingProducts.length;

    for (let i = 0; i < trendingProducts.length; i++) {
      if (trendingProducts[i]._id.equals(targetProduct._id)) {
        rank = i + 1;
        percentile = Math.round(((totalProducts - rank) / totalProducts) * 100);
        break;
      }
    }

    // Get overall trending metrics for context
    const trendingMetrics = {
      averageScore: 0,
      medianScore: 0,
      highestScore:
        trendingProducts.length > 0 ? trendingProducts[0].trendingScore : 0,
      top10AverageScore: 0,
      bottom10AverageScore: 0,
    };

    if (trendingProducts.length > 0) {
      const scores = trendingProducts.map((p) => p.trendingScore);
      trendingMetrics.averageScore =
        scores.reduce((a, b) => a + b, 0) / scores.length;

      // Calculate median
      scores.sort((a, b) => a - b);
      const mid = Math.floor(scores.length / 2);
      trendingMetrics.medianScore =
        scores.length % 2 === 0
          ? (scores[mid - 1] + scores[mid]) / 2
          : scores[mid];

      // Calculate top and bottom 10% averages
      const top10Count = Math.max(1, Math.ceil(scores.length * 0.1));
      const bottom10Count = Math.max(1, Math.ceil(scores.length * 0.1));

      trendingMetrics.top10AverageScore =
        trendingProducts
          .slice(0, top10Count)
          .reduce((sum, p) => sum + p.trendingScore, 0) / top10Count;

      trendingMetrics.bottom10AverageScore =
        trendingProducts
          .slice(-bottom10Count)
          .reduce((sum, p) => sum + p.trendingScore, 0) / bottom10Count;
    }

    // Calculate the primary reasons for the product's trending status
    const reasonFactors = [
      {
        factor: "upvotes",
        value: recentUpvotesCount,
        weight: 3,
        weightedValue: recentUpvotesCount * 3,
        percentOfTotal: 0,
      },
      {
        factor: "comments",
        value: recentCommentsCount,
        weight: 2,
        weightedValue: recentCommentsCount * 2,
        percentOfTotal: 0,
      },
      {
        factor: "views",
        value: recentViewsCount[0]?.count || 0,
        weight: 0.5,
        weightedValue: (recentViewsCount[0]?.count || 0) * 0.5,
        percentOfTotal: 0,
      },
      {
        factor: "bookmarks",
        value: bookmarksCount,
        weight: 2.5,
        weightedValue: bookmarksCount * 2.5,
        percentOfTotal: 0,
      },
    ];

    // Calculate percentage contribution of each factor
    const totalWeightedValue = reasonFactors.reduce(
      (sum, factor) => sum + factor.weightedValue,
      0
    );

    reasonFactors.forEach((factor) => {
      factor.percentOfTotal =
        totalWeightedValue > 0
          ? Math.round((factor.weightedValue / totalWeightedValue) * 100)
          : 0;
    });

    // Sort factors by their contribution
    reasonFactors.sort((a, b) => b.percentOfTotal - a.percentOfTotal);

    // Generate human-readable insights
    let trendingInsights = [];

    // Recency insight
    if (ageInDays <= 7) {
      trendingInsights.push({
        type: "recency",
        message: `This product is relatively new (${Math.round(
          ageInDays
        )} days old), giving it a recency boost in trending calculations.`,
      });
    }

    // User diversity insight
    if (uniqueUserCount >= 5) {
      trendingInsights.push({
        type: "userDiversity",
        message: `Engagement from ${uniqueUserCount} unique users demonstrates broad appeal, positively affecting trending rank.`,
      });
    }

    // Velocity insights
    if (upvoteVelocity > 1) {
      trendingInsights.push({
        type: "velocity",
        message: `The product is gaining upvotes at a rate of ${upvoteVelocity.toFixed(
          1
        )} per day, showing strong momentum.`,
      });
    }

    // Top factor insight
    if (reasonFactors[0].percentOfTotal > 40) {
      trendingInsights.push({
        type: "dominantFactor",
        message: `${
          reasonFactors[0].factor.charAt(0).toUpperCase() +
          reasonFactors[0].factor.slice(1)
        } are the dominant factor (${
          reasonFactors[0].percentOfTotal
        }%) in this product's trending calculation.`,
      });
    }

    // Performance relative to category
    const categoryProducts = await Product.find({
      category: targetProduct.category,
      status: "Published",
    }).select("_id");

    if (categoryProducts.length > 0) {
      const categoryPercentile = Math.round(
        (rank / categoryProducts.length) * 100
      );

      if (categoryPercentile <= 20) {
        trendingInsights.push({
          type: "categoryPerformance",
          message: `This product is in the top ${categoryPercentile}% of trending products in its category.`,
        });
      }
    }

    // Prepare response object with detailed insights
    const response = {
      product: {
        _id: targetProduct._id,
        name: targetProduct.name,
        slug: targetProduct.slug,
        thumbnail: targetProduct.thumbnail,
      },
      trending: {
        rank,
        percentile,
        timeRange,
        score: trendingScore,
        totalProductsRanked: totalProducts,
      },
      metrics: {
        upvotes: {
          total: upvotesCount,
          recent: recentUpvotesCount,
          velocity: upvoteVelocity,
        },
        comments: {
          total: commentsCount,
          recent: recentCommentsCount,
          velocity: commentVelocity,
        },
        views: {
          total: viewsCount,
          recent: recentViewsCount[0]?.count || 0,
          velocity: viewVelocity,
        },
        bookmarks: {
          total: bookmarksCount,
        },
        engagement: {
          uniqueUsers: uniqueUserCount,
        },
      },
      productAge: {
        ageInHours,
        ageInDays,
      },
      contributingFactors: reasonFactors,
      insights: trendingInsights,
      context: {
        trendingMetrics,
        calculatedAt: new Date(),
      },
    };

    logger.info(
      `Trending rank insights generated for product ${slug} with rank ${rank}/${totalProducts}`
    );

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error("Error generating trending insights:", error);
    next(new AppError("Failed to generate trending insights", 500));
  }
};
