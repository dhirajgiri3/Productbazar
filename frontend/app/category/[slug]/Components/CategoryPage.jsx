"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import "./styles.css";
import {
  Clock,
  TrendingUp,
  Eye,
  SortAsc,
  SortDesc,
  Filter,
  ChevronDown,
  Grid,
  List,
  ArrowRight,
  ArrowUp,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { useCategories } from "@/lib/contexts/category-context";
import ProductCard from "Components/Product/ProductCard";
import NumberedProductCard from "@/app/products/Components/NumberedProductCard";
import LoaderComponent from "Components/UI/LoaderComponent";
import NewsletterSignup from "Components/common/Auth/NewsletterSignup";
import logger from "@/lib/utils/logger";
import QuickLinks from "Components/QuickLinks/QuickLinks";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Wrapper component for staggered animations
const SectionWrapper = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

// Client Component for Category Page
export default function CategoryPageClient({ slug }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    fetchProductsByCategory,
    fetchCategories,
    categories,
    productsLoading,
  } = useCategories();

  // State for products and pagination
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [relatedCategories, setRelatedCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
  });
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState("list"); // Default to list view
  const [isLoaded, setIsLoaded] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    price: [],
    subcategory: null,
  });

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Load categories if not already loaded
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  // Prepare query parameters for API call with enhanced logging
  const prepareQueryParams = useCallback(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      sort: sort,
    };

    // Add price filter if selected
    if (filters.price && filters.price.length > 0) {
      params.pricing_type = filters.price.join(',');
    }

    // Add subcategory filter if selected
    if (filters.subcategory) {
      params.subcategory = filters.subcategory;
    }

    // Log the query parameters for debugging
    logger.debug('Category page query parameters:', params);

    return params;
  }, [pagination.page, pagination.limit, sort, filters.price, filters.subcategory]);

  // Memoized loadProducts function to prevent unnecessary API calls
  const loadProducts = useCallback(async (isInitialLoad = true) => {
    if (!slug) return;

    try {
      if (isInitialLoad) {
        setIsLoaded(false);
        setLocalError(null);
      }

      // Get query parameters
      const params = prepareQueryParams();

      // Only pass the necessary parameters to avoid duplication
      const result = await fetchProductsByCategory(
        slug,
        params.page,
        params.limit,
        params.sort,
        false, // Don't force refresh to avoid rate limiting
        { // Pass all filter parameters
          ...(params.pricing_type && { pricing_type: params.pricing_type }),
          ...(params.subcategory && { subcategory: params.subcategory })
        }
      );

      if (result.products) {
        // Ensure each product has properly initialized upvote and bookmark counts
        const normalizedProducts = result.products.map(product => ({
          ...product,
          // Ensure upvote count is properly initialized
          upvoteCount: product.upvoteCount ?? product.upvotes?.count ?? 0,
          // Ensure bookmark count is properly initialized
          bookmarkCount: product.bookmarkCount ?? product.bookmarks?.count ?? 0,
          // Ensure nested structures are properly initialized
          upvotes: {
            ...(product.upvotes || {}),
            count: product.upvoteCount ?? product.upvotes?.count ?? 0,
            userHasUpvoted: product.upvoted ?? product.upvotes?.userHasUpvoted ?? product.userInteractions?.hasUpvoted ?? false
          },
          bookmarks: {
            ...(product.bookmarks || {}),
            count: product.bookmarkCount ?? product.bookmarks?.count ?? 0,
            userHasBookmarked: product.bookmarked ?? product.bookmarks?.userHasBookmarked ?? product.userInteractions?.hasBookmarked ?? false
          },
          // Ensure user interactions are properly initialized
          userInteractions: {
            ...(product.userInteractions || {}),
            hasUpvoted: product.upvoted ?? product.upvotes?.userHasUpvoted ?? product.userInteractions?.hasUpvoted ?? false,
            hasBookmarked: product.bookmarked ?? product.bookmarks?.userHasBookmarked ?? product.userInteractions?.hasBookmarked ?? false
          }
        }));

        setProducts(normalizedProducts);
        setCategory(result.category);
        setRelatedCategories(result.relatedCategories || []);
        setPagination(result.pagination);
      } else {
        setLocalError("Failed to load products");
      }
    } catch (err) {
      // Only log and set error if it's not a canceled request
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        logger.error("Error loading products:", err);
        setLocalError("Failed to load products");
      }
    } finally {
      if (isInitialLoad) {
        setIsLoaded(true);
      }
    }
  }, [slug, fetchProductsByCategory, sort, filters.price, filters.subcategory, pagination.page, pagination.limit]);

  // Load products when slug changes or sort/filters change
  useEffect(() => {
    // Reset products and pagination when filters or sort change
    setProducts([]);
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Add a small delay to prevent multiple simultaneous requests
    const timer = setTimeout(() => {
      loadProducts();
    }, 100);

    // Cleanup function to handle component unmount
    return () => {
      clearTimeout(timer);
    };
  }, [slug, sort, filters.price, filters.subcategory]); // Add filter dependencies

  // Load more products when scrolling to the bottom
  const loadMoreProducts = useCallback(async () => {
    if (productsLoading || !pagination.hasNextPage) return;

    try {
      const nextPage = pagination.page + 1;

      // Get query parameters and update page
      const params = prepareQueryParams();
      params.page = nextPage;

      const result = await fetchProductsByCategory(
        slug,
        params.page,
        params.limit,
        params.sort,
        false, // Don't force refresh to avoid rate limiting
        { // Pass all filter parameters
          ...(params.pricing_type && { pricing_type: params.pricing_type }),
          ...(params.subcategory && { subcategory: params.subcategory })
        }
      );

      if (result.products) {
        // Ensure each product has properly initialized upvote and bookmark counts
        const normalizedProducts = result.products.map(product => ({
          ...product,
          // Ensure upvote count is properly initialized
          upvoteCount: product.upvoteCount ?? product.upvotes?.count ?? 0,
          // Ensure bookmark count is properly initialized
          bookmarkCount: product.bookmarkCount ?? product.bookmarks?.count ?? 0,
          // Ensure nested structures are properly initialized
          upvotes: {
            ...(product.upvotes || {}),
            count: product.upvoteCount ?? product.upvotes?.count ?? 0,
            userHasUpvoted: product.upvoted ?? product.upvotes?.userHasUpvoted ?? product.userInteractions?.hasUpvoted ?? false
          },
          bookmarks: {
            ...(product.bookmarks || {}),
            count: product.bookmarkCount ?? product.bookmarks?.count ?? 0,
            userHasBookmarked: product.bookmarked ?? product.bookmarks?.userHasBookmarked ?? product.userInteractions?.hasBookmarked ?? false
          },
          // Ensure user interactions are properly initialized
          userInteractions: {
            ...(product.userInteractions || {}),
            hasUpvoted: product.upvoted ?? product.upvotes?.userHasUpvoted ?? product.userInteractions?.hasUpvoted ?? false,
            hasBookmarked: product.bookmarked ?? product.bookmarks?.userHasBookmarked ?? product.userInteractions?.hasBookmarked ?? false
          }
        }));

        setProducts((prev) => [...prev, ...normalizedProducts]);
        setPagination(result.pagination);
      }
    } catch (err) {
      // Only log error if it's not a canceled request
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        logger.error("Error loading more products:", err);
      }
    }
  }, [slug, pagination, productsLoading, fetchProductsByCategory, prepareQueryParams]);

  // Check if we need to load more products when scrolling
  useEffect(() => {
    if (inView && pagination.hasNextPage && !productsLoading) {
      // Add a small delay to prevent rapid consecutive requests
      const timer = setTimeout(() => {
        loadMoreProducts();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [inView, loadMoreProducts, pagination.hasNextPage, productsLoading]);

  // Handle sort change with memoization
  const handleSortChange = useCallback((newSort) => {
    if (newSort === sort) return;
    setSort(newSort);
  }, [sort]);

  // Handle price filter change with memoization
  const handlePriceFilterChange = useCallback((priceType) => {
    setFilters(prev => {
      const newPriceFilters = [...prev.price];

      // Toggle the price filter
      const index = newPriceFilters.indexOf(priceType);
      if (index === -1) {
        newPriceFilters.push(priceType);
      } else {
        newPriceFilters.splice(index, 1);
      }

      return {
        ...prev,
        price: newPriceFilters
      };
    });
  }, []);

  // Handle subcategory filter change with memoization
  const handleSubcategoryFilterChange = useCallback((subcategorySlug) => {
    setFilters(prev => ({
      ...prev,
      subcategory: prev.subcategory === subcategorySlug ? null : subcategorySlug
    }));
  }, []);

  // Clear all filters with memoization
  const clearAllFilters = useCallback(() => {
    setFilters({
      price: [],
      subcategory: null
    });
  }, []);

  // View mode is now toggled directly in the button onClick handlers

  // Memoized sort options to prevent re-renders
  const sortOptions = useMemo(
    () => [
      { value: "newest", label: "Newest", icon: <Clock size={16} /> },
      { value: "most_viewed", label: "Most Viewed", icon: <Eye size={16} /> },
      { value: "name_asc", label: "Name (A-Z)", icon: <SortAsc size={16} /> },
      { value: "name_desc", label: "Name (Z-A)", icon: <SortDesc size={16} /> },
    ],
    []
  );

  // Render category header with enhanced UI and animations
  const renderCategoryHeader = () => {
    if (!category) return null;

    return (
      <SectionWrapper>
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 mb-8 shadow-sm">
          <div className="p-8">
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {category.icon && (
                <motion.div
                  className="w-24 h-24 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-100 shadow-sm"
                  style={{ backgroundColor: category.color || '#F9FAFB' }}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <Image
                    src={category.icon}
                    alt={category.name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </motion.div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <motion.h1
                    className="text-3xl font-bold text-gray-900"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    {category.name}
                  </motion.h1>
                  <motion.div
                    className="px-3 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {category.productCount} products
                  </motion.div>
                </div>
                {category.description && (
                  <motion.p
                    className="text-gray-600 max-w-2xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    {category.description}
                  </motion.p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </SectionWrapper>
    );
  };

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.price.length > 0) count += filters.price.length;
    if (filters.subcategory) count += 1;
    return count;
  }, [filters]);

  // Render product filters and sorting with enhanced UI and animations
  const renderFilters = () => (
    <SectionWrapper delay={0.1}>
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 mb-6 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
              <motion.button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 ${activeFilterCount > 0 ? 'text-violet-600' : 'text-gray-700'} hover:text-violet-600 transition-colors px-4 py-2 rounded-md hover:bg-violet-50`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Filter size={18} />
                <span className="font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-violet-100 text-violet-700"
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
                <motion.div
                  animate={{ rotate: isFilterOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={16} />
                </motion.div>
              </motion.button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-md focus:outline-none focus:border-violet-500 transition-colors"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
                <motion.button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-violet-50 text-violet-600 border border-violet-200"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  aria-label="Grid view"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Grid size={18} />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-violet-50 text-violet-600 border border-violet-200"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  aria-label="List view"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <List size={18} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Active filters display with enhanced animations */}
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 pt-4 border-t border-gray-100"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {filters.price.map(priceType => (
                    <motion.span
                      key={priceType}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-md border border-violet-100"
                    >
                      {priceType.charAt(0).toUpperCase() + priceType.slice(1)}
                      <motion.button
                        onClick={() => handlePriceFilterChange(priceType)}
                        className="text-violet-500 hover:text-violet-700"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </motion.span>
                  ))}
                  {filters.subcategory && category?.subcategories && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-md border border-violet-100"
                    >
                      {category.subcategories.find(s => s.slug === filters.subcategory)?.name || filters.subcategory}
                      <motion.button
                        onClick={() => handleSubcategoryFilterChange(filters.subcategory)}
                        className="text-violet-500 hover:text-violet-700"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </motion.span>
                  )}
                  <motion.button
                    onClick={clearAllFilters}
                    className="text-xs text-violet-600 hover:text-violet-800 hover:underline ml-2 flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear all
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden mb-6"
          >
            <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
              {/* Enhanced filter options with better spacing and animations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Price
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      onClick={() => handlePriceFilterChange('free')}
                      className={`px-3 py-1.5 border ${filters.price.includes('free') ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700'} rounded-md text-sm transition-colors`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Free
                    </motion.button>
                    <motion.button
                      onClick={() => handlePriceFilterChange('paid')}
                      className={`px-3 py-1.5 border ${filters.price.includes('paid') ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700'} rounded-md text-sm transition-colors`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Paid
                    </motion.button>
                    <motion.button
                      onClick={() => handlePriceFilterChange('contact')}
                      className={`px-3 py-1.5 border ${filters.price.includes('contact') ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700'} rounded-md text-sm transition-colors`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Contact
                    </motion.button>
                    <motion.button
                      onClick={() => handlePriceFilterChange('subscription')}
                      className={`px-3 py-1.5 border ${filters.price.includes('subscription') ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700'} rounded-md text-sm transition-colors`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Subscription
                    </motion.button>
                    <motion.button
                      onClick={() => handlePriceFilterChange('freemium')}
                      className={`px-3 py-1.5 border ${filters.price.includes('freemium') ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700'} rounded-md text-sm transition-colors`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Freemium
                    </motion.button>
                  </div>
                </div>

                {category &&
                  category.subcategories &&
                  category.subcategories.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Subcategories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {category.subcategories.map((subcat) => (
                          <motion.button
                            key={subcat._id}
                            onClick={() => handleSubcategoryFilterChange(subcat.slug)}
                            className={`px-3 py-1.5 border ${filters.subcategory === subcat.slug ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700'} rounded-md text-sm transition-colors`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {subcat.name}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                <div>
                  <h3 className="font-medium text-gray-700 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Actions
                  </h3>
                  <motion.button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors w-full flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02, backgroundColor: "#f3f4f6" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All Filters
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionWrapper>
  );

  // Render product grid or list
  const renderProducts = () => {
    if (localError) {
      return (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
          <p className="text-red-500 mb-4">{localError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (productsLoading && !isLoaded) {
      return (
        <div className={viewMode === "grid"
          ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
          : "space-y-6"
        }>
          {[...Array(viewMode === "grid" ? 4 : 3)].map((_, i) => (
            <div
              key={i}
              className={`bg-gray-100 rounded-xl ${viewMode === "grid" ? "h-64" : "h-32"} animate-pulse relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skeleton-loading"></div>
            </div>
          ))}
        </div>
      );
    }

    if (products.length === 0 && isLoaded) {
      return (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-violet-50 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {activeFilterCount > 0
              ? 'No products match your current filters. Try adjusting or clearing your filters.'
              : 'There are no products in this category yet.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-10"
            : "space-y-6"
        }
      >
        {products.map((product, index) => (
          <motion.div key={product._id} variants={itemVariants}>
            {viewMode === "grid" ? (
              <ProductCard product={product} viewMode={viewMode} />
            ) : (
              <NumberedProductCard
                product={product}
                position={index}
                recommendationType="category"
              />
            )}
          </motion.div>
        ))}

        {/* Load more trigger */}
        {pagination.hasNextPage && (
          <div ref={ref} className="w-full py-8 flex justify-center">
            {productsLoading && <LoaderComponent size="small" />}
          </div>
        )}
      </motion.div>
    );
  };

  // Render related categories with enhanced UI and animations
  const renderRelatedCategories = () => {
    if (!relatedCategories || relatedCategories.length === 0) return null;

    return (
      <SectionWrapper delay={0.2}>
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="text-violet-600 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </span>
              Related Categories
            </h3>
          </div>
          <div className="p-4">
            <motion.div
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {relatedCategories.map((relCat, index) => (
                <motion.div
                  key={relCat._id}
                  variants={itemVariants}
                  custom={index}
                  whileHover={{ scale: 1.01, x: 3 }}
                >
                  <Link
                    href={`/category/${relCat.slug}`}
                    className="flex items-center p-3 hover:bg-violet-50 rounded-md transition-all duration-200 group border border-transparent hover:border-violet-200"
                  >
                    {relCat.icon && (
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center mr-3 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow"
                        style={{ backgroundColor: relCat.color || "#F9FAFB" }}
                      >
                        <Image
                          src={relCat.icon}
                          alt={relCat.name}
                          width={24}
                          height={24}
                          className="object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 group-hover:text-violet-700 transition-colors">
                        {relCat.name}
                      </h4>
                      {relCat.description && (
                        <p className="text-sm text-gray-500 line-clamp-1 group-hover:text-gray-700 transition-colors">
                          {relCat.description}
                        </p>
                      )}
                    </div>
                    <motion.div
                      className="text-gray-400 group-hover:text-violet-600 transition-colors"
                      whileHover={{ x: 3 }}
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, repeatType: "loop", duration: 2, repeatDelay: 1 }}
                    >
                      <ArrowRight size={16} />
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </SectionWrapper>
    );
  };

  // Enhanced Back to top button with improved animations
  const BackToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      };

      window.addEventListener("scroll", toggleVisibility);
      return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", stiffness: 260, damping: 20 }
            }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 bg-white text-violet-600 border border-gray-200 rounded-full shadow-md hover:shadow-lg hover:border-violet-300 transition-all z-50 flex items-center justify-center"
            aria-label="Back to top"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-slate-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8 relative">
        {/* Category Header */}
        {renderCategoryHeader()}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Filters */}
            {renderFilters()}

            {/* Products */}
            <SectionWrapper delay={0.2}>
              <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="p-6">
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <motion.h2
                      className="text-xl font-semibold text-gray-800 flex items-center flex-wrap gap-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                    >
                      {category ? `${category.name} Products` : 'Products'}
                      {pagination && pagination.total > 0 && (
                        <span className="text-sm font-normal text-gray-500 inline-flex items-center">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 mx-2"></span>
                          {pagination.total} {pagination.total === 1 ? 'product' : 'products'}
                        </span>
                      )}
                    </motion.h2>
                    {products.length > 0 && (
                      <motion.div
                        className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                      >
                        Showing {products.length} of {pagination.total}
                      </motion.div>
                    )}
                  </div>
                  {renderProducts()}
                </div>
              </div>
            </SectionWrapper>

            {/* Sign Up Prompt for non-authenticated users */}
            {!isAuthenticated && (
              <SectionWrapper delay={0.3}>
                <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  <div className="p-8 text-center">
                    <motion.div
                      className="w-14 h-14 border border-violet-100 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: [0, 10, 0] }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </motion.div>
                    <motion.h3
                      className="text-xl font-bold text-gray-900 mb-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      Join Our Community
                    </motion.h3>
                    <motion.p
                      className="text-gray-600 mb-6 max-w-md mx-auto"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      Sign up to discover personalized recommendations, connect with other users, and get notified about new products in this category.
                    </motion.p>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(124, 58, 237, 0.1), 0 4px 6px -2px rgba(124, 58, 237, 0.05)" }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-all border border-violet-700 shadow-sm"
                      onClick={() => router.push("/auth/register")}
                    >
                      Register Now
                    </motion.button>
                  </div>
                </div>
              </SectionWrapper>
            )}
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-8 lg:sticky lg:top-20 self-start max-h-[calc(100vh-2rem)] overflow-y-auto pb-6">
            {/* Related Categories */}
            {renderRelatedCategories()}

            {/* Newsletter Signup */}
            <SectionWrapper delay={0.2}>
              <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <NewsletterSignup />
              </div>
            </SectionWrapper>

            <QuickLinks />
          </div>
        </div>
      </div>

      {/* Back to top button */}
      <BackToTopButton />
    </motion.div>
  );
}
