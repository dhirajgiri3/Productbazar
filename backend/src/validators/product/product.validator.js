import { body, query, param } from "express-validator";
import { AppError } from "../../utils/logging/error.js";

// Product creation validation
export const validateCreateProduct = [
  body("name")
    .notEmpty()
    .withMessage("Product name is required")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Product name must be at least 3 characters")
    .isLength({ max: 100 })
    .withMessage("Product name cannot exceed 100 characters"),

  body("description")
    .notEmpty()
    .withMessage("Product description is required")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters"),

  body("tagline")
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage("Tagline cannot exceed 160 characters"),

  body("category").notEmpty().withMessage("Product category is required"),

  body("status")
    .optional()
    .isIn(["Draft", "Published", "Archived"])
    .withMessage("Invalid product status"),

  body("pricing.type")
    .optional()
    .isIn(["free", "paid", "freemium", "subscription"])
    .withMessage("Invalid pricing type"),

  body("pricing.amount")
    .optional()
    .custom((value, { req }) => {
      const pricingType = req.body.pricing?.type;
      if (
        (pricingType === "paid" || pricingType === "subscription") &&
        (value === undefined || value === null || isNaN(parseFloat(value)))
      ) {
        throw new Error(
          "Price amount is required for paid or subscription products"
        );
      }
      if (value !== undefined && value !== null && parseFloat(value) < 0) {
        throw new Error("Price amount must be a positive number");
      }
      return true;
    }),

  body("pricing.currency")
    .optional()
    .custom((value, { req }) => {
      const pricingType = req.body.pricing?.type;
      if (
        (pricingType === "paid" || pricingType === "subscription") &&
        !value
      ) {
        throw new Error("Currency must be specified for paid products");
      }
      return true;
    }),

  body("links")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          throw new Error("Links must be valid JSON");
        }
      }
      return true;
    }),

  body("links.website")
    .optional()
    .isURL()
    .withMessage("Website URL must be valid"),

  body("links.github")
    .optional()
    .isURL()
    .withMessage("GitHub URL must be valid"),

  body("links.demo").optional().isURL().withMessage("Demo URL must be valid"),
];

// Product update validation
export const validateUpdateProduct = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Product name must be at least 3 characters")
    .isLength({ max: 100 })
    .withMessage("Product name cannot exceed 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters"),

  body("tagline")
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage("Tagline cannot exceed 160 characters"),

  body("category").optional(),

  body("status")
    .optional()
    .isIn(["Draft", "Published", "Archived"])
    .withMessage("Invalid product status"),

  body("pricing.type")
    .optional()
    .isIn(["free", "paid", "freemium", "subscription"])
    .withMessage("Invalid pricing type"),

  body("pricing.amount")
    .optional()
    .custom((value, { req }) => {
      const pricingType = req.body.pricing?.type;
      if (
        (pricingType === "paid" || pricingType === "subscription") &&
        (value === undefined || value === null || isNaN(parseFloat(value)))
      ) {
        throw new Error(
          "Price amount is required for paid or subscription products"
        );
      }
      if (value !== undefined && value !== null && parseFloat(value) < 0) {
        throw new Error("Price amount must be a positive number");
      }
      return true;
    }),

  body("pricing.currency")
    .optional()
    .custom((value, { req }) => {
      const pricingType = req.body.pricing?.type;
      if (
        (pricingType === "paid" || pricingType === "subscription") &&
        !value
      ) {
        throw new Error("Currency must be specified for paid products");
      }
      return true;
    }),

  body("links")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          throw new Error("Links must be valid JSON");
        }
      }
      return true;
    }),

  body("links.website")
    .optional()
    .isURL()
    .withMessage("Website URL must be valid"),

  body("links.github")
    .optional()
    .isURL()
    .withMessage("GitHub URL must be valid"),

  body("links.demo").optional().isURL().withMessage("Demo URL must be valid"),
];

// Comment validation
export const validateComment = [
  body("content")
    .notEmpty()
    .withMessage("Comment content is required")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Comment must be at least 2 characters")
    .isLength({ max: 1000 })
    .withMessage("Comment cannot exceed 1000 characters"),
];

// Reply validation
export const validateReply = (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return next(new AppError("Reply content is required", 400));
    }

    if (typeof content !== "string") {
      return next(new AppError("Reply content must be a string", 400));
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length < 2) {
      return next(
        new AppError("Reply must be at least 2 characters long", 400)
      );
    }

    if (trimmedContent.length > 500) {
      return next(new AppError("Reply cannot exceed 500 characters", 400));
    }

    // Sanitize and pass to next middleware
    req.body.content = trimmedContent;
    next();
  } catch (error) {
    next(new AppError("Invalid reply data", 400));
  }
};

// Product search validation
export const validateSearchParams = [
  query("q").optional().trim(),

  query("category").optional().trim(),

  query("tags").optional(),

  query("price_min")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number"),

  query("price_max")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number")
    .custom((value, { req }) => {
      const minPrice = req.query.price_min
        ? parseFloat(req.query.price_min)
        : 0;
      const maxPrice = parseFloat(value);
      if (maxPrice < minPrice) {
        throw new Error(
          "Maximum price must be greater than or equal to minimum price"
        );
      }
      return true;
    }),

  query("date_min")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format for minimum date"),

  query("date_max")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format for maximum date")
    .custom((value, { req }) => {
      if (!req.query.date_min) return true;
      const minDate = new Date(req.query.date_min);
      const maxDate = new Date(value);
      if (maxDate < minDate) {
        throw new Error("Maximum date must be after minimum date");
      }
      return true;
    }),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sort")
    .optional()
    .isIn([
      "newest",
      "oldest",
      "popular",
      "trending",
      "price_asc",
      "price_desc",
    ])
    .withMessage("Invalid sort parameter"),
];

// Gallery image validation middleware
export const validateGalleryImages = (req, res, next) => {
  // Implemented in the uploadMultiple middleware
  if (!req.files || req.files.length === 0) {
    return next(new AppError("No images provided", 400));
  }

  if (req.files.length > 10) {
    return next(new AppError("Maximum 10 images allowed", 400));
  }

  // Validate file types - already handled by multer
  next();
};

export default {
  validateCreateProduct,
  validateUpdateProduct,
  validateComment,
  validateReply,
  validateSearchParams,
  validateGalleryImages,
};
