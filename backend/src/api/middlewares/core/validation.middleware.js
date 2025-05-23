import { validationResult } from "express-validator";
import { ApiError } from "../../../utils/logging/error.js";

/**
 * Middleware to validate request data against schema
 * @param {Object} schema - Joi validation schema object with request parts to validate
 * @returns {Function} Express middleware function
 */
export const validateRequest = (schema) => {
    return (req, res, next) => {
        // Initialize validation object to collect all errors
        const validationErrors = {};
        
        // Validate request body if schema includes body validation
        if (schema.body) {
            const { error } = schema.body.validate(req.body, { abortEarly: false });
            if (error) {
                validationErrors.body = error.details.map(detail => detail.message);
            }
        }
        
        // Validate request params if schema includes params validation
        if (schema.params) {
            const { error } = schema.params.validate(req.params, { abortEarly: false });
            if (error) {
                validationErrors.params = error.details.map(detail => detail.message);
            }
        }
        
        // Validate request query if schema includes query validation
        if (schema.query) {
            const { error } = schema.query.validate(req.query, { abortEarly: false });
            if (error) {
                validationErrors.query = error.details.map(detail => detail.message);
            }
        }
        
        // Validate request files if schema includes files validation and files exist
        if (schema.files && req.files) {
            const { error } = schema.files.validate(req.files, { abortEarly: false });
            if (error) {
                validationErrors.files = error.details.map(detail => detail.message);
            }
        }
        
        // If there are validation errors, return 400 Bad Request with error details
        if (Object.keys(validationErrors).length > 0) {
            return next(new ApiError(400, "Validation Error", validationErrors));
        }
        
        // No validation errors, proceed to next middleware
        return next();
    };
};

/**
 * Alternative middleware using express-validator
 * @returns {Function} Express middleware function
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    
    const extractedErrors = {};
    errors.array().forEach(err => {
        if (!extractedErrors[err.param]) {
            extractedErrors[err.param] = [];
        }
        extractedErrors[err.param].push(err.msg);
    });
    
    return next(new ApiError(400, "Validation Error", extractedErrors));
};

/**
 * Custom validator for MongoDB ObjectId
 */
export const isValidObjectId = (value, helpers) => {
    if (!/^[0-9a-fA-F]{24}$/.test(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

export default {
    validateRequest,
    validate,
    isValidObjectId
};