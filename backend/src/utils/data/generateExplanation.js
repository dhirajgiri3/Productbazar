// file: backend/Utils/generateExplanation.js
import logger from "../logging/logger.js";

/**
 * Check if product is new
 */
export const isNewProduct = (product, days = 30) => {
  if (!product?.createdAt) return false;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  return new Date(product.createdAt) > daysAgo;
};

/**
 * Calculate days since creation
 */
export const getDaysOld = (date) => {
  if (!date) return 0;
  const createdAt = new Date(date);
  const now = new Date();
  return Math.ceil(Math.abs(now - createdAt) / (1000 * 60 * 60 * 24));
};

/**
 * Extract product data safely
 */
const extractProductData = (product) => {
  if (!product) return {};

  try {
    return {
      name: product.name || "",
      tagline: product.tagline || "",
      description: product.description || "",
      categoryName: product.category?.name || "this category",
      categoryId: product.category?._id?.toString() || "",
      makerName: product.maker?.firstName
        ? `${product.maker.firstName} ${product.maker.lastName || ""}`.trim()
        : "this maker",
      makerId: product.maker?._id?.toString() || "",
      tags: Array.isArray(product.tags) ? product.tags : [],
      upvoteCount: product.upvoteCount || 0,
      views: product.views?.count || 0,
      commentCount: product.commentCount || product.comments?.length || 0,
      createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
      daysOld: product.createdAt ? getDaysOld(product.createdAt) : 0,
    };
  } catch (error) {
    logger.warn(`Error extracting product data: ${error.message}`);
    return {};
  }
};

/**
 * Get deterministic item from array based on product ID and data
 * This ensures the same product with the same data always gets the same explanation
 */
const getDeterministicItem = (array, product, additionalData = {}) => {
  if (!array || !array.length) return null;

  // Create a deterministic hash from product ID and relevant data
  const productId = product?._id?.toString() || '';
  const upvotes = product?.upvoteCount || 0;
  const views = product?.views?.count || 0;
  const daysOld = product?.createdAt ? getDaysOld(product.createdAt) : 0;

  // Include any additional data that might affect the explanation
  const additionalString = Object.values(additionalData).join('');

  // Create a simple hash from the combined string
  const combinedString = `${productId}-${upvotes}-${views}-${daysOld}-${additionalString}`;
  let hash = 0;
  for (let i = 0; i < combinedString.length; i++) {
    hash = ((hash << 5) - hash) + combinedString.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use the absolute hash value modulo array length to select an item
  const index = Math.abs(hash) % array.length;
  return array[index];
};

/**
 * Generates a human-readable explanation for why a product is being recommended
 * @param {Object} product - The product being recommended
 * @param {Object|string} context - Either a strategy type string or a context object
 * @param {number|Object} score - Either a score number or a scoring data object
 * @param {Object} userContext - Optional user context data
 * @returns {string} Human-readable explanation
 */
export const generateScoreExplanation = (
  product,
  context,
  score,
  userContext = {}
) => {
  if (!product) return "Recommended product";

  try {
    // Handle flexible parameter structure
    let strategyType =
      typeof context === "string" ? context : context?.reason || "default";
    let scoringData = {};

    // Handle score parameter whether it's a number or object
    if (typeof score === "number") {
      scoringData.normalizedScore = score;
    } else if (typeof score === "object") {
      scoringData = score;
    }

    // Extract more data from context if it's an object
    if (typeof context === "object") {
      scoringData = {
        ...scoringData,
        similarToProduct: context.similarToProduct,
        userPreferences: context.userPreferences,
        userHistory: context.userHistory,
        timeContext: context.timeContext,
        similarityFeatures: context.similarityFeatures || {},
        tags: context.tags || [],
      };
    }

    // Ensure user context exists
    userContext = userContext || {};

    // Extract product data safely
    const productData = extractProductData(product);

    // Select explanation template based on strategy with fallbacks
    switch (strategyType) {
      case "trending":
        return generateTrendingExplanation(product, scoringData, productData);
      case "new":
        return generateNewProductExplanation(product, scoringData, productData);
      case "similar":
        return generateSimilarityExplanation(product, scoringData, productData);
      case "personalized":
        return generatePersonalizedExplanation(
          product,
          scoringData,
          userContext,
          productData
        );
      case "category":
        return generateCategoryExplanation(product, scoringData, productData);
      case "tag":
        return generateTagExplanation(product, scoringData, productData);
      case "maker":
        return generateMakerExplanation(product, scoringData, productData);
      case "history":
        return generateHistoryExplanation(
          product,
          scoringData,
          userContext,
          productData
        );
      case "collaborative":
        return generateCollaborativeExplanation(
          product,
          scoringData,
          userContext,
          productData
        );
      case "interest":
        return generateInterestExplanation(
          product,
          scoringData,
          userContext,
          productData
        );
      case "discovery":
        return generateDiscoveryExplanation(product, scoringData, productData);
      default:
        return generateDefaultExplanation(product, productData);
    }
  } catch (error) {
    logger.error(`Error generating explanation: ${error.message}`, {
      stack: error.stack,
      productId: product?._id?.toString(),
    });

    // Provide a fallback explanation that's still somewhat useful
    const category = product?.category?.name || "products like this";
    return `Recommended based on your interest in ${category}`;
  }
};

/**
 * Generates explanation for trending products with variety and specific metrics
 */
const generateTrendingExplanation = (product, scoringData, productData) => {
  const { normalizedScore = 0 } = scoringData;
  const { upvoteCount, views, daysOld, categoryName } = productData;

  // Create a variety of explanations based on the product's stats
  const explanations = [];

  // Very hot products
  if (normalizedScore > 0.85) {
    explanations.push(
      ` Trending now with ${upvoteCount} upvotes in the last week!`
    );
    explanations.push(
      `🔥 Gaining massive popularity with ${views} views recently!`
    );
    explanations.push(
      `🔥 Currently trending in ${categoryName} with high engagement`
    );
  }
  // Strong trending products
  else if (normalizedScore > 0.7) {
    explanations.push(
      ` Popular and gaining traction with ${upvoteCount} upvotes`
    );
    explanations.push(
      ` Trending product with ${views} views in the last few days`
    );
    explanations.push(
      `Trending in the ${categoryName} category with ${upvoteCount} upvotes`
    );
  }
  // Products with high engagement
  else if (upvoteCount > 20 || views > 100) {
    explanations.push(
      ` Popular with ${upvoteCount} upvotes from the Product Bazar community`
    );
    explanations.push(` Getting attention with ${views} views recently`);
    explanations.push(
      ` Popular ${categoryName} product with ${upvoteCount} upvotes`
    );
  }
  // New and rising products
  else if (daysOld < 14 && (upvoteCount > 5 || views > 30)) {
    explanations.push(
      `⭐ New product gaining momentum with ${upvoteCount} upvotes in just ${daysOld} days`
    );
    explanations.push(
      `⭐ Rising star in Product Bazar with ${views} views since launch ${daysOld} days ago`
    );
    explanations.push(
      `⭐ New ${categoryName} product launched ${daysOld} days ago with growing popularity`
    );
  }
  // Default trending explanations
  else {
    explanations.push(
      `📊 Trending in the community with ${upvoteCount} upvotes`
    );
    explanations.push(
      `📊 Popular ${categoryName} product with ${views} recent views`
    );
    explanations.push(
      `📊 Getting attention on Product Bazar since ${daysOld} days ago`
    );
  }

  return getDeterministicItem(explanations, product) || "Trending product";
};

/**
 * Generates explanation for new products with more detail and engagement metrics
 */
const generateNewProductExplanation = (product, scoringData, productData) => {
  const { daysOld, categoryName, makerName, upvoteCount, views } = productData;
  const explanations = [];

  if (daysOld <= 1) {
    explanations.push(
      `🆕 Just launched today! Be among the first ${views || 0} viewers`
    );
    explanations.push(
      `🆕 Brand new - launched in the last 24 hours with ${
        upvoteCount || 0
      } upvotes already!`
    );
    explanations.push(
      `🆕 Fresh ${categoryName} product launched today by ${makerName}`
    );
  } else if (daysOld <= 3) {
    explanations.push(
      `🆕 New release from ${daysOld} days ago with ${
        upvoteCount || 0
      } upvotes so far`
    );
    explanations.push(
      `🆕 Recently launched (${daysOld} days ago) and already has ${
        views || 0
      } views`
    );
    explanations.push(
      `🆕 New in ${categoryName}: launched ${daysOld} days ago by ${makerName}`
    );
  } else if (daysOld <= 7) {
    explanations.push(
      `🆕 New this week: launched ${daysOld} days ago with ${
        upvoteCount || 0
      } upvotes`
    );
    explanations.push(
      `🆕 Fresh addition to ${categoryName} (${daysOld} days ago) with ${
        views || 0
      } views`
    );
    explanations.push(
      `🆕 New from ${makerName}: launched this week and gaining ${
        upvoteCount || 0
      } upvotes`
    );
  } else if (daysOld <= 30) {
    explanations.push(
      `🆕 Recent addition to Product Bazar with ${
        upvoteCount || 0
      } upvotes in the first month`
    );
    explanations.push(
      `🆕 New ${categoryName} product this month with ${
        views || 0
      } views so far`
    );
    explanations.push(
      `🆕 Recently added by ${makerName} (${daysOld} days ago)`
    );
  } else {
    const monthsOld = Math.floor(daysOld / 30);
    explanations.push(
      `👀 Worth discovering with ${
        upvoteCount || 0
      } upvotes since launch ${monthsOld} months ago`
    );
    explanations.push(
      `👀 Notable ${categoryName} product with ${views || 0} views`
    );
    explanations.push(
      `👀 Quality product by ${makerName} with ${
        upvoteCount || 0
      } community upvotes`
    );
  }

  return getDeterministicItem(explanations, product) || "New product";
};

/**
 * Generates explanation for similar products with more context and specific metrics
 */
const generateSimilarityExplanation = (product, scoringData, productData) => {
  const { similarityFeatures = {}, similarToProduct = {} } = scoringData;
  const { categoryName, makerName, tags, upvoteCount, views } = productData;
  const explanations = [];

  // Extract similarity features either from the scoring data or calculate from similarToProduct
  const {
    commonTags = [],
    sameCategory = false,
    sameMaker = false,
  } = similarityFeatures.commonTags
    ? similarityFeatures
    : getSimilarityFeatures(similarToProduct, product);

  // From same maker
  if (sameMaker) {
    explanations.push(
      `👨‍💻 Another product by ${makerName} with ${upvoteCount || 0} upvotes`
    );
    explanations.push(
      `👨‍💻 More from maker: ${makerName} who created products you've viewed`
    );
    explanations.push(
      `👨‍💻 From the creator of products you've viewed, with ${views || 0} views`
    );
  }
  // Has common tags
  else if (commonTags?.length > 0) {
    const tag = commonTags[0];
    const tagCount = commonTags.length;
    explanations.push(
      `🏷️ Similar ${tag} product with ${tagCount} matching ${
        tagCount > 1 ? "tags" : "tag"
      }`
    );
    explanations.push(
      `🏷️ Also tagged with "${tag}" and has ${upvoteCount || 0} upvotes`
    );
    explanations.push(
      `🏷️ Related to ${tag} products you've viewed, with ${views || 0} views`
    );
  }
  // Same category
  else if (sameCategory) {
    explanations.push(
      `📁 More from the ${categoryName} category with ${
        upvoteCount || 0
      } upvotes`
    );
    explanations.push(
      `📁 Similar ${categoryName} product viewed by ${views || 0} users`
    );
    explanations.push(
      `📁 Also in ${categoryName} like products you've shown interest in`
    );
  }
  // Based on browsed product
  else if (similarToProduct?.name) {
    const referenceName =
      similarToProduct.name.length > 20
        ? similarToProduct.name.substring(0, 20) + "..."
        : similarToProduct.name;

    explanations.push(
      `🔄 Similar to "${referenceName}" with ${
        upvoteCount || 0
      } community upvotes`
    );
    explanations.push(
      `🔄 Because you viewed "${referenceName}" - ${
        views || 0
      } others also viewed this`
    );
    explanations.push(
      `🔄 Users who viewed "${referenceName}" also liked this ${categoryName} product`
    );
  }
  // General similar recommendations
  else {
    explanations.push(
      `🔄 Similar to products you've viewed with ${upvoteCount || 0} upvotes`
    );
    explanations.push(
      `🔄 Based on your recently viewed items - ${
        views || 0
      } people have viewed this`
    );
    explanations.push(
      `🔄 You might also be interested in this ${categoryName} product with ${
        upvoteCount || 0
      } upvotes`
    );
  }

  return getDeterministicItem(explanations, product, {similarToProduct: similarToProduct?._id?.toString() || ''}) || "Similar product";
};

/**
 * Get similarity features between two products
 */
const getSimilarityFeatures = (sourceProduct, targetProduct) => {
  if (!sourceProduct || !targetProduct)
    return { commonTags: [], sameCategory: false, sameMaker: false };

  const sourceTags = Array.isArray(sourceProduct.tags)
    ? sourceProduct.tags
    : [];
  const targetTags = Array.isArray(targetProduct.tags)
    ? targetProduct.tags
    : [];

  return {
    commonTags: sourceTags.filter((tag) => targetTags.includes(tag)),
    sameCategory:
      sourceProduct.category?._id?.toString() ===
      targetProduct.category?._id?.toString(),
    sameMaker:
      sourceProduct.maker?._id?.toString() ===
      targetProduct.maker?._id?.toString(),
  };
};

/**
 * Generates more personalized and specific explanations with engagement metrics
 */
const generatePersonalizedExplanation = (
  product,
  scoringData,
  userContext,
  productData
) => {
  const { categoryName, tags, makerName, upvoteCount, views, daysOld } =
    productData;
  const {
    categoryScore = 0,
    tagScore = 0,
    interactionHistory = {},
  } = scoringData;

  const { preferences = {}, history = {} } = userContext;

  const explanations = [];

  // Based on upvote history
  if (interactionHistory.hasUpvoted) {
    explanations.push(
      `👍 Based on products you've upvoted - this has ${
        upvoteCount || 0
      } upvotes from others`
    );
    explanations.push(
      `👍 Matches your taste in upvoted products with ${
        views || 0
      } views so far`
    );
    explanations.push(
      `👍 Because you like similar products - this is popular with ${
        upvoteCount || 0
      } upvotes`
    );
  }
  // Based on view history
  else if (interactionHistory.hasViewed) {
    explanations.push(
      `👁️ Based on your browsing history - ${
        views || 0
      } others have also viewed this`
    );
    explanations.push(
      `👁️ Similar to products you've viewed with ${
        upvoteCount || 0
      } community upvotes`
    );
    explanations.push(
      `👁️ Aligned with your recent interests in ${categoryName} products`
    );
  }
  // Based on category preference
  else if (categoryScore > 0.5) {
    explanations.push(
      `📁 Matches your interest in ${categoryName} with ${
        upvoteCount || 0
      } upvotes`
    );
    explanations.push(
      `📁 Recommended for your ${categoryName} interests - viewed by ${
        views || 0
      } users`
    );
    explanations.push(
      `📁 Because you engage with ${categoryName} products - this one has ${
        upvoteCount || 0
      } upvotes`
    );
  }
  // Based on tag preference
  else if (tagScore > 0.5 && tags.length > 0) {
    const tag = tags[0];
    explanations.push(
      `🏷️ Recommended because you like ${tag} products - this has ${
        upvoteCount || 0
      } upvotes`
    );
    explanations.push(
      `🏷️ Matches your interest in ${tag} with ${views || 0} views`
    );
    explanations.push(
      `🏷️ For fans of ${tag} products like you - launched ${daysOld} days ago`
    );
  }
  // Based on followed makers
  else if (preferences.followedMakers?.includes(productData.makerId)) {
    explanations.push(
      `👨‍💻 From ${makerName}, a maker you follow - with ${
        upvoteCount || 0
      } upvotes`
    );
    explanations.push(
      `👨‍💻 New from a maker you're following - viewed by ${views || 0} users`
    );
    explanations.push(
      `👨‍💻 By ${makerName}, whose work interests you - launched ${daysOld} days ago`
    );
  }
  // More general personalization
  else {
    explanations.push(
      `✨ Personalized for you based on your activity - has ${
        upvoteCount || 0
      } upvotes`
    );
    explanations.push(
      `✨ Tailored to your interests with ${
        views || 0
      } views from the community`
    );
    explanations.push(
      `✨ Matches your product preferences in ${categoryName} products`
    );
  }

  return getDeterministicItem(explanations, product, {userContext: userContext?.preferences?.userId || ''}) || "Personalized for you";
};

/**
 * Generates explanation for category-based recommendations with engagement metrics
 */
const generateCategoryExplanation = (product, scoringData, productData) => {
  const { categoryName, daysOld, upvoteCount, views, makerName } = productData;
  const { engagementScore = 0 } = scoringData;
  const explanations = [];

  // High engagement products
  if (engagementScore > 0.7 || upvoteCount > 15) {
    explanations.push(
      `📊 Popular in ${categoryName} with ${upvoteCount} upvotes`
    );
    explanations.push(
      `📊 Top-rated product in ${categoryName} with ${views || 0} views`
    );
    explanations.push(
      `📊 Trending ${categoryName} product with ${upvoteCount} community upvotes`
    );
  }
  // New category products
  else if (daysOld < 14) {
    explanations.push(
      `🆕 New addition to ${categoryName} just ${daysOld} days ago`
    );
    explanations.push(
      `🆕 Recently added to ${categoryName} with ${upvoteCount} upvotes so far`
    );
    explanations.push(
      `🆕 Fresh ${categoryName} product by ${makerName} with ${
        views || 0
      } views`
    );
  }
  // Discovery within category
  else {
    explanations.push(
      `🔍 Discover more in ${categoryName} - this has ${upvoteCount} upvotes`
    );
    explanations.push(
      `🔍 Explore this ${categoryName} product with ${views || 0} views`
    );
    explanations.push(
      `🔍 Selected ${categoryName} recommendation from ${makerName}`
    );
  }

  return getDeterministicItem(explanations, product) || `Product in ${categoryName}`;
};

/**
 * Generates explanation for tag-based recommendations with engagement metrics
 */
const generateTagExplanation = (product, scoringData, productData) => {
  const { tags, categoryName, upvoteCount, views, daysOld } = productData;
  const explanations = [];

  if (!tags.length) {
    explanations.push(
      `🏷️ Tagged with topics you follow - has ${upvoteCount || 0} upvotes`
    );
    explanations.push(`🏷️ Matches your tag interests with ${views || 0} views`);
    return getDeterministicItem(explanations, product) || "Tagged product";
  }

  // Determine which tag to highlight
  const matchedTag =
    Array.isArray(scoringData.tags) && scoringData.tags.length > 0
      ? scoringData.tags.find((t) => tags.includes(t)) || tags[0]
      : tags[0];

  explanations.push(
    `🏷️ Tagged with "${matchedTag}" and has ${upvoteCount || 0} upvotes`
  );
  explanations.push(
    `🏷️ For your interest in ${matchedTag} - viewed by ${views || 0} users`
  );
  explanations.push(
    `🏷️ ${matchedTag} product in ${categoryName} from ${daysOld} days ago`
  );

  // If there are multiple tags, mention them
  if (tags.length > 1) {
    const otherTags = tags.filter((t) => t !== matchedTag).slice(0, 2);
    if (otherTags.length > 0) {
      explanations.push(
        `🏷️ Tagged with "${matchedTag}" and ${otherTags.length} more tags - ${
          upvoteCount || 0
        } upvotes`
      );
    }
  }

  return getDeterministicItem(explanations, product, {matchedTag}) || `Tagged with ${matchedTag}`;
};

/**
 * Generates explanation for maker-based recommendations with engagement metrics
 */
const generateMakerExplanation = (product, scoringData, productData) => {
  const { makerName, categoryName, daysOld, upvoteCount, views } = productData;
  const explanations = [];

  if (daysOld < 30) {
    explanations.push(
      `👨‍💻 New from maker: ${makerName} - launched ${daysOld} days ago`
    );
    explanations.push(
      `👨‍💻 Recent product by ${makerName} with ${upvoteCount || 0} upvotes`
    );
    explanations.push(
      `👨‍💻 Fresh release from ${makerName} with ${views || 0} views so far`
    );
  } else {
    explanations.push(
      `👨‍💻 From maker: ${makerName} with ${upvoteCount || 0} community upvotes`
    );
    explanations.push(
      `👨‍💻 Created by ${makerName} - viewed by ${views || 0} users`
    );
    explanations.push(
      `👨‍💻 Quality product from ${makerName} in the ${categoryName} category`
    );
  }

  explanations.push(
    `👨‍💻 ${categoryName} product by ${makerName} with ${
      upvoteCount || 0
    } upvotes`
  );

  return getDeterministicItem(explanations, product) || `From maker: ${makerName}`;
};

/**
 * Generates explanation for history-based recommendations with engagement metrics
 */
const generateHistoryExplanation = (
  product,
  scoringData,
  userContext,
  productData
) => {
  const { categoryName, tags, upvoteCount, views, daysOld } = productData;
  const { interactionHistory = {} } = scoringData;
  const { history = {} } = userContext;
  const explanations = [];

  // Recently viewed similar product
  if (interactionHistory.lastViewed) {
    const daysSince = Math.floor(
      (Date.now() - new Date(interactionHistory.lastViewed).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSince < 3) {
      explanations.push(
        `🔄 Related to products you recently viewed - has ${
          upvoteCount || 0
        } upvotes`
      );
      explanations.push(
        `🔄 Similar to your recent browsing with ${views || 0} views`
      );
      explanations.push(
        `🔄 Because of your recent activity - ${daysOld} days since launch`
      );
    }
  }

  // Has upvoted similar products
  if (interactionHistory.hasUpvoted) {
    explanations.push(
      `👍 You might like this based on your upvotes - ${
        upvoteCount || 0
      } others agree`
    );
    explanations.push(
      `👍 Similar to products you've upvoted with ${views || 0} views`
    );
    explanations.push(
      `👍 Matches your upvoting pattern in ${categoryName} products`
    );
  }

  // Based on category browsing
  if (history.viewedCategories?.includes(productData.categoryId)) {
    explanations.push(
      `📁 You've been exploring ${categoryName} - this has ${
        upvoteCount || 0
      } upvotes`
    );
    explanations.push(
      `📁 Continue your ${categoryName} discovery with this ${
        views || 0
      }-viewed product`
    );
    explanations.push(
      `📁 More ${categoryName} for your browsing - launched ${daysOld} days ago`
    );
  }

  // Based on tag browsing
  const viewedTags = history.viewedTags || [];
  const matchedTags = tags.filter((tag) => viewedTags.includes(tag));
  if (matchedTags.length > 0) {
    explanations.push(
      `🏷️ Matches ${matchedTags[0]} products you've viewed - ${
        upvoteCount || 0
      } upvotes`
    );
    explanations.push(
      `🏷️ Continue exploring ${matchedTags[0]} products with ${
        views || 0
      } views`
    );
    explanations.push(
      `🏷️ Based on your interest in ${matchedTags[0]} tagged products`
    );
  }

  // Default history-based
  if (explanations.length === 0) {
    explanations.push(
      `📜 Based on your previous activity - has ${upvoteCount || 0} upvotes`
    );
    explanations.push(
      `📜 Matches your browsing patterns with ${views || 0} community views`
    );
    explanations.push(
      `📜 Recommended from your product history in ${categoryName}`
    );
  }

  return getDeterministicItem(explanations, product, {userId: userContext?.preferences?.userId || ''}) || "Based on your history";
};

/**
 * Generates explanation for collaborative filtering recommendations with engagement metrics
 */
const generateCollaborativeExplanation = (
  product,
  scoringData,
  userContext,
  productData
) => {
  const { categoryName, tags, upvoteCount, views, daysOld } = productData;
  const explanations = [];

  explanations.push(
    `👥 Popular with users who share your interests - ${
      upvoteCount || 0
    } upvotes`
  );
  explanations.push(
    `👥 Users similar to you enjoyed this product - ${views || 0} views`
  );
  explanations.push(
    `👥 Recommended by the community for you - launched ${daysOld} days ago`
  );

  if (tags.length > 0) {
    explanations.push(
      `👥 Users who like ${tags[0]} also like this - ${
        upvoteCount || 0
      } upvotes`
    );
    if (tags.length > 1) {
      explanations.push(
        `👥 People interested in ${tags[0]} and ${tags[1]} viewed this ${
          views || 0
        } times`
      );
    }
  }

  explanations.push(
    `👥 Trending with users who explore ${categoryName} - ${
      upvoteCount || 0
    } upvotes`
  );
  explanations.push(
    `👥 Community favorite in ${categoryName} with ${views || 0} views`
  );

  return getDeterministicItem(explanations, product) || "Popular with similar users";
};

/**
 * Generates explanation for interest-based recommendations with engagement metrics
 */
const generateInterestExplanation = (
  product,
  scoringData,
  userContext,
  productData
) => {
  const { categoryName, tags, upvoteCount, views, daysOld } = productData;
  const { preferences = {} } = userContext;
  const interests = preferences?.interests || [];
  const explanations = [];

  // Match with explicit interests
  if (interests.length > 0 && productData.categoryId) {
    const matchedInterest = interests.find(
      (i) => i.toLowerCase() === categoryName.toLowerCase()
    );

    if (matchedInterest) {
      explanations.push(
        `🎯 Matches your interest in ${matchedInterest} with ${
          upvoteCount || 0
        } upvotes`
      );
      explanations.push(
        `🎯 For your declared interest in ${matchedInterest} - ${
          views || 0
        } views`
      );
      explanations.push(
        `🎯 Selected for your ${matchedInterest} interests - launched ${daysOld} days ago`
      );
    }
  }

  // Tag matches with interests
  if (tags.length > 0 && interests.length > 0) {
    const matchedTag = tags.find((tag) =>
      interests.some(
        (interest) =>
          interest.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(interest.toLowerCase())
      )
    );

    if (matchedTag) {
      explanations.push(
        `🎯 Aligns with your ${matchedTag} interests - ${
          upvoteCount || 0
        } community upvotes`
      );
      explanations.push(
        `🎯 Recommended for ${matchedTag} enthusiasts like you - ${
          views || 0
        } views`
      );
      explanations.push(
        `🎯 Because you're interested in ${matchedTag} - from ${daysOld} days ago`
      );
    }
  }

  // Default interest-based
  if (explanations.length === 0) {
    explanations.push(
      `🎯 Aligned with your specified interests - ${upvoteCount || 0} upvotes`
    );
    explanations.push(
      `🎯 Matches your area of interest with ${views || 0} views`
    );
    explanations.push(
      `🎯 Curated for your stated preferences in ${categoryName}`
    );
  }

  return getDeterministicItem(explanations, product, {userId: userContext?.preferences?.userId || ''}) || "Matches your interests";
};

/**
 * Generates explanation for discovery recommendations with engagement metrics
 */
const generateDiscoveryExplanation = (product, scoringData, productData) => {
  const { categoryName, tags, daysOld, upvoteCount, views } = productData;
  const explanations = [];

  if (daysOld < 30) {
    explanations.push(
      `🔍 Discover something new - launched just ${daysOld} days ago`
    );
    explanations.push(
      `🔍 Fresh find for your exploration with ${upvoteCount || 0} upvotes`
    );
    explanations.push(`🔍 New discovery with ${views || 0} views so far`);
  } else {
    explanations.push(
      `🔍 Hidden gem you might like with ${upvoteCount || 0} upvotes`
    );
    explanations.push(
      `🔍 Worth discovering - ${views || 0} others have viewed this`
    );
    explanations.push(`🔍 Quality product that's been gaining attention`);
  }

  if (tags.length > 0) {
    explanations.push(
      `🔍 Discover this ${tags[0]} product with ${upvoteCount || 0} upvotes`
    );
    if (tags.length > 1) {
      explanations.push(
        `🔍 Explore this product tagged with ${tags[0]} and ${tags[1]}`
      );
    }
  }

  explanations.push(
    `🔍 Expand your ${categoryName} horizons - ${views || 0} views`
  );
  explanations.push(
    `🔍 Something different for your feed with ${
      upvoteCount || 0
    } community upvotes`
  );

  return getDeterministicItem(explanations, product) || "Discover something new";
};

/**
 * Generates default explanation when strategy is unknown with engagement metrics
 */
const generateDefaultExplanation = (product, productData) => {
  const { categoryName, daysOld, upvoteCount, views } = productData;
  const explanations = [];

  explanations.push(`✨ Recommended for you with ${upvoteCount || 0} upvotes`);
  explanations.push(
    `✨ Selected ${categoryName} product with ${views || 0} views`
  );
  explanations.push(`✨ Quality product from the ${categoryName} category`);

  if (daysOld < 14) {
    explanations.push(
      `✨ New product you might like - launched ${daysOld} days ago`
    );
    explanations.push(
      `✨ Fresh addition with ${upvoteCount || 0} community upvotes`
    );
  } else {
    explanations.push(`✨ Curated for your feed with ${views || 0} views`);
    explanations.push(
      `✨ Established product with ${upvoteCount || 0} upvotes since launch`
    );
  }

  return getDeterministicItem(explanations, product) || "Recommended for you";
};
