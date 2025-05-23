import express from "express";
import User from "../../../models/user/user.model.js";
import Startup from "../../../models/user/startup.model.js";
import Investor from "../../../models/user/investor.model.js";
import Agency from "../../../models/user/agency.model.js";
import Freelancer from "../../../models/user/freelancer.model.js";
import Jobseeker from "../../../models/user/jobseeker.model.js";
import { protect, isAdmin as authIsAdmin } from "../../middlewares/user/auth.middleware.js";
import { isAdmin } from "../../middlewares/user/admin.middleware.js";
import { AppError, NotFoundError } from "../../../utils/logging/error.js";
import logger from "../../../utils/logging/logger.js";
import mongoose from "mongoose";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filtering
 * @access  Admin only
 */
router.get("/users", async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {};

    // Add search filter if provided
    if (search) {
      // Split search terms for more advanced searching
      const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);

      if (searchTerms.length > 0) {
        // Create OR conditions for each search term
        const searchConditions = searchTerms.map(term => ({
          $or: [
            { firstName: { $regex: term, $options: "i" } },
            { lastName: { $regex: term, $options: "i" } },
            { email: { $regex: term, $options: "i" } },
            { phone: { $regex: term, $options: "i" } },
            // Search in address fields
            { "address.city": { $regex: term, $options: "i" } },
            { "address.country": { $regex: term, $options: "i" } },
            // Search in company fields
            { companyName: { $regex: term, $options: "i" } },
            { industry: { $regex: term, $options: "i" } },
            // Search in bio and about
            { bio: { $regex: term, $options: "i" } },
            { about: { $regex: term, $options: "i" } }
          ]
        }));

        // Combine all search conditions with AND (user must match all terms)
        query.$and = searchConditions;
      }
    }

    // Add role filter if provided
    if (role) {
      query.role = role;
    }

    // Execute query with pagination
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        users,
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        currentPage: parseInt(page),
        totalUsers
      }
    });
  } catch (error) {
    logger.error(`Admin user list error: ${error.message}`);
    next(new AppError("Failed to fetch users", 500));
  }
});

/**
 * @route   GET /api/admin/users/all
 * @desc    Get all users without pagination for client-side filtering
 * @access  Admin only
 */
router.get("/users/all", async (req, res, next) => {
  try {
    // Fetch all users with essential fields for filtering and display
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: {
        users,
        totalUsers: users.length
      }
    });
  } catch (error) {
    logger.error(`Admin fetch all users error: ${error.message}`);
    next(new AppError("Failed to fetch users", 500));
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID with all details
 * @access  Admin only
 */
router.get("/users/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find user with populated role details
    const user = await User.findById(id)
      .select("-password")
      .populate("roleDetails.startupOwner")
      .populate("roleDetails.investor")
      .populate("roleDetails.agency")
      .populate("roleDetails.freelancer")
      .populate("roleDetails.jobseeker");

    if (!user) {
      return next(new NotFoundError("User not found"));
    }

    res.status(200).json({
      status: "success",
      data: { user }
    });
  } catch (error) {
    logger.error(`Admin get user error: ${error.message}`);
    next(new AppError("Failed to fetch user details", 500));
  }
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user's primary role
 * @access  Admin only
 */
router.put("/users/:id/role", async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { role, roleDetails } = req.body;

    if (!role) {
      return next(new AppError("Role is required", 400));
    }

    // Validate role
    const validRoles = [
      "user",
      "startupOwner",
      "investor",
      "agency",
      "freelancer",
      "jobseeker",
      "admin",
      "maker"
    ];

    if (!validRoles.includes(role)) {
      return next(new AppError("Invalid role specified", 400));
    }

    // First, update the address field if it's a string
    await User.updateOne(
      { _id: id, $or: [{ address: "" }, { address: { $exists: false } }] },
      { $set: { address: { country: "", city: "", street: "" } } }
    ).session(session);

    // Now find the user with the updated address
    const user = await User.findById(id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return next(new NotFoundError("User not found"));
    }

    // Update user's role
    const previousRole = user.role;
    user.role = role;

    // Handle role-specific document creation if needed
    if (role !== "user" && role !== "admin" && role !== previousRole && roleDetails) {
      let RoleModel;
      let roleDocData = { user: user._id };

      switch (role) {
        case "startupOwner":
          RoleModel = Startup;
          roleDocData = {
            ...roleDocData,
            companyName: roleDetails.companyName || "My Startup",
            industry: roleDetails.industry || "Technology",
            fundingStage: roleDetails.fundingStage || "Pre-seed",
          };
          break;
        case "investor":
          RoleModel = Investor;
          roleDocData = {
            ...roleDocData,
            investorType: roleDetails.investorType || "Angel Investor",
          };
          break;
        case "agency":
          RoleModel = Agency;
          roleDocData = {
            ...roleDocData,
            companyName: roleDetails.companyName || "My Agency",
          };
          break;
        case "freelancer":
          RoleModel = Freelancer;
          roleDocData = {
            ...roleDocData,
            skills: roleDetails.skills || ["Technology"],
          };
          break;
        case "jobseeker":
          RoleModel = Jobseeker;
          roleDocData = {
            ...roleDocData,
            jobTitle: roleDetails.jobTitle || "Professional",
          };
          break;
        default:
          break;
      }

      if (RoleModel && !user.roleDetails[role]) {
        const roleInstance = await RoleModel.create([roleDocData], { session });
        if (roleInstance && roleInstance[0]._id) {
          user.roleDetails[role] = roleInstance[0]._id;
        }
      }
    }

    // Update role capabilities based on new role
    await user.updateRoleCapabilities();

    // Save user
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Return updated user
    res.status(200).json({
      status: "success",
      message: "User role updated successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          secondaryRoles: user.secondaryRoles,
          roleCapabilities: user.roleCapabilities
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    logger.error(`Admin update user role error: ${error.message}`);
    next(new AppError("Failed to update user role", 500));
  }
});

/**
 * @route   PUT /api/admin/users/:id/secondary-roles
 * @desc    Update user's secondary roles
 * @access  Admin only
 */
router.put("/users/:id/secondary-roles", async (req, res, next) => {
  try {
    // Check if user is authenticated and has admin role
    if (!req.user) {
      logger.warn("Admin access denied for secondary roles update: User=undefined", {
        Headers: JSON.stringify(req.headers),
        requestMethod: req.method,
        __METHOD__: req.method,
        __URL__: req.protocol + '://' + req.get('host') + req.originalUrl
      });
      return next(new AppError("Authentication required", 401));
    }

    if (req.user.role !== "admin" && !(req.user.secondaryRoles && req.user.secondaryRoles.includes("admin"))) {
      logger.warn(`Admin access denied for secondary roles update: User=${req.user._id}`, {
        Headers: JSON.stringify(req.headers),
        userRole: req.user.role,
        userSecondaryRoles: req.user.secondaryRoles || []
      });
      return next(new AppError("Admin access required", 403));
    }

    const { id } = req.params;
    const { secondaryRoles } = req.body;

    if (!Array.isArray(secondaryRoles)) {
      return next(new AppError("Secondary roles must be an array", 400));
    }

    // Validate roles
    const validRoles = [
      "startupOwner",
      "investor",
      "agency",
      "freelancer",
      "jobseeker",
      "maker"
    ];

    const invalidRoles = secondaryRoles.filter(role => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      return next(new AppError(`Invalid roles specified: ${invalidRoles.join(", ")}`, 400));
    }

    // First, update the address field if it's a string
    await User.updateOne(
      { _id: id, $or: [{ address: "" }, { address: { $exists: false } }] },
      { $set: { address: { country: "", city: "", street: "" } } }
    );

    // Now find the user with the updated address
    const user = await User.findById(id);
    if (!user) {
      return next(new NotFoundError("User not found"));
    }

    // Update secondary roles
    user.secondaryRoles = secondaryRoles;

    // Update role capabilities based on new roles
    await user.updateRoleCapabilities();

    // Save user
    await user.save();

    // Return updated user
    res.status(200).json({
      status: "success",
      message: "User secondary roles updated successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          secondaryRoles: user.secondaryRoles,
          roleCapabilities: user.roleCapabilities
        }
      }
    });
  } catch (error) {
    logger.error(`Admin update secondary roles error: ${error.message}`);
    next(new AppError("Failed to update secondary roles", 500));
  }
});

/**
 * @route   GET /api/admin/users/suggestions
 * @desc    Get user suggestions for autocomplete
 * @access  Admin only
 */
router.get("/users/suggestions", async (req, res, next) => {
  try {
    const { query = "", role, limit = 5 } = req.query;

    // Return empty array for very short queries
    if (query.length < 2) {
      return res.status(200).json({
        status: "success",
        data: { suggestions: [] }
      });
    }

    // Build search query
    const searchQuery = {};

    // Add search filter
    const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);

    if (searchTerms.length > 0) {
      // Create OR conditions for each search term
      const searchConditions = searchTerms.map(term => ({
        $or: [
          { firstName: { $regex: term, $options: "i" } },
          { lastName: { $regex: term, $options: "i" } },
          { email: { $regex: term, $options: "i" } },
          { phone: { $regex: term, $options: "i" } },
          // Include other searchable fields
          { "address.city": { $regex: term, $options: "i" } },
          { companyName: { $regex: term, $options: "i" } }
        ]
      }));

      // Combine all search conditions with AND
      searchQuery.$and = searchConditions;
    }

    // Add role filter if provided
    if (role && role !== '') {
      searchQuery.role = role;
    }

    // Execute query with limit
    const users = await User.find(searchQuery)
      .select("_id firstName lastName email phone profilePicture role")
      .sort({ firstName: 1, lastName: 1 })
      .limit(parseInt(limit));

    // Format suggestions
    const suggestions = users.map(user => ({
      _id: user._id,
      name: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email || user.phone || 'Unnamed User',
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture?.url || null,
      role: user.role
    }));

    res.status(200).json({
      status: "success",
      data: { suggestions }
    });
  } catch (error) {
    logger.error(`Admin user suggestions error: ${error.message}`);
    next(new AppError("Failed to fetch user suggestions", 500));
  }
});

export default router;
