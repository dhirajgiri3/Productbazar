"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FolderKanban, Search, Filter, Plus, RefreshCw, AlertTriangle, Users, Calendar, ChevronLeft, ChevronRight, ArrowDownUp } from "lucide-react";
import { useProject } from "@/lib/contexts/project-context";
import { useAuth } from "@/lib/contexts/auth-context";
import ProjectCard from "./ProjectCard";
import LoaderComponent from "../UI/LoaderComponent";

const ProjectList = ({
  initialFilters = {},
  showFilters = true,
  showSearch = true,
  showAddButton = true,
  title = "Projects",
  emptyMessage = "No projects found matching your criteria."
}) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    projects,
    loading,
    error,
    pagination,
    fetchProjects
  } = useProject();

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Create an AbortController for this effect
    const controller = new AbortController();

    // Fetch projects with the abort signal
    fetchProjects({ ...filters, search: searchTerm }, currentPage, 12, controller.signal);

    // Clean up function to abort any pending requests when component unmounts or dependencies change
    return () => {
      controller.abort();
    };
  }, [fetchProjects, filters, searchTerm, currentPage]);

  // Create a ref for the AbortController to use in event handlers
  const abortControllerRef = React.useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new AbortController
    abortControllerRef.current = new AbortController();

    // Fetch with the new controller
    fetchProjects({ ...filters, search: searchTerm }, 1, 12, abortControllerRef.current.signal);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);

    // We don't need to call fetchProjects here as the useEffect will handle it
  };

  const clearFilters = () => {
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new AbortController
    abortControllerRef.current = new AbortController();

    setFilters({});
    setSearchTerm("");
    setCurrentPage(1);
    fetchProjects({}, 1, 12, abortControllerRef.current.signal);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // We don't need to call fetchProjects here as the useEffect will handle it
  };

  return (
    <div className="space-y-6">
      {/* Minimalistic Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {title && (
          <h2 className="text-xl font-medium text-gray-800 flex items-center gap-2">
            {title}
          </h2>
        )}

        {/* Minimalistic Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {showSearch && (
              <form onSubmit={handleSearch} className="flex w-full md:w-auto">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search projects..."
                    className="px-3 py-2 pl-9 border border-gray-200 bg-gray-50 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-violet-500 w-full"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ backgroundColor: "#7c3aed" }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-violet-600 text-white px-4 py-2 rounded-r-lg transition-colors duration-200 flex items-center justify-center"
                >
                  Search
                </motion.button>
              </form>
            )}

            {showFilters && (
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <select
                    value={filters.ownerType || ""}
                    onChange={(e) => handleFilterChange("ownerType", e.target.value || undefined)}
                    className="appearance-none px-3 py-2 pl-8 border border-gray-200 bg-gray-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 pr-8 text-sm text-gray-700"
                  >
                    <option value="">All Types</option>
                    <option value="jobseeker">Job Seeker</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="agency">Agency</option>
                    <option value="startupOwner">Startup Owner</option>
                  </select>
                  <Users size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                <div className="relative">
                  <select
                    value={filters.sort || "-createdAt"}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className="appearance-none px-3 py-2 pl-8 border border-gray-200 bg-gray-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 pr-8 text-sm text-gray-700"
                  >
                    <option value="-createdAt">Newest First</option>
                    <option value="createdAt">Oldest First</option>
                    <option value="-views">Most Viewed</option>
                    <option value="-likes">Most Liked</option>
                  </select>
                  <ArrowDownUp size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                <motion.button
                  onClick={clearFilters}
                  whileHover={{ backgroundColor: "#f3f4f6" }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-2 bg-gray-50 rounded-lg transition-colors duration-200 flex items-center gap-1.5 text-sm text-gray-700 border border-gray-200 hover:bg-gray-100"
                >
                  <Filter size={14} className="text-gray-500" />
                  Clear Filters
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Minimalistic Add Project Button */}
      {showAddButton && isAuthenticated && user?.roleCapabilities?.canShowcaseProjects && (
        <motion.div
          className="mb-6 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={() => router.push("/projects/add")}
            whileHover={{ backgroundColor: "#7c3aed" }}
            whileTap={{ scale: 0.98 }}
            className="bg-violet-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-1.5 text-sm"
          >
            <Plus size={16} />
            Add Project
          </motion.button>
        </motion.div>
      )}

      {/* Project Grid */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoaderComponent size="medium" />
            <p className="mt-3 text-sm text-gray-500">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <AlertTriangle size={24} className="text-red-500 mb-3" />
              <h3 className="text-base font-medium text-gray-800 mb-2">Error Loading Projects</h3>
              <p className="text-sm text-red-500 mb-4 max-w-md">{error}</p>
              <motion.button
                whileHover={{ backgroundColor: "#7c3aed" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // Abort any previous request
                  if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                  }

                  // Create a new AbortController
                  abortControllerRef.current = new AbortController();

                  // Retry with the new controller
                  fetchProjects(filters, currentPage, 12, abortControllerRef.current.signal);
                }}
                className="bg-violet-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-1.5 text-sm"
              >
                <RefreshCw size={14} />
                Try Again
              </motion.button>
            </motion.div>
          </div>
        ) : (!projects || projects.length === 0) ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <FolderKanban size={24} className="text-gray-400 mb-3" />
              <h3 className="text-base font-medium text-gray-800 mb-2">No Projects Found</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md">
                {emptyMessage}
              </p>
              <motion.button
                whileHover={{ backgroundColor: "#7c3aed" }}
                whileTap={{ scale: 0.98 }}
                onClick={clearFilters}
                className="bg-violet-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-1.5 text-sm"
              >
                <Filter size={14} />
                Clear Filters
              </motion.button>
            </motion.div>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-4">
              Showing {projects.length} of {pagination.total} projects
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </div>

            {/* Enhanced Pagination */}
            {pagination.totalPages > 1 && (
              <motion.div
                className="flex justify-center mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex gap-2 items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                  <motion.button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
                    whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
                    className={`px-4 py-2 rounded-full flex items-center gap-1 ${currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50 transition-colors'}`}
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </motion.button>

                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      // Calculate page numbers to show (centered around current page)
                      const totalPages = pagination.totalPages;
                      const pageNumbers = [];

                      if (totalPages <= 5) {
                        // Show all pages if 5 or fewer
                        for (let i = 1; i <= totalPages; i++) {
                          pageNumbers.push(i);
                        }
                      } else {
                        // Show 5 pages centered around current page
                        let startPage = Math.max(1, currentPage - 2);
                        let endPage = Math.min(totalPages, startPage + 4);

                        // Adjust if we're near the end
                        if (endPage === totalPages) {
                          startPage = Math.max(1, endPage - 4);
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pageNumbers.push(i);
                        }
                      }

                      return pageNumbers[i];
                    }).map((page) => (
                      <motion.button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`w-10 h-10 flex items-center justify-center rounded-full ${
                          currentPage === page
                            ? "bg-violet-600 text-white shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 transition-colors"
                        }`}
                      >
                        {page}
                      </motion.button>
                    ))}
                  </div>

                  {/* Mobile pagination indicator */}
                  <div className="sm:hidden px-4 font-medium">
                    {currentPage} / {pagination.totalPages}
                  </div>

                  <motion.button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    whileHover={currentPage !== pagination.totalPages ? { scale: 1.05 } : {}}
                    whileTap={currentPage !== pagination.totalPages ? { scale: 0.95 } : {}}
                    className={`px-4 py-2 rounded-full flex items-center gap-1 ${currentPage === pagination.totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50 transition-colors'}`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={16} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
