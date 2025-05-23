import React from 'react';
import { FaTrash, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// Backdrop animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

// Modal animation variants
const modalVariants = {
  hidden: { scale: 0.8, opacity: 0, y: 20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 }
  }
};

// Content animation variants
const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1,
      duration: 0.3
    }
  }
};

const DeleteCommentModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Comment?",
  message = "Are you sure you want to delete this comment? This action cannot be undone.",
  content,
  isLoading = false
}) => {
  if (!isOpen) return null;

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="delete-comment-modal"
          className="h-full fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[10px] flex items-center justify-center z-50 p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleBackdropClick}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden fixed top-[5rem]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-300" />
                {title}
              </h3>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-1 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
                aria-label="Close dialog"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <motion.div
              className="p-6"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {message}
              </p>

              {/* Content Preview */}
              {content && (
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-6 max-h-32 overflow-auto">
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic overflow-ellipsis">
                    "{content}"
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <motion.button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>

                <motion.button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-md shadow-red-500/20 dark:shadow-red-800/20 disabled:opacity-70 flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash size={14} />
                      Delete
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteCommentModal;