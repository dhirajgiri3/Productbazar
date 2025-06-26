"use client";

import React from 'react';
import { motion } from 'framer-motion';

const SocialDivider = ({ text = "Or continue with" }) => {
  return (
    <motion.div 
      className="relative my-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-gray-500 font-medium">
          {text}
        </span>
      </div>
    </motion.div>
  );
};

export default SocialDivider;
