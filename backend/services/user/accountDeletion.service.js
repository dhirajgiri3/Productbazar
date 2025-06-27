import mongoose from "mongoose";
import User from "../../models/user/user.model.js";
import Product from "../../models/product/product.model.js";
import Project from "../../models/project/project.model.js";
import Notification from "../../models/notification/notification.model.js";
import RefreshToken from "../../models/core/refreshToken.model.js";
import Upvote from "../../models/product/upvote.model.js";
import Bookmark from "../../models/product/bookmark.model.js";
import Comment from "../../models/product/comment.model.js";
import View from "../../models/view/view.model.js";
import Analytic from "../../models/analytics/analytic.model.js";
import Job from "../../models/job/job.model.js";
import Agency from "../../models/user/agency.model.js";
import Freelancer from "../../models/user/freelancer.model.js";
import Investor from "../../models/user/investor.model.js";
import Jobseeker from "../../models/user/jobseeker.model.js";
import Startup from "../../models/user/startup.model.js";
import logger from "../../utils/logging/logger.js";

/**
 * Service to handle complete account deletion
 * This includes user data, associated content, and role-specific data
 */
class AccountDeletionService {
  /**
   * Delete user account and all associated data
   * @param {string} userId - User ID to delete
   * @returns {Promise<Object>} - Deletion summary
   */
  static async deleteUserAccount(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const deletionSummary = {
        userId,
        deletedAt: new Date(),
        deletedData: {
          user: false,
          products: 0,
          projects: 0,
          comments: 0,
          upvotes: 0,
          bookmarks: 0,
          views: 0,
          notifications: 0,
          refreshTokens: 0,
          analytics: 0,
          jobs: 0,
          roleSpecificData: 0
        }
      };

      // Get user info before deletion
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error("User not found");
      }

      logger.info(`Starting account deletion for user ${userId}`, {
        email: user.email,
        role: user.role,
        username: user.username
      });

      // Delete user's products
      const deletedProducts = await Product.deleteMany({ maker: userId }).session(session);
      deletionSummary.deletedData.products = deletedProducts.deletedCount;

      // Delete user's projects
      const deletedProjects = await Project.deleteMany({ owner: userId }).session(session);
      deletionSummary.deletedData.projects = deletedProjects.deletedCount;

      // Delete user's comments
      const deletedComments = await Comment.deleteMany({ user: userId }).session(session);
      deletionSummary.deletedData.comments = deletedComments.deletedCount;

      // Delete user's upvotes
      const deletedUpvotes = await Upvote.deleteMany({ user: userId }).session(session);
      deletionSummary.deletedData.upvotes = deletedUpvotes.deletedCount;

      // Delete user's bookmarks
      const deletedBookmarks = await Bookmark.deleteMany({ user: userId }).session(session);
      deletionSummary.deletedData.bookmarks = deletedBookmarks.deletedCount;

      // Delete user's views
      const deletedViews = await View.deleteMany({ user: userId }).session(session);
      deletionSummary.deletedData.views = deletedViews.deletedCount;

      // Delete user's notifications
      const deletedNotifications = await Notification.deleteMany({ user: userId }).session(session);
      deletionSummary.deletedData.notifications = deletedNotifications.deletedCount;

      // Delete user's refresh tokens
      const deletedTokens = await RefreshToken.deleteMany({ user: userId }).session(session);
      deletionSummary.deletedData.refreshTokens = deletedTokens.deletedCount;

      // Delete user's analytics
      const deletedAnalytics = await Analytic.deleteMany({ user: userId }).session(session);
      deletionSummary.deletedData.analytics = deletedAnalytics.deletedCount;

      // Delete user's jobs
      const deletedJobs = await Job.deleteMany({ owner: userId }).session(session);
      deletionSummary.deletedData.jobs = deletedJobs.deletedCount;

      // Delete role-specific data
      let roleDeletedCount = 0;
      if (user.roleDetails) {
        // Delete agency data
        if (user.roleDetails.agency) {
          const agencyDeleted = await Agency.deleteOne({ _id: user.roleDetails.agency }).session(session);
          roleDeletedCount += agencyDeleted.deletedCount;
        }

        // Delete freelancer data
        if (user.roleDetails.freelancer) {
          const freelancerDeleted = await Freelancer.deleteOne({ _id: user.roleDetails.freelancer }).session(session);
          roleDeletedCount += freelancerDeleted.deletedCount;
        }

        // Delete investor data
        if (user.roleDetails.investor) {
          const investorDeleted = await Investor.deleteOne({ _id: user.roleDetails.investor }).session(session);
          roleDeletedCount += investorDeleted.deletedCount;
        }

        // Delete jobseeker data
        if (user.roleDetails.jobseeker) {
          const jobseekerDeleted = await Jobseeker.deleteOne({ _id: user.roleDetails.jobseeker }).session(session);
          roleDeletedCount += jobseekerDeleted.deletedCount;
        }

        // Delete startup data
        if (user.roleDetails.startupOwner) {
          const startupDeleted = await Startup.deleteOne({ _id: user.roleDetails.startupOwner }).session(session);
          roleDeletedCount += startupDeleted.deletedCount;
        }
      }
      deletionSummary.deletedData.roleSpecificData = roleDeletedCount;

      // Finally, delete the user
      const deletedUser = await User.deleteOne({ _id: userId }).session(session);
      deletionSummary.deletedData.user = deletedUser.deletedCount > 0;

      await session.commitTransaction();

      logger.info(`Account deletion completed successfully for user ${userId}`, deletionSummary);

      return deletionSummary;

    } catch (error) {
      await session.abortTransaction();
      logger.error(`Account deletion failed for user ${userId}: ${error.message}`, {
        stack: error.stack
      });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Check if user can be deleted (optional validation)
   * @param {string} userId - User ID to check
   * @returns {Promise<Object>} - Validation result
   */
  static async validateDeletion(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { canDelete: false, reason: "User not found" };
      }

      // Add any business logic validation here
      // For example, check if user has pending transactions, etc.
      
      return { canDelete: true };
    } catch (error) {
      logger.error(`Deletion validation failed for user ${userId}: ${error.message}`);
      return { canDelete: false, reason: "Validation error" };
    }
  }
}

export default AccountDeletionService;
