import logger from "../../utils/logging/logger.js";

class AnalyticsController {
  /**
   * Record a page interaction that's not tied to a specific product
   * @route POST /api/analytics/page-interaction
   * @access Public - Works for both authenticated and anonymous users
   */
  static async recordPageInteraction(req, res, next) {
    try {
      const { pageType, type, metadata = {} } = req.body;
      // Handle both authenticated and anonymous users
      const userId = req.user?._id;
      const userType = userId ? 'authenticated' : 'anonymous';

      if (!pageType || !type) {
        return res.status(400).json({
          success: false,
          message: "Page type and interaction type are required"
        });
      }

      // For now, just log the interaction
      logger.info(`Page interaction recorded: ${type} on ${pageType}`, {
        userType,
        userId: userId ? userId.toString() : 'anonymous',
        pageType,
        type,
        metadata
      });

      // In a real implementation, you would store this in a database collection
      // const PageInteraction = mongoose.model('PageInteraction');
      // await PageInteraction.create({
      //   user: userId,
      //   pageType,
      //   interactionType: type,
      //   metadata
      // });

      res.status(200).json({
        success: true,
        message: "Page interaction recorded"
      });
    } catch (error) {
      logger.error("Error recording page interaction", {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: "Failed to record page interaction"
      });
    }
  }
}

export default AnalyticsController;
