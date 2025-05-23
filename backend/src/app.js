import express from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

// Import route files
import authRoutes from "./api/modules/user/auth.route.js";
import productRoutes from "./api/modules/product/product.route.js";
import categoryRoutes from "./api/modules/category/category.route.js";
import subcategoryRoutes from "./api/modules/category/subcategory.route.js";

import viewRoutes from "./api/modules/views/view.route.js";
import searchRoutes from "./api/modules/search/search.route.js";
import recommendationRoutes from "./api/modules/recommendation/recommendations.route.js";
import notificationRoutes from "./api/modules/notification/notification.route.js";
import analyticsRoutes from "./api/modules/analytics/analytics.route.js";
import userRoutes from "./api/modules/user/user.route.js";
import bookmarksRoutes from "./api/modules/product/bookmarks.route.js";
import jobRoutes from "./api/modules/job/job.routes.js";
import projectRoutes from "./api/modules/project/project.routes.js";
import adminRoutes from "./api/modules/user/admin.route.js";
import "./models/analytics/analytic.model.js";

// Import middlewares and utilities
import { errorHandler, notFoundHandler } from "./api/middlewares/core/error.middleware.js";
import { configureCors, corsOptions, logCorsHeaders } from "./api/middlewares/core/cors.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

// IMPORTANT: Add CORS middleware early in the chain - before any other middleware
app.use(configureCors);

// Add CORS debugging in development environment
if (process.env.NODE_ENV === 'development') {
  app.use(logCorsHeaders);
}

// Set preflight OPTIONS for all routes
app.options('*', configureCors);

// Apply the rate limiting middleware to all requests
app.use(limiter);

// Middleware setup
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Static files directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Your route handlers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/subcategories", subcategoryRoutes);

app.use("/api/v1/views", viewRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/user/bookmarks', bookmarksRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/admin', adminRoutes);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Product Bazar API is running",
    version: "1.0.0",
  });
});

// CORS error handler - place before other error handlers
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    console.error('CORS Error:', {
      origin: req.headers.origin,
      path: req.path,
      method: req.method
    });
    return res.status(403).json({
      success: false,
      message: 'CORS Error: Not allowed by CORS policy',
      error: err.message
    });
  }
  next(err);
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;