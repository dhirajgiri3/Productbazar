import { jwtDecode } from "jwt-decode";
import logger from "../logger";

/**
 * Get the current access token from localStorage
 * @returns {string|null} The access token or null if not found
 */
export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

/**
 * Set the access token in localStorage
 * @param {string} token - The access token to store
 */
export const setAuthToken = (token) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", token);
};

/**
 * Remove the access token from localStorage
 */
export const removeAuthToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
};

/**
 * Store user data in localStorage
 * @param {Object} user - The user object to store
 */
export const setUserData = (user) => {
  if (typeof window === "undefined" || !user) return;
  localStorage.setItem("user", JSON.stringify(user));
};

/**
 * Get the current user data from localStorage
 * @returns {Object|null} The user object or null if not found
 */
export const getUserData = () => {
  if (typeof window === "undefined") return null;

  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    logger.error("Error parsing user data from localStorage", error);
    return null;
  }
};

/**
 * Remove user data from localStorage
 */
export const removeUserData = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
};

/**
 * Check if the access token is expired
 * @returns {boolean} True if token is expired or not found
 */
export const isTokenExpired = () => {
  const token = getAuthToken();
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch (error) {
    logger.error("Error decoding token", error);
    return true;
  }
};

/**
 * Check if the current user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getUserData();
  return !!token && !!user && !isTokenExpired();
};

/**
 * Check if the current user is an admin
 * @returns {boolean} True if user is an admin
 */
export const isAdmin = () => {
  const user = getUserData();
  return user?.role === "admin";
};

/**
 * Check if user's email is verified
 * @returns {boolean} True if email is verified
 */
export const isEmailVerified = () => {
  const user = getUserData();
  return user?.isEmailVerified === true;
};

/**
 * Check if user's phone is verified
 * @returns {boolean} True if phone is verified
 */
export const isPhoneVerified = () => {
  const user = getUserData();
  return user?.isPhoneVerified === true;
};

/**
 * Check if user's profile is completed
 * @returns {boolean} True if profile is completed
 */
export const isProfileCompleted = () => {
  const user = getUserData();
  return user?.isProfileCompleted === true;
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = () => {
  if (typeof window === "undefined") return;

  removeAuthToken();
  removeUserData();
  localStorage.removeItem("nextStep");
};

/**
 * Get authentication next step data
 * @returns {Object|null} The next step object or null
 */
export const getNextStep = () => {
  if (typeof window === "undefined") return null;

  try {
    const nextStep = localStorage.getItem("nextStep");
    return nextStep ? JSON.parse(nextStep) : null;
  } catch (error) {
    logger.error("Error parsing nextStep data from localStorage", error);
    return null;
  }
};

/**
 * Set authentication next step data
 * @param {Object} nextStep - The next step object
 */
export const setNextStep = (nextStep) => {
  if (typeof window === "undefined" || !nextStep) return;
  localStorage.setItem("nextStep", JSON.stringify(nextStep));
};

/**
 * Get authentication state for the current user
 * @returns {Object} Object containing various auth state flags
 */
export const getAuthState = () => {
  const user = getUserData();
  return {
    isAuthenticated: !!user && !!getAuthToken() && !isTokenExpired(),
    isEmailVerified: isEmailVerified(),
    isPhoneVerified: isPhoneVerified(),
    isProfileCompleted: isProfileCompleted(),
    isAdmin: isAdmin(),
    nextStep: getNextStep(),
    user,
  };
};

/**
 * Check if user needs verification (email or phone)
 * @returns {Object} Object with needsEmailVerification and needsPhoneVerification flags
 */
export const getVerificationNeeds = () => {
  const user = getUserData();
  return {
    needsEmailVerification: user?.email && !user?.isEmailVerified,
    needsPhoneVerification: user?.phone && !user?.isPhoneVerified,
  };
};

/**
 * Get appropriate redirect path based on current auth state
 * @param {string} defaultPath - Default path to redirect to if fully authenticated
 * @returns {string} The path to redirect to
 */
export const getAuthRedirectPath = (defaultPath = null) => {
  const user = getUserData();
  const { needsEmailVerification, needsPhoneVerification } =
    getVerificationNeeds();

  if (!user) return "/auth/login";
  if (!user.isProfileCompleted) return "/complete-profile";
  if (needsEmailVerification && needsPhoneVerification)
    return "/auth/verify-both";
  if (needsEmailVerification) return "/auth/verify-email";
  if (needsPhoneVerification) return "/auth/verify-phone";

  // If user has a username, redirect to their profile page
  if (user.username && !defaultPath) {
    return `/user/${user.username}`;
  }

  // If defaultPath is provided, use it, otherwise redirect to home
  return defaultPath || "/app";
};

/**
 * Parse token payload
 * @param {string} token - The JWT token to parse
 * @returns {Object|null} Decoded token payload or null
 */
export const parseToken = (token) => {
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (error) {
    logger.error("Error decoding token", error);
    return null;
  }
};

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getUserData,
  setUserData,
  removeUserData,
  isAuthenticated,
  isAdmin,
  isEmailVerified,
  isPhoneVerified,
  isProfileCompleted,
  clearAuthData,
  getNextStep,
  setNextStep,
  getAuthState,
  getVerificationNeeds,
  getAuthRedirectPath,
  parseToken,
};
