import { AppError } from "../../../utils/logging/error.js";
import logger from "../../../utils/logging/logger.js";

/**
 * Middleware to check if the user is an admin (either primary or secondary role)
 * This is a more specific version of the restrictTo middleware
 */
export const isAdmin = (req, res, next) => {
  // Check if user exists in request (should be set by protect middleware)
  if (!req.user) {
    logger.warn(`Admin access denied: No user in request`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      headers: JSON.stringify(req.headers)
    });
    return next(new AppError("Authentication required", 401));
  }

  // Check if primary role is admin
  const isPrimaryAdmin = req.user.role === "admin";

  // Check if admin is in secondary roles
  const isSecondaryAdmin = req.user.secondaryRoles &&
    Array.isArray(req.user.secondaryRoles) &&
    req.user.secondaryRoles.includes("admin");

  // Allow access if user has admin role either as primary or secondary
  if (isPrimaryAdmin || isSecondaryAdmin) {
    return next();
  }

  // Log unauthorized access attempt
  logger.warn(`Admin access denied: User does not have admin role`, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user._id,
    userRole: req.user.role,
    userSecondaryRoles: req.user.secondaryRoles || []
  });

  return next(new AppError("Admin access required", 403));
};

/**
 * Middleware to check if the user is an admin (primary or secondary role) or the owner of the resource
 * @param {Function} getResourceOwnerId - Function to extract the owner ID from the request
 */
export const isAdminOrResourceOwner = (getResourceOwnerId) => (req, res, next) => {
  // Check if user exists in request (should be set by protect middleware)
  if (!req.user) {
    logger.warn(`Resource access denied: No user in request`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      headers: JSON.stringify(req.headers)
    });
    return next(new AppError("Authentication required", 401));
  }

  // Check if primary role is admin
  const isPrimaryAdmin = req.user.role === "admin";

  // Check if admin is in secondary roles
  const isSecondaryAdmin = req.user.secondaryRoles &&
    Array.isArray(req.user.secondaryRoles) &&
    req.user.secondaryRoles.includes("admin");

  // Admin (primary or secondary) can access any resource
  if (isPrimaryAdmin || isSecondaryAdmin) {
    return next();
  }

  // Get the resource owner ID using the provided function
  const ownerId = getResourceOwnerId(req);

  // If no owner ID could be extracted, deny access
  if (!ownerId) {
    logger.warn(`Resource access denied: Could not determine resource owner`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user._id
    });
    return next(new AppError("Resource not found or insufficient permissions", 403));
  }

  // Check if the current user is the owner
  if (ownerId.toString() === req.user._id.toString()) {
    return next();
  }

  // Log unauthorized access attempt
  logger.warn(`Resource access denied: User is not owner or admin`, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user._id,
    resourceOwnerId: ownerId,
    userRole: req.user.role,
    userSecondaryRoles: req.user.secondaryRoles || []
  });

  return next(new AppError("Insufficient permissions", 403));
};
