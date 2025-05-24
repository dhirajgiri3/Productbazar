"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCategories } from "@/lib/contexts/category-context";
import { ChevronRight, Plus, Minus } from "lucide-react";

const CategoryList = () => {
  const { categories, loading, error } = useCategories();
  const [expanded, setExpanded] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  // Get current path to determine active category - moved to useEffect to prevent hydration mismatch
  useEffect(() => {
    const path = window.location.pathname;
    const categoryMatch = path.match(/\/category\/([\w-]+)/);
    if (categoryMatch && categoryMatch[1]) {
      setActiveCategory(categoryMatch[1]);
    }
  }, []);

  // Show only first 6 categories initially
  const visibleCategories = expanded ? categories : categories?.slice(0, 6);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center">
          <div className="h-6 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="p-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center px-4 py-2.5 mb-2 animate-pulse">
              <div className="h-5 bg-gray-200 rounded-lg w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center">
          <h3 className="text-xl font-bold text-gray-900">Categories</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-red-500 font-medium">Failed to load categories</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center">
          <h3 className="text-xl font-bold text-gray-900">Categories</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-500 font-medium">No categories available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white">
        <div className="flex items-center">
          <h3 className="text-xl font-bold text-gray-900">Categories</h3>
        </div>
        {categories.length > 6 && (
          <motion.button
            onClick={() => setExpanded(!expanded)}
            className="text-violet-600 hover:text-violet-800 p-1.5 rounded-full hover:bg-violet-100 transition-all duration-300"
            whileHover={{ scale: 1.1, rotate: expanded ? 0 : 90 }}
            whileTap={{ scale: 0.95 }}
            aria-label={expanded ? "Show fewer categories" : "Show more categories"}
          >
            {expanded ? <Minus size={16} /> : <Plus size={16} />}
          </motion.button>
        )}
      </div>

      <div className="p-4">
        <ul className="space-y-1.5">
          <AnimatePresence>
            {visibleCategories?.map((category, index) => {
              // Use category slug if available, otherwise create one from the name
              const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, "-");
              const href = `/category/${slug}`;

              return (
                <motion.li
                  key={category._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05
                  }}
                  onMouseEnter={() => setHoveredCategory(category._id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    href={href}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-300 group ${activeCategory === slug ? 'bg-violet-50 text-violet-700 font-medium shadow-sm' : 'hover:bg-gray-50 text-gray-700 hover:shadow-sm'}`}
                  >
                    <span className="transition-colors group-hover:text-gray-900 flex items-center">
                      <span className="text-violet-500 mr-1.5 group-hover:text-violet-600 transition-colors duration-300">#</span>
                      {category.name}
                    </span>
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{
                        opacity: hoveredCategory === category._id || activeCategory === slug ? 1 : 0,
                        x: hoveredCategory === category._id || activeCategory === slug ? 0 : -5
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight size={14} className={activeCategory === slug ? "text-violet-600" : "text-gray-400"} />
                    </motion.div>
                  </Link>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        {!expanded && categories.length > 6 && (
          <motion.button
            onClick={() => setExpanded(true)}
            className="w-full mt-4 text-center text-sm text-violet-600 py-2.5 rounded-lg hover:bg-violet-50 transition-all duration-300 border border-transparent hover:border-violet-100"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center justify-center">
              <Plus size={14} className="mr-1.5" />
              Show all categories ({categories.length})
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default CategoryList;
