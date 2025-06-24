"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle } from 'lucide-react';

const VerifyEmailPage = () => {
  const { user, resendEmailVerification, authLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const intervalRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    // Pre-fill with user email if available
    if (user?.email) {
      setEmail(user.email);
    }

    // Focus email input if empty
    if (emailInputRef.current && !email) {
      emailInputRef.current.focus();
    }

    // Check if user is already verified
    if (user?.isEmailVerified) {
      router.push(`/user/${user.username}`);
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, router, email]);

  const startCooldown = () => {
    setCooldown(60); // 60 seconds cooldown
    intervalRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting || cooldown > 0) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccess(false);

    try {
      const { success, message } = await resendEmailVerification(email);

      if (success) {
        setSuccess(true);
        startCooldown();
      } else {
        setErrorMessage(message || 'Failed to send verification email');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const successVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
    tap: { scale: 0.95 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Logo and Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-2xl font-bold text-white">PB</span>
          </motion.div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600">
            We'll send a verification link to your email address
          </p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-primary text-white">
                <Mail className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600">Email</span>
            </div>

            <div className="w-8 h-0.5 bg-gray-200"></div>

            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-200 text-gray-500">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600">Verify</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white py-8 px-6 shadow-xl sm:rounded-2xl border border-gray-100"
          variants={itemVariants}
        >
          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-center"
                variants={successVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-green-100 mb-3"
                >
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </motion.div>
                <h3 className="text-sm font-medium text-green-800">Verification email sent!</h3>
                <p className="mt-2 text-xs text-green-700">
                  Please check your inbox at <span className="font-medium">{email}</span> and click the verification link.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {(error || errorMessage) && (
              <motion.div
                className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Mail className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{errorMessage || error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  ref={emailInputRef}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || cooldown > 0}
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all duration-200 text-gray-800 bg-white"
                  placeholder="you@example.com"
                />
                <AnimatePresence>
                  {email && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setEmail('')}
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <motion.button
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                type="submit"
                disabled={isSubmitting || cooldown > 0 || !email.trim()}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:shadow-none"
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
                    <span>Send Verification Email</span>
                    <Mail className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Already verified?
                </span>
              </div>
            </div>

            <motion.div
              className="mt-6 flex justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/auth/login"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg hover:bg-primary/5"
              >
                Return to Login
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="mt-6 text-center text-sm text-gray-500"
          variants={itemVariants}
        >
          <p className="leading-relaxed">
            Didn't receive the email? Check your spam folder or{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              try another email
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;