import mongoose from "mongoose";
import Product from "../../../models/product/product.model.js";
import Comment from "../../../models/product/comment.model.js";
import { AppError } from "../../../utils/logging/error.js";
import logger from "../../../utils/logging/logger.js";

/**
 * Validates the product slug parameter
 */
export const validateProductSlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return next(new AppError("Product slug is required", 400));
    }
    
    // Find the product and attach it to req for use in later middleware
    const product = await Product.findOne({ slug });
    
    if (!product) {
      return next(new AppError("Product not found", 404));
    }
    
    // Attach product to request for use in later middleware
    req.product = product;
    next();
  } catch (error) {
    logger.error(`Error validating product slug: ${error.message}`);
    next(new AppError("Error validating product", 500));
  }
};

/**
 * Validates the comment exists and belongs to the product
 */
export const validateComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId || req.params.parentCommentId;
    
    // Skip if no commentId (for example, when creating new comments)
    if (!commentId) {
      return next();
    }
    
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return next(new AppError("Invalid comment ID", 400));
    }
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }
    
    // Make sure the comment belongs to the product
    if (comment.product.toString() !== req.product._id.toString()) {
      return next(new AppError("Comment does not belong to this product", 400));
    }

    // For regular comments (not replies), verify it's a top-level comment
    if (!req.params.replyId && comment.parent) {
      return next(new AppError("Invalid comment - this is a reply", 400));
    }
    
    // Attach comment to request
    req.comment = comment;
    next();
  } catch (error) {
    logger.error(`Error validating comment: ${error.message}`);
    next(new AppError("Error validating comment", 500));
  }
};

/**
 * Validates the reply exists and belongs to the parent comment
 */
export const validateReply = async (req, res, next) => {
  try {
    const replyId = req.params.replyId;
    const commentId = req.params.commentId || req.params.parentCommentId;
    
    if (!replyId || !commentId) {
      return next(new AppError("Reply ID and comment ID are required", 400));
    }
    
    if (!mongoose.Types.ObjectId.isValid(replyId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return next(new AppError("Invalid reply or comment ID", 400));
    }

    // Find both the reply and parent comment
    const [reply, parentComment] = await Promise.all([
      Comment.findById(replyId).populate('parent'),
      Comment.findById(commentId)
    ]);

    if (!reply) {
      return next(new AppError("Reply not found", 404));
    }

    if (!parentComment) {
      return next(new AppError("Parent comment not found", 404));
    }

    // Make sure both belong to the same product
    if (!req.product || !req.product._id) {
      return next(new AppError("Product reference is missing", 500));
    }

    if (reply.product.toString() !== req.product._id.toString()) {
      return next(new AppError("Reply does not belong to this product", 400));
    }

    if (parentComment.product.toString() !== req.product._id.toString()) {
      return next(new AppError("Parent comment does not belong to this product", 400));
    }

    // Check reply belongs to the comment thread
    let belongsToThread = false;
    let currentReply = reply;

    while (currentReply && currentReply.parent) {
      // Direct parent match
      if (currentReply.parent._id.toString() === commentId) {
        belongsToThread = true;
        break;
      }
      
      // Check if this is a nested reply by following the parent chain
      if (currentReply.rootParent && currentReply.rootParent.toString() === commentId) {
        belongsToThread = true;
        break;
      }

      // Move up the chain
      currentReply = await Comment.findById(currentReply.parent);
    }

    if (!belongsToThread) {
      return next(new AppError("Reply does not belong to this comment thread", 400));
    }

    // Store both reply and parent comment in request object
    req.reply = reply;
    req.parentComment = parentComment;
    next();
  } catch (error) {
    logger.error(`Error validating reply: ${error.message}`);
    next(new AppError("Error validating reply", 500));
  }
};

/**
 * Middleware to enhance the getComments controller with consistent data for nested replies and likes
 */
export const enhanceCommentData = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    if (!req.product) {
      return next(new AppError("Product not found", 404));
    }
    
    const productId = req.product._id;
    const userId = req.user ? req.user._id : null;

    // Get the total count for pagination (only top-level comments)
    const totalCount = await Comment.countDocuments({
      product: productId,
      parent: null
    });

    // Get main comments with pagination
    const comments = await Comment.find({
      product: productId,
      parent: null
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "firstName lastName profilePicture")
      .select("+likes.users"); // Explicitly include likes data

    // Get all comment IDs
    const commentIds = comments.map(comment => comment._id);

    // Get ALL replies for these comments in a single query
    // We'll fetch ALL replies (not just first level) and organize them in memory
    const allReplies = await Comment.find({
      product: productId,
      $or: [
        { parent: { $in: commentIds } },  // Direct replies
        { rootParent: { $in: commentIds } }  // Nested replies
      ]
    })
      .populate("user", "firstName lastName profilePicture")
      .populate("replyingTo", "firstName lastName")  // Add replyingTo user info
      .select("+likes.users")
      .sort({ createdAt: 1 });

    // Process and format comments with proper like data and nested replies structure
    const enhancedComments = comments.map(comment => {
      // Step 1: Get all replies related to this comment thread
      const allCommentReplies = allReplies.filter(
        reply => {
          return (
            reply.parent.toString() === comment._id.toString() || // Direct reply
            (reply.rootParent && reply.rootParent.toString() === comment._id.toString()) // Nested reply
          );
        }
      );
      
      // Step 2: Create a map of replies by their parent for efficient lookup
      const repliesByParent = {};
      
      // Initialize with direct children of the main comment
      repliesByParent[comment._id.toString()] = allCommentReplies.filter(
        reply => reply.parent.toString() === comment._id.toString()
      );
      
      // Then add all other nested replies, organized by their direct parent
      allCommentReplies.forEach(reply => {
        if (reply.parent.toString() !== comment._id.toString()) { // Skip already processed direct replies
          const parentId = reply.parent.toString();
          if (!repliesByParent[parentId]) {
            repliesByParent[parentId] = [];
          }
          repliesByParent[parentId].push(reply);
        }
      });
      
      // Step 3: Function to recursively build nested reply tree
      const buildReplyTree = (parentId) => {
        const children = repliesByParent[parentId] || [];
        return children.map(reply => {
          // Format reply with proper like data
          const formattedReply = {
            ...reply.toObject(),
            likes: {
              count: reply.likes?.count || 0,
              userHasLiked: userId
                ? reply.likes?.users?.some(id => id.toString() === userId.toString())
                : false
            },
            // Recursively get nested replies to this reply
            replies: buildReplyTree(reply._id.toString()) 
          };
          
          // Remove sensitive like user data
          delete formattedReply.likes.users;
          
          return formattedReply;
        });
      };
      
      // Format the base comment with proper like data and nested replies
      const formattedComment = {
        ...comment.toObject(),
        likes: {
          count: comment.likes?.count || 0,
          userHasLiked: userId 
            ? comment.likes?.users?.some(id => id.toString() === userId.toString())
            : false
        },
        // Build the full reply tree starting with direct replies to this comment
        replies: buildReplyTree(comment._id.toString())
      };
      
      // Remove sensitive like user data
      delete formattedComment.likes.users;
      
      return formattedComment;
    });
    
    // Attach processed data to request object
    req.commentData = {
      comments: enhancedComments,
      pagination: {
        total: totalCount,
        page,
        pages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1
      }
    };
    
    next();
  } catch (error) {
    logger.error(`Error enhancing comment data: ${error.message}`);
    next(new AppError("Error processing comments", 500));
  }
};