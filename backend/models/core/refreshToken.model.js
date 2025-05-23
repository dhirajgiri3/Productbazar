// models/refreshToken.model.js

import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    createdByIp: {
      type: String,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedByIp: {
      type: String,
      default: null,
    },
    replacedByToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual to check if the token is expired
RefreshTokenSchema.virtual("isExpired").get(function () {
  return Date.now() >= this.expiresAt;
});

// Virtual to check if the token is active (not revoked and not expired)
RefreshTokenSchema.virtual("isActive").get(function () {
  return !this.revokedAt && !this.isExpired;
});

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);

export default RefreshToken;