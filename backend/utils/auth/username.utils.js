import User from "../../models/user/user.model.js";
import logger from "../logging/logger.js";

/**
 * Generate a unique username based on a base string
 * @param {string} baseUsername - Base username to work from
 * @param {number} maxAttempts - Maximum attempts to find unique username
 * @returns {Promise<string>} - Unique username
 */
export const generateUsername = async (baseUsername, maxAttempts = 10) => {
  try {
    // Clean the base username
    let cleanBase = baseUsername
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '') // Remove invalid characters
      .substring(0, 20); // Limit length

    if (!cleanBase || cleanBase.length < 3) {
      cleanBase = 'user'; // Fallback for very short or empty bases
    }

    // Try the base username first
    let username = cleanBase;
    let existingUser = await User.findOne({ username });
    
    if (!existingUser) {
      return username;
    }

    // If base is taken, try with numbers
    for (let i = 1; i <= maxAttempts; i++) {
      username = `${cleanBase}${i}`;
      existingUser = await User.findOne({ username });
      
      if (!existingUser) {
        return username;
      }
    }

    // If all attempts failed, use timestamp
    username = `${cleanBase}${Date.now().toString().slice(-6)}`;
    existingUser = await User.findOne({ username });
    
    if (!existingUser) {
      return username;
    }

    // Final fallback - use random string
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    username = `${cleanBase}${randomSuffix}`;
    
    return username;
  } catch (error) {
    logger.error("Error generating username:", error);
    throw new Error("Failed to generate unique username");
  }
};

/**
 * Check if a username is available
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} - Whether username is available
 */
export const isUsernameAvailable = async (username) => {
  try {
    if (!username || username.length < 3 || username.length > 30) {
      return false;
    }

    // Check format
    const usernameRegex = /^[a-z0-9._-]+$/;
    if (!usernameRegex.test(username)) {
      return false;
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    return !existingUser;
  } catch (error) {
    logger.error("Error checking username availability:", error);
    return false;
  }
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {Object} - Validation result with isValid and message
 */
export const validateUsername = (username) => {
  if (!username) {
    return { isValid: false, message: "Username is required" };
  }

  if (username.length < 3) {
    return { isValid: false, message: "Username must be at least 3 characters" };
  }

  if (username.length > 30) {
    return { isValid: false, message: "Username cannot exceed 30 characters" };
  }

  const usernameRegex = /^[a-z0-9._-]+$/;
  if (!usernameRegex.test(username)) {
    return { 
      isValid: false, 
      message: "Username can only contain letters, numbers, dots, underscores, and hyphens" 
    };
  }

  // Check for reserved usernames
  const reservedUsernames = [
    'admin', 'api', 'www', 'mail', 'ftp', 'root', 'support', 'help',
    'info', 'contact', 'about', 'privacy', 'terms', 'login', 'register',
    'signin', 'signup', 'auth', 'user', 'users', 'profile', 'settings',
    'dashboard', 'account', 'password', 'forgot', 'reset', 'verify',
    'verification', 'confirm', 'confirmation', 'activate', 'activation'
  ];

  if (reservedUsernames.includes(username.toLowerCase())) {
    return { isValid: false, message: "This username is reserved" };
  }

  return { isValid: true, message: "Username is valid" };
};
