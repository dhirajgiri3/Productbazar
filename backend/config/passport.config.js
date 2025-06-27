import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user/user.model.js";
import { generateUsername } from "../utils/auth/username.utils.js";
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
            
            // Generate username if user doesn't have one
            if (!user.username) {
              try {
                let baseUsername = '';
                
                if (user.firstName && user.lastName) {
                  baseUsername = `${user.firstName}.${user.lastName}`;
                } else if (user.firstName) {
                  baseUsername = user.firstName;
                } else if (user.lastName) {
                  baseUsername = user.lastName;
                } else if (user.email) {
                  baseUsername = user.email.split('@')[0];
                } else {
                  baseUsername = 'user';
                }
                
                user.username = await generateUsername(baseUsername);
                logger.info(`Generated username for existing Google user: ${user.username}`);
              } catch (usernameError) {
                logger.error(`Failed to generate username for existing Google user: ${usernameError.message}`);
                user.username = `user${Date.now().toString().slice(-8)}`;
              }
            }
            
            // Update profile picture if Google provides a newer one
            if (googleProfile.profilePicture) {
              user.profilePicture = {
                url: googleProfile.profilePicture,
                publicId: user.profilePicture?.publicId || null // Keep existing publicId if any
              };
            }
            
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
              
              // Generate username if user doesn't have one
              if (!user.username) {
                try {
                  let baseUsername = '';
                  
                  if (user.firstName && user.lastName) {
                    baseUsername = `${user.firstName}.${user.lastName}`;
                  } else if (user.firstName) {
                    baseUsername = user.firstName;
                  } else if (user.lastName) {
                    baseUsername = user.lastName;
                  } else if (user.email) {
                    baseUsername = user.email.split('@')[0];
                  } else {
                    baseUsername = 'user';
                  }
                  
                  user.username = await generateUsername(baseUsername);
                  logger.info(`Generated username for existing user during Google linking: ${user.username}`);
                } catch (usernameError) {
                  logger.error(`Failed to generate username for existing user: ${usernameError.message}`);
                  user.username = `user${Date.now().toString().slice(-8)}`;
                }
              }
              
              // Update profile picture if Google provides one and user doesn't have one
              if (googleProfile.profilePicture && (!user.profilePicture || !user.profilePicture.url)) {
                user.profilePicture = {
                  url: googleProfile.profilePicture,
                  publicId: null // Google images don't have Cloudinary publicId
                };
              }
              
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

          // Generate username using the utility function for consistency
          let username;
          try {
            // Create a base username from Google profile data
            let baseUsername = '';
            
            if (googleProfile.firstName && googleProfile.lastName) {
              baseUsername = `${googleProfile.firstName}.${googleProfile.lastName}`;
            } else if (googleProfile.firstName) {
              baseUsername = googleProfile.firstName;
            } else if (googleProfile.lastName) {
              baseUsername = googleProfile.lastName;
            } else if (googleProfile.email) {
              // Fallback to email prefix if names aren't available
              baseUsername = googleProfile.email.split('@')[0];
            } else {
              // Final fallback
              baseUsername = 'googleuser';
            }
            
            // Use the username utility to ensure uniqueness
            username = await generateUsername(baseUsername);
            logger.info(`Generated username for Google user: ${username}`);
          } catch (usernameError) {
            logger.error(`Failed to generate username for Google user: ${usernameError.message}`);
            // Fallback to a simple random username
            username = `user${Date.now().toString().slice(-8)}`;
          }

          // Create new user with Google OAuth
          const newUser = new User({
            firstName: googleProfile.firstName,
            lastName: googleProfile.lastName,
            email: googleProfile.email,
            username: username, // Set the generated username
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
            // Set profilePicture in the correct format for the User model
            profilePicture: googleProfile.profilePicture ? {
              url: googleProfile.profilePicture,
              publicId: null // Google images don't have Cloudinary publicId
            } : undefined,
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
