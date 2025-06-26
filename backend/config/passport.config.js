import passport from "passport";
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
}
