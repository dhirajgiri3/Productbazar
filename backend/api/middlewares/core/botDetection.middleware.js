import { botDetectionMiddleware, requestTimingMiddleware } from '../../../utils/auth/botDetection.js';
import logger from '../../../utils/logging/logger.js';

/**
 * Apply bot detection to a request early in the middleware chain
 */
export const detectBots = botDetectionMiddleware();

/**
 * Add timing information to requests for speed analysis
 */
export const trackRequestTiming = requestTimingMiddleware();

/**
 * Skip processing for known bots to save resources
 * This middleware should be used for routes that don't need to serve bots
 */
export const skipForBots = (req, res, next) => {
  if (req.isBot) {
    // Return minimal response for bots
    return res.status(200).send('OK');
  }
  next();
};

/**
 * Log bot traffic separately for analytics
 */
export const logBotTraffic = (req, res, next) => {
  if (req.isBot) {
    const botInfo = {
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
    
    logger.info('Bot traffic detected', botInfo);
  }
  next();
};

export default {
  detectBots,
  trackRequestTiming,
  skipForBots,
  logBotTraffic,
};
