import express from "express";
import User from "../../../models/user/user.model.js";
import Startup from "../../../models/user/startup.model.js";
import Investor from "../../../models/user/investor.model.js";
import Agency from "../../../models/user/agency.model.js";
import Freelancer from "../../../models/user/freelancer.model.js";
import Jobseeker from "../../../models/user/jobseeker.model.js";
import { protect, restrictTo, optionalAuth } from "../../middlewares/user/auth.middleware.js";
import { AppError, NotFoundError } from "../../../utils/logging/error.js";
import logger from "../../../utils/logging/logger.js";
import { getUserInteractions } from "../../../controllers/user/userInteraction.controller.js";

const router = express.Router();

// Get role-specific details for a user
router.get("/:id/role-details", optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return next(new NotFoundError("User not found"));
    }

    // Get role-specific details
    let roleDetails = null;

    // Directly handle role-specific details based on user role
    if (user.role && user.role !== 'user' && user.role !== 'admin' && user.roleDetails) {
      const roleField = user.role; // e.g., 'freelancer', 'investor', etc.

      if (user.roleDetails[roleField] && user.roleDetails[roleField].toString()) {
        try {
          // Get the appropriate model based on role type
          let RoleModel;
          switch (roleField) {
            case 'startupOwner': RoleModel = Startup; break;
            case 'investor': RoleModel = Investor; break;
            case 'agency': RoleModel = Agency; break;
            case 'freelancer': RoleModel = Freelancer; break;
            case 'jobseeker': RoleModel = Jobseeker; break;
            default:
              logger.warn(`No model found for role ${roleField}`);
              break;
          }

          if (RoleModel) {
            // Find the role document by ID
            const roleDoc = await RoleModel.findById(user.roleDetails[roleField]);
            if (roleDoc) {
              roleDetails = roleDoc;
              logger.info(`Found role details for user ${id} with role ${roleField}`);
            } else {
              logger.warn(`Role document not found for user ${id} with role ${roleField}`);
            }
          }
        } catch (err) {
          logger.error(`Failed to fetch role details for user ${id}:`, err);
        }
      } else {
        logger.warn(`User ${id} has role ${roleField} but no role details ID`);
      }
    } else {
      logger.info(`User ${id} has no role-specific details to fetch`);
    }

    // Return the role details
    return res.status(200).json({
      status: "success",
      message: "Role details retrieved successfully",
      data: roleDetails
    });
  } catch (error) {
    logger.error(`Failed to fetch role details: ${error.message}`);
    return next(new AppError("Failed to fetch role details", 500));
  }
});

// Get user profile
router.get("/profile", protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return next(new NotFoundError("User not found"));
    }

    // Initialize address as an object if it's a string or doesn't exist
    await User.updateOne(
      { _id: userId, $or: [{ address: "" }, { address: { $exists: false } }] },
      { $set: { address: { country: "", city: "", street: "" } } }
    );

    // Refresh user data after potential address update
    const updatedUser = await User.findById(userId);
    if (!updatedUser) {
      return next(new NotFoundError("User not found after address update"));
    }

    // Return the user profile
    return res.status(200).json({
      status: "success",
      message: "User profile retrieved successfully",
      data: { user: updatedUser.getFullProfile() }
    });
  } catch (error) {
    logger.error(`Failed to fetch user profile: ${error.message}`);
    return next(new AppError("Failed to fetch user profile", 500));
  }
});

// Get user interactions (upvotes, bookmarks, etc.)
router.get("/:id/interactions", optionalAuth, getUserInteractions);

export default router;
