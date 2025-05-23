// models/user/user.model.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import validator from "validator";
import logger from "../../utils/logging/logger.js";
import bcrypt from "bcryptjs";
import RecommendationService from "../../services/recommendation/recommendations.service.js";
import UserContextService from "../../services/recommendation/userContext.service.js";

dotenv.config();

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined values (for existing users without usernames)
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens"],
      index: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
      // Removed index: true since it's defined explicitly below with userSchema.index()
      validate: {
        validator: (v) => !v || validator.isEmail(v),
        message: "Please enter a valid email address",
      },
    },
    phone: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
      // Removed index: true since it's defined explicitly below with userSchema.index()
      validate: {
        validator: (v) =>
          !v || validator.isMobilePhone(v, null, { strictMode: true }),
        message: "Please enter a valid phone number",
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      // No index property here, defined explicitly below with userSchema.index()
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: [
        "user",
        "startupOwner",
        "investor",
        "agency",
        "freelancer",
        "jobseeker",
        "admin",
        "maker",
      ],
      default: "user",
    },
    // Allow users to have secondary roles
    secondaryRoles: [{
      type: String,
      enum: [
        "startupOwner",
        "investor",
        "agency",
        "freelancer",
        "jobseeker",
        "maker",
      ]
    }],
    roleDetails: {
      // References to role-specific profile models
      startupOwner: { type: mongoose.Schema.Types.ObjectId, ref: "Startup" },
      investor: { type: mongoose.Schema.Types.ObjectId, ref: "Investor" },
      agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency" },
      freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "Freelancer" },
      jobseeker: { type: mongoose.Schema.Types.ObjectId, ref: "Jobseeker" },
    },
    // Role-specific permissions and capabilities
    roleCapabilities: {
      canUploadProducts: { type: Boolean, default: false },
      canInvest: { type: Boolean, default: false },
      canOfferServices: { type: Boolean, default: false },
      canApplyToJobs: { type: Boolean, default: false },
      canPostJobs: { type: Boolean, default: false },
      canShowcaseProjects: { type: Boolean, default: false },
    },
    // User settings
    notificationPreferences: {
      emailNotifications: {
        productUpdates: { type: Boolean, default: true },
        newFollowers: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        upvotes: { type: Boolean, default: true },
        newsletter: { type: Boolean, default: true },
      },
      pushNotifications: {
        productUpdates: { type: Boolean, default: true },
        newFollowers: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        upvotes: { type: Boolean, default: true },
      },
      smsNotifications: {
        securityAlerts: { type: Boolean, default: true },
        accountUpdates: { type: Boolean, default: false },
      }
    },
    privacySettings: {
      profileVisibility: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
      activityVisibility: { type: String, enum: ['public', 'followers', 'private'], default: 'followers' },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      allowTagging: { type: Boolean, default: true },
      allowMentions: { type: Boolean, default: true },
      allowMessaging: { type: String, enum: ['everyone', 'followers', 'nobody'], default: 'everyone' },
    },
    securitySettings: {
      twoFactorEnabled: { type: Boolean, default: false },
      loginAlerts: { type: Boolean, default: false },
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    address: {
      country: {
        type: String,
        trim: true,
        default: "",
      },
      city: {
        type: String,
        trim: true,
        default: "",
      },
      street: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
      },
    },
    openToWork: {
      type: Boolean,
      default: false,
    },
    about: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    activity: [
      {
        type: {
          type: String,
          enum: [
            "Upvoted",
            "Launched",
            "Commented",
            "Joined",
            "Updated",
            "Bookmarked",
            "Removed Upvote",
            "Removed Bookmark",
          ],
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
        description: String,
        reference: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "activity.referenceModel",
        },
        referenceModel: {
          type: String,
          enum: ["Product", "Comment", "User"], // Add other relevant models if needed
        },
      },
    ],
    skills: [String],
    profilePicture: {
      url: {
        type: String,
        trim: true,
        validate: {
          validator: (v) => !v || validator.isURL(v),
          message: "Please enter a valid URL for profile picture",
        },
      },
      publicId: String,
    },
    bannerImage: {
      url: {
        type: String,
        trim: true,
        validate: {
          validator: (v) => !v || validator.isURL(v),
          message: "Please enter a valid URL for banner image",
        },
      },
      publicId: String,
    },
    recentAchievements: [String],
    preferredContact: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    // Company related fields (Consider moving to a separate Company/Organization model if complexity grows)
    companyName: { type: String, trim: true, maxlength: 100, default: "" },
    companyWebsite: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || validator.isURL(v),
        message: "Please enter a valid company website URL",
      },
    },
    companyRole: { type: String, trim: true, maxlength: 100, default: "" },
    industry: { type: String, trim: true, maxlength: 100, default: "" },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      default: "1-10",
    },
    fundingStage: {
      type: String,
      enum: [
        "Pre-seed",
        "Seed",
        "Series A",
        "Series B",
        "Series C+",
        "Bootstrapped",
        "Other",
      ],
      default: "Pre-seed",
    },
    companyDescription: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    companyLogo: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || validator.isURL(v),
        message: "Please enter a valid URL for company logo",
      },
    },
    // --- Personal Info ---
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      required: false,
      set: function (val) {
        // Convert empty strings to null to avoid validation errors
        return val === "" ? null : val;
      },
    },
    birthDate: {
      type: Date,
      validate: {
        validator: (v) =>
          !v || validator.isBefore(v.toISOString(), new Date().toISOString()),
        message: "Birth date must be in the past",
      },
    },
    isProfileCompleted: { type: Boolean, default: false },
    socialLinks: {
      twitter: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || validator.isURL(v);
          },
          message: "Please enter a valid Twitter URL or leave it empty",
        },
        default: null,
      },
      linkedin: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || validator.isURL(v);
          },
          message: "Please enter a valid LinkedIn URL or leave it empty",
        },
        default: null,
      },
      github: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || validator.isURL(v);
          },
          message: "Please enter a valid GitHub URL or leave it empty",
        },
        default: null,
      },
      website: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || validator.isURL(v);
          },
          message: "Please enter a valid website URL or leave it empty",
        },
        default: null,
      },
    },
    // --- Preferences & Security ---
    interests: [
      // User-declared interests
      {
        name: { type: String, required: true }, // Can be tag name or Category ID string
        strength: { type: Number, default: 5, min: 0, max: 10 },
      },
    ],
    lastLogin: Date,
    lastEmailVerificationRequest: { type: Date, default: null },
    lockUntil: Date,
    loginAttempts: { type: Number, default: 0 },
    tempPhone: { type: String, default: null }, // For phone verification process
    otpSentAt: { type: Date, default: null },
    otpFailedAttempts: { type: Number, default: 0 },
    password: {
      type: String,
      required: false, // Optional if using social/phone auth
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    lastVerifiedAction: { type: Date, default: null }, // Timestamp of last verified action (e.g., email/phone change)
    verificationRequirements: {
      // Flags for required verification steps
      requiresEmailVerification: { type: Boolean, default: false },
      requiresPhoneVerification: { type: Boolean, default: false },
      lastVerificationRequest: { type: Date, default: null },
    },
    verificationAttempts: {
      // Track verification attempts to prevent abuse
      email: { count: { type: Number, default: 0 }, lastAttempt: Date },
      phone: { count: { type: Number, default: 0 }, lastAttempt: Date },
    },
    // --- Recommendation Related (State managed by Recommendation model) ---
    lastRecommendationAt: Date, // When recommendations were last generated/fetched for this user
    // --- Interaction Tracking ---
    interactions: {
      // Basic interaction summary
      lastInteraction: Date,
      interactionCount: { type: Number, default: 0 },
    },
    // Add virtual fields for counts
    upvoteCount: {
      type: Number,
      default: 0
    },
    bookmarkCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// === Indexes ===
// Since email, phone, and googleId already have indexes from their schema definitions
// (defined as unique:true which automatically creates an index), we don't need to
// define them again here. We'll just create the other needed indexes.
// userSchema.index({ email: 1 }, { sparse: true });
// userSchema.index({ phone: 1 }, { sparse: true });
// userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ secondaryRoles: 1 });
userSchema.index({ interests: 1 });
userSchema.index({ lastLogin: -1 });
// Sparse indexes for role details if querying by specific role is needed
userSchema.index({ "roleDetails.startupOwner": 1 }, { sparse: true });
userSchema.index({ "roleDetails.investor": 1 }, { sparse: true });
userSchema.index({ "roleDetails.agency": 1 }, { sparse: true });
userSchema.index({ "roleDetails.freelancer": 1 }, { sparse: true });
userSchema.index({ "roleDetails.jobseeker": 1 }, { sparse: true });
// Index for role capabilities
userSchema.index({ "roleCapabilities.canUploadProducts": 1 });
userSchema.index({ "roleCapabilities.canInvest": 1 });
userSchema.index({ "roleCapabilities.canOfferServices": 1 });
userSchema.index({ "roleCapabilities.canApplyToJobs": 1 });

// === Virtuals ===
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual("fullName").get(function () {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim();
});

userSchema.virtual("isVerified").get(function () {
  // Considered verified if either email or phone is verified
  return this.isEmailVerified || this.isPhoneVerified;
});

userSchema.virtual("isFullyVerified").get(function () {
  // Requires both email and phone (if they exist) to be verified
  const needsEmail = !!this.email;
  const needsPhone = !!this.phone;
  return (
    (!needsEmail || this.isEmailVerified) &&
    (!needsPhone || this.isPhoneVerified)
  );
});

// Virtual population for related documents
userSchema.virtual("products", {
  // Products made by this user
  ref: "Product",
  localField: "_id",
  foreignField: "maker",
});

userSchema.virtual("comments", {
  // Comments made by this user
  ref: "Comment",
  localField: "_id",
  foreignField: "user",
});

userSchema.virtual("upvotes", {
  // Upvotes given by this user
  ref: "Upvote",
  localField: "_id",
  foreignField: "user",
});

userSchema.virtual("bookmarks", {
  // Bookmarks made by this user
  ref: "Bookmark",
  localField: "_id",
  foreignField: "user",
});

// Add virtuals for upvotes and bookmarks
userSchema.virtual('upvotes', {
  ref: 'Upvote',
  localField: '_id',
  foreignField: 'user',
  count: true
});

userSchema.virtual('bookmarks', {
  ref: 'Bookmark',
  localField: '_id',
  foreignField: 'user',
  count: true
});

// Modify the toJSON transform to include these counts
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.upvoteCount = ret.upvotes || 0;
    ret.bookmarkCount = ret.bookmarks || 0;
    delete ret.upvotes;  // Remove the virtual field
    delete ret.bookmarks; // Remove the virtual field
    return ret;
  }
});

// === Methods ===

/**
 * Generate a username from first and last name
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {number} [suffix=null] - Optional numeric suffix to append
 * @returns {string} - Generated username
 */
userSchema.statics.generateUsername = function(firstName, lastName, suffix = null) {
  // Convert to lowercase and remove special characters
  let username = '';

  if (firstName && lastName) {
    // Use first name and last name
    username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  } else if (firstName) {
    // Use only first name if last name is not available
    username = firstName.toLowerCase();
  } else if (lastName) {
    // Use only last name if first name is not available
    username = lastName.toLowerCase();
  } else {
    // Generate a random username if neither is available
    username = `user${Math.floor(Math.random() * 10000)}`;
  }

  // Replace spaces and special characters
  username = username.replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');

  // Add suffix if provided
  if (suffix !== null) {
    username = `${username}${suffix}`;
  }

  // Ensure username is at least 3 characters
  if (username.length < 3) {
    username = username.padEnd(3, '0');
  }

  // Ensure username is not longer than 30 characters
  if (username.length > 30) {
    username = username.substring(0, 30);
  }

  return username;
};

/**
 * Returns a minimal public representation of the user.
 */
userSchema.methods.toPublicProfile = function () {
  return {
    _id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName, // Use virtual
    profilePicture: this.profilePicture?.url || null, // Default to null if no picture
    // Add other safe fields like bio, companyName if desired
  };
};

/**
 * Returns a more detailed profile, suitable for the logged-in user viewing their own profile.
 * Excludes sensitive fields like password hash, verification attempts etc.
 */
userSchema.methods.getFullProfile = function () {
  const profile = this.toObject({ virtuals: true }); // Get object with virtuals

  // Remove sensitive fields
  delete profile.password;
  delete profile.lockUntil;
  delete profile.loginAttempts;
  delete profile.tempPhone;
  delete profile.otpSentAt;
  delete profile.otpFailedAttempts;
  delete profile.verificationAttempts;
  delete profile.verificationRequirements;
  delete profile.__v;
  // Decide if activity should be included here or fetched separately
  // delete profile.activity;

  return profile;
};

/**
 * Fetches recommendations for the user using the RecommendationService.
 * Handles retrieving exclusions (viewed/upvoted products).
 */
userSchema.methods.getRecommendations = async function (
  limit = 10,
  options = {}
) {
  try {
    const {
      refresh = false,
      strategy = "mixed", // Default strategy
      excludeViewed = true,
      excludeUpvoted = true,
      categoryId = null,
      tags = [],
      context = {}, // Pass additional context (e.g., device, location)
    } = options;

    // Fetch exclusions (products already seen/interacted with)
    const exclusions = new Set();
    if (excludeViewed || excludeUpvoted) {
      const [viewedIds, upvotedIds] = await Promise.all([
        excludeViewed
          ? mongoose.model("View").distinct("product", { user: this._id })
          : [],
        excludeUpvoted
          ? mongoose.model("Upvote").distinct("product", { user: this._id })
          : [],
      ]);
      viewedIds.forEach((id) => exclusions.add(id.toString()));
      upvotedIds.forEach((id) => exclusions.add(id.toString()));
    }
    // Add products made by the user to exclusions
    const userProductIds = await mongoose
      .model("Product")
      .distinct("_id", { maker: this._id });
    userProductIds.forEach((id) => exclusions.add(id.toString()));

    const finalContext = {
      ...context,
      exclude: Array.from(exclusions),
      categoryId,
      tags,
    };

    // Optionally trigger a regeneration if refresh is requested
    // Note: Regeneration might be better handled by a dedicated job or API call
    if (refresh) {
      logger.debug(
        `Explicit refresh requested for user ${this._id}. Triggering generation.`
      );
      // Consider if this synchronous generation is okay or should be async
      await RecommendationService.generateUserRecommendations(this._id, {
        forceRefresh: true,
      });
    }

    // Fetch recommendations from the centralized service
    const recommendations = await RecommendationService.getUserRecommendations(
      this._id,
      {
        limit,
        offset: options.offset || 0,
        strategy,
        context: finalContext,
      }
    );

    return recommendations;
  } catch (error) {
    logger.error(`Error getting recommendations for user ${this._id}:`, error);
    return []; // Return empty array on error
  }
};

/**
 * Checks if the user has upvoted a specific product.
 */
userSchema.methods.hasUpvotedProduct = async function (productId) {
  try {
    const Upvote = mongoose.model("Upvote");
    const count = await Upvote.countDocuments({
      user: this._id,
      product: productId,
    });
    return count > 0;
  } catch (error) {
    logger.error(
      `Error checking upvote for product ${productId} by user ${this._id}:`,
      error
    );
    return false; // Default to false on error
  }
};

/**
 * Checks if the user has bookmarked a specific product.
 */
userSchema.methods.hasBookmarkedProduct = async function (productId) {
  try {
    const Bookmark = mongoose.model("Bookmark"); // Assuming Bookmark model exists
    const count = await Bookmark.countDocuments({
      user: this._id,
      product: productId,
    });
    return count > 0;
  } catch (error) {
    logger.error(
      `Error checking bookmark for product ${productId} by user ${this._id}:`,
      error
    );
    return false; // Default to false on error
  }
};

/**
 * Triggers an asynchronous update of recommendations after an upvote.
 */
userSchema.methods.updateRecommendationsAfterUpvote = async function (
  productId
) {
  // Best practice: Trigger this asynchronously (e.g., via job queue or setImmediate)
  setImmediate(() => {
    UserContextService.updateAfterInteraction(
      this._id,
      productId,
      "upvote",
      {}
    ).catch((err) =>
      logger.error(
        `Async recommendation update failed after upvote for user ${this._id}, product ${productId}: ${err.message}`
      )
    );
  });
};

/**
 * Triggers an asynchronous update of recommendations after removing an upvote.
 */
userSchema.methods.updateRecommendationsAfterRemoveUpvote = async function (
  productId
) {
  // Best practice: Trigger this asynchronously
  setImmediate(() => {
    UserContextService.updateAfterInteraction(
      this._id,
      productId,
      "remove_upvote",
      {}
    ).catch((err) =>
      logger.error(
        `Async recommendation update failed after remove_upvote for user ${this._id}, product ${productId}: ${err.message}`
      )
    );
  });
};

/**
 * Triggers an asynchronous update of recommendations after a bookmark action.
 */
userSchema.methods.updateRecommendationsAfterBookmark = async function (
  productId
) {
  // Best practice: Trigger this asynchronously
  setImmediate(() => {
    UserContextService.updateAfterInteraction(
      this._id,
      productId,
      "bookmark",
      {}
    ).catch((err) =>
      logger.error(
        `Async recommendation update failed after bookmark for user ${this._id}, product ${productId}: ${err.message}`
      )
    );
  });
};

/**
 * Triggers an asynchronous update of recommendations after removing a bookmark.
 */
userSchema.methods.updateRecommendationsAfterRemoveBookmark = async function (
  productId
) {
  // Best practice: Trigger this asynchronously
  setImmediate(() => {
    UserContextService.updateAfterInteraction(
      this._id,
      productId,
      "remove_bookmark",
      {}
    ).catch((err) =>
      logger.error(
        `Async recommendation update failed after remove_bookmark for user ${this._id}, product ${productId}: ${err.message}`
      )
    );
  });
};

/**
 * Retrieves role-specific details by populating the relevant path in roleDetails.
 */
userSchema.methods.getRoleDetails = async function () {
  if (!this.role || this.role === "user" || this.role === "admin") {
    return null;
  }
  // Map role to the correct ref path name
  const roleToPathMap = {
    startupOwner: "Startup",
    investor: "Investor",
    agency: "Agency",
    freelancer: "Freelancer",
    jobseeker: "Jobseeker",
    maker: null, // Assuming 'maker' role doesn't have separate details model
  };
  const roleField = Object.keys(roleToPathMap).find((key) => key === this.role);

  if (roleField && roleToPathMap[roleField]) {
    await this.populate(`roleDetails.${roleField}`);
    return this.roleDetails[roleField];
  }
  return null; // Return null if no specific details model exists for the role
};

/**
 * Adds an activity record to the user's activity array, ensuring size limits.
 */
userSchema.methods.addActivity = async function (type, details = {}) {
  try {
    const validTypes = [
      "Upvoted",
      "Launched",
      "Commented",
      "Joined",
      "Updated",
      "Bookmarked",
      "Removed Upvote",
      "Removed Bookmark",
    ];
    if (!validTypes.includes(type)) {
      logger.warn(
        `Invalid activity type "${type}" attempted for user ${this._id}`
      );
      return null;
    }

    const activityEntry = {
      type,
      timestamp: new Date(),
      description: details.description || "",
    };

    if (details.reference && details.referenceModel) {
      // Ensure reference is a valid ObjectId if provided
      if (!mongoose.Types.ObjectId.isValid(details.reference)) {
        logger.warn(
          `Invalid reference ObjectId "${details.reference}" provided for activity type "${type}" for user ${this._id}`
        );
      } else {
        activityEntry.reference = details.reference;
        activityEntry.referenceModel = details.referenceModel;
      }
    }

    // Add to the beginning of the array
    this.activity.unshift(activityEntry);

    // Limit the array size (e.g., keep the latest 50 activities)
    const MAX_ACTIVITIES = 50;
    if (this.activity.length > MAX_ACTIVITIES) {
      this.activity = this.activity.slice(0, MAX_ACTIVITIES);
    }

    // Save the user document with the new activity
    // Note: Consider if saving the whole user doc for each activity is efficient.
    // Alternative: Have a separate Activity collection.
    await this.save({ validateModifiedOnly: true }); // Avoid re-validating unchanged fields

    return activityEntry;
  } catch (error) {
    logger.error(`Error adding activity for user ${this._id}:`, error);
    // Don't re-throw minor activity logging errors unless critical
    return null;
  }
};

/**
 * Verifies a candidate password against the stored hash.
 */
userSchema.methods.verifyPassword = async function (candidatePassword) {
  // If password field doesn't exist or wasn't selected, comparison is impossible
  if (!this.password) {
    logger.warn(
      `Attempted password verification for user ${this._id} with no stored password.`
    );
    return false;
  }
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    logger.error(
      `Password verification error for user ${this._id}: ${error.message}`
    );
    return false; // Return false on comparison error
  }
};

/**
 * Checks if the user has an email address that requires verification.
 */
userSchema.methods.needsEmailVerification = function () {
  return !!this.email && !this.isEmailVerified;
};

/**
 * Checks if the user has a phone number that requires verification.
 */
userSchema.methods.needsPhoneVerification = function () {
  return !!this.phone && !this.isPhoneVerified;
};

/**
 * Updates the user's declared interests and triggers an asynchronous update
 * of the user's recommendation profile in the RecommendationService.
 */
userSchema.methods.updateInterests = async function (interests) {
  try {
    if (!Array.isArray(interests)) {
      throw new Error("Interests must be an array.");
    }

    // Normalize interests to the standard format { name: String, strength: Number }
    this.interests = interests
      .map((interest) => {
        let name, strength;
        if (typeof interest === "string") {
          name = interest.trim();
          strength = 5; // Default strength
        } else if (typeof interest === "object" && interest.name) {
          name = interest.name.toString().trim(); // Ensure name is string
          strength = Math.min(
            Math.max(parseInt(interest.strength) || 5, 0),
            10
          ); // Clamp strength 0-10
        } else {
          return null; // Invalid format
        }
        return name ? { name, strength } : null;
      })
      .filter(Boolean) // Remove null entries
      .slice(0, 50); // Limit number of interests

    // Remove duplicate interests (based on name), keeping the one with highest strength if duplicated
    const interestMap = new Map();
    this.interests.forEach((interest) => {
      const existing = interestMap.get(interest.name);
      if (!existing || interest.strength > existing.strength) {
        interestMap.set(interest.name, interest);
      }
    });
    this.interests = Array.from(interestMap.values());

    await this.save({ validateModifiedOnly: true });

    // Trigger asynchronous update of recommendations based on interest changes
    setImmediate(async () => {
      try {
        const UserContextService = (
          await import("../../services/recommendation/userContext.service.js")
        ).default;
        await UserContextService.updateFromInterests(this._id, this.interests);
      } catch (err) {
        logger.error(
          `Failed to update recommendation profile for user ${this._id}:`,
          err
        );
      }
    });

    return true;
  } catch (error) {
    logger.error(
      `Error updating user interests for ${this._id}: ${error.message}`
    );
    return false;
  }
};

/**
 * Get role-specific details for the user based on their role
 */
userSchema.methods.getRoleDetails = async function (specificRole = null) {
  try {
    const roleToFetch = specificRole || this.role;

    if (!roleToFetch || roleToFetch === "user" || roleToFetch === "admin") {
      return null;
    }

    // Check if we have role details for the requested role
    if (this.roleDetails && this.roleDetails[roleToFetch]) {
      // Populate the role-specific details
      await this.populate(`roleDetails.${roleToFetch}`);

      // Return the populated role details
      return this.roleDetails[roleToFetch];
    }

    return null;
  } catch (error) {
    logger.error(
      `Error getting role details for user ${this._id}: ${error.message}`
    );
    return null;
  }
};

/**
 * Get all role details for a user (primary and secondary roles)
 */
userSchema.methods.getAllRoleDetails = async function () {
  try {
    const allRoles = [this.role, ...(this.secondaryRoles || [])];
    const uniqueRoles = [...new Set(allRoles)].filter(role =>
      role && role !== "user" && role !== "admin"
    );

    if (uniqueRoles.length === 0) {
      return {};
    }

    // Create an array of population paths for all roles
    const populatePaths = uniqueRoles
      .filter(role => this.roleDetails && this.roleDetails[role])
      .map(role => `roleDetails.${role}`);

    if (populatePaths.length > 0) {
      await this.populate(populatePaths);
    }

    // Create an object with all populated role details
    const allRoleDetails = {};
    uniqueRoles.forEach(role => {
      if (this.roleDetails && this.roleDetails[role]) {
        allRoleDetails[role] = this.roleDetails[role];
      }
    });

    return allRoleDetails;
  } catch (error) {
    logger.error(
      `Error getting all role details for user ${this._id}: ${error.message}`
    );
    return {};
  }
};

/**
 * Update role capabilities based on user roles
 */
userSchema.methods.updateRoleCapabilities = async function () {
  try {
    // Default all capabilities to false
    const capabilities = {
      canUploadProducts: false,
      canInvest: false,
      canOfferServices: false,
      canApplyToJobs: false,
      canPostJobs: false,
      canShowcaseProjects: false,
    };

    // Get all roles (primary and secondary)
    const allRoles = [this.role, ...(this.secondaryRoles || [])];
    const uniqueRoles = [...new Set(allRoles)];

    // Set capabilities based on roles
    uniqueRoles.forEach(role => {
      switch (role) {
        case "startupOwner":
        case "maker":
          capabilities.canUploadProducts = true;
          capabilities.canPostJobs = true;
          capabilities.canShowcaseProjects = true;
          break;
        case "investor":
          capabilities.canInvest = true;
          break;
        case "agency":
        case "freelancer":
          capabilities.canOfferServices = true;
          capabilities.canShowcaseProjects = true;
          break;
        case "jobseeker":
          capabilities.canApplyToJobs = true;
          capabilities.canShowcaseProjects = true;
          break;
        case "admin":
          // Admin can do everything
          Object.keys(capabilities).forEach(key => {
            capabilities[key] = true;
          });
          break;
      }
    });

    // Update the user's roleCapabilities
    this.roleCapabilities = capabilities;

    // Save the user if not part of another operation
    if (!this.$__.saving) {
      await this.save({ validateModifiedOnly: true });
    }

    return capabilities;
  } catch (error) {
    logger.error(
      `Error updating role capabilities for user ${this._id}: ${error.message}`
    );
    return this.roleCapabilities || {};
  }
};

// === Middleware ===

// Pre-save hook to hash password if it has been modified
userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost factor 12
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    logger.error(
      `Error hashing password for user ${this.email || this._id}: ${
        error.message
      }`
    );
    next(error); // Pass error to Mongoose
  }
});

// Pre-save hook to update role capabilities when role or secondaryRoles change
userSchema.pre("save", async function (next) {
  // Check if role or secondaryRoles have been modified
  if (this.isModified("role") || this.isModified("secondaryRoles")) {
    try {
      // Update role capabilities based on the new roles
      await this.updateRoleCapabilities();
      next();
    } catch (error) {
      logger.error(
        `Error updating role capabilities for user ${this._id}: ${error.message}`
      );
      next(error); // Pass error to Mongoose
    }
  } else {
    next();
  }
});

// === Model Export ===
const User = mongoose.model("User", userSchema);

export default User;
