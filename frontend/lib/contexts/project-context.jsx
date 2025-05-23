"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import api, { makePriorityRequest } from "../api/api";
import { toast } from "react-hot-toast";
import logger from "../utils/logger";

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [trendingProjects, setTrendingProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  // Fetch all projects with filtering
  const fetchProjects = useCallback(async (filters = {}, page = 1, limit = 12, signal) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page,
        limit,
        sort: filters.sort || "-createdAt",
      });

      // Add search term if exists
      if (filters.search) {
        params.append("search", filters.search);
      }

      // Add other filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'sort' && key !== 'search') {
          params.append(key, value);
        }
      });

      // Use makePriorityRequest to prevent cancellation due to duplicate requests
      const response = await makePriorityRequest('get', `/projects`, {
        params: Object.fromEntries(params),
        signal, // Pass the AbortSignal if provided
      });

      if (response.data.status === "success") {
        console.log("Projects API response:", response.data);

        // Check if projects exist in the response
        if (response.data.data && Array.isArray(response.data.data.projects)) {
          setProjects(response.data.data.projects);
          console.log("Setting projects:", response.data.data.projects.length, "items");
        } else {
          console.error("Invalid projects data structure:", response.data);
          setProjects([]);
        }

        // Set pagination data with proper structure from API response
        setPagination({
          currentPage: parseInt(response.data.currentPage) || 1,
          totalPages: parseInt(response.data.totalPages) || 1,
          total: parseInt(response.data.total) || 0,
        });

        console.log("Pagination set to:", {
          currentPage: parseInt(response.data.currentPage) || 1,
          totalPages: parseInt(response.data.totalPages) || 1,
          total: parseInt(response.data.total) || 0,
        });
      } else {
        setError("Failed to fetch projects");
        toast.error("Failed to load projects");
      }
    } catch (error) {
      // Don't show error toast for canceled requests
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || error.isNavigationCancel) {
        logger.info("Projects request was canceled, likely due to navigation or component unmount");
        // Don't set error state for canceled requests to avoid showing error UI
        return;
      }

      logger.error("Error fetching projects:", error);
      setError("An error occurred while fetching projects");
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch featured projects
  const fetchFeaturedProjects = useCallback(async (limit = 6, signal) => {
    try {
      setLoading(true);
      setError(null);

      // Use makePriorityRequest to prevent cancellation due to duplicate requests
      const response = await makePriorityRequest('get', `/projects/featured`, {
        params: { limit },
        signal, // Pass the AbortSignal if provided
      });

      if (response.data.status === "success") {
        setFeaturedProjects(response.data.data.projects);
      } else {
        logger.warn("Failed to fetch featured projects");
      }
    } catch (error) {
      // Don't log errors for canceled requests
      if (!(error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || error.isNavigationCancel)) {
        logger.error("Error fetching featured projects:", error);
      } else {
        logger.info("Featured projects request was canceled due to navigation or unmount");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch trending projects
  const fetchTrendingProjects = useCallback(async (limit = 10, days = 30, signal) => {
    try {
      setLoading(true);
      setError(null);

      // Use makePriorityRequest to prevent cancellation due to duplicate requests
      const response = await makePriorityRequest('get', `/projects/trending`, {
        params: { limit, days },
        signal, // Pass the AbortSignal if provided
      });

      if (response.data.status === "success") {
        setTrendingProjects(response.data.data.projects);
      } else {
        logger.warn("Failed to fetch trending projects");
      }
    } catch (error) {
      // Don't log errors for canceled requests
      if (!(error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || error.isNavigationCancel)) {
        logger.error("Error fetching trending projects:", error);
      } else {
        logger.info("Trending projects request was canceled due to navigation or unmount");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single project by slug
  const fetchProjectBySlug = useCallback(async (slug) => {
    try {
      setLoading(true);
      setError(null);

      // Use priority request to prevent cancellation due to duplicate requests
      const response = await makePriorityRequest('get', `/projects/${slug}`);

      if (response.data.status === "success") {
        setCurrentProject(response.data.data.project);
        return response.data.data.project;
      } else {
        setError("Failed to fetch project details");
        toast.error("Failed to load project details");
        return null;
      }
    } catch (error) {
      // Don't show error toast for canceled requests
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        logger.info("Project details request was canceled, likely due to navigation");
        // Don't set error state for canceled requests to avoid showing error UI
        return null;
      }

      logger.error("Error fetching project details:", error);
      setError("An error occurred while fetching project details");
      toast.error("Failed to load project details");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new project
  const createProject = useCallback(async (projectData, files) => {
    try {
      setLoading(true);
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();

      // Add JSON data
      formData.append("data", JSON.stringify(projectData));

      // Add files if they exist
      if (files?.thumbnail) {
        formData.append("thumbnail", files.thumbnail);
      }

      if (files?.gallery && files.gallery.length > 0) {
        files.gallery.forEach(file => {
          formData.append("gallery", file);
        });
      }

      if (files?.clientLogo) {
        formData.append("clientLogo", files.clientLogo);
      }

      // Use makePriorityRequest to prevent cancellation
      const response = await makePriorityRequest('post', `/projects`, {
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        toast.success("Project created successfully!");
        return response.data.data.project;
      } else {
        setError("Failed to create project");
        toast.error("Failed to create project");
        return null;
      }
    } catch (error) {
      // Don't show error for canceled requests
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || error.isNavigationCancel) {
        logger.info("Create project request was canceled due to navigation or unmount");
        return null;
      }

      logger.error("Error creating project:", error);
      setError("An error occurred while creating the project");
      toast.error(error.response?.data?.message || "Failed to create project");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing project
  const updateProject = useCallback(async (projectId, projectData, files) => {
    try {
      setLoading(true);
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();

      // Add JSON data
      formData.append("data", JSON.stringify(projectData));

      // Add files if they exist
      if (files?.thumbnail) {
        formData.append("thumbnail", files.thumbnail);
      }

      if (files?.gallery && files.gallery.length > 0) {
        files.gallery.forEach(file => {
          formData.append("gallery", file);
        });
      }

      if (files?.clientLogo) {
        formData.append("clientLogo", files.clientLogo);
      }

      // Use makePriorityRequest to prevent cancellation
      const response = await makePriorityRequest('patch', `/projects/${projectId}`, {
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        // Update projects list if it exists
        if (projects.length > 0) {
          setProjects(prevProjects =>
            prevProjects.map(project =>
              project._id === projectId ? response.data.data.project : project
            )
          );
        }

        // Update current project if it matches
        if (currentProject && currentProject._id === projectId) {
          setCurrentProject(response.data.data.project);
        }

        // Update featured projects if needed
        if (featuredProjects.length > 0) {
          setFeaturedProjects(prevProjects =>
            prevProjects.map(project =>
              project._id === projectId ? response.data.data.project : project
            )
          );
        }

        // Update trending projects if needed
        if (trendingProjects.length > 0) {
          setTrendingProjects(prevProjects =>
            prevProjects.map(project =>
              project._id === projectId ? response.data.data.project : project
            )
          );
        }

        toast.success("Project updated successfully!");
        return response.data.data.project;
      } else {
        setError("Failed to update project");
        toast.error("Failed to update project");
        return null;
      }
    } catch (error) {
      // Don't show error for canceled requests
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || error.isNavigationCancel) {
        logger.info("Update project request was canceled due to navigation or unmount");
        return null;
      }

      logger.error("Error updating project:", error);
      setError("An error occurred while updating the project");
      toast.error(error.response?.data?.message || "Failed to update project");
      return null;
    } finally {
      setLoading(false);
    }
  }, [projects, currentProject, featuredProjects, trendingProjects]);

  // Delete a project
  const deleteProject = useCallback(async (projectId) => {
    try {
      setLoading(true);
      setError(null);

      // Use makePriorityRequest to prevent cancellation
      const response = await makePriorityRequest('delete', `/projects/${projectId}`);

      if (response.data.status === "success") {
        // Remove project from projects list if it exists
        if (projects.length > 0) {
          setProjects(prevProjects => prevProjects.filter(project => project._id !== projectId));
        }

        // Remove from featured projects if needed
        if (featuredProjects.length > 0) {
          setFeaturedProjects(prevProjects => prevProjects.filter(project => project._id !== projectId));
        }

        // Remove from trending projects if needed
        if (trendingProjects.length > 0) {
          setTrendingProjects(prevProjects => prevProjects.filter(project => project._id !== projectId));
        }

        // Clear current project if it's the one being deleted
        if (currentProject && currentProject._id === projectId) {
          setCurrentProject(null);
        }

        toast.success("Project deleted successfully!");
        return true;
      } else {
        setError("Failed to delete project");
        toast.error("Failed to delete project");
        return false;
      }
    } catch (error) {
      // Don't show error for canceled requests
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || error.isNavigationCancel) {
        logger.info("Delete project request was canceled due to navigation or unmount");
        return false;
      }

      logger.error("Error deleting project:", error);
      setError("An error occurred while deleting the project");
      toast.error(error.response?.data?.message || "Failed to delete project");
      return false;
    } finally {
      setLoading(false);
    }
  }, [projects, currentProject, featuredProjects, trendingProjects]);

  // Like a project
  const likeProject = useCallback(async (projectId) => {
    try {
      const response = await api.post(`/projects/${projectId}/like`);

      if (response.data.status === "success") {
        // Update the current project if it's the one being liked
        if (currentProject && currentProject._id === projectId) {
          setCurrentProject(prev => ({
            ...prev,
            likes: response.data.data.likes
          }));
        }
        return response.data.data.likes;
      } else {
        toast.error("Failed to like project");
        return null;
      }
    } catch (error) {
      logger.error("Error liking project:", error);
      toast.error("Failed to like project");
      return null;
    }
  }, [currentProject]);

  // Unlike a project
  const unlikeProject = useCallback(async (projectId) => {
    try {
      const response = await api.post(`/projects/${projectId}/unlike`);

      if (response.data.status === "success") {
        // Update the current project if it's the one being unliked
        if (currentProject && currentProject._id === projectId) {
          setCurrentProject(prev => ({
            ...prev,
            likes: response.data.data.likes
          }));
        }
        return response.data.data.likes;
      } else {
        toast.error("Failed to unlike project");
        return null;
      }
    } catch (error) {
      logger.error("Error unliking project:", error);
      toast.error("Failed to unlike project");
      return null;
    }
  }, [currentProject]);

  // Track a project share
  const trackShare = useCallback(async (projectId, platform) => {
    try {
      await api.post(`/projects/${projectId}/share`, { platform });
    } catch (error) {
      logger.error("Error tracking project share:", error);
    }
  }, []);

  // Track a project click
  const trackClick = useCallback(async (projectId, target) => {
    try {
      await api.post(`/projects/${projectId}/click`, { target });
    } catch (error) {
      logger.error("Error tracking project click:", error);
    }
  }, []);

  // Get project analytics
  const getProjectAnalytics = useCallback(async (projectId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/projects/${projectId}/analytics`);

      if (response.data.status === "success") {
        return response.data.data.analytics;
      } else {
        setError("Failed to fetch project analytics");
        toast.error("Failed to load project analytics");
        return null;
      }
    } catch (error) {
      logger.error("Error fetching project analytics:", error);
      setError("An error occurred while fetching project analytics");
      toast.error("Failed to load project analytics");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a comment to a project
  const addComment = useCallback(async (projectId, content, parentCommentId = null) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/projects/${projectId}/comments`, {
        content,
        parentCommentId
      });

      if (response.data.status === "success") {
        toast.success("Comment added successfully!");
        return response.data.data.comment;
      } else {
        setError("Failed to add comment");
        toast.error("Failed to add comment");
        return null;
      }
    } catch (error) {
      logger.error("Error adding comment:", error);
      setError("An error occurred while adding the comment");
      toast.error(error.response?.data?.message || "Failed to add comment");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get comments for a project
  const getComments = useCallback(async (projectId, page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/projects/${projectId}/comments?page=${page}&limit=${limit}`);

      if (response.data.status === "success") {
        return {
          comments: response.data.data.comments,
          pagination: {
            currentPage: response.data.currentPage,
            totalPages: response.data.totalPages,
            total: response.data.total
          }
        };
      } else {
        setError("Failed to fetch comments");
        return { comments: [], pagination: { currentPage: 1, totalPages: 1, total: 0 } };
      }
    } catch (error) {
      logger.error("Error fetching comments:", error);
      setError("An error occurred while fetching comments");
      return { comments: [], pagination: { currentPage: 1, totalPages: 1, total: 0 } };
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a collaborator to a project
  const addCollaborator = useCallback(async (projectId, userId, role, permissions) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/projects/${projectId}/collaborators`, {
        userId,
        role,
        permissions
      });

      if (response.data.status === "success") {
        toast.success("Collaborator added successfully!");
        return response.data.data.collaborators;
      } else {
        setError("Failed to add collaborator");
        toast.error("Failed to add collaborator");
        return null;
      }
    } catch (error) {
      logger.error("Error adding collaborator:", error);
      setError("An error occurred while adding the collaborator");
      toast.error(error.response?.data?.message || "Failed to add collaborator");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get collaborators for a project
  const getCollaborators = useCallback(async (projectId, signal) => {
    try {
      setLoading(true);
      setError(null);

      // Use makePriorityRequest to ensure this request gets priority
      // and is less likely to be canceled by other requests
      const response = await api.get(`/projects/${projectId}/collaborators`, {
        signal, // Pass the AbortSignal if provided
        params: {
          _priority: 'high' // Mark as high priority
        }
      });

      if (response.data.status === "success") {
        return response.data.data.collaborators;
      } else {
        setError("Failed to fetch collaborators");
        return [];
      }
    } catch (error) {
      // Don't set error state for canceled requests
      if (!error.isNavigationCancel && error.code !== "ERR_CANCELED" && error.name !== "CanceledError") {
        logger.error("Error fetching collaborators:", error);
        setError("An error occurred while fetching collaborators");
      } else {
        logger.info("Collaborators request canceled due to navigation or unmount");
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Add gallery items to a project
  const addGalleryItems = useCallback(async (projectId, files, captions = []) => {
    try {
      setLoading(true);
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();

      // Add files
      files.forEach((file, index) => {
        formData.append("gallery", file);
        if (captions[index]) {
          formData.append("captions", captions[index]);
        }
      });

      const response = await api.post(`/projects/${projectId}/gallery`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        toast.success("Gallery items added successfully!");
        return response.data.data.gallery;
      } else {
        setError("Failed to add gallery items");
        toast.error("Failed to add gallery items");
        return null;
      }
    } catch (error) {
      logger.error("Error adding gallery items:", error);
      setError("An error occurred while adding gallery items");
      toast.error(error.response?.data?.message || "Failed to add gallery items");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reorder gallery items
  const reorderGalleryItems = useCallback(async (projectId, itemIds) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/projects/${projectId}/gallery/reorder`, {
        itemIds
      });

      if (response.data.status === "success") {
        toast.success("Gallery reordered successfully!");
        return response.data.data.gallery;
      } else {
        setError("Failed to reorder gallery");
        toast.error("Failed to reorder gallery");
        return null;
      }
    } catch (error) {
      logger.error("Error reordering gallery:", error);
      setError("An error occurred while reordering the gallery");
      toast.error(error.response?.data?.message || "Failed to reorder gallery");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove a gallery item
  const removeGalleryItem = useCallback(async (projectId, itemId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.delete(`/projects/${projectId}/gallery/${itemId}`);

      if (response.data.status === "success") {
        toast.success("Gallery item removed successfully!");
        return true;
      } else {
        setError("Failed to remove gallery item");
        toast.error("Failed to remove gallery item");
        return false;
      }
    } catch (error) {
      logger.error("Error removing gallery item:", error);
      setError("An error occurred while removing the gallery item");
      toast.error(error.response?.data?.message || "Failed to remove gallery item");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    projects,
    featuredProjects,
    trendingProjects,
    currentProject,
    loading,
    error,
    pagination,
    fetchProjects,
    fetchFeaturedProjects,
    fetchTrendingProjects,
    fetchProjectBySlug,
    createProject,
    updateProject,
    deleteProject,
    likeProject,
    unlikeProject,
    trackShare,
    trackClick,
    getProjectAnalytics,
    addComment,
    getComments,
    addCollaborator,
    getCollaborators,
    addGalleryItems,
    reorderGalleryItems,
    removeGalleryItem,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
