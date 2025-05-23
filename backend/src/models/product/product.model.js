import mongoose from "mongoose";
import Category from "../category/category.model.js";
import { generateUniqueSlug } from "../../utils/formatting/slugGenerator.js";
import logger from "../../utils/logging/logger.js";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: [160, "Tagline cannot exceed 160 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },
    maker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Product maker is required"],
      index: true,
    },
    makerProfile: {
      name: String,
      bio: String,
      title: String,
      image: String,
    },
    thumbnail: {
      type: String,
      required: [true, "Product thumbnail is required"],
    },
    thumbnailPublicId: String,
    extractedUrlData: {
      originalUrl: String,
      extractedAt: Date,
    },
    gallery: {
      type: [
        {
          url: {
            type: String,
            required: true,
          },
          publicId: String,
          caption: {
            type: String,
            maxlength: [200, "Image caption cannot exceed 200 characters"],
          },
          addedAt: {
            type: Date,
            default: Date.now,
          },
          order: Number,
        },
      ],
      validate: [
        {
          validator: function (gallery) {
            return gallery.length <= 10;
          },
          message: "Gallery cannot have more than 10 images",
        },
      ],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
      index: true,
    },
    categoryName: {
      type: String,
      index: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    categoryType: {
      type: String,
      enum: ["Category", "Subcategory"],
      default: "Category",
    },
    pricing: {
      type: {
        type: String,
        enum: ["free", "paid", "subscription", "freemium", "contact"],
        default: "free",
      },
      amount: {
        type: Number,
        min: [0, "Price cannot be negative"],
        default: 0,
        validate: {
          validator: function (value) {
            return this.pricing.type !== "paid" && this.pricing.type !== "subscription" || value > 0;
          },
          message: "Price amount is required for paid products",
        },
      },
      currency: {
        type: String,
        enum: ["USD", "EUR", "GBP", "INR", "JPY"],
        default: "USD",
        validate: {
          validator: function (value) {
            return this.pricing.type !== "paid" && this.pricing.type !== "subscription" || value;
          },
          message: "Currency is required for paid products",
        },
      },
      discounted: {
        type: Boolean,
        default: false,
      },
      originalAmount: {
        type: Number,
        min: [0, "Original price cannot be negative"],
        validate: {
          validator: function (value) {
            return !this.pricing.discounted || value > this.pricing.amount;
          },
          message: "Original price must be greater than discounted price",
        },
      },
      interval: {
        type: String,
        enum: ["", "week", "month", "year"],
        default: "",
      },
      // Contact for pricing fields
      contactEmail: {
        type: String,
        validate: {
          validator: function (value) {
            return this.pricing.type !== "contact" || (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
          },
          message: "Valid contact email is required for contact pricing",
        },
      },
      contactPhone: {
        type: String,
        trim: true,
      },
      contactInstructions: {
        type: String,
        trim: true,
        maxlength: [500, "Contact instructions cannot exceed 500 characters"],
      },
    },
    links: {
      website: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/\S+/.test(v);
          },
          message:
            "Website URL must be a valid URL starting with http:// or https://",
        },
      },
      github: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https:\/\/github.com\/\S+/.test(v);
          },
          message: "GitHub URL must be a valid GitHub repository URL",
        },
      },
      demo: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/\S+/.test(v);
          },
          message: "Demo URL must be a valid URL",
        },
      },
      appStore: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https:\/\/apps.apple.com\/\S+/.test(v);
          },
          message: "App Store URL must be a valid Apple App Store URL",
        },
      },
      playStore: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https:\/\/play.google.com\/store\/\S+/.test(v);
          },
          message: "Play Store URL must be a valid Google Play Store URL",
        },
      },
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Draft",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      validate: [
        {
          validator: function (tags) {
            return tags.length <= 10;
          },
          message: "Cannot have more than 10 tags",
        },
        {
          validator: function (tags) {
            return tags.every((tag) => tag.length <= 30);
          },
          message: "Each tag must be 30 characters or less",
        },
      ],
      index: true,
    },
    views: {
      count: {
        type: Number,
        default: 0,
        min: 0,
        validate: {
          validator: function (value) {
            return !isNaN(value) && value >= 0;
          },
          message: "View count must be a non-negative number",
        },
      },
      unique: {
        type: Number,
        default: 0,
        min: 0,
        validate: {
          validator: function (value) {
            return !isNaN(value) && value >= 0;
          },
          message: "Unique views must be a non-negative number",
        },
      },
      history: [
        {
          date: {
            type: Date,
            required: true,
          },
          count: {
            type: Number,
            required: true,
            min: 0,
            validate: {
              validator: function (value) {
                return !isNaN(value) && value >= 0;
              },
              message: "View history count must be a non-negative number",
            },
          },
        },
      ],
      recommendationImpressions: {
        type: Number,
        default: 0,
      },
      recommendationClicks: {
        type: Number,
        default: 0,
      },
      lastRecommendedAt: Date,
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    launchedAt: Date,
    lastPromoted: Date,
    metadata: {
      seo: {
        title: {
          type: String,
          maxlength: [60, "SEO title cannot exceed 60 characters"],
        },
        description: {
          type: String,
          maxlength: [160, "SEO description cannot exceed 160 characters"],
        },
        keywords: [String],
      },
      custom: mongoose.Schema.Types.Mixed,
    },
    flags: {
      isPromoted: {
        type: Boolean,
        default: false,
      },
      isBanned: {
        type: Boolean,
        default: false,
      },
    },
    moderation: {
      lastReviewedAt: Date,
      lastReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewNotes: String,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for improved query performance
productSchema.index({
  name: "text",
  description: "text",
  tagline: "text",
  tags: "text",
  categoryName: "text",
});
productSchema.index({ maker: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ status: 1, featured: 1 });
productSchema.index({ "views.count": -1 });
productSchema.index({ launchedAt: -1 });
productSchema.index({ bookmarks: 1 });
productSchema.index({ trendingScore: -1 });

// Virtual fields
productSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "product",
});

productSchema.virtual("upvotes", {
  ref: "Upvote",
  localField: "_id",
  foreignField: "product",
  count: true,
});

// Virtual field for bookmark count
productSchema.virtual("bookmarkCount", {
  ref: "Bookmark",
  localField: "_id",
  foreignField: "product",
  count: true,
});

// Virtual field for category name
productSchema.virtual("categoryNameVirtual").get(function () {
  return this.categoryName || "";
});

// Virtual field for calculating trending score
productSchema.virtual("trendingScore").get(function () {
  try {
    const now = new Date();
    const ageInHours = Math.max(1, (now - this.createdAt) / (1000 * 60 * 60));
    const ageInDays = ageInHours / 24;

    // Get engagement metrics with safe fallbacks
    const viewCount = this.views?.count || 0;
    const uniqueViewCount = this.views?.unique || 0;
    const upvoteCount = this.upvoteCount || 0;
    const bookmarkCount = this.bookmarkCount || 0; // Use the virtual field
    const commentCount = this.commentCount || 0;

    // Calculate weighted engagement score
    const engagementScore =
      (upvoteCount * 5) +
      (viewCount * 0.5) +
      (uniqueViewCount * 1) +
      (bookmarkCount * 3) +
      (commentCount * 2);

    // Apply time-based decay factor
    const recencyBonus = Math.min(30 / (ageInDays + 1), 3);

    // Calculate final score with fallbacks for edge cases
    const rawScore = Math.max(0, engagementScore * recencyBonus);

    // Apply logarithmic scaling to prevent extreme outliers
    return rawScore > 0 ? Math.log10(1 + rawScore) * 2 : 0.01;
  } catch (error) {
    console.error(`Error calculating trending score for product ${this._id}:`, error);
    return 0.01; // Return minimum score on error
  }
});

// Add recommendation-related virtuals
productSchema.virtual("recommendationStats").get(function () {
  return {
    recommendationCount: this.views?.recommendationImpressions || 0,
    recommendationClicks: this.views?.recommendationClicks || 0,
    recommendationCTR:
      this.views?.recommendationClicks && this.views?.recommendationImpressions
        ? (this.views.recommendationClicks /
            this.views.recommendationImpressions) *
          100
        : 0,
    lastRecommended: this.views?.lastRecommendedAt,
  };
});

// Enhanced trending score calculation
productSchema.virtual("trendingScore").get(function () {
  const now = new Date();
  const ageInHours = Math.max(1, (now - this.createdAt) / (1000 * 60 * 60));
  const ageInDays = ageInHours / 24;

  // Get engagement metrics
  const viewCount = this.views?.count || 0;
  const uniqueViewCount = this.views?.unique || 0;
  const upvoteCount = this.upvoteCount || 0;
  const bookmarkCount = this.bookmarkCount || 0; // Use the virtual field
  const commentCount = this.commentCount || 0;

  // Calculate recent engagement (last 7 days)
  const recentViews = (this.views?.history || []).filter(
    (view) => now - new Date(view.timestamp) < 7 * 24 * 60 * 60 * 1000
  ).length;

  // Calculate weighted engagement score
  const engagementScore =
    upvoteCount * 5 +
    viewCount * 0.5 +
    uniqueViewCount * 1 +
    bookmarkCount * 3 +
    commentCount * 2 +
    recentViews * 1.5;

  // Apply time-based decay factor (Wilson score inspired)
  const recencyBonus = Math.min(30 / (ageInDays + 1), 3);

  // Apply velocity factor (engagement per unit time)
  const velocityFactor = Math.min(
    engagementScore / Math.max(ageInDays, 1),
    100
  );

  // Calculate final trending score with logarithmic scaling
  const rawScore = (engagementScore + velocityFactor) * recencyBonus;

  // Add recommendation engagement to trending score
  const recommendationEngagement =
    ((this.views?.recommendationClicks || 0) * 2 +
      (this.views?.recommendationImpressions || 0) * 0.1) /
    Math.max(1, (now - this.createdAt) / (1000 * 60 * 60 * 24));

  return (
    (rawScore * 0.7 + recommendationEngagement * 0.3) /
    (Math.max(viewCount, 1) * Math.pow(ageInHours + 12, 1.8))
  );
});

// Pre-save middleware
productSchema.pre("save", async function (next) {
  try {
    // Generate slug if new product or name changed
    if (this.isNew || this.isModified("name")) {
      this.slug = await generateUniqueSlug(this.name);
    }

    // Update categoryName if category changed
    if (this.isModified("category")) {
      const category = await Category.findById(this.category);
      if (category) {
        this.categoryName = category.name;

        // Update category type and parent category if applicable
        if (category.categoryType === "Subcategory") {
          this.categoryType = "Subcategory";
          this.parentCategory = category.parentCategory;
        } else {
          this.categoryType = "Category";
          this.parentCategory = undefined;
        }
      }
    }

    // Set launchedAt if product is being published for the first time
    if (
      this.isModified("status") &&
      this.status === "Published" &&
      !this.launchedAt
    ) {
      this.launchedAt = new Date();
    }

    // Process tags
    if (this.isModified("tags")) {
      this.tags = this.tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)
        .slice(0, 10); // Limit to 10 tags

      // Remove duplicates
      this.tags = [...new Set(this.tags)];
    }

    // Ensure views.unique is a valid number
    if (typeof this.views.unique !== "number" || isNaN(this.views.unique)) {
      logger.warn(
        `Correcting invalid views.unique for product ${
          this._id
        }: ${JSON.stringify(this.views.unique)} to 0`
      );
      this.views.unique = 0;
    }

    // Ensure views.count is a valid number
    if (typeof this.views.count !== "number" || isNaN(this.views.count)) {
      logger.warn(
        `Correcting invalid views.count for product ${
          this._id
        }: ${JSON.stringify(this.views.count)} to 0`
      );
      this.views.count = 0;
    }

    next();
  } catch (error) {
    logger.error("Error in product pre-save hook:", error);
    next(error);
  }
});
// Methods for product
productSchema.pre("save", function (next) {
  if (typeof this.views.unique !== "number" || isNaN(this.views.unique)) {
    this.views.unique = 0;
    logger.warn(`Corrected views.unique to 0 for product ${this._id}`);
  }
  next();
});

/**
 * Record a view for this product
 * This is a critical method that needs to maintain consistency between
 * the Product's internal view counter and the View collection
 */
productSchema.methods.recordView = async function (userId, clientId) {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Initialize views object if it doesn't exist
    if (!this.views) {
      this.views = {
        count: 0,
        unique: 0,
        history: [],
      };
    }

    // Ensure views fields are numbers
    this.views.count = Number(this.views.count || 0);
    this.views.unique = Number(this.views.unique || 0);

    // Increment the view count
    this.views.count += 1;
    logger.info(`Incrementing view count for product ${this._id} to ${this.views.count}`);

    // Check if the view is from a new unique user
    let isNewUniqueUser = false;
    const View = mongoose.model('View');

    if (userId) {
      // For logged-in users, check by user ID
      const userViewCount = await View.countDocuments({
        product: this._id,
        user: userId,
        isBot: false
      }).session(session);

      if (userViewCount <= 1) { // <= 1 because we might have just created a view
        this.views.unique += 1;
        isNewUniqueUser = true;
        logger.info(`New unique logged-in viewer (${userId}) for product ${this._id}, unique count now ${this.views.unique}`);
      } else {
        logger.info(`Returning logged-in viewer (${userId}) for product ${this._id}, unique count remains ${this.views.unique}`);
      }
    } else if (clientId) {
      // For anonymous users with clientId, check by clientId
      const clientViewCount = await View.countDocuments({
        product: this._id,
        user: null,
        clientId: clientId,
        isBot: false
      }).session(session);

      if (clientViewCount <= 1) { // <= 1 because we might have just created a view
        this.views.unique += 1;
        isNewUniqueUser = true;
        logger.info(`New unique anonymous viewer (clientId: ${clientId}) for product ${this._id}, unique count now ${this.views.unique}`);
      } else {
        logger.info(`Returning anonymous viewer (clientId: ${clientId}) for product ${this._id}, unique count remains ${this.views.unique}`);
      }
    }
    // Note: For anonymous users without clientId, we don't increment unique count to avoid inflation

    // Update the view history
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ensure history array exists
    if (!Array.isArray(this.views.history)) {
      this.views.history = [];
    }

    // Find today's entry in history
    let todayRecord = this.views.history.find(
      (record) => new Date(record.date).toDateString() === today.toDateString()
    );

    if (todayRecord) {
      todayRecord.count += 1;
    } else {
      this.views.history.push({ date: today, count: 1 });
    }

    // Sort history by date (newest first) and limit size to prevent document growth
    this.views.history.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.views.history = this.views.history.slice(0, 90);

    // Save the product with updated view data
    await this.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return meaningful data about the view
    return {
      productId: this._id,
      totalViews: this.views.count,
      uniqueViews: this.views.unique,
      isNewUniqueUser
    };
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();

    logger.error(`Error recording view for product ${this._id}: ${error.message}`);
    throw error;
  }
};

productSchema.virtual("trendingScore").get(function () {
  const ageInHours = (new Date() - this.createdAt) / (1000 * 60 * 60);
  const upvoteCount = this.upvotes?.length || 0;
  const viewCount = this.views?.count || 0;
  const commentCount = this.comments?.length || 0;
  const bookmarkCount = this.bookmarks?.length || 0;

  const rawScore =
    (upvoteCount * 3 + viewCount * 1 + commentCount * 2 + bookmarkCount * 2.5) *
    (ageInHours < 72 ? 1.5 : 1);
  return rawScore / (Math.max(viewCount, 1) * Math.pow(ageInHours + 12, 1.8)); // Normalize by views
});

// Toggle upvote method
productSchema.methods.toggleUpvote = async function (userId) {
  try {
    const Upvote = mongoose.model("Upvote");

    const existingUpvote = await Upvote.findOne({
      product: this._id,
      user: userId,
    });

    let upvoted = false;

    if (existingUpvote) {
      await Upvote.findByIdAndDelete(existingUpvote._id);
    } else {
      await Upvote.create({
        product: this._id,
        user: userId,
      });
      upvoted = true;
    }

    const count = await Upvote.countDocuments({ product: this._id });

    return { upvoted, count };
  } catch (error) {
    logger.error(`Error toggling upvote for product ${this._id}:`, error);
    throw error;
  }
};

// Toggle bookmark method
productSchema.methods.toggleBookmark = async function (userId) {
  try {
    const Bookmark = mongoose.model("Bookmark");

    const existingBookmark = await Bookmark.findOne({
      product: this._id,
      user: userId,
    });
    let bookmarked = false;

    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
    } else {
      await Bookmark.create({ product: this._id, user: userId });
      bookmarked = true;
    }

    const count = await Bookmark.countDocuments({ product: this._id });
    return { bookmarked, count };
  } catch (error) {
    logger.error(`Error toggling bookmark for product ${this._id}:`, error);
    throw error;
  }
};

const Product = mongoose.model("Product", productSchema);

export default Product;
