import mongoose from "mongoose";
import logger from "../../utils/logging/logger.js";

const jobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resume: {
      url: {
        type: String,
        required: true,
      },
      publicId: String,
      name: String,
      fileType: String, // PDF, DOC, DOCX
      fileSize: Number, // Size in bytes
    },
    coverLetter: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Shortlisted", "Rejected", "Hired", "Withdrawn"],
      default: "Pending",
    },
    answers: [{
      question: String,
      answer: String,
    }],
    notes: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
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

// Compound index to ensure a user can only apply once to a job
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Indexes for querying
jobApplicationSchema.index({ job: 1, status: 1 });
jobApplicationSchema.index({ applicant: 1 });
jobApplicationSchema.index({ createdAt: -1 });

// Virtual for job data
jobApplicationSchema.virtual("jobData", {
  ref: "Job",
  localField: "job",
  foreignField: "_id",
  justOne: true,
});

// Virtual for applicant data
jobApplicationSchema.virtual("applicantData", {
  ref: "User",
  localField: "applicant",
  foreignField: "_id",
  justOne: true,
});

// Pre-save hook to update job application count
jobApplicationSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      // Increment the applications count on the job
      await mongoose.model("Job").findByIdAndUpdate(
        this.job,
        { $inc: { applications: 1 } }
      );
    }
    next();
  } catch (error) {
    logger.error(`Error in job application pre-save hook: ${error.message}`);
    next(error);
  }
});

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);
export default JobApplication;
