// models/blacklist.model.js

import mongoose from "mongoose";

const BlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically removes expired tokens
    },
  },
  { timestamps: true }
);

const Blacklist = mongoose.model("Blacklist", BlacklistSchema);

export default Blacklist;