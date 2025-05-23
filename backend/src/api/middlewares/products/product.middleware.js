import Product from '../../../models/product/product.model.js';
import Category from '../../../models/category/category.model.js';
import { AppError } from '../../../utils/logging/error.js';
import logger from '../../../utils/logging/logger.js';
import mongoose from 'mongoose';

/**
 * Middleware to check if a product exists
 * Supports both slug and ID lookup
 */
export const checkProductExists = async (req, res, next) => {
  try {
    const { slug, id, productId } = req.params;
    const identifier = slug || id || productId || req.body.productId;

    if (!identifier) {
      return next(new AppError('Product identifier not provided', 400));
    }

    let query;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query = { _id: identifier };
    } else {
      query = { slug: identifier };
    }

    const product = await Product.findOne(query);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Attach product to request for use in subsequent middleware/controller
    req.product = product;
    logger.debug(`Product found: ${product.name} (${product._id})`);
    next();
  } catch (error) {
    logger.error('Error checking if product exists:', error);
    next(new AppError('Error processing product request', 500));
  }
};

/**
 * Middleware to check if user is the product owner
 * Includes better error messages and more robust checks
 */
export const checkProductOwnership = (req, res, next) => {
  try {
    const product = req.product;
    const user = req.user;

    if (!product) {
      return next(new AppError('Product not loaded. Use checkProductExists middleware first', 500));
    }

    if (!user) {
      return next(new AppError('Authentication required', 401));
    }

    // Check if primary role is admin
    const isPrimaryAdmin = user.role === 'admin';

    // Check if admin is in secondary roles
    const isSecondaryAdmin = user.secondaryRoles &&
      user.secondaryRoles.includes('admin');

    // Allow admin access regardless of ownership
    if (isPrimaryAdmin || isSecondaryAdmin) {
      logger.debug(`Admin user ${user._id} granted access to product ${product._id}`);
      return next();
    }

    // Check if user is the product owner
    if (product.maker.toString() !== user._id.toString()) {
      logger.warn(`User ${user._id} attempted unauthorized access to product ${product._id}`);
      return next(new AppError('You are not authorized to perform this action on this product', 403));
    }

    logger.debug(`Product owner verification passed for user ${user._id}`);
    next();
  } catch (error) {
    logger.error('Error checking product ownership:', error);
    next(new AppError('Error verifying product ownership', 500));
  }
};

/**
 * Middleware to check if a product is published
 * Enhanced with better visibility control
 */
export const checkProductPublished = (req, res, next) => {
  try {
    const product = req.product;

    if (!product) {
      return next(new AppError('Product not loaded. Use checkProductExists middleware first', 500));
    }

    // If user exists, check permissions
    if (req.user) {
      // Check if primary role is admin
      const isPrimaryAdmin = req.user.role === 'admin';

      // Check if admin is in secondary roles
      const isSecondaryAdmin = req.user.secondaryRoles &&
        req.user.secondaryRoles.includes('admin');

      // Check if user is admin (primary or secondary) or product owner
      if (isPrimaryAdmin || isSecondaryAdmin ||
          product.maker.toString() === req.user._id.toString()) {
        return next();
      }
    }

    // Check if product is published
    if (product.status !== 'Published') {
      return next(new AppError('This product is not currently available', 404));
    }

    next();
  } catch (error) {
    logger.error('Error checking if product is published:', error);
    next(new AppError('Error verifying product status', 500));
  }
};

/**
 * Middleware to validate product category exists
 */
export const validateProductCategory = async (req, res, next) => {
  try {
    if (!req.body.category && !req.body.categoryName) {
      return next();
    }

    const categoryId = req.body.category;

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return next(new AppError('Specified category not found', 400));
      }
      // Attach category to request
      req.category = category;
    }

    next();
  } catch (error) {
    logger.error('Error validating product category:', error);
    next(new AppError('Error processing category information', 500));
  }
};

/**
 * Middleware to check if product can be modified
 * Prevents modifying products with special status
 */
export const checkProductModifiable = (req, res, next) => {
  try {
    const product = req.product;

    if (!product) {
      return next(new AppError('Product not loaded. Use checkProductExists middleware first', 500));
    }

    // Admin can modify any product
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // Check product flags that might prevent modification
    if (product.flags && product.flags.isLocked) {
      return next(new AppError('This product is locked and cannot be modified', 403));
    }

    // Additional checks could be added here (e.g., pending review, etc.)

    next();
  } catch (error) {
    logger.error('Error checking if product is modifiable:', error);
    next(new AppError('Error verifying product modification permissions', 500));
  }
};

/**
 * Middleware to check if user can view a product
 * Handles visibility rules for private products
 */
export const checkProductVisibility = async (req, res, next) => {
  try {
    const product = req.product;

    if (!product) {
      return next(new AppError('Product not loaded. Use checkProductExists middleware first', 500));
    }

    // If product is public, allow access
    if (product.visibility === 'public') {
      return next();
    }

    // If product is private, only allow access to the owner and admins
    if (product.visibility === 'private') {
      if (!req.user) {
        return next(new AppError('Authentication required to access this product', 401));
      }

      // Check if primary role is admin
      const isPrimaryAdmin = req.user.role === 'admin';

      // Check if admin is in secondary roles
      const isSecondaryAdmin = req.user.secondaryRoles &&
        req.user.secondaryRoles.includes('admin');

      // Allow access if user is admin (primary or secondary) or product owner
      if (isPrimaryAdmin || isSecondaryAdmin ||
          product.maker.toString() === req.user._id.toString()) {
        return next();
      }

      return next(new AppError('You do not have permission to access this product', 403));
    }

    // Default case - product is accessible
    next();
  } catch (error) {
    logger.error('Error checking product visibility:', error);
    next(new AppError('Error verifying product access permissions', 500));
  }
};

/**
 * Middleware to prepare product query with filters
 * Centralizes query building logic
 */
export const prepareProductQuery = (req, res, next) => {
  try {
    // Start with basic filters
    const queryObj = { ...req.query };

    // Fields to exclude from filtering
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(field => delete queryObj[field]);

    // Default to published products for non-admins
    if (!queryObj.status && (!req.user || req.user.role !== 'admin')) {
      queryObj.status = 'Published';
    }

    // Handle advanced filtering (e.g., gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    // Add search functionality if present
    const searchQuery = {};
    if (req.query.search) {
      searchQuery.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Combine filters
    const finalQuery = {
      ...JSON.parse(queryStr),
      ...searchQuery
    };

    // Attach to request for controller use
    req.productQuery = finalQuery;
    req.productOptions = {
      sort: req.query.sort || '-createdAt',
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 20, 100),
      select: req.query.fields ? req.query.fields.split(',').join(' ') : ''
    };

    next();
  } catch (error) {
    logger.error('Error preparing product query:', error);
    next(new AppError('Error processing product filters', 500));
  }
};

// Export all middleware functions
export default {
  checkProductExists,
  checkProductOwnership,
  checkProductPublished,
  validateProductCategory,
  checkProductModifiable,
  checkProductVisibility,
  prepareProductQuery
};
