import mongoose from "mongoose";
import User from "../../models/user/user.model.js";
import RefreshToken from "../../models/core/refreshToken.model.js";
import { maskEmail, sendVerificationEmail } from "../../utils/communication/mail.utils.js";
import logger from "../../utils/logging/logger.js";
import passport from "passport";
import dotenv from "dotenv";
import {
  AppError,
  ValidationError,
  NotFoundError,
} from "../../utils/logging/error.js";
import { formatResponse, ensureAddressStructure } from "./helpers/auth.helpers.js"; // Fixed path
import { isProduction } from "./helpers/auth.constants.js"; // Fixed path
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/auth/jwt.utils.js";

dotenv.config();

/**
 * @desc    Google OAuth initiation
 * @route   GET /auth/google
 * @access  Public
 */
export const googleAuth = (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"], // Request profile and email scopes
    prompt: "select_account", // Force account selection each time
    session: false, // We are using JWT, not session cookies from passport
  })(req, res, next);
};

/**
 * @desc    Google OAuth callback handler
 * @route   GET /auth/google/callback
 * @access  Public (Handles redirect from Google)
 */
export const oauthCallback = (req, res, next) => {
  // Let passport handle the token exchange and profile fetching
  // The 'google' strategy in passport.config.js will find/create user and call the callback below
  passport.authenticate(
    "google",
    {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/auth/login?error=google_auth_failed`,
    }, // Redirect on initial passport failure
    async (err, user, info) => {
      // passport strategy's verify callback returns err, user, info
      const state = req.query.state; // If you pass state, retrieve it here

      try {
        // Log the start and any immediate errors from passport
        logger.info("Google OAuth callback invoked.", {
          info,
          state,
          errorMsg: err?.message,
        });

        if (err) {
          logger.error(
            "Error during Google authentication strategy execution:",
            { error: err.message, stack: err.stack }
          );
          // Redirect to client with a generic error
          return res.redirect(
            `${
              process.env.CLIENT_URL
            }/auth/login?error=google_auth_error&message=${encodeURIComponent(
              "Authentication failed. Please try again."
            )}`
          );
        }

        if (!user) {
          // This usually means the passport strategy decided not to proceed (e.g., domain restriction failed)
          logger.error(
            "Google OAuth callback: No user object returned from Passport strategy.",
            { info }
          );
          const message =
            info?.message ||
            "Could not authenticate with Google. Please try again or use another method.";
          return res.redirect(
            `${
              process.env.CLIENT_URL
            }/auth/login?error=google_no_user&message=${encodeURIComponent(
              message
            )}`
          );
        }

        // --- User successfully authenticated or created by passport strategy ---
        logger.info(`Google OAuth successful for user: ${user._id}`, {
          email: maskEmail(user.email),
          isNew: info?.isNewUser || false,
        });

        // Ensure address structure consistency (important for both new and existing users)
        await ensureAddressStructure(user); // This updates the user object in memory and potentially DB

        // Update last login time
        user.lastLogin = new Date();
        // Reset login attempts/lockout if applicable (might not apply to OAuth logins)
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save(); // Save updated login time and address structure if changed

        // --- Generate JWT tokens ---
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Store the refresh token
        const refreshTokenDoc = new RefreshToken({
          user: user._id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdByIp: req.ip,
          userAgent: req.headers["user-agent"] || "Unknown",
          provider: "google", // Indicate token originated from OAuth
        });
        await refreshTokenDoc.save();

        // --- Set Refresh Token Cookie ---
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // --- Redirect User to Client ---
        // Redirect to different pages based on user state (e.g., profile completion)
        let redirectPath = "/dashboard"; // Default redirect path
        if (!user.isProfileCompleted) {
          redirectPath = "/complete-profile";
          logger.info(
            `Redirecting new/incomplete Google OAuth user ${user._id} to profile completion.`
          );
        }
        // We need to pass the access token to the client. Query parameter is simple but less secure.
        // Consider using localStorage via a dedicated callback page or passing via state if possible.
        // Using query param for simplicity here:
        const clientRedirectUrl = `${process.env.CLIENT_URL}${redirectPath}?oauth_success=true&token=${accessToken}`;

        logger.info(
          `Redirecting Google OAuth user ${user._id} to client at ${redirectPath}`
        );
        res.redirect(clientRedirectUrl);
      } catch (error) {
        logger.error("Error processing Google OAuth callback:", {
          userId: user?._id,
          error: error.message,
          stack: error.stack,
        });
        // Redirect to client with a generic internal server error message
        res.redirect(
          `${
            process.env.CLIENT_URL
          }/auth/login?error=internal_error&message=${encodeURIComponent(
            "An unexpected error occurred during login."
          )}`
        );
      }
    }
  )(req, res, next); // Important: call the passport authenticate function
};

/**
 * @desc    Request account deletion
 * @route   POST /auth/request-deletion
 * @access  Private (Requires authentication and recent verification)
 */
export const requestAccountDeletion = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).select(
      "accountDeletionScheduled email isEmailVerified"
    );
    if (!user) {
      logger.error(
        `Authenticated user ${userId} not found during account deletion request.`
      );
      return next(
        new NotFoundError(
          "User session invalid. Please log in again.",
          "DELETE_REQ_USER_NOT_FOUND"
        )
      );
    }

    if (user.accountDeletionScheduled) {
      logger.info(
        `User ${userId} requested account deletion again, already scheduled for ${user.accountDeletionScheduled}.`
      );
      const scheduleDateString =
        user.accountDeletionScheduled.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      return res
        .status(200)
        .json(
          formatResponse(
            "success",
            `Account deletion is already scheduled for ${scheduleDateString}. You can cancel this from your settings.`,
            { scheduledDeletion: user.accountDeletionScheduled }
          )
        );
    }

    // Schedule deletion (e.g., 7 days from now)
    const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.accountDeletionScheduled = deletionDate;
    await user.save();

    // Send notification email if possible
    if (user.email && user.isEmailVerified) {
      try {
        const scheduleDateString = deletionDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const scheduleTimeString = deletionDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        });

        await sendVerificationEmail(
          // Re-use email utility
          user.email,
          "Account Deletion Scheduled",
          `As requested, your account is scheduled for permanent deletion on ${scheduleDateString} around ${scheduleTimeString}.\n\n` +
            `If you change your mind, you can cancel this request by logging into your account settings before this date.\n\n` +
            `If you did not request this, please secure your account immediately and contact support.`
        );
        logger.info(
          `Account deletion scheduled notification sent to ${maskEmail(
            user.email
          )} for user ${userId}.`
        );
      } catch (emailError) {
        // Log error but don't fail the request
        logger.error(
          `Failed to send deletion scheduled notification to ${maskEmail(
            user.email
          )} (User ${userId}): ${emailError.message}`
        );
      }
    } else {
      logger.warn(
        `Cannot send deletion scheduled email notification to user ${userId} (no verified email).`
      );
    }

    logger.info(
      `Account deletion successfully scheduled for user ${userId} on ${deletionDate}.`
    );

    res
      .status(200)
      .json(
        formatResponse(
          "success",
          "Your account is scheduled for deletion. An email confirmation has been sent if available.",
          { scheduledDeletion: deletionDate }
        )
      );
  } catch (error) {
    logger.error(
      `Account deletion request failed for user ${userId}: ${error.message}`,
      { stack: error.stack }
    );
    if (error instanceof NotFoundError || error instanceof AppError) {
      next(error);
    } else {
      next(
        new AppError(
          "Failed to schedule account deletion due to a server error.",
          500,
          "DELETE_REQ_FAILED"
        )
      );
    }
  }
};

/**
 * @desc    Cancel scheduled account deletion
 * @route   POST /auth/cancel-deletion
 * @access  Private (Requires authentication)
 */
export const cancelAccountDeletion = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).select(
      "accountDeletionScheduled email isEmailVerified"
    );
    if (!user) {
      logger.error(
        `Authenticated user ${userId} not found during cancel deletion request.`
      );
      return next(
        new NotFoundError(
          "User session invalid. Please log in again.",
          "CANCEL_DELETE_USER_NOT_FOUND"
        )
      );
    }

    if (!user.accountDeletionScheduled) {
      logger.info(
        `User ${userId} attempted to cancel deletion, but none was scheduled.`
      );
      return res
        .status(200)
        .json(
          formatResponse(
            "success",
            "No account deletion was scheduled for your account."
          )
        );
    }

    // Clear the scheduled deletion date
    const previousScheduleDate = user.accountDeletionScheduled; // Store for logging/email
    user.accountDeletionScheduled = undefined;
    await user.save();

    // Send notification email if possible
    if (user.email && user.isEmailVerified) {
      try {
        const previousDateString = previousScheduleDate.toLocaleDateString(
          "en-US",
          { year: "numeric", month: "long", day: "numeric" }
        );
        await sendVerificationEmail(
          user.email,
          "Account Deletion Cancelled",
          `Your request to delete your account (previously scheduled for ${previousDateString}) has been successfully cancelled.\n\nYour account remains active. If you did not request this cancellation, please review your account security.`
        );
        logger.info(
          `Account deletion cancelled notification sent to ${maskEmail(
            user.email
          )} for user ${userId}.`
        );
      } catch (emailError) {
        logger.error(
          `Failed to send deletion cancelled notification to ${maskEmail(
            user.email
          )} (User ${userId}): ${emailError.message}`
        );
      }
    } else {
      logger.warn(
        `Cannot send deletion cancelled email notification to user ${userId} (no verified email).`
      );
    }

    logger.info(`Account deletion successfully cancelled for user ${userId}.`);

    res
      .status(200)
      .json(
        formatResponse(
          "success",
          "Account deletion has been cancelled successfully."
        )
      );
  } catch (error) {
    logger.error(
      `Cancel account deletion failed for user ${userId}: ${error.message}`,
      { stack: error.stack }
    );
    if (error instanceof NotFoundError || error instanceof AppError) {
      next(error);
    } else {
      next(
        new AppError(
          "Failed to cancel account deletion due to a server error.",
          500,
          "CANCEL_DELETE_FAILED"
        )
      );
    }
  }
};

/**
 * @desc    Revoke access for specific devices/sessions (by invalidating refresh tokens)
 * @route   POST /auth/revoke-access
 * @access  Private (Requires authentication, possibly recent verification)
 */
export const revokeAccess = async (req, res, next) => {
  const userId = req.user._id;
  const { tokenId, revokeAll } = req.body; // tokenId for specific session, revokeAll for all others
  const currentRefreshToken = req.cookies.refreshToken; // Get the token of the current session

  try {
    let revokedCount = 0;

    if (!tokenId && !revokeAll) {
      return next(
        new ValidationError(
          "Please specify either a session token ID ('tokenId') to revoke or set 'revokeAll' to true to revoke all other sessions."
        )
      );
    }

    if (tokenId) {
      // Revoke a specific token ID, ensuring it belongs to the user and isn't the current session's token
      const tokenToRevoke = await RefreshToken.findOne({
        _id: tokenId,
        user: userId,
      });

      if (!tokenToRevoke) {
        logger.warn(
          `User ${userId} tried to revoke non-existent or non-owned token ID: ${tokenId}`
        );
        return next(
          new NotFoundError(
            "The specified session token was not found or does not belong to your account.",
            "REVOKE_TOKEN_NOT_FOUND"
          )
        );
      }

      if (tokenToRevoke.token === currentRefreshToken) {
        logger.warn(
          `User ${userId} attempted to revoke their current session token via ID: ${tokenId}`
        );
        return next(
          new ValidationError(
            "You cannot revoke your current active session using its ID. Log out instead.",
            "REVOKE_CURRENT_SESSION_BY_ID"
          )
        );
      }

      if (tokenToRevoke.isActive) {
        // Only revoke if it's currently active
        tokenToRevoke.revokedAt = Date.now();
        tokenToRevoke.revokedByIp = req.ip;
        tokenToRevoke.reason = "Manual Revocation by User";
        await tokenToRevoke.save();
        revokedCount = 1;
        logger.info(
          `User ${userId} successfully revoked session token ID: ${tokenId}`
        );
      } else {
        logger.info(
          `User ${userId} tried to revoke already inactive token ID: ${tokenId}`
        );
        // Inform user it was already inactive? Or just report 0 revoked.
        // return res.status(200).json(formatResponse("success", "The specified session was already inactive.", { revokedCount: 0 }));
        revokedCount = 0; // Report 0 as it wasn't active to begin with
      }
    } else if (revokeAll) {
      // Revoke all active tokens EXCEPT the current one
      const result = await RefreshToken.updateMany(
        {
          user: userId,
          revokedAt: null, // Only target active tokens
          token: { $ne: currentRefreshToken }, // Exclude the current session's token
        },
        {
          $set: {
            revokedAt: Date.now(),
            revokedByIp: req.ip,
            reason: "Revoke All Other Sessions by User",
          },
        }
      );

      revokedCount = result.modifiedCount;
      logger.info(
        `User ${userId} revoked all other (${revokedCount}) active sessions.`
      );
    }

    res
      .status(200)
      .json(
        formatResponse(
          "success",
          `Successfully revoked ${revokedCount} session(s).`,
          { revokedCount }
        )
      );
  } catch (error) {
    logger.error(`Revoke access failed for user ${userId}: ${error.message}`, {
      tokenId,
      revokeAll,
      stack: error.stack,
    });
    if (error instanceof mongoose.Error.CastError && error.path === "_id") {
      return next(
        new ValidationError(
          "Invalid session token ID format provided.",
          "REVOKE_INVALID_ID_FORMAT"
        )
      );
    }
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AppError
    ) {
      next(error);
    } else {
      next(
        new AppError(
          "Failed to revoke session access due to a server error.",
          500,
          "REVOKE_ACCESS_FAILED"
        )
      );
    }
  }
};

/**
 * @desc    Update user notification preferences
 * @route   PUT /auth/notification-preferences
 * @access  Private
 */
export const updateNotificationPreferences = async (req, res, next) => {
  const userId = req.user._id;
  const { notificationPreferences } = req.body; // Expect an object like { email: { news: true, messages: false }, push: { ... } }

  try {
    // Basic validation: ensure notificationPreferences is an object
    if (
      !notificationPreferences ||
      typeof notificationPreferences !== "object" ||
      Array.isArray(notificationPreferences)
    ) {
      return next(
        new AppError(
          "Invalid format: 'notificationPreferences' must be an object.",
          400,
          "INVALID_PREFERENCES_FORMAT"
        )
      );
    }

    const user = await User.findById(userId).select("notificationPreferences");
    if (!user) {
      logger.error(
        `User ${userId} not found during notification preferences update.`
      );
      return next(
        new NotFoundError(
          "User session invalid. Please log in again.",
          "NOTIF_PREFS_USER_NOT_FOUND"
        )
      );
    }

    // Deep merge the new preferences with existing ones
    // A simple merge might not be sufficient if nested objects need careful handling.
    // For basic structures like { email: { type1: bool, type2: bool } }, simple spread is ok.
    const updatedPreferences = {
      ...(user.notificationPreferences?.toObject() || {}), // Get existing prefs or empty object
      ...notificationPreferences, // Overwrite/add new prefs
    };

    // Optional: Add validation for known preference keys/types here if needed
    // e.g., ensure values are booleans, keys are valid types.

    user.notificationPreferences = updatedPreferences;
    await user.save();

    logger.info(
      `Notification preferences updated successfully for user ${userId}.`
    );

    return res.status(200).json(
      formatResponse(
        "success",
        "Notification preferences updated successfully.",
        {
          user: {
            // Return only updated field
            _id: user._id,
            notificationPreferences: user.notificationPreferences,
          },
        }
      )
    );
  } catch (error) {
    logger.error(
      `Update notification preferences error for user ${userId}: ${error.message}`,
      { stack: error.stack }
    );
    if (error instanceof AppError || error instanceof NotFoundError) {
      next(error);
    } else {
      next(
        new AppError(
          "Failed to update notification preferences due to a server error.",
          500,
          "UPDATE_NOTIF_PREFS_FAILED"
        )
      );
    }
  }
};

/**
 * @desc    Update user privacy settings
 * @route   PUT /auth/privacy-settings
 * @access  Private
 */
export const updatePrivacySettings = async (req, res, next) => {
  const userId = req.user._id;
  const { privacySettings } = req.body; // Expect object like { profileVisibility: 'public', showEmail: false }

  try {
    if (
      !privacySettings ||
      typeof privacySettings !== "object" ||
      Array.isArray(privacySettings)
    ) {
      return next(
        new AppError(
          "Invalid format: 'privacySettings' must be an object.",
          400,
          "INVALID_PRIVACY_FORMAT"
        )
      );
    }

    const user = await User.findById(userId).select("privacySettings");
    if (!user) {
      logger.error(`User ${userId} not found during privacy settings update.`);
      return next(
        new NotFoundError(
          "User session invalid. Please log in again.",
          "PRIVACY_SETTINGS_USER_NOT_FOUND"
        )
      );
    }

    // Merge new settings with existing ones
    const updatedSettings = {
      ...(user.privacySettings?.toObject() || {}),
      ...privacySettings,
    };

    // Optional: Validate specific settings values (e.g., profileVisibility enum)
    const validVisibilities = ["public", "connections", "private"]; // Example
    if (
      updatedSettings.profileVisibility &&
      !validVisibilities.includes(updatedSettings.profileVisibility)
    ) {
      return next(
        new ValidationError(
          `Invalid profileVisibility value. Must be one of: ${validVisibilities.join(
            ", "
          )}`,
          "INVALID_VISIBILITY_VALUE"
        )
      );
    }
    // Add more validations as needed...

    user.privacySettings = updatedSettings;
    await user.save();

    logger.info(`Privacy settings updated successfully for user ${userId}.`);

    return res.status(200).json(
      formatResponse("success", "Privacy settings updated successfully.", {
        user: {
          _id: user._id,
          privacySettings: user.privacySettings,
        },
      })
    );
  } catch (error) {
    logger.error(
      `Update privacy settings error for user ${userId}: ${error.message}`,
      { stack: error.stack }
    );
    if (
      error instanceof AppError ||
      error instanceof NotFoundError ||
      error instanceof ValidationError
    ) {
      next(error);
    } else {
      next(
        new AppError(
          "Failed to update privacy settings due to a server error.",
          500,
          "UPDATE_PRIVACY_FAILED"
        )
      );
    }
  }
};

/**
 * @desc    Update user security settings (e.g., two-factor auth enable/disable)
 * @route   PUT /auth/security-settings
 * @access  Private
 */
export const updateSecuritySettings = async (req, res, next) => {
  const userId = req.user._id;
  const { securitySettings } = req.body; // Expect object like { twoFactorEnabled: true }

  try {
    if (
      !securitySettings ||
      typeof securitySettings !== "object" ||
      Array.isArray(securitySettings)
    ) {
      return next(
        new AppError(
          "Invalid format: 'securitySettings' must be an object.",
          400,
          "INVALID_SECURITY_FORMAT"
        )
      );
    }

    const user = await User.findById(userId).select(
      "securitySettings isPhoneVerified email"
    ); // Need phone/email status for 2FA logic
    if (!user) {
      logger.error(`User ${userId} not found during security settings update.`);
      return next(
        new NotFoundError(
          "User session invalid. Please log in again.",
          "SECURITY_SETTINGS_USER_NOT_FOUND"
        )
      );
    }

    // --- Handle Specific Security Settings ---
    const updatedSettings = { ...(user.securitySettings?.toObject() || {}) };

    // Example: Enabling Two-Factor Authentication
    if (
      securitySettings.hasOwnProperty("twoFactorEnabled") &&
      securitySettings.twoFactorEnabled === true
    ) {
      // Check prerequisites for enabling 2FA (e.g., verified phone or authenticator app setup)
      if (
        !user.isPhoneVerified /* && !user.securitySettings?.authenticatorAppConfigured */
      ) {
        // Cannot enable 2FA without a verified method
        logger.warn(
          `User ${userId} attempted to enable 2FA without a verified phone/app.`
        );
        return next(
          new ValidationError(
            "Cannot enable Two-Factor Authentication without a verified phone number or configured authenticator app.",
            "2FA_MISSING_METHOD"
          )
        );
      }
      if (!updatedSettings.twoFactorEnabled) {
        // Only log/act if changing state
        updatedSettings.twoFactorEnabled = true;
        logger.info(`User ${userId} enabled Two-Factor Authentication.`);
        // You might require password re-verification here for security
        // needsVerification = true; verificationType = 'password';
      }
    }
    // Example: Disabling Two-Factor Authentication
    else if (
      securitySettings.hasOwnProperty("twoFactorEnabled") &&
      securitySettings.twoFactorEnabled === false
    ) {
      if (updatedSettings.twoFactorEnabled) {
        // Only log/act if changing state
        updatedSettings.twoFactorEnabled = false;
        logger.info(`User ${userId} disabled Two-Factor Authentication.`);
        // Require password re-verification to disable 2FA
        // needsVerification = true; verificationType = 'password';
      }
    }

    // Add handlers for other security settings (e.g., authenticator app setup, recovery codes)

    // --- Apply Updates and Save ---
    user.securitySettings = updatedSettings;
    await user.save();

    logger.info(`Security settings updated successfully for user ${userId}.`);

    // Prepare response, potentially including next steps if verification is needed
    // const nextStep = needsVerification ? { type: verificationType, ... } : null;

    return res.status(200).json(
      formatResponse(
        "success",
        "Security settings updated successfully.", // Modify message if verification needed
        {
          user: {
            _id: user._id,
            securitySettings: user.securitySettings,
          },
        }
        // , nextStep // Add next step if applicable
      )
    );
  } catch (error) {
    logger.error(
      `Update security settings error for user ${userId}: ${error.message}`,
      { stack: error.stack }
    );
    if (
      error instanceof AppError ||
      error instanceof NotFoundError ||
      error instanceof ValidationError
    ) {
      next(error);
    } else {
      next(
        new AppError(
          "Failed to update security settings due to a server error.",
          500,
          "UPDATE_SECURITY_FAILED"
        )
      );
    }
  }
};
