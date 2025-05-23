import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

export const Tag = ({ text, onRemove }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9, y: 5 }}
    whileHover={{ y: -2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
    layout
    className="inline-flex items-center px-3 py-1 rounded-lg text-xs bg-violet-50 text-violet-700 border border-violet-100 m-0.5 shadow-sm"
  >
    {text}
    <motion.button
      onClick={onRemove}
      className="ml-1.5 p-0.5 rounded-full hover:bg-violet-100 transition-all focus:outline-none"
      aria-label={`Remove ${text}`}
      title={`Remove ${text}`}
      whileHover={{ scale: 1.2, backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
      whileTap={{ scale: 0.9 }}
    >
      <XMarkIcon className="h-3 w-3 text-violet-500" />
    </motion.button>
  </motion.span>
);
