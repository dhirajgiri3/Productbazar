"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FiBookmark,
  FiFilter,
  FiSearch,
  FiGrid,
  FiList,
  FiChevronDown,
  FiX,
  FiAlertCircle,
  FiCalendar,
  FiTrendingUp,
  FiTag,
  FiClock,
  FiArrowUp,
  FiEye,
  FiRefreshCw,
  FiInfo,
} from "react-icons/fi";
import { useAuth } from "@/lib/contexts/auth-context";
import { useProduct } from "@/lib/contexts/product-context";
import LoaderComponent from "../../../../Components/UI/LoaderComponent";
import BookmarksList from "./BookmarksList";
import BookmarksGrid from "./BookmarksGrid";
import EmptyState from "../../../../Components/common/EmptyState";
import { makePriorityRequest } from "@/lib/api/api";
import logger from "@/lib/utils/logger";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

const sortOptions = [
  {
    id: "createdAt",
    label: "Recently Bookmarked",
    icon: <FiClock size={14} />,
  },
  { id: "name", label: "Product Name", icon: <FiTag size={14} /> },
  { id: "upvotes", label: "Most Upvoted", icon: <FiArrowUp size={14} /> },
  { id: "views", label: "Most Viewed", icon: <FiEye size={14} /> },
];

const MyBookmarksPage = () => {
  const { user, isAuthenticated, authLoading } = useAuth();
  const { categories } = useProduct();
  const router = useRouter();
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // State
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);

  // Extract unique tags from bookmarks for filtering
  const extractTags = useCallback((bookmarksList) => {
    const tagsSet = new Set();
    bookmarksList.forEach((bookmark) => {
      if (bookmark.product.tags && Array.isArray(bookmark.product.tags)) {
        bookmark.product.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, []);

  // Fetch bookmarks with enhanced error handling and data processing
  const fetchBookmarks = useCallback(
    async (isRefresh = false) => {
      if (!isAuthenticated) {
        router.push("/auth/login?redirect=/user/mybookmarks");
        return;
      }

      try {
        if (!isRefresh) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
          toast.loading("Refreshing bookmarks...", { id: "refresh-toast" });
        }
        setError(null);

        // Build query parameters
        const params = {
          page,
          limit: 12,
          sortBy,
          sortOrder,
          ...(selectedCategory !== "all" && { category: selectedCategory }),
          ...(searchQuery && { search: searchQuery }),
          ...(selectedTags.length > 0 && { tags: selectedTags.join(",") }),
          ...(dateRange && {
            fromDate: dateRange.from
              ? format(dateRange.from, "yyyy-MM-dd")
              : undefined,
            toDate: dateRange.to
              ? format(dateRange.to, "yyyy-MM-dd")
              : undefined,
          }),
        };

        // Use the dedicated bookmarks endpoint with retry capability
        const response = await makePriorityRequest("GET", "/user/bookmarks", {
          params,
          retryCount: 1 // Allow one retry for network issues or token refresh
        });

        if (response.data.success) {
          setBookmarks(response.data.data);
          setTotalPages(response.data.pagination.pages);
          setTotalBookmarks(response.data.pagination.total);

          // Extract available tags for filtering
          const tags = extractTags(response.data.data);
          setAvailableTags(tags);

          // Show success message on refresh
          if (isRefresh) {
            toast.success("Bookmarks refreshed", { id: "refresh-toast" });
          }
        } else {
          setError(response.data.message || "Failed to fetch bookmarks");
          setBookmarks([]);
          if (isRefresh) {
            toast.error("Failed to refresh bookmarks", { id: "refresh-toast" });
          }
        }
      } catch (err) {
        logger.error("Error fetching bookmarks:", err);

        // Handle authentication errors specifically
        if (err.message?.includes('session has expired') || err.response?.status === 401) {
          // The auth context will handle the redirect, just show a friendly message
          toast.error("Your session has expired. Redirecting to login...");
          setError("Authentication required. Please log in again.");
        } else {
          setError("Something went wrong while fetching your bookmarks");
        }

        setBookmarks([]);
        if (isRefresh) {
          toast.error("Error refreshing bookmarks", { id: "refresh-toast" });
        }
      } finally {
        setLoading(false);
        setIsSearching(false);
        setIsRefreshing(false);
        setSkeletonLoading(false);
      }
    },
    [
      isAuthenticated,
      router,
      page,
      sortBy,
      sortOrder,
      selectedCategory,
      selectedTags,
      searchQuery,
      dateRange,
      extractTags,
    ]
  );

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    fetchBookmarks(true);
  }, [fetchBookmarks]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      setSkeletonLoading(true);
      fetchBookmarks();
    } else if (!authLoading) {
      // If authentication check is complete and user is not authenticated
      router.push("/auth/login?redirect=/user/mybookmarks");
    }
  }, [isAuthenticated, authLoading, fetchBookmarks, router]);

  // Debounced search implementation
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout for the search
    if (searchQuery) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        setPage(1); // Reset to first page when searching
        fetchBookmarks();
      }, 500); // 500ms debounce delay
    }

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, fetchBookmarks]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
    setPage(1); // Reset to first page when searching
    fetchBookmarks();
  };

  // Handle sort change
  const handleSortChange = (option) => {
    setSortBy(option);
    setPage(1); // Reset to first page when changing sort
    fetchBookmarks();
  };

  // Handle sort order toggle
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    setPage(1); // Reset to first page when changing sort order
    fetchBookmarks();
  };

  // Handle category filter change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1); // Reset to first page when changing category
    setIsFilterOpen(false); // Close filter dropdown after selection
    fetchBookmarks();
  };

  // Handle tag selection
  const handleTagSelection = (tag) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      setPage(1);
      return newTags;
    });
    setTimeout(() => fetchBookmarks(), 0);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchBookmarks();
  };

  // Handle view mode toggle
  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    if (searchQuery) {
      setPage(1);
      setTimeout(() => fetchBookmarks(), 0);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSortBy("createdAt");
    setSortOrder("desc");
    setSelectedCategory("all");
    setSelectedTags([]);
    setSearchQuery("");
    setDateRange(null);
    setPage(1);
    setIsFilterOpen(false);
    setTimeout(() => fetchBookmarks(), 0);
  };

  // Focus search input with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <LoaderComponent text="Loading..." />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated && !authLoading) {
    router.push("/auth/login?redirect=/user/mybookmarks");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <FiBookmark className="text-violet-600 w-6 h-6 mr-2" />
              <h1 className="text-2xl font-semibold text-gray-900">
                My Bookmarks
              </h1>
              {totalBookmarks > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  {totalBookmarks} {totalBookmarks === 1 ? "item" : "items"}
                </span>
              )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <form
                onSubmit={handleSearch}
                className="relative flex-grow sm:max-w-xs group"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search bookmarks... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 group-hover:border-violet-200"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-violet-500 transition-colors" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX />
                  </button>
                )}
              </form>

              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`flex items-center justify-center w-10 h-10 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all ${
                    isRefreshing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  title="Refresh bookmarks"
                >
                  <FiRefreshCw
                    className={`text-gray-500 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-all ${
                      isFilterOpen ||
                      selectedCategory !== "all" ||
                      (Array.isArray(selectedTags) && selectedTags.length > 0)
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-gray-200 text-gray-700"
                    }`}
                  >
                    <FiFilter
                      className={
                        isFilterOpen ||
                        selectedCategory !== "all" ||
                        (Array.isArray(selectedTags) && selectedTags.length > 0)
                          ? "text-violet-500"
                          : "text-gray-500"
                      }
                    />
                    <span className="text-sm font-medium">Filter</span>
                    {(selectedCategory !== "all" ||
                      (Array.isArray(selectedTags) &&
                        selectedTags.length > 0)) && (
                      <span className="flex items-center justify-center w-5 h-5 bg-violet-600 text-white text-xs rounded-full">
                        {(selectedCategory !== "all" ? 1 : 0) +
                          (Array.isArray(selectedTags)
                            ? selectedTags.length
                            : 0)}
                      </span>
                    )}
                    <FiChevronDown
                      className={`transition-transform ${
                        isFilterOpen
                          ? "rotate-180 text-violet-500"
                          : "text-gray-500"
                      }`}
                    />
                  </button>

                  {/* Enhanced Filter Dropdown */}
                  <AnimatePresence>
                    {isFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                              <FiTrendingUp
                                className="mr-1.5 text-violet-500"
                                size={14}
                              />
                              Sort By
                            </h3>
                            <div className="space-y-1.5">
                              {sortOptions.map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => handleSortChange(option.id)}
                                  className={`flex items-center w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors ${
                                    sortBy === option.id
                                      ? "bg-violet-50 text-violet-700 font-medium"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <span className="mr-2">{option.icon}</span>
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                Order
                              </span>
                              <button
                                onClick={toggleSortOrder}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                {sortOrder === "asc" ? (
                                  <>
                                    <FiArrowUp
                                      size={14}
                                      className="text-gray-500"
                                    />
                                    <span>Ascending</span>
                                  </>
                                ) : (
                                  <>
                                    <FiArrowUp
                                      size={14}
                                      className="text-gray-500 transform rotate-180"
                                    />
                                    <span>Descending</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                              <FiTag
                                className="mr-1.5 text-violet-500"
                                size={14}
                              />
                              Categories
                            </h3>
                            <div className="max-h-40 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              <button
                                onClick={() => handleCategoryChange("all")}
                                className={`flex items-center w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors ${
                                  selectedCategory === "all"
                                    ? "bg-violet-50 text-violet-700 font-medium"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                All Categories
                              </button>
                              {Array.isArray(categories) &&
                                categories.map((category) => (
                                  <button
                                    key={category._id}
                                    onClick={() =>
                                      handleCategoryChange(category.slug)
                                    }
                                    className={`flex items-center w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors ${
                                      selectedCategory === category.slug
                                        ? "bg-violet-50 text-violet-700 font-medium"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    {category.name}
                                  </button>
                                ))}
                            </div>
                          </div>

                          {Array.isArray(availableTags) &&
                            availableTags.length > 0 && (
                              <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                  <FiTag
                                    className="mr-1.5 text-violet-500"
                                    size={14}
                                  />
                                  Tags
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                  {Array.isArray(availableTags) &&
                                    availableTags.map((tag) => (
                                      <button
                                        key={tag}
                                        onClick={() => handleTagSelection(tag)}
                                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                          selectedTags.includes(tag)
                                            ? "bg-violet-100 text-violet-700 border border-violet-300"
                                            : "bg-gray-100 text-gray-700 border border-transparent hover:border-gray-300"
                                        }`}
                                      >
                                        {tag}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}

                          <div className="pt-2 border-t border-gray-100 flex justify-between">
                            <button
                              onClick={clearAllFilters}
                              className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center"
                            >
                              <FiX size={14} className="mr-1" />
                              Clear All Filters
                            </button>
                            <button
                              onClick={() => setIsFilterOpen(false)}
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* View Mode Toggle */}
                <button
                  onClick={toggleViewMode}
                  className="flex items-center justify-center w-10 h-10 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                  title={
                    viewMode === "grid"
                      ? "Switch to list view"
                      : "Switch to grid view"
                  }
                >
                  {viewMode === "grid" ? <FiList /> : <FiGrid />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Filters */}
        {(selectedCategory !== "all" ||
          searchQuery ||
          (Array.isArray(selectedTags) && selectedTags.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap gap-2 items-center"
          >
            {selectedCategory !== "all" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="inline-flex items-center bg-violet-50 text-violet-700 rounded-full px-3 py-1.5 text-sm border border-violet-100"
              >
                <FiTag size={12} className="mr-1.5" />
                <span>
                  Category:{" "}
                  {(Array.isArray(categories) &&
                    categories.find((c) => c.slug === selectedCategory)
                      ?.name) ||
                    selectedCategory}
                </span>
                <button
                  onClick={() => handleCategoryChange("all")}
                  className="ml-2 text-violet-500 hover:text-violet-700 transition-colors"
                >
                  <FiX size={14} />
                </button>
              </motion.div>
            )}

            {Array.isArray(selectedTags) &&
              selectedTags.map((tag) => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center bg-violet-50 text-violet-700 rounded-full px-3 py-1.5 text-sm border border-violet-100"
                >
                  <FiTag size={12} className="mr-1.5" />
                  <span>{tag}</span>
                  <button
                    onClick={() => handleTagSelection(tag)}
                    className="ml-2 text-violet-500 hover:text-violet-700 transition-colors"
                  >
                    <FiX size={14} />
                  </button>
                </motion.div>
              ))}

            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="inline-flex items-center bg-violet-50 text-violet-700 rounded-full px-3 py-1.5 text-sm border border-violet-100"
              >
                <FiSearch size={12} className="mr-1.5" />
                <span>"{searchQuery}"</span>
                <button
                  onClick={clearSearch}
                  className="ml-2 text-violet-500 hover:text-violet-700 transition-colors"
                >
                  <FiX size={14} />
                </button>
              </motion.div>
            )}

            <button
              onClick={clearAllFilters}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium ml-2 flex items-center transition-colors"
            >
              <FiX size={14} className="mr-1" />
              Clear All
            </button>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 shadow-sm"
          >
            <div className="flex items-start">
              <FiAlertCircle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error loading bookmarks
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => fetchBookmarks()}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 flex items-center transition-colors"
                >
                  <FiRefreshCw size={14} className="mr-1.5" />
                  Try Again
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoaderComponent
              text={isSearching ? "Searching..." : "Loading bookmarks..."}
            />
            <p className="text-sm text-gray-500 mt-4 animate-pulse">
              Fetching your bookmarked products...
            </p>
          </div>
        )}

        {/* Skeleton Loading State */}
        {!loading && skeletonLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <div className="h-48 bg-gray-200 animate-pulse" />
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 mb-3" />
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                  <div className="h-px bg-gray-100 my-3" />
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !skeletonLoading && bookmarks.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <EmptyState
              icon={
                <div className="relative">
                  <FiBookmark className="w-16 h-16 text-gray-300" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.3,
                      type: "spring",
                      stiffness: 500,
                      damping: 15,
                    }}
                    className="absolute -top-2 -right-2 bg-violet-100 text-violet-600 rounded-full p-1"
                  >
                    <FiX className="w-4 h-4" />
                  </motion.div>
                </div>
              }
              title={
                searchQuery ||
                selectedCategory !== "all" ||
                (Array.isArray(selectedTags) && selectedTags.length > 0)
                  ? "No matching bookmarks found"
                  : "You haven't bookmarked any products yet"
              }
              description={
                searchQuery ||
                selectedCategory !== "all" ||
                (Array.isArray(selectedTags) && selectedTags.length > 0)
                  ? "Try changing your search or filter criteria to find what you're looking for"
                  : "Bookmark products you're interested in to keep track of them here"
              }
              action={
                searchQuery ||
                selectedCategory !== "all" ||
                (Array.isArray(selectedTags) && selectedTags.length > 0)
                  ? {
                      label: "Clear Filters",
                      onClick: clearAllFilters,
                      icon: <FiX size={14} className="mr-1.5" />,
                    }
                  : {
                      label: "Discover Products",
                      onClick: () => router.push("/"),
                      icon: <FiSearch size={14} className="mr-1.5" />,
                    }
              }
            />
          </motion.div>
        )}

        {/* Bookmarks List/Grid */}
        {!loading && !skeletonLoading && bookmarks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {viewMode === "list" ? (
                <BookmarksList
                  key="list"
                  bookmarks={bookmarks}
                  onRefresh={fetchBookmarks}
                />
              ) : (
                <BookmarksGrid
                  key="grid"
                  bookmarks={bookmarks}
                  onRefresh={fetchBookmarks}
                />
              )}
            </AnimatePresence>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex justify-center"
              >
                <div className="flex items-center space-x-1 bg-white px-2 py-1.5 rounded-lg shadow-sm border border-gray-100">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center ${
                      page === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-violet-50 hover:text-violet-700"
                    }`}
                  >
                    <FiChevronDown className="rotate-90 mr-1" size={16} />
                    Previous
                  </button>

                  {/* Dynamic pagination with ellipsis for many pages */}
                  {totalPages <= 7 ? (
                    // Show all pages if 7 or fewer
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-9 h-9 rounded-md transition-colors ${
                            pageNum === page
                              ? "bg-violet-100 text-violet-700 font-medium border border-violet-200"
                              : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    )
                  ) : (
                    // Show limited pages with ellipsis for many pages
                    <>
                      {/* First page */}
                      <button
                        onClick={() => handlePageChange(1)}
                        className={`w-9 h-9 rounded-md transition-colors ${
                          page === 1
                            ? "bg-violet-100 text-violet-700 font-medium border border-violet-200"
                            : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                        }`}
                      >
                        1
                      </button>

                      {/* Ellipsis or second page */}
                      {page > 3 && (
                        <span className="text-gray-500 px-1">...</span>
                      )}

                      {/* Pages around current page */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (num) =>
                            num !== 1 &&
                            num !== totalPages &&
                            num >= page - 1 &&
                            num <= page + 1
                        )
                        .map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-9 h-9 rounded-md transition-colors ${
                              pageNum === page
                                ? "bg-violet-100 text-violet-700 font-medium border border-violet-200"
                                : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                      {/* Ellipsis or second-to-last page */}
                      {page < totalPages - 2 && (
                        <span className="text-gray-500 px-1">...</span>
                      )}

                      {/* Last page */}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className={`w-9 h-9 rounded-md transition-colors ${
                          page === totalPages
                            ? "bg-violet-100 text-violet-700 font-medium border border-violet-200"
                            : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center ${
                      page === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-violet-50 hover:text-violet-700"
                    }`}
                  >
                    Next
                    <FiChevronDown className="-rotate-90 ml-1" size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default MyBookmarksPage;