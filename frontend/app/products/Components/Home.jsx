'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRecommendation } from '@/lib/contexts/recommendation-context';
import { useToast } from '@/lib/contexts/toast-context';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import logger from '@/lib/utils/logger';
import { ArrowUp, Clock, AlertCircle } from 'lucide-react';
import debounce from 'lodash.debounce';
import useSWR from 'swr';

// Constants
const RECOMMENDATION_TYPES = {
  TRENDING: 'trending',
  PERSONALIZED: 'personalized',
  NEW: 'new',
  COLLABORATIVE: 'collaborative',
  FEED: 'feed',
  INTERESTS: 'interests',
};

const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
};

const ANIMATION = {
  FADE: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.4 },
  },
  SLIDE_UP: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.5 },
  },
};

// Static components
import HeroSection from './HeroSection';
import CategoryList from './CategoryList';
import NewsletterSignup from 'Components/common/Auth/NewsletterSignup';
import QuickLinks from 'Components/QuickLinks/QuickLinks';

// Dynamically imported components (ssr: false for client-side rendering)
const TrendingProductsSection = dynamic(() => import('./TrendingProductSection'), { ssr: false });
const PersonalizedSection = dynamic(() => import('./PersonalizedSection'), { ssr: false });
const NewProductsSection = dynamic(() => import('./NewProductsSection'), { ssr: false });
const HybridFeedSection = dynamic(() => import('./HybridFeedSection'), { ssr: false });
const InterestBasedSection = dynamic(() => import('./InterestBasedSection'), { ssr: false });
const ForumThreadsSection = dynamic(() => import('./ForumThreadsSection'), { ssr: false });
const CommunityPicksSection = dynamic(() => import('./CommunityPicksSection'), { ssr: false });

// Error and loading components
const ErrorFallback = memo(({ type = 'section', retry, error }) => {
  logger.error(`ErrorFallback triggered for ${type}:`, error);

  return (
    <div
      className="bg-white rounded-xl overflow-hidden border border-gray-100 p-6 text-center"
      role="alert"
      aria-labelledby={`error-heading-${type}`}
    >
      <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" aria-hidden="true" />
      <h3 id={`error-heading-${type}`} className="text-lg font-semibold text-gray-800 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 mb-4">We couldn't load this {type}. Please try again later.</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-violet-700 text-white rounded-lg hover:bg-violet-800 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-opacity-50"
          aria-label="Retry loading content"
          data-testid="retry-button"
        >
          Retry
        </button>
      )}
    </div>
  );
});

ErrorFallback.displayName = 'ErrorFallback';

const SectionSkeleton = memo(({ height = 'h-64', testId = '' }) => (
  <div
    className={`animate-pulse rounded-xl ${height} w-full bg-gray-100/60 overflow-hidden`}
    role="progressbar"
    aria-busy="true"
    aria-label="Loading content"
    data-testid={`skeleton-${testId}`}
  >
    <div className="h-4 w-1/3 bg-gray-200 rounded-full mb-4 mx-6 mt-6"></div>
    <div className="h-24 bg-gray-200/70 mx-6 rounded-lg mb-4"></div>
    <div className="h-24 bg-gray-200/70 mx-6 rounded-lg"></div>
  </div>
));

SectionSkeleton.displayName = 'SectionSkeleton';

// Border divider component
const BorderDivider = memo(() => (
  <div className="my-6 lg:my-8 border-t border-gray-100" aria-hidden="true"></div>
));

BorderDivider.displayName = 'BorderDivider';

// Section wrapper with animation
const SectionWrapper = memo(({ children, delay = 0, className = '', testId = '', id = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  // Use useMemo to prevent unnecessary recalculation of animation props
  const animationProps = useMemo(() => {
    const baseProps = shouldReduceMotion ? { ...ANIMATION.FADE } : { ...ANIMATION.SLIDE_UP };

    if (delay) {
      return {
        ...baseProps,
        transition: { ...baseProps.transition, delay }
      };
    }

    return baseProps;
  }, [shouldReduceMotion, delay]);

  return (
    <motion.section
      {...animationProps}
      className={`w-full ${className}`}
      data-testid={testId}
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      {children}
    </motion.section>
  );
});

SectionWrapper.displayName = 'SectionWrapper';

// Unified suspense wrapper
const SuspenseWithErrorBoundary = memo(({
  children,
  fallbackType,
  loadingHeight = 'h-64',
  testId = '',
}) => (
  <ErrorBoundary
    FallbackComponent={({ error, resetErrorBoundary }) => (
      <ErrorFallback type={fallbackType} retry={resetErrorBoundary} error={error} />
    )}
    onReset={() => {
      logger.debug(`Error boundary reset for ${fallbackType}`);
    }}
  >
    <React.Suspense fallback={<SectionSkeleton height={loadingHeight} testId={testId} />}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
));

SuspenseWithErrorBoundary.displayName = 'SuspenseWithErrorBoundary';

// Optimized hook for fetching recommendation data
function useRecommendationData(type, options = {}) {
  const { isAuthenticated } = useAuth();
  const {
    getTrendingRecommendations,
    getPersonalizedRecommendations,
    getNewRecommendations,
    getCollaborativeRecommendations,
    getFeedRecommendations,
    getInterestsRecommendations,
  } = useRecommendation();

  const { limit = 10, days = 7, skip = false } = options;

  // Memoize the fetch function map to prevent unnecessary re-renders
  const fetchFunctionMap = useMemo(() => ({
    [RECOMMENDATION_TYPES.TRENDING]: getTrendingRecommendations,
    [RECOMMENDATION_TYPES.PERSONALIZED]: getPersonalizedRecommendations,
    [RECOMMENDATION_TYPES.NEW]: getNewRecommendations,
    [RECOMMENDATION_TYPES.COLLABORATIVE]: getCollaborativeRecommendations,
    [RECOMMENDATION_TYPES.FEED]: getFeedRecommendations,
    [RECOMMENDATION_TYPES.INTERESTS]: getInterestsRecommendations,
  }), [
    getTrendingRecommendations,
    getPersonalizedRecommendations,
    getNewRecommendations,
    getCollaborativeRecommendations,
    getFeedRecommendations,
    getInterestsRecommendations
  ]);

  // Determine if we should skip fetching based on authentication status
  const shouldSkip = useMemo(() =>
    skip ||
    (type === RECOMMENDATION_TYPES.PERSONALIZED && !isAuthenticated) ||
    (type === RECOMMENDATION_TYPES.COLLABORATIVE && !isAuthenticated) ||
    (type === RECOMMENDATION_TYPES.INTERESTS && !isAuthenticated) ||
    // Skip feed for unauthenticated users if it's likely to contain personalized content
    (type === RECOMMENDATION_TYPES.FEED && !isAuthenticated),
  [skip, type, isAuthenticated]);

  // Generate a cache key for SWR
  const cacheKey = useMemo(() =>
    shouldSkip ? null : `home/${type}`,
  [shouldSkip, type]);

  // Create a memoized fetcher function for SWR with improved error handling
  const fetcher = useCallback(async () => {
    if (shouldSkip) return [];

    const fetchFunction = fetchFunctionMap[type];
    if (!fetchFunction) {
      logger.warn(`No fetch function found for recommendation type: ${type}`);
      return [];
    }

    try {
      const results = await fetchFunction(limit, 0, days, false);

      // Log if we get empty results to help with debugging
      if (!results || results.length === 0) {
        logger.info(`Empty results for ${type} recommendations`);
      }

      return results || []; // Ensure we always return an array
    } catch (error) {
      logger.error(`Failed to fetch ${type} recommendations:`, error);
      // Return empty array instead of throwing to prevent component from breaking
      return [];
    }
  }, [fetchFunctionMap, type, limit, days, shouldSkip]);

  // SWR configuration options with improved error handling
  const swrOptions = useMemo(() => ({
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: CACHE_DURATION.SHORT,
    errorRetryCount: 3, // Increase retry count
    errorRetryInterval: 3000, // Wait 3 seconds between retries
    keepPreviousData: true,
    fallbackData: [], // Provide fallback data to prevent undefined errors
    onError: (err) => {
      logger.error(`SWR error for ${type} recommendations:`, err);
    },
    onLoadingSlow: () => {
      logger.warn(`Slow loading for ${type} recommendations`);
    }
  }), [type]);

  // Use SWR for data fetching with caching
  const { data, error, isLoading } = useSWR(cacheKey, fetcher, swrOptions);

  // Return a consistent object structure
  return useMemo(() => ({
    data: data || [],
    isLoading,
    error,
  }), [data, isLoading, error]);
}

// Enhanced track page view hook with improved retry logic
function useTrackPageView() {
  const { isAuthenticated, user } = useAuth();
  const { recordInteraction } = useRecommendation();
  const hasTracked = useRef(false);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    // Skip if already tracked or if recordInteraction is not available
    if (hasTracked.current || !recordInteraction) return;

    let timer = null;
    let retryTimer = null;

    // Function to track page view with retry logic
    const trackPageView = async () => {
      try {
        // Prepare metadata for tracking
        const metadata = {
          pageType: 'homepage',
          userType: user?.role || 'general',
          section: 'main',
          timestamp: new Date().toISOString(),
          path: window.location.pathname,
          isAuthenticated: !!isAuthenticated,
          referrer: document.referrer || '',
          // Add device info for better analytics
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
        };

        // Record the interaction
        await recordInteraction('homepage', 'page_view', metadata);

        // Mark as tracked on success
        hasTracked.current = true;
        retryCount.current = 0;

        logger.debug('Successfully tracked homepage view');
      } catch (error) {
        logger.error('Error tracking page view:', error);

        // Implement exponential backoff for retries
        if (retryCount.current < MAX_RETRIES) {
          const backoffTime = Math.min(5000 * Math.pow(2, retryCount.current), 30000);
          logger.debug(`Retrying page view tracking in ${backoffTime}ms (attempt ${retryCount.current + 1}/${MAX_RETRIES})`);

          retryCount.current += 1;
          retryTimer = setTimeout(trackPageView, backoffTime);
        } else {
          logger.warn(`Failed to track page view after ${MAX_RETRIES} attempts`);
        }
      }
    };

    // Initial delay before tracking to ensure page is fully loaded
    timer = setTimeout(trackPageView, 1500);

    // Clean up all timers on unmount to prevent memory leaks
    return () => {
      if (timer) clearTimeout(timer);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [recordInteraction, isAuthenticated, user]);
}

// Main Home component
export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  // Fetch feed data first with optimized limit, but only if authenticated for personalized content
  const feedData = useRecommendationData(RECOMMENDATION_TYPES.FEED, {
    limit: 12,
    // Skip personalized feed for unauthenticated users
    skip: !isAuthenticated && true
  });

  // Extract and memoize recommendation types from feed data
  const recommendationsFromFeed = useMemo(() => {
    const feed = feedData.data || [];

    // Use defensive programming to handle potential API inconsistencies
    return {
      trending: feed.filter(item => item?.reason === 'trending').slice(0, 6),
      personalized: isAuthenticated ? feed.filter(item => item?.reason === 'personalized').slice(0, 6) : [],
      new: feed.filter(item => item?.reason === 'new').slice(0, 6),
    };
  }, [feedData.data, isAuthenticated]);

  // Fetch specialized data only if feed data is insufficient (optimized fetching strategy)
  const trendingData = useRecommendationData(RECOMMENDATION_TYPES.TRENDING, {
    limit: 6,
    skip: recommendationsFromFeed.trending.length >= 6,
  });

  const personalizedData = useRecommendationData(RECOMMENDATION_TYPES.PERSONALIZED, {
    limit: 6,
    skip: !isAuthenticated || recommendationsFromFeed.personalized.length >= 6,
  });

  const newProductsData = useRecommendationData(RECOMMENDATION_TYPES.NEW, {
    limit: 6,
    days: 14,
    skip: recommendationsFromFeed.new.length >= 6,
  });

  const collaborativeData = useRecommendationData(RECOMMENDATION_TYPES.COLLABORATIVE, {
    limit: 10,
    days: 30,
  });

  const interestsData = useRecommendationData(RECOMMENDATION_TYPES.INTERESTS, {
    limit: 12,
    days: 30,
  });

  // Track page view with enhanced analytics
  useTrackPageView();

  // Memoize recommendation data to prevent unnecessary re-renders
  // with improved empty data handling
  const recommendations = useMemo(() => ({
    [RECOMMENDATION_TYPES.TRENDING]: {
      data:
        recommendationsFromFeed.trending.length >= 6
          ? recommendationsFromFeed.trending
          : (trendingData.data || []),
      isLoading: recommendationsFromFeed.trending.length >= 6 ? false : trendingData.isLoading,
      error: trendingData.error,
      isEmpty: (recommendationsFromFeed.trending.length === 0 && (!trendingData.data || trendingData.data.length === 0)) && !trendingData.isLoading,
    },
    [RECOMMENDATION_TYPES.PERSONALIZED]: {
      data:
        recommendationsFromFeed.personalized.length >= 6
          ? recommendationsFromFeed.personalized
          : (personalizedData.data || []),
      isLoading:
        recommendationsFromFeed.personalized.length >= 6 ? false : personalizedData.isLoading,
      error: personalizedData.error,
      isEmpty: (recommendationsFromFeed.personalized.length === 0 && (!personalizedData.data || personalizedData.data.length === 0)) && !personalizedData.isLoading,
    },
    [RECOMMENDATION_TYPES.NEW]: {
      data:
        recommendationsFromFeed.new.length >= 6
          ? recommendationsFromFeed.new
          : (newProductsData.data || []),
      isLoading: recommendationsFromFeed.new.length >= 6 ? false : newProductsData.isLoading,
      error: newProductsData.error,
      isEmpty: (recommendationsFromFeed.new.length === 0 && (!newProductsData.data || newProductsData.data.length === 0)) && !newProductsData.isLoading,
    },
    [RECOMMENDATION_TYPES.COLLABORATIVE]: {
      data: collaborativeData.data || [],
      isLoading: collaborativeData.isLoading,
      error: collaborativeData.error,
      isEmpty: (!collaborativeData.data || collaborativeData.data.length === 0) && !collaborativeData.isLoading,
    },
    [RECOMMENDATION_TYPES.FEED]: {
      data: feedData.data || [],
      isLoading: feedData.isLoading,
      error: feedData.error,
      isEmpty: (!feedData.data || feedData.data.length === 0) && !feedData.isLoading,
    },
    [RECOMMENDATION_TYPES.INTERESTS]: {
      data: interestsData.data || [],
      isLoading: interestsData.isLoading,
      error: interestsData.error,
      isEmpty: (!interestsData.data || interestsData.data.length === 0) && !interestsData.isLoading,
    },
  }), [
    recommendationsFromFeed,
    trendingData,
    personalizedData,
    newProductsData,
    collaborativeData,
    feedData,
    interestsData
  ]);

  // Optimized debounced search handler
  const handleSearch = useCallback(
    debounce(query => {
      if (query?.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }, 300),
    [router]
  );

  // Memoized loading state calculation
  const isMainContentLoading = useMemo(() =>
    (isAuthenticated && feedData.isLoading) ||
    trendingData.isLoading ||
    (isAuthenticated && personalizedData.isLoading) ||
    newProductsData.isLoading,
  [
    feedData.isLoading,
    trendingData.isLoading,
    isAuthenticated,
    personalizedData.isLoading,
    newProductsData.isLoading
  ]);

  // Show toast on feed error with improved error handling - only for authenticated users
  useEffect(() => {
    if (isAuthenticated && feedData.error && !feedData.isLoading) {
      showToast(
        'warning',
        'Unable to load personalized recommendations. Please try again later.',
        <AlertCircle className="w-5 h-5 text-amber-500" aria-hidden="true" />,
        5000
      );

      // Log detailed error information for debugging
      logger.error('Feed data error:', {
        error: feedData.error,
        timestamp: new Date().toISOString(),
        path: window.location.pathname,
        isAuthenticated
      });
    }
  }, [feedData.error, feedData.isLoading, showToast, isAuthenticated]);

  // Debug logging for recommendation data status
  useEffect(() => {
    // Only log in development environment
    if (process.env.NODE_ENV !== 'development') return;

    // Create a summary of recommendation data status
    const recommendationStatus = {
      trending: {
        dataLength: recommendations[RECOMMENDATION_TYPES.TRENDING].data?.length || 0,
        isLoading: recommendations[RECOMMENDATION_TYPES.TRENDING].isLoading,
        hasError: !!recommendations[RECOMMENDATION_TYPES.TRENDING].error,
        isEmpty: recommendations[RECOMMENDATION_TYPES.TRENDING].isEmpty,
      },
      personalized: {
        dataLength: recommendations[RECOMMENDATION_TYPES.PERSONALIZED].data?.length || 0,
        isLoading: recommendations[RECOMMENDATION_TYPES.PERSONALIZED].isLoading,
        hasError: !!recommendations[RECOMMENDATION_TYPES.PERSONALIZED].error,
        isEmpty: recommendations[RECOMMENDATION_TYPES.PERSONALIZED].isEmpty,
      },
      new: {
        dataLength: recommendations[RECOMMENDATION_TYPES.NEW].data?.length || 0,
        isLoading: recommendations[RECOMMENDATION_TYPES.NEW].isLoading,
        hasError: !!recommendations[RECOMMENDATION_TYPES.NEW].error,
        isEmpty: recommendations[RECOMMENDATION_TYPES.NEW].isEmpty,
      },
      collaborative: {
        dataLength: recommendations[RECOMMENDATION_TYPES.COLLABORATIVE].data?.length || 0,
        isLoading: recommendations[RECOMMENDATION_TYPES.COLLABORATIVE].isLoading,
        hasError: !!recommendations[RECOMMENDATION_TYPES.COLLABORATIVE].error,
        isEmpty: recommendations[RECOMMENDATION_TYPES.COLLABORATIVE].isEmpty,
      },
      feed: {
        dataLength: recommendations[RECOMMENDATION_TYPES.FEED].data?.length || 0,
        isLoading: recommendations[RECOMMENDATION_TYPES.FEED].isLoading,
        hasError: !!recommendations[RECOMMENDATION_TYPES.FEED].error,
        isEmpty: recommendations[RECOMMENDATION_TYPES.FEED].isEmpty,
      },
      interests: {
        dataLength: recommendations[RECOMMENDATION_TYPES.INTERESTS].data?.length || 0,
        isLoading: recommendations[RECOMMENDATION_TYPES.INTERESTS].isLoading,
        hasError: !!recommendations[RECOMMENDATION_TYPES.INTERESTS].error,
        isEmpty: recommendations[RECOMMENDATION_TYPES.INTERESTS].isEmpty,
      },
    };

    // Log the status but throttle to avoid excessive logging
    const now = Date.now();
    const lastLogKey = 'last_recommendation_status_log';
    const lastLog = parseInt(sessionStorage.getItem(lastLogKey) || '0');

    // Only log once every 10 seconds
    if (now - lastLog > 10000) {
      logger.debug('Recommendation sections status:', recommendationStatus);
      try {
        sessionStorage.setItem(lastLogKey, now.toString());
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, [recommendations]);

  // Memoize the main animation props
  const mainAnimationProps = useMemo(() => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 }
  }), []);

  // Memoize the hero section component
  const heroSectionComponent = useMemo(() => (
    <SectionWrapper id="hero-section" testId="hero-section">
      <HeroSection
        onSearch={handleSearch}
        isAuthenticated={isAuthenticated}
        router={router}
      />
    </SectionWrapper>
  ), [handleSearch, isAuthenticated, router]);

  // Memoize the loading skeletons
  const loadingSkeletons = useMemo(() => (
    <>
      {/* Loading skeletons */}
      <div className="lg:col-span-2 space-y-6">
        <SectionSkeleton height="h-96" testId="main-content-1" />
        <SectionSkeleton height="h-96" testId="main-content-2" />
      </div>
      <div className="space-y-6">
        <SectionSkeleton height="h-96" testId="sidebar-1" />
        <SectionSkeleton height="h-64" testId="sidebar-2" />
      </div>
    </>
  ), []);

  // Memoize the main content sections
  const mainContentSections = useMemo(() => (
    <div className="lg:col-span-2 space-y-6 lg:space-y-8">
      {/* Trending Section */}
      <SectionWrapper id="trending-section" testId="trending-section">
        <div
          aria-labelledby="trending-heading"
          className="bg-white rounded-xl overflow-hidden border border-gray-100"
        >
          <h2 id="trending-heading" className="sr-only">
            Trending Recommendations
          </h2>
          <SuspenseWithErrorBoundary
            fallbackType="trending recommendations"
            testId="trending-skeleton"
          >
            <TrendingProductsSection
              products={recommendations[RECOMMENDATION_TYPES.TRENDING].data}
              isLoading={recommendations[RECOMMENDATION_TYPES.TRENDING].isLoading}
              error={recommendations[RECOMMENDATION_TYPES.TRENDING].error}
            />
          </SuspenseWithErrorBoundary>
        </div>
      </SectionWrapper>

      {/* Personalized Section - Only for authenticated users */}
      {isAuthenticated && (
        <SectionWrapper
          id="personalized-section"
          delay={0.1}
          testId="personalized-section"
        >
          <div
            aria-labelledby="personalized-heading"
            className="bg-white rounded-xl overflow-hidden border border-gray-100"
          >
            <h2 id="personalized-heading" className="sr-only">
              Personalized Recommendations
            </h2>
            <SuspenseWithErrorBoundary
              fallbackType="personalized recommendations"
              testId="personalized-skeleton"
            >
              <PersonalizedSection
                componentName="home"
                products={recommendations[RECOMMENDATION_TYPES.PERSONALIZED].data}
                isLoading={recommendations[RECOMMENDATION_TYPES.PERSONALIZED].isLoading}
                error={recommendations[RECOMMENDATION_TYPES.PERSONALIZED].error}
                isAuthenticated={isAuthenticated}
              />
            </SuspenseWithErrorBoundary>
          </div>
        </SectionWrapper>
      )}

      {/* New Arrivals Section */}
      <SectionWrapper
        id="new-arrivals-section"
        delay={isAuthenticated ? 0.2 : 0.1}
        testId="new-arrivals-section"
      >
        <div
          aria-labelledby="new-arrivals-heading"
          className="bg-white rounded-xl overflow-hidden border border-gray-100 p-6"
        >
          <header className="flex-col items-center mb-4">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-green-600 mr-2" aria-hidden="true" />
              <h2 id="new-arrivals-heading" className="text-2xl font-bold text-gray-900">
                New Arrivals
              </h2>
            </div>
            <p className="text-gray-600 mt-1 text-sm">Recently launched products</p>
          </header>
          <SuspenseWithErrorBoundary
            fallbackType="new product recommendations"
            testId="new-products-skeleton"
          >
            <NewProductsSection
              products={recommendations[RECOMMENDATION_TYPES.NEW].data}
              isLoading={recommendations[RECOMMENDATION_TYPES.NEW].isLoading}
              error={recommendations[RECOMMENDATION_TYPES.NEW].error}
            />
          </SuspenseWithErrorBoundary>
        </div>
      </SectionWrapper>

      {/* Community Picks - Only for authenticated users */}
      {isAuthenticated && (
        <SectionWrapper
          id="community-picks-section"
          delay={0.3}
          testId="community-picks-section"
        >
          <div
            aria-labelledby="community-picks-heading"
            className="bg-white rounded-xl overflow-hidden border border-gray-100"
          >
            <h2 id="community-picks-heading" className="sr-only">
              Community Picks
            </h2>
            <SuspenseWithErrorBoundary
              fallbackType="community recommendations"
              testId="community-picks-skeleton"
            >
              <CommunityPicksSection
                componentName="home"
                products={recommendations[RECOMMENDATION_TYPES.COLLABORATIVE].data}
                isLoading={recommendations[RECOMMENDATION_TYPES.COLLABORATIVE].isLoading}
                error={recommendations[RECOMMENDATION_TYPES.COLLABORATIVE].error}
                isAuthenticated={isAuthenticated}
              />
            </SuspenseWithErrorBoundary>
          </div>
        </SectionWrapper>
      )}

      {/* Hybrid Feed Section - Only for authenticated users */}
      {isAuthenticated && (
        <SectionWrapper
          id="hybrid-feed-section"
          delay={0.3}
          testId="hybrid-feed-section"
        >
          <div
            aria-labelledby="hybrid-feed-heading"
            className="bg-white rounded-xl overflow-hidden border border-gray-100"
          >
            <h2 id="hybrid-feed-heading" className="sr-only">
              Hybrid Feed
            </h2>
            <SuspenseWithErrorBoundary
              fallbackType="feed recommendations"
              testId="hybrid-feed-skeleton"
            >
              <HybridFeedSection
                componentName="home"
                products={recommendations[RECOMMENDATION_TYPES.FEED].data}
                isLoading={recommendations[RECOMMENDATION_TYPES.FEED].isLoading}
                error={recommendations[RECOMMENDATION_TYPES.FEED].error}
              />
            </SuspenseWithErrorBoundary>
          </div>
        </SectionWrapper>
      )}

      {/* Interest Based Section - Only for authenticated users */}
      {isAuthenticated && (
        <SectionWrapper
          id="interest-based-section"
          delay={0.4}
          testId="interest-based-section"
        >
          <div
            aria-labelledby="interest-based-heading"
            className="bg-white rounded-xl overflow-hidden border border-gray-100"
          >
            <h2 id="interest-based-heading" className="sr-only">
              Interest-Based Recommendations
            </h2>
            <SuspenseWithErrorBoundary
              fallbackType="interest recommendations"
              testId="interest-based-skeleton"
            >
              <InterestBasedSection
                componentName="home"
                products={recommendations[RECOMMENDATION_TYPES.INTERESTS].data}
                isLoading={recommendations[RECOMMENDATION_TYPES.INTERESTS].isLoading}
                error={recommendations[RECOMMENDATION_TYPES.INTERESTS].error}
                isAuthenticated={isAuthenticated}
              />
            </SuspenseWithErrorBoundary>
          </div>
        </SectionWrapper>
      )}

      {/* Sign Up Prompt - Only for non-authenticated users */}
      {!isAuthenticated && (
        <SectionWrapper id="signup-prompt" delay={0.3} testId="signup-prompt-section">
          <div
            aria-labelledby="signup-prompt-heading"
            className="bg-white rounded-xl overflow-hidden border border-violet-100 p-8 text-center"
          >
            <h3
              id="signup-prompt-heading"
              className="text-xl font-bold text-violet-700 mb-3"
            >
              Join Our Community
            </h3>
            <p className="text-violet-600 mb-4">
              Sign up to discover personalized recommendations and connect with other
              users.
            </p>
            <button
              className="px-6 py-2 bg-violet-700 text-white rounded-lg hover:bg-violet-800 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-opacity-50"
              onClick={() => router.push('/auth/signup')}
              aria-label="Sign up for an account"
              data-testid="signup-button"
            >
              Sign Up Now
            </button>
          </div>
        </SectionWrapper>
      )}
    </div>
  ), [isAuthenticated, recommendations, router]);

  // Memoize the sidebar content
  const sidebarContent = useMemo(() => (
    <div
      className="space-y-6 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto pb-6 lg:pb-8"
      role="complementary"
      aria-label="Sidebar content"
    >
      <SectionWrapper id="categories-section" testId="categories-section">
        <div
          aria-labelledby="categories-heading"
          className="bg-white rounded-xl overflow-hidden border border-gray-100"
        >
          <h2 id="categories-heading" className="sr-only">
            Categories
          </h2>
          <SuspenseWithErrorBoundary
            fallbackType="categories"
            testId="categories-skeleton"
            loadingHeight="h-48"
          >
            <CategoryList />
          </SuspenseWithErrorBoundary>
        </div>
      </SectionWrapper>

      <SectionWrapper id="newsletter-section" delay={0.1} testId="newsletter-section">
        <div
          aria-labelledby="newsletter-heading"
          className="bg-white rounded-xl overflow-hidden border border-gray-100"
        >
          <h2 id="newsletter-heading" className="sr-only">
            Newsletter Signup
          </h2>
          <SuspenseWithErrorBoundary
            fallbackType="newsletter signup"
            testId="newsletter-skeleton"
            loadingHeight="h-48"
          >
            <NewsletterSignup />
          </SuspenseWithErrorBoundary>
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="forum-threads-section"
        delay={0.2}
        testId="forum-threads-section"
      >
        <div
          aria-labelledby="forum-threads-heading"
          className="bg-white rounded-xl overflow-hidden border border-gray-100"
        >
          <h2 id="forum-threads-heading" className="sr-only">
            Forum Threads
          </h2>
          <SuspenseWithErrorBoundary
            fallbackType="forum threads"
            testId="forum-threads-skeleton"
            loadingHeight="h-48"
          >
            <ForumThreadsSection />
          </SuspenseWithErrorBoundary>
        </div>
      </SectionWrapper>

      <SectionWrapper id="quick-links-section" delay={0.3} testId="quick-links-section">
        <div
          aria-labelledby="quick-links-heading"
          className="bg-white rounded-xl overflow-hidden border border-gray-100"
        >
          <h2 id="quick-links-heading" className="sr-only">
            Quick Links
          </h2>
          <SuspenseWithErrorBoundary
            fallbackType="quick links" 
            testId="quick-links-skeleton"
            loadingHeight="h-36"
          >
            <QuickLinks />
          </SuspenseWithErrorBoundary>
        </div>
      </SectionWrapper>
    </div>
  ), []);

  return (
    <motion.main
      {...mainAnimationProps}
      className="bg-white"
      data-testid="home-page"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6 relative">
        {/* Hero section */}
        {heroSectionComponent}

        <BorderDivider />

        {/* Announce loading state for screen readers */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {isMainContentLoading ? 'Loading content, please wait.' : 'Content loaded.'}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {isMainContentLoading ? loadingSkeletons : (
            <>
              {/* Main Content */}
              {mainContentSections}

              {/* Sidebar */}
              {sidebarContent}
            </>
          )}
        </div>
      </div>
    </motion.main>
  );
}
