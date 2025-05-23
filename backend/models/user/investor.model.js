import mongoose from "mongoose";

const investorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    investorType: {
      type: String,
      enum: ["Angel Investor", "Venture Capitalist", "Corporate Investor", "Individual", "Family Office", "Seed Fund", "Accelerator"],
      required: true,
      default: "Angel Investor"
    },
    // Enhanced investment focus with categories and strengths
    investmentFocus: [{
      category: {
        type: String,
        required: true,
        trim: true
      },
      subcategories: [String],
      strength: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
      },
      notes: String
    }],
    investmentRange: {
      min: {
        type: Number,
        default: 10000,
        min: 0
      },
      max: {
        type: Number,
        default: 50000,
        min: 0
      },
      currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY']
      },
      preferredDealSize: {
        type: Number,
        min: 0
      }
    },
    companyName: {
      type: String,
      default: "Individual Investor"
    },
    industry: {
      type: String,
      default: "Finance"
    },
    // Enhanced portfolio structure
    investmentPortfolio: [{
      companyName: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500
      },
      industry: {
        type: String,
        trim: true
      },
      stage: {
        type: String,
        enum: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Mature', 'Exit']
      },
      amount: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: 'USD'
      },
      investmentDate: Date,
      exitDate: Date,
      active: {
        type: Boolean,
        default: true
      },
      equity: {
        type: Number,
        min: 0,
        max: 100
      },
      outcome: {
        type: String,
        enum: ['Exit', 'Acquired', 'IPO', 'Active', 'Failed', 'Other']
      },
      returnMultiple: {
        type: Number,
        min: 0
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
      logo: {
        url: String,
        publicId: String
      },
      highlights: [String],
      learnings: String
    }],
    // Previous investments for backward compatibility
    previousInvestments: [{
      companyName: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        min: 0
      },
      year: {
        type: Number,
        validate: {
          validator: function(v) {
            return v >= 1900 && v <= new Date().getFullYear();
          },
          message: "Investment year must be between 1900 and current year"
        }
      },
      description: String,
      outcome: {
        type: String,
        enum: ['Exit', 'Acquired', 'IPO', 'Active', 'Failed', 'Other']
      }
    }],
    location: {
      country: String,
      city: String,
      region: String
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/[^\s]+/.test(v);
        },
        message: "Please enter a valid website URL"
      }
    },
    // Enhanced investment criteria
    investmentCriteria: {
      industries: [String],
      technologies: [String],
      businessModels: [String],
      geographies: [String],
      marketSize: {
        type: String,
        enum: ['Small', 'Medium', 'Large', 'Any'],
        default: 'Any'
      },
      teamRequirements: [String],
      exclusions: [String]
    },
    preferredStages: [{
      type: String,
      enum: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Mature']
    }],
    // Investment thesis
    investmentThesis: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    // Investment process
    investmentProcess: [{
      stage: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500
      },
      timeframe: String
    }],
    // Value add
    valueAdd: [{
      category: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500
      }
    }],
    // Network and connections
    network: {
      otherInvestors: [String],
      corporatePartners: [String],
      accelerators: [String],
      serviceProviders: [String]
    },
    // Achievements and credentials
    achievements: [{
      title: String,
      date: Date,
      description: String
    }],
    // Availability for meetings
    availability: {
      type: String,
      enum: ['Limited', 'Moderate', 'Open', 'By Referral Only'],
      default: 'Moderate'
    },
    // Contact preferences
    contactPreferences: {
      method: {
        type: String,
        enum: ['Email', 'Phone', 'Introduction', 'Platform', 'Other'],
        default: 'Email'
      },
      notes: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Replace the problematic validation with a pre-validate hook
investorSchema.pre('validate', function(next) {
  if (this.investmentRange &&
      this.investmentRange.min != null &&
      this.investmentRange.max != null &&
      this.investmentRange.min > this.investmentRange.max) {
    this.invalidate('investmentRange',
      'Minimum investment must be less than or equal to maximum investment');
  }
  next();
});

// Virtual to get associated user data
investorSchema.virtual('userData', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

const Investor = mongoose.model('Investor', investorSchema);
export default Investor;