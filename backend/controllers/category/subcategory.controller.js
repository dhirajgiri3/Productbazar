import Category from "../../models/category/category.model.js";
import { AppError } from "../../utils/logging/error.js";
import logger from "../../utils/logging/logger.js";

export const createSubcategory = async (req, res, next) => {
  try {
    const { name, description, parentCategory, order, color, icon } = req.body;

    // Validate parent category exists and is a top-level category
    const parent = await Category.findById(parentCategory);

    if (!parent) {
      return next(new AppError("Parent category not found", 404));
    }

    if (parent.parentCategory) {
      return next(new AppError("Parent category must be a top-level category", 400));
    }

    // Create slug
    const slug = slugify(name, { lower: true });

    // Create subcategory
    const subcategory = await Category.create(subcategoryData);
    logger.info(`New subcategory created: ${subcategory._id}`);
    res.status(201).json({
      success: true,
      data: subcategory
    });
  } catch (error) {
    logger.error("Failed to create subcategory:", error);
    next(new AppError("Failed to create subcategory", 500));
  }
};

export const getAllSubcategories = async (req, res, next) => {
  try {
    const subcategories = await Subcategory.find()
      .populate('parentCategory', 'name slug')
      .sort('order');

    res.status(200).json({
      success: true,
      results: subcategories.length,
      data: subcategories
    });
  } catch (error) {
    logger.error("Failed to fetch subcategories:", error);
    next(new AppError("Failed to fetch subcategories", 500));
  }
};

export const updateSubcategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, parentCategory, order, featuredInParent, showInMenu, color, icon } = req.body;

    // Find subcategory
    const subcategory = await Subcategory.findById(id);

    if (!subcategory) {
      return next(new AppError('Subcategory not found', 404));
    }

    // Check if user is authorized to update
    if (req.user.role !== 'admin' && subcategory.createdBy.toString() !== req.user._id.toString()) {
      return next(new AppError('You are not authorized to update this subcategory', 403));
    }

    // If changing parent, validate new parent
    if (parentCategory && parentCategory !== subcategory.parentCategory.toString()) {
      const parent = await Category.findById(parentCategory);

      if (!parent) {
        return next(new AppError('Parent category not found', 404));
      }

      if (parent.parentCategory) {
        return next(new AppError('Parent category must be a top-level category', 400));
      }

      subcategory.parentCategory = parentCategory;
    }

    // Update fields
    if (name) {
      subcategory.name = name;
      subcategory.slug = slugify(name, { lower: true });
    }

    if (description !== undefined) subcategory.description = description;
    if (order !== undefined) subcategory.order = order;
    if (featuredInParent !== undefined) subcategory.featuredInParent = featuredInParent;
    if (showInMenu !== undefined) subcategory.showInMenu = showInMenu;
    if (color) subcategory.color = color;
    if (icon) subcategory.icon = icon;

    // Save changes
    await subcategory.save();

    res.status(200).json({
      success: true,
      data: subcategory,
      message: 'Subcategory updated successfully'
    });
    logger.info(`Subcategory updated: ${subcategory._id}`);
  } catch (error) {
    logger.error(`Failed to update subcategory ${req.params.id}:`, error);
    next(new AppError("Failed to update subcategory", 500));
  }
};

export const deleteSubcategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find subcategory
    const subcategory = await Subcategory.findById(id);

    if (!subcategory) {
      return next(new AppError('Subcategory not found', 404));
    }

    // Check if user is authorized to delete
    if (req.user.role !== 'admin' && subcategory.createdBy.toString() !== req.user._id.toString()) {
      return next(new AppError('You are not authorized to delete this subcategory', 403));
    }

    // Check if subcategory has products
    const productCount = await Product.countDocuments({ category: subcategory._id });

    if (productCount > 0) {
      return next(new AppError(`This subcategory has ${productCount} products. Please reassign them before deleting.`, 400));
    }

    // Delete subcategory
    await subcategory.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
    logger.info(`Subcategory deleted: ${subcategory._id}`);
  } catch (error) {
    logger.error(`Failed to delete subcategory ${req.params.id}:`, error);
    next(new AppError("Failed to delete subcategory", 500));
  }
};

export const convertToSubcategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { parentCategoryId } = req.body;

    if (!parentCategoryId) {
      return next(new AppError('Parent category ID is required', 400));
    }

    // Perform conversion
    const subcategory = await Category.convertToSubcategory(categoryId, parentCategoryId);

    res.status(200).json({
      success: true,
      data: subcategory,
      message: 'Category converted to subcategory successfully'
    });
    logger.info(`Category converted to subcategory: ${category._id}`);
  } catch (error) {
    logger.error("Failed to convert category to subcategory:", error);
    next(new AppError("Failed to convert to subcategory", 500));
  }
};

export const getSubcategoriesByParent = async (req, res, next) => {
  try {
    const { parentSlug } = req.params;

    // Find parent category
    const parentCategory = await Category.findOne({ slug: parentSlug });

    if (!parentCategory) {
      return next(new AppError('Parent category not found', 404));
    }

    // Find subcategories
    const subcategories = await Subcategory.find({ parentCategory: parentCategory._id })
      .sort('order');

    res.status(200).json({
      success: true,
      results: subcategories.length,
      data: subcategories
    });
  } catch (error) {
    logger.error("Failed to fetch subcategories by parent:", error);
    next(new AppError("Failed to fetch subcategories", 500));
  }
};

export const getTrendingProductsInSubcategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const limit = parseInt(req.query.limit, 10) || 6;

    // Find subcategory
    const subcategory = await Subcategory.findOne({ slug });

    if (!subcategory) {
      return next(new AppError('Subcategory not found', 404));
    }

    // Get trending products
    const products = await Product.find({
      category: subcategory._id,
      status: 'Published'
    })
      .sort({ trendingScore: -1 })
      .limit(limit)
      .populate('maker', 'firstName lastName profilePicture');

    res.status(200).json({
      success: true,
      results: products.length,
      data: products
    });
  } catch (error) {
    logger.error("Failed to fetch trending products in subcategory:", error);
    next(new AppError("Failed to fetch trending products", 500));
  }
};
