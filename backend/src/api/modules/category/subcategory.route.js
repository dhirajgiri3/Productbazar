import express from 'express';
import * as subcategoryController from '../../../controllers/category/subcategory.controller.js';
import { protect, restrictTo, isAuthenticated, isAdmin } from '../../middlewares/user/auth.middleware.js';
import { check } from 'express-validator';

const router = express.Router();

// Public routes
router.get('/', subcategoryController.getAllSubcategories);
router.get('/parent/:parentSlug', subcategoryController.getSubcategoriesByParent);
router.get('/:slug/trending', subcategoryController.getTrendingProductsInSubcategory);

// Protected routes - Require authentication AND verification
router.use(protect);

// Create subcategory - Require admin or editor role
router.post('/',
  restrictTo('admin', 'editor'),
  [
    check('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    check('parentCategory')
      .notEmpty().withMessage('Parent category is required')
      .isMongoId().withMessage('Invalid parent category ID')
  ],
  subcategoryController.createSubcategory
);

// Update subcategory - Require admin or editor role
router.put('/:id',
  restrictTo('admin', 'editor'),
  [
    check('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
  ],
  subcategoryController.updateSubcategory
);

// Delete subcategory - Require admin role
router.delete('/:id',
  restrictTo('admin'),
  subcategoryController.deleteSubcategory
);

// Convert a category to subcategory - Admin only
router.post('/convert/:categoryId',
  restrictTo('admin'),
  [
    check('parentCategoryId')
      .notEmpty().withMessage('Parent category ID is required')
      .isMongoId().withMessage('Invalid parent category ID')
  ],
  subcategoryController.convertToSubcategory
);

export default router;
