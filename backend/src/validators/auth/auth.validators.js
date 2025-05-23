// validators/auth.validators.js

import { body, param, query } from "express-validator";

/**
 * Validator for requesting OTP for registration or login.
 */
export const validateRequestOtp = [
  param("type")
    .isIn(["register", "login", "verify"])
    .withMessage("Type must be either 'register', 'login', or 'verify'"),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
];

/**
 * Validator for requesting OTP for registration or login (legacy name).
 */
export const requestOtpValidator = [
  param("type")
    .isIn(["register", "login"])
    .withMessage("Type must be either 'register' or 'login'"),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
];

/**
 * Validator for verifying OTP for registration or login.
 */
export const validateVerifyOtp = [
  param("type")
    .isIn(["register", "login", "verify"])
    .withMessage("Type must be either 'register', 'login', or 'verify'"),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
  body("code")
    .notEmpty()
    .withMessage("OTP code is required")
    .isNumeric()
    .withMessage("OTP code must be numeric")
    .isLength({ min: 4, max: 6 })
    .withMessage("OTP code must be between 4 and 6 digits"),
  body("role")
    .optional()
    .isIn([
      "user",
      "startupOwner",
      "investor",
      "agency",
      "freelancer",
      "jobseeker",
    ])
    .withMessage("Invalid role specified"),
  body("roleDetails")
    .optional()
    .isObject()
    .withMessage("Role details must be an object"),
];

/**
 * Validator for verifying OTP for registration or login (legacy name).
 */
export const verifyOtpValidator = [
  param("type")
    .isIn(["register", "login"])
    .withMessage("Type must be either 'register' or 'login'"),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
  body("code")
    .notEmpty()
    .withMessage("OTP code is required")
    .isNumeric()
    .withMessage("OTP code must be numeric")
    .isLength({ min: 4, max: 6 })
    .withMessage("OTP code must be between 4 and 6 digits"),
  body("role")
    .optional()
    .isIn([
      "user",
      "startupOwner",
      "investor",
      "agency",
      "freelancer",
      "jobseeker",
    ])
    .withMessage("Invalid role specified"),
  body("roleDetails")
    .optional()
    .isObject()
    .withMessage("Role details must be an object"),
];

/**
 * Validator for resending email verification.
 */
export const resendEmailVerificationValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
];

/**
 * Validator for checking if a user exists by email or phone.
 */
export const checkUserExistsValidator = [
  query("type")
    .isIn(["phone", "email"])
    .withMessage("Type must be either 'phone' or 'email'"),
  query("value")
    .notEmpty()
    .withMessage("Value is required")
    .custom((value, { req }) => {
      const { type } = req.query;
      if (type === "phone" && !/^\+?[1-9]\d{1,14}$/.test(value)) {
        throw new Error("Invalid phone number format");
      }
      if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error("Invalid email format");
      }
      return true;
    }),
];

/**
 * Validator for phone validation.
 */
export const validatePhone = [
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
];

/**
 * Validator for verifying OTP for phone verification.
 */
export const validateVerifyPhoneOtp = [
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
  body("code")
    .notEmpty()
    .withMessage("OTP code is required")
    .isNumeric()
    .withMessage("OTP code must be numeric")
    .isLength({ min: 4, max: 6 })
    .withMessage("OTP code must be between 4 and 6 digits"),
];

/**
 * Validator for phone verification (sending OTP).
 */
export const phoneVerificationOtpValidator = [
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
];

/**
 * Validator for verifying OTP for phone verification.
 */
export const verifyOtpForPhoneValidator = [
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
  body("code")
    .notEmpty()
    .withMessage("OTP code is required")
    .isNumeric()
    .withMessage("OTP code must be numeric")
    .isLength({ min: 4, max: 6 })
    .withMessage("OTP code must be between 4 and 6 digits"),
];

/**
 * Validator for email registration.
 */
export const emailRegistrationValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("role")
    .optional()
    .isIn([
      "user",
      "startupOwner",
      "investor",
      "agency",
      "freelancer",
      "jobseeker",
    ])
    .withMessage("Invalid role specified"),
  body("roleDetails")
    .optional()
    .isObject()
    .withMessage("Role details must be an object"),
];

/**
 * Validator for email login.
 */
export const emailLoginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Validator for phone verification.
 */
export const phoneVerificationValidator = [
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
  body("code")
    .notEmpty()
    .withMessage("Verification code is required")
    .isNumeric()
    .withMessage("Verification code must be numeric")
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be 6 digits"),
];

/**
 * Validator for email verification resend.
 */
export const emailVerificationResendValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
];

/**
 * Validator for registration.
 */
export const validateRegister = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),

  body('role')
    .optional()
    .isIn(['user', 'startupOwner', 'investor', 'agency', 'freelancer', 'jobseeker'])
    .withMessage('Invalid role specified'),

  body('roleDetails')
    .optional()
    .isObject().withMessage('Role details must be an object')
];

/**
 * Validator for login.
 */
export const validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Validator for email validation.
 */
export const validateEmail = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail()
];

/**
 * Validator for token validation.
 */
export const validateToken = [
  body('token')
    .notEmpty().withMessage('Token is required')
];

/**
 * Validator for password reset token.
 */
export const validatePasswordReset = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),

  body('email')
    .optional()
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail()
];

/**
 * Validator for setting a new password.
 */
export const validateNewPassword = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
];

/**
 * Validator for profile completion.
 */
export const validateProfileCompletion = [
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),

  body('lastName')
    .notEmpty().withMessage('Last name is required')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores and hyphens'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),

  body('address')
    .optional()
    .isObject().withMessage('Address must be an object'),

  body('address.country')
    .optional()
    .isString().withMessage('Country must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Country must be between 2 and 100 characters'),

  body('address.city')
    .optional()
    .isString().withMessage('City must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('City must be between 2 and 100 characters'),

  body('address.street')
    .optional()
    .isString().withMessage('Street must be a string')
    .isLength({ max: 200 }).withMessage('Street cannot exceed 200 characters'),

  body('socialLinks')
    .optional()
    .isObject().withMessage('Social links must be an object'),

  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array'),

  body('interests')
    .optional()
    .isArray().withMessage('Interests must be an array'),

  // Role-specific fields
  body('roleDetails')
    .optional()
    .isObject().withMessage('Role details must be an object')
];

/**
 * Validator for profile updates.
 */
export const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores and hyphens'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),

  body('phone')
    .optional()
    .isMobilePhone().withMessage('Please enter a valid phone number'),

  body('address')
    .optional()
    .isObject().withMessage('Address must be an object'),

  body('address.country')
    .optional()
    .isString().withMessage('Country must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Country must be between 2 and 100 characters'),

  body('address.city')
    .optional()
    .isString().withMessage('City must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('City must be between 2 and 100 characters'),

  body('socialLinks')
    .optional()
    .isObject().withMessage('Social links must be an object'),

  body('socialLinks.facebook')
    .optional()
    .isURL().withMessage('Facebook link must be a valid URL'),

  body('socialLinks.twitter')
    .optional()
    .isURL().withMessage('Twitter link must be a valid URL'),

  body('socialLinks.linkedin')
    .optional()
    .isURL().withMessage('LinkedIn link must be a valid URL'),

  body('socialLinks.github')
    .optional()
    .isURL().withMessage('GitHub link must be a valid URL'),

  body('socialLinks.website')
    .optional()
    .isURL().withMessage('Website link must be a valid URL'),

  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array'),

  body('interests')
    .optional()
    .isArray().withMessage('Interests must be an array'),

  // Role-specific fields
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters'),

  body('jobTitle')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Job title must be between 2 and 100 characters'),

  body('industry')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Industry must be between 2 and 100 characters'),

  body('companySize')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .withMessage('Invalid company size'),

  body('fundingStage')
    .optional()
    .isIn(['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Bootstrapped', 'Other'])
    .withMessage('Invalid funding stage')
];

/**
 * Validator for changing password.
 */
export const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

/**
 * Validator for setting password for phone-registered users.
 */
export const validateSetPasswordForPhoneUser = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("phone")
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
  body("code")
    .optional()
    .isNumeric()
    .withMessage("OTP code must be numeric")
    .isLength({ min: 4, max: 6 })
    .withMessage("OTP code must be between 4 and 6 digits"),
  body()
    .custom((body) => {
      // Ensure either email or (phone and code) are provided
      if (!body.email && !(body.phone && body.code)) {
        throw new Error("Either email or phone with verification code is required");
      }
      return true;
    }),
];
