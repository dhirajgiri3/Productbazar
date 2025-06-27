import passport from "passport";
import User from "../../models/user/user.model.js";
import RefreshToken from "../../models/core/refreshToken.model.js";
import logger from "../../utils/logging/logger.js";
import { 
  generateAccessToken, 
  generateRefreshToken 
} from "../../utils/auth/jwt.utils.js";
import { 
  AppError, 
  ValidationError, 
  NotFoundError 
} from "../../utils/logging/error.js";
import { formatResponse } from "./helpers/auth.helpers.js";

/**
 * @desc    Initiate Google OAuth authentication
 * @route   GET /auth/google
 * @access  Public
 */
export const initiateGoogleAuth = (req, res, next) => {
  try {
    // Store redirect URL in session if provided
    if (req.query.redirect) {
      req.session.redirectUrl = req.query.redirect;
    }

    // Store auth context (login vs register)
    if (req.query.context) {
      req.session.authContext = req.query.context;
    }

    logger.info('Initiating Google OAuth authentication');
    
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account" // Always show account selector
    })(req, res, next);
  } catch (error) {
    logger.error(`Google OAuth initiation error: ${error.message}`);
    next(new AppError("Failed to initiate Google authentication", 500));
  }
};

/**
 * @desc    Handle Google OAuth callback
 * @route   GET /auth/google/callback
 * @access  Public
 */
export const handleGoogleCallback = async (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user, info) => {
    try {
      if (err) {
        logger.error(`Google OAuth callback error: ${err.message}`);
        return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_error&message=${encodeURIComponent('Authentication failed')}`);
      }

      if (!user) {
        logger.warn('Google OAuth callback: No user returned');
        return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_failed&message=${encodeURIComponent('Authentication was cancelled or failed')}`);
      }

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshTokenDoc = await generateRefreshToken(user._id);

      // Update user's last login
      user.lastLoginAt = new Date();
      await user.save();

      // Determine redirect URL
      const redirectUrl = req.session?.redirectUrl || `${process.env.FRONTEND_URL}/dashboard`;
      const authContext = req.session?.authContext || 'login';

      // Clear session data
      delete req.session?.redirectUrl;
      delete req.session?.authContext;

      // Check if user needs to complete profile
      const needsProfileCompletion = !user.firstName || !user.lastName || !user.role || user.role === 'user';

      // Build redirect URL with tokens and user info
      const redirectParams = new URLSearchParams({
        oauth_success: 'true',
        token: accessToken,
        refresh_token: refreshTokenDoc.token,
        provider: 'google',
        new_user: user.registrationMethod === 'google' ? 'true' : 'false',
        needs_completion: needsProfileCompletion ? 'true' : 'false',
        context: authContext
      });

      const finalRedirectUrl = needsProfileCompletion 
        ? `${process.env.FRONTEND_URL}/complete-profile?${redirectParams.toString()}`
        : `${redirectUrl}?${redirectParams.toString()}`;

      logger.info(`Google OAuth success for user ${user._id}, redirecting to: ${finalRedirectUrl}`);
      
      res.redirect(finalRedirectUrl);
    } catch (error) {
      logger.error(`Google OAuth callback processing error: ${error.message}`);
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=processing_error&message=${encodeURIComponent('Failed to process authentication')}`);
    }
  })(req, res, next);
};

/**
 * @desc    Link Google account to existing authenticated user
 * @route   POST /auth/google/link
 * @access  Private
 */
export const linkGoogleAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { googleAccessToken } = req.body;

    if (!googleAccessToken) {
      return next(new ValidationError("Google access token is required"));
    }

    // Verify Google token and get user info
    const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${googleAccessToken}`);
    
    if (!googleResponse.ok) {
      return next(new ValidationError("Invalid Google access token"));
    }

    const googleData = await googleResponse.json();

    // Check if Google account is already linked to another user
    const existingGoogleUser = await User.findOne({ 
      googleId: googleData.id,
      _id: { $ne: userId }
    });

    if (existingGoogleUser) {
      return next(new ValidationError("This Google account is already linked to another user"));
    }

    // Update user with Google linking
    const user = await User.findByIdAndUpdate(
      userId,
      {
        googleId: googleData.id,
        isGoogleLinked: true,
        googleProfile: {
          displayName: googleData.name,
          email: googleData.email,
          profilePicture: googleData.picture,
          emailVerified: googleData.verified_email,
        },
        // If Google email is verified and matches user email, verify user email
        ...(googleData.verified_email && googleData.email === req.user.email && {
          isEmailVerified: true
        })
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return next(new NotFoundError("User not found"));
    }

    logger.info(`Google account linked for user: ${user._id}`);

    res.status(200).json(formatResponse({
      message: "Google account linked successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isGoogleLinked: user.isGoogleLinked,
        googleProfile: user.googleProfile
      }
    }));
  } catch (error) {
    logger.error(`Google account linking error: ${error.message}`);
    next(new AppError("Failed to link Google account", 500));
  }
};

/**
 * @desc    Unlink Google account from authenticated user
 * @route   DELETE /auth/google/unlink
 * @access  Private
 */
export const unlinkGoogleAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = req.user;

    // Check if user has Google linked
    if (!user.isGoogleLinked) {
      return next(new ValidationError("No Google account is linked to this user"));
    }

    // Check if user has other authentication methods
    const hasPassword = user.password && user.password !== '';
    const hasVerifiedEmail = user.isEmailVerified && user.email;
    const hasVerifiedPhone = user.isPhoneVerified && user.phone;

    if (!hasPassword && !hasVerifiedEmail && !hasVerifiedPhone && user.registrationMethod === 'google') {
      return next(new ValidationError("Cannot unlink Google account as it's the only authentication method. Please set up a password first."));
    }

    // Update user to remove Google linking
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          googleId: 1,
          googleProfile: 1
        },
        isGoogleLinked: false
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return next(new NotFoundError("User not found"));
    }

    logger.info(`Google account unlinked for user: ${updatedUser._id}`);

    res.status(200).json(formatResponse({
      message: "Google account unlinked successfully",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isGoogleLinked: updatedUser.isGoogleLinked
      }
    }));
  } catch (error) {
    logger.error(`Google account unlinking error: ${error.message}`);
    next(new AppError("Failed to unlink Google account", 500));
  }
};

/**
 * @desc    Get Google OAuth status for authenticated user
 * @route   GET /auth/google/status
 * @access  Private
 */
export const getGoogleAuthStatus = async (req, res, next) => {
  try {
    const user = req.user;

    res.status(200).json(formatResponse({
      message: "Google authentication status retrieved",
      data: {
        isGoogleLinked: user.isGoogleLinked || false,
        googleProfile: user.googleProfile || null,
        hasPassword: !!(user.password && user.password !== ''),
        canUnlinkGoogle: user.isGoogleLinked && (
          (user.password && user.password !== '') || 
          (user.isEmailVerified && user.email) || 
          (user.isPhoneVerified && user.phone)
        )
      }
    }));
  } catch (error) {
    logger.error(`Get Google auth status error: ${error.message}`);
    next(new AppError("Failed to retrieve Google authentication status", 500));
  }
};
