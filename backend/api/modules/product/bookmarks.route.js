import express from "express";
import { protect, isAuthenticated } from "../../middlewares/user/auth.middleware.js";
import { apiCache } from "../../middlewares/core/cache.middleware.js";
import { getUserBookmarks } from "../../../controllers/products/productInteraction.controller.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get user's bookmarked products
router.get(
  "/",
  apiCache("2 minutes", (req) => {
    const {
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      sortOrder = "desc",
      category = "all",
      search = "",
      tags = ""
    } = req.query;

    // Include all query parameters in the cache key
    return `bookmarks:user:${req.user._id}:${page}:${limit}:${sortBy}:${sortOrder}:${category}:${search}:${tags}`;
  }),
  getUserBookmarks
);

export default router;
