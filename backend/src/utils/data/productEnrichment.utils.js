// file: backend/Utils/productEnrichment.utils.js
import mongoose from "mongoose";
import Upvote from "../../models/product/upvote.model.js";
import Bookmark from "../../models/product/bookmark.model.js";
import logger from "../logging/logger.js";

/**
 * Enriches product data with user-specific interaction information
 *
 * @param {Array|Object} products - Single product object or array of product objects
 * @param {string|null} userId - User ID to check interactions for, or null for anonymous users
 * @returns {Array|Object} - Enriched product(s) with user interaction data
 */
export const enrichProductsWithUserInteractions = async (products, userId) => {
  try {
    // If no user is logged in, return products as is with default interaction values
    if (!userId) {
      return Array.isArray(products)
        ? products.map(product => addDefaultInteractions(product))
        : addDefaultInteractions(products);
    }

    // Convert userId to ObjectId if it's a string
    const userIdObj = typeof userId === 'string'
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    // Handle single product case
    if (!Array.isArray(products)) {
      return await enrichSingleProduct(products, userIdObj);
    }

    // For empty array, return as is
    if (products.length === 0) return [];

    // Extract all product IDs
    const productIds = products.map(product =>
      product._id instanceof mongoose.Types.ObjectId
        ? product._id
        : new mongoose.Types.ObjectId(product._id)
    );

    // Fetch all upvotes and bookmarks for this user and these products in batch
    const [upvotes, bookmarks] = await Promise.all([
      Upvote.find({
        user: userIdObj,
        product: { $in: productIds }
      }).lean(),

      Bookmark.find({
        user: userIdObj,
        product: { $in: productIds }
      }).lean()
    ]);

    // Create lookup maps for faster access
    const upvoteMap = new Map(
      upvotes.map(upvote => [upvote.product.toString(), true])
    );

    const bookmarkMap = new Map(
      bookmarks.map(bookmark => [bookmark.product.toString(), true])
    );

    // Use the existing productIds variable from above
    let bookmarkCountMap = new Map();
    let upvoteCountMap = new Map();

    try {
      // Fetch bookmark counts
      const bookmarkCounts = await Bookmark.aggregate([
        { $match: { product: { $in: productIds } } },
        { $group: { _id: '$product', count: { $sum: 1 } } }
      ]);

      bookmarkCounts.forEach(item => {
        bookmarkCountMap.set(item._id.toString(), item.count);
      });

      // Fetch upvote counts
      const upvoteCounts = await Upvote.aggregate([
        { $match: { product: { $in: productIds } } },
        { $group: { _id: '$product', count: { $sum: 1 } } }
      ]);

      upvoteCounts.forEach(item => {
        upvoteCountMap.set(item._id.toString(), item.count);
      });
    } catch (error) {
      logger.error(`Error fetching interaction counts: ${error.message}`);
    }

    // Enrich each product with user interaction data
    return products.map(product => {
      const productId = product._id.toString();
      const hasUpvoted = upvoteMap.has(productId);
      const hasBookmarked = bookmarkMap.has(productId);

      // Get counts from aggregation or fall back to virtual fields
      const bookmarkCount = bookmarkCountMap.get(productId) || product.bookmarkCount || 0;
      const upvoteCount = upvoteCountMap.get(productId) || product.upvoteCount || 0;

      return {
        ...product,
        upvotes: {
          count: upvoteCount,
          userHasUpvoted: hasUpvoted
        },
        bookmarks: {
          count: bookmarkCount,
          userHasBookmarked: hasBookmarked
        },
        userInteractions: {
          hasUpvoted,
          hasBookmarked
        },
        // Ensure top-level counts are consistent
        bookmarkCount: bookmarkCount,
        upvoteCount: upvoteCount
      };
    });
  } catch (error) {
    logger.error(`Error enriching products with user interactions: ${error.message}`);
    // Return products with default interactions in case of error
    return Array.isArray(products)
      ? products.map(product => addDefaultInteractions(product))
      : addDefaultInteractions(products);
  }
};

/**
 * Enriches a single product with user interaction data
 * @param {Object} product - Product object to enrich
 * @param {ObjectId} userId - User ID to check interactions for
 * @returns {Object} - Enriched product with user interaction data
 */
async function enrichSingleProduct(product, userId) {
  if (!product) return null;

  const productId = product._id instanceof mongoose.Types.ObjectId
    ? product._id
    : new mongoose.Types.ObjectId(product._id);

  // Fetch user's interactions with this product and the latest counts
  const [upvote, bookmark, bookmarkCount, upvoteCount] = await Promise.all([
    Upvote.findOne({ user: userId, product: productId }).lean(),
    Bookmark.findOne({ user: userId, product: productId }).lean(),
    // Always fetch the latest bookmark count
    Bookmark.countDocuments({ product: productId }),
    // Always fetch the latest upvote count
    Upvote.countDocuments({ product: productId })
  ]);

  const hasUpvoted = !!upvote;
  const hasBookmarked = !!bookmark;

  return {
    ...product,
    upvotes: {
      count: upvoteCount,
      userHasUpvoted: hasUpvoted
    },
    bookmarks: {
      count: bookmarkCount,
      userHasBookmarked: hasBookmarked
    },
    userInteractions: {
      hasUpvoted,
      hasBookmarked
    },
    // Ensure top-level counts are consistent
    bookmarkCount: bookmarkCount,
    upvoteCount: upvoteCount
  };
}

/**
 * Adds default interaction values to a product
 * @param {Object} product - Product object
 * @returns {Object} - Product with default interaction values
 */
function addDefaultInteractions(product) {
  if (!product) return null;

  // Get counts, ensuring they're available
  const bookmarkCount = product.bookmarkCount || 0;
  const upvoteCount = product.upvoteCount || 0;

  return {
    ...product,
    upvotes: {
      count: upvoteCount,
      userHasUpvoted: false
    },
    bookmarks: {
      count: bookmarkCount,
      userHasBookmarked: false
    },
    userInteractions: {
      hasUpvoted: false,
      hasBookmarked: false
    },
    // Ensure top-level counts are consistent
    bookmarkCount: bookmarkCount,
    upvoteCount: upvoteCount
  };
}
