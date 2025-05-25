// file: src/api/modules/product/product.route.js
import express from "express";
import * as productController from "../../../controllers/products/product.controller.js";
import * as productInteractionController from "../../../controllers/products/productInteraction.controller.js";
import * as productAnalyticsController from "../../../controllers/products/productAnalytics.controller.js";
import * as productGalleryController from "../../../controllers/products/productGallery.controller.js";
import * as productSearchController from "../../../controllers/products/productSearch.controller.js";
import * as productValidator from "../../../validators/product/product.validator.js";
import {
  isAuthenticated,
  isVerified,
  optionalAuth,
  protect,
  restrictTo,
} from "../../middlewares/user/auth.middleware.js";
import {
  checkProductExists,
  checkProductOwnership,
  checkProductPublished,
  validateProductCategory,
  checkProductModifiable,
  checkProductVisibility,
  prepareProductQuery,
} from "../../middlewares/products/product.middleware.js";
import {
  apiCache,
  cacheControl,
  clearCache,
  commonCachePatterns,
} from "../../middlewares/core/cache.middleware.js";
import {
  detectBots,
  trackRequestTiming,
  skipForBots,
} from "../../middlewares/core/botDetection.middleware.js";
import rateLimit from "express-rate-limit";
import { AppError } from "../../../utils/logging/error.js";
import {
  uploadSingle,
  uploadMultiple,
  handleMulterError,
} from "../../../utils/storage/upload.utils.js";
import { cloudinaryUploader } from "../../../utils/storage/cloudinary.utils.js";
import {
  validateProductSlug,
  validateComment,
  validateReply,
  enhanceCommentData,
} from "../../middlewares/products/comment.middleware.js";

const router = express.Router();

// --- Rate Limiters ---
const createProductLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5 /* ... */,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});
const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50 /* ... */,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});
const interactionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100 /* ... */,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});

// --- Public Routes ---
const publicGetMiddlewares = [
  optionalAuth,
  detectBots,
  skipForBots,
  trackRequestTiming,
];

router.get(
  "/",
  ...publicGetMiddlewares,
  prepareProductQuery,
  cacheControl({ isPublic: true, maxAge: 300, staleWhileRevalidate: 60 }),
  apiCache("5 minutes", (req) => {
    const { page = 1, limit = 20, sort = "newest", category, tags } = req.query;
    const userPart = req.user ? `u:${req.user._id}` : "anon";
    const queryHash = JSON.stringify({ category, tags, sort }).replace(
      /[^a-zA-Z0-9]/g,
      ""
    ); // Simple hash
    return `products:list:${userPart}:${page}:${limit}:${queryHash}`;
  }),
  productController.getAllProducts
);

router.get(
  "/search",
  ...publicGetMiddlewares,
  prepareProductQuery,
  cacheControl({ isPublic: true, maxAge: 300, staleWhileRevalidate: 60 }),
  apiCache(
    "5 minutes",
    (req) =>
      `products:search:${req.query.q || ""}:${req.query.page || 1}:${
        req.user?._id || "anon"
      }`
  ),
  productSearchController.searchProducts
);

router.get(
  "/trending",
  ...publicGetMiddlewares,
  cacheControl({ isPublic: true, maxAge: 300, staleWhileRevalidate: 60 }),
  apiCache(
    "5 minutes",
    (req) =>
      `products:trending:${req.query.timeRange || "7d"}:${
        req.query.limit || 10
      }`
  ),
  productAnalyticsController.getTrendingProducts
);

router.get(
  "/recent",
  ...publicGetMiddlewares,
  cacheControl({ isPublic: true, maxAge: 300, staleWhileRevalidate: 60 }),
  apiCache(
    "5 minutes",
    (req) =>
      `products:recent:${req.query.days || "30"}:${
        req.query.limit || 6
      }`
  ),
  productController.getRecentProducts
);

router.get(
  "/featured",
  ...publicGetMiddlewares,
  cacheControl({ isPublic: true, maxAge: 3600, staleWhileRevalidate: 300 }),
  apiCache("1 hour", () => commonCachePatterns.products.featured),
  productSearchController.getFeaturedProducts
);

router.get(
  "/category/:slug",
  ...publicGetMiddlewares,
  cacheControl({ isPublic: true, maxAge: 900, staleWhileRevalidate: 120 }),
  apiCache(
    "15 minutes",
    (req) =>
      `products:category:${req.params.slug}:${req.query.page || 1}:${
        req.user?._id || "anon"
      }`
  ),
  productSearchController.getProductsByCategory
);

router.get(
  "/user/username/:username",
  ...publicGetMiddlewares,
  cacheControl({ isPublic: true, maxAge: 900, staleWhileRevalidate: 120 }),
  apiCache(
    "15 minutes",
    (req) => `products:user:username:${req.params.username}:${req.query.page || 1}`
  ),
  productController.getProductsByUsername
);

router.get(
  "/user/:userId",
  ...publicGetMiddlewares,
  cacheControl({ isPublic: true, maxAge: 900, staleWhileRevalidate: 120 }),
  apiCache(
    "15 minutes",
    (req) => `products:user:${req.params.userId}:${req.query.page || 1}`
  ),
  productController.getProductsByUser
);

router.get(
  "/:slug",
  ...publicGetMiddlewares,
  checkProductExists,
  checkProductVisibility,
  cacheControl({ isPublic: true, maxAge: 1800, staleWhileRevalidate: 300 }),
  apiCache("30 minutes", (req) => {
    const userPart = req.user ? `u:${req.user._id}` : "anon";
    return commonCachePatterns.products
      .detail(req.params.slug)
      .replace("*", userPart);
  }),
  productController.getProductBySlug
);

router.get(
  "/id/:id",
  ...publicGetMiddlewares,
  checkProductExists,
  checkProductVisibility,
  cacheControl({ isPublic: true, maxAge: 1800, staleWhileRevalidate: 300 }),
  apiCache("30 minutes", (req) => {
    const userPart = req.user ? `u:${req.user._id}` : "anon";
    return `products:detail:id:${req.params.id}:${userPart}`;
  }),
  productController.getProductById
);

router.get(
  "/:slug/comments",
  ...publicGetMiddlewares,
  validateProductSlug,
  enhanceCommentData,
  cacheControl({ isPublic: true, maxAge: 120, staleWhileRevalidate: 30 }),
  apiCache(
    "2 minutes",
    (req) =>
      `products:comments:${req.params.slug}:${req.query.page || 1}:${
        req.user?._id || "anon"
      }`
  ),
  productInteractionController.getComments
);

router.get(
  "/:slug/trending-insights",
  ...publicGetMiddlewares,
  checkProductExists,
  productAnalyticsController.getTrendingRankInsights
);

// --- Protected Routes ---
router.use(protect);

// --- Product Management ---
router.post(
  "/validate-url",
  isAuthenticated,
  productController.validateProductUrl
);

router.post(
  "/",
  isAuthenticated,
  isVerified,
  createProductLimiter,
  uploadSingle("thumbnail"),
  handleMulterError,
  validateProductCategory,
  productValidator.validateCreateProduct,
  cloudinaryUploader("products"),
  // Controller calls cache.invalidateProduct
  productController.createProduct
);

router.put(
  "/:slug",
  isAuthenticated,
  checkProductExists,
  checkProductOwnership,
  checkProductModifiable,
  uploadSingle("thumbnail"),
  handleMulterError,
  validateProductCategory,
  productValidator.validateUpdateProduct,
  cloudinaryUploader("products"),
  // Controller calls cache.invalidateProduct
  productController.updateProduct
);

router.delete(
  "/:slug",
  isAuthenticated,
  checkProductExists,
  checkProductOwnership,
  // Controller calls cache.invalidateProduct
  productController.deleteProduct
);

// --- Gallery Management ---
const galleryClearCache = clearCache((req) =>
  commonCachePatterns.products.detail(req.params.slug)
);
router.post(
  "/:slug/gallery",
  isAuthenticated,
  checkProductExists,
  checkProductOwnership,
  checkProductModifiable,
  uploadMultiple("images", 10),
  handleMulterError,
  cloudinaryUploader("gallery", true),
  galleryClearCache,
  productGalleryController.addGalleryImages
);
router.delete(
  "/:slug/gallery/:imageId",
  isAuthenticated,
  checkProductExists,
  checkProductOwnership,
  checkProductModifiable,
  galleryClearCache,
  productGalleryController.removeGalleryImage
);
router.put(
  "/:slug/gallery/reorder",
  isAuthenticated,
  checkProductExists,
  checkProductOwnership,
  checkProductModifiable,
  galleryClearCache,
  productGalleryController.updateGalleryOrder
);

// --- Product Interaction ---
const interactionMiddlewares = [
  isAuthenticated,
  interactionLimiter,
  checkProductExists,
  checkProductPublished,
];
const upvoteClearCache = clearCache((req) => [
  commonCachePatterns.products.detail(req.params.slug),
  commonCachePatterns.products.trending,
  commonCachePatterns.products.recommendations,
  `products:*:${req.params.slug}:*`, // Clear all caches related to this product
  `products:detail:*:${req.params.slug}:*`, // Clear all detail caches for this product
  `products:list:*`, // Clear all product lists
  `recommendations:*`, // Clear all recommendations
  `rec:*`, // Clear all recommendation cache prefixes
  `trending:*`, // Clear trending caches
  `feed:*` // Clear feed caches
]);

const bookmarkClearCache = clearCache((req) => [
  commonCachePatterns.products.detail(req.params.slug),
  commonCachePatterns.products.trending,
  commonCachePatterns.products.recommendations,
  `products:*:${req.params.slug}:*`, // Clear all caches related to this product
  `products:detail:*:${req.params.slug}:*`, // Clear all detail caches for this product
  `products:list:*`, // Clear all product lists
  `recommendations:*`, // Clear all recommendations
  `rec:*`, // Clear all recommendation cache prefixes
  `trending:*`, // Clear trending caches
  `feed:*`, // Clear feed caches
  `bookmarks:user:*` // Clear all user bookmarks caches
]);

router.post(
  "/:slug/upvote",
  ...interactionMiddlewares,
  upvoteClearCache,
  productInteractionController.toggleUpvote
);
router.post(
  "/:slug/bookmark",
  ...interactionMiddlewares,
  bookmarkClearCache,
  productInteractionController.toggleBookmark
);

// --- Comment Management ---
const commentClearCache = clearCache(
  (req) => `products:comments:${req.params.slug}:*`
);
const commentWriteAuth = [
  isAuthenticated,
  validateProductSlug,
  checkProductPublished,
  commentLimiter,
];

router.post(
  "/:slug/comments",
  ...commentWriteAuth,
  productValidator.validateComment,
  commentClearCache,
  productInteractionController.addComment
);
router.put(
  "/:slug/comments/:commentId",
  isAuthenticated,
  validateProductSlug,
  validateComment,
  commentClearCache,
  productInteractionController.editComment
);
router.put(
  "/:slug/comments/:commentId/replies/:replyId",
  isAuthenticated,
  validateProductSlug,
  validateComment,
  validateReply,
  commentClearCache,
  productInteractionController.editReply
);
router.delete(
  "/:slug/comments/:commentId",
  isAuthenticated,
  validateProductSlug,
  validateComment,
  commentClearCache,
  productInteractionController.deleteComment
);
router.delete(
  "/:slug/comments/:commentId/replies/:replyId",
  isAuthenticated,
  validateProductSlug,
  validateComment,
  validateReply,
  commentClearCache,
  productInteractionController.deleteReply
);
router.post(
  "/:slug/comments/:commentId/like",
  isAuthenticated,
  validateProductSlug,
  validateComment,
  productInteractionController.toggleCommentLike
);
router.post(
  "/:slug/comments/:parentCommentId/reply",
  ...commentWriteAuth,
  validateComment,
  productValidator.validateComment,
  commentClearCache,
  productInteractionController.addReply
);
router.post(
  "/:slug/comments/:parentCommentId/replies/:replyId/like",
  isAuthenticated,
  validateProductSlug,
  validateComment,
  validateReply,
  productInteractionController.toggleReplyLike
);

// --- Admin Routes ---
router.use(restrictTo("admin"));

const featureClearCache = clearCache([
  commonCachePatterns.products.featured,
  (req) => commonCachePatterns.products.detail(req.params.slug), // Invalidate specific product too
]);
router.put(
  "/:slug/feature",
  checkProductExists,
  featureClearCache,
  productController.toggleFeatureProduct
);

router.get(
  "/:slug/analytics",
  checkProductExists,
  (req, res, next) => {
    // Fine-grained Auth Check
    if (req.product.maker.toString() !== req.user._id.toString()) {
      return next(new AppError("Not authorized for analytics", 403));
    }
    next();
  },
  apiCache("6 hours", (req) => `products:analytics:${req.params.slug}`),
  productAnalyticsController.getProductAnalytics
);

router.post(
  "/recommendations",
  productAnalyticsController.getPostInteractionRecommendations
); // Assuming Admin tool

export default router;
