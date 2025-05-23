import Product from "../../models/product/product.model.js";
import User from "../../models/user/user.model.js";
import Category from "../../models/category/category.model.js";
import Upvote from "../../models/product/upvote.model.js";
import SearchAnalytics from "../../models/search/search-analytics.model.js";
import { AppError } from "../../utils/logging/error.js";
import logger from "../../utils/logging/logger.js";
import mongoose from "mongoose";

/**
 * Get products by category
 * @route GET /api/v1/products/category/:slug
 * @access Public
 */
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'newest'; // Default sort by newest

    if (!slug) {
      return next(new AppError("Category slug is required", 400));
    }

    if (page < 1 || limit < 1) {
      return next(new AppError("Invalid pagination parameters", 400));
    }

    // Find category with rich data
    const category = await Category.findOne({ slug })
      .populate("productCount")
      .populate({
        path: "subcategories",
        select: "name slug icon description color",
        options: { sort: { order: 1 } },
      });

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Get subcategory IDs to include their products
    const subcategories = await Category.find({ parentCategory: category._id });
    const categoryIds = [category._id, ...subcategories.map((sub) => sub._id)];

    // Query products
    const query = {
      category: { $in: categoryIds },
      status: "Published",
    };

    // Determine sort options
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'name_asc':
        sortOptions = { name: 1 };
        break;
      case 'name_desc':
        sortOptions = { name: -1 };
        break;
      case 'most_viewed':
        sortOptions = { 'views.count': -1 };
        break;
      case 'trending':
        sortOptions = { trendingScore: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Get products with rich data
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate("maker", "firstName lastName profilePicture username")
      .populate("category", "name slug icon color")
      .populate("bookmarkCount")
      .populate("upvotes");

    // Get total count
    const totalCount = await Product.countDocuments(query);

    // Get related categories (siblings of the current category)
    let relatedCategories = [];
    if (category.parentCategory) {
      // If this is a subcategory, get sibling subcategories
      relatedCategories = await Category.find({
        parentCategory: category.parentCategory,
        _id: { $ne: category._id }
      }).select('name slug icon description color').limit(5);
    } else {
      // If this is a main category, get other popular main categories
      relatedCategories = await Category.find({
        parentCategory: null,
        _id: { $ne: category._id },
        featured: true
      }).select('name slug icon description color').limit(5);
    }

    // Add user-specific data if logged in
    if (req.user) {
      const userId = req.user._id.toString();
      const userUpvotes = await Upvote.find({
        user: userId,
        product: { $in: products.map((p) => p._id) },
      });

      const upvotedProductIds = new Set(
        userUpvotes.map((upvote) => upvote.product.toString())
      );

      // Add user-specific fields to each product
      products.forEach(product => {
        product.hasUpvoted = upvotedProductIds.has(product._id.toString());
        product.hasBookmarked = product.bookmarks?.some(id => id.toString() === userId) || false;
      });
    }

    res.status(200).json({
      success: true,
      results: products.length,
      category: {
        _id: category._id,
        name: category.name,
        description: category.description,
        slug: category.slug,
        icon: category.icon,
        color: category.color,
        productCount: category.productCount,
        subcategories: category.subcategories || [],
      },
      relatedCategories,
      pagination: {
        total: totalCount,
        page,
        pages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
        limit,
      },
      sort,
      data: products,
    });
  } catch (error) {
    logger.error("Failed to fetch products by category:", error);
    next(new AppError("Failed to fetch products by category", 500));
  }
};

/**
 * Search products
 * @route GET /api/v1/products/search
 * @access Public
 */
export const searchProducts = async (req, res, next) => {
  try {
    const {
      query,
      category,
      tags,
      price_min,
      price_max,
      pricing_type,
      sort = "relevance",
      page = 1,
      limit = 20,
      maker,
      date_min,
      date_max,
      featured,
      natural_language = false,
    } = req.query;

    const searchLimit = Math.min(parseInt(limit, 10), 50); // Prevent excessive limits
    const searchPage = Math.max(parseInt(page, 10), 1); // Ensure page is at least 1
    const skip = (searchPage - 1) * searchLimit;

    // Initialize search criteria
    const searchCriteria = {
      status: "Published",
    };

    // Natural language search implementation
    if (query) {
      if (natural_language === "true" || natural_language === true) {
        // MongoDB's $text operator with $natural language option for more natural results
        searchCriteria.$text = {
          $search: query,
          $language: "english",
          $caseSensitive: false,
          $diacriticSensitive: false,
        };
      } else {
        // Regular search implementation with multiple fields
        searchCriteria.$or = [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { tagline: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
          { categoryName: { $regex: query, $options: "i" } },
        ];
      }
    }

    // Determine if we need to use aggregation pipeline for complex queries
    let useAggregation = false;
    const aggregationPipeline = [];

    // Add category filter with support for hierarchical categories
    if (category) {
      useAggregation = true;

      // Find category by slug or ID
      let categoryObj;
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryObj = await Category.findById(category);
      } else {
        categoryObj = await Category.findOne({ slug: category });
      }

      if (categoryObj) {
        // Include subcategories
        const subcategories = await Category.find({
          parentCategory: categoryObj._id,
        });
        const categoryIds = [
          categoryObj._id,
          ...subcategories.map((sub) => sub._id),
        ].map((id) => mongoose.Types.ObjectId(id.toString()));

        aggregationPipeline.push({
          $match: { category: { $in: categoryIds } },
        });
      }
    } else if (searchCriteria.category) {
      // If not using aggregation but category filter exists
      aggregationPipeline.push({
        $match: { category: searchCriteria.category },
      });
    }

    // Tags filter with improved handling
    if (tags) {
      const tagArray = Array.isArray(tags)
        ? tags
        : tags.split(",").map((tag) => tag.trim().toLowerCase());

      if (tagArray.length > 0) {
        if (tagArray.length === 1) {
          // If only one tag, simple filter
          searchCriteria.tags = tagArray[0];
        } else {
          // For multiple tags, offer flexibility in matching
          searchCriteria.tags = { $in: tagArray };
        }
      }
    }

    // Price range filter
    if (price_min || price_max) {
      useAggregation = true;
      const priceFilter = {};

      if (price_min) {
        priceFilter.$gte = parseFloat(price_min);
      }

      if (price_max) {
        priceFilter.$lte = parseFloat(price_max);
      }

      aggregationPipeline.push({
        $match: { "pricing.amount": priceFilter },
      });
    }

    // Filter by pricing type
    if (pricing_type) {
      const validTypes = ["free", "paid", "contact"];
      const pricingTypes = Array.isArray(pricing_type)
        ? pricing_type.filter((t) => validTypes.includes(t))
        : [pricing_type].filter((t) => validTypes.includes(t));

      if (pricingTypes.length > 0) {
        searchCriteria["pricing.type"] = { $in: pricingTypes };
      }
    }

    // Filter by maker (creator)
    if (maker) {
      if (mongoose.Types.ObjectId.isValid(maker)) {
        searchCriteria.maker = mongoose.Types.ObjectId(maker);
      } else {
        // Attempt to find user by other means like username
        const user = await User.findOne({
          $or: [
            { username: maker },
            { firstName: new RegExp(maker, "i") },
            { lastName: new RegExp(maker, "i") },
          ],
        });

        if (user) {
          searchCriteria.maker = user._id;
        }
      }
    }

    // Date range filter
    if (date_min || date_max) {
      const dateFilter = {};

      if (date_min) {
        dateFilter.$gte = new Date(date_min);
      }

      if (date_max) {
        dateFilter.$lte = new Date(date_max);
      }

      searchCriteria.createdAt = dateFilter;
    }

    // Featured products filter
    if (featured === "true" || featured === true || featured === "1") {
      searchCriteria.featured = true;
    }

    // Determine the sorting method
    let sortOptions = {};

    switch (sort) {
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "name_asc":
        sortOptions = { name: 1 };
        break;
      case "name_desc":
        sortOptions = { name: -1 };
        break;
      case "most_upvoted":
        useAggregation = true;
        aggregationPipeline.push(
          {
            $lookup: {
              from: "upvotes",
              localField: "_id",
              foreignField: "product",
              as: "upvotes",
            },
          },
          {
            $addFields: {
              upvoteCount: { $size: "$upvotes" },
            },
          },
          {
            $sort: { upvoteCount: -1 },
          }
        );
        break;
      case "most_viewed":
        sortOptions = { "views.count": -1 };
        break;
      case "most_commented":
        useAggregation = true;
        aggregationPipeline.push(
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "product",
              as: "comments",
            },
          },
          {
            $addFields: {
              commentCount: { $size: "$comments" },
            },
          },
          {
            $sort: { commentCount: -1 },
          }
        );
        break;
      case "trending":
        useAggregation = true;
        // Calculate trending score in the aggregation pipeline
        aggregationPipeline.push(
          {
            $addFields: {
              ageInHours: {
                $divide: [
                  { $subtract: [new Date(), "$createdAt"] },
                  1000 * 60 * 60,
                ],
              },
            },
          },
          {
            $lookup: {
              from: "upvotes",
              localField: "_id",
              foreignField: "product",
              as: "upvotes",
            },
          },
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "product",
              as: "comments",
            },
          },
          {
            $addFields: {
              upvoteCount: { $size: "$upvotes" },
              commentCount: { $size: "$comments" },
              bookmarkCount: { $size: "$bookmarks" },
              // Calculate trending score with weights and decay
              trendingScore: {
                $divide: [
                  {
                    $multiply: [
                      {
                        $add: [
                          { $multiply: [{ $size: "$upvotes" }, 3] }, // upvotes weight
                          { $multiply: ["$views.count", 1] }, // views weight
                          { $multiply: [{ $size: "$comments" }, 2] }, // comments weight
                          { $multiply: [{ $size: "$bookmarks" }, 2.5] }, // bookmarks weight
                        ],
                      },
                      {
                        $cond: [
                          { $lt: ["$ageInHours", 72] },
                          1.5, // recency boost for new products
                          1,
                        ],
                      },
                    ],
                  },
                  {
                    $pow: [
                      { $add: ["$ageInHours", 12] },
                      1.8, // decay factor
                    ],
                  },
                ],
              },
            },
          },
          {
            $sort: { trendingScore: -1 },
          }
        );
        break;
      case "relevance":
      default:
        if (
          query &&
          (natural_language === "true" || natural_language === true)
        ) {
          sortOptions = { score: { $meta: "textScore" } };
        } else {
          sortOptions = { trendingScore: -1 };
        }
    }

    // If not using aggregation, add score projection for text search
    if (
      !useAggregation &&
      query &&
      (natural_language === "true" || natural_language === true)
    ) {
      // Add projection for text score when using text search
      searchCriteria.score = { $meta: "textScore" };
    }

    // Execute query with or without aggregation
    let products = [];
    let totalCount = 0;

    if (useAggregation) {
      // Start with the match stage using our criteria
      aggregationPipeline.unshift({ $match: searchCriteria });

      // Add pagination
      const countPipeline = [...aggregationPipeline];
      aggregationPipeline.push({ $skip: skip }, { $limit: searchLimit });

      // Add population of related fields
      aggregationPipeline.push(
        {
          $lookup: {
            from: "users",
            localField: "maker",
            foreignField: "_id",
            as: "makerDetails",
          },
        },
        {
          $addFields: {
            maker: { $arrayElemAt: ["$makerDetails", 0] },
          },
        },
        {
          $project: {
            makerDetails: 0,
            "maker.password": 0,
            "maker.email": 0,
            "maker.phone": 0,
            // Include other fields you want to exclude
          },
        }
      );

      // Execute the aggregation pipeline
      products = await Product.aggregate(aggregationPipeline);

      // Count total documents for pagination
      const countResult = await Product.aggregate([
        ...countPipeline,
        { $count: "total" },
      ]);

      totalCount = countResult.length > 0 ? countResult[0].total : 0;
    } else {
      // Use regular query with find
      let query = Product.find(searchCriteria)
        .sort(sortOptions)
        .skip(skip)
        .limit(searchLimit)
        .populate("maker", "firstName lastName profilePicture username")
        .lean();

      products = await query;
      totalCount = await Product.countDocuments(searchCriteria);
    }

    // Add user-specific data if logged in
    if (req.user) {
      const userId = req.user._id.toString();
      const userUpvotes = await Upvote.find({
        user: userId,
        product: { $in: products.map((p) => p._id) },
      });

      const upvotedProductIds = new Set(
        userUpvotes.map((upvote) => upvote.product.toString())
      );

      // Add user-specific fields to each product
      products = products.map((product) => ({
        ...product,
        hasUpvoted: upvotedProductIds.has(product._id.toString()),
        hasBookmarked:
          product.bookmarks?.some((id) => id.toString() === userId) || false,
      }));
    }

    // Add analytics for search query (optional)
    if (query && query.length > 2) {
      try {
        const searchData = {
          query,
          user: req.user ? req.user._id : null,
          filters: {
            category,
            tags,
            pricing_type,
            price_range: price_min || price_max ? [price_min, price_max] : null,
            date_range: date_min || date_max ? [date_min, date_max] : null,
          },
          resultsCount: products.length,
          natural_language:
            natural_language === "true" || natural_language === true,
        };

        // Use fire-and-forget to avoid delaying the response
        SearchAnalytics.create(searchData).catch((err) =>
          logger.error("Error saving search analytics", err)
        );
      } catch (analyticsError) {
        // Log error but don't fail the search request
        logger.error("Error recording search analytics:", analyticsError);
      }
    }

    res.status(200).json({
      success: true,
      results: products.length,
      pagination: {
        total: totalCount,
        page: searchPage,
        pages: Math.ceil(totalCount / searchLimit),
        hasNextPage: searchPage * searchLimit < totalCount,
        hasPrevPage: searchPage > 1,
      },
      query_info: {
        query,
        filters: {
          category,
          tags: tags ? (Array.isArray(tags) ? tags : tags.split(",")) : null,
          price:
            price_min || price_max ? { min: price_min, max: price_max } : null,
          pricing_type,
          date: date_min || date_max ? { from: date_min, to: date_max } : null,
          featured:
            featured === "true" || featured === true || featured === "1",
        },
        sort,
        natural_language:
          natural_language === "true" || natural_language === true,
      },
      data: products,
    });
  } catch (error) {
    logger.error("Failed to search products:", error);
    next(new AppError(`Failed to search products: ${error.message}`, 500));
  }
};

/**
 * Get featured products
 * @route GET /api/v1/products/featured
 * @access Public
 */
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 20); // Prevent excessive limits

    const featuredProducts = await Product.find({
      status: "Published",
      featured: true,
    })
      .limit(limit)
      .populate("maker", "firstName lastName profilePicture");

    // If not enough featured products, supplement with trending products
    if (featuredProducts.length < limit) {
      const additionalCount = limit - featuredProducts.length;

      // Get featured product IDs to exclude
      const featuredIds = featuredProducts.map((p) => p._id);

      // Get trending products not already in featured list
      const trendingProducts = await Product.find({
        _id: { $nin: featuredIds },
        status: "Published",
        featured: false,
      })
        .sort({ trendingScore: -1 })
        .limit(additionalCount)
        .populate("maker", "firstName lastName profilePicture");

      // Combine the lists
      featuredProducts.push(...trendingProducts);
    }

    res.status(200).json({
      success: true,
      results: featuredProducts.length,
      data: featuredProducts,
    });
  } catch (error) {
    logger.error("Failed to fetch featured products:", error);
    next(new AppError("Failed to fetch featured products", 500));
  }
};
