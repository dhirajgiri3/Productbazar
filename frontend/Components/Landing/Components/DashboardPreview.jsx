'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Package, Settings, Search, Bell, User, ChevronRight, Shield, Sparkles,
  ArrowUp, Clock, Plus, Lock, BellIcon, BarChart3, Users, DollarSign, Activity,
  Code, Target, LineChart, LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';
import SectionLabel from './Animations/SectionLabel';

// Error Boundary
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DashboardPreview Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-12 sm:py-16 bg-white">
          <div className="flex justify-center mb-8">
            <div className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
              Dashboard Preview
            </div>
          </div>
          <div className="relative w-full max-w-6xl mx-auto rounded-xl overflow-hidden h-[85vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-white border border-slate-200/70 shadow-2xl shadow-slate-300/40">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto">
                <LayoutDashboard size={24} className="text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Dashboard Preview</h3>
                <p className="text-sm text-slate-600 max-w-md">
                  Experience our intuitive dashboard interface with real-time analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading Fallback
const DashboardLoadingFallback = () => (
  <div className="py-12 sm:py-16 bg-white">
    <div className="flex justify-center mb-8">
      <div className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-full animate-pulse">
        Dashboard Preview
      </div>
    </div>
    <div className="relative w-full max-w-6xl mx-auto rounded-xl overflow-hidden h-[85vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-white border border-slate-200/70 shadow-2xl shadow-slate-300/40">
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-sm text-slate-500">Loading dashboard preview...</p>
      </div>
    </div>
  </div>
);

// Tabs configuration
const TABS_DATA = [
  { name: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { name: 'Products', icon: <Package size={16} /> },
  { name: 'Analytics', icon: <LineChart size={16} /> },
  { name: 'Settings', icon: <Settings size={16} /> },
];

// Simplified color system
const colorMap = {
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-500', gradFrom: 'from-indigo-500', gradTo: 'to-indigo-400' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-500', gradFrom: 'from-violet-500', gradTo: 'to-violet-400' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-500', gradFrom: 'from-emerald-500', gradTo: 'to-emerald-400' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-500', gradFrom: 'from-amber-500', gradTo: 'to-amber-400' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-500', gradFrom: 'from-blue-500', gradTo: 'to-blue-400' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-500', gradFrom: 'from-slate-500', gradTo: 'to-slate-400' },
};

// Main Dashboard Preview Component
const DashboardPreviewCore = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [twoFactorAuthEnabled, setTwoFactorAuthEnabled] = useState(true);
  
  const intervalRef = useRef(null);

  // Client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Dashboard screens
  const dashboardScreens = [
    'https://res.cloudinary.com/dgak25skk/image/upload/f_auto,q_auto,w_1200,c_limit,dpr_auto/v1745437791/Screenshot_2025-04-23_at_4.49.11_PM_d3oqjt.png',
    'https://res.cloudinary.com/dgak25skk/image/upload/f_auto,q_auto,w_1200,c_limit,dpr_auto/v1745437942/Screenshot_2025-04-24_at_1.22.02_AM_rpkjsn.png',
    'https://res.cloudinary.com/dgak25skk/image/upload/f_auto,q_auto,w_1200,c_limit,dpr_auto/v1745406725/Screenshot_2025-04-23_at_4.40.17_PM_tslhhj.png',
    'https://res.cloudinary.com/dgak25skk/image/upload/f_auto,q_auto,w_1200,c_limit,dpr_auto/v1745437793/Screenshot_2025-04-23_at_4.48.44_PM_sdwqzb.png'
  ];

  // Auto-switch tabs
  const startAutoSwitch = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveTab(prev => (prev + 1) % TABS_DATA.length);
    }, 7000);
  }, []);

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

  // Static data for dashboard content
  const performanceData = [
    { label: 'Total Users', value: '14.2k', change: '+27%', color: 'indigo', icon: <Users size={14} /> },
    { label: 'Revenue', value: '$92.8k', change: '+18%', color: 'violet', icon: <DollarSign size={14} /> },
    { label: 'Engagement', value: '94%', change: '+5%', color: 'emerald', icon: <Activity size={14} /> },
    { label: 'Conversion', value: '3.8%', change: '+12%', color: 'amber', icon: <ArrowUp size={14} /> },
  ];

  const productsData = [
    { name: 'AI Code Assistant', icon: <Code size={16} />, progress: 80, change: '+24%', users: '16,482', target: '20,000', color: 'violet' },
    { name: 'Marketing Suite', icon: <Target size={16} />, progress: 60, change: '+12%', users: '9,217', target: '15,000', color: 'indigo' },
    { name: 'Data Analytics Platform', icon: <BarChart3 size={16} />, progress: 45, change: '+8%', users: '5,103', target: '10,000', color: 'blue' },
  ];

  const analyticsData = [
    { name: 'User Growth', value: '14,256', change: '+27%', period: 'vs last month', color: 'emerald', icon: <Users size={16} /> },
    { name: 'Revenue', value: '$92,845', change: '+18%', period: 'vs last month', color: 'blue', icon: <DollarSign size={16} /> },
    { name: 'Active Sessions', value: '8,492', change: '+32%', period: 'vs last month', color: 'violet', icon: <Activity size={16} /> },
    { name: 'Avg. Session Duration', value: '4m 32s', change: '+12%', period: 'vs last month', color: 'indigo', icon: <Clock size={16} /> },
  ];

  // Simplified animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } },
    hover: { y: -4, scale: 1.015, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  };

  return (
    <div className="py-12 sm:py-16 bg-white">
      <div className="flex justify-center mb-8">
        {isClient ? (
          <SectionLabel
            text="Dashboard Preview"
            size="medium"
            alignment="center"
            variant="dashboard"
            glowEffect={true}
            animationStyle="fade"
            gradientText={true}
          />
        ) : (
          <div className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
            Dashboard Preview
          </div>
        )}
      </div>

      <motion.div
        className="relative w-full max-w-6xl mx-auto rounded-xl overflow-hidden h-[85vh] flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-white border border-slate-200/70 shadow-2xl shadow-slate-300/40"
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col h-full relative z-10">
          {/* Browser Header */}
          <BrowserHeader />
          
          {/* App Header */}
          <AppHeader />
          
          {/* Tab Navigation */}
          <TabNavigation 
            tabs={TABS_DATA}
            activeTab={activeTab}
            onTabClick={handleTabClick}
            isClient={isClient}
          />

          {/* Main Content */}
          <div className="flex-grow relative overflow-hidden">
            {isClient ? (
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.97, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 h-full"
                >
                  <motion.img
                    src={dashboardScreens[activeTab]}
                    alt={`${TABS_DATA[activeTab]?.name || 'Dashboard'} Background`}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-40"
                    loading="lazy"
                    decoding="async"
                  />
                  
                  <div className="absolute inset-0 p-4 sm:p-5 pointer-events-none overflow-y-auto">
                    <TabContent 
                      activeTab={activeTab}
                      performanceData={performanceData}
                      productsData={productsData}
                      analyticsData={analyticsData}
                      notificationsEnabled={notificationsEnabled}
                      twoFactorAuthEnabled={twoFactorAuthEnabled}
                      onNotificationToggle={() => setNotificationsEnabled(!notificationsEnabled)}
                      on2FAToggle={() => setTwoFactorAuthEnabled(!twoFactorAuthEnabled)}
                      containerVariants={containerVariants}
                      cardVariants={cardVariants}
                      itemVariants={itemVariants}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="absolute inset-0 h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
                <div className="text-center space-y-4">
                  <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-slate-500">Loading dashboard preview...</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DashboardFooter />
        </div>
      </motion.div>
    </div>
  );
};

// Optimized Sub-components
const BrowserHeader = () => (
  <div className="bg-white/70 backdrop-blur-lg px-4 py-2 border-b border-slate-200/60 flex items-center justify-between sticky top-0 z-30">
    <div className="flex space-x-1.5">
      {['red-500', 'yellow-500', 'green-500'].map(color => (
        <motion.div
          key={color}
          className={`w-2 h-2 bg-${color} rounded-full`}
          whileHover={{ scale: 1.2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        />
      ))}
    </div>
    <div className="flex-grow text-center">
      <motion.div
        className="mx-auto bg-slate-100/60 rounded-md flex items-center justify-center px-3 py-0.5 text-xs text-slate-500 border border-slate-300/50"
        whileHover={{ y: -1 }}
      >
        <Lock size={9} className="mr-1.5 text-violet-500" /> productbazar.in/dashboard
      </motion.div>
    </div>
    <div className="w-16 text-right">
      <span className="font-medium whitespace-nowrap text-[9px] text-slate-400 hidden md:inline">
        {new Date().toLocaleDateString('en-US', { weekday: 'long' }).split(',')[0]}
      </span>
    </div>
  </div>
);

const AppHeader = () => (
  <motion.div
    className="bg-white/70 backdrop-blur-lg px-5 py-3 border-b border-slate-100/60 flex items-center justify-between"
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
    }}
  >
    <motion.div 
      className="flex items-center"
      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
    >
      <motion.div
        className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold rounded-lg flex items-center justify-center text-sm w-8 h-8 p-1 mr-3 shadow-md shadow-violet-300/50"
        whileHover={{ scale: 1.08 }}
      >
        PB
      </motion.div>
      <div>
        <h2 className="text-sm font-semibold text-slate-800 tracking-tight">ProductBazar</h2>
        <p className="text-xs text-violet-600 mt-0.5">Dashboard</p>
      </div>
    </motion.div>
    <div className="flex items-center space-x-1.5">
      <HeaderButton label="Search">
        <Search size={15} />
      </HeaderButton>
      <HeaderButton label="Notifications">
        <Bell size={15} />
        <motion.span
          className="absolute top-0.5 right-0.5 block w-1.5 h-1.5 bg-red-500 rounded-full border border-white"
          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </HeaderButton>
      <motion.button
        className="flex items-center p-1.5 rounded-full transition-colors duration-200 hover:bg-slate-100/70 focus:outline-none focus:ring-1 focus:ring-violet-500"
        whileHover={{ scale: 1.05 }}
        aria-label="User Profile"
      >
        <div className="w-6 h-6 bg-gradient-to-br from-violet-100 to-violet-200 text-violet-600 rounded-full flex items-center justify-center shadow-sm">
          <User size={12} />
        </div>
      </motion.button>
    </div>
  </motion.div>
);

const HeaderButton = ({ children, label }) => (
  <motion.button
    className="relative p-2 rounded-full transition-colors duration-200 text-slate-500 hover:bg-violet-100/70 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-400"
    whileHover={{ scale: 1.18 }}
    whileTap={{ scale: 0.92 }}
    aria-label={label}
  >
    {children}
  </motion.button>
);

const TabNavigation = ({ tabs, activeTab, onTabClick, isClient }) => (
  <div className="flex border-b border-slate-200/70 bg-white/60 backdrop-blur-md px-4">
    {isClient && tabs ? (
      tabs.map((tab, index) => (
        <motion.button
          key={`${tab.name}-${index}`}
          onClick={() => onTabClick(index)}
          className={`relative flex items-center px-4 py-3 text-xs font-medium transition-colors duration-200 ${
            activeTab === index ? 'text-violet-600' : 'text-slate-500 hover:text-violet-600'
          }`}
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <motion.span
            className={`mr-1.5 transition-colors duration-200 ${
              activeTab === index ? 'text-violet-500' : 'text-slate-400'
            }`}
            animate={{ scale: activeTab === index ? 1.1 : 1 }}
          >
            {tab.icon}
          </motion.span>
          {tab.name}
          {activeTab === index && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-violet-500 to-purple-600 rounded-t-full"
              layoutId="activeTabIndicator"
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            />
          )}
        </motion.button>
      ))
    ) : (
      <div className="flex">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="px-4 py-3 text-xs text-slate-400 animate-pulse">
            Loading...
          </div>
        ))}
      </div>
    )}
  </div>
);

const TabContent = ({ 
  activeTab, 
  performanceData, 
  productsData, 
  analyticsData,
  notificationsEnabled,
  twoFactorAuthEnabled,
  onNotificationToggle,
  on2FAToggle,
  containerVariants,
  cardVariants,
  itemVariants 
}) => {
  switch (activeTab) {
    case 0:
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {performanceData.map(item => (
            <MetricCard key={item.label} item={item} cardVariants={cardVariants} />
          ))}
          <div className="sm:col-span-2 lg:col-span-4">
            <RevenueCard cardVariants={cardVariants} />
          </div>
        </motion.div>
      );
    case 1:
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <ProductListCard productsData={productsData} cardVariants={cardVariants} itemVariants={itemVariants} />
          <FeaturedLaunchCard cardVariants={cardVariants} />
        </motion.div>
      );
    case 2:
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {analyticsData.map(item => (
            <AnalyticsCard key={item.name} item={item} cardVariants={cardVariants} />
          ))}
        </motion.div>
      );
    case 3:
      return (
        <SettingsCard
          notificationsEnabled={notificationsEnabled}
          twoFactorAuthEnabled={twoFactorAuthEnabled}
          onNotificationToggle={onNotificationToggle}
          on2FAToggle={on2FAToggle}
          cardVariants={cardVariants}
          itemVariants={itemVariants}
        />
      );
    default:
      return null;
  }
};

const DashboardFooter = () => (
  <div className="bg-white/60 border-slate-200/60 backdrop-blur-md px-5 py-2.5 border-t flex items-center justify-between text-xs">
    <div className="flex items-center space-x-4 text-slate-500">
      <motion.div className="flex items-center" whileHover={{ x: 1.5 }}>
        <motion.div
          className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5"
          animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        All systems operational
      </motion.div>
      <div className="hidden sm:flex items-center text-[10px]">
        <Clock size={9} className="mr-1" /> Last update:
        <span className="font-medium ml-1 text-slate-600">Just now</span>
      </div>
    </div>
    <Link href="/product/new">
      <motion.button
        className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-600 text-white text-[10px] font-medium py-1.5 px-3 rounded-md transition-all flex items-center shadow-md shadow-violet-300/50 focus:outline-none focus:ring-1 focus:ring-violet-500"
        whileHover={{ scale: 1.04, y: -1.5 }}
        whileTap={{ scale: 0.97 }}
      >
        <Plus size={12} className="mr-1 -ml-0.5" /> Add Product
      </motion.button>
    </Link>
  </div>
);

const MetricCard = ({ item, cardVariants, itemVariants }) => {
  const progressValue = ((item.label.length * 5) % 30) + 65;
  const color = colorMap[item.color] || colorMap.slate;
  return (
    <motion.div
      variants={cardVariants || itemVariants}
      whileHover="hover"
      className="bg-white/60 border-slate-200/50 backdrop-blur-xl rounded-lg p-3.5 shadow-lg border cursor-default group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <motion.span
            className={`flex items-center justify-center w-7 h-7 rounded-lg mr-2.5 ${color.bg} ${color.text} shadow-sm group-hover:shadow-md transition-all duration-300`}
            whileHover={{ scale: 1.12, rotate: 6 }}
            transition={{ type: 'spring', stiffness: 350, damping: 15 }}
          >
            {item.icon}
          </motion.span>
          <span className="text-xs font-medium text-slate-600">{item.label}</span>
        </div>
        <motion.span
          className="text-xs font-medium flex items-center text-emerald-500 px-1.5 py-0.5 rounded-full bg-emerald-100/70 group-hover:shadow-sm transition-all duration-300"
          whileHover={{ scale: 1.06 }}
        >
          <ArrowUp size={10} className="mr-0.5" />
          {item.change}
        </motion.span>
      </div>
      <p
        className={`text-xl font-bold ${color.text} ml-10 group-hover:ml-9 group-hover:${color.text} transition-all duration-300`}
      >
        {item.value}
      </p>
      <div className="w-full h-1.5 mt-3 rounded-full bg-slate-200/50 overflow-hidden">
        <motion.div
          className={`h-1.5 rounded-full bg-gradient-to-r ${color.gradFrom} ${color.gradTo}`}
          initial={{ width: '0%' }}
          animate={{ width: `${progressValue}%` }}
          transition={{ delay: 0.3, duration: 0.9, ease: 'circOut' }}
        />
      </div>
    </motion.div>
  );
};

const AnalyticsCard = ({ item, cardVariants, itemVariants }) => {
  const color = colorMap[item.color] || colorMap.slate;
  return (
    <motion.div
      variants={cardVariants || itemVariants}
      whileHover="hover"
      className="bg-white/60 border-slate-200/50 backdrop-blur-xl rounded-lg p-4 shadow-lg border cursor-default group"
    >
      <div className="flex items-center mb-3">
        <motion.span
          className={`flex items-center justify-center w-9 h-9 rounded-lg mr-3 ${color.bg} ${color.text} shadow-sm group-hover:shadow-md transition-all duration-300`}
          whileHover={{ scale: 1.12, rotate: 6 }}
          transition={{ type: 'spring', stiffness: 350, damping: 15 }}
        >
          {item.icon}
        </motion.span>
        <div>
          <span className="text-xs font-medium text-slate-500">{item.name}</span>
          <p
            className={`text-lg font-bold ${color.text} group-hover:translate-x-0.5 transition-transform duration-300`}
          >
            {item.value}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-opacity-30 border-slate-300">
        <motion.span
          className="text-xs font-medium flex items-center text-emerald-500 px-1.5 py-0.5 rounded-full bg-emerald-100/70 group-hover:shadow-sm transition-all duration-300"
          whileHover={{ scale: 1.06 }}
        >
          <ArrowUp size={10} className="mr-0.5" />
          {item.change}
        </motion.span>
        <span className="text-[10px] text-slate-400 italic">{item.period}</span>
      </div>
    </motion.div>
  );
};

const RevenueCard = ({ cardVariants }) => {
  const lineData = [12, 19, 15, 22, 27, 25, 32, 35, 41, 46, 39, 45];
  const areaData = [8, 12, 10, 14, 16, 18, 20, 22, 26, 30, 24, 28];
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className="bg-white/60 border-slate-200/50 backdrop-blur-xl rounded-lg p-4 shadow-lg border cursor-default w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-700 text-sm flex items-center">
          <BarChart3 size={14} className="mr-2 text-violet-500" /> Revenue Overview
        </h3>
        <div className="flex space-x-2">
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 cursor-pointer hover:brightness-110 transition-all">
            Week
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-violet-100 text-violet-600 font-medium cursor-pointer hover:brightness-110 transition-all">
            Month
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 cursor-pointer hover:brightness-110 transition-all">
            Year
          </span>
        </div>
      </div>
      <div className="h-40 mb-3 p-3 rounded-lg border bg-slate-50/60 border-slate-200/40 shadow-inner backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-full h-px bg-slate-300/40" />
          ))}
        </div>
        <div className="absolute left-3 top-0 h-full flex flex-col justify-between text-[8px] py-3">
          {['$50k', '$40k', '$30k', '$20k', '$10k'].map((label, i) => (
            <div key={i} className="text-slate-400">
              {label}
            </div>
          ))}
        </div>
        <div className="absolute bottom-3 left-10 right-3 h-[calc(100%-24px)]">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d={`M0,100 ${areaData
                .map((d, i) => `L${(i * 100) / (areaData.length - 1)},${100 - d * 2}`)
                .join(' ')} L100,100 Z`}
              fill="url(#areaGradientLight)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 1.2, delay: 0.25 }}
            />
            <motion.path
              d={`M0,${100 - lineData[0] * 2} ${lineData
                .map((d, i) => `L${(i * 100) / (lineData.length - 1)},${100 - d * 2}`)
                .join(' ')}`}
              stroke="#8b5cf6"
              strokeWidth="2.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, ease: 'easeInOut' }}
            />
            {lineData.map((d, i) => (
              <motion.circle
                key={i}
                cx={`${(i * 100) / (lineData.length - 1)}%`}
                cy={`${100 - d * 2}%`}
                r="2.5"
                fill="#8b5cf6"
                stroke="white"
                strokeWidth="1.5"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.9 + i * 0.06 }}
                className="hover:r-3.5 cursor-pointer transition-all"
              />
            ))}
            <motion.circle
              cx={`${(9 * 100) / (lineData.length - 1)}%`}
              cy={`${100 - lineData[9] * 2}%`}
              r="3.5"
              fill="#8b5cf6"
              stroke="white"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1.1 }}
              transition={{ duration: 0.6, delay: 1.6 }}
              className="cursor-pointer"
            />
            <defs>
              <linearGradient id="areaGradientLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
              </linearGradient>
            </defs>
          </svg>
          <div
            className="absolute px-2 py-1 rounded-md text-[10px] font-medium bg-violet-100 text-violet-700 shadow-md pointer-events-none"
            style={{
              left: `${(9 * 100) / (lineData.length - 1)}%`,
              top: `${100 - lineData[9] * 2 - 12}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            Oct: $46,845
          </div>
        </div>
        <div className="absolute bottom-1 left-10 right-3 flex justify-between text-[8px]">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
            (month, i) => (
              <div
                key={i}
                className={`${i === 9 ? 'text-violet-600 font-semibold' : 'text-slate-400'}`}
              >
                {month}
              </div>
            )
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center text-xs mb-1 text-slate-600">
            <span>Monthly Target:</span>
            <span className="font-semibold ml-1.5 text-violet-600">$92,845 / $100,000</span>
          </div>
          <div className="w-48 bg-slate-200/50 rounded-full h-1.5">
            <motion.div
              className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: '92.8%' }}
              transition={{ delay: 0.6, duration: 1.2, ease: 'circOut' }}
            />
          </div>
        </div>
        <div className="text-right text-emerald-500 text-xs font-medium">
          <div className="flex items-center justify-end">
            <ArrowUp size={12} className="mr-0.5" />
            <span>18.4%</span>
          </div>
          <span className="text-[10px] text-slate-400">vs last month</span>
        </div>
      </div>
    </motion.div>
  );
};

const ProductListCard = ({ productsData, cardVariants, itemVariants }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    className="bg-white/60 border-slate-200/50 backdrop-blur-xl rounded-lg p-4 shadow-lg border cursor-default md:col-span-2"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-medium text-slate-700 text-sm flex items-center">
        <Package size={14} className="mr-2 text-violet-500" /> Product Performance
      </h3>
      <span className="text-[10px] px-2 py-1 rounded-full bg-violet-100 text-violet-600 font-medium">
        Active
      </span>
    </div>
    <div className="space-y-3">
      {productsData.map((product, index) => {
        const color = colorMap[product.color] || colorMap.slate;
        return (
          <motion.div
            key={product.name}
            variants={itemVariants}
            className="flex items-center p-3 rounded-lg border border-slate-200/50 bg-white/60 shadow-md group relative overflow-hidden"
            whileHover={{ y: -2.5, backgroundColor: 'rgba(238,242,255,0.5)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            <motion.div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.bg} ${color.text} flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-all duration-300`}
              whileHover={{ scale: 1.12, rotate: 6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            >
              {product.icon}
            </motion.div>
            <div className="flex-grow">
              <div className="flex justify-between items-baseline">
                <p className="font-medium text-xs text-slate-700">
                  {product.name}
                </p>
                <motion.span
                  className="text-xs font-medium flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-600 group-hover:shadow-sm transition-all duration-300"
                  whileHover={{ scale: 1.06 }}
                >
                  <ArrowUp size={9} className="mr-0.5" />
                  {product.change}
                </motion.span>
              </div>
              <div className="relative mt-2">
                <div className="w-full bg-slate-200/50 rounded-full h-1.5">
                  <motion.div
                    className={`h-1.5 rounded-full bg-gradient-to-r ${color.gradFrom} ${color.gradTo}`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${product.progress}%` }}
                    transition={{ delay: 0.35 + index * 0.12, duration: 0.9, ease: 'circOut' }}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[9px] text-slate-500">
                <span className="flex items-center">
                  <Users size={9} className="mr-1" /> {product.users}
                </span>
                <span className="flex items-center">
                  <Target size={9} className="mr-1" /> {product.target}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  </motion.div>
);

const FeaturedLaunchCard = ({ cardVariants }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    className="bg-white/60 border-slate-200/50 backdrop-blur-xl rounded-lg p-4 shadow-lg border cursor-default md:col-span-1 self-start"
  >
    <h3 className="font-medium text-slate-700 mb-3 text-sm flex items-center">
      <Sparkles size={14} className="mr-2 text-amber-400" /> Featured Launch
    </h3>
    <div className="p-4 rounded-lg border bg-gradient-to-br from-violet-100/70 to-purple-100/70 border-violet-200/70 shadow-inner relative overflow-hidden group">
      <div className="absolute -right-12 -top-12 w-24 h-24 bg-purple-600/15 rounded-full blur-2xl group-hover:bg-purple-600/25 transition-all duration-700"></div>
      <div className="absolute -left-8 -bottom-8 w-20 h-20 bg-violet-500/10 rounded-full blur-xl group-hover:bg-violet-500/20 transition-all duration-700"></div>
      <div className="relative">
        <motion.div
          whileHover={{ scale: 1.18, rotate: 6 }}
          className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-violet-500 mb-3 shadow-lg cursor-grab"
        >
          <Code size={24} strokeWidth={1.5} />
        </motion.div>
        <p className="font-medium text-sm text-slate-800">AI Code Assistant</p>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium flex items-center mt-1 text-emerald-500">
            <TrendingUp size={11} className="mr-1" /> Trending High
          </p>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">
            New
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
          <span>Release: Today</span>
          <span>Users: 2.4k+</span>
        </div>
        <motion.button
          className="mt-3 w-full bg-violet-500 hover:bg-violet-600 text-white text-[10px] font-medium py-2 px-3 rounded-md transition-all shadow-md shadow-violet-300/50 pointer-events-auto focus:outline-none focus:ring-1 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-white"
          whileHover={{ scale: 1.04, y: -1.5, boxShadow: '0 5px 12px rgba(124,58,237,0.2)' }}
          whileTap={{ scale: 0.97 }}
        >
          View Details <ChevronRight size={12} className="inline ml-0.5" />
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const SettingsCard = ({
  notificationsEnabled,
  twoFactorAuthEnabled,
  onNotificationToggle,
  on2FAToggle,
  cardVariants,
  itemVariants,
}) => (
  <motion.div
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    className="bg-white/60 border-slate-200/50 backdrop-blur-xl rounded-lg p-5 shadow-lg border cursor-default max-w-md mx-auto"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-medium text-slate-700 text-sm flex items-center">
        <Settings size={14} className="mr-2 text-violet-500" /> System Settings
      </h3>
      <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">Admin</span>
    </div>
    <div className="space-y-3">
      <SettingsRow
        label="Email Notifications"
        description="Receive email updates about your account activity"
        icon={<BellIcon size={15} />}
        variants={itemVariants}
        iconColor="violet"
      >
        <ToggleButton
          checked={notificationsEnabled}
          onChange={onNotificationToggle}
          activeColor="violet"
        />
      </SettingsRow>
      <SettingsRow
        label="Two-Factor Auth"
        description="Add an extra layer of security to your account"
        icon={<Shield size={15} />}
        variants={itemVariants}
        iconColor="emerald"
      >
        <ToggleButton
          checked={twoFactorAuthEnabled}
          onChange={on2FAToggle}
          activeColor="emerald"
        />
      </SettingsRow>
    </div>
  </motion.div>
);

const SettingsRow = ({ label, description, icon, children, variants, iconColor = 'slate' }) => {
  const color = colorMap[iconColor] || colorMap.slate;
  return (
    <motion.div
      variants={variants}
      className="flex items-center justify-between p-3 rounded-lg border border-slate-200/70 hover:bg-violet-50/40 group"
      whileHover={{ x: 2.5 }}
    >
      <div className="flex items-center">
        <motion.div
          className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-sm group-hover:shadow-md transition-all duration-300 ${color.bg} ${color.text}`}
          whileHover={{ scale: 1.12, rotate: 6 }}
          transition={{ type: 'spring', stiffness: 350, damping: 15 }}
        >
          {icon}
        </motion.div>
        <div>
          <p className="text-xs font-medium text-slate-700">{label}</p>
          {description && <p className="text-[9px] text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="pointer-events-auto">{children}</div>
    </motion.div>
  );
};

const ToggleButton = ({ checked, onChange, activeColor = 'violet' }) => {
  const activeColors = {
    violet: 'bg-violet-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
  };

  return (
    <motion.button
      onClick={onChange}
      aria-pressed={checked}
      className={`w-10 h-5 rounded-full relative cursor-pointer flex items-center p-0.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-white transition-colors duration-200 ${
        checked ? activeColors[activeColor] || activeColors.violet : 'bg-slate-300'
      }`}
    >
      <motion.div
        className="w-4 h-4 bg-white rounded-full shadow-md"
        initial={false}
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      />
    </motion.button>
  );
};

// Production-safe wrapper component
const DashboardPreview = () => {
  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<DashboardLoadingFallback />}>
        <DashboardPreviewCore />
      </Suspense>
    </DashboardErrorBoundary>
  );
};

export default DashboardPreview;
