"use client";

import React from "react";
import { motion } from "framer-motion";
import ProjectList from "../../Components/Project/ProjectList";
import { Briefcase, Rocket, Users, Award } from "lucide-react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

export default function ProjectsPage() {
  return (
    <>
      {/* Minimalistic Hero Section */}
      <div className="relative bg-white">
        {/* Subtle background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-white pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Clean, minimalistic header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-2 text-violet-600 text-sm font-medium tracking-wide uppercase"
            >
              Project Showcase
            </motion.div>

            <motion.h1
              className="text-3xl md:text-4xl font-medium text-gray-900 tracking-tight mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Discover Amazing Projects
            </motion.h1>

            <motion.p
              className="text-base text-gray-500 max-w-xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Explore innovative work from talented creators around the world
            </motion.p>
          </div>

          {/* Minimalistic Feature Categories */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-lg p-4 hover:bg-gray-100 transition-colors duration-300 flex flex-col items-center text-center"
            >
              <Briefcase className="text-violet-600 mb-3" size={20} />
              <h3 className="text-sm font-medium text-gray-800">Professional</h3>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-lg p-4 hover:bg-gray-100 transition-colors duration-300 flex flex-col items-center text-center"
            >
              <Rocket className="text-violet-600 mb-3" size={20} />
              <h3 className="text-sm font-medium text-gray-800">Startup</h3>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-lg p-4 hover:bg-gray-100 transition-colors duration-300 flex flex-col items-center text-center"
            >
              <Users className="text-violet-600 mb-3" size={20} />
              <h3 className="text-sm font-medium text-gray-800">Agency</h3>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-lg p-4 hover:bg-gray-100 transition-colors duration-300 flex flex-col items-center text-center"
            >
              <Award className="text-violet-600 mb-3" size={20} />
              <h3 className="text-sm font-medium text-gray-800">Featured</h3>
            </motion.div>
          </motion.div>

          {/* Project List Component - Minimalistic */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ProjectList
              title="Projects"
              emptyMessage="No projects found. Try adjusting your filters or search terms."
              showFilters={true}
              showSearch={true}
              showAddButton={true}
              initialFilters={{ visibility: "public" }}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
}
