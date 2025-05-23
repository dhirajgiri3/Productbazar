import Product from "../../models/product/product.model.js";
import Category from "../../models/category/category.model.js";
import { AppError } from "../../utils/logging/error.js";
import logger from "../../utils/logging/logger.js";

/**
 * Get products by category with enhanced filtering
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
    
    // Get filter parameters
    const pricingType = req.query.pricing_type;
    const subcategory = req.query.subcategory;

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

    // Build query
    const query = {
      status: "Published",
    };
    
    // Handle subcategory filter
    if (subcategory) {
      // Find the subcategory by slug
      const subcategoryObj = await Category.findOne({ 
        slug: subcategory,
        parentCategory: category._id
      });
      
      if (subcategoryObj) {
        query.category = subcategoryObj._id;
      } else {
        // If subcategory not found, include all products in the main category
        const subcategories = await Category.find({ parentCategory: category._id });
        const categoryIds = [category._id, ...subcategories.map((sub) => sub._id)];
        query.category = { $in: categoryIds };
      }
    } else {
      // Include all subcategories if no specific subcategory is selected
      const subcategories = await Category.find({ parentCategory: category._id });
      const categoryIds = [category._id, ...subcategories.map((sub) => sub._id)];
      query.category = { $in: categoryIds };
    }
    
    // Handle pricing type filter
    if (pricingType) {
      const pricingTypes = pricingType.split(',');
      if (pricingTypes.length > 0) {
        query['pricing.type'] = { $in: pricingTypes };
      }
    }

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
    const relatedCategories = await Category.find({
      _id: { $ne: category._id },
      parentCategory: category.parentCategory,
    })
      .select("name slug icon description color")
      .limit(5);

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
