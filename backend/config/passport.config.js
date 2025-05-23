import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user/user.model.js";
import logger from "../utils/logging/logger.js";

export default function passportConfig() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL, // Use the env variable directly
        passReqToCallback: true,
        accessType: "offline", // Changed to "offline" to get refresh token if needed
        prompt: "select_account",
      },
      async (request, accessToken, refreshToken, profile, done) => {
        try {
          logger.info(`Google OAuth attempt for profile ID: ${profile.id}`);

          if (!profile.emails || !profile.emails.length) {
            logger.error("Google profile missing email information");
            return done(
              new Error(
                "Google authentication failed: Email information not provided"
              ),
              null
            );
          }

          const email = profile.emails[0].value.toLowerCase();
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            logger.info(`Existing Google user found: ${user._id}`);
            return done(null, user);
          }

          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            if (!user.isEmailVerified) {
              user.isEmailVerified = true;
            }
            await user.save();
            logger.info(`Linked Google account to existing user: ${user._id}`);
            return done(null, user);
          }

          const newUser = new User({
            googleId: profile.id,
            email: email,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            isEmailVerified: true,
            isProfileCompleted: false,
            profilePicture: profile.photos?.[0]?.value,
          });

          await newUser.save();
          logger.info(`Created new user from Google OAuth: ${newUser._id}`);
          return done(null, newUser);
        } catch (error) {
          logger.error(`Google OAuth Error: ${error.message}`, {
            stack: error.stack,
          });
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    logger.info(`Serializing user: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      logger.info(`Deserialized user: ${id}`);
      done(null, user);
    } catch (error) {
      logger.error(`Deserialize error: ${error.message}`);
      done(error, null);
    }
  });
}
