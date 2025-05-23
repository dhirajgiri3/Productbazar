import Project from "../../models/project/project.model.js";
import User from "../../models/user/user.model.js";
import { AppError } from "../../utils/logging/error.js";
import logger from "../../utils/logging/logger.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/storage/cloudinary.utils.js";

// Create a new project
export const createProject = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check if user has permission to showcase projects
    const user = await User.findById(userId);
    if (!user.roleCapabilities?.canShowcaseProjects) {
      return next(new AppError("You don't have permission to showcase projects", 403));
    }

    // Determine owner type based on user role
    let ownerType;
    if (user.role === "jobseeker") {
      ownerType = "jobseeker";
    } else if (user.role === "freelancer") {
      ownerType = "freelancer";
    } else if (user.role === "agency") {
      ownerType = "agency";
    } else if (user.role === "startupOwner" || user.role === "maker") {
      ownerType = "startupOwner";
    } else {
      // Check secondary roles if primary role doesn't match
      if (user.secondaryRoles?.includes("jobseeker")) {
        ownerType = "jobseeker";
      } else if (user.secondaryRoles?.includes("freelancer")) {
        ownerType = "freelancer";
      } else if (user.secondaryRoles?.includes("agency")) {
        ownerType = "agency";
      } else if (user.secondaryRoles?.includes("startupOwner") || user.secondaryRoles?.includes("maker")) {
        ownerType = "startupOwner";
      } else {
        return next(new AppError("Your account type doesn't support project showcasing", 403));
      }
    }

    // Parse project data if it's in FormData format
    let formData;

    if (req.body.data) {
      try {
        // Parse the JSON data if it's a string
        formData = typeof req.body.data === 'string'
          ? JSON.parse(req.body.data)
          : req.body.data;

        logger.info(`Parsed project data from FormData for user ${userId}`);
      } catch (parseError) {
        logger.error(`Error parsing project data: ${parseError.message}`);
        return next(new AppError(`Invalid project data format: ${parseError.message}`, 400));
      }
    } else {
      // Direct JSON submission
      formData = req.body;
    }

    // Create project with user as owner
    const projectData = {
      ...formData,
      owner: userId,
      ownerType
    };

    // Handle thumbnail upload if provided
    if (req.files?.thumbnail && req.files.thumbnail[0]) {
      try {
        logger.info(`Processing thumbnail upload for project creation by user ${userId}`);
        const result = await uploadToCloudinary(req.files.thumbnail[0], "project-thumbnails");
        if (result) {
          projectData.thumbnail = result.url;
          logger.info(`Successfully uploaded thumbnail to Cloudinary: ${result.url}`);
        }
      } catch (uploadError) {
        logger.error(`Error uploading thumbnail: ${uploadError.message}`);
        // Continue without the thumbnail if upload fails
      }
    }

    // Handle gallery uploads if provided
    if (req.files?.gallery && req.files.gallery.length > 0) {
      try {
        logger.info(`Processing gallery uploads for project creation by user ${userId}`);

        const galleryPromises = req.files.gallery.map(file =>
          uploadToCloudinary(file, "project-gallery")
        );

        const galleryResults = await Promise.all(galleryPromises);

        const galleryItems = galleryResults
          .filter(result => result) // Filter out failed uploads
          .map(result => ({
            url: result.url,
            publicId: result.publicId,
            caption: ""
          }));

        if (galleryItems.length > 0) {
          projectData.gallery = galleryItems;
          logger.info(`Successfully uploaded ${galleryItems.length} gallery images to Cloudinary`);
        }
      } catch (uploadError) {
        logger.error(`Error uploading gallery images: ${uploadError.message}`);
        // Continue without the gallery if upload fails
      }
    }

    // Handle client logo upload if provided
    if (req.files?.clientLogo && req.files.clientLogo[0]) {
      try {
        logger.info(`Processing client logo upload for project creation by user ${userId}`);
        const result = await uploadToCloudinary(req.files.clientLogo[0], "client-logos");
        if (result) {
          // Make sure client object exists
          if (!projectData.client) {
            projectData.client = {};
          }
          projectData.client.logo = result.url;
          logger.info(`Successfully uploaded client logo to Cloudinary: ${result.url}`);
        }
      } catch (uploadError) {
        logger.error(`Error uploading client logo: ${uploadError.message}`);
        // Continue without the client logo if upload fails
      }
    }

    const project = await Project.create(projectData);

    res.status(201).json({
      status: "success",
      data: {
        project,
      },
    });
  } catch (error) {
    logger.error(`Error creating project: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get all projects with filtering, sorting, and pagination
export const getAllProjects = async (req, res, next) => {
  try {
    // Build query
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // Only show public projects by default
    let filterObj = JSON.parse(queryStr);
    if (!filterObj.visibility) {
      filterObj.visibility = "public";
    }

    // Text search
    if (req.query.search) {
      filterObj.$text = { $search: req.query.search };
    }

    let query = Project.find(filterObj);

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    // Execute query
    const projects = await query.populate({
      path: "owner",
      select: "firstName lastName profilePicture",
    });

    const total = await Project.countDocuments(filterObj);

    res.status(200).json({
      status: "success",
      results: projects.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: {
        projects,
      },
    });
  } catch (error) {
    logger.error(`Error getting projects: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get a single project by ID or slug
export const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info(`Fetching project with ID or slug: ${id}`);

    // Check if id is a valid ObjectId or a slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    let project;
    if (isObjectId) {
      logger.info(`Looking up project by ID: ${id}`);
      project = await Project.findById(id).populate("ownerData");
    } else {
      logger.info(`Looking up project by slug: ${id}`);
      project = await Project.findOne({ slug: id }).populate("ownerData");

      // If not found by exact slug, try case-insensitive search
      if (!project) {
        logger.info(`Project not found by exact slug, trying case-insensitive search`);
        project = await Project.findOne({
          slug: { $regex: new RegExp('^' + id + '$', 'i') }
        }).populate("ownerData");
      }
    }

    if (!project) {
      logger.warn(`Project not found with ID or slug: ${id}`);
      return next(new AppError("Project not found", 404));
    }

    logger.info(`Found project: ${project.title} (${project._id})`);


    // Check visibility
    if (project.visibility !== "public") {
      // If not public, check if the requester is the owner
      const userId = req.user?._id;
      if (!userId || !project.owner.equals(userId)) {
        return next(new AppError("You don't have permission to view this project", 403));
      }
    }

    // Increment view count
    project.views += 1;
    await project.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      data: {
        project,
      },
    });
  } catch (error) {
    logger.error(`Error getting project: ${error.message}`, {
      id: req.params.id,
      error: error.stack
    });
    next(new AppError(error.message, 400));
  }
};

// Update a project
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    // Check if user is the owner or an admin
    if (!project.owner.equals(userId) && req.user.role !== "admin") {
      return next(new AppError("You don't have permission to update this project", 403));
    }

    // Parse project data if it's in FormData format
    let updateData;

    if (req.body.data) {
      try {
        // Parse the JSON data if it's a string
        updateData = typeof req.body.data === 'string'
          ? JSON.parse(req.body.data)
          : req.body.data;

        logger.info(`Parsed project update data from FormData for project ${id}`);
      } catch (parseError) {
        logger.error(`Error parsing project update data: ${parseError.message}`);
        return next(new AppError(`Invalid project data format: ${parseError.message}`, 400));
      }
    } else {
      // Direct JSON submission
      updateData = { ...req.body };
    }

    // Handle thumbnail upload if provided
    if (req.files?.thumbnail && req.files.thumbnail[0]) {
      try {
        logger.info(`Processing thumbnail upload for project update by user ${userId}`);

        // Delete old thumbnail if exists
        if (project.thumbnail) {
          const deleteResult = await deleteFromCloudinary(project.thumbnail);
          if (deleteResult) {
            logger.info(`Successfully deleted old thumbnail: ${project.thumbnail}`);
          } else {
            logger.warn(`Failed to delete old thumbnail: ${project.thumbnail}`);
            // Continue with the update even if deletion fails
          }
        }

        const result = await uploadToCloudinary(req.files.thumbnail[0], "project-thumbnails");
        if (result) {
          updateData.thumbnail = result.url;
          logger.info(`Successfully uploaded new thumbnail to Cloudinary: ${result.url}`);
        }
      } catch (uploadError) {
        logger.error(`Error uploading thumbnail: ${uploadError.message}`);
        // Continue without updating the thumbnail if upload fails
      }
    }

    // Handle gallery uploads if provided
    if (req.files?.gallery && req.files.gallery.length > 0) {
      try {
        logger.info(`Processing gallery uploads for project update by user ${userId}`);

        const galleryPromises = req.files.gallery.map(file =>
          uploadToCloudinary(file, "project-gallery")
        );

        const galleryResults = await Promise.all(galleryPromises);

        const newGalleryItems = galleryResults
          .filter(result => result) // Filter out failed uploads
          .map(result => ({
            url: result.url,
            publicId: result.publicId,
            caption: ""
          }));

        if (newGalleryItems.length > 0) {
          // Combine with existing gallery items
          updateData.gallery = [...(project.gallery || []), ...newGalleryItems];
          logger.info(`Successfully uploaded ${newGalleryItems.length} gallery images to Cloudinary`);
        }
      } catch (uploadError) {
        logger.error(`Error uploading gallery images: ${uploadError.message}`);
        // Continue without updating the gallery if upload fails
      }
    }

    // Handle client logo upload if provided
    if (req.files?.clientLogo && req.files.clientLogo[0]) {
      try {
        logger.info(`Processing client logo upload for project update by user ${userId}`);

        // Delete old logo if exists
        if (project.client?.logo) {
          const deleteResult = await deleteFromCloudinary(project.client.logo);
          if (deleteResult) {
            logger.info(`Successfully deleted old client logo: ${project.client.logo}`);
          } else {
            logger.warn(`Failed to delete old client logo: ${project.client.logo}`);
            // Continue with the update even if deletion fails
          }
        }

        const result = await uploadToCloudinary(req.files.clientLogo[0], "client-logos");
        if (result) {
          // Make sure client object exists
          if (!updateData.client) {
            updateData.client = project.client ? { ...project.client } : {};
          }
          updateData.client.logo = result.url;
          logger.info(`Successfully uploaded new client logo to Cloudinary: ${result.url}`);
        }
      } catch (uploadError) {
        logger.error(`Error uploading client logo: ${uploadError.message}`);
        // Continue without updating the client logo if upload fails
      }
    }

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        project: updatedProject,
      },
    });
  } catch (error) {
    logger.error(`Error updating project: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Delete a project
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    // Check if user is the owner or an admin
    if (!project.owner.equals(userId) && req.user.role !== "admin") {
      return next(new AppError("You don't have permission to delete this project", 403));
    }

    // Delete thumbnail if exists
    if (project.thumbnail) {
      const deleteResult = await deleteFromCloudinary(project.thumbnail);
      if (deleteResult) {
        logger.info(`Successfully deleted project thumbnail: ${project.thumbnail}`);
      } else {
        logger.warn(`Failed to delete project thumbnail: ${project.thumbnail}`);
      }
    }

    // Delete gallery images if exist
    if (project.gallery && project.gallery.length > 0) {
      logger.info(`Attempting to delete ${project.gallery.length} gallery images`);

      let successCount = 0;
      let failCount = 0;

      // Process sequentially to avoid overwhelming Cloudinary API
      for (const item of project.gallery) {
        if (item.url) {
          const deleteResult = await deleteFromCloudinary(item.url);
          if (deleteResult) {
            successCount++;
          } else {
            failCount++;
          }
        }
      }

      logger.info(`Gallery deletion results: ${successCount} successful, ${failCount} failed`);
    }

    // Delete client logo if exists
    if (project.client?.logo) {
      const deleteResult = await deleteFromCloudinary(project.client.logo);
      if (deleteResult) {
        logger.info(`Successfully deleted client logo: ${project.client.logo}`);
      } else {
        logger.warn(`Failed to delete client logo: ${project.client.logo}`);
      }
    }

    // Delete project
    await Project.findByIdAndDelete(id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    logger.error(`Error deleting project: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Like a project
export const likeProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    // Use the model's addLike method to properly track likes
    const likes = await project.addLike(userId);

    res.status(200).json({
      status: "success",
      data: {
        likes,
      },
    });
  } catch (error) {
    logger.error(`Error liking project: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Unlike a project
export const unlikeProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    // Use the model's removeLike method to properly track unlikes
    const likes = await project.removeLike(userId);

    res.status(200).json({
      status: "success",
      data: {
        likes,
      },
    });
  } catch (error) {
    logger.error(`Error unliking project: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get user's projects
export const getUserProjects = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Get projects
    const projects = await Project.find({ owner: userId }).sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: projects.length,
      data: {
        projects,
      },
    });
  } catch (error) {
    logger.error(`Error getting user projects: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Add a comment to a project
export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { content, parentCommentId } = req.body;

    if (!content || content.trim() === '') {
      return next(new AppError('Comment content is required', 400));
    }

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Add the comment
    if (!project.comments) {
      project.comments = [];
    }

    const comment = {
      user: userId,
      content,
      createdAt: new Date(),
      likes: 0
    };

    if (parentCommentId) {
      comment.parentComment = parentCommentId;
    }

    project.comments.push(comment);
    await project.save({ validateBeforeSave: false });

    if (!comment) {
      return next(new AppError('Failed to add comment', 500));
    }

    // Populate the user data for the comment
    await project.populate({
      path: 'comments.user',
      select: 'firstName lastName profilePicture username',
      match: { _id: userId }
    });

    // Find the newly added comment with populated user data
    const populatedComment = project.comments.find(
      c => c._id.toString() === comment._id.toString()
    );

    res.status(201).json({
      status: 'success',
      data: {
        comment: populatedComment
      }
    });
  } catch (error) {
    logger.error(`Error adding comment to project: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get all comments for a project
export const getComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    // Find the project
    const project = await Project.findById(id)
      .select('comments')
      .populate({
        path: 'comments.user',
        select: 'firstName lastName profilePicture username'
      });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Sort comments by date (newest first)
    const sortedComments = project.comments.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedComments = sortedComments.slice(startIndex, endIndex);

    res.status(200).json({
      status: 'success',
      results: paginatedComments.length,
      total: sortedComments.length,
      totalPages: Math.ceil(sortedComments.length / limit),
      currentPage: page,
      data: {
        comments: paginatedComments
      }
    });
  } catch (error) {
    logger.error(`Error getting project comments: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Update a comment
export const updateComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return next(new AppError('Comment content is required', 400));
    }

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Find the comment
    const comment = project.comments.id(commentId);
    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    // Check if the user is the comment author
    if (comment.user.toString() !== userId.toString()) {
      return next(new AppError('You can only update your own comments', 403));
    }

    // Update the comment
    comment.content = content;
    comment.updatedAt = new Date();
    await project.save({ validateBeforeSave: false });

    // Populate user data
    await project.populate({
      path: 'comments.user',
      select: 'firstName lastName profilePicture username',
      match: { _id: comment.user }
    });

    // Get the updated comment with populated data
    const updatedComment = project.comments.id(commentId);

    res.status(200).json({
      status: 'success',
      data: {
        comment: updatedComment
      }
    });
  } catch (error) {
    logger.error(`Error updating project comment: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Delete a comment
export const deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Find the comment
    const comment = project.comments.id(commentId);
    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    // Check if the user is the comment author or project owner
    const isCommentAuthor = comment.user.toString() === userId.toString();
    const isProjectOwner = project.owner.toString() === userId.toString();

    if (!isCommentAuthor && !isProjectOwner) {
      return next(new AppError('You can only delete your own comments or comments on your projects', 403));
    }

    // Remove the comment
    comment.remove();
    await project.save({ validateBeforeSave: false });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error(`Error deleting project comment: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Like a comment
export const likeComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Find the comment
    const comment = project.comments.id(commentId);
    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    // Increment like count
    comment.likes = (comment.likes || 0) + 1;
    await project.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: {
        likes: comment.likes
      }
    });
  } catch (error) {
    logger.error(`Error liking project comment: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Add a collaborator to a project
export const addCollaborator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role, permissions } = req.body;
    const currentUserId = req.user._id;

    if (!userId) {
      return next(new AppError('User ID or email is required', 400));
    }

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if the current user is the owner or has permission to invite
    if (!project.canUserEdit(currentUserId)) {
      return next(new AppError('You do not have permission to add collaborators to this project', 403));
    }

    // Get the current user for email notification
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return next(new AppError('Current user not found', 404));
    }

    // Check if userId is an email address
    let user;
    const isEmail = userId.includes('@');

    if (isEmail) {
      // Find user by email
      user = await User.findOne({ email: userId });
      if (!user) {
        return next(new AppError(`No user found with email: ${userId}`, 404));
      }
    } else {
      // Find user by ID
      try {
        user = await User.findById(userId);
      } catch (err) {
        return next(new AppError('Invalid user ID format', 400));
      }

      if (!user) {
        return next(new AppError('User not found', 404));
      }
    }

    // Add the collaborator
    if (!project.collaborators) {
      project.collaborators = [];
    }

    // Check if user is already a collaborator
    const existingCollaborator = project.collaborators.find(
      collab => collab.user.toString() === user._id.toString()
    );

    const isNewCollaborator = !existingCollaborator;

    if (existingCollaborator) {
      // Update existing collaborator
      existingCollaborator.role = role || existingCollaborator.role;
      existingCollaborator.permissions = {
        ...existingCollaborator.permissions,
        ...(permissions || {})
      };
    } else {
      // Add new collaborator
      project.collaborators.push({
        user: user._id,
        role: role || 'contributor',
        permissions: {
          canEdit: permissions?.canEdit || false,
          canDelete: permissions?.canDelete || false,
          canInvite: permissions?.canInvite || false
        },
        addedAt: new Date()
      });
    }

    await project.save({ validateBeforeSave: false });

    // Populate collaborator data
    await project.populate({
      path: 'collaborators.user',
      select: 'firstName lastName profilePicture username email'
    });

    // Send email notification to the collaborator if they're newly added
    if (isNewCollaborator) {
      try {
        // Import mail utilities
        const { sendCollaboratorInvitationEmail } = await import('../../utils/communication/mail.utils.js');

        const inviterName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username || 'A user';
        const recipientName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'there';

        // Send the invitation email using our dedicated function
        const emailResult = await sendCollaboratorInvitationEmail(
          user.email,
          project.title,
          project.slug,
          inviterName,
          recipientName,
          role || 'contributor'
        );

        if (emailResult.success) {
          logger.info(`Collaboration invitation email sent to ${user.email} for project ${project._id}`);
        } else {
          logger.warn(`Collaboration invitation email not sent: ${emailResult.error}`);
        }
      } catch (emailError) {
        // Log the error but don't fail the request
        logger.error(`Failed to send collaboration email: ${emailError.message}`, {
          projectId: project._id,
          userId: user._id,
          error: emailError
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        collaborators: project.collaborators
      }
    });
  } catch (error) {
    logger.error(`Error adding collaborator to project: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get all collaborators for a project
export const getCollaborators = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the project
    const project = await Project.findById(id).populate({
      path: 'collaborators.user',
      select: 'firstName lastName profilePicture username email'
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    res.status(200).json({
      status: 'success',
      results: project.collaborators.length,
      data: {
        collaborators: project.collaborators
      }
    });
  } catch (error) {
    logger.error(`Error getting project collaborators: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Update collaborator permissions
export const updateCollaborator = async (req, res, next) => {
  try {
    const { id, collaboratorId } = req.params;
    const { role, permissions } = req.body;
    const currentUserId = req.user._id;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if the current user is the owner
    if (!project.owner.equals(currentUserId)) {
      return next(new AppError('Only the project owner can update collaborator permissions', 403));
    }

    // Find the collaborator
    const collaborator = project.collaborators.find(
      collab => collab.user.toString() === collaboratorId
    );

    if (!collaborator) {
      return next(new AppError('Collaborator not found', 404));
    }

    // Update collaborator
    if (role) collaborator.role = role;
    if (permissions) {
      collaborator.permissions = {
        ...collaborator.permissions,
        ...permissions
      };
    }

    await project.save({ validateBeforeSave: false });

    // Populate collaborator data
    await project.populate({
      path: 'collaborators.user',
      select: 'firstName lastName profilePicture username email'
    });

    res.status(200).json({
      status: 'success',
      data: {
        collaborator
      }
    });
  } catch (error) {
    logger.error(`Error updating project collaborator: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Remove a collaborator from a project
export const removeCollaborator = async (req, res, next) => {
  try {
    const { id, collaboratorId } = req.params;
    const currentUserId = req.user._id;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if the current user is the owner or the collaborator being removed
    const isOwner = project.owner.equals(currentUserId);
    const isSelfRemoval = collaboratorId === currentUserId.toString();

    if (!isOwner && !isSelfRemoval) {
      return next(new AppError('You do not have permission to remove this collaborator', 403));
    }

    // Remove the collaborator
    if (!project.collaborators) {
      project.collaborators = [];
    }

    project.collaborators = project.collaborators.filter(
      collab => collab.user.toString() !== collaboratorId.toString()
    );

    await project.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: {
        collaborators: project.collaborators
      }
    });
  } catch (error) {
    logger.error(`Error removing collaborator from project: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Track a project share
export const trackShare = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Initialize analytics if not exists
    if (!project.analytics) {
      project.analytics = { views: 0, likes: 0, shares: 0, clicks: 0, viewHistory: [] };
    }

    // Increment share count
    project.analytics.shares += 1;

    // Track share platform if provided
    if (platform) {
      if (!project.metadata) project.metadata = new Map();
      if (!project.metadata.get('sharePlatforms')) {
        project.metadata.set('sharePlatforms', {});
      }

      const sharePlatforms = project.metadata.get('sharePlatforms');
      sharePlatforms[platform] = (sharePlatforms[platform] || 0) + 1;
    }

    await project.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: {
        shares: project.analytics.shares
      }
    });
  } catch (error) {
    logger.error(`Error tracking project share: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Track a project click (e.g., clicking on project URL)
export const trackClick = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { target } = req.body; // Optional: track what was clicked (projectUrl, repositoryUrl, etc.)

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Initialize analytics if not exists
    if (!project.analytics) {
      project.analytics = { views: 0, likes: 0, shares: 0, clicks: 0, viewHistory: [] };
    }

    // Increment click count
    project.analytics.clicks += 1;

    // Track click target if provided
    if (target) {
      if (!project.metadata) project.metadata = new Map();
      if (!project.metadata.get('clickTargets')) {
        project.metadata.set('clickTargets', {});
      }

      const clickTargets = project.metadata.get('clickTargets');
      clickTargets[target] = (clickTargets[target] || 0) + 1;
    }

    await project.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: {
        clicks: project.analytics.clicks
      }
    });
  } catch (error) {
    logger.error(`Error tracking project click: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get project analytics
export const getProjectAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if user has permission to view analytics
    if (!project.owner.equals(userId) && !project.collaborators?.some(c =>
      c.user.toString() === userId.toString() &&
      (c.role === 'owner' || c.permissions?.canEdit)
    )) {
      return next(new AppError('You do not have permission to view project analytics', 403));
    }

    // Prepare analytics data
    const analytics = {
      summary: {
        views: project.analytics?.views || 0,
        likes: project.analytics?.likes || 0,
        shares: project.analytics?.shares || 0,
        clicks: project.analytics?.clicks || 0,
        commentCount: project.comments?.length || 0,
        collaboratorCount: project.collaborators?.length || 0
      },
      viewHistory: project.analytics?.viewHistory || [],
      // Add additional analytics data
      clickTargets: project.metadata?.get('clickTargets') || {},
      sharePlatforms: project.metadata?.get('sharePlatforms') || {},
      // Calculate engagement rate (views that resulted in likes, comments, or shares)
      engagementRate: project.analytics?.views > 0 ?
        (((project.analytics?.likes || 0) +
          (project.comments?.length || 0) +
          (project.analytics?.shares || 0)) /
          project.analytics.views * 100).toFixed(2) + '%' :
        '0%'
    };

    res.status(200).json({
      status: 'success',
      data: {
        analytics
      }
    });
  } catch (error) {
    logger.error(`Error getting project analytics: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get featured projects
export const getFeaturedProjects = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;

    // Get featured projects
    const projects = await Project.find({
      featured: true,
      visibility: 'public'
    })
    .sort('-createdAt')
    .limit(limit)
    .populate({
      path: 'owner',
      select: 'firstName lastName profilePicture username'
    });

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: {
        projects
      }
    });
  } catch (error) {
    logger.error(`Error getting featured projects: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get trending projects
export const getTrendingProjects = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const days = parseInt(req.query.days, 10) || 30; // Default to last 30 days

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Get trending projects based on views, likes, and shares
    const projects = await Project.find({
      visibility: 'public',
      createdAt: { $gte: dateThreshold }
    })
    .sort({
      'analytics.views': -1,
      'analytics.likes': -1,
      'analytics.shares': -1
    })
    .limit(limit)
    .populate({
      path: 'owner',
      select: 'firstName lastName profilePicture username'
    });

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: {
        projects
      }
    });
  } catch (error) {
    logger.error(`Error getting trending projects: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get projects by category
export const getProjectsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Get projects by category
    const projects = await Project.find({
      category,
      visibility: 'public'
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'owner',
      select: 'firstName lastName profilePicture username'
    });

    const total = await Project.countDocuments({ category, visibility: 'public' });

    res.status(200).json({
      status: 'success',
      results: projects.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: {
        projects
      }
    });
  } catch (error) {
    logger.error(`Error getting projects by category: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get projects by technology
export const getProjectsByTechnology = async (req, res, next) => {
  try {
    const { technology } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Get projects by technology
    const projects = await Project.find({
      technologies: technology,
      visibility: 'public'
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'owner',
      select: 'firstName lastName profilePicture username'
    });

    const total = await Project.countDocuments({
      technologies: technology,
      visibility: 'public'
    });

    res.status(200).json({
      status: 'success',
      results: projects.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: {
        projects
      }
    });
  } catch (error) {
    logger.error(`Error getting projects by technology: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Add gallery items to a project
export const addGalleryItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if user has permission to edit the project
    if (!project.canUserEdit(userId)) {
      return next(new AppError('You do not have permission to edit this project', 403));
    }

    // Check if files are provided
    if (!req.files?.gallery || req.files.gallery.length === 0) {
      return next(new AppError('No gallery files provided', 400));
    }

    // Process gallery uploads
    try {
      logger.info(`Processing gallery uploads for project ${id} by user ${userId}`);

      const galleryPromises = req.files.gallery.map(file =>
        uploadToCloudinary(file, "project-gallery")
      );

      const galleryResults = await Promise.all(galleryPromises);

      const newGalleryItems = galleryResults
        .filter(result => result) // Filter out failed uploads
        .map((result, index) => ({
          url: result.url,
          publicId: result.publicId,
          caption: req.body.captions ? req.body.captions[index] || '' : '',
          order: (project.gallery?.length || 0) + index,
          type: result.resource_type === 'video' ? 'video' : 'image'
        }));

      if (newGalleryItems.length === 0) {
        return next(new AppError('Failed to upload gallery items', 500));
      }

      // Add new gallery items to the project
      if (!project.gallery) project.gallery = [];
      project.gallery.push(...newGalleryItems);
      await project.save({ validateBeforeSave: false });

      res.status(200).json({
        status: 'success',
        data: {
          gallery: project.gallery
        }
      });
    } catch (uploadError) {
      logger.error(`Error uploading gallery images: ${uploadError.message}`);
      return next(new AppError(`Error uploading gallery images: ${uploadError.message}`, 500));
    }
  } catch (error) {
    logger.error(`Error adding gallery items: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Update a gallery item
export const updateGalleryItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const { caption, order } = req.body;
    const userId = req.user._id;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if user has permission to edit the project
    if (!project.canUserEdit(userId)) {
      return next(new AppError('You do not have permission to edit this project', 403));
    }

    // Find the gallery item
    const galleryItem = project.gallery?.id(itemId);
    if (!galleryItem) {
      return next(new AppError('Gallery item not found', 404));
    }

    // Update gallery item
    if (caption !== undefined) galleryItem.caption = caption;
    if (order !== undefined) galleryItem.order = order;

    await project.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: {
        galleryItem
      }
    });
  } catch (error) {
    logger.error(`Error updating gallery item: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Remove a gallery item
export const removeGalleryItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const userId = req.user._id;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if user has permission to edit the project
    if (!project.canUserEdit(userId)) {
      return next(new AppError('You do not have permission to edit this project', 403));
    }

    // Find the gallery item
    const galleryItem = project.gallery?.id(itemId);
    if (!galleryItem) {
      return next(new AppError('Gallery item not found', 404));
    }

    // Delete from Cloudinary if publicId exists
    if (galleryItem.publicId) {
      try {
        await deleteFromCloudinary(galleryItem.url);
        logger.info(`Successfully deleted gallery item from Cloudinary: ${galleryItem.url}`);
      } catch (deleteError) {
        logger.warn(`Failed to delete gallery item from Cloudinary: ${galleryItem.url}`);
        // Continue with removal even if Cloudinary deletion fails
      }
    }

    // Remove the gallery item
    galleryItem.remove();
    await project.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error(`Error removing gallery item: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Reorder gallery items
export const reorderGalleryItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemIds } = req.body; // Array of gallery item IDs in the desired order
    const userId = req.user._id;

    if (!Array.isArray(itemIds)) {
      return next(new AppError('itemIds must be an array', 400));
    }

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if user has permission to edit the project
    if (!project.canUserEdit(userId)) {
      return next(new AppError('You do not have permission to edit this project', 403));
    }

    // Check if all itemIds exist in the gallery
    const galleryItemIds = project.gallery?.map(item => item._id.toString()) || [];
    const allItemsExist = itemIds.every(itemId => galleryItemIds.includes(itemId));
    if (!allItemsExist) {
      return next(new AppError('One or more gallery items not found', 404));
    }

    // Update order of gallery items
    itemIds.forEach((itemId, index) => {
      const item = project.gallery.id(itemId);
      if (item) {
        item.order = index;
      }
    });

    await project.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: {
        gallery: project.gallery.sort((a, b) => a.order - b.order)
      }
    });
  } catch (error) {
    logger.error(`Error reordering gallery items: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};
