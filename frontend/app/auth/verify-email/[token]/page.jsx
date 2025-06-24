"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from "@/lib/contexts/auth-context";
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react';

const VerifyEmailTokenPage = () => {
  const { token } = useParams();
  const { verifyEmail, user, authLoading, error, nextStep } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState('loading');
  const [verificationError, setVerificationError] = useState('');
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const confettiCanvasRef = useRef(null);

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        if (!token) {
          setVerificationError("Verification token is missing");
          setVerificationStatus('error');
          return;
        }

        // Clean the token in case it has any URL encoding issues
        const cleanToken = decodeURIComponent(token).trim();

        const result = await verifyEmail(cleanToken);

        if (result.success) {
          setVerificationStatus('success');
          // Trigger confetti effect after successful verification
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              import('canvas-confetti').then(confetti => {
                const canvas = confettiCanvasRef.current;
                if (canvas) {
                  const myConfetti = confetti.create(canvas, {
                    resize: true,
                    useWorker: true
                  });

                  myConfetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                  });
                }
              }).catch(() => {
                // Silently ignore if confetti fails to load
              });
            }
          }, 500);
        } else {
          setVerificationError(result.message || error || "Verification failed. Please try again.");
          setVerificationStatus('error');
        }
      } catch (err) {
        setVerificationError(err.message || "An unexpected error occurred during verification");
        setVerificationStatus('error');
      } finally {
        setVerificationAttempted(true);
      }
    };

    if (token && !verificationAttempted) {
      verifyEmailToken();
    } else if (!token) {
      setVerificationError("Verification token is missing");
      setVerificationStatus('error');
    }

    // If user is already verified and tries to verify again, show success message
    if (user?.isEmailVerified && verificationStatus === 'loading' && !nextStep) {
      setVerificationStatus('success');
    }
  }, [token, verifyEmail, error, verificationAttempted, user, nextStep]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10,
        delay: 0.2
      }
    }
  };

  const linkVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
    tap: { scale: 0.95 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Hidden canvas for confetti */}
      <canvas
        ref={confettiCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
      />

      {/* Logo */}
      <motion.div
        className="text-center mb-8 z-20 relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <span className="text-2xl font-bold text-white">PB</span>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {verificationStatus === 'loading' && !verificationAttempted && (
          <motion.div
            key="email-verification-loading"
            className="sm:mx-auto sm:w-full sm:max-w-md z-20"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <motion.div
              className="bg-white py-10 px-6 shadow-xl sm:rounded-2xl border border-gray-100 text-center"
              variants={itemVariants}
            >
              <motion.div
                className="flex flex-col items-center justify-center"
                variants={itemVariants}
              >
                <div className="w-16 h-16 mb-6 relative">
                  <motion.div
                    className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Your Email</h2>
                <p className="text-gray-600">Please wait while we verify your email address...</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {verificationStatus === 'success' && (
          <motion.div
            key="email-verification-success"
            className="sm:mx-auto sm:w-full sm:max-w-md z-20"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <motion.div
              className="bg-white py-10 px-6 shadow-xl sm:rounded-2xl border border-gray-100 text-center"
              variants={itemVariants}
            >
              <motion.div
                className="bg-green-50 rounded-full mx-auto p-4 w-24 h-24 flex items-center justify-center mb-6"
                variants={iconVariants}
              >
                <CheckCircle className="h-14 w-14 text-green-500" />
              </motion.div>
              <motion.h2 className="text-2xl font-bold text-gray-800 mb-2" variants={itemVariants}>
                Email Verified Successfully!
              </motion.h2>
              <motion.p className="text-gray-600 mb-8" variants={itemVariants}>
                Your email has been verified. You can now access all features of the app.
              </motion.p>
              <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={itemVariants}>
                {user?.isPhoneVerified === false && nextStep?.type !== 'phone_verification' && (
                  <motion.div
                    variants={linkVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Link
                      href="/auth/verify-phone"
                      className="px-6 py-3 bg-gradient-to-r from-accent to-accent/90 text-white rounded-lg hover:from-accent/90 hover:to-accent/80 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      <Mail className="w-5 h-5" />
                      <span>Verify Phone Number</span>
                    </Link>
                  </motion.div>
                )}
                <motion.div
                  variants={linkVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link
                    href="/products"
                    className="px-6 py-3 bg-gradient-to-r from-primary to-primary text-white rounded-lg hover:from-primary/90 hover:to-primary/80 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <span>Go to Homepage</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {verificationStatus === 'error' && (
          <motion.div
            key="email-verification-error"
            className="sm:mx-auto sm:w-full sm:max-w-md z-20"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <motion.div
              className="bg-white py-10 px-6 shadow-xl sm:rounded-2xl border border-gray-100 text-center"
              variants={itemVariants}
            >
              <motion.div
                className="bg-red-50 rounded-full mx-auto p-4 w-24 h-24 flex items-center justify-center mb-6"
                variants={iconVariants}
              >
                <XCircle className="h-14 w-14 text-red-500" />
              </motion.div>
              <motion.h2 className="text-2xl font-bold text-gray-800 mb-2" variants={itemVariants}>
                Verification Failed
              </motion.h2>
              <motion.p className="text-gray-600 mb-8" variants={itemVariants}>
                {verificationError || error || 'We could not verify your email. The link may have expired or is invalid.'}
              </motion.p>
              <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={itemVariants}>
                <motion.div
                  variants={linkVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link
                    href="/auth/login"
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                    <span>Return to Login</span>
                  </Link>
                </motion.div>
                <motion.div
                  variants={linkVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link
                    href="/auth/verify-email"
                    className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary/80 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Request New Verification</span>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerifyEmailTokenPage;
