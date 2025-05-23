"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiTrendingUp, FiDollarSign, FiUsers, FiBriefcase, FiBookOpen, FiAward, FiPlus, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

const RoleSelector = ({ user, refreshUserData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role || 'user');

  // Available roles
  const roles = [
    { id: 'user', name: 'Basic User', icon: FiUser, description: 'Regular user account with basic access' },
    { id: 'startupOwner', name: 'Startup Owner', icon: FiTrendingUp, description: 'For founders and startup team members' },
    { id: 'investor', name: 'Investor', icon: FiDollarSign, description: 'For angel investors and VCs' },
    { id: 'agency', name: 'Agency', icon: FiUsers, description: 'For service agencies and consultancies' },
    { id: 'freelancer', name: 'Freelancer', icon: FiBriefcase, description: 'For independent professionals' },
    { id: 'jobseeker', name: 'Job Seeker', icon: FiBookOpen, description: 'For those looking for job opportunities' },
    { id: 'maker', name: 'Maker', icon: FiAward, description: 'For product creators and builders' }
  ];

  // Handle role change
  const handleRoleChange = async (roleId) => {
    if (roleId === user?.role || (user?.secondaryRoles && user.secondaryRoles.includes(roleId))) {
      setIsOpen(false);
      return;
    }

    // Show a modal or toast explaining that role changes require admin approval
    setIsLoading(true);

    try {
      // Get the role name for the toast message
      const roleName = getRoleName(roleId);

      // Create a more detailed message about the role request process
      toast.success(
        <div>
          <p className="font-medium mb-1">Role request submitted</p>
          <p className="text-sm mb-1">
            Your request for the <span className="font-medium">{roleName}</span> role has been noted.
          </p>
          <p className="text-sm">
            An administrator will review your request and update your profile accordingly.
          </p>
        </div>,
        { duration: 6000 }
      );

      // In a real implementation, you would send a request to the backend here
      // For example:
      // await api.post('/user/role-requests', {
      //   roleId,
      //   requestType: user?.role === 'user' ? 'primary' : 'secondary'
      // });

      // Reset to current role
      setSelectedRole(user?.role);
    } catch (err) {
      console.error('Error handling role change:', err);
      toast.error('An error occurred while processing your request');
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  // Get role name by ID
  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  };

  // Get role icon by ID
  const getRoleIcon = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.icon : FiUser;
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-1">Your Role</h3>
            <p className="text-sm text-gray-500">
              Your current role is <span className="font-medium text-violet-700">{getRoleName(user?.role)}</span>
            </p>
          </div>

          <div className="relative">
            <motion.button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              disabled={isLoading}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium flex items-center",
                isLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
              )}
              whileHover={isLoading ? {} : { scale: 1.02 }}
              whileTap={isLoading ? {} : { scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-violet-300 border-t-transparent animate-spin mr-2"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FiUser className="mr-2" />
                  View Roles
                </>
              )}
            </motion.button>

            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
              >
                <div className="p-3 border-b border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700">Available Roles</h4>
                  <p className="text-xs text-gray-500">You can request roles you don't already have</p>
                  <p className="text-xs text-gray-500 mt-1">All role changes require admin approval</p>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {roles.map((role) => {
                    const RoleIcon = role.icon;
                    const isCurrentRole = user?.role === role.id;
                    const isSecondaryRole = user?.secondaryRoles?.includes(role.id);
                    const isAlreadyAssigned = isCurrentRole || isSecondaryRole;

                    return (
                      <div
                        key={role.id}
                        className={clsx(
                          "w-full text-left p-3 flex items-start",
                          isCurrentRole ? "bg-violet-50" : isSecondaryRole ? "bg-gray-50" : "hover:bg-gray-50 transition-colors"
                        )}
                      >
                        {/* We're using a div instead of a button since role changes require admin approval */}
                        <div className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                          isCurrentRole ? "bg-violet-100 text-violet-600" :
                          isSecondaryRole ? "bg-gray-100 text-gray-600" : "bg-gray-100 text-gray-500"
                        )}>
                          <RoleIcon size={16} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className={clsx(
                              "font-medium text-sm",
                              isCurrentRole ? "text-violet-700" :
                              isSecondaryRole ? "text-gray-700" : "text-gray-700"
                            )}>
                              {role.name}
                            </span>

                            {isCurrentRole && (
                              <span className="ml-2 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                                Current Primary
                              </span>
                            )}

                            {!isCurrentRole && isSecondaryRole && (
                              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                Current Secondary
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mt-0.5">
                            {role.description}
                          </p>

                          {!isAlreadyAssigned && (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(role.id)}
                              className="mt-2 text-xs text-violet-600 hover:text-violet-800 transition-colors"
                            >
                              Request this role
                            </button>
                          )}
                        </div>

                        {isAlreadyAssigned && (
                          <div className="ml-2 text-violet-600">
                            <FiCheck size={16} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 border-t border-gray-100 text-xs text-gray-500">
                  <p className="mb-1">Role requests are reviewed by administrators.</p>
                  <p className="mb-1">Primary roles determine your main capabilities.</p>
                  <p>Secondary roles grant additional features without changing your primary role.</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {user?.secondaryRoles && user.secondaryRoles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Your Secondary Roles</h4>
            <div className="flex flex-wrap gap-2">
              {user.secondaryRoles.map((roleId) => {
                if (roleId === user.role) return null; // Skip if it's the primary role

                const RoleIcon = getRoleIcon(roleId);

                return (
                  <div
                    key={roleId}
                    className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full text-xs"
                  >
                    <RoleIcon size={12} className="mr-1.5" />
                    {getRoleName(roleId)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelector;
