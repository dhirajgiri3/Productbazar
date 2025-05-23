"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

/**
 * Dashboard redirect page
 * This page handles the case when a user tries to access the dashboard without a product ID
 */
function DashboardPage() {
  const router = useRouter();

  // Redirect to the products page after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/user/products");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

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
          Product ID Required
        </motion.h3>

        <motion.p
          className="text-sm text-slate-500 text-center mt-3 max-w-xs"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          Please select a specific product to view its analytics. You will be redirected to your products page.
        </motion.p>

        <motion.button
          className="mt-6 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-lg transition-colors duration-200"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          onClick={() => router.push("/user/products")}
        >
          Go to My Products
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default DashboardPage;
