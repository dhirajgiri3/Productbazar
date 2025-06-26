import express from 'express';
import passport from 'passport';
import { generateAccessToken, generateRefreshToken } from '../../../utils/auth/jwt.utils.js';
import logger from '../../../utils/logging/logger.js';
import User from '../../../models/user/user.model.js';

const router = express.Router();

// Route to initiate Google OAuth
router.get('/auth', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

// Google OAuth callback route
router.get('/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL}/auth/login?error=google_auth_failed`,
    session: false 
  }),
  async (req, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        logger.warn('Google OAuth callback: No user found');
        return res.redirect(`${process.env.CLIENT_URL}/auth/login?error=authentication_failed`);
      }

      // Generate JWT tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Set secure HTTP-only cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/'
      };

      // Set access token cookie (shorter expiry)
      res.cookie('token', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      // Set refresh token cookie (longer expiry)
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Log successful authentication
      logger.info(`Google OAuth successful for user: ${user.email}`);

      // Redirect based on user profile completion status
      const redirectUrl = user.profileCompleted 
        ? `${process.env.CLIENT_URL}/dashboard?auth=success` 
        : `${process.env.CLIENT_URL}/complete-profile?auth=success`;

      res.redirect(redirectUrl);

    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/auth/login?error=server_error`);
    }
  }
);

// Route to link Google account to existing user
router.post('/link',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { googleId } = req.body;
      const user = req.user;

      if (!googleId) {
        return res.status(400).json({
          success: false,
          message: 'Google ID is required'
        });
      }

      // Check if Google account is already linked to another user
      const existingGoogleUser = await User.findOne({ 'google.id': googleId });
      if (existingGoogleUser && existingGoogleUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'This Google account is already linked to another user'
        });
      }

      // Link Google account
      user.google = { id: googleId };
      await user.save();

      logger.info(`Google account linked for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Google account linked successfully'
      });

    } catch (error) {
      logger.error('Google account linking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to link Google account'
      });
    }
  }
);

// Route to unlink Google account
router.delete('/unlink',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      if (!user.google || !user.google.id) {
        return res.status(400).json({
          success: false,
          message: 'No Google account linked'
        });
      }

      // Remove Google linking
      user.google = undefined;
      await user.save();

      logger.info(`Google account unlinked for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Google account unlinked successfully'
      });

    } catch (error) {
      logger.error('Google account unlinking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unlink Google account'
      });
    }
  }
);

export default router;
