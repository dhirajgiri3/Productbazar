"use client";

import React, { useState, useEffect } from 'react';
import { FiBriefcase, FiDollarSign, FiUsers, FiBookOpen, FiAward, FiTrendingUp, FiGlobe, FiSettings, FiInfo, FiSave } from 'react-icons/fi';
import { makePriorityRequest } from "@/lib/api/api";
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

// Import role-specific form components
import StartupOwnerForm from './RoleForms/StartupOwnerForm';
import InvestorForm from './RoleForms/InvestorForm';
import AgencyForm from './RoleForms/AgencyForm';
import FreelancerForm from './RoleForms/FreelancerForm';
import JobseekerForm from './RoleForms/JobseekerForm';

const RoleDetailsSection = ({ user, FormSection, FormField }) => {
  const [roleDetails, setRoleDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch role-specific details
  useEffect(() => {
    const fetchRoleDetails = async () => {
      if (!user?._id || !user?.role || user.role === 'user' || user.role === 'admin') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await makePriorityRequest('get', `/users/${user._id}/role-details`);

        if (response.data.status === 'success' && response.data.data) {
          setRoleDetails(response.data.data);

          // Initialize form data based on role details
          const initialFormData = {};
          Object.keys(response.data.data).forEach(key => {
            // Skip the user reference and MongoDB fields
            if (key !== 'user' && key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
              // Transform interests array if present
              if (key === 'interests' && Array.isArray(response.data.data[key])) {
                initialFormData[key] = transformInterests(response.data.data[key]);
              } else {
                initialFormData[key] = response.data.data[key];
              }
            }
          });

          setFormData(initialFormData);
        }
      } catch (err) {
        console.error('Error fetching role details:', err);
        setError('Failed to load role-specific details');
        toast.error('Failed to load role-specific details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoleDetails();
  }, [user?._id, user?.role]);

  // Transform interests from array of objects to array of strings for the form
  const transformInterests = (interests) => {
    if (!interests || !Array.isArray(interests)) return [];
    return interests.map(interest => {
      return typeof interest === 'object' ? interest.name : interest;
    });
  };

  // Transform interests from array of strings to array of objects for the API
  const transformInterestsForApi = (interests) => {
    if (!interests || !Array.isArray(interests)) return [];
    return interests.map(interest => {
      return typeof interest === 'object' ? interest : { name: interest, strength: 5 };
    });
  };

  // Handle form data changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle arrays and other fields
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked :
                Array.isArray(prev[name]) && Array.isArray(value) ? value :
                value
      }));
    }

    // Clear errors for the field that was just changed
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Save role-specific details
  const saveRoleDetails = async () => {
    if (!user?._id || !user?.role || user.role === 'user' || user.role === 'admin') {
      return;
    }

    try {
      setIsSaving(true);

      // Prepare the data for the API
      const formDataForApi = { ...formData };

      // Transform interests if present
      if (formDataForApi.interests) {
        formDataForApi.interests = transformInterestsForApi(formDataForApi.interests);
      }

      const roleDetailsData = {
        roleDetails: {
          [user.role]: formDataForApi
        }
      };

      // Update the profile with role-specific details
      const response = await makePriorityRequest('put', '/auth/profile', roleDetailsData);

      if (response.data.status === 'success') {
        toast.success('Role details updated successfully');

        // Dispatch profile updated event
        window.dispatchEvent(new CustomEvent('profile:updated', {
          detail: { user: response.data.data.user }
        }));
      }
    } catch (err) {
      console.error('Error saving role details:', err);
      toast.error('Failed to save role-specific details');

      // Handle validation errors
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Render the appropriate form based on user role
  const renderRoleForm = () => {
    if (isLoading) {
      return (
        <div className="py-8 text-center text-gray-500">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-gray-200 border-t-violet-600 rounded-full animate-spin"></div>
          <p>Loading role details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-8 text-center text-red-500">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm bg-violet-50 text-violet-700 rounded-md hover:bg-violet-100"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!user?.role || user.role === 'user' || user.role === 'admin') {
      return (
        <div className="py-8 text-center text-gray-500">
          <p>No role-specific settings available for your account type.</p>
        </div>
      );
    }

    // Render the appropriate form based on user role
    switch (user.role) {
      case 'startupOwner':
        return (
          <StartupOwnerForm
            formData={formData}
            handleChange={handleChange}
            formErrors={formErrors}
            FormField={FormField}
          />
        );
      case 'investor':
        return (
          <InvestorForm
            formData={formData}
            handleChange={handleChange}
            formErrors={formErrors}
            FormField={FormField}
          />
        );
      case 'agency':
        return (
          <AgencyForm
            formData={formData}
            handleChange={handleChange}
            formErrors={formErrors}
            FormField={FormField}
          />
        );
      case 'freelancer':
        return (
          <FreelancerForm
            formData={formData}
            handleChange={handleChange}
            formErrors={formErrors}
            FormField={FormField}
          />
        );
      case 'jobseeker':
        return (
          <JobseekerForm
            formData={formData}
            handleChange={handleChange}
            formErrors={formErrors}
            FormField={FormField}
          />
        );
      default:
        return (
          <div className="py-8 text-center text-gray-500">
            <p>No specific settings available for your role: {user.role}</p>
          </div>
        );
    }
  };

  // If user has no role or is a basic user/admin, don't render this section
  if (!user?.role || user.role === 'user' || user.role === 'admin') {
    return null;
  }

  // Get role title for display
  const getRoleTitle = () => {
    switch (user.role) {
      case 'startupOwner': return 'Startup Owner';
      case 'investor': return 'Investor';
      case 'agency': return 'Agency';
      case 'freelancer': return 'Freelancer';
      case 'jobseeker': return 'Job Seeker';
      case 'maker': return 'Maker';
      default: return user.role;
    }
  };

  // Get role icon for display
  const getRoleIcon = () => {
    switch (user.role) {
      case 'startupOwner': return FiTrendingUp;
      case 'investor': return FiDollarSign;
      case 'agency': return FiUsers;
      case 'freelancer': return FiBriefcase;
      case 'jobseeker': return FiBookOpen;
      case 'maker': return FiAward;
      default: return FiSettings;
    }
  };

  return (
    <FormSection title={`${getRoleTitle()} Settings`} icon={getRoleIcon()}>
      <div className="bg-violet-50 rounded-lg p-4 border border-violet-100 mb-6">
        <p className="text-sm text-violet-700 flex items-center">
          <FiInfo className="mr-2 flex-shrink-0" />
          These settings are specific to your role as a {getRoleTitle().toLowerCase()}. Completing this information will enhance your profile and improve your experience on ProductBazar.
        </p>
      </div>

      {renderRoleForm()}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={saveRoleDetails}
          disabled={isSaving || isLoading}
          className={clsx(
            "px-4 py-2 rounded-md text-white text-sm font-medium flex items-center",
            (isSaving || isLoading)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-700 transition-colors"
          )}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FiSave className="mr-2" />
              Save Role Details
            </>
          )}
        </button>
      </div>
    </FormSection>
  );
};

export default RoleDetailsSection;
