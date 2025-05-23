import mongoose from "mongoose";
import Startup from "../../models/user/startup.model.js";
import Investor from "../../models/user/investor.model.js";
import Agency from "../../models/user/agency.model.js";
import Freelancer from "../../models/user/freelancer.model.js";
import Jobseeker from "../../models/user/jobseeker.model.js";
import logger from "../logging/logger.js";

/**
 * Process role-specific details for a user
 * @param {Object} user - The user document
 * @param {Object} roleDetailsUpdates - The role details to process
 * @param {Object} session - Mongoose session for transaction
 * @param {String} specificRole - Optional specific role to process (if different from user.role)
 * @returns {Promise<Object>} - The created or updated role document
 */
export const processRoleDetails = async (user, roleDetailsUpdates, session = null, specificRole = null) => {
  const roleToProcess = specificRole || user.role;

  if (!roleDetailsUpdates || !roleToProcess) return null;

  logger.info(`Processing role details for user ${user._id}`, {
    role: roleToProcess,
    roleDetailsKeys: Object.keys(roleDetailsUpdates),
    usingTransaction: !!session
  });

  // Map role to its corresponding model
  const roleModelMap = {
    startupOwner: Startup,
    investor: Investor,
    agency: Agency,
    freelancer: Freelancer,
    jobseeker: Jobseeker,
  };

  const RoleModel = roleModelMap[roleToProcess];
  if (!RoleModel) {
    logger.warn(`No role model found for role: ${roleToProcess}`);
    return null; // Skip if the role doesn't have a corresponding model
  }

  try {
    // Check if a role document already exists for this user
    let roleDoc;
    if (
      user.roleDetails &&
      user.roleDetails[roleToProcess] &&
      mongoose.Types.ObjectId.isValid(user.roleDetails[roleToProcess])
    ) {
      // Update existing role document with session if provided
      const updateOptions = { new: true }; // Return the updated document
      if (session) updateOptions.session = session;

      roleDoc = await RoleModel.findByIdAndUpdate(
        user.roleDetails[roleToProcess],
        { ...roleDetailsUpdates, user: user._id },
        updateOptions
      );

      // Handle edge case where findByIdAndUpdate returns null even if ID exists
      if (!roleDoc) {
        logger.warn(`Role document not found for ID ${user.roleDetails[roleToProcess]}, creating new one`);
        const createOptions = session ? { session } : {};
        roleDoc = await RoleModel.create(
          [{ ...roleDetailsUpdates, user: user._id }],
          createOptions
        );
        roleDoc = roleDoc[0]; // Extract the document from the array returned by create
      }

      logger.info(`Updated existing ${roleToProcess} document for user ${user._id}`);
    } else {
      // Create new role document with session if provided
      const createOptions = session ? { session } : {};
      roleDoc = await RoleModel.create(
        [{ ...roleDetailsUpdates, user: user._id }],
        createOptions
      );
      roleDoc = roleDoc[0]; // Extract the document from the array returned by create

      // Initialize roleDetails if it doesn't exist
      if (!user.roleDetails) {
        user.roleDetails = {};
      }

      // Set the ObjectId reference in user.roleDetails
      user.roleDetails[roleToProcess] = roleDoc._id;
      logger.info(`Created new ${roleToProcess} document for user ${user._id}`);
    }

    return roleDoc;
  } catch (error) {
    logger.error(`Error processing ${roleToProcess} details:`, error);
    throw new Error(`Failed to process ${roleToProcess} details: ${error.message}`);
  }
};

/**
 * Populate role details for a user
 * @param {String} userId - The user ID
 * @param {String} specificRole - Optional specific role to populate (if not provided, will populate primary role)
 * @returns {Promise<Object>} - The user with populated role details
 */
export const populateRoleDetails = async (userId, specificRole = null) => {
  if (!userId) return null;

  try {
    // First fetch the user to get their role
    const user = await mongoose.model('User').findById(userId);
    if (!user) {
      logger.warn(`User not found with ID ${userId}`);
      return null;
    }

    // Determine which role to populate
    const roleToPopulate = specificRole || user.role;

    if (!roleToPopulate || roleToPopulate === 'user' || roleToPopulate === 'admin') {
      logger.info(`No role-specific details to populate for user ${userId} with role ${roleToPopulate}`);
      return user;
    }

    // Check if the user has details for this role
    if (!user.roleDetails || !user.roleDetails[roleToPopulate]) {
      logger.info(`User ${userId} has no details for role ${roleToPopulate}`);
      return user;
    }

    // Determine the correct model for the role
    const roleModel =
      roleToPopulate === 'startupOwner' ? Startup :
      roleToPopulate === 'investor' ? Investor :
      roleToPopulate === 'agency' ? Agency :
      roleToPopulate === 'freelancer' ? Freelancer :
      roleToPopulate === 'jobseeker' ? Jobseeker : null;

    if (!roleModel) {
      logger.warn(`No model found for role ${roleToPopulate}`);
      return user;
    }

    // Populate the role details
    const populatedUser = await mongoose.model('User').findById(userId).populate({
      path: `roleDetails.${roleToPopulate}`,
      model: roleModel
    });

    return populatedUser;
  } catch (error) {
    logger.error(`Error populating role details:`, error);
    return null;
  }
};

/**
 * Populate all role details for a user (primary and secondary roles)
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} - The user with all role details populated
 */
export const populateAllRoleDetails = async (userId) => {
  if (!userId) return null;

  try {
    // First fetch the user to get their roles
    const user = await mongoose.model('User').findById(userId);
    if (!user) {
      logger.warn(`User not found with ID ${userId}`);
      return null;
    }

    // Get all roles (primary and secondary)
    const allRoles = [user.role, ...(user.secondaryRoles || [])];
    const uniqueRoles = [...new Set(allRoles)].filter(role =>
      role && role !== 'user' && role !== 'admin'
    );

    if (uniqueRoles.length === 0) {
      logger.info(`User ${userId} has no roles with specific details`);
      return user;
    }

    // Create an array of population paths for all roles that have details
    const populatePaths = uniqueRoles
      .filter(role => user.roleDetails && user.roleDetails[role])
      .map(role => ({
        path: `roleDetails.${role}`,
        model: role === 'startupOwner' ? Startup :
               role === 'investor' ? Investor :
               role === 'agency' ? Agency :
               role === 'freelancer' ? Freelancer :
               role === 'jobseeker' ? Jobseeker : null
      }))
      .filter(path => path.model !== null); // Filter out any roles without models

    if (populatePaths.length === 0) {
      logger.info(`User ${userId} has no valid role details to populate`);
      return user;
    }

    // Populate all role details
    const populatedUser = await mongoose.model('User')
      .findById(userId)
      .populate(populatePaths);

    return populatedUser;
  } catch (error) {
    logger.error(`Error populating all role details:`, error);
    return null;
  }
};
