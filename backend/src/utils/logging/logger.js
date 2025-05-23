// utils/logger.js

import winston from "winston";
import "winston-daily-rotate-file";

// Mask sensitive data in logs
const maskSensitiveData = winston.format((info) => {
  const message = info.message;
  if (typeof message === "string") {
    info.message = message.replace(
      /"(password|token|secret)":\s*".*?"/g,
      '"$1": "[FILTERED]"'
    );
  }
  return info;
});

// Daily rotate transport
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: "logs/%DATE%-combined.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
});

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    maskSensitiveData(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(
      (info) =>
        `${info.timestamp} [${info.level.toUpperCase()}] [${
          info.service || "product-bazar"
        }]: ${info.message}${info.stack ? "\n" + info.stack : ""}`
    )
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || "product-bazar" },
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    dailyRotateFileTransport,
  ],
});
// If not in production, log to console as well
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Helper methods for contextual logging
logger.contextLogger = function (context) {
  const contextData =
    typeof context === "string" ? { module: context } : context;
  return {
    info: (message, meta = {}) =>
      logger.info(message, { ...contextData, ...meta }),
    error: (message, meta = {}) =>
      logger.error(message, { ...contextData, ...meta }),
    warn: (message, meta = {}) =>
      logger.warn(message, { ...contextData, ...meta }),
    debug: (message, meta = {}) =>
      logger.debug(message, { ...contextData, ...meta }),
  };
};

/**
 * Conditionally logs debug information based on environment
 * @param {string} message - Debug message
 * @param {object} data - Optional debug data
 */
export const debugLog = (message, data = null) => {
  // Only log in development environment
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_LOGS === 'true') {
    if (data) {
      console.debug(message, data);
    } else {
      console.debug(message);
    }
  }
};

export default logger;
