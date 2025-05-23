/**
 * Enhanced logger for the frontend
 * - Provides consistent logging format
 * - Includes log level filtering
 * - Disables logs in production unless explicitly enabled
 * - Deduplicates repetitive log messages
 * - Rate limits frequent log messages
 */

// Log levels with numeric values for filtering
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default minimum log level based on environment
const DEFAULT_MIN_LEVEL = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

// Store recent log messages to deduplicate
const recentLogs = new Map();

// Patterns for logs that should be deduplicated
const DEDUPLICATION_PATTERNS = [
  // Recommendation fetching logs
  /Fetching .* recommendations from API/,
  /Reusing in-flight request for/,
  /Using cached .* recommendations/,
  /Adding .* delay for .* to avoid rate limiting/,
  /Loaded .* recommendations/,
  /Loaded .* products/,
  /Feed recommendations source distribution/,
  /feed recommendations source distribution/,
  /Recording page interaction/,
  /Homepage view tracked/,
  /Skipping duplicate/,
  /XHR finished loading/
];

// Patterns that need longer deduplication windows (5 seconds instead of 2)
const LONG_DEDUPLICATION_PATTERNS = [
  /Fetching .* recommendations from API/,
  /Reusing in-flight request for/,
  /Using cached .* recommendations/,
  /Feed recommendations source distribution/,
  /feed recommendations source distribution/
];

// Patterns that need very long deduplication windows (30 seconds)
const VERY_LONG_DEDUPLICATION_PATTERNS = [
  /Homepage view tracking skipped/
];

// Get configured min level - can be overridden via localStorage
const getMinLevel = () => {
  try {
    const storedLevel = localStorage.getItem('logLevel');
    return storedLevel || DEFAULT_MIN_LEVEL;
  } catch (e) {
    return DEFAULT_MIN_LEVEL;
  }
};

// Helper to check if we should log at this level
const shouldLog = (level) => {
  const minLevel = getMinLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
};

// Check if a log message should be deduplicated
const shouldDeduplicate = (message) => {
  if (typeof message !== 'string') return false;

  return DEDUPLICATION_PATTERNS.some(pattern => pattern.test(message));
};

// Check if a log message needs a longer deduplication window
const needsLongDeduplication = (message) => {
  if (typeof message !== 'string') return false;

  return LONG_DEDUPLICATION_PATTERNS.some(pattern => pattern.test(message));
};

// Check if a log message needs a very long deduplication window
const needsVeryLongDeduplication = (message) => {
  if (typeof message !== 'string') return false;

  return VERY_LONG_DEDUPLICATION_PATTERNS.some(pattern => pattern.test(message));
};

// Get the appropriate deduplication window for a message
const getDeduplicationWindow = (message) => {
  if (needsVeryLongDeduplication(message)) {
    return 30000; // 30 seconds for very long deduplication
  } else if (needsLongDeduplication(message)) {
    return 5000; // 5 seconds for long deduplication
  } else {
    return 2000; // 2 seconds for standard deduplication
  }
};

// Main logger object with methods for each level
const logger = {
  debug: (...args) => {
    if (shouldLog('debug')) {
      // Check for deduplication
      const message = args[0]?.toString();
      if (message && shouldDeduplicate(message)) {
        const now = Date.now();
        const key = `debug:${message}`;
        const lastLog = recentLogs.get(key);

        // Get the appropriate deduplication window for this message
        const deduplicationWindow = getDeduplicationWindow(message);

        // Only log if we haven't seen this message within the deduplication window
        if (!lastLog || (now - lastLog) > deduplicationWindow) {
          console.debug('[DEBUG]', ...args);
          recentLogs.set(key, now);

          // Clean up old entries (keep in cache 2x longer than deduplication window)
          setTimeout(() => recentLogs.delete(key), deduplicationWindow * 2);
        }
      } else {
        console.debug('[DEBUG]', ...args);
      }
    }
  },

  info: (...args) => {
    if (shouldLog('info')) {
      // Check for deduplication
      const message = args[0]?.toString();
      if (message && shouldDeduplicate(message)) {
        const now = Date.now();
        const key = `info:${message}`;
        const lastLog = recentLogs.get(key);

        // Get the appropriate deduplication window for this message
        const deduplicationWindow = getDeduplicationWindow(message);

        // Only log if we haven't seen this message within the deduplication window
        if (!lastLog || (now - lastLog) > deduplicationWindow) {
          console.info('[INFO]', ...args);
          recentLogs.set(key, now);

          // Clean up old entries (keep in cache 2x longer than deduplication window)
          setTimeout(() => recentLogs.delete(key), deduplicationWindow * 2);
        }
      } else {
        console.info('[INFO]', ...args);
      }
    }
  },

  warn: (...args) => {
    if (shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  },

  error: (...args) => {
    if (shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }

    // Optionally send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error reporting service integration
      // Example: Sentry.captureException(args[0]);
    }
  },

  // Set log level programmatically
  setLevel: (level) => {
    if (LOG_LEVELS[level] !== undefined) {
      try {
        localStorage.setItem('logLevel', level);
      } catch (e) {
        console.error('Failed to set log level in localStorage');
      }
    }
  },

  // Get current log level
  getLevel: () => {
    return getMinLevel();
  },

  // Clear the deduplication cache
  clearCache: () => {
    recentLogs.clear();
  }
};

export default logger;
