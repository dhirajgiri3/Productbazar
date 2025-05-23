import logger from '../../utils/logging/logger.js';

/**
 * Diversify recommendations by ensuring a mix of different sources
 * 
 * @param {Array} recommendations - Array of recommendation objects
 * @param {Object} options - Configuration options
 * @param {Number} options.limit - Maximum number of recommendations to return
 * @param {Number} options.minSourceCount - Minimum number of different sources to include
 * @param {Array} options.prioritySources - Sources to prioritize
 * @returns {Array} Diversified recommendations
 */
export const diversifyRecommendations = (recommendations, options = {}) => {
  const {
    limit = 20,
    minSourceCount = 2,
    prioritySources = ['trending', 'personalized', 'interests', 'new']
  } = options;

  if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
    return [];
  }

  // Group recommendations by source
  const bySource = {};
  recommendations.forEach(rec => {
    const source = rec.source || rec.reason || 'unknown';
    if (!bySource[source]) {
      bySource[source] = [];
    }
    bySource[source].push(rec);
  });

  const sources = Object.keys(bySource);
  const sourceCount = sources.length;

  // Log available sources
  logger.info(`Available sources before diversity enforcement: ${sourceCount}`, {
    sources,
    candidateCount: recommendations.length
  });

  // If we don't have enough source diversity, return what we have
  if (sourceCount < minSourceCount && sourceCount > 0) {
    logger.warn(`Not enough source diversity (${sourceCount}/${minSourceCount}), forcing refresh`);
  }

  // Calculate how many items to take from each source
  const itemsPerSource = Math.max(1, Math.floor(limit / Math.min(sourceCount, prioritySources.length)));
  
  // Sort sources by priority
  const sortedSources = [...sources].sort((a, b) => {
    const aIndex = prioritySources.indexOf(a);
    const bIndex = prioritySources.indexOf(b);
    
    // If both sources are in priority list, sort by priority
    if (aIndex >= 0 && bIndex >= 0) {
      return aIndex - bIndex;
    }
    
    // If only one source is in priority list, prioritize it
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;
    
    // If neither source is in priority list, keep original order
    return 0;
  });

  // Build diversified recommendations
  const diversified = [];
  const sourceDistribution = {};
  
  // First pass: take itemsPerSource from each source
  for (const source of sortedSources) {
    const sourceRecs = bySource[source] || [];
    const toTake = Math.min(sourceRecs.length, itemsPerSource);
    
    if (toTake > 0) {
      // Sort by score within each source
      const sorted = [...sourceRecs].sort((a, b) => (b.score || 0) - (a.score || 0));
      const taken = sorted.slice(0, toTake);
      
      diversified.push(...taken);
      sourceDistribution[source] = (sourceDistribution[source] || 0) + taken.length;
    }
  }
  
  // Second pass: fill remaining slots with highest-scoring items from any source
  const remaining = limit - diversified.length;
  if (remaining > 0) {
    // Get all recommendations not already included
    const usedIds = new Set(diversified.map(r => r._id?.toString() || r.product?.toString()));
    const unused = recommendations.filter(r => !usedIds.has(r._id?.toString() || r.product?.toString()));
    
    // Sort by score
    const sorted = [...unused].sort((a, b) => (b.score || 0) - (a.score || 0));
    const additional = sorted.slice(0, remaining);
    
    // Add to result and update distribution
    for (const rec of additional) {
      const source = rec.source || rec.reason || 'unknown';
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
      diversified.push(rec);
    }
  }
  
  // Log source distribution
  logger.info(`Source diversity in recommendations: ${Object.keys(sourceDistribution).length} sources`, {
    sourceDistribution,
    totalItems: diversified.length
  });
  
  return diversified;
};

/**
 * Enhance recommendations with source information
 * 
 * @param {Array} recommendations - Array of recommendation objects
 * @param {String} source - Source identifier
 * @returns {Array} Enhanced recommendations
 */
export const tagRecommendationsWithSource = (recommendations, source) => {
  if (!recommendations || !Array.isArray(recommendations)) {
    return [];
  }
  
  return recommendations.map(rec => ({
    ...rec,
    source: source || rec.source || rec.reason || 'unknown'
  }));
};

export default {
  diversifyRecommendations,
  tagRecommendationsWithSource
};
