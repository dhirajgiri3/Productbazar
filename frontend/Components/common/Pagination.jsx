// src/components/common/Pagination.jsx
import { motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxVisiblePages = 5,
  size = 'md',
  className = '',
  showSummary = true,
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    if (totalPages <= maxVisiblePages) return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = start + maxVisiblePages - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    if (start > 1) pages.unshift('...', 1);
    if (end < totalPages) pages.push('...', totalPages);
    return pages;
  };

  const sizeClasses = {
    sm: { button: 'h-8 w-8 text-xs', chevron: 'h-4 w-4', text: 'text-xs', container: 'gap-1' },
    md: { button: 'h-10 w-10 text-sm', chevron: 'h-5 w-5', text: 'text-sm', container: 'gap-2' },
    lg: { button: 'h-12 w-12 text-base', chevron: 'h-6 w-6', text: 'text-base', container: 'gap-3' },
  };

  const classes = sizeClasses[size] || sizeClasses.md;
  const pageNumbers = showPageNumbers ? getPageNumbers() : [];

  const handlePageChangeLocal = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) onPageChange(page);
  };

  return (
    <div className={`flex items-center justify-center ${classes.container} ${className}`}>
      <motion.button
        whileHover={{ scale: currentPage > 1 ? 1.05 : 1 }}
        whileTap={{ scale: currentPage > 1 ? 0.95 : 1 }}
        onClick={() => handlePageChangeLocal(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${classes.button} rounded-full border flex items-center justify-center ${currentPage <= 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        <ChevronLeftIcon className={classes.chevron} />
      </motion.button>

      {showPageNumbers && pageNumbers.map((page, idx) => (
        <motion.button
          key={idx}
          whileHover={{ scale: page !== '...' ? 1.05 : 1 }}
          whileTap={{ scale: page !== '...' ? 0.95 : 1 }}
          onClick={() => page !== '...' && handlePageChangeLocal(page)}
          className={`${classes.button} rounded-full flex items-center justify-center ${page === currentPage ? 'bg-violet-600 text-white' : page === '...' ? 'text-gray-500' : 'text-gray-700 hover:bg-gray-100 border'}`}
          disabled={page === '...'}
        >
          {page}
        </motion.button>
      ))}

      {!showPageNumbers && showSummary && (
        <span className={`${classes.text} px-3 py-1 text-gray-700 bg-gray-100 rounded-lg`}>
          Page {currentPage} of {totalPages}
        </span>
      )}

      <motion.button
        whileHover={{ scale: currentPage < totalPages ? 1.05 : 1 }}
        whileTap={{ scale: currentPage < totalPages ? 0.95 : 1 }}
        onClick={() => handlePageChangeLocal(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${classes.button} rounded-full border flex items-center justify-center ${currentPage >= totalPages ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        <ChevronRightIcon className={classes.chevron} />
      </motion.button>
    </div>
  );
};

export default Pagination;