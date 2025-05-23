"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiSettings,
  FiShield,
  FiBell,
  FiKey,
  FiUserPlus,
  FiUsers,
  FiChevronRight,
  FiLoader,
  FiAlertTriangle,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/lib/contexts/auth-context";
import RoleManagement from "./Components/RoleManagement";
import ProfileSettings from "./Components/ProfileSettings";
import NotificationSettings from "./Components/NotificationSettings";
import PrivacySettings from "./Components/PrivacySettings";
import SecuritySettings from "./Components/SecuritySettings";
import LoaderComponent from "../../../Components/UI/LoaderComponent";

const SettingsPage = () => {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // Check screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // Settings navigation items
  const navItems = [
    { id: "profile", label: "Profile Settings", icon: <FiUser /> },
    { id: "notifications", label: "Notifications", icon: <FiBell /> },
    { id: "privacy", label: "Privacy", icon: <FiShield /> },
    { id: "security", label: "Security", icon: <FiKey /> },
  ];

  // Add role management for admins
  if (user?.role === "admin") {
    navItems.push({ id: "roles", label: "Role Management", icon: <FiUsers /> });
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoaderComponent
          type="wave"
          size="large"
          color="violet"
          text="Loading your settings..."
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <FiAlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to access your settings.
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account preferences and settings
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile Menu Toggle */}
          {isMobile && (
            <div className="bg-white rounded-xl p-4 mb-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="flex items-center justify-between w-full"
              >
                <span className="flex items-center">
                  {navItems.find((item) => item.id === activeTab)?.icon}
                  <span className="ml-3 font-medium">
                    {navItems.find((item) => item.id === activeTab)?.label}
                  </span>
                </span>
                <FiChevronRight
                  className={`transition-transform ${
                    showMobileMenu ? "rotate-90" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showMobileMenu && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="flex flex-col space-y-1">
                      {navItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setShowMobileMenu(false);
                          }}
                          className={`flex items-center px-3 py-2 rounded-md text-left ${
                            activeTab === item.id
                              ? "bg-violet-50 text-violet-600"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {item.icon}
                          <span className="ml-3">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Desktop Navigation */}
          {!isMobile && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-64 flex-shrink-0 relative"
            >
              <div className="sticky top-20 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="flex flex-col space-y-2 p-4 max-h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar">
                  {navItems.map((item) => (
                    <motion.button
                      key={item.id}
                      variants={itemVariants}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeTab === item.id
                          ? "bg-violet-50 text-violet-600 shadow-sm border-l-2 border-violet-600"
                          : "text-gray-700 hover:bg-gray-50 hover:translate-x-1"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className={`${activeTab === item.id ? "text-violet-600" : "text-gray-500"}`}>
                        {item.icon}
                      </span>
                      <span className="ml-3 font-medium">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Content Area */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-xl p-6">
              <AnimatePresence mode="wait">
                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProfileSettings user={user} />
                  </motion.div>
                )}

                {activeTab === "notifications" && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <NotificationSettings user={user} />
                  </motion.div>
                )}

                {activeTab === "privacy" && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PrivacySettings user={user} />
                  </motion.div>
                )}

                {activeTab === "security" && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SecuritySettings user={user} />
                  </motion.div>
                )}

                {activeTab === "roles" && user?.role === "admin" && (
                  <motion.div
                    key="roles"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RoleManagement />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
