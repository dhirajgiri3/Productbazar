// src/components/profile/ProfilePage.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from "@/lib/contexts/auth-context";
import { useSearchParams } from 'next/navigation';
import LoaderComponent from '../../../../../Components/UI/LoaderComponent';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import ProfileTabs from './ProfileTabs';
import ProfileContent from './ProfileContent';
import { pageVariants } from '@/lib/utils/ui/animations';
import logger from '@/lib/utils/logger';
import eventBus, { EVENT_TYPES } from '@/lib/utils/event-bus';
import api from '@/lib/api/api';

export default function ProfilePage({ initialUser, initialProducts, initialInteractionCounts, initialStatusCounts, initialTotalPages }) {
  const { user: currentUser, authLoading } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileCompletionModalOpen, setIsProfileCompletionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(tabParam || 'Overview');
  const [products, setProducts] = useState(initialProducts);
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [activeProductFilter, setActiveProductFilter] = useState('all');
  const [statusCounts, setStatusCounts] = useState(initialStatusCounts);
  const [interactionCounts, setInteractionCounts] = useState(initialInteractionCounts);
  const productsPerPage = 6;

  const isOwnProfile = currentUser?._id === initialUser?._id;

  // Fetch user products with pagination and filters
  const fetchUserProducts = useCallback(
    async (page = 1, filter = 'all') => {
      try {
        if (initialUser?._id) {
          setProductsLoading(true);
          const response = await api.get(`/products/user/${initialUser._id}`, {
            params: {
              page,
              limit: productsPerPage,
              filter,
              bypassCache: true,
            }
          });

          if (response.data?.success) {
            setProducts(response.data.data);
            setStatusCounts({
              all: response.data.meta?.totalProducts || 0,
              published: response.data.meta?.publishedProducts || 0,
              draft: response.data.meta?.draftProducts || 0,
              archived: response.data.meta?.archivedProducts || 0,
            });
            setTotalPages(response.data.meta?.totalPages || 1);
            logger.info(`Fetched ${response.data.data.length} products for user ${initialUser._id}`);
          } else {
            setProducts([]);
            setStatusCounts({ all: 0, published: 0, draft: 0, archived: 0 });
            setTotalPages(1);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch user products:', error);
        setProducts([]);
        setStatusCounts({ all: 0, published: 0, draft: 0, archived: 0 });
        setTotalPages(1);
      } finally {
        setProductsLoading(false);
      }
    },
    [initialUser?._id, productsPerPage]
  );

  // Handle page change
  const handleProductPageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      fetchUserProducts(page, activeProductFilter);
    },
    [fetchUserProducts, activeProductFilter]
  );

  // Handle filter change
  const handleProductFilterChange = useCallback(
    (filter) => {
      setActiveProductFilter(filter);
      setCurrentPage(1);
      fetchUserProducts(1, filter);
    },
    [fetchUserProducts]
  );

  // Refresh products on tab change
  useEffect(() => {
    if (activeTab === 'Products' && initialUser?._id) {
      fetchUserProducts(currentPage, activeProductFilter);
    }
  }, [activeTab, initialUser?._id, currentPage, activeProductFilter, fetchUserProducts]);

  // Handle product events
  useEffect(() => {
    if (!initialUser?._id) return;

    const handleProductDeleted = (data) => {
      setProducts((prev) => {
        const updatedProducts = prev.filter((p) => p.slug !== data.slug && p._id !== data.productId);
        setStatusCounts({
          all: updatedProducts.length,
          published: updatedProducts.filter((p) => p.status === 'Published').length,
          draft: updatedProducts.filter((p) => p.status === 'Draft').length,
          archived: updatedProducts.filter((p) => p.status === 'Archived').length,
        });
        return updatedProducts;
      });
      setTimeout(() => fetchUserProducts(currentPage, activeProductFilter), 500);
    };

    const handleProductUpdated = (data) => {
      setProducts((prev) => {
        const updatedProducts = prev.map((p) =>
          p.slug === data.oldSlug || p.slug === data.newSlug || p._id === data.productId
            ? { ...p, ...data.product, slug: data.newSlug || data.slug || p.slug, _id: data.productId || p._id, updatedAt: new Date().toISOString() }
            : p
        );
        setStatusCounts({
          all: updatedProducts.length,
          published: updatedProducts.filter((p) => p.status === 'Published').length,
          draft: updatedProducts.filter((p) => p.status === 'Draft').length,
          archived: updatedProducts.filter((p) => p.status === 'Archived').length,
        });
        return updatedProducts;
      });
      setTimeout(() => fetchUserProducts(currentPage, activeProductFilter), 500);
    };

    const unsubscribeDelete = eventBus.subscribe(EVENT_TYPES.PRODUCT_DELETED, handleProductDeleted);
    const unsubscribeUpdate = eventBus.subscribe(EVENT_TYPES.PRODUCT_UPDATED, handleProductUpdated);

    return () => {
      unsubscribeDelete();
      unsubscribeUpdate();
    };
  }, [initialUser?._id, fetchUserProducts, currentPage, activeProductFilter]);

  // Show profile completion modal for own profile
  useEffect(() => {
    if (isOwnProfile && currentUser && !currentUser.isProfileCompleted) {
      const timer = setTimeout(() => {
        setIsProfileCompletionModalOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOwnProfile, currentUser]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <LoaderComponent text="Loading profile..." />
      </div>
    );
  }

  if (!initialUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl p-8 max-w-md w-full border border-gray-100 text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-6 bg-amber-50 rounded-full flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-medium text-gray-900 mb-3"
          >
            User Not Found
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 text-sm mb-6 max-w-sm mx-auto"
          >
            The user you&apos;re looking for doesn&apos;t exist or has been removed.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.03, backgroundColor: '#7c3aed' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/'}
              className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go Home
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, backgroundColor: '#f9fafb' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.history.back()}
              className="px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm"
            >
              Go Back
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <ProfileHeader user={initialUser} isOwnProfile={isOwnProfile} onEdit={() => setIsEditModalOpen(true)} />
      <ProfileStats
        productsCount={products.length}
        bookmarks={interactionCounts.bookmarks}
        upvotes={interactionCounts.upvotes}
        activities={initialUser.activity?.length || 0}
      />
      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <ProfileContent
        activeTab={activeTab}
        user={initialUser}
        products={products}
        interactionCounts={interactionCounts}
        isOwnProfile={isOwnProfile}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        isProfileCompletionModalOpen={isProfileCompletionModalOpen}
        setIsProfileCompletionModalOpen={setIsProfileCompletionModalOpen}
        productsLoading={productsLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        activeProductFilter={activeProductFilter}
        statusCounts={statusCounts}
        onPageChange={handleProductPageChange}
        onFilterChange={handleProductFilterChange}
        onProductUpdated={() => fetchUserProducts(currentPage, activeProductFilter)}
      />
    </motion.div>
  );
}