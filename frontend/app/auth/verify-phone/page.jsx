'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { usePhoneVerification } from '@/lib/hooks/usePhoneVerification';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Shield, 
  CheckCircle, 
  ArrowLeft, 
  AlertCircle,
  Smartphone,
  MessageSquare,
  RefreshCw,
  Loader2
} from 'lucide-react';
import ErrorMessage from 'Components/common/ErrorMessage';
import LoadingSpinner from 'Components/common/LoadingSpinner';

export default function VerifyPhone() {
  const { user, sendPhoneVerificationOtp, verifyPhoneOtp, error, authLoading, nextStep } =
    useAuth();
  const router = useRouter();

  // Phone verification hook
  const {
    isSubmitting,
    cooldown,
    formErrors,
    showSuccess,
    setFormErrors,
    setCooldown,
    setIsSubmitting,
    setShowSuccess,
    startCooldown,
    resetState,
    showSuccessMessage,
    formatPhoneForDisplay,
    validatePhone,
    validateOTP,
    handleWithValidation
  } = usePhoneVerification(
    // onSuccess callback
    (result) => {
      if (result.isVerified) {
        setTimeout(() => {
          router.push(`/user/${user.username}`);
        }, 1500);
      }
    },
    // onError callback
    (error) => {
      if (error?.rateLimited) {
        startCooldown(error.retryAfter || 60);
      }
    }
  );

  // Form state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneEditable, setIsPhoneEditable] = useState(false);

  // Auto-redirect if phone is already verified and no temp phone
  useEffect(() => {
    if (user?.isPhoneVerified && !user?.tempPhone && !nextStep?.type === 'phone_verification') {
      router.push(`/user/${user.username}`);
    }
  }, [user, nextStep, router]);

  // Handle cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => {
      // This is handled by the hook now
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async e => {
    e.preventDefault();
    if (cooldown > 0 || isSubmitting) return;

    setIsSubmitting(true);
    setFormErrors({});

    // Validate phone number
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setFormErrors({ phone: phoneError });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await sendPhoneVerificationOtp(phone);
      
      if (result?.success) {
        // If the response indicates the phone is already verified, redirect
        if (result.isVerified) {
          setShowSuccess(true);
          setTimeout(() => {
            router.push(`/user/${user.username}`);
          }, 1500);
          return;
        }

        setOtpSent(true);
        startCooldown(60); // 60 second cooldown
        
        // Clear any previous errors
        setFormErrors({});
        
        // Show success message briefly
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        // Handle specific error cases
        if (result?.rateLimited) {
          startCooldown(result.retryAfter || 60);
          setFormErrors({ 
            phone: `Rate limit exceeded. Please wait ${result.retryAfter || 60} seconds before trying again.` 
          });
        } else {
          setFormErrors({ 
            phone: result?.message || 'Failed to send verification code. Please try again.' 
          });
        }
      }
    } catch (error) {
      console.error('Send OTP failed:', error);
      setFormErrors({ 
        phone: 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async e => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormErrors({});

    // Validate OTP
    const otpError = validateOTP(otp);
    if (otpError) {
      setFormErrors({ otp: otpError });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await verifyPhoneOtp(phone, otp);

      if (result?.success) {
        // Show success state
        setShowSuccess(true);
        
        // Clear form
        setOtp('');
        setFormErrors({});
        
        // Redirect after showing success
        setTimeout(() => {
          router.push(`/user/${user.username}`);
        }, 1500);
      } else {
        // Handle specific error cases
        if (result?.expired) {
          setFormErrors({ 
            otp: 'Verification code has expired. Please request a new one.' 
          });
          setOtpSent(false);
          setOtp('');
        } else if (result?.invalid) {
          setFormErrors({ 
            otp: 'Invalid verification code. Please try again.' 
          });
          setOtp('');
        } else {
          setFormErrors({ 
            otp: result?.message || 'Verification failed. Please try again.' 
          });
        }
      }
    } catch (error) {
      console.error('Verify OTP failed:', error);
      setFormErrors({ 
        otp: 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;
    await handleSendOtp({ preventDefault: () => {} });
  };

  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp('');
    setFormErrors({});
    setIsPhoneEditable(true);
    resetState();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  const successVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    }
  };

  // Loading state
  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner size={8} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <motion.div
        className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Success Overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10"
              variants={successVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="text-center">
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {otpSent ? 'Phone Verified!' : 'Verification Code Sent!'}
                </h3>
                <p className="text-gray-600">
                  {otpSent ? 'Your phone number has been successfully verified.' : 'Check your phone for the verification code.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logo and Header */}
        <div className="text-center">
          <motion.div
            className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Smartphone className="w-8 h-8 text-white" />
          </motion.div>

          <motion.h1
            className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Verify Your Phone
          </motion.h1>

          <motion.p
            className="text-gray-600 text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {otpSent
              ? `Enter the 6-digit code sent to ${formatPhoneForDisplay(phone)}`
              : `We'll send a verification code to your phone number`}
          </motion.p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                otpSent ? 'bg-violet-600 text-white' : 'bg-violet-600 text-white'
              }`}>
                {otpSent ? <CheckCircle className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">Enter Phone</span>
            </div>

            <div className={`w-12 h-0.5 transition-all duration-300 ${
              otpSent ? 'bg-violet-600' : 'bg-gray-200'
            }`}></div>

            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                otpSent ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {otpSent ? <MessageSquare className="w-5 h-5" /> : '2'}
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">Verify Code</span>
            </div>
          </div>
        </div>

        {/* Global Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start space-x-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Verification Error</p>
                <p>{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Steps */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!otpSent ? (
              <motion.form
                key="phone-step"
                onSubmit={handleSendOtp}
                className="space-y-6"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-3">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-200 text-gray-800 placeholder-gray-400 ${
                        formErrors.phone 
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 bg-white focus:border-violet-500 focus:ring-violet-200'
                      } focus:ring-4 focus:ring-opacity-20 outline-none`}
                      required
                      disabled={isSubmitting || !isPhoneEditable}
                    />
                    {isSubmitting && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <Loader2 className="h-5 w-5 text-violet-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  <ErrorMessage error={formErrors.phone} />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting || cooldown > 0 || !phone.trim()}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Resend in {cooldown}s</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5" />
                      <span>Send Verification Code</span>
                    </>
                  )}
                </motion.button>

                {/* Help Text */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    You'll receive a 6-digit verification code via SMS
                  </p>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="otp-step"
                onSubmit={handleVerifyOtp}
                className="space-y-6"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-3">
                    Verification Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="otp"
                      placeholder="000000"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      className={`w-full px-6 py-5 rounded-xl border-2 text-center tracking-[0.5em] font-mono text-2xl transition-all duration-200 ${
                        formErrors.otp 
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 bg-white focus:border-violet-500 focus:ring-violet-200'
                      } focus:ring-4 focus:ring-opacity-20 outline-none`}
                      required
                      maxLength={6}
                      disabled={isSubmitting}
                      autoComplete="one-time-code"
                    />
                    {isSubmitting && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <Loader2 className="h-6 w-6 text-violet-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  <ErrorMessage error={formErrors.otp} />
                  
                  {/* Phone display */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{formatPhoneForDisplay(phone)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleChangeNumber}
                      className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                      disabled={isSubmitting}
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <motion.button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting || cooldown > 0}
                    className={`text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      cooldown > 0 || isSubmitting 
                        ? "text-gray-400 cursor-not-allowed" 
                        : "text-violet-600 hover:text-violet-700"
                    }`}
                    whileHover={cooldown <= 0 && !isSubmitting ? { scale: 1.05 } : {}}
                    whileTap={cooldown <= 0 && !isSubmitting ? { scale: 0.95 } : {}}
                  >
                    {cooldown > 0 ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Resend in {cooldown}s</span>
                      </>
                    ) : isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Resend Code</span>
                      </>
                    )}
                  </motion.button>

                  <div className="text-xs text-gray-500">
                    {otp.length}/6 digits
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting || otp.length < 6}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Verify Phone Number</span>
                    </>
                  )}
                </motion.button>

                {/* Help Text */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Didn't receive the code? Check your spam folder or try resending
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Footer Links */}
          <motion.div
            className="text-center pt-6 border-t border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <Link
                  href="/auth/login"
                  className="text-violet-600 hover:text-violet-700 font-medium transition-colors flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href="/auth/register"
                  className="text-gray-600 hover:text-gray-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
              
              <div className="text-xs text-gray-500">
                Having trouble? <Link href="/support" className="text-violet-600 hover:text-violet-700">Contact Support</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
