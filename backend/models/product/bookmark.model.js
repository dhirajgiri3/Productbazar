// models/bookmark.model.js
import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

bookmarkSchema.index({ user: 1, product: 1 }, { unique: true });
const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
export default Bookmark;