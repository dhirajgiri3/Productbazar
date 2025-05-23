import express from "express";
import AnalyticsController from "../../../controllers/analytics/analytics.controller.js";
import { optionalAuth } from "../../middlewares/user/auth.middleware.js";

const router = express.Router();

// Page interactions (optional auth - works for both authenticated and anonymous users)
router.post(
  "/page-interaction",
  optionalAuth,
  AnalyticsController.recordPageInteraction
);

export default router;
