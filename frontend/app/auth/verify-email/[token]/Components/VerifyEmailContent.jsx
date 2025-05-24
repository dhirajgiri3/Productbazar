"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from "@/lib/contexts/auth-context";
import Link from 'next/link';

const VerifyEmailContent = ({ token }) => {
  const { verifyEmail, authLoading, error, user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState('loading');
  const [verificationError, setVerificationError] = useState('');
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        console.log("Starting email verification with token:", token ? `${token.substring(0, 5)}...` : 'missing');
        
        if (!token) {
          console.error("No verification token provided");
          setVerificationError("Verification token is missing");
          setVerificationStatus('error');
          return;
        }

        // Clean the token in case it has any URL encoding issues
        const cleanToken = decodeURIComponent(token).trim();
        console.log("Using cleaned token:", cleanToken.substring(0, 5) + "...");
        
        const result = await verifyEmail(cleanToken);
        console.log("Verification result:", result);
        
        if (result.success) {
          setVerificationStatus('success');
        } else {
          setVerificationError(result.message || error || "Verification failed. Please try again.");
          setVerificationStatus('error');
        }
      } catch (err) {
        console.error("Error during email verification:", err);
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
  }, [token, verifyEmail, error, verificationAttempted]);

  if (authLoading || (verificationStatus === 'loading' && !verificationAttempted)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <h2 className="text-xl font-medium text-gray-700">Verifying your email...</h2>
        <p className="mt-2 text-sm text-gray-500">This will only take a moment.</p>
      </div>
    );
  }

  if (verificationStatus === 'success' || (user && user.isEmailVerified)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
        <div className="bg-green-50 rounded-full p-4 mb-6">
          <svg className="h-16 w-16 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Email Verified Successfully!</h2>
        <p className="mt-2 text-center text-gray-600 max-w-md">
          Your email has been verified. You can now access all features of the app.
        </p>
        <div className="mt-8">
          {user?.isPhoneVerified === false && (
            <Link 
              href="/auth/verify-phone" 
              className="mr-4 px-6 py-2 bg-accent text-white rounded-full hover:bg-accent-dark transition-colors"
            >
              Verify Phone
            </Link>
          )}
          <Link 
            href="/products" 
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="bg-red-50 rounded-full p-4 mb-6">
        <svg className="h-16 w-16 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Verification Failed</h2>
      <p className="mt-2 text-center text-gray-600 max-w-md">
        {verificationError || error || 'We could not verify your email. The link may have expired or is invalid.'}
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link 
          href="/auth/login" 
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors"
        >
          Return to Login
        </Link>
        <Link 
          href="/auth/verify-email" 
          className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
        >
          Request New Verification
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailContent;