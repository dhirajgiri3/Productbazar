import mongoose from "mongoose";
import User from "../../models/user/user.model.js";
import RefreshToken from "../../models/core/refreshToken.model.js";
import Investor from "../../models/user/investor.model.js";
import Startup from "../../models/user/startup.model.js";
import Agency from "../../models/user/agency.model.js";
import Freelancer from "../../models/user/freelancer.model.js";
import Jobseeker from "../../models/user/jobseeker.model.js";
import Blacklist from "../../models/core/blacklist.model.js";
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
import { maskPhone } from "../../utils/communication/phone.utils.js";
import {
  handleValidationErrors,
  isStrongPassword,
  formatResponse,
  getVerificationNextStep,
  ensureAddressStructure,
} from "./helpers/auth.helpers.js";
import { isProduction } from "./helpers/auth.constants.js";

dotenv.config();

/**
 * @desc    Get user by id
 * @route   GET /auth/user/:id
 * @access  Public
 */
export const getUserById = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ValidationError("Invalid user ID format"));
    }
    const user = await User.findById(id).select('-password -__v -loginAttempts -lockUntil -passwordResetToken -passwordResetExpires -tempPhone -otpSentAt -otpFailedAttempts -lastOtpRequest -lastPasswordResetRequest'); // Exclude sensitive fields
    if (!user) {
      return next(new NotFoundError("User not found")); // Use NotFoundError
    }
    // Optionally mask sensitive info if needed for public view
    const publicUserData = {
        ...user.toObject(),
        email: maskEmail(user.email),
        phone: maskPhone(user.phone),
        // Remove or mask other fields if necessary
    };

    // Ensure address structure consistency before sending response
    // No need to await here if we only modify the object in memory for the response
    // await ensureAddressStructure(user); // Don't modify DB in a GET request ideally

    res.status(200).json(formatResponse("success", "User retrieved successfully", { user: publicUserData }));
  } catch (error) {
    logger.error(`Error fetching user by ID ${id}: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get user by username
 * @route   GET /auth/user/username/:username
 * @access  Public
 */
export const getUserByUsername = async (req, res, next) => {
  const { username } = req.params;

  try {
    if (!username || typeof username !== 'string') {
      return next(new ValidationError("Invalid username format"));
    }

    const user = await User.findOne({ username: username.toLowerCase() })
      .select('-password -__v -loginAttempts -lockUntil -passwordResetToken -passwordResetExpires -tempPhone -otpSentAt -otpFailedAttempts -lastOtpRequest -lastPasswordResetRequest')
      .populate({
        path: 'roleDetails.startupOwner roleDetails.investor roleDetails.agency roleDetails.freelancer roleDetails.jobseeker',
        select: 'companyName investorType skills desiredJobTitle'
      }); // Exclude sensitive fields

    if (!user) {
      return next(new NotFoundError("User not found")); // Use NotFoundError
    }

    // Optionally mask sensitive info if needed for public view
    const publicUserData = {
      ...user.toObject(),
      email: maskEmail(user.email),
      phone: maskPhone(user.phone),
      // Remove or mask other fields if necessary
    };

    res.status(200).json(formatResponse("success", "User retrieved successfully", { user: publicUserData }));
  } catch (error) {
    logger.error(`Error fetching user by username ${username}: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Register with email
 * @route   POST /auth/register/email
 * @access  Public
 */
export const register = async (req, res, next) => {
  if (handleValidationErrors(req, next)) return;

  const { email, password, role, roleDetails } = req.body;

  try {
    logger.info(`New user registration attempt`, { email: maskEmail(email) });

    if (!isStrongPassword(password)) {
      return next(
        new ValidationError(
          "Password must be 8+ characters with uppercase, lowercase, number, and special character"
        )
      );
    }

    const validRoles = [
      "user",
      "startupOwner",
      "investor",
      "agency",
      "freelancer",
      "jobseeker",
    ];
    if (role && !validRoles.includes(role)) {
      return next(new ValidationError("Invalid role specified"));
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return next(new ValidationError("Email already registered"));
    }

    // Generate username logic (same as original)
    const emailUsername = email.toLowerCase().split('@')[0];
    let baseUsername = emailUsername.replace(/[^a-z0-9._-]/g, '.').replace(/\.+/g, '.');
    if (baseUsername.length < 3) baseUsername = baseUsername.padEnd(3, '0');
    if (baseUsername.length > 30) baseUsername = baseUsername.substring(0, 30);
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
        if (username.length > 30) { // Ensure generated username doesn't exceed length
            username = baseUsername.substring(0, 30 - String(suffix).length) + suffix;
        }
      }
      if (suffix > 1000) {
        username = `user${Math.floor(Math.random() * 1000000)}`;
        break;
      }
    }

    const user = new User({
      email: email.toLowerCase(),
      username,
      password,
      role: role || "user",
      isEmailVerified: false,
      isPhoneVerified: false,
      isProfileCompleted: false, // Explicitly set based on profile completion logic
      address: { street: '', city: '', country: '' } // Initialize address
    });

    await user.save();
    if (!user._id) {
      logger.error("Critical: User creation failed - no ID assigned");
      throw new AppError("Failed to create user - no ID assigned", 500);
    }

    // Handle role-specific document creation (same as original)
    if (role && role !== "user" && role !== "admin" && roleDetails) {
        let RoleModel;
        let roleDocData = { user: user._id };

        // Determine RoleModel and base data
        switch (role) {
            case "startupOwner":
                RoleModel = Startup;
                roleDocData = { ...roleDocData, companyName: roleDetails.companyName || `Startup_${user.username}`, industry: roleDetails.industry, fundingStage: roleDetails.fundingStage };
                break;
            case "investor":
                RoleModel = Investor;
                roleDocData = { ...roleDocData, investorType: roleDetails.investorType || "Angel Investor" };
                break;
            case "agency":
                RoleModel = Agency;
                roleDocData = { ...roleDocData, companyName: roleDetails.companyName || `Agency_${user.username}` };
                break;
            case "freelancer":
                RoleModel = Freelancer;
                // Ensure skills is an array of strings
                const skills = Array.isArray(roleDetails.skills) ? roleDetails.skills : (typeof roleDetails.skills === 'string' ? roleDetails.skills.split(',').map(s => s.trim()).filter(s => s) : []);
                roleDocData = { ...roleDocData, skills: skills.length > 0 ? skills : ["General"] };
                break;
            case "jobseeker":
                RoleModel = Jobseeker;
                roleDocData = { ...roleDocData, desiredJobTitle: roleDetails.jobTitle || "Seeking Opportunity" }; // Use a more descriptive field if available
                break;
            default:
                // Handle unknown role? Log maybe?
                logger.warn(`Unknown role specified during registration: ${role}`);
                break;
        }

        // Create role document if RoleModel is determined
        if (RoleModel) {
            try {
                const roleInstance = await RoleModel.create(roleDocData);
                if (!roleInstance._id) {
                    throw new AppError(`Failed to create ${role} profile document`, 500);
                }
                // Dynamically set the role details field
                user.roleDetails = { ...user.roleDetails, [role]: roleInstance._id };
                await user.save();
                logger.info(`Created ${role} profile for user ${user._id}`, { roleDocId: roleInstance._id });
            } catch (roleError) {
                logger.error(`Error creating role document for ${role}: ${roleError.message}`, { userId: user._id });
                // Attempt to clean up the user if role creation fails
                await User.findByIdAndDelete(user._id);
                return next(new AppError(`Registration failed: Could not create ${role} profile. ${roleError.message}`, 500));
            }
        }
    }


    const emailToken = generateEmailToken(user._id);
    const verificationLink = `${process.env.CLIENT_URL}/auth/verify-email/${emailToken}`;

    try {
      await sendVerificationEmail(
        user.email,
        "Verify Your Email",
        `Please verify your email: ${verificationLink}`
      );
      logger.info(`Verification email sent to ${maskEmail(user.email)}`);
      user.lastEmailVerificationRequest = new Date(); // Track when it was sent
      await user.save();
    } catch (emailError) {
      logger.error(`Failed to send verification email: ${emailError.message}`);
      // Proceed with registration, but maybe log this as a critical issue
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const refreshTokenDoc = new RefreshToken({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdByIp: req.ip,
    });
    await refreshTokenDoc.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Refresh user object to get the latest state for next step calculation
    const freshUser = await User.findById(user._id);
    const nextStep = getVerificationNextStep(freshUser);

    res.status(201).json(
      formatResponse(
        "success",
        "Registration successful. Please verify your email.",
        {
          accessToken,
          user: {
            id: user._id,
            username: user.username,
            email: maskEmail(user.email),
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            isProfileCompleted: user.isProfileCompleted, // Send current status
            profilePicture: user.profilePicture?.url || null,
            // Include roleDetails ID if relevant for frontend state
            roleDetailsId: user.roleDetails && user.roleDetails[user.role] ? user.roleDetails[user.role] : null
          },
        },
        nextStep
      )
    );
  } catch (error) {
    logger.error(`Registration failed`, {
      error: error.message,
      stack: error.stack,
    });
    // Avoid generic 500 if it's a validation error caught earlier
    if (error instanceof ValidationError || error instanceof AppError) {
        next(error);
    } else {
        next(new AppError("Failed to register user", 500));
    }
  }
};

/**
 * @desc    Login with email
 * @route   POST /auth/login/email
 * @access  Public
 */
export const login = async (req, res, next) => {
  if (handleValidationErrors(req, next)) return;

  const { email, password } = req.body;

  try {
    logger.info(`Login attempt for email: ${maskEmail(email)}`);

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +loginAttempts +lockUntil" // Include necessary fields
    ).populate({ // Populate primary role details
        path: 'roleDetails.startupOwner roleDetails.investor roleDetails.agency roleDetails.freelancer roleDetails.jobseeker',
        select: 'companyName investorType skills desiredJobTitle' // Select relevant fields for initial display
    });

    if (!user) {
      return next(new ValidationError("Invalid email or password")); // More generic message
    }

    if (user.isLocked) {
      logger.warn(`Login attempt on locked account`, {
        email: maskEmail(email),
        userId: user._id,
      });
      const timeLeft = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60); // Time left in minutes
      return next(new UnauthorizedError(`Account locked. Try again in ${timeLeft} minutes.`));
    }

    if (!(await user.verifyPassword(password))) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      logger.warn(`Failed login attempt`, {
        email: maskEmail(email),
        userId: user._id,
        attempts: user.loginAttempts,
      });
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
         logger.warn(`Account locked due to failed attempts`, { userId: user._id });
      }
      await user.save();
      return next(new ValidationError("Invalid email or password")); // Consistent generic message
    }

    // Ensure address structure on successful login
    await ensureAddressStructure(user); // Await the update

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens with appropriate expiry times
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Clean up old refresh tokens for the user (good practice to prevent token buildup)
    // Only keep the 5 most recent tokens to allow multiple devices
    const oldTokens = await RefreshToken.find({
      user: user._id,
      revokedAt: null // Only count active tokens
    }).sort({ createdAt: -1 }).skip(4); // Keep the 5 most recent

    if (oldTokens.length > 0) {
      const oldTokenIds = oldTokens.map(t => t._id);
      await RefreshToken.updateMany(
        { _id: { $in: oldTokenIds } },
        {
          revokedAt: new Date(),
          revokedByIp: req.ip,
          revokedReason: 'Token limit exceeded'
        }
      );
      logger.info(`Revoked ${oldTokenIds.length} old refresh tokens for user ${user._id}`);
    }

    // Create new refresh token document
    const refreshTokenDoc = new RefreshToken({
      user: user._id,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
      createdByIp: req.ip,
      userAgent: req.headers['user-agent'] || 'Unknown' // Store user agent
    });
    await refreshTokenDoc.save();

    // Set refresh token cookie with appropriate security settings
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Prevent JavaScript access
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? "none" : "lax", // Allow cross-site in production for frontend/backend separation
      path: "/", // Available across the site
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Send verification if needed AFTER successful login and token generation
    let verificationSent = false;
    if (user.email && !user.isEmailVerified) {
       try {
           const emailToken = generateEmailToken(user._id);
           const verificationLink = `${process.env.CLIENT_URL}/auth/verify-email/${emailToken}`;
           await sendVerificationEmail(
               user.email,
               "Verify Your Email",
               `Welcome back! Please verify your email: ${verificationLink}`
           );
           logger.info(`Verification email sent upon login to: ${maskEmail(user.email)}`);
           user.lastEmailVerificationRequest = new Date();
           await user.save(); // Save the timestamp
           verificationSent = true;
       } catch (emailError) {
           logger.warn(`Failed to send verification email on login: ${emailError.message}`, { userId: user._id });
       }
    }
    // Potentially send phone verification too if needed
    // if (user.phone && !user.isPhoneVerified) { ... }

    const nextStep = getVerificationNextStep(user);
    const message = verificationSent ? "Login successful. Please check your email to verify your account." : "Login successful";

    // Extract relevant populated role details
    const roleDetailData = user.roleDetails ? user.roleDetails[user.role] : null;

    // Determine if client is mobile or web based on user agent
    const isMobileClient = req.headers['user-agent'] &&
      (req.headers['user-agent'].includes('Mobile') ||
       req.headers['user-agent'].includes('Android') ||
       req.headers['user-agent'].includes('iOS'));

    // For mobile clients, include refresh token in response
    // For web clients, rely on the HTTP-only cookie
     const responseData = {
      accessToken,
      ...(isMobileClient && { refreshToken }),
      user: {
        _id: user._id, // CHANGED FROM id to _id
        username: user.username,
        email: maskEmail(user.email),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: maskPhone(user.phone) || "",
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isProfileCompleted: user.isProfileCompleted,
        profilePicture: user.profilePicture?.url || null,
        roleDetailsSummary: roleDetailData ? { /* ... */ } : null,
      },
    };

    res.status(200).json(
      formatResponse(
        "success",
        message,
        responseData,
        nextStep
      )
    );
  } catch (error) {
    logger.error(`Login failed`, { error: error.message, stack: error.stack });
    next(new AppError("Login failed due to an internal error", 500));
  }
};

/**
 * @desc    Logout user
 * @route   POST /auth/logout
 * @access  Private (Requires valid token)
 */
export const logout = async (req, res, next) => {
  const refreshTokenFromCookie = req.cookies.refreshToken;
  const accessTokenFromHeader = req.token; // Assuming authenticateToken middleware adds this

  try {
    logger.info(`Logout attempt initiated by user: ${req.user?._id || 'Unknown'}`);

    if (!refreshTokenFromCookie && !accessTokenFromHeader) {
        // If called without any tokens (e.g., already logged out client-side)
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
        });
        return res.status(200).json(formatResponse("success", "No active session found or already logged out"));
    }

    // Invalidate Refresh Token in DB
    if (refreshTokenFromCookie) {
      const storedToken = await RefreshToken.findOne({ token: refreshTokenFromCookie });
      if (storedToken && storedToken.isActive) { // Check if it's currently active
        storedToken.revokedAt = Date.now();
        storedToken.revokedByIp = req.ip;
        await storedToken.save();
        logger.info(`Refresh token revoked for user: ${storedToken.user}`, { tokenId: storedToken._id });
      } else if (storedToken) {
          logger.warn(`Logout attempt with already revoked/expired refresh token`, { userId: storedToken.user, tokenId: storedToken._id });
      } else {
          logger.warn(`Logout attempt with non-existent refresh token in cookie`);
      }
    }

    // Blacklist Access Token
    if (accessTokenFromHeader) {
      try {
        // Use verify to get expiry, decode doesn't validate signature/expiry
        const decoded = jwt.verify(accessTokenFromHeader, process.env.JWT_ACCESS_SECRET, { ignoreExpiration: true }); // Ignore expiry for blacklisting
        if (decoded?.exp) {
            // Only blacklist if it hasn't already expired naturally
            const expiresAt = new Date(decoded.exp * 1000);
            if (expiresAt > new Date()) {
                await new Blacklist({
                    token: accessTokenFromHeader,
                    expiresAt: expiresAt,
                }).save();
                logger.info(`Access token blacklisted for user: ${decoded.id}`);
            } else {
                 logger.info(`Access token already expired, not blacklisted`, { userId: decoded.id });
            }
        } else {
             logger.warn(`Could not decode access token or missing expiry during logout`, { userId: req.user?._id });
        }
      } catch (error) {
          // Ignore verification errors (like TokenExpiredError) as we still want to proceed with logout
          if (error instanceof jwt.TokenExpiredError) {
              logger.info(`Access token already expired during logout validation`, { userId: req.user?._id });
          } else if (error instanceof jwt.JsonWebTokenError) {
              logger.warn(`Invalid access token presented during logout`, { userId: req.user?._id, error: error.message });
          } else {
              logger.error(`Error during access token blacklisting: ${error.message}`, { userId: req.user?._id });
          }
      }
    }

    // Clear the cookie regardless of DB operations succeeding
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    res.status(200).json(formatResponse("success", "Logged out successfully"));
  } catch (error) {
    logger.error(`Logout failed unexpectedly`, { userId: req.user?._id, error: error.message, stack: error.stack });
    // Clear cookie even on error
     res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });
    // Don't expose internal error details usually
    next(new AppError("Failed to logout completely due to an internal error", 500));
  }
};


/**
 * Helper function to clear refresh token cookie
 */
const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
};

/**
 * @desc    Refresh access token
 * @route   POST /auth/refresh-token
 * @access  Public (Requires valid refresh token cookie)
 */
export const refreshToken = async (req, res, next) => {
  // Check for refresh token in cookie or request body (for mobile clients)
  const refreshTokenFromCookie = req.cookies.refreshToken;
  const refreshTokenFromBody = req.body.refreshToken;
  const refreshToken = refreshTokenFromCookie || refreshTokenFromBody;

  if (!refreshToken) {
    logger.info('Refresh token attempt with no token in cookie or body');
    return next(new UnauthorizedError("Session expired or invalid. Please login again.", "NO_REFRESH_TOKEN"));
  }

  try {
    // 1. Find the token in the database with populated user data
    // Optimize query to only fetch what we need and check validity in one query
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      revokedAt: null, // Only get non-revoked tokens
      expiresAt: { $gt: new Date() } // Only get non-expired tokens
    }).populate({
      path: 'user',
      select: 'username email phone firstName lastName role isEmailVerified isPhoneVerified isProfileCompleted profilePicture secondaryRoles'
    });

    // Handle token not found or invalid
    if (!storedToken) {
      logger.warn(`Refresh token invalid, revoked, expired, or not found in DB`, {
        tokenProvided: !!refreshToken,
        fromCookie: !!refreshTokenFromCookie,
        fromBody: !!refreshTokenFromBody
      });
      clearRefreshCookie(res);
      return next(new UnauthorizedError("Invalid or expired session. Please login again.", "INVALID_TOKEN"));
    }

    // 2. Verify the token signature using JWT library
    let decoded;
    try {
      // Use the token we found (either from cookie or body)
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      clearRefreshCookie(res);

      // Handle JWT verification errors
      if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
        const errorType = error instanceof jwt.TokenExpiredError ? 'expired' : 'invalid signature';
        logger.info(`JWT verification failed: ${errorType}`, {
          userId: storedToken.user?._id,
          tokenId: storedToken._id
        });

        // Mark token as revoked
        storedToken.revokedAt = Date.now();
        storedToken.revokedByIp = req.ip;
        await storedToken.save();

        return next(new UnauthorizedError(
          "Session expired or invalid. Please login again.",
          error instanceof jwt.TokenExpiredError ? "TOKEN_EXPIRED" : "TOKEN_INVALID_SIGNATURE"
        ));
      }

      throw error; // Re-throw unexpected errors
    }

    // 3. Validate user exists and matches token
    const user = storedToken.user;
    if (!user || decoded.id !== user._id.toString()) {
      logger.error(`User validation failed for refresh token`, {
        tokenId: storedToken._id,
        jwtId: decoded.id,
        userExists: !!user,
        userId: user?._id
      });

      // Revoke token
      storedToken.revokedAt = Date.now();
      storedToken.revokedByIp = req.ip;
      await storedToken.save();

      clearRefreshCookie(res);
      return next(new UnauthorizedError(
        !user ? "User not found. Please login again." : "Session mismatch. Please login again.",
        !user ? "USER_NOT_FOUND" : "TOKEN_USER_MISMATCH"
      ));
    }

    // 4. All validations passed, generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 5. Update the old token and create new one in a transaction
    // Mark old token as revoked and create new token
    storedToken.revokedAt = Date.now();
    storedToken.revokedByIp = req.ip;
    storedToken.replacedByToken = newRefreshToken;
    await storedToken.save();

    await new RefreshToken({
      user: user._id,
      token: newRefreshToken,
      expiresAt: refreshTokenExpiry,
      createdByIp: req.ip,
      userAgent: req.headers['user-agent'] || 'Unknown'
    }).save();

    // 6. Set the new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Determine if client is mobile or web based on user agent
    const isMobileClient = req.headers['user-agent'] &&
      (req.headers['user-agent'].includes('Mobile') ||
       req.headers['user-agent'].includes('Android') ||
       req.headers['user-agent'].includes('iOS'));

    // 7. Send response with new access token and user info
    // For mobile clients, include refresh token in response
    res.status(200).json(
      formatResponse("success", "Token refreshed successfully", {
        accessToken: newAccessToken,
        // Only include refresh token for mobile clients that can't use cookies effectively
        ...(isMobileClient && { refreshToken: newRefreshToken }),
        user: {
          id: user._id,
          username: user.username,
          email: maskEmail(user.email) || "",
          phone: maskPhone(user.phone) || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isProfileCompleted: user.isProfileCompleted,
          profilePicture: user.profilePicture?.url || null,
        },
      })
    );
  } catch (error) {
    logger.error(`Refresh token failed unexpectedly: ${error.message}`, { stack: error.stack });
    clearRefreshCookie(res);
    next(new AppError("Failed to refresh session. Please login again.", 500, "REFRESH_FAILED"));
  }
};