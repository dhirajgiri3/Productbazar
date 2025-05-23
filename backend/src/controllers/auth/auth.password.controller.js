/**
 * Password Management Controller
 * Handles password reset, verification, and change functionality
 */

import User from "../../models/user/user.model.js";
import RefreshToken from "../../models/core/refreshToken.model.js";
import { maskEmail, sendVerificationEmail } from "../../utils/communication/mail.utils.js";
import logger from "../../utils/logging/logger.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  AppError,
  ValidationError,
  NotFoundError,
} from "../../utils/logging/error.js";
import {
  isStrongPassword,
  formatResponse,
} from "./helpers/auth.helpers.js"; // Fixed path
import { PASSWORD_RESET_RATE_LIMIT } from "./helpers/auth.constants.js"; // Fixed path

dotenv.config();

/**
 * @desc    Forgot password - Request password reset link
 * @route   POST /auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  // Validation is handled by middleware

  const { email } = req.body;

  try {
    // Check if JWT_RESET_SECRET is properly set
    if (!process.env.JWT_RESET_SECRET) {
      logger.error("CRITICAL: JWT_RESET_SECRET is not configured in environment variables.");
      return next(new AppError("Password reset service is temporarily unavailable.", 503, "RESET_SECRET_MISSING")); // 503 Service Unavailable
    }
     if (!process.env.CLIENT_URL) {
      logger.error("CRITICAL: CLIENT_URL is not configured in environment variables for password reset link.");
      return next(new AppError("Password reset service is configuration error.", 503, "CLIENT_URL_MISSING"));
    }


    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordResetExpires +lastPasswordResetRequest'); // Select necessary fields

    // IMPORTANT: Always return a success-like message to prevent email enumeration attacks
    const successMessage = "If an account with that email exists, a password reset link has been sent.";

    if (!user) {
        logger.warn(`Password reset requested for non-existent email: ${maskEmail(normalizedEmail)}`);
        // Don't reveal that the user doesn't exist
        return res.status(200).json(formatResponse("success", successMessage));
    }

    // Rate Limiting Check
    if (user.lastPasswordResetRequest && Date.now() - user.lastPasswordResetRequest < PASSWORD_RESET_RATE_LIMIT) {
        const timeLeft = Math.ceil((PASSWORD_RESET_RATE_LIMIT - (Date.now() - user.lastPasswordResetRequest)) / 1000);
        logger.warn(`Password reset rate limit hit for user ${user._id}`, { email: maskEmail(normalizedEmail) });
        // Still return success message, but log the attempt
        return res.status(200).json(formatResponse("success", successMessage + ` (Rate limit active, wait ${timeLeft}s)`)); // Optionally add info in dev
    }

    // Generate the password reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_RESET_SECRET,
      { expiresIn: "1h" } // Token valid for 1 hour
    );

    // Construct the reset link
    const resetLink = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;

    // Send the email
    try {
        await sendVerificationEmail( // Re-use send email utility
            user.email,
            "Password Reset Request",
            `You requested a password reset for your account. Please click the link below to set a new password:\n\n${resetLink}\n\nThis link is valid for 1 hour. If you didn't request this, please ignore this email.\n`
        );

        // Save token and expiry to user document AFTER successful email send
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour from now
        user.lastPasswordResetRequest = Date.now(); // Update rate limit timestamp
        await user.save();

        logger.info(`Password reset link sent successfully to ${maskEmail(user.email)} for user ${user._id}`);
        res.status(200).json(formatResponse("success", successMessage));

    } catch (emailError) {
        logger.error(`Failed to send password reset email to ${maskEmail(user.email)} (User ${user._id}): ${emailError.message}`);
        // Don't expose failure details
        next(new AppError("Failed to send password reset email due to a server issue. Please try again later.", 500, "RESET_EMAIL_SEND_FAILED"));
    }

  } catch (error) {
    logger.error(`Error during forgot password process for ${maskEmail(email)}: ${error.message}`, { stack: error.stack });
    // Generic error for unexpected issues
     if (error instanceof AppError) { // Pass specific AppErrors through
        next(error);
     } else {
        next(new AppError("An unexpected error occurred while processing your password reset request.", 500, "FORGOT_PASSWORD_ERROR"));
     }
  }
};


/**
 * @desc    Verify password reset token validity
 * @route   POST /auth/verify-password-token
 * @access  Public
 */
export const verifyPasswordToken = async (req, res, next) => {
  // Validation is handled by middleware

  const { token } = req.body;

  if (!token) {
    return next(new ValidationError("Reset token is required."));
  }

  try {
    // 1. Verify JWT signature and expiry
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logger.warn(`Expired password reset token verification attempt.`);
            return next(new ValidationError("Password reset link has expired. Please request a new one.", "RESET_TOKEN_EXPIRED"));
        } else if (error instanceof jwt.JsonWebTokenError) {
            logger.warn(`Invalid password reset token verification attempt: ${error.message}`);
            return next(new ValidationError("Invalid or corrupted password reset link.", "RESET_TOKEN_INVALID"));
        } else {
            throw error; // Re-throw unexpected verify errors
        }
    }

    // 2. Find user and check if token matches the one stored & is still valid in DB context
    const user = await User.findById(decoded.id).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
         // User might have been deleted after token was issued
         logger.warn(`Password reset token valid, but user ${decoded.id} not found.`);
         return next(new ValidationError("Invalid password reset link (user not found).", "RESET_TOKEN_USER_NOT_FOUND"));
    }

    if (user.passwordResetToken !== token) {
         // Token doesn't match the one stored (maybe a newer one was issued)
         logger.warn(`Password reset token mismatch for user ${user._id}. Stored token might be newer.`);
         return next(new ValidationError("This password reset link is no longer valid (a newer one might have been requested).", "RESET_TOKEN_MISMATCH"));
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
         // DB expiry check (redundant with JWT expiry but good safeguard)
         logger.warn(`Password reset token expired based on DB timestamp for user ${user._id}.`);
         // Clear the expired token from DB
         user.passwordResetToken = undefined;
         user.passwordResetExpires = undefined;
         await user.save();
         return next(new ValidationError("Password reset link has expired. Please request a new one.", "RESET_TOKEN_DB_EXPIRED"));
    }

    // 3. Token is valid
    logger.info(`Password reset token verified successfully for user ${user._id}`);
    res.status(200).json(formatResponse("success", "Password reset token is valid."));

  } catch (error) {
    logger.error(`Error verifying password reset token: ${error.message}`, { token: token ? 'present' : 'missing', stack: error.stack });
     if (error instanceof ValidationError || error instanceof AppError) {
        next(error);
     } else {
        next(new AppError("Failed to verify password reset token due to a server error.", 500, "VERIFY_RESET_TOKEN_FAILED"));
     }
  }
};


/**
 * @desc    Reset password using a valid token
 * @route   POST /auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
 // Validation is handled by middleware

  const { password, token } = req.body;

  try {
    // 1. Validate password strength
    if (!isStrongPassword(password)) {
      return next(
        new ValidationError(
          "Password does not meet requirements: 8+ characters, uppercase, lowercase, number, and special character (!@#$%^&*)."
        )
      );
    }

    // 2. Verify JWT signature and expiry (same as verifyPasswordToken)
     if (!process.env.JWT_RESET_SECRET) throw new AppError("Server configuration error.", 503); // Should be caught earlier ideally
    let decoded;
     try {
        decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) return next(new ValidationError("Password reset link has expired.", "RESET_TOKEN_EXPIRED"));
        if (error instanceof jwt.JsonWebTokenError) return next(new ValidationError("Invalid password reset link.", "RESET_TOKEN_INVALID"));
        throw error;
    }


    // 3. Find user, check token match and DB expiry (fetch password field too)
    const user = await User.findById(decoded.id).select('+password +passwordResetToken +passwordResetExpires');

    if (!user || user.passwordResetToken !== token || !user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
        logger.warn(`Attempt to reset password with invalid/expired token state for user ID ${decoded.id}.`);
        // Don't clear token here as it might allow replay if token was valid moments ago
        return next(new ValidationError("Invalid or expired password reset link. Please request a new one.", "RESET_PASSWORD_TOKEN_INVALID_STATE"));
    }

    // --- Token is valid, proceed with password update ---

    // 4. Update the password
    user.password = password; // The pre-save hook in the User model will hash it
    user.passwordResetToken = undefined; // Clear the reset token fields
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date(); // Track when password was last changed
    user.loginAttempts = 0; // Reset login attempts
    user.lockUntil = undefined; // Unlock account if it was locked
    await user.save();

    logger.info(`Password reset successful for user ${user._id}`);

    // 5. Invalidate all active refresh tokens for this user
    // This forces logout on all other devices/sessions after password reset
    try {
        const { modifiedCount } = await RefreshToken.updateMany(
            { user: user._id, revokedAt: null }, // Find active tokens for this user
            { $set: { revokedAt: Date.now(), revokedByIp: req.ip, reason: "Password Reset" } } // Mark as revoked
        );
         logger.info(`Invalidated ${modifiedCount} active refresh tokens for user ${user._id} after password reset.`);
    } catch(tokenError) {
        logger.error(`Failed to invalidate refresh tokens after password reset for user ${user._id}: ${tokenError.message}`);
        // Continue response even if token invalidation fails, but log it
    }

    // 6. Send confirmation email (optional)
    try {
        await sendVerificationEmail(
            user.email,
            "Your Password Has Been Changed",
            `Your account password was successfully changed. If you did not perform this action, please contact support immediately.`
        );
    } catch (emailError) {
         logger.warn(`Failed to send password change confirmation email to ${maskEmail(user.email)} (User ${user._id}): ${emailError.message}`);
         // Don't fail the request if email send fails
    }


    // 7. Respond with success
    res.status(200).json(formatResponse("success", "Password has been reset successfully. You can now log in with your new password."));

  } catch (error) {
    logger.error(`Password reset failed: ${error.message}`, { token: token ? 'present' : 'missing', stack: error.stack });
     if (error instanceof ValidationError || error instanceof AppError) {
        next(error);
     } else {
        next(new AppError("Failed to reset password due to a server error.", 500, "RESET_PASSWORD_FAILED"));
     }
  }
};


/**
 * @desc    Change user password (when logged in)
 * @route   POST /auth/change-password
 * @access  Private (Requires authentication, possibly recent verification)
 */
export const changePassword = async (req, res, next) => {
  // Validation is handled by middleware

  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  try {
    // 1. Find the user and select the password field
    const user = await User.findById(userId).select("+password");
    if (!user) {
        logger.error(`Authenticated user ${userId} not found during change password.`);
        return next(new NotFoundError("User session invalid. Please log in again.", "CHANGE_PASS_USER_NOT_FOUND"));
    }

    // 2. Verify the current password
    if (!currentPassword || !(await user.verifyPassword(currentPassword))) {
      logger.warn(`Incorrect current password provided during change password attempt by user ${userId}.`);
      return next(new ValidationError("The current password you entered is incorrect.", "CURRENT_PASSWORD_INVALID"));
    }

    // 3. Check if new password is the same as the old one
     if (await user.verifyPassword(newPassword)) {
       return next(new ValidationError("The new password cannot be the same as the current password.", "NEW_PASSWORD_SAME_AS_OLD"));
    }

    // 4. Validate new password strength
    if (!isStrongPassword(newPassword)) {
      return next(
        new ValidationError(
          "New password does not meet requirements: 8+ characters, uppercase, lowercase, number, and special character (!@#$%^&*)."
        )
      );
    }

    // --- Checks passed, update password ---

    // 5. Update the password
    user.password = newPassword; // Hashing handled by pre-save hook
    user.passwordChangedAt = new Date();
    await user.save();

    logger.info(`Password changed successfully for user ${userId}.`);

    // 6. Invalidate all other active refresh tokens (keep current session active)
    const currentRefreshToken = req.cookies.refreshToken; // Get token used for this request
    try {
        const { modifiedCount } = await RefreshToken.updateMany(
            {
                user: user._id,
                revokedAt: null,
                token: { $ne: currentRefreshToken } // Exclude the current session's token
            },
            { $set: { revokedAt: Date.now(), revokedByIp: req.ip, reason: "Password Change" } }
        );
         logger.info(`Invalidated ${modifiedCount} other active refresh tokens for user ${userId} after password change.`);
    } catch(tokenError) {
        logger.error(`Failed to invalidate other refresh tokens after password change for user ${userId}: ${tokenError.message}`);
    }

    // 7. Send confirmation email (optional)
     try {
        await sendVerificationEmail(
            user.email,
            "Your Password Has Been Changed",
            `Your account password was successfully changed from a logged-in session. If you did not perform this action, please secure your account and contact support immediately.`
        );
    } catch (emailError) {
         logger.warn(`Failed to send password change confirmation email to ${maskEmail(user.email)} (User ${userId}): ${emailError.message}`);
    }


    // 8. Respond with success
    res.status(200).json(formatResponse("success", "Password changed successfully."));

  } catch (error) {
    logger.error(`Password change failed for user ${userId}: ${error.message}`, { stack: error.stack });
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AppError) {
        next(error);
    } else {
        next(new AppError("Failed to change password due to a server error.", 500, "CHANGE_PASSWORD_FAILED"));
    }
  }
};