"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, Clock, Trending, Tag, User, Briefcase, Package, ChevronRight, Loader2, Folder } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useAuth } from "@/lib/contexts/auth-context";
import { useCategories } from "@/lib/contexts/category-context";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { makePriorityRequest } from "@/lib/api/api";
import logger from "@/lib/utils/logger";

const SearchModal = ({ isOpen, onClose, initialQuery = "" }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { categories, fetchCategories, loading: categoriesLoading } = useCategories();
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all");
  const [results, setResults] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  // Close modal when clicking outside
  useOnClickOutside(modalRef, onClose);

  // Focus input when modal opens and handle ESC key press
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);

      // Add event listener for ESC key
      const handleEscKey = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscKey);

      // Clean up event listener
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setResults({});
      if (!initialQuery) {
        setQuery("");
      }
    }
  }, [isOpen, initialQuery]);

  // Fetch recent searches and categories when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        fetchRecentSearches();
      }
      // Fetch categories for product results
      fetchCategories();
    }
  }, [isOpen, isAuthenticated, fetchCategories]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      fetchSearchResults();
      fetchSearchSuggestions();
    } else {
      setResults({});
      setSuggestions([]);
    }
  }, [debouncedQuery, activeTab]);

  // Fetch recent searches
  const fetchRecentSearches = async () => {
    try {
      const response = await makePriorityRequest("get", "/search/history");
      if (response.data.success) {
        setRecentSearches(response.data.history || []);
      }
    } catch (error) {
      logger.error("Error fetching recent searches:", error);
    }
  };

  // Fetch search results
  const fetchSearchResults = async () => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) return;

    setIsLoading(true);
    try {
      const response = await makePriorityRequest("get", "/search", {
        params: {
          q: debouncedQuery,
          type: activeTab,
          limit: 5,
          natural_language: false // Use regex search instead of text search for reliability
        }
      });

      if (response.data.success) {
        setResults(response.data.results || {});
      } else {
        setResults({});
        // Don't show error in modal to avoid disrupting the user experience
        logger.warn("Search returned unsuccessful response:", response.data.error);
      }
    } catch (error) {
      logger.error("Error fetching search results:", error);
      setResults({});
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch search suggestions for autocomplete
  const fetchSearchSuggestions = async () => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) return;

    setIsSuggestionsLoading(true);
    try {
      const response = await makePriorityRequest("get", "/search/suggestions", {
        params: {
          q: debouncedQuery,
          type: activeTab
        }
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions || []);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      logger.error("Error fetching search suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  // Handle search submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${activeTab}`);
      onClose();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.query);
    if (activeTab !== suggestion.type && suggestion.type !== 'all') {
      setActiveTab(suggestion.type);
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (search) => {
    setQuery(search.query);
    if (activeTab !== search.type && search.type !== 'all') {
      setActiveTab(search.type);
    }
  };

  // Clear search history
  const handleClearHistory = async () => {
    try {
      await makePriorityRequest("delete", "/search/history");
      setRecentSearches([]);
    } catch (error) {
      logger.error("Error clearing search history:", error);
    }
  };

  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, type: "spring", damping: 25, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2, ease: "easeInOut" } }
  };

  // Render search result items by type
  const renderResultItems = (type) => {
    const items = results[type] || [];
    if (items.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-600 capitalize">{type}</h3>
          <Link
            href={`/search?q=${encodeURIComponent(query)}&type=${type}`}
            className="text-xs text-violet-600 hover:text-violet-700 flex items-center"
            onClick={onClose}
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="space-y-2">
          {items.map((item) => {
            switch (type) {
              case 'products':
                return <ProductResultItem key={item._id} product={item} onClose={onClose} />;
              case 'jobs':
                return <JobResultItem key={item._id} job={item} onClose={onClose} />;
              case 'projects':
                return <ProjectResultItem key={item._id} project={item} onClose={onClose} />;
              case 'users':
                return <UserResultItem key={item._id} user={item} onClose={onClose} />;
              default:
                return null;
            }
          })}
        </div>
      </div>
    );
  };

  // Check if we have any results
  const hasResults = Object.values(results).some(items => items && items.length > 0);
  const hasRecentSearches = recentSearches.length > 0;
  const hasSuggestions = suggestions.length > 0;

  if (!isOpen) return null;

  return (
    <div className="h-full fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[10px]">
      <AnimatePresence mode="sync">
        <motion.div
          key="search-modal"
          ref={modalRef}
          className="w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden fixed top-[5rem]"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Search Header */}
          <div className="p-4 border-b border-gray-100">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={18} />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search across products, jobs, projects and more..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500 text-gray-800 bg-white"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Search Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "all"
                  ? "text-violet-600 border-b-2 border-violet-600"
                  : "text-gray-600 hover:text-violet-600"
              }`}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "products"
                  ? "text-violet-600 border-b-2 border-violet-600"
                  : "text-gray-600 hover:text-violet-600"
              }`}
              onClick={() => setActiveTab("products")}
            >
              Products
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "jobs"
                  ? "text-violet-600 border-b-2 border-violet-600"
                  : "text-gray-600 hover:text-violet-600"
              }`}
              onClick={() => setActiveTab("jobs")}
            >
              Jobs
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "projects"
                  ? "text-violet-600 border-b-2 border-violet-600"
                  : "text-gray-600 hover:text-violet-600"
              }`}
              onClick={() => setActiveTab("projects")}
            >
              Projects
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "users"
                  ? "text-violet-600 border-b-2 border-violet-600"
                  : "text-gray-600 hover:text-violet-600"
              }`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
          </div>

          {/* Search Content */}
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-violet-600 mr-2" />
                <span className="text-gray-600">Searching...</span>
              </div>
            )}

            {/* Search Suggestions */}
            {!isLoading && query.trim().length >= 2 && hasSuggestions && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                  <Tag size={14} className="mr-1" /> Suggestions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => {
                    // Check if this is a spelling correction suggestion
                    const isSpellingCorrection = suggestion.isSpellingCorrection;

                    return (
                      <button
                        key={`${suggestion.query}-${index}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`px-3 py-1.5 ${isSpellingCorrection ? 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} rounded-full text-sm font-medium transition-colors flex items-center`}
                        title={isSpellingCorrection ? `Did you mean: ${suggestion.query}?` : suggestion.query}
                      >
                        {suggestion.type === 'products' && <Package size={12} className="mr-1" />}
                        {suggestion.type === 'jobs' && <Briefcase size={12} className="mr-1" />}
                        {suggestion.type === 'projects' && <Folder size={12} className="mr-1" />}
                        {suggestion.type === 'users' && <User size={12} className="mr-1" />}
                        {isSpellingCorrection ? (
                          <span>
                            Did you mean: <span className="font-semibold">{suggestion.query}</span>?
                          </span>
                        ) : (
                          suggestion.query
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Searches (only show if no query and user is authenticated) */}
            {!isLoading && !query.trim() && isAuthenticated && hasRecentSearches && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600 flex items-center">
                    <Clock size={14} className="mr-1" /> Recent Searches
                  </h3>
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear history
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={`${search.query}-${index}`}
                      onClick={() => handleRecentSearchClick(search)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-800 transition-colors flex items-center"
                    >
                      <Clock size={12} className="mr-1" />
                      {search.query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {!isLoading && query.trim().length >= 2 && (
              <>
                {hasResults ? (
                  <div>
                    {renderResultItems('products')}
                    {renderResultItems('jobs')}
                    {renderResultItems('projects')}
                    {renderResultItems('users')}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No results found for "{query}"</p>
                    {hasSuggestions && suggestions.some(s => s.isSpellingCorrection) ? (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Did you mean:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {suggestions
                            .filter(s => s.isSpellingCorrection)
                            .map((suggestion, index) => (
                              <button
                                key={`spelling-${index}`}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100 rounded-full text-sm font-medium transition-colors inline-flex items-center"
                              >
                                {suggestion.query}
                              </button>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1">
                        Try different keywords or check your spelling
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!isLoading && !query.trim() && !hasRecentSearches && (
              <div className="text-center py-8">
                <p className="text-gray-500">Start typing to search</p>
                <p className="text-sm text-gray-400 mt-1">
                  Search for products, jobs, projects, and users
                </p>
              </div>
            )}
          </div>

          {/* Search Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
            <div>
              Press <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">Enter</kbd> to search
            </div>
            <div>
              Press <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">Esc</kbd> to close
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Result item components for search results
const ProductResultItem = ({ product, onClose }) => {
  // Access categories from context
  const { categories } = useCategories();

  // Get category name from category ID
  const getCategoryName = () => {
    // If categoryName is already provided in the product data, use it
    if (product.categoryName) {
      return product.categoryName;
    }

    // Otherwise, look up the category name from the categories context
    if (product.category && categories && categories.length > 0) {
      const category = categories.find(cat => cat._id === product.category);
      return category ? category.name : 'Uncategorized';
    }

    return 'Uncategorized';
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors"
      onClick={onClose}
    >
      <div className="flex-shrink-0 mr-3">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
            <Package size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
        <p className="text-xs text-gray-500 truncate">{product.tagline}</p>
        <div className="flex items-center mt-1 text-xs text-gray-400">
          <span className="flex items-center">
            {typeof product.upvotes === 'object' ? product.upvotes.count || 0 : product.upvotes || 0} upvotes
          </span>
          <span className="mx-2">•</span>
          <span>{getCategoryName()}</span>
        </div>
      </div>
    </Link>
  );
};

const JobResultItem = ({ job, onClose }) => {
  return (
    <Link
      href={`/jobs/${job._id}`}
      className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors"
      onClick={onClose}
    >
      <div className="flex-shrink-0 mr-3">
        {job.companyDetails?.[0]?.profilePicture ? (
          <img
            src={job.companyDetails[0].profilePicture}
            alt={job.company?.name || "Company"}
            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <Briefcase size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{job.title}</h4>
        <p className="text-xs text-gray-500 truncate">
          {job.company?.name || job.companyDetails?.[0]?.name || "Company"}
        </p>
        <div className="flex items-center mt-1 text-xs text-gray-400">
          <span>{job.jobType}</span>
          <span className="mx-2">•</span>
          <span>{job.locationType}</span>
        </div>
      </div>
    </Link>
  );
};

const ProjectResultItem = ({ project, onClose }) => {
  // Access categories from context
  const { categories } = useCategories();

  // Get category name from category ID
  const getCategoryName = () => {
    // If categoryName is already provided in the project data, use it
    if (project.categoryName) {
      return project.categoryName;
    }

    // Otherwise, look up the category name from the categories context
    if (project.category && categories && categories.length > 0) {
      const category = categories.find(cat => cat._id === project.category);
      return category ? category.name : 'Uncategorized';
    }

    return 'Uncategorized';
  };

  return (
    <Link
      href={`/projects/${project._id}`}
      className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors"
      onClick={onClose}
    >
      <div className="flex-shrink-0 mr-3">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
            <Folder size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{project.title}</h4>
        <p className="text-xs text-gray-500 truncate">
          by {project.ownerDetails?.[0]?.name || "User"}
        </p>
        <div className="flex items-center mt-1 text-xs text-gray-400">
          <span>{getCategoryName()}</span>
          {project.technologies && (
            <>
              <span className="mx-2">•</span>
              <span className="truncate">{project.technologies.slice(0, 2).join(", ")}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

const UserResultItem = ({ user, onClose }) => {
  return (
    <Link
      href={`/user/${user.username}`}
      className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors"
      onClick={onClose}
    >
      <div className="flex-shrink-0 mr-3">
        {user.profilePicture && user.profilePicture.url ? (
          <img
            src={user.profilePicture.url}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <User size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{user.name}</h4>
        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
        <div className="flex items-center mt-1 text-xs text-gray-400">
          <span>{user.role}</span>
          {user.company?.name && (
            <>
              <span className="mx-2">•</span>
              <span>{user.company.name}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default SearchModal;
