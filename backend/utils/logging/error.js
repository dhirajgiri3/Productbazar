// utils/errors.js

/**
 * Base class for custom application errors.
 * This class extends the built-in JavaScript Error class.
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500; // Default to 500 for general errors
    this.isOperational = true; // Flag to distinguish between operational and programming errors
    Error.captureStackTrace(this, this.constructor); // Capture the stack trace
  }
}

/**
 * API Error class for handling API-specific errors.
 * This class extends the base AppError class.
 */
export class ApiError extends AppError {
  constructor(statusCode, message, errors = {}) {
    super(message, statusCode);
    this.errors = errors; // Additional error details
    this.name = "ApiError"; // Set the name of the error
  }
}

/**
 * Class representing a validation error.
 * This is used for errors resulting from invalid input data.
 */
export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400); // 400 Bad Request for validation errors
    this.name = "ValidationError";
  }
}

/**
 * Class representing an unauthorized error.
 * This is used for authentication failures.
 */
export class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401); // 401 Unauthorized for authentication issues
    this.name = "UnauthorizedError";
  }
}

/**
 * Class representing a forbidden error.
 * This is used for cases where the user has valid credentials but lacks permission.
 */
export class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403); // 403 Forbidden for permission-related issues
    this.name = "ForbiddenError";
  }
}

/**
 * Class representing a not found error.
 * This is used when a requested resource could not be found.
 */
export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404); // 404 Not Found for missing resources
    this.name = "NotFoundError";
  }
}

/**
 * Class representing a too many requests error.
 * This is used for rate limiting and throttling errors.
 */
export class TooManyRequestsError extends AppError {
  constructor(message) {
    super(message, 429); // 429 Too Many Requests for rate limiting
    this.name = "TooManyRequestsError";
  }
}

/**
 * Utility function to wrap async route handlers and handle errors
 * @param {Function} fn - The async route handler function to wrap
 * @returns {Function} Express middleware function
 */
export const wrapAsync = (fn) => {
  return function (req, res, next) {
    fn(req, res, next).catch((error) => {
      if (error instanceof AppError) {
        return next(error);
      }
      next(new AppError("Internal Server Error", 500));
    });
  };
};

export default {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  wrapAsync,
};
