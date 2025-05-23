import jwt from "jsonwebtoken";
import Job from "../../models/job/job.model.js";
import JobApplication from "../../models/job/jobApplication.model.js";
import User from "../../models/user/user.model.js";
import { AppError } from "../../utils/logging/error.js";
import logger from "../../utils/logging/logger.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/storage/cloudinary.utils.js";

// Create a new job posting
export const createJob = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check if user has permission to post jobs
    const user = await User.findById(userId);
    if (!user.roleCapabilities?.canPostJobs) {
      return next(new AppError("You don't have permission to post jobs", 403));
    }

    // Create job with user as poster
    let jobData;

    // Handle both FormData submissions and direct JSON
    if (req.body.data) {
      try {
        // Parse the JSON data if it's a string
        jobData = typeof req.body.data === 'string'
          ? JSON.parse(req.body.data)
          : req.body.data;

        // Add the user ID
        jobData.poster = userId;

        logger.info(`Parsed job data from FormData for user ${userId}`);
      } catch (parseError) {
        logger.error(`Error parsing job data: ${parseError.message}`);
        return next(new AppError(`Invalid job data format: ${parseError.message}`, 400));
      }
    } else {
      // Direct JSON submission
      jobData = { ...req.body, poster: userId };
    }

    // Handle company logo upload if provided
    if (req.files?.logo && req.files.logo[0]) {
      try {
        logger.info(`Processing logo upload for job posting by user ${userId}`);
        const result = await uploadToCloudinary(req.files.logo[0], "job-logos");
        if (result) {
          // Make sure company object exists
          jobData.company = jobData.company || {};
          jobData.company.logo = result.url;
          logger.info(`Successfully uploaded logo to Cloudinary: ${result.url}`);
        }
      } catch (uploadError) {
        logger.error(`Error uploading logo: ${uploadError.message}`);
        // Continue without the logo if upload fails
      }
    }

    const job = await Job.create(jobData);

    res.status(201).json({
      status: "success",
      data: {
        job,
      },
    });
  } catch (error) {
    logger.error(`Error creating job: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get all jobs with filtering, sorting, and pagination
export const getAllJobs = async (req, res, next) => {
  try {
    // Build query
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields", "search", "datePosted", "jobType", "experienceLevel", "locationType"];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // Only show published jobs by default
    let filterObj = JSON.parse(queryStr);
    if (!filterObj.status) {
      filterObj.status = "Published";
    }

    // Add expiration filter
    if (filterObj.status === "Published") {
      filterObj.expiresAt = { $gt: new Date() };
    }

    // Text search
    if (req.query.search) {
      // Use text index search with score
      filterObj.$text = { $search: req.query.search };
    }

    // Date posted filter
    if (req.query.datePosted) {
      const now = new Date();
      let dateFilter;

      switch (req.query.datePosted) {
        case 'today':
          dateFilter = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          dateFilter = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          dateFilter = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          dateFilter = null;
      }

      if (dateFilter) {
        filterObj.createdAt = { $gte: dateFilter };
      }
    }

    // Job type filter
    if (req.query.jobType) {
      filterObj.jobType = req.query.jobType;
    }

    // Experience level filter
    if (req.query.experienceLevel) {
      filterObj.experienceLevel = req.query.experienceLevel;
    }

    // Location type filter
    if (req.query.locationType) {
      filterObj.locationType = req.query.locationType;
    }

    let query = Job.find(filterObj);

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
    const jobs = await query;
    const total = await Job.countDocuments(filterObj);

    res.status(200).json({
      status: "success",
      results: jobs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: {
        jobs,
      },
    });
  } catch (error) {
    logger.error(`Error getting jobs: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get a single job by ID or slug
export const getJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info(`Fetching job with ID or slug: ${id}`);

    // Check if id is a valid ObjectId or a slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    let job;
    if (isObjectId) {
      logger.info(`Looking up job by ID: ${id}`);
      job = await Job.findById(id).populate("posterData");
    } else {
      logger.info(`Looking up job by slug: ${id}`);
      job = await Job.findOne({ slug: id }).populate("posterData");

      // If not found by exact slug, try case-insensitive search
      if (!job) {
        logger.info(`Job not found by exact slug, trying case-insensitive search`);
        job = await Job.findOne({
          slug: { $regex: new RegExp('^' + id + '$', 'i') }
        }).populate("posterData");
      }
    }

    if (!job) {
      logger.warn(`Job not found with ID or slug: ${id}`);
      return next(new AppError("Job not found", 404));
    }

    logger.info(`Found job: ${job.title} (${job._id})`);

    // Increment view count
    job.views += 1;
    await job.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      data: {
        job,
      },
    });
  } catch (error) {
    logger.error(`Error getting job: ${error.message}`, {
      id: req.params.id,
      error: error.stack
    });
    next(new AppError(error.message, 400));
  }
};

// Update a job
export const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the job
    const job = await Job.findById(id);
    if (!job) {
      return next(new AppError("Job not found", 404));
    }

    // Check if user is the poster or an admin
    if (!job.poster.equals(userId) && req.user.role !== "admin") {
      return next(new AppError("You don't have permission to update this job", 403));
    }

    // Handle company logo upload if provided
    if (req.files?.logo && req.files.logo[0]) {
      try {
        logger.info(`Processing logo upload for job update by user ${userId}`);

        // Validate file type
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/svg+xml',
          'image/webp'
        ];

        const logoFile = req.files.logo[0];

        if (!allowedMimeTypes.includes(logoFile.mimetype)) {
          logger.error(`Invalid logo file type: ${logoFile.mimetype}`);
          return next(new AppError("Logo must be a JPG, PNG, GIF, SVG, or WEBP file", 400));
        }

        // Delete old logo if exists
        if (job.company?.logo) {
          const deleteResult = await deleteFromCloudinary(job.company.logo);
          if (deleteResult) {
            logger.info(`Successfully deleted old logo: ${job.company.logo}`);
          } else {
            logger.warn(`Failed to delete old logo: ${job.company.logo}`);
            // Continue with the update even if deletion fails
          }
        }

        const result = await uploadToCloudinary(req.files.logo[0], "job-logos");
        if (result) {
          // Make sure company object exists in request body
          req.body.company = req.body.company || {};
          req.body.company.logo = result.url;
          logger.info(`Successfully uploaded new logo to Cloudinary: ${result.url}`);
        }
      } catch (uploadError) {
        logger.error(`Error uploading logo: ${uploadError.message}`);
        return next(new AppError(`Failed to upload logo: ${uploadError.message}`, 400));
      }
    }

    // Parse job data if it's in FormData format
    let updateData;

    if (req.body.data) {
      try {
        // Parse the JSON data if it's a string
        updateData = typeof req.body.data === 'string'
          ? JSON.parse(req.body.data)
          : req.body.data;

        logger.info(`Parsed job update data from FormData for job ${id}`);
      } catch (parseError) {
        logger.error(`Error parsing job update data: ${parseError.message}`);
        return next(new AppError(`Invalid job data format: ${parseError.message}`, 400));
      }
    } else {
      // Direct JSON submission
      updateData = req.body;
    }

    // Validate required fields
    if (updateData.title && updateData.title.trim() === '') {
      return next(new AppError("Job title cannot be empty", 400));
    }

    if (updateData.company && typeof updateData.company === 'object') {
      if (updateData.company.name && updateData.company.name.trim() === '') {
        return next(new AppError("Company name cannot be empty", 400));
      }
    }

    if (updateData.description && updateData.description.trim() === '') {
      return next(new AppError("Job description cannot be empty", 400));
    }

    // Validate salary if provided
    if (updateData.salary && typeof updateData.salary === 'object') {
      if (updateData.salary.min && updateData.salary.max &&
          Number(updateData.salary.min) > Number(updateData.salary.max)) {
        return next(new AppError("Minimum salary cannot be greater than maximum salary", 400));
      }
    }

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        job: updatedJob,
      },
    });
  } catch (error) {
    logger.error(`Error updating job: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Delete a job
export const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the job
    const job = await Job.findById(id);
    if (!job) {
      return next(new AppError("Job not found", 404));
    }

    // Check if user is the poster or an admin
    if (!job.poster.equals(userId) && req.user.role !== "admin") {
      return next(new AppError("You don't have permission to delete this job", 403));
    }

    // Delete job
    await Job.findByIdAndDelete(id);

    // Delete all applications for this job
    await JobApplication.deleteMany({ job: id });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    logger.error(`Error deleting job: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Apply for a job
export const applyForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user._id;

    // Check if user has permission to apply for jobs
    const user = await User.findById(userId);
    if (!user.roleCapabilities?.canApplyToJobs) {
      return next(new AppError("You don't have permission to apply for jobs", 403));
    }

    // Check if job exists and is published
    const job = await Job.findOne({
      _id: jobId,
      status: "Published",
      expiresAt: { $gt: new Date() },
    });

    if (!job) {
      return next(new AppError("Job not found or no longer accepting applications", 404));
    }

    // Check if user has already applied
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      applicant: userId,
    });

    if (existingApplication) {
      return next(new AppError("You have already applied for this job", 400));
    }

    // Handle resume upload
    if (!req.files?.resume) {
      return next(new AppError("Resume is required", 400));
    }

    // Parse application data if it's in FormData format
    let formData = {};

    if (req.body.data) {
      try {
        // Parse the JSON data if it's a string
        formData = typeof req.body.data === 'string'
          ? JSON.parse(req.body.data)
          : req.body.data;

        logger.info(`Parsed application data from FormData for job ${jobId}`);
      } catch (parseError) {
        logger.error(`Error parsing application data: ${parseError.message}`);
        // Continue with empty formData
      }
    } else {
      // Direct JSON submission
      formData = req.body;
    }

    let applicationData;
    try {
      logger.info(`Processing resume upload for job application by user ${userId}`);

      // Validate file type
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      const resumeFile = req.files.resume[0];

      if (!allowedMimeTypes.includes(resumeFile.mimetype)) {
        logger.error(`Invalid resume file type: ${resumeFile.mimetype}`);
        return next(new AppError("Resume must be a PDF, DOC, or DOCX file", 400));
      }

      // Upload to Cloudinary
      const resumeResult = await uploadToCloudinary(
        resumeFile,
        "job-applications"
      );

      if (!resumeResult) {
        return next(new AppError("Failed to upload resume", 500));
      }

      logger.info(`Successfully uploaded resume to Cloudinary: ${resumeResult.url}`);

      // Create application data
      applicationData = {
        job: jobId,
        applicant: userId,
        resume: {
          url: resumeResult.url,
          publicId: resumeResult.publicId,
          name: resumeFile.originalname,
          fileType: resumeFile.mimetype,
          fileSize: resumeFile.size
        },
        coverLetter: formData.coverLetter || "",
        answers: formData.answers || [],
      };
    } catch (uploadError) {
      logger.error(`Error uploading resume: ${uploadError.message}`);
      return next(new AppError(`Failed to upload resume: ${uploadError.message}`, 500));
    }

    const application = await JobApplication.create(applicationData);

    res.status(201).json({
      status: "success",
      data: {
        application,
      },
    });
  } catch (error) {
    logger.error(`Error applying for job: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get all applications for a job (for job poster)
export const getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user._id;

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return next(new AppError("Job not found", 404));
    }

    // Check if user is the poster or an admin
    if (!job.poster.equals(userId) && req.user.role !== "admin") {
      return next(new AppError("You don't have permission to view these applications", 403));
    }

    // Get applications
    const applications = await JobApplication.find({ job: jobId })
      .populate({
        path: "applicant",
        select: "firstName lastName email profilePicture",
      })
      .sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: applications.length,
      data: {
        applications,
      },
    });
  } catch (error) {
    logger.error(`Error getting job applications: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Update application status (for job poster)
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status, notes, rating } = req.body;
    const userId = req.user._id;

    // Find the application
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return next(new AppError("Application not found", 404));
    }

    // Find the job
    const job = await Job.findById(application.job);
    if (!job) {
      return next(new AppError("Job not found", 404));
    }

    // Check if user is the poster or an admin
    if (!job.poster.equals(userId) && req.user.role !== "admin") {
      return next(new AppError("You don't have permission to update this application", 403));
    }

    // Update application
    const updatedApplication = await JobApplication.findByIdAndUpdate(
      applicationId,
      { status, notes, rating },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        application: updatedApplication,
      },
    });
  } catch (error) {
    logger.error(`Error updating application status: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get user's job applications with filtering and pagination
export const getUserApplications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    // Build query
    const query = { applicant: userId };

    // Add status filter if provided
    if (status && status !== 'All') {
      query.status = status;
    }

    // Add search functionality if search term is provided
    if (search) {
      // We'll need to join with the Job model to search by job title
      // This will be handled through a separate aggregation pipeline
      // For now, we'll keep the basic query and enhance it later if needed
    }

    // Get applications with pagination
    const skip = (page - 1) * limit;

    // Create the base query
    let applicationsQuery = JobApplication.find(query)
      .populate({
        path: "job",
        select: "title company status slug location locationType jobType experienceLevel salary deadline",
      })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    // Execute the query
    const applications = await applicationsQuery;

    // Get total count for pagination
    const totalApplications = await JobApplication.countDocuments(query);

    // Get status counts for filters
    const statusCounts = await JobApplication.aggregate([
      { $match: { applicant: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Format status counts
    const formattedStatusCounts = {
      All: totalApplications
    };

    statusCounts.forEach(status => {
      formattedStatusCounts[status._id] = status.count;
    });

    res.status(200).json({
      status: "success",
      results: applications.length,
      data: {
        applications,
        pagination: {
          page,
          pages: Math.ceil(totalApplications / limit),
          limit,
          total: totalApplications
        },
        statusCounts: formattedStatusCounts
      },
    });
  } catch (error) {
    logger.error(`Error getting user applications: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get a single job application by ID
export const getJobApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user._id;

    // Find the application
    const application = await JobApplication.findById(applicationId)
      .populate({
        path: "job",
        select: "title company status slug location locationType jobType experienceLevel salary deadline poster",
      });

    if (!application) {
      return next(new AppError("Application not found", 404));
    }

    // Check if user is the applicant, job poster, or an admin
    const isApplicant = application.applicant.equals(userId);
    const isJobPoster = application.job.poster.equals(userId);
    const isAdmin = req.user.role === "admin";

    if (!isApplicant && !isJobPoster && !isAdmin) {
      return next(new AppError("You don't have permission to view this application", 403));
    }

    res.status(200).json({
      status: "success",
      data: {
        application,
      },
    });
  } catch (error) {
    logger.error(`Error getting job application: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Download resume for a job application
export const downloadApplicationResume = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    // Get user ID from req.user or from token in query parameter
    let userId;
    if (req.user) {
      userId = req.user._id;
    } else if (req.query.token) {
      try {
        // Verify the token from query parameter
        const decoded = jwt.verify(req.query.token, process.env.JWT_ACCESS_SECRET);
        userId = decoded.id;
      } catch (tokenError) {
        logger.error(`Invalid token in resume download: ${tokenError.message}`);
        return next(new AppError("Invalid or expired token", 401));
      }
    } else {
      return next(new AppError("Authentication required", 401));
    }

    // Find the application
    const application = await JobApplication.findById(applicationId);

    if (!application) {
      return next(new AppError("Application not found", 404));
    }

    // Check if user is the applicant, job poster, or an admin
    const isApplicant = application.applicant.equals(userId);
    const job = await Job.findById(application.job);
    const isJobPoster = job && job.poster.equals(userId);

    // Get user to check role
    const user = await User.findById(userId);
    const isAdmin = user && user.role === "admin";

    if (!isApplicant && !isJobPoster && !isAdmin) {
      return next(new AppError("You don't have permission to download this resume", 403));
    }

    // Check if resume exists
    if (!application.resume || !application.resume.url) {
      return next(new AppError("Resume not found", 404));
    }

    // Get the resume info
    const resumeUrl = application.resume.url;
    const resumeName = application.resume.name || `resume-${applicationId}.pdf`;
    let resumeFileType = application.resume.fileType || 'application/octet-stream';

    // Create a simple PDF file as a fallback if we can't fetch the original
    const createFallbackPDF = () => {
      logger.info('Creating fallback PDF file');

      // Create a simple PDF with application details
      const pdfContent = `
        %PDF-1.4
        1 0 obj
        << /Type /Catalog /Pages 2 0 R >>
        endobj
        2 0 obj
        << /Type /Pages /Kids [3 0 R] /Count 1 >>
        endobj
        3 0 obj
        << /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
        endobj
        4 0 obj
        << /Font << /F1 6 0 R >> >>
        endobj
        5 0 obj
        << /Length 170 >>
        stream
        BT
        /F1 12 Tf
        50 700 Td
        (Resume Download) Tj
        0 -20 Td
        (Application ID: ${applicationId}) Tj
        0 -20 Td
        (The original resume file could not be retrieved.) Tj
        0 -20 Td
        (Please contact support for assistance.) Tj
        ET
        endstream
        endobj
        6 0 obj
        << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
        endobj
        xref
        0 7
        0000000000 65535 f
        0000000009 00000 n
        0000000058 00000 n
        0000000115 00000 n
        0000000216 00000 n
        0000000261 00000 n
        0000000483 00000 n
        trailer
        << /Size 7 /Root 1 0 R >>
        startxref
        553
        %%EOF
      `;

      return Buffer.from(pdfContent);
    };

    try {
      let fileBuffer;
      let fetchSuccessful = false;

      // Try to fetch the file from the URL
      try {
        logger.info(`Attempting to fetch resume from URL: ${resumeUrl}`);
        const response = await fetch(resumeUrl, {
          headers: {
            'Accept': '*/*',
            'User-Agent': 'ProductBazar/1.0'
          }
        });

        if (response.ok) {
          fileBuffer = await response.arrayBuffer();
          fetchSuccessful = true;
          logger.info('Successfully fetched resume file');
        } else {
          logger.warn(`Failed to fetch resume: ${response.status} ${response.statusText}`);
        }
      } catch (fetchError) {
        logger.error(`Error fetching resume: ${fetchError.message}`);
      }

      // If fetch failed, create a fallback PDF
      if (!fetchSuccessful) {
        logger.info('Using fallback PDF');
        fileBuffer = createFallbackPDF();
        resumeFileType = 'application/pdf';
      }

      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${resumeName}"`);
      res.setHeader('Content-Type', resumeFileType);
      res.setHeader('Content-Length', fileBuffer.byteLength);

      // Send the file
      res.status(200).send(Buffer.from(fileBuffer));
    } catch (error) {
      logger.error(`Error processing resume download: ${error.message}`);

      try {
        // Last resort: create and send a fallback PDF
        const fallbackBuffer = createFallbackPDF();
        res.setHeader('Content-Disposition', `attachment; filename="resume-fallback.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', fallbackBuffer.byteLength);
        return res.status(200).send(fallbackBuffer);
      } catch (fallbackError) {
        logger.error(`Error creating fallback PDF: ${fallbackError.message}`);
        return next(new AppError("Failed to retrieve resume file", 500));
      }
    }
  } catch (error) {
    logger.error(`Error downloading application resume: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Withdraw a job application
export const withdrawJobApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user._id;

    // Find the application
    const application = await JobApplication.findById(applicationId);

    if (!application) {
      return next(new AppError("Application not found", 404));
    }

    // Check if user is the applicant
    if (!application.applicant.equals(userId)) {
      return next(new AppError("You don't have permission to withdraw this application", 403));
    }

    // Check if application can be withdrawn (only if it's pending or reviewed)
    if (!['Pending', 'Reviewed'].includes(application.status)) {
      return next(new AppError(`Cannot withdraw application with status: ${application.status}`, 400));
    }

    // Update application status to Withdrawn
    application.status = 'Withdrawn';
    await application.save();

    res.status(200).json({
      status: "success",
      data: {
        application,
      },
    });
  } catch (error) {
    logger.error(`Error withdrawing job application: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get user's posted jobs with filtering, search, and pagination
export const getUserPostedJobs = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build base query - always filter by poster
    const query = { poster: userId };

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Add job type filter if provided
    if (req.query.jobType) {
      query.jobType = req.query.jobType;
    }

    // Add location type filter if provided
    if (req.query.locationType) {
      query.locationType = req.query.locationType;
    }

    // Add date posted filter if provided
    if (req.query.datePosted) {
      const now = new Date();
      let dateFilter;

      switch (req.query.datePosted) {
        case 'today':
          dateFilter = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          dateFilter = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          dateFilter = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          dateFilter = null;
      }

      if (dateFilter) {
        query.createdAt = { $gte: dateFilter };
      }
    }

    // Add search functionality if search term is provided
    if (req.query.search) {
      const searchTerm = req.query.search.trim();

      if (searchTerm) {
        // Use a more flexible search approach with regex for partial matches
        const searchRegex = new RegExp(searchTerm, 'i');

        // Search in multiple fields with OR condition
        query.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { 'company.name': searchRegex },
          { skills: searchRegex }
        ];
      }
    }

    // Determine sort order
    let sortOption = "-createdAt"; // Default sort
    if (req.query.sort) {
      sortOption = req.query.sort;
    }

    // Count total documents for pagination
    const totalJobs = await Job.countDocuments(query);

    // Execute query with pagination and sorting
    const jobs = await Job.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    // Calculate total pages
    const totalPages = Math.ceil(totalJobs / limit);

    res.status(200).json({
      status: "success",
      results: jobs.length,
      data: {
        jobs,
        pagination: {
          page,
          pages: totalPages,
          limit,
          total: totalJobs
        }
      },
    });
  } catch (error) {
    logger.error(`Error getting user posted jobs: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};
