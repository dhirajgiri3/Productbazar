// middlewares/error.middleware.js

import logger from "../../../utils/logging/logger.js";
import { AppError } from "../../../utils/logging/error.js";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error details with more context
  if (err) {
    logger.error({
      message: err.message,
      stack: err.stack,
      name: err.name,
      ...err,
    });
  } else {
    logger.error("Undefined error occurred.");
  }

  // If the error is not an instance of AppError, convert it
  if (!(err instanceof AppError)) {
    err = new AppError("Something went wrong!", 500);
  }

  // In development, include stack trace and error details
  if (!isProduction) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // In production, send only operational errors to the client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // For programming or unknown errors, don't leak details
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(err);
};
