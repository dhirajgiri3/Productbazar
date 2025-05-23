/**
 * Constants for recommendation scoring algorithms
 */
export const SCORING_CONSTANTS = {
  // Time decay factors
  TIME_DECAY: {
    HALF_LIFE_DAYS: 15,  // Half-life in days for time decay
    RECENT_THRESHOLD_DAYS: 7,  // Threshold for "recent" interactions
    MAX_AGE_DAYS: 90  // Maximum age to consider for historical data
  },
  
  // Weight factors for different recommendation types
  WEIGHTS: {
    TRENDING: {
      VIEWS: 0.3,
      UPVOTES: 0.5,
      RECENCY: 0.2
    },
    NEW_PRODUCTS: {
      RECENCY: 0.7,
      QUALITY: 0.3
    },
    PERSONALIZED: {
      CATEGORY_MATCH: 0.3,
      TAG_MATCH: 0.3,
      USER_HISTORY: 0.4
    },
    SIMILAR: {
      CATEGORY_MATCH: 0.2,
      TAG_MATCH: 0.5,
      MAKER_MATCH: 0.3
    },
    COLLABORATIVE: {
      USER_SIMILARITY: 0.6,
      ITEM_POPULARITY: 0.4
    },
    DIVERSITY: {
      CATEGORY_DIVERSITY: 0.4,
      MAKER_DIVERSITY: 0.3,
      TAG_DIVERSITY: 0.3
    }
  },
  
  // Minimum thresholds
  THRESHOLDS: {
    MIN_VIEWS: 5,  // Minimum views for quality filtering
    MIN_UPVOTES: 2,  // Minimum upvotes for quality filtering
    MIN_SCORE: 0.2,  // Minimum score to include in recommendations
    SIMILARITY_THRESHOLD: 0.4  // Minimum similarity score
  },
  
  // Feed composition ratios
  FEED_COMPOSITION: {
    TRENDING: 0.3,
    NEW: 0.2,
    PERSONALIZED: 0.4,
    DISCOVERY: 0.1
  },
  
  // Cache durations in seconds
  CACHE_DURATION: {
    TRENDING: 3600,  // 1 hour
    NEW_PRODUCTS: 7200,  // 2 hours
    PERSONALIZED: 43200,  // 12 hours
    FEED: 1800  // 30 minutes
  }
};
