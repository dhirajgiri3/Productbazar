// File: upload.middleware.js

import multer from "multer";
// path import removed as it's not needed
import { AppError } from "../../../utils/logging/error.js";
import logger from "../../../utils/logging/logger.js";

// Use memory storage instead of disk storage to avoid file system issues
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (_, file, cb) => { // Using _ to indicate unused parameter
  // Get the field name from the file
  const fieldname = file.fieldname;

  // For resume uploads, accept PDF and document files
  if (fieldname === 'resume') {
    const allowedMimeTypes = [
      'application/pdf',                                                  // PDF
      'application/msword',                                              // DOC
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      logger.info(`Accepting resume file: ${file.originalname} (${file.mimetype})`);
      cb(null, true);
    } else {
      logger.warn(`Rejecting resume file: ${file.originalname} (${file.mimetype})`);
      cb(new AppError("Resume must be a PDF, DOC, or DOCX file", 400), false);
    }
  }
  // For all other uploads, accept only images
  else if (file.mimetype.startsWith("image/")) {
    logger.info(`Accepting image file: ${file.originalname} (${file.mimetype})`);
    cb(null, true);
  } else {
    logger.warn(`Rejecting file: ${file.originalname} (${file.mimetype})`);
    cb(new AppError("Only image files are allowed for this field", 400), false);
  }
};

// Create multer instance with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Error handling middleware for multer
export const handleMulterErrors = (err, _, res, next) => { // Using _ to indicate unused parameter
  if (err instanceof multer.MulterError) {
    let message = "File upload error";
    let statusCode = 400;

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File is too large. Maximum size is 10MB";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected field name in form data";
        break;
      default:
        message = err.message;
    }

    logger.error("Multer error:", err);
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
  next(err);
};

// Helper for uploading multiple files
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

export const handleUploadErrors = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No files were uploaded",
    });
  }

  // Check for file type
  const invalidFiles = req.files.filter(
    (file) => !file.mimetype.startsWith("image/")
  );
  if (invalidFiles.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid file type. Only images are allowed",
    });
  }

  next();
};

// Export configured multer instance
export { upload };