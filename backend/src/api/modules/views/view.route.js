import express from "express";
import {
  recordProductView,
  updateViewDuration,
  getUserViewHistory,
  getProductViewStats,
  getDailyViewAnalytics,
  getProductDeviceAnalytics,
  getUserEngagementMetrics,
  clearUserViewHistory,
  getRelatedProducts,
  getPopularProducts
} from "../../../controllers/view/view.controller.js";
import { protect, restrictTo, optionalAuth } from "../../middlewares/user/auth.middleware.js";
import { viewRateLimiter } from "../../middlewares/core/rateLimit.middleware.js";

const router = express.Router();

// === Public Routes ===

// Record a view (Rate limited)
// optionalAuth can be added if you want to link view to user if logged in, otherwise it's anonymous
router.post("/product/:id", optionalAuth, viewRateLimiter, recordProductView);

// Update view duration
router.post("/product/:id/duration", optionalAuth, viewRateLimiter, updateViewDuration);

// Get popular products
router.get("/popular", getPopularProducts);

// Get related products
router.get("/related/:id", getRelatedProducts);

// Get view statistics for a specific product (Public with optional auth)
router.get(
  "/product/:id/stats",
  optionalAuth,
  // viewCache("product_stats"), // Cache key includes product ID and query params (days)
  getProductViewStats
);

// Get device/browser/OS analytics for a specific product (Public with optional auth)
router.get(
  "/product/:id/devices",
  optionalAuth,
  // viewCache("product_device_analytics"), // Cache key includes product ID and query params (days)
  getProductDeviceAnalytics
);

// === Private Routes (Authentication Required) ===
router.use(protect); // Apply authentication middleware for all subsequent routes

// Get current user's view history (Paginated, cached per user/page)
router.get(
  "/history",
  // viewCache("user_history"), // Cache key includes user ID and query params (page, limit)
  getUserViewHistory
);

// Clear current user's view history
router.delete("/history", clearUserViewHistory); // No cache needed for DELETE

// Get engagement metrics for a specific user (Self or Admin)
// Note: Endpoint allows viewing self or others (if admin)
router.get(
  "/user/:id/engagement",
  // viewCache("user_engagement"), // Cache key includes user ID and query params (days)
  getUserEngagementMetrics
);
// Endpoint for user to get their own metrics without specifying ID
router.get(
  "/engagement", // Simpler endpoint for self
  (req, res, next) => {
    // Middleware to set req.params.id to self
    req.params.id = req.user._id;
    next();
  },
  getUserEngagementMetrics
);

// === Admin Only Routes ===
// Middleware restrictTo('admin') ensures only admins can access these

// Get platform-wide daily analytics
router.get(
  "/analytics/daily",
  restrictTo("admin"),
  // viewCache("daily_analytics"), // Cache key includes query params (startDate, endDate)
  getDailyViewAnalytics
);

// Consider adding other admin-specific view analysis routes here

export default router;
