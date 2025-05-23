"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiSearch, FiChevronDown, FiChevronUp, FiEdit,
  FiSave, FiX, FiCheck, FiAlertTriangle, FiFilter,
  FiChevronLeft, FiChevronRight, FiUserPlus, FiUserCheck,
  FiMail, FiPhone, FiUser, FiBriefcase, FiGlobe, FiShield
} from 'react-icons/fi';

import { makePriorityRequest } from "@/lib/api/api";
import { useAuth } from "@/lib/contexts/auth-context";
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import debounce from 'lodash.debounce';

const RoleManagement = () => {
  const { user, isInitialized } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSecondaryRoles, setSelectedSecondaryRoles] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [authReady, setAuthReady] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [mobileUserDetail, setMobileUserDetail] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const roles = [
    { id: '', label: 'All Roles', icon: <FiUsers className="text-gray-400" /> },
    { id: 'user', label: 'Regular User', icon: <FiUser className="text-gray-500" /> },
    { id: 'startupOwner', label: 'Startup Owner', icon: <FiBriefcase className="text-violet-500" /> },
    { id: 'investor', label: 'Investor', icon: <FiGlobe className="text-blue-500" /> },
    { id: 'agency', label: 'Agency', icon: <FiUsers className="text-indigo-500" /> },
    { id: 'freelancer', label: 'Freelancer', icon: <FiEdit className="text-green-500" /> },
    { id: 'jobseeker', label: 'Job Seeker', icon: <FiSearch className="text-amber-500" /> },
    { id: 'maker', label: 'Maker', icon: <FiUserCheck className="text-pink-500" /> },
    { id: 'admin', label: 'Admin', icon: <FiShield className="text-red-500" /> }
  ];

  const secondaryRoleOptions = [
    { id: 'startupOwner', label: 'Startup Owner' },
    { id: 'investor', label: 'Investor' },
    { id: 'agency', label: 'Agency' },
    { id: 'freelancer', label: 'Freelancer' },
    { id: 'jobseeker', label: 'Job Seeker' },
    { id: 'maker', label: 'Maker' }
  ];

  // Fetch all users at once
  const fetchAllUsers = useCallback(async () => {
    if (!user || user.role !== 'admin' || !authReady) return;

    setIsLoading(true);
    setError(''); // Clear any previous errors

    try {
      // Fetch all users without pagination using priority request
      const response = await makePriorityRequest('get', '/admin/users/all', {
        timeout: 15000 // 15 seconds timeout
      });

      if (response.data.status === 'success') {
        const users = response.data.data.users;
        setAllUsers(users);
        setFilteredUsers(users);
        setError(''); // Explicitly clear error state on success
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      // Don't log canceled errors as they're expected during navigation
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error('Error fetching users:', err);
        setError(err.response?.data?.message || 'Failed to fetch users');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, authReady]);

  // Filter users based on search query and role filter
  const filterUsers = useCallback(
    debounce((query = '', role = '') => {
      setIsSearching(true);

      try {
        // Clear any previous errors when filtering starts
        setError('');

        // Filter users based on search query and role
        let filtered = [...allUsers];

        if (query) {
          const searchTerms = query.toLowerCase().trim().split(/\s+/);

          filtered = filtered.filter(user => {
            // Check if user matches all search terms
            return searchTerms.every(term => {
              const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
              const email = (user.email || '').toLowerCase();
              const phone = (user.phone || '').toLowerCase();
              const role = (user.role || '').toLowerCase();
              const company = (user.companyName || '').toLowerCase();
              const city = (user.address?.city || '').toLowerCase();
              const country = (user.address?.country || '').toLowerCase();

              return (
                fullName.includes(term) ||
                email.includes(term) ||
                phone.includes(term) ||
                role.includes(term) ||
                company.includes(term) ||
                city.includes(term) ||
                country.includes(term)
              );
            });
          });
        }

        if (role) {
          filtered = filtered.filter(user => user.role === role);
        }

        setFilteredUsers(filtered);

        // Generate suggestions based on the same filter
        if (query && query.length >= 2) {
          const suggestionResults = filtered.slice(0, 5).map(user => ({
            _id: user._id,
            name: user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.email || user.phone || 'Unnamed User',
            email: user.email,
            phone: user.phone,
            profilePicture: user.profilePicture?.url || null,
            role: user.role
          }));

          setSuggestions(suggestionResults);
          setShowSuggestions(suggestionResults.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Error filtering users:', err);
        // Don't set error state for filtering issues to avoid confusing the user
        // since the main data is already loaded
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [allUsers]
  );

  // Handle input change for search with suggestions
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterUsers(query, roleFilter);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    // Find the user from allUsers that matches the suggestion
    const selectedUser = allUsers.find(u => u._id === suggestion._id);
    if (selectedUser) {
      setSearchQuery(suggestion.name);
      setSuggestions([]);
      setShowSuggestions(false);

      // Filter to show only this user
      setFilteredUsers([selectedUser]);

      // Also select the user for editing
      handleUserSelect(selectedUser);
    }
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    // Only handle keys when suggestions are shown
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prevIndex =>
          prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prevIndex =>
          prevIndex > 0 ? prevIndex - 1 : 0
        );
        break;
      case 'Enter':
        // If a suggestion is active and Enter is pressed, select it
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  // Reset active suggestion index when suggestions change
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [suggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Track when auth is ready
  useEffect(() => {
    if (isInitialized && user) {
      setAuthReady(true);
    }
  }, [isInitialized, user]);

  // Initial fetch of all users
  useEffect(() => {
    if (authReady) {
      fetchAllUsers();
      // Clear any error messages when component mounts
      setError('');
    }
  }, [fetchAllUsers, authReady]);

  // Clear error message when users are successfully loaded
  useEffect(() => {
    if (allUsers.length > 0) {
      setError('');
    }
  }, [allUsers]);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    filterUsers(searchQuery, roleFilter);
  };

  // Handle user selection
  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser);
    setSelectedRole(selectedUser.role);
    setSelectedSecondaryRoles(selectedUser.secondaryRoles || []);
    setEditMode(false);
  };

  // For mobile view, toggle user detail panel
  const handleMobileUserSelect = (selectedUser) => {
    handleUserSelect(selectedUser);
    if (mobileView) {
      setMobileUserDetail(true);
    }
  };

  // Handle role change
  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await makePriorityRequest('put', `/admin/users/${selectedUser._id}/role`, {
        data: { role: selectedRole },
        timeout: 15000
      });

      if (response.data.status === 'success') {
        // Update the user in both lists
        const updatedUser = { ...selectedUser, role: selectedRole };

        setAllUsers(prevUsers =>
          prevUsers.map(u => u._id === selectedUser._id ? updatedUser : u)
        );

        setFilteredUsers(prevUsers =>
          prevUsers.map(u => u._id === selectedUser._id ? updatedUser : u)
        );

        // Update selected user
        setSelectedUser(updatedUser);

        setSuccessMessage('User role updated successfully');
        toast.success('User role updated successfully');
        setEditMode(false);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to update role');
      }
    } catch (err) {
      // Don't log canceled errors as they're expected during navigation
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error('Error updating user role:', err);
        setError(err.response?.data?.message || 'Failed to update role');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle secondary roles change
  const handleSecondaryRolesChange = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await makePriorityRequest('put', `/admin/users/${selectedUser._id}/secondary-roles`, {
        data: { secondaryRoles: selectedSecondaryRoles },
        timeout: 15000
      });

      if (response.data.status === 'success') {
        // Update the user in both lists
        const updatedUser = { ...selectedUser, secondaryRoles: selectedSecondaryRoles };

        setAllUsers(prevUsers =>
          prevUsers.map(u => u._id === selectedUser._id ? updatedUser : u)
        );

        setFilteredUsers(prevUsers =>
          prevUsers.map(u => u._id === selectedUser._id ? updatedUser : u)
        );

        // Update selected user
        setSelectedUser(updatedUser);

        setSuccessMessage('Secondary roles updated successfully');
        toast.success('Secondary roles updated successfully');
        setEditMode(false);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to update secondary roles');
      }
    } catch (err) {
      // Don't log canceled errors as they're expected during navigation
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error('Error updating secondary roles:', err);
        setError(err.response?.data?.message || 'Failed to update secondary roles');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle secondary role selection
  const toggleSecondaryRole = (roleId) => {
    if (selectedSecondaryRoles.includes(roleId)) {
      setSelectedSecondaryRoles(prev => prev.filter(r => r !== roleId));
    } else {
      setSelectedSecondaryRoles(prev => [...prev, roleId]);
    }
  };

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 1024);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading state while waiting for auth to initialize
  if (!authReady) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 w-6 h-6 bg-violet-300 rounded-full animate-bounce" style={{ animationDelay: '0ms', left: '5px' }}></div>
            <div className="absolute top-0 w-6 h-6 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms', left: '25px' }}></div>
            <div className="absolute top-0 w-6 h-6 bg-violet-700 rounded-full animate-bounce" style={{ animationDelay: '600ms', left: '45px' }}></div>
          </div>
          <p className="text-violet-600 font-medium">Loading user management</p>
        </div>
      </div>
    );
  }

  // Check if user has admin role either as primary or secondary role
  const isPrimaryAdmin = user?.role === 'admin';
  const isSecondaryAdmin = user?.secondaryRoles && user.secondaryRoles.includes('admin');

  // Check if user is admin
  if (!user || (!isPrimaryAdmin && !isSecondaryAdmin)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-amber-200 rounded-xl shadow-sm overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-amber-200">
          <div className="flex items-center">
            <FiAlertTriangle className="text-amber-500 w-5 h-5 mr-3" />
            <h3 className="text-lg font-medium text-amber-800">Admin Access Required</h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-amber-700">This feature is only available to administrators. Please contact an admin if you need access to role management.</p>
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-sm text-amber-600">If you believe this is an error, try refreshing the page or logging out and back in.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-violet-50 to-white border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-1.5 h-6 bg-violet-600 rounded-full mr-3"></div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">User Role Management</h2>
          </div>
          <p className="mt-1 ml-4 text-xs sm:text-sm text-gray-600">Manage user roles and permissions</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              key="error-message"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center justify-between border border-red-100"
            >
              <div className="flex items-center">
                <FiAlertTriangle className="mr-2 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                aria-label="Dismiss error"
              >
                <FiX className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {successMessage && (
            <motion.div
              key="success-message"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 sm:mx-6 mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center justify-between border border-green-100"
            >
              <div className="flex items-center">
                <FiCheck className="mr-2 flex-shrink-0 text-green-500" />
                <span>{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage('')}
                className="ml-2 text-green-500 hover:text-green-700 transition-colors"
                aria-label="Dismiss message"
              >
                <FiX className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 sm:p-6">
          {/* Mobile Back Button - Only show when viewing user details on mobile */}
          {mobileView && mobileUserDetail && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
              onClick={() => setMobileUserDetail(false)}
            >
              <FiChevronLeft className="mr-1.5 -ml-1 h-4 w-4" />
              Back to User List
            </motion.button>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User List - Hide on mobile when viewing user details */}
            <div className={`lg:col-span-1 ${mobileView && mobileUserDetail ? 'hidden' : 'block'}`}>
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <div className="bg-gray-50 p-3 sm:p-4 border-b border-gray-200">
                  <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
                    <div className="relative">
                      {isSearching ? (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse delay-100"></div>
                          <div className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-pulse delay-200"></div>
                        </div>
                      ) : (
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      )}
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search users by name, email, role..."
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        aria-autocomplete="list"
                        aria-controls="user-suggestions"
                        aria-expanded={showSuggestions}
                      />

                      {/* Clear search button */}
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSuggestions([]);
                            setShowSuggestions(false);
                            filterUsers('', roleFilter);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      )}

                      {/* Suggestions Dropdown */}
                      <AnimatePresence>
                        {showSuggestions && (
                          <motion.div
                            ref={suggestionsRef}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            id="user-suggestions"
                            role="listbox"
                            className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
                          >
                            {isSearching ? (
                              <div className="p-3 text-center text-gray-500 text-sm">
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="animate-pulse w-4 h-4 bg-violet-200 rounded-full"></div>
                                  <div className="animate-pulse w-4 h-4 bg-violet-300 rounded-full delay-100"></div>
                                  <div className="animate-pulse w-4 h-4 bg-violet-400 rounded-full delay-200"></div>
                                </div>
                              </div>
                            ) : suggestions.length === 0 ? (
                              <div className="p-3 text-center text-gray-500 text-sm">
                                No users found
                              </div>
                            ) : (
                              suggestions.map((suggestion, index) => (
                                <motion.div
                                  key={suggestion._id}
                                  onClick={() => handleSelectSuggestion(suggestion)}
                                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                                  className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${index === activeSuggestionIndex ? 'bg-violet-50' : 'hover:bg-violet-50'}`}
                                  whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                                  role="option"
                                  aria-selected={index === activeSuggestionIndex}
                                >
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0 overflow-hidden">
                                      {suggestion.profilePicture ? (
                                        <Image
                                          src={suggestion.profilePicture}
                                          alt={suggestion.name}
                                          width={40}
                                          height={40}
                                          className="rounded-full w-full h-full object-cover"
                                        />
                                      ) : (
                                        <FiUser className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div className="ml-3 flex-grow">
                                      <div className="font-medium text-gray-800">{suggestion.name}</div>
                                      <div className="flex items-center text-xs text-gray-500">
                                        {suggestion.email && (
                                          <div className="flex items-center mr-2">
                                            <FiMail className="w-3 h-3 mr-1" />
                                            <span className="truncate max-w-[150px]">{suggestion.email}</span>
                                          </div>
                                        )}
                                        {suggestion.role && (
                                          <div className="flex items-center">
                                            {roles.find(r => r.id === suggestion.role)?.icon ||
                                              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${suggestion.role === 'admin' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                            }
                                            <span>{roles.find(r => r.id === suggestion.role)?.label || suggestion.role}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiFilter className="text-gray-400" />
                        </div>
                        <select
                          value={roleFilter}
                          onChange={(e) => {
                            const newRoleFilter = e.target.value;
                            setRoleFilter(newRoleFilter);
                            filterUsers(searchQuery, newRoleFilter);
                          }}
                          className="block w-full pl-10 pr-10 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg"
                        >
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
                      >
                        <FiSearch className="mr-2" />
                        Search
                      </button>
                    </div>
                  </form>

                  {/* Search results count - Simplified for mobile */}
                  {!isLoading && (
                    <div className="mt-3 text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        {filteredUsers.length > 0 ? (
                          <>
                            <span className="font-medium">{filteredUsers.length}</span> {filteredUsers.length === 1 ? 'user' : 'users'}
                            {searchQuery && <span> found</span>}
                            {roleFilter && <span> in <span className="font-medium">{roles.find(r => r.id === roleFilter)?.label || roleFilter}</span> role</span>}
                          </>
                        ) : (
                          'No users found'
                        )}
                      </span>
                      {allUsers.length > 0 && filteredUsers.length !== allUsers.length && (
                        <span className="text-xs text-gray-500 mt-1 sm:mt-0">
                          Showing {filteredUsers.length} of {allUsers.length} total users
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-white">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40 sm:h-64">
                      <div className="flex flex-col items-center">
                        <div className="relative w-12 h-12">
                          <div className="absolute top-0 w-3 h-3 bg-violet-300 rounded-full animate-bounce" style={{ animationDelay: '0ms', left: '0px' }}></div>
                          <div className="absolute top-0 w-3 h-3 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms', left: '18px' }}></div>
                          <div className="absolute top-0 w-3 h-3 bg-violet-700 rounded-full animate-bounce" style={{ animationDelay: '600ms', left: '36px' }}></div>
                        </div>
                        <p className="text-violet-600 text-sm mt-4">Loading users...</p>
                      </div>
                    </div>
                  ) : isSearching ? (
                    <div className="flex justify-center items-center h-40 sm:h-64">
                      <div className="flex flex-col items-center">
                        <div className="flex space-x-2 mb-2">
                          <div className="w-2 h-2 bg-violet-300 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse delay-100"></div>
                          <div className="w-2 h-2 bg-violet-700 rounded-full animate-pulse delay-200"></div>
                        </div>
                        <p className="text-violet-600 text-sm">Filtering users...</p>
                      </div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 px-4">
                      <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {searchQuery ?
                          "We couldn't find any users matching your search criteria. Try different search terms or filters." :
                          "There are no users in the system yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[40vh] sm:max-h-[60vh] overflow-y-auto">
                      <ul className="divide-y divide-gray-200">
                        {filteredUsers.map(user => (
                          <motion.li
                            key={user._id}
                            onClick={() => handleMobileUserSelect(user)}
                            className={`p-3 sm:p-4 cursor-pointer transition-all ${
                              selectedUser && selectedUser._id === user._id
                                ? 'bg-violet-50 border-l-4 border-violet-500'
                                : 'hover:bg-gray-50 border-l-4 border-transparent'
                            }`}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden relative">
                                {user.profilePicture?.url ? (
                                  <Image
                                    src={user.profilePicture.url}
                                    alt={`${user.firstName} ${user.lastName}`}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-lg font-medium">
                                    {user.firstName?.charAt(0) || user.email?.charAt(0) || '?'}
                                  </div>
                                )}
                              </div>

                              <div className="ml-3 sm:ml-4 flex-grow min-w-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                  <div className="min-w-0">
                                    <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                                      {user.firstName && user.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user.email || user.phone || 'Unnamed User'}
                                    </h3>
                                    {user.email && (
                                      <p className="text-xs sm:text-sm text-gray-500 flex items-center">
                                        <FiMail className="mr-1 w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{user.email}</span>
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center mt-1 sm:mt-0">
                                    {user.role && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                                        {roles.find(r => r.id === user.role)?.icon}
                                        <span className="ml-1 hidden xs:inline">{roles.find(r => r.id === user.role)?.label || user.role}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Mobile indicator for navigation */}
                              {mobileView && (
                                <FiChevronRight className="ml-1 flex-shrink-0 text-gray-400" />
                              )}
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Show load more button if there are many users */}
                  {filteredUsers.length > 20 && (
                    <div className="flex justify-center items-center py-3 sm:py-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          // Scroll to top of user list
                          const userListElement = document.querySelector('.max-h-\\[40vh\\], .max-h-\\[60vh\\]');
                          if (userListElement) {
                            userListElement.scrollTop = 0;
                          }
                        }}
                        className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                      >
                        <FiChevronUp className="mr-1" />
                        <span>Back to top</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Details - Show on mobile only when selected */}
            <div className={`lg:col-span-2 ${mobileView && !mobileUserDetail ? 'hidden' : 'block'}`}>
              {selectedUser ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* User Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <div className="flex items-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden relative">
                            {selectedUser.profilePicture?.url ? (
                              <Image
                                src={selectedUser.profilePicture.url}
                                alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-xl font-medium">
                                {selectedUser.firstName?.charAt(0) || selectedUser.email?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>

                          <div className="ml-4 sm:ml-5">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                              {selectedUser.firstName && selectedUser.lastName
                                ? `${selectedUser.firstName} ${selectedUser.lastName}`
                                : 'Unnamed User'}
                            </h2>

                            <div className="mt-1 text-gray-500 text-xs sm:text-sm space-y-1">
                              {selectedUser.email && (
                                <div className="flex items-center">
                                  <FiMail className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400" />
                                  <span className="truncate max-w-[180px] sm:max-w-none">{selectedUser.email}</span>
                                  {selectedUser.isEmailVerified && (
                                    <span className="ml-1.5 sm:ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      <FiCheck className="mr-0.5" /> Verified
                                    </span>
                                  )}
                                </div>
                              )}

                              {selectedUser.phone && (
                                <div className="flex items-center">
                                  <FiPhone className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400" />
                                  <span>{selectedUser.phone}</span>
                                  {selectedUser.isPhoneVerified && (
                                    <span className="ml-1.5 sm:ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      <FiCheck className="mr-0.5" /> Verified
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 sm:mt-0 sm:ml-auto">
                          <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                            selectedUser.isProfileCompleted ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full mr-1.5 sm:mr-2 ${
                              selectedUser.isProfileCompleted ? 'bg-green-400' : 'bg-amber-400'
                            }`}></span>
                            {selectedUser.isProfileCompleted ? 'Complete Profile' : 'Incomplete Profile'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4">
                        <div>
                          <dt className="text-xs sm:text-sm font-medium text-gray-500">User ID</dt>
                          <dd className="mt-1 text-xs sm:text-sm text-gray-900 font-mono bg-gray-100 p-1 rounded overflow-x-auto">
                            {selectedUser._id}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs sm:text-sm font-medium text-gray-500">Joined Date</dt>
                          <dd className="mt-1 text-xs sm:text-sm text-gray-900">
                            {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                          </dd>
                        </div>

                        {selectedUser.companyName && (
                          <div>
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">Company</dt>
                            <dd className="mt-1 text-xs sm:text-sm text-gray-900">{selectedUser.companyName}</dd>
                          </div>
                        )}

                        {selectedUser.address?.country && (
                          <div>
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">Location</dt>
                            <dd className="mt-1 text-xs sm:text-sm text-gray-900">
                              {[
                                selectedUser.address.city,
                                selectedUser.address.country
                              ].filter(Boolean).join(', ')}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </motion.div>

                  {/* Primary Role Management */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-violet-50 to-white border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">User Roles</h3>

                      {!editMode ? (
                        <motion.button
                          onClick={() => setEditMode(true)}
                          className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 border border-violet-300 text-xs sm:text-sm font-medium rounded-md text-violet-700 bg-violet-50 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiEdit className="mr-1 sm:mr-1.5 w-3 h-3 sm:w-4 sm:h-4" />
                          Edit Roles
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={() => {
                            setEditMode(false);
                            setSelectedRole(selectedUser.role);
                            setSelectedSecondaryRoles(selectedUser.secondaryRoles || []);
                          }}
                          className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiX className="mr-1 sm:mr-1.5 w-3 h-3 sm:w-4 sm:h-4" />
                          Cancel
                        </motion.button>
                      )}
                    </div>

                    <div className="p-4 sm:p-6">
                      <div className="space-y-4 sm:space-y-6">
                        {/* Primary Role */}
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3">Primary Role</h4>

                          {editMode ? (
                            <div className="rounded-md shadow-sm">
                              <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-sm sm:text-base border border-gray-300 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-md"
                                disabled={isSubmitting}
                              >
                                {roles.filter(r => r.id !== '').map(role => (
                                  <option key={role.id} value={role.id}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-violet-100 text-violet-600 mr-2 sm:mr-3">
                                {roles.find(r => r.id === selectedUser.role)?.icon || <FiUser className="w-4 h-4 sm:w-5 sm:h-5" />}
                              </div>
                              <div>
                                <div className="font-medium text-sm sm:text-base text-gray-900">
                                  {roles.find(r => r.id === selectedUser.role)?.label || selectedUser.role}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Primary user access role
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Secondary Roles */}
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3">Secondary Roles</h4>

                          {editMode ? (
                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                {secondaryRoleOptions.map(role => (
                                  <label key={role.id} className="flex items-center p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={selectedSecondaryRoles.includes(role.id)}
                                      onChange={() => toggleSecondaryRole(role.id)}
                                      className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                                      disabled={isSubmitting}
                                    />
                                    <div className="ml-2 sm:ml-3 flex items-center">
                                      {roles.find(r => r.id === role.id)?.icon}
                                      <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-700">{role.label}</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                              <p className="mt-2 sm:mt-3 text-xs text-gray-500">
                                Secondary roles grant additional permissions without changing the primary role
                              </p>
                            </div>
                          ) : (
                            <div>
                              {selectedUser.secondaryRoles && selectedUser.secondaryRoles.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                  {selectedUser.secondaryRoles.map(role => (
                                    <div key={role} className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-800">
                                      {roles.find(r => r.id === role)?.icon}
                                      <span className="ml-1 sm:ml-1.5">{roles.find(r => r.id === role)?.label || role}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="py-3 sm:py-4 px-4 sm:px-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                  <p className="text-xs sm:text-sm text-gray-500">No secondary roles assigned</p>
                                  {!editMode && (
                                    <button
                                      onClick={() => setEditMode(true)}
                                      className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-violet-600 hover:text-violet-800 font-medium"
                                    >
                                      Add secondary roles
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Role Capabilities - Improved UI */}
                        <div className="bg-gray-50 rounded-lg border border-gray-200">
                          <details className="sm:open group">
                            <summary className="flex items-center justify-between text-xs sm:text-sm font-medium text-gray-500 p-3 sm:p-4 cursor-pointer hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-opacity-50 transition-colors">
                              <span className="flex items-center">
                                <FiShield className="mr-2 text-violet-400" />
                                Role Capabilities
                                <span className="text-xs text-gray-400 ml-1.5 italic">(click to expand)</span>
                              </span>
                              <span className="ml-2">
                                <svg className="w-4 h-4 text-violet-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </span>
                            </summary>
                            <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                              {selectedUser.roleCapabilities ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {Object.entries(selectedUser.roleCapabilities).map(([capability, enabled]) => (
                                    <div
                                      key={capability}
                                      className={`flex items-center p-3 rounded-lg shadow-sm border transition-colors ${
                                        enabled
                                          ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                                          : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 opacity-70'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded-full mr-3 flex-shrink-0 border-2 ${
                                        enabled ? 'bg-green-400 border-green-400' : 'bg-gray-300 border-gray-300'
                                      }`}></div>
                                      <div className="flex-1 min-w-0">
                                        <span className={`block font-medium truncate ${
                                          enabled ? 'text-green-800' : 'text-gray-600'
                                        }`}>
                                          {capability.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </span>
                                        <span className="block text-xs text-gray-400 mt-0.5">
                                          {enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                      </div>
                                      <div className="ml-auto">
                                        {enabled ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                            <FiCheck className="mr-1" /> Active
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                                            <FiX className="mr-1" /> Inactive
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="py-3 sm:py-4 px-4 sm:px-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                  <p className="text-xs sm:text-sm text-gray-500">No role capabilities information available</p>
                                </div>
                              )}
                            </div>
                          </details>
                        </div>

                        {/* Action Buttons - Stack vertically on mobile */}
                        {editMode && (
                          <div className="pt-3 sm:pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                            <motion.button
                              onClick={() => {
                                setEditMode(false);
                                setSelectedRole(selectedUser.role);
                                setSelectedSecondaryRoles(selectedUser.secondaryRoles || []);
                              }}
                              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              disabled={isSubmitting}
                            >
                              <FiX className="mr-1.5 sm:mr-2 -ml-1 w-3 h-3 sm:w-4 sm:h-4" />
                              Cancel
                            </motion.button>

                            <motion.button
                              onClick={handleRoleChange}
                              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors ${selectedRole === selectedUser.role ? 'opacity-50 cursor-not-allowed' : ''}`}
                              whileHover={selectedRole !== selectedUser.role ? { scale: 1.02 } : {}}
                              whileTap={selectedRole !== selectedUser.role ? { scale: 0.98 } : {}}
                              disabled={isSubmitting || selectedRole === selectedUser.role}
                            >
                              {isSubmitting ? (
                                <div className="flex items-center">
                                  <div className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Updating...</span>
                                </div>
                              ) : (
                                <>
                                  <FiUserCheck className="mr-1.5 sm:mr-2 -ml-1 w-3 h-3 sm:w-4 sm:h-4" />
                                  Update Primary Role
                                </>
                              )}
                            </motion.button>

                            <motion.button
                              onClick={handleSecondaryRolesChange}
                              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <div className="flex items-center">
                                  <div className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Updating...</span>
                                </div>
                              ) : (
                                <>
                                  <FiUserPlus className="mr-1.5 sm:mr-2 -ml-1 w-3 h-3 sm:w-4 sm:h-4" />
                                  Update Secondary Roles
                                </>
                              )}
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-60 sm:h-full flex items-center justify-center"
                >
                  <div className="p-4 sm:p-8 text-center max-w-md">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-violet-500" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Select a user to manage</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                      Choose a user from the list to view and edit their role assignments and permissions.
                    </p>
                    <div className="inline-flex items-center text-xs sm:text-sm text-violet-600">
                      <FiSearch className="mr-1.5 sm:mr-2" />
                      <span>Search or filter to find specific users</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RoleManagement;
