'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Loader2,
  Package,
  Briefcase,
  User,
  Folder,
  ChevronDown,
  Info as InfoIcon,
  CheckCircle,
  ArrowUp,
  Bookmark,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { makePriorityRequest } from '@/lib/api/api';
import logger from '@/lib/utils/logger';
import { useCategories } from '@/lib/contexts/category-context';
import PropTypes from 'prop-types';
import { useRouter, useSearchParams } from 'next/navigation';
import debounce from 'lodash/debounce';

// Simple error boundary component
const ErrorBoundary = ({ children, fallback }) => {
  const [error, setError] = useState(null);

  if (error) {
    return fallback;
  }

  try {
    return children;
  } catch (err) {
    setError(err);
    return fallback;
  }
};

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};

ErrorBoundary.defaultProps = {
  fallback: (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
      <p className="text-gray-500">Please try refreshing the page.</p>
    </div>
  ),
};

const SearchPage = ({ searchParams }) => {
  const { categories, fetchCategories, loading: categoriesLoading } = useCategories();
  const router = useRouter();
  const urlSearchParams = useSearchParams();

  const initialQuery = searchParams.query || '';
  const initialCategory = searchParams.category || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialCategory);
  const [results, setResults] = useState({});
  const [counts, setCounts] = useState({});
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(searchParams.page || 1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [suggestedTab, setSuggestedTab] = useState(null);

  // Animation variants for search results
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [filters]);

  // Debounced search function
  const debouncedFetchSearchResults = useCallback(
    debounce(async (q, tab, pg, flts, reset = false) => {
      if (!q.trim()) {
        setResults({});
        setCounts({});
        setTotalResults(0);
        return;
      }

      setIsLoading(true);
      try {
        const currentPage = reset ? 1 : pg;

        const response = await makePriorityRequest('get', '/search', {
          params: {
            query: q,
            category: tab === 'all' ? undefined : tab, // Align with server-side param
            page: currentPage,
            limit: searchParams.limit || 10,
            natural_language: true,
            ...flts,
          },
        });

        if (response.data.success) {
          const newResults = response.data.results || {};

          if (reset || currentPage === 1) {
            setResults(newResults);
          } else {
            const mergedResults = { ...results };
            Object.keys(newResults).forEach(type => {
              mergedResults[type] = [...(mergedResults[type] || []), ...(newResults[type] || [])];
            });
            setResults(mergedResults);
          }

          setCounts(response.data.counts || {});
          setTotalResults(response.data.totalResults || 0);

          const currentCount = Object.values(newResults).reduce(
            (sum, items) => sum + (items?.length || 0),
            0
          );
          setHasMore(currentCount >= (searchParams.limit || 10));

          if (!reset) {
            setPage(currentPage + 1);
          } else {
            setPage(2);
            // Suggest most relevant tab
            if (tab === 'all' && q.trim()) {
              const relevantTab = getMostRelevantTab(response.data.counts, q);
              setSuggestedTab(relevantTab !== 'all' ? relevantTab : null);
            }
          }
        } else {
          toast.error(response.data.error || 'Search failed. Please try again.');
          setResults({});
          setCounts({});
          setTotalResults(0);
        }
      } catch (error) {
        logger.error('Error fetching search results:', error);
        toast.error('Search failed. Please try again later.');
        setResults({});
        setCounts({});
        setTotalResults(0);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [results]
  );

  // Fetch search results
  const fetchSearchResults = useCallback(
    (reset = false) => {
      debouncedFetchSearchResults(query, activeTab, page, memoizedFilters, reset);
    },
    [query, activeTab, page, memoizedFilters]
  );

  // Sync URL with search state
  useEffect(() => {
    const params = new URLSearchParams(urlSearchParams);
    if (query) {
      params.set('query', query);
    } else {
      params.delete('query');
    }
    if (activeTab !== 'all') {
      params.set('category', activeTab);
    } else {
      params.delete('category');
    }
    params.set('page', page);
    params.set('limit', searchParams.limit || 10);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [query, activeTab, page, searchParams.limit, router, urlSearchParams]);

  // Initial search and categories
  useEffect(() => {
    if (query.trim()) {
      fetchSearchResults(true);
    }
    fetchCategories();
  }, [fetchSearchResults, fetchCategories]);

  // Determine the most relevant tab
  const getMostRelevantTab = useCallback((counts, searchQuery) => {
    if (!counts || Object.keys(counts).length === 0) return 'all';

    const userNamePattern = /^[a-z]+(\s[a-z]+)?$/i;
    if (userNamePattern.test(searchQuery.trim()) && counts.users > 0) {
      return 'users';
    }

    const tabCounts = {
      products: counts.products || 0,
      users: counts.users || 0,
      jobs: counts.jobs || 0,
      projects: counts.projects || 0,
    };

    const sortedTabs = Object.entries(tabCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    return sortedTabs[0] || 'all';
  }, []);

  // Handle search submission
  const handleSubmit = e => {
    e.preventDefault();
    if (query.trim()) {
      fetchSearchResults(true);
    }
  };

  // Handle tab change
  const handleTabChange = tab => {
    setActiveTab(tab);
    setPage(1);
    setSuggestedTab(null);
  };

  // Calculate relevance score
  const calculateTypeRelevance = (type, searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return 0;

    const queryLower = searchQuery.trim().toLowerCase();
    let relevanceScore = 0;

    const count = counts[type] || 0;
    relevanceScore += Math.min(count / 10, 5);

    if (type.toLowerCase().includes(queryLower) || queryLower.includes(type.toLowerCase())) {
      relevanceScore += 10;
    }

    switch (type) {
      case 'products':
        if (
          ['product', 'app', 'tool', 'software', 'service', 'platform'].some(
            term => queryLower.includes(term) || term.includes(queryLower)
          )
        ) {
          relevanceScore += 15;
        }
        break;
      case 'jobs':
        if (
          ['job', 'career', 'work', 'position', 'employment', 'hire', 'hiring'].some(
            term => queryLower.includes(term) || term.includes(queryLower)
          )
        ) {
          relevanceScore += 15;
        }
        break;
      case 'projects':
        if (
          ['project', 'portfolio', 'showcase', 'demo', 'prototype'].some(
            term => queryLower.includes(term) || term.includes(queryLower)
          )
        ) {
          relevanceScore += 15;
        }
        break;
      case 'users':
        const namePattern = /^[a-z]+(\s[a-z]+)?$/i;
        if (namePattern.test(queryLower) && count > 0) {
          relevanceScore += 15;
        }
        if (
          ['user', 'person', 'people', 'maker', 'creator', 'developer'].some(
            term => queryLower.includes(term) || term.includes(queryLower)
          )
        ) {
          relevanceScore += 10;
        }
        break;
      default:
        break;
    }

    return relevanceScore;
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      if (value === '') {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      return { ...prev, [key]: value };
    });
  };

  // Apply filters
  const applyFilters = () => {
    setShowFilters(false);
    fetchSearchResults(true);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setShowFilters(false);
    fetchSearchResults(true);
  };

  // Load more results
  const loadMore = () => {
    fetchSearchResults();
  };

  // Render result items by type
  const renderResultItems = type => {
    const items = results[type] || [];
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 capitalize">{type}</h2>
        <div className="space-y-4">
          {items.map(item => {
            switch (type) {
              case 'products':
                return <ProductResultItem key={item._id} product={item} query={query} />;
              case 'jobs':
                return <JobResultItem key={item._id} job={item} query={query} />;
              case 'projects':
                return <ProjectResultItem key={item._id} project={item} query={query} />;
              case 'users':
                return <UserResultItem key={item._id} user={item} query={query} />;
              default:
                return null;
            }
          })}
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Search</h1>

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <label htmlFor="search-input" className="sr-only">
                  Search
                </label>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  id="search-input"
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search across products, jobs, projects and more..."
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500 bg-white text-gray-800"
                  aria-label="Search query"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 border ${
                  Object.keys(filters).length > 0
                    ? 'border-violet-500 text-violet-600 bg-violet-50'
                    : 'border-gray-200 text-gray-600 bg-white'
                } rounded-xl font-medium flex items-center`}
                aria-label="Toggle filters"
              >
                <Filter size={18} className="mr-2" />
                Filters
                {Object.keys(filters).length > 0 && (
                  <span className="ml-2 bg-violet-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {Object.keys(filters).length}
                  </span>
                )}
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
                aria-label="Submit search"
              >
                Search
              </button>
            </form>

            {/* Filters Panel */}
            {showFilters && (
              <motion.div
                className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                  <button
                    onClick={resetFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                    aria-label="Reset all filters"
                  >
                    Reset all
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(activeTab === 'all' || activeTab === 'products') && (
                    <div>
                      <label
                        htmlFor="product-category"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Product Category
                      </label>
                      <div className="relative">
                        {categoriesLoading ? (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 size={16} className="animate-spin text-gray-400" />
                          </div>
                        ) : null}
                        <select
                          id="product-category"
                          value={filters.category || ''}
                          onChange={e => handleFilterChange('category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                          disabled={categoriesLoading}
                          aria-label="Select product category"
                        >
                          <option value="">All Categories</option>
                          {categories && categories.length > 0 ? (
                            categories.map(category => (
                              <option key={category._id} value={category._id}>
                                {category.name}
                              </option>
                            ))
                          ) : !categoriesLoading ? (
                            <option value="" disabled>
                              No categories found
                            </option>
                          ) : null}
                        </select>
                      </div>
                    </div>
                  )}

                  {(activeTab === 'all' || activeTab === 'jobs') && (
                    <>
                      <div>
                        <label
                          htmlFor="job-type"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Job Type
                        </label>
                        <select
                          id="job-type"
                          value={filters.jobType || ''}
                          onChange={e => handleFilterChange('jobType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                          aria-label="Select job type"
                        >
                          <option value="">All Types</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Freelance">Freelance</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="location-type"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Location Type
                        </label>
                        <select
                          id="location-type"
                          value={filters.locationType || ''}
                          onChange={e => handleFilterChange('locationType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                          aria-label="Select location type"
                        >
                          <option value="">All Locations</option>
                          <option value="Remote">Remote</option>
                          <option value="On-site">On-site</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </div>
                    </>
                  )}

                  {(activeTab === 'all' || activeTab === 'users') && (
                    <div>
                      <label
                        htmlFor="user-role"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        User Role
                      </label>
                      <select
                        id="user-role"
                        value={filters.role || ''}
                        onChange={e => handleFilterChange('role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                        aria-label="Select user role"
                      >
                        <option value="">All Roles</option>
                        <option value="maker">Maker</option>
                        <option value="investor">Investor</option>
                        <option value="jobSeeker">Job Seeker</option>
                        <option value="freelancer">Freelancer</option>
                        <option value="agency">Agency</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 text-gray-600 font-medium mr-2"
                    aria-label="Cancel filters"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
                    aria-label="Apply filters"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            )}

            {/* Search Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                data-tab="all"
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'all'
                    ? 'text-violet-600 border-b-2 border-violet-600'
                    : 'text-gray-600 hover:text-violet-600'
                } ${suggestedTab === 'all' ? 'bg-violet-50 animate-pulse' : ''}`}
                onClick={() => handleTabChange('all')}
                aria-label="All results"
                aria-current={activeTab === 'all' ? 'true' : 'false'}
              >
                All
                {counts.all > 0 && (
                  <span className="ml-2 text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                    {totalResults}
                  </span>
                )}
              </button>

              {[
                {
                  id: 'products',
                  count: counts.products || 0,
                  label: 'Products',
                  icon: <Package size={14} className="mr-1" />,
                },
                {
                  id: 'jobs',
                  count: counts.jobs || 0,
                  label: 'Jobs',
                  icon: <Briefcase size={14} className="mr-1" />,
                },
                {
                  id: 'projects',
                  count: counts.projects || 0,
                  label: 'Projects',
                  icon: <Folder size={14} className="mr-1" />,
                },
                {
                  id: 'users',
                  count: counts.users || 0,
                  label: 'Users',
                  icon: <User size={14} className="mr-1" />,
                },
              ].map(tabInfo => (
                <button
                  key={tabInfo.id}
                  data-tab={tabInfo.id}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    activeTab === tabInfo.id
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-600 hover:text-violet-600'
                  } ${suggestedTab === tabInfo.id ? 'bg-violet-50 animate-pulse' : ''}`}
                  onClick={() => handleTabChange(tabInfo.id)}
                  aria-label={`${tabInfo.label} results`}
                  aria-current={activeTab === tabInfo.id ? 'true' : 'false'}
                >
                  <div className="flex items-center">
                    {tabInfo.icon}
                    {tabInfo.label}
                    {tabInfo.count > 0 && (
                      <span className="ml-2 text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                        {tabInfo.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Search Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-violet-600 mr-2" />
              <span className="text-gray-600 text-lg">Searching...</span>
            </div>
          ) : query && totalResults === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No results found</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                We couldn't find any matches for "{query}". Try different keywords or check your
                spelling.
              </p>

              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Did you mean:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => {
                      setQuery('product');
                      fetchSearchResults(true);
                    }}
                    className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100 rounded-full text-sm font-medium transition-colors inline-flex items-center"
                    aria-label="Try searching for product"
                  >
                    product
                  </button>
                  <button
                    onClick={() => {
                      setQuery(query.toLowerCase());
                      fetchSearchResults(true);
                    }}
                    className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100 rounded-full text-sm font-medium transition-colors inline-flex items-center"
                    aria-label={`Try searching for ${query.toLowerCase()}`}
                  >
                    {query.toLowerCase()}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {activeTab === 'all' ? (
                <>
                  {Object.entries({
                    products: {
                      type: 'products',
                      count: counts.products || 0,
                      relevance: calculateTypeRelevance('products', query),
                    },
                    jobs: {
                      type: 'jobs',
                      count: counts.jobs || 0,
                      relevance: calculateTypeRelevance('jobs', query),
                    },
                    projects: {
                      type: 'projects',
                      count: counts.projects || 0,
                      relevance: calculateTypeRelevance('projects', query),
                    },
                    users: {
                      type: 'users',
                      count: counts.users || 0,
                      relevance: calculateTypeRelevance('users', query),
                    },
                  })
                    .filter(([_, info]) => info.count > 0)
                    .sort((a, b) => {
                      if (b[1].relevance !== a[1].relevance) {
                        return b[1].relevance - a[1].relevance;
                      }
                      return b[1].count - a[1].count;
                    })
                    .map(([_, info]) => renderResultItems(info.type))}
                </>
              ) : (
                renderResultItems(activeTab)
              )}

              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMore}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center"
                    disabled={isLoading}
                    aria-label="Load more results"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More Results'
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

SearchPage.propTypes = {
  searchParams: PropTypes.shape({
    query: PropTypes.string,
    category: PropTypes.string,
    page: PropTypes.number,
    limit: PropTypes.number,
  }).isRequired,
};

// Result item components
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ProductResultItem = ({ product, query }) => {
  const { categories } = useCategories();

  const getRelevanceBadge = () => {
    if (!query || !query.trim()) return null;

    if (product.searchRelevance) {
      const { primaryMatchReason } = product.searchRelevance;

      if (product.name && product.name.toLowerCase() === query.toLowerCase()) {
        return (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-violet-700 text-white rounded text-xs font-medium">
            Exact match
          </div>
        );
      }

      if (product.fuzzyMatch) {
        return (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
            Similar match
          </div>
        );
      }

      switch (primaryMatchReason) {
        case 'name':
          return (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
              Name match
            </div>
          );
        case 'tag':
          return (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
              Tag match
            </div>
          );
        case 'category':
          return (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              Category match
            </div>
          );
        case 'tagline':
          return (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
              Tagline match
            </div>
          );
        case 'description':
          return (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
              Description match
            </div>
          );
        default:
          return (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
              Relevant match
            </div>
          );
      }
    }

    const queryLower = query.toLowerCase();

    if (product.name && product.name.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
          Name match
        </div>
      );
    }

    if (
      product.tags &&
      product.tags.some(
        tag =>
          tag &&
          typeof tag === 'string' &&
          (tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase()))
      )
    ) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
          Tag match
        </div>
      );
    }

    if (product.categoryName && product.categoryName.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          Category match
        </div>
      );
    }

    return (
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
        Relevant match
      </div>
    );
  };

  const formatPricing = () => {
    if (!product.pricing) return 'Free';

    const { type, amount, currency } = product.pricing;

    switch (type) {
      case 'free':
        return 'Free';
      case 'paid':
        return `${currency} ${amount}`;
      case 'subscription':
        return `${currency} ${amount}/${product.pricing.interval || 'month'}`;
      case 'freemium':
        return 'Freemium';
      case 'contact':
        return 'Contact for pricing';
      default:
        return 'Free';
    }
  };

  const getMakerName = () => {
    if (product.makerDetails && product.makerDetails[0]) {
      const maker = product.makerDetails[0];
      return maker.firstName && maker.lastName
        ? `${maker.firstName} ${maker.lastName}`
        : maker.username;
    }
    return 'Unknown maker';
  };

  const getCategoryName = () => {
    if (product.categoryName) {
      return product.categoryName;
    }

    if (product.category && categories && categories.length > 0) {
      const category = categories.find(cat => cat._id === product.category);
      return category ? category.name : 'Uncategorized';
    }

    return 'Uncategorized';
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow relative"
    >
      <Link href={`/product/${product.slug}`} className="flex md:flex-row flex-col h-full">
        <div className="md:w-48 w-full h-48 md:h-auto flex-shrink-0 bg-gray-100 relative">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package size={48} />
            </div>
          )}

          {product.featured && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
              Featured
            </div>
          )}
        </div>

        <div className="p-6 flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-semibold text-gray-900 pr-2">{product.name}</h3>
            <span className="text-sm text-gray-500 whitespace-nowrap">{formatPricing()}</span>
          </div>

          <p className="text-gray-500 mb-2 line-clamp-2">{product.tagline}</p>

          {product.explanationText && (
            <p className="text-xs text-violet-600 mb-3 italic">
              <InfoIcon size={12} className="inline mr-1" />
              {product.explanationText}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {product.tags &&
              product.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
          </div>

          <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-2 gap-y-1">
            <span className="flex items-center">
              <ArrowUp size={16} className="mr-1" />
              {product.upvoteCount || 0}
            </span>

            {product.bookmarks !== undefined && (
              <span className="flex items-center">
                <Bookmark size={16} className="mr-1" />
                {product.bookmarkCount || 0}
              </span>
            )}

            {product.views && product.views.count && (
              <span className="flex items-center">
                <Eye size={16} className="mr-1" />
                {product.views.count}
              </span>
            )}

            <span className="mx-2">•</span>

            <span>{getCategoryName()}</span>

            <span className="mx-2">•</span>

            <span className="flex items-center">by {getMakerName()}</span>

            {product.launchedAt && (
              <>
                <span className="mx-2">•</span>
                <span>Launched {formatDate(product.launchedAt)}</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {getRelevanceBadge()}
    </motion.div>
  );
};

ProductResultItem.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string,
    slug: PropTypes.string,
    name: PropTypes.string,
    tagline: PropTypes.string,
    thumbnail: PropTypes.string,
    featured: PropTypes.bool,
    pricing: PropTypes.shape({
      type: PropTypes.string,
      amount: PropTypes.number,
      currency: PropTypes.string,
      interval: PropTypes.string,
    }),
    tags: PropTypes.arrayOf(PropTypes.string),
    category: PropTypes.string,
    categoryName: PropTypes.string,
    makerDetails: PropTypes.arrayOf(
      PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        username: PropTypes.string,
      })
    ),
    upvoteCount: PropTypes.number,
    bookmarkCount: PropTypes.number,
    views: PropTypes.shape({
      count: PropTypes.number,
    }),
    launchedAt: PropTypes.string,
    searchRelevance: PropTypes.shape({
      primaryMatchReason: PropTypes.string,
    }),
    fuzzyMatch: PropTypes.bool,
    explanationText: PropTypes.string,
  }).isRequired,
  query: PropTypes.string.isRequired,
};

const JobResultItem = ({ job, query }) => {
  const getRelevanceBadge = () => {
    if (!query || !query.trim()) return null;

    const queryLower = query.toLowerCase();

    if (job.title && job.title.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
          Title match
        </div>
      );
    }

    if (
      job.skills &&
      job.skills.some(
        skill =>
          skill &&
          typeof skill === 'string' &&
          (skill.toLowerCase().includes(queryLower) || queryLower.includes(skill.toLowerCase()))
      )
    ) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
          Skill match
        </div>
      );
    }

    if (job.company?.name && job.company.name.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          Company match
        </div>
      );
    }

    return (
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
        Relevant match
      </div>
    );
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow relative"
    >
      <Link href={`/jobs/${job._id}`} className="block p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            {job.companyDetails?.[0]?.profilePicture ? (
              <img
                src={job.companyDetails[0].profilePicture}
                alt={job.company?.name || 'Company'}
                className="w-14 h-14 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Briefcase size={24} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
            <p className="text-gray-600 mb-2">
              {job.company?.name || job.companyDetails?.[0]?.name || 'Company'}
            </p>

            {job.explanationText && (
              <p className="text-xs text-violet-600 mb-3 italic">
                <InfoIcon size={12} className="inline mr-1" />
                {job.explanationText}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {job.jobType}
              </span>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                {job.locationType}
              </span>
              {job.experienceLevel && (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                  {job.experienceLevel}
                </span>
              )}
            </div>
            {job.skills && (
              <div className="flex flex-wrap gap-2">
                {job.skills.slice(0, 5).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>

      {getRelevanceBadge()}
    </motion.div>
  );
};

JobResultItem.propTypes = {
  job: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    company: PropTypes.shape({
      name: PropTypes.string,
    }),
    companyDetails: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        profilePicture: PropTypes.string,
      })
    ),
    jobType: PropTypes.string,
    locationType: PropTypes.string,
    experienceLevel: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    explanationText: PropTypes.string,
  }).isRequired,
  query: PropTypes.string.isRequired,
};

const ProjectResultItem = ({ project, query }) => {
  const getRelevanceBadge = () => {
    if (!query || !query.trim()) return null;

    const queryLower = query.toLowerCase();

    if (project.title && project.title.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
          Title match
        </div>
      );
    }

    if (
      project.technologies &&
      project.technologies.some(
        tech =>
          tech &&
          typeof tech === 'string' &&
          (tech.toLowerCase().includes(queryLower) || queryLower.includes(tech.toLowerCase()))
      )
    ) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
          Tech match
        </div>
      );
    }

    if (project.description && project.description.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          Description match
        </div>
      );
    }

    return (
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
        Relevant match
      </div>
    );
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow relative"
    >
      <Link href={`/project/${project._id}`} className="flex md:flex-row flex-col h-full">
        <div className="md:w-48 w-full h-48 md:h-auto flex-shrink-0 bg-gray-100">
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Folder size={48} />
            </div>
          )}
        </div>
        <div className="p-6 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.title}</h3>
          <p className="text-gray-500 mb-2 line-clamp-2">{project.description}</p>

          {project.explanationText && (
            <p className="text-xs text-violet-600 mb-3 italic">
              <InfoIcon size={12} className="inline mr-1" />
              {project.explanationText}
            </p>
          )}
          {project.technologies && (
            <div className="flex flex-wrap gap-2 mb-4">
              {project.technologies.slice(0, 5).map((tech, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <span>{project.categoryName}</span>
            {project.ownerDetails && project.ownerDetails[0] && (
              <>
                <span className="mx-2">•</span>
                <span>by {project.ownerDetails[0].name}</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {getRelevanceBadge()}
    </motion.div>
  );
};

ProjectResultItem.propTypes = {
  project: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    thumbnail: PropTypes.string,
    technologies: PropTypes.arrayOf(PropTypes.string),
    categoryName: PropTypes.string,
    ownerDetails: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
      })
    ),
    explanationText: PropTypes.string,
  }).isRequired,
  query: PropTypes.string.isRequired,
};

const UserResultItem = ({ user, query }) => {
  const getRelevanceBadge = () => {
    if (!query || !query.trim()) return null;

    const queryLower = query.toLowerCase();
    const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();

    if (user.username && user.username.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
          Username match
        </div>
      );
    }

    if (user.firstName && user.firstName.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
          First name match
        </div>
      );
    }

    if (user.lastName && user.lastName.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
          Last name match
        </div>
      );
    }

    if (fullName && fullName.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          Full name match
        </div>
      );
    }

    if (user.role && user.role.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
          Role match
        </div>
      );
    }

    if (user.companyName && user.companyName.toLowerCase().includes(queryLower)) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
          Company match
        </div>
      );
    }

    return (
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
        Relevant match
      </div>
    );
  };

  const formatRole = role => {
    if (!role) return '';

    return role
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow relative hover:shadow-md"
    >
      <Link href={`/${user.username}`} className="block p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-4">
            {user.profilePicture && user.profilePicture.url ? (
              <img
                src={user.profilePicture.url}
                alt={
                  user.fullName ||
                  `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                  user.username
                }
                className="w-16 h-16 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center text-violet-500">
                <User size={32} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {user.fullName ||
                  `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                  user.username}
              </h3>

              {user.isVerified && (
                <span className="ml-1 text-blue-500" title="Verified User">
                  <CheckCircle size={16} />
                </span>
              )}
            </div>

            <p className="text-violet-600 font-medium mb-2">@{user.username}</p>

            {user.bio && <p className="text-gray-500 mb-3 line-clamp-2">{user.bio}</p>}

            <div className="flex flex-wrap gap-2 mt-2">
              {user.role && (
                <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                  {formatRole(user.role)}
                </span>
              )}

              {user.companyName && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center">
                  <Briefcase size={12} className="mr-1" />
                  {user.companyName}
                </span>
              )}

              {user.companyRole && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  {user.companyRole}
                </span>
              )}
            </div>

            {user.explanationText && (
              <p className="text-xs text-violet-600 mt-3 italic flex items-center">
                <InfoIcon size={12} className="inline mr-1" />
                {user.explanationText}
              </p>
            )}
          </div>
        </div>
      </Link>

      {getRelevanceBadge()}
    </motion.div>
  );
};

UserResultItem.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string,
    username: PropTypes.string,
    fullName: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    bio: PropTypes.string,
    role: PropTypes.string,
    companyName: PropTypes.string,
    companyRole: PropTypes.string,
    isVerified: PropTypes.bool,
    profilePicture: PropTypes.shape({
      url: PropTypes.string,
    }),
    explanationText: PropTypes.string,
  }).isRequired,
  query: PropTypes.string.isRequired,
};

export default SearchPage;
