"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter} from "next/navigation";
import Link from "next/link";

export default function VerifyPhone() {
  const { user, sendPhoneVerificationOtp, verifyPhoneOtp, error, authLoading, nextStep } = useAuth();
  const router = useRouter();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [formErrors, setFormErrors] = useState({});

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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (cooldown > 0) return;
    
    setFormErrors({});
    
    // Simple phone validation
    if (!phone || phone.trim() === '') {
      setFormErrors({ phone: 'Phone number is required' });
      return;
    }
    
    const success = await sendPhoneVerificationOtp(phone);
    if (success) {
      // If the response indicates the phone is already verified, redirect to appropriate page
      if (success.isVerified) {
        router.push('/user');
        return;
      }
      
      setOtpSent(true);
      setCooldown(60); // 60 second cooldown
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    setFormErrors({});
    
    // OTP validation
    if (!otp || otp.length < 4) {
      setFormErrors({ otp: 'Please enter a valid OTP code' });
      return;
    }
    
    await verifyPhoneOtp(phone, otp);
  };

  // If user phone is verified, redirect
  useEffect(() => {
    // Check if this is the same phone number that requires verification
    if (user?.isPhoneVerified) {
      // If user has a tempPhone set, they're trying to change their phone number
      if (!user.tempPhone) {
        router.push('/user');
      }
    }
  }, [user, nextStep, router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <Image
            src="/Assets/Image/logo/pb-logo.png"
            alt="Product Bazar Logo"
            width={80}
            height={80}
            className="mx-auto"
            quality={100}
            priority
          />
          <h2 className="mt-6 text-3xl font-bold text-primary">Verify Your Phone</h2>
          {phone && (
            <p className="mt-2 text-gray-600">
              {otpSent 
                ? `Enter the verification code sent to ${phone}`
                : `We'll send a verification code to ${phone}`
              }
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input 
                  type="tel"
                  id="phone"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`mt-1 block w-full px-4 py-2 border ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:ring-primary focus:border-primary`}
                  required
                  disabled={authLoading}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={authLoading || cooldown > 0}
                className="w-full py-2 bg-primary text-white font-semibold rounded-full hover:bg-accent transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input 
                  type="text"
                  id="otp"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`mt-1 block w-full px-4 py-2 border ${
                    formErrors.otp ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:ring-primary focus:border-primary`}
                  required
                  maxLength={6}
                  pattern="\d*"
                  disabled={authLoading}
                />
                {formErrors.otp && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.otp}</p>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  className="text-sm text-primary hover:underline"
                  disabled={authLoading}
                >
                  Change Number
                </button>
                
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={authLoading || cooldown > 0}
                  className="text-sm text-primary hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
              
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2 bg-primary text-white font-semibold rounded-full hover:bg-accent transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify Phone'
                )}
              </button>
            </form>
          )}
          
          <div className="text-center">
            <Link href="/auth/login" className="text-accent hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
