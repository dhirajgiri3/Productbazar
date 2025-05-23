"use client";

import React from "react";
import { motion } from "framer-motion";
import withAuth from "../../../../auth/RouteProtector/withAuth";
import ViewsAnalyticsDashboard from "../../../../../Components/View/ViewsAnalyticsDashboard";

function Dashboard({ productId }) {
  if (!productId) {
    return (
      <motion.div
        className="bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm border border-slate-200 p-8 rounded-xl max-w-md mx-auto my-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
        }}
      >
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-indigo-500 mb-5"
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ delay: 0.4, duration: 0.4, type: "spring" }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </motion.svg>

          <motion.h3
            className="text-lg font-semibold text-slate-800"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            No Product ID Found
          </motion.h3>

          <motion.p
            className="text-sm text-slate-500 text-center mt-3 max-w-xs"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            Please select a valid product from your dashboard to view the analytics
            and performance metrics.
          </motion.p>

          <motion.button
            className="mt-6 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            onClick={() => window.history.back()}
          >
            Go Back
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ViewsAnalyticsDashboard productId={productId} />
    </motion.div>
  );
}

export default withAuth(Dashboard);
