"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";

function ResetPasswordForm({ token }) {
  const router = useRouter();
  const { resetPassword, authLoading, error } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const validateForm = () => {
    const errors = {};

    // Password validation
    if (!password) {
      errors.password = "Password is required";
    }
    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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
    const success = await resetPassword(password, token);
    if (success) {
      setSuccessMessage("Your password has been reset successfully.");
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    }
  };

  const renderPasswordStrengthIndicator = () => {
    if (!password) return null;

    let strength = 0;
    const indicators = [
      { regex: /.{8,}/, text: "Length (min 8)" },
      { regex: /[A-Z]/, text: "Uppercase" },
      { regex: /[a-z]/, text: "Lowercase" },
      { regex: /[0-9]/, text: "Number" },
      { regex: /[^A-Za-z0-9]/, text: "Special char" },
    ];

    const checks = indicators.map((item) => {
      const valid = item.regex.test(password);
      if (valid) strength++;
      return { ...item, valid };
    });

    const strengthPercentage = (strength / indicators.length) * 100;
    let strengthClass = "bg-red-500";
    if (strengthPercentage >= 60) strengthClass = "bg-yellow-500";
    if (strengthPercentage === 100) strengthClass = "bg-green-500";

    return (
      <div className="mt-1">
        <div className="h-1.5 w-full bg-gray-200 rounded-full">
          <div
            className={`h-1.5 rounded-full ${strengthClass}`}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {checks.map((check, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-0.5 rounded ${
                check.valid
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {check.text}
            </span>
          ))}
        </div>
      </div>
    );
  };

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
          <h2 className="text-2xl font-bold text-primary">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Create a new strong password for your account
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-secondary"
            >
              New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              className={`mt-2 w-full px-4 py-2 border ${
                formErrors.password ? "border-red-500" : "border-border"
              } rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={authLoading}
            />
            {renderPasswordStrengthIndicator()}
            {formErrors.password && (
              <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-secondary"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              className={`mt-2 w-full px-4 py-2 border ${
                formErrors.confirmPassword ? "border-red-500" : "border-border"
              } rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={authLoading}
            />
            {formErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {formErrors.confirmPassword}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 bg-primary text-white font-semibold rounded-full hover:bg-accent transition duration-200 disabled:bg-gray-400"
              disabled={authLoading}
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
                  Resetting Password...
                </span>
              ) : (
                "Reset Password"
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

export default ResetPasswordForm;
