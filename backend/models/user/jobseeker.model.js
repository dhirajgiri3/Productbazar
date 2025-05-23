import mongoose from "mongoose";

const jobseekerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    jobTitle: {
      type: String,
      trim: true,
      default: "Professional"
    },
    experience: {
      type: String,
      enum: ["Entry Level", "Junior", "Mid-Level", "Senior", "Executive"],
      default: "Mid-Level"
    },
    skills: {
      type: [String],
      default: ["Communication"]
    },
    education: [{
      institution: String,
      degree: String,
      fieldOfStudy: String,
      startYear: Number,
      endYear: Number
    }],
    workExperience: [{
      company: String,
      position: String,
      description: String,
      startDate: Date,
      endDate: Date,
      current: Boolean
    }],
    certifications: [{
      name: String,
      issuingOrganization: String,
      issueDate: Date,
      expirationDate: Date
    }],
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ["Basic", "Conversational", "Fluent", "Native"]
      }
    }],
    preferredJobTypes: {
      type: [String],
      default: ["Full-time"]
    },
    preferredLocations: {
      type: [String],
      default: []
    },
    expectedSalary: {
      amount: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: "USD"
      },
      period: {
        type: String,
        enum: ["Hourly", "Monthly", "Yearly"],
        default: "Yearly"
      }
    },
    resumeUrl: {
      type: String,
      trim: true
    },
    // Projects showcase for jobseekers
    projects: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true,
        maxlength: 1000
      },
      role: {
        type: String,
        trim: true
      },
      technologies: [String],
      startDate: Date,
      endDate: Date,
      current: {
        type: Boolean,
        default: false
      },
      url: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            return !v || /^https?:\/\/[^\s]+/.test(v);
          },
          message: "Please enter a valid project URL"
        }
      },
      images: [{
        url: String,
        publicId: String,
        caption: String
      }],
      achievements: [String]
    }],
    // Career goals and preferences
    careerGoals: {
      type: String,
      trim: true,
      maxlength: 500
    },
    availability: {
      type: String,
      enum: ["Immediate", "2 weeks", "1 month", "3 months", "Custom"],
      default: "2 weeks"
    },
    customAvailability: {
      type: String,
      trim: true,
      maxlength: 100
    },
    remoteWorkPreference: {
      type: String,
      enum: ["Remote only", "Hybrid", "On-site", "Flexible"],
      default: "Flexible"
    },
    willingToRelocate: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual to get associated user data
jobseekerSchema.virtual('userData', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

const Jobseeker = mongoose.model('Jobseeker', jobseekerSchema);
export default Jobseeker;