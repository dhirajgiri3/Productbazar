import slugify from 'slugify';
import mongoose from 'mongoose';
import Product from '../../models/product/product.model.js';
import crypto from 'crypto';

/**
 * Generate a unique slug for a product
 * @param {string} name - The product name to generate a slug from
 * @param {string} existingId - Optional existing product ID to exclude from uniqueness check
 * @returns {Promise<string>} - A unique slug
 */
export const generateUniqueSlug = async (name, existingId = null) => {
  if (!name) {
    name = 'untitled-product-' + crypto.randomBytes(2).toString('hex');
  }
  
  // Configure slugify options
  const options = {
    replacement: '-',    // replace spaces with -
    lower: true,         // convert to lowercase
    strict: true,        // remove special chars
    trim: true           // trim leading/trailing spaces
  };
  
  // Generate base slug
  let slug = slugify(name, options);
  
  // Limit slug length
  if (slug.length > 80) {
    slug = slug.substring(0, 80);
  }
  
  // For very short or invalid slugs, add random suffix
  if (slug.length < 3) {
    slug = slug + '-' + crypto.randomBytes(2).toString('hex');
  }
  
  // Check if slug already exists and append counter if needed
  let counter = 0;
  let uniqueSlug = slug;
  let existingProduct;
  
  do {
    // Check if slug exists for any other product
    const query = { slug: uniqueSlug };
    
    // Exclude current product if updating
    if (existingId) {
      query._id = { $ne: mongoose.Types.ObjectId(existingId) };
    }
    
    existingProduct = await Product.findOne(query);
    
    // If slug is not unique, append counter and check again
    if (existingProduct) {
      counter++;
      uniqueSlug = `${slug}-${counter}`;
    }
  } while (existingProduct);
  
  return uniqueSlug;
};

export default generateUniqueSlug;