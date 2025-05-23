import express from "express";
import * as categoryController from "../../../controllers/category/category.controller.js";
import {
  protect,
  isAdmin,
  isAuthenticated,
} from "../../middlewares/user/auth.middleware.js";
import { check } from "express-validator";

const router = express.Router();

// Public routes
router.get("/", categoryController.getAllCategories);
router.get("/:slug", categoryController.getCategoryBySlug);
router.get("/:slug/products", categoryController.getProductsByCategory);

// Protected routes
router.use(protect);

// Admin routes with validation
router.post(
  "/",
  isAdmin,
  [
    check("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    check("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
  ],
  categoryController.createCategory
);

router.put(
  "/:id",
  isAdmin,
  [
    check("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    check("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
  ],
  categoryController.updateCategory
);

router.delete("/:id", isAdmin, categoryController.deleteCategory);

router.post(
  "/:id/products",
  isAdmin,
  [
    check("productId")
      .notEmpty()
      .withMessage("Product ID is required")
      .isMongoId()
      .withMessage("Invalid Product ID format"),
  ],
  categoryController.addProductToCategory
);

router.delete(
  "/:id/products/:productId",
  isAdmin,
  categoryController.removeProductFromCategory
);

// Add bulk products to category
router.post(
  "/:id/products/bulk",
  isAdmin,
  [
    check("productIds")
      .notEmpty()
      .withMessage("Product IDs are required")
      .isArray()
      .withMessage("Product IDs must be an array"),
  ],
  categoryController.addBulkProductsToCategory
);

// Remove bulk products from category
router.delete(
  "/:id/products/bulk",
  isAdmin,
  [
    check("productIds")
      .notEmpty()
      .withMessage("Product IDs are required")
      .isArray()
      .withMessage("Product IDs must be an array"),
  ],
  categoryController.removeBulkProductsFromCategory
);

// Get all products in a category
router.get(
  "/:id/products",
  isAuthenticated,
  categoryController.getAllProductsInCategory
);

router.get(
  "/:id/subcategories",
  categoryController.getSubcategoriesByCategory
);

export default router;
