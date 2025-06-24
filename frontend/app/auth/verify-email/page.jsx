"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, XCircle, RefreshCw } from 'lucide-react';

// Custom hook to extract token from URL when the page is loaded via email verification link
const useVerificationToken = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  // URL may have token in path or query parameters
  // Check URL path if the token is part of a route like /verify-email/TOKEN
  const router = useRouter();
  const pathname = router.pathname;
  
  useEffect(() => {
    // If token is in URL path, extract it
    if (!token && pathname.includes('/verify-email/')) {
      const pathSegments = pathname.split('/');
      const pathToken = pathSegments[pathSegments.length - 1];
      if (pathToken && pathToken !== 'verify-email') {
        // Here we would set the token, but since this is a custom hook
        // we'd return it and let the component handle it
        return pathToken;
      }
    }
  }, [pathname, token]);
  
  return token;
};

const VerifyEmailPage = () => {
  const { user, resendEmailVerification, verifyEmail, authLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', or null
  const router = useRouter();
  const searchParams = useSearchParams();
  const intervalRef = useRef(null);
  const emailInputRef = useRef(null);
  const urlToken = searchParams.get('token');
  const [token, setToken] = useState(urlToken);

  useEffect(() => {
    // Handle token verification if present in URL
    const handleTokenVerification = async () => {
      if (token) {
        setIsVerifying(true);
        try {
          const result = await verifyEmail(token);
          if (result.success) {
            setVerificationStatus('success');
            setIsVerified(true);
            // Wait 3 seconds before redirecting to profile
            setTimeout(() => {
              router.push(`/user/${result.user?.username || ''}`);
            }, 3000);
          } else {
            setVerificationStatus('error');
            setErrorMessage(result.message || 'Verification failed. The link may be expired or invalid.');
          }
        } catch (err) {
          setVerificationStatus('error');
          setErrorMessage(err.message || 'An error occurred during verification.');
        } finally {
          setIsVerifying(false);
        }
      }
    };

    // Pre-fill with user email if available
    if (user?.email) {
      setEmail(user.email);
    }

    // Focus email input if empty and not in verification mode
    if (emailInputRef.current && !email && !token) {
      emailInputRef.current.focus();
    }

    // Check if user is already verified
    if (user?.isEmailVerified && !token) {
      setIsAlreadyVerified(true);
      // Only redirect if not in token verification flow
      if (!verificationStatus) {
        // Allow user to see the already verified message for 3 seconds
        setTimeout(() => {
          router.push(`/user/${user.username}`);
        }, 3000);
      }
    }

    // Run token verification if present
    if (token && !verificationStatus) {
      handleTokenVerification();
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, router, email, token, verificationStatus, verifyEmail]);

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
      // Check if email matches the current user's email
      if (user?.email && email.toLowerCase() !== user.email.toLowerCase()) {
        setErrorMessage('Please use the email associated with your account or log in with the new email');
        setIsSubmitting(false);
        return;
      }

      const response = await resendEmailVerification(email);
      
      if (response.success) {
        setSuccess(true);
        startCooldown();
        // Clear any previous errors
        setErrorMessage('');
      } else {
        // Handle specific error scenarios
        if (response.message?.includes('already verified')) {
          setIsAlreadyVerified(true);
        } else {
          setErrorMessage(response.message || 'Failed to send verification email');
        }
      }
    } catch (err) {
      // Handle different error types with friendly messages
      if (err.message?.includes('rate limit') || err.message?.includes('too many')) {
        setErrorMessage('You have requested too many verification emails. Please wait before trying again.');
      } else if (err.message?.includes('not found') || err.message?.includes('no account')) {
        setErrorMessage('No account found with this email address. Please check your email or create a new account.');
      } else if (err.message?.includes('already verified')) {
        setIsAlreadyVerified(true);
      } else {
        setErrorMessage(err.message || 'An unexpected error occurred');
      }
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
            {token 
              ? 'Verifying Your Email' 
              : isAlreadyVerified 
                ? 'Email Verified' 
                : 'Verify Your Email'}
          </h2>
          <p className="text-gray-600">
            {token 
              ? 'Please wait while we verify your email address...' 
              : isAlreadyVerified 
                ? 'Your email has been successfully verified'
                : "We'll send a verification link to your email address"}
          </p>
        </motion.div>

        {/* Step Indicator - Show only when not verifying with token */}
        {!token && !isAlreadyVerified && (
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
        )}

        <motion.div
          className="bg-white py-8 px-6 shadow-xl sm:rounded-2xl border border-gray-100"
          variants={itemVariants}
        >
          {/* Token Verification Status */}
          <AnimatePresence>
            {token && (
              <div className="text-center">
                {isVerifying ? (
                  <motion.div
                    className="mb-6 p-6 flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Verifying your email</h3>
                    <p className="text-sm text-gray-500">Please wait while we confirm your email address</p>
                  </motion.div>
                ) : verificationStatus === 'success' ? (
                  <motion.div
                    className="mb-6 p-6"
                    variants={successVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 mb-4"
                    >
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </motion.div>
                    <h3 className="text-xl font-medium text-green-800 mb-2">Email Verified Successfully!</h3>
                    <p className="text-sm text-green-700 mb-4">
                      Your email has been verified. You will be redirected to your profile shortly.
                    </p>
                    <Link href="/user/profile">
                      <motion.button
                        variants={buttonVariants}
                        initial="idle"
                        whileHover="hover"
                        whileTap="tap"
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 inline-flex items-center space-x-2"
                      >
                        <span>Go to Profile</span>
                      </motion.button>
                    </Link>
                  </motion.div>
                ) : verificationStatus === 'error' ? (
                  <motion.div
                    className="mb-6 p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-medium text-red-800 mb-2">Verification Failed</h3>
                    <p className="text-sm text-red-700 mb-4">
                      {errorMessage || "The verification link may be expired or invalid."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href="/auth/login">
                        <motion.button
                          variants={buttonVariants}
                          initial="idle"
                          whileHover="hover"
                          whileTap="tap"
                          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center space-x-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to Login</span>
                        </motion.button>
                      </Link>
                      <motion.button
                        variants={buttonVariants}
                        initial="idle"
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => setToken(null)}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Try Again</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ) : null}
              </div>
            )}
          </AnimatePresence>

          {/* Already Verified Message */}
          <AnimatePresence>
            {isAlreadyVerified && !token && (
              <motion.div
                className="mb-6 p-6 text-center"
                variants={successVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 mb-4"
                >
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </motion.div>
                <h3 className="text-xl font-medium text-green-800 mb-2">Email Already Verified</h3>
                <p className="text-sm text-green-700 mb-4">
                  Your email has already been verified. You can now access all features.
                </p>
                <Link href={user?.username ? `/user/${user.username}` : "/products"}>
                  <motion.button
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all duration-200 inline-flex items-center space-x-2"
                  >
                    <span>Continue to Profile</span>
                  </motion.button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Success Message - Only show when not in token verification mode */}
          <AnimatePresence>
            {success && !token && !isAlreadyVerified && (
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

          {/* Error Message - Only show when not in token verification mode */}
          <AnimatePresence>
            {(error || errorMessage) && !token && !isAlreadyVerified && (
              <motion.div
                className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{errorMessage || error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Input Form - Only show when not in token verification mode and not already verified */}
          {!token && !isAlreadyVerified && (
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
          )}

          {/* Return to Login Link - Show for all states */}
          <div className={`${!token && !isAlreadyVerified ? 'mt-8' : 'mt-4'}`}>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  {token ? 'Need assistance?' : isAlreadyVerified ? 'Go to app' : 'Already verified?'}
                </span>
              </div>
            </div>

            <motion.div
              className="mt-6 flex justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={isAlreadyVerified ? "/products" : "/auth/login"}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg hover:bg-primary/5"
              >
                {isAlreadyVerified ? 'Discover Products' : 'Return to Login'}
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer Help Text - Only show for email verification request mode */}
        {!token && !isAlreadyVerified && (
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
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;