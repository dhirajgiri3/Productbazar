"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  FiUpload, 
  FiBriefcase, 
  FiCode, 
  FiDollarSign, 
  FiLayers, 
  FiCheckCircle, 
  FiXCircle,
  FiShield
} from "react-icons/fi";

const RoleCapabilitiesTab = ({ user }) => {
  if (!user) return null;

  // Define all possible capabilities
  const allCapabilities = [
    {
      id: "canUploadProducts",
      label: "Upload Products",
      description: "Can upload and showcase products on the platform",
      icon: <FiUpload className="w-5 h-5" />
    },
    {
      id: "canApplyToJobs",
      label: "Apply to Jobs",
      description: "Can browse and apply to job listings",
      icon: <FiBriefcase className="w-5 h-5" />
    },
    {
      id: "canPostJobs",
      label: "Post Jobs",
      description: "Can create and manage job listings",
      icon: <FiBriefcase className="w-5 h-5" />
    },
    {
      id: "canOfferServices",
      label: "Offer Services",
      description: "Can offer professional services to others",
      icon: <FiCode className="w-5 h-5" />
    },
    {
      id: "canInvest",
      label: "Invest",
      description: "Can invest in startups and projects",
      icon: <FiDollarSign className="w-5 h-5" />
    },
    {
      id: "canShowcaseProjects",
      label: "Showcase Projects",
      description: "Can showcase portfolio projects",
      icon: <FiLayers className="w-5 h-5" />
    }
  ];

  // Get user capabilities from roleCapabilities
  const userCapabilities = user.roleCapabilities || {};

  // Check if user has admin role (primary or secondary)
  const isPrimaryAdmin = user.role === "admin";
  const isSecondaryAdmin = user.secondaryRoles && user.secondaryRoles.includes("admin");
  const isAdmin = isPrimaryAdmin || isSecondaryAdmin;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Role Capabilities</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Primary Role:</span>
          <span className="text-sm font-medium text-gray-900">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </div>
      </div>

      {isAdmin && (
        <motion.div 
          className="p-4 bg-indigo-50 rounded-lg border border-indigo-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <FiShield className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-indigo-800">Administrator Access</h3>
              <div className="mt-1 text-sm text-indigo-700">
                <p>You have administrator privileges which grants you access to all platform features and admin controls.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {allCapabilities.map((capability) => {
          const hasCapability = userCapabilities[capability.id] === true;
          
          return (
            <motion.div
              key={capability.id}
              variants={itemVariants}
              className={`p-4 rounded-lg border ${
                hasCapability 
                  ? "bg-green-50 border-green-100" 
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${
                  hasCapability ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"
                }`}>
                  {capability.icon}
                </div>
                <div className="ml-3">
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium text-gray-900">{capability.label}</h4>
                    {hasCapability ? (
                      <FiCheckCircle className="ml-2 text-green-500 w-4 h-4" />
                    ) : (
                      <FiXCircle className="ml-2 text-gray-400 w-4 h-4" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{capability.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2">About Role Capabilities</h4>
        <p className="text-sm text-gray-600">
          Your capabilities are determined by your primary and secondary roles. 
          You can request additional roles in your profile settings.
        </p>
      </div>
    </div>
  );
};

export default RoleCapabilitiesTab;
