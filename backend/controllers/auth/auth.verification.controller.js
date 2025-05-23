import User from "../../models/user/user.model.js";
import RefreshToken from "../../models/core/refreshToken.model.js";
import Investor from "../../models/user/investor.model.js";
import Startup from "../../models/user/startup.model.js";
import Agency from "../../models/user/agency.model.js";
import Freelancer from "../../models/user/freelancer.model.js";
import Jobseeker from "../../models/user/jobseeker.model.js";
import { sendOTP, verifyOTP } from "../../utils/communication/twilio.utils.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailToken,
} from "../../utils/auth/jwt.utils.js";
import { sendVerificationEmail, maskEmail } from "../../utils/communication/mail.utils.js";
import logger from "../../utils/logging/logger.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from "../../utils/logging/error.js";
import { normalizePhone, maskPhone } from "../../utils/communication/phone.utils.js"; // Fixed import
import {
  formatResponse,
  getVerificationNextStep,
  ensureAddressStructure,
  sendVerificationForMissingMethods,
} from "./helpers/auth.helpers.js";
import { isProduction, OTP_RATE_LIMIT } from "./helpers/auth.constants.js";

dotenv.config();

/**
 * @desc    Request OTP for registration or login via Phone
 * @route   POST /auth/:type/request-otp (where type is 'register' or 'login')
 * @access  Public
 */
export const requestOtp = async (req, res, next) => {
  // Validation is handled by middleware

  const { type } = req.params; // 'register' or 'login'
  const { phone } = req.body; // Role/RoleDetails are handled in verifyOtp now

  try {
    // Normalize and validate phone number
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      // Use standard error classes
      return next(
        new ValidationError(
          "Invalid phone number format. Please include country code (e.g., +91)."
        )
      );
    }

    // Validate type parameter
    if (!["register", "login", "verify"].includes(type)) {
      // Added 'verify' for simple phone verification later
      return next(
        new ValidationError(
          "Invalid request type. Use 'register', 'login', or 'verify'."
        )
      );
    }

    // Check for existing user based on type
    const user = await User.findOne({ phone: normalizedPhone }).select(
      "+lastOtpRequest +otpSentAt"
    ); // Select necessary fields

    if (type === "register" && user) {
      // If user exists during registration attempt, suggest login
      return next(
        new ValidationError(
          "Phone number already registered. Please log in or use a different number.",
          "PHONE_EXISTS_REGISTER"
        )
      );
    }
    if ((type === "login" || type === "verify") && !user) {
      // If user doesn't exist during login/verify attempt
      return next(
        new NotFoundError(
          "Phone number not found. Please register first.",
          "PHONE_NOT_FOUND_LOGIN"
        )
      );
    }

    // Rate limiting check (only if user exists)
    if (
      user &&
      user.lastOtpRequest &&
      Date.now() - user.lastOtpRequest < OTP_RATE_LIMIT
    ) {
      const timeLeft = Math.ceil(
        (OTP_RATE_LIMIT - (Date.now() - user.lastOtpRequest)) / 1000
      );
      logger.warn(`OTP rate limit hit for user ${user._id}`, {
        phone: maskPhone(normalizedPhone),
      });
      return next(
        new ValidationError(
          `Please wait ${timeLeft} seconds before requesting another OTP.`,
          "RATE_LIMIT_EXCEEDED"
        )
      );
    }

    // Send OTP via Twilio (or chosen provider)
    try {
      // The sendOTP util should handle the actual sending and potentially its own rate limits if applicable
      await sendOTP(normalizedPhone);
      logger.info(
        `OTP requested via ${type} for phone: ${maskPhone(normalizedPhone)}`,
        { userId: user?._id }
      );

      // Update user's OTP timestamps IF they exist (for login/verify)
      if (user) {
        user.lastOtpRequest = Date.now();
        user.otpSentAt = new Date();
        user.otpFailedAttempts = 0; // Reset failed attempts on new request
        await user.save();
        logger.info(`OTP timestamps updated for user ${user._id}`);
      } else {
        // For registration, we don't have a user yet. Store state client-side or in a temporary cache if needed.
        logger.info(
          `OTP sent for registration to ${maskPhone(
            normalizedPhone
          )} (no user yet)`
        );
      }

      // Success response
      res.status(200).json(
        formatResponse("success", "OTP sent successfully.", {
          phone: maskPhone(normalizedPhone),
          expiresIn: 600, // Typically 10 minutes validity from Twilio Verify
          resendDelay: Math.ceil(OTP_RATE_LIMIT / 1000), // Let frontend know the minimum delay
        })
      );
    } catch (error) {
      // Handle specific errors from the OTP service if possible
      logger.error(
        `Failed to send OTP via provider for ${maskPhone(normalizedPhone)}: ${
          error.message
        }`,
        { code: error.code, status: error.status }
      );

      // Example: Twilio error handling (codes depend on the library/API)
      if (error.status === 429) {
        // Too Many Requests
        return next(
          new ValidationError(
            `Rate limit exceeded by provider. Please try again later.`,
            "PROVIDER_RATE_LIMIT"
          )
        );
      }
      if (
        error.code === 60200 ||
        error.message.includes("Invalid parameter: To")
      ) {
        // Invalid phone number format according to Twilio
        return next(
          new ValidationError(
            "The phone number format is invalid according to our provider.",
            "INVALID_PROVIDER_PHONE"
          )
        );
      }
      if (error.code === 60203) {
        // Max send attempts reached (Twilio limit)
        return next(
          new ValidationError(
            "Maximum send attempts reached for this number. Please try again later.",
            "MAX_SEND_ATTEMPTS"
          )
        );
      }
      // Generic fallback
      next(
        new AppError(
          "Failed to send OTP due to a provider issue. Please try again.",
          500,
          "OTP_SEND_FAILED"
        )
      );
    }
  } catch (error) {
    logger.error(`Error during OTP request process: ${error.message}`, {
      type,
      phone: maskPhone(phone),
      stack: error.stack,
    });
    // Handle specific errors thrown before OTP sending
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AppError
    ) {
      next(error);
    } else {
      next(
        new AppError(
          "An unexpected error occurred while requesting the OTP.",
          500,
          "OTP_REQUEST_ERROR"
        )
      );
    }
  }
};

/**
 * @desc    Verify OTP for registration or login via Phone
 * @route   POST /auth/:type/verify-otp (where type is 'register' or 'login')
 * @access  Public
 */
export const verifyOtp = async (req, res, next) => {
  // Validation is handled by middleware

  const { type } = req.params; // 'register' or 'login'
  const { phone, code, role, roleDetails } = req.body; // Role info needed for registration
  let user; // Define user variable in the outer scope

  try {
    // Normalize and validate phone number
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return next(new ValidationError("Invalid phone number format."));
    }
    if (!code || !/^\d{6}$/.test(code)) {
      // Basic OTP format validation
      return next(
        new ValidationError("Invalid OTP format. Please enter 6 digits.")
      );
    }

    // Validate type parameter
    if (!["register", "login", "verify"].includes(type)) {
      // Added 'verify'
      return next(
        new ValidationError(
          "Invalid request type. Use 'register', 'login', or 'verify'."
        )
      );
    }

    // --- OTP Verification Logic ---
    let isOtpValid = false;
    try {
      // Verify OTP using the utility function
      isOtpValid = await verifyOTP(normalizedPhone, code);
      logger.info(
        `OTP verification attempt for ${maskPhone(
          normalizedPhone
        )} - Result: ${isOtpValid}`
      );
    } catch (error) {
      logger.error(
        `Error during OTP verification call for ${maskPhone(
          normalizedPhone
        )}: ${error.message}`,
        { code: error.code, status: error.status }
      );

      // Find user to update failed attempts if possible (for login/verify)
      user = await User.findOne({ phone: normalizedPhone }).select(
        "+otpFailedAttempts"
      );

      // Handle specific Twilio/Provider errors during verification
      if (error.status === 404 || error.code === 20404) {
        // Verification check not found / expired
        if (user) {
          user.otpFailedAttempts = (user.otpFailedAttempts || 0) + 1;
          await user.save();
        }
        return next(
          new ValidationError(
            "OTP has expired or is invalid. Please request a new one.",
            "OTP_EXPIRED_OR_NOT_FOUND"
          )
        );
      }
      if (error.status === 429) {
        // Max check attempts reached
        if (user) {
          user.otpFailedAttempts = 5; // Mark as max attempts reached
          await user.save();
        }
        return next(
          new UnauthorizedError(
            "Maximum verification attempts reached. Please request a new OTP.",
            "MAX_VERIFY_ATTEMPTS"
          )
        );
      }
      // Generic provider error during verification
      return next(
        new AppError(
          "Failed to verify OTP due to a provider issue.",
          500,
          "OTP_VERIFY_FAILED"
        )
      );
    }

    // If OTP is invalid based on the provider's response
    if (!isOtpValid) {
      // Find user to update failed attempts (for login/verify)
      user = await User.findOne({ phone: normalizedPhone }).select(
        "+otpFailedAttempts +lockUntil"
      );
      if (user) {
        if (user.isLocked) {
          // Check if locked due to previous attempts
          const timeLeft = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
          return next(
            new UnauthorizedError(
              `Account locked. Try again in ${timeLeft} minutes.`
            )
          );
        }
        user.otpFailedAttempts = (user.otpFailedAttempts || 0) + 1;
        logger.warn(`Invalid OTP attempt for user ${user._id}`, {
          attempts: user.otpFailedAttempts,
        });
        if (user.otpFailedAttempts >= 5) {
          user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
          logger.warn(`Account locked due to failed OTP attempts`, {
            userId: user._id,
          });
        }
        await user.save();

        if (user.lockUntil) {
          return next(
            new UnauthorizedError(
              "Too many failed OTP attempts. Account locked for 15 minutes.",
              "ACCOUNT_LOCKED_OTP"
            )
          );
        }
      } else {
        // No user found for login/verify, but OTP was invalid
        logger.warn(
          `Invalid OTP attempt for non-existent user (login/verify)`,
          { phone: maskPhone(normalizedPhone) }
        );
      }
      return next(
        new ValidationError("Invalid OTP. Please try again.", "INVALID_OTP")
      );
    }

    // --- OTP is Valid - Proceed based on type ---

    // Find or Create User
    if (type === "register") {
      user = await User.findOne({ phone: normalizedPhone });
      if (user) {
        return next(
          new ValidationError(
            "Phone number already registered. Please log in.",
            "PHONE_EXISTS_REGISTER"
          )
        );
      }

      // Validate role if provided
      const validRoles = [
        "user",
        "startupOwner",
        "investor",
        "agency",
        "freelancer",
        "jobseeker",
      ];
      const assignedRole = role && validRoles.includes(role) ? role : "user";

      // Generate Username from phone
      const phoneDigits = normalizedPhone.replace(/\D/g, "");
      const lastSixDigits = phoneDigits.slice(-6);
      let baseUsername = `user${lastSixDigits}`;
      let username = baseUsername;
      let suffix = 0;
      let isUnique = false;
      while (!isUnique) {
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
          isUnique = true;
        } else {
          suffix++;
          username = `${baseUsername}${suffix}`;
          if (username.length > 30) {
            // Ensure generated username doesn't exceed length
            username =
              baseUsername.substring(0, 30 - String(suffix).length) + suffix;
          }
        }
        if (suffix > 1000) {
          // Safety break
          username = `user${Math.floor(Math.random() * 1000000)}`;
          break;
        }
      }

      // Create the new user
      user = new User({
        phone: normalizedPhone,
        username,
        isPhoneVerified: true, // Phone is verified by OTP
        isEmailVerified: false,
        isProfileCompleted: false, // Profile not complete yet
        role: assignedRole,
        otpFailedAttempts: 0, // Reset on success
        otpSentAt: undefined, // Clear OTP timestamp
        address: { street: "", city: "", country: "" }, // Initialize address
      });

      const savedUser = await user.save();
      if (!savedUser._id) {
        throw new AppError(
          "Failed to create user account after OTP verification.",
          500,
          "USER_CREATION_FAILED"
        );
      }
      user = savedUser; // Use the saved user object
      logger.info(`New user created via phone OTP: ${user._id}`, {
        role: assignedRole,
      });

      // Handle role-specific document creation (if role is not 'user')
      if (assignedRole !== "user" && roleDetails) {
        let RoleModel;
        let roleDocData = { user: user._id };

        // Validate roleDetails for non-user roles
        const requiredFields = {
          startupOwner: ["companyName"],
          investor: ["investorType"],
          agency: ["companyName"],
          freelancer: ["skills"], // Expecting skills as array or comma-separated string
          jobseeker: ["jobTitle"], // Or a similar field like 'desiredJobTitle'
        };
        if (requiredFields[assignedRole]) {
          if (!roleDetails || typeof roleDetails !== "object") {
            await User.findByIdAndDelete(user._id); // Clean up user
            return next(
              new ValidationError(
                `Role details object is required for the '${assignedRole}' role.`,
                "MISSING_ROLE_DETAILS"
              )
            );
          }
          for (const field of requiredFields[assignedRole]) {
            if (
              !roleDetails[field] ||
              (typeof roleDetails[field] === "string" &&
                roleDetails[field].trim() === "") ||
              (Array.isArray(roleDetails[field]) &&
                roleDetails[field].length === 0)
            ) {
              await User.findByIdAndDelete(user._id); // Clean up user
              return next(
                new ValidationError(
                  `${field} is required within roleDetails for the '${assignedRole}' role.`,
                  "MISSING_ROLE_FIELD"
                )
              );
            }
          }
        }

        // Determine RoleModel and base data
        switch (assignedRole) {
          case "startupOwner":
            RoleModel = Startup;
            roleDocData = {
              ...roleDocData,
              companyName: roleDetails.companyName,
              industry: roleDetails.industry,
              fundingStage: roleDetails.fundingStage,
            };
            break;
          case "investor":
            RoleModel = Investor;
            roleDocData = {
              ...roleDocData,
              investorType: roleDetails.investorType,
            };
            break;
          case "agency":
            RoleModel = Agency;
            roleDocData = {
              ...roleDocData,
              companyName: roleDetails.companyName,
            };
            break;
          case "freelancer":
            RoleModel = Freelancer;
            const skills = Array.isArray(roleDetails.skills)
              ? roleDetails.skills
              : typeof roleDetails.skills === "string"
              ? roleDetails.skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s)
              : [];
            roleDocData = {
              ...roleDocData,
              skills: skills.length > 0 ? skills : ["General"],
            };
            break;
          case "jobseeker":
            RoleModel = Jobseeker;
            // Use a more specific field if available in your model, e.g., 'desiredJobTitle'
            roleDocData = {
              ...roleDocData,
              desiredJobTitle: roleDetails.jobTitle || "Seeking Opportunity",
            };
            break;
        }

        if (RoleModel) {
          try {
            const roleInstance = await RoleModel.create(roleDocData);
            if (!roleInstance._id) {
              throw new AppError(
                `Failed to create ${assignedRole} profile document`,
                500
              );
            }
            user.roleDetails = {
              ...user.roleDetails,
              [assignedRole]: roleInstance._id,
            };
            await user.save();
            logger.info(
              `Created ${assignedRole} profile for user ${user._id}`,
              { roleDocId: roleInstance._id }
            );
          } catch (roleError) {
            logger.error(
              `Error creating role document for ${assignedRole}: ${roleError.message}`,
              { userId: user._id }
            );
            await User.findByIdAndDelete(user._id); // Cleanup user on failure
            return next(
              new AppError(
                `Registration failed: Could not create ${assignedRole} profile. ${roleError.message}`,
                500
              )
            );
          }
        }
      } // End role detail creation
    } else if (type === "login" || type === "verify") {
      user = await User.findOne({ phone: normalizedPhone })
        .select("+loginAttempts +lockUntil +otpFailedAttempts +otpSentAt")
        .populate({
          // Populate primary role details
          path: "roleDetails.startupOwner roleDetails.investor roleDetails.agency roleDetails.freelancer roleDetails.jobseeker",
          select: "companyName investorType skills desiredJobTitle", // Select relevant fields
        });

      if (!user) {
        // Should have been caught by verifyOTP error handling if attempt was made, but double check
        return next(
          new NotFoundError(
            "Phone number not found. Please register first.",
            "PHONE_NOT_FOUND_LOGIN"
          )
        );
      }

      if (user.isLocked) {
        const timeLeft = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
        return next(
          new UnauthorizedError(
            `Account locked. Try again in ${timeLeft} minutes.`
          )
        );
      }

      // Login successful or phone verified
      await ensureAddressStructure(user); // Ensure address exists and is object

      user.loginAttempts = 0; // Reset login attempts as well
      user.lockUntil = undefined;
      user.lastLogin = new Date();
      user.isPhoneVerified = true; // Ensure phone is marked verified
      user.otpFailedAttempts = 0; // Reset OTP attempts on success
      user.otpSentAt = undefined; // Clear OTP timestamp
      await user.save();
      logger.info(
        `User ${
          type === "login" ? "logged in" : "verified phone"
        } successfully: ${user._id}`
      );
    }

    // --- Generate Tokens and Respond ---
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    const refreshTokenDoc = new RefreshToken({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdByIp: req.ip,
      userAgent: req.headers["user-agent"] || "Unknown",
    });
    await refreshTokenDoc.save();

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Determine next steps and send verification for missing methods (e.g., email)
    const nextStep = getVerificationNextStep(user);
    await sendVerificationForMissingMethods(user); // Attempt to send email verification if needed

    // Extract relevant populated role details for response
    const roleDetailData = user.roleDetails
      ? user.roleDetails[user.role]
      : null;

    res.status(200).json(
      formatResponse(
        "success",
        type === "register"
          ? "Registration successful"
          : type === "login"
          ? "Login successful"
          : "Phone verified successfully",
        {
          accessToken,
          user: {
            id: user._id,
            username: user.username,
            phone: maskPhone(user.phone),
            email: maskEmail(user.email) || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            role: user.role,
            isPhoneVerified: user.isPhoneVerified,
            isEmailVerified: user.isEmailVerified,
            isProfileCompleted: user.isProfileCompleted, // Send current status
            profilePicture: user.profilePicture?.url || null,
            roleDetailsSummary: roleDetailData
              ? {
                  // Send a summary
                  id: roleDetailData._id,
                  ...(roleDetailData.companyName && {
                    companyName: roleDetailData.companyName,
                  }),
                  ...(roleDetailData.investorType && {
                    investorType: roleDetailData.investorType,
                  }),
                  ...(roleDetailData.skills && {
                    skills: roleDetailData.skills.slice(0, 3),
                  }),
                  ...(roleDetailData.desiredJobTitle && {
                    jobTitle: roleDetailData.desiredJobTitle,
                  }),
                }
              : null,
            // Include roleDetails from input only if registering and role != user (for initial FE state)
            // initialRoleDetails: (type === 'register' && role !== 'user' && roleDetails) ? roleDetails : undefined
          },
        },
        nextStep
      )
    );
  } catch (error) {
    logger.error(
      `Verify OTP process failed for type ${type}: ${error.message}`,
      { phone: maskPhone(phone), role, stack: error.stack }
    );
    if (
      error instanceof ValidationError ||
      error instanceof UnauthorizedError ||
      error instanceof NotFoundError ||
      error instanceof AppError
    ) {
      next(error);
    } else {
      next(
        new AppError(
          "An unexpected error occurred during OTP verification.",
          500,
          "OTP_VERIFY_ERROR"
        )
      );
    }
  }
};

/**
 * @desc    Verify user's email address using token from link
 * @route   GET /auth/verify-email/:token
 * @access  Public
 */
export const verifyEmail = async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new ValidationError("Verification token is missing."));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_EMAIL_VERIFICATION_SECRET
    );

    // Find the user associated with the token
    const user = await User.findById(decoded.id);

    if (!user) {
      logger.warn(
        `Email verification attempt with valid token but non-existent user: ${decoded.id}`
      );
      // Don't reveal user doesn't exist, keep message generic
      return next(
        new NotFoundError(
          "Invalid or expired verification link.",
          "VERIFY_USER_NOT_FOUND"
        )
      );
    }

    if (!user.email) {
      logger.warn(
        `Email verification attempt for user ${user._id} who has no email address set.`
      );
      // This state shouldn't ideally happen if token generation requires email
      return next(
        new ValidationError(
          "No email address is associated with this account to verify.",
          "VERIFY_NO_EMAIL"
        )
      );
    }

    if (user.isEmailVerified) {
      logger.info(
        `Email verification attempt for already verified user: ${user._id}`
      );
      // Maybe redirect to login or dashboard? For API, just inform.
      const nextStep = getVerificationNextStep(user); // Recalculate next step
      return res.status(200).json(
        formatResponse(
          "success",
          "Email address already verified.",
          {
            user: {
              id: user._id,
              email: maskEmail(user.email),
              isEmailVerified: true,
            },
          },
          nextStep // Provide next step even if already verified
        )
      );
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.lastEmailVerificationRequest = undefined; // Clear timestamp as it's now verified
    await user.save();

    logger.info(`Email verified successfully for user: ${user._id}`);

    // Determine next steps after verification
    const nextStep = getVerificationNextStep(user);

    // Respond with success
    res.status(200).json(
      formatResponse(
        "success",
        "Email verified successfully!",
        {
          user: {
            // Send minimal updated user info
            id: user._id,
            email: maskEmail(user.email),
            isEmailVerified: true,
            isPhoneVerified: user.isPhoneVerified, // Include other verification status
            isProfileCompleted: user.isProfileCompleted,
          },
        },
        nextStep // Guide user on what to do next
      )
    );
  } catch (error) {
    logger.error(`Verify email failed: ${error.message}`, { token });

    if (error instanceof jwt.TokenExpiredError) {
      // Handle expired token - maybe allow resend?
      return next(
        new ValidationError(
          "Verification link has expired. Please request a new one.",
          "VERIFY_TOKEN_EXPIRED"
        )
      );
    }
    if (error instanceof jwt.JsonWebTokenError) {
      // Handle invalid token (tampered, wrong secret etc.)
      return next(
        new ValidationError(
          "Invalid verification link.",
          "VERIFY_TOKEN_INVALID"
        )
      );
    }
    // Handle other potential errors (e.g., database save error)
    next(
      new AppError(
        "Failed to verify email due to an unexpected error.",
        500,
        "VERIFY_EMAIL_FAILED"
      )
    );
  }
};

/**
 * @desc    Resend email verification link
 * @route   POST /auth/send-email-verification (or /resend-verification)
 * @access  Public or Private (depends on use case)
 */
export const resendEmailVerification = async (req, res, next) => {
  // Validation is handled by middleware

  const { email } = req.body;
  const authenticatedUserId = req.user?._id; // Check if request is authenticated

  try {
    if (!email) {
      return next(new ValidationError("Email address is required."));
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+isEmailVerified +lastEmailVerificationRequest"
    );

    if (!user) {
      // Don't reveal if email exists or not for unauthenticated requests
      // For authenticated requests, we could be more specific, but consistency is simpler.
      logger.warn(
        `Resend verification request for non-existent email: ${maskEmail(
          normalizedEmail
        )}`
      );
      return next(
        new NotFoundError(
          "If an account with this email exists, a verification link will be sent.",
          "RESEND_USER_NOT_FOUND"
        )
      );
    }

    // If authenticated, ensure the email matches the logged-in user
    if (
      authenticatedUserId &&
      user._id.toString() !== authenticatedUserId.toString()
    ) {
      logger.warn(
        `Authenticated user ${authenticatedUserId} attempted to resend verification for different email ${maskEmail(
          normalizedEmail
        )} (User ID: ${user._id})`
      );
      return next(
        new UnauthorizedError(
          "You can only request verification for your own account email.",
          "RESEND_EMAIL_MISMATCH"
        )
      );
    }

    if (user.isEmailVerified) {
      logger.info(
        `Resend verification requested for already verified email: ${maskEmail(
          normalizedEmail
        )}`
      );
      return res
        .status(200)
        .json(
          formatResponse("success", "This email address is already verified.")
        );
    }

    // Rate Limiting Check (e.g., allow once every 5 minutes)
    const RESEND_RATE_LIMIT = 5 * 60 * 1000;
    if (
      user.lastEmailVerificationRequest &&
      Date.now() - user.lastEmailVerificationRequest < RESEND_RATE_LIMIT
    ) {
      const timeLeft = Math.ceil(
        (RESEND_RATE_LIMIT - (Date.now() - user.lastEmailVerificationRequest)) /
          1000
      );
      logger.warn(
        `Resend verification rate limit hit for email: ${maskEmail(
          normalizedEmail
        )}`
      );
      return next(
        new ValidationError(
          `Please wait ${timeLeft} seconds before requesting another verification email.`,
          "RESEND_RATE_LIMIT"
        )
      );
    }

    // Generate a new email verification token
    const emailToken = generateEmailToken(user._id);
    const verificationLink = `${process.env.CLIENT_URL}/auth/verify-email/${emailToken}`;

    // Send the verification email
    try {
      await sendVerificationEmail(
        user.email,
        "Verify Your Email Address", // Subject line
        `Please verify your email address by clicking this link: ${verificationLink}\nIf you did not request this, please ignore this email.` // Email body
      );

      // Update the timestamp for rate limiting
      user.lastEmailVerificationRequest = new Date();
      await user.save();

      logger.info(
        `Verification email re-sent successfully to ${maskEmail(user.email)}`
      );
      res
        .status(200)
        .json(
          formatResponse(
            "success",
            "Verification email sent successfully. Please check your inbox (and spam folder)."
          )
        );
    } catch (emailError) {
      logger.error(
        `Failed to resend verification email to ${maskEmail(user.email)}: ${
          emailError.message
        }`
      );
      next(
        new AppError(
          "Failed to send verification email due to a server issue. Please try again later.",
          500,
          "RESEND_EMAIL_SEND_FAILED"
        )
      );
    }
  } catch (error) {
    logger.error(
      `Error during resend email verification process: ${error.message}`,
      { email: maskEmail(email), stack: error.stack }
    );
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof AppError
    ) {
      next(error);
    } else {
      next(
        new AppError(
          "An unexpected error occurred while processing your request.",
          500,
          "RESEND_EMAIL_ERROR"
        )
      );
    }
  }
};

/**
 * @desc    Send OTP for phone verification (for already registered users)
 * @route   POST /auth/send-otp (Protected Route)
 * @access  Private (User must be authenticated)
 */
export const sendPhoneVerificationOTP = async (req, res, next) => {
  // Validation is handled by middleware

  const { phone } = req.body;
  const userId = req.user._id; // Get user ID from authenticated request

  try {
    if (!phone) {
      return next(new ValidationError("Phone number is required."));
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return next(
        new ValidationError(
          "Invalid phone number format. Please include country code."
        )
      );
    }

    const user = await User.findById(userId).select(
      "+phone +isPhoneVerified +tempPhone +lastOtpRequest +otpSentAt"
    );
    if (!user) {
      // This shouldn't happen if authenticateToken middleware works correctly
      logger.error(
        `Authenticated user not found in DB during send OTP: ${userId}`
      );
      return next(
        new NotFoundError(
          "User session error. Please log in again.",
          "SEND_OTP_USER_NOT_FOUND"
        )
      );
    }

    // Case 1: Phone number is the same as the verified one
    if (user.phone === normalizedPhone && user.isPhoneVerified) {
      logger.info(
        `User ${userId} requested OTP for already verified phone ${maskPhone(
          normalizedPhone
        )}`
      );
      return res.status(200).json(
        formatResponse("success", "This phone number is already verified.", {
          isVerified: true,
          phone: maskPhone(normalizedPhone),
        })
      );
    }

    // Case 2: Phone number is different, check if it's already used by someone else
    if (user.phone !== normalizedPhone) {
      const phoneExists = await User.findOne({
        phone: normalizedPhone,
        _id: { $ne: userId }, // Exclude the current user
      });
      if (phoneExists) {
        logger.warn(
          `User ${userId} attempted to verify phone ${maskPhone(
            normalizedPhone
          )} already used by user ${phoneExists._id}`
        );
        return next(
          new ValidationError(
            "This phone number is already registered to another account.",
            "PHONE_IN_USE"
          )
        );
      }
    }

    // Rate limiting check
    if (
      user.lastOtpRequest &&
      Date.now() - user.lastOtpRequest < OTP_RATE_LIMIT
    ) {
      const timeLeft = Math.ceil(
        (OTP_RATE_LIMIT - (Date.now() - user.lastOtpRequest)) / 1000
      );
      logger.warn(`Send OTP rate limit hit for user ${userId}`, {
        phone: maskPhone(normalizedPhone),
      });
      return next(
        new ValidationError(
          `Please wait ${timeLeft} seconds before requesting another OTP.`,
          "RATE_LIMIT_EXCEEDED"
        )
      );
    }

    // Store the phone number being verified temporarily (if different from primary)
    // Or just use the provided phone number directly for verification call
    // We'll update the primary user.phone only upon successful verification if it's different.
    const phoneToVerify = normalizedPhone;

    // Send OTP
    try {
      await sendOTP(phoneToVerify);

      // Update user's OTP status
      user.tempPhone = user.phone !== phoneToVerify ? phoneToVerify : undefined; // Store if it's a new number being verified
      user.otpSentAt = new Date();
      user.lastOtpRequest = Date.now();
      user.otpFailedAttempts = 0; // Reset failed attempts
      await user.save();

      logger.info(
        `Phone verification OTP sent successfully to ${maskPhone(
          phoneToVerify
        )} for user ${user._id}`
      );

      res.status(200).json(
        formatResponse("success", "Verification OTP sent successfully.", {
          phone: maskPhone(phoneToVerify), // Echo back the masked number being verified
          expiresIn: 600, // Typical Twilio Verify validity
          resendDelay: Math.ceil(OTP_RATE_LIMIT / 1000),
        })
      );
    } catch (error) {
      logger.error(
        `Failed to send phone verification OTP via provider for ${maskPhone(
          phoneToVerify
        )} (User ${userId}): ${error.message}`,
        { code: error.code, status: error.status }
      );
      // Handle provider errors similarly to requestOtp
      if (error.status === 429) {
        return next(
          new ValidationError(
            `Rate limit exceeded by provider. Please try again later.`,
            "PROVIDER_RATE_LIMIT"
          )
        );
      }
      if (
        error.code === 60200 ||
        error.message.includes("Invalid parameter: To")
      ) {
        return next(
          new ValidationError(
            "The phone number format is invalid according to our provider.",
            "INVALID_PROVIDER_PHONE"
          )
        );
      }
      if (error.code === 60203) {
        return next(
          new ValidationError(
            "Maximum send attempts reached for this number. Please try again later.",
            "MAX_SEND_ATTEMPTS"
          )
        );
      }
      next(
        new AppError(
          "Failed to send verification OTP due to a provider issue.",
          500,
          "SEND_OTP_FAILED"
        )
      );
    }
  } catch (error) {
    logger.error(
      `Error during send phone verification OTP process: ${error.message}`,
      { userId, phone: maskPhone(phone), stack: error.stack }
    );
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AppError
    ) {
      next(error);
    } else {
      next(
        new AppError(
          "An unexpected error occurred while sending the verification OTP.",
          500,
          "SEND_OTP_ERROR"
        )
      );
    }
  }
};

/**
 * @desc    Verify OTP for phone verification (for already registered users)
 * @route   POST /auth/verify-otp (Protected Route)
 * @access  Private (User must be authenticated)
 */
export const verifyOtpForPhoneVerification = async (req, res, next) => {
  // Validation is handled by middleware

  const { phone, code } = req.body;
  const userId = req.user._id;

  try {
    if (!phone || !code) {
      return next(
        new ValidationError("Phone number and OTP code are required.")
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return next(new ValidationError("Invalid phone number format."));
    }
    if (!/^\d{6}$/.test(code)) {
      // Basic OTP format validation
      return next(
        new ValidationError("Invalid OTP format. Please enter 6 digits.")
      );
    }

    const user = await User.findById(userId).select(
      "+phone +isPhoneVerified +tempPhone +otpSentAt +otpFailedAttempts +lockUntil"
    );
    if (!user) {
      logger.error(
        `Authenticated user not found in DB during verify OTP: ${userId}`
      );
      return next(
        new NotFoundError(
          "User session error. Please log in again.",
          "VERIFY_OTP_USER_NOT_FOUND"
        )
      );
    }

    // Check if account is locked first
    if (user.isLocked) {
      const timeLeft = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return next(
        new UnauthorizedError(
          `Account locked. Try again in ${timeLeft} minutes.`
        )
      );
    }

    // Determine which phone number was intended for verification
    // If tempPhone exists and matches input, use that. Otherwise, use user's current phone if it matches input.
    const phoneToVerify =
      user.tempPhone && user.tempPhone === normalizedPhone
        ? user.tempPhone
        : user.phone === normalizedPhone
        ? user.phone
        : null;

    if (!phoneToVerify) {
      logger.warn(
        `User ${userId} attempted to verify OTP for unexpected phone ${maskPhone(
          normalizedPhone
        )}. Expected: ${maskPhone(user.tempPhone || user.phone)}`
      );
      return next(
        new ValidationError(
          "The phone number submitted does not match the number awaiting verification.",
          "PHONE_MISMATCH"
        )
      );
    }

    // Check if an OTP was actually sent for this user recently
    if (!user.otpSentAt) {
      logger.warn(
        `User ${userId} attempted to verify OTP for ${maskPhone(
          normalizedPhone
        )} but no OTP was pending.`
      );
      return next(
        new ValidationError(
          "No pending phone verification found. Please request an OTP first.",
          "NO_OTP_PENDING"
        )
      );
    }

    // Check for excessive failed attempts *before* calling the provider
    if (user.otpFailedAttempts >= 5) {
      // Lock account if not already locked by failed attempts logic below
      if (!user.lockUntil || user.lockUntil < Date.now()) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
        await user.save();
        logger.warn(
          `Account locked for user ${userId} due to reaching max OTP attempts before verification call.`
        );
        return next(
          new UnauthorizedError(
            "Too many failed attempts. Account locked for 15 minutes. Request a new OTP after.",
            "ACCOUNT_LOCKED_OTP"
          )
        );
      } else {
        // Already locked
        const timeLeft = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
        return next(
          new UnauthorizedError(
            `Account locked due to too many failed attempts. Try again in ${timeLeft} minutes.`
          )
        );
      }
    }

    // Verify OTP with the provider
    let isValid = false;
    try {
      isValid = await verifyOTP(phoneToVerify, code);
      logger.info(
        `Phone verification OTP check for user ${userId} on ${maskPhone(
          phoneToVerify
        )} - Result: ${isValid}`
      );

      if (isValid) {
        // --- OTP Correct ---
        const isNewPhone = user.phone !== phoneToVerify;

        user.phone = phoneToVerify; // Update primary phone number
        user.isPhoneVerified = true;
        user.tempPhone = undefined; // Clear temporary phone
        user.otpSentAt = undefined; // Clear OTP timestamp
        user.otpFailedAttempts = 0; // Reset failed attempts
        user.lockUntil = undefined; // Unlock account if it was locked
        await user.save();

        logger.info(
          `Phone ${maskPhone(phoneToVerify)} verified successfully for user: ${
            user._id
          }${isNewPhone ? " (New Number)" : ""}`
        );

        const nextStep = getVerificationNextStep(user); // Recalculate next steps

        res.status(200).json(
          formatResponse(
            "success",
            `Phone number verified successfully.${
              isNewPhone ? " Your primary phone number has been updated." : ""
            }`,
            {
              user: {
                // Send updated user status
                id: user._id,
                phone: maskPhone(user.phone),
                email: maskEmail(user.email) || "",
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                isPhoneVerified: true,
                isEmailVerified: user.isEmailVerified,
                isProfileCompleted: user.isProfileCompleted,
              },
            },
            nextStep
          )
        );
      } else {
        // --- OTP Incorrect ---
        user.otpFailedAttempts += 1;
        logger.warn(`Invalid phone verification OTP for user ${userId}`, {
          attempts: user.otpFailedAttempts,
        });
        if (user.otpFailedAttempts >= 5) {
          user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
          logger.warn(
            `Account locked for user ${userId} due to failed OTP attempts.`
          );
        }
        await user.save();

        if (user.lockUntil && user.lockUntil > Date.now()) {
          return next(
            new UnauthorizedError(
              "Invalid OTP. Too many failed attempts. Account locked for 15 minutes.",
              "ACCOUNT_LOCKED_OTP"
            )
          );
        } else {
          return next(
            new ValidationError("Invalid OTP. Please try again.", "INVALID_OTP")
          );
        }
      }
    } catch (error) {
      logger.error(
        `Error during phone verification OTP check for user ${userId} on ${maskPhone(
          phoneToVerify
        )}: ${error.message}`,
        { code: error.code, status: error.status }
      );
      // Handle specific provider errors during verification check
      if (error.status === 404 || error.code === 20404) {
        // Verification check not found / expired
        user.otpFailedAttempts = (user.otpFailedAttempts || 0) + 1; // Count as failed attempt
        await user.save();
        return next(
          new ValidationError(
            "OTP has expired or is invalid. Please request a new one.",
            "OTP_EXPIRED_OR_NOT_FOUND"
          )
        );
      }
      if (error.status === 429) {
        // Max check attempts reached
        user.otpFailedAttempts = 5; // Mark as max attempts reached
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock
        await user.save();
        return next(
          new UnauthorizedError(
            "Maximum verification attempts reached. Account locked for 15 minutes. Request a new OTP after.",
            "MAX_VERIFY_ATTEMPTS"
          )
        );
      }
      // Generic provider error
      next(
        new AppError(
          "Failed to verify OTP due to a provider issue.",
          500,
          "OTP_VERIFY_FAILED"
        )
      );
    }
  } catch (error) {
    logger.error(
      `Error during verify OTP for phone process: ${error.message}`,
      { userId, phone: maskPhone(phone), stack: error.stack }
    );
    if (
      error instanceof ValidationError ||
      error instanceof UnauthorizedError ||
      error instanceof NotFoundError ||
      error instanceof AppError
    ) {
      next(error);
    } else {
      next(
        new AppError(
          "An unexpected error occurred while verifying your phone number.",
          500,
          "VERIFY_OTP_ERROR"
        )
      );
    }
  }
};
