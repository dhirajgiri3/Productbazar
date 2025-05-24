import jwt from "jsonwebtoken";
import User from "../../../models/user/user.model.js";
import Blacklist from "../../../models/core/blacklist.model.js";
import logger from "../../../utils/logging/logger.js";
import { AppError } from "../../../utils/logging/error.js";

// Centralized token verification function
const verifyToken = async (token, secret) => {
  if (!token) throw new AppError("No token provided", 401, "NO_TOKEN");

  try {
    // Check if token is blacklisted
    const isBlacklisted = await Blacklist.exists({ token });
    if (isBlacklisted) throw new AppError("Token is invalid or logged out", 401, "TOKEN_REVOKED");

    // Verify the token
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Token has expired", 401, "TOKEN_EXPIRED");
    }
    if (error.name === "JsonWebTokenError") {
      throw new AppError("Invalid token format", 401, "TOKEN_INVALID");
    }
    // Pass through AppError instances
    if (error instanceof AppError) {
      throw error;
    }
    // Fallback for any other errors
    throw new AppError("Invalid token", 401, "TOKEN_INVALID");
  }
};

// Base authentication middleware
export const protect = async (req, res, next) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers["authorization"];

    // If no Authorization header, return error
    if (!authHeader) {
      logger.warn(`Authentication failed: No Authorization header`, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        headers: JSON.stringify(req.headers)
      });
      return next(new AppError("Authentication required", 401, "NO_TOKEN"));
    }

    // Extract token from header
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(" ")[1]
      : authHeader; // Handle both "Bearer token" and just "token" formats

    // If no token in header, return error
    if (!token) {
      logger.warn(`Authentication failed: No token in Authorization header`, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        authHeader
      });
      return next(new AppError("Authentication token required", 401, "NO_TOKEN"));
    }

    // Verify token
    const decoded = await verifyToken(token, process.env.JWT_ACCESS_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      logger.warn(`Authentication failed: User not found for token`, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: decoded.id
      });
      return next(new AppError("User not found", 401, "USER_NOT_FOUND"));
    }

    // Set user and token in request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    // Log authentication failure with appropriate level based on error type
    if (error.message === 'Token has expired') {
      // For expired tokens, use info level - this is expected behavior
      logger.info(`Authentication failed: Token expired`, {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return next(new AppError("Token has expired", 401, "TOKEN_EXPIRED"));
    } else if (error.message === 'Token is invalid or logged out') {
      // For revoked tokens, use info level - this is expected after logout
      logger.info(`Authentication failed: Token revoked`, {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return next(new AppError("Token is invalid or logged out", 401, "TOKEN_REVOKED"));
    } else {
      // For other errors, use warn level
      logger.warn(`Authentication failed: ${error.message}`, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        headers: req.headers["authorization"] ? "Authorization header present" : "No Authorization header"
      });
    }

    // Return appropriate error
    next(error.statusCode ? error : new AppError("Invalid token", 401, "TOKEN_INVALID"));
  }
};

// Optional authentication (enhances request if token is valid)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    // If no Authorization header or no token, continue without authentication
    if (!authHeader) {
      return next();
    }

    // Extract token from header, handling both "Bearer token" and just "token" formats
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = await verifyToken(token, process.env.JWT_ACCESS_SECRET);

      // Find user
      const user = await User.findById(decoded.id).select("-password");
      if (user) {
        // Set user and token in request
        req.user = user;
        req.token = token;
      }
    } catch (error) {
      // For optional auth, we simply continue without setting req.user
      // Only log at debug level for expected errors like expired tokens
      if (process.env.NODE_ENV === 'development') {
        if (error.message === 'Token has expired') {
          logger.debug(`Optional auth: Token expired`, { path: req.path });
        } else if (error.message === 'Token is invalid or logged out') {
          logger.debug(`Optional auth: Token revoked`, { path: req.path });
        }
      }
      // This prevents log pollution when clients have expired tokens
    }

    next();
  } catch (error) {
    // Only log serious errors and continue
    logger.error(`Unexpected error in optionalAuth: ${error.message}`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      stack: error.stack
    });
    next();
  }
};

// Custom middleware to verify user has at least email or phone verified
export const verifyAnyEmailOrPhone = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (!req.user.isEmailVerified && !req.user.isPhoneVerified) {
    return next(new AppError("Please verify either your email or phone number to continue", 403));
  }

  next();
};

// Custom middleware to verify user's account
export const isVerified = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (!req.user.isEmailVerified && !req.user.isPhoneVerified) {
    return next(new AppError("Please verify your account to continue", 403));
  }

  next();
};

// Custom middleware for profile completion actions - allows unverified users to complete profile
export const allowProfileCompletion = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Allow profile completion actions for authenticated users regardless of verification status
  // This is specifically for the onboarding flow where users need to complete their profile
  // before being required to verify email/phone
  next();
};

// Custom middleware for critical actions requiring recent authentication
export const requireCriticalActionVerification = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Check if user has recently verified via password or OTP
  const lastVerifiedAt = req.user.lastPasswordVerifiedAt || req.user.lastOtpVerifiedAt || 0;
  const verificationWindow = 30 * 60 * 1000; // 30 minutes

  if (Date.now() - lastVerifiedAt > verificationWindow) {
    return next(new AppError("For security, please re-authenticate before continuing", 403));
  }

  next();
};

// Role-based restriction that checks both primary and secondary roles
export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required for this route", 401));
  }

  // Check primary role
  if (roles.includes(req.user.role)) {
    return next();
  }

  // Check secondary roles if available
  if (req.user.secondaryRoles && Array.isArray(req.user.secondaryRoles)) {
    for (const role of roles) {
      if (req.user.secondaryRoles.includes(role)) {
        return next();
      }
    }
  }

  next(new AppError("You do not have permission to perform this action", 403));
};

// Special middleware for admin-only routes
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    logger.warn(`Admin access denied: No user in request`, {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return next(new AppError("Authentication required for this route", 401));
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

  logger.warn(`Admin access denied: User does not have admin role`, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user._id,
    userRole: req.user.role,
    userSecondaryRoles: req.user.secondaryRoles || []
  });

  return next(new AppError("Only administrators can access this resource", 403));
};

// Resource owner check middleware (for user-specific resources)
export const isResourceOwner = (resourceField) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Admin bypass - admins can access any resource
  if (req.user.role === "admin") {
    return next();
  }

  const resourceId = req.params[resourceField];
  if (resourceId !== req.user._id.toString()) {
    return next(
      new AppError("You do not have permission to access this resource", 403)
    );
  }

  next();
};

// For backward compatibility with existing route files
export const isAuthenticated = protect;
export const isAdmin = adminOnly;