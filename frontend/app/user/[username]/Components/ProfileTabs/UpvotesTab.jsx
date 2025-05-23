// src/components/ProfileTabs/UpvotesTab.jsx

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import logger from "@/lib/utils/logger";
import Link from "next/link";
import { makePriorityRequest } from "@/lib/api/api";
import { FiArrowUp, FiArrowDown, FiMinus, FiAward, FiTrendingUp, FiBarChart2, FiStar, FiClock, FiPackage, FiInfo } from "react-icons/fi";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const UpvotesTab = ({ upvotes = 0 }) => {
  const { user } = useAuth();
  // Ensure upvotes is a number, not an object
  const upvotesCount = typeof upvotes === 'object' ? upvotes.count || 0 : upvotes;

  const [upvoteData, setUpvoteData] = useState({
    receivedUpvotes: upvotesCount,
    insights: null,
    loading: true,
    error: null
  });

  // Extract values from upvoteData for easier access
  const { receivedUpvotes, insights, loading, error } = upvoteData;

  // Update receivedUpvotes when upvotes prop changes
  useEffect(() => {
    // Ensure upvotes is a number, not an object
    const upvotesCount = typeof upvotes === 'object' ? upvotes.count || 0 : upvotes;
    setUpvoteData(prev => ({ ...prev, receivedUpvotes: upvotesCount }));
  }, [upvotes]);

  useEffect(() => {
    const fetchUpvoteInsights = async () => {
      if (!user?._id) return;

      try {
        setUpvoteData(prev => ({ ...prev, loading: true, error: null }));

        // Fetch upvote insights from the API
        const response = await makePriorityRequest('get', `/users/${user._id}/interactions`);

        if (response.data.success) {
          // Ensure receivedUpvoteCount is a number, not an object
          const receivedCount = response.data.receivedUpvoteCount || 0;
          const upvotesCount = typeof receivedCount === 'object' ? receivedCount.count || 0 : receivedCount;

          setUpvoteData({
            receivedUpvotes: upvotesCount,
            insights: response.data.insights || null,
            loading: false,
            error: null
          });
          logger.info(`Received upvotes: ${upvotesCount}`);
        }
      } catch (error) {
        logger.error('Failed to fetch upvote insights:', error);
        setUpvoteData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load upvote data. Please try again.'
        }));
      }
    };

    fetchUpvoteInsights();
  }, [user]);

  // Prepare chart data for the bar chart
  const chartData = useMemo(() => {
    if (!insights?.chartData) return [];
    return insights.chartData;
  }, [insights?.chartData]);

  // Get trend icon based on weekly change
  const getTrendIcon = () => {
    if (!insights?.weekly) return <FiMinus className="text-gray-400" />;

    const { trend } = insights.weekly;

    if (trend === 'up') return <FiArrowUp className="text-green-500" />;
    if (trend === 'down') return <FiArrowDown className="text-red-500" />;
    return <FiMinus className="text-gray-400" />;
  };
  // Loading state
  if (loading) {
    return (
      <motion.div
        className="bg-white/90 backdrop-blur-sm flex items-center justify-center"
        style={{ minHeight: '400px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full bg-violet-100 flex items-center justify-center">
              <FiBarChart2 className="w-6 h-6 text-violet-600" />
            </div>
          </div>
          <p className="text-gray-600">Loading upvote insights...</p>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        className="bg-white/90 backdrop-blur-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <FiBarChart2 className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Upvote Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white/90 backdrop-blur-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <FiArrowUp className="w-6 h-6 text-violet-500" />
          Upvotes
        </h2>

        {/* Stats Summary */}
        <div className="text-right flex items-center gap-2">
          <div>
            <p className="text-sm text-gray-500">This week</p>
            <p className="font-semibold text-violet-600 flex items-center justify-end gap-1">
              {insights?.weekly ? (
                <>
                  {getTrendIcon()}
                  <span>{insights.weekly.current > 0 ? `+${insights.weekly.current}` : '0'}</span>
                </>
              ) : (
                '+0'
              )}
            </p>
          </div>
          <div className="w-10 h-10 bg-violet-50 rounded-full flex items-center justify-center">
            <FiTrendingUp className="w-5 h-5 text-violet-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col py-6">
        {/* Total Upvotes Card with Animation */}
        <motion.div
          className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl overflow-hidden mb-8 text-white relative"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <rect width="50" height="50" fill="url(#smallGrid)" />
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-violet-100 text-sm">Total Upvotes Received</p>
                  <div className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                    Lifetime
                  </div>
                </div>
                <div className="flex items-baseline gap-3 mt-2">
                  <motion.div
                    className="text-5xl font-bold"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    {receivedUpvotes}
                  </motion.div>
                  {insights?.weekly?.change !== 0 && (
                    <motion.div
                      className={`text-sm font-medium px-2 py-1 rounded-full flex items-center gap-1 ${insights?.weekly?.trend === 'up' ? 'bg-green-500/20 text-green-100' : insights?.weekly?.trend === 'down' ? 'bg-red-500/20 text-red-100' : 'bg-white/10 text-white/80'}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {insights?.weekly?.trend === 'up' ? (
                        <>
                          <FiArrowUp />
                          <span>+{insights.weekly.change}%</span>
                        </>
                      ) : insights?.weekly?.trend === 'down' ? (
                        <>
                          <FiArrowDown />
                          <span>-{Math.abs(insights.weekly.change)}%</span>
                        </>
                      ) : (
                        <>
                          <FiMinus />
                          <span>0%</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
                <p className="text-violet-100 text-sm mt-3">
                  {insights?.weekly?.current || 0} new upvotes this week
                </p>
              </div>
              <motion.div
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                whileHover={{ rotate: 15, scale: 1.05 }}
              >
                <FiArrowUp className="w-5 h-5 text-white" />
              </motion.div>
            </div>

            {/* Mini chart at the bottom */}
            {chartData.length > 0 && (
              <div className="h-16 mt-4 -mb-2 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorMiniChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#ffffff"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMiniChart)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Empty State Message */}
        {receivedUpvotes === 0 ? (
          <motion.div
            className="mt-6 text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-violet-50 rounded-full flex items-center justify-center">
              <FiStar className="w-10 h-10 text-violet-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Start Your Upvote Journey</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Share your innovative products with our community! Each upvote is a token of appreciation from fellow
              creators and users. The more upvotes you receive, the higher your products will rank.
            </p>
            <Link href="/product/new">
              <button className="px-6 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-all">
                Share Your First Product
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="w-full">
            {/* Upvote Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div
                className="bg-white p-5 rounded-xl border border-gray-100 transition-all duration-300"
                whileHover={{ y: -5}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Ranking</p>
                    <p className="font-medium text-gray-900 text-lg mt-1">
                      {insights?.ranking?.percentile || 'Emerging'}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <FiAward className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white p-5 rounded-xl border border-gray-100 transition-all duration-300"
                whileHover={{ y: -5}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Achievement</p>
                    <p className="font-medium text-gray-900 text-lg mt-1">
                      {insights?.achievement?.badge || 'Newcomer'}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <FiStar className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white p-5 rounded-xl border border-gray-100 transition-all duration-300"
                whileHover={{ y: -5}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Streak</p>
                    <p className="font-medium text-gray-900 text-lg mt-1">
                      {insights?.streak || 0} Days
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                    <FiClock className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Weekly Upvote Chart */}
            <motion.div
              className="bg-white p-6 rounded-xl border border-violet-100 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-900">Weekly Upvote Trend</h3>
                  <motion.div
                    className="relative group"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FiInfo className="w-4 h-4 text-violet-400 cursor-help" />
                    <div className="absolute left-0 -top-1 transform -translate-y-full w-48 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      Shows your upvote activity over the past week
                    </div>
                  </motion.div>
                </div>
                <div className="text-sm text-violet-600 font-medium bg-violet-50 px-3 py-1 rounded-full">
                  Last 7 days
                </div>
              </div>

              <div className="h-72">
                {chartData.length > 0 ? (
                  <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="colorUpvotes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          allowDecimals={false}
                          dx={-10}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            padding: '0.5rem'
                          }}
                          itemStyle={{ color: '#4b5563' }}
                          labelStyle={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#1f2937' }}
                          formatter={(value) => [`${value} upvote${value !== 1 ? 's' : ''}`, 'Received']}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorUpvotes)"
                          activeDot={{
                            r: 6,
                            stroke: '#8b5cf6',
                            strokeWidth: 2,
                            fill: '#ffffff'
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-violet-50/30 rounded-lg border border-violet-100">
                    <div className="w-16 h-16 mb-4 bg-violet-100 rounded-full flex items-center justify-center">
                      <FiBarChart2 className="w-8 h-8 text-violet-500" />
                    </div>
                    <p className="text-gray-600 text-sm font-medium">No upvote data available</p>
                    <p className="text-gray-500 text-xs mt-1">Start receiving upvotes to see your trend</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Top Products Section */}
            {insights?.topProducts && insights.topProducts.length > 0 && (
              <motion.div
                className="bg-white p-6 rounded-xl border border-violet-100 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-gray-900">Top Upvoted Products</h3>
                    <motion.div
                      className="relative group"
                      whileHover={{ scale: 1.05 }}
                    >
                      <FiInfo className="w-4 h-4 text-violet-400 cursor-help" />
                      <div className="absolute left-0 -top-1 transform -translate-y-full w-48 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        Your most popular products based on upvotes
                      </div>
                    </motion.div>
                  </div>
                  <div className="text-sm text-violet-600 font-medium bg-violet-50 px-3 py-1 rounded-full flex items-center gap-1">
                    <FiPackage className="w-3.5 h-3.5" />
                    <span>{insights.topProducts.length} Products</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {insights.topProducts.map((product, index) => {
                    // Calculate percentage of total upvotes for progress bar
                    const maxUpvotes = Math.max(...insights.topProducts.map(p => p.upvoteCount));
                    const percentage = Math.max(5, Math.round((product.upvoteCount / maxUpvotes) * 100));

                    return (
                      <motion.div
                        key={product.productId}
                        className="flex items-center justify-between p-4 rounded-lg border border-violet-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + (index * 0.05) }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/product/${product.productSlug}`}>
                              <span className="font-medium text-gray-900 hover:text-violet-700 transition-colors line-clamp-1">
                                {product.productName}
                              </span>
                            </Link>
                            <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className="h-full bg-violet-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: 0.8 + (index * 0.05), duration: 0.5 }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm bg-violet-50 px-2 py-1 rounded-full">
                          <FiArrowUp className="text-violet-600" />
                          <span className="font-medium text-violet-700">{product.upvoteCount}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Progress Bar */}
            <motion.div
              className="bg-white p-6 rounded-xl border border-violet-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Level Progress</h3>
                <div className="px-3 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full">
                  Level {insights?.achievement?.level || 0}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Next Level</span>
                  <span className="text-gray-700 font-medium">
                    {receivedUpvotes}/{insights?.achievement?.nextMilestone || 50} upvotes
                  </span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-violet-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${insights?.achievement?.progressPercentage || 0}%` }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {insights?.achievement?.remaining || 50} more upvotes to reach level {(insights?.achievement?.level || 0) + 1}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Keep creating amazing products to earn more upvotes and unlock higher levels!
                </p>
                <Link href="/product/new">
                  <button className="px-5 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-violet-600 hover:to-violet-700 transition-all inline-flex items-center gap-2 shadow-sm">
                    <FiPackage className="w-4 h-4" />
                    Create New Product
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UpvotesTab;
