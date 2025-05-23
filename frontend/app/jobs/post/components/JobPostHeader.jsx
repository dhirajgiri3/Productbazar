"use client";

import { motion } from "framer-motion";
import { Briefcase, ArrowLeft } from "lucide-react";
import Link from "next/link";

const JobPostHeader = () => {
  return (
    <motion.div 
      className="mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/jobs" 
          className="flex items-center gap-1 text-violet-600 hover:text-violet-700 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to Jobs</span>
        </Link>
        
        <div className="flex items-center gap-2 text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-100">
          <Briefcase size={16} />
          <span className="text-sm font-medium">Job Posting</span>
        </div>
      </div>
      
      <div className="text-center">
        <motion.div 
          className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-full mb-4 ring-4 ring-violet-50"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Briefcase size={32} className="text-violet-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-clash-bold">Post a New Job</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Fill out the form below to post a new job opportunity. Provide detailed information to attract the best candidates.
        </p>
      </div>
    </motion.div>
  );
};

export default JobPostHeader;
