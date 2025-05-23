"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const VerifyEmailTokenPage = ({ params }) => {
  const { token } = params;
  const { verifyEmail, user, authLoading, error } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState('loading');
  const [verificationError, setVerificationError] = useState('');
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const confettiCanvasRef = useRef(null);
  const router = useRouter();
  
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
    if (user?.isEmailVerified && verificationStatus === 'loading') {
      setVerificationStatus('success');
    }
  }, [token, verifyEmail, error, verificationAttempted, user]);

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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Hidden canvas for confetti */}
      <canvas 
        ref={confettiCanvasRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
      />
      
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "24px 24px"
        }}></div>
      </div>
      
      <AnimatePresence mode="wait">
        {verificationStatus === 'loading' && !verificationAttempted && (
          <motion.div
            key="loading"
            className="sm:mx-auto sm:w-full sm:max-w-md z-10"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <motion.div 
              className="bg-white py-10 px-6 shadow-lg sm:rounded-lg border border-gray-100 text-center"
              variants={itemVariants}
            >
              <motion.div
                className="flex flex-col items-center justify-center"
                variants={itemVariants}
              >
                <div className="w-16 h-16 mb-4 relative">
                  <motion.div
                    className="w-16 h-16 border-t-4 border-primary border-solid rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Your Email</h2>
                <p className="text-gray-600">Please wait while we verify your email address...</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {verificationStatus === 'success' && (
          <motion.div
            key="success"
            className="sm:mx-auto sm:w-full sm:max-w-md z-10"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <motion.div 
              className="bg-white py-10 px-6 shadow-lg sm:rounded-lg border border-gray-100 text-center"
              variants={itemVariants}
            >
              <motion.div 
                className="bg-green-50 rounded-full mx-auto p-4 w-24 h-24 flex items-center justify-center mb-6"
                variants={iconVariants}
              >
                <svg className="h-14 w-14 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <motion.h2 className="text-2xl font-bold text-gray-800 mb-2" variants={itemVariants}>
                Email Verified Successfully!
              </motion.h2>
              <motion.p className="text-gray-600 mb-8" variants={itemVariants}>
                Your email has been verified. You can now access all features of Product Bazar.
              </motion.p>
              <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={itemVariants}>
                {user?.isPhoneVerified === false && (
                  <motion.div
                    variants={linkVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Link 
                      href="/auth/verify-phone" 
                      className="px-6 py-2 bg-accent text-white rounded-full hover:bg-accent-dark transition-colors shadow-md flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Verify Phone Number
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
                    href="/user" 
                    className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors shadow-md flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    Go to Dashboard
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {verificationStatus === 'error' && (
          <motion.div
            key="error"
            className="sm:mx-auto sm:w-full sm:max-w-md z-10"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <motion.div 
              className="bg-white py-10 px-6 shadow-lg sm:rounded-lg border border-gray-100 text-center"
              variants={itemVariants}
            >
              <motion.div 
                className="bg-red-50 rounded-full mx-auto p-4 w-24 h-24 flex items-center justify-center mb-6"
                variants={iconVariants}
              >
                <svg className="h-14 w-14 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors shadow-md flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                    </svg>
                    Return to Login
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
                    className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors shadow-md flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Request New Verification
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
