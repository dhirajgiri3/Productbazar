import mongoose from 'mongoose';

const upvoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // No index here, defined in compound indexes below
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
    // No index here, defined in compound indexes below
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can only upvote a product once
upvoteSchema.index({ user: 1, product: 1 }, { unique: true });

// Index for efficiently querying upvotes by product
upvoteSchema.index({ product: 1, createdAt: -1 });

// Index for efficiently querying a user's upvotes
upvoteSchema.index({ user: 1, createdAt: -1 });

// Check if model exists before creating it to prevent OverwriteModelError
const Upvote = mongoose.models.Upvote || mongoose.model('Upvote', upvoteSchema);
export default Upvote;
