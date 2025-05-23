import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Category name must be at least 2 characters long"],
      maxlength: [50, "Category name cannot exceed 50 characters"]
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"]
    },
    icon: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^(https?:\/\/|data:image\/)[^\s]+/.test(v);
        },
        message: "Invalid icon URL format"
      }
    },
    color: {
      type: String,
      default: "#6366F1", // Default indigo color
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: "Invalid color hex code"
      }
    },
    order: {
      type: Number,
      default: 1000 // Default to a high number to place new categories at the end
    },
    featured: {
      type: Boolean,
      default: false
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual to get subcategories
categorySchema.virtual("subcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parentCategory"
});

// Virtual to get product count
categorySchema.virtual("productCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "category",
  count: true
});

// Pre-save middleware to generate slug
categorySchema.pre("save", async function(next) {
  // Only generate slug when name is modified
  if (!this.isModified("name")) {
    return next();
  }

  // Generate slug
  let baseSlug = slugify(this.name, {
    lower: true,
    strict: true
  });
  
  // Check if slug exists
  let slug = baseSlug;
  let counter = 0;
  let slugExists = true;
  
  while (slugExists) {
    if (counter > 0) {
      slug = `${baseSlug}-${counter}`;
    }
    
    const existingCategory = await mongoose.model("Category").findOne({ 
      slug, 
      _id: { $ne: this._id } 
    });
    
    if (!existingCategory) {
      slugExists = false;
    } else {
      counter++;
    }
  }
  
  this.slug = slug;
  next();
});

// Ensure there are no loops in the parent-child relationship
categorySchema.pre("save", async function(next) {
  if (!this.parentCategory) {
    return next();
  }
  
  // Check if parent is self
  if (this.parentCategory.toString() === this._id.toString()) {
    this.invalidate('parentCategory', 'A category cannot be its own parent');
    return next(new Error('A category cannot be its own parent'));
  }
  
  // Check for circular references (only one level deep for performance)
  const parent = await mongoose.model("Category").findById(this.parentCategory);
  if (parent && parent.parentCategory && parent.parentCategory.toString() === this._id.toString()) {
    this.invalidate('parentCategory', 'Circular reference detected in category hierarchy');
    return next(new Error('Circular reference detected in category hierarchy'));
  }
  
  next();
});

// Add method to get trending products in this category
categorySchema.methods.getTrendingProducts = async function(limit = 5) {
  const Product = mongoose.model('Product');
  return await Product.getTrendingProducts(limit, this._id);
};

// Enhanced method to get subcategories
categorySchema.methods.getSubcategories = async function() {
  const Subcategory = mongoose.model('Subcategory');
  
  try {
    const subcategories = await Subcategory.find({ 
      parentCategory: this._id,
      categoryType: 'Subcategory' 
    }).sort('order');
    
    return subcategories;
  } catch (error) {
    logger.error('Error fetching subcategories:', error);
    return [];
  }
};

// Add method to get products from subcategories
categorySchema.methods.getProductsWithSubcategories = async function(limit = 50) {
  try {
    // Get all subcategory IDs
    const subcategories = await this.getSubcategories();
    const allCategoryIds = [this._id, ...subcategories.map(sub => sub._id)];
    
    // Get products from this category and all subcategories
    const products = await mongoose.model('Product').find({
      category: { $in: allCategoryIds },
      status: 'Published'
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('maker', 'firstName lastName profilePicture');
    
    return products;
  } catch (error) {
    logger.error('Error fetching products with subcategories:', error);
    return [];
  }
};

// Add method to check if a category has subcategories
categorySchema.methods.hasSubcategories = async function() {
  const count = await mongoose.model('Category').countDocuments({ parentCategory: this._id });
  return count > 0;
};

// Add static method to convert a Category to a Subcategory
categorySchema.statics.convertToSubcategory = async function(categoryId, parentCategoryId) {
  const category = await this.findById(categoryId);
  if (!category) {
    throw new Error('Category not found');
  }
  
  const parentCategory = await this.findById(parentCategoryId);
  if (!parentCategory) {
    throw new Error('Parent category not found');
  }
  
  // Ensure parent is not already a subcategory
  if (parentCategory.parentCategory) {
    throw new Error('Parent category must be a top-level category');
  }
  
  // Update to make it a subcategory
  category.parentCategory = parentCategoryId;
  category.categoryType = 'Subcategory';
  category.level = 1;
  
  // Check if category has subcategories
  const hasSubcategories = await category.hasSubcategories();
  if (hasSubcategories) {
    // Move all subcategories to the parent
    await this.updateMany(
      { parentCategory: categoryId },
      { parentCategory: parentCategoryId, level: 2 }
    );
  }
  
  return await category.save();
};

// Add method to get subcategory tree
categorySchema.methods.getSubcategoryTree = async function() {
  const result = { 
    _id: this._id,
    name: this.name,
    slug: this.slug,
    children: []
  };
  
  const subcategories = await mongoose.model('Category').find({ parentCategory: this._id });
  for (const subcategory of subcategories) {
    result.children.push(await subcategory.getSubcategoryTree());
  }
  
  return result;
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  const rootCategories = await this.find({ parentCategory: null });
  const tree = [];
  
  for (const category of rootCategories) {
    tree.push(await category.getSubcategoryTree());
  }
  
  return tree;
};

const Category = mongoose.model("Category", categorySchema);
export default Category;
