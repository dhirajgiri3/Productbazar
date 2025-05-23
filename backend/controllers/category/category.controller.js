import Category from "../../models/category/category.model.js";
import Product from "../../models/product/product.model.js";
import { AppError } from "../../utils/logging/error.js";
import logger from "../../utils/logging/logger.js";

// Get all categories
export const getAllCategories = async (req, res, next) => {
  try {
    const filter = {};

    // Filter for parent categories (top level) or subcategories
    if (req.query.parent === "null" || req.query.parent === "root") {
      filter.parentCategory = null;
    } else if (req.query.parent) {
      filter.parentCategory = req.query.parent;
    }

    // Filter for featured categories
    if (req.query.featured === "true") {
      filter.featured = true;
    }

    // Execute query
    const categories = await Category.find(filter)
      .sort({ order: 1, name: 1 })
      .populate("productCount")
      .populate({
        path: "subcategories",
        select: "name slug icon",
        options: { sort: { order: 1 } },
      });

    res.status(200).json({
      status: "success",
      results: categories.length,
      data: categories,
    });
  } catch (error) {
    logger.error("Failed to fetch categories:", error);
    return next(new AppError(error.message, 500));
  }
};

export const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug })
      .populate("productCount")
      .populate({
        path: "subcategories",
        select: "name slug icon",
      });

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: category,
    });
  } catch (error) {
    logger.error(`Failed to fetch category ${req.params.slug}:`, error);
    return next(new AppError(error.message, 500));
  }
};

export const createCategory = async (req, res, next) => {
  try {
    // Check for required fields
    if (!req.body.name) {
      return next(new AppError("Category name is required", 400));
    }

    // Check parent category if provided
    if (req.body.parentCategory) {
      const parentExists = await Category.findById(req.body.parentCategory);
      if (!parentExists) {
        return next(new AppError("Parent category not found", 404));
      }
    }

    // Create category
    const categoryData = {
      name: req.body.name,
      description: req.body.description,
      icon: req.body.icon,
      color: req.body.color,
      order: req.body.order,
      featured: req.body.featured || false,
      parentCategory: req.body.parentCategory || null,
      createdBy: req.user._id,
    };

    const category = await Category.create(categoryData);
    logger.info(`New category created: ${category._id}`);
    res.status(201).json({
      status: "success",
      data: category,
      message: "Category created successfully",
    });
  } catch (error) {
    logger.error("Failed to create category:", error);
    if (error.code === 11000) {
      return next(new AppError("A category with this name already exists", 400));
    }
    return next(new AppError(error.message, 400));
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find category
    const category = await Category.findById(id);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Check parent category if provided
    if (req.body.parentCategory) {
      // Don't allow self as parent
      if (req.body.parentCategory === id) {
        return next(new AppError("A category cannot be its own parent", 400));
      }

      const parentExists = await Category.findById(req.body.parentCategory);
      if (!parentExists) {
        return next(new AppError("Parent category not found", 404));
      }
    }

    // Update fields
    if (req.body.name !== undefined) category.name = req.body.name;
    if (req.body.description !== undefined)
      category.description = req.body.description;
    if (req.body.icon !== undefined) category.icon = req.body.icon;
    if (req.body.color !== undefined) category.color = req.body.color;
    if (req.body.order !== undefined) category.order = req.body.order;
    if (req.body.featured !== undefined) category.featured = req.body.featured;
    if (req.body.parentCategory !== undefined)
      category.parentCategory = req.body.parentCategory || null;

    // Save changes
    await category.save();

    res.status(200).json({
      status: "success",
      data: category,
      message: "Category updated successfully",
    });
  } catch (error) {
    logger.error("Error updating category:", error);
    if (error.code === 11000) {
      // Duplicate key error
      return next(
        new AppError("A category with this name already exists", 400)
      );
    }
    return next(new AppError(error.message, 400));
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find category
    const category = await Category.findById(id);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Check if category has subcategories
    const hasSubcategories = await Category.countDocuments({
      parentCategory: id,
    });
    if (hasSubcategories > 0) {
      return next(
        new AppError("Cannot delete a category with subcategories", 400)
      );
    }

    // Check if category has products
    const hasProducts = await Product.countDocuments({ category: id });
    if (hasProducts > 0) {
      return next(
        new AppError("Cannot delete a category with associated products", 400)
      );
    }

    // Delete category
    await Category.findByIdAndDelete(id);
    logger.info(`Category deleted: ${id}`);
    res.status(200).json({
      status: "success", 
      message: "Category deleted successfully"
    });
  } catch (error) {
    logger.error(`Failed to delete category ${req.params.id}:`, error);
    return next(new AppError(error.message, 500));
  }
};

// Add a product to a category
export const addProductToCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;

    // Find category
    const category = await Category.findById(id);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Check if product exists
    const product = await Product.findById(productId);

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // Add product to category
    category.products.push(product._id);

    // Save changes
    await category.save();

    res.status(200).json({
      status: "success",
      data: category,
      message: "Product added to category successfully",
    });
  } catch (error) {
    logger.error("Error adding product to category:", error);
    return next(new AppError(error.message, 500));
  }
};

// Remove a product from a category
export const removeProductFromCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;

    // Find category
    const category = await Category.findById(id);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Remove product from category
    category.products.pull(productId);

    // Save changes
    await category.save();

    res.status(200).json({
      status: "success",
      data: category,
      message: "Product removed from category successfully",
    });
  } catch (error) {
    logger.error("Error removing product from category:", error);
    return next(new AppError(error.message, 500));
  }
};

// Add bulk Products to Category
export const addBulkProductsToCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productIds } = req.body;

    // Find category
    const category = await Category.findById(id);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Check if products exist
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return next(new AppError("Some products not found", 404));
    }

    // Add products to category
    category.products.push(...products.map((product) => product._id));

    // Save changes
    await category.save();

    res.status(200).json({
      status: "success",
      data: category,
      message: "Products added to category successfully",
    });
  } catch (error) {
    logger.error("Error adding bulk products to category:", error);
    return next(new AppError(error.message, 500));
  }
};

// Remove bulk Products from Category
export const removeBulkProductsFromCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productIds } = req.body;

    // Find category
    const category = await Category.findById(id);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Remove products from category
    category.products.pull(...productIds);

    // Save changes
    await category.save();

    res.status(200).json({
      status: "success",
      data: category,
      message: "Products removed from category successfully",
    });
  } catch (error) {
    logger.error("Error removing bulk products from category:", error);
    return next(new AppError(error.message, 500));
  }
};

// Get products by category using slug
// This function retrieves products based on the category slug provided in the request parameters.
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Find category
    const category = await Category.findOne({ slug });

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

    // Get products
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("maker", "firstName lastName profilePicture");

    // Get total count
    const totalCount = await Product.countDocuments(query);

    res.status(200).json({
      status: "success",
      results: products.length,
      total: totalCount,
      page,
      pages: Math.ceil(totalCount / limit),
      data: products,
    });
  } catch (error) {
    logger.error("Error fetching products by category:", error);
    return next(new AppError(error.message, 500));
  }
};

// Get all products in a category
export const getAllProductsInCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Find category
    const category = await Category.findById(id);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Query products
    const query = {
      category: category._id,
      status: "Published",
    };

    // Get products
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("maker", "firstName lastName profilePicture");

    // Get total count
    const totalCount = await Product.countDocuments(query);

    res.status(200).json({
      status: "success",
      results: products.length,
      total: totalCount,
      page,
      pages: Math.ceil(totalCount / limit),
      data: products,
    });
  } catch (error) {
    logger.error("Error fetching all products in category:", error);
    return next(new AppError(error.message, 500));
  }
};

// Get all subcategories of a category
export const getSubcategoriesByCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find category
    const category = await Category.findById(id);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Get subcategories
    const subcategories = await Category.find({ parentCategory: id });

    res.status(200).json({
      status: "success",
      results: subcategories.length,
      data: subcategories,
    });
  } catch (error) {
    logger.error("Error fetching subcategories by category:", error);
    return next(new AppError(error.message, 500));
  }
};
