import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Edit } from "lucide-react";

const ProductHeader = ({ onBackClick, isOwner, onEditClick }) => {
  return (
    <motion.div
      className="mb-14 md:mb-18 flex justify-between items-center"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <button
        onClick={onBackClick}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-violet-700 group transition-colors"
      >
        <ArrowLeft
          size={18}
          className="mr-1.5 transition-transform group-hover:-translate-x-1"
        />
        Back to the Bazaar
      </button>
      
      {isOwner && (
        <motion.button
          className="flex items-center gap-1.5 px-4 py-3 bg-white border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-50 hover:border-violet-300 transition-colors text-xs font-medium shadow-sm"
          onClick={onEditClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Edit size={14} /> Edit Product
        </motion.button>
      )}
    </motion.div>
  );
};

export default ProductHeader;