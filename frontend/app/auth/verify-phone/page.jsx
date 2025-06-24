'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Shield, CheckCircle, ArrowLeft } from 'lucide-react';

export default function VerifyPhone() {
  const { user, sendPhoneVerificationOtp, verifyPhoneOtp, error, authLoading, nextStep } =
    useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set phone from user data or next step data
  useEffect(() => {
    if (user?.tempPhone) {
      setPhone(user.tempPhone);
    } else if (user?.phone) {
      setPhone(user.phone);
    } else if (nextStep?.data?.phone) {
      setPhone(nextStep.data.phone);
    }
  }, [user, nextStep]);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => {
      setCooldown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async e => {
    e.preventDefault();
    if (cooldown > 0 || isSubmitting) return;

    setIsSubmitting(true);
    setFormErrors({});

    // Simple phone validation
    if (!phone || phone.trim() === '') {
      setFormErrors({ phone: 'Phone number is required' });
      setIsSubmitting(false);
      return;
    }

    try {
      const success = await sendPhoneVerificationOtp(phone);
      if (success) {
        // If the response indicates the phone is already verified, redirect to appropriate page
        if (success.isVerified) {
          router.push(`/user/${user.username}`);
          return;
        }

        setOtpSent(true);
        setCooldown(60); // 60 second cooldown
      }
    } catch (error) {
      console.error('Send OTP failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async e => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormErrors({});

    // OTP validation
    if (!otp || otp.length < 4) {
      setFormErrors({ otp: 'Please enter a valid OTP code' });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await verifyPhoneOtp(phone, otp);

      if (result.success) {
        // Successful verification - redirect to appropriate page
        router.push(`/user/${user.username}`);
      }
    } catch (error) {
      console.error('Verify OTP failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user phone is verified, redirect
  useEffect(() => {
    // Check if this is the same phone number that requires verification
    if (user?.isPhoneVerified) {
      // If user has a tempPhone set, they're trying to change their phone number
      if (!user.tempPhone) {
        router.push(`/user/${user.username}`);
      }
    }
  }, [user, nextStep, router]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <motion.div
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo and Header */}
        <div className="text-center">
          <motion.div
            className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-2xl font-bold text-white">PB</span>
          </motion.div>

          <motion.h2
            className="text-3xl font-bold text-primary mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Verify Your Phone
          </motion.h2>

          {phone && (
            <motion.p
              className="text-gray-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {otpSent
                ? `Enter the verification code sent to ${phone}`
                : `We'll send a verification code to ${phone}`}
            </motion.p>
          )}
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                otpSent ? 'bg-primary text-white' : 'bg-primary text-white'
              }`}>
                {otpSent ? <CheckCircle className="w-4 h-4" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600">Phone</span>
            </div>

            <div className={`w-8 h-0.5 transition-all duration-300 ${
              otpSent ? 'bg-primary' : 'bg-gray-200'
            }`}></div>

            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                otpSent ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600">Verify</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center space-x-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Shield className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
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
                className="space-y-4"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                        formErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all duration-200`}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <AnimatePresence>
                    {formErrors.phone && (
                      <motion.p
                        className="mt-2 text-sm text-red-600 flex items-center space-x-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <span>⚠️</span>
                        <span>{formErrors.phone}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting || cooldown > 0 || !phone.trim()}
                  className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:shadow-none"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Resend in {cooldown}s</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <Phone className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-step"
                onSubmit={handleVerifyOtp}
                className="space-y-4"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="otp"
                    placeholder="000000"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className={`w-full px-4 py-4 rounded-lg border text-center tracking-widest font-mono text-xl ${
                      formErrors.otp ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all duration-200`}
                    required
                    maxLength={6}
                    disabled={isSubmitting}
                  />
                  <AnimatePresence>
                    {formErrors.otp && (
                      <motion.p
                        className="mt-2 text-sm text-red-600 flex items-center space-x-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <span>⚠️</span>
                        <span>{formErrors.otp}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex justify-between items-center">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setFormErrors({});
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center space-x-1"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change Number</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSubmitting || cooldown > 0}
                    className={`text-sm font-medium transition-colors ${
                      cooldown > 0 ? "text-gray-400 cursor-not-allowed" : "text-primary hover:text-primary/80"
                    }`}
                    whileHover={cooldown <= 0 ? { scale: 1.05 } : {}}
                    whileTap={cooldown <= 0 ? { scale: 0.95 } : {}}
                  >
                    {cooldown > 0 ? (
                      <span className="flex items-center space-x-1">
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Resend in {cooldown}s</span>
                      </span>
                    ) : (
                      'Resend Code'
                    )}
                  </motion.button>
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting || otp.length < 4}
                  className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:shadow-none"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Phone</span>
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              href="/auth/login"
              className="text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Back to Login
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
