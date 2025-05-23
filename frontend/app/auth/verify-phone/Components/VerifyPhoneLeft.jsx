"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import Image from "next/image";
import Loader from "../../../../components/common/Loader";

const VerifyPhoneLeft = ({ phone, onVerify }) => {
  const { user, authLoading, error, requestPhoneVerification, verifyPhone } =
    useAuth();

  const [otp, setOtp] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(120); // Updated to 120 seconds (2 minutes)
  const [formErrors, setFormErrors] = useState({ phone: "", otp: "" });
  const [currentStep, setCurrentStep] = useState(1); // 1 for phone entry, 2 for OTP verification

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;

    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Function to handle requesting OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setFormErrors({ phone: "", otp: "" });

    // Simple phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      setFormErrors({ phone: "Invalid phone number format." });
      return;
    }

    try {
      const success = await requestPhoneVerification(phone);
      if (success) {
        setOtpCountdown(120); // Updated to 120 seconds
      }
    } catch (error) {
      console.error("Send OTP failed:", error);
    }
  };

  // Function to handle verifying OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFormErrors({ phone: "", otp: "" });

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setFormErrors({ otp: "OTP must be a 6-digit number." });
      return;
    }

    await verifyPhone(phone, otp);
  };

  // Function to handle resending OTP
  const handleResendOtp = async () => {
    try {
      const success = await requestPhoneVerification(phone);
      if (success) setOtpCountdown(120); // Updated to 120 seconds
    } catch (error) {
      console.error("Resend OTP failed:", error);
    }
  };

  const handleBackToPhone = () => {
    setCurrentStep(1);
  };

  // Render loading overlay if authLoading is true
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-primary/80 font-medium">Verifying...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-6 py-10">
      <div className="mb-8 text-center">
        <Image
          src="/Assets/Image/logo/pb-logo.png"
          alt="Product Bazar Logo"
          width={80}
          height={80}
          className="mx-auto mb-6"
          priority
        />
        
        <h1 className="text-2xl font-bold text-gray-800">
          {currentStep === 1 ? 'Verify Your Phone' : 'Enter Verification Code'}
        </h1>
        
        <p className="text-gray-500 mt-2 text-sm">
          {currentStep === 1 
            ? "We'll send a verification code to this number"
            : `Code sent to ${phone}`}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
          {error}
        </div>
      )}

      {currentStep === 1 ? (
        <form onSubmit={handleRequestOtp} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              placeholder="+919904392992"
              className={`w-full px-4 py-3 rounded-lg border ${
                formErrors.phone ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {formErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            Continue
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              id="otp"
              placeholder="000000"
              maxLength={6}
              className={`w-full px-4 py-3 rounded-lg border text-center tracking-widest font-mono text-lg ${
                formErrors.otp ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all`}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            />
            {formErrors.otp && (
              <p className="mt-1 text-sm text-red-600">{formErrors.otp}</p>
            )}
            
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                className={`text-sm ${
                  otpCountdown > 0 ? "text-gray-400" : "text-primary hover:text-primary/80"
                }`}
                onClick={handleResendOtp}
                disabled={otpCountdown > 0}
              >
                {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend code"}
              </button>
              
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={handleBackToPhone}
              >
                Change number
              </button>
            </div>
          </div>

          <button
            onClick={handleVerifyOtp}
            className="w-full py-3 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            Verify
          </button>
        </div>
      )}
    </div>
  );
}

export default VerifyPhoneLeft;
