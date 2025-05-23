// utils/phone.utils.js

/**
 * Normalizes a phone number to E.164 format
 * Handles international phone numbers with more focus on Indian numbers (+91)
 */
export const normalizePhone = (phoneNumber) => {
  if (!phoneNumber) return null;

  // Remove all non-digit characters except the leading +
  const hasPlus = phoneNumber.startsWith('+');
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Handle different cases

  // Case 1: Indian mobile number (10 digits starting with 6-9)
  // Can have optional +91 or 91 prefix
  const indianMatch = cleaned.match(/^(?:91)?([6-9]\d{9})$/);
  if (indianMatch) {
    return `+91${indianMatch[1]}`;
  }

  // Case 2: International number with country code
  // If it starts with a plus, assume it's already in E.164 format
  if (hasPlus && cleaned.length >= 10 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }

  // Case 3: Number without country code but with sufficient digits (assume it's valid)
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    // If it starts with a country code (1-3 digits), keep it as is
    // Otherwise, default to Indian code for backward compatibility
    if (cleaned.length > 10) {
      return `+${cleaned}`;
    } else {
      // For 10-digit numbers without country code, default to Indian +91
      return `+91${cleaned}`;
    }
  }

  // If we can't normalize it, return null
  return null;
};

/**
 * Validates if a phone number is valid
 * Supports international numbers with focus on Indian numbers
 */
export const isValidPhone = (phoneNumber) => {
  if (!phoneNumber) return false;
  return normalizePhone(phoneNumber) !== null;
};

/**
 * Validates if a phone number is a valid Indian mobile number
 * @deprecated Use isValidPhone instead for broader compatibility
 */
export const isValidIndianPhone = (phoneNumber) => {
  if (!phoneNumber) return false;
  const normalized = normalizePhone(phoneNumber);
  return normalized !== null && normalized.startsWith('+91');
};

/**
 * Masks a phone number for display, showing only the last 4 digits
 */
export const maskPhone = (phoneNumber) => {
  if (!phoneNumber) return '';
  const normalized = normalizePhone(phoneNumber);
  if (!normalized) return phoneNumber; // Return original if can't normalize

  // Show only last 4 digits
  return normalized.replace(/^(\+\d+)?(\d+)(\d{4})$/, '••••••$3');
};
