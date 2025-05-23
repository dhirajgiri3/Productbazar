"use client";

import React from 'react';
import { motion } from 'framer-motion';

const LoaderComponent = ({ size = 'small', text = 'Loading...', color = 'violet' }) => {
  const sizeVariants = {
    small: { container: 'h-16', dot: 'w-1.5 h-1.5', text: 'text-xs' },
    medium: { container: 'h-24', dot: 'w-2 h-2', text: 'text-sm' },
    large: { container: 'h-32', dot: 'w-2.5 h-2.5', text: 'text-base' },
  };

  const colorVariants = {
    violet: { primary: 'bg-violet-600', text: 'text-violet-600' },
    blue: { primary: 'bg-blue-600', text: 'text-blue-600' },
    green: { primary: 'bg-green-600', text: 'text-green-600' },
    red: { primary: 'bg-red-600', text: 'text-red-600' },
    gray: { primary: 'bg-gray-600', text: 'text-gray-600' },
  };

  const sizeStyle = sizeVariants[size] || sizeVariants.medium;
  const colorStyle = colorVariants[color] || colorVariants.violet;

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const dotVariants = {
    initial: { y: 0, opacity: 0.2 },
    animate: {
      y: [-8, 0, -8],
      opacity: [0.2, 1, 0.2],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className={`flex flex-col items-center justify-center ${sizeStyle.container}`}>
      <motion.div
        className="flex space-x-2"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`${sizeStyle.dot} rounded-full ${colorStyle.primary}`}
            variants={dotVariants}
          />
        ))}
      </motion.div>
      {text && (
        <motion.p
          className={`mt-4 ${sizeStyle.text} ${colorStyle.text} font-medium`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default LoaderComponent;