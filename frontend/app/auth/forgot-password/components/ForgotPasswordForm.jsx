'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/api.js';
import logger from '@/lib/utils/logger.js';

function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState('request'); // 'request' or 'success'

  const validateForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', { email });

      if (response.data.status === 'success' || response.data.success) {
        setSuccessMessage('If your email is registered, you will receive password reset instructions shortly.');
        setEmail('');
        setStep('success');
      } else {
        setError(response.data.message || 'Failed to send password reset link');
      }
    } catch (err) {
      logger.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send password reset link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  // Success view
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-8">
        <div className="flex justify-center">
          <Image
            src="/Assets/Image/logo/pb-logo.png"
            alt="Product Bazar Logo"
            width={100}
            height={100}
            className="object-contain"
            quality={100}
            priority
          />
        </div>

        <div className="w-full space-y-6 text-center">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-primary">Check Your Email</h2>

          <p className="mt-2 text-sm text-secondary">
            {successMessage}
          </p>

          <div className="mt-6">
            <button
              onClick={handleBackToLogin}
              className="w-full py-2 bg-primary text-white font-semibold rounded-full hover:bg-accent transition duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Request form view
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-8">
      <div className="flex justify-center">
        <Image
          src="/Assets/Image/logo/pb-logo.png"
          alt="Product Bazar Logo"
          width={100}
          height={100}
          className="object-contain"
          quality={100}
          priority
        />
      </div>

      <div className="w-full space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary">Reset Your Password</h2>
          <p className="mt-2 text-sm text-secondary">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your@email.com"
              className={`mt-2 w-full px-4 py-2 border ${
                formErrors.email ? "border-red-500" : "border-border"
              } rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            {formErrors.email && (
              <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 bg-primary text-white font-semibold rounded-full hover:bg-accent transition duration-200 disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? (
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
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>
        </form>

        <div className="flex justify-center">
          <Link
            href="/auth/login"
            className="text-sm text-accent hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
