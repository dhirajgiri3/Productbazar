// file: backend/Utils/cache.js
import Redis from "ioredis";
import logger from "../logging/logger.js";

// --- Redis Connection Setup ---
const redisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0", 10),
  retryStrategy: (times) => {
    const maxRetries = parseInt(
      process.env.REDIS_RETRY_STRATEGY_MAX_RETRIES || "10",
      10
    );
    const delay = parseInt(
      process.env.REDIS_RETRY_STRATEGY_BASE_DELAY || "200",
      10
    );
    if (times > maxRetries) {
      logger.error(
        `Redis connection failed after ${times} attempts. Giving up.`
      );
      return new Error("Redis connection failed: Max retries exceeded.");
    }
    const retryDelay = Math.min(delay * Math.pow(2, times), 30000);
    logger.warn(
      `Redis connection attempt ${times} failed. Retrying in ${retryDelay}ms`
    );
    return retryDelay;
  },
  enableOfflineQueue: true,
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
  showFriendlyErrorStack: process.env.NODE_ENV === "development",
};

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, redisOptions)
  : new Redis(redisOptions);

// --- Event Listeners ---
redis.on("connect", () => logger.info(`Redis client connected successfully on ${redisOptions.host}:${redisOptions.port}`));
redis.on("ready", () => logger.info("Redis client ready to process commands."));
redis.on("error", (err) =>
  logger.error(`Redis Error: ${err.message}`, { stack: err.stack })
);
redis.on("reconnecting", (time) =>
  logger.warn(`Redis is reconnecting in ${time}ms...`)
);
redis.on("close", () => logger.warn("Redis connection closed."));
redis.on("end", () =>
  logger.warn("Redis connection ended. No more reconnections.")
);

// --- Helper: SCAN Keys ---
const scanKeysWithPattern = async (pattern, batchSize = 250) => {
  const keys = new Set();
  let cursor = "0";

  // Ensure pattern is a string
  if (typeof pattern !== 'string') {
    logger.error(`Invalid pattern type: ${typeof pattern}. Expected string.`);
    return [];
  }

  // Sanitize pattern to avoid Redis syntax errors
  // Replace problematic characters with wildcards
  const sanitizedPattern = pattern.replace(/[,\-]/g, "?")
                                  .replace(/\s+/g, "?")
                                  .replace(/[\[\]\{\}\(\)]/g, "?");

  logger.debug(`Scanning Redis with sanitized pattern: ${sanitizedPattern}`);

  do {
    try {
      const [nextCursor, batchKeys] = await redis.scan(
        cursor,
        "MATCH",
        sanitizedPattern,
        "COUNT",
        batchSize
      );
      cursor = nextCursor;
      batchKeys.forEach((key) => keys.add(key));
      if (keys.size > 500000) {
        // Safety break
        logger.warn(
          `SCAN potentially runaway for pattern "${sanitizedPattern}". Found ${keys.size} keys. Stopping scan.`
        );
        break;
      }
    } catch (error) {
      logger.error(
        `Error during Redis SCAN for pattern "${sanitizedPattern}": ${error.message}`
      );
      // Return empty array on error instead of breaking
      return [];
    }
  } while (cursor !== "0");
  return Array.from(keys);
};

// --- Cache Service Object ---
export const cache = {
  /** Generate a standard cache key. */
  generateKey(type, identifier, context) {
    let key = `${type}`;
    if (identifier) key += `:${identifier}`;
    if (context) key += `:${context}`;
    // Sanitize key - replace special characters with underscores instead of hyphens
    // This prevents issues with Redis pattern matching
    return key.replace(/\s+/g, "_").replace(/[:*?<>|"'\\,]/g, "_");
  },

  /** Get a value from cache */
  async get(key, parseJson = true) {
    if (!key) return null;
    let value = null;
    try {
      value = await redis.get(key);
      if (value === null) return null;
      if (!parseJson) return value;
      try {
        return JSON.parse(value);
      } catch (parseError) {
        logger.error(
          `Cache JSON Parse Error for key ${key}: ${parseError.message}.`
        );
        await this.del(key);
        return null;
      }
    } catch (error) {
      logger.error(`Cache GET Error for key ${key}: ${error.message}`);
      return null;
    }
  },

  /** Set a value in cache with optional TTL */
  async set(key, value, expirySeconds) {
    if (!key || value === undefined || value === null) return false; // Don't cache null/undefined
    try {
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      const ttl = parseInt(expirySeconds);
      if (!isNaN(ttl) && ttl > 0) {
        await redis.set(key, stringValue, "EX", ttl);
      } else {
        await redis.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error(`Cache SET Error for key ${key}: ${error.message}`);
      return false;
    }
  },

  /** Delete one or more keys */
  async del(...keys) {
    const validKeys = keys.filter(Boolean);
    if (validKeys.length === 0) return 0;
    try {
      return await redis.del(validKeys);
    } catch (error) {
      logger.error(
        `Cache DEL Error for keys ${validKeys.join(", ")}: ${error.message}`
      );
      return 0;
    }
  },

  /** Check if a key exists */
  async exists(key) {
    if (!key) return false;
    try {
      return (await redis.exists(key)) === 1;
    } catch (error) {
      logger.error(`Cache EXISTS Error for key ${key}: ${error.message}`);
      return false;
    }
  },

  /** Set multiple fields in a Redis hash */
  async hset(key, fields, expirySeconds) {
    if (!key || !fields || Object.keys(fields).length === 0) return false;
    try {
      const processedFields = {};
      for (const [field, value] of Object.entries(fields)) {
        if (value !== undefined) {
          // Only set non-undefined values
          processedFields[field] =
            typeof value === "string" ? value : JSON.stringify(value);
        }
      }
      if (Object.keys(processedFields).length === 0) return false; // Nothing to set
      await redis.hset(key, processedFields);
      const ttl = parseInt(expirySeconds);
      if (!isNaN(ttl) && ttl > 0) {
        await redis.expire(key, ttl);
      }
      return true;
    } catch (error) {
      logger.error(`Cache HSET Error for key ${key}: ${error.message}`);
      return false;
    }
  },

  /** Get all fields from a Redis hash */
  async hgetall(key, parseJson = true) {
    if (!key) return null;
    try {
      const result = await redis.hgetall(key);
      if (!result || Object.keys(result).length === 0) return null;
      if (!parseJson) return result;
      const parsed = {};
      for (const [field, value] of Object.entries(result)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        } // Fallback to string
      }
      return parsed;
    } catch (error) {
      logger.error(`Cache HGETALL Error for key ${key}: ${error.message}`);
      return null;
    }
  },

  /** Get multiple keys */
  async mget(keys, parseJson = true) {
    const validKeys = keys.filter(Boolean);
    if (validKeys.length === 0) return [];
    try {
      const values = await redis.mget(validKeys);
      return values.map((v) => {
        if (v === null) return null;
        if (!parseJson) return v;
        try {
          return JSON.parse(v);
        } catch {
          return v;
        } // Fallback to string
      });
    } catch (error) {
      logger.error(
        `Cache MGET Error for keys ${validKeys.join(", ")}: ${error.message}`
      );
      return Array(validKeys.length).fill(null);
    }
  },

  /** Set multiple key-value pairs */
  async mset(keyValuePairs, expirySeconds) {
    if (!keyValuePairs || Object.keys(keyValuePairs).length === 0) return false;
    try {
      const pipeline = redis.pipeline();
      const ttl = parseInt(expirySeconds);
      const useExpiry = !isNaN(ttl) && ttl > 0;
      for (const [key, value] of Object.entries(keyValuePairs)) {
        if (key && value !== undefined && value !== null) {
          // Ensure valid key and value
          const stringValue =
            typeof value === "string" ? value : JSON.stringify(value);
          if (useExpiry) {
            pipeline.set(key, stringValue, "EX", ttl);
          } else {
            pipeline.set(key, stringValue);
          }
        }
      }
      if (pipeline.length > 0) await pipeline.exec(); // Only execute if there are commands
      return true;
    } catch (error) {
      logger.error(`Cache MSET Error: ${error.message}`);
      return false;
    }
  },

  /** Get the underlying ioredis client */
  getClient() {
    return redis;
  },

  /** Clear the entire Redis database (Use with caution!) */
  async clearAll() {
    try {
      await redis.flushdb();
      logger.warn("Redis cache cleared via flushdb.");
      return true;
    } catch (error) {
      logger.error(`Cache FLUSHDB Error: ${error.message}`);
      return false;
    }
  },

  /** Delete keys matching a pattern using SCAN */
  async delByPattern(pattern) {
    if (!pattern) return 0;

    // Ensure pattern is a string
    if (typeof pattern !== 'string') {
      logger.error(`Invalid pattern type: ${typeof pattern}. Expected string.`);
      return 0;
    }

    try {
      const keys = await scanKeysWithPattern(pattern);
      if (keys.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await redis.del(batch);
        }
        return keys.length;
      }
      return 0;
    } catch (error) {
      logger.error(
        `Cache DEL Pattern Error for "${pattern}": ${error.message}`
      );
      return 0;
    }
  },

  /** Get or Set: Retrieve from cache, or execute fetcher and store result */
  async getOrSet(key, fetcher, ttl = 3600, validator = null) {
    if (!key || typeof fetcher !== "function") {
      logger.error("Cache getOrSet: Invalid key or fetcher.");
      return null;
    }
    try {
      const cachedValue = await this.get(key);
      if (
        cachedValue !== null &&
        (!validator || (await validator(cachedValue)))
      ) {
        logger.debug(`Cache getOrSet HIT: ${key}`);
        return cachedValue;
      }
      logger.debug(`Cache getOrSet MISS: ${key}. Fetching...`);
      const freshData = await fetcher();
      if (freshData !== null && freshData !== undefined) {
        await this.set(key, freshData, ttl);
        logger.debug(`Cache getOrSet SET: ${key} (TTL: ${ttl}s)`);
      } else {
        logger.warn(
          `Cache getOrSet: Fetcher returned null/undefined for ${key}. Not caching.`
        );
      }
      return freshData;
    } catch (error) {
      logger.error(`Cache getOrSet Error for ${key}: ${error.message}`);
      const staleValue = await this.get(key).catch(() => null); // Attempt to get stale on error
      if (staleValue !== null)
        logger.warn(
          `Cache getOrSet: Serving stale data for ${key} due to fetch error.`
        );
      return staleValue;
    }
  },

  /** Intelligently invalidate related cache entries */
  async smartInvalidate(patterns = [], options = {}) {
    if (!patterns || patterns.length === 0) return 0;
    try {
      const { recursive = true, log = true } = options;
      let totalCleared = 0;
      const processedPatterns = new Set();
      // Ensure patterns are strings and filter out non-string values
      const queue = [...new Set(patterns.filter(pattern => typeof pattern === 'string' && Boolean(pattern)))]; // Unique, non-empty string patterns

      while (queue.length > 0) {
        const pattern = queue.shift();
        if (processedPatterns.has(pattern)) continue;
        processedPatterns.add(pattern);

        const clearedCount = await this.delByPattern(pattern);
        totalCleared += clearedCount;

        if (clearedCount > 0 && log) {
          logger.info(
            `Cache SmartInvalidate: Cleared ${clearedCount} keys for pattern: "${pattern}"`
          );
        }

        if (recursive && clearedCount > 0) {
          // Recurse only if keys were actually deleted
          const related = this.getRelatedPatterns(pattern);
          related.forEach((relPattern) => {
            if (!processedPatterns.has(relPattern)) queue.push(relPattern);
          });
        }
      }
      if (log && totalCleared > 0)
        logger.info(
          `Cache SmartInvalidate: Finished. Total keys cleared: ${totalCleared}`
        );
      return totalCleared;
    } catch (error) {
      logger.error(`Cache SmartInvalidate Error: ${error.message}`);
      return 0;
    }
  },

  /** Define patterns related to a primary pattern */
  getRelatedPatterns(pattern) {
    // Ensure pattern is a string
    if (typeof pattern !== 'string') {
      logger.error(`Invalid pattern type in getRelatedPatterns: ${typeof pattern}. Expected string.`);
      return [];
    }

    const patterns = new Set();
    try {
      // If a product detail page is cleared, clear lists, trending, and bookmarks
      if (/^products:detail:.*$/.test(pattern)) {
        patterns.add("products:list:*");
        patterns.add("products:trending:*");
        patterns.add("recommendations:*"); // Broadly clear recommendations
        patterns.add("bookmarks:user:*"); // Clear all user bookmarks caches
      }
      // If any product-related cache changes, clear lists, trending
      if (pattern.startsWith("products:")) {
        patterns.add("products:list:*");
        patterns.add("products:trending:*");
        patterns.add("bookmarks:user:*"); // Clear all user bookmarks caches
      }
      // If categories change, clear category lists and product lists/searches
      if (pattern.startsWith("categories:")) {
        patterns.add("categories:list:*");
        patterns.add("products:category:*");
        patterns.add("products:list:*"); // Lists might depend on categories
        patterns.add("bookmarks:user:*"); // Clear all user bookmarks caches
      }
      // If user data changes, clear user-specific recommendations and bookmarks
      if (pattern.startsWith("users:detail:")) {
        const userIdMatch = pattern.match(/^users:detail:([^:]+):/);
        if (userIdMatch) {
          patterns.add(`recommendations:user:${userIdMatch[1]}:*`);
          patterns.add(`bookmarks:user:${userIdMatch[1]}:*`);
        }
      }
      // If bookmarks change, clear related user bookmarks
      if (pattern.startsWith("bookmarks:")) {
        const userIdMatch = pattern.match(/^bookmarks:user:([^:]+):/);
        if (userIdMatch) {
          patterns.add(`bookmarks:user:${userIdMatch[1]}:*`);
        } else {
          patterns.add("bookmarks:user:*"); // Clear all user bookmarks caches
        }
      }
    } catch (error) {
      logger.error(`Error in getRelatedPatterns for pattern ${pattern}: ${error.message}`);
    }
    return Array.from(patterns);
  },

  /** Warm cache by fetching data and storing it */
  async warmCache(key, fetcher, ttl = 3600) {
    if (!key || typeof fetcher !== "function") {
      /* ... error ... */ return false;
    }
    try {
      const exists = await this.exists(key);
      if (exists) {
        logger.debug(`Cache warmCache: Key exists, skipping ${key}`);
        return true;
      }
      const data = await fetcher();
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
        logger.info(`Cache warmCache SUCCESS: ${key}`);
        return true;
      }
      logger.warn(`Cache warmCache: Fetcher returned empty data for ${key}.`);
      return false;
    } catch (error) {
      logger.error(`Cache warmCache Error for ${key}: ${error.message}`);
      return false;
    }
  },

  // --- Consolidated Invalidation Logic ---

  /** Invalidate caches related to a specific product */
  async invalidateProduct(
    productId,
    slug,
    options = { invalidateRelated: true, makerId: null }
  ) {
    if (!productId || !slug) return 0;

    // Sanitize slug to prevent pattern errors
    const safeSlug = String(slug).replace(/[,\-\s]/g, "_");

    logger.info(`Invalidating product cache - ID: ${productId}, Slug: ${safeSlug}${options.makerId ? `, MakerID: ${options.makerId}` : ''}`);

    const patternsToClear = [
      this.generateKey("products", `detail:${safeSlug}`, "*"),
      this.generateKey("products", "list", "*"),
      this.generateKey("products", "trending", "*"),
      this.generateKey("products", "featured", "*"),
      this.generateKey("products", "new", "*"),
      this.generateKey("products", "search", "*"),
      this.generateKey("products", "category:*"), // Broad category clear
      this.generateKey("products", "maker:*"), // Broad maker clear
      this.generateKey("products", "user:*"), // Clear user products cache
      this.generateKey("views", `product:${productId}:stats`, "*"),
    ];

    // If we have the maker ID, specifically target that user's product cache
    if (options.makerId) {
      patternsToClear.push(this.generateKey("products", `user:${options.makerId}`, "*"));
    }

    if (options.invalidateRelated !== false) {
      patternsToClear.push(this.generateKey("recommendations", "*", "*"));
    }

    // Filter out any non-string patterns
    const validPatterns = patternsToClear.filter(pattern => typeof pattern === 'string');

    return this.smartInvalidate(validPatterns, {
      recursive: false,
      log: true,
    });
  },

  /** Invalidate caches related to views */
  async invalidateViewCaches(productId, userId = null) {
    if (!productId) return 0;
    logger.info(
      `Invalidating view caches - Product: ${productId}` +
        (userId ? `, User: ${userId}` : "")
    );
    const patternsToClear = [
      this.generateKey("views", `product:${productId}:stats`, "*"),
      this.generateKey("products", "trending", "*"),
      // this.generateKey('products', 'popular', '*'), // If you add popular list
    ];
    if (userId) {
      patternsToClear.push(
        this.generateKey("views", `user:${userId}:history`, "*")
      );
      patternsToClear.push(
        this.generateKey("recommendations", `user:${userId}`, "*")
      );
    }
    return this.smartInvalidate(patternsToClear, {
      recursive: false,
      log: true,
    });
  },
};

export default cache;

// Keep generateCacheKey export for potential external use / backward compatibility
export const generateCacheKey = (type, id, context) =>
  cache.generateKey(type, id, context);
