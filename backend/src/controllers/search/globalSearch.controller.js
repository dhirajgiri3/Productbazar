import globalSearchService from '../../Services/Search/globalSearch.service.js';
import { AppError } from '../../utils/logging/error.js';
import logger from '../../utils/logging/logger.js';
import SearchHistory from '../../models/search/searchHistory.model.js';

export const globalSearch = async (req, res, next) => {
  try {
    const {
      q: query,
      type,
      page,
      limit,
      natural_language,
      ...filters
    } = req.query;

    // If no query provided, return empty results
    if (!query || !query.trim()) {
      return res.status(200).json({
        success: true,
        results: {},
        counts: {},
        totalResults: 0,
        suggestions: []
      });
    }

    // Log the user ID for debugging
    logger.info(`Search request from user: ${req.user?._id || 'anonymous'}`);

    const searchResults = await globalSearchService.search({
      query,
      type,
      filters,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      naturalLanguage: natural_language === 'true',
      userId: req.user?._id // Pass user ID for search history
    });

    // Cache results for 5 minutes
    res.set('Cache-Control', 'public, max-age=300');

    res.status(200).json(searchResults);
  } catch (error) {
    logger.error('Global search error:', error);
    next(new AppError('Search operation failed', 500));
  }
};

/**
 * Get search suggestions based on partial query
 * @route GET /api/v1/search/suggestions
 * @access Public
 */
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q: query, type = 'all' } = req.query;

    if (!query || query.length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = await globalSearchService.getSearchSuggestions(query, type);

    res.status(200).json({
      success: true,
      suggestions
    });
  } catch (error) {
    logger.error('Search suggestions error:', error);
    next(new AppError('Failed to get search suggestions', 500));
  }
};

/**
 * Get user's recent searches
 * @route GET /api/v1/search/history
 * @access Private
 */
export const getSearchHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const history = await SearchHistory.find({ user: req.user._id })
      .sort({ lastSearchedAt: -1 })
      .limit(10)
      .select('query type lastSearchedAt -_id');

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    logger.error('Search history error:', error);
    next(new AppError('Failed to get search history', 500));
  }
};

/**
 * Clear user's search history
 * @route DELETE /api/v1/search/history
 * @access Private
 */
export const clearSearchHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    await SearchHistory.deleteMany({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: 'Search history cleared successfully'
    });
  } catch (error) {
    logger.error('Clear search history error:', error);
    next(new AppError('Failed to clear search history', 500));
  }
};
