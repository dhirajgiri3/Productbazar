import mongoose from "mongoose";
import slugify from "slugify";

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tag name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Tag name must be at least 2 characters'],
    maxlength: [30, 'Tag name cannot exceed 30 characters'],
    lowercase: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  count: {
    type: Number,
    default: 0,
    min: 0
  },
  trending: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexing
tagSchema.index({ name: 1 }, { unique: true });
tagSchema.index({ slug: 1 }, { unique: true });
tagSchema.index({ count: -1 }); // For finding popular tags
tagSchema.index({ trending: 1, count: -1 }); // For finding trending tags

// Virtual for products using this tag
tagSchema.virtual('products', {
  ref: 'Product',
  localField: 'name',
  foreignField: 'tags'
});

// Pre-save hook to generate slug
tagSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

// Static method to update tag counts
tagSchema.statics.updateTagCounts = async function() {
  const Product = mongoose.model('Product');
  const tags = await this.find();
  
  for (const tag of tags) {
    const count = await Product.countDocuments({ 
      tags: tag.name,
      status: 'Published'
    });
    
    tag.count = count;
    await tag.save();
  }
};

// Static method to find trending tags
tagSchema.statics.findTrendingTags = async function(limit = 10) {
  // Get tags sorted by count
  const tags = await this.find()
    .sort({ count: -1 })
    .limit(limit * 2);
  
  // Mark top tags as trending
  for (let i = 0; i < Math.min(tags.length, limit); i++) {
    tags[i].trending = true;
    await tags[i].save();
  }
  
  return tags.slice(0, limit);
};

const Tag = mongoose.model('Tag', tagSchema);
export default Tag;
