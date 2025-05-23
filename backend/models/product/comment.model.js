// comment.model.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      minlength: [2, "Comment must be at least 2 characters long"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    parent: {
      // This field links replies to their parent comment
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true, // Index for fetching replies efficiently
    },
    // Add root parent to track the top-level comment
    rootParent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true, // For querying all replies under a root comment
    },
    // Track reply depth for UI rendering decisions
    depth: {
      type: Number,
      default: 0, // 0 = root comment, 1 = first-level reply, 2+ = nested replies
    },
    // Store who this reply is responding to (for UI "replying to @username")
    replyingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    likes: {
      count: {
        type: Number,
        default: 0,
      },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
commentSchema.index({ product: 1, parent: 1 }); // Compound index for basic queries
commentSchema.index({ product: 1, rootParent: 1 }); // For fetching all replies to a root comment
commentSchema.index({ createdAt: -1 });
commentSchema.index({ depth: 1 }); // For filtering by depth

// Count direct replies to this comment
commentSchema.virtual("replyCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parent",
  count: true,
});

// Method to toggle like status (Works for both comments and replies)
commentSchema.methods.toggleLike = async function (userId) {
  // Validate userId
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  // Create ObjectId instance with 'new'
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check if the user has already liked this comment
  const index = this.likes.users.findIndex(
    (id) => id.toString() === userObjectId.toString()
  );

  if (index === -1) {
    // User hasn't liked yet, add the like
    this.likes.users.push(userObjectId);
    this.likes.count = this.likes.users.length; // Sync the count
    await this.save();
    return true; // Liked
  } else {
    // User has already liked, remove the like
    this.likes.users.splice(index, 1);
    this.likes.count = this.likes.users.length; // Sync the count
    await this.save();
    return false; // Unliked
  }
};

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
