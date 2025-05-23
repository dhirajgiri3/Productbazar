import mongoose from "mongoose";
import Product from "../../models/product/product.model.js";
import Job from "../../models/job/job.model.js";
import Project from "../../models/project/project.model.js";
import User from "../../models/user/user.model.js";
import SearchHistory from "../../models/search/searchHistory.model.js";
import logger from "../../utils/logging/logger.js";
import { rankSearchResults, calculateContextualRelevance, getSynonyms, getFuzzyMatches, calculateWordSimilarity } from "../../utils/data/searchUtils.js";
import { findSimilarDocuments } from "../../utils/data/vectorEmbeddings.js";
import cache from "../../utils/cache/cache.js";

class GlobalSearchService {
  async search(params) {
    try {
      const {
        query,
        type = "all", // 'all', 'products', 'jobs', 'projects', 'users'
        filters = {},
        page = 1,
        limit = 20,
        // naturalLanguage parameter removed as we're not using text search anymore
        userId = null,
      } = params;

      // Log search query for analytics
      logger.info(
        `Global search: "${query}" (type: ${type}, page: ${page}, limit: ${limit})`
      );

      // Save search history if user is logged in
      if (userId && query && query.trim()) {
        try {
          await this.saveSearchHistory(userId, query, type);
        } catch (error) {
          logger.error("Error saving search history:", error);
        }
      }

      // Store lowercase query for exact matching
      const queryLower = query ? query.toLowerCase() : "";

      // Build base aggregation pipeline with improved relevance scoring
      const baseAggregation = [
        // Add lowercase query as a field for exact matching
        {
          $addFields: {
            queryLower: queryLower,
          },
        },
        // Advanced scoring system with engagement metrics
        {
          $addFields: {
            // Calculate age in days for recency scoring
            ageInDays: {
              $divide: [
                { $subtract: [new Date(), "$createdAt"] },
                1000 * 60 * 60 * 24, // Convert ms to days
              ],
            },

            // Title/name scoring with exact and partial matches
            titleScore: {
              $cond: {
                if: { $eq: [{ $toLower: "$name" }, queryLower] },
                then: 15, // Exact match - highest priority
                else: {
                  $cond: {
                    if: query
                      ? {
                          $regexMatch: {
                            input: { $ifNull: ["$name", ""] },
                            regex: query,
                            options: "i",
                          },
                        }
                      : false,
                    then: 8, // Contains match
                    else: 0, // No match
                  },
                },
              },
            },

            // Tag scoring - enhanced
            tagScore: {
              $cond: {
                if: {
                  $and: [
                    { $isArray: "$tags" },
                    { $gt: [{ $size: { $ifNull: ["$tags", []] } }, 0] },
                    {
                      $in: [
                        query ? query.toLowerCase() : "",
                        {
                          $map: {
                            input: { $ifNull: ["$tags", []] },
                            as: "tag",
                            in: { $toLower: { $ifNull: ["$$tag", ""] } },
                          },
                        },
                      ],
                    },
                  ],
                },
                then: 10, // Tag match - high priority
                else: 0, // No tag match
              },
            },

            // Category relevance scoring
            categoryScore: {
              $cond: {
                // Exact category match using categoryName (string) instead of category (ObjectId)
                if: query
                  ? {
                      $regexMatch: {
                        input: { $ifNull: ["$categoryName", ""] },
                        regex: query,
                        options: "i",
                      },
                    }
                  : false,
                then: 7, // Category is highly relevant
                else: 0,
              },
            },

            // Tagline relevance scoring
            taglineScore: {
              $cond: {
                if: query
                  ? {
                      $regexMatch: {
                        input: { $ifNull: ["$tagline", ""] },
                        regex: query,
                        options: "i",
                      },
                    }
                  : false,
                then: 5, // Tagline matches are quite relevant
                else: 0,
              },
            },

            // Description relevance scoring (lower weight)
            descriptionScore: {
              $cond: {
                if: query
                  ? {
                      $regexMatch: {
                        input: { $ifNull: ["$description", ""] },
                        regex: query,
                        options: "i",
                      },
                    }
                  : false,
                then: 3, // Description matches are less relevant
                else: 0,
              },
            },

            // Engagement metrics scoring
            upvoteScore: {
              $multiply: [
                {
                  $cond: {
                    if: { $isArray: "$upvotes" },
                    then: { $size: { $ifNull: ["$upvotes", []] } },
                    else: 0,
                  },
                },
                0.5, // Weight for upvotes
              ],
            },

            viewsScore: {
              $multiply: [
                {
                  $cond: {
                    if: { $gt: [{ $ifNull: ["$views.count", 0] }, 0] },
                    then: {
                      $min: [
                        { $divide: [{ $ifNull: ["$views.count", 0] }, 10] },
                        5,
                      ],
                    }, // Cap at 5
                    else: 0,
                  },
                },
                0.3, // Weight for views
              ],
            },

            // Comment count scoring - more comments indicate more engagement
            commentScore: {
              $multiply: [
                {
                  $cond: {
                    if: { $isArray: "$comments" },
                    then: {
                      $min: [{ $size: { $ifNull: ["$comments", []] } }, 10],
                    }, // Cap at 10 comments
                    else: 0,
                  },
                },
                0.4, // Weight for comments
              ],
            },

            // Featured products get a boost
            featuredScore: {
              $cond: {
                if: { $eq: ["$featured", true] },
                then: 5,
                else: 0,
              },
            },

            // Recency score - boost newer products
            recencyScore: {
              $cond: {
                if: { $lt: ["$ageInDays", 30] },
                then: { $multiply: [{ $subtract: [30, "$ageInDays"] }, 0.1] }, // Up to 3 points for newest products
                else: 0,
              },
            },

            // Add basic relevance score
            basicScore: { $literal: 1 },
          },
        },
        // Weighted scoring with improved algorithm
        {
          $addFields: {
            // Calculate engagement scores safely - consolidated for better performance
            engagementScores: {
              upvoteScore: {
                $multiply: [
                  {
                    $cond: {
                      if: { $isArray: "$upvotes" },
                      then: { $size: { $ifNull: ["$upvotes", []] } },
                      else: 0,
                    },
                  },
                  0.3,
                ],
              },
              viewsScore: {
                $multiply: [
                  {
                    $cond: {
                      if: { $isNumber: "$views" },
                      then: { $ifNull: ["$views", 0] },
                      else: {
                        $cond: {
                          if: { $gt: [{ $ifNull: ["$views.count", 0] }, 0] },
                          then: { $ifNull: ["$views.count", 0] },
                          else: 0
                        }
                      }
                    },
                  },
                  0.1,
                ],
              },
              featuredScore: {
                $cond: {
                  if: { $eq: [{ $ifNull: ["$featured", false] }, true] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        // Combine all scores with enhanced weighting
        {
          $addFields: {
            // Calculate relevance score (how well the item matches the search query)
            relevanceScore: {
              $add: [
                { $ifNull: ["$titleScore", 0] },
                { $ifNull: ["$tagScore", 0] },
                { $ifNull: ["$categoryScore", 0] },
                { $ifNull: ["$taglineScore", 0] },
                { $ifNull: ["$descriptionScore", 0] },
              ],
            },

            // Calculate engagement score (how popular/valuable the item is)
            engagementScore: {
              $add: [
                { $ifNull: ["$engagementScores.upvoteScore", 0] },
                { $ifNull: ["$engagementScores.viewsScore", 0] },
                { $ifNull: ["$engagementScores.featuredScore", 0] },
                // Add comment count to engagement score
                { $ifNull: ["$commentScore", 0] },
              ],
            },

            // Calculate quality score (signals of content quality)
            qualityScore: {
              $add: [
                // Higher quality for complete profiles with images
                {
                  $cond: {
                    if: { $ne: ["$thumbnail", null] },
                    then: 2,
                    else: 0,
                  },
                },
                // Higher quality for verified products
                {
                  $cond: { if: { $eq: ["$verified", true] }, then: 3, else: 0 },
                },
                // Higher quality for products with complete descriptions
                {
                  $cond: {
                    if: {
                      $and: [
                        { $ne: ["$description", null] },
                        {
                          $gt: [
                            { $strLenCP: { $ifNull: ["$description", ""] } },
                            100,
                          ],
                        },
                      ],
                    },
                    then: 2,
                    else: 0,
                  },
                },
              ],
            },

            // Calculate final score with weighted components and improved algorithm
            finalScore: {
              $add: [
                // Relevance is the primary factor (65%)
                {
                  $multiply: [
                    {
                      $add: [
                        // Exact name match gets highest priority
                        {
                          $cond: {
                            if: { $eq: [{ $toLower: "$name" }, "$queryLower"] },
                            then: 50,
                            else: 0,
                          },
                        },
                        // Partial matches with weighted importance
                        { $multiply: [{ $ifNull: ["$titleScore", 0] }, 1.5] }, // Title/name is most important
                        { $multiply: [{ $ifNull: ["$tagScore", 0] }, 1.2] }, // Tags are very important
                        { $ifNull: ["$categoryScore", 0] },
                        { $multiply: [{ $ifNull: ["$taglineScore", 0] }, 0.8] },
                        {
                          $multiply: [
                            { $ifNull: ["$descriptionScore", 0] },
                            0.5,
                          ],
                        }, // Description less important
                      ],
                    },
                    0.65,
                  ],
                },

                // Engagement is secondary (20%)
                {
                  $multiply: [
                    {
                      $add: [
                        { $multiply: [{ $ifNull: ["$engagementScores.upvoteScore", 0] }, 1.2] }, // Upvotes are most important
                        { $ifNull: ["$engagementScores.viewsScore", 0] },
                        { $ifNull: ["$engagementScores.featuredScore", 0] },
                        { $ifNull: ["$commentScore", 0] },
                      ],
                    },
                    0.2,
                  ],
                },

                // Quality score (10%)
                { $multiply: [{ $ifNull: ["$qualityScore", 0] }, 0.1] },

                // Recency is important but less than others (5%)
                { $multiply: [{ $ifNull: ["$recencyScore", 0] }, 0.05] },

                // Add basic score to ensure all items get ranked
                { $ifNull: ["$basicScore", 0] },
              ],
            },
          },
        },
        { $sort: { finalScore: -1 } },
      ];

      // We're not using text score in the aggregation pipeline anymore
      // This avoids the "query requires text score metadata" error
      // Instead, we'll rely on our custom scoring system

      // Execute search based on type
      const results = await this.executeTypeSpecificSearch(
        type,
        query,
        filters,
        baseAggregation,
        page,
        limit,
        userId // Pass userId to exclude current user from results
      );

      // Get search suggestions if query is provided
      let suggestions = [];
      if (query && query.trim()) {
        suggestions = await this.getSearchSuggestions(query, type);
      }

      return {
        success: true,
        query,
        type,
        page,
        limit,
        suggestions,
        ...results,
      };
    } catch (error) {
      logger.error("Global search error:", error);
      return {
        success: false,
        error: error.message,
        results: {},
        counts: {},
        totalResults: 0,
        suggestions: [],
      };
    }
  }

  async executeTypeSpecificSearch(
    type,
    query,
    filters,
    baseAggregation,
    page,
    limit,
    userId = null
  ) {
    const searchResults = {};
    const skip = (page - 1) * limit;
    const counts = {};

    // Initialize counts to 0 for all types
    if (type === "all") {
      counts.products = 0;
      counts.jobs = 0;
      counts.projects = 0;
      counts.users = 0;
    }

    // Execute searches in parallel for better performance
    const searchPromises = [];

    if (type === "all" || type === "products") {
      searchPromises.push(
        this.searchProducts(
          query,
          filters,
          baseAggregation,
          skip,
          limit
        ).then((results) => {
          searchResults.products = results.data;
          counts.products = results.count;
        })
      );
    }

    if (type === "all" || type === "jobs") {
      searchPromises.push(
        this.searchJobs(
          query,
          filters,
          baseAggregation,
          skip,
          limit
        ).then((results) => {
          searchResults.jobs = results.data;
          counts.jobs = results.count;
        })
      );
    }

    if (type === "all" || type === "projects") {
      searchPromises.push(
        this.searchProjects(
          query,
          filters,
          baseAggregation,
          skip,
          limit
        ).then((results) => {
          searchResults.projects = results.data;
          counts.projects = results.count;
        })
      );
    }

    if (type === "all" || type === "users") {
      // Add userId to filters to exclude current user from results
      const userFilters = { ...filters };
      if (userId) {
        userFilters.excludeUserId = userId;
        logger.info(`Excluding user ${userId} from search results`);
      }

      searchPromises.push(
        this.searchUsers(
          query,
          userFilters,
          baseAggregation,
          skip,
          limit
        ).then((results) => {
          searchResults.users = results.data;
          counts.users = results.count;
        })
      );
    }

    // Wait for all searches to complete
    await Promise.all(searchPromises);

    return {
      results: searchResults,
      counts,
      totalResults: Object.values(counts).reduce(
        (sum, count) => sum + count,
        0
      ),
    };
  }

  // Helper methods for specific type searches
  async searchProducts(query, filters, baseAggregation, skip, limit) {
    // Define product-specific search options
    const options = {
      lookups: [
        {
          $lookup: {
            from: "users",
            localField: "maker",
            foreignField: "_id",
            as: "makerDetails",
          },
        }
      ],
      projections: {
        _id: 1,
        name: 1,
        slug: 1,
        tagline: 1,
        description: 1,
        thumbnail: 1,
        category: 1,
        categoryName: 1,
        tags: 1,
        pricing: 1,
        links: 1,
        featured: 1,
        status: 1,
        // Engagement metrics
        upvotes: { $size: { $ifNull: ["$upvotes", []] } },
        bookmarks: { $size: { $ifNull: ["$bookmarks", []] } },
        views: 1,
        // Timestamps
        createdAt: 1,
        updatedAt: 1,
        launchedAt: 1,
        // Maker information
        maker: 1,
        makerDetails: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          username: 1,
          profilePicture: 1,
          role: 1,
        },
        // Search relevance information
        relevanceScore: 1,
        engagementScore: 1,
        // Include explanation of why this result was shown
        searchRelevance: {
          titleMatch: { $gt: ["$titleScore", 0] },
          tagMatch: { $gt: ["$tagScore", 0] },
          categoryMatch: { $gt: ["$categoryScore", 0] },
          taglineMatch: { $gt: ["$taglineScore", 0] },
          descriptionMatch: { $gt: ["$descriptionScore", 0] },
          // Calculate the primary match reason
          primaryMatchReason: {
            $cond: [
              { $gt: ["$titleScore", 0] },
              "name",
              {
                $cond: [
                  { $gt: ["$tagScore", 0] },
                  "tag",
                  {
                    $cond: [
                      { $gt: ["$categoryScore", 0] },
                      "category",
                      {
                        $cond: [
                          { $gt: ["$taglineScore", 0] },
                          "tagline",
                          {
                            $cond: [
                              { $gt: ["$descriptionScore", 0] },
                              "description",
                              "other",
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          // Add fuzzy match detection
          fuzzyMatch: {
            $cond: {
              if: {
                $and: [
                  // If name exists
                  { $ne: ["$name", null] },
                  // And name doesn't contain query exactly
                  {
                    $not: {
                      $regexMatch: {
                        input: { $toLower: "$name" },
                        regex: query ? query.toLowerCase() : "",
                        options: "",
                      },
                    },
                  },
                  // But we still found this result
                  { $gt: ["$finalScore", 0] },
                ],
              },
              then: true,
              else: false,
            },
          },
          // Add synonym match detection
          synonymMatch: {
            $cond: {
              if: {
                $and: [
                  // If we have a high score but not an exact match
                  { $gt: ["$finalScore", 5] },
                  // And not a direct match on name
                  { $eq: ["$titleScore", 0] },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
        // Add explanation text for why this result matched
        explanationText: "Relevant to your search",
      },
      fieldWeights: {
        name: 10,
        tagline: 7,
        tags: 8,
        categoryName: 6,
        description: 3
      },
      boostFactors: {
        upvotes: 0.2,
        views: 0.1,
        recency: 0.15,
        featured: 5
      },
      blendFactor: 0.3,
      cacheTTL: 300 // 5 minutes
    };

    // Use the common search method
    return this.commonSearch(
      'products',
      Product,
      this.buildProductSearchCriteria.bind(this),
      query,
      filters,
      baseAggregation,
      skip,
      limit,
      options
    );
  }

  async buildProductSearchCriteria(query, filters) {
    const criteria = { status: "Published" };

    // Apply filters first
    if (filters.category) criteria.category = filters.category;
    if (filters.priceRange) {
      criteria["pricing.amount"] = {
        $gte: filters.priceRange.min,
        $lte: filters.priceRange.max,
      };
    }
    if (filters.featured) criteria.featured = true;
    if (filters.maker)
      criteria.maker = new mongoose.Types.ObjectId(String(filters.maker));

    if (query && query.trim()) {
      // Clean and normalize the query
      const cleanQuery = query
        .trim()
        .replace(/[\*\+\?\^\$\{\}\(\)\|\[\]\\]/g, "\\$&");

      // Determine if we should use exact matching or partial matching
      const isExactSearch =
        cleanQuery.startsWith('"') && cleanQuery.endsWith('"');
      const searchTerm = isExactSearch ? cleanQuery.slice(1, -1) : cleanQuery;

      // Get fuzzy matches for the search term to handle typos
      const fuzzyMatchResult = getFuzzyMatches(searchTerm);
      const fuzzyMatches = fuzzyMatchResult.matches || [];
      const fuzzyExplanations = fuzzyMatchResult.explanations || {};

      // Get synonyms for the search term
      const synonymResult = getSynonyms(searchTerm);
      const synonymsList = synonymResult.synonyms || [];
      const synonymExplanations = synonymResult.explanations || {};

      // Store explanations for later use in search results
      this.searchTermExplanations = {
        ...fuzzyExplanations,
        ...synonymExplanations,
        original: `Original search term: '${searchTerm}'`,
      };

      // Combine all possible search terms
      const allSearchTerms = [searchTerm, ...fuzzyMatches, ...synonymsList];

      // Always use enhanced regex search to avoid text score metadata errors
      // MongoDB text search is causing issues in the aggregation pipeline
      logger.info(`Using enhanced regex search for term: ${searchTerm}`);
      return this._buildEnhancedProductSearch(
        criteria,
        searchTerm,
        isExactSearch,
        allSearchTerms
      );
    }

    return criteria;
  }

  /**
   * Build enhanced product search criteria with prioritized field matching and fuzzy search
   * @private
   * @param {Object} criteria - Base search criteria object
   * @param {string} query - Search query
   * @param {boolean} isExactMatch - Whether to use exact matching
   * @param {Array<string>} allSearchTerms - All search terms including synonyms and fuzzy matches
   * @returns {Object} - Enhanced search criteria
   */
  _buildEnhancedProductSearch(
    criteria,
    query,
    isExactMatch,
    allSearchTerms = []
  ) {
    // Create regex patterns with word boundaries for more precise matching
    const exactPattern = new RegExp(`\\b${query}\\b`, "i");
    const partialPattern = new RegExp(query, "i");
    const pattern = isExactMatch ? exactPattern : partialPattern;

    // Initialize $or array for search criteria
    criteria.$or = [];

    // Add exact match criteria with highest priority
    criteria.$or.push(
      // Highest priority: Exact name match
      { name: { $regex: `^${query}$`, $options: "i" } },

      // High priority: Exact tag match
      { tags: { $in: [new RegExp(`^${query}$`, "i")] } }
    );

    // Add partial match criteria with medium priority
    criteria.$or.push(
      // Medium-high priority: Name contains query
      { name: pattern },

      // Medium priority: Tags contain query
      { tags: { $in: [pattern] } },

      // Medium priority: Category and tagline
      { categoryName: pattern },
      { tagline: pattern },

      // Lower priority: Description (can contain many words)
      { description: pattern }
    );

    // If we have fuzzy matches and synonyms, add them to the search criteria
    if (allSearchTerms && allSearchTerms.length > 1) {
      // Skip the first item which is the original query
      const fuzzyTerms = allSearchTerms.slice(1);

      // Add fuzzy match criteria with lower priority
      fuzzyTerms.forEach((term) => {
        if (term !== query) {
          // Skip the original query
          const fuzzyPattern = new RegExp(term, "i");
          criteria.$or.push(
            // Lower priority: Fuzzy name match
            { name: fuzzyPattern },

            // Lower priority: Fuzzy tag match
            { tags: { $in: [fuzzyPattern] } }
          );
        }
      });
    }

    // If not exact match, add additional word-level criteria for better recall
    if (!isExactMatch) {
      // Split query into words for multi-word searches
      const words = query.split(/\s+/).filter((word) => word.length > 2);

      if (words.length > 1) {
        // For multi-word queries, add criteria to match individual words
        words.forEach((word) => {
          const wordPattern = new RegExp(`\\b${word}\\b`, "i");
          criteria.$or.push(
            { name: wordPattern },
            { tags: { $in: [wordPattern] } },
            { description: wordPattern }
          );
        });
      }
    }

    return criteria;
  }

  /**
   * Generate a standardized cache key for search results
   * @param {string} entityType - Type of entity being searched (products, jobs, etc.)
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @param {number} skip - Number of items to skip
   * @param {number} limit - Number of items to return
   * @returns {string} - Formatted cache key
   */
  generateSearchCacheKey(entityType, query, filters, skip, limit) {
    // Normalize query to lowercase and trim
    const normalizedQuery = (query || '').toLowerCase().trim();

    // Sort filter keys for consistent cache key generation
    const sortedFilters = {};
    if (filters && typeof filters === 'object') {
      Object.keys(filters).sort().forEach(key => {
        sortedFilters[key] = filters[key];
      });
    }

    // Create a hash of the filters to keep the key length reasonable
    const filtersHash = JSON.stringify(sortedFilters).split('').reduce(
      (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0
    ).toString(36);

    // Format: search:entityType:query:filtersHash:skip:limit
    return `search:${entityType}:${normalizedQuery}:${filtersHash}:${skip}:${limit}`;
  }

  /**
   * Get data from Redis cache
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} - Cached data or null
   */
  async getFromCache(key) {
    try {
      const cachedData = await cache.get(key);
      if (cachedData) {
        logger.debug(`Cache hit for key: ${key}`);
      }
      return cachedData;
    } catch (error) {
      logger.error('Error getting data from cache:', error);
      return null;
    }
  }

  /**
   * Save data to Redis cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async saveToCache(key, data, ttl = 300) {
    try {
      // Don't cache empty results
      if (!data || (Array.isArray(data) && data.length === 0) ||
          (typeof data === 'object' && Object.keys(data).length === 0)) {
        logger.debug(`Skipping cache for empty data: ${key}`);
        return false;
      }

      // Adjust TTL based on result size
      let adjustedTTL = ttl;
      if (data.count && data.count > 100) {
        // Popular searches with many results can be cached longer
        adjustedTTL = Math.min(ttl * 2, 1800); // Max 30 minutes
      } else if (data.count && data.count < 5) {
        // Rare searches with few results should expire sooner
        adjustedTTL = Math.max(ttl / 2, 60); // Min 1 minute
      }

      await cache.set(key, data, adjustedTTL);
      logger.debug(`Cached data for key: ${key} (TTL: ${adjustedTTL}s)`);
      return true;
    } catch (error) {
      logger.error('Error saving data to cache:', error);
      return false;
    }
  }

  /**
   * Common search method to reduce code duplication
   * @param {string} entityType - Type of entity to search (products, jobs, projects, users)
   * @param {Model} model - Mongoose model to search
   * @param {Function} buildCriteriaFn - Function to build search criteria
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @param {Array} baseAggregation - Base aggregation pipeline
   * @param {number} skip - Number of items to skip
   * @param {number} limit - Number of items to limit
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Search results and count
   */
  async commonSearch(entityType, model, buildCriteriaFn, query, filters, baseAggregation, skip, limit, options = {}) {
    try {
      // Try to get from cache first using optimized key generation
      const cacheKey = this.generateSearchCacheKey(entityType, query, filters, skip, limit);
      const cachedResults = await this.getFromCache(cacheKey);

      if (cachedResults) {
        logger.info(`Using cached search results for ${entityType}: ${query}`);
        return cachedResults;
      }

      // Build search criteria
      const searchCriteria = await buildCriteriaFn(query, filters);

      // Get total count for pagination
      const count = await model.countDocuments(searchCriteria);

      // Execute search query with the provided aggregation pipeline
      let data = await model.aggregate([
        { $match: searchCriteria },
        ...(options.transformAggregation ?
            baseAggregation.map(options.transformAggregation) :
            baseAggregation),
        { $skip: skip },
        { $limit: limit },
        ...(options.lookups || []),
        ...(options.projections ? [{ $project: options.projections }] : [])
      ]);

      // Apply advanced ranking and explanations if query is provided
      if (data && data.length > 0 && query) {
        // Use the rankSearchResults function for better relevance
        if (options.fieldWeights) {
          data = rankSearchResults(query, data, {
            useSemanticSearch: true,
            includeScores: true,
            fieldWeights: options.fieldWeights,
            boostFactors: options.boostFactors || {}
          });
        }

        // Enhance results with semantic search
        if (options.enhanceResults !== false) {
          data = this.enhanceSearchResults(query, data, {
            limit: limit,
            blendFactor: options.blendFactor || 0.3,
            entityType: entityType
          });
        }
      }

      // Cache the results
      const ttl = options.cacheTTL || 300; // Default 5 minutes
      await this.saveToCache(cacheKey, { data, count }, ttl);

      return { data, count };
    } catch (error) {
      logger.error(`Error searching ${entityType}:`, error);
      return { data: [], count: 0 };
    }
  }

  /**
   * Perform semantic search on items
   * @param {string} query - Search query
   * @param {Array} items - Items to search
   * @param {Object} options - Search options
   * @returns {Array} - Ranked items with similarity scores
   */
  performSemanticSearch(query, items, options = {}) {
    if (!query || !items || !Array.isArray(items) || items.length === 0) {
      return [];
    }

    try {
      const entityType = options.entityType || null;

      // Determine appropriate text fields based on entity type
      let textFields = ['name', 'description'];

      switch (entityType) {
        case 'products':
          textFields = ['name', 'tagline', 'tags', 'categoryName', 'description'];
          break;
        case 'users':
          textFields = ['firstName', 'lastName', 'username', 'bio', 'companyName', 'companyRole'];
          break;
        case 'jobs':
          textFields = ['title', 'company.name', 'skills', 'location', 'description'];
          break;
        case 'projects':
          textFields = ['title', 'technologies', 'category.name', 'description'];
          break;
      }

      // Use the findSimilarDocuments function from vectorEmbeddings.js with entity-specific settings
      const results = findSimilarDocuments(query, items, {
        idField: '_id',
        textFields: textFields,
        threshold: 0.5, // Higher base threshold
        entityType: entityType, // Pass entity type for type-specific thresholds
        limit: options.limit || 50
      });

      // Transform results to match expected format with better explanations
      return results.map(result => {
        // Generate a more specific explanation based on similarity score
        let explanation = '';
        const score = result.similarity;

        if (score >= 0.8) {
          explanation = `Highly relevant to '${query}'`;
        } else if (score >= 0.6) {
          explanation = `Relevant match for '${query}'`;
        } else {
          explanation = `Semantically related to '${query}'`;
        }

        // Add field-specific explanation if possible
        const doc = result.document;
        if (doc.name && doc.name.toLowerCase().includes(query.toLowerCase())) {
          explanation = `Name contains '${query}'`;
        } else if (doc.title && doc.title.toLowerCase().includes(query.toLowerCase())) {
          explanation = `Title contains '${query}'`;
        } else if (doc.firstName && doc.firstName.toLowerCase().includes(query.toLowerCase())) {
          explanation = `First name contains '${query}'`;
        } else if (doc.lastName && doc.lastName.toLowerCase().includes(query.toLowerCase())) {
          explanation = `Last name contains '${query}'`;
        }

        return {
          ...result.document,
          explanationText: explanation,
          searchScore: result.similarity * 10 // Scale to match our scoring system
        };
      });
    } catch (error) {
      logger.error('Error performing semantic search:', error);
      return [];
    }
  }

  /**
   * Enhance search results with semantic search
   * @param {string} query - Search query
   * @param {Array} results - Initial search results
   * @param {Object} options - Enhancement options
   * @returns {Array} - Enhanced search results
   */
  enhanceSearchResults(query, results, options = {}) {
    if (!query || !results || !Array.isArray(results)) {
      return results;
    }

    try {
      const type = options.entityType || null;

      const {
        limit = 20,
        blendFactor = 0.3, // How much to blend semantic results with original results
        minSemanticScore = 0.4 // Minimum semantic similarity score to include
      } = options;

      // Get semantic search results with entity type
      const semanticResults = this.performSemanticSearch(query, results, {
        limit,
        entityType: type // Pass the entity type for better semantic matching
      });

      // Filter semantic results by minimum score
      const filteredSemanticResults = semanticResults.filter(item =>
        item.searchScore / 10 >= minSemanticScore
      );

      // Create a map of existing result IDs for quick lookup
      const existingIds = new Set(results.map(item => item._id.toString()));

      // Find new semantic results not in the original results
      const newSemanticResults = filteredSemanticResults.filter(item =>
        !existingIds.has(item._id.toString())
      );

      // Blend original results with new semantic results
      const originalResultsCount = Math.ceil(limit * (1 - blendFactor));
      const semanticResultsCount = Math.floor(limit * blendFactor);

      // Take top results from each source
      const topOriginalResults = results.slice(0, originalResultsCount);
      const topSemanticResults = newSemanticResults.slice(0, semanticResultsCount);

      // Combine and return
      return [...topOriginalResults, ...topSemanticResults];
    } catch (error) {
      logger.error('Error enhancing search results:', error);
      return results;
    }
  }

  _buildEnhancedProductSearch(
    criteria,
    query,
    isExactMatch,
    allSearchTerms = []
  ) {
    // Create regex patterns with word boundaries for more precise matching
    const exactPattern = new RegExp(`\\b${query}\\b`, "i");
    const partialPattern = new RegExp(query, "i");
    const pattern = isExactMatch ? exactPattern : partialPattern;

    // Initialize $or array for search criteria
    criteria.$or = [];

    // Add exact match criteria with highest priority
    criteria.$or.push(
      // Highest priority: Exact name match
      { name: { $regex: `^${query}$`, $options: "i" } },

      // High priority: Exact tag match
      { tags: { $in: [new RegExp(`^${query}$`, "i")] } }
    );

    // Add partial match criteria with medium priority
    criteria.$or.push(
      // Medium-high priority: Name contains query
      { name: pattern },

      // Medium priority: Tags contain query
      { tags: { $in: [pattern] } },

      // Medium priority: Category and tagline
      { categoryName: pattern },
      { tagline: pattern },

      // Lower priority: Description (can contain many words)
      { description: pattern }
    );

    // If we have fuzzy matches and synonyms, add them to the search criteria
    if (allSearchTerms && allSearchTerms.length > 1) {
      // Skip the first item which is the original query
      const fuzzyTerms = allSearchTerms.slice(1);

      // Add fuzzy match criteria with lower priority
      fuzzyTerms.forEach((term) => {
        if (term !== query) {
          // Skip the original query
          const fuzzyPattern = new RegExp(term, "i");
          criteria.$or.push(
            // Lower priority: Fuzzy name match
            { name: fuzzyPattern },

            // Lower priority: Fuzzy tag match
            { tags: { $in: [fuzzyPattern] } }
          );
        }
      });
    }

    // If not exact match, add additional word-level criteria for better recall
    if (!isExactMatch) {
      // Split query into words for multi-word searches
      const words = query.split(/\s+/).filter((word) => word.length > 2);

      if (words.length > 1) {
        // For multi-word queries, add criteria to match individual words
        words.forEach((word) => {
          const wordPattern = new RegExp(`\\b${word}\\b`, "i");
          criteria.$or.push(
            { name: wordPattern },
            { tags: { $in: [wordPattern] } },
            { description: wordPattern }
          );
        });
      }
    }

    // Note: We're not using text search in the $or array as it requires special handling
    // and can cause the 'query requires text score metadata' error
    // Instead, we'll rely on regex patterns for matching within the $or criteria

    return criteria;
  }

  // Search jobs with improved relevance
  async searchJobs(query, filters, baseAggregation, skip, limit) {
    // Define job-specific search options
    const options = {
      // Transform the aggregation pipeline for jobs
      transformAggregation: (stage) => {
        // Replace name with title for jobs
        if (stage.$addFields && stage.$addFields.titleScore) {
          return {
            $addFields: {
              ...stage.$addFields,
              titleScore: {
                $cond: {
                  if: query
                    ? {
                        $regexMatch: {
                          input: { $ifNull: ["$title", ""] },
                          regex: query,
                          options: "i",
                        },
                      }
                    : false,
                  then: 2,
                  else: 0,
                },
              },
            },
          };
        }
        return stage;
      },
      lookups: [
        {
          $lookup: {
            from: "users",
            localField: "postedBy",
            foreignField: "_id",
            as: "companyDetails",
          },
        }
      ],
      projections: {
        _id: 1,
        title: 1,
        company: 1,
        location: 1,
        jobType: 1,
        locationType: 1,
        salary: 1,
        skills: 1,
        description: 1,
        experienceLevel: 1,
        postedBy: 1,
        createdAt: 1,
        expiresAt: 1,
        companyDetails: {
          _id: 1,
          name: 1,
          profilePicture: 1,
        },
      },
      fieldWeights: {
        title: 10,
        company: 7,
        skills: 8,
        location: 6,
        jobType: 5,
        description: 4
      },
      boostFactors: {
        recency: 0.3,
        featured: 5,
        salary: 0.2
      },
      blendFactor: 0.3,
      cacheTTL: 300 // 5 minutes
    };

    // Use the common search method
    return this.commonSearch(
      'jobs',
      Job,
      this.buildJobSearchCriteria.bind(this),
      query,
      filters,
      baseAggregation,
      skip,
      limit,
      options
    );
  }

  async buildJobSearchCriteria(query, filters) {
    const criteria = {
      status: "Published",
      expiresAt: { $gt: new Date() }, // Only show non-expired jobs
    };

    if (query) {
      // Always use regex search to avoid text score metadata errors
      // MongoDB text search is causing issues in the aggregation pipeline
      logger.info(`Using regex search for job term: ${query}`);

      // Get synonyms and fuzzy matches for the query
      const { synonyms: synonymsList } = getSynonyms(query);
      const { matches: fuzzyMatches } = getFuzzyMatches(query);

      // Combine all possible search terms
      const allSearchTerms = [query, ...fuzzyMatches, ...synonymsList];

      // Create regex pattern for matching
      const partialPattern = new RegExp(query, "i");

      // Initialize $or array for search criteria
      criteria.$or = [];

      // Add exact match criteria with highest priority
      criteria.$or.push(
        // Highest priority: Exact title match
        { title: { $regex: `^${query}$`, $options: "i" } },

        // High priority: Exact skill match
        { skills: { $regex: `\\b${query}\\b`, $options: "i" } }
      );

      // Add partial match criteria with medium priority
      criteria.$or.push(
        // Medium-high priority: Title contains query
        { title: partialPattern },

        // Medium priority: Skills contain query
        { skills: partialPattern },

        // Medium priority: Company name
        { "company.name": partialPattern },

        // Medium priority: Location
        { location: partialPattern },

        // Medium priority: Job type
        { jobType: partialPattern },

        // Lower priority: Description (can contain many words)
        { description: partialPattern }
      );

      // If we have fuzzy matches and synonyms, add them to the search criteria
      if (allSearchTerms && allSearchTerms.length > 1) {
        // Skip the first item which is the original query
        const additionalTerms = allSearchTerms.slice(1);

        // Add fuzzy match criteria with lower priority
        additionalTerms.forEach((term) => {
          if (term !== query) { // Skip the original query
            const fuzzyPattern = new RegExp(term, "i");
            criteria.$or.push(
              // Lower priority: Fuzzy title match
              { title: fuzzyPattern },

              // Lower priority: Fuzzy skill match
              { skills: fuzzyPattern },

              // Lower priority: Fuzzy company name match
              { "company.name": fuzzyPattern }
            );
          }
        });
      }

      // For multi-word queries, add criteria to match individual words
      const words = query.split(/\s+/).filter((word) => word.length > 2);
      if (words.length > 1) {
        words.forEach((word) => {
          const wordPattern = new RegExp(`\\b${word}\\b`, "i");
          criteria.$or.push(
            { title: wordPattern },
            { skills: wordPattern },
            { description: wordPattern }
          );
        });
      }
    }

    // Add job-specific filters
    if (filters.jobType) criteria.jobType = filters.jobType;
    if (filters.locationType) criteria.locationType = filters.locationType;
    if (filters.experienceLevel)
      criteria.experienceLevel = filters.experienceLevel;
    if (filters.postedBy)
      criteria.postedBy = new mongoose.Types.ObjectId(String(filters.postedBy));

    return criteria;
  }

  // Search projects
  async searchProjects(query, filters, baseAggregation, skip, limit) {
    // Define project-specific search options
    const options = {
      lookups: [
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
          },
        }
      ],
      projections: {
        _id: 1,
        title: 1,
        description: 1,
        thumbnail: 1,
        technologies: 1,
        category: 1,
        visibility: 1,
        owner: 1,
        createdAt: 1,
        ownerDetails: {
          _id: 1,
          name: 1,
          username: 1,
          profilePicture: 1,
        },
      },
      fieldWeights: {
        title: 10,
        technologies: 9,
        category: 7,
        description: 5
      },
      boostFactors: {
        recency: 0.25,
        views: 0.15,
        complexity: 0.1
      },
      blendFactor: 0.3,
      cacheTTL: 300 // 5 minutes
    };

    // Use the common search method
    return this.commonSearch(
      'projects',
      Project,
      this.buildProjectSearchCriteria.bind(this),
      query,
      filters,
      baseAggregation,
      skip,
      limit,
      options
    );
  }

  async buildProjectSearchCriteria(query, filters) {
    const criteria = { visibility: "public" };

    if (query) {
      // Always use regex search to avoid text score metadata errors
      // MongoDB text search is causing issues in the aggregation pipeline
      logger.info(`Using regex search for project term: ${query}`);

      // Get synonyms and fuzzy matches for the query
      const { synonyms: synonymsList } = getSynonyms(query);
      const { matches: fuzzyMatches } = getFuzzyMatches(query);

      // Combine all possible search terms
      const allSearchTerms = [query, ...fuzzyMatches, ...synonymsList];

      // Create regex pattern for matching
      const partialPattern = new RegExp(query, "i");

      // Initialize $or array for search criteria
      criteria.$or = [];

      // Add exact match criteria with highest priority
      criteria.$or.push(
        // Highest priority: Exact title match
        { title: { $regex: `^${query}$`, $options: "i" } },

        // High priority: Exact technology match
        { technologies: { $regex: `\\b${query}\\b`, $options: "i" } }
      );

      // Add partial match criteria with medium priority
      criteria.$or.push(
        // Medium-high priority: Title contains query
        { title: partialPattern },

        // Medium priority: Technologies contain query
        { technologies: partialPattern },

        // Medium priority: Category
        { "category.name": partialPattern },

        // Lower priority: Description (can contain many words)
        { description: partialPattern }
      );

      // If we have fuzzy matches and synonyms, add them to the search criteria
      if (allSearchTerms && allSearchTerms.length > 1) {
        // Skip the first item which is the original query
        const additionalTerms = allSearchTerms.slice(1);

        // Add fuzzy match criteria with lower priority
        additionalTerms.forEach((term) => {
          if (term !== query) { // Skip the original query
            const fuzzyPattern = new RegExp(term, "i");
            criteria.$or.push(
              // Lower priority: Fuzzy title match
              { title: fuzzyPattern },

              // Lower priority: Fuzzy technology match
              { technologies: fuzzyPattern }
            );
          }
        });
      }

      // For multi-word queries, add criteria to match individual words
      const words = query.split(/\s+/).filter((word) => word.length > 2);
      if (words.length > 1) {
        words.forEach((word) => {
          const wordPattern = new RegExp(`\\b${word}\\b`, "i");
          criteria.$or.push(
            { title: wordPattern },
            { technologies: wordPattern },
            { description: wordPattern }
          );
        });
      }
    }

    // Add project-specific filters
    if (filters.category) criteria.category = filters.category;
    if (filters.owner)
      criteria.owner = new mongoose.Types.ObjectId(String(filters.owner));

    return criteria;
  }

  // Search users
  async searchUsers(query, filters, baseAggregation, skip, limit) {
    // Define user-specific search options
    const options = {
      // Transform the aggregation pipeline for users
      transformAggregation: (stage) => {
        if (stage.$addFields && stage.$addFields.titleScore) {
          return {
            $addFields: {
              ...stage.$addFields,
              // Add a virtual fullName field for scoring
              fullName: {
                $concat: [
                  { $ifNull: ["$firstName", ""] },
                  " ",
                  { $ifNull: ["$lastName", ""] },
                ],
              },
              titleScore: {
                $add: [
                  // Score for first name match
                  {
                    $cond: {
                      if: query
                        ? {
                            $regexMatch: {
                              input: { $ifNull: ["$firstName", ""] },
                              regex: query,
                              options: "i",
                            },
                          }
                        : false,
                      then: 3,
                      else: 0,
                    },
                  },
                  // Score for last name match
                  {
                    $cond: {
                      if: query
                        ? {
                            $regexMatch: {
                              input: { $ifNull: ["$lastName", ""] },
                              regex: query,
                              options: "i",
                            },
                          }
                        : false,
                      then: 3,
                      else: 0,
                    },
                  },
                  // Score for full name match (higher priority)
                  {
                    $cond: {
                      if: query
                        ? {
                            $regexMatch: {
                              input: {
                                $concat: [
                                  { $ifNull: ["$firstName", ""] },
                                  " ",
                                  { $ifNull: ["$lastName", ""] },
                                ],
                              },
                              regex: query,
                              options: "i",
                            },
                          }
                        : false,
                      then: 5,
                      else: 0,
                    },
                  },
                  // Score for username match
                  {
                    $cond: {
                      if: query
                        ? {
                            $regexMatch: {
                              input: { $ifNull: ["$username", ""] },
                              regex: query,
                              options: "i",
                            },
                          }
                        : false,
                      then: 2,
                      else: 0,
                    },
                  },
                ],
              },
            },
          };
        }
        return stage;
      },
      projections: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        fullName: 1, // Include the computed full name
        username: 1,
        profilePicture: {
          url: 1,
          publicId: 1
        },
        bio: 1,
        role: 1,
        roleCapabilities: 1,
        // Only include non-sensitive fields
        companyName: 1,
        companyRole: 1,
        socialLinks: 1,
      },
      fieldWeights: {
        firstName: 8,
        lastName: 8,
        fullName: 10,
        username: 9,
        bio: 4,
        companyName: 6,
        companyRole: 5,
        roleCapabilities: 7
      },
      boostFactors: {
        recency: 0.15,
        completeness: 0.2,  // Boost profiles that are more complete
        activity: 0.1       // Boost more active users
      },
      blendFactor: 0.25,
      entityType: 'users',
      cacheTTL: 300 // 5 minutes
    };

    // Use the common search method
    return this.commonSearch(
      'users',
      User,
      this.buildUserSearchCriteria.bind(this),
      query,
      filters,
      baseAggregation,
      skip,
      limit,
      options
    );
  }

  async buildUserSearchCriteria(query, filters) {
    // Only search for active users
    const criteria = { status: "active" };

    // Exclude current user from search results if userId is provided
    if (filters.excludeUserId) {
      criteria._id = { $ne: new mongoose.Types.ObjectId(String(filters.excludeUserId)) };
      logger.info(`User search criteria excluding user: ${filters.excludeUserId}`);
    }

    if (query) {
      // Always use regex search to avoid text score metadata errors
      // MongoDB text search is causing issues in the aggregation pipeline
      logger.info(`Using regex search for user term: ${query}`);

      // Get synonyms and fuzzy matches for the query
      const { synonyms: synonymsList } = getSynonyms(query);
      const { matches: fuzzyMatches } = getFuzzyMatches(query);

      // Combine all possible search terms
      const allSearchTerms = [query, ...fuzzyMatches, ...synonymsList];

      // Create regex pattern for matching
      const partialPattern = new RegExp(query, "i");

      // Initialize $or array for search criteria
      criteria.$or = [];

      // Add exact match criteria with highest priority
      criteria.$or.push(
        // Highest priority: Exact name matches
        { firstName: { $regex: `^${query}$`, $options: "i" } },
        { lastName: { $regex: `^${query}$`, $options: "i" } },
        { username: { $regex: `^${query}$`, $options: "i" } }
      );

      // Add partial match criteria with medium priority
      criteria.$or.push(
        // Medium-high priority: Name contains query
        { firstName: partialPattern },
        { lastName: partialPattern },
        { username: partialPattern },

        // Medium priority: Company info
        { companyName: partialPattern },
        { companyRole: partialPattern },

        // Medium priority: Role capabilities
        { "roleCapabilities.name": partialPattern },

        // Lower priority: Bio (can contain many words)
        { bio: partialPattern }
      );

      // If we have fuzzy matches and synonyms, add them to the search criteria
      if (allSearchTerms && allSearchTerms.length > 1) {
        // Skip the first item which is the original query
        const additionalTerms = allSearchTerms.slice(1);

        // Add fuzzy match criteria with lower priority
        additionalTerms.forEach((term) => {
          if (term !== query) { // Skip the original query
            const fuzzyPattern = new RegExp(term, "i");
            criteria.$or.push(
              // Lower priority: Fuzzy name matches
              { firstName: fuzzyPattern },
              { lastName: fuzzyPattern },
              { username: fuzzyPattern },

              // Lower priority: Fuzzy company info
              { companyName: fuzzyPattern },
              { companyRole: fuzzyPattern }
            );
          }
        });
      }

      // For multi-word queries, add criteria to match individual words
      const words = query.split(/\s+/).filter((word) => word.length > 2);
      if (words.length > 1) {
        words.forEach((word) => {
          const wordPattern = new RegExp(`\\b${word}\\b`, "i");
          criteria.$or.push(
            { firstName: wordPattern },
            { lastName: wordPattern },
            { bio: wordPattern }
          );
        });
      }
    }

    // Add user-specific filters
    if (filters.role) criteria.role = filters.role;

    return criteria;
  }

  // Save search history for a user
  async saveSearchHistory(userId, query, type) {
    try {
      // Check if this search already exists for this user
      const existingSearch = await SearchHistory.findOne({
        user: userId,
        query: { $regex: `^${query}$`, $options: "i" }, // Case insensitive exact match
      });

      if (existingSearch) {
        // Update existing search with new timestamp and increment count
        await SearchHistory.updateOne(
          { _id: existingSearch._id },
          {
            $set: { lastSearchedAt: new Date() },
            $inc: { count: 1 },
          }
        );
      } else {
        // Create new search history entry
        await SearchHistory.create({
          user: userId,
          query,
          type,
          count: 1,
          lastSearchedAt: new Date(),
        });
      }
    } catch (error) {
      logger.error("Error saving search history:", error);
    }
  }

  // Get spelling correction suggestions based on fuzzy matching
  async getSpellingCorrectionSuggestions(query, type = "all") {
    if (!query || query.length < 2) return [];

    try {
      // Use the calculateWordSimilarity function from searchUtils

      const spellingSuggestions = [];
      const normalizedQuery = query.toLowerCase().trim();

      // Get potential product name corrections
      if (type === "all" || type === "products") {
        // Find products with similar names using regex for efficiency
        // This is a broader search than the prefix search in getSearchSuggestions
        const potentialProducts = await Product.find({
          status: "Published",
          // Look for products that might be similar but don't start with the query
          $or: [
            {
              name: {
                $regex: normalizedQuery.split("").join(".*"),
                $options: "i",
              },
            },
            { tags: { $regex: normalizedQuery, $options: "i" } },
          ],
        })
          .limit(50)
          .select("name tags");

        // Calculate similarity scores and filter for good matches
        for (const product of potentialProducts) {
          const similarity = calculateWordSimilarity(
            normalizedQuery,
            product.name.toLowerCase()
          );

          // Only suggest corrections with high similarity (threshold: 0.7)
          if (similarity > 0.7 && similarity < 1.0) {
            // Not exact match but close
            spellingSuggestions.push({
              query: product.name,
              type: "products",
              similarity: similarity,
              isSpellingCorrection: true,
            });
          }

          // Also check tags for potential matches
          if (product.tags && Array.isArray(product.tags)) {
            for (const tag of product.tags) {
              const tagSimilarity = calculateWordSimilarity(
                normalizedQuery,
                tag.toLowerCase()
              );
              if (tagSimilarity > 0.8) {
                // Higher threshold for tags
                spellingSuggestions.push({
                  query: tag,
                  type: "products",
                  similarity: tagSimilarity,
                  isSpellingCorrection: true,
                });
              }
            }
          }
        }
      }

      // Sort by similarity score (highest first)
      spellingSuggestions.sort((a, b) => b.similarity - a.similarity);

      // Take top 3 spelling suggestions
      return spellingSuggestions.slice(0, 3);
    } catch (error) {
      logger.error("Error getting spelling correction suggestions:", error);
      return [];
    }
  }

  // Get search suggestions based on query
  async getSearchSuggestions(query, type = "all") {
    if (!query || query.length < 2) return [];

    try {
      // Get suggestions from search history (most popular searches)
      const historySuggestions = await SearchHistory.aggregate([
        {
          $match: {
            query: { $regex: `^${query}`, $options: "i" },
            ...(type !== "all" ? { type } : {}),
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, query: 1, type: 1, count: 1 } },
      ]);

      // Get entity-based suggestions (product names, job titles, etc.)
      const entitySuggestions = [];

      if (type === "all" || type === "products") {
        const productSuggestions = await Product.aggregate([
          {
            $match: {
              name: { $regex: `^${query}`, $options: "i" },
              status: "Published",
            },
          },
          { $sort: { views: -1 } },
          { $limit: 3 },
          {
            $project: {
              _id: 0,
              query: "$name",
              type: { $literal: "products" },
            },
          },
        ]);
        entitySuggestions.push(...productSuggestions);
      }

      if (type === "all" || type === "jobs") {
        const jobSuggestions = await Job.aggregate([
          {
            $match: {
              title: { $regex: `^${query}`, $options: "i" },
              status: "Published",
              expiresAt: { $gt: new Date() },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 3 },
          { $project: { _id: 0, query: "$title", type: { $literal: "jobs" } } },
        ]);
        entitySuggestions.push(...jobSuggestions);
      }

      // Get spelling correction suggestions
      const spellingSuggestions = await this.getSpellingCorrectionSuggestions(
        query,
        type
      );

      // Combine and deduplicate suggestions
      const allSuggestions = [
        ...historySuggestions,
        ...entitySuggestions,
        ...spellingSuggestions,
      ];

      // Remove duplicates (case insensitive)
      const uniqueSuggestions = [];
      const seenQueries = new Set();

      for (const suggestion of allSuggestions) {
        const lowerQuery = suggestion.query.toLowerCase();
        if (!seenQueries.has(lowerQuery)) {
          seenQueries.add(lowerQuery);
          uniqueSuggestions.push(suggestion);
        }
      }

      return uniqueSuggestions.slice(0, 8); // Limit to 8 suggestions
    } catch (error) {
      logger.error("Error getting search suggestions:", error);
      return [];
    }
  }
}

export default new GlobalSearchService();
