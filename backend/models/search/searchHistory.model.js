import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    query: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['all', 'products', 'jobs', 'projects', 'users'],
      default: 'all'
    },
    count: {
      type: Number,
      default: 1
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for efficient lookups
searchHistorySchema.index({ user: 1, query: 1, type: 1 }, { unique: true });
// Index for finding recent searches
searchHistorySchema.index({ user: 1, lastSearchedAt: -1 });
// Index for finding popular searches
searchHistorySchema.index({ count: -1 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

export default SearchHistory;
