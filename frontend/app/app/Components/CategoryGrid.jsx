"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCategories } from "@/lib/contexts/category-context";
import { Grid, ArrowRight } from "lucide-react";

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const CategoryItem = ({ category }) => {
  // Use category slug if available, otherwise create one from the name
  const href = category.slug
    ? `/category/${category.slug}`
    : `/category/${category.name.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <motion.div variants={item} key={category._id}>
      <Link
        href={href}
        className="group flex flex-col items-center p-6 rounded-xl transition-all duration-300
          bg-white border border-gray-100 hover:border-violet-200 relative overflow-hidden"
      >
        {/* Subtle gradient hover effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative z-10 mb-4 transition-all duration-300 group-hover:translate-y-1">
          {category.icon ? (
            <Image
              src={category.icon}
              alt={category.name}
              width={48}
              height={48}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <span className="text-lg">📁</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 relative z-10">
          <span className="font-medium text-gray-700 text-sm group-hover:text-violet-700 transition-colors">
            {category.name}
          </span>
          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-violet-500" />
        </div>
      </Link>
    </motion.div>
  );
};

const CategoryGrid = () => {
  const { categories, loading, error, retryFetchCategories } = useCategories();

  if (loading) {
    return (
      <section className="mt-12">
        <div className="flex items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Explore Categories
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center p-6 rounded-xl bg-gray-50 animate-pulse h-28"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-200 mb-4"></div>
              <div className="w-16 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-12">
        <div className="flex items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Explore Categories
          </h2>
        </div>
        <div className="bg-red-50 p-6 rounded-xl flex flex-col items-center border border-red-100">
          <p className="mb-4 text-sm text-red-600">Unable to load categories</p>
          <button
            onClick={retryFetchCategories}
            className="px-4 py-2 bg-white text-red-600 text-sm rounded-lg hover:bg-red-600 hover:text-white border border-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <span className="bg-violet-50 text-violet-600 w-8 h-8 flex items-center justify-center rounded-md mr-3">
            <Grid className="w-4 h-4" />
          </span>
          Explore Categories
        </h2>
      </div>

      {categories && categories.length > 0 ? (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {categories.map((category) => (
            <CategoryItem key={category._id} category={category} />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">No categories available</p>
        </div>
      )}
    </section>
  );
};

export default CategoryGrid;
