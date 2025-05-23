"use client"; // Ensure this page is rendered on the client-side

import React, { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import viewService from "../../../services/viewService";
import LoaderComponent from "../../../Components/UI/LoaderComponent";
import UserViewHistory from "../../../Components/View/UserViewHistory";

// Animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.2,
      duration: 0.6,
    },
  },
};

// Enhanced loading fallback with Product Bazar violet theme
const HistoryFallback = () => (
  <div>
    <LoaderComponent message="Unfurling the scroll..." />
  </div>
);

function Page() {
  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pre-fetch data to avoid duplicate requests
  useEffect(() => {
    // Check if we have cached data first
    try {
      const cachedData = sessionStorage.getItem("viewHistoryData");
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        const timestamp = parsedData.timestamp || 0;

        // Use cached data if it's less than 1 minute old
        if (Date.now() - timestamp < 60000) {
          console.log("Using cached view history data in page component");
          setInitialData(parsedData);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Error reading cached history data:", err);
    }

    // Fetch fresh data if no valid cache exists
    viewService
      .getUserViewHistory({ page: 1, limit: 12 })
      .then((result) => {
        setInitialData(result);
        // Cache the result
        try {
          sessionStorage.setItem(
            "viewHistoryData",
            JSON.stringify({
              ...result,
              timestamp: Date.now(),
            })
          );
        } catch (cacheErr) {
          console.warn("Failed to cache view history:", cacheErr);
        }
      })
      .catch((err) => {
        console.error("Failed to pre-fetch view history:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-b from-violet-50 to-white"
    >
      <Suspense fallback={<HistoryFallback />}>
        {isLoading ? (
          <HistoryFallback />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <UserViewHistory initialData={initialData} />
          </div>
        )}
      </Suspense>
    </motion.div>
  );
}

export default Page;
