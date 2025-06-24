import mongoose from "mongoose";
import User from "../../models/user/user.model.js";
import { processRoleDetails } from "../../utils/common/roleDetails.utils.js";
import logger from "../../utils/logging/logger.js";
import { AppError, ValidationError, NotFoundError } from "../../utils/logging/error.js";
import {
  normalizePhone,
  maskPhone,
} from "../../utils/communication/phone.utils.js";
import { deleteFromCloudinary } from "../../utils/storage/cloudinary.utils.js";
import {
  formatResponse,
  getVerificationNextStep,
  ensureAddressStructure,
  getProfileCompletionDetails,
} from "./helpers/auth.helpers.js"; // Fixed path
import { generateEmailToken } from "../../utils/auth/jwt.utils.js";
import { maskEmail, sendVerificationEmail } from "../../utils/communication/mail.utils.js";

/**
 * @desc    Get current authenticated user's profile (detailed)
 * @route   GET /auth/profile (or /auth/me)
 * @access  Private
 */
export const getProfile = async (req, res, next) => {
  const userId = req.user._id;

  try {
    // Populate primary role details and optionally products/other relations
    const user = await User.findById(userId)
      .select(
        "-password -__v -loginAttempts -lockUntil -passwordResetToken -passwordResetExpires -tempPhone -otpSentAt -otpFailedAttempts -lastOtpRequest -lastPasswordResetRequest -accountDeletionScheduled"
      ) // Exclude sensitive/internal fields
      .populate({
        path: "roleDetails.startupOwner roleDetails.investor roleDetails.agency roleDetails.freelancer roleDetails.jobseeker",
        // select: 'field1 field2 field3' // Select specific fields needed for the profile view
      })
      .populate({
        path: "products", // Example population
        select: "name description thumbnail status", // Select relevant fields
        options: { limit: 10, sort: { createdAt: -1 } }, // Limit and sort
      });
    // Add more populations as needed (e.g., projects, connections)

    if (!user) {
      logger.error(
        `Authenticated user ${userId} not found in DB for getProfile.`
      );
      return next(
        new NotFoundError(
          "User profile not found. Please log in again.",
          "PROFILE_USER_NOT_FOUND"
        )
      );
    }

    // Ensure address structure consistency before sending response
    // This modifies the object in memory for the response, doesn't hit DB again
    await ensureAddressStructure(user);

    // Calculate next steps based on the fetched user data
    const nextStep = getVerificationNextStep(user);

    res.status(200).json(
      formatResponse(
        "success",
        "User profile retrieved successfully.",
        { user: user.toObject() }, // Send the full user object (minus excluded fields)
        nextStep
      )
    );
  } catch (error) {
    logger.error(
      `Failed to fetch profile for user ${userId}: ${error.message}`,
      { stack: error.stack }
    );
    next(
      new AppError(
        "Failed to retrieve user profile.",
        500,
        "GET_PROFILE_FAILED"
      )
    );
  }
};

// Alias for getProfile if using /auth/user route for current user
export const getCurrentUser = getProfile;

/**
 * @desc    Get current user profile with optional authentication
 * @route   GET /auth/me
 * @access  Public (works with or without authentication)
 */
export const getOptionalProfile = async (req, res, next) => {
  try {
    // If user is authenticated, return their profile
    if (req.user) {
      return getProfile(req, res, next);
    }

    // If user is not authenticated, return a standard response for anonymous users
    return res.status(200).json(
      formatResponse(
        "success",
        "No authenticated user found.",
        {
          user: null,
          isAuthenticated: false
        }
      )
    );
  } catch (error) {
    logger.error(`Error in getOptionalProfile: ${error.message}`, { stack: error.stack });
    next(
      new AppError(
        "Failed to process authentication status.",
        500,
        "AUTH_CHECK_FAILED"
      )
    );
  }
};

/**
 * @desc    Complete user profile after registration/OTP login
 * @route   POST /auth/complete-profile
 * @access  Private (User must be authenticated, typically partially verified)
 */
export const completeProfile = async (req, res, next) => {
  // Validation should be handled by middleware (authValidator.validateProfileUpdate)
  // if (handleValidationErrors(req, next)) return;

  const userId = req.user._id;
  const session = await mongoose.startSession(); // Use transaction for multi-step process

  try {
    session.startTransaction();
    logger.info(`Starting profile completion transaction for user ${userId}`);

    // --- Data Handling ---
    // Combine parsed JSON data (if exists) and direct body data
    // Prioritize parsed data if 'userData' field is used with file uploads
    let userData = {};
    if (req.body.userData) {
      try {
        const parsedData = JSON.parse(req.body.userData);
        userData = { ...req.body, ...parsedData }; // Merge, parsedData takes precedence
        delete userData.userData; // Clean up
      } catch (e) {
        logger.warn(
          `Failed to parse userData JSON in completeProfile for user ${userId}. Using body directly. Error: ${e.message}`
        );
        // Fallback to using req.body directly if parsing fails
        userData = { ...req.body };
        delete userData.userData;
      }
    } else {
      userData = { ...req.body }; // Use req.body if no 'userData' field
    }

    const { cloudinaryFile } = req; // Get uploaded file info from middleware

    // --- Find User ---
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      logger.error(
        `User ${userId} not found during completeProfile transaction.`
      );
      return next(
        new NotFoundError(
          "User session invalid. Please log in again.",
          "COMPLETE_PROFILE_USER_NOT_FOUND"
        )
      );
    }

    // --- Data Sanitization and Validation ---
    // Sanitize basic text fields (optional, good practice)
    const fieldsToSanitize = [
      "firstName",
      "lastName",
      "bio",
      "about",
      "companyName",
      "companyRole",
      "industry",
      "companyDescription",
    ];
    for (const field of fieldsToSanitize) {
      if (userData[field] && typeof userData[field] === "string") {
        // Apply basic sanitization (trimming). More complex sanitization if needed.
        userData[field] = userData[field].trim();
      }
    }

    // Address handling
    if (userData.location && !userData.address) {
      userData.address =
        typeof userData.location === "object"
          ? userData.location
          : { street: userData.location };
      delete userData.location;
    }
    if (userData.address) {
      if (typeof userData.address === "string")
        userData.address = { street: userData.address };
      userData.address = {
        street: userData.address.street?.trim() || user.address?.street || "",
        city: userData.address.city?.trim() || user.address?.city || "",
        country:
          userData.address.country?.trim() || user.address?.country || "",
      };
    }

    // Phone handling
    if (userData.phone) {
      const normalizedPhone = normalizePhone(userData.phone);
      if (!normalizedPhone) {
        await session.abortTransaction();
        session.endSession();
        return next(
          new ValidationError(
            "Invalid phone number format. Please include country code."
          )
        );
      }
      if (normalizedPhone !== user.phone) {
        const phoneExists = await User.findOne({
          phone: normalizedPhone,
          _id: { $ne: userId },
        }).session(session);
        if (phoneExists) {
          await session.abortTransaction();
          session.endSession();
          return next(
            new ValidationError(
              "Phone number is already registered to another account."
            )
          );
        }
        userData.phone = normalizedPhone;
        // Phone verification status is handled by separate verify OTP flow
        // We don't automatically set isPhoneVerified = false here, user needs to verify it
        logger.info(
          `User ${userId} provided phone ${maskPhone(
            normalizedPhone
          )} during profile completion.`
        );
      } else {
        userData.phone = normalizedPhone; // Ensure it's the normalized version
      }
    } else if (userData.hasOwnProperty("phone") && userData.phone === "") {
      // Allow removing phone number only if email exists and is verified
      if (!user.email || !user.isEmailVerified) {
        await session.abortTransaction();
        session.endSession();
        return next(
          new ValidationError(
            "Cannot remove phone number without a verified email address."
          )
        );
      }
      userData.phone = null;
      userData.isPhoneVerified = false; // Mark as unverified if removed
    }

    // Email handling (if provided during completion, usually set at registration)
    if (
      userData.email &&
      userData.email.toLowerCase() !== user.email?.toLowerCase()
    ) {
      const normalizedEmail = userData.email.toLowerCase();
      // Add email validation regex check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        await session.abortTransaction();
        session.endSession();
        return next(new ValidationError("Invalid email format provided."));
      }
      const emailExists = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
      }).session(session);
      if (emailExists) {
        await session.abortTransaction();
        session.endSession();
        return next(
          new ValidationError("Email is already registered to another account.")
        );
      }
      userData.email = normalizedEmail;
      // Email verification status is handled by separate verify email flow
      // We don't automatically set isEmailVerified = false here, user needs to verify it
      logger.info(
        `User ${userId} provided email ${maskEmail(
          normalizedEmail
        )} during profile completion.`
      );
    } else if (userData.email) {
      userData.email = userData.email.toLowerCase(); // Ensure lowercase
    } else if (userData.hasOwnProperty("email") && userData.email === "") {
      // Allow removing email only if phone exists and is verified
      if (!user.phone || !user.isPhoneVerified) {
        await session.abortTransaction();
        session.endSession();
        return next(
          new ValidationError(
            "Cannot remove email address without a verified phone number."
          )
        );
      }
      userData.email = null;
      userData.isEmailVerified = false; // Mark as unverified if removed
    }

    // Ensure at least one contact method remains
    const finalEmail = userData.hasOwnProperty("email")
      ? userData.email
      : user.email;
    const finalPhone = userData.hasOwnProperty("phone")
      ? userData.phone
      : user.phone;
    if (!finalEmail && !finalPhone) {
      await session.abortTransaction();
      session.endSession();
      return next(
        new ValidationError(
          "Profile must have at least one contact method (email or phone)."
        )
      );
    }

    // --- Update User Fields ---
    // Exclude sensitive/protected fields
    const forbiddenFields = [
      "_id",
      "__v",
      "password",
      "role",
      "secondaryRoles",
      "isEmailVerified",
      "isPhoneVerified",
      "isProfileCompleted",
      "loginAttempts",
      "lockUntil",
      "passwordResetToken",
      "passwordResetExpires",
      "tempPhone",
      "otpSentAt",
      "otpFailedAttempts",
      "lastOtpRequest",
      "lastPasswordResetRequest",
      "accountDeletionScheduled",
      "createdAt",
      "updatedAt",
      "roleDetails",
      "products",
      "roleCapabilities",
    ]; // Add any other fields not updatable here
    const userUpdates = {};
    for (const key in userData) {
      if (!forbiddenFields.includes(key) && userData.hasOwnProperty(key)) {
        // Handle specific types or formatting if needed
        if (key === "skills" && typeof userData[key] === "string") {
          userUpdates[key] = userData[key]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (key === "socialLinks" && typeof userData[key] === "object") {
          // Clean socialLinks - set empty strings to null/undefined
          const cleanedLinks = {};
          for (const linkKey in userData.socialLinks) {
            if (userData.socialLinks[linkKey]) {
              let url = userData.socialLinks[linkKey].trim();
              // Add http/https if missing (simple check)
              if (url && !url.match(/^https?:\/\//i)) {
                url = `https://${url}`;
              }
              cleanedLinks[linkKey] = url;
            } else {
              cleanedLinks[linkKey] = null; // or undefined
            }
          }
          userUpdates[key] = cleanedLinks;
        } else if (key === "birthDate") {
          // Attempt to parse date string if provided
          try {
            const date = new Date(userData[key]);
            if (!isNaN(date.getTime())) {
              // Check if valid date
              userUpdates[key] = date;
            } else {
              logger.warn(
                `Invalid birthDate format received for user ${userId}: ${userData[key]}`
              );
              // Optionally throw error or just ignore the field
              // await session.abortTransaction(); session.endSession();
              // return next(new ValidationError("Invalid birth date format. Please use YYYY-MM-DD."));
            }
          } catch (dateError) {
            logger.warn(
              `Error parsing birthDate for user ${userId}: ${dateError.message}`
            );
          }
        } else {
          userUpdates[key] = userData[key];
        }
      }
    }
    // Handle profilePicture if it's a string URL
    if (userUpdates.profilePicture && typeof userUpdates.profilePicture === 'string') {
      userUpdates.profilePicture = {
        url: userUpdates.profilePicture,
        publicId: userUpdates.profilePicture.includes('cloudinary') ?
          userUpdates.profilePicture.split('/').pop().split('.')[0] : undefined
      };
      logger.info(`Converted string profilePicture to object for user ${userId}`);
    }

    // Apply updates to the user object
    Object.assign(user, userUpdates);

    // --- Role Details ---
    if (
      userData.roleDetails &&
      typeof userData.roleDetails === "object" &&
      user.role !== "user"
    ) {
      try {
        // Pass the specific role's details object
        const roleSpecificDetails = userData.roleDetails[user.role];
        if (roleSpecificDetails) {
          logger.info(`Processing role details for ${user.role}`, {
            userId: userId,
            detailsKeys: Object.keys(roleSpecificDetails),
          });
          await processRoleDetails(user, roleSpecificDetails, session); // processRoleDetails expects the details for the specific role
          logger.info(
            `Successfully processed role details for user ${userId} during profile completion.`
          );
        } else {
          logger.warn(
            `Role details provided in request, but no details found for user's primary role '${user.role}'`,
            { userId: userId }
          );
        }
      } catch (error) {
        logger.error(
          `Error processing role details during profile completion for user ${userId}: ${error.message}`,
          { stack: error.stack }
        );
        await session.abortTransaction();
        session.endSession();
        // Provide specific feedback if possible
        return next(
          new AppError(
            `Failed to update role-specific profile: ${error.message}`,
            error.statusCode || 500
          )
        );
      }
    }

    // --- Profile Picture ---
    if (cloudinaryFile) {
      // Delete old picture if exists
      if (user.profilePicture?.publicId) {
        try {
          await deleteFromCloudinary(user.profilePicture.publicId);
          logger.info(
            `Deleted old profile picture: ${user.profilePicture.publicId} for user ${userId}`
          );
        } catch (deleteError) {
          // Log error but don't fail the whole process
          logger.warn(
            `Failed to delete old profile picture ${user.profilePicture.publicId} for user ${userId}: ${deleteError.message}`
          );
        }
      }
      // Assign new picture details
      user.profilePicture = {
        url: cloudinaryFile.url,
        publicId: cloudinaryFile.publicId,
      };
      logger.info(
        `Updated profile picture for user ${userId} to ${cloudinaryFile.publicId}`
      );
    }

    // --- Final Checks and Save ---
    // Check profile completion status based on REQUIRED fields
    const completionDetails = getProfileCompletionDetails(user); // Recalculate based on updated user object
    user.isProfileCompleted = completionDetails.isComplete;
    logger.info(
      `Profile completion status for user ${userId}: ${user.isProfileCompleted}`,
      { missing: completionDetails.missingFields }
    );

    // Update role capabilities based on user's role (ensure this runs after role is set)
    try {
      const allRoles = [user.role, ...(user.secondaryRoles || [])].filter(
        Boolean
      ); // Get primary and secondary roles
      const capabilities = {
        canUploadProducts: allRoles.some((role) =>
          ["startupOwner", "maker", "agency", "freelancer"].includes(role)
        ), // Expanded who can upload
        canInvest: allRoles.includes("investor"),
        canOfferServices: allRoles.some((role) =>
          ["agency", "freelancer"].includes(role)
        ),
        canApplyToJobs: allRoles.includes("jobseeker"),
        canPostJobs: allRoles.some((role) =>
          ["startupOwner", "agency"].includes(role)
        ),
        canShowcaseProjects: allRoles.some((role) =>
          [
            "startupOwner",
            "agency",
            "freelancer",
            "jobseeker",
            "maker",
          ].includes(role)
        ), // Added maker
        // Add more capabilities as needed
        canManageCompanyProfile: allRoles.some((role) =>
          ["startupOwner", "agency"].includes(role)
        ),
        canAccessPremiumFeatures: user.subscription?.status === "active", // Example based on subscription
      };
      user.roleCapabilities = capabilities;
      logger.info(
        `Updated role capabilities for user ${userId} during profile completion.`
      );
    } catch (error) {
      logger.error(
        `Error setting role capabilities during completion for user ${userId}: ${error.message}`
      );
      // Non-critical, proceed with save
    }

    await user.save({ session });
    logger.info(`Profile completion transaction: User ${userId} saved.`);

    // Commit transaction
    await session.commitTransaction();
    logger.info(`Profile completion transaction committed for user ${userId}.`);

    // --- Post-Save Operations ---
    // Populate role details for the response AFTER successful save and commit
    let populatedUser = user.toObject(); // Start with the saved user data
    if (user.role && user.roleDetails && user.roleDetails[user.role]) {
      try {
        const finalUser = await User.findById(userId) // Fetch again outside session to populate
          .populate({
            path: `roleDetails.${user.role}`, // Dynamic population based on the user's role
            // select: 'field1 field2' // Select fields if needed
          });
        if (finalUser) {
          populatedUser = finalUser.toObject(); // Use populated data for response
          // Remove sensitive fields from populated data before sending
          delete populatedUser.password;
          // delete populatedUser.__v; // etc.
        }
      } catch (popError) {
        logger.error(
          `Failed to populate role details after profile completion for user ${userId}: ${popError.message}`
        );
        // Proceed with unpopulated data in response
      }
    }

    // Clean sensitive fields from the final response object
    delete populatedUser.password;
    delete populatedUser.__v;
    delete populatedUser.loginAttempts;
    delete populatedUser.lockUntil;
    delete populatedUser.passwordResetToken;
    delete populatedUser.passwordResetExpires;
    delete populatedUser.otpSentAt;
    delete populatedUser.otpFailedAttempts;
    delete populatedUser.lastOtpRequest;
    delete populatedUser.lastPasswordResetRequest;
    delete populatedUser.accountDeletionScheduled;
    delete populatedUser.createdAt;
    delete populatedUser.updatedAt;
    // ... delete other fields if necessary ...

    // --- Respond ---
    return res.status(200).json({
      status: "success",
      message: "Profile completed successfully!",
      data: { user: populatedUser }, // Send populated user data
      // No nextStep needed here as profile is now complete by definition
    });
  } catch (error) {
    logger.error(
      `Complete profile transaction failed for user ${userId}: ${error.message}`,
      { stack: error.stack }
    );
    await session.abortTransaction(); // Ensure transaction is aborted on any error
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AppError
    ) {
      next(error);
    } else {
      next(
        new AppError(
          "Failed to complete profile due to an unexpected error.",
          500,
          "COMPLETE_PROFILE_FAILED"
        )
      );
    }
  } finally {
    session.endSession(); // Always end the session
    logger.info(
      `Profile completion transaction session ended for user ${userId}.`
    );
  }
};

/**
 * @desc    Update user profile (general purpose)
 * @route   PUT /auth/profile
 * @access  Private (User must be authenticated and generally verified)
 */
export const updateProfile = async (req, res, next) => {
  // Validation should be handled by middleware (authValidator.validateProfileUpdate)
  // if (handleValidationErrors(req, next)) return;

  const userId = req.user._id;
  const updates = req.body; // Get updates from request body

  // Use transaction for multi-step updates (e.g., role details, capabilities)
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    logger.info(`Starting profile update transaction for user ${userId}`, {
      updateKeys: Object.keys(updates),
    });

    // --- Security Check: Prevent Unauthorised Role Change ---
    // Only admins should be able to change the 'role' or 'secondaryRoles' field directly
    if (
      (updates.hasOwnProperty("role") ||
        updates.hasOwnProperty("secondaryRoles")) &&
      req.user.role !== "admin"
    ) {
      await session.abortTransaction();
      session.endSession();
      logger.warn(`Unauthorized role modification attempt by user ${userId}`, {
        requestedRole: updates.role,
        requestedSecondary: updates.secondaryRoles,
        userRole: req.user.role,
      });
      return res.status(403).json({
        // Use standard formatResponse if preferred
        status: "error",
        message: "Permission denied. You cannot change user roles.",
      });
    }

    // --- Find User ---
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      logger.error(
        `User ${userId} not found during updateProfile transaction.`
      );
      return next(
        new NotFoundError(
          "User session invalid. Please log in again.",
          "UPDATE_PROFILE_USER_NOT_FOUND"
        )
      );
    }

    // --- Data Sanitization and Validation ---
    // (Similar to completeProfile, apply necessary sanitization/validation)
    // Address handling
    if (updates.location && !updates.address) {
      updates.address =
        typeof updates.location === "object"
          ? updates.location
          : { street: updates.location };
      delete updates.location;
    }
    if (updates.address) {
      if (typeof updates.address === "string")
        updates.address = { street: updates.address };
      updates.address = {
        // Merge with existing, prioritize new values
        street: updates.address.street?.trim() ?? user.address?.street ?? "", // Use nullish coalescing
        city: updates.address.city?.trim() ?? user.address?.city ?? "",
        country: updates.address.country?.trim() ?? user.address?.country ?? "",
      };
    }

    // Social Links handling
    if (updates.socialLinks && typeof updates.socialLinks === "object") {
      const cleanedLinks = { ...user.socialLinks?.toObject() }; // Start with existing links
      for (const linkKey in updates.socialLinks) {
        if (updates.socialLinks.hasOwnProperty(linkKey)) {
          let url = updates.socialLinks[linkKey];
          if (url && typeof url === "string") {
            url = url.trim();
            if (url && !url.match(/^https?:\/\//i)) {
              url = `https://${url}`;
            }
            cleanedLinks[linkKey] = url;
          } else {
            cleanedLinks[linkKey] = null; // Set to null if empty or invalid
          }
        }
      }
      updates.socialLinks = cleanedLinks;
    }

    // Birth Date handling
    if (updates.birthDate) {
      try {
        const date = new Date(updates.birthDate);
        if (!isNaN(date.getTime())) {
          updates.birthDate = date;
        } else {
          logger.warn(
            `Invalid birthDate format during update for user ${userId}: ${updates.birthDate}`
          );
          delete updates.birthDate; // Remove invalid date from updates
          // Optionally: return validation error instead of deleting
          // await session.abortTransaction(); session.endSession();
          // return next(new ValidationError("Invalid birth date format. Please use YYYY-MM-DD."));
        }
      } catch (dateError) {
        logger.warn(
          `Error parsing birthDate during update for user ${userId}: ${dateError.message}`
        );
        delete updates.birthDate;
      }
    } else if (
      updates.hasOwnProperty("birthDate") &&
      updates.birthDate === ""
    ) {
      // Allow clearing the birth date
      updates.birthDate = null;
    }

    // --- Handle Email Change ---
    let emailChanged = false;
    let originalEmail = user.email;
    let verificationNextStep = null; // Initialize next step variable

    if (
      updates.email &&
      typeof updates.email === "string" &&
      updates.email.toLowerCase() !== user.email?.toLowerCase()
    ) {
      const normalizedEmail = updates.email.toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        await session.abortTransaction();
        session.endSession();
        return next(new ValidationError("Invalid email format provided."));
      }

      const emailExists = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
      }).session(session);
      if (emailExists) {
        await session.abortTransaction();
        session.endSession();
        return next(
          new ValidationError("Email is already registered to another account.")
        );
      }

      updates.email = normalizedEmail;
      updates.isEmailVerified = false; // Mark as unverified
      emailChanged = true;
      logger.info(
        `User ${userId} is changing email to ${maskEmail(
          normalizedEmail
        )}. Verification required.`
      );
    } else if (updates.hasOwnProperty("email") && updates.email === "") {
      // Allow removing email only if phone exists and is verified
      if (!user.phone || !user.isPhoneVerified) {
        await session.abortTransaction();
        session.endSession();
        return next(
          new ValidationError(
            "Cannot remove email address without a verified phone number."
          )
        );
      }
      updates.email = null;
      updates.isEmailVerified = false;
      emailChanged = true; // Considered a change requiring potential updates
      logger.info(`User ${userId} removed email address.`);
    }

    // --- Handle Phone Change ---
    let phoneChanged = false;

    if (updates.phone && typeof updates.phone === "string") {
      const normalizedPhone = normalizePhone(updates.phone);
      if (!normalizedPhone) {
        await session.abortTransaction();
        session.endSession();
        return next(
          new ValidationError(
            "Invalid phone number format. Please include country code."
          )
        );
      }

      if (normalizedPhone !== user.phone) {
        const phoneExists = await User.findOne({
          phone: normalizedPhone,
          _id: { $ne: userId },
        }).session(session);
        if (phoneExists) {
          await session.abortTransaction();
          session.endSession();
          return next(
            new ValidationError(
              "Phone number is already registered to another account."
            )
          );
        }

        updates.phone = normalizedPhone;
        updates.isPhoneVerified = false; // Mark as unverified
        // Clear tempPhone if it existed, as we are setting the main phone now (needs verification)
        updates.tempPhone = undefined;
        phoneChanged = true;
        logger.info(
          `User ${userId} is changing phone to ${maskPhone(
            normalizedPhone
          )}. Verification required.`
        );

        // Prepare next step for phone verification
        verificationNextStep = {
          type: "phone_verification",
          title: "Phone Verification Required",
          description: "Verify your new phone number via OTP",
          required: true,
          message: `An OTP is required to verify your new phone number: ${maskPhone(
            normalizedPhone
          )}.`,
          action: "verify_phone_update", // Potentially different action/route for clarity
          actionLabel: "Verify Phone",
          data: { phone: maskPhone(normalizedPhone) },
        };
      } else {
        updates.phone = normalizedPhone; // Ensure normalized format even if not changed
      }
    } else if (updates.hasOwnProperty("phone") && updates.phone === "") {
      // Allow removing phone number only if email exists and is verified
      if (!user.email || !user.isEmailVerified) {
        await session.abortTransaction();
        session.endSession();
        return next(
          new ValidationError(
            "Cannot remove phone number without a verified email address."
          )
        );
      }
      updates.phone = null;
      updates.isPhoneVerified = false;
      phoneChanged = true;
      logger.info(`User ${userId} removed phone number.`);
    }

    // Final check: Ensure at least one contact method remains
    const finalEmail = updates.hasOwnProperty("email")
      ? updates.email
      : user.email;
    const finalPhone = updates.hasOwnProperty("phone")
      ? updates.phone
      : user.phone;
    if (!finalEmail && !finalPhone) {
      await session.abortTransaction();
      session.endSession();
      return next(
        new ValidationError(
          "Profile update failed: You must have at least one contact method (email or phone)."
        )
      );
    }

    // --- Apply User Updates ---
    // Exclude fields managed separately (roleDetails, profilePicture handled later if needed)
    const forbiddenFields = [
      "_id",
      "__v",
      "password",
      "loginAttempts",
      "lockUntil",
      "passwordResetToken",
      "passwordResetExpires",
      "otpSentAt",
      "otpFailedAttempts",
      "lastOtpRequest",
      "lastPasswordResetRequest",
      "accountDeletionScheduled",
      "createdAt",
      "updatedAt",
      "roleDetails",
      "products",
      "roleCapabilities",
      "profilePicture",
      "bannerImage",
      "tempPhone",
    ]; // tempPhone managed above
    const userUpdates = {};
    for (const key in updates) {
      if (!forbiddenFields.includes(key) && updates.hasOwnProperty(key)) {
        // Handle specific types or formatting
        if (key === "skills" && typeof updates[key] === "string") {
          // If skills are provided as string, split and filter
          userUpdates[key] = updates[key]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (key === "companySize" && typeof updates[key] === "string") {
          // Example: Standardize company size format (remove " employees" suffix)
          userUpdates[key] = updates[key].replace(/\s*employees$/i, "").trim();
        } else if (key === "headline" && typeof updates[key] === "string") {
          // Trim and limit headline length
          userUpdates[key] = updates[key].trim().substring(0, 100);
        } else if (key === "profilePicture" && typeof updates[key] === "string") {
          // Handle profilePicture if it's a string URL
          userUpdates[key] = {
            url: updates[key],
            publicId: updates[key].includes('cloudinary') ?
              updates[key].split('/').pop().split('.')[0] : undefined
          };
          logger.info(`Converted string profilePicture to object for user ${userId} in updateProfile`);
        } else {
          userUpdates[key] = updates[key];
        }
      }
    }
    Object.assign(user, userUpdates);

    // --- Process Role Details ---
    if (
      updates.roleDetails &&
      typeof updates.roleDetails === "object" &&
      user.role !== "user"
    ) {
      try {
        const roleSpecificDetails = updates.roleDetails[user.role];
        if (roleSpecificDetails) {
          logger.info(`Processing role details update for ${user.role}`, {
            userId: userId,
            detailsKeys: Object.keys(roleSpecificDetails),
          });
          await processRoleDetails(user, roleSpecificDetails, session);
          logger.info(
            `Successfully processed role details update for user ${userId}.`
          );
        } else {
          logger.warn(
            `Role details provided in update request, but no details found for user's primary role '${user.role}'`,
            { userId: userId }
          );
        }
      } catch (error) {
        logger.error(
          `Error processing role details during profile update for user ${userId}: ${error.message}`,
          { stack: error.stack }
        );
        await session.abortTransaction();
        session.endSession();
        return next(
          new AppError(
            `Failed to update role-specific profile: ${error.message}`,
            error.statusCode || 500
          )
        );
      }
    }

    // --- Update Role Capabilities if Role Changed (by admin) ---
    if (updates.role || updates.secondaryRoles) {
      try {
        const allRoles = [user.role, ...(user.secondaryRoles || [])].filter(
          Boolean
        );
        const capabilities = {
          // Recalculate capabilities
          canUploadProducts: allRoles.some((role) =>
            ["startupOwner", "maker", "agency", "freelancer"].includes(role)
          ),
          canInvest: allRoles.includes("investor"),
          canOfferServices: allRoles.some((role) =>
            ["agency", "freelancer"].includes(role)
          ),
          canApplyToJobs: allRoles.includes("jobseeker"),
          canPostJobs: allRoles.some((role) =>
            ["startupOwner", "agency"].includes(role)
          ),
          canShowcaseProjects: allRoles.some((role) =>
            [
              "startupOwner",
              "agency",
              "freelancer",
              "jobseeker",
              "maker",
            ].includes(role)
          ),
          canManageCompanyProfile: allRoles.some((role) =>
            ["startupOwner", "agency"].includes(role)
          ),
          canAccessPremiumFeatures: user.subscription?.status === "active",
        };
        user.roleCapabilities = capabilities;
        logger.info(
          `Updated role capabilities for user ${userId} during profile update (role changed).`
        );
      } catch (error) {
        logger.error(
          `Error updating role capabilities during profile update for user ${userId}: ${error.message}`
        );
        // Non-critical, proceed
      }
    }

    // Recalculate profile completion status if relevant fields were updated
    const completionAffectingFields = [
      "firstName",
      "lastName",
      "phone",
      "email",
      "about",
      "address",
    ]; // Fields affecting completion
    const didCompletionFieldsChange = Object.keys(updates).some(
      (key) =>
        completionAffectingFields.includes(key) || key.startsWith("address.")
    );
    if (didCompletionFieldsChange) {
      const completionDetails = getProfileCompletionDetails(user); // Use updated user object
      user.isProfileCompleted = completionDetails.isComplete;
      logger.info(
        `Profile completion status recalculated for user ${userId}: ${user.isProfileCompleted}`
      );
    }

    // --- Save User ---
    await user.save({ session });
    logger.info(`Profile update transaction: User ${userId} saved.`);

    // --- Commit Transaction ---
    await session.commitTransaction();
    logger.info(`Profile update transaction committed for user ${userId}.`);

    // --- Post-Commit Actions (like sending verification email) ---
    let responseMessage = "Profile updated successfully.";
    if (emailChanged && user.email) {
      // Check if email exists after change
      try {
        const emailToken = generateEmailToken(user._id);
        const verificationLink = `${process.env.CLIENT_URL}/auth/verify-email/${emailToken}`;
        await sendVerificationEmail(
          user.email,
          "Verify Your New Email Address",
          `You updated your email address. Please verify your new email by clicking this link: ${verificationLink}`
        );
        // No need to save again here, but update logger
        logger.info(
          `Verification email sent to new address ${maskEmail(
            user.email
          )} for user ${userId}.`
        );
        responseMessage =
          "Profile updated. Please check your new email address to complete verification.";
        // Prepare next step for email verification if phone verification isn't also pending
        if (!verificationNextStep) {
          verificationNextStep = {
            type: "email_verification",
            title: "Email Verification Required",
            description: "Verify your new email address",
            required: true,
            message: `Please check your inbox at ${maskEmail(
              user.email
            )} to verify your new email address.`,
            action: "verify_email",
            actionLabel: "Check Email",
            data: {
              email: maskEmail(user.email),
              previousEmail: maskEmail(originalEmail),
            },
          };
        }
      } catch (emailError) {
        logger.error(
          `Failed to send verification email after update for user ${userId}: ${emailError.message}`
        );
        responseMessage =
          "Profile updated, but failed to send verification email to the new address. Please try resending it later.";
        // Potentially add an error indicator to the nextStep?
      }
    }

    if (phoneChanged && !user.isPhoneVerified && verificationNextStep) {
      // If phone changed and needs verification
      responseMessage =
        "Profile updated. Please verify your new phone number via OTP.";
    }

    // --- Populate and Respond ---
    // Fetch final user state with populated details if needed for response
    let populatedUser = user.toObject(); // Start with the saved data
    if (user.role && user.roleDetails && user.roleDetails[user.role]) {
      try {
        const finalUser = await User.findById(userId).populate({
          path: `roleDetails.${user.role}`,
        });
        if (finalUser) {
          populatedUser = finalUser.toObject();
          // Clean sensitive fields
          delete populatedUser.password;
          delete populatedUser.__v; // etc.
        }
      } catch (popError) {
        logger.error(
          `Failed to populate role details after profile update for user ${userId}: ${popError.message}`
        );
      }
    }

    // Clean sensitive fields from the final response object
    delete populatedUser.password;
    delete populatedUser.__v;
    delete populatedUser.loginAttempts;
    delete populatedUser.lockUntil;
    delete populatedUser.passwordResetToken;
    delete populatedUser.passwordResetExpires;
    delete populatedUser.otpSentAt;
    delete populatedUser.otpFailedAttempts;
    delete populatedUser.lastOtpRequest;
    delete populatedUser.lastPasswordResetRequest;
    delete populatedUser.accountDeletionScheduled;
    delete populatedUser.createdAt;
    delete populatedUser.updatedAt;
    // ... delete other fields if necessary ...

    res.status(200).json(
      formatResponse(
        "success",
        responseMessage,
        { user: populatedUser },
        verificationNextStep // Send next step if email/phone verification is needed
      )
    );
  } catch (error) {
    logger.error(
      `Update profile transaction failed for user ${userId}: ${error.message}`,
      { stack: error.stack }
    );
    await session.abortTransaction(); // Ensure abort on error
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AppError ||
      error instanceof mongoose.Error.CastError
    ) {
      next(error);
    } else {
      next(
        new AppError(
          "Failed to update profile due to an unexpected error.",
          500,
          "UPDATE_PROFILE_FAILED"
        )
      );
    }
  } finally {
    session.endSession(); // Always end the session
    logger.info(`Profile update transaction session ended for user ${userId}.`);
  }
};

/**
 * @desc    Check if username is available
 * @route   GET /auth/check-username?username=...
 * @access  Private (Authenticated user checking for availability)
 */
export const checkUsernameAvailability = async (req, res, next) => {
  const { username } = req.query;
  const userId = req.user._id; // Exclude current user's username if it matches

  try {
    if (!username || typeof username !== "string") {
      // Use formatResponse for consistency
      return res
        .status(400)
        .json(
          formatResponse("error", "Username is required.", {
            available: false,
            reason: "Missing username",
          })
        );
    }

    const trimmedUsername = username.trim();
    const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/; // Allow letters, numbers, dot, underscore, hyphen

    if (!usernameRegex.test(trimmedUsername)) {
      let reason = "Invalid format.";
      if (trimmedUsername.length < 3)
        reason = "Username must be at least 3 characters long.";
      if (trimmedUsername.length > 30)
        reason = "Username cannot exceed 30 characters.";
      if (trimmedUsername.match(/[^a-zA-Z0-9._-]/))
        reason = "Username can only contain letters, numbers, '.', '_', '-'.";

      return res.status(200).json(
        // Send 200 OK, but indicate unavailability due to format
        formatResponse("success", `Username format is invalid: ${reason}`, {
          available: false,
          reason: reason, // Provide specific reason
          username: trimmedUsername, // Echo back the checked username
        })
      );
    }

    // Check against reserved words (optional but recommended)
    const reservedUsernames = [
      "admin",
      "support",
      "root",
      "system",
      "moderator",
      "help",
      "info",
      "contact",
      "api",
      "auth",
    ]; // Add more as needed
    if (reservedUsernames.includes(trimmedUsername.toLowerCase())) {
      return res.status(200).json(
        formatResponse("success", "This username is reserved.", {
          available: false,
          reason: "Reserved username",
          username: trimmedUsername,
        })
      );
    }

    // Check if username exists, excluding the current user
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${trimmedUsername}$`, "i") }, // Case-insensitive check
      _id: { $ne: userId }, // Exclude the user making the request
    }).lean(); // Use lean for faster query as we only need existence check

    if (existingUser) {
      return res.status(200).json(
        formatResponse("success", "Username is already taken.", {
          available: false,
          reason: "Already taken",
          username: trimmedUsername,
        })
      );
    } else {
      return res.status(200).json(
        formatResponse("success", "Username is available!", {
          available: true,
          reason: null,
          username: trimmedUsername,
        })
      );
    }
  } catch (error) {
    logger.error(
      `Check username availability failed for "${username}": ${error.message}`,
      { userId }
    );
    // Avoid exposing detailed errors
    next(
      new AppError(
        "Failed to check username availability due to a server error.",
        500,
        "CHECK_USERNAME_FAILED"
      )
    );
  }
};

/**
 * @desc    Update user profile picture
 * @route   POST /auth/update-profile (Note: Ambiguous route name, consider /update-profile-picture)
 * @access  Private
 */
export const updateProfilePicture = async (req, res, next) => {
  const userId = req.user._id;

  try {
    // Check if file exists (Multer middleware should handle this)
    if (!req.file) {
      // If handleMulterError didn't catch it, catch it here
      return next(
        new AppError(
          "No profile image file was uploaded.",
          400,
          "NO_FILE_UPLOADED"
        )
      );
    }
    // Check from cloudinaryUploader middleware
    if (!req.cloudinaryFile) {
      logger.error(
        `Cloudinary uploader middleware did not attach file info for user ${userId}`
      );
      return next(
        new AppError(
          "Image upload failed during processing.",
          500,
          "CLOUDINARY_UPLOAD_MISSING"
        )
      );
    }

    const { url, publicId } = req.cloudinaryFile; // Get details from middleware

    const user = await User.findById(userId).select("profilePicture"); // Select only necessary field
    if (!user) {
      // Should not happen if auth middleware works
      logger.error(`User ${userId} not found during profile picture update.`);
      // Attempt to delete the uploaded image if user not found? Maybe.
      if (publicId)
        await deleteFromCloudinary(publicId).catch((e) =>
          logger.error(
            `Failed to delete orphaned upload ${publicId}: ${e.message}`
          )
        );
      return next(
        new NotFoundError(
          "User session invalid. Please log in again.",
          "UPDATE_PIC_USER_NOT_FOUND"
        )
      );
    }

    // Delete old profile picture from Cloudinary if it exists
    const oldPublicId = user.profilePicture?.publicId;
    if (oldPublicId && oldPublicId !== publicId) {
      // Ensure we don't delete the newly uploaded one
      try {
        await deleteFromCloudinary(oldPublicId);
        logger.info(
          `Deleted old profile picture ${oldPublicId} for user ${userId}`
        );
      } catch (deleteError) {
        // Log the error but proceed with updating the user record
        logger.warn(
          `Failed to delete old profile picture ${oldPublicId} for user ${userId}: ${deleteError.message}`
        );
      }
    }

    // Update user document
    user.profilePicture = { url, publicId };
    await user.save();

    logger.info(
      `Profile picture updated successfully for user ${userId} to ${publicId}`
    );

    // Use standard formatResponse
    return res.status(200).json(
      formatResponse("success", "Profile picture updated successfully.", {
        user: {
          // Return only the updated information
          _id: user._id,
          profilePicture: user.profilePicture,
        },
      })
    );
  } catch (error) {
    logger.error(
      `Error updating profile picture for user ${userId}: ${error.message}`,
      { stack: error.stack }
    );
    // If error occurred after upload, try to delete the potentially orphaned new image
    if (req.cloudinaryFile?.publicId) {
      await deleteFromCloudinary(req.cloudinaryFile.publicId).catch((e) =>
        logger.error(
          `Failed to clean up failed upload ${req.cloudinaryFile.publicId}: ${e.message}`
        )
      );
    }
    if (error instanceof AppError || error instanceof NotFoundError) {
      next(error);
    } else {
      next(
        new AppError(
          "Failed to update profile picture due to a server error.",
          500,
          "UPDATE_PIC_FAILED"
        )
      );
    }
  }
};

/**
 * @desc    Update user banner image
 * @route   POST /auth/update-banner
 * @access  Private
 */
export const updateBannerImage = async (req, res, next) => {
  const userId = req.user._id;

  try {
    // Check if file exists (Multer middleware should handle this)
    if (!req.file) {
      return next(
        new AppError(
          "No banner image file was uploaded.",
          400,
          "NO_FILE_UPLOADED"
        )
      );
    }
    // Check from cloudinaryUploader middleware
    if (!req.cloudinaryFile) {
      logger.error(
        `Cloudinary uploader middleware did not attach file info for banner for user ${userId}`
      );
      return next(
        new AppError(
          "Image upload failed during processing.",
          500,
          "CLOUDINARY_UPLOAD_MISSING"
        )
      );
    }

    const { url, publicId } = req.cloudinaryFile;

    const user = await User.findById(userId).select("bannerImage");
    if (!user) {
      logger.error(`User ${userId} not found during banner image update.`);
      if (publicId)
        await deleteFromCloudinary(publicId).catch((e) =>
          logger.error(
            `Failed to delete orphaned banner upload ${publicId}: ${e.message}`
          )
        );
      return next(
        new NotFoundError(
          "User session invalid. Please log in again.",
          "UPDATE_BANNER_USER_NOT_FOUND"
        )
      );
    }

    // Delete old banner image if exists
    const oldPublicId = user.bannerImage?.publicId;
    if (oldPublicId && oldPublicId !== publicId) {
      try {
        await deleteFromCloudinary(oldPublicId);
        logger.info(
          `Deleted old banner image ${oldPublicId} for user ${userId}`
        );
      } catch (deleteError) {
        logger.warn(
          `Failed to delete old banner image ${oldPublicId} for user ${userId}: ${deleteError.message}`
        );
      }
    }

    // Update user document
    user.bannerImage = { url, publicId };
    await user.save();

    logger.info(
      `Banner image updated successfully for user ${userId} to ${publicId}`
    );

    return res.status(200).json(
      formatResponse("success", "Banner image updated successfully.", {
        user: {
          // Return only updated info
          _id: user._id,
          bannerImage: user.bannerImage,
        },
      })
    );
  } catch (error) {
    logger.error(
      `Error updating banner image for user ${userId}: ${error.message}`,
      { stack: error.stack }
    );
    if (req.cloudinaryFile?.publicId) {
      await deleteFromCloudinary(req.cloudinaryFile.publicId).catch((e) =>
        logger.error(
          `Failed to clean up failed banner upload ${req.cloudinaryFile.publicId}: ${e.message}`
        )
      );
    }
    if (error instanceof AppError || error instanceof NotFoundError) {
      next(error);
    } else {
      next(
        new AppError(
          "Failed to update banner image due to a server error.",
          500,
          "UPDATE_BANNER_FAILED"
        )
      );
    }
  }
};

/**
 * @desc    Process multiple profile-related images (e.g., profile + banner in one request)
 * @route   POST /auth/update-profile-full (or similar)
 * @access  Private
 */
export const processProfileImages = async (req, res, next) => {
  // This controller assumes middleware (`uploadMultiple`, `cloudinaryUploader`)
  // has processed files and attached results to `req.cloudinaryFiles` (an object or array).
  // Example: req.cloudinaryFiles = { profileImage: { url, publicId }, bannerImage: { url, publicId } }
  // OR req.cloudinaryFiles = [ { fieldname: 'profileImage', url, publicId }, ... ]

  const userId = req.user._id;

  try {
    if (!req.cloudinaryFiles || Object.keys(req.cloudinaryFiles).length === 0) {
      return next(
        new AppError(
          "No images were successfully uploaded or processed.",
          400,
          "NO_IMAGES_PROCESSED"
        )
      );
    }

    const user = await User.findById(userId).select(
      "profilePicture bannerImage"
    );
    if (!user) {
      logger.error(`User ${userId} not found during multi-image update.`);
      // Clean up all uploaded files from this request if user not found
      if (req.cloudinaryFiles) {
        for (const key in req.cloudinaryFiles) {
          if (req.cloudinaryFiles[key]?.publicId) {
            await deleteFromCloudinary(req.cloudinaryFiles[key].publicId).catch(
              (e) =>
                logger.error(
                  `Failed to delete orphaned multi-upload ${req.cloudinaryFiles[key].publicId}: ${e.message}`
                )
            );
          }
        }
      }
      return next(
        new NotFoundError(
          "User session invalid. Please log in again.",
          "MULTI_IMAGE_USER_NOT_FOUND"
        )
      );
    }

    const updates = {}; // Track which images were updated
    const oldPublicIdsToDelete = [];

    // Process Profile Image if present in the upload results
    const profileUpload =
      req.cloudinaryFiles.profileImage ||
      req.cloudinaryFiles.find((f) => f.fieldname === "profileImage");
    if (profileUpload) {
      if (
        user.profilePicture?.publicId &&
        user.profilePicture.publicId !== profileUpload.publicId
      ) {
        oldPublicIdsToDelete.push(user.profilePicture.publicId);
      }
      user.profilePicture = {
        url: profileUpload.url,
        publicId: profileUpload.publicId,
      };
      updates.profilePicture = true;
      logger.info(
        `Multi-update: Profile picture staged for user ${userId} (${profileUpload.publicId})`
      );
    }

    // Process Banner Image if present
    const bannerUpload =
      req.cloudinaryFiles.bannerImage ||
      req.cloudinaryFiles.find((f) => f.fieldname === "bannerImage");
    if (bannerUpload) {
      if (
        user.bannerImage?.publicId &&
        user.bannerImage.publicId !== bannerUpload.publicId
      ) {
        oldPublicIdsToDelete.push(user.bannerImage.publicId);
      }
      user.bannerImage = {
        url: bannerUpload.url,
        publicId: bannerUpload.publicId,
      };
      updates.bannerImage = true;
      logger.info(
        `Multi-update: Banner image staged for user ${userId} (${bannerUpload.publicId})`
      );
    }

    // Add processing for other potential image fields (e.g., companyLogo) here...
    // const companyLogoUpload = req.cloudinaryFiles.companyLogo || ...
    // if (companyLogoUpload) { ... }

    if (Object.keys(updates).length === 0) {
      // Should be caught earlier, but as a safeguard
      return next(
        new AppError(
          "No supported image fields found in the upload.",
          400,
          "NO_SUPPORTED_IMAGES"
        )
      );
    }

    // Save the user with updated image references
    await user.save();
    logger.info(`Multi-update: User ${userId} saved with updated images.`);

    // Delete old images from Cloudinary AFTER successful save
    if (oldPublicIdsToDelete.length > 0) {
      logger.info(
        `Multi-update: Deleting old images for user ${userId}: ${oldPublicIdsToDelete.join(
          ", "
        )}`
      );
      await Promise.all(
        oldPublicIdsToDelete.map((publicId) =>
          deleteFromCloudinary(publicId).catch((err) =>
            logger.warn(
              `Multi-update: Failed to delete old image ${publicId} for user ${userId}: ${err.message}`
            )
          )
        )
      );
    }

    return res.status(200).json(
      formatResponse("success", "Profile images updated successfully.", {
        user: {
          // Return only updated fields
          _id: user._id,
          ...(updates.profilePicture && {
            profilePicture: user.profilePicture,
          }),
          ...(updates.bannerImage && { bannerImage: user.bannerImage }),
          // ...(updates.companyLogo && { companyLogo: user.companyLogo }),
        },
        updates, // Optionally confirm which fields were updated
      })
    );
  } catch (error) {
    logger.error(
      `Error processing multiple profile images for user ${userId}: ${error.message}`,
      { stack: error.stack }
    );
    // Clean up all potentially uploaded files on error
    if (req.cloudinaryFiles) {
      for (const key in req.cloudinaryFiles) {
        if (req.cloudinaryFiles[key]?.publicId) {
          await deleteFromCloudinary(req.cloudinaryFiles[key].publicId).catch(
            (e) =>
              logger.error(
                `Failed to clean up failed multi-upload ${req.cloudinaryFiles[key].publicId}: ${e.message}`
              )
          );
        }
      }
    }
    if (error instanceof AppError || error instanceof NotFoundError) {
      next(error);
    } else {
      next(
        new AppError(
          "Failed to process profile images due to a server error.",
          500,
          "MULTI_IMAGE_UPDATE_FAILED"
        )
      );
    }
  }
};
