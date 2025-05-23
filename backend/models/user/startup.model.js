import mongoose from "mongoose";

const startupSchema = new mongoose.Schema(
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
      default: "My Startup"
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: 150
    },
    industry: {
      type: String,
      required: true,
      default: "Technology"
    },
    // Multiple categories/industries
    categories: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      primary: {
        type: Boolean,
        default: false
      }
    }],
    fundingStage: {
      type: String,
      enum: ["Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Bootstrapped", "Other"],
      default: "Pre-seed"
    },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
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
    // Enhanced location information
    location: {
      country: String,
      city: String,
      state: String,
      address: String,
      zipCode: String,
      remote: {
        type: Boolean,
        default: false
      },
      multipleLocations: {
        type: Boolean,
        default: false
      },
      additionalLocations: [{
        country: String,
        city: String,
        state: String
      }]
    },
    // Enhanced funding information
    funding: {
      stage: {
        type: String,
        enum: ["Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Bootstrapped", "Other"],
        default: "Pre-seed"
      },
      totalRaised: {
        amount: Number,
        currency: {
          type: String,
          default: "USD"
        }
      },
      lastRound: {
        type: String,
        date: Date,
        amount: Number,
        investors: [String],
        leadInvestor: String
      },
      seeking: {
        type: Boolean,
        default: false
      },
      seekingAmount: {
        amount: Number,
        currency: {
          type: String,
          default: "USD"
        }
      },
      valuation: {
        amount: Number,
        currency: {
          type: String,
          default: "USD"
        }
      },
      fundingHistory: [{
        round: String,
        date: Date,
        amount: Number,
        currency: {
          type: String,
          default: "USD"
        },
        investors: [String],
        leadInvestor: String,
        notes: String
      }]
    },
    // Legacy funding field for backward compatibility
    fundingRaised: {
      amount: Number,
      currency: {
        type: String,
        default: "USD"
      }
    },
    // Team information
    team: {
      size: {
        type: Number,
        min: 1
      },
      hiring: {
        type: Boolean,
        default: false
      },
      openPositions: [{
        title: String,
        department: String,
        location: String,
        remote: Boolean,
        link: String
      }],
      members: [{
        name: String,
        position: String,
        bio: String,
        linkedin: String,
        photo: {
          url: String,
          publicId: String
        }
      }]
    },
    // Legacy team size field for backward compatibility
    teamSize: {
      type: Number,
      min: 1
    },
    // Enhanced products launched
    productsLaunched: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true,
        maxlength: 1000
      },
      launchDate: Date,
      status: {
        type: String,
        enum: ["Concept", "Alpha", "Beta", "Live", "Discontinued"],
        default: "Live"
      },
      url: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            return !v || /^https?:\/\/[^\s]+/.test(v);
          },
          message: "Please enter a valid product URL"
        }
      },
      images: [{
        url: String,
        publicId: String,
        caption: String
      }],
      technologies: [String],
      metrics: {
        users: Number,
        revenue: Number,
        growth: String,
        other: String
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    }],
    // Enhanced social links
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
      youtube: String,
      github: String,
      medium: String,
      tiktok: String,
      productHunt: String
    },
    // Business metrics
    metrics: {
      revenue: {
        amount: Number,
        currency: {
          type: String,
          default: "USD"
        },
        recurring: Boolean,
        period: {
          type: String,
          enum: ["Monthly", "Annual", "Quarterly"],
          default: "Monthly"
        }
      },
      users: Number,
      customers: Number,
      growthRate: String,
      runway: {
        months: Number,
        lastUpdated: Date
      },
      unitEconomics: {
        cac: Number,
        ltv: Number,
        margin: Number
      }
    },
    // Business model
    businessModel: {
      type: String,
      enum: ["SaaS", "Marketplace", "E-commerce", "Consumer", "Enterprise", "Hardware", "Advertising", "Subscription", "Transactional", "Freemium", "Other"],
      default: "SaaS"
    },
    // Target market
    targetMarket: {
      customerTypes: [String],
      regions: [String],
      marketSize: {
        tam: Number, // Total Addressable Market
        sam: Number, // Serviceable Addressable Market
        som: Number  // Serviceable Obtainable Market
      }
    },
    // Pitch materials
    pitchMaterials: {
      deck: {
        url: String,
        publicId: String
      },
      video: {
        url: String,
        publicId: String
      },
      onePager: {
        url: String,
        publicId: String
      }
    },
    // Achievements and milestones
    achievements: [{
      title: String,
      date: Date,
      description: String
    }],
    // Competitors
    competitors: [{
      name: String,
      website: String,
      differentiator: String
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual to get associated user data
startupSchema.virtual('userData', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Virtual to get associated products
startupSchema.virtual('products', {
  ref: 'Product',
  localField: 'user',
  foreignField: 'maker',
  justOne: false
});

const Startup = mongoose.model('Startup', startupSchema);
export default Startup;