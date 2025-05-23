/**
 * Time utility functions for the application
 */

/**
 * Get the current time of day (morning, afternoon, evening, night)
 * @returns {string} The time of day category
 */
export const getTimeOfDay = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
};

/**
 * Calculate a date from the current time with a specific offset
 * @param {number} days - Days to offset (negative for past, positive for future)
 * @returns {Date} The calculated date
 */
export const getDateWithOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Format a timestamp for database queries
 * @param {Date|string|number} date - Date to format
 * @returns {Date} Formatted date object
 */
export const formatTimestamp = (date) => {
  return new Date(date);
};

export const getSeason = () => {
  const now = new Date();
  const month = now.getMonth();

  // Northern hemisphere seasons
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
};

export const sensitizationDate = (date) => {
  if (date instanceof Date) {
    return date;
  }
  return new Date(date);
};

export default {
  getTimeOfDay,
  getDateWithOffset,
  formatTimestamp,
  sensitizationDate
};
