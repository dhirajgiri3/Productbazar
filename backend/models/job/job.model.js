import mongoose from "mongoose";
import slugify from "slugify";
import { nanoid } from "nanoid";
import logger from "../../utils/logging/logger.js";

const jobSchema = new mongoose.Schema(
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
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    locationType: {
      type: String,
      enum: ["Remote", "On-site", "Hybrid", "Flexible"],
      default: "Remote",
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Freelance", "Internship"],
      default: "Full-time",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    requirements: {
      type: [String],
      default: [],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    experienceLevel: {
      type: String,
      enum: ["Entry Level", "Junior", "Mid-Level", "Senior", "Executive"],
      default: "Mid-Level",
    },
    salary: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "USD",
      },
      period: {
        type: String,
        enum: ["Hourly", "Monthly", "Yearly"],
        default: "Yearly",
      },
      isVisible: {
        type: Boolean,
        default: true,
      },
    },
    applicationUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/[^\s]+/.test(v);
        },
        message: "Please enter a valid URL",
      },
    },
    applicationEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },
    applicationInstructions: {
      type: String,
      trim: true,
    },
    benefits: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Closed", "Filled"],
      default: "Draft",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    applications: {
      type: Number,
      default: 0,
    },
    poster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      logo: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
      size: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      },
      industry: {
        type: String,
        trim: true,
      },
    },
    deadline: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    expiresAt: {
      type: Date,
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
jobSchema.pre("save", async function (next) {
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
    
    // Set expiration date if not set
    if (!this.expiresAt && this.status === "Published") {
      // Default to 30 days from now
      this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    
    next();
  } catch (error) {
    logger.error(`Error in job pre-save hook: ${error.message}`);
    next(error);
  }
});

// Virtual for applications
jobSchema.virtual("jobApplications", {
  ref: "JobApplication",
  localField: "_id",
  foreignField: "job",
  justOne: false,
});

// Virtual for poster data
jobSchema.virtual("posterData", {
  ref: "User",
  localField: "poster",
  foreignField: "_id",
  justOne: true,
});

// Index for searching
jobSchema.index({ title: "text", description: "text", "company.name": "text" });
jobSchema.index({ status: 1, expiresAt: 1 });
jobSchema.index({ poster: 1 });
jobSchema.index({ featured: 1 });
jobSchema.index({ createdAt: -1 });

const Job = mongoose.model("Job", jobSchema);
export default Job;
