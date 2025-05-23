"use client";

import React, { useState, useEffect } from 'react';
import { FiPlus, FiX, FiCheck, FiLoader, FiLock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/contexts/auth-context';
import api from '@/lib/api/api';
import logger from '@/lib/utils/logger';

const SecondaryRoles = ({ profileUser, isOwnProfile = true }) => {
  const { user, refreshUserData } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [canModifyRoles, setCanModifyRoles] = useState(false);

  // Determine if the current user can modify roles
  useEffect(() => {
    // Check if user has admin role either as primary or secondary role
    const isPrimaryAdmin = user?.role === 'admin';
    const isSecondaryAdmin = user?.secondaryRoles && user.secondaryRoles.includes('admin');

    // ONLY admin can modify roles (both their own and others')
    const isAdmin = isPrimaryAdmin || isSecondaryAdmin;

    // Set canModifyRoles to true only if the user is an admin
    setCanModifyRoles(isAdmin);
  }, [user]);

  // Use the provided profileUser or fall back to the authenticated user
  const targetUser = profileUser || user;

  if (!targetUser) {
    return null;
  }

  const primaryRole = targetUser.role;
  const secondaryRoles = targetUser.secondaryRoles || [];

  const allRoles = [
    { id: 'startupOwner', label: 'Startup Owner' },
    { id: 'investor', label: 'Investor' },
    { id: 'agency', label: 'Agency' },
    { id: 'freelancer', label: 'Freelancer' },
    { id: 'jobseeker', label: 'Job Seeker' },
    { id: 'maker', label: 'Maker' }
  ];

  // Filter out the primary role and existing secondary roles
  const availableRoles = allRoles.filter(role =>
    role.id !== primaryRole && !secondaryRoles.includes(role.id)
  );

  const handleAddRole = async () => {
    if (!selectedRole || !canModifyRoles) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Add the selected role to secondary roles
      const updatedSecondaryRoles = [...secondaryRoles, selectedRole];

      let response;

      // Check if user has admin role either as primary or secondary role
      const isPrimaryAdmin = user.role === 'admin';
      const isSecondaryAdmin = user.secondaryRoles && user.secondaryRoles.includes('admin');
      const isAdmin = isPrimaryAdmin || isSecondaryAdmin;

      if (isAdmin && !isOwnProfile) {
        // Admin updating another user's roles
        response = await api.put(`/admin/users/${targetUser._id}/secondary-roles`, {
          secondaryRoles: updatedSecondaryRoles
        });
      } else {
        // User updating their own roles
        response = await api.put('/auth/profile', {
          secondaryRoles: updatedSecondaryRoles
        });
      }

      if (response.data.status === 'success') {
        // Refresh user data to get updated capabilities
        await refreshUserData();
        setIsAdding(false);
        setSelectedRole('');
      } else {
        setError(response.data.message || 'Failed to add role');
      }
    } catch (err) {
      logger.error('Error adding secondary role:', err);
      setError(err.response?.data?.message || 'Failed to add role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (roleToRemove) => {
    if (!canModifyRoles) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Remove the role from secondary roles
      const updatedSecondaryRoles = secondaryRoles.filter(role => role !== roleToRemove);

      let response;

      // Check if user has admin role either as primary or secondary role
      const isPrimaryAdmin = user.role === 'admin';
      const isSecondaryAdmin = user.secondaryRoles && user.secondaryRoles.includes('admin');
      const isAdmin = isPrimaryAdmin || isSecondaryAdmin;

      if (isAdmin && !isOwnProfile) {
        // Admin updating another user's roles
        response = await api.put(`/admin/users/${targetUser._id}/secondary-roles`, {
          secondaryRoles: updatedSecondaryRoles
        });
      } else {
        // User updating their own roles
        response = await api.put('/auth/profile', {
          secondaryRoles: updatedSecondaryRoles
        });
      }

      if (response.data.status === 'success') {
        // Refresh user data to get updated capabilities
        await refreshUserData();
      } else {
        setError(response.data.message || 'Failed to remove role');
      }
    } catch (err) {
      logger.error('Error removing secondary role:', err);
      setError(err.response?.data?.message || 'Failed to remove role');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get label for a role ID
  const getRoleLabel = (roleId) => {
    const role = allRoles.find(r => r.id === roleId);
    return role ? role.label : roleId;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{isOwnProfile ? 'Your Roles' : 'User Roles'}</h3>
        {!isAdding && availableRoles.length > 0 && canModifyRoles && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm flex items-center text-violet-600 hover:text-violet-700"
            disabled={isSubmitting}
          >
            <FiPlus className="mr-1" /> Add Role
          </button>
        )}
        {!canModifyRoles && (
          <div className="text-xs flex items-center text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
            <FiLock className="mr-1" /> Only administrators can modify roles
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div className="w-3 h-3 bg-violet-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium">Primary Role:</span>
        </div>
        <div className="ml-5 p-2 bg-violet-50 rounded text-violet-800 inline-block">
          {getRoleLabel(primaryRole)}
        </div>
      </div>

      {secondaryRoles.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
            <span className="text-sm font-medium">Secondary Roles:</span>
          </div>
          <div className="ml-5 flex flex-wrap gap-2">
            {secondaryRoles.map(role => (
              <div
                key={role}
                className="p-2 bg-blue-50 rounded text-blue-800 flex items-center"
              >
                {getRoleLabel(role)}
                {canModifyRoles && (
                  <button
                    onClick={() => handleRemoveRole(role)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <FiLoader className="animate-spin" /> : <FiX />}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t pt-3 mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a role to add:
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {availableRoles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      selectedRole === role.id
                        ? 'bg-violet-100 text-violet-800 border border-violet-300'
                        : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setSelectedRole('');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRole}
                  className="px-3 py-1 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 flex items-center"
                  disabled={!selectedRole || isSubmitting}
                >
                  {isSubmitting ? (
                    <FiLoader className="animate-spin mr-1" />
                  ) : (
                    <FiCheck className="mr-1" />
                  )}
                  Add Role
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecondaryRoles;
