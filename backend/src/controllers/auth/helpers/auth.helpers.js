// Controllers/auth/auth.helpers.js
import { validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import User from "../../../models/user/user.model.js"; // Adjust path as needed
import {
  ValidationError,
} from "../../../utils/logging/error.js"; // Adjust path as needed
import { maskPhone } from "../../../utils/communication/phone.utils.js"; // Adjust path as needed
import { generateEmailToken } from "../../../utils/auth/jwt.utils.js"; // Adjust path as needed
import { maskEmail, sendVerificationEmail } from "../../../utils/communication/mail.utils.js"; // Adjust path as needed
import { sendOTP } from "../../../utils/communication/twilio.utils.js"; // Adjust path as needed

// Helper function to handle validation errors
export const handleValidationErrors = (req, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    next(new ValidationError(messages));
    return true;
  }
  return false;
};

// Password strength validation
export const isStrongPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);
};

// Sanitize user input
export const sanitizeInput = (text) => {
  if (typeof text !== "string") return text;
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
};

// Standardized response format
export const formatResponse = (status, message, data = {}, nextStep = null) => ({
  status,
  message,
  data,
  nextStep,
});

/**
 * Ensures user address is properly structured as an object
 * @param {Object} user - User document
 * @returns {Promise} - Promise that resolves when the address is updated
 */
export const ensureAddressStructure = async (user) => {
  // If address is a string or doesn't exist, update it directly in the database
  if (typeof user.address === 'string' || !user.address) {
    const street = typeof user.address === 'string' ? user.address : '';
    await User.updateOne(
      { _id: user._id },
      { $set: { address: { street, city: '', country: '' } } }
    );
    // Update the user object in memory for immediate use if needed
    user.address = { street, city: '', country: '' };
  }
  // If it's already an object, make sure it has all required fields
  else if (typeof user.address === 'object') {
    const needsUpdate = !('street' in user.address) || !('city' in user.address) || !('country' in user.address);

    if (needsUpdate) {
      const updatedAddress = {
        street: user.address.street || '',
        city: user.address.city || '',
        country: user.address.country || ''
      };
      await User.updateOne(
        { _id: user._id },
        { $set: { address: updatedAddress } }
      );
      user.address = updatedAddress;
    }
  }
};


// Send verification for unverified methods
export const sendVerificationForMissingMethods = async (user) => {
  const verificationTasks = [];
  if (
    user.needsEmailVerification &&
    user.needsEmailVerification() &&
    user.email
  ) {
    const emailToken = generateEmailToken(user._id);
    const verificationLink = `${process.env.CLIENT_URL}/auth/verify-email/${emailToken}`;
    verificationTasks.push(
      sendVerificationEmail(
        user.email,
        "Verify Your Email",
        `Please verify your email: ${verificationLink}`
      )
    );
  }
  if (
    user.needsPhoneVerification &&
    user.needsPhoneVerification() &&
    user.phone
  ) {
    // Consider adding rate limiting check here if needed separately
    verificationTasks.push(sendOTP(user.phone));
  }
  await Promise.all(verificationTasks);
  return verificationTasks.length > 0;
};

// Get detailed profile completion information
export const getProfileCompletionDetails = (user) => {
  const requiredFields = ["firstName", "lastName", "phone", "email", "about"]; // Adjust as needed
  const recommendedFields = ["bio", "address.country", "address.city"]; // Use dot notation for nested fields
  const missingRequired = requiredFields.filter((field) => {
      // Handle nested fields
      if (field.includes('.')) {
          const keys = field.split('.');
          let value = user;
          for (const key of keys) {
              value = value?.[key];
              if (value === undefined || value === null || value === '') return true; // Field is missing or empty
          }
          return false; // Field exists and has a value
      }
      return !user[field];
  });
  const missingRecommended = recommendedFields.filter((field) => {
       if (field.includes('.')) {
          const keys = field.split('.');
          let value = user;
          for (const key of keys) {
              value = value?.[key];
              if (value === undefined || value === null || value === '') return true;
          }
          return false;
      }
      return !user[field];
  });

  const requiredWeight = 0.7;
  const recommendedWeight = 0.3;
  const requiredCompletion =
    (requiredFields.length - missingRequired.length) / requiredFields.length;
  const recommendedCompletion =
    recommendedFields.length > 0
      ? (recommendedFields.length - missingRecommended.length) /
        recommendedFields.length
      : 1;
  const completionPercentage = Math.round(
    (requiredCompletion * requiredWeight +
      recommendedCompletion * recommendedWeight) *
      100
  );

  if (!user.email && !user.phone)
    missingRequired.push("contact method (email or phone)");

  return {
    missingFields: missingRequired,
    recommendedFields: missingRecommended,
    completionPercentage,
    isComplete: missingRequired.length === 0,
  };
};

// Provide personalized recommendations
export const getAuthRecommendations = (user) => {
  const recommendations = [];
  if (user.email && !user.isEmailVerified) // Changed condition
    recommendations.push({
      type: "verify_email",
      message: "Verify your email for security",
      priority: "high",
    });
  if (user.phone && !user.isPhoneVerified) // Changed condition
    recommendations.push({
      type: "verify_phone",
      message: "Verify your phone for recovery",
      priority: "medium",
    });
   if (!user.email) // Added condition
    recommendations.push({
      type: "add_email",
      message: "Add an email address",
      priority: "high",
    });
   if (!user.phone) // Added condition
    recommendations.push({
      type: "add_phone",
      message: "Add a phone number",
      priority: "medium",
    });
  if (user.isProfileCompleted && !user.bio)
    recommendations.push({
      type: "add_bio",
      message: "Add a bio to personalize your profile",
      priority: "low",
    });
  return recommendations;
};

// Determine next verification steps
export const getVerificationNextStep = (user) => {
  const steps = [];
  let priority = 1;

  const authJourney = {
    EMAIL_VERIFICATION: {
      type: "email_verification",
      title: "Email Verification",
      description: "Verify your email address",
    },
    PHONE_VERIFICATION: {
      type: "phone_verification",
      title: "Phone Verification",
      description: "Verify your phone number",
    },
    PROFILE_COMPLETION: {
      type: "profile_completion",
      title: "Complete Your Profile",
      description: "Add required details",
    },
  };

  const totalVerificationMethods = !!user.email + !!user.phone;
  const verifiedMethods =
    (user.isEmailVerified ? 1 : 0) + (user.isPhoneVerified ? 1 : 0);
  const verificationPercentage =
    totalVerificationMethods > 0
      ? Math.round((verifiedMethods / totalVerificationMethods) * 100)
      : 0;

  if (
    user.email && // Check if email exists first
    user.needsEmailVerification &&
    user.needsEmailVerification()
  ) {
    steps.push({
      ...authJourney.EMAIL_VERIFICATION,
      priority: priority++,
      required: true,
      message: "Please verify your email address",
      action: "verify_email",
      actionLabel: "Verify Email",
      data: {
        email: maskEmail(user.email),
        lastSent: user.lastEmailVerificationRequest || null,
      },
    });
  }

  if (
    user.phone && // Check if phone exists first
    user.needsPhoneVerification &&
    user.needsPhoneVerification()
  ) {
    steps.push({
      ...authJourney.PHONE_VERIFICATION,
      priority: priority++,
      required: true,
      message: "Please verify your phone number",
      action: "verify_phone",
      actionLabel: "Verify Phone",
      data: { phone: maskPhone(user.phone), lastSent: user.otpSentAt || null },
    });
  }

  const profileCompletionDetails = getProfileCompletionDetails(user);
  // Only suggest profile completion if at least one verification method is complete
  if (
    (user.isEmailVerified || user.isPhoneVerified) &&
    !profileCompletionDetails.isComplete // Check against the calculated detail
  ) {
    steps.push({
      ...authJourney.PROFILE_COMPLETION,
      priority: priority++,
      required: false, // Changed to false to make it skippable
      skippable: true, // Added skippable flag
      message: `Complete your profile (Missing: ${profileCompletionDetails.missingFields.join(
        ", "
      )})`,
      action: "complete_profile",
      actionLabel: "Complete Profile",
      data: {
        ...profileCompletionDetails,
        completionPercentage: profileCompletionDetails.completionPercentage,
      },
    });
  }

  if (steps.length === 0) return null;

  steps.sort((a, b) => a.priority - b.priority);
  const totalSteps = 3; // Fixed total steps (Email, Phone, Profile)
  const completedSteps = totalSteps - steps.length;
  const overallPercentage = Math.round((completedSteps / totalSteps) * 100);

  return {
    ...steps[0], // The immediate next step
    allSteps: steps,
    progress: {
      total: totalSteps,
      remaining: steps.length,
      completed: completedSteps,
      percentage: overallPercentage,
      verificationStatus: {
        percentage: verificationPercentage,
        emailVerified: user.isEmailVerified,
        phoneVerified: user.isPhoneVerified,
        profileCompleted: profileCompletionDetails.isComplete, // Use calculated detail
      },
    },
    recommendations: getAuthRecommendations(user),
  };
};

// Helper functions
export const cleanProfileData = (data) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach((key) => {
    if (typeof cleaned[key] === "string") cleaned[key] = cleaned[key].trim();
  });
  return cleaned;
};