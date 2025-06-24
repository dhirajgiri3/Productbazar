import { useState, useCallback } from 'react';

export const usePhoneVerification = (onSuccess, onError) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Format phone number for display
  const formatPhoneForDisplay = useCallback((phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
      // US format: (XXX) XXX-XXXX
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length > 10) {
      // International format with country code
      const countryCode = cleaned.slice(0, -10);
      const number = cleaned.slice(-10);
      return `+${countryCode} (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    
    return phoneNumber;
  }, []);

  // Validate phone number
  const validatePhone = useCallback((phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return 'Phone number is required';
    }
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      return 'Please enter a valid phone number';
    }
    
    // Additional validation for international numbers
    if (cleaned.length > 15) {
      return 'Phone number is too long';
    }
    
    return null;
  }, []);

  // Validate OTP
  const validateOTP = useCallback((otpCode) => {
    if (!otpCode || otpCode.trim() === '') {
      return 'Please enter the verification code';
    }
    
    if (otpCode.length < 6) {
      return `Verification code must be 6 digits (${otpCode.length}/6)`;
    }
    
    if (!/^\d{6}$/.test(otpCode)) {
      return 'Verification code must contain only numbers';
    }
    
    return null;
  }, []);

  // Handle form submission with validation
  const handleWithValidation = useCallback(async (validationFn, value, asyncFn) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormErrors({});

    const error = validationFn(value);
    if (error) {
      setFormErrors({ [typeof value === 'string' && value.includes('@') ? 'email' : 'phone']: error });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await asyncFn();
      
      if (result?.success) {
        setShowSuccess(true);
        setFormErrors({});
        onSuccess?.(result);
      } else {
        const errorKey = value.includes('@') ? 'email' : (value.length <= 6 ? 'otp' : 'phone');
        setFormErrors({ [errorKey]: result?.message || 'Operation failed. Please try again.' });
        onError?.(result);
      }
    } catch (error) {
      console.error('Operation failed:', error);
      const errorKey = value.includes('@') ? 'email' : (value.length <= 6 ? 'otp' : 'phone');
      setFormErrors({ [errorKey]: 'An unexpected error occurred. Please try again.' });
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSuccess, onError]);

  // Start cooldown timer
  const startCooldown = useCallback((seconds = 60) => {
    setCooldown(seconds);
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Clear all errors and states
  const resetState = useCallback(() => {
    setFormErrors({});
    setIsSubmitting(false);
    setShowSuccess(false);
    setCooldown(0);
  }, []);

  // Show success state temporarily
  const showSuccessMessage = useCallback((duration = 3000) => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), duration);
  }, []);

  return {
    // State
    isSubmitting,
    cooldown,
    formErrors,
    showSuccess,
    
    // Actions
    setFormErrors,
    setCooldown,
    setIsSubmitting,
    setShowSuccess,
    startCooldown,
    resetState,
    showSuccessMessage,
    
    // Utilities
    formatPhoneForDisplay,
    validatePhone,
    validateOTP,
    handleWithValidation,
  };
};
