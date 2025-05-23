'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '@/lib/contexts/auth-context';
import { useSocket } from '@/lib/contexts/socket-context';
import { useToast } from '@/lib/contexts/toast-context';
import { useProduct } from '@/lib/contexts/product-context';
import LoaderComponent from 'Components/UI/LoaderComponent';
import EditProductModal from 'Components/Modal/Product/EditProductModal';
import ViewTracker from 'Components/View/ViewTracker';
import eventBus, { EVENT_TYPES } from '@/lib/utils/event-bus';

// Icons import (only import what's needed in the main file)
import {
  ArrowLeft,
  Camera,
  AlertCircle,
  MapPin,
  Brain,
  TrendingUp,
  MessageSquare,
  Rocket,
  PenTool,
  Compass,
} from 'lucide-react';

// Import components from the new structure
import ErrorBoundary from '../Components/ErrorBoundary';
import ProductHeader from '../Components/Layout/ProductHeader';
import ProductFooter from '../Components/Layout/ProductFooter';
import StorySection from '../Components/Common/StorySection';
import PrologueSection from '../Components/Sections/PrologueSection';
import VisualSection from '../Components/Sections/VisualSection';
import OriginSection from '../Components/Sections/OriginalSection';
import StatsSection from '../Components/Sections/StatsSection';
import FeaturesSection from '../Components/Sections/FeaturesSection';
import GallerySection from '../Components/Sections/GallerySection';
import MakerSection from '../Components/Sections/MakerSection';
import CommentsSection from '../Components/Sections/CommentsSection';
import RelatedSection from '../Components/Sections/RelatedSection';

// Date formatting
import { formatDistanceToNow, format } from 'date-fns';

const ProductDetailPage = ({ slug }) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { getProductBySlug, loading, error, clearError, updateProductInCache } = useProduct();
  const { showToast } = useToast();
  const { socket } = useSocket();

  const pageRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: pageRef });
  const scaleX = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // States
  const [product, setProduct] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Dynamic Counts State
  const [currentUpvoteCount, setCurrentUpvoteCount] = useState(0);
  const [currentBookmarkCount, setCurrentBookmarkCount] = useState(0);
  const [currentCommentCount, setCurrentCommentCount] = useState(0);
  const [currentViewCount, setCurrentViewCount] = useState(0);

  // The source is now a constant
  const source = 'direct';

  // Load product function (no Date.now/Math.random in render)
  const loadProduct = useCallback(
    async (bypassCache = false) => {
      if (!slug) return;

      // Only generate loadId on client
      let loadId = '';
      if (typeof window !== 'undefined') {
        loadId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      console.log(`Starting product load (${loadId}) for slug: ${slug}`);

      const loadKey = `product_load_${slug}`;
      let lastLoad = null;
      let now = null;
      if (typeof window !== 'undefined') {
        lastLoad = sessionStorage.getItem(loadKey);
        now = Date.now();
      }
      const LOAD_TTL = 60000; // 60 seconds

      if (!bypassCache && lastLoad && now - parseInt(lastLoad) < LOAD_TTL) {
        console.log(`Product ${slug} loaded recently (${loadId}), using cached data`);
        return;
      }

      console.log(`Attempting to load product story (${loadId}): ${slug}`);

      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(loadKey, now.toString());
        }
      } catch (e) {
        // Ignore storage errors
      }

      let retryCount = 0;
      const maxRetries = 2;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort('Request timeout');
      }, 10000);

      while (retryCount <= maxRetries) {
        try {
          if (retryCount > 0) {
            console.log(`Retrying story fetch (${loadId})... attempt ${retryCount}`);
          }

          const data = await getProductBySlug(slug, bypassCache, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!data || data.success === false) {
            if (data?.error?.includes('not found') || data?.status === 404) {
              console.warn(`Product story not found (${loadId}): ${slug}`);
              setProduct(null);
              setLocalError('Product not found');
              setIsLoaded(true);
              return;
            }
            throw new Error(data?.error || 'API returned unsuccessful status.');
          }

          console.log(`Product story data received (${loadId})`);

          if (!data._id || !data.slug) {
            console.error(`Invalid product data received (${loadId}):`, data);
            throw new Error('Invalid product data received');
          }

          setProduct(data);
          setCurrentUpvoteCount(data.upvoteCount ?? data.upvotes?.count ?? 0);
          setCurrentBookmarkCount(data.bookmarkCount ?? data.bookmarks?.count ?? 0);
          setCurrentCommentCount(data.commentCount ?? data.comments?.count ?? 0);
          setCurrentViewCount(data.viewCount ?? data.views?.count ?? 0);
          setLocalError(null);
          setIsLoaded(true);

          break; // Success!
        } catch (err) {
          clearTimeout(timeoutId);

          console.error(
            `Error loading product story (${loadId}) (Attempt ${retryCount + 1}/$${
              maxRetries + 1
            }):`,
            err
          );
          retryCount++;

          if (err.name === 'AbortError') {
            console.warn(`Request timed out (${loadId})`);
            setLocalError('Request timed out. Please try again.');
            setProduct(null);
            setIsLoaded(true);

            showToast(
              'error',
              'Loading took too long. Please check your connection and try again.',
              5000
            );
            break;
          } else if (err.response?.status === 429 && retryCount <= maxRetries) {
            // Only use Math.random in client
            let baseDelay = Math.min(Math.pow(2, retryCount) * 1000, 8000);
            let jitter = 0;
            if (typeof window !== 'undefined') {
              jitter = Math.random() * 1000;
            }
            const delay = baseDelay + jitter;

            console.warn(`Rate limited. Retrying story fetch in ${Math.round(delay / 1000)}s`);

            if (retryCount === 1) {
              showToast('warning', 'Easy there! Fetching again shortly...', 3000);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
          } else if (retryCount > maxRetries) {
            console.error(`Max retries reached. Failed to load product story (${loadId}).`);
            setLocalError(err.message || 'Failed to load after multiple attempts');
            setProduct(null);
            setIsLoaded(true);

            showToast('error', "Crikey! Couldn't fetch the story. Try again later?", 5000);
            break;
          } else {
            const delay = 1500 * retryCount;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    },
    [slug, getProductBySlug, showToast]
  );

  // Initial load effect
  useEffect(() => {
    loadProduct();
    return () => clearError();
  }, [slug, loadProduct, clearError]);

  // Socket update effect
  useEffect(() => {
    if (!product?._id || !socket) {
      return;
    }

    if (!socket.connected) {
      console.log('Socket not connected, skipping event setup');
      return;
    }

    const subscriptionId = `sub-${product._id}-${Date.now()}`;

    socket.emit('subscribe:product', product._id);
    console.log(`SOCKET (${subscriptionId}): Subscribed to product ${product._id}`);

    const handleProductUpdate = updatedData => {
      if (!updatedData) return;

      console.log(`SOCKET (${subscriptionId}): Received update for ${product.name}`, updatedData);

      let changesDetected = false;
      const updatedFields = {};
      const countUpdates = {};

      if (updatedData.upvoteCount !== undefined && updatedData.upvoteCount !== currentUpvoteCount) {
        countUpdates.upvoteCount = updatedData.upvoteCount;
        changesDetected = true;
      }

      if (
        updatedData.bookmarkCount !== undefined &&
        updatedData.bookmarkCount !== currentBookmarkCount
      ) {
        countUpdates.bookmarkCount = updatedData.bookmarkCount;
        changesDetected = true;
      }

      if (
        updatedData.commentCount !== undefined &&
        updatedData.commentCount !== currentCommentCount
      ) {
        countUpdates.commentCount = Math.max(0, updatedData.commentCount);
        changesDetected = true;
      }

      if (updatedData.viewCount !== undefined && updatedData.viewCount !== currentViewCount) {
        countUpdates.viewCount = updatedData.viewCount;
      }

      if (updatedData.featured !== undefined && updatedData.featured !== product.featured) {
        updatedFields.featured = updatedData.featured;
        changesDetected = true;
      }

      if (updatedData.name !== undefined && updatedData.name !== product.name) {
        updatedFields.name = updatedData.name;
        changesDetected = true;
      }

      if (countUpdates.upvoteCount !== undefined) {
        setCurrentUpvoteCount(countUpdates.upvoteCount);
      }

      if (countUpdates.bookmarkCount !== undefined) {
        setCurrentBookmarkCount(countUpdates.bookmarkCount);
      }

      if (countUpdates.commentCount !== undefined) {
        setCurrentCommentCount(countUpdates.commentCount);
      }

      if (countUpdates.viewCount !== undefined) {
        setCurrentViewCount(countUpdates.viewCount);
      }

      // Apply changes to the product object if any direct fields were updated
      if (Object.keys(updatedFields).length > 0) {
        setProduct(prev => (prev ? { ...prev, ...updatedFields } : null));
      }

      if (changesDetected) {
        console.log(`SOCKET (${subscriptionId}): State updated for ${product.name}`);
      }
    };

    // Handle upvote events specifically
    const handleUpvoteEvent = data => {
      // Check if this event is for our product
      if (data.productId !== product._id) return;

      console.log(`SOCKET (${subscriptionId}): Received upvote event for ${product.name}`, data);

      if (data.count !== undefined && data.count !== currentUpvoteCount) {
        console.log(
          `SOCKET (${subscriptionId}): Updating upvote count from ${currentUpvoteCount} to ${data.count}`
        );
        setCurrentUpvoteCount(data.count);
      }
    };

    // Handle bookmark events specifically
    const handleBookmarkEvent = data => {
      // Check if this event is for our product
      if (data.productId !== product._id) return;

      console.log(`SOCKET (${subscriptionId}): Received bookmark event for ${product.name}`, data);

      if (data.count !== undefined && data.count !== currentBookmarkCount) {
        console.log(
          `SOCKET (${subscriptionId}): Updating bookmark count from ${currentBookmarkCount} to ${data.count}`
        );
        setCurrentBookmarkCount(data.count);
      }
    };

    // Handle view events specifically
    const handleViewEvent = data => {
      // Check if this event is for our product
      if (data.productId !== product._id) return;

      console.log(`SOCKET (${subscriptionId}): Received view event for ${product.name}`, data);

      if (data.count !== undefined && data.count !== currentViewCount) {
        console.log(
          `SOCKET (${subscriptionId}): Updating view count from ${currentViewCount} to ${data.count}`
        );
        setCurrentViewCount(data.count);
      }
    };

    // Also listen for EventBus events
    const handleEventBusUpvote = data => {
      // Check if this event is for our product
      if (
        (data.productId && data.productId === product._id) ||
        (data.slug && data.slug === product.slug)
      ) {
        console.log(`EventBus: Received upvote event for ${product.name}`, data);

        if (data.count !== undefined && data.count !== currentUpvoteCount) {
          console.log(
            `EventBus: Updating upvote count from ${currentUpvoteCount} to ${data.count}`
          );
          setCurrentUpvoteCount(data.count);
        }
      }
    };

    const handleEventBusBookmark = data => {
      // Check if this event is for our product
      if (
        (data.productId && data.productId === product._id) ||
        (data.slug && data.slug === product.slug)
      ) {
        console.log(`EventBus: Received bookmark event for ${product.name}`, data);

        if (data.count !== undefined && data.count !== currentBookmarkCount) {
          console.log(
            `EventBus: Updating bookmark count from ${currentBookmarkCount} to ${data.count}`
          );
          setCurrentBookmarkCount(data.count);
        }
      }
    };

    const handleEventBusProductUpdate = data => {
      // Check if this event is for our product
      if (
        (data.productId && data.productId === product._id) ||
        (data.slug && data.slug === product.slug)
      ) {
        console.log(`EventBus: Received product update for ${product.name}`, data);

        if (data.updates) {
          const updates = data.updates;

          if (updates.upvoteCount !== undefined && updates.upvoteCount !== currentUpvoteCount) {
            console.log(
              `EventBus: Updating upvote count from ${currentUpvoteCount} to ${updates.upvoteCount}`
            );
            setCurrentUpvoteCount(updates.upvoteCount);
          }

          if (
            updates.bookmarkCount !== undefined &&
            updates.bookmarkCount !== currentBookmarkCount
          ) {
            console.log(
              `EventBus: Updating bookmark count from ${currentBookmarkCount} to ${updates.bookmarkCount}`
            );
            setCurrentBookmarkCount(updates.bookmarkCount);
          }

          if (updates.viewCount !== undefined && updates.viewCount !== currentViewCount) {
            console.log(
              `EventBus: Updating view count from ${currentViewCount} to ${updates.viewCount}`
            );
            setCurrentViewCount(updates.viewCount);
          }
        }
      }
    };

    // Attach all event listeners
    socket.on('product:*:update', handleProductUpdate);
    socket.on('product:upvote', handleUpvoteEvent);
    socket.on('product:bookmark', handleBookmarkEvent);
    socket.on('product:view:update', handleViewEvent);

    // Subscribe to EventBus events
    const unsubscribeUpvote = eventBus.subscribe(EVENT_TYPES.UPVOTE_UPDATED, handleEventBusUpvote);
    const unsubscribeBookmark = eventBus.subscribe(
      EVENT_TYPES.BOOKMARK_UPDATED,
      handleEventBusBookmark
    );
    const unsubscribeProduct = eventBus.subscribe(
      EVENT_TYPES.PRODUCT_UPDATED,
      handleEventBusProductUpdate
    );

    // Clean up listeners
    return () => {
      console.log(`SOCKET (${subscriptionId}): Cleaning up listeners for ${product._id}`);

      // Unsubscribe from the product
      socket.emit('unsubscribe:product', product._id);

      // Remove socket event listeners
      socket.off('product:*:update', handleProductUpdate);
      socket.off('product:upvote', handleUpvoteEvent);
      socket.off('product:bookmark', handleBookmarkEvent);
      socket.off('product:view:update', handleViewEvent);

      // Unsubscribe from EventBus events
      unsubscribeUpvote();
      unsubscribeBookmark();
      unsubscribeProduct();
    };
  }, [
    product?._id,
    product?.slug,
    socket,
    socket?.connected,
    currentUpvoteCount,
    currentBookmarkCount,
    currentViewCount,
  ]);

  // --- Event Handlers ---
  const handleBackClick = useCallback(() => router.back(), [router]);

  const handleEditSuccess = useCallback(
    updatedProductData => {
      setEditModalOpen(false);
      if (updatedProductData) {
        // Update primary state
        setProduct(prev => ({ ...prev, ...updatedProductData }));
        // Ensure counts are also synced if provided
        if (updatedProductData.upvoteCount !== undefined)
          setCurrentUpvoteCount(updatedProductData.upvoteCount);
        if (updatedProductData.bookmarkCount !== undefined)
          setCurrentBookmarkCount(updatedProductData.bookmarkCount);
        if (updatedProductData.commentCount !== undefined)
          setCurrentCommentCount(updatedProductData.commentCount);
        if (updatedProductData.views?.count !== undefined)
          setCurrentViewCount(updatedProductData.views.count);

        updateProductInCache(slug, updatedProductData);
        showToast('success', `"${updatedProductData.name || 'Story'}" updated!`, 3000);
      }
    },
    [slug, updateProductInCache, showToast]
  );

  // --- Derived Data ---
  const [formattedDate, setFormattedDate] = useState('');
  const [launchedDateFormatted, setLaunchedDateFormatted] = useState(null);

  useEffect(() => {
    if (product?.createdAt) {
      setFormattedDate(formatDistanceToNow(new Date(product.createdAt), { addSuffix: true }));
    } else {
      setFormattedDate('in the mists of time');
    }
    if (product?.launchedAt) {
      setLaunchedDateFormatted(format(new Date(product.launchedAt), 'MMMM do, yyyy'));
    } else {
      setLaunchedDateFormatted(null);
    }
  }, [product?.createdAt, product?.launchedAt]);

  const isOwner = isAuthenticated && user && product && user._id === product.maker?._id;

  const getThumbnailUrl = useCallback(() => {
    if (!product) return '/images/placeholder-story-loading.png';
    const sources = [
      product.thumbnail?.url,
      typeof product.thumbnail === 'string' ? product.thumbnail : null,
      product.gallery?.[0]?.url,
      typeof product.gallery?.[0] === 'string' ? product.gallery[0] : null,
    ];
    const validSource = sources.find(s => s && typeof s === 'string' && s.trim() !== '');
    return validSource || '/images/placeholder-story-default.png';
  }, [product]);

  const thumbnailUrl = getThumbnailUrl();
  const makerName = product?.maker?.firstName
    ? `${product.maker.firstName} ${product.maker.lastName || ''}`.trim()
    : product?.makerProfile?.name || 'A Mysterious & Brilliant Maker';

  // --- Render Logic: Loading, Error, Not Found States ---
  if (!isLoaded && loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-white to-violet-50/50 p-4">
        <LoaderComponent message="Unfurling the scroll..." />
        <p className="text-sm text-violet-500 mt-2">Brewing coffee, gathering notes...</p>
        <div className="mt-8 w-full max-w-sm bg-violet-100/70 h-2.5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
          />
        </div>
      </div>
    );
  }

  if ((error || localError) && !product && isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50/80 via-violet-50/30 to-white p-6">
        <motion.div
          className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-lg text-center border border-violet-100/50"
          initial={{ opacity: 0, scale: 0.9, rotate: 1 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <div className="text-violet-500 mb-5 flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2,
                type: 'spring',
                stiffness: 180,
                damping: 10,
              }}
            >
              <AlertCircle className="w-16 h-16 animate-pulse" />
            </motion.div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Plot Twist: Glitch Encountered!
          </h1>
          <p className="text-gray-600 mb-6">
            Ach! Our storytellers hit a bump trying to retrieve this tale. Might be a cosmic ray, or
            maybe just a server hiccup.
            <span className="text-xs text-violet-500 block mt-2 font-mono">
              (Whispered error:{' '}
              {typeof (error || localError) === 'string' ? error || localError : 'Unknown Error'})
            </span>
          </p>
          <div className="flex justify-center gap-4">
            <motion.button
              onClick={handleBackClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors shadow-sm"
            >
              Retreat! (Go Back)
            </motion.button>
            <motion.button
              onClick={() => loadProduct(true)} // Force refresh
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors shadow-md"
            >
              Retry Quest!
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!product && !loading && isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-violet-50/30 to-violet-50/20 p-6">
        <motion.div
          className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-lg text-center border border-violet-100"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          <div className="text-violet-500 mb-5 flex justify-center">
            <motion.div
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <MapPin className="w-16 h-16" />
            </motion.div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Lost Page in the Archives!
          </h1>
          <p className="text-gray-600 mb-8">
            Our librarians searched high and low, but the manuscript for this product seems to have
            wandered off. Did it achieve sentience? Or is the link simply... dusty?
          </p>
          <motion.button
            onClick={handleBackClick}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 5px 15px rgba(124, 58, 237, 0.3)',
            }}
            whileTap={{ scale: 0.95 }}
            className="px-7 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors shadow-md"
          >
            Explore Other Isles
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!product) return <div className="min-h-screen bg-violet-50/20"></div>;

  // --- Render Main Content ---
  return (
    <div
      className="bg-white min-h-screen overflow-x-hidden"
      ref={pageRef}
      suppressHydrationWarning
    >
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-violet-600 to-violet-500 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Edit Modal */}
      {isOwner && (
        <EditProductModal isOpen={editModalOpen} onClose={handleEditSuccess} product={product} />
      )}

      {/* View Tracker - Enhanced with better props and error handling */}
      {product?._id && (
        <ErrorBoundary fallback={<div className="hidden">View tracking failed</div>}>
          <ViewTracker
            productId={product._id}
            source={source}
            minimumViewTime={3000}
            visibilityThreshold={0.6}
            elementSelector="#product-content"
          />
        </ErrorBoundary>
      )}

      {/* Main Content */}
      <div
        id="product-content"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10"
        suppressHydrationWarning
      >
        {/* Header Navigation & Controls */}
        <ProductHeader
          onBackClick={handleBackClick}
          isOwner={isOwner}
          onEditClick={() => setEditModalOpen(true)}
        />

        {/* Main Article */}
        <motion.article initial="hidden" animate="visible" className="max-w-3xl mx-auto">
          {/* === PROLOGUE / HEADER === */}
          <PrologueSection product={product} />

          {/* === CHAPTER 1: VISUAL & CORE ACTIONS === */}
          <StorySection
            title="First Impressions"
            icon={Camera}
            delay={0.1}
            chapterNumber={1}
            id="reveal"
          >
            <VisualSection product={product} thumbnailUrl={thumbnailUrl} isOwner={isOwner} />
          </StorySection>

          {/* === CHAPTER 2: ORIGIN STORY === */}
          <StorySection
            title="Genesis: The Big Idea"
            icon={Brain}
            delay={0.1}
            chapterNumber={2}
            id="origin-story"
          >
            <OriginSection
              product={product}
              formattedDate={formattedDate}
              makerName={makerName}
              launchedDateFormatted={launchedDateFormatted}
            />
          </StorySection>

          {/* === CHAPTER 3: STATS === */}
          <StorySection
            title="Community Chatter"
            icon={TrendingUp}
            delay={0.1}
            chapterNumber={3}
            id="community-buzz"
          >
            <StatsSection
              product={product}
              displayViewCount={currentViewCount}
              displayUpvoteCount={currentUpvoteCount}
              displayBookmarkCount={currentBookmarkCount}
              displayCommentCount={currentCommentCount}
            />
          </StorySection>

          {/* === CHAPTER 4: FEATURES/TAGS === */}
          {(product.tags && product.tags.length > 0) || product.features?.length > 0 ? (
            <StorySection
              title="Secret Sauce & Special Powers"
              icon={Rocket}
              delay={0.1}
              chapterNumber={4}
              id="features"
            >
              <FeaturesSection product={product} />
            </StorySection>
          ) : null}

          {/* === CHAPTER 5: GALLERY === */}
          <StorySection
            title={
              product.gallery && product.gallery.length > 0
                ? 'A Gallery of Wonders'
                : 'Visuals Pending...'
            }
            icon={Camera}
            delay={0.1}
            chapterNumber={5}
            id={product.gallery && product.gallery.length > 0 ? 'gallery' : 'gallery-missing'}
          >
            <GallerySection
              product={product}
              isOwner={isOwner}
              onEditModalOpen={() => setEditModalOpen(true)}
            />
          </StorySection>

          {/* === CHAPTER 6: MAKER === */}
          {product.maker && (
            <StorySection
              title="The Mastermind"
              icon={PenTool}
              delay={0.1}
              chapterNumber={6}
              id="maker"
            >
              <MakerSection product={product} makerName={makerName} />
            </StorySection>
          )}

          {/* === CHAPTER 7: COMMENTS === */}
          <StorySection
            title="Your Turn to Speak!"
            icon={MessageSquare}
            delay={0.1}
            chapterNumber={7}
            id="comments"
          >
            <CommentsSection
              product={product}
              isAuthenticated={isAuthenticated}
              onCommentCountChange={setCurrentCommentCount}
            />
          </StorySection>

          {/* === CHAPTER 8: RELATED PRODUCTS === */}
          {product?._id && (
            <StorySection
              title="Where To Next, Explorer?"
              icon={Compass}
              delay={0.1}
              chapterNumber={8}
              id="similar"
            >
              <RelatedSection product={product} router={router} />
            </StorySection>
          )}

          {/* Footer with share button and final CTA */}
          <ProductFooter product={product} showToast={showToast} />
        </motion.article>
      </div>
    </div>
  );
};

export default ProductDetailPage;
