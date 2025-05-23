// statsHelpers.js - Optimized version

/**
 * Parse a period string into a Date object representing the start date
 * @param {string} periodString - Period in format like '30d', '4w', '2m', '1y'
 * @returns {Date|null} Start date for the period, or null if invalid format
 */
export const parseStatsPeriod = (periodString) => {
  const match = periodString?.match(/^(\d+)(d|w|m|y)$/);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();
  const startDate = new Date(now);

  switch(unit) {
    case "d": startDate.setDate(now.getDate() - amount); break;
    case "w": startDate.setDate(now.getDate() - amount * 7); break;
    case "m": startDate.setMonth(now.getMonth() - amount); break;
    case "y": startDate.setFullYear(now.getFullYear() - amount); break;
  }

  startDate.setHours(0, 0, 0, 0);
  return startDate;
};

/**
 * Convert a period string to a human-readable description
 * @param {string} periodString - Period in format like '30d', '4w', '2m', '1y'
 * @returns {string} Human-readable description of the time period
 */
export const getPeriodDescription = (periodString) => {
  const match = periodString?.match(/^(\d+)(d|w|m|y)$/);
  if (!match) return "Custom period";

  const amount = parseInt(match[1], 10);
  const unit = match[2];
  
  const descriptions = {
    d: amount === 1 ? "Last 24 hours" : `Last ${amount} days`,
    w: amount === 1 ? "Last week" : `Last ${amount} weeks`,
    m: amount === 1 ? "Last month" : `Last ${amount} months`,
    y: amount === 1 ? "Last year" : `Last ${amount} years`,
  };
  
  return descriptions[unit] || "Custom period";
};

/**
 * Calculate engagement rate as a percentage
 * @param {number} interactions - Total number of interactions (e.g., clicks)
 * @param {number} impressions - Total number of impressions
 * @returns {number} Engagement rate as a percentage with 2 decimal places
 */
export const calculateEngagementRate = (interactions, impressions) =>
  impressions ? +(((interactions / impressions) * 100).toFixed(2)) : 0;

/**
 * Calculate Click-Through Rate (CTR) as a percentage
 * @param {number} clicks - Number of clicks
 * @param {number} impressions - Number of impressions
 * @returns {number} CTR as a percentage with 2 decimal places
 */
export const calculateCTR = calculateEngagementRate;

/**
 * Calculate conversion rate as a percentage
 * @param {number} conversions - Number of conversions
 * @param {number} clicks - Number of clicks
 * @returns {number} Conversion rate as a percentage with 2 decimal places
 */
export const calculateConversionRate = (conversions, clicks) =>
  clicks ? +(((conversions / clicks) * 100).toFixed(2)) : 0;

/**
 * Normalize engagement quality scores based on interaction type
 * 
 * This function ensures consistent quality scoring across different interaction types.
 * It works by:
 * 1. Providing a standard base score for each interaction type
 * 2. Blending this standard score with any existing score (70/30 weighting)
 * 3. Ensuring the final quality score remains within valid bounds (0-10)
 * 
 * Higher scores represent stronger engagement signals:
 * - Impressions (1): User saw content but didn't interact
 * - Views (2): User intentionally viewed content
 * - Clicks (3): User clicked on content
 * - Bookmarks/Upvotes (4): User showed appreciation
 * - Comments (4.5): User invested time to provide feedback
 * - Conversions (5): User completed desired action
 * 
 * @param {string} interactionType - Type of interaction (impression, view, click, etc.)
 * @param {number|null} currentScore - Optional existing quality score to blend with
 * @returns {number} Normalized engagement quality score between 0-10
 */
export const normalizeEngagementQuality = (interactionType, currentScore = null) => {
  const standardScores = {
    impression: 1, view: 2, click: 3, 
    bookmark: 4, upvote: 4, comment: 4.5, conversion: 5
  };
  
  const standard = standardScores[interactionType] || 2;
  
  if (!currentScore || isNaN(currentScore) || currentScore <= 0 || currentScore > 10) {
    return standard;
  }
  
  return 0.7 * standard + 0.3 * currentScore;
};

/**
 * Standardize strategy names for consistent analytics and tracking
 * Maps various aliases to their standard counterparts
 * @param {string} strategy - The input strategy name
 * @returns {string} Standardized strategy name
 */
export const standardizeStrategyName = (strategy) => {
  if (!strategy) return "default";
  
  const STRATEGY_ALIASES = {
    personal: "personalized",
    personalized_recs: "personalized",
    user_based: "personalized",
    history: "history-based",
    historical: "history-based",
    user_history: "history-based",
    diverse: "diversified",
    "diversified-feed": "diversified",
    mix: "hybrid",
    mixed: "hybrid",
    combined: "hybrid",
    discover: "exploratory",
    discovery: "exploratory",
    explore: "exploratory",
    new: "exploratory",
    trending: "trending",
    popular: "trending",
    category: "category-based",
    tag: "tag-based",
    unknown: "default",
    feed: "diversified"
  };
  
  const s = strategy.toLowerCase();
  return STRATEGY_ALIASES[s] || s;
};

/**
 * Match interaction events with their corresponding impression events
 * Helps attribute downstream interactions (clicks, conversions) to the initial impression
 * 
 * @param {Object} event - The interaction event (click, conversion, etc.)
 * @param {Array} impressionEvents - Array of impression events to check against
 * @returns {string|null} ID of matching impression event, or null if no match found
 */
export const inferImpressionForEvent = (event, impressionEvents) => {
  if (!event?.product || !Array.isArray(impressionEvents) || !impressionEvents.length) {
    return null;
  }

  const eventTime = new Date(event.timestamp).getTime();
  const MAX_TIME_DIFF = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  // Find matching impressions
  const matches = impressionEvents
    .filter(i => 
      i.product.toString() === event.product.toString() &&
      new Date(i.timestamp).getTime() <= eventTime &&
      eventTime - new Date(i.timestamp).getTime() <= MAX_TIME_DIFF
    )
    .sort((a, b) => 
      Math.abs(eventTime - new Date(a.timestamp).getTime()) -
      Math.abs(eventTime - new Date(b.timestamp).getTime())
    );

  return matches[0]?._id || null;
};