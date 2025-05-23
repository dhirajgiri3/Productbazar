import mongoose from "mongoose";

const agencySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      default: "My Agency"
    },
    industry: {
      type: String,
      trim: true,
      default: "Technology"
    },
    // Enhanced services with categories and descriptions
    services: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      category: {
        type: String,
        trim: true
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500
      },
      expertise: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
        default: "Advanced"
      }
    }],
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501+"],
      default: "1-10"
    },
    yearFounded: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear()
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/[^\s]+/.test(v);
        },
        message: "Please enter a valid website URL"
      }
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    location: {
      country: String,
      city: String,
      address: String,
      zipCode: String
    },
    clientTypes: {
      type: [String],
      default: []
    },
    // Enhanced portfolio with more details
    portfolio: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      clientName: {
        type: String,
        trim: true
      },
      industry: {
        type: String,
        trim: true
      },
      description: {
        type: String,
        trim: true,
        maxlength: 1000
      },
      challenge: {
        type: String,
        trim: true,
        maxlength: 500
      },
      solution: {
        type: String,
        trim: true,
        maxlength: 500
      },
      results: {
        type: String,
        trim: true,
        maxlength: 500
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
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
      youtube: String,
      behance: String,
      dribbble: String
    },
    // Team members
    team: [{
      name: {
        type: String,
        trim: true
      },
      position: {
        type: String,
        trim: true
      },
      bio: {
        type: String,
        trim: true,
        maxlength: 500
      },
      photo: {
        url: String,
        publicId: String
      },
      socialLinks: {
        linkedin: String,
        twitter: String,
        github: String
      }
    }],
    // Pricing models
    pricingModels: [{
      name: {
        type: String,
        trim: true
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500
      },
      rateType: {
        type: String,
        enum: ["Hourly", "Fixed", "Retainer", "Value-based", "Other"],
        default: "Hourly"
      },
      rate: {
        amount: Number,
        currency: {
          type: String,
          default: "USD"
        }
      }
    }],
    // Certifications and partnerships
    certifications: [{
      name: String,
      issuingOrganization: String,
      issueDate: Date,
      expirationDate: Date,
      credentialId: String,
      credentialURL: String
    }],
    partnerships: [{
      partnerName: String,
      partnerType: String,
      description: String,
      startDate: Date,
      logo: {
        url: String,
        publicId: String
      }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual to get associated user data
agencySchema.virtual('userData', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

const Agency = mongoose.model('Agency', agencySchema);
export default Agency;