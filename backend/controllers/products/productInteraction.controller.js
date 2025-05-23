import Product from "../../models/product/product.model.js";
import Comment from "../../models/product/comment.model.js";
import Upvote from "../../models/product/upvote.model.js";
import Bookmark from "../../models/product/bookmark.model.js";
import { AppError } from "../../utils/logging/error.js";
import logger from "../../utils/logging/logger.js";
import mongoose from "mongoose";
import {io} from "../../socket/socket.js";

/**
 * Toggle upvote on a product
 * @route POST /api/v1/products/:slug/upvote
 * @access Private
 */
export const toggleUpvote = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    const { slug } = req.params;
    const userId = req.user._id;

    if (!slug) {
      return next(new AppError("Product slug is required", 400));
    }

    const product = await Product.findOne({ slug });
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (product.status !== "Published") {
      return next(new AppError("Can only upvote published products", 400));
    }

    if (product.maker.toString() === userId.toString()) {
      return next(new AppError("You cannot upvote your own product", 400));
    }

    const result = await product.toggleUpvote(userId);

    // Get full user document with methods for both upvote and remove upvote actions
    const User = mongoose.model("User");
    const user = await User.findById(userId);

    if (result.upvoted) {
      // Handle upvote action
      // Emit to the product room for all subscribers
      io.to(`product:${product._id}`).emit("product:upvote", {
        productId: product._id,
        count: result.count,
        userId: userId.toString(),
        action: 'add'
      });

      // Emit a more specific event for direct product updates
      io.emit(`product:${product._id}:update`, {
        upvoteCount: result.count,
        upvotes: {
          count: result.count
        }
      });

      // Notify the product maker
      io.to(`user:${product.maker}`).emit("notification", {
        type: "upvote",
        message: `Your product ${product.name} received a new upvote!`,
        data: {
          productId: product._id,
          productName: product.name,
          productSlug: product.slug,
          upvoteCount: result.count,
          timestamp: new Date().toISOString(),
        },
      });

      try {
        await user.addActivity("Upvoted", {
          description: `Upvoted product: ${product.name}`,
          reference: product._id,
          referenceModel: "Product",
        });
      } catch (activityError) {
        logger.warn(
          `Failed to log upvote activity for user ${userId}: ${activityError.message}`
        );
      }

      // Update recommendations asynchronously in background
      setImmediate(async () => {
        try {
          await user.updateRecommendationsAfterUpvote(product._id);
        } catch (err) {
          logger.error(`Recommendation update failed: ${err.message}`);
        }
      });
    } else {
      // Handle remove upvote action
      // Emit to the product room for all subscribers
      io.to(`product:${product._id}`).emit("product:upvote", {
        productId: product._id,
        count: result.count,
        userId: userId.toString(),
        action: 'remove'
      });

      // Emit a more specific event for direct product updates
      io.emit(`product:${product._id}:update`, {
        upvoteCount: result.count,
        upvotes: {
          count: result.count
        }
      });

      try {
        // Log activity for removing upvote
        await user.addActivity("Removed Upvote", {
          description: `Removed upvote from product: ${product.name}`,
          reference: product._id,
          referenceModel: "Product",
        });
      } catch (activityError) {
        logger.warn(
          `Failed to log remove upvote activity for user ${userId}: ${activityError.message}`
        );
      }

      // Update recommendations for remove upvote
      setImmediate(async () => {
        try {
          // Use the UserContextService directly to record the remove_upvote interaction
          const UserContextService = (await import("../../services/recommendation/userContext.service.js")).default;
          await UserContextService.updateAfterInteraction(userId, product._id, "remove_upvote", {
            source: "product_detail",
            slug: product.slug
          });
        } catch (err) {
          logger.error(`Recommendation update failed for remove_upvote: ${err.message}`);
        }
      });
    }

    // Explicitly invalidate cache for this product
    const cache = (await import("../../utils/cache/cache.js")).cache;
    await cache.invalidateProduct(product._id, product.slug);

    logger.info(`User ${userId} toggled upvote for ${slug}: ${result.upvoted}`);
    res.status(200).json({
      success: true,
      data: {
        upvoted: result.upvoted,
        upvoteCount: result.count, // Use result.count directly
        user: req.user.toPublicProfile(),
        productData: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          upvotes: { count: result.count, userHasUpvoted: result.upvoted },
          // Add userInteractions for consistency
          userInteractions: { hasUpvoted: result.upvoted, hasBookmarked: false },
          // Add top-level upvoteCount for consistency
          upvoteCount: result.count
        }
      },
      message: result.upvoted
        ? "Product upvoted successfully"
        : "Product upvote removed successfully",
    });
  } catch (error) {
    logger.error(
      `Error toggling upvote for ${req.params.slug} by ${req.user?._id}: ${error.message}`
    );
    next(new AppError(`Failed to toggle upvote: ${error.message}`, 500));
  }
};

/**
 * Toggle product bookmark
 * @route POST /api/v1/products/:slug/bookmark
 * @access Private
 */
export const toggleBookmark = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(
        new AppError("Authentication required to bookmark products", 401)
      );
    }

    const { slug } = req.params;
    const userId = req.user._id;

    if (!slug) {
      return next(new AppError("Product slug is required", 400));
    }

    const product = await Product.findOne({ slug });
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (product.status !== "Published") {
      return next(
        new AppError("You can only bookmark published products", 400)
      );
    }

    if (product.maker.toString() === userId.toString()) {
      return next(new AppError("You cannot bookmark your own product", 400));
    }

    const result = await product.toggleBookmark(userId);

    // Get full user document with methods
    const User = mongoose.model("User");
    const user = await User.findById(userId);

    if (result.bookmarked) {
      // Handle bookmark action
      // Emit to the product room for all subscribers
      io.to(`product:${product._id}`).emit("product:bookmark", {
        productId: product._id,
        count: result.count,
        userId: userId.toString(),
        action: 'add'
      });

      // Emit a more specific event for direct product updates
      io.emit(`product:${product._id}:update`, {
        bookmarkCount: result.count,
        bookmarks: {
          count: result.count
        }
      });

      // Notify the product maker
      io.to(`user:${product.maker}`).emit("notification", {
        type: "bookmark",
        message: `Your product ${product.name} was bookmarked!`,
        data: {
          productId: product._id,
          productName: product.name,
          productSlug: product.slug,
          bookmarkCount: result.count,
          timestamp: new Date().toISOString(),
        },
      });

      // Add activity with full user document
      try {
        await user.addActivity("Bookmarked", {
          description: `Bookmarked product: ${product.name}`,
          reference: product._id,
          referenceModel: "Product",
        });
      } catch (activityError) {
        logger.warn(
          `Failed to log bookmark activity for user ${userId}: ${activityError.message}`
        );
      }

      // Update recommendations asynchronously in background
      setImmediate(async () => {
        try {
          await user.updateRecommendationsAfterBookmark(product._id);
        } catch (err) {
          logger.error(`Recommendation update failed: ${err.message}`);
        }
      });
    } else {
      // Handle remove bookmark action
      // Emit to the product room for all subscribers
      io.to(`product:${product._id}`).emit("product:bookmark", {
        productId: product._id,
        count: result.count,
        userId: userId.toString(),
        action: 'remove'
      });

      // Emit a more specific event for direct product updates
      io.emit(`product:${product._id}:update`, {
        bookmarkCount: result.count,
        bookmarks: {
          count: result.count
        }
      });

      try {
        // Log activity for removing bookmark
        await user.addActivity("Removed Bookmark", {
          description: `Removed bookmark from product: ${product.name}`,
          reference: product._id,
          referenceModel: "Product",
        });
      } catch (activityError) {
        logger.warn(
          `Failed to log remove bookmark activity for user ${userId}: ${activityError.message}`
        );
      }

      // Update recommendations for remove bookmark
      setImmediate(async () => {
        try {
          // Use the UserContextService directly to record the remove_bookmark interaction
          const UserContextService = (await import("../../services/recommendation/userContext.service.js")).default;
          await UserContextService.updateAfterInteraction(userId, product._id, "remove_bookmark", {
            source: "product_detail",
            slug: product.slug
          });
        } catch (err) {
          logger.error(`Recommendation update failed for remove_bookmark: ${err.message}`);
        }
      });
    }

    // Explicitly invalidate cache for this product and user's bookmarks
    const cache = (await import("../../utils/cache/cache.js")).cache;
    await cache.invalidateProduct(product._id, product.slug);

    // Invalidate user's bookmarks cache
    await cache.smartInvalidate([`bookmarks:user:${userId}:*`], { log: true });

    logger.info(
      `User ${userId} toggled bookmark for ${slug}: ${result.bookmarked}`
    );
    res.status(200).json({
      success: true,
      data: {
        bookmarked: result.bookmarked,
        bookmarkCount: result.count, // Use result.count directly
        user: user.toPublicProfile(),
        productId: product._id,
        slug: product.slug,
        // Add productData with consistent structure
        productData: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          bookmarks: { count: result.count, userHasBookmarked: result.bookmarked },
          // Add userInteractions for consistency
          userInteractions: { hasBookmarked: result.bookmarked, hasUpvoted: false },
          // Add top-level bookmarkCount for consistency
          bookmarkCount: result.count
        }
      },
      message: result.bookmarked
        ? "Product bookmarked successfully"
        : "Product bookmark removed successfully",
    });
  } catch (error) {
    logger.error(
      `Error toggling bookmark for ${req.params.slug} by ${req.user?._id}: ${error.message}`
    );
    next(new AppError(`Failed to toggle bookmark: ${error.message}`, 500));
  }
};

/**
 * Add a comment to a product
 * @route POST /api/v1/products/:slug/comments
 * @access Private
 */
export const addComment = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length < 2) {
      return next(
        new AppError("Comment content must be at least 2 characters", 400)
      );
    }

    if (content.trim().length > 1000) {
      return next(new AppError("Comment cannot exceed 1000 characters", 400));
    }

    const product = await Product.findOne({ slug });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // Only allow commenting on published products
    if (product.status !== "Published") {
      return next(
        new AppError("You can only comment on published products", 400)
      );
    }

    // Validate parent comment if provided
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return next(new AppError("Parent comment not found", 404));
      }

      // Ensure parent comment belongs to this product
      if (parentComment.product.toString() !== product._id.toString()) {
        return next(new AppError("Invalid parent comment", 400));
      }
    }

    // Create the comment directly
    const comment = new Comment({
      content: content.trim(),
      user: userId,
      product: product._id,
      parent: parentId || null,
    });

    await comment.save();

    // Populate user info for response
    await comment.populate("user", "firstName lastName profilePicture");

    // Add activity
    await req.user.addActivity("Commented", {
      description: `Commented on: ${product.name}`,
      reference: product._id,
      referenceModel: "Product",
    });

    logger.info(`User ${userId} commented on product ${product._id}`);

    res.status(201).json({
      success: true,
      data: comment,
      message: "Comment added successfully",
    });
  } catch (error) {
    logger.error("Failed to add comment to product:", error);
    next(new AppError("Failed to add comment", 500));
  }
};

/**
 * Get comments for a product
 * @route GET /api/v1/products/:slug/comments
 * @access Public
 */
export const getComments = async (req, res, next) => {
  try {
    // If enhanceCommentData middleware has run, just use its processed data
    if (req.commentData) {
      return res.status(200).json({
        success: true,
        results: req.commentData.comments.length,
        pagination: req.commentData.pagination,
        data: req.commentData.comments,
      });
    }

    // Fallback if the middleware hasn't been used
    const { slug } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    if (!slug) {
      return next(new AppError("Product slug is required", 400));
    }

    const product = await Product.findOne({ slug });
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    const totalCount = await Comment.countDocuments({
      product: product._id,
      parent: null,
    });

    const comments = await Comment.find({
      product: product._id,
      parent: null,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "firstName lastName profilePicture")
      .select("+likes.users"); // Explicitly include likes.users

    const commentIds = comments.map((comment) => comment._id);
    const replies = await Comment.find({
      product: product._id,
      parent: { $in: commentIds },
    })
      .populate("user", "firstName lastName profilePicture")
      .select("+likes.users") // Explicitly include likes.users
      .sort({ createdAt: 1 });

    const userId = req.user ? req.user._id : null;

    const enhancedComments = comments.map((comment) => {
      const commentObj = comment.toObject();
      const commentReplies = replies.filter(
        (r) => r.parent.toString() === comment._id.toString()
      );

      return {
        ...commentObj,
        likes: {
          count: comment.likes?.count || 0,
          userHasLiked: userId
            ? comment.likes.users.some(
                (id) => id.toString() === userId.toString()
              )
            : false,
        },
        replies: commentReplies.map((reply) => ({
          ...reply.toObject(),
          likes: {
            count: reply.likes?.count || 0,
            userHasLiked: userId
              ? reply.likes.users.some(
                  (id) => id.toString() === userId.toString()
                )
              : false,
          },
        })),
      };
    });

    // Remove likes.users from the response for security
    enhancedComments.forEach((comment) => {
      delete comment.likes.users;
      comment.replies?.forEach((reply) => delete reply.likes.users);
    });

    res.status(200).json({
      success: true,
      results: enhancedComments.length,
      pagination: {
        total: totalCount,
        page,
        pages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
      data: enhancedComments,
    });
  } catch (error) {
    logger.error("Failed to fetch product comments:", error);
    next(new AppError("Failed to fetch comments", 500));
  }
};

/**
 * Edit a comment
 * @route PUT /api/v1/products/:slug/comments/:commentId
 * @access Private
 */
export const editComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const userId = req.user._id;

    // Comment is already validated by middleware
    const comment = req.comment;

    if (!content || content.trim().length < 2) {
      return next(new AppError("Comment content must be at least 2 characters", 400));
    }

    if (content.length > 1000) {
      return next(new AppError("Comment cannot exceed 1000 characters", 400));
    }

    // Check if user is authorized to edit
    if (comment.user.toString() !== userId.toString() && req.user.role !== "admin") {
      return next(new AppError("You can only edit your own comments", 403));
    }

    // Update the comment
    comment.content = content.trim();
    comment.updatedAt = new Date();
    await comment.save();

    // Populate necessary fields
    await comment.populate("user", "firstName lastName profilePicture");

    // Format response data
    const responseData = {
      ...comment.toObject(),
      likes: {
        count: comment.likes?.count || 0,
        userHasLiked: req.user ? comment.likes.users.includes(req.user._id) : false
      }
    };

    // Remove sensitive data
    delete responseData.likes.users;

    logger.info(`Comment ${comment._id} edited by user ${userId}`);

    res.status(200).json({
      success: true,
      data: responseData,
      message: "Comment updated successfully"
    });

  } catch (error) {
    logger.error(`Failed to update comment: ${error.message}`);
    next(new AppError("Failed to update comment", 500));
  }
};

/**
 * Delete a comment
 * @route DELETE /api/v1/products/:slug/comments/:commentId
 * @access Private
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { slug, commentId } = req.params;
    const userId = req.user._id;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return next(new AppError("Valid commentID is required", 400));
    }

    const product = await Product.findOne({ slug });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // Find the comment
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    // Verify comment belongs to this product
    if (comment.product.toString() !== req.product._id.toString()) {
      return next(new AppError("Comment does not belong to this product", 400));
    }

    // Check if user is comment owner, product owner, or admin
    const isCommentOwner = comment.user.toString() === userId.toString();
    const isProductOwner = req.product.maker.toString() === userId.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCommentOwner && !isProductOwner && !isAdmin) {
      return next(
        new AppError("You don't have permission to delete this comment", 403)
      );
    }

    // Delete any replies to this comment if it's a parent comment
    if (!comment.parent) {
      await Comment.deleteMany({ parent: commentId });
    }

    // Delete the comment
    await comment.deleteOne();

    logger.info(`Comment ${commentId} deleted by user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete comment:", error);
    next(new AppError("Failed to delete comment", 500));
  }
};

/**
 * Toggle like on a comment
 * @route POST /api/v1/products/:slug/comments/:commentId/like
 * @access Private
 */
export const toggleCommentLike = async (req, res, next) => {
  try {
    const { slug, commentId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return next(new AppError("Invalid comment ID", 400));
    }

    // Find the comment directly instead of getting it through the product
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    // Verify the comment belongs to a product with the given slug
    const product = await Product.findOne({ slug, _id: comment.product });

    if (!product) {
      return next(
        new AppError(
          "Product not found or comment doesn't belong to this product",
          404
        )
      );
    }

    // Toggle like using the method from the Comment model
    const isLiked = await comment.toggleLike(userId);

    logger.info(
      `User ${userId} ${isLiked ? "liked" : "unliked"} comment ${commentId}`
    );

    res.status(200).json({
      success: true,
      data: {
        isLiked,
        likeCount: comment.likes.count,
      },
      message: `Comment ${isLiked ? "liked" : "unliked"} successfully`,
    });
  } catch (error) {
    logger.error(`Error toggling like for comment: ${error.message}`, error);
    next(new AppError("Failed to toggle like", 500));
  }
};

/**
 * Add a reply to a comment or to another reply
 * @route POST /api/v1/products/:slug/comments/:commentId/reply
 * @access Private
 */
export const addReply = async (req, res, next) => {
  try {
    const parentCommentId = req.params.commentId || req.params.parentCommentId;
    const { content, replyToId } = req.body;
    const userId = req.user._id;

    // Validate parameters
    if (!parentCommentId || !mongoose.Types.ObjectId.isValid(parentCommentId)) {
      return next(new AppError("Valid comment ID is required", 400));
    }
    if (!content || content.trim().length < 2) {
      return next(new AppError("Reply must be at least 2 characters", 400));
    }
    if (content.trim().length > 1000) {
      return next(new AppError("Reply cannot exceed 1000 characters", 400));
    }

    const product =
      req.product || (await Product.findOne({ slug: req.params.slug }));
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    const rootComment = await Comment.findById(parentCommentId);
    if (!rootComment) {
      return next(new AppError("Parent comment not found", 404));
    }
    if (rootComment.product.toString() !== product._id.toString()) {
      return next(new AppError("Invalid parent comment", 400));
    }

    // Check if user is trying to reply to their own comment
    if (rootComment.user.toString() === userId.toString()) {
      return next(new AppError("You cannot reply to your own comment", 400));
    }

    let depth = 1;
    let replyingToUserId = rootComment.user;
    let directParentId = parentCommentId;

    if (replyToId && mongoose.Types.ObjectId.isValid(replyToId)) {
      const replyToComment = await Comment.findById(replyToId);
      if (!replyToComment) {
        return next(new AppError("Reply target not found", 404));
      }
      if (replyToComment.product.toString() !== product._id.toString()) {
        return next(new AppError("Invalid reply target", 400));
      }

      // Check if user is trying to reply to their own reply
      if (replyToComment.user.toString() === userId.toString()) {
        return next(new AppError("You cannot reply to your own reply", 400));
      }

      // Set direct parent to the comment we're replying to
      directParentId = replyToId;

      // Verify the reply target belongs to the same thread
      let currentComment = replyToComment;
      let isInThread = false;
      while (currentComment) {
        if (currentComment._id.toString() === parentCommentId.toString()) {
          isInThread = true;
          break;
        }
        if (!currentComment.parent) break;
        currentComment = await Comment.findById(currentComment.parent);
      }
      if (!isInThread) {
        return next(
          new AppError("Reply does not belong to this comment thread", 400)
        );
      }

      depth = (replyToComment.depth || 0) + 1;
      if (depth > 5) depth = 5;
      replyingToUserId = replyToComment.user;
    }

    const reply = new Comment({
      content: content.trim(),
      user: userId,
      product: product._id,
      parent: directParentId,
      rootParent: parentCommentId, // Always the top-level comment
      depth,
      replyingTo: replyingToUserId,
    });

    await reply.save();

    await reply.populate([
      { path: "user", select: "firstName lastName profilePicture" },
      { path: "replyingTo", select: "firstName lastName" },
    ]);

    try {
      await req.user.addActivity({
        description: `Replied to a comment on ${product.name}`,
        reference: product._id,
        referenceModel: "Product",
      });
    } catch (activityError) {
      logger.error(`Failed to record reply activity: ${activityError.message}`);
    }

    logger.info(
      `User ${userId} replied to comment thread ${parentCommentId} on product ${product._id}`
    );

    res.status(201).json({
      success: true,
      data: {
        ...reply.toObject(),
        likes: { count: 0, userHasLiked: false },
      },
      message: "Reply added successfully",
    });
  } catch (error) {
    logger.error(`Failedto add reply: ${error.message}`, error);
    next(new AppError("Failed to add reply", 500));
  }
};

/**
 * Edit a reply
 * @route PUT /api/v1/products/:slug/comments/:commentId/replies/:replyId
 * @access Private
 */
export const editReply = async (req, res, next) => {
  try {
    const { content } = req.body;
    const userId = req.user._id;

    // Reply and parent comment are already validated by middleware
    const reply = req.reply;
    const parentComment = req.parentComment;

    if (!content || content.trim().length < 2) {
      return next(new AppError("Reply content must be at least 2 characters", 400));
    }

    if (content.length > 500) {
      return next(new AppError("Reply cannot exceed 500 characters", 400));
    }

    // Check if user is authorized to edit
    if (reply.user.toString() !== userId.toString() && req.user.role !== "admin") {
      return next(new AppError("You can only edit your own replies", 403));
    }

    // Update the reply
    reply.content = content.trim();
    reply.updatedAt = new Date();
    await reply.save();

    // Populate necessary fields
    await reply.populate([
      { path: "user", select: "firstName lastName profilePicture" },
      { path: "replyingTo", select: "firstName lastName" }
    ]);

    // Format response data
    const responseData = {
      ...reply.toObject(),
      likes: {
        count: reply.likes?.count || 0,
        userHasLiked: req.user ? reply.likes.users.includes(req.user._id) : false
      }
    };

    // Remove sensitive data
    delete responseData.likes.users;

    logger.info(`Reply ${reply._id} edited by user ${userId}`);

    res.status(200).json({
      success: true,
      data: responseData,
      message: "Reply updated successfully"
    });

  } catch (error) {
    logger.error(`Failed to update reply: ${error.message}`);
    next(new AppError("Failed to update reply", 500));
  }
};

/**
 * Delete a reply
 * @route DELETE /api/v1/products/:slug/comments/:commentId/replies/:replyId
 * @access Private
 */
export const deleteReply = async (req, res, next) => {
  try {
    // commentId here is the PARENT comment's ID, replyId is the ACTUAL reply's ID
    const { commentId, replyId } = req.params;
    const userId = req.user._id;

    // Validate IDs
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return next(new AppError("Valid parent comment ID is required", 400));
    }
    if (!replyId || !mongoose.Types.ObjectId.isValid(replyId)) {
      return next(new AppError("Valid reply ID is required", 400));
    }

    // Find the reply document directly
    const replyComment = await Comment.findById(replyId);

    if (!replyComment) {
      return next(new AppError("Reply not found", 404));
    }

    // Verify the reply belongs to the correct parent comment and product
    if (
      !replyComment.parent ||
      replyComment.parent.toString() !== commentId ||
      replyComment.product.toString() !== req.product._id.toString() // req.product comes from middleware
    ) {
      return next(
        new AppError("Reply does not belong to this comment/product", 400)
      );
    }

    // Check permissions (reply owner, parent comment owner, product owner, or admin)
    const parentComment = await Comment.findById(commentId); // Needed for parent owner check
    const isReplyOwner = replyComment.user.toString() === userId.toString();
    const isParentCommentOwner =
      parentComment?.user.toString() === userId.toString();
    const isProductOwner = req.product.maker.toString() === userId.toString();
    const isAdmin = req.user.role === "admin";

    if (!isReplyOwner && !isParentCommentOwner && !isProductOwner && !isAdmin) {
      return next(
        new AppError("You don't have permission to delete this reply", 403)
      );
    }

    // Delete the reply document
    await replyComment.deleteOne();

    logger.info(`Reply ${replyId} deleted by user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete reply:", error);
    next(new AppError("Failed to delete reply", 500));
  }
};

/**
 * Toggle like on a comment reply
 * @route POST /api/v1/products/:slug/comments/:parentCommentId/replies/:replyId/like
 * @access Private
 */
export const toggleReplyLike = async (req, res, next) => {
  const { parentCommentId, replyId } = req.params;
  const userId = req.user._id; // Assumes isAuthenticated middleware sets req.user

  // Validate parentCommentId
  if (!parentCommentId || !mongoose.Types.ObjectId.isValid(parentCommentId)) {
    return next(new AppError("Valid parent comment ID is required", 400));
  }

  // Validate replyId
  if (!replyId || !mongoose.Types.ObjectId.isValid(replyId)) {
    return next(new AppError("Valid reply ID is required", 400));
  }

  try {
    // Find the reply
    const replyComment = await Comment.findById(replyId);
    if (!replyComment) {
      return next(new AppError("Reply not found", 404));
    }

    // Verify the reply belongs to the parent comment and product
    if (
      !replyComment.parent ||
      replyComment.parent.toString() !== parentCommentId ||
      replyComment.product.toString() !== req.product._id.toString()
    ) {
      return next(
        new AppError("Reply does not belong to this comment or product", 400)
      );
    }

    // Toggle the like
    const isLiked = await replyComment.toggleLike(userId);

    // Log the action
    logger.info(
      `User ${userId} ${isLiked ? "liked" : "unliked"} reply ${replyId}`
    );

    // Respond with updated like status and count
    res.status(200).json({
      success: true,
      data: {
        isLiked,
        likeCount: replyComment.likes.count,
      },
      message: `Reply ${isLiked ? "liked" : "unliked"} successfully`,
    });
  } catch (error) {
    logger.error(`Error toggling like for reply ${replyId}:`, error);
    next(new AppError(error.message || "Failed to toggle reply like", 500));
  }
};

/**
 * Get user's bookmarked products
 * @route GET /api/v1/products/bookmarked
 * @access Private
 */
export const getUserBookmarks = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError("Authentication required to view bookmarks", 401));
    }

    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";
    const categorySlug = req.query.category || null;
    const search = req.query.search || null;
    const tags = req.query.tags ? req.query.tags.split(',') : null;

    const pipeline = [];

    // 1. Match user's bookmarks
    pipeline.push({ $match: { user: mongoose.Types.ObjectId.createFromHexString(userId.toString()) } });

    // 2. Lookup Product Data
    pipeline.push({
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productData"
      }
    });
    pipeline.push({ $unwind: { path: "$productData", preserveNullAndEmptyArrays: false } }); // Filter out bookmarks for deleted products

    // 3. Apply Filters (Category, Search, Tags) - Placed early for efficiency
    if (categorySlug && categorySlug !== 'all') {
        pipeline.push({
            $lookup: { // Temporary lookup for filtering
                from: "categories",
                localField: "productData.category",
                foreignField: "_id",
                as: "categoryFilterInfo"
            }
        });
        pipeline.push({ $match: { "categoryFilterInfo.slug": categorySlug } });
        // We don't need to keep categoryFilterInfo, remove it later or ignore in projection
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { "productData.name": searchRegex },
            { "productData.tagline": searchRegex },
            { "productData.description": searchRegex }
          ]
        }
      });
    }
    if (tags && tags.length > 0) {
      pipeline.push({ $match: { "productData.tags": { $in: tags } } });
    }

    // 4. Calculate Counts (Upvotes, Bookmarks)
    pipeline.push({
        $lookup: {
            from: "upvotes", let: { productId: "$productData._id" },
            pipeline: [ { $match: { $expr: { $eq: ["$product", "$$productId"] } } }, { $count: "count" } ],
            as: "upvoteInfo"
        }
    });
    pipeline.push({
        $lookup: {
            from: "bookmarks", let: { productId: "$productData._id" },
            pipeline: [ { $match: { $expr: { $eq: ["$product", "$$productId"] } } }, { $count: "count" } ],
            as: "bookmarkInfo"
        }
    });
    pipeline.push({
        $addFields: {
            "productData.upvoteCount": { $ifNull: [{ $arrayElemAt: ["$upvoteInfo.count", 0] }, 0] },
            "productData.bookmarkCount": { $ifNull: [{ $arrayElemAt: ["$bookmarkInfo.count", 0] }, 0] }
        }
    });

    // ***** FIX START *****
    // 5. Add Default User Interactions *before* final projection
    pipeline.push({
        $addFields: {
            "productData.userInteractions": {
                hasBookmarked: true, // Always true for this endpoint
                hasUpvoted: false    // Default value, will be updated after aggregation
            }
        }
    });
    // ***** FIX END *****


    // 6. Count Total Results (after filtering, before sorting/pagination)
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "total" });
    const totalResults = await Bookmark.aggregate(countPipeline).exec(); // Added exec()
    const totalBookmarks = totalResults.length > 0 ? totalResults[0].total : 0;


    // 7. Sorting
    let sortStage = {};
    if (sortBy === "name") sortStage = { "productData.name": sortOrder === "asc" ? 1 : -1 };
    else if (sortBy === "upvotes") sortStage = { "productData.upvoteCount": sortOrder === "asc" ? 1 : -1 };
    else if (sortBy === "views") {
        pipeline.push({ $addFields: { "productData.views.count": { $ifNull: ["$productData.views.count", 0] } } }); // Ensure views count exists
        sortStage = { "productData.views.count": sortOrder === "asc" ? 1 : -1 };
    }
    else sortStage = { "createdAt": sortOrder === "asc" ? 1 : -1 }; // Default: bookmark date
    pipeline.push({ $sort: sortStage });


    // 8. Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });


    // 9. Lookup Final Category and Maker Data
    pipeline.push({
      $lookup: { from: "categories", localField: "productData.category", foreignField: "_id", as: "categoryData" }
    });
    pipeline.push({
      $lookup: { from: "users", localField: "productData.maker", foreignField: "_id", as: "makerData" }
    });
    pipeline.push({ $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } });
    pipeline.push({ $unwind: { path: "$makerData", preserveNullAndEmptyArrays: true } });


    // 10. Final Projection (Shape the Output)
    pipeline.push({
      $project: {
        _id: 1, // Bookmark document _id
        bookmarkedAt: "$createdAt", // Date this user bookmarked it
        // Project the nested product object
        product: {
          _id: "$productData._id",
          name: "$productData.name",
          slug: "$productData.slug",
          tagline: "$productData.tagline",
          description: "$productData.description", // Optional: might not be needed for list/grid view
          thumbnail: "$productData.thumbnail",
          upvoteCount: "$productData.upvoteCount", // Include calculated count
          bookmarkCount: "$productData.bookmarkCount", // Include calculated count
          views: { // Safely project views
             count: { $ifNull: ["$productData.views.count", 0] }
          },
          tags: { $ifNull: ["$productData.tags", []] }, // Ensure tags is an array
          status: "$productData.status",
          createdAt: "$productData.createdAt", // Product creation date
          // Project nested category object
          category: {
            _id: "$categoryData._id",
            name: "$categoryData.name",
            slug: "$categoryData.slug"
          },
          // Project nested maker object
          maker: {
            _id: "$makerData._id",
            firstName: "$makerData.firstName",
            lastName: "$makerData.lastName",
            username: "$makerData.username",
            profilePicture: "$makerData.profilePicture",
            headline: "$makerData.headline"
          },
           // Include the userInteractions object created by $addFields
          userInteractions: "$productData.userInteractions"
        },
        // Exclude intermediate fields explicitly if needed (usually not necessary)
        // productData: 0, categoryData: 0, makerData: 0, upvoteInfo: 0, bookmarkInfo: 0, categoryFilterInfo: 0
      }
    });

    // --- Execute Aggregation ---
    let bookmarks = await Bookmark.aggregate(pipeline).exec(); // Added exec()

    // --- Enhance with User's Upvote Status (Post-Aggregation) ---
    if (bookmarks && bookmarks.length > 0) {
      const productIds = bookmarks.map(b => b.product._id).filter(id => id); // Get valid product IDs

      if (productIds.length > 0) {
        try {
          const userUpvotes = await Upvote.find({
            user: userId,
            product: { $in: productIds }
          }).select('product -_id').lean(); // Select only product ID

          const upvotedProductIds = new Set(userUpvotes.map(upvote => upvote.product.toString()));

          // Update the hasUpvoted flag IN THE RESULT ARRAY
          bookmarks.forEach(bookmark => {
            if (bookmark.product?._id) {
               // Ensure userInteractions object exists before modifying
               if (!bookmark.product.userInteractions) {
                   bookmark.product.userInteractions = { hasBookmarked: true, hasUpvoted: false };
                   logger.warn(`userInteractions was missing for product ${bookmark.product._id} in bookmark ${bookmark._id}, recreated.`);
               }
              bookmark.product.userInteractions.hasUpvoted = upvotedProductIds.has(bookmark.product._id.toString());
            }
          });
        } catch (error) {
          logger.error(`Error enhancing bookmarks with upvote status for user ${userId}: ${error.message}`);
          // Don't fail the whole request, but log the issue. Defaults remain false.
        }
      }
    }
    // --- End Enhancement ---

    logger.info(`Retrieved ${bookmarks.length} bookmarks for user ${userId} on page ${page}`);

    res.status(200).json({
      success: true,
      results: bookmarks.length,
      pagination: {
        total: totalBookmarks,
        page,
        pages: Math.ceil(totalBookmarks / limit),
        limit,
        hasNextPage: page * limit < totalBookmarks,
        hasPrevPage: page > 1,
      },
      data: bookmarks
    });

  } catch (error) {
    // Log the specific MongoDB error if available
    if (error.name === 'MongoServerError') {
        logger.error(`MongoDB Aggregation Error fetching bookmarks for user ${req.user?._id}: ${error.message}`, { code: error.code });
    } else {
        logger.error(`Error fetching bookmarks for user ${req.user?._id}: ${error.message}`);
    }
    logger.error(`Stack trace: ${error.stack}`);
    // Send a user-friendly error response
    next(new AppError(`Failed to fetch bookmarked products. Please try again later.`, 500));
  }
};
