"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "./auth-context";
import { makePriorityRequest } from "../api/api";
import logger from "../utils/logger";

// Create the context
const JobContext = createContext();

// Custom hook to use the job context
export const useJob = () => useContext(JobContext);

export const JobProvider = ({ children }) => {
  const { user } = useAuth();

  // State management
  const [jobs, setJobs] = useState([]);
  const [currentJob, setCurrentJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Clear error
  const clearError = () => setError(null);

  // Helper function to build query parameters
  const buildQueryParams = useCallback((baseParams, filters) => {
    const params = new URLSearchParams(baseParams);

    // Add common filter parameters
    const filterMapping = {
      search: "search",
      status: "status",
      datePosted: "datePosted",
      jobType: "jobType",
      locationType: "locationType",
      experienceLevel: "experienceLevel"
    };

    // Add mapped filters if they exist
    Object.entries(filterMapping).forEach(([filterKey, paramKey]) => {
      if (filters[filterKey]) {
        params.append(paramKey, filters[filterKey]);
      }
    });

    // Add any other custom filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !Object.keys(filterMapping).includes(key) && key !== 'sort') {
        params.append(key, value);
      }
    });

    return params;
  }, []);

  // Standard error handler for API requests
  const handleApiError = useCallback((error, defaultMessage) => {
    if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
      const errorMessage = error.response?.data?.message || defaultMessage;
      logger.error(`API Error: ${defaultMessage}`, error);
      setError(errorMessage);

      // Use standard toast for errors
      toast(errorMessage, {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#fef2f2',
          color: '#b91c1c',
        },
      });
    }
  }, []);

  // Fetch user's posted jobs
  const getUserPostedJobs = useCallback(async (filters = {}, page = 1, limit = 10) => {
    try {
      setLoading(true);
      clearError();

      // Build base parameters
      const baseParams = {
        page,
        limit,
        sort: filters.sort || "-createdAt",
      };

      // Build complete query parameters
      const params = buildQueryParams(baseParams, filters);

      // Make API request
      const response = await makePriorityRequest('get', '/jobs/user/posted', {
        params: Object.fromEntries(params),
      });

      if (response.data.status === "success") {
        const jobsData = response.data.data.jobs || [];
        setJobs(jobsData);

        // Set pagination with defaults if needed
        setPagination(response.data.data.pagination || {
          page,
          limit,
          total: jobsData.length,
          pages: Math.ceil(jobsData.length / limit)
        });

        return jobsData;
      } else {
        setError("Failed to fetch your posted jobs");
        toast("Failed to load your posted jobs", {
          icon: '❌',
          style: {
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#b91c1c',
          },
        });
        return [];
      }
    } catch (error) {
      handleApiError(error, "Failed to fetch your posted jobs");
      return [];
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, handleApiError]);

  // Fetch a job by ID or slug
  const getJobById = useCallback(async (idOrSlug) => {
    try {
      setLoading(true);
      clearError();

      const response = await makePriorityRequest('get', `/jobs/${idOrSlug}`);

      if (response.data.status === "success") {
        setCurrentJob(response.data.data.job);
        return response.data.data.job;
      } else {
        setError("Failed to fetch job details");
        toast("Failed to load job details", {
          icon: '❌',
          style: {
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#b91c1c',
          },
        });
        return null;
      }
    } catch (error) {
      handleApiError(error, "Failed to fetch job details");
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Helper function to prepare form data with file
  const prepareFormData = useCallback((data, file, fileFieldName) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append(fileFieldName, file);

    // Add other data to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    return formData;
  }, []);

  // Create a new job
  const createJob = useCallback(async (jobData, logoFile) => {
    try {
      setLoading(true);
      clearError();

      // Prepare form data if there's a logo file
      const formData = prepareFormData(jobData, logoFile, 'logo');

      const response = await makePriorityRequest(
        'post',
        '/jobs',
        {
          data: formData || jobData,
          isFormData: !!formData,
        }
      );

      if (response.data.status === "success") {
        toast("Job posted successfully!", {
          icon: '✅',
          style: {
            borderRadius: '10px',
            background: '#f0fdf4',
            color: '#166534',
          },
        });
        return response.data.data.job;
      } else {
        setError("Failed to create job");
        toast("Failed to create job", {
          icon: '❌',
          style: {
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#b91c1c',
          },
        });
        return null;
      }
    } catch (error) {
      handleApiError(error, "Failed to create job");
      return null;
    } finally {
      setLoading(false);
    }
  }, [prepareFormData, handleApiError]);

  // Update an existing job
  const updateJob = useCallback(async (jobId, jobData, logoFile) => {
    try {
      setLoading(true);
      clearError();

      // Prepare form data if there's a logo file
      const formData = prepareFormData(jobData, logoFile, 'logo');

      const response = await makePriorityRequest(
        'patch',
        `/jobs/${jobId}`,
        {
          data: formData || jobData,
          isFormData: !!formData,
        }
      );

      if (response.data.status === "success") {
        return response.data.data.job;
      } else {
        setError("Failed to update job");
        toast("Failed to update job", {
          icon: '❌',
          style: {
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#b91c1c',
          },
        });
        return null;
      }
    } catch (error) {
      handleApiError(error, "Failed to update job");
      return null;
    } finally {
      setLoading(false);
    }
  }, [prepareFormData, handleApiError]);

  // Delete a job
  const deleteJob = useCallback(async (jobId) => {
    try {
      setLoading(true);
      clearError();

      const response = await makePriorityRequest('delete', `/jobs/${jobId}`);

      if (response.data.status === "success") {
        toast("Job deleted successfully!", {
          icon: '✅',
          style: {
            borderRadius: '10px',
            background: '#f0fdf4',
            color: '#166534',
          },
        });
        return true;
      } else {
        setError("Failed to delete job");
        toast("Failed to delete job", {
          icon: '❌',
          style: {
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#b91c1c',
          },
        });
        return false;
      }
    } catch (error) {
      handleApiError(error, "Failed to delete job");
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Get user's job applications
  const getUserApplications = useCallback(async (filters = {}, page = 1, limit = 10) => {
    try {
      setLoading(true);
      clearError();

      // Build base parameters
      const baseParams = {
        page,
        limit,
        ...(filters.status !== "All" && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        sortBy: filters.sortBy || "createdAt",
        sortOrder: filters.sortOrder || "desc",
      };

      // Build query parameters
      const params = buildQueryParams(baseParams, filters);

      const response = await makePriorityRequest(
        'get',
        `/jobs/user/applications`,
        {
          params: Object.fromEntries(params),
        }
      );

      if (response.data.status === "success") {
        const applications = response.data.data.applications || [];
        const defaultPagination = {
          page,
          limit,
          total: applications.length,
          pages: Math.ceil(applications.length / limit)
        };

        setApplications(applications);
        setPagination(response.data.data.pagination || defaultPagination);

        return {
          applications,
          statusCounts: response.data.data.statusCounts || {},
          pagination: response.data.data.pagination || defaultPagination
        };
      } else {
        setError("Failed to fetch your applications");
        toast("Failed to load your applications", {
          icon: '❌',
          style: {
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#b91c1c',
          },
        });
        return {
          applications: [],
          statusCounts: {},
          pagination: { page, limit, total: 0, pages: 1 }
        };
      }
    } catch (error) {
      handleApiError(error, "Failed to fetch your applications");
      return { applications: [], statusCounts: {}, pagination: {} };
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, handleApiError]);

  // Apply for a job
  const applyForJob = useCallback(async (jobId, applicationData, resumeFile) => {
    try {
      setLoading(true);
      clearError();

      // Create FormData for the resume file
      const formData = new FormData();
      formData.append('resume', resumeFile);

      // Add application data to FormData
      if (applicationData.coverLetter) {
        formData.append('coverLetter', applicationData.coverLetter);
      }

      // Add any additional fields
      if (applicationData.answers && applicationData.answers.length > 0) {
        formData.append('answers', JSON.stringify(applicationData.answers));
      }

      const response = await makePriorityRequest(
        'post',
        `/jobs/${jobId}/apply`,
        {
          data: formData,
          isFormData: true,
        }
      );

      if (response.data.status === "success") {
        toast("Application submitted successfully!", {
          icon: '✅',
          style: {
            borderRadius: '10px',
            background: '#f0fdf4',
            color: '#166534',
          },
        });
        return response.data.data.application;
      } else {
        setError("Failed to submit application");
        toast("Failed to submit application", {
          icon: '❌',
          style: {
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#b91c1c',
          },
        });
        return null;
      }
    } catch (error) {
      handleApiError(error, "Failed to submit application");
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Withdraw a job application
  const withdrawApplication = useCallback(async (applicationId) => {
    try {
      setLoading(true);
      clearError();

      const response = await makePriorityRequest(
        'patch',
        `/jobs/applications/${applicationId}/withdraw`
      );

      if (response.data.status === "success") {
        toast("Application withdrawn successfully!", {
          icon: '✅',
          style: {
            borderRadius: '10px',
            background: '#f0fdf4',
            color: '#166534',
          },
        });
        return true;
      } else {
        setError("Failed to withdraw application");
        toast("Failed to withdraw application", {
          icon: '❌',
          style: {
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#b91c1c',
          },
        });
        return false;
      }
    } catch (error) {
      handleApiError(error, "Failed to withdraw application");
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Context value
  const value = {
    jobs,
    currentJob,
    applications,
    loading,
    error,
    setError,
    pagination,
    clearError,
    getUserPostedJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    getUserApplications,
    applyForJob,
    withdrawApplication,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};

export default JobContext;