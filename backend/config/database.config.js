// config/database.config.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../utils/logging/logger.js";

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info(`Connected to MongoDB Host: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};
