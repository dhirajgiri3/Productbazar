"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import {
  TrendingUp,
  Package,
  Settings,
  Search,
  Bell,
  User,
  ChevronRight,
  Shield,
  Moon,
  Sun,
  Sparkles,
  ArrowUp,
  Clock,
  Plus,
  Lock,
  BellIcon,
  BarChart3,
  Users,
  DollarSign,
  Activity,
  Zap,
  Code,
  Target,
  LineChart,
  PieChart,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/contexts/theme-context";
import SectionLabel from "./Animations/SectionLabel";

// --- Helper: Debounce ---
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- Tabs Data ---
const TABS_DATA = [
  { name: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { name: "Products", icon: <Package size={16} /> },
  { name: "Analytics", icon: <LineChart size={16} /> },
  { name: "Settings", icon: <Settings size={16} /> },
];

const DashboardPreview = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { isDarkMode, toggleTheme } = useTheme(); // Use shared theme context
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const tabs = TABS_DATA;
  const autoSwitchInterval = 7000;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const debouncedMouseMove = useRef(
    debounce((e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }
    }, 16)
  ).current;

  const handleMouseMove = (e) => {
    debouncedMouseMove(e.nativeEvent);
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    if (containerRef.current) {
      mouseX.set(containerRef.current.offsetWidth / 2);
      mouseY.set(containerRef.current.offsetHeight / 2);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      mouseX.set(containerRef.current.offsetWidth / 2);
      mouseY.set(containerRef.current.offsetHeight / 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const springConfig = { stiffness: 120, damping: 20, mass: 1 }; // Slightly softer spring

  const rotateX = useSpring(
    useTransform(
      mouseY,
      () => [0, containerRef.current?.offsetHeight ?? 600],
      [7, -7] // Slightly reduced tilt
    ),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(
      mouseX,
      () => [0, containerRef.current?.offsetWidth ?? 1000],
      [-7, 7] // Slightly reduced tilt
    ),
    springConfig
  );

  const imageTranslateY = useSpring(
    useTransform(
      mouseY,
      () => [0, containerRef.current?.offsetHeight ?? 600],
      [-12, 12] // Slightly reduced parallax
    ),
    springConfig
  );
  const imageTranslateX = useSpring(
    useTransform(
      mouseX,
      () => [0, containerRef.current?.offsetWidth ?? 1000],
      [-8, 8] // Slightly reduced parallax
    ),
    springConfig
  );

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [twoFactorAuthEnabled, setTwoFactorAuthEnabled] = useState(true);

  const dashboardScreen = "https://res.cloudinary.com/dgak25skk/image/upload/v1745437791/Screenshot_2025-04-23_at_4.49.11_PM_d3oqjt.png";
  const productsScreen = "https://res.cloudinary.com/dgak25skk/image/upload/v1745437942/Screenshot_2025-04-24_at_1.22.02_AM_rpkjsn.png";
  const analyticsScreen = "https://res.cloudinary.com/dgak25skk/image/upload/v1745406725/Screenshot_2025-04-23_at_4.40.17_PM_tslhhj.png";
  const settingsScreen = "https://res.cloudinary.com/dgak25skk/image/upload/v1745437793/Screenshot_2025-04-23_at_4.48.44_PM_sdwqzb.png";
  const dashboardScreens = [dashboardScreen, productsScreen, analyticsScreen, settingsScreen];

  const startAutoSwitch = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveTab((prevTab) => (prevTab + 1) % tabs.length);
    }, autoSwitchInterval);
  }, [tabs.length, autoSwitchInterval]);

  useEffect(() => {
    startAutoSwitch();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoSwitch]);

  const handleTabClick = (index) => {
    setActiveTab(index);
    startAutoSwitch();
  };

  const performanceData = [
    { label: "Total Users", value: "14.2k", change: "+27%", color: "indigo", icon: <Users size={14} /> },
    { label: "Revenue", value: "$92.8k", change: "+18%", color: "violet", icon: <DollarSign size={14} /> },
    { label: "Engagement", value: "94%", change: "+5%", color: "emerald", icon: <Activity size={14} /> },
    { label: "Conversion", value: "3.8%", change: "+12%", color: "amber", icon: <Zap size={14} /> },
  ];
  const productsData = [
    { name: "AI Code Assistant", icon: <Code size={16} />, progress: 80, change: "+24%", users: "16,482", target: "20,000", color: "violet" },
    { name: "Marketing Suite", icon: <Target size={16} />, progress: 60, change: "+12%", users: "9,217", target: "15,000", color: "indigo" },
    { name: "Data Analytics Platform", icon: <BarChart3 size={16} />, progress: 45, change: "+8%", users: "5,103", target: "10,000", color: "blue" },
  ];
  const analyticsData = [
    { name: "User Growth", value: "14,256", change: "+27%", period: "vs last month", color: "emerald", icon: <Users size={16} /> },
    { name: "Revenue", value: "$92,845", change: "+18%", period: "vs last month", color: "blue", icon: <DollarSign size={16} /> },
    { name: "Active Sessions", value: "8,492", change: "+32%", period: "vs last month", color: "violet", icon: <Activity size={16} /> },
    { name: "Avg. Session Duration", value: "4m 32s", change: "+12%", period: "vs last month", color: "indigo", icon: <Clock size={16} /> }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.15 } }, // Slightly adjusted stagger
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 }, // Increased y for more noticeable entry
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }, // Adjusted spring
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.97 }, // Increased y and adjusted scale
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 28, mass: 0.9 } }, // Adjusted spring
    hover: {
      y: -4, // Slightly more lift
      scale: 1.015, // Slightly more scale
      boxShadow: `0 10px 25px -5px ${isDarkMode ? "rgba(0,0,0,0.2)" : "rgba(124,58,237,0.08)"}, 0 8px 10px -6px ${isDarkMode ? "rgba(0,0,0,0.15)" : "rgba(124,58,237,0.05)"}`, // Softer, more layered shadow
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  const switchVariants = { on: { x: 18 }, off: { x: 2 } };
  const switchContainerVariants = {
    on: (custom) => ({ // custom: [activeColor, isDarkMode]
      backgroundColor: custom[0] === "violet"
        ? (custom[1] ? "#6d28d9" : "#7c3aed") // violet-700, violet-600
        : (custom[1] ? "#059669" : "#10b981"), // emerald-600, emerald-500
      transition: { duration: 0.25 }
    }),
    off: (custom) => ({ // custom: [activeColor, isDarkMode]
      backgroundColor: custom[1] ? "#374151" : "#e5e7eb", // gray-700, gray-200
      transition: { duration: 0.25 }
    }),
  };

  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({ // Reduced particle count
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, // Smaller particles
      duration: Math.random() * 35 + 25, // Slightly longer duration
      delay: Math.random() * 10,
      driftX: (Math.random() - 0.5) * 30, // Reduced drift
      driftY: (Math.random() - 0.5) * 30,
    }));
    setParticles(newParticles);
  }, []);

  // Use the shared theme context's toggle function
  const handleThemeToggle = () => toggleTheme();
  const handleNotificationToggle = () => setNotificationsEnabled(!notificationsEnabled);
  const handle2FAToggle = () => setTwoFactorAuthEnabled(!twoFactorAuthEnabled);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="py-12 sm:py-16">
      <div className="flex justify-center mb-8">
        <SectionLabel
          text="Dashboard Preview"
          size="medium"
          alignment="center"
          variant="dashboard"
          glowEffect={true}
          animationStyle="fade"
          gradientText={true}
        />
      </div>
      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
      className={`relative w-full max-w-6xl mx-auto rounded-xl overflow-hidden
                h-[85vh] flex flex-col transition-colors duration-300
                ${isDarkMode ? "bg-gradient-to-br from-gray-900 via-slate-900 to-black" : "bg-gradient-to-br from-slate-50 via-gray-50 to-white"}
                border ${isDarkMode ? "border-slate-800/50" : "border-slate-200/70"}
                shadow-2xl ${isDarkMode ? "shadow-black/30" : "shadow-slate-300/40"}`}
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className={`absolute inset-0 opacity-25 ${isDarkMode ? "bg-grid-slate-700/[0.1]" : "bg-grid-slate-300/[0.15]"} [mask-image:linear-gradient(0deg,transparent,black_60%)] z-0`}
        style={{ backgroundSize: "28px 28px" }} // Slightly larger grid
        aria-hidden="true"
      />
      <div
        className={`absolute inset-0 opacity-5 ${isDarkMode ? "bg-black" : "bg-white"} z-0 pointer-events-none`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${isDarkMode ? '555' : 'bbb'}' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0zM40 40h40v40H40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
        aria-hidden="true"
      />
      {isHovering && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-[1] overflow-hidden rounded-xl"
          style={{
            background: `radial-gradient(900px circle at ${mouseX}px ${mouseY}px, ${isDarkMode ? "rgba(124, 58, 237, 0.05)" : "rgba(139, 92, 246, 0.03)"}, transparent 65%)`, // Softer glow
            transition: "background 0.25s ease-out",
          }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        />
      )}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${isDarkMode ? "bg-violet-600/10" : "bg-violet-500/8"} pointer-events-none z-[1]`} // Softer particle color
          style={{ left: `${particle.x}%`, top: `${particle.y}%`, width: `${particle.size}px`, height: `${particle.size}px`, opacity: 0 }}
          animate={{
            x: [0, particle.driftX, 0], y: [0, particle.driftY, 0],
            opacity: [0, 0.6, 0], // Gentler opacity curve
            scale: [0.6, 1, 0.6], // Gentler scale
            rotate: [0, Math.random() * 40 - 20, 0],
          }}
          transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
        />
      ))}

      <motion.div
        className="flex flex-col h-full relative z-10"
        style={{ rotateX, rotateY, transition: "transform 0.1s ease-out" }} // Faster response for tilt
      >
        <div className="flex-shrink-0">
          <div
            className={`${isDarkMode ? "bg-slate-950/70 backdrop-blur-lg" : "bg-white/70 backdrop-blur-lg"} px-4 py-2 border-b ${isDarkMode ? "border-slate-800/60" : "border-slate-200/60"} flex items-center justify-between sticky top-0 z-30`}
          >
            <div className="flex space-x-1.5">
              {["red-500", "yellow-500", "green-500"].map((color) => ( // Using full color names for Tailwind JIT
                <motion.div key={color} className={`w-2 h-2 bg-${color} rounded-full`} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 500, damping: 20 }} />
              ))}
            </div>
            <div className="flex-grow text-center">
              <motion.div
                className={`mx-auto ${isDarkMode ? "bg-slate-800/60" : "bg-slate-100/60"} rounded-md flex items-center justify-center px-3 py-0.5 text-xs ${isDarkMode ? "text-slate-400 border-slate-700/50" : "text-slate-500 border-slate-300/50"} border shadow-xs transition-colors duration-300`} // Softer shadow
                whileHover={{ y: -1, boxShadow: `0 2px 5px ${isDarkMode ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.05)"}` }}
              >
                <Lock size={9} className={`mr-1.5 ${isDarkMode ? "text-emerald-500" : "text-violet-500"}`} /> productbazar.in/dashboard
              </motion.div>
            </div>
            <div className="w-16 text-right">
              <span className={`font-medium whitespace-nowrap text-[9px] ${isDarkMode ? "text-slate-500" : "text-slate-400"} hidden md:inline`}>{currentDate.split(",")[0]}</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <motion.div
            className={`${isDarkMode ? "bg-slate-900/70 border-slate-800/60" : "bg-white/70 border-slate-100/60"} backdrop-blur-lg px-5 py-3 border-b flex items-center justify-between transition-colors duration-300`}
            variants={containerVariants} initial="hidden" animate="visible"
          >
            <motion.div className="flex items-center" variants={itemVariants}>
              <motion.div
                className={`bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold rounded-lg flex items-center justify-center text-sm w-8 h-8 p-1 mr-3 shadow-md ${isDarkMode ? "shadow-black/30" : "shadow-violet-300/50"}`}
                whileHover={{ scale: 1.08, transition: { type: "spring", stiffness: 300, damping: 12 } }}
              >PB</motion.div>
              <div>
                <h2 className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"} tracking-tight`}>ProductBazar</h2>
                <p className={`text-xs ${isDarkMode ? "text-violet-400" : "text-violet-600"} mt-0.5`}>Dashboard</p>
              </div>
            </motion.div>
            <div className="flex items-center space-x-1.5">
              <HeaderButton isDarkMode={isDarkMode} variants={itemVariants} label="Search"><Search size={15} /></HeaderButton>
              <HeaderButton isDarkMode={isDarkMode} variants={itemVariants} label="Notifications">
                <Bell size={15} />
                <motion.span className={`absolute top-0.5 right-0.5 block w-1.5 h-1.5 bg-red-500 rounded-full border ${isDarkMode ? "border-slate-900" : "border-white"}`}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} // Softer pulse
                />
              </HeaderButton>
              <HeaderButton isDarkMode={isDarkMode} variants={itemVariants} label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} onClick={handleThemeToggle} rotateHover>
                <AnimatePresence initial={false} mode="wait">
                  {isDarkMode ? (
                    <motion.span
                      key="dashboard-moon"
                      initial={{ y: -8, opacity: 0, rotate: -20, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ y: 8, opacity: 0, rotate: 20, scale: 0.8 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        duration: 0.25
                      }}
                      style={{
                        display: "block",
                        willChange: "transform, opacity"
                      }}
                    >
                      <Sun size={15} strokeWidth={2} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="dashboard-sun"
                      initial={{ y: -8, opacity: 0, rotate: -20, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ y: 8, opacity: 0, rotate: 20, scale: 0.8 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        duration: 0.25
                      }}
                      style={{
                        display: "block",
                        willChange: "transform, opacity"
                      }}
                    >
                      <Moon size={15} strokeWidth={2} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </HeaderButton>
              <motion.button className={`flex items-center p-1.5 rounded-full transition-colors duration-200 ${isDarkMode ? "hover:bg-slate-800/70" : "hover:bg-slate-100/70"} focus:outline-none focus:ring-1 focus:ring-violet-500 focus:ring-offset-1 ${isDarkMode ? "focus:ring-offset-slate-900" : "focus:ring-offset-white"}`}
                whileHover="hover" variants={itemVariants} aria-label="User Profile">
                <motion.div className={`w-6 h-6 ${isDarkMode ? "bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300" : "bg-gradient-to-br from-violet-100 to-violet-200 text-violet-600"} rounded-full flex items-center justify-center shadow-sm`} variants={{ hover: { scale: 1.08 } }}>
                  <User size={12} />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        </div>

        <div className="flex-shrink-0">
          <div className={`flex border-b ${isDarkMode ? "border-slate-800/70 bg-slate-900/60" : "border-slate-200/70 bg-white/60"} backdrop-blur-md px-4 transition-colors duration-300`}>
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.name}
                onClick={() => handleTabClick(index)}
                className={`relative flex items-center px-4 py-3 text-xs font-medium transition-colors duration-200 ease-out outline-none focus-visible:ring-1 focus-visible:ring-violet-400 focus-visible:ring-offset-1 ${isDarkMode ? "focus-visible:ring-offset-slate-900" : "focus-visible:ring-offset-white"} ${activeTab === index ? (isDarkMode ? "text-violet-300" : "text-violet-600") : (isDarkMode ? "text-slate-500 hover:text-violet-400" : "text-slate-500 hover:text-violet-600")}`}
                whileHover={{ y: -1.5 }} whileTap={{ scale: 0.97, y: 0 }} // Slightly more pronounced hover
              >
                <motion.span
                  className={`mr-1.5 transition-colors duration-200 ${activeTab === index ? (isDarkMode ? "text-violet-400" : "text-violet-500") : (isDarkMode ? "text-slate-600" : "text-slate-400")}`}
                  animate={{ scale: activeTab === index ? 1.1 : 1, opacity: 1 }} // Simpler active state, no infinite repeat
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >{tab.icon}</motion.span>
                {tab.name}
                {activeTab === index && (
                  <motion.div
                    className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${isDarkMode ? "bg-gradient-to-r from-violet-400 to-purple-500" : "bg-gradient-to-r from-violet-500 to-purple-600"} rounded-t-full shadow-[0_0_8px_rgba(139,92,246,0.5)]`} // Enhanced shadow
                    layoutId="activeTabIndicator"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }} // Slightly adjusted spring
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex-grow relative overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.97, y: 10 }} // Adjusted entry animation
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }} // Adjusted exit animation
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} // Smoother ease
              className="absolute inset-0 h-full"
            >
              <motion.img
                src={dashboardScreens[activeTab]} alt={`${tabs[activeTab].name} Background`}
                style={{ y: imageTranslateY, x: imageTranslateX, scale: 1.08 }} // Slightly increased scale for parallax
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isDarkMode ? "opacity-20" : "opacity-40"} filter ${isDarkMode ? "contrast-75 brightness-60" : "contrast-100 brightness-100"}`} // Adjusted opacity and filters
                key={`bg-${activeTab}`}
              />
              <div className="absolute inset-0 p-4 sm:p-5 pointer-events-none overflow-y-auto">
                {activeTab === 0 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {performanceData.map((item) => (<MetricCard key={item.label} item={item} isDarkMode={isDarkMode} cardVariants={cardVariants} itemVariants={itemVariants} />))}
                    <div className="sm:col-span-2 lg:col-span-4"><RevenueCard isDarkMode={isDarkMode} cardVariants={cardVariants} /></div>
                  </motion.div>
                )}
                {activeTab === 1 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ProductListCard productsData={productsData} isDarkMode={isDarkMode} cardVariants={cardVariants} itemVariants={itemVariants} />
                    <FeaturedLaunchCard isDarkMode={isDarkMode} cardVariants={cardVariants} />
                  </motion.div>
                )}
                {activeTab === 2 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {analyticsData.map((item) => (<AnalyticsCard key={item.name} item={item} isDarkMode={isDarkMode} cardVariants={cardVariants} itemVariants={itemVariants} />))}
                  </motion.div>
                )}
                {activeTab === 3 && (
                  <SettingsCard isDarkMode={isDarkMode} notificationsEnabled={notificationsEnabled} twoFactorAuthEnabled={twoFactorAuthEnabled} handleThemeToggle={handleThemeToggle} handleNotificationToggle={handleNotificationToggle} handle2FAToggle={handle2FAToggle} cardVariants={cardVariants} itemVariants={itemVariants} switchVariants={switchVariants} switchContainerVariants={switchContainerVariants} />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex-shrink-0">
          <div className={`${isDarkMode ? "bg-slate-900/60 border-slate-800/60" : "bg-white/60 border-slate-200/60"} backdrop-blur-md px-5 py-2.5 border-t flex items-center justify-between text-xs transition-colors duration-300`}>
            <div className={`flex items-center space-x-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              <motion.div className="flex items-center" whileHover={{ x: 1.5 }}>
                <motion.div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 shadow-[0_0_7px_rgba(16,185,129,0.8)]" // Enhanced shadow
                  animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} // Softer pulse
                /> All systems operational
              </motion.div>
              <div className="hidden sm:flex items-center text-[10px]">
                <Clock size={9} className="mr-1" /> Last update: <span className={`font-medium ml-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Just now</span>
              </div>
            </div>
            <Link href="/product/new">
              <motion.button
                className={`${isDarkMode ? "bg-violet-600 hover:bg-violet-500" : "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"} text-white text-[10px] font-medium py-1.5 px-3 rounded-md transition-all flex items-center shadow-md ${isDarkMode ? "shadow-violet-900/30" : "shadow-violet-300/50"} focus:outline-none focus:ring-1 focus:ring-violet-500 focus:ring-offset-1 ${isDarkMode ? "focus:ring-offset-slate-900" : "focus:ring-offset-white"}`}
                whileHover={{ scale: 1.04, y: -1.5, boxShadow: `0 5px 15px ${isDarkMode ? "rgba(139,92,246,0.25)" : "rgba(124,58,237,0.2)"}` }} // Enhanced hover
                whileTap={{ scale: 0.97, y: 0 }}
              ><Plus size={12} className="mr-1 -ml-0.5" /> Add Product</motion.button>
            </Link>
          </div>
        </div>
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/4 ${isDarkMode ? "bg-purple-700/5" : "bg-purple-500/3"} rounded-full blur-3xl -z-10 pointer-events-none`} /> {/* Softer, wider glow */}
      </motion.div>
    </motion.div>
    </div>
  );
};

// --- Reusable Sub-components ---
// (The sub-components like MetricCard, AnalyticsCard, etc., are mostly unchanged in structure
// but will benefit from the refined cardVariants, itemVariants, and color scheme passed down)

const HeaderButton = ({ children, label, onClick, isDarkMode, variants, rotateHover = false }) => (
  <motion.button
    onClick={onClick}
    className={`relative p-2 rounded-full transition-colors duration-200 ${isDarkMode ? "text-slate-400 hover:bg-slate-700/70 hover:text-violet-300" : "text-slate-500 hover:bg-violet-100/70 hover:text-violet-600"} focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 ${isDarkMode ? "focus:ring-offset-slate-900" : "focus:ring-offset-white"}`}
    whileHover={{ scale: 1.18, rotate: rotateHover ? (isDarkMode ? -18 : 18) : 0 }} // Slightly more rotation/scale
    whileTap={{ scale: 0.92 }}
    variants={variants}
    aria-label={label}
    style={{
      willChange: "transform",
      transform: "translateZ(0)" // Force hardware acceleration
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25,
      duration: 0.25
    }}
  >
    {children}
  </motion.button>
);

const MetricCard = ({ item, isDarkMode, cardVariants, itemVariants }) => {
  const progressValue = (item.label.length * 5) % 30 + 65;
  return (
    <motion.div
      variants={cardVariants || itemVariants}
      whileHover="hover"
      className={` ${isDarkMode ? "bg-slate-800/60 border-slate-700/50" : "bg-white/60 border-slate-200/50"} backdrop-blur-xl rounded-lg p-3.5 shadow-lg border cursor-default group`} // Enhanced blur and shadow
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <motion.span
            className={`flex items-center justify-center w-7 h-7 rounded-lg mr-2.5 ${isDarkMode ? `bg-${item.color}-900/50 text-${item.color}-400` : `bg-${item.color}-100 text-${item.color}-500`} shadow-sm group-hover:shadow-md transition-all duration-300`}
            whileHover={{ scale: 1.12, rotate: 6 }} transition={{ type: "spring", stiffness: 350, damping: 15 }}
          >{item.icon}</motion.span>
          <span className={`text-xs font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{item.label}</span>
        </div>
        <motion.span
          className={`text-xs font-medium flex items-center ${isDarkMode ? "text-emerald-400" : "text-emerald-500"} px-1.5 py-0.5 rounded-full ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100/70"} group-hover:shadow-sm transition-all duration-300`}
          whileHover={{ scale: 1.06 }}
        ><ArrowUp size={10} className="mr-0.5" />{item.change}</motion.span>
      </div>
      <p className={`text-xl font-bold ${isDarkMode ? "text-slate-50" : `text-${item.color}-600`} ml-10 group-hover:ml-9 group-hover:text-${item.color}-${isDarkMode ? '300' : '500'} transition-all duration-300`}>{item.value}</p> {/* Added color change on hover */}
      <div className={`w-full h-1.5 mt-3 rounded-full ${isDarkMode ? "bg-slate-700/50" : "bg-slate-200/50"} overflow-hidden`}>
        <motion.div
          className={`h-1.5 rounded-full bg-gradient-to-r ${isDarkMode ? `from-${item.color}-600 to-${item.color}-500` : `from-${item.color}-500 to-${item.color}-400`}`}
          initial={{ width: "0%" }} animate={{ width: `${progressValue}%` }} transition={{ delay: 0.3, duration: 0.9, ease: "circOut" }}
        />
      </div>
    </motion.div>
  );
};

const AnalyticsCard = ({ item, isDarkMode, cardVariants, itemVariants }) => (
  <motion.div
    variants={cardVariants || itemVariants}
    whileHover="hover"
    className={` ${isDarkMode ? "bg-slate-800/60 border-slate-700/50" : "bg-white/60 border-slate-200/50"} backdrop-blur-xl rounded-lg p-4 shadow-lg border cursor-default group`}
  >
    <div className="flex items-center mb-3">
      <motion.span
        className={`flex items-center justify-center w-9 h-9 rounded-lg mr-3 ${isDarkMode ? `bg-${item.color}-900/50 text-${item.color}-400 group-hover:bg-${item.color}-800/70` : `bg-${item.color}-100 text-${item.color}-500 group-hover:bg-${item.color}-200`} shadow-sm group-hover:shadow-md transition-all duration-300`}
        whileHover={{ scale: 1.12, rotate: 6 }} transition={{ type: "spring", stiffness: 350, damping: 15 }}
      >{item.icon}</motion.span>
      <div>
        <span className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{item.name}</span>
        <p className={`text-lg font-bold ${isDarkMode ? "text-slate-50" : `text-${item.color}-600`} group-hover:translate-x-0.5 transition-transform duration-300`}>{item.value}</p>
      </div>
    </div>
    <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-opacity-30 ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}">
      <motion.span
        className={`text-xs font-medium flex items-center ${isDarkMode ? "text-emerald-400" : "text-emerald-500"} px-1.5 py-0.5 rounded-full ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100/70"} group-hover:shadow-sm transition-all duration-300`}
        whileHover={{ scale: 1.06 }}
      ><ArrowUp size={10} className="mr-0.5" />{item.change}</motion.span>
      <span className={`text-[10px] ${isDarkMode ? "text-slate-500" : "text-slate-400"} italic`}>{item.period}</span>
    </div>
  </motion.div>
);

const RevenueCard = ({ isDarkMode, cardVariants }) => {
  const lineData = [12, 19, 15, 22, 27, 25, 32, 35, 41, 46, 39, 45];
  const areaData = [8, 12, 10, 14, 16, 18, 20, 22, 26, 30, 24, 28];
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={`${isDarkMode ? "bg-slate-800/60 border-slate-700/50" : "bg-white/60 border-slate-200/50"} backdrop-blur-xl rounded-lg p-4 shadow-lg border cursor-default w-full`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"} text-sm flex items-center`}>
          <BarChart3 size={14} className={`mr-2 ${isDarkMode ? "text-violet-400" : "text-violet-500"}`} /> Revenue Overview
        </h3>
        <div className="flex space-x-2">
          <span className={`text-xs px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} cursor-pointer hover:brightness-110 transition-all`}>Week</span>
          <span className={`text-xs px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-violet-600/40 text-violet-300' : 'bg-violet-100 text-violet-600'} font-medium cursor-pointer hover:brightness-110 transition-all`}>Month</span>
          <span className={`text-xs px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} cursor-pointer hover:brightness-110 transition-all`}>Year</span>
        </div>
      </div>
      <div className={`h-40 mb-3 p-3 rounded-lg border ${isDarkMode ? "bg-slate-900/30 border-slate-700/40" : "bg-slate-50/60 border-slate-200/40"} shadow-inner backdrop-blur-sm relative overflow-hidden`}>
        <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (<div key={i} className={`w-full h-px ${isDarkMode ? 'bg-slate-700/40' : 'bg-slate-300/40'}`} />))}
        </div>
        <div className="absolute left-3 top-0 h-full flex flex-col justify-between text-[8px] py-3">
          {['$50k', '$40k', '$30k', '$20k', '$10k'].map((label, i) => (<div key={i} className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</div>))}
        </div>
        <div className="absolute bottom-3 left-10 right-3 h-[calc(100%-24px)]">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path d={`M0,100 ${areaData.map((d, i) => `L${i * 100 / (areaData.length - 1)},${100 - d * 2}`).join(' ')} L100,100 Z`} fill={isDarkMode ? 'url(#areaGradientDark)' : 'url(#areaGradientLight)'} initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ duration: 1.2, delay: 0.25 }} />
            <motion.path d={`M0,${100 - lineData[0] * 2} ${lineData.map((d, i) => `L${i * 100 / (lineData.length - 1)},${100 - d * 2}`).join(' ')}`} stroke={isDarkMode ? '#a78bfa' : '#8b5cf6'} strokeWidth="2.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: "easeInOut" }} />
            {lineData.map((d, i) => (<motion.circle key={i} cx={`${i * 100 / (lineData.length - 1)}%`} cy={`${100 - d * 2}%`} r="2.5" fill={isDarkMode ? '#a78bfa' : '#8b5cf6'} stroke={isDarkMode ? '#1e293b' : 'white'} strokeWidth="1.5" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.9 + i * 0.06 }} className="hover:r-3.5 cursor-pointer transition-all" />))}
            <motion.circle cx={`${9 * 100 / (lineData.length - 1)}%`} cy={`${100 - lineData[9] * 2}%`} r="3.5" fill={isDarkMode ? '#c4b5fd' : '#8b5cf6'} stroke={isDarkMode ? '#1e293b' : 'white'} strokeWidth="2" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1.1 }} transition={{ duration: 0.6, delay: 1.6 }} className="cursor-pointer" />
            <defs>
              <linearGradient id="areaGradientDark" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" /></linearGradient>
              <linearGradient id="areaGradientLight" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" /></linearGradient>
            </defs>
          </svg>
          <div className={`absolute px-2 py-1 rounded-md text-[10px] font-medium ${isDarkMode ? 'bg-violet-500 text-white' : 'bg-violet-100 text-violet-700'} shadow-md pointer-events-none`} style={{ left: `${9 * 100 / (lineData.length - 1)}%`, top: `${100 - lineData[9] * 2 - 12}%`, transform: 'translate(-50%, -100%)' }}>Oct: $46,845</div>
        </div>
        <div className="absolute bottom-1 left-10 right-3 flex justify-between text-[8px]">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (<div key={i} className={`${i === 9 ? (isDarkMode ? 'text-violet-300 font-semibold' : 'text-violet-600 font-semibold') : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}>{month}</div>))}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <div className={`flex items-center text-xs mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            <span>Monthly Target:</span><span className={`font-semibold ml-1.5 ${isDarkMode ? "text-violet-300" : "text-violet-600"}`}>$92,845 / $100,000</span>
          </div>
          <div className={`w-48 ${isDarkMode ? "bg-slate-700/50" : "bg-slate-200/50"} rounded-full h-1.5`}><motion.div className={`h-1.5 rounded-full bg-gradient-to-r ${isDarkMode ? "from-violet-500 to-purple-500" : "from-violet-500 to-purple-500"}`} initial={{ width: "0%" }} animate={{ width: "92.8%" }} transition={{ delay: 0.6, duration: 1.2, ease: "circOut" }} /></div>
        </div>
        <div className={`text-right ${isDarkMode ? "text-emerald-400" : "text-emerald-500"} text-xs font-medium`}>
          <div className="flex items-center justify-end"><ArrowUp size={12} className="mr-0.5" /><span>18.4%</span></div>
          <span className={`text-[10px] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>vs last month</span>
        </div>
      </div>
    </motion.div>
  );
};

const ProductListCard = ({ productsData, isDarkMode, cardVariants, itemVariants }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    className={`${isDarkMode ? "bg-slate-800/60 border-slate-700/50" : "bg-white/60 border-slate-200/50"} backdrop-blur-xl rounded-lg p-4 shadow-lg border cursor-default md:col-span-2`}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className={`font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"} text-sm flex items-center`}><Package size={14} className={`mr-2 ${isDarkMode ? "text-violet-400" : "text-violet-500"}`} /> Product Performance</h3>
      <span className={`text-[10px] px-2 py-1 rounded-full ${isDarkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-600'} font-medium`}>Active</span>
    </div>
    <div className="space-y-3">
      {productsData.map((product, index) => (
        <motion.div
          key={product.name} variants={itemVariants}
          className={`flex items-center p-3 rounded-lg border ${isDarkMode ? `bg-slate-900/40 border-slate-700/40` : `bg-${product.color}-50/40 border-${product.color}-200/50`} shadow-md group relative overflow-hidden`}
          whileHover={{ y: -2.5, backgroundColor: isDarkMode ? "rgba(30,41,59,0.5)" : `rgba(238,242,255,0.5)` }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <div className={`absolute -right-5 -bottom-5 w-14 h-14 rounded-full blur-xl ${isDarkMode ? `bg-${product.color}-700/15 group-hover:bg-${product.color}-600/25` : `bg-${product.color}-300/20 group-hover:bg-${product.color}-300/35`} transition-all duration-300`} />
          <motion.div
            className={`w-10 h-10 rounded-lg ${isDarkMode ? `bg-gradient-to-br from-${product.color}-700/70 to-${product.color}-800/70 text-${product.color}-300` : `bg-gradient-to-br from-${product.color}-100 to-${product.color}-200 text-${product.color}-600`} flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-all duration-300`}
            whileHover={{ scale: 1.12, rotate: 6 }} transition={{ type: "spring", stiffness: 300, damping: 12 }}
          >{product.icon}</motion.div>
          <div className="flex-grow">
            <div className="flex justify-between items-baseline">
              <p className={`font-medium text-xs ${isDarkMode ? "text-slate-100" : "text-slate-700"} group-hover:text-${product.color}-${isDarkMode ? '300' : '600'} transition-colors duration-300`}>{product.name}</p>
              <motion.span
                className={`text-xs font-medium flex items-center px-1.5 py-0.5 rounded-full ${isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100/70 text-emerald-600"} group-hover:shadow-sm transition-all duration-300`}
                whileHover={{ scale: 1.06 }}
              ><ArrowUp size={9} className="mr-0.5" />{product.change}</motion.span>
            </div>
            <div className="relative mt-2">
              <div className={`w-full ${isDarkMode ? "bg-slate-700/50" : "bg-slate-200/50"} rounded-full h-1.5`}><motion.div className={`h-1.5 rounded-full bg-gradient-to-r from-${product.color}-500 to-${product.color}-400`} initial={{ width: "0%" }} animate={{ width: `${product.progress}%` }} transition={{ delay: 0.35 + index * 0.12, duration: 0.9, ease: "circOut" }} />
                <motion.div className={`absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full border-2 ${isDarkMode ? `bg-${product.color}-500 border-slate-800` : `bg-${product.color}-500 border-white`} shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`} style={{ left: `${product.progress}%`, transform: `translate(-50%, -50%)`}} whileHover={{ scale: 1.25 }} /> {/* Centered dot */}
              </div>
            </div>
            <div className={`flex justify-between mt-2 text-[9px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              <span className="flex items-center"><Users size={9} className="mr-1" /> {product.users}</span>
              <span className="flex items-center"><Target size={9} className="mr-1" /> {product.target}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const FeaturedLaunchCard = ({ isDarkMode, cardVariants }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    className={`${isDarkMode ? "bg-slate-800/60 border-slate-700/50" : "bg-white/60 border-slate-200/50"} backdrop-blur-xl rounded-lg p-4 shadow-lg border cursor-default md:col-span-1 self-start`}
  >
    <h3 className={`font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"} mb-3 text-sm flex items-center`}><Sparkles size={14} className={`mr-2 text-amber-400`} /> Featured Launch</h3>
    <div className={`p-4 rounded-lg border ${isDarkMode ? "bg-gradient-to-br from-violet-900/40 to-purple-800/40 border-violet-700/40" : "bg-gradient-to-br from-violet-100/70 to-purple-100/70 border-violet-200/70"} shadow-inner relative overflow-hidden group`}>
      <div className="absolute -right-12 -top-12 w-24 h-24 bg-purple-600/15 rounded-full blur-2xl group-hover:bg-purple-600/25 transition-all duration-700"></div>
      <div className="absolute -left-8 -bottom-8 w-20 h-20 bg-violet-500/10 rounded-full blur-xl group-hover:bg-violet-500/20 transition-all duration-700"></div>
      <div className="relative">
        <motion.div whileHover={{ scale: 1.18, rotate: 6 }} className={`w-12 h-12 rounded-xl ${isDarkMode ? "bg-slate-700" : "bg-white"} flex items-center justify-center text-violet-500 mb-3 shadow-lg cursor-grab`}><Code size={24} strokeWidth={1.5} /></motion.div>
        <p className={`font-medium text-sm ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>AI Code Assistant</p>
        <div className="flex items-center justify-between">
          <p className={`text-xs font-medium flex items-center mt-1 ${isDarkMode ? "text-emerald-400" : "text-emerald-500"}`}><TrendingUp size={11} className="mr-1" /> Trending High</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-600'} font-medium`}>New</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500"><span>Release: Today</span><span>Users: 2.4k+</span></div>
        <motion.button
          className={`mt-3 w-full ${isDarkMode ? "bg-violet-600/80 hover:bg-violet-500/80" : "bg-violet-500 hover:bg-violet-600"} text-white text-[10px] font-medium py-2 px-3 rounded-md transition-all shadow-md ${isDarkMode ? "shadow-violet-900/30" : "shadow-violet-300/50"} pointer-events-auto focus:outline-none focus:ring-1 focus:ring-violet-400 focus:ring-offset-1 ${isDarkMode ? "focus:ring-offset-slate-800" : "focus:ring-offset-white"}`}
          whileHover={{ scale: 1.04, y: -1.5, boxShadow: `0 5px 12px ${isDarkMode ? "rgba(139,92,246,0.25)" : "rgba(124,58,237,0.2)"}` }}
          whileTap={{ scale: 0.97 }}
        >View Details <ChevronRight size={12} className="inline ml-0.5" /></motion.button>
      </div>
    </div>
  </motion.div>
);

const SettingsCard = ({ isDarkMode, notificationsEnabled, twoFactorAuthEnabled, handleThemeToggle, handleNotificationToggle, handle2FAToggle, cardVariants, itemVariants, switchVariants, switchContainerVariants }) => (
  <motion.div
    variants={cardVariants} initial="hidden" animate="visible"
    className={`${isDarkMode ? "bg-slate-800/60 border-slate-700/50" : "bg-white/60 border-slate-200/50"} backdrop-blur-xl rounded-lg p-5 shadow-lg border cursor-default max-w-md mx-auto`}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className={`font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"} text-sm flex items-center`}><Settings size={14} className={`mr-2 ${isDarkMode ? "text-violet-400" : "text-violet-500"}`} /> System Settings</h3>
      <span className={`text-[10px] px-2 py-1 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>Admin</span>
    </div>
    <div className="space-y-3">
      <SettingsRow label="Email Notifications" description="Receive email updates about your account activity" icon={<BellIcon size={15} />} isDarkMode={isDarkMode} variants={itemVariants} iconColor="violet">
        <ToggleButton checked={notificationsEnabled} onChange={handleNotificationToggle} isDarkMode={isDarkMode} switchVariants={switchVariants} switchContainerVariants={switchContainerVariants} activeColor="violet" />
      </SettingsRow>
      <SettingsRow label="Dark Mode" description="Toggle between light and dark theme" icon={isDarkMode ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />} isDarkMode={isDarkMode} variants={itemVariants} iconColor="violet">
        <ToggleButton checked={isDarkMode} onChange={handleThemeToggle} isDarkMode={isDarkMode} switchVariants={switchVariants} switchContainerVariants={switchContainerVariants} activeColor="violet" />
      </SettingsRow>
      <SettingsRow label="Two-Factor Auth" description="Add an extra layer of security to your account" icon={<Shield size={15} />} isDarkMode={isDarkMode} variants={itemVariants} iconColor="emerald">
        <ToggleButton checked={twoFactorAuthEnabled} onChange={handle2FAToggle} isDarkMode={isDarkMode} switchVariants={switchVariants} switchContainerVariants={switchContainerVariants} activeColor="emerald" />
      </SettingsRow>
    </div>
  </motion.div>
);

const SettingsRow = ({ label, description, icon, isDarkMode, children, variants, iconColor = "slate" }) => (
  <motion.div
    variants={variants}
    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isDarkMode ? "border-slate-700/60 hover:bg-slate-700/40" : "border-slate-200/70 hover:bg-violet-50/40"} group`}
    whileHover={{ x: 2.5 }}
  >
    <div className="flex items-center">
      <motion.div
        className={`w-8 h-8 rounded-lg ${isDarkMode ? `bg-${iconColor}-900/30 text-${iconColor}-400` : `bg-${iconColor}-100 text-${iconColor}-500`} flex items-center justify-center mr-3 shadow-sm group-hover:shadow-md transition-all duration-300`}
        whileHover={{ scale: 1.12, rotate: 6 }} transition={{ type: "spring", stiffness: 350, damping: 15 }}
      >{icon}</motion.div>
      <div>
        <p className={`text-xs font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>{label}</p>
        {description && (<p className={`text-[9px] ${isDarkMode ? "text-slate-400" : "text-slate-500"} mt-0.5`}>{description}</p>)}
      </div>
    </div>
    <div className="pointer-events-auto">{children}</div>
  </motion.div>
);

const ToggleButton = ({ checked, onChange, isDarkMode, switchVariants, switchContainerVariants, activeColor = "indigo" }) => (
  <motion.button
    onClick={onChange} aria-pressed={checked}
    variants={switchContainerVariants}
    animate={checked ? "on" : "off"}
    custom={[activeColor, isDarkMode]} // Pass custom props
    className={`w-10 h-5 rounded-full relative cursor-pointer flex items-center p-0.5 focus:outline-none focus:ring-2 focus:ring-${activeColor}-500 focus:ring-offset-2 ${isDarkMode ? "focus:ring-offset-slate-800" : "focus:ring-offset-white"}`}
    style={{
      willChange: "background-color",
      transform: "translateZ(0)" // Force hardware acceleration
    }}
  >
    <motion.div
      className="w-4 h-4 bg-white rounded-full shadow-md"
      variants={switchVariants}
      transition={{
        type: "spring",
        stiffness: 600,
        damping: 30
      }}
      style={{
        willChange: "transform",
        transform: "translateZ(0)" // Force hardware acceleration
      }}
    />
  </motion.button>
);

export default DashboardPreview;
