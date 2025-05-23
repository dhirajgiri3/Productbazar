// src/components/profile/ProfileContent.jsx
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import OverviewTab from './OverviewTab';
import ProductsTab from './ProductsTab';
import ActivityTab from './ActivityTab';
import UpvotesTab from './UpvotesTab';

// Lazy load modals
const EditProfileModal = dynamic(() => import('../../../../../Components/Modal/EditProfileModal/EditProfileModal'), { ssr: false });
const ProfileCompletionPrompt = dynamic(() => import('../../../../../Components/Modal/ProfileCompletionPrompt/ProfileCompletionPrompt'), { ssr: false });

export default function ProfileContent({
  activeTab,
  user,
  products,
  interactionCounts,
  isOwnProfile,
  isEditModalOpen,
  setIsEditModalOpen,
  isProfileCompletionModalOpen,
  setIsProfileCompletionModalOpen,
  productsLoading,
  currentPage,
  totalPages,
  activeProductFilter,
  statusCounts,
  onPageChange,
  onFilterChange,
  onProductUpdated,
}) {
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 pb-16">
        <AnimatePresence mode="wait">
          {activeTab === 'Overview' && (
            <motion.div
              key="Overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border border-gray-100 p-6"
            >
              <OverviewTab user={user} products={products} />
            </motion.div>
          )}
          {activeTab === 'Products' && (
            <motion.div
              key="Products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border border-gray-100 p-6"
            >
              <ProductsTab
                products={products}
                isLoading={productsLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                activeFilter={activeProductFilter}
                statusCounts={statusCounts}
                onPageChange={onPageChange}
                onFilterChange={onFilterChange}
                onProductUpdated={onProductUpdated}
                userId={user._id}
                isOwner={isOwnProfile}
              />
            </motion.div>
          )}
          {activeTab === 'Upvotes' && (
            <motion.div
              key="Upvotes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border border-gray-100 p-6"
            >
              <UpvotesTab upvotes={interactionCounts.upvotes} />
            </motion.div>
          )}
          {activeTab === 'Activity' && (
            <motion.div
              key="Activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border border-gray-100 p-6"
            >
              <ActivityTab activity={user.activity || []} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isEditModalOpen && (
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
          />
        )}
        {isProfileCompletionModalOpen && (
          <ProfileCompletionPrompt
            isOpen={isProfileCompletionModalOpen}
            onClose={() => setIsProfileCompletionModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}