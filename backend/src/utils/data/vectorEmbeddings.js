/**
 * Vector Embeddings Utility for Semantic Search
 *
 * This utility provides functions to generate and compare vector embeddings
 * for semantic search capabilities. It uses a simple but effective approach
 * to create word embeddings based on word co-occurrence and TF-IDF principles.
 */

import logger from '../logging/logger.js';

// Dimensionality of our vector space
const VECTOR_DIMENSIONS = 100;

// Cache for document vectors to avoid recalculating
const vectorCache = new Map();

/**
 * Generate a simple vector embedding for a text string
 * @param {string} text - The text to generate an embedding for
 * @returns {Float32Array} - Vector embedding
 */
export function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    return new Float32Array(VECTOR_DIMENSIONS);
  }

  try {
    // Normalize text
    const normalizedText = text.toLowerCase().trim();

    // Simple hash function to map words to vector dimensions
    const hashWord = (word) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      return Math.abs(hash) % VECTOR_DIMENSIONS;
    };

    // Create vector
    const vector = new Float32Array(VECTOR_DIMENSIONS);

    // Split into words and process
    const words = normalizedText.split(/\s+/);
    const wordCounts = new Map();

    // Count word frequencies (term frequency)
    for (const word of words) {
      if (word.length < 2) continue; // Skip very short words
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    // Calculate vector based on word frequencies and positions
    for (const [word, count] of wordCounts.entries()) {
      // Get vector dimension for this word
      const dimension = hashWord(word);

      // Weight by term frequency and inverse document frequency approximation
      // Words that are less common get higher weights
      const weight = count * (1 + Math.log(1 + word.length / 3));

      // Add to vector
      vector[dimension] += weight;
    }

    // Normalize vector to unit length
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }

    return vector;
  } catch (error) {
    logger.error('Error generating vector embedding:', error);
    return new Float32Array(VECTOR_DIMENSIONS);
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Float32Array} vec1 - First vector
 * @param {Float32Array} vec2 - Second vector
 * @returns {number} - Similarity score (0-1)
 */
export function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }

  try {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (mag1 * mag2);
  } catch (error) {
    logger.error('Error calculating cosine similarity:', error);
    return 0;
  }
}

/**
 * Calculate semantic similarity between two text strings
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} - Similarity score (0-1)
 */
export function semanticSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  try {
    const vec1 = generateEmbedding(text1);
    const vec2 = generateEmbedding(text2);

    return cosineSimilarity(vec1, vec2);
  } catch (error) {
    logger.error('Error calculating semantic similarity:', error);
    return 0;
  }
}

/**
 * Get vector embedding for a document with caching
 * @param {Object} document - Document to generate embedding for
 * @param {string} idField - Field to use as document ID
 * @param {Array<string>} textFields - Fields to include in the embedding
 * @returns {Float32Array} - Vector embedding
 */
export function getDocumentVector(document, idField = '_id', textFields = ['name', 'description']) {
  if (!document || !document[idField]) {
    return new Float32Array(VECTOR_DIMENSIONS);
  }

  try {
    const docId = document[idField].toString();

    // Check cache first
    if (vectorCache.has(docId)) {
      return vectorCache.get(docId);
    }

    // Combine all text fields
    let combinedText = '';
    for (const field of textFields) {
      if (document[field]) {
        combinedText += ' ' + document[field];
      }
    }

    // Add tags with higher weight (repeat them to increase importance)
    if (document.tags && Array.isArray(document.tags)) {
      combinedText += ' ' + document.tags.join(' ') + ' ' + document.tags.join(' ');
    }

    // Add category with higher weight
    if (document.categoryName) {
      combinedText += ' ' + document.categoryName + ' ' + document.categoryName;
    }

    const vector = generateEmbedding(combinedText);

    // Cache the result (limit cache size to prevent memory issues)
    if (vectorCache.size > 10000) {
      // Remove oldest entries if cache gets too large
      const oldestKey = vectorCache.keys().next().value;
      vectorCache.delete(oldestKey);
    }
    vectorCache.set(docId, vector);

    return vector;
  } catch (error) {
    logger.error('Error getting document vector:', error);
    return new Float32Array(VECTOR_DIMENSIONS);
  }
}

/**
 * Find semantically similar documents
 * @param {string} query - Search query
 * @param {Array<Object>} documents - Array of documents to search
 * @param {Object} options - Search options
 * @returns {Array<Object>} - Ranked documents with similarity scores
 */
export function findSimilarDocuments(query, documents, options = {}) {
  if (!query || !documents || !Array.isArray(documents)) {
    return [];
  }

  const {
    idField = '_id',
    textFields = ['name', 'description'],
    threshold = 0.5, // Increased threshold for better quality matches
    limit = 20,
    entityType = null // Optional entity type for type-specific thresholds
  } = options;

  // Type-specific thresholds for different entity types
  const typeThresholds = {
    products: 0.45,
    users: 0.65,    // Higher threshold for users to avoid irrelevant matches
    jobs: 0.5,
    projects: 0.5
  };

  // Use type-specific threshold if available
  const effectiveThreshold = entityType && typeThresholds[entityType] ?
    typeThresholds[entityType] : threshold;

  try {
    // Generate query vector
    const queryVector = generateEmbedding(query);

    // Calculate similarity for each document
    const results = documents.map(doc => {
      const docVector = getDocumentVector(doc, idField, textFields);
      const similarity = cosineSimilarity(queryVector, docVector);

      return {
        document: doc,
        similarity
      };
    });

    // Filter by threshold and sort by similarity
    return results
      .filter(result => {
        // Apply stricter filtering for certain fields
        if (result.document.name || result.document.firstName ||
            result.document.lastName || result.document.title) {
          // For name/title fields, require higher similarity or exact substring match
          const nameValue = result.document.name ||
                          result.document.title ||
                          `${result.document.firstName || ''} ${result.document.lastName || ''}`.trim();

          if (nameValue) {
            const nameLower = nameValue.toLowerCase();
            const queryLower = query.toLowerCase();

            // Allow lower similarity if there's a direct substring match
            if (nameLower.includes(queryLower) || queryLower.includes(nameLower)) {
              return result.similarity >= (effectiveThreshold * 0.8); // 20% lower threshold for substring matches
            }
          }
        }

        // Default threshold check
        return result.similarity >= effectiveThreshold;
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    logger.error('Error finding similar documents:', error);
    return [];
  }
}

/**
 * Clear the vector cache
 */
export function clearVectorCache() {
  vectorCache.clear();
}

export default {
  generateEmbedding,
  cosineSimilarity,
  semanticSimilarity,
  getDocumentVector,
  findSimilarDocuments,
  clearVectorCache
};
