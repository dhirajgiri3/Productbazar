import multer from "multer";
import logger from "../logging/logger.js";

const storage = multer.memoryStorage();

// Map of field names and their aliases to support different field naming conventions
const FIELD_MAPPINGS = {
  thumbnail: ['thumbnail', 'productImage', 'image'],
  gallery: ['gallery', 'galleryImages', 'images'],
  profileImage: ['profileImage', 'avatar'],
  bannerImage: ['bannerImage', 'banner', 'coverImage']
};

// Function to check if a field name is valid based on our mappings
const isValidFieldName = (fieldName) => {
  return Object.values(FIELD_MAPPINGS).some(aliases => 
    aliases.includes(fieldName)
  );
};

// Get canonical field name from any alias
const getCanonicalFieldName = (fieldName) => {
  for (const [canonical, aliases] of Object.entries(FIELD_MAPPINGS)) {
    if (aliases.includes(fieldName)) {
      return canonical;
    }
  }
  return fieldName;
};

// File filter function
const fileFilter = (req, file, cb) => {
  // Log field name for debugging
  if (!isValidFieldName(file.fieldname)) {
    logger.warn(`Unexpected field name: ${file.fieldname}. This may cause issues.`);
  }
  
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Configure multer with our settings
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Error handler middleware for multer errors
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error("Multer error:", err);
    
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB",
      });
    }
    
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      // Provide helpful error message with allowed fields
      const unexpectedField = err.field;
      const allowedFields = Object.values(FIELD_MAPPINGS).flat();
      
      // Check if the field is similar to any of our known fields
      let suggestions = [];
      for (const [canonical, aliases] of Object.entries(FIELD_MAPPINGS)) {
        if (unexpectedField.toLowerCase().includes(canonical.toLowerCase())) {
          suggestions.push(canonical);
        }
        // Check if any alias matches partially
        for (const alias of aliases) {
          if (unexpectedField.toLowerCase().includes(alias.toLowerCase()) ||
              alias.toLowerCase().includes(unexpectedField.toLowerCase())) {
            if (!suggestions.includes(canonical)) {
              suggestions.push(canonical);
            }
          }
        }
      }
      
      let suggestionMessage = '';
      if (suggestions.length > 0) {
        suggestionMessage = ` Did you mean: ${suggestions.join(', ')}?`;
      }
      
      return res.status(400).json({
        success: false,
        message: `Unexpected field "${unexpectedField}". Please check the field name.${suggestionMessage}`,
        allowedFields: allowedFields
      });
    }
    
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    if (err.message === "Only image files are allowed!") {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  } else {
    next();
  }
};

// Middleware for handling single file uploads with field name flexibility
export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    // Get all potential field names from our mapping
    const possibleFieldNames = FIELD_MAPPINGS[fieldName] || [fieldName];
    
    // Try each field name until we find one that works
    const tryNextField = (index) => {
      if (index >= possibleFieldNames.length) {
        // If we've tried all fields and none worked, proceed without file
        logger.warn(`Could not find any valid field among: ${possibleFieldNames.join(', ')}`);
        return next();
      }
      
      const currentField = possibleFieldNames[index];
      const singleUpload = upload.single(currentField);
      
      singleUpload(req, res, (err) => {
        if (err) {
          // If there's an error that's not just missing field, handle it
          if (err.code !== 'LIMIT_UNEXPECTED_FILE') {
            return handleMulterError(err, req, res, next);
          }
          
          // If field not found, try the next one
          tryNextField(index + 1);
        } else {
          // If file uploaded with this field name, proceed
          if (req.file) {
            // Normalize the field name in the request for consistent handling
            const file = req.file;
            req.canonicalField = fieldName;
            req.actualField = currentField;
            
            logger.info(`File uploaded as '${currentField}', canonical name: '${fieldName}'`);
          }
          next();
        }
      });
    };
    
    // Start trying fields
    tryNextField(0);
  };
};

// Middleware for handling multiple file uploads
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    // Get all potential field names from our mapping
    const possibleFieldNames = FIELD_MAPPINGS[fieldName] || [fieldName];
    
    // Try each field name until we find one that works
    const tryNextField = (index) => {
      if (index >= possibleFieldNames.length) {
        // If we've tried all fields and none worked, proceed without files
        logger.warn(`Could not find any valid field among: ${possibleFieldNames.join(', ')}`);
        return next();
      }
      
      const currentField = possibleFieldNames[index];
      const multiUpload = upload.array(currentField, maxCount);
      
      multiUpload(req, res, (err) => {
        if (err) {
          // If there's an error that's not just missing field, handle it
          if (err.code !== 'LIMIT_UNEXPECTED_FILE') {
            return handleMulterError(err, req, res, next);
          }
          
          // If field not found, try the next one
          tryNextField(index + 1);
        } else {
          // If files uploaded with this field name, proceed
          if (req.files && req.files.length > 0) {
            // Normalize the field name in the request for consistent handling
            req.canonicalField = fieldName;
            req.actualField = currentField;
            
            logger.info(`Files uploaded as '${currentField}', canonical name: '${fieldName}'`);
          }
          next();
        }
      });
    };
    
    // Start trying fields
    tryNextField(0);
  };
};

export default upload;
