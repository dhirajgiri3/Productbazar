'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Briefcase,
  FileText,
  DollarSign,
  Layers,
  Code,
  Users,
  Bookmark,
  Grid,
  Clock,
  ArrowRight,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useCategories } from '@/lib/contexts/category-context';
import { useOnClickOutside } from '@/lib/hooks/useOnClickOutside';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingBanner from './OnboardingBanner.jsx';
import SearchModal from '../Modal/Search/SearchModal.jsx';
import CategoryIcon from '../UI/CategoryIcon';
import ProfilePicture from '../common/ProfilePicture.jsx';

// Smart menu prioritization system for responsive header
const useSmartMenuLayout = (allMenus, screenWidth, user) => {
  return useMemo(() => {
    // Screen size breakpoints
    const breakpoints = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    };

    // Role-based menu importance scoring
    const getMenuImportanceScore = (menu) => {
      let score = 0;
      
      // Admin menus should NEVER appear in primary menu - force them to More dropdown
      if (menu.category === 'admin' || menu.id === 'admin') {
        return -1000; // Negative score ensures they never appear in primary
      }
      
      // Base importance from menu definition
      if (menu.importance === 'high') score += 100;
      else if (menu.importance === 'medium') score += 50;
      else if (menu.importance === 'low') score += 25;
      
      // Active menu gets highest priority
      if (menu.isActive) score += 1000;
      
      // Role-specific scoring
      const userRole = user?.role;
      const secondaryRoles = user?.secondaryRoles || [];
      
      // Core business features get higher priority for relevant roles
      if (menu.id === 'my-products' && ['maker', 'startupOwner'].includes(userRole)) score += 200;
      if (menu.id === 'jobs' && ['jobseeker', 'freelancer'].includes(userRole)) score += 200;
      if (menu.id === 'post-jobs' && ['agency', 'startupOwner'].includes(userRole)) score += 150;
      if (menu.id === 'projects' && ['freelancer', 'maker'].includes(userRole)) score += 150;
      if (menu.id === 'services' && ['agency', 'freelancer'].includes(userRole)) score += 150;
      if (menu.id === 'invest' && userRole === 'investor') score += 200;
      
      // Reduce priority for low-priority categories
      if (menu.category === 'user') score -= 50;
      
      return score;
    };

    // Separate menus by categories - exclude admin from core menus
    const coreMenus = allMenus.filter(menu => 
      ['core', 'jobs', 'projects', 'services', 'investment'].includes(menu.category) &&
      menu.category !== 'admin' && menu.id !== 'admin'
    );
    const userMenus = allMenus.filter(menu => menu.category === 'user');
    const adminMenus = allMenus.filter(menu => menu.category === 'admin' || menu.id === 'admin');
    
    // Score and sort core menus
    const scoredCoreMenus = coreMenus
      .map(menu => ({ ...menu, score: getMenuImportanceScore(menu) }))
      .sort((a, b) => b.score - a.score);

    // Smart distribution based on screen size - maximum 2 menus for better responsive UI
    let maxPrimaryMenus = 2; // Base: show only 2 most important
    let showSubmitButton = true;
    
    if (screenWidth >= breakpoints.xl) {
      maxPrimaryMenus = 2; // XL screens show 2 (changed from 3)
    } else if (screenWidth >= breakpoints.lg) {
      maxPrimaryMenus = 2; // Large screens show 2
    } else if (screenWidth >= breakpoints.md) {
      maxPrimaryMenus = 2; // Medium screens show 2
    } else {
      maxPrimaryMenus = 1; // Small screens show only 1
      showSubmitButton = false; // Hide submit button on very small screens
    }

    // Always ensure we have at least the most important menu if available
    maxPrimaryMenus = Math.min(maxPrimaryMenus, scoredCoreMenus.length);

    // Distribution logic
    const primaryMenus = scoredCoreMenus.slice(0, maxPrimaryMenus);
    const moreMenus = scoredCoreMenus.slice(maxPrimaryMenus);
    
    // Enhanced user dropdown with better organization
    const organizedUserMenus = userMenus.reduce((acc, menu) => {
      const category = getMenuCategory(menu.id);
      if (!acc[category]) acc[category] = [];
      acc[category].push(menu);
      return acc;
    }, {});

    // Add overflow menus to More dropdown
    const enhancedMoreMenus = [
      ...moreMenus,
      // Always add admin menus to More dropdown for better organization
      ...adminMenus,
      // Add some user menus to More if they're important
      ...userMenus.filter(menu => 
        ['bookmarks', 'history'].includes(menu.id) && maxPrimaryMenus < 2
      )
    ];

    return {
      primary: primaryMenus,
      more: enhancedMoreMenus,
      userDropdown: organizedUserMenus,
      showSubmitButton,
      stats: {
        totalMenus: allMenus.length,
        distribution: `Primary: ${primaryMenus.length}, More: ${enhancedMoreMenus.length}, User: ${userMenus.length}`,
        screenSize: screenWidth >= breakpoints.xl ? 'xl' : 
                   screenWidth >= breakpoints.lg ? 'lg' : 
                   screenWidth >= breakpoints.md ? 'md' : 'sm',
        topScores: primaryMenus.map(m => `${m.label}:${m.score}`).join(', ')
      }
    };
  }, [allMenus, screenWidth, user]);
};

// Helper function to categorize user menus
const getMenuCategory = (menuId) => {
  const categoryMap = {
    'profile': 'profile',
    'bookmarks': 'activity', 
    'history': 'activity',
    'settings': 'settings'
    // admin menus are now handled in the More dropdown, not in user dropdown
  };
  return categoryMap[menuId] || 'other';
};

// Enhanced NavItem with priority indicators
const NavItem = ({ label, isActive, href, onClick, icon, priority, showPriority = false }) => (
  <motion.div 
    whileHover={{ y: -2 }} 
    whileTap={{ y: 0 }} 
    className="relative group"
  >
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-2.5 text-sm font-medium transition-all duration-300 rounded-xl border border-transparent relative whitespace-nowrap ${
        isActive
          ? 'text-violet-700 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200/50 shadow-sm'
          : 'text-gray-600 hover:text-violet-700 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/50 hover:border-violet-200/30'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon && (
        <span className={`transition-colors duration-300 ${
          isActive ? 'text-violet-600' : 'text-gray-500 group-hover:text-violet-600'
        }`}>
          {icon}
        </span>
      )}
      {label}
      {showPriority && priority <= 3 && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      )}
      {isActive && (
        <motion.div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-violet-600 rounded-full shadow-sm"
          layoutId="navIndicator"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  </motion.div>
);

const AuthSection = ({
  userMenuRef,
  setIsUserMenuOpen,
  isUserMenuOpen,
  handleLogout,
  organizedUserMenus = {},
}) => {
  const { user, isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 bg-gradient-to-tr from-gray-200 to-gray-300 rounded-full shadow-sm" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Count total user menu items
    const totalUserMenus = Object.values(organizedUserMenus).flat().length;
    
    return (
      <div ref={userMenuRef} className="relative">
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="flex items-center gap-3 p-1.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors duration-150 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/50 relative"
          aria-expanded={isUserMenuOpen}
          aria-label="User menu"
        >
          <ProfilePicture
            user={user}
            size={36}
            showStatus={true}
            variant="default"
            enableHover={false}
            statusColor="green"
          />
          {/* Menu count indicator - only show if there are user menus */}
          {totalUserMenus > 0 && (
            <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {totalUserMenus}
            </span>
          )}
          <div
            className={`transition-transform duration-150 ${isUserMenuOpen ? 'rotate-180' : 'rotate-0'}`}
          >
            <ChevronDown
              size={16}
              className="text-gray-400 hover:text-violet-600 transition-colors duration-150"
            />
          </div>
        </button>

        <AnimatePresence>
          {isUserMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-3xl z-20 overflow-hidden shadow-2xl"
            >
              {/* Enhanced User Info Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-violet-50/80 via-purple-50/80 to-indigo-50/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-200/30 to-purple-200/30 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-indigo-200/30 to-violet-200/30 rounded-full translate-y-4 -translate-x-4" />

                <div className="flex items-center gap-4 relative z-10">
                  <ProfilePicture
                    user={user}
                    size={56}
                    showStatus={true}
                    variant="default"
                    statusColor="green"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate">
                      {user.firstName || 'User'} {user.lastName || ''}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {user.email || user.phone || 'No contact info'}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.role && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-100/80 text-violet-700 backdrop-blur-sm border border-violet-200/50">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </div>
                      )}
                      {user.secondaryRoles && user.secondaryRoles.length > 0 && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100/80 text-blue-700 backdrop-blur-sm border border-blue-200/50">
                          +{user.secondaryRoles.length}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Organized User Menu Items */}
              <div className="py-3 max-h-80 overflow-y-auto">
                {Object.keys(organizedUserMenus).length > 0 ? (
                  <>
                    {/* Profile Section */}
                    {organizedUserMenus.profile && organizedUserMenus.profile.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-2">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Profile
                          </div>
                        </div>
                        {organizedUserMenus.profile.map((menu, index) => (
                          <MenuDropdownItem
                            key={menu.id}
                            menu={menu}
                            index={index}
                            onClose={() => setIsUserMenuOpen(false)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Activity Section */}
                    {organizedUserMenus.activity && organizedUserMenus.activity.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-2">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Activity
                          </div>
                        </div>
                        {organizedUserMenus.activity.map((menu, index) => (
                          <MenuDropdownItem
                            key={menu.id}
                            menu={menu}
                            index={index + 10}
                            onClose={() => setIsUserMenuOpen(false)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Settings Section */}
                    {organizedUserMenus.settings && organizedUserMenus.settings.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-2">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Settings
                          </div>
                        </div>
                        {organizedUserMenus.settings.map((menu, index) => (
                          <MenuDropdownItem
                            key={menu.id}
                            menu={menu}
                            index={index + 20}
                            onClose={() => setIsUserMenuOpen(false)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Other uncategorized menus */}
                    {organizedUserMenus.other && organizedUserMenus.other.length > 0 && (
                      <div className="mb-2">
                        {organizedUserMenus.other.map((menu, index) => (
                          <MenuDropdownItem
                            key={menu.id}
                            menu={menu}
                            index={index + 40}
                            onClose={() => setIsUserMenuOpen(false)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500">
                    <div className="text-sm">No additional options available</div>
                  </div>
                )}
              </div>

              {/* Enhanced Logout Button */}
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 hover:text-red-700 transition-all duration-150 rounded-2xl group"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 group-hover:bg-red-100 transition-all duration-150 mr-3">
                    <LogOut size={18} className="text-red-500 group-hover:text-red-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Sign Out</div>
                    <div className="text-xs text-red-400">End your session</div>
                  </div>
                  <ArrowRight size={14} className="text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-150 group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/auth/login"
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-violet-700 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/50 rounded-xl transition-all duration-300 border border-transparent hover:border-violet-200/50"
        >
          Log In
        </Link>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Link
          href="/auth/register"
          className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 rounded-xl transition-colors duration-150 border border-violet-500/20"
        >
          Sign Up
        </Link>
      </motion.div>
    </div>
  );
};

// Reusable dropdown menu item component
const MenuDropdownItem = ({ menu, index, onClose }) => {
  const getMenuItemStyle = (menuId) => {
    const colorMap = {
      profile: 'bg-blue-50 text-blue-600',
      bookmarks: 'bg-yellow-50 text-yellow-600',
      history: 'bg-indigo-50 text-indigo-600',
      settings: 'bg-gray-50 text-gray-600',
      'my-jobs': 'bg-teal-50 text-teal-600',
      'post-jobs': 'bg-emerald-50 text-emerald-600',
      invest: 'bg-green-50 text-green-600',
      admin: 'bg-red-50 text-red-600',
      projects: 'bg-purple-50 text-purple-600',
      services: 'bg-orange-50 text-orange-600',
    };
    return colorMap[menuId] || 'bg-gray-50 text-gray-600';
  };

  const getMenuDescription = (menuId) => {
    const descriptionMap = {
      profile: 'Manage your public profile',
      bookmarks: 'Your saved products',
      history: 'Recent activity and views',
      settings: 'Account preferences',
      'my-jobs': 'Manage job postings',
      'post-jobs': 'Create job listings',
      invest: 'Investment opportunities',
      admin: 'Administrative tools',
      projects: 'Your project portfolio',
      services: 'Service offerings',
    };
    return descriptionMap[menuId] || 'Access this feature';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={menu.href}
        className={`flex items-center px-4 py-3 mx-2 text-sm transition-all duration-300 group rounded-2xl ${
          menu.isActive 
            ? 'bg-violet-100/80 text-violet-700' 
            : 'text-gray-700 hover:bg-violet-50/80 hover:text-violet-700'
        }`}
        onClick={onClose}
      >
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${getMenuItemStyle(menu.id)} transition-all duration-300 mr-3 group-hover:scale-110`}>
          {menu.icon}
        </div>
        <div className="flex-1">
          <div className="font-medium">{menu.label}</div>
          <div className="text-xs text-gray-500">{getMenuDescription(menu.id)}</div>
        </div>
        <ArrowRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
};

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    isAuthenticated,
    logout,
    nextStep,
    isInitialized,
    skipProfileCompletion,
    refreshNextStep,
  } = useAuth();
  const { categories = [] } = useCategories();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  const userMenuRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  useOnClickOutside(userMenuRef, () => setIsUserMenuOpen(false));
  useOnClickOutside(categoryMenuRef, () => setIsCategoryMenuOpen(false));
  useOnClickOutside(moreMenuRef, () => setIsMoreMenuOpen(false));

  // Screen width tracking for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced menu configuration with better role-based logic
  const getAllUserMenus = () => {
    if (!isAuthenticated || !user?.roleCapabilities) {
      return [];
    }

    const allMenus = [
      // Core product-related menus
      ...(user.roleCapabilities.canUploadProducts ? [{
        id: 'my-products',
        label: 'My Products',
        href: `/user/${user.username || user._id || 'profile'}/products`,
        icon: <Briefcase size={16} />,
        isActive: pathname.startsWith('/user/') && pathname.includes('/products'),
        priority: 1,
        category: 'core',
        importance: 'high'
      }] : []),
      
      // Job-related menus
      ...(user.roleCapabilities.canApplyToJobs ? [{
        id: 'jobs',
        label: 'Jobs',
        href: '/jobs',
        icon: <Briefcase size={16} />,
        isActive: pathname.startsWith('/jobs') && !pathname.includes('/post'),
        priority: 2,
        category: 'jobs',
        importance: 'high'
      }] : []),
      
      ...(user.roleCapabilities.canPostJobs ? [{
        id: 'post-jobs',
        label: 'Post Jobs',
        href: '/jobs/post',
        icon: <Plus size={16} />,
        isActive: pathname === '/jobs/post',
        priority: 3,
        category: 'jobs',
        importance: 'medium'
      }, {
        id: 'my-jobs',
        label: 'My Job Posts',
        href: '/user/myjobs',
        icon: <FileText size={16} />,
        isActive: pathname === '/user/myjobs',
        priority: 4,
        category: 'jobs',
        importance: 'medium'
      }] : []),

      // Project-related menus
      ...(user.roleCapabilities.canShowcaseProjects ? [{
        id: 'projects',
        label: 'Projects',
        href: '/projects',
        icon: <Layers size={16} />,
        isActive: pathname.startsWith('/projects'),
        priority: 5,
        category: 'projects',
        importance: 'medium'
      }] : []),

      // Service-related menus
      ...(user.roleCapabilities.canOfferServices ? [{
        id: 'services',
        label: 'Services',
        href: '/services',
        icon: <Code size={16} />,
        isActive: pathname.startsWith('/services'),
        priority: 6,
        category: 'services',
        importance: 'medium'
      }] : []),

      // Investment-related menus
      ...(user.roleCapabilities.canInvest ? [{
        id: 'invest',
        label: 'Invest',
        href: '/invest',
        icon: <DollarSign size={16} />,
        isActive: pathname.startsWith('/invest'),
        priority: 7,
        category: 'investment',
        importance: 'medium'
      }] : []),

      // User profile menus
      {
        id: 'bookmarks',
        label: 'Bookmarks',
        href: '/user/mybookmarks',
        icon: <Bookmark size={16} />,
        isActive: pathname === '/user/mybookmarks',
        priority: 8,
        category: 'user',
        importance: 'medium'
      },
      {
        id: 'history',
        label: 'History',
        href: '/user/history',
        icon: <Clock size={16} />,
        isActive: pathname === '/user/history',
        priority: 9,
        category: 'user',
        importance: 'low'
      },
      {
        id: 'profile',
        label: 'Profile',
        href: `/user/${user.username || user._id || 'profile'}`,
        icon: <User size={16} />,
        isActive: pathname === `/user/${user.username || user._id || 'profile'}`,
        priority: 10,
        category: 'user',
        importance: 'fixed'
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/user/settings',
        icon: <Settings size={16} />,
        isActive: pathname === '/user/settings',
        priority: 11,
        category: 'user',
        importance: 'low'
      },

      // Admin menus
      ...(user.role === 'admin' || user.secondaryRoles?.includes('admin') ? [{
        id: 'admin',
        label: 'Admin Panel',
        href: '/admin/users',
        icon: <Users size={16} />,
        isActive: pathname.includes('/admin'),
        priority: 12,
        category: 'admin',
        importance: 'high'
      }]: []),
    ];

    return allMenus.sort((a, b) => a.priority - b.priority);
  };

  const allUserMenus = getAllUserMenus();
  const { primary: primaryMenus, more: moreMenus, userDropdown: organizedUserMenus, showSubmitButton, stats } = useSmartMenuLayout(allUserMenus, screenWidth, user);

  // Debug info (remove in production)
  console.log('Smart Menu Distribution:', stats);

  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add a ref to prevent multiple concurrent logout attempts
  const logoutInProgressRef = useRef(false);

  const handleLogout = useCallback(async () => {
    // Prevent multiple concurrent logout attempts
    if (logoutInProgressRef.current) {
      console.log('Logout already in progress, ignoring duplicate request');
      return;
    }

    logoutInProgressRef.current = true;

    try {
      // Show immediate feedback
      toast.loading('Logging out...', { id: 'logout-toast' });
      
      const result = await logout();
      
      if (result.success) {
        // Show appropriate success message
        if (result.serverLogoutFailed) {
          toast.success('Logged out successfully', { id: 'logout-toast' });
        } else {
          toast.success(result.message || 'Logged out successfully', { id: 'logout-toast' });
        }
        
        // Navigate to login page after successful logout
        router.push('/auth/login');
      } else {
        // This should rarely happen with the new logout implementation
        toast.error(result.message || 'Failed to log out', { id: 'logout-toast' });
      }
    } catch (error) {
      // Fallback error handling
      console.error('Logout error in header:', error);
      toast.error('Failed to log out', { id: 'logout-toast' });
      
      // Force navigation to login page even on error
      router.push('/auth/login');
    } finally {
      // Reset the flag after a delay to prevent accidental rapid clicks
      setTimeout(() => {
        logoutInProgressRef.current = false;
      }, 2000);
    }
  }, [logout, router]);

  const handleProductSubmit = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to submit a product');
      router.push('/auth/login');
      return;
    }
    if (
      nextStep &&
      (nextStep.type === 'email_verification' || nextStep.type === 'phone_verification')
    ) {
      toast.error('Please verify your contact information first');
      router.push(`/auth/verify-${nextStep.type.split('_')[0]}`);
      return;
    }
    if (user?.roleCapabilities?.canUploadProducts) {
      router.push('/product/new');
    } else {
      toast.error("Your current role doesn't allow product submissions");
      router.push('/user/settings');
    }
  };

  return (
    <>
      <AnimatePresence>
        {isInitialized && isAuthenticated && nextStep && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <OnboardingBanner
              nextStep={nextStep}
              onComplete={() => router.push(`/auth/verify-${nextStep.type.split('_')[0]}`)}
              onSkip={() => {
                skipProfileCompletion();
                refreshNextStep();
              }}
              onRefresh={async () => {
                toast.loading('Refreshing verification status...', { id: 'refresh-toast' });
                try {
                  await refreshNextStep();
                  toast.success('Verification status updated', { id: 'refresh-toast' });
                } catch (error) {
                  toast.error('Failed to refresh status', { id: 'refresh-toast' });
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white/95 backdrop-blur-xl sticky top-0 z-20 border-b border-gray-200/60 supports-[backdrop-filter]:bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2">
          {/* Enhanced Logo Section */}
          <div className="flex items-center gap-4">
            <Link href="/products" aria-label="ProductBazar - Go to homepage">
              <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold relative overflow-hidden transition-all duration-150 hover:scale-105 hover:shadow-lg group">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent group-hover:from-white/30 transition-all duration-150" />
                <span className="relative z-10 text-lg group-hover:scale-110 transition-transform duration-150">PB</span>
              </div>
            </Link>

            {/* Enhanced Desktop Search Bar */}
            <button
              className="hidden sm:flex items-center w-72 md:w-96 h-12 px-5 rounded-2xl border border-gray-200/80 hover:border-violet-400/80 bg-gradient-to-r from-gray-50/90 to-white/90 hover:from-white hover:to-violet-50/50 text-gray-500 hover:text-violet-600 transition-all duration-150 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 relative backdrop-blur-sm group"
              onClick={() => setIsSearchModalOpen(true)}
              aria-label="Search"
            >
              <Search size={18} className="mr-4 text-violet-500 group-hover:text-violet-600 transition-colors" />
              <span className="text-sm font-medium">Search products, startups...</span>
              <span className="absolute right-4 text-xs text-gray-400 bg-gray-100/80 group-hover:bg-violet-100/50 px-2.5 py-1 rounded-lg font-mono transition-all border border-gray-200/50">⌘K</span>
            </button>
          </div>

          {/* Enhanced Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <div ref={categoryMenuRef} className="relative">
              <motion.button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-xl border border-transparent ${
                  pathname.startsWith('/category')
                    ? 'text-violet-700 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200/50'
                    : 'text-gray-600 hover:text-violet-700 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/50 hover:border-violet-200/30'
                }`}
                aria-expanded={isCategoryMenuOpen}
                aria-label="Categories"
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <Grid size={16} className="mr-2" />
                Categories
                <motion.div
                  animate={{ rotate: isCategoryMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={14} className="ml-2" />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {isCategoryMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl z-20"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-tr from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Grid size={16} className="text-white" />
                        </div>
                        <div className="text-sm font-semibold text-gray-900">Browse Categories</div>
                      </div>
                    </div>
                    {categories.length > 0 ? (
                      <div className="py-2">
                        {categories.slice(0, 8).map((category, index) => (
                          <motion.div
                            key={category._id || index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link
                              href={`/category/${
                                category.slug || category.name.toLowerCase().replace(/\s+/g, '-')
                              }`}
                              className="flex items-center px-4 py-3 text-sm text-gray-600 hover:bg-violet-50 hover:text-violet-600 group"
                              onClick={() => setIsCategoryMenuOpen(false)}
                            >
                              <div className="w-8 h-8 bg-gray-100 group-hover:bg-violet-100 rounded-lg flex items-center justify-center mr-3">
                                <CategoryIcon
                                  icon={category.icon}
                                  name={category.name}
                                  size={16}
                                  className="text-gray-600 group-hover:text-violet-600"
                                />
                              </div>
                              <span className="font-medium">{category.name}</span>
                            </Link>
                          </motion.div>
                        ))}
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <Link
                            href="/categories"
                            className="flex items-center justify-between px-4 py-3 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg mx-2 transition-colors"
                            onClick={() => setIsCategoryMenuOpen(false)}
                          >
                            <span className="font-medium">View All Categories</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <div className="text-sm">Loading categories...</div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Primary Navigation Items - Only show top 2 most important */}
            {isAuthenticated && primaryMenus.map((menu) => (
              <NavItem
                key={menu.id}
                label={menu.label}
                isActive={menu.isActive}
                href={menu.href}
                icon={menu.icon}
                priority={menu.priority}
                showPriority={false} // Disable priority indicators for cleaner look
              />
            ))}

            {/* More Menu for All Secondary Items */}
            {isAuthenticated && moreMenus.length > 0 && (
              <div ref={moreMenuRef} className="relative">
                <motion.button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-xl border border-transparent transition-all duration-300 ${
                    isMoreMenuOpen
                      ? 'text-violet-700 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200/50 shadow-sm'
                      : 'text-gray-600 hover:text-violet-700 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/50 hover:border-violet-200/30'
                  }`}
                  aria-expanded={isMoreMenuOpen}
                  aria-label="More options"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <MoreHorizontal size={16} className="mr-2" />
                  More
                  {moreMenus.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full font-medium">
                      {moreMenus.length}
                    </span>
                  )}
                  <motion.div
                    animate={{ rotate: isMoreMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown size={14} className="ml-2" />
                  </motion.div>
                </motion.button>
                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md border border-gray-100/40 rounded-2xl z-20 shadow-lg overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-tr from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <MoreHorizontal size={16} className="text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">More Options</div>
                            <div className="text-xs text-gray-500">{moreMenus.length} additional features</div>
                          </div>
                        </div>
                      </div>
                      <div className="py-2 max-h-80 overflow-y-auto">
                        {moreMenus.map((menu, index) => (
                          <motion.div
                            key={menu.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link
                              href={menu.href}
                              className={`flex items-center px-4 py-3 text-sm group transition-all duration-200 mx-2 rounded-xl ${
                                menu.isActive
                                  ? 'bg-violet-100/80 text-violet-700 border border-violet-200/50'
                                  : 'text-gray-600 hover:bg-violet-50/80 hover:text-violet-600'
                              }`}
                              onClick={() => setIsMoreMenuOpen(false)}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-all duration-200 ${
                                menu.isActive
                                  ? 'bg-violet-200/50 text-violet-600'
                                  : 'bg-gray-100/80 text-gray-600 group-hover:bg-violet-100/80 group-hover:text-violet-600 group-hover:scale-110'
                              }`}>
                                {menu.icon}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{menu.label}</div>
                                <div className="text-xs text-gray-500 capitalize">{menu.category} feature</div>
                              </div>
                              {menu.score > 200 && (
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              )}
                              <ArrowRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {/* Smart Submit Product Button - only show when appropriate */}
            {isInitialized && isAuthenticated && user?.roleCapabilities?.canUploadProducts && showSubmitButton && (
              <motion.button
                onClick={handleProductSubmit}
                className="hidden md:flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 rounded-2xl transition-all duration-150 border border-violet-500/20 relative overflow-hidden group shadow-lg"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                <Plus size={18} className="mr-2 relative z-10" />
                <span className="relative z-10 whitespace-nowrap">Submit Product</span>
              </motion.button>
            )}
            
            <AuthSection
              userMenuRef={userMenuRef}
              setIsUserMenuOpen={setIsUserMenuOpen}
              isUserMenuOpen={isUserMenuOpen}
              handleLogout={handleLogout}
              organizedUserMenus={organizedUserMenus}
            />
            
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-3 text-gray-500 hover:text-violet-600 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/50 rounded-2xl md:hidden focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 border border-transparent hover:border-violet-200/50"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.div>
            </motion.button>
          </div>
      </div>

      {/* Enhanced Mobile Search Bar */}
      <div className="px-4 pb-4 sm:hidden">
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="w-full flex items-center h-12 px-5 rounded-2xl border border-gray-200/80 hover:border-violet-400/80 bg-gradient-to-r from-gray-50/90 to-white/90 hover:from-white hover:to-violet-50/50 text-gray-500 hover:text-violet-600 transition-all duration-150 relative group">
          <Search size={18} className="mr-4 text-violet-500 group-hover:text-violet-600 transition-colors" />
          <span className="text-sm font-medium">Search products, startups...</span>
          <span className="absolute right-4 text-xs text-gray-400 bg-gray-100/80 group-hover:bg-violet-100/80 px-2.5 py-1 rounded-lg font-mono transition-all duration-150 border border-gray-200/50">
            <span className="ml-2">⌘K</span>
          </span>
        </button>
      </div>

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery=""
      />
    </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-11/12 max-w-sm bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-200/50 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    <span>PB</span>
                  </div>
                  <span className="font-semibold text-gray-900">ProductBazar</span>
                </div>
                <motion.button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors duration-200"
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <nav className="flex flex-col gap-2">
                  {/* Categories Section */}
                  <div className="mb-4">
                    <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Categories
                    </h3>
                    {categories.slice(0, 6).map((category, idx) => (
                      <motion.div
                        key={category._id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                      >
                        <Link
                          href={`/category/${category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className="flex items-center px-4 py-3 text-sm text-gray-600 hover:bg-violet-50 hover:text-violet-600 rounded-xl transition-all duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div className="w-8 h-8 bg-gray-100 group-hover:bg-violet-100 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                            <CategoryIcon
                              icon={category.icon}
                              name={category.name}
                              size={16}
                              className="text-gray-600 group-hover:text-violet-600"
                            />
                          </div>
                          {category.name}
                        </Link>
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Link
                        href="/categories"
                        className="flex items-center justify-between px-4 py-3 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-colors mx-0"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="font-medium">View All Categories</span>
                        <ArrowRight size={16} />
                      </Link>
                    </motion.div>
                  </div>

                  {isAuthenticated && (
                    <>
                      {/* Primary Features Section - Most Important */}
                      {primaryMenus.length > 0 && (
                        <div className="mb-4">
                          <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Top Features
                          </h3>
                          {primaryMenus.map((menu, idx) => (
                            <motion.div
                              key={menu.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 + idx * 0.05 }}
                            >
                              <Link
                                href={menu.href}
                                className={`flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                                  menu.isActive
                                    ? 'bg-violet-100 text-violet-700 border border-violet-200/50'
                                    : 'text-gray-600 hover:bg-violet-50 hover:text-violet-600'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {menu.icon && <span className="mr-3">{menu.icon}</span>}
                                <div className="flex-1">
                                  <div className="font-medium">{menu.label}</div>
                                  {menu.score > 200 && (
                                    <div className="text-xs text-violet-600">Priority feature</div>
                                  )}
                                </div>
                                {menu.score > 200 && (
                                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                )}
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* More Features Section */}
                      {moreMenus.length > 0 && (
                        <div className="mb-4">
                          <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            More Features ({moreMenus.length})
                          </h3>
                          {moreMenus.slice(0, 6).map((menu, idx) => (
                            <motion.div
                              key={menu.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 + idx * 0.05 }}
                            >
                              <Link
                                href={menu.href}
                                className={`flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                                  menu.isActive
                                    ? 'bg-violet-100 text-violet-700'
                                    : 'text-gray-600 hover:bg-violet-50 hover:text-violet-600'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {menu.icon && <span className="mr-3">{menu.icon}</span>}
                                <div className="flex-1">
                                  <div className="font-medium">{menu.label}</div>
                                  <div className="text-xs text-gray-500 capitalize">{menu.category}</div>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                          {moreMenus.length > 6 && (
                            <div className="px-4 py-2 text-xs text-gray-500">
                              And {moreMenus.length - 6} more features...
                            </div>
                          )}
                        </div>
                      )}

                      {/* User Profile Section - Organized */}
                      {Object.keys(organizedUserMenus).length > 0 && (
                        <div className="mb-4">
                          <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Profile & Settings
                          </h3>
                          {Object.entries(organizedUserMenus).map(([category, menus]) => 
                            menus.slice(0, 2).map((menu, idx) => (
                              <motion.div
                                key={menu.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + idx * 0.05 }}
                              >
                                <Link
                                  href={menu.href}
                                  className={`flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                                    menu.isActive
                                      ? 'bg-violet-100 text-violet-700'
                                      : 'text-gray-600 hover:bg-violet-50 hover:text-violet-600'
                                  }`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {menu.icon && <span className="mr-3">{menu.icon}</span>}
                                  <div className="flex-1">
                                    <div className="font-medium">{menu.label}</div>
                                    <div className="text-xs text-gray-500 capitalize">{category}</div>
                                  </div>
                                </Link>
                              </motion.div>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </nav>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                {/* Mobile Submit Product Button - show even on small screens for important action */}
                {isAuthenticated && user?.roleCapabilities?.canUploadProducts && (
                  <motion.button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleProductSubmit();
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl mb-3 transition-all duration-200 shadow-lg"
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Plus size={18} className="mr-2" />
                    Submit Product
                  </motion.button>
                )}
                {isAuthenticated ? (
                  <motion.button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <LogOut size={18} className="mr-2" />
                    Sign Out
                  </motion.button>
                ) : (
                  <motion.div
                    className="flex gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Link
                      href="/auth/login"
                      className="flex-1 text-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="flex-1 text-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        :root {
          --primary-color: #8b5cf6;
        }

        button:focus-visible,
        a:focus-visible,
        [role='button']:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
          border-radius: 4px;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        @supports (backdrop-filter: blur(20px)) {
          .supports-backdrop-blur {
            backdrop-filter: blur(20px);
          }
        }

        .glass-morphism {
          background: rgba(255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 0.2);
        }

        .gradient-text {
          background: linear-gradient(to right, #8b5cf6, #a855f7, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        ul, ol, li {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .dropdown-menu ul,
        .dropdown-menu ol,
        .dropdown-menu li {
          list-style: none !important;
          list-style-type: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>
    </>
  );
};

export default Header;