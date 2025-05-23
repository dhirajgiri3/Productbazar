"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from 'framer-motion';
import axios from "axios";
import {
  Briefcase,
  Search,
  MapPin,
  Filter,
  Plus,
  Clock,
  DollarSign,
  Building,
  X,
  ChevronDown,
  Sparkles,
  Sliders,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import logger from "@/lib/utils/logger";
import LoaderComponent from "Components/UI/LoaderComponent";
import { makePriorityRequest } from "@/lib/api/api";

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Advanced search utility - processes search terms intelligently
const processSearchQuery = (query) => {
  if (!query) return "";

  // Trim and normalize whitespace
  const normalizedQuery = query.trim().replace(/\s+/g, ' ');

  // Check if it's already a complex query with quotes or operators
  if (normalizedQuery.includes('"') ||
      normalizedQuery.includes('OR') ||
      normalizedQuery.includes('AND')) {
    return normalizedQuery;
  }

  // Split into words for analysis
  const words = normalizedQuery.split(' ');

  // If it's a single word or short phrase, return as is
  if (words.length <= 2) return normalizedQuery;

  // For longer queries, try to identify key terms
  // Common job titles and roles often have 2+ words
  const jobTitlePatterns = [
    /\b(software|web|frontend|backend|full.?stack)\s+(developer|engineer|architect)\b/i,
    /\b(product|project)\s+(manager|lead|owner)\b/i,
    /\b(ux|ui|user\s+experience|user\s+interface)\s+(designer|developer)\b/i,
    /\b(data\s+scientist|data\s+analyst|machine\s+learning)\b/i,
    /\b(devops|sre|site\s+reliability)\b/i,
    /\b(marketing|sales|finance|hr)\s+(specialist|manager|coordinator)\b/i
  ];

  // Check if query contains common job title patterns
  for (const pattern of jobTitlePatterns) {
    if (pattern.test(normalizedQuery)) {
      // If it matches a job title pattern, prioritize that match
      const match = normalizedQuery.match(pattern);
      if (match && match[0]) {
        // Add quotes around the job title for exact matching
        const exactMatch = `"${match[0]}"`;
        // Remove the matched part and add remaining terms
        const remaining = normalizedQuery.replace(pattern, '').trim();
        return remaining ? `${exactMatch} ${remaining}` : exactMatch;
      }
    }
  }

  // If no specific patterns matched, try to handle common search terms
  // For single words that might be part of job titles, expand the search
  if (words.length === 1) {
    const commonJobTerms = {
      'software': 'software developer OR software engineer',
      'web': 'web developer OR web designer',
      'frontend': 'frontend developer OR frontend engineer',
      'backend': 'backend developer OR backend engineer',
      'fullstack': 'fullstack developer OR full stack developer',
      'product': 'product manager OR product owner',
      'project': 'project manager',
      'data': 'data scientist OR data analyst OR data engineer',
      'designer': 'ui designer OR ux designer OR graphic designer',
      'marketing': 'marketing specialist OR marketing manager',
      'sales': 'sales representative OR sales manager',
      'developer': 'software developer OR web developer',
      'engineer': 'software engineer OR systems engineer',
      'manager': 'product manager OR project manager OR manager'
    };

    const lowerQuery = normalizedQuery.toLowerCase();
    if (commonJobTerms[lowerQuery]) {
      return commonJobTerms[lowerQuery];
    }
  }

  // If no specific patterns matched, return the normalized query
  return normalizedQuery;
};

export default function JobsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [draftFilters, setDraftFilters] = useState({
    jobType: "",
    locationType: "",
    experienceLevel: "",
  });
  const [filters, setFilters] = useState({
    jobType: "",
    locationType: "",
    experienceLevel: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Debounced search function with advanced processing
  const debouncedSearch = useCallback(
    debounce((value) => {
      // Process the search query for more intelligent searching
      const processedQuery = processSearchQuery(value);
      console.log('Original search:', value, 'Processed search:', processedQuery);

      setSearchTerm(processedQuery);
      // Reset to page 1 when search changes
      if (pagination.currentPage !== 1) {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      }
    }, 500),
    [pagination.currentPage]
  );

  // Fetch jobs with proper error handling and cancellation management
  const fetchJobs = async (page = 1, options = {}) => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      // Build query parameters
      const params = {
        page,
        limit: 10,
        sort: "-createdAt",
        status: "Published", // Explicitly request published jobs
      };

      // Handle search term with priority and validation
      let searchQuery = "";

      // Priority 1: Direct option passed to function
      if (options.search !== undefined) {
        searchQuery = options.search;
      }
      // Priority 2: Current search term state
      else if (searchTerm) {
        searchQuery = searchTerm;
      }

      // Only add search param if we have a non-empty search
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();

        // Add additional search parameters to improve results
        // This helps with MongoDB text search
        params.searchFields = 'title,description,skills,company.name';

        // Try to match partial words as well
        params.searchMode = 'flexible';
      }

      // Add filters if selected (from state or options)
      const activeFilters = options.filters || filters;
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) {
          params[key] = value;
        }
      });

      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5004/api/v1"
      }/jobs`;

      // Log the exact request details
      logger.info(`Fetching jobs from: ${apiUrl}`, { params });
      console.log("Fetching jobs with params:", params);
      console.log("Search term:", searchTerm, "Search input value:", searchInputValue);
      console.log("Active filters:", activeFilters);

      setIsSearching(true);

      // Use makePriorityRequest for better handling of API calls
      const response = await makePriorityRequest('get', '/jobs', {
        params,
        signal, // Pass the abort signal
      });
      // End of makePriorityRequest

      logger.info("API Response received:", response.data);

      // Log the search results for debugging
      if (params.search) {
        console.log(`Search results for "${params.search}":`,
          response.data?.data?.jobs?.length || 0, "jobs found");

        // If no results found with text search, try a fallback search
        if (response.data?.data?.jobs?.length === 0 && !options.isRetry) {
          console.log("No results with text search, trying fallback search...");

          // Create a new params object without the text search
          const fallbackParams = { ...params };
          delete fallbackParams.search;
          delete fallbackParams.searchFields;
          delete fallbackParams.searchMode;

          // Add regex search for title and skills
          fallbackParams.titleRegex = params.search;
          fallbackParams.skillsRegex = params.search;

          // Try the fallback search
          return await fetchJobs(page, {
            ...options,
            params: fallbackParams,
            isRetry: true // Prevent infinite retry loop
          });
        }
      }

      // Only update state if the request wasn't aborted
      if (!signal.aborted) {
        if (response.data && response.data.status === "success") {
          // More robust check for jobs array
          const jobsData = response.data.data?.jobs || response.data.jobs || [];

          if (!Array.isArray(jobsData)) {
            logger.warn(
              "Received jobs data is not an array:",
              response.data.data
            );
            setJobs([]);
            setError("Received invalid job data format from server.");
          } else {
            setJobs(jobsData);
            logger.info(`Successfully fetched ${jobsData.length} jobs.`);
          }

          // Set pagination data - ensure defaults if properties are missing
          setPagination({
            currentPage: response.data.currentPage || page,
            totalPages: response.data.totalPages || 1,
            total:
              response.data.total ?? response.data.results ?? jobsData.length, // Use nullish coalescing
          });
        } else {
          const errorMessage =
            response.data?.message ||
            "API request failed with status: " + response.data?.status;
          logger.error("API request failed:", {
            status: response.data?.status,
            message: errorMessage,
          });
          setError(errorMessage);
          setJobs([]); // Clear jobs on failure
        }
      } else {
        logger.warn("Job fetch request was aborted.");
      }
    } catch (error) {
      // Only update state if the request wasn't aborted
      if (!signal.aborted) {
        if (axios.isCancel(error)) {
          logger.warn("Request canceled:", error.message);
        } else {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "An unexpected error occurred while fetching jobs";
          logger.error("Error fetching jobs:", error);
          console.error("Detailed error fetching jobs:", {
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data,
            config: error.config, // Log request config
          });

          setError(errorMessage);
          setJobs([]); // Clear jobs on error
        }
      } else {
        logger.warn(
          "Job fetch request was aborted before error could be processed."
        );
      }
    } finally {
      // Only update loading state if the request wasn't aborted
      if (!signal.aborted) {
        setLoading(false);
        setIsSearching(false);
      }
    }
  };

  // Apply filters function
  const applyFilters = () => {
    setFilters({ ...draftFilters });
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Reset all filters and search
  const resetAllFilters = () => {
    setSearchInputValue("");
    setSearchTerm("");
    setDraftFilters({
      jobType: "",
      locationType: "",
      experienceLevel: "",
    });
    setFilters({
      jobType: "",
      locationType: "",
      experienceLevel: "",
    });
    // Reset to page 1
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // Return true to indicate success (useful for chaining)
    return true;
  };

  // Generate search suggestions based on input
  const generateSearchSuggestions = (value) => {
    if (!value.trim()) {
      setSearchSuggestions([]);
      return;
    }

    // Common job titles and keywords for suggestions
    const commonJobTitles = [
      'Software Developer', 'Web Developer', 'Frontend Developer', 'Backend Developer',
      'Full Stack Developer', 'UI/UX Designer', 'Product Manager', 'Project Manager',
      'Data Scientist', 'Data Analyst', 'DevOps Engineer', 'QA Engineer',
      'Marketing Specialist', 'Sales Representative', 'Content Writer', 'Graphic Designer'
    ];

    // Filter suggestions based on input
    const lowerValue = value.toLowerCase();
    const filteredSuggestions = commonJobTitles
      .filter(title => title.toLowerCase().includes(lowerValue))
      .slice(0, 5); // Limit to 5 suggestions

    setSearchSuggestions(filteredSuggestions);
  };

  // Handle search input change with debounce
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInputValue(value);

    // If the input is cleared, reset search immediately
    if (!value.trim()) {
      setSearchTerm("");
      setSearchSuggestions([]);
      setShowSuggestions(false);
      fetchJobs(1);
      return;
    }

    // Generate suggestions
    generateSearchSuggestions(value);
    setShowSuggestions(true);

    // Use debounced search
    debouncedSearch(value);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchInputValue(suggestion);
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    fetchJobs(1, { search: suggestion });
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setDraftFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // Effect to fetch jobs when search term or filters change
  useEffect(() => {
    fetchJobs(pagination.currentPage);

    // Cleanup function to abort any pending requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, filters, pagination.currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();

    // Don't do anything if the search input is empty
    if (!searchInputValue.trim()) return;

    // Process the search query for more intelligent searching
    const processedQuery = processSearchQuery(searchInputValue);
    console.log('Search submitted:', searchInputValue, 'Processed:', processedQuery);

    // Explicitly set the search term from the processed input value
    setSearchTerm(processedQuery);

    // Reset to page 1 when search is submitted
    setPagination(prev => ({ ...prev, currentPage: 1 }));

    // Clear any previous errors
    setError(null);

    // Show loading state
    setLoading(true);
    setIsSearching(true);

    // Trigger a fetch immediately with the processed search term
    fetchJobs(1, { search: processedQuery })
      .catch(error => {
        console.error('Search error:', error);
        setError('An error occurred while searching. Please try again.');
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const handlePageChange = (page) => {
    // Update pagination state which will trigger the useEffect
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Format salary for display (used for salary display)
  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return "Not specified";

    const formatNumber = (num) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: salary.currency || "USD",
        maximumFractionDigits: 0,
      }).format(num);

    if (salary.min && salary.max) {
      return `${formatNumber(salary.min)} - ${formatNumber(salary.max)} ${
        salary.period || "Yearly"
      }`;
    } else if (salary.min) {
      return `From ${formatNumber(salary.min)} ${salary.period || "Yearly"}`;
    } else if (salary.max) {
      return `Up to ${formatNumber(salary.max)} ${salary.period || "Yearly"}`;
    }

    return "Not specified";
  };

  // Format date for display (used for deadline display)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Calculate days ago for display (used for deadline display)
  const calculateDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.jobType) count++;
    if (filters.locationType) count++;
    if (filters.experienceLevel) count++;
    setActiveFilters(count);
  }, [filters]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const filterVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { height: 'auto', opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-violet-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight"
            variants={itemVariants}
          >
            Find Your Dream Job
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Discover opportunities from companies looking for talented
            professionals like you
          </motion.p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="mb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <form onSubmit={handleSearch}>
            {/* Search Bar */}
            <motion.div
              className="relative mb-4"
              variants={itemVariants}
            >
              <div className="relative">
                {/* Search icon removed as requested */}
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchInputValue}
                    onChange={handleSearchInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch(e);
                        setShowSuggestions(false);
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => searchInputValue && setShowSuggestions(true)}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicks to register
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Search jobs by title, company, or keywords"
                    className="w-full bg-white pl-4 pr-36 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all"
                  />

                  {/* Search suggestions dropdown */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
                      <ul className="py-1">
                        {searchSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className="px-4 py-2 hover:bg-violet-50 cursor-pointer flex items-center text-gray-700 hover:text-violet-700 transition-colors"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <Search size={14} className="mr-2 text-gray-400" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {searchInputValue && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInputValue("");
                      setSearchTerm("");
                      setSearchSuggestions([]);
                      setShowSuggestions(false);
                      // Trigger a fetch immediately after clearing search
                      fetchJobs(1);
                    }}
                    className="absolute right-32 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <XCircle size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-gray-600 hover:text-violet-600 transition-colors"
                >
                  <Sliders size={18} />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilters > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-violet-600 text-white rounded-full">
                      {activeFilters}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  className="mb-6"
                  variants={filterVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Job Type</label>
                      <select
                        value={draftFilters.jobType}
                        onChange={(e) => handleFilterChange("jobType", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 appearance-none transition-all bg-white"
                      >
                        <option value="">All Job Types</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Internship">Internship</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-9 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Location</label>
                      <select
                        value={draftFilters.locationType}
                        onChange={(e) => handleFilterChange("locationType", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 appearance-none transition-all bg-white"
                      >
                        <option value="">All Locations</option>
                        <option value="Remote">Remote</option>
                        <option value="On-site">On-site</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-9 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Experience</label>
                      <select
                        value={draftFilters.experienceLevel}
                        onChange={(e) => handleFilterChange("experienceLevel", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 appearance-none transition-all bg-white"
                      >
                        <option value="">All Experience Levels</option>
                        <option value="Entry Level">Entry Level</option>
                        <option value="Junior">Junior</option>
                        <option value="Mid-Level">Mid-Level</option>
                        <option value="Senior">Senior</option>
                        <option value="Executive">Executive</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-9 text-gray-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <motion.button
                      type="button"
                      onClick={() => {
                        // Reset draft filters
                        setDraftFilters({
                          jobType: "",
                          locationType: "",
                          experienceLevel: "",
                        });
                        // Apply the reset filters immediately
                        setFilters({
                          jobType: "",
                          locationType: "",
                          experienceLevel: "",
                        });
                        // Reset to page 1
                        setPagination(prev => ({ ...prev, currentPage: 1 }));
                      }}
                      className="text-sm text-gray-500 hover:text-violet-600 transition-colors flex items-center gap-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <X size={14} />
                      Reset filters
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={applyFilters}
                      className="bg-violet-600 text-white px-4 py-2 rounded-xl hover:bg-violet-700 transition-all flex items-center gap-2 text-sm font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Filter size={16} />
                      Apply Filters
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Filters */}
            {activeFilters > 0 && (
              <motion.div
                className="flex flex-wrap gap-2 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-sm text-gray-500 mr-1">Active filters:</div>
                {filters.jobType && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-violet-50 text-violet-800">
                    {filters.jobType}
                    <button
                      type="button"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, jobType: "" }));
                        setDraftFilters(prev => ({ ...prev, jobType: "" }));
                      }}
                      className="ml-1 text-violet-600 hover:text-violet-800"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                {filters.locationType && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-violet-50 text-violet-800">
                    {filters.locationType}
                    <button
                      type="button"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, locationType: "" }));
                        setDraftFilters(prev => ({ ...prev, locationType: "" }));
                      }}
                      className="ml-1 text-violet-600 hover:text-violet-800"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                {filters.experienceLevel && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-violet-50 text-violet-800">
                    {filters.experienceLevel}
                    <button
                      type="button"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, experienceLevel: "" }));
                        setDraftFilters(prev => ({ ...prev, experienceLevel: "" }));
                      }}
                      className="ml-1 text-violet-600 hover:text-violet-800"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    resetAllFilters();
                    // Trigger a fetch immediately after resetting filters
                    fetchJobs(1);
                  }}
                  className="text-sm text-gray-500 hover:text-violet-600 transition-colors"
                >
                  Clear all
                </button>
              </motion.div>
            )}
          </form>
        </motion.div>

        {/* Post Job Button (for authenticated users) */}
        {isAuthenticated() && user?.roleCapabilities?.canPostJobs && (
          <motion.div
            className="mb-8 flex justify-end"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.button
              onClick={() => router.push("/jobs/post")}
              className="bg-violet-600 text-white px-6 py-3 rounded-xl hover:bg-violet-700 transition-all flex items-center gap-2 font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={18} />
              Post a Job
            </motion.button>
          </motion.div>
        )}

        {/* Job Listings */}
        <div>
          {loading ? (
            <div className="flex justify-center py-16">
              <LoaderComponent
                size="large"
                color="violet"
                text={isSearching ? "Searching jobs" : "Loading jobs"}
              />
            </div>
          ) : error ? (
            <motion.div
              className="text-center py-16 bg-white border border-gray-100 rounded-2xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-red-500 mb-4">{error}</p>
              <motion.button
                onClick={() => {
                  setError(null);
                  let abortController;

                  const retryFetch = async () => {
                    // Cancel any previous requests
                    if (abortController) {
                      abortController.abort();
                    }

                    // Fetch jobs and store the new controller
                    abortController = await fetchJobs(1);
                  };

                  retryFetch();
                }}
                className="bg-violet-600 text-white px-6 py-3 rounded-xl hover:bg-violet-700 transition-all font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : jobs.length === 0 ? (
            <motion.div
              className="text-center py-16 bg-white border border-gray-100 rounded-2xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase size={28} className="text-violet-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No Jobs Found
              </h3>
              <p className="text-gray-600 mb-3 max-w-md mx-auto">
                We couldn't find any jobs matching your criteria. Try adjusting
                your filters or search terms.
              </p>
              {searchTerm && (
                <div className="bg-violet-50 p-3 rounded-lg mb-4 max-w-md mx-auto">
                  <p className="text-violet-800 text-sm">
                    <span className="font-medium">Current search:</span> "{searchTerm}"
                  </p>
                  <p className="text-violet-700 text-xs mt-1">
                    Try using more general terms or check for typos.
                  </p>
                </div>
              )}
              {(filters.jobType || filters.locationType || filters.experienceLevel) && (
                <div className="bg-violet-50 p-3 rounded-lg mb-4 max-w-md mx-auto">
                  <p className="text-violet-800 text-sm font-medium mb-1">Active filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.jobType && (
                      <span className="text-xs bg-white px-2 py-1 rounded border border-violet-200 text-violet-700">
                        Job Type: {filters.jobType}
                      </span>
                    )}
                    {filters.locationType && (
                      <span className="text-xs bg-white px-2 py-1 rounded border border-violet-200 text-violet-700">
                        Location: {filters.locationType}
                      </span>
                    )}
                    {filters.experienceLevel && (
                      <span className="text-xs bg-white px-2 py-1 rounded border border-violet-200 text-violet-700">
                        Experience: {filters.experienceLevel}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <motion.button
                onClick={() => {
                  // Reset all filters and search
                  setSearchInputValue("");
                  setSearchTerm("");
                  setDraftFilters({
                    jobType: "",
                    locationType: "",
                    experienceLevel: "",
                  });
                  setFilters({
                    jobType: "",
                    locationType: "",
                    experienceLevel: "",
                  });
                  setError(null);

                  // Trigger a fetch immediately with reset filters
                  fetchJobs(1);
                }}
                className="bg-violet-600 text-white px-6 py-3 rounded-xl hover:bg-violet-700 transition-all font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear Filters
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-gray-600">
                    Showing <span className="font-medium text-gray-900">{jobs.length}</span> of <span className="font-medium text-gray-900">{pagination.total}</span> jobs
                  </p>
                  {searchTerm && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-violet-700 bg-violet-50 px-2 py-1 rounded-full">
                        <span className="font-medium">Search:</span> "{searchTerm}"
                      </p>
                      <button
                        onClick={() => {
                          setSearchInputValue("");
                          setSearchTerm("");
                          fetchJobs(1);
                        }}
                        className="text-xs text-violet-600 hover:text-violet-800 transition-colors"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>

                <motion.button
                  type="button"
                  onClick={() => fetchJobs(pagination.currentPage)}
                  className="text-gray-500 hover:text-violet-600 transition-colors flex items-center gap-1 text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Refresh job listings"
                >
                  <RefreshCw size={16} />
                  <span className="hidden sm:inline">Refresh</span>
                </motion.button>
              </div>

              <div className="space-y-4">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job._id}
                    className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-violet-200 transition-all cursor-pointer group"
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    onClick={() => router.push(`/jobs/${job.slug}`)}
                    custom={index}
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
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
                              {job.title}
                            </h3>
                            <div className="text-base text-gray-700 mt-1">
                              {job.company?.name || "Company"}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-2 md:mt-0 whitespace-nowrap">
                            <Clock size={14} className="mr-1 flex-shrink-0" />
                            {calculateDaysAgo(job.createdAt)}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center text-gray-600 gap-y-2 gap-x-4 mt-3 text-sm">
                          <div className="flex items-center">
                            <MapPin size={15} className="mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{job.location || job.locationType || "Location not specified"}</span>
                          </div>
                          <div className="flex items-center">
                            <Briefcase size={15} className="mr-1 text-gray-400 flex-shrink-0" />
                            {job.jobType || "Job type not specified"}
                          </div>
                          {job.salary?.isVisible && (
                            <div className="flex items-center">
                              <DollarSign size={15} className="mr-1 text-gray-400 flex-shrink-0" />
                              {formatSalary(job.salary)}
                            </div>
                          )}
                          {job.deadline && (
                            <div className="flex items-center">
                              <Clock size={15} className="mr-1 text-gray-400 flex-shrink-0" />
                              <span className="whitespace-nowrap">Deadline: {formatDate(job.deadline)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          {job.skills?.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-xs font-medium group-hover:bg-violet-100 transition-colors"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills?.length > 5 && (
                            <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs font-medium group-hover:bg-gray-100 transition-colors">
                              +{job.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className={`px-4 py-2 rounded-xl border ${pagination.currentPage === 1 ? 'border-gray-200 text-gray-300' : 'border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700'} transition-colors`}
                      whileHover={pagination.currentPage !== 1 ? { scale: 1.05 } : {}}
                      whileTap={pagination.currentPage !== 1 ? { scale: 0.95 } : {}}
                    >
                      Previous
                    </motion.button>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current page
                        return page === 1 ||
                               page === pagination.totalPages ||
                               (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1);
                      })
                      .map((page, index, array) => {
                        // Add ellipsis where needed
                        if (index > 0 && array[index - 1] !== page - 1) {
                          return [
                            <span key={`ellipsis-${page}`} className="px-2 text-gray-400">...</span>,
                            <motion.button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${pagination.currentPage === page ? 'bg-violet-600 text-white' : 'border border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700'} transition-colors`}
                              whileHover={pagination.currentPage !== page ? { scale: 1.05 } : {}}
                              whileTap={{ scale: 0.95 }}
                            >
                              {page}
                            </motion.button>
                          ];
                        }
                        return (
                          <motion.button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${pagination.currentPage === page ? 'bg-violet-600 text-white' : 'border border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700'} transition-colors`}
                            whileHover={pagination.currentPage !== page ? { scale: 1.05 } : {}}
                            whileTap={{ scale: 0.95 }}
                          >
                            {page}
                          </motion.button>
                        );
                      })}

                    <motion.button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className={`px-4 py-2 rounded-xl border ${pagination.currentPage === pagination.totalPages ? 'border-gray-200 text-gray-300' : 'border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700'} transition-colors`}
                      whileHover={pagination.currentPage !== pagination.totalPages ? { scale: 1.05 } : {}}
                      whileTap={pagination.currentPage !== pagination.totalPages ? { scale: 0.95 } : {}}
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
