import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user/user.model.js";
import logger from "../utils/logging/logger.js";
import dotenv from "dotenv";

dotenv.config();

export default function passportConfig() {
  // Serialize user for session (not used in JWT but required by passport)
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session (not used in JWT but required by passport)
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select("-password");
      done(null, user);
    } catch (error) {
      logger.error(`User deserialization error: ${error.message}`);
      done(error, null);
    }
  });

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          logger.info(`Google OAuth callback for user: ${profile.id}`);

          // Extract user data from Google profile
          const googleProfile = {
            googleId: profile.id,
            email: profile.emails?.[0]?.value,
            displayName: profile.displayName,
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            profilePicture: profile.photos?.[0]?.value,
            emailVerified: profile.emails?.[0]?.verified || false,
          };

          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists with Google ID - update profile and return
            user.googleProfile = {
              displayName: googleProfile.displayName,
              email: googleProfile.email,
              profilePicture: googleProfile.profilePicture,
              emailVerified: googleProfile.emailVerified,
            };
            user.lastLoginAt = new Date();
            await user.save();
            
            logger.info(`Existing Google user logged in: ${user._id}`);
            return done(null, user);
          }

          // Check if user exists with the same email
          if (googleProfile.email) {
            user = await User.findOne({ email: googleProfile.email });
            
            if (user) {
              // Link Google account to existing user
              user.googleId = googleProfile.googleId;
              user.isGoogleLinked = true;
              user.googleProfile = {
                displayName: googleProfile.displayName,
                email: googleProfile.email,
                profilePicture: googleProfile.profilePicture,
                emailVerified: googleProfile.emailVerified,
              };
              
              // If Google email is verified, mark user email as verified
              if (googleProfile.emailVerified) {
                user.isEmailVerified = true;
              }
              
              user.lastLoginAt = new Date();
              await user.save();
              
              logger.info(`Google account linked to existing user: ${user._id}`);
              return done(null, user);
            }
          }

          // Create new user with Google OAuth
          const newUser = new User({
            firstName: googleProfile.firstName,
            lastName: googleProfile.lastName,
            email: googleProfile.email,
            googleId: googleProfile.googleId,
            registrationMethod: "google",
            isGoogleLinked: true,
            isEmailVerified: googleProfile.emailVerified,
            role: "user", // Default role for Google OAuth users
            googleProfile: {
              displayName: googleProfile.displayName,
              email: googleProfile.email,
              profilePicture: googleProfile.profilePicture,
              emailVerified: googleProfile.emailVerified,
            },
            profileImage: googleProfile.profilePicture || "",
            lastLoginAt: new Date(),
            registrationDate: new Date(),
          });

          const savedUser = await newUser.save();
          logger.info(`New Google user created: ${savedUser._id}`);
          
          return done(null, savedUser);
        } catch (error) {
          logger.error(`Google OAuth strategy error: ${error.message}`);
          return done(error, null);
        }
      }
    )
  );
}
