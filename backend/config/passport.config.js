import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user/user.model.js";
import logger from "../utils/logging/logger.js";
import { generateUsername } from "../utils/auth/username.utils.js";

export default function passportConfig() {
  // Validate required environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    logger.warn("Google OAuth environment variables missing. Google authentication will be disabled.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
        accessType: "offline",
        prompt: "select_account",
        scope: ["profile", "email"],
      },
      async (request, accessToken, refreshToken, profile, done) => {
        try {
          logger.info(`Google OAuth attempt for profile ID: ${profile.id}`, {
            profileId: profile.id,
            displayName: profile.displayName,
          });

          // Validate profile data
          if (!profile.emails || !profile.emails.length) {
            logger.error("Google profile missing email information", {
              profileId: profile.id,
            });
            return done(
              new Error("Google authentication failed: Email information not provided"),
              null,
              { message: "Email permission is required for registration" }
            );
          }

          const email = profile.emails[0].value.toLowerCase().trim();
          const profilePhoto = profile.photos?.[0]?.value;

          // Check if user already exists with Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // Update user info if needed
            let hasChanges = false;
            
            if (!user.profilePicture && profilePhoto) {
              user.profilePicture = {
                url: profilePhoto,
                publicId: null
              };
              hasChanges = true;
            }
            
            if (!user.isEmailVerified) {
              user.isEmailVerified = true;
              hasChanges = true;
            }

            if (hasChanges) {
              await user.save();
              logger.info(`Updated existing Google user: ${user._id}`);
            } else {
              logger.info(`Existing Google user found: ${user._id}`);
            }
            
            return done(null, user, { isNewUser: false });
          }

          // Check if user exists with this email
          user = await User.findOne({ email });
          
          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            
            if (!user.isEmailVerified) {
              user.isEmailVerified = true;
            }
            
            if (!user.profilePicture && profilePhoto) {
              user.profilePicture = {
                url: profilePhoto,
                publicId: null
              };
            }

            // Update name if not set
            if (!user.firstName && profile.name?.givenName) {
              user.firstName = profile.name.givenName;
            }
            if (!user.lastName && profile.name?.familyName) {
              user.lastName = profile.name.familyName;
            }

            await user.save();
            logger.info(`Linked Google account to existing user: ${user._id}`);
            return done(null, user, { isNewUser: false });
          }

          // Create new user
          const newUserData = {
            googleId: profile.id,
            email: email,
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            isEmailVerified: true,
            isProfileCompleted: false,
            profilePicture: profilePhoto ? {
              url: profilePhoto,
              publicId: null
            } : undefined,
            role: "user",
            registrationMethod: "google",
          };

          // Generate unique username
          try {
            const baseUsername = profile.name?.givenName?.toLowerCase() || 
                                email.split('@')[0].toLowerCase();
            newUserData.username = await generateUsername(baseUsername);
          } catch (usernameError) {
            logger.warn("Failed to generate username for Google user", {
              error: usernameError.message,
              email: email,
            });
            // Username will be null, user can set it later
          }

          const newUser = new User(newUserData);
          await newUser.save();
          
          logger.info(`Created new user from Google OAuth: ${newUser._id}`, {
            email: email,
            hasUsername: !!newUser.username,
          });
          
          return done(null, newUser, { isNewUser: true });
        } catch (error) {
          logger.error(`Google OAuth strategy error: ${error.message}`, {
            stack: error.stack,
            profileId: profile?.id,
          });
          return done(error, null);
        }
      }
    )
  );

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
}
