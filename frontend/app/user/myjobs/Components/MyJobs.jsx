"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Search,
  Plus,
  Clock,
  Building,
  Eye,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useJob } from '@/lib/contexts/job-context';
import LoaderComponent from 'Components/UI/LoaderComponent';
import { toast } from 'react-hot-toast';

function MyJobs() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    jobs,
    loading,
    error,
    setError,
    pagination,
    getUserPostedJobs,
    deleteJob,
  } = useJob();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const searchTimeoutRef = useRef(null);
  const [filters, setFilters] = useState({
    status: '',
    sort: '-createdAt',
    datePosted: '',
    jobType: '',
    locationType: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch jobs with current filters
  const fetchJobs = useCallback(async () => {
    try {
      setIsSearching(true);

      const searchFilters = {
        ...filters,
        search: debouncedSearchTerm,
      };

      const jobsData = await getUserPostedJobs(searchFilters, currentPage, 10);
      const resultCount = Array.isArray(jobsData) ? jobsData.length : 0;

      // Update search results state based on search term
      if (debouncedSearchTerm) {
        setSearchResults({
          term: debouncedSearchTerm,
          count: resultCount,
        });

        // Only show toast for search results, not for regular filter changes
        if (resultCount === 0) {
          toast(`No jobs found matching "${debouncedSearchTerm}"`, {
            icon: '🔍',
            style: {
              borderRadius: '10px',
              background: '#f0f9ff',
              color: '#0369a1',
            },
          });
        } else {
          toast(`Found ${resultCount} job${resultCount === 1 ? '' : 's'} matching "${debouncedSearchTerm}"`, {
            icon: '✅',
            style: {
              borderRadius: '10px',
              background: '#f0fdf4',
              color: '#166534',
            },
          });
        }
      } else {
        // Clear search results if there's no search term
        setSearchResults(null);
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to search jobs';
      setError(errorMessage);
      toast('Failed to search jobs. Please try again.', {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#fef2f2',
          color: '#b91c1c',
        },
      });
    } finally {
      setIsSearching(false);
    }
  }, [getUserPostedJobs, filters, debouncedSearchTerm, currentPage]);

  // Debounce search term
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to update the debounced value after 500ms
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    // Cleanup function to clear the timeout if the component unmounts or searchTerm changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch jobs on component mount and when filters or search term changes
  useEffect(() => {
    if (isAuthenticated()) {
      fetchJobs();
    }
  }, [isAuthenticated, filters, currentPage, debouncedSearchTerm, fetchJobs]);

  // Handle search form submission - bypass debounce for immediate search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setDebouncedSearchTerm(searchTerm);
  };

  // Clear search and filters
  const clearSearch = useCallback(() => {
    // Clear search timeout if exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Reset all search and filter states
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSearchResults(null);
    setFilters({
      status: '',
      sort: '-createdAt',
      datePosted: '',
      jobType: '',
      locationType: '',
    });
    setCurrentPage(1);
    // The useEffect will trigger fetchJobs automatically
  }, []);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle job deletion
  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    const success = await deleteJob(jobToDelete._id);
    if (success) {
      setShowDeleteConfirm(false);
      setJobToDelete(null);
      fetchJobs(); // Refresh the job list
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if user can post jobs
  const canPostJobs = user?.roleCapabilities?.canPostJobs;

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your jobs.</p>
          <button
            onClick={() => router.push('/auth/login?redirect=/user/myjobs')}
            className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (!canPostJobs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Permission Required</h2>
          <p className="text-gray-600 mb-6">Your account doesn't have permission to post jobs.</p>
          <button
            onClick={() => router.push('/jobs')}
            className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-6xl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Job Listings</h1>
          <p className="text-gray-600">Manage your job postings and track applications</p>
        </div>
        <motion.button
          onClick={() => router.push('/jobs/post')}
          className="mt-4 md:mt-0 bg-violet-600 text-white px-6 py-3 rounded-xl hover:bg-violet-700 transition-all flex items-center gap-2 font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={18} />
          Post a New Job
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search your job listings..."
                className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isSearching}
              />
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />

              {/* Clear button - only show when there's text */}
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-20 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}

              <button
                type="submit"
                className={`absolute right-3 top-2.5 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  isSearching
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                }`}
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Search results indicator */}
            {searchResults && (
              <div className="mt-2 text-sm text-gray-600">
                {searchResults.count > 0 ? (
                  <span>Found {searchResults.count} job{searchResults.count === 1 ? '' : 's'} matching "{searchResults.term}"</span>
                ) : (
                  <span>No jobs found matching "{searchResults.term}"</span>
                )}
                <button
                  onClick={clearSearch}
                  className="ml-2 text-violet-600 hover:text-violet-800 underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className={`px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white ${
                isSearching ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isSearching}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Closed">Closed</option>
              <option value="Filled">Filled</option>
            </select>

            <select
              name="datePosted"
              value={filters.datePosted}
              onChange={handleFilterChange}
              className={`px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white ${
                isSearching ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isSearching}
            >
              <option value="">Any Date</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <select
              name="jobType"
              value={filters.jobType}
              onChange={handleFilterChange}
              className={`px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white ${
                isSearching ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isSearching}
            >
              <option value="">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
              <option value="Internship">Internship</option>
            </select>

            <select
              name="locationType"
              value={filters.locationType}
              onChange={handleFilterChange}
              className={`px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white ${
                isSearching ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isSearching}
            >
              <option value="">All Locations</option>
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Flexible">Flexible</option>
            </select>

            <select
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
              className={`px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white ${
                isSearching ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isSearching}
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="-applications">Most Applications</option>
              <option value="-views">Most Views</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.status || filters.datePosted || filters.jobType || filters.locationType || debouncedSearchTerm) && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-violet-700 mr-1">Active filters:</span>

          {debouncedSearchTerm && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
              Search: {debouncedSearchTerm}
              <button
                onClick={() => setSearchTerm('')}
                className="ml-1 text-violet-600 hover:text-violet-800"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.status && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
              Status: {filters.status}
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
                className="ml-1 text-violet-600 hover:text-violet-800"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.datePosted && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
              Date: {filters.datePosted === 'today' ? 'Today' :
                     filters.datePosted === 'week' ? 'This Week' :
                     filters.datePosted === 'month' ? 'This Month' : filters.datePosted}
              <button
                onClick={() => setFilters(prev => ({ ...prev, datePosted: '' }))}
                className="ml-1 text-violet-600 hover:text-violet-800"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.jobType && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
              Type: {filters.jobType}
              <button
                onClick={() => setFilters(prev => ({ ...prev, jobType: '' }))}
                className="ml-1 text-violet-600 hover:text-violet-800"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.locationType && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
              Location: {filters.locationType}
              <button
                onClick={() => setFilters(prev => ({ ...prev, locationType: '' }))}
                className="ml-1 text-violet-600 hover:text-violet-800"
              >
                <X size={12} />
              </button>
            </span>
          )}

          <button
            onClick={clearSearch}
            className="ml-auto text-xs text-violet-700 hover:text-violet-900 font-medium underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Job Listings */}
      {loading || isSearching ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoaderComponent size="large" />
          {isSearching && <p className="mt-4 text-gray-600">Searching for jobs...</p>}
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Jobs</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchJobs}
            className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />

          {searchResults ? (
            <>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Matching Jobs Found</h3>
              <p className="text-gray-600 mb-6">
                No jobs match your search for "{searchResults.term}". Try different search terms or clear the filters.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={clearSearch}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Search
                </button>
                <button
                  onClick={() => router.push('/jobs/post')}
                  className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2 justify-center"
                >
                  <Plus size={18} />
                  Post a New Job
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Job Listings Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't posted any jobs yet. Create your first job listing to get started.
              </p>
              <button
                onClick={() => router.push('/jobs/post')}
                className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                Post Your First Job
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search results heading */}
          {searchResults && searchResults.count > 0 && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-violet-800">
                  Search Results: {searchResults.count} job{searchResults.count === 1 ? '' : 's'} found
                </h3>
                <p className="text-sm text-violet-600">
                  Showing jobs matching "{searchResults.term}"
                </p>
              </div>
              <button
                onClick={clearSearch}
                className="px-4 py-2 bg-white border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors text-sm"
              >
                Clear Search
              </button>
            </div>
          )}

          {jobs.map((job) => job && (
            <motion.div
              key={job._id}
              className="bg-white border border-gray-100 rounded-xl p-6 hover:border-violet-200 transition-all group"
              whileHover={{ y: -2 }}
            >
              <div className="flex flex-col md:flex-row gap-5">
                {/* Company Logo */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 group-hover:border-violet-100 transition-colors">
                    {job.company?.logo ? (
                      <img
                        src={job.company.logo}
                        alt={`${job.company.name} logo`}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Building size={24} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Job Details */}
                <div className="flex-grow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-violet-700 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'Published'
                            ? 'bg-green-100 text-green-800'
                            : job.status === 'Draft'
                            ? 'bg-gray-100 text-gray-800'
                            : job.status === 'Closed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {job.status}
                      </span>
                      {job.featured && (
                        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Building size={16} className="mr-1" />
                      {job.company?.name || 'Company'}
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1" />
                      {job.jobType || 'Full-time'}
                    </div>
                    <div className="flex items-center">
                      <Eye size={16} className="mr-1" />
                      {job.views || 0} views
                    </div>
                    <div className="flex items-center">
                      <Briefcase size={16} className="mr-1" />
                      {job.applications || 0} applications
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      {job.createdAt ? `Posted on ${formatDate(job.createdAt)}` : 'Recently posted'}
                      {job.expiresAt && (
                        <span> · Expires {formatDate(job.expiresAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3 sm:mt-0">
                      {job.slug && (
                        <button
                          onClick={() => router.push(`/jobs/${job.slug}`)}
                          className="px-3 py-1.5 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View
                        </button>
                      )}
                      {job._id && (
                        <button
                          onClick={() => router.push(`/user/myjobs/edit/${job._id}`)}
                          className="px-3 py-1.5 text-sm border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-50 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {job._id && (
                        <button
                          onClick={() => handleDeleteClick(job)}
                          className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && jobs.length > 0 && pagination && pagination.pages && pagination.pages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2">
            {/* Previous Page Button */}
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Previous page"
            >
              <ChevronRight className="rotate-180" size={16} />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current page
              const showPage = page === 1 ||
                              page === pagination.pages ||
                              Math.abs(page - currentPage) <= 1;

              // Show ellipsis for gaps
              const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
              const showEllipsisAfter = page === currentPage + 2 && currentPage < pagination.pages - 2;

              if (showEllipsisBefore) {
                return (
                  <span key={`ellipsis-before-${page}`} className="w-10 h-10 flex items-center justify-center text-gray-400">
                    ...
                  </span>
                );
              }

              if (showEllipsisAfter) {
                return (
                  <span key={`ellipsis-after-${page}`} className="w-10 h-10 flex items-center justify-center text-gray-400">
                    ...
                  </span>
                );
              }

              if (showPage) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      currentPage === page
                        ? 'bg-violet-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              }

              return null;
            })}

            {/* Next Page Button */}
            <button
              onClick={() => handlePageChange(Math.min(pagination.pages, currentPage + 1))}
              disabled={currentPage === pagination.pages}
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                currentPage === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Page info */}
          <div className="mt-2 text-xs text-gray-500 text-center">
            Page {currentPage} of {pagination.pages}
            {pagination.total > 0 && ` • ${pagination.total} total job${pagination.total !== 1 ? 's' : ''}`}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete Job Listing</h3>
              <p className="text-gray-600">
                Are you sure you want to delete "{jobToDelete?.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default MyJobs;