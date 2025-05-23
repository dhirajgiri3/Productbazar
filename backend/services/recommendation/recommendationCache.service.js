import cache from "../../utils/cache/cache.js";
import logger from "../../utils/logging/logger.js";
import RecommendationService from "./recommendations.service.js";

class RecommendationCacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour default TTL
    this.cachePrefixes = {
      trending: "rec:trend",
      new: "rec:new",
      personalized: "rec:pers",
      category: "rec:cat",
      tag: "rec:tag",
      similar: "rec:sim",
      feed: "rec:feed",
      maker: "rec:maker",
      collaborative: "rec:collab",
      popular: "rec:pop"
    };
  }

  /**
   * Generate cache key based on recommendation type and parameters
   */
  generateKey(type, params = {}) {
    try {
      const prefix = this.cachePrefixes[type] || "rec:misc";
      let key; // Properly declare the key variable
      
      // Create strongly differentiated keys for auth vs non-auth
      if (params.userId) {
        key = `${prefix}:auth:u:${params.userId}`;
      } else {
        // Use a more specific non-auth key with session tracking if possible
        const visitorId = params.visitorId || params.sessionId || 'anon';
        key = `${prefix}:anon:${visitorId.substring(0, 8)}`;
      }
      
      // Add additional context parameters
      if (params.strategy) {
        key += `:s:${params.strategy}`;
      }
      
      if (params.blend) {
        key += `:b:${params.blend}`;
      }
      
      if (params.categoryId) {
        key += `:c:${params.categoryId}`;
      }
      
      if (params.productId) {
        key += `:p:${params.productId}`;
      }
      
      if (params.makerId) {
        key += `:m:${params.makerId}`;
      }
      
      if (params.limit) {
        key += `:l:${params.limit}`;
      }
      
      if (params.days) {
        key += `:d:${params.days}`;  
      }
      
      if (params.offset) {
        key += `:o:${params.offset}`;
      }
      
      if (params.tags) {
        key += `:t:${params.tags.sort().join('.')}`;
      }

      // Different time buckets - shorter for auth to enable quicker personalization
      const timeWindow = params.userId ? 3 * 60 * 1000 : 15 * 60 * 1000; // 3 min vs 15 min
      key += `:time:${Math.floor(Date.now() / timeWindow)}`;

      // Validate the generated key
      if (!key) {
        throw new Error('Failed to generate valid cache key');
      }

      // Ensure key length is reasonable
      if (key.length > 250) {
        logger.warn(`Long cache key generated (${key.length} chars), truncating`);
        key = key.substring(0, 250);
      }

      return key;
    } catch (error) {
      logger.error('Error generating cache key:', error);
      // Return a fallback key in case of errors
      return `${this.cachePrefixes[type] || "rec:misc"}:fallback:${Date.now()}`;
    }
  }

  /**
   * Get cached recommendations
   */
  async get(type, params = {}) {
    try {
      const key = this.generateKey(type, params);
      const data = await cache.get(key);
      
      // Validate cached data is array
      if (data && !Array.isArray(data)) {
        logger.warn(`Invalid cached data format for ${key}, clearing cache`);
        await this.deletePattern(key);
        return null;
      }

      logger.debug(`Cache ${data ? 'HIT' : 'MISS'} for ${key}`);
      return data;
    } catch (error) {
      logger.error('Error getting cached recommendations:', error);
      return null;
    }
  }

  /**
   * Store recommendations in cache
   */
  async set(type, data, params = {}, ttl = null) {
    try {
      // Validate data is array before caching
      if (!Array.isArray(data)) {
        logger.warn(`Invalid recommendations data for caching: ${typeof data}`);
        return false;
      }

      const key = this.generateKey(type, params);
      await cache.set(key, data, ttl || this.defaultTTL);
      logger.debug(`Cached ${data.length} recommendations for ${key}`);
      return true;
    } catch (error) {
      logger.error('Error caching recommendations:', error);
      return false;
    }
  }

  /**
   * Delete cache entries matching a pattern
   */
  async deletePattern(pattern) {
    try {
      const client = cache.getClient();
      const keys = await client.keys(`${pattern}*`);
      if (keys.length > 0) {
        await client.del(...keys);
        logger.debug(`Deleted ${keys.length} cached recommendations for pattern ${pattern}`);
      }
      return true;
    } catch (error) {
      logger.error('Error deleting cached recommendations:', error);
      return false;
    }
  }

  /**
   * Invalidate user's personalized recommendations with improved scope
   */
  async invalidateUserCache(userId, options = {}) {
    try {
      const { invalidateAll = false } = options;
      const patterns = [
        `${this.cachePrefixes.personalized}:u:${userId}*`,
        `${this.cachePrefixes.feed}:u:${userId}*`,
        `${this.cachePrefixes.collaborative}:u:${userId}*`
      ];

      // Add more patterns if full invalidation is requested
      if (invalidateAll) {
        patterns.push(
          `${this.cachePrefixes.history}:u:${userId}*`,
          `${this.cachePrefixes.preferences}:u:${userId}*`,
          `${this.cachePrefixes.interests}:u:${userId}*`
        );
      }

      await Promise.all(patterns.map(pattern => this.deletePattern(pattern)));
      return true;
    } catch (error) {
      logger.error(`Error invalidating user cache for ${userId}:`, error);
      return false;
    }
  }

  // Alias for backward compatibility and multiple user support
  async invalidateUserCaches(userIds) {
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }
    return Promise.all(userIds.map(userId => this.invalidateUserCache(userId)));
  }

  /**
   * Invalidate category recommendations
   */
  async invalidateCategoryCache(categoryId) {
    return this.deletePattern(`${this.cachePrefixes.category}:c:${categoryId}`);
  }

  /**
   * Invalidate similar product recommendations
   */
  async invalidateSimilarCache(productId) {
    return this.deletePattern(`${this.cachePrefixes.similar}:p:${productId}`);
  }

  /**
   * Invalidate cache after product interaction
   */
  async invalidateOnEngagement(productId) {
    try {
      // Invalidate trending and new products
      await Promise.all([
        this.deletePattern(this.cachePrefixes.trending),
        this.deletePattern(this.cachePrefixes.popular),
        this.invalidateSimilarCache(productId)
      ]);
      return true;
    } catch (error) {
      logger.error(`Error invalidating cache after engagement with ${productId}:`, error);
      return false;
    }
  }

  /**
   * Smart invalidation based on interaction type
   */
  async smartInvalidateCache(type, metadata = {}) {
    const patterns = [];

    // Determine user-specific invalidation
    if (metadata.userId) {
      const userPrefix = `rec:u:${metadata.userId}`;
      
      // For significant interactions, do broader invalidation
      if (['upvote', 'bookmark', 'comment'].includes(type)) {
        patterns.push(
          `${this.cachePrefixes.personalized}:u:${metadata.userId}*`,
          `${this.cachePrefixes.feed}:u:${metadata.userId}*`,
          `${this.cachePrefixes.collaborative}:u:${metadata.userId}*`, 
          `${this.cachePrefixes.interests}:u:${metadata.userId}*`
        );
      } else if (type === 'view') {
        // For views, only invalidate personalized and feed
        patterns.push(
          `${this.cachePrefixes.feed}:u:${metadata.userId}*`
        );
      }
    }

    // For product-related interactions, invalidate product-specific caches
    if (metadata.productId) {
      patterns.push(`${this.cachePrefixes.similar}:p:${metadata.productId}*`);
      
      // For significant engagement, also invalidate trending
      if (['upvote', 'bookmark', 'comment'].includes(type)) {
        patterns.push(this.cachePrefixes.trending);
        patterns.push(this.cachePrefixes.popular);
      }
    }

    // For category-specific interactions
    if (metadata.categoryId) {
      patterns.push(`${this.cachePrefixes.category}:c:${metadata.categoryId}*`);
    }

    // If we have tag information, invalidate tag-related caches
    if (metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
      const sortedTags = [...metadata.tags].sort().join('.');
      patterns.push(`${this.cachePrefixes.tag}:t:${sortedTags}*`);
    }

    try {
      await Promise.all(patterns.map(pattern => this.deletePattern(pattern)));
      logger.debug('Smart cache invalidation completed', { type, patterns });
      return true;
    } catch (error) {
      logger.error('Error in smart cache invalidation:', error);
      return false;
    }
  }

  /**
   * Warm up cache for frequently accessed recommendations
   */
  async warmUp(recommendations, type, params = {}, ttl = null) {
    return this.set(type, recommendations, params, ttl);
  }

  /**
   * Prime the cache with known high-traffic content
   */
  async primeCache() {
    try {
      const startTime = Date.now();
      logger.debug('Starting cache priming');
      
      // Prime trending content for anonymous users (most frequently accessed)
      const trendingData = await RecommendationService.getTrendingRecommendations(
        null, // No user context
        { limit: 20, days: 7 }
      );
      
      await this.set('trending', trendingData, { strategy: 'default' }, 3600); // 1 hour cache
      
      // Prime new products cache
      const newData = await RecommendationService.getNewProductRecommendations(
        null, // No user context
        { limit: 20, days: 7 }
      );
      
      await this.set('new', newData, { strategy: 'default' }, 3600); // 1 hour cache
      
      // Prime hybrid recommendations with different blends
      const blends = ['standard', 'discovery', 'trending'];
      
      await Promise.all(blends.map(async (blend) => {
        const hybridData = await RecommendationService.getHybridRecommendations(
          null, // No user context
          { 
            limit: 20, 
            offset: 0,
            context: { blend }
          }
        );
        
        await this.set('hybrid', hybridData, { blend }, 1800); // 30 minute cache
        
        // Also prepare category-specific hybrid recommendations for popular categories
        const topCategories = ['5f7b3c4d1c9d440000d7b0a0', '5f7b3c4d1c9d440000d7b0a1']; // Example IDs
        
        for (const categoryId of topCategories) {
          const categoryData = await RecommendationService.getHybridRecommendations(
            null,
            {
              limit: 20,
              offset: 0,
              context: { blend },
              category: categoryId
            }
          );
          
          await this.set('hybrid', categoryData, { 
            blend, 
            category: categoryId 
          }, 1800);
        }
      }));
      
      const duration = Date.now() - startTime;
      logger.info(`Cache priming completed in ${duration}ms`);
      
      return {
        success: true,
        duration,
        items: {
          trending: trendingData.length,
          new: newData.length,
          hybrid: blends.length * (2 + 2) // blends * (main + categories)
        }
      };
    } catch (error) {
      logger.error('Error priming cache:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const recommendationCacheService = new RecommendationCacheService();
export default recommendationCacheService;
