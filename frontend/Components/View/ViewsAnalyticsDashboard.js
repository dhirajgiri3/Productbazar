"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import { useView } from "@/lib/contexts/view-context";

// Icons
import {
  ChevronDown,
  Globe,
  Laptop as DeviceDesktop,
  Clock,
  ArrowUpRight,
  Users,
  ExternalLink,
  TrendingUp,
  Lightbulb,
  Calendar,
  Eye,
} from "lucide-react";

// Rich color palette with improved visual harmony
const COLORS = [
  "#4338ca", // Indigo
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#ef4444", // Red
  "#a3e635", // Lime
];

/**
 * Custom hook to format daily views data for visualization
 * @param {Array} dailyViews - Array of daily view data
 * @param {Number} timeframe - Number of days to include
 * @returns {Array} Formatted data for charts
 */
const useFormattedDailyData = (dailyViews = [], timeframe = 7) => {
  // Create a continuous array of dates even if data is missing for specific dates
  const result = [];
  const endDate = new Date();

  // Sort dailyViews by date
  const sortedViews = dailyViews.sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Create a map for quick lookup of views by date
  const viewsMap = new Map(sortedViews.map((day) => [day.date, day]));

  // Fill array with data for the selected timeframe
  for (let i = 0; i < timeframe; i++) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - (timeframe - 1 - i));
    const dateString = date.toISOString().split("T")[0];

    // Find data for this date or create empty entry
    const dayData = viewsMap.get(dateString) || {
      date: dateString,
      count: 0,
      uniqueCount: 0,
    };

    result.push({
      date: dateString,
      count: dayData.count || 0,
      uniqueCount: dayData.uniqueCount || 0,
      // Format date for display
      displayDate: typeof window !== 'undefined' ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : date.toISOString().slice(5, 10),
      // Get day of week for context
      dayOfWeek: typeof window !== 'undefined' ? date.toLocaleDateString('en-US', { weekday: 'short' }) : '---',
    });
  }

  return result;
};

/**
 * Enhanced geography data preparation with better country identification
 */
const prepareGeographyData = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) return [];

  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);

  return data.map((item, index) => ({
    ...item,
    country: item.country || "Unknown",
    total,
    percentage: ((item.count / total) * 100).toFixed(1),
    formattedCount: typeof window !== 'undefined' ? (item.count?.toLocaleString() || '0') : String(item.count ?? 0),
    // Add ISO code for potential country flags
    countryCode: item.countryCode || getCountryCode(item.country || "Unknown"),
    // Add color based on index for consistent coloring
    color: COLORS[index % COLORS.length],
  }));
};

/**
 * Helper function to get country codes
 */
const getCountryCode = (countryName) => {
  const countryCodes = {
    "United States": "US",
    USA: "US",
    UK: "GB",
    "United Kingdom": "GB",
    Canada: "CA",
    Australia: "AU",
    India: "IN",
    Germany: "DE",
    France: "FR",
    Japan: "JP",
    China: "CN",
    Brazil: "BR",
    Russia: "RU",
    // Default to XX for unknown
    Unknown: "XX",
  };

  return countryCodes[countryName] || "XX";
};

/**
 * Format insights for better readability
 */
const formatInsights = (insights) => {
  if (!insights || !insights.summary) return [];

  return insights.summary.map((insight) => ({
    text: insight,
    // Detect if insight is positive, negative, or neutral
    sentiment:
      insight.toLowerCase().includes("upward") ||
      insight.toLowerCase().includes("growing") ||
      insight.toLowerCase().includes("significant time")
        ? "positive"
        : insight.toLowerCase().includes("downward") ||
          insight.toLowerCase().includes("decreasing")
        ? "negative"
        : "neutral",
  }));
};

/**
 * Custom tooltip component for geography chart
 */
const GeographyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-gray-900/95 border border-indigo-500/30 backdrop-blur-sm p-3 rounded-lg shadow-xl">
        <p className="font-medium text-white mb-1">
          {payload[0].payload.country}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300 mr-2">Views:</span>
          <span className="text-indigo-300 font-medium">
            {payload[0].value}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300 mr-2">Percentage:</span>
          <span className="text-indigo-300 font-medium">
            {payload[0].payload.percentage}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Custom tooltip for daily views chart
 */
const DailyViewsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const formattedDate = typeof window !== 'undefined' ? date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : date.toISOString().slice(0, 10);

    return (
      <div className="custom-tooltip text-white bg-gray-900/95 border border-indigo-500/30 backdrop-blur-sm p-3 rounded-lg shadow-xl">
        <p className="font-medium text-white mb-2">{formattedDate}</p>
        {payload.map((entry, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm mb-1"
          >
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-300">{entry.name}:</span>
            </div>
            <span className="font-medium ml-2" style={{ color: entry.color }}>
              {typeof window !== 'undefined' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Dashboard loader component with animated gradient
 */
const DashboardLoader = () => (
  <div className="flex items-center justify-center h-screen w-full bg-gradient-to-br from-gray-950 via-indigo-950 to-black">
    <div className="flex flex-col items-center">
      <div className="relative">
        <motion.div
          className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 w-16 h-16 border-4 border-purple-500/30 border-t-transparent rounded-full"
          animate={{ rotate: -180 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.p
        className="mt-6 text-gray-300 text-lg font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading analytics...
      </motion.p>
    </div>
  </div>
);

/**
 * Main ViewsAnalyticsDashboard component
 */
const ViewsAnalyticsDashboard = ({ productId }) => {
  const { getProductViewStats, viewStats: stats, loading, error, realTimeEnabled, toggleRealTimeUpdates } = useView();
  const [timeframe, setTimeframe] = useState(7);
  const [activeChart, setActiveChart] = useState("combined");
  const [activeInsight, setActiveInsight] = useState(0);

  // Enhanced data processing with the API response structure
  useEffect(() => {
    if (productId) {
      // Fetch at least double the timeframe to calculate period-over-period changes
      const daysToFetch = Math.max(timeframe * 2, 30);
      getProductViewStats(productId, daysToFetch);
    }
  }, [productId, timeframe, getProductViewStats]);

  // Format daily views data using our custom hook
  const formattedDailyViews = useFormattedDailyData(
    stats?.dailyViews,
    timeframe
  );

  // Calculate period-over-period changes
  const calculateChange = (currentPeriod, previousPeriod) => {
    // When we have valid previous data
    if (previousPeriod > 0) {
      return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
    }

    // When there's no previous data but current data exists
    if (currentPeriod > 0 && previousPeriod === 0) {
      return 100; // Cap at 100% for new metrics
    }

    // When both are 0 or invalid
    return 0;
  };

  // Calculate metrics for different time periods
  /**
   * Enhanced period metrics calculation with advanced analytics and trending detection
   * @param {Array} dailyViews - Daily view statistics data
   * @param {Number} timeframe - Timeframe in days to calculate metrics for
   * @returns {Object} Comprehensive metrics object with growth trends
   */
  const calculatePeriodMetrics = (dailyViews, timeframe) => {
    // Handle empty/invalid data with sensible defaults
    if (!dailyViews || !Array.isArray(dailyViews) || dailyViews.length === 0) {
      return {
        currentViews: 0,
        previousViews: 0,
        viewsChange: 0,
        currentUnique: 0,
        previousUnique: 0,
        uniqueChange: 0,
        trend: "neutral",
        reliability: "low",
        hasSufficientData: false,
      };
    }

    const now = new Date();

    // Ensure we're working with a clean copy and handle invalid dates
    const validViews = dailyViews
      .filter(
        (item) => item && item.date && !isNaN(new Date(item.date).getTime())
      )
      .map((item) => ({
        ...item,
        jsDate: new Date(item.date),
        count: item.count || 0,
        uniqueCount: item.uniqueCount || 0,
      }));

    // Sort by date ascending
    const sortedViews = validViews.sort((a, b) => a.jsDate - b.jsDate);

    // Get cutoff dates for current and previous periods
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - timeframe);

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - timeframe);

    // Split data into current and previous periods based on actual dates
    // This handles data gaps better than simple array slicing
    const currentPeriodViews = sortedViews.filter(
      (item) => item.jsDate >= currentPeriodStart && item.jsDate <= now
    );

    const previousPeriodViews = sortedViews.filter(
      (item) =>
        item.jsDate >= previousPeriodStart && item.jsDate < currentPeriodStart
    );

    // Calculate totals for each period
    const currentTotal = currentPeriodViews.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const previousTotal = previousPeriodViews.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const currentUnique = currentPeriodViews.reduce(
      (sum, item) => sum + item.uniqueCount,
      0
    );
    const previousUnique = previousPeriodViews.reduce(
      (sum, item) => sum + item.uniqueCount,
      0
    );

    // Calculate daily averages to account for incomplete periods
    const currentDayCount = Math.max(1, currentPeriodViews.length);
    const previousDayCount = Math.max(1, previousPeriodViews.length);

    const currentDailyAvg = currentTotal / currentDayCount;
    const previousDailyAvg = previousTotal / previousDayCount;

    // Calculate percentage changes with proper handling for zero/missing values
    const calculatePercentChange = (current, previous) => {
      if (previous <= 0) {
        return current > 0 ? 100 : 0;
      }

      const change = ((current - previous) / previous) * 100;

      // Cap extreme values for better UI presentation
      if (change > 1000) return 1000;
      if (change < -100) return -100;

      return parseFloat(change.toFixed(1));
    };

    let viewsChange = calculatePercentChange(currentTotal, previousTotal);
    let uniqueChange = calculatePercentChange(currentUnique, previousUnique);

    // If we have very few data points in either period, use daily averages instead
    // This helps with partial periods or sparse data
    if (
      currentDayCount < timeframe * 0.5 ||
      previousDayCount < timeframe * 0.5
    ) {
      viewsChange = calculatePercentChange(currentDailyAvg, previousDailyAvg);
      uniqueChange = calculatePercentChange(
        currentUnique / currentDayCount,
        previousUnique / previousDayCount
      );
    }

    // Handle insufficient historical data by analyzing trends within current period
    if (previousPeriodViews.length === 0 && currentPeriodViews.length > 0) {
      if (currentPeriodViews.length >= 3) {
        const midPoint = Math.floor(currentPeriodViews.length / 2);
        const firstHalf = currentPeriodViews.slice(0, midPoint);
        const secondHalf = currentPeriodViews.slice(midPoint);

        const firstHalfTotal = firstHalf.reduce(
          (sum, item) => sum + item.count,
          0
        );
        const secondHalfTotal = secondHalf.reduce(
          (sum, item) => sum + item.count,
          0
        );

        // Calculate first half daily average vs second half daily average
        const firstHalfAvg = firstHalfTotal / Math.max(1, firstHalf.length);
        const secondHalfAvg = secondHalfTotal / Math.max(1, secondHalf.length);

        if (firstHalfAvg > 0) {
          viewsChange = calculatePercentChange(secondHalfAvg, firstHalfAvg);
        }
      }
    }

    // Determine data quality for confidence level
    const dataCompleteness = Math.min(
      currentPeriodViews.length / timeframe,
      previousPeriodViews.length / timeframe
    );

    // Determine trend direction based on change percentages
    let trend = "neutral";
    if (viewsChange > 5) trend = "up";
    else if (viewsChange < -5) trend = "down";

    // Determine data reliability
    let reliability = "low";
    if (dataCompleteness > 0.7 && currentPeriodViews.length > 5)
      reliability = "high";
    else if (dataCompleteness > 0.3 || currentPeriodViews.length > 3)
      reliability = "medium";

    // Calculate daily breakdown for trend visualization
    const dailyTrend = [];
    if (currentPeriodViews.length > 1) {
      // Group by day to handle cases with multiple data points per day
      const dayMap = new Map();

      for (const view of currentPeriodViews) {
        const dateKey = view.jsDate.toISOString().split("T")[0];
        const existing = dayMap.get(dateKey) || {
          count: 0,
          uniqueCount: 0,
          date: dateKey,
        };

        dayMap.set(dateKey, {
          count: existing.count + view.count,
          uniqueCount: existing.uniqueCount + view.uniqueCount,
          date: dateKey,
        });
      }

      // Convert map to array and sort by date
      dailyTrend.push(
        ...Array.from(dayMap.values()).sort((a, b) => {
          return new Date(a.date) - new Date(b.date);
        })
      );
    }

    // Detect peak day - useful for reporting
    let peakDay = null;
    if (dailyTrend.length > 0) {
      peakDay = dailyTrend.reduce(
        (max, day) => (day.count > max.count ? day : max),
        dailyTrend[0]
      );
    }

    return {
      currentViews: currentTotal,
      previousViews: previousTotal,
      viewsChange,
      currentUnique,
      previousUnique,
      uniqueChange,

      // Enhanced metrics
      currentDailyAvg: parseFloat(currentDailyAvg.toFixed(1)),
      previousDailyAvg: parseFloat(previousDailyAvg.toFixed(1)),
      dailyAverageChange: calculatePercentChange(
        currentDailyAvg,
        previousDailyAvg
      ),

      // Data quality indicators
      trend,
      reliability,
      hasSufficientData: dataCompleteness > 0.3,
      dataCompleteness: parseFloat((dataCompleteness * 100).toFixed(1)),

      // Raw data for additional calculations
      currentPeriodViews,
      previousPeriodViews,

      // Period details
      currentPeriodCount: currentPeriodViews.length,
      previousPeriodCount: previousPeriodViews.length,
      currentPeriodDays: currentDayCount,
      previousPeriodDays: previousDayCount,

      // Trend data
      dailyTrend,
      peakDay,

      // Time range info
      timeframeStart: previousPeriodStart.toISOString(),
      currentPeriodStart: currentPeriodStart.toISOString(),
      timeframeEnd: now.toISOString(),
    };
  };

  // Calculate metrics for the current timeframe
  const metrics = stats
    ? calculatePeriodMetrics(stats.dailyViews, timeframe)
    : null;

  // Calculate device distribution percentages
  const devicePercentages =
    stats?.devices?.map((device) => ({
      ...device,
      percentage: (
        (device.count / (stats?.totals?.totalViews || 1)) *
        100
      ).toFixed(1),
    })) || [];

  // Format traffic sources for better visualization
  const formattedSources =
    stats?.sources?.map((source, index) => {
      const total = stats?.totals?.totalViews || 1;
      const percentage = ((source.count / total) * 100).toFixed(1);

      // For demo purposes, simulate change data (in a real app, this would come from the API)
      const previousCount = source.count * (Math.random() * 0.5 + 0.75); // 75-125% of current value
      const change = calculateChange(source.count, previousCount);

      return {
        ...source,
        sourceName:
          source.source === "direct"
            ? "Direct Traffic"
            : source.source === "search"
            ? "Search Engines"
            : source.source === "social"
            ? "Social Media"
            : source.source === "recommendation_feed"
            ? "Recommendation Feed"
            : source.source === "recommendation_similar"
            ? "Similar Products"
            : source.source || "Unknown",
        percentage,
        change: change.toFixed(1),
        color: COLORS[index % COLORS.length],
      };
    }) || [];

  // Format insights for display
  const formattedInsights = formatInsights(stats?.insights);

  // Auto-rotate insights
  useEffect(() => {
    if (formattedInsights.length > 1) {
      const interval = setInterval(() => {
        setActiveInsight((prev) => (prev + 1) % formattedInsights.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [formattedInsights.length]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  if (loading) {
    return <DashboardLoader />;
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 backdrop-blur-sm">
        <div className="flex items-center mb-3">
          <div className="p-2 bg-red-800/50 rounded-full mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold">Error Loading Analytics</h3>
        </div>
        <p className="ml-11">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="ml-11 mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-300">
        <p className="text-center">No view data available for this product.</p>
      </div>
    );
  }

  // Card variants for animation - enhanced with more sophisticated animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
    hover: {
      y: -5,
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
  };

  return (
    <div className="relative bg-gradient-to-br from-gray-950 via-indigo-950 to-black p-6 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full filter blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full filter blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header with product info and timeframe selector */}
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <div className="flex items-center mb-2 sm:mb-0">
              <h2 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-indigo-400">
                Product Analytics
              </h2>

              {/* Growth indicator with enhanced error handling and visual feedback */}
              {metrics ? (
                metrics.viewsChange > 0 ? (
                  <div className="ml-4 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-500/20 backdrop-blur-sm flex items-center group hover:bg-green-500/30 transition-all duration-200">
                    <ArrowUpRight
                      size={14}
                      className="mr-1 group-hover:scale-110 transition-transform"
                    />
                    <span>
                      {typeof window !== 'undefined' ? Number.isFinite(metrics.viewsChange)
                        ? `${metrics.viewsChange.toFixed(1)}% growth`
                        : "Positive growth"
                        : "Positive growth"}
                      {metrics.dataQuality === "limited" && (
                        <span className="ml-1 opacity-75 text-xs">*</span>
                      )}
                    </span>
                  </div>
                ) : metrics.viewsChange < 0 ? (
                  <div className="ml-4 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-medium border border-red-500/20 backdrop-blur-sm flex items-center group hover:bg-red-500/30 transition-all duration-200">
                    <ArrowUpRight
                      size={14}
                      className="mr-1 rotate-90 group-hover:scale-110 transition-transform"
                    />
                    <span>
                      {typeof window !== 'undefined' ? Number.isFinite(metrics.viewsChange)
                        ? `${Math.abs(metrics.viewsChange).toFixed(1)}% decline`
                        : "Negative trend"
                        : "Negative trend"}
                      {metrics.dataQuality === "limited" && (
                        <span className="ml-1 opacity-75 text-xs">*</span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="ml-4 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/20 backdrop-blur-sm flex items-center">
                    <span className="block w-3 h-0.5 bg-blue-300 mr-1"></span>
                    <span>No change</span>
                  </div>
                )
              ) : (
                <div className="ml-4 px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-sm font-medium border border-gray-500/20 backdrop-blur-sm flex items-center">
                  <span className="block w-2 h-2 rounded-full bg-gray-400 mr-1 animate-pulse"></span>
                  <span>Calculating...</span>
                </div>
              )}

              {/* Data quality indicator tooltip */}
              {metrics?.dataQuality === "limited" && (
                <div className="ml-2 relative group cursor-help">
                  <div className="h-5 w-5 rounded-full flex items-center justify-center bg-amber-900/30 border border-amber-700/30 text-amber-400 text-xs">
                    !
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-900/95 border border-amber-500/20 rounded-md text-xs text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 backdrop-blur-sm">
                    Limited historical data. Growth metrics are estimated based
                    on available information.
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs px-3 py-1 rounded-md bg-indigo-900/30 text-indigo-300 border border-indigo-700/30 flex items-center">
                <span className="w-2 h-2 rounded-full bg-indigo-400 mr-1.5"></span>
                <span>Last updated: {typeof window !== 'undefined' ? new Date().toLocaleTimeString() : '---'}</span>
              </div>

              {/* Real-time toggle */}
              <div className="flex items-center px-3 py-1 rounded-md bg-indigo-900/30 text-indigo-300 border border-indigo-700/30">
                <span className="text-xs mr-2">Real-time</span>
                <button
                  onClick={() => toggleRealTimeUpdates(!realTimeEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 ${realTimeEnabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
                  role="switch"
                  aria-checked={realTimeEnabled}
                >
                  <span
                    className={`${realTimeEnabled ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                  />
                </button>
                {realTimeEnabled && (
                  <span className="ml-2 flex items-center text-xs text-green-400">
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 bg-indigo-900/30 rounded-lg p-1.5 border border-indigo-500/20">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => handleTimeframeChange(days)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    timeframe === days
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-indigo-200 hover:bg-indigo-800/40"
                  }`}
                  aria-label={`Show last ${days} days`}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Section - NEW */}
        <motion.div
          className="mb-6 overflow-hidden rounded-lg border border-indigo-500/20 bg-indigo-900/20 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center px-4 py-3 border-b border-indigo-700/30">
            <Lightbulb size={18} className="text-amber-400 mr-2" />
            <h3 className="text-white font-medium">Key Insights</h3>
            {formattedInsights.length > 0 && (
              <div className="ml-auto flex space-x-1">
                {formattedInsights.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === activeInsight
                        ? "bg-indigo-400 scale-110"
                        : "bg-indigo-700"
                    }`}
                    onClick={() => setActiveInsight(idx)}
                    aria-label={`View insight ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-4">
            {formattedInsights.length > 0 ? (
              <motion.div
                key={activeInsight}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center p-3 rounded-lg ${
                  formattedInsights[activeInsight].sentiment === "positive"
                    ? "bg-green-900/20 border border-green-700/30"
                    : formattedInsights[activeInsight].sentiment === "negative"
                    ? "bg-red-900/20 border border-red-700/30"
                    : "bg-indigo-900/20 border border-indigo-700/30"
                }`}
              >
                <div
                  className={`p-2 rounded-full mr-3 ${
                    formattedInsights[activeInsight].sentiment === "positive"
                      ? "bg-green-800/30 text-green-400"
                      : formattedInsights[activeInsight].sentiment ===
                        "negative"
                      ? "bg-red-800/30 text-red-400"
                      : "bg-indigo-800/30 text-indigo-400"
                  }`}
                >
                  {formattedInsights[activeInsight].sentiment === "positive" ? (
                    <TrendingUp size={16} />
                  ) : formattedInsights[activeInsight].sentiment ===
                    "negative" ? (
                    <ArrowUpRight size={16} className="rotate-90" />
                  ) : (
                    <Eye size={16} />
                  )}
                </div>
                <p className="text-gray-200">
                  {formattedInsights[activeInsight].text}
                </p>
              </motion.div>
            ) : (
              <p className="text-gray-400 text-center py-2">
                No insights available yet.
              </p>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Views Card */}
          <motion.div
            className="relative overflow-hidden bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-5 rounded-xl shadow-lg border border-indigo-500/20 backdrop-blur-sm group"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            role="region"
            aria-label="Total views statistics"
          >
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-indigo-500/30 rounded-full filter blur-xl group-hover:w-24 group-hover:h-24 transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-indigo-200 text-lg">
                  Total Views
                </h3>
                <div className="bg-indigo-500/30 p-2 rounded-full group-hover:bg-indigo-500/50 transition-colors duration-300">
                  <ExternalLink size={16} className="text-indigo-300" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-2 tracking-tight">
                {typeof window !== 'undefined' ? stats.totals.totalViews.toLocaleString() : stats.totals.totalViews}
              </p>
              <div className="flex items-center mt-2 text-indigo-300 text-sm">
                {metrics?.viewsChange >= 0 ? (
                  <>
                    <ArrowUpRight size={16} className="mr-1 text-green-400" />
                    <span className="text-green-400">
                      +{typeof window !== 'undefined' ? metrics.viewsChange.toFixed(1) : metrics.viewsChange}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight
                      size={16}
                      className="mr-1 rotate-90 text-red-400"
                    />
                    <span className="text-red-400">
                      {typeof window !== 'undefined' ? metrics.viewsChange.toFixed(1) : metrics.viewsChange}%
                    </span>
                  </>
                )}
                <span className="ml-1 text-indigo-300/70">
                  {" "}
                  from last period
                </span>
              </div>
            </div>
          </motion.div>

          {/* Unique Viewers Card */}
          <motion.div
            className="relative overflow-hidden bg-gradient-to-br from-blue-900/40 to-cyan-900/40 p-5 rounded-xl shadow-lg border border-blue-500/20 backdrop-blur-sm group"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ delay: 0.1 }}
            role="region"
            aria-label="Unique viewers statistics"
          >
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-blue-500/30 rounded-full filter blur-xl group-hover:w-24 group-hover:h-24 transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-blue-200 text-lg">
                  Unique Viewers
                </h3>
                <div className="bg-blue-500/30 p-2 rounded-full group-hover:bg-blue-500/50 transition-colors duration-300">
                  <Users size={16} className="text-blue-300" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-2 tracking-tight">
                {typeof window !== 'undefined' ? stats.totals.uniqueViewers.toLocaleString() : stats.totals.uniqueViewers}
              </p>
              <div className="flex items-center mt-2 text-blue-300 text-sm">
                {metrics?.uniqueChange >= 0 ? (
                  <>
                    <ArrowUpRight size={16} className="mr-1 text-green-400" />
                    <span className="text-green-400">
                      +{typeof window !== 'undefined' ? metrics.uniqueChange.toFixed(1) : metrics.uniqueChange}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight
                      size={16}
                      className="mr-1 rotate-90 text-red-400"
                    />
                    <span className="text-red-400">
                      {typeof window !== 'undefined' ? metrics.uniqueChange.toFixed(1) : metrics.uniqueChange}%
                    </span>
                  </>
                )}
                <span className="ml-1 text-blue-300/70"> from last period</span>
              </div>
            </div>
          </motion.div>

          {/* Average View Duration Card - UPDATED */}
          <motion.div
            className="relative overflow-hidden bg-gradient-to-br from-green-900/40 to-teal-900/40 p-5 rounded-xl shadow-lg border border-green-500/20 backdrop-blur-sm group"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ delay: 0.2 }}
            role="region"
            aria-label="Average view duration statistics"
          >
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-green-500/30 rounded-full filter blur-xl group-hover:w-24 group-hover:h-24 transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-green-200 text-lg">
                  Avg Duration
                </h3>
                <div className="bg-green-500/30 p-2 rounded-full group-hover:bg-green-500/50 transition-colors duration-300">
                  <Clock size={16} className="text-green-300" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-2 tracking-tight">
                {(() => {
                  const duration = typeof window !== 'undefined' ? stats.totals.avgDuration || 0 : stats.totals.avgDuration;
                  const minutes = Math.floor(duration / 60);
                  const seconds = Math.floor(duration % 60);
                  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
                })()}
              </p>
              <div className="flex items-center mt-2 text-green-300 text-sm">
                <Clock size={14} className="text-green-400 mr-1" />
                <span>
                  {(typeof window !== 'undefined' ? stats.totals.avgDuration : stats.totals.avgDuration) > 180
                    ? "High engagement time"
                    : (typeof window !== 'undefined' ? stats.totals.avgDuration : stats.totals.avgDuration) > 60
                    ? "Good engagement time"
                    : "Average engagement time"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Devices Card */}
          <motion.div
            className="relative overflow-hidden bg-gradient-to-br from-amber-900/40 to-yellow-900/40 p-5 rounded-xl shadow-lg border border-amber-500/20 backdrop-blur-sm group"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ delay: 0.3 }}
            role="region"
            aria-label="Device statistics"
          >
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-amber-500/30 rounded-full filter blur-xl group-hover:w-24 group-hover:h-24 transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-amber-200 text-lg">
                  Devices
                </h3>
                <div className="bg-amber-500/30 p-2 rounded-full group-hover:bg-amber-500/50 transition-colors duration-300">
                  <DeviceDesktop size={16} className="text-amber-300" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-2 tracking-tight">
                {typeof window !== 'undefined' ? devicePercentages.length : '---'}
              </p>
              <div className="flex items-center mt-2 text-amber-300 text-sm">
                {devicePercentages.length > 0 && (
                  <div className="flex items-center gap-1 w-full">
                    <span className="capitalize truncate max-w-[120px]">
                      {typeof window !== 'undefined' ? devicePercentages[0]?.device || "No" : '---'} leads with{" "}
                    </span>
                    <span className="font-semibold text-amber-200">
                      {typeof window !== 'undefined' ? devicePercentages[0]?.percentage || 0 : '---'}%
                    </span>
                    <div
                      className="ml-auto h-2 w-12 bg-amber-900/50 rounded-full overflow-hidden"
                      role="presentation"
                    >
                      <div
                        className="h-full bg-amber-500"
                        style={{
                          width: `${typeof window !== 'undefined' ? devicePercentages[0]?.percentage || 0 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left panel: Views Chart */}
          <motion.div
            className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-gray-900 to-indigo-950 rounded-lg shadow-lg border border-indigo-500/20 backdrop-blur-sm p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Glowing effect */}
            <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-indigo-600/20 rounded-full filter blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <h3 className="text-white font-medium">Daily Views</h3>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-indigo-900/50 rounded-md border border-indigo-700/50 overflow-hidden">
                    <button
                      onClick={() => setActiveChart("bar")}
                      className={`px-3 py-1.5 text-xs font-medium transition-all ${
                        activeChart === "bar"
                          ? "bg-indigo-600 text-white"
                          : "text-indigo-300 hover:bg-indigo-800/40"
                      }`}
                    >
                      Bar
                    </button>
                    <button
                      onClick={() => setActiveChart("area")}
                      className={`px-3 py-1.5 text-xs font-medium transition-all ${
                        activeChart === "area"
                          ? "bg-indigo-600 text-white"
                          : "text-indigo-300 hover:bg-indigo-800/40"
                      }`}
                    >
                      Area
                    </button>
                    <button
                      onClick={() => setActiveChart("combined")}
                      className={`px-3 py-1.5 text-xs font-medium transition-all ${
                        activeChart === "combined"
                          ? "bg-indigo-600 text-white"
                          : "text-indigo-300 hover:bg-indigo-800/40"
                      }`}
                    >
                      Combined
                    </button>
                  </div>

                  <div className="flex items-center bg-indigo-900/50 px-3 py-1 rounded-md text-indigo-200 text-sm border border-indigo-700/50">
                    <Calendar size={14} className="mr-1" />
                    <span>Last {timeframe} days</span>
                  </div>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {activeChart === "bar" && (
                    <BarChart
                      data={formattedDailyViews}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="viewsGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#4f46e5"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#4f46e5"
                            stopOpacity={0.2}
                          />
                        </linearGradient>
                        <linearGradient
                          id="uniqueGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#10b981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.2}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#374151"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="displayDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af" }}
                        width={30}
                      />
                      <Tooltip content={<DailyViewsTooltip />} />
                      <Legend
                        wrapperStyle={{ color: "#d1d5db", paddingTop: "10px" }}
                        formatter={(value) => (
                          <span style={{ color: "#d1d5db" }}>{typeof window !== 'undefined' ? value.toLocaleString() : value}</span>
                        )}
                      />
                      <Bar
                        dataKey="count"
                        name="Total Views"
                        radius={[4, 4, 0, 0]}
                        fill="url(#viewsGradient)"
                        animationDuration={1500}
                      />
                      <Bar
                        dataKey="uniqueCount"
                        name="Unique Views"
                        radius={[4, 4, 0, 0]}
                        fill="url(#uniqueGradient)"
                        animationDuration={1500}
                        animationBegin={300}
                      />
                    </BarChart>
                  )}

                  {activeChart === "area" && (
                    <AreaChart
                      data={formattedDailyViews}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="totalViewsGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#4f46e5"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#4f46e5"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="uniqueViewsGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#374151"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="displayDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af" }}
                        width={30}
                      />
                      <Tooltip content={<DailyViewsTooltip />} />
                      <Legend
                        wrapperStyle={{ color: "#d1d5db", paddingTop: "10px" }}
                        formatter={(value) => (
                          <span style={{ color: "#d1d5db" }}>{typeof window !== 'undefined' ? value.toLocaleString() : value}</span>
                        )}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Total Views"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fill="url(#totalViewsGradient)"
                        activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                        animationDuration={1500}
                      />
                      <Area
                        type="monotone"
                        dataKey="uniqueCount"
                        name="Unique Views"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#uniqueViewsGradient)"
                        activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                        animationDuration={1500}
                        animationBegin={300}
                      />
                    </AreaChart>
                  )}

                  {activeChart === "combined" && (
                    <ComposedChart
                      data={formattedDailyViews}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="uniqueAreaGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#374151"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="displayDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af" }}
                        width={30}
                      />
                      <Tooltip content={<DailyViewsTooltip />} />
                      <Legend
                        wrapperStyle={{ color: "#d1d5db", paddingTop: "10px" }}
                        formatter={(value) => (
                          <span style={{ color: "#d1d5db" }}>{typeof window !== 'undefined' ? value.toLocaleString() : value}</span>
                        )}
                      />
                      <Bar
                        dataKey="count"
                        name="Total Views"
                        fill="#4f46e5"
                        radius={[4, 4, 0, 0]}
                        fillOpacity={0.7}
                        animationDuration={1500}
                      />
                      <Area
                        type="monotone"
                        dataKey="uniqueCount"
                        name="Unique Views"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#uniqueAreaGradient)"
                        activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                        animationDuration={1500}
                        animationBegin={300}
                      />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Interactive hint for better UX */}
              <div className="mt-2 text-xs text-indigo-300/70 flex items-center">
                <span className="mr-1">💡</span>
                <span>
                  Tip: Hover over the chart for details or try different chart
                  types
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right panel: Device Distribution */}
          <motion.div
            className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-indigo-950 rounded-lg shadow-lg border border-indigo-500/20 backdrop-blur-sm p-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Glowing effect */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full filter blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <DeviceDesktop size={18} className="text-blue-400" />
                  <h3 className="text-white font-medium">
                    Device Distribution
                  </h3>
                </div>
                <div className="text-xs bg-blue-900/30 text-blue-300 rounded-full px-2 py-0.5 border border-blue-700/30">
                  {typeof window !== 'undefined' ? devicePercentages.length : '---'} types
                </div>
              </div>

              <div className="h-72 flex flex-col justify-center">
                {devicePercentages.length > 0 ? (
                  <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                      <defs>
                        {COLORS.map((color, index) => (
                          <linearGradient
                            key={`gradient-${index}`}
                            id={`pieGradient${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={color}
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="95%"
                              stopColor={color}
                              stopOpacity={0.7}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={devicePercentages}
                        dataKey="count"
                        nameKey="device"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={80}
                        paddingAngle={4}
                        fill="#8884d8"
                        animationDuration={1500}
                        animationBegin={300}
                        label={({ device, percentage }) =>
                          `${typeof window !== 'undefined' ? device : '---'} (${typeof window !== 'undefined' ? percentage : '---'}%)`
                        }
                        labelLine={{
                          stroke: "rgba(255, 255, 255, 0.3)",
                          strokeWidth: 1,
                        }}
                      >
                        {devicePercentages.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#pieGradient${index % COLORS.length})`}
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => {
                          const percentage = props.payload.percentage;
                          return [
                            `${typeof window !== 'undefined' ? value.toLocaleString() : value} (${typeof window !== 'undefined' ? percentage : percentage}%)`,
                            name,
                          ];
                        }}
                        contentStyle={{
                          backgroundColor: "rgba(17, 24, 39, 0.8)",
                          borderRadius: "8px",
                          border: "1px solid rgba(79, 70, 229, 0.2)",
                          backdropFilter: "blur(4px)",
                          color: "#f3f4f6",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-400">
                    <DeviceDesktop
                      size={48}
                      className="mx-auto mb-3 text-gray-500"
                    />
                    <p>No device data available</p>
                  </div>
                )}

                <div className="space-y-1 mt-3 max-h-28 overflow-y-auto pr-1 hide-scrollbar">
                  {devicePercentages.map((entry, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-indigo-900/20 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center">
                        <div
                          className="w-2.5 h-2.5 rounded-full mr-2"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <span className="text-gray-300 text-sm capitalize">
                          {typeof window !== 'undefined' ? entry.device : '---'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 text-sm">
                          {typeof window !== 'undefined' ? entry.count : '---'}
                        </span>
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/30">
                          {typeof window !== 'undefined' ? entry.percentage : '---'}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Traffic Sources section */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-indigo-950 rounded-lg shadow-lg border border-indigo-500/20 backdrop-blur-sm p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="absolute top-10 right-10 w-40 h-40 bg-purple-600/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-indigo-600/10 rounded-full filter blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <ExternalLink size={18} className="text-purple-400 mr-2" />
                <h3 className="font-semibold text-white">Traffic Sources</h3>
              </div>
              <div className="text-xs bg-purple-900/30 text-purple-300 rounded-full px-3 py-1 border border-purple-700/30">
                {typeof window !== 'undefined' ? formattedSources.length : '---'} sources
              </div>
            </div>

            {formattedSources.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left side - Table with improved visuals */}
                <div className="overflow-x-auto hide-scrollbar rounded-lg border border-indigo-800/20 bg-indigo-900/10">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase border-b border-gray-800">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Source
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Visitors
                        </th>
                        <th scope="col" className="px-4 py-3">
                          % of total
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Change
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {formattedSources.map((source, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-800 hover:bg-indigo-900/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-white">
                            <div className="flex items-center">
                              <div
                                className="w-2 h-2 rounded-full mr-2"
                                style={{
                                  backgroundColor: source.color,
                                }}
                              ></div>
                              {typeof window !== 'undefined' ? source.sourceName : '---'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {typeof window !== 'undefined' ? source.count.toLocaleString() : source.count}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="w-16 bg-indigo-900/40 rounded-full h-1.5 mr-2">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{
                                    backgroundColor: source.color,
                                  }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${typeof window !== 'undefined' ? source.percentage : 0}%` }}
                                  transition={{
                                    duration: 1,
                                    delay: 0.5 + index * 0.1,
                                  }}
                                ></motion.div>
                              </div>
                              <span>{typeof window !== 'undefined' ? source.percentage : 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {typeof window !== 'undefined' ? (parseFloat(source.change) > 0 ? (
                              <div className="flex items-center text-green-400">
                                <ArrowUpRight size={14} className="mr-1" />
                                {source.change}%
                              </div>
                            ) : parseFloat(source.change) < 0 ? (
                              <div className="flex items-center text-red-400">
                                <ArrowUpRight
                                  size={14}
                                  className="mr-1 rotate-90"
                                />
                                {Math.abs(parseFloat(source.change))}%
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-400">
                                <div className="w-4 mr-1 h-0.5 bg-gray-500"></div>
                                0%
                              </div>
                            )) : (
                              <div className="flex items-center text-gray-400">
                                <div className="w-4 mr-1 h-0.5 bg-gray-500"></div>
                                0%
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Right side - Chart visualization */}
                <div className="bg-indigo-900/10 rounded-lg border border-indigo-800/20 p-3">
                  <h4 className="text-sm text-indigo-300 mb-3 font-medium">
                    Source Distribution
                  </h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {COLORS.map((color, index) => (
                            <linearGradient
                              key={`sourceGradient-${index}`}
                              id={`sourceGradient${index}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={color}
                                stopOpacity={0.9}
                              />
                              <stop
                                offset="95%"
                                stopColor={color}
                                stopOpacity={0.7}
                              />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={formattedSources}
                          dataKey="count"
                          nameKey="sourceName"
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={70}
                          paddingAngle={4}
                          fill="#8884d8"
                          animationDuration={1500}
                          animationBegin={300}
                          label={(entry) =>
                            `${typeof window !== 'undefined' ? entry.sourceName.substring(0, 8) : '---'}${
                              typeof window !== 'undefined' && entry.sourceName.length > 8 ? "..." : ""
                            }`
                          }
                          labelLine={{
                            stroke: "rgba(255, 255, 255, 0.2)",
                            strokeWidth: 1,
                          }}
                        >
                          {formattedSources.map((entry, index) => (
                            <Cell
                              key={`sourceCell-${index}`}
                              fill={`url(#sourceGradient${
                                index % COLORS.length
                              })`}
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth={1}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => {
                            const percentage = props.payload.percentage;
                            return [
                              `${typeof window !== 'undefined' ? value.toLocaleString() : value} (${typeof window !== 'undefined' ? percentage : percentage}%)`,
                              props.payload.sourceName,
                            ];
                          }}
                          contentStyle={{
                            backgroundColor: "rgba(17, 24, 39, 0.8)",
                            borderRadius: "8px",
                            border: "1px solid rgba(79, 70, 229, 0.2)",
                            backdropFilter: "blur(4px)",
                            color: "#f3f4f6",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Insights panel */}
                  {formattedSources.length > 0 && (
                    <div className="mt-3 bg-indigo-950/50 p-2 rounded border border-indigo-900/30 text-xs text-indigo-300/80">
                      <div className="flex items-start">
                        <div className="bg-indigo-700/20 p-1 rounded mr-2 mt-0.5">
                          <Lightbulb size={14} className="text-amber-400" />
                        </div>
                        <p>
                          {typeof window !== 'undefined' ? (formattedSources[0].source === "direct"
                            ? `Most traffic comes directly (${formattedSources[0].percentage}%). Consider adding UTM parameters to better track your traffic sources.`
                            : `Most traffic comes from "${
                                formattedSources[0].sourceName
                              }" (${formattedSources[0].percentage}%). ${
                                parseFloat(formattedSources[0].change) > 5
                                  ? "This source is growing rapidly."
                                  : parseFloat(formattedSources[0].change) < -5
                                  ? "This source is declining."
                                  : "This source is stable."
                              }`) : 'Most traffic comes directly (0%). Consider adding UTM parameters to better track your traffic sources.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <ExternalLink size={40} className="mb-3 text-gray-500" />
                <p>No referrer data available</p>
                <p className="text-sm mt-2 text-gray-500">
                  When visitors arrive from external sites, they'll appear here
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Add custom scrollbar styles to global CSS
const styleElement =
  typeof document !== "undefined" && document.createElement("style");
if (styleElement) {
  styleElement.textContent = `
    .hide-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(79, 70, 229, 0.3) transparent;
    }
    .hide-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .hide-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .hide-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(79, 70, 229, 0.3);
      border-radius: 20px;
    }
  `;
  typeof document !== "undefined" && document.head.appendChild(styleElement);
}

export default ViewsAnalyticsDashboard;
