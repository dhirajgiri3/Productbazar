import mongoose from "mongoose";
import slugify from "slugify";
import { nanoid } from "nanoid";
import logger from "../../utils/logging/logger.js";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerType: {
      type: String,
      enum: ["jobseeker", "freelancer", "agency", "startupOwner"],
      required: true,
    },
    // Project collaborators
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["owner", "contributor", "viewer"],
          default: "contributor",
        },
        permissions: {
          canEdit: {
            type: Boolean,
            default: false,
          },
          canDelete: {
            type: Boolean,
            default: false,
          },
          canInvite: {
            type: Boolean,
            default: false,
          },
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // User's role in the project
    role: {
      type: String,
      trim: true,
    },
    // Project status
    status: {
      type: String,
      enum: ["planning", "in-progress", "completed", "on-hold", "cancelled"],
      default: "completed",
    },
    client: {
      name: {
        type: String,
        trim: true,
      },
      industry: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/[^\s]+/.test(v);
          },
          message: "Please enter a valid URL",
        },
      },
      logo: {
        type: String,
        trim: true,
      },
      testimonial: {
        content: String,
        author: String,
        position: String,
        date: Date,
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
      contactPerson: {
        name: String,
        email: String,
        phone: String,
        position: String,
      },
    },
    category: {
      type: String,
      trim: true,
    },
    // Sub-category for more specific categorization
    subCategory: {
      type: String,
      trim: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    current: {
      type: Boolean,
      default: false,
    },
    duration: {
      value: Number,
      unit: {
        type: String,
        enum: ["days", "weeks", "months", "years"],
      },
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    gallery: [
      {
        url: String,
        publicId: String,
        caption: String,
        order: Number,
        type: {
          type: String,
          enum: ["image", "video"],
          default: "image",
        },
      },
    ],
    challenge: {
      type: String,
      trim: true,
    },
    solution: {
      type: String,
      trim: true,
    },
    results: {
      type: String,
      trim: true,
    },
    achievements: {
      type: [String],
      default: [],
    },
    // Key metrics and outcomes
    metrics: [
      {
        name: String,
        value: String,
        description: String,
      },
    ],
    projectUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/[^\s]+/.test(v);
        },
        message: "Please enter a valid URL",
      },
    },
    repositoryUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/[^\s]+/.test(v);
        },
        message: "Please enter a valid URL",
      },
    },
    // Additional links (e.g., documentation, design files, etc.)
    additionalLinks: [
      {
        title: String,
        url: {
          type: String,
          validate: {
            validator: function (v) {
              return !v || /^https?:\/\/[^\s]+/.test(v);
            },
            message: "Please enter a valid URL",
          },
        },
        description: String,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
    },
    // Analytics
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
      clicks: {
        type: Number,
        default: 0,
      },
      // Store view history for analytics
      viewHistory: [
        {
          date: {
            type: Date,
            default: Date.now,
          },
          count: {
            type: Number,
            default: 1,
          },
        },
      ],
    },
    // Comments on the project
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        content: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: Date,
        // For threaded comments
        parentComment: {
          type: mongoose.Schema.Types.ObjectId,
        },
        // For tracking likes on comments
        likes: {
          type: Number,
          default: 0,
        },
      },
    ],
    // For SEO purposes
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    // Custom fields for different project types
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate slug before saving
projectSchema.pre("save", async function (next) {
  try {
    // Only generate slug if it doesn't exist or title has changed
    if (!this.slug || this.isModified("title")) {
      const baseSlug = slugify(this.title, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });
      
      // Add a unique suffix to ensure uniqueness
      const uniqueSuffix = nanoid(6);
      this.slug = `${baseSlug}-${uniqueSuffix}`;
    }
    
    // Set duration based on start and end dates if they exist
    if (this.startDate && (this.endDate || this.current)) {
      const endDate = this.current ? new Date() : this.endDate;
      const diffTime = Math.abs(endDate - this.startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Set appropriate duration unit
      if (diffDays < 30) {
        this.duration = { value: diffDays, unit: "days" };
      } else if (diffDays < 90) {
        this.duration = { value: Math.round(diffDays / 7), unit: "weeks" };
      } else if (diffDays < 730) {
        this.duration = { value: Math.round(diffDays / 30), unit: "months" };
      } else {
        this.duration = { value: Math.round(diffDays / 365), unit: "years" };
      }
    }
    
    next();
  } catch (error) {
    logger.error(`Error in project pre-save hook: ${error.message}`);
    next(error);
  }
});

// Virtual for owner data
projectSchema.virtual("ownerData", {
  ref: "User",
  localField: "owner",
  foreignField: "_id",
  justOne: true,
});

// Virtual for collaborator data
projectSchema.virtual("collaboratorData", {
  ref: "User",
  localField: "collaborators.user",
  foreignField: "_id",
});

// Virtual for comment user data
projectSchema.virtual("commentUsers", {
  ref: "User",
  localField: "comments.user",
  foreignField: "_id",
});

// Virtual for calculating total duration
projectSchema.virtual("totalDuration").get(function () {
  if (!this.duration || !this.duration.value || !this.duration.unit) {
    return null;
  }
  
  return `${this.duration.value} ${this.duration.unit}`;
});

// Virtual for formatted dates
projectSchema.virtual("formattedStartDate").get(function () {
  return this.startDate ? this.startDate.toISOString().split("T")[0] : null;
});

projectSchema.virtual("formattedEndDate").get(function () {
  return this.endDate ? this.endDate.toISOString().split("T")[0] : null;
});

// Virtual for comment count
projectSchema.virtual("commentCount").get(function () {
  return this.comments ? this.comments.length : 0;
});

// Virtual for collaborator count
projectSchema.virtual("collaboratorCount").get(function () {
  return this.collaborators ? this.collaborators.length : 0;
});

// Methods

/**
 * Add a view to the project
 */
projectSchema.methods.addView = async function () {
  try {
    // Increment view count
    if (!this.analytics) {
      this.analytics = { views: 0, likes: 0, shares: 0, clicks: 0, viewHistory: [] };
    }
    
    this.analytics.views += 1;
    
    // Add to view history
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingEntry = this.analytics.viewHistory.find(
      entry => new Date(entry.date).setHours(0, 0, 0, 0) === today.getTime()
    );
    
    if (existingEntry) {
      existingEntry.count += 1;
    } else {
      this.analytics.viewHistory.push({
        date: today,
        count: 1
      });
    }
    
    // Limit history to last 30 days
    if (this.analytics.viewHistory.length > 30) {
      this.analytics.viewHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.analytics.viewHistory = this.analytics.viewHistory.slice(0, 30);
    }
    
    await this.save({ validateBeforeSave: false });
    return this.analytics.views;
  } catch (error) {
    logger.error(`Error adding view to project ${this._id}: ${error.message}`);
    return this.analytics?.views || 0;
  }
};

/**
 * Add a like to the project
 */
projectSchema.methods.addLike = async function (userId) {
  try {
    // Increment like count
    if (!this.analytics) {
      this.analytics = { views: 0, likes: 0, shares: 0, clicks: 0, viewHistory: [] };
    }
    
    this.analytics.likes += 1;
    
    // Add user to likes if not already tracked
    if (!this.likedBy) {
      this.likedBy = [];
    }
    
    if (userId && !this.likedBy.includes(userId)) {
      this.likedBy.push(userId);
    }
    
    await this.save({ validateBeforeSave: false });
    return this.analytics.likes;
  } catch (error) {
    logger.error(`Error adding like to project ${this._id}: ${error.message}`);
    return this.analytics?.likes || 0;
  }
};

/**
 * Remove a like from the project
 */
projectSchema.methods.removeLike = async function (userId) {
  try {
    // Decrement like count
    if (!this.analytics) {
      this.analytics = { views: 0, likes: 0, shares: 0, clicks: 0, viewHistory: [] };
    }
    
    if (this.analytics.likes > 0) {
      this.analytics.likes -= 1;
    }
    
    // Remove user from likes if tracked
    if (this.likedBy && userId) {
      this.likedBy = this.likedBy.filter(id => id.toString() !== userId.toString());
    }
    
    await this.save({ validateBeforeSave: false });
    return this.analytics.likes;
  } catch (error) {
    logger.error(`Error removing like from project ${this._id}: ${error.message}`);
    return this.analytics?.likes || 0;
  }
};

/**
 * Add a comment to the project
 */
projectSchema.methods.addComment = async function (userId, content, parentCommentId = null) {
  try {
    if (!this.comments) {
      this.comments = [];
    }
    
    const comment = {
      user: userId,
      content,
      createdAt: new Date(),
      likes: 0
    };
    
    if (parentCommentId) {
      comment.parentComment = parentCommentId;
    }
    
    this.comments.push(comment);
    await this.save({ validateBeforeSave: false });
    
    return comment;
  } catch (error) {
    logger.error(`Error adding comment to project ${this._id}: ${error.message}`);
    return null;
  }
};

/**
 * Add a collaborator to the project
 */
projectSchema.methods.addCollaborator = async function (userId, role = "contributor", permissions = {}) {
  try {
    if (!this.collaborators) {
      this.collaborators = [];
    }
    
    // Check if user is already a collaborator
    const existingCollaborator = this.collaborators.find(
      collab => collab.user.toString() === userId.toString()
    );
    
    if (existingCollaborator) {
      // Update existing collaborator
      existingCollaborator.role = role;
      existingCollaborator.permissions = {
        ...existingCollaborator.permissions,
        ...permissions
      };
    } else {
      // Add new collaborator
      this.collaborators.push({
        user: userId,
        role,
        permissions: {
          canEdit: permissions.canEdit || false,
          canDelete: permissions.canDelete || false,
          canInvite: permissions.canInvite || false
        },
        addedAt: new Date()
      });
    }
    
    await this.save({ validateBeforeSave: false });
    return this.collaborators;
  } catch (error) {
    logger.error(`Error adding collaborator to project ${this._id}: ${error.message}`);
    return this.collaborators || [];
  }
};

/**
 * Remove a collaborator from the project
 */
projectSchema.methods.removeCollaborator = async function (userId) {
  try {
    if (!this.collaborators) {
      return [];
    }
    
    this.collaborators = this.collaborators.filter(
      collab => collab.user.toString() !== userId.toString()
    );
    
    await this.save({ validateBeforeSave: false });
    return this.collaborators;
  } catch (error) {
    logger.error(`Error removing collaborator from project ${this._id}: ${error.message}`);
    return this.collaborators || [];
  }
};

/**
 * Check if a user has permission to edit the project
 */
projectSchema.methods.canUserEdit = function (userId) {
  // Owner always has edit permission
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  
  // Check collaborators
  if (this.collaborators && this.collaborators.length > 0) {
    const collaborator = this.collaborators.find(
      collab => collab.user.toString() === userId.toString()
    );
    
    if (collaborator && (collaborator.permissions.canEdit || collaborator.role === "owner")) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check if a user has permission to delete the project
 */
projectSchema.methods.canUserDelete = function (userId) {
  // Owner always has delete permission
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  
  // Check collaborators
  if (this.collaborators && this.collaborators.length > 0) {
    const collaborator = this.collaborators.find(
      collab => collab.user.toString() === userId.toString()
    );
    
    if (collaborator && (collaborator.permissions.canDelete || collaborator.role === "owner")) {
      return true;
    }
  }
  
  return false;
};

// Index for searching
projectSchema.index({ title: "text", description: "text", technologies: "text", skills: "text", "client.name": "text" });
projectSchema.index({ owner: 1, ownerType: 1 });
projectSchema.index({ visibility: 1 });
projectSchema.index({ featured: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ "collaborators.user": 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ category: 1, subCategory: 1 });
projectSchema.index({ technologies: 1 });
projectSchema.index({ skills: 1 });

const Project = mongoose.model("Project", projectSchema);
export default Project;
