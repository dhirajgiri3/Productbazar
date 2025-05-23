/**
 * Validates and normalizes pagination parameters for API requests
 *
 * @param {number|string} limit - Requested number of items (default: 10)
 * @param {number|string} offset - Requested offset for pagination (default: 0)
 * @returns {object} Object with validated limit and offset values
 */
export const validatePaginationParams = (limit, offset) => {
  const parsedLimit = parseInt(limit) || 10;
  const parsedOffset = parseInt(offset) || 0;

  return {
    limit: Math.min(Math.max(parsedLimit, 1), 100), // Limit between 1-100
    offset: Math.max(parsedOffset, 0), // Offset must be >= 0
  };
};

/**
 * Validates and normalizes advanced query parameters for recommendations
 *
 * @param {object} query - The query object from the request
 * @param {object} options - Additional validation options
 * @returns {object} Validated and normalized query parameters
 */
export const validateAdvancedParams = (query, options = {}) => {
  const { limit, offset, days, sort, strategy, categoryId, tags } = query;

  // Basic pagination validation
  const pagination = validatePaginationParams(limit, offset);

  // Days validation
  const parsedDays = parseInt(days) || 7;
  const validDays = Math.min(Math.max(parsedDays, 1), 90); // Between 1-90 days

  // Tags validation
  let validTags = [];
  if (tags) {
    if (typeof tags === "string") {
      validTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (Array.isArray(tags)) {
      validTags = tags.map((t) => String(t).trim()).filter(Boolean);
    }
  }

  // Strategy validation
  const validStrategy = ["mixed", "trending", "new", "personalized"].includes(
    strategy
  )
    ? strategy
    : "mixed";

  return {
    ...pagination,
    days: validDays,
    tags: validTags,
    strategy: validStrategy,
  };
};

// Validation recommendations params function
// This function will validate the query parameters for recommendations
// It will check if the parameters are valid and return the validated parameters
export const validateRecommendationParams = (query) => {
  const { limit, offset, days, sort, strategy, categoryId, tags } = query;

  // Validate pagination parameters
  const pagination = validatePaginationParams(limit, offset);

  // Validate advanced parameters
  const advancedParams = validateAdvancedParams(query);

  return {
    ...pagination,
    ...advancedParams,
    sort: sort || "relevance",
    categoryId: categoryId || null,
  };
};

export default {
  validatePaginationParams,
  validateAdvancedParams,
  validateRecommendationParams,
};
