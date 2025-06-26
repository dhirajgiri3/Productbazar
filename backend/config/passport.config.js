import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/user/user.model.js";
import logger from "../utils/logging/logger.js";

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

  // JWT Strategy for API authentication
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          ExtractJwt.fromAuthHeaderAsBearerToken(),
          ExtractJwt.fromHeader('authorization'),
          (req) => {
            let token = null;
            if (req && req.cookies) {
              token = req.cookies['token'];
            }
            return token;
          },
        ]),
        secretOrKey: process.env.JWT_ACCESS_SECRET,
        passReqToCallback: true,
      },
      async (req, payload, done) => {
        try {
          const user = await User.findById(payload.id).select("-password");
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        } catch (error) {
          logger.error(`JWT authentication error: ${error.message}`);
          return done(error, false);
        }
      }
    )
  );

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/v1/auth/google/callback",
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          logger.info(`Google OAuth attempt for profile: ${profile.id}`);

          // Check if user already exists with this Google ID
          let user = await User.findOne({ 'google.id': profile.id });

          if (user) {
            logger.info(`Existing Google user found: ${user.email}`);
            return done(null, user);
          }

          // Check if user exists with the same email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google account to existing user
            user.google = {
              id: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              picture: profile.photos[0]?.value,
              linkedAt: new Date(),
            };

            // Mark email as verified if it came from Google
            if (!user.isEmailVerified) {
              user.isEmailVerified = true;
            }

            await user.save();
            logger.info(`Google account linked to existing user: ${user.email}`);
            return done(null, user);
          }

          // Create new user with Google account
          const newUser = new User({
            email: profile.emails[0].value,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            google: {
              id: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              picture: profile.photos[0]?.value,
              linkedAt: new Date(),
            },
            isEmailVerified: true, // Google emails are pre-verified
            registrationMethod: 'email',
            profilePicture: {
              url: profile.photos[0]?.value || '',
            },
            // Set profile completion status based on available data
            profileCompleted: !!(profile.name?.givenName && profile.name?.familyName),
          });

          await newUser.save();
          logger.info(`New Google user created: ${newUser.email}`);
          return done(null, newUser);

        } catch (error) {
          logger.error(`Google OAuth error: ${error.message}`);
          return done(error, null);
        }
      }
    )
  );
}
