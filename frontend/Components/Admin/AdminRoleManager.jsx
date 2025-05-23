"use client";

import React, { useState, useEffect } from 'react';
import { FiEdit, FiSave, FiX, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuth } from "@/lib/contexts/auth-context";
import api from '@/lib/api/api';
import logger from '@/lib/utils/logger';

const AdminRoleManager = ({ userId, onRoleUpdated }) => {
  const { user } = useAuth();
  const [targetUser, setTargetUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const allRoles = [
    { id: 'user', label: 'Regular User' },
    { id: 'startupOwner', label: 'Startup Owner' },
    { id: 'investor', label: 'Investor' },
    { id: 'agency', label: 'Agency' },
    { id: 'freelancer', label: 'Freelancer' },
    { id: 'jobseeker', label: 'Job Seeker' },
    { id: 'maker', label: 'Maker' },
    { id: 'admin', label: 'Admin' }
  ];

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !user) return;

      // Check if user has admin role either as primary or secondary role
      const isPrimaryAdmin = user?.role === 'admin';
      const isSecondaryAdmin = user?.secondaryRoles && user.secondaryRoles.includes('admin');

      if (!isPrimaryAdmin && !isSecondaryAdmin) return;

      setIsLoading(true);
      try {
        // Use makePriorityRequest instead of api.get to ensure proper error handling
        const response = await api.get(`/admin/users/${userId}`);

        if (response.data.status === 'success') {
          setTargetUser(response.data.data.user);
          setSelectedRole(response.data.data.user.role);
        } else {
          setError('Failed to fetch user data');
        }
      } catch (err) {
        logger.error('Error fetching user data:', err);

        // Provide more specific error messages
        if (err.response?.status === 401) {
          setError('Authentication error. Please log in again.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to manage user roles.');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch user data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, user]);

  // Handle role change
  const handleRoleChange = async () => {
    if (!selectedRole || selectedRole === targetUser.role) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/admin/users/${userId}/role`, {
        role: selectedRole
      });

      if (response.data.status === 'success') {
        setTargetUser(prev => ({
          ...prev,
          role: selectedRole,
          roleCapabilities: response.data.data.user.roleCapabilities
        }));
        setSuccess('User role updated successfully');
        setIsEditing(false);

        // Notify parent component if callback provided
        if (onRoleUpdated) {
          onRoleUpdated(response.data.data.user);
        }
      } else {
        setError(response.data.message || 'Failed to update role');
      }
    } catch (err) {
      logger.error('Error updating user role:', err);

      // Provide more specific error messages
      if (err.response?.status === 401) {
        setError('Authentication error. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to update user roles.');
      } else {
        setError(err.response?.data?.message || 'Failed to update role');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has admin role either as primary or secondary role
  const isPrimaryAdmin = user?.role === 'admin';
  const isSecondaryAdmin = user?.secondaryRoles && user.secondaryRoles.includes('admin');

  if (!user || (!isPrimaryAdmin && !isSecondaryAdmin)) {
    return (
      <div className="bg-amber-50 text-amber-800 p-4 rounded-lg mb-4">
        <div className="flex items-center">
          <FiAlertTriangle className="mr-2" />
          <span>Only administrators can access this feature.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex justify-center items-center h-20">
          <FiLoader className="animate-spin text-violet-600 w-6 h-6" />
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
        <div className="flex items-center">
          <FiAlertTriangle className="mr-2" />
          <span>User not found or you don't have permission to manage this user.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage User Role</h3>

      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-2 bg-green-50 text-green-600 text-sm rounded">
          {success}
        </div>
      )}

      <div className="flex items-center mb-4">
        <div className="w-3 h-3 bg-violet-500 rounded-full mr-2"></div>
        <span className="text-sm font-medium">Primary Role:</span>

        {isEditing ? (
          <div className="ml-2 flex-grow">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800"
              disabled={isSubmitting}
            >
              {allRoles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>

            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={() => {
                  setSelectedRole(targetUser.role);
                  setIsEditing(false);
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 flex items-center"
                disabled={isSubmitting}
              >
                <FiX className="mr-1" /> Cancel
              </button>

              <button
                onClick={handleRoleChange}
                className="px-3 py-1 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 flex items-center"
                disabled={isSubmitting || selectedRole === targetUser.role}
              >
                {isSubmitting ? (
                  <FiLoader className="animate-spin mr-1" />
                ) : (
                  <FiSave className="mr-1" />
                )}
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center ml-2">
            <div className="p-2 bg-violet-50 rounded text-violet-800">
              {allRoles.find(r => r.id === targetUser.role)?.label || targetUser.role}
            </div>

            <motion.button
              onClick={() => setIsEditing(true)}
              className="ml-2 text-violet-600 hover:text-violet-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiEdit />
            </motion.button>
          </div>
        )}
      </div>

      <div className="mt-4 border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Role Capabilities:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {targetUser.roleCapabilities && Object.entries(targetUser.roleCapabilities).map(([capability, enabled]) => (
            <div key={capability} className={`p-2 rounded-md ${enabled ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
              {capability.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              {enabled ? ' ✓' : ' ✗'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminRoleManager;
