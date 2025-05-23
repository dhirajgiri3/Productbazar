import mongoose from "mongoose";

const freelancerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      default: ["Technology"]
    },
    specializations: {
      type: [String],
      default: []
    },
    experience: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate"
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 1
    },
    hourlyRate: {
      amount: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: "USD"
      }
    },
    fixedProjectRate: {
      minimum: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: "USD"
      }
    },
    availability: {
      type: String,
      enum: ["Full-time", "Part-time", "Weekends", "Flexible"],
      default: "Flexible"
    },
    // Enhanced portfolio structure
    portfolio: [{
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
      clientName: {
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
      testimonial: {
        content: String,
        author: String,
        position: String,
        company: String
      }
    }],
    education: [{
      institution: String,
      degree: String,
      fieldOfStudy: String,
      startYear: Number,
      endYear: Number
    }],
    certifications: [{
      name: String,
      issuingOrganization: String,
      issueDate: Date,
      expirationDate: Date,
      credentialId: String
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
      default: ["Remote"]
    },
    // Services offered
    services: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500
      },
      category: String,
      deliveryTime: {
        value: Number,
        unit: {
          type: String,
          enum: ["Hours", "Days", "Weeks", "Months"],
          default: "Days"
        }
      },
      price: {
        amount: Number,
        currency: {
          type: String,
          default: "USD"
        }
      }
    }],
    // Work preferences
    workPreferences: {
      remoteOnly: {
        type: Boolean,
        default: true
      },
      preferredClients: [String],
      preferredIndustries: [String],
      projectSize: {
        type: String,
        enum: ["Small", "Medium", "Large", "Enterprise", "Any"],
        default: "Any"
      },
      availableHoursPerWeek: {
        type: Number,
        min: 0,
        max: 168,
        default: 40
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual to get associated user data
freelancerSchema.virtual('userData', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

const Freelancer = mongoose.model('Freelancer', freelancerSchema);
export default Freelancer;