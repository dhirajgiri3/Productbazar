"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiSearch, FiEdit, FiChevronLeft, FiChevronRight, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/contexts/auth-context';
import AdminRoleManager from 'Components/Admin/AdminRoleManager';
import SecondaryRoles from 'Components/User/SecondaryRoles';
import RoleCapabilities from 'Components/User/RoleCapabilities';
import { makePriorityRequest } from '@/lib/api/api';
import logger from '@/lib/utils/logger';

const AdminUsersPage = () => {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');

  // Reference to the current abort controller for canceling requests
  const abortControllerRef = useRef(null);

  const roles = [
    { id: '', label: 'All Roles' },
    { id: 'user', label: 'Regular User' },
    { id: 'startupOwner', label: 'Startup Owner' },
    { id: 'investor', label: 'Investor' },
    { id: 'agency', label: 'Agency' },
    { id: 'freelancer', label: 'Freelancer' },
    { id: 'jobseeker', label: 'Job Seeker' },
    { id: 'maker', label: 'Maker' },
    { id: 'admin', label: 'Admin' }
  ];

  // Check if user has admin role (primary or secondary)
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Check if user has admin role either as primary or secondary role
    const isPrimaryAdmin = user.role === 'admin';
    const isSecondaryAdmin = user.secondaryRoles && user.secondaryRoles.includes('admin');

    if (!isPrimaryAdmin && !isSecondaryAdmin) {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  // Fetch users with debounce and proper request cancellation
  const fetchUsers = useCallback(async () => {
    if (!user) return;

    // Check if user has admin role either as primary or secondary role
    const isPrimaryAdmin = user.role === 'admin';
    const isSecondaryAdmin = user.secondaryRoles && user.secondaryRoles.includes('admin');

    if (!isPrimaryAdmin && !isSecondaryAdmin) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Canceled due to new request');
    }

    // Create a new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    // Clear any previous error
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10
      });

      if (search) {
        queryParams.append('search', search);
      }

      if (roleFilter) {
        queryParams.append('role', roleFilter);
      }

      // Use makePriorityRequest to ensure this request gets priority
      const response = await makePriorityRequest('get', `/admin/users?${queryParams.toString()}`, {
        signal: controller.signal
      });

      if (response.data.status === 'success') {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.totalPages);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      // Only set error if it's not a canceled request
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        logger.error('Error fetching users:', err);
        setError(err.response?.data?.message || 'Failed to fetch users');
      } else {
        // For canceled requests, just log at debug level
        logger.debug('User fetch request was canceled, likely due to a newer request');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, currentPage, search, roleFilter]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchUsers();

    // Cleanup function to abort any pending requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounted');
      }
    };
  }, [fetchUsers]);

  // Handle search with debounce
  const handleSearch = (e) => {
    e.preventDefault();
    // Reset to first page on new search
    setCurrentPage(1);
  };

  // Handle search input change with debounce
  const handleSearchInputChange = (e) => {
    // Cancel any previous request as we're typing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Canceled due to new search input');
    }
    setSearch(e.target.value);
  };

  // Handle user selection
  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser);
  };

  // Handle role update
  const handleRoleUpdated = (updatedUser) => {
    // Update the user in the list
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u._id === updatedUser._id ? { ...u, ...updatedUser } : u
      )
    );

    // Update selected user if it's the one being edited
    if (selectedUser && selectedUser._id === updatedUser._id) {
      setSelectedUser(prev => ({ ...prev, ...updatedUser }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <FiLoader className="animate-spin text-violet-600 w-6 h-6" />
          <span className="text-gray-700">Loading...</span>
        </div>
      </div>
    );
  }

  // Check if user has admin role either as primary or secondary role
  const isPrimaryAdmin = user?.role === 'admin';
  const isSecondaryAdmin = user?.secondaryRoles && user.secondaryRoles.includes('admin');

  if (!user || (!isPrimaryAdmin && !isSecondaryAdmin)) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-amber-50 text-amber-800 p-4 rounded-lg">
          <div className="flex items-center">
            <FiAlertTriangle className="mr-2" />
            <span>Only administrators can access this page.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <FiUsers className="text-violet-600 w-6 h-6 mr-2" />
          <h1 className="text-2xl font-semibold text-gray-800">User Management</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-4">
            <div className="mb-4">
              <form onSubmit={handleSearch} className="flex space-x-2">
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchInputChange}
                  placeholder="Search users..."
                  className="flex-grow p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800"
                />
                <button
                  type="submit"
                  className="p-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                >
                  <FiSearch />
                </button>
              </form>
            </div>

            <div className="mb-4">
              <select
                value={roleFilter}
                onChange={(e) => {
                  // Cancel any previous request when changing filter
                  if (abortControllerRef.current) {
                    abortControllerRef.current.abort('Canceled due to role filter change');
                  }
                  setRoleFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800"
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <FiLoader className="animate-spin text-violet-600 w-6 h-6" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {users.map(user => (
                  <motion.div
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className={`p-3 rounded-lg cursor-pointer flex items-center ${
                      selectedUser && selectedUser._id === user._id
                        ? 'bg-violet-100 border border-violet-300'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden relative">
                      {user.profilePicture?.url ? (
                        <img
                          src={user.profilePicture.url}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600">
                          {user.firstName?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    <div className="ml-3 flex-grow">
                      <div className="font-medium text-gray-800">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email || user.phone || 'Unnamed User'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                          user.role === 'admin' ? 'bg-red-500' : 'bg-green-500'
                        }`}></span>
                        {roles.find(r => r.id === user.role)?.label || user.role}
                      </div>
                    </div>

                    <FiEdit className="text-gray-400" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <button
                  onClick={() => {
                    // Cancel any previous request when changing page
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort('Canceled due to pagination change');
                    }
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                  }}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-violet-600 hover:bg-violet-50'
                  }`}
                >
                  <FiChevronLeft />
                </button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => {
                    // Cancel any previous request when changing page
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort('Canceled due to pagination change');
                    }
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                  }}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-violet-600 hover:bg-violet-50'
                  }`}
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden relative">
                      {selectedUser.profilePicture?.url ? (
                        <img
                          src={selectedUser.profilePicture.url}
                          alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-xl">
                          {selectedUser.firstName?.charAt(0) || selectedUser.email?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {selectedUser.firstName && selectedUser.lastName
                          ? `${selectedUser.firstName} ${selectedUser.lastName}`
                          : 'Unnamed User'}
                      </h2>

                      <div className="text-gray-500 text-sm">
                        {selectedUser.email && (
                          <div className="flex items-center">
                            <span className="mr-1">Email:</span>
                            <span className="font-medium">{selectedUser.email}</span>
                            {selectedUser.isEmailVerified && (
                              <span className="ml-1 text-green-500 text-xs">(Verified)</span>
                            )}
                          </div>
                        )}

                        {selectedUser.phone && (
                          <div className="flex items-center">
                            <span className="mr-1">Phone:</span>
                            <span className="font-medium">{selectedUser.phone}</span>
                            {selectedUser.isPhoneVerified && (
                              <span className="ml-1 text-green-500 text-xs">(Verified)</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center">
                          <span className="mr-1">Profile Status:</span>
                          <span className={`font-medium ${selectedUser.isProfileCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                            {selectedUser.isProfileCompleted ? 'Completed' : 'Incomplete'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Management */}
                <AdminRoleManager
                  userId={selectedUser._id}
                  onRoleUpdated={handleRoleUpdated}
                />

                {/* Secondary Roles */}
                <SecondaryRoles
                  profileUser={selectedUser}
                  isOwnProfile={false}
                />

                {/* Role Capabilities */}
                <RoleCapabilities
                  profileUser={selectedUser}
                  isOwnProfile={false}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No User Selected</h3>
                <p className="text-gray-500">Select a user from the list to view and manage their details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
