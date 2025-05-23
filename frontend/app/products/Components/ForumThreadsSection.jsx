"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight, Users, Clock, Tag } from 'lucide-react';

// Sample data function to avoid duplication
const getSampleThreads = () => [
  {
    id: 1,
    title: "Best tools for startup founders in 2025?",
    commentCount: 24,
    author: "Jessica Chen",
    category: "Tools",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    title: "How do you validate your product idea?",
    commentCount: 18,
    author: "Mike Johnson",
    category: "Strategy",
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 3,
    title: "Looking for feedback on my new AI app",
    commentCount: 12,
    author: "Sarah Smith",
    category: "Feedback",
    createdAt: new Date(Date.now() - 10800000).toISOString()
  }
];

const ForumThreadsSection = () => {
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      setIsLoading(true);
      try {
        // Check if we're in development mode and use sample data directly
        // This prevents unnecessary 404 errors when the API endpoint doesn't exist yet
        if (process.env.NODE_ENV === 'development') {
          // Use sample data directly in development
          setTimeout(() => {
            setThreads(getSampleThreads());
            setIsLoading(false);
          }, 500); // Simulate network delay
          return;
        }

        // In production, try to fetch from the API
        try {
          const response = await fetch('/api/forum/trending-threads');
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);
          const data = await response.json();
          setThreads(data.threads || []);
        } catch (apiError) {
          console.error("Failed to fetch forum threads:", apiError);
          // Fallback to sample data
          setThreads(getSampleThreads());
        }
      } catch (error) {
        console.error("Error in thread fetching:", error);
        // Fallback to sample data
        setThreads(getSampleThreads());
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, []);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    return `${diffDay} days ago`;
  };

  return (
    <motion.section
      className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 w-10 h-10 rounded-xl mr-3 flex items-center justify-center shadow-md text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Active Discussions</h2>
          </div>
          <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}>
            <Link href="/forum" className="text-violet-600 hover:text-violet-800 text-sm font-medium flex items-center bg-violet-50 px-3 py-1.5 rounded-lg transition-colors">
              View All <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 border-b border-gray-100 last:border-0">
              <div className="h-5 bg-gray-200 rounded-full w-3/4 mb-3"></div>
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded-full w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded-full w-1/5"></div>
              </div>
            </div>
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500 font-medium">No active discussions yet.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          {threads.map((thread, index) => (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                href={`/forum/thread/${thread.id}`}
                className="block p-5 border-b border-gray-100 last:border-b-0 hover:bg-violet-50/30 transition-colors duration-200 group"
              >
                <h3 className="font-medium text-gray-900 mb-3 line-clamp-1 group-hover:text-violet-700 transition-colors">{thread.title}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      <Tag className="w-3 h-3 mr-1.5" />
                      {thread.category}
                    </span>
                    <span className="flex items-center text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                      <Users className="w-3 h-3 mr-1.5" />
                      {thread.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="flex items-center bg-gray-50 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3 mr-1.5" />
                      {formatTimeAgo(thread.createdAt)}
                    </span>
                    <span className="flex items-center bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                      <MessageSquare className="w-3 h-3 mr-1.5" />
                      {thread.commentCount}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.section>
  );
};

export default ForumThreadsSection;