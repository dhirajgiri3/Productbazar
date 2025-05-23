// file: src/api/modules/recommendation/recommendations.route.js
import express from "express";
import mongoose from "mongoose";
import RecommendationController from "../../../controllers/recommendation/recommendation.controller.js";
import {
  validateQueryParams,
  recommendationMiddleware,
  handleRecommendationError,
  sanitizeRecommendationResponse,
} from "../../middlewares/recommendation/recommendation.middleware.js";
import {
  optionalAuth,
  isAuthenticated,
  isAdmin,
} from "../../middlewares/user/auth.middleware.js";

const router = express.Router();

// Apply global middlewares
router.use(validateQueryParams);
router.use(sanitizeRecommendationResponse);

// Helper to validate ObjectId
const validateObjectId = (req, res, paramName) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    res
      .status(400)
      .json({ success: false, message: `Invalid ${paramName} format` });
    return true;
  }
  return false;
};

// Public Routes (Optional Authentication)
router.get(
  "/feed",
  optionalAuth,
  recommendationMiddleware("feed"),
  RecommendationController.getHybridRecommendations
);
router.get(
  "/trending",
  optionalAuth,
  recommendationMiddleware("trending"),
  RecommendationController.getTrending
);
router.get(
  "/new",
  optionalAuth,
  recommendationMiddleware("new"),
  RecommendationController.getNew
);

router.get(
  "/similar/:productId",
  optionalAuth,
  recommendationMiddleware("similar"),
  (req, res, next) => {
    if (validateObjectId(req, res, "productId")) return;
    RecommendationController.getSimilar(req, res, next);
  }
);

router.get(
  "/category/:categoryId",
  optionalAuth,
  recommendationMiddleware("category"),
  (req, res, next) => {
    if (validateObjectId(req, res, "categoryId")) return;
    RecommendationController.getCategory(req, res, next);
  }
);

router.get(
  "/maker/:makerId",
  optionalAuth,
  recommendationMiddleware("maker"),
  (req, res, next) => {
    if (validateObjectId(req, res, "makerId")) return;
    RecommendationController.getMaker(req, res, next);
  }
);

router.get(
  "/tags",
  optionalAuth,
  recommendationMiddleware("tags"),
  RecommendationController.getTags
);

// Routes that work with or without authentication
router.get(
  "/personalized",
  optionalAuth,
  recommendationMiddleware("personalized"),
  RecommendationController.getPersonalized
);
router.get(
  "/collaborative",
  optionalAuth,
  recommendationMiddleware("collaborative"),
  RecommendationController.getCollaborative
);
router.get(
  "/interests",
  optionalAuth,
  recommendationMiddleware("interests"),
  RecommendationController.getInterests
);

// Authenticated Routes (require login)
router.get(
  "/history",
  isAuthenticated,
  recommendationMiddleware("history"),
  RecommendationController.getHistory
);
router.get(
  "/preferences",
  isAuthenticated,
  recommendationMiddleware("preferences"),
  RecommendationController.getPreferences
);

// Interaction Routes
router.post(
  "/interaction",
  isAuthenticated,
  recommendationMiddleware("interaction"),
  RecommendationController.updateInteraction
);

// Add new feedback endpoint
router.post(
  "/feedback",
  isAuthenticated,
  recommendationMiddleware("feedback"),
  RecommendationController.processRecommendationFeedback
);

router.post(
  "/dismiss",
  isAuthenticated,
  recommendationMiddleware("dismiss"),
  RecommendationController.dismissRecommendation
);

// Admin and Utility Routes
router.get(
  "/stats",
  isAuthenticated,
  isAdmin,
  recommendationMiddleware("stats"),
  RecommendationController.getRecommendationStats
);

router.post(
  "/regenerate/:userId",
  isAuthenticated,
  isAdmin,
  recommendationMiddleware("regenerate"),
  (req, res, next) => {
    if (validateObjectId(req, res, "userId")) return;
    RecommendationController.regenerateRecommendations(req, res, next);
  }
);

// Error Handling
router.use(handleRecommendationError);

export default router;
