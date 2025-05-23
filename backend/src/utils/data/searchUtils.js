import logger from '../logging/logger.js';
import synonyms from 'synonyms';
import { semanticSimilarity } from '../data/vectorEmbeddings.js';

// Common synonyms for tech and business terms
const SYNONYMS_MAP = {
  // User names and common name variations
  'dhiraj': ['dhirajgiri', 'dhiraj giri', 'dhi', 'dhir', 'dhirajg', 'dhiraj g', 'dhirajji', 'dhirajji giri'],
  'ramesh': ['ram', 'rames', 'rame', 'rameshji', 'ramesh kumar', 'rameshk'],
  'suresh': ['sur', 'sures', 'sureshji', 'suresh kumar', 'sureshk'],
  'john': ['johnny', 'jon', 'jonathan', 'johnathan'],
  'michael': ['mike', 'mich', 'michal', 'michel'],
  'david': ['dave', 'dav', 'davey'],
  'robert': ['rob', 'bob', 'bobby', 'robby'],
  'william': ['will', 'bill', 'billy', 'willy'],
  'james': ['jim', 'jimmy', 'jamie'],
  'mary': ['maria', 'marie', 'maryann'],
  'jennifer': ['jen', 'jenny', 'jenn'],
  'elizabeth': ['liz', 'beth', 'eliza', 'lisa'],
  'sarah': ['sara', 'sarahj', 'sarahji'],
  // Common misspellings
  'javascript': ['javascrpt', 'javascipt', 'javascrip', 'javascrit', 'javscript', 'js', 'ecmascript', 'node', 'nodejs'],
  'python': ['pyton', 'pythn', 'pytho', 'phyton', 'pithon', 'py', 'backend', 'ml', 'data science'],
  'react': ['rect', 'recat', 'reactjs', 'react.js', 'frontend', 'ui'],
  'angular': ['anglar', 'angulr', 'anguler', 'angularjs', 'ng', 'frontend', 'ui'],
  'database': ['databse', 'datbase', 'datebase', 'databas', 'db', 'sql', 'nosql', 'mongodb', 'postgres'],
  'algorithm': ['algoritm', 'algorith', 'algorthm', 'algorithem'],
  'analytics': ['analtics', 'analyics', 'anlytics', 'analitycs', 'metrics', 'data', 'insights', 'statistics'],
  'marketing': ['markting', 'marketng', 'marketting', 'marketin', 'promotion', 'advertising', 'growth', 'seo'],
  'ecommerce': ['ecomerce', 'ecommerc', 'ecomerse', 'ecommerece', 'online store', 'shop', 'retail', 'marketplace'],
  'freelance': ['freelanc', 'frelanc', 'freelence', 'freelnce', 'contractor', 'independent', 'self-employed', 'gig'],
  'product': ['prodct', 'pruduct', 'prodict', 'produckt', 'item', 'solution', 'tool'],
  'design': ['desing', 'desig', 'dezign', 'designe', 'ui', 'ux', 'graphic', 'creative', 'figma', 'sketch'],
  'development': ['developent', 'developmnt', 'devlopment', 'developmet', 'coding', 'programming', 'engineering', 'software'],
  'software': ['sofware', 'softwar', 'softwre', 'softwere'],
  'technology': ['technolgy', 'tecnology', 'techology', 'technoloy'],
  'business': ['busines', 'bussiness', 'busness', 'buisness', 'company', 'startup', 'enterprise'],
  'startup': ['startap', 'startop', 'startp', 'startapp', 'venture', 'business', 'company', 'enterprise'],
  'investment': ['investmnt', 'investent', 'investmet', 'invesment'],
  'finance': ['financ', 'finace', 'finanse', 'finence', 'fintech', 'banking', 'investment', 'money', 'payment'],
  'education': ['educaton', 'educatin', 'eduction', 'educasion', 'learning', 'teaching', 'courses', 'training', 'edtech'],
  'health': ['helth', 'healt', 'healh', 'heallth', 'healthcare', 'wellness', 'medical', 'fitness'],
  'fitness': ['fitnes', 'fittness', 'fitess', 'fitnees'],
  'mobile': ['mobil', 'moble', 'mobiel', 'mobileapp', 'ios', 'android', 'app', 'smartphone'],
  'application': ['applicaton', 'applicatin', 'aplication', 'aplicaton', 'app', 'software', 'program', 'tool'],
  'website': ['websit', 'webste', 'webite', 'wbsite', 'web', 'webapp', 'internet', 'online'],
  'cloud': ['clod', 'cloude', 'clould', 'clud', 'aws', 'azure', 'gcp', 'hosting', 'saas'],
  'security': ['securty', 'securit', 'secrity', 'securety'],
  'network': ['netwrk', 'netork', 'netwok', 'nework'],
  'artificial': ['artifical', 'artifcial', 'artficial', 'artifisial'],
  'intelligence': ['inteligence', 'intellgence', 'inteligenc', 'intelligenc'],
  'machine': ['machin', 'machne', 'machien', 'macchine'],
  'learning': ['learnng', 'learing', 'learining', 'lerning'],
  // Additional Tech terms
  'typescript': ['ts', 'javascript', 'js'],
  'vue': ['vuejs', 'vue.js', 'frontend', 'ui'],
  'node': ['nodejs', 'node.js', 'javascript', 'backend'],
  'ai': ['artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural network'],
  'ml': ['machine learning', 'ai', 'data science', 'neural network'],
  'api': ['rest', 'graphql', 'endpoint', 'service'],
  'saas': ['software as a service', 'cloud', 'subscription'],
  'web': ['website', 'webapp', 'internet', 'online'],

  // Additional Business terms
  'remote': ['wfh', 'work from home', 'telecommute', 'virtual'],
  'b2b': ['business to business', 'enterprise', 'corporate'],
  'b2c': ['business to consumer', 'retail', 'direct to consumer'],
  'productivity': ['efficiency', 'workflow', 'automation', 'tools'],
  'collaboration': ['teamwork', 'communication', 'cooperation', 'coordination'],

  // Additional categories
  'data': ['analytics', 'visualization', 'insights', 'reporting', 'dashboard'],
  'communication': ['chat', 'messaging', 'email', 'video', 'conferencing'],
  'security': ['protection', 'encryption', 'privacy', 'authentication'],
  'gaming': ['games', 'entertainment', 'esports', 'virtual reality', 'ar'],
  'social': ['community', 'network', 'platform', 'sharing', 'connection'],

  // Common plurals and variations
  'jobs': ['job', 'career', 'employment', 'position', 'opportunity'],
  'products': ['product', 'item', 'solution', 'tool'],
  'services': ['service', 'offering', 'solution'],
  'tools': ['tool', 'utility', 'app', 'software'],
  'developers': ['developer', 'programmer', 'coder', 'engineer'],
  'designers': ['designer', 'creative', 'artist'],
  'companies': ['company', 'business', 'startup', 'enterprise'],
};

/**
 * Get synonyms for a given term using both the synonyms library and our custom map
 * @param {string} term - The search term
 * @returns {Object} Object with synonyms array and explanations
 */
export function getSynonyms(term) {
  if (!term || typeof term !== 'string') return { synonyms: [], explanations: {} };

  try {
    // Normalize the term
    const normalizedTerm = term.toLowerCase().trim();
    const allSynonyms = new Set();
    const explanations = {};

    // 1. Try the synonyms library first (more comprehensive)
    // Only use the synonyms library for single words, as it doesn't handle phrases well
    if (!normalizedTerm.includes(' ')) {
      try {
        // Get synonyms from the library (returns object with nouns, verbs, etc.)
        const libSynonyms = synonyms(normalizedTerm);

        // Process nouns
        if (libSynonyms && libSynonyms.n && Array.isArray(libSynonyms.n)) {
          for (const syn of libSynonyms.n) {
            allSynonyms.add(syn);
            explanations[syn] = `Noun synonym of '${normalizedTerm}'`;
          }
        }

        // Process verbs
        if (libSynonyms && libSynonyms.v && Array.isArray(libSynonyms.v)) {
          for (const syn of libSynonyms.v) {
            allSynonyms.add(syn);
            explanations[syn] = `Verb synonym of '${normalizedTerm}'`;
          }
        }

        // Process adjectives
        if (libSynonyms && libSynonyms.adj && Array.isArray(libSynonyms.adj)) {
          for (const syn of libSynonyms.adj) {
            allSynonyms.add(syn);
            explanations[syn] = `Adjective synonym of '${normalizedTerm}'`;
          }
        }
      } catch (synError) {
        logger.warn(`Synonyms library error for term '${normalizedTerm}':`, synError);
        // Continue with our custom synonyms
      }
    }

    // 2. Use our custom synonyms map as a fallback or supplement
    // Direct lookup in the synonyms map
    if (SYNONYMS_MAP[normalizedTerm]) {
      for (const syn of SYNONYMS_MAP[normalizedTerm]) {
        allSynonyms.add(syn);
        explanations[syn] = `Domain-specific synonym of '${normalizedTerm}'`;
      }
    }

    // Check if the term is a synonym in our map and return the key terms
    for (const [key, synonymsList] of Object.entries(SYNONYMS_MAP)) {
      if (synonymsList.includes(normalizedTerm)) {
        allSynonyms.add(key);
        explanations[key] = `Related term for '${normalizedTerm}'`;

        // Also add other synonyms of this key
        for (const syn of synonymsList.filter(s => s !== normalizedTerm)) {
          allSynonyms.add(syn);
          explanations[syn] = `Related to '${normalizedTerm}' via '${key}'`;
        }
      }
    }

    // 3. For multi-word queries, get synonyms for each word
    if (normalizedTerm.includes(' ')) {
      const words = normalizedTerm.split(' ');
      for (const word of words) {
        if (word.length > 3) { // Only consider meaningful words
          // Try synonyms library for each word
          try {
            const wordSynonyms = synonyms(word);
            if (wordSynonyms && wordSynonyms.n && Array.isArray(wordSynonyms.n)) {
              for (const syn of wordSynonyms.n.slice(0, 3)) { // Limit to top 3
                const newTerm = normalizedTerm.replace(word, syn);
                allSynonyms.add(newTerm);
                explanations[newTerm] = `Word replacement: '${word}' → '${syn}'`;
              }
            }
          } catch (e) {
            // Silently continue if word not found
          }

          // Try our custom map
          if (SYNONYMS_MAP[word]) {
            for (const syn of SYNONYMS_MAP[word].slice(0, 3)) { // Limit to top 3
              const newTerm = normalizedTerm.replace(word, syn);
              allSynonyms.add(newTerm);
              explanations[newTerm] = `Domain term replacement: '${word}' → '${syn}'`;
            }
          }
        }
      }
    }

    // Return unique synonyms with explanations
    const result = Array.from(allSynonyms);
    return {
      synonyms: result,
      explanations: explanations
    };
  } catch (error) {
    logger.error('Error getting synonyms:', error);
    return { synonyms: [], explanations: {} };
  }
}

/**
 * Get fuzzy matches for a given term (handles typos, plurals, etc.)
 * @param {string} term - The search term
 * @returns {Object} Object with fuzzy matches array and explanations
 */
export function getFuzzyMatches(term) {
  if (!term || typeof term !== 'string') return { matches: [], explanations: {} };

  try {
    const normalizedTerm = term.toLowerCase().trim();
    const fuzzyMatches = [];
    const explanations = {};

    // Handle common plurals
    if (normalizedTerm.endsWith('s')) {
      const singular = normalizedTerm.slice(0, -1);
      fuzzyMatches.push(singular); // Remove 's'
      explanations[singular] = `Singular form of '${normalizedTerm}'`;
    } else {
      const plural = normalizedTerm + 's';
      fuzzyMatches.push(plural); // Add 's'
      explanations[plural] = `Plural form of '${normalizedTerm}'`;
    }

    // Handle common suffixes
    if (normalizedTerm.endsWith('ing')) {
      // e.g., coding -> code
      const base = normalizedTerm.slice(0, -3);
      fuzzyMatches.push(base);
      explanations[base] = `Base form without 'ing' suffix`;

      const baseWithE = normalizedTerm.slice(0, -3) + 'e';
      fuzzyMatches.push(baseWithE);
      explanations[baseWithE] = `Base form with 'e' ending`;
    }

    if (normalizedTerm.endsWith('ed')) {
      // e.g., coded -> code
      const base = normalizedTerm.slice(0, -2);
      fuzzyMatches.push(base);
      explanations[base] = `Base form without 'ed' suffix`;

      const baseWithE = normalizedTerm.slice(0, -1);
      fuzzyMatches.push(baseWithE);
      explanations[baseWithE] = `Base form with 'e' ending`;
    }

    // Handle common prefixes
    if (normalizedTerm.startsWith('re')) {
      const withoutPrefix = normalizedTerm.slice(2);
      fuzzyMatches.push(withoutPrefix);
      explanations[withoutPrefix] = `Without 're' prefix`;
    }

    // Handle common typos (character swaps)
    if (normalizedTerm.length > 3) {
      for (let i = 0; i < normalizedTerm.length - 1; i++) {
        const swapped =
          normalizedTerm.slice(0, i) +
          normalizedTerm[i + 1] +
          normalizedTerm[i] +
          normalizedTerm.slice(i + 2);
        fuzzyMatches.push(swapped);
        explanations[swapped] = `Character swap: '${normalizedTerm[i]}${normalizedTerm[i+1]}' → '${normalizedTerm[i+1]}${normalizedTerm[i]}'`;
      }
    }

    // Handle missing characters (e.g., 'rmesh' -> 'ramesh')
    if (normalizedTerm.length > 2) {
      // Try inserting only vowels at each position to limit the number of variations
      const vowels = 'aeiou';
      for (let i = 0; i <= normalizedTerm.length; i++) {
        for (let j = 0; j < vowels.length; j++) {
          const withInsertedChar =
            normalizedTerm.slice(0, i) +
            vowels[j] +
            normalizedTerm.slice(i);
          fuzzyMatches.push(withInsertedChar);
          explanations[withInsertedChar] = `Added '${vowels[j]}' at position ${i}`;
        }
      }
    }

    // Handle extra characters (e.g., 'rameesh' -> 'ramesh')
    if (normalizedTerm.length > 3) {
      for (let i = 0; i < normalizedTerm.length; i++) {
        const withRemovedChar =
          normalizedTerm.slice(0, i) +
          normalizedTerm.slice(i + 1);
        fuzzyMatches.push(withRemovedChar);
        explanations[withRemovedChar] = `Removed '${normalizedTerm[i]}' at position ${i}`;
      }
    }

    // Return unique fuzzy matches with explanations
    return {
      matches: [...new Set(fuzzyMatches)],
      explanations: explanations
    };
  } catch (error) {
    logger.error('Error getting fuzzy matches:', error);
    return { matches: [], explanations: {} };
  }
}

/**
 * Calculate similarity between two words (Levenshtein distance)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
export function calculateWordSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  try {
    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Quick check for exact match
    if (s1 === s2) return 1;

    // Check if one string contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.8;
    }

    // Calculate Levenshtein distance
    const len1 = s1.length;
    const len2 = s2.length;

    // Create matrix
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    // Calculate similarity score (0-1)
    const maxLen = Math.max(len1, len2);
    const distance = matrix[len1][len2];
    const similarity = 1 - distance / maxLen;

    return similarity;
  } catch (error) {
    logger.error('Error calculating word similarity:', error);
    return 0;
  }
}

/**
 * Calculate contextual relevance score between query and document
 * @param {string} query - The search query
 * @param {Object} item - The document to score
 * @param {Object} options - Scoring options
 * @returns {Object} - Relevance scores and explanations
 */
export function calculateContextualRelevance(query, item, options = {}) {
  if (!query || !item) return { score: 0, explanations: [] };

  try {
    const {
      useSemanticSearch = true,
      fieldWeights = {
        // User fields
        firstName: 12,  // Increased weight for exact name matches
        lastName: 12,   // Increased weight for exact name matches
        fullName: 15,   // Highest weight for full name matches
        username: 10,   // Increased weight for username matches
        // Product fields
        name: 12,       // Increased weight for product name matches
        title: 12,      // Increased weight for job/project title matches
        tags: 9,        // Increased weight for tag matches
        categoryName: 7, // Increased weight for category matches
        tagline: 6,     // Increased weight for tagline matches
        description: 2, // Reduced weight for description matches (too broad)
        // Job fields
        company: 8,     // Increased weight for company matches
        skills: 9,      // Increased weight for skills matches
        location: 6,    // Maintained weight for location matches
        jobType: 5,     // Maintained weight for job type matches
        // Project fields
        technologies: 9, // Increased weight for technologies matches
        category: 7     // Maintained weight for category matches
      },
      boostFactors = {
        upvotes: 0.3,       // Increased boost for popular items
        views: 0.15,        // Increased boost for viewed items
        recency: 0.2,       // Increased boost for recent items
        featured: 6,        // Increased boost for featured items
        completeness: 0.25, // Increased boost for complete profiles
        activity: 0.15,     // Increased boost for active users
        salary: 0.2         // Maintained boost for salary
      },
      // New: Minimum relevance thresholds by field type
      minRelevanceThresholds = {
        name: 0.7,        // Higher threshold for name fields
        title: 0.7,       // Higher threshold for title fields
        tags: 0.6,        // Medium-high threshold for tags
        description: 0.8  // Very high threshold for descriptions to avoid irrelevant matches
      }
    } = options;

    const queryLower = query.toLowerCase().trim();
    const scores = {};
    const explanations = [];

    // Calculate field-specific scores
    for (const [field, weight] of Object.entries(fieldWeights)) {
      if (item[field]) {
        let fieldValue = item[field];
        let fieldScore = 0;

        // Handle different field types
        if (Array.isArray(fieldValue)) {
          // For array fields like tags
          for (const value of fieldValue) {
            if (typeof value === 'string') {
              const valueLower = value.toLowerCase();

              // Exact match
              if (valueLower === queryLower) {
                fieldScore = weight;
                explanations.push(`Exact match in ${field}: '${value}'`);
                break;
              }

              // Contains match
              if (valueLower.includes(queryLower) || queryLower.includes(valueLower)) {
                fieldScore = weight * 0.8;
                explanations.push(`Partial match in ${field}: '${value}'`);
                break;
              }

              // Semantic similarity if enabled
              if (useSemanticSearch) {
                const semScore = semanticSimilarity(queryLower, valueLower) * weight;
                if (semScore > fieldScore) {
                  fieldScore = semScore;
                  explanations.push(`Semantic match in ${field}: '${value}'`);
                }
              }
            }
          }
        } else if (typeof fieldValue === 'string') {
          const fieldValueLower = fieldValue.toLowerCase();

          // Exact match
          if (fieldValueLower === queryLower) {
            fieldScore = weight;
            explanations.push(`Exact match in ${field}: '${fieldValue.substring(0, 30)}${fieldValue.length > 30 ? '...' : ''}' `);
          }
          // Contains match
          else if (fieldValueLower.includes(queryLower)) {
            fieldScore = weight * 0.8;
            explanations.push(`Contains '${query}' in ${field}`);
          }
          // Query contains field value
          else if (queryLower.includes(fieldValueLower)) {
            fieldScore = weight * 0.7;
            explanations.push(`${field} '${fieldValue}' is part of your search`);
          }
          // Semantic similarity if enabled
          else if (useSemanticSearch) {
            // Calculate semantic similarity score
            const semScore = semanticSimilarity(queryLower, fieldValueLower) * weight;

            // Determine field category for threshold selection
            let fieldCategory = 'description'; // Default to highest threshold
            if (field === 'name' || field === 'title' || field === 'firstName' ||
                field === 'lastName' || field === 'fullName' || field === 'username') {
              fieldCategory = 'name';
            } else if (field === 'tags' || field === 'skills' || field === 'technologies') {
              fieldCategory = 'tags';
            }

            // Get appropriate threshold based on field category
            const threshold = minRelevanceThresholds[fieldCategory] || 0.6;

            // Calculate normalized score (0-1 scale)
            const normalizedScore = semScore / weight;

            // Only count if score exceeds threshold and is better than existing score
            if (normalizedScore >= threshold && semScore > fieldScore) {
              // For user name fields, be even more strict
              if ((field === 'firstName' || field === 'lastName' || field === 'username' || field === 'fullName')) {
                // For name fields, require very high similarity (0.8+) or exact substring match
                if (normalizedScore >= 0.8 ||
                    fieldValueLower.includes(queryLower) ||
                    queryLower.includes(fieldValueLower)) {
                  fieldScore = semScore;
                  explanations.push(`Strong match in ${field}`);
                }
              } else {
                fieldScore = semScore;
                explanations.push(`Semantically similar to ${field}`);
              }
            }
          }
        }

        scores[field] = fieldScore;
      }
    }

    // Calculate boost factors
    let boostScore = 0;

    // Upvotes boost
    if (item.upvotes || (item.upvotes === 0)) {
      const upvoteCount = typeof item.upvotes === 'number' ? item.upvotes :
                         (Array.isArray(item.upvotes) ? item.upvotes.length : 0);
      const upvoteBoost = Math.min(upvoteCount * boostFactors.upvotes, 10); // Cap at 10
      boostScore += upvoteBoost;

      if (upvoteCount > 10) {
        explanations.push(`Popular with ${upvoteCount} upvotes`);
      }
    }

    // Views boost
    if (item.views) {
      const viewCount = typeof item.views === 'number' ? item.views :
                       (item.views.count || 0);
      const viewsBoost = Math.min(viewCount * boostFactors.views / 10, 5); // Cap at 5
      boostScore += viewsBoost;

      if (viewCount > 100) {
        explanations.push(`Frequently viewed (${viewCount} views)`);
      }
    }

    // Recency boost
    if (item.createdAt) {
      const ageInDays = (new Date() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24);
      const recencyBoost = ageInDays < 30 ? (30 - ageInDays) * boostFactors.recency / 10 : 0;
      boostScore += recencyBoost;

      if (ageInDays < 7) {
        explanations.push('Recently added');
      }
    }

    // Featured boost
    if (item.featured) {
      boostScore += boostFactors.featured;
      explanations.push('Featured item');
    }

    // Calculate total score
    const fieldScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const totalScore = fieldScore + boostScore;

    return {
      score: totalScore,
      fieldScore,
      boostScore,
      fieldScores: scores,
      explanations: explanations.slice(0, 3) // Limit to top 3 explanations
    };
  } catch (error) {
    logger.error('Error calculating contextual relevance:', error);
    return { score: 0, explanations: [] };
  }
}

/**
 * Generate explanation text for why a search result matched the query
 * @param {string} query - The search query
 * @param {Object} item - The search result item
 * @param {Object} searchRelevance - The search relevance information
 * @returns {string} Explanation text
 */
export function generateSearchExplanation(query, item, searchRelevance) {
  if (!query || !item || !searchRelevance) return '';

  try {
    const explanations = [];
    const queryLower = query.toLowerCase();
    const name = item.name || item.title || '';

    // Check for exact match (highest priority)
    if (name.toLowerCase() === queryLower) {
      return `Exact match for your search term '${query}'`;
    }

    // Check for fuzzy match
    if (searchRelevance.fuzzyMatch) {
      explanations.push(`Similar to your search term '${query}'`);
    }

    // Check for specific field matches
    if (searchRelevance.titleMatch) {
      explanations.push(`The ${item.name ? 'name' : 'title'} contains '${query}'`);
    }

    if (searchRelevance.tagMatch) {
      const matchingTags = item.tags?.filter(tag =>
        tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())
      );
      if (matchingTags && matchingTags.length > 0) {
        explanations.push(`Tagged with '${matchingTags[0]}'`);
      } else {
        explanations.push('Matches a tag');
      }
    }

    if (searchRelevance.categoryMatch) {
      explanations.push(`In the '${item.categoryName || 'matching'}' category`);
    }

    if (searchRelevance.taglineMatch) {
      explanations.push('Matches the tagline description');
    }

    if (searchRelevance.descriptionMatch) {
      explanations.push('Found in the detailed description');
    }

    // If we have synonym matches
    if (searchRelevance.synonymMatch) {
      explanations.push(`'${query}' is related to '${searchRelevance.synonymTerm || 'terms in this item'}'`);
    }

    // If no specific explanations, provide a generic one based on primaryMatchReason
    if (explanations.length === 0 && searchRelevance.primaryMatchReason) {
      switch (searchRelevance.primaryMatchReason) {
        case 'name':
          explanations.push(`Matches the ${item.name ? 'name' : 'title'}`);
          break;
        case 'tag':
          explanations.push('Matches a tag');
          break;
        case 'category':
          explanations.push('Matches the category');
          break;
        case 'tagline':
          explanations.push('Matches the tagline');
          break;
        case 'description':
          explanations.push('Found in the description');
          break;
        default:
          explanations.push('Relevant to your search');
      }
    }

    // If still no explanations, provide a generic one
    if (explanations.length === 0) {
      explanations.push('Relevant to your search query');
    }

    // Add engagement information if available
    if (item.upvotes > 10 || (item.views && item.views.count > 100)) {
      explanations.push('Popular item with high engagement');
    }

    // Return the top 2 explanations joined with ' • '
    return explanations.slice(0, 2).join(' • ');
  } catch (error) {
    logger.error('Error generating search explanation:', error);
    return 'Relevant to your search';
  }
}

/**
 * Rank search results using advanced relevance scoring
 * @param {string} query - The search query
 * @param {Array<Object>} items - The items to rank
 * @param {Object} options - Ranking options
 * @returns {Array<Object>} - Ranked items with scores and explanations
 */
export function rankSearchResults(query, items, options = {}) {
  if (!query || !items || !Array.isArray(items)) {
    return [];
  }

  try {
    const {
      useSemanticSearch = true,
      minScore = 0.1,
      includeScores = false,
      limit = 50
    } = options;

    // Calculate relevance scores for each item
    const scoredItems = items.map(item => {
      const relevance = calculateContextualRelevance(query, item, {
        useSemanticSearch,
        ...options
      });

      return {
        item,
        score: relevance.score,
        explanations: relevance.explanations,
        ...(includeScores ? { relevance } : {})
      };
    });

    // Filter by minimum score and sort by score
    return scoredItems
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(result => {
        // Generate explanation text
        const explanationText = result.explanations.slice(0, 2).join(' • ');

        return {
          ...result.item,
          explanationText,
          ...(includeScores ? { searchScore: result.score } : {})
        };
      });
  } catch (error) {
    logger.error('Error ranking search results:', error);
    return items.slice(0, limit); // Return original items as fallback
  }
}

/**
 * Default export for all search utilities
 */
export default {
  getSynonyms,
  getFuzzyMatches,
  calculateWordSimilarity,
  generateSearchExplanation,
  calculateContextualRelevance,
  rankSearchResults,
  semanticSimilarity
};
