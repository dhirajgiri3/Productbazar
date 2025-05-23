// src/components/ProfileTabs/ProductsTab.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiPackage,
  FiPlus,
  FiLayers,
  FiCheckCircle,
  FiEdit,
  FiArchive,
  FiBarChart2,
} from "react-icons/fi";
import { useAuth } from "@/lib/contexts/auth-context";
import EditProductModal from "../../../../../Components/Modal/Product/EditProductModal";
import DeleteConfirmModal from "../../../../../Components/Modal/Product/DeleteConfirmModal";
import ProfileProductCard from "../../../../../Components/Product/ProfileProductCard";
import Pagination from "Components/common/Pagination";
import Tabs from "../../../../../Components/common/Tabs";
import LoaderComponent from "../../../../../Components/UI/LoaderComponent";

export default function ProductsTab({
  products = [],
  isLoading,
  currentPage = 1,
  totalPages = 1,
  activeFilter = "all",
  statusCounts = { all: 0, published: 0, draft: 0, archived: 0 },
  onPageChange,
  onFilterChange,
  onProductUpdated,
  userId,
  isOwner = false,
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { user } = useAuth();
  const router = useRouter();
  const currentUserIsOwner = isOwner || (user && userId && user._id === userId);

  const handleModalClose = useCallback(
    (result = null) => {
      setIsEditModalOpen(false);
      setIsDeleteModalOpen(false);

      const productBeingProcessed = selectedProduct;
      setSelectedProduct(null);

      if (result && typeof result === "object" && onProductUpdated) {
        console.log(
          `ProductsTab: Handling ${
            isDeleteModalOpen ? "deletion" : "update"
          } of product: ${result.slug || result._id}`
        );
        onProductUpdated();
      } else if (
        isDeleteModalOpen &&
        productBeingProcessed &&
        onProductUpdated
      ) {
        console.log(
          `ProductsTab: Handling potential deletion of product: ${
            productBeingProcessed.slug || productBeingProcessed._id
          }`
        );
        onProductUpdated();
      }
    },
    [onProductUpdated, isDeleteModalOpen, selectedProduct]
  );

  const handleEditProduct = useCallback((product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  }, []);

  const handleAddClick = useCallback(() => {
    router.push("/product/new");
  }, [router]);

  const safeCount = (count) => (Number.isFinite(count) ? count : 0);
  const tabConfig = [
    {
      id: "all",
      label: "All",
      count: safeCount(statusCounts.all),
      icon: FiLayers,
    },
    {
      id: "published",
      label: "Published",
      count: safeCount(statusCounts.published),
      icon: FiCheckCircle,
    },
    {
      id: "draft",
      label: "Drafts",
      count: safeCount(statusCounts.draft),
      icon: FiEdit,
    },
    {
      id: "archived",
      label: "Archived",
      count: safeCount(statusCounts.archived),
      icon: FiArchive,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  if (isLoading && !products.length) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoaderComponent message="Loading products..." />
      </div>
    );
  }

  if (!isLoading && statusCounts.all === 0) {
    return (
      <>
        <motion.div
          className="bg-gradient-to-br from-violet-50/50 via-white to-indigo-50/50 rounded-xl p-8 shadow-sm border border-gray-100 overflow-hidden relative text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-violet-100/50 rounded-full opacity-50 blur-lg"></div>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-100/50 rounded-full opacity-50 blur-lg"></div>

          <motion.div
            className="relative z-10 flex flex-col items-center py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="mb-6 relative w-20 h-20 bg-white rounded-full flex items-center justify-center border border-violet-100 shadow-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 180 }}
            >
              <FiPackage className="w-10 h-10 text-violet-400" />
              {currentUserIsOwner && (
                <motion.button
                  className="absolute -right-1 -bottom-1 w-8 h-8 bg-violet-500 rounded-full p-2 shadow-md border border-white text-white cursor-pointer flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 400 }}
                  whileHover={{ scale: 1.1, backgroundColor: "#7c3aed" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddClick}
                  aria-label="Add Product"
                >
                  <FiPlus className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>

            <motion.h3
              className="text-xl font-medium text-gray-800 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {currentUserIsOwner
                ? "Showcase Your Creation"
                : "No Products Yet"}
            </motion.h3>

            <motion.p
              className="text-gray-500 text-sm max-w-md mx-auto mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {currentUserIsOwner
                ? "Add your first product to share it with the community and gather feedback."
                : "This user hasn't added any products yet. Check back later!"}
            </motion.p>

            {currentUserIsOwner && (
              <motion.button
                onClick={handleAddClick}
                className="px-5 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <FiPlus className="w-4 h-4" />
                Add Your First Product
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Products</h2>
          {currentUserIsOwner && (
            <div className="flex items-center gap-3">
              <motion.a
                href="/product/viewanalytics/dashboard"
                className="px-4 py-1.5 bg-violet-100 text-violet-700 text-sm font-medium rounded-lg hover:bg-violet-200 transition-colors flex items-center gap-1.5 border border-violet-200"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiBarChart2 className="w-4 h-4" />
                View Analytics
              </motion.a>
              <motion.button
                onClick={handleAddClick}
                className="px-4 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-1.5"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlus className="w-4 h-4" />
                Add Product
              </motion.button>
            </div>
          )}
        </div>

        {/* Filter Tabs for Owner */}
        {currentUserIsOwner && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Tabs
              tabs={tabConfig}
              activeTab={activeFilter}
              onChange={(id) => onFilterChange(id)}
              variant="modern"
              size="md"
              fullWidth={false}
            />
          </motion.div>
        )}

        {/* Loading Indicator when filtering/paginating */}
        {isLoading && products.length > 0 && (
          <div className="flex justify-center py-8">
            <LoaderComponent message="Updating products..." />
          </div>
        )}

        {/* Product Grid - Changed to 2 columns on all screen sizes */}
        <AnimatePresence mode="wait">
          {!isLoading && products.length > 0 && (
            <motion.div
              key="product-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid gap-6 grid-cols-1 sm:grid-cols-2"
            >
              {products.map((product) =>
                product && product._id ? (
                  <ProfileProductCard
                    key={product._id}
                    product={product}
                    onEdit={currentUserIsOwner ? handleEditProduct : undefined}
                    onDelete={
                      currentUserIsOwner ? handleDeleteClick : undefined
                    }
                    isOwner={currentUserIsOwner}
                    className="w-full"
                  />
                ) : null
              )}
            </motion.div>
          )}

          {!isLoading && products.length === 0 && statusCounts.all > 0 && (
            <motion.div
              key="filtered-empty"
              className="py-12 text-center bg-gray-50/70 rounded-lg border border-dashed border-gray-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-violet-100"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
              >
                <FiPackage className="w-8 h-8 text-violet-300" />
              </motion.div>

              <motion.h3
                className="text-lg font-medium text-gray-700 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                No {activeFilter !== "all" ? activeFilter : ""} products found
              </motion.h3>

              <motion.p
                className="text-gray-500 text-sm max-w-xs mx-auto mb-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Try adjusting the filter or adding new products if this is your
                profile.
              </motion.p>

              {activeFilter !== "all" && currentUserIsOwner && (
                <motion.button
                  onClick={() => onFilterChange("all")}
                  className="px-4 py-1.5 bg-white text-violet-600 text-xs font-medium rounded-md border border-violet-200 hover:bg-violet-50/50 transition-colors shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Show All Products
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            className="mt-8"
          />
        )}
      </motion.div>

      {/* Modals */}
      {currentUserIsOwner && (
        <>
          <AnimatePresence>
            {selectedProduct && isEditModalOpen && (
              <EditProductModal
                isOpen={isEditModalOpen}
                onClose={handleModalClose}
                product={selectedProduct}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {selectedProduct && isDeleteModalOpen && (
              <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={handleModalClose}
                product={selectedProduct}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}
