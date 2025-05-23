"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiX } from "react-icons/hi";
import { FiUser, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter } from "next/navigation";

const ProfileCompletionPrompt = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const router = useRouter();

  // Calculate profile completion percentage
  const calculateCompletionPercentage = () => {
    if (!user) return 0;

    const requiredFields = ["firstName", "lastName", "email", "phone", "about"];
    const recommendedFields = ["bio", "headline", "address.country", "address.city", "skills", "interests"];

    // Count filled required fields
    const filledRequired = requiredFields.filter(field => {
      if (field.includes('.')) {
        const keys = field.split('.');
        let value = user;
        for (const key of keys) {
          value = value?.[key];
          if (!value) return false;
        }
        return true;
      }

      if (field === 'skills' || field === 'interests') {
        return user[field] && user[field].length > 0;
      }

      return !!user[field];
    }).length;

    // Count filled recommended fields
    const filledRecommended = recommendedFields.filter(field => {
      if (field.includes('.')) {
        const keys = field.split('.');
        let value = user;
        for (const key of keys) {
          value = value?.[key];
          if (!value) return false;
        }
        return true;
      }

      if (field === 'skills' || field === 'interests') {
        return user[field] && user[field].length > 0;
      }

      return !!user[field];
    }).length;

    const requiredWeight = 0.7;
    const recommendedWeight = 0.3;

    const requiredCompletion = filledRequired / requiredFields.length;
    const recommendedCompletion = recommendedFields.length > 0
      ? filledRecommended / recommendedFields.length
      : 1;

    return Math.round(
      (requiredCompletion * requiredWeight + recommendedCompletion * recommendedWeight) * 100
    );
  };

  const completionPercentage = calculateCompletionPercentage();

  // Get missing fields
  const getMissingFields = () => {
    if (!user) return [];

    const missingFields = [];

    if (!user.firstName || !user.lastName) missingFields.push("Name");
    if (!user.email) missingFields.push("Email");
    if (!user.phone) missingFields.push("Phone");
    if (!user.about) missingFields.push("About");
    if (!user.bio) missingFields.push("Bio");
    if (!user.headline) missingFields.push("Professional headline");
    if (!user.address || (!user.address.country && !user.address.city)) missingFields.push("Location");
    if (!user.skills || user.skills.length === 0) missingFields.push("Skills");
    if (!user.interests || user.interests.length === 0) missingFields.push("Interests");

    return missingFields;
  };

  const missingFields = getMissingFields();

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, type: "spring", damping: 25, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2, ease: "easeInOut" } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const handleCompleteProfile = () => {
    router.push("/complete-profile");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="h-full fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-[10px] flex items-center justify-center"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex items-center justify-center w-full px-4 py-6">
            <motion.div
              className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden fixed top-[5rem]"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full opacity-20 -mr-32 -mt-32 z-0"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full opacity-20 -ml-32 -mb-32 z-0"></div>

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mr-3">
                    <FiUser className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
                    <p className="mt-1 text-sm text-gray-500">Enhance your experience on ProductBazar</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                  aria-label="Close"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="relative z-10 p-6 bg-white">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                    <span className="text-sm font-medium text-violet-600">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-violet-600 h-2.5 rounded-full"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FiAlertCircle className="mr-2 text-amber-500" />
                    Missing Information
                  </h3>

                  {missingFields.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {missingFields.map((field, index) => (
                        <li key={index} className="flex items-center text-gray-600">
                          <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                          {field}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center text-green-600">
                      <FiCheckCircle className="mr-2" />
                      Your profile is complete!
                    </div>
                  )}
                </div>

                <div className="bg-violet-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-violet-700">
                    A complete profile helps you connect with other users and increases your visibility on ProductBazar.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="relative z-10 flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={handleCompleteProfile}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 transition-all duration-200 shadow-sm"
                >
                  Complete Profile
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileCompletionPrompt;
