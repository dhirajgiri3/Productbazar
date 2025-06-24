// src/Utils/jwt.utils.js

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid"; // Import uuid

dotenv.config();

// Generate Access Token
export const generateAccessToken = (userId) => {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m"; // 15 minutes
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn,
  });
};

// Generate Refresh Token with unique identifier (jti)
export const generateRefreshToken = (userId) => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d"; // 7 days
  const jti = uuidv4(); // Generate a unique identifier
  return jwt.sign({ id: userId, jti }, process.env.JWT_REFRESH_SECRET, {
    expiresIn,
  });
};

// Generate Email Verification Token
export const generateEmailToken = (userId) => {
  const expiresIn = process.env.JWT_EMAIL_VERIFICATION_EXPIRES_IN || "24h"; // 24 hours
  return jwt.sign({ id: userId }, process.env.JWT_EMAIL_VERIFICATION_SECRET, {
    expiresIn,
  });
};

// Verify Access Token
export const verifyAccessToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
  return new Promise((resolve, reject) => {
    if (!process.env.JWT_REFRESH_SECRET) {
      return reject(new Error('JWT_REFRESH_SECRET environment variable is not set'));
    }
    
    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
};

// Verify Email Token
export const verifyEmailToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_EMAIL_VERIFICATION_SECRET, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
};
