// src/components/ProfileTabs/ActivityTab.jsx

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  FiUpload,
  FiArrowUp,
  FiMessageSquare,
  FiBookmark,
  FiEye,
  FiActivity,
  FiEdit,
  FiTag,
  FiUser,
  FiFilter,
  FiCalendar,
  FiClock,
  FiPackage,
  FiLayers,
  FiChevronLeft,
  FiRefreshCw,
  FiInfo,
  FiX,
} from "react-icons/fi";

// Helper functions consolidated and simplified
const activityHelpers = {
  getIcon: (type) => {
    const iconMap = {
      product_created: <FiUpload className="w-4 h-4 text-violet-500" />,
      product_updated: <FiEdit className="w-4 h-4 text-blue-500" />,
      product_upvoted: <FiArrowUp className="w-4 h-4 text-green-500" />,
      upvoted: <FiArrowUp className="w-4 h-4 text-green-500" />,
      comment_created: <FiMessageSquare className="w-4 h-4 text-amber-500" />,
      commented: <FiMessageSquare className="w-4 h-4 text-amber-500" />,
      product_bookmarked: <FiBookmark className="w-4 h-4 text-red-500" />,
      bookmarked: <FiBookmark className="w-4 h-4 text-red-500" />,
      product_viewed: <FiEye className="w-4 h-4 text-gray-500" />,
      viewed: <FiEye className="w-4 h-4 text-gray-500" />,
      user_followed: <FiUser className="w-4 h-4 text-pink-500" />,
      followed: <FiUser className="w-4 h-4 text-pink-500" />,
      tag_added: <FiTag className="w-4 h-4 text-indigo-500" />,
      tagged: <FiTag className="w-4 h-4 text-indigo-500" />,
    };

    return (
      iconMap[type?.toLowerCase()] || (
        <FiActivity className="w-4 h-4 text-gray-500" />
      )
    );
  },

  getTitle: (activity) => {
    if (activity.description) return activity.description;

    const { type, data, item } = activity;
    const productName =
      data?.product?.name ||
      data?.product?.title ||
      (item && typeof item === "string" ? item : "");

    const userName =
      data?.user?.name ||
      (data?.user?.firstName
        ? `${data.user.firstName} ${data.user.lastName || ""}`.trim()
        : "");

    const titleMap = {
      product_created: `Created a new product${
        productName ? `: ${productName}` : ""
      }`,
      created: `Created a new product${productName ? `: ${productName}` : ""}`,
      product_updated: `Updated a product${
        productName ? `: ${productName}` : ""
      }`,
      updated: `Updated a product${productName ? `: ${productName}` : ""}`,
      product_upvoted: `Upvoted a product${
        productName ? `: ${productName}` : ""
      }`,
      upvoted: `Upvoted a product${productName ? `: ${productName}` : ""}`,
      comment_created: `Commented on a product${
        productName ? `: ${productName}` : ""
      }`,
      commented: `Commented on a product${
        productName ? `: ${productName}` : ""
      }`,
      product_bookmarked: `Bookmarked a product${
        productName ? `: ${productName}` : ""
      }`,
      bookmarked: `Bookmarked a product${
        productName ? `: ${productName}` : ""
      }`,
      product_viewed: `Viewed a product${
        productName ? `: ${productName}` : ""
      }`,
      viewed: `Viewed a product${productName ? `: ${productName}` : ""}`,
      user_followed: `Followed a user${userName ? `: ${userName}` : ""}`,
      followed: `Followed a user${userName ? `: ${userName}` : ""}`,
      tag_added: `Added tags to a product${
        productName ? `: ${productName}` : ""
      }`,
      tagged: `Added tags to a product${productName ? `: ${productName}` : ""}`,
      joined: "Joined Product Bazar",
    };

    return (
      titleMap[type?.toLowerCase()] ||
      activity.text ||
      activity.description ||
      "Performed an activity"
    );
  },

  getTime: (activity) => {
    try {
      const activityDate =
        activity.date || activity.createdAt || activity.timestamp;
      let date;

      if (typeof activityDate === "number") {
        date = new Date(activityDate);
      } else if (typeof activityDate === "string") {
        date = parseISO(activityDate);
      } else if (activityDate instanceof Date) {
        date = activityDate;
      } else {
        return "";
      }

      return isValid(date)
        ? formatDistanceToNow(date, { addSuffix: true })
        : "";
    } catch (error) {
      console.error("Error calculating activity time:", error);
      return "";
    }
  },

  getDetail: (activity) => {
    if (activity.text && activity.text !== activityHelpers.getTitle(activity)) {
      return activity.text;
    }

    if (
      activity.description &&
      activity.description !== activityHelpers.getTitle(activity)
    ) {
      return activity.description;
    }

    return null;
  },

  getLink: (activity) => {
    const { type, data, link } = activity;

    if (link) return link;

    // Product related activities
    if (
      [
        "product_created",
        "product_updated",
        "product_upvoted",
        "comment_created",
        "product_bookmarked",
        "product_viewed",
        "created",
        "updated",
        "upvoted",
        "commented",
        "bookmarked",
        "viewed",
      ].includes(type?.toLowerCase())
    ) {
      if (data?.product?.slug) {
        return `/product/${data.product.slug}`;
      } else if (data?.product?._id) {
        return `/product/${data.product._id}`;
      } else if (data?.productId) {
        return `/product/${data.productId}`;
      }
    }

    // User related activities
    else if (["user_followed", "followed"].includes(type?.toLowerCase())) {
      if (data?.user?.username) {
        return `/${data.user.username}`;
      } else if (data?.user?._id) {
        return `/${data.user._id}`;
      } else if (data?.userId) {
        return `/${data.userId}`;
      }
    }

    return null;
  },
};

// Animation variants for consistent animations
const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 },
  },
};

export default function ActivityTab({ activity = [], onBack }) {
  // State for activity filters
  const [activeFilter, setActiveFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Clean and sort activities
  const validActivities = useMemo(() => {
    return (activity || [])
      .filter((item) => item && (item.type || item.date || item.createdAt))
      .sort((a, b) => {
        const dateA = a.date || a.createdAt || a.timestamp || 0;
        const dateB = b.date || b.createdAt || b.timestamp || 0;

        const timeA =
          typeof dateA === "string" ? new Date(dateA).getTime() : dateA;
        const timeB =
          typeof dateB === "string" ? new Date(dateB).getTime() : dateB;

        return timeB - timeA; // Descending order (newest first)
      });
  }, [activity]);

  // Filter activities based on type and time range
  const filteredActivities = useMemo(() => {
    let filtered = [...validActivities];

    // Apply type filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((item) => {
        const type = item.type?.toLowerCase() || "";

        switch (activeFilter) {
          case "products":
            return (
              type.includes("product") ||
              type === "created" ||
              type === "updated"
            );
          case "upvotes":
            return type.includes("upvote");
          case "bookmarks":
            return type.includes("bookmark");
          case "comments":
            return type.includes("comment");
          case "views":
            return type.includes("view");
          default:
            return true;
        }
      });
    }

    // Apply time range filter
    if (timeRange !== "all") {
      const now = new Date();
      let cutoffDate;

      switch (timeRange) {
        case "today":
          cutoffDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          cutoffDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          cutoffDate = null;
      }

      if (cutoffDate) {
        filtered = filtered.filter((item) => {
          const itemDate = new Date(
            item.date || item.createdAt || item.timestamp || 0
          );
          return itemDate >= cutoffDate;
        });
      }
    }

    return filtered;
  }, [validActivities, activeFilter, timeRange]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    return filteredActivities.reduce((acc, item) => {
      try {
        const activityDate = item.date || item.createdAt || item.timestamp;
        if (!activityDate) return acc;

        let date;
        if (typeof activityDate === "number") {
          date = new Date(activityDate);
        } else if (typeof activityDate === "string") {
          date = parseISO(activityDate);
        } else if (activityDate instanceof Date) {
          date = activityDate;
        } else {
          return acc;
        }

        if (!isValid(date)) return acc;

        const dateKey = format(date, "yyyy-MM-dd");
        const displayDate = format(date, "MMMM d, yyyy");

        if (!acc[dateKey]) {
          acc[dateKey] = {
            displayDate,
            activities: [],
          };
        }

        acc[dateKey].activities.push(item);
        return acc;
      } catch (error) {
        console.error("Error processing activity date:", error, item);
        return acc;
      }
    }, {});
  }, [filteredActivities]);

  // Sort by date (newest first)
  const sortedDates = Object.keys(groupedActivities).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  // Filter definitions
  const filters = [
    { id: "all", label: "All", icon: <FiLayers className="w-4 h-4" /> },
    {
      id: "products",
      label: "Products",
      icon: <FiPackage className="w-4 h-4" />,
    },
    {
      id: "upvotes",
      label: "Upvotes",
      icon: <FiArrowUp className="w-4 h-4" />,
    },
    {
      id: "bookmarks",
      label: "Bookmarks",
      icon: <FiBookmark className="w-4 h-4" />,
    },
    {
      id: "comments",
      label: "Comments",
      icon: <FiMessageSquare className="w-4 h-4" />,
    },
    { id: "views", label: "Views", icon: <FiEye className="w-4 h-4" /> },
  ];

  const timeFilters = [
    { id: "all", label: "All Time", icon: <FiCalendar className="w-4 h-4" /> },
    { id: "today", label: "Today", icon: <FiClock className="w-4 h-4" /> },
    { id: "week", label: "This Week", icon: <FiClock className="w-4 h-4" /> },
    {
      id: "month",
      label: "This Month",
      icon: <FiCalendar className="w-4 h-4" />,
    },
  ];

  // Function to refresh activity data
  const refreshActivity = () => {
    setIsRefreshing(true);
    // Simulate refresh - in a real app, you would fetch new data here
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Empty state component
  const EmptyState = () => (
    <div className="py-12 text-center">
      <motion.div
        {...animations.slideUp}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md mx-auto"
      >
        <motion.div
          className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mb-5 mx-auto border border-violet-100 shadow-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <FiActivity className="w-8 h-8 text-violet-500" />
        </motion.div>
        <motion.h3
          className="text-lg font-medium text-gray-900 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          No activity yet
        </motion.h3>
        <motion.p
          className="text-gray-500 max-w-sm mx-auto text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Your activities such as adding products, comments, upvotes, and other
          interactions will show up here.
        </motion.p>

        <motion.div
          className="mt-8 border-t border-gray-100 pt-6 w-full max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h4 className="text-sm font-medium text-gray-700 mb-4">Start by:</h4>
          <div className="space-y-3">
            {[
              {
                icon: <FiUpload className="w-5 h-5 text-violet-600" />,
                text: "Add your first product",
              },
              {
                icon: <FiArrowUp className="w-5 h-5 text-violet-600" />,
                text: "Upvote other products",
              },
              {
                icon: <FiMessageSquare className="w-5 h-5 text-violet-600" />,
                text: "Comment on discussions",
              },
            ].map((action, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-violet-100 hover:bg-violet-50/30 transition-all duration-300 cursor-pointer"
                whileHover={{
                  y: -2,
                  boxShadow: "0 8px 20px -5px rgba(124, 58, 237, 0.1)",
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 border border-violet-200">
                  {action.icon}
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {action.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );

  // No filtered activities component
  const NoFilteredActivities = () => (
    <motion.div
      {...animations.slideUp}
      className="bg-white rounded-xl border border-gray-100 p-8 text-center my-6"
    >
      <div className="w-14 h-14 mx-auto mb-4 bg-violet-50 rounded-full flex items-center justify-center">
        <FiFilter className="w-6 h-6 text-violet-500" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-2">
        No activities found
      </h3>
      <p className="text-gray-600 text-sm max-w-md mx-auto mb-5">
        There are no activities matching your current filters. Try changing your
        filter criteria or check back later.
      </p>
      <motion.button
        onClick={() => {
          setActiveFilter("all");
          setTimeRange("all");
        }}
        className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-all"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        Reset Filters
      </motion.button>
    </motion.div>
  );

  // Main render
  if (validActivities.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <motion.div
        {...animations.slideUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative"
      >
        {/* Back button - positioned absolutely */}
        {onBack && (
          <motion.button
            onClick={onBack}
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-violet-50 hover:border-violet-200 transition-colors"
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FiChevronLeft className="w-4 h-4 text-gray-600" />
          </motion.button>
        )}

        <div className="flex items-center gap-3 pl-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm">
            <FiActivity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
              <motion.button
                onClick={() => setShowInfo(!showInfo)}
                className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-violet-100 hover:text-violet-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiInfo className="w-3 h-3" />
              </motion.button>
            </div>
            <p className="text-xs text-gray-500">Your recent interactions</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <motion.button
            onClick={refreshActivity}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={
              isRefreshing
                ? { repeat: Infinity, duration: 1, ease: "linear" }
                : {}
            }
          >
            <FiRefreshCw className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="sm:hidden p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiFilter className="w-4 h-4" />
          </motion.button>

          <motion.div
            className="relative hidden sm:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer shadow-sm"
            >
              {timeFilters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-violet-500">
              <FiCalendar className="w-3 h-3" />
            </div>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Info tooltip */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p>
              This timeline shows your recent activities and interactions on the
              platform. Use the filters to view specific types of activities or
              time periods.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Filters Dropdown */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            className="sm:hidden bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">Filters</h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <FiX className="w-3 h-3 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">
                  Activity Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all ${
                        activeFilter === filter.id
                          ? "bg-violet-100 text-violet-700 border border-violet-200"
                          : "bg-gray-50 text-gray-600 border border-gray-100 hover:border-violet-100 hover:bg-violet-50"
                      }`}
                    >
                      <span
                        className={
                          activeFilter === filter.id
                            ? "text-violet-600"
                            : "text-gray-400"
                        }
                      >
                        {filter.icon}
                      </span>
                      <span className="mt-1">{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">
                  Time Period
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {timeFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setTimeRange(filter.id)}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all ${
                        timeRange === filter.id
                          ? "bg-violet-100 text-violet-700 border border-violet-200"
                          : "bg-gray-50 text-gray-600 border border-gray-100 hover:border-violet-100 hover:bg-violet-50"
                      }`}
                    >
                      <span
                        className={
                          timeRange === filter.id
                            ? "text-violet-600"
                            : "text-gray-400"
                        }
                      >
                        {filter.icon}
                      </span>
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter tabs - desktop */}
      <motion.div
        className="hidden sm:flex overflow-x-auto hide-scrollbar space-x-2 pb-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {filters.map((filter, index) => (
          <motion.button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeFilter === filter.id
                ? "bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-violet-200 hover:bg-violet-50"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <span
              className={
                activeFilter === filter.id ? "text-white" : "text-gray-400"
              }
            >
              {filter.icon}
            </span>
            {filter.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Activity Timeline */}
      <AnimatePresence mode="wait">
        {sortedDates.length > 0 ? (
          <motion.div
            key="user-activity-dates"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {sortedDates.map((dateKey, dateIndex) => (
              <motion.div
                key={dateKey}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: dateIndex * 0.05 }}
                className="space-y-4"
              >
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-2">
                  <h3 className="text-xs font-medium text-violet-600 bg-gradient-to-r from-violet-50 to-violet-100 inline-block px-3 py-1 rounded-full border border-violet-200 shadow-sm">
                    {groupedActivities[dateKey].displayDate}
                  </h3>
                </div>

                <div className="relative border-l border-violet-100 pl-6 ml-2 space-y-4">
                  {groupedActivities[dateKey].activities.map(
                    (item, itemIndex) => {
                      const activityIcon = activityHelpers.getIcon(item.type);
                      const activityLink = activityHelpers.getLink(item);
                      const activityTime = activityHelpers.getTime(item);
                      const activityTitle = activityHelpers.getTitle(item);
                      const activityDetail = activityHelpers.getDetail(item);

                      return (
                        <motion.div
                          key={itemIndex}
                          className="relative"
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 + itemIndex * 0.03 }}
                        >
                          {/* Timeline dot with subtle pulse animation */}
                          <div className="absolute -left-8 mt-1.5 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-violet-500 z-10" />
                            <div className="absolute w-6 h-6 rounded-full bg-violet-200 opacity-30 animate-ping-slow" />
                          </div>

                          {/* Activity card */}
                          <motion.div
                            className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:border-violet-200 transition-all duration-300"
                            whileHover={{
                              x: 2,
                              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.07)",
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-violet-200">
                                <span className="text-violet-600">
                                  {activityIcon}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {activityTitle}
                                    </p>
                                    {activityDetail && (
                                      <p className="text-xs text-gray-600 mt-1 break-words leading-relaxed">
                                        {activityDetail}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {activityTime}
                                  </span>
                                </div>

                                {activityLink && (
                                  <Link href={activityLink}>
                                    <motion.span
                                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
                                      whileHover={{ x: 2 }}
                                    >
                                      View details
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                    </motion.span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <NoFilteredActivities />
        )}
      </AnimatePresence>
    </div>
  );
}
