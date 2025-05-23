// src/components/DeleteConfirmModal.jsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useProduct } from "@/lib/contexts/product-context";
import logger from "@/lib/utils/logger";
import { FiAlertTriangle } from "react-icons/fi";

export default function DeleteConfirmModal({ isOpen, onClose, product }) {
  const { deleteProduct, loading } = useProduct();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isLoading = loading.deleteProduct || false;

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!product?.slug) {
      toast.error("Invalid product data");
      return;
    }

    if (
      confirmText.trim().toLowerCase() !== product.name.trim().toLowerCase()
    ) {
      toast.error(
        "Please enter the product name correctly to confirm deletion"
      );
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteProduct(product.slug);
      if (result) {
        toast.success("Product deleted successfully!");
        // Pass the deleted product to the parent component for immediate UI update
        onClose(product); // Pass the deleted product to parent
      }
    } catch (err) {
      // Special handling for 404 errors - the product is already deleted
      if (err.response && err.response.status === 404) {
        logger.warn(`Product ${product.slug} not found (404). It may have been already deleted.`);
        toast.info("This product has already been deleted.");
        // Still pass the product to the parent to ensure it's removed from the UI
        onClose(product);
      } else {
        logger.error("Error deleting product:", err);
        toast.error(err.message || "Failed to delete product. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setConfirmText("");
    setIsDeleting(false);
    onClose(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full fixed inset-0 bg-black/40 backdrop-blur-[10px] flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-xl w-full max-w-md shadow-lg fixed top-[5rem]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <FiAlertTriangle className="text-red-600 w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Delete "{product?.name}"
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{product?.name}</strong>
                ? This action is permanent and cannot be undone.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-700">
                  This will remove the product, its images, comments, and
                  upvotes from the system.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <strong>{product?.name}</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`Enter "${product?.name}"`}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-between">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={
                  isLoading ||
                  confirmText.trim().toLowerCase() !==
                    product?.name?.trim().toLowerCase()
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                type="button"
              >
                {isLoading && (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      opacity="0.25"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      opacity="0.75"
                    />
                  </svg>
                )}
                {isLoading ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
