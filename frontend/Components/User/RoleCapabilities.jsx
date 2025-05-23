"use client";

import React from 'react';
import {
  FiUpload,
  FiDollarSign,
  FiBriefcase,
  FiUsers,
  FiFileText,
  FiLayers
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuth } from "@/lib/contexts/auth-context";

const RoleCapabilities = ({ profileUser, isOwnProfile = true }) => {
  const { user } = useAuth();

  // Use the provided profileUser or fall back to the authenticated user
  const targetUser = profileUser || user;

  if (!targetUser || !targetUser.roleCapabilities) {
    return null;
  }

  const {
    canUploadProducts,
    canInvest,
    canOfferServices,
    canApplyToJobs,
    canPostJobs,
    canShowcaseProjects
  } = targetUser.roleCapabilities;

  // Only show the component if the user has at least one capability
  const hasAnyCapability = Object.values(targetUser.roleCapabilities).some(val => val);
  if (!hasAnyCapability) {
    return null;
  }

  const capabilities = [
    {
      id: 'upload',
      name: 'Upload Products',
      description: 'You can upload and showcase products',
      icon: <FiUpload className="w-5 h-5" />,
      enabled: canUploadProducts,
      href: '/product/new'
    },
    {
      id: 'invest',
      name: 'Invest',
      description: 'You can invest in startups and products',
      icon: <FiDollarSign className="w-5 h-5" />,
      enabled: canInvest,
      href: '/invest'
    },
    {
      id: 'services',
      name: 'Offer Services',
      description: 'You can offer professional services',
      icon: <FiBriefcase className="w-5 h-5" />,
      enabled: canOfferServices,
      href: '/services'
    },
    {
      id: 'apply',
      name: 'Apply to Jobs',
      description: 'You can apply to job postings',
      icon: <FiFileText className="w-5 h-5" />,
      enabled: canApplyToJobs,
      href: '/jobs'
    },
    {
      id: 'post',
      name: 'Post Jobs',
      description: 'You can post job opportunities',
      icon: <FiUsers className="w-5 h-5" />,
      enabled: canPostJobs,
      href: '/jobs/post'
    },
    {
      id: 'showcase',
      name: 'Showcase Projects',
      description: 'You can showcase your projects',
      icon: <FiLayers className="w-5 h-5" />,
      enabled: canShowcaseProjects,
      href: '/projects'
    }
  ];

  // Filter to only show enabled capabilities
  const enabledCapabilities = capabilities.filter(cap => cap.enabled);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{isOwnProfile ? 'Your Capabilities' : 'User Capabilities'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {enabledCapabilities.map((capability, index) => (
          <motion.a
            key={capability.id}
            href={capability.href}
            className="flex items-center p-3 rounded-lg border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 mr-3">
              {capability.icon}
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{capability.name}</h4>
              <p className="text-xs text-gray-500">{capability.description}</p>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
};

export default RoleCapabilities;
