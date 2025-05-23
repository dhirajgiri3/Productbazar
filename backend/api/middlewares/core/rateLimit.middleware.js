import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  skip: (req) => {
    // Skip rate limiting for authenticated users
    return !!req.user;
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Helper function to convert time format like '15m' or '1h' into milliseconds
const convertToMs = (time) => {
  const unit = time.slice(-1);
  const value = parseInt(time.slice(0, -1), 10);
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  throw new Error("Invalid time format");
};

/**
 * OTP rate limiter using env variables
 */
export const otpRateLimiter = rateLimit({
  windowMs: convertToMs(process.env.OTP_RATE_LIMIT_WINDOW || "15m"),
  // max: parseInt(process.env.OTP_RATE_LIMIT_MAX, 10) || 5,
  max: 1000,
  keyGenerator: (req) => req.body.phone || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many OTP requests. Please try again after 15 minutes.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for email verification requests
 */
export const verifyEmailRateLimiter = rateLimit({
  windowMs: convertToMs(
    process.env.EMAIL_VERIFICATION_RATE_LIMIT_WINDOW || "1h"
  ),
  // max: parseInt(process.env.EMAIL_VERIFICATION_RATE_LIMIT_MAX, 10) || 10,
  max: 1000,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many email verification attempts. Try again in an hour.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for resending email verification
 */
export const sendEmailRateLimiter = rateLimit({
  windowMs: convertToMs(process.env.EMAIL_RESEND_RATE_LIMIT_WINDOW || "1h"),
  // max: parseInt(process.env.EMAIL_RESEND_RATE_LIMIT_MAX, 10) || 5,
  max: 1000,
  keyGenerator: (req) => req.body.email || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many resend requests. Please try again after an hour.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for profile update attempts
 */
export const profileRateLimiter = rateLimit({
  windowMs: convertToMs(process.env.PROFILE_UPDATE_RATE_LIMIT_WINDOW || "15m"),
  // max: parseInt(process.env.PROFILE_UPDATE_RATE_LIMIT_MAX, 10) || 10,
  max: 1000,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many profile update attempts. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for token refresh requests
 */
export const tokenRateLimiter = rateLimit({
  windowMs: convertToMs(process.env.TOKEN_REFRESH_RATE_LIMIT_WINDOW || "15m"),
  // max: parseInt(process.env.TOKEN_REFRESH_RATE_LIMIT_MAX, 10) || 30,
  max: 1000,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many token requests. Please try again after 15 minutes.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for password reset requests
 */

export const passwordResetRateLimiter = rateLimit({
  windowMs: convertToMs(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW || "1h"),
  // max: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX, 10) || 5,
  max: 1000,
  keyGenerator: (req) => req.body.email || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many password reset requests. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for login attempts
 */

export const loginRateLimiter = rateLimit({
  windowMs: convertToMs(process.env.LOGIN_RATE_LIMIT_WINDOW || "15m"),
  // max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 5,
  max: 1000,
  keyGenerator: (req) => req.body.email || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for email registration
 */

export const emailRegistrationRateLimiter = rateLimit({
  windowMs: convertToMs(
    process.env.EMAIL_REGISTRATION_RATE_LIMIT_WINDOW || "1h"
  ),
  // max: parseInt(process.env.EMAIL_REGISTRATION_RATE_LIMIT_MAX, 10) || 5,
  max: 1000,
  keyGenerator: (req) => req.body.email || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many registration attempts. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const phoneRegistrationRateLimiter = rateLimit({
  windowMs: convertToMs(
    process.env.PHONE_REGISTRATION_RATE_LIMIT_WINDOW || "1h"
  ),
  // max: parseInt(process.env.PHONE_REGISTRATION_RATE_LIMIT_MAX, 10) || 5,
  max: 1000,
  keyGenerator: (req) => req.body.phone || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many registration attempts. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const phoneVerificationRateLimiter = rateLimit({
  windowMs: convertToMs(
    process.env.PHONE_VERIFICATION_RATE_LIMIT_WINDOW || "1h"
  ),
  // max: parseInt(process.env.PHONE_VERIFICATION_RATE_LIMIT_MAX, 10) || 5,
  max: 1000,
  keyGenerator: (req) => req.body.phone || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many verification attempts. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const viewRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many view requests from this IP, please try again later",
  skip: (req) => {
    // Skip rate limiting for authenticated users
    return !!req.user;
  },
});

export const recommendationRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  keyGenerator: (req) => req.user?._id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many recommendation requests. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  keyGenerator: (req) => req.user?._id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many search requests. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
