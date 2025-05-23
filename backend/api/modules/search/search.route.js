import express from 'express';
import {
  globalSearch,
  getSearchSuggestions,
  getSearchHistory,
  clearSearchHistory
} from '../../../controllers/search/globalSearch.controller.js';
import { searchLimiter } from '../../middlewares/core/rateLimit.middleware.js';
import { cacheControl } from '../../middlewares/core/cache.middleware.js';
import { isAuthenticated } from '../../middlewares/user/auth.middleware.js';

const router = express.Router();

// Global search endpoint
router.get(
  '/',
  searchLimiter,
  cacheControl({ maxAge: 300 }), // 5 minutes cache
  globalSearch
);

// Search suggestions endpoint
router.get(
  '/suggestions',
  searchLimiter,
  cacheControl({ maxAge: 60 }), // 1 minute cache
  getSearchSuggestions
);

// User search history endpoints (protected)
router.get(
  '/history',
  isAuthenticated, // Require authentication
  getSearchHistory
);

router.delete(
  '/history',
  isAuthenticated, // Require authentication
  clearSearchHistory
);

export default router;