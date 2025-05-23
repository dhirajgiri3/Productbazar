"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BarChart2, 
  TrendingUp, 
  Eye, 
  ThumbsUp, 
  Share2, 
  MousePointer, 
  Calendar, 
  ArrowLeft,
  Users,
  MessageSquare
} from "lucide-react";
import { useProject } from "@/lib/contexts/project-context";
import { useAuth } from "@/lib/contexts/auth-context";
import LoaderComponent from "../../../../Components/UI/LoaderComponent";
import { toast } from "react-hot-toast";
import logger from "@/lib/utils/logger";

const ProjectAnalyticsPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { 
    currentProject, 
    loading, 
    error, 
    fetchProjectBySlug,
    getProjectAnalytics
  } = useProject();
  
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30days"); // 7days, 30days, 90days, all

  useEffect(() => {
    if (slug) {
      fetchProjectBySlug(slug);
    }
  }, [slug, fetchProjectBySlug]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (currentProject && currentProject._id) {
        setAnalyticsLoading(true);
        try {
          const analyticsData = await getProjectAnalytics(currentProject._id);
          if (analyticsData) {
            setAnalytics(analyticsData);
          } else {
            toast.error("Failed to load analytics data");
          }
        } catch (error) {
          logger.error("Error fetching project analytics:", error);
          toast.error("Failed to load analytics data");
        } finally {
          setAnalyticsLoading(false);
        }
      }
    };

    fetchAnalytics();
  }, [currentProject, getProjectAnalytics]);

  const canViewAnalytics = () => {
    if (!isAuthenticated || !currentProject) return false;
    
    // Check if user is owner
    const isOwner = currentProject.owner === user._id;
    
    // Check if user is collaborator with edit permissions
    const isCollaborator = currentProject.collaborators?.some(
      collab => collab.user === user._id && (collab.role === 'owner' || collab.permissions?.canEdit)
    );
    
    return isOwner || isCollaborator;
  };

  if (loading || analyticsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderComponent size="large" />
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h1>
        <p className="text-gray-600 mb-6">
          The project you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => router.push("/projects")}
          className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors"
        >
          Browse Projects
        </button>
      </div>
    );
  }

  if (!canViewAnalytics()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to view analytics for this project.
        </p>
        <button
          onClick={() => router.push(`/projects/${slug}`)}
          className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors"
        >
          Back to Project
        </button>
      </div>
    );
  }

  return (
    <>

      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push(`/projects/${slug}`)}
              className="flex items-center text-gray-600 hover:text-violet-600 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Project
            </button>
          </div>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  <BarChart2 size={24} className="mr-2 text-violet-600" />
                  Analytics for {currentProject.title}
                </h1>
                <p className="text-gray-600">
                  Track performance and engagement metrics for your project
                </p>
              </div>
              
              {/* Time Range Selector */}
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setTimeRange("7days")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    timeRange === "7days" 
                      ? "bg-white text-violet-700 shadow-sm" 
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimeRange("30days")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    timeRange === "30days" 
                      ? "bg-white text-violet-700 shadow-sm" 
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  30 Days
                </button>
                <button
                  onClick={() => setTimeRange("90days")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    timeRange === "90days" 
                      ? "bg-white text-violet-700 shadow-sm" 
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  90 Days
                </button>
                <button
                  onClick={() => setTimeRange("all")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    timeRange === "all" 
                      ? "bg-white text-violet-700 shadow-sm" 
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Views */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Views</h2>
                <div className="p-2 bg-blue-50 rounded-full">
                  <Eye size={20} className="text-blue-500" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics?.summary?.views || 0}
                  </p>
                  <p className="text-sm text-gray-500">Total views</p>
                </div>
                <div className="flex items-center text-green-500 text-sm">
                  <TrendingUp size={16} className="mr-1" />
                  <span>+12%</span>
                </div>
              </div>
            </motion.div>

            {/* Likes */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Likes</h2>
                <div className="p-2 bg-red-50 rounded-full">
                  <ThumbsUp size={20} className="text-red-500" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics?.summary?.likes || 0}
                  </p>
                  <p className="text-sm text-gray-500">Total likes</p>
                </div>
                <div className="flex items-center text-green-500 text-sm">
                  <TrendingUp size={16} className="mr-1" />
                  <span>+5%</span>
                </div>
              </div>
            </motion.div>

            {/* Shares */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Shares</h2>
                <div className="p-2 bg-green-50 rounded-full">
                  <Share2 size={20} className="text-green-500" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics?.summary?.shares || 0}
                  </p>
                  <p className="text-sm text-gray-500">Total shares</p>
                </div>
                <div className="flex items-center text-green-500 text-sm">
                  <TrendingUp size={16} className="mr-1" />
                  <span>+8%</span>
                </div>
              </div>
            </motion.div>

            {/* Clicks */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Clicks</h2>
                <div className="p-2 bg-purple-50 rounded-full">
                  <MousePointer size={20} className="text-purple-500" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics?.summary?.clicks || 0}
                  </p>
                  <p className="text-sm text-gray-500">Total clicks</p>
                </div>
                <div className="flex items-center text-green-500 text-sm">
                  <TrendingUp size={16} className="mr-1" />
                  <span>+15%</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Engagement Rate */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Engagement Rate</h2>
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <p className="text-4xl font-bold text-violet-600">
                    {analytics?.engagementRate || "0%"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Percentage of views that resulted in likes, comments, or shares
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Click Targets */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Click Targets</h2>
              {!analytics?.clickTargets || Object.keys(analytics.clickTargets).length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  No click data available
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(analytics.clickTargets).map(([target, count]) => (
                    <div key={target} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MousePointer size={16} className="mr-2 text-gray-400" />
                        <span className="text-gray-700">
                          {target === "projectUrl" ? "Live Project" : 
                           target === "repositoryUrl" ? "Repository" : 
                           target === "clientWebsite" ? "Client Website" : target}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Share Platforms */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Share Platforms</h2>
              {!analytics?.sharePlatforms || Object.keys(analytics.sharePlatforms).length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  No share data available
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(analytics.sharePlatforms).map(([platform, count]) => (
                    <div key={platform} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Share2 size={16} className="mr-2 text-gray-400" />
                        <span className="text-gray-700">
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Comments */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Comments</h2>
                <MessageSquare size={20} className="text-gray-400" />
              </div>
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">
                    {analytics?.summary?.commentCount || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Total comments on this project
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Collaborators */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Collaborators</h2>
                <Users size={20} className="text-gray-400" />
              </div>
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">
                    {analytics?.summary?.collaboratorCount || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    People collaborating on this project
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectAnalyticsPage;
