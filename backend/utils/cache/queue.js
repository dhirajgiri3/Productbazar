import logger from "./logger.js";
import { sendVerificationEmail } from "./mail.utils.js";

/**
 * Simple utility to handle email sending directly without using BullMQ
 */

logger.info("Using direct email sending instead of queue management");

// Direct email sending functions
const email = {
  add: async (jobType, data) => {
    logger.info(`Processing email job of type: ${jobType}`);

    try {
      if (jobType === "verification") {
        const { email, subject, message } = data.data;
        await sendVerificationEmail(email, subject, message);
        logger.info(`Verification email sent to ${email}`);
        return { success: true };
      } else {
        logger.warn(`Unknown email job type: ${jobType}`);
        return { success: false, error: "Unknown job type" };
      }
    } catch (error) {
      logger.error(`Failed to send email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
};

export default {
  email
};
