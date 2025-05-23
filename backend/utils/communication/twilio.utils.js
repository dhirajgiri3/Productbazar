// utils/twilio.utils.js

import twilio from 'twilio';
import dotenv from 'dotenv';
import logger from '../logging/logger.js';
import { normalizePhone } from './phone.utils.js';

dotenv.config();

// Initialize Twilio client with error handling
let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    logger.info('Twilio client initialized successfully');
  } else {
    logger.warn('Twilio credentials not found, running in development mode only');
  }
} catch (error) {
  logger.error('Failed to initialize Twilio client:', error);
}

const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// In-memory stores for development
const otpStore = new Map();
const rateLimitStore = new Map();

/**
 * Creates a standardized error response
 */
const createError = (message, code, details = {}) => ({
  error: true,
  code,
  message,
  ...details
});

// Custom error types
class TwilioError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'TwilioError';
    this.code = code;
    this.details = details;
  }
}

// Error codes mapping
const ERROR_CODES = {
  INVALID_PHONE: 'INVALID_PHONE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TWILIO_SERVICE_ERROR: 'TWILIO_SERVICE_ERROR',
  OTP_EXPIRED: 'OTP_EXPIRED',
  INVALID_OTP: 'INVALID_OTP',
  MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED'
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000
};

// Helper function to implement exponential backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithExponentialBackoff = async (operation, retryCount = 0) => {
  try {
    return await operation();
  } catch (error) {
    if (retryCount >= RETRY_CONFIG.maxRetries || !isRetryableError(error)) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(2, retryCount),
      RETRY_CONFIG.maxDelay
    );

    logger.warn(`Retrying operation after ${delay}ms (attempt ${retryCount + 1})`);
    await sleep(delay);
    return retryWithExponentialBackoff(operation, retryCount + 1);
  }
};

const isRetryableError = (error) => {
  const retryableCodes = ['30001', '30002', '30003', '30004', '30005'];
  return error.code && retryableCodes.includes(error.code.toString());
};

// Enhanced rate limit checker
const checkRateLimit = (phoneNumber) => {
  const now = Date.now();
  const attempts = rateLimitStore.get(phoneNumber) || [];
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  // Clear old attempts
  const validAttempts = attempts.filter(time => now - time < windowMs);
  
  if (validAttempts.length >= 5) {
    const timeToReset = Math.ceil((validAttempts[0] + windowMs - now) / 1000);
    throw new TwilioError(
      `Rate limit exceeded. Please try again in ${timeToReset} seconds.`,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      { timeToReset, maxAttempts: 5, windowMs }
    );
  }
  
  validAttempts.push(now);
  rateLimitStore.set(phoneNumber, validAttempts);
  return true;
};

/**
 * Generate and store mock OTP for development
 */
const generateMockOTP = (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
  
  otpStore.set(phone, {
    code: otp,
    expiresAt: expiryTime
  });
  
  return otp;
};

// Enhanced send OTP function
export const sendOTP = async (phone) => {
  try {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new TwilioError(
        'Invalid phone number format',
        ERROR_CODES.INVALID_PHONE,
        { phone }
      );
    }

    // Check rate limiting
    checkRateLimit(normalizedPhone);

    // Development mode
    if (process.env.NODE_ENV !== 'production' || !twilioClient) {
      const mockOtp = generateMockOTP(normalizedPhone);
      logger.info(`[DEV MODE] OTP for ${normalizedPhone}: ${mockOtp}`);
      return true;
    }

    // Production mode with Twilio
    return await retryWithExponentialBackoff(async () => {
      try {
        const verification = await twilioClient.verify.v2
          .services(verifyServiceSid)
          .verifications
          .create({
            to: normalizedPhone,
            channel: 'sms'
          });

        logger.info(`OTP sent successfully to ${normalizedPhone}`, {
          status: verification.status,
          sid: verification.sid
        });

        return verification.status === 'pending';
      } catch (twilioError) {
        logger.error('Twilio verification failed:', {
          error: twilioError.message,
          code: twilioError.code,
          phone: normalizedPhone,
          status: twilioError.status
        });

        throw new TwilioError(
          'Failed to send verification code',
          ERROR_CODES.TWILIO_SERVICE_ERROR,
          {
            twilioCode: twilioError.code,
            twilioStatus: twilioError.status,
            phone: normalizedPhone
          }
        );
      }
    });

  } catch (error) {
    if (error instanceof TwilioError) {
      throw error;
    }
    logger.error('Unexpected error in sendOTP:', error);
    throw new TwilioError(
      'Failed to process verification request',
      ERROR_CODES.TWILIO_SERVICE_ERROR,
      { originalError: error.message }
    );
  }
};

// Enhanced verify OTP function
export const verifyOTP = async (phone, code) => {
  try {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new TwilioError(
        'Invalid phone number format',
        ERROR_CODES.INVALID_PHONE,
        { phone }
      );
    }

    // Development mode
    if (process.env.NODE_ENV !== 'production' || !twilioClient) {
      const storedOTP = otpStore.get(normalizedPhone);
      
      if (!storedOTP) {
        throw new TwilioError(
          'No OTP found',
          ERROR_CODES.INVALID_OTP,
          { phone: normalizedPhone }
        );
      }

      if (new Date() > storedOTP.expiresAt) {
        otpStore.delete(normalizedPhone);
        throw new TwilioError(
          'OTP has expired',
          ERROR_CODES.OTP_EXPIRED,
          { phone: normalizedPhone }
        );
      }

      const isValid = storedOTP.code === code;
      if (isValid) {
        otpStore.delete(normalizedPhone);
        logger.info(`OTP verified successfully for ${normalizedPhone} (DEV MODE)`);
      }
      return isValid;
    }

    // Production mode with Twilio
    return await retryWithExponentialBackoff(async () => {
      try {
        const verification = await twilioClient.verify.v2
          .services(verifyServiceSid)
          .verificationChecks
          .create({
            to: normalizedPhone,
            code
          });

        logger.info(`OTP verification result for ${normalizedPhone}:`, {
          status: verification.status,
          sid: verification.sid
        });

        return verification.status === 'approved';
      } catch (twilioError) {
        logger.error('Twilio verification check failed:', {
          error: twilioError.message,
          code: twilioError.code,
          phone: normalizedPhone
        });

        throw new TwilioError(
          'Failed to verify code',
          ERROR_CODES.TWILIO_SERVICE_ERROR,
          {
            twilioCode: twilioError.code,
            twilioStatus: twilioError.status,
            phone: normalizedPhone
          }
        );
      }
    });

  } catch (error) {
    if (error instanceof TwilioError) {
      throw error;
    }
    logger.error('Unexpected error in verifyOTP:', error);
    throw new TwilioError(
      'Failed to process verification check',
      ERROR_CODES.TWILIO_SERVICE_ERROR,
      { originalError: error.message }
    );
  }
};

// Cleanup intervals
setInterval(() => {
  const now = new Date();
  
  // Clean up expired OTPs
  otpStore.forEach((value, key) => {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  });
  
  // Clean up old rate limit entries
  const windowMs = 15 * 60 * 1000;
  rateLimitStore.forEach((attempts, phone) => {
    const validAttempts = attempts.filter(time => (now - time) < windowMs);
    if (validAttempts.length === 0) {
      rateLimitStore.delete(phone);
    } else {
      rateLimitStore.set(phone, validAttempts);
    }
  });
}, 60 * 1000); // Run every minute
