"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FiMail,
  FiPhone,
  FiUser,
  FiCheck,
  FiChevronDown,
  FiInfo,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

/**
 * OnboardingBanner Component
 *
 * Displays a banner with steps for user onboarding process
 *
 * @param {Object} props
 * @param {Object} props.nextStep - The next step to complete
 * @param {Function} props.onComplete - Callback when step is completed
 * @param {Function} props.onSkip - Callback when step is skipped
 * @param {Function} props.onRefresh - Callback to refresh status
 */
const OnboardingBanner = ({ nextStep, onComplete, onSkip, onRefresh }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset animation state when component mounts or nextStep changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 800);
    return () => clearTimeout(timer);
  }, [nextStep?.type]);

  // Validate nextStep and check if all steps are completed
  if (!nextStep || !nextStep.type) {
    console.warn("OnboardingBanner: Invalid or missing nextStep data");
    return null;
  }

  // Check if all steps are completed
  const allStepsCompleted =
    nextStep.allSteps && nextStep.allSteps.every((step) => step.completed);

  if (allStepsCompleted) {
    return null;
  }

  // Get the icon based on the verification type
  const getStepIcon = (type) => {
    switch (type) {
      case "email_verification":
        return <FiMail className="h-4 w-4 text-white" aria-hidden="true" />;
      case "phone_verification":
        return <FiPhone className="h-4 w-4 text-white" aria-hidden="true" />;
      case "profile_completion":
        return <FiUser className="h-4 w-4 text-white" aria-hidden="true" />;
      default:
        return <FiInfo className="h-4 w-4 text-white" aria-hidden="true" />;
    }
  };

  // Get the link based on the verification type
  const getStepLink = (type) => {
    switch (type) {
      case "email_verification":
        return "/auth/verify-email";
      case "phone_verification":
        return "/auth/verify-phone";
      case "profile_completion":
        return "/complete-profile";
      default:
        return "/complete-profile";
    }
  };

  // Get readable label for step type
  const getStepTypeLabel = (type) => {
    switch (type) {
      case "email_verification":
        return "Email Verification";
      case "phone_verification":
        return "Phone Verification";
      case "profile_completion":
        return "Profile Completion";
      default:
        return "Verification";
    }
  };

  // Calculate total steps and completed steps with safe defaults
  const totalSteps = nextStep.allSteps?.length || 0;
  const completedSteps = nextStep.progress?.completed || 0;
  const percentage = nextStep.progress?.percentage || 0;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600 text-white py-4 relative overflow-hidden shadow-lg"
      role="alert"
      aria-labelledby="onboarding-banner-title"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="smallGrid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
                opacity="0.2"
              />
            </pattern>
            <pattern
              id="grid"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <rect width="80" height="80" fill="url(#smallGrid)" />
              <path
                d="M 80 0 L 0 0 0 80"
                fill="none"
                stroke="white"
                strokeWidth="1"
                opacity="0.2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          className="flex flex-col md:flex-row md:items-center md:justify-between"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center mb-3 md:mb-0">
            {/* Icon based on verification type */}
            <motion.div
              className="mr-3 bg-white/20 rounded-full p-2 backdrop-blur-sm"
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              variants={itemVariants}
            >
              {getStepIcon(nextStep.type)}
            </motion.div>

            <div className="flex-1">
              <motion.h3
                id="onboarding-banner-title"
                className="text-sm font-medium"
                variants={itemVariants}
              >
                {nextStep.title || getStepTypeLabel(nextStep.type)}
              </motion.h3>
              <motion.p
                className="text-xs text-white/90"
                variants={itemVariants}
              >
                {nextStep.message ||
                  nextStep.description ||
                  `Complete your ${getStepTypeLabel(
                    nextStep.type
                  ).toLowerCase()} to continue.`}
              </motion.p>
            </div>

            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              className="ml-2 p-1.5 rounded-full hover:bg-white/20 transition-colors md:hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ rotate: showDetails ? 180 : 0 }}
              aria-expanded={showDetails}
              aria-controls="mobile-details"
              aria-label={showDetails ? "Hide details" : "Show details"}
            >
              <FiChevronDown className="h-4 w-4" aria-hidden="true" />
            </motion.button>
          </div>

          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Progress indicator (visible on desktop) */}
            <motion.div
              className="hidden md:flex items-center space-x-2"
              variants={itemVariants}
            >
              <div
                className="w-32 bg-white/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm"
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <motion.div
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-medium whitespace-nowrap">
                {completedSteps} of {totalSteps} completed
              </span>
            </motion.div>

            {/* Refresh button */}
            {onRefresh && (
              <motion.button
                onClick={onRefresh}
                className="text-white/90 hover:text-white p-1.5 rounded-full hover:bg-white/20 transition-colors"
                title="Refresh verification status"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variants={itemVariants}
                aria-label="Refresh verification status"
              >
                <FiRefreshCw
                  className={`h-4 w-4 ${isAnimating ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
              </motion.button>
            )}

            {/* Skip button */}
            {nextStep.type === "profile_completion" && nextStep.skippable && (
              <motion.button
                onClick={onSkip}
                className="text-white hover:text-gray-100 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/10 rounded-full flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variants={itemVariants}
              >
                <span>Skip for now</span>
                <FiX className="ml-1 h-3 w-3" aria-hidden="true" />
              </motion.button>
            )}

            {/* Complete button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              variants={itemVariants}
            >
              <Link href={getStepLink(nextStep.type)}>
                <button
                  onClick={onComplete}
                  className="bg-white text-violet-600 hover:bg-gray-100 px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-md hover:shadow-lg flex items-center"
                >
                  {nextStep.actionLabel || "Complete Now"}
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Expanded details (mobile only) */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              id="mobile-details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 md:hidden overflow-hidden"
            >
              {/* Progress steps */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div
                  className="w-full bg-white/20 rounded-full h-2 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <motion.div
                    className="bg-green-400 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-xs font-medium ml-2 whitespace-nowrap">
                  {completedSteps} of {totalSteps}
                </span>
              </div>

              {/* All steps */}
              <div className="space-y-2">
                {nextStep.allSteps &&
                  nextStep.allSteps.map((step, index) => (
                    <Link
                      key={index}
                      href={getStepLink(step.type)}
                      className={`flex items-center p-2 rounded-md ${
                        step.completed
                          ? "bg-white/20"
                          : step.type === nextStep.type
                          ? "bg-white/15 ring-1 ring-white/30"
                          : "bg-white/10"
                      } hover:bg-white/30 transition-colors`}
                      aria-current={
                        step.type === nextStep.type ? "step" : undefined
                      }
                    >
                      <div
                        className={`mr-3 ${
                          step.completed
                            ? "bg-green-500/40"
                            : step.type === nextStep.type
                            ? "bg-white/30"
                            : "bg-white/20"
                        } rounded-full p-1.5`}
                      >
                        {step.completed ? (
                          <FiCheck
                            className="h-4 w-4 text-white"
                            aria-hidden="true"
                          />
                        ) : (
                          getStepIcon(step.type)
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">
                          {step.title || getStepTypeLabel(step.type)}
                        </h4>
                        <p className="text-xs text-white/80">
                          {step.message ||
                            step.description ||
                            `Complete your ${getStepTypeLabel(
                              step.type
                            ).toLowerCase()}`}
                        </p>
                      </div>
                      {step.completed ? (
                        <span className="text-xs bg-green-500/30 text-white px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      ) : step.type === nextStep.type ? (
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      ) : (
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </Link>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Default props as a fallback
OnboardingBanner.defaultProps = {
  nextStep: null,
  onComplete: () => {},
  onSkip: () => {},
  onRefresh: null,
};

export default OnboardingBanner;
