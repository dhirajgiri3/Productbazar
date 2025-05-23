/**
 * Authentication Routes
 * Handles all authentication, verification, and user profile management routes
 */

import express from "express";
import * as baseController from "../../../controllers/auth/auth.base.controller.js";
import * as verificationController from "../../../controllers/auth/auth.verification.controller.js";
import * as profileController from "../../../controllers/auth/auth.profile.controller.js";
import * as passwordController from "../../../controllers/auth/auth.password.controller.js";
import * as accountController from "../../../controllers/auth/auth.account.controller.js";

import * as authValidator from "../../../validators/auth/auth.validators.js";
import {
  protect,
  optionalAuth,
  restrictTo,
  verifyAnyEmailOrPhone,
  requireCriticalActionVerification
} from "../../middlewares/user/auth.middleware.js";
import { cloudinaryUploader } from "../../../utils/storage/cloudinary.utils.js";
import rateLimit from "express-rate-limit";
import {
  uploadSingle,
  uploadMultiple, // Handles fields like 'profileImage', 'bannerImage'
  handleMulterError,
} from "../../../utils/storage/upload.utils.js";

const router = express.Router();

// --- Rate Limiters ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    status: "error",
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    status: "error",
    message: "Too many verification requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    status: "error",
    message: "Too many password reset attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Public Routes ---

// Get user by username (must come before the :id route to avoid parameter conflicts)
router.get("/user/username/:username", baseController.getUserByUsername);

// Get public user profile info (limited fields)
router.get("/user/:id", baseController.getUserById);

// Email Registration & Login
router.post(
  "/register/email",
  authLimiter,
  authValidator.validateRegister, // Use specific validator
  baseController.register
);
router.post(
  "/login/email",
  authLimiter,
  authValidator.validateLogin, // Use specific validator
  baseController.login
);

// Phone OTP Registration & Login
router.post(
  "/:type(register|login|verify)/request-otp", // Use regex for type param validation
  verificationLimiter,
  authValidator.validateRequestOtp, // Validator for phone format
  verificationController.requestOtp
);
router.post(
  "/:type(register|login|verify)/verify-otp", // Use regex for type param validation
  authLimiter, // Use auth limiter for verify step as it logs in/registers
  authValidator.validateVerifyOtp, // Validator for phone, code, role/roleDetails
  verificationController.verifyOtp
);

// Password Reset
router.post(
  "/forgot-password",
  passwordResetLimiter, // Use specific limiter
  authValidator.validateEmail,
  passwordController.forgotPassword
);
router.post(
  // Verify if token is valid before showing reset form
  "/verify-password-token",
  authValidator.validateToken, // Validator for token presence
  passwordController.verifyPasswordToken
);
router.post(
  "/reset-password",
  authLimiter, // Limit actual reset attempts
  authValidator.validateNewPassword, // Validator for token and new password
  passwordController.resetPassword
);

// Email Verification
router.get("/verify-email/:token", verificationController.verifyEmail);
router.post(
  "/send-email-verification", // Can be public or private depending on flow
  verificationLimiter,
  authValidator.validateEmail,
  verificationController.resendEmailVerification
);

// Token Refresh
router.post("/refresh-token", baseController.refreshToken);

// Logout (can be called publicly to clear cookies, but usually needs auth context)
router.post("/logout", protect, baseController.logout); // Make logout require auth to revoke server-side tokens properly

// OAuth Routes
router.get("/google", accountController.googleAuth);
router.get(
  "/google/callback",
  // Passport handles the immediate auth, controller processes result
  accountController.oauthCallback
);

// Get Current User Profile (Optional Authentication)
router.get("/me", optionalAuth, profileController.getOptionalProfile);

// --- Protected Routes (Require Authentication - `protect`) ---
router.use(protect);

// Get Current User Profile (Authenticated)
router.get("/profile", profileController.getProfile);
// router.get("/user", profileController.getCurrentUser); // Keep if needed, but /me or /profile is common

// Username Availability Check
router.get("/check-username", profileController.checkUsernameAvailability);

// --- Profile Completion & Update ---
// Complete profile often happens before full verification, so middleware might need adjustment
router.post(
  "/complete-profile",
  // authenticateToken is already applied by router.use()
  uploadSingle("profileImage"), // Handle single file upload for profile pic
  handleMulterError,
  cloudinaryUploader("profile"), // Process the uploaded file via Cloudinary
  authValidator.validateProfileCompletion, // Specific validator for completion fields
  profileController.completeProfile
);

// General profile update (requires some verification)
router.put(
  "/profile",
  verifyAnyEmailOrPhone, // Require at least email OR phone verified
  authValidator.validateProfileUpdate, // Validator for general profile fields
  profileController.updateProfile
);

// --- Image Updates (Require some verification) ---
// Route for updating profile picture (new route name)
router.post(
  "/update-profile-picture",
  verifyAnyEmailOrPhone,
  uploadSingle("profileImage"), // Expect 'profileImage' field name
  handleMulterError,
  cloudinaryUploader("profile"), // Upload to 'profile' folder
  profileController.updateProfilePicture
);

// Legacy route for backward compatibility
router.post(
  "/update-profile",
  verifyAnyEmailOrPhone,
  uploadSingle("profileImage"), // Expect 'profileImage' field name
  handleMulterError,
  cloudinaryUploader("profile"), // Upload to 'profile' folder
  profileController.updateProfilePicture
);

router.post(
  "/update-banner",
  verifyAnyEmailOrPhone,
  uploadSingle("bannerImage"), // Expect 'bannerImage' field name
  handleMulterError,
  cloudinaryUploader("banner"), // Upload to 'banner' folder
  profileController.updateBannerImage
);

// Update multiple images (e.g., profile + banner)
router.post(
  "/update-profile-images", // More specific route name
  verifyAnyEmailOrPhone,
  uploadMultiple([
    // Define expected fields and counts
    { name: "profileImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    // { name: 'companyLogo', maxCount: 1 } // Example
  ]),
  handleMulterError,
  cloudinaryUploader(null, true), // Let middleware handle folder based on fieldname, process multiple files
  profileController.processProfileImages
);

// --- Settings Updates (Require some verification) ---
router.put(
  "/notification-preferences",
  verifyAnyEmailOrPhone,
  // Add validation middleware if needed
  accountController.updateNotificationPreferences
);

router.put(
  "/privacy-settings",
  verifyAnyEmailOrPhone,
  // Add validation middleware if needed
  accountController.updatePrivacySettings
);

router.put(
  "/security-settings",
  verifyAnyEmailOrPhone, // Basic verification sufficient? Or require critical?
  // Add validation middleware if needed
  accountController.updateSecuritySettings
);

// --- Verification Management (Authenticated) ---
// Send OTP to user's registered/new phone for verification purposes
router.post(
  "/send-phone-otp", // Renamed for clarity
  verificationLimiter,
  authValidator.validatePhone, // Validator for phone format
  verificationController.sendPhoneVerificationOTP
);
// Verify the OTP sent via /send-phone-otp
router.post(
  "/verify-phone-otp", // Renamed for clarity
  authLimiter, // Limit verification attempts
  authValidator.validateVerifyPhoneOtp, // Validator for phone and code
  verificationController.verifyOtpForPhoneVerification
);
// Resend email verification (authenticated version) - uses same controller logic
router.post(
  "/resend-email-verification",
  verificationLimiter,
  // No email needed in body, uses authenticated user's email
  verificationController.resendEmailVerification
);

// --- Critical Actions (Require Recent/Stronger Verification) ---
router.put(
  "/change-password",
  // requireCriticalActionVerification, // Use if password re-entry is needed
  authValidator.validateChangePassword,
  passwordController.changePassword
);

router.post(
  "/request-deletion",
  requireCriticalActionVerification, // Requires recent password/OTP check
  accountController.requestAccountDeletion
);

router.post(
  // Cancel doesn't need critical verification usually
  "/cancel-deletion",
  // verifyAnyEmailOrPhone, // Basic auth is enough
  accountController.cancelAccountDeletion
);

router.post(
  "/revoke-access", // Revoking sessions
  requireCriticalActionVerification, // Requires recent password/OTP check
  // Add validation for tokenId/revokeAll
  accountController.revokeAccess
);

// Logout all other sessions (except current one)
router.post(
  "/logout-all",
  protect, // Only need basic authentication
  (req, res, next) => {
    // Set revokeAll to true and pass to the existing controller
    req.body.revokeAll = true;
    accountController.revokeAccess(req, res, next);
  }
);

export default router;
