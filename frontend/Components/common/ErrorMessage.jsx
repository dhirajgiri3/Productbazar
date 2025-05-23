"use client";

import React from 'react';
import { motion } from 'framer-motion';

const ErrorMessage = ({ error, className = "" }) => {
  if (!error) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-2 text-xs text-red-600 flex items-center gap-1.5 ${className}`}
    >
      <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
      <span>{error}</span>
    </motion.div>
  );
};

export default ErrorMessage;
