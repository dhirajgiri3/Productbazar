import { useRef, useState, useEffect } from "react";
import {
  motion,
  useInView,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import GlobalButton from "../../UI/Buttons/GlobalButton";
import { useTheme } from "@/lib/contexts/theme-context";
import SectionLabel from "./Animations/SectionLabel";

export default function FeaturesSection({ onHover, onLeave }) {
  const ref = useRef(null);
  const headerRef = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.1 });
  const isHeaderInView = useInView(headerRef, { once: false, amount: 0.2 });
  const [activeTab, setActiveTab] = useState("all");
  const [previousTab, setPreviousTab] = useState(null);
  const { isDarkMode } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const features = [
    {
      id: "launch",
      icon: (
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
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Launch Products",
      description:
        "Showcase your innovations to our community of early adopters, enthusiasts, and investors.",
      category: "product",
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      borderColor: "border-violet-200",
      gradientFrom: "from-violet-400",
      gradientTo: "to-violet-600",
      row: 1,
      size: "large",
      badge: "Popular",
      badgeColor: "bg-violet-600",
      stats: { users: 2345, growth: "+24%" },
      cta: "Get Started",
    },
    {
      id: "discover",
      icon: (
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
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      title: "Discover Innovations",
      description:
        "Find the latest products across various categories with smart recommendations.",
      category: "product",
      color: "text-fuchsia-600",
      bgColor: "bg-fuchsia-50",
      borderColor: "border-fuchsia-200",
      gradientFrom: "from-fuchsia-400",
      gradientTo: "to-fuchsia-600",
      row: 1,
      size: "large",
      badge: "Trending",
      badgeColor: "bg-fuchsia-600",
      stats: { products: 5280, new: 128 },
      cta: "Explore",
    },
    {
      id: "feedback",
      icon: (
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
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      title: "Provide Feedback",
      description:
        "Comment on products and help makers improve with your valuable insights.",
      category: "community",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      gradientFrom: "from-pink-400",
      gradientTo: "to-pink-600",
      row: 2,
      size: "small",
      badge: "Active",
      badgeColor: "bg-pink-600",
      stats: { comments: 12950 },
      cta: "Comment",
    },
    {
      id: "upvote",
      icon: (
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
            strokeWidth={1.5}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
      ),
      title: "Upvote & Bookmark",
      description:
        "Support products you love by upvoting, increasing their visibility.",
      category: "community",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      gradientFrom: "from-rose-400",
      gradientTo: "to-rose-600",
      row: 2,
      size: "small",
      badge: "Hot",
      badgeColor: "bg-rose-600",
      stats: { upvotes: 45680 },
      cta: "Upvote",
    },
    {
      id: "connect",
      icon: (
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
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: "Connect with Makers",
      description:
        "Build relationships with innovative creators and collaborate on projects.",
      category: "community",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      gradientFrom: "from-red-400",
      gradientTo: "to-red-600",
      row: 2,
      size: "small",
      badge: "Network",
      badgeColor: "bg-red-600",
      stats: { makers: 1285 },
      cta: "Connect",
    },
    {
      id: "recommendations",
      icon: (
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
            strokeWidth={1.5}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      title: "Smart Recommendations",
      description:
        "Receive personalized product suggestions based on your interests.",
      category: "tools",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      gradientFrom: "from-orange-400",
      gradientTo: "to-orange-600",
      row: 3,
      size: "large",
      badge: "Smart",
      badgeColor: "bg-orange-600",
      stats: { accuracy: "95%", matched: 2840 },
      cta: "Get Recommendations",
    },
    {
      id: "analytics",
      icon: (
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
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Analytics & Insights",
      description:
        "Track your product's performance with comprehensive analytics.",
      category: "tools",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      gradientFrom: "from-amber-400",
      gradientTo: "to-amber-600",
      row: 3,
      size: "large",
      badge: "Pro",
      badgeColor: "bg-amber-600",
      stats: { reports: 148, metrics: 25 },
      cta: "View Analytics",
    },
  ];

  const categories = [
    { id: "all", label: "All Features" },
    { id: "product", label: "Product" },
    { id: "community", label: "Community" },
    { id: "tools", label: "Tools" },
  ];

  const filteredFeatures =
    activeTab === "all"
      ? features
      : features.filter((feature) => feature.category === activeTab);

  // Effect to handle tab changes
  useEffect(() => {
    // This effect runs when activeTab changes
  }, [activeTab]);

  // Group features by row
  const rows = filteredFeatures.reduce((acc, feature) => {
    if (!acc[feature.row]) acc[feature.row] = [];
    acc[feature.row].push(feature);
    return acc;
  }, {});

  // Function to format numbers
  const formatNumber = (num) => {
    return num > 999 ? (num / 1000).toFixed(1) + "k" : num;
  };

  // Section variants
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  // Header animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  // Feature card hover animation
  const featureHoverEffect = shouldReduceMotion
    ? {}
    : {
        scale: 1.01,
        y: -4,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: { duration: 0.3, ease: "easeOut" },
      };

  return (
    <div
      className="max-w-6xl mx-auto relative z-10 py-16 sm:py-20 px-4 sm:px-6"
      ref={ref}
    >
      {/* Background decorative elements */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-violet-300/10 to-fuchsia-300/10 dark:from-violet-600/5 dark:to-fuchsia-600/5 rounded-full blur-3xl -z-10"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.2 }}
          />
          <motion.div
            className="absolute bottom-24 right-1/4 w-80 h-80 bg-gradient-to-br from-fuchsia-300/10 to-amber-300/10 dark:from-fuchsia-600/5 dark:to-amber-600/5 rounded-full blur-3xl -z-10"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.4 }}
          />
        </>
      )}

      {/* Section header */}
      <motion.div
        className="text-center mb-20 relative"
        ref={headerRef}
        variants={shouldReduceMotion ? {} : sectionVariants}
        initial="hidden"
        animate={isHeaderInView ? "visible" : "hidden"}
      >
        <SectionLabel
          text="Features"
          size="medium"
          alignment="center"
          animate={!shouldReduceMotion}
          variant="vibrant"
          glowEffect={true}
          gradientText={true}
          animationStyle="bounce"
        />

        <motion.div
          className="relative inline-block"
          variants={shouldReduceMotion ? {} : headerVariants}
        >
          <h2
            className={`text-5xl md:text-6xl font-extrabold mb-6 ${
              isDarkMode ? "text-white" : "text-gray-900"
            } transition-colors duration-300`}
          >
            <span className="relative z-10">
              Powerful features to simplify your
            </span>
          </h2>

          {/* Wavy gradient underline with animation */}
          <motion.svg
            className="absolute bottom-2 left-0 right-0 w-full h-6"
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
            initial={shouldReduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
            animate={isHeaderInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 1.5,
              ease: "easeInOut",
            }}
          >
            <motion.path
              d="M0,50 Q250,0 500,50 T1000,50"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              initial={{ pathLength: 0 }}
              animate={isHeaderInView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 2,
                ease: "easeInOut",
              }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#D946EF" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </motion.svg>
        </motion.div>

        <motion.h2
          className={`text-5xl md:text-6xl font-extrabold mb-8 ${
            isDarkMode ? "text-white" : "text-gray-900"
          } transition-colors duration-300 bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 text-transparent`}
          variants={shouldReduceMotion ? {} : headerVariants}
        >
          web building experience
        </motion.h2>

        <motion.p
          className="text-gray-700 dark:text-gray-400 max-w-3xl mx-auto text-base leading-relaxed transition-colors duration-300"
          variants={shouldReduceMotion ? {} : headerVariants}
        >
          A comprehensive platform connecting innovative makers with
          enthusiastic early adopters, fostering a vibrant ecosystem where
          groundbreaking products thrive and evolve.
        </motion.p>
      </motion.div>

      {/* Category Tabs - Enhanced design */}
      <motion.div
        className="flex flex-wrap justify-center gap-3 mb-12"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="bg-gray-100/80 dark:bg-gray-800/50 p-1.5 rounded-full flex flex-wrap justify-center gap-1.5 border border-gray-200/70 dark:border-gray-700/50 backdrop-blur-md shadow-sm">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => {
                setPreviousTab(activeTab);
                setActiveTab(category.id);
              }}
              whileHover={
                shouldReduceMotion || activeTab === category.id
                  ? {}
                  : { scale: 1.05 }
              }
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
                ${
                  activeTab === category.id
                    ? "text-white"
                    : "text-gray-700 dark:text-gray-200 hover:text-violet-600 dark:hover:text-violet-300 transition-colors duration-300"
                }`}
              role="tab"
              aria-selected={activeTab === category.id}
              aria-controls={`tab-panel-${category.id}`}
            >
              <span className="relative z-10">{category.label}</span>
              {activeTab === category.id && (
                <motion.div
                  layoutId={
                    shouldReduceMotion ? undefined : "activeCategoryBackground"
                  }
                  className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-500 dark:from-violet-500 dark:via-fuchsia-400 dark:to-violet-400 shadow-md"
                  style={{ borderRadius: 9999 }}
                  transition={{
                    type: "spring",
                    stiffness: shouldReduceMotion ? 500 : 350,
                    damping: shouldReduceMotion ? 40 : 30,
                    bounce: shouldReduceMotion ? 0 : 0.2,
                    duration: shouldReduceMotion ? 0.1 : 0.3,
                  }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Bento Grid Layout with improved animations */}
      <div className="flex flex-col gap-8">
        <AnimatePresence mode="wait" initial={false}>
          {/* Render each row */}
          {Object.keys(rows).map((rowKey) => (
            <motion.div
              key={`row-${rowKey}-${activeTab}`}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 md:gap-8"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {rows[rowKey].map((feature) => {
                // Dynamic grid span based on feature size
                const gridClass =
                  feature.size === "large" ? "lg:col-span-6" : "lg:col-span-4";

                const cardHeight =
                  feature.size === "large" ? "min-h-[320px]" : "min-h-[280px]";

                return (
                  <motion.div
                    key={`${activeTab}-${feature.id}`}
                    layoutId={
                      shouldReduceMotion ? undefined : `feature-${feature.id}`
                    }
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={featureHoverEffect}
                    transition={{
                      duration: 0.3,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`group relative overflow-hidden rounded-xl p-7 border-[1.5px] ${feature.borderColor} dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/90 col-span-1 ${gridClass} ${cardHeight} transition-all duration-300 backdrop-blur-md hover:border-opacity-90 dark:hover:border-opacity-70`}
                  >
                    {/* Animated Gradient top line */}
                    <motion.div
                      className={`absolute top-0 left-0 h-[3px] bg-gradient-to-r ${feature.gradientFrom} ${feature.gradientTo} dark:opacity-90 transition-opacity duration-300`}
                      initial={
                        shouldReduceMotion ? { width: "100%" } : { width: "0%" }
                      }
                      animate={{ width: "100%" }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.8,
                        ease: "easeOut",
                      }}
                    />

                    {/* Enhanced Badge with refined styles */}
                    {feature.badge && (
                      <motion.div
                        initial={
                          shouldReduceMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.9 }
                        }
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.3,
                          delay: shouldReduceMotion ? 0 : 0.2,
                        }}
                        className={`absolute top-6 right-6 ${feature.badgeColor} dark:bg-opacity-90 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm transition-colors duration-300`}
                      >
                        {feature.badge}
                      </motion.div>
                    )}

                    <div className="flex flex-col h-full">
                      <div className="flex items-start mb-6">
                        <motion.div
                          whileHover={
                            shouldReduceMotion
                              ? {}
                              : { scale: 1.05, rotate: [0, -5, 5, 0] }
                          }
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                          className={`flex-shrink-0 p-3 rounded-lg ${feature.bgColor} dark:bg-opacity-30 ${feature.color} dark:text-white mr-5 transition-colors duration-300 border border-transparent dark:border-gray-700/40 shadow-sm`}
                        >
                          {feature.icon}
                        </motion.div>

                        <div>
                          <h3
                            className={`text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:${feature.color} dark:group-hover:text-opacity-100 transition-colors duration-300`}
                          >
                            {feature.title}
                          </h3>
                          <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed mb-0 transition-colors duration-300">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                      {/* Enhanced Stats section with refined animation */}
                      {feature.stats && (
                        <div className="mt-auto mb-5">
                          <div className="flex flex-wrap gap-3">
                            {Object.entries(feature.stats).map(
                              ([key, value], index) => (
                                <motion.div
                                  key={key}
                                  initial={
                                    shouldReduceMotion
                                      ? { opacity: 1, y: 0 }
                                      : { opacity: 0, y: 10 }
                                  }
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    duration: shouldReduceMotion ? 0 : 0.3,
                                    delay: shouldReduceMotion
                                      ? 0
                                      : 0.1 + index * 0.1,
                                    ease: "easeOut",
                                  }}
                                  whileHover={
                                    shouldReduceMotion
                                      ? {}
                                      : { y: -2, scale: 1.02 }
                                  }
                                  className={`bg-gray-50/80 dark:bg-gray-800/90 border-[1.5px] ${feature.borderColor} dark:border-gray-700/60 px-3 py-1.5 rounded-lg transition-all duration-300`}
                                >
                                  <span className="text-gray-600 dark:text-gray-300 text-xs block capitalize font-medium">
                                    {key}
                                  </span>
                                  <span
                                    className={`${feature.color} dark:text-white text-sm font-medium block transition-colors duration-300`}
                                  >
                                    {typeof value === "number"
                                      ? formatNumber(value)
                                      : value}
                                  </span>
                                </motion.div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Enhanced CTA Button with refined animations */}
                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/40">
                        <motion.button
                          whileHover={shouldReduceMotion ? {} : { x: 3 }}
                          className={`text-sm font-medium ${feature.color} dark:text-white flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 rounded transition-colors duration-300`}
                          onMouseEnter={onHover}
                          onMouseLeave={onLeave}
                          aria-label={
                            feature.cta || "Learn more about " + feature.title
                          }
                        >
                          {feature.cta || "Learn more"}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </motion.button>
                      </div>

                      {/* Enhanced hover effect - improved gradient overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo} opacity-0 group-hover:opacity-[0.04] dark:group-hover:opacity-[0.08] transition-opacity duration-300`}
                      />

                      {/* Subtle spotlight effect on hover */}
                      {!shouldReduceMotion && (
                        <div className="absolute -inset-px bg-gradient-to-tl from-white/0 via-white/20 to-white/0 dark:via-white/10 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500 pointer-events-none" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Enhanced CTA Button with refined animations */}
      <motion.div
        className="mt-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="relative inline-block">
          {/* Decorative elements */}
          {!shouldReduceMotion && (
            <>
              <motion.div
                className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-br from-violet-200/30 to-fuchsia-200/30 dark:from-violet-800/20 dark:to-fuchsia-800/20 rounded-full blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              />
              <motion.div
                className="absolute -bottom-8 -right-8 w-16 h-16 bg-gradient-to-br from-fuchsia-200/30 to-violet-200/30 dark:from-fuchsia-800/20 dark:to-violet-800/20 rounded-full blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
              />
            </>
          )}

          <GlobalButton
            icon="ArrowRight"
            variant="primary"
            size="lg"
            shimmerEffect={true}
            magneticEffect={true}
          >
            Explore All Features
          </GlobalButton>
        </div>
      </motion.div>
    </div>
  );
}
