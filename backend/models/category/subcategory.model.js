import mongoose from "mongoose";
import Category from "./category.model.js";
import slugify from "slugify";

// Subcategory schema inherits from the Category schema
const subcategorySchema = new mongoose.Schema({
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'A subcategory must have a parent category'],
    validate: {
      validator: async function(value) {
        // Ensure parent exists and is not a subcategory itself (only one level deep)
        const parent = await mongoose.model('Category').findById(value);
        return parent && parent.parentCategory === null;
      },
      message: 'Parent category must exist and must be a top-level category'
    }
  },
  featuredInParent: {
    type: Boolean,
    default: false
  },
  showInMenu: {
    type: Boolean,
    default: true
  },
  level: {
    type: Number,
    default: 1,
    enum: [1, 2],  // Allow only 1 or 2 levels deep
    required: true
  }
}, {
  discriminatorKey: 'categoryType'
});

// Add pre-save middleware to ensure consistency
subcategorySchema.pre('save', async function(next) {
  if (!this.categoryType) {
    this.categoryType = 'Subcategory';
  }
  
  if (this.isModified('name') || this.isNew) {
    // Make sure slug is properly set
    this.slug = slugify(this.name, { lower: true });
    
    // Make sure level is set properly
    this.level = 1;
  }
  
  next();
});

// Enhanced method to get related products
subcategorySchema.methods.getRelatedProducts = async function(limit = 10) {
  const Product = mongoose.model('Product');
  return await Product.find({ 
    category: this._id,
    categoryType: 'Subcategory',
    status: 'Published'
  })
  .sort({ trendingScore: -1 })
  .limit(limit)
  .populate('maker', 'firstName lastName profilePicture');
};

// Enhanced method to get sibling subcategories
subcategorySchema.methods.getSiblingCategories = async function() {
  if (!this.parentCategory) return [];
  
  return await mongoose.model('Subcategory').find({
    parentCategory: this.parentCategory,
    _id: { $ne: this._id },
    categoryType: 'Subcategory'
  }).sort('order');
};

// Register the Subcategory model as a discriminator of Category
const Subcategory = Category.discriminator('Subcategory', subcategorySchema);

// Export the model
export default Subcategory;
