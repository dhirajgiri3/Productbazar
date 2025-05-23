// file: backend/Middlewares/cache.middleware.js
import logger from "../../../utils/logging/logger.js";
import cache from "../../../utils/cache/cache.js"; // Import the refined cache service
import mongoose from "mongoose";

// Parse duration to seconds (centralized definition or import)
const parseDuration = (duration) => {
  if (typeof duration === "number") return duration;
  const match = duration.match(/^(\d+)\s*(\w+)$/);
  if (!match) {
    logger.error(`Invalid cache duration format: ${duration}`);
    return 300;
  }
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const units = {
    s: 1,
    sec: 1,
    second: 1,
    seconds: 1,
    m: 60,
    min: 60,
    minute: 60,
    minutes: 60,
    h: 3600,
    hour: 3600,
    hours: 3600,
    d: 86400,
    day: 86400,
    days: 86400,
  };
  if (!units[unit]) {
    logger.error(`Unknown cache duration unit: ${unit}`);
    return 300;
  }
  return value * units[unit];
};

// --- API Caching Middleware ---
export const apiCache = (duration = "5 minutes", keyGenerator = null) => {
  const expiry = parseDuration(duration);

  return async (req, res, next) => {
    if (
      req.method !== "GET" ||
      process.env.DISABLE_CACHE === "true" ||
      req.isBot
    ) {
      return next();
    }

    // Ensure search parameter is included in the cache key
    const queryParams = { ...req.query };
    const queryContext = JSON.stringify(Object.entries(queryParams).sort());
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : cache.generateKey(
          `${req.baseUrl}${req.path}`,
          `${req.user?._id || "anon"}:${queryContext}`
        );

    try {
      const cachedData = await cache.get(cacheKey);
      if (cachedData !== null) {
        logger.debug(`Cache hit: ${cacheKey}`);
        res.set("X-Cache", "HIT");
        res.set("X-Cache-Key", cacheKey);
        return res.status(200).json({
          ...cachedData,
          ...(process.env.NODE_ENV === "development" && {
            _cache: { key: cacheKey, hit: true, expiry: `${expiry} seconds` },
          }),
        });
      }

      logger.debug(`Cache miss: ${cacheKey}`);
      res.set("X-Cache", "MISS");
      res.set("X-Cache-Key", cacheKey);

      const originalJson = res.json;
      res.json = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const shouldCache =
            body &&
            (Array.isArray(body)
              ? body.length > 0
              : Object.keys(body).length > 0);
          if (shouldCache) {
            cache
              .set(cacheKey, body, expiry)
              .catch((err) =>
                logger.error(
                  `Cache set error for key ${cacheKey}: ${err.message}`
                )
              );
          } else {
            logger.debug(
              `Skipping cache set for empty response. Key: ${cacheKey}`
            );
          }
        }
        return originalJson.call(this, body);
      };
      next();
    } catch (error) {
      logger.error(
        `Cache middleware error for key ${cacheKey}: ${error.message}`
      );
      next();
    }
  };
};

// --- Cache Clearing Middleware Wrapper ---
// NOTE: Best practice is usually to call cache invalidation directly in controllers AFTER DB write.
// This middleware uses response listeners, which can be less reliable.
export const clearCache = (patterns) => async (req, res, next) => {
  const onFinish = async () => {
    res.removeListener("finish", onFinish);
    if (
      res.statusCode >= 200 &&
      res.statusCode < 300 &&
      ["POST", "PUT", "DELETE", "PATCH"].includes(req.method)
    ) {
      try {
        // Get patterns based on input type
        let rawPatterns;
        if (Array.isArray(patterns)) {
          rawPatterns = patterns;
        } else if (typeof patterns === "function") {
          const result = patterns(req);
          rawPatterns = Array.isArray(result) ? result : [result];
        } else {
          rawPatterns = [patterns];
        }

        // Ensure all patterns are strings
        const patternsToInvalidate = rawPatterns
          .filter(pattern => pattern !== null && pattern !== undefined)
          .map(pattern => String(pattern));

        if (patternsToInvalidate.length > 0) {
          logger.debug(`Invalidating cache patterns: ${patternsToInvalidate.join(', ')}`);
          await cache.smartInvalidate(patternsToInvalidate, { log: true });
        }
      } catch (error) {
        logger.error(`Cache clear (onFinish) error: ${error.message}`);
      }
    }
  };
  res.on("finish", onFinish);
  next();
};

// --- Cache Control Header Middleware ---
export const cacheControl = (options = {}) => {
  const {
    isPublic = true,
    maxAge = 3600,
    staleWhileRevalidate = 60,
    mustRevalidate = false,
    authenticatedCache = false,
  } = options;
  return (req, res, next) => {
    if (req.user && !authenticatedCache) {
      res.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      return next();
    }
    const directives = [
      isPublic ? "public" : "private",
      `max-age=${maxAge}`,
      `stale-while-revalidate=${staleWhileRevalidate}`,
    ];
    if (mustRevalidate) directives.push("must-revalidate");
    res.set("Cache-Control", directives.join(", "));
    next();
  };
};

// --- Cache Warming Trigger Middleware ---
export const warmCache = (keyGen, fetcher, ttl) => async (req, res, next) => {
  try {
    const key = typeof keyGen === "function" ? keyGen(req) : keyGen;
    // Fire and forget warming
    cache
      .warmCache(key, () => fetcher(req), ttl)
      .catch((err) =>
        logger.error(`Background cache warming failed for key ${key}:`, err)
      );
    next();
  } catch (error) {
    logger.error("Cache warming trigger middleware failed:", error);
    next();
  }
};

// --- Common Cache Patterns ---
// (Using the centralized cache.generateKey)
export const commonCachePatterns = {
  products: {
    list: cache.generateKey("products", "list", "*"),
    detail: (slug) => cache.generateKey("products", `detail:${slug}`, "*"),
    category: (categoryId) =>
      cache.generateKey("products", `category:${categoryId}`, "*"),
    maker: (makerId) => cache.generateKey("products", `maker:${makerId}`, "*"),
    trending: cache.generateKey("products", "trending", "*"),
    featured: cache.generateKey("products", "featured", "*"),
    new: cache.generateKey("products", "new", "*"),
    search: cache.generateKey("products", "search", "*"),
    recommendations: cache.generateKey("recommendations", "*", "*"),
    bookmarks: (userId) => cache.generateKey("bookmarks", `user:${userId}`, "*"),
  },
  categories: {
    list: cache.generateKey("categories", "list", "*"),
    detail: (slug) => cache.generateKey("categories", `detail:${slug}`, "*"),
  },
  users: {
    detail: (userId) => cache.generateKey("users", `detail:${userId}`, "*"),
    recommendations: (userId) =>
      cache.generateKey("recommendations", `user:${userId}`, "*"),
  },
  views: {
    productStats: (productId) =>
      cache.generateKey("views", `product:${productId}:stats`, "*"),
    userHistory: (userId) =>
      cache.generateKey("views", `user:${userId}:history`, "*"),
    dailyAnalytics: cache.generateKey("views", "analytics:daily", "*"),
  },
};

// --- View Cache Invalidation Middleware ---
// This middleware triggers the cache service invalidation function
export const invalidateViewCachesMiddleware = (req, res, next) => {
  const productId = req.params.id || req.params.productId || req.body.productId;
  const userId = req.user?._id;
  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    // Fire and forget
    cache
      .invalidateViewCaches(productId, userId)
      .catch((err) =>
        logger.error("Failed to invalidate view caches in middleware:", err)
      );
  } else {
    logger.warn(
      "invalidateViewCachesMiddleware called without valid productId"
    );
  }
  next();
};
