'use client';

import { useState, useEffect, useRef } from 'react';
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
  Home,
  Grid,
  Folder,
  Clock,
  ArrowRight,
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

const NavItem = ({ label, isActive, href, onClick, icon }) => (
  <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }} className="relative group">
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 rounded-xl border border-transparent ${
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
    return (
      <div ref={userMenuRef} className="relative">
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="flex items-center gap-3 p-1.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors duration-150 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/50"
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
          <div
            className={`transition-transform duration-150 ${isUserMenuOpen ? 'rotate-180' : 'rotate-0'}`}
          >
            <ChevronDown
              size={16}
              className="text-gray-400 hover:text-violet-600 transition-colors duration-150"
            />
          </div>
        </button>

        {isUserMenuOpen && (
          <div
            className={`absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-3xl shadow-2xl z-20 overflow-hidden transition-all duration-150 ease-out ${
              isUserMenuOpen
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
            }`}
          >
              {/* User Info Header with enhanced design */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-violet-50/80 via-purple-50/80 to-indigo-50/80 relative overflow-hidden">
                {/* Background decoration */}
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
                    {user.role && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-100/80 text-violet-700 mt-2 backdrop-blur-sm border border-violet-200/50">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Items with enhanced styling */}
              <div className="py-3">
                {[
                  {
                    id: 'profile',
                    href: `/user/${user.username || user._id || 'profile'}`,
                    label: 'View Profile',
                    icon: User,
                    description: 'Manage your public profile',
                    color: 'bg-blue-50 text-blue-600'
                  },
                  {
                    id: 'products',
                    href: `/user/${user.username || user._id || 'products'}/products`,
                    label: 'My Products',
                    icon: Briefcase,
                    description: 'View and manage products',
                    color: 'bg-green-50 text-green-600'
                  },
                  {
                    id: 'history',
                    href: '/user/history',
                    label: 'Activity History',
                    icon: Clock,
                    description: 'Recent activity and views',
                    color: 'bg-yellow-50 text-yellow-600'
                  },
                  ...(user.roleCapabilities?.canApplyToJobs
                    ? [
                        {
                          id: 'applications',
                          href: '/profile/applications',
                          label: 'Job Applications',
                          icon: FileText,
                          description: 'Track your applications',
                          color: 'bg-purple-50 text-purple-600'
                        },
                      ]
                    : []),
                  ...(user.roleCapabilities?.canPostJobs
                    ? [{
                        id: 'myjobs',
                        href: '/user/myjobs',
                        label: 'Posted Jobs',
                        icon: Briefcase,
                        description: 'Manage job postings',
                        color: 'bg-indigo-50 text-indigo-600'
                      }]
                    : []),
                  ...(user.roleCapabilities?.canShowcaseProjects
                    ? [{
                        id: 'myprojects',
                        href: '/projects',
                        label: 'My Projects',
                        icon: Layers,
                        description: 'Showcase your work',
                        color: 'bg-pink-50 text-pink-600'
                      }]
                    : []),
                  {
                    id: 'settings',
                    href: '/user/settings',
                    label: 'Settings',
                    icon: Settings,
                    description: 'Account preferences',
                    color: 'bg-gray-50 text-gray-600'
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center px-4 py-3 mx-2 text-sm text-gray-700 hover:bg-violet-50/80 hover:text-violet-700 transition-all duration-300 group rounded-2xl"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${item.color} transition-all duration-300 mr-3 group-hover:scale-110`}>
                        <item.icon size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500">{item.description}</div>
                        )}
                      </div>
                      <ArrowRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                ))}
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
            </div>
          )}
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
  const userMenuRef = useRef(null);
  const categoryMenuRef = useRef(null);

  useOnClickOutside(userMenuRef, () => setIsUserMenuOpen(false));
  useOnClickOutside(categoryMenuRef, () => setIsCategoryMenuOpen(false));

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

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

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

  const getRoleBasedNavItems = () => {
    if (!user || !user.roleCapabilities) return [];
    const items = [];
    if (user.role === 'admin' || user.secondaryRoles?.includes('admin')) {
      items.push({
        label: 'Admin Dashboard',
        href: '/admin/users',
        isActive: pathname.startsWith('/admin'),
        icon: <Users size={16} />,
      });
    }
    if (user.roleCapabilities.canApplyToJobs) {
      items.push(
        {
          label: 'Jobs',
          href: '/jobs',
          isActive: pathname.startsWith('/jobs') && !pathname.includes('/post'),
          icon: <Briefcase size={16} />,
        },
        {
          label: 'Applications',
          href: '/profile/applications',
          isActive: pathname.startsWith('/profile/applications'),
          icon: <FileText size={16} />,
        }
      );
    }
    if (user.roleCapabilities.canPostJobs) {
      items.push(
        {
          label: 'Post Job',
          href: '/jobs/post',
          isActive: pathname === '/jobs/post',
          icon: <Plus size={16} />,
        },
        {
          label: 'My Jobs',
          href: '/user/myjobs',
          isActive: pathname === '/user/myjobs',
          icon: <Briefcase size={16} />,
        }
      );
    }
    if (user.roleCapabilities.canShowcaseProjects) {
      items.push({
        label: 'Projects',
        href: '/projects',
        isActive: pathname.startsWith('/projects'),
        icon: <Layers size={16} />,
      });
    }
    if (user.roleCapabilities.canOfferServices) {
      items.push({
        label: 'Services',
        href: '/services',
        isActive: pathname.startsWith('/services'),
        icon: <Code size={16} />,
      });
    }
    if (user.roleCapabilities.canInvest) {
      items.push({
        label: 'Invest',
        href: '/invest',
        isActive: pathname.startsWith('/invest'),
        icon: <DollarSign size={16} />,
      });
    }
    return items;
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

      <header className="bg-white/85 backdrop-blur-xl sticky top-0 z-40 border-b border-gray-200/60 supports-[backdrop-filter]:bg-white/85">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2">
          {/* Enhanced Logo Section */}
          <div className="flex items-center gap-4">
            <Link href="/products" aria-label="Home">
              <div
                className="w-12 h-12 bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold relative overflow-hidden transition-transform duration-150 hover:scale-105"
              >
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                <span className="relative z-10 text-lg">PB</span>
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
              <span className="absolute right-4 text-xs text-gray-400 bg-gray-100/80 group-hover:bg-violet-100/80 px-2.5 py-1 rounded-lg font-mono transition-colors border border-gray-200/50">⌘K</span>
            </button>
          </div>

          {/* Enhanced Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavItem
              label="Home"
              isActive={pathname === '/' || pathname === '/products'}
              href="/products"
              icon={<Home size={16} />}
            />
            <div ref={categoryMenuRef} className="relative">
              <motion.button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className={`flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-300 rounded-xl border border-transparent ${
                  pathname.startsWith('/category')
                    ? 'text-violet-700 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200/50 shadow-sm'
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
                    className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl z-20"
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
                              className="flex items-center px-4 py-3 text-sm text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-all duration-200 group"
                              onClick={() => setIsCategoryMenuOpen(false)}
                            >
                              <div className="w-8 h-8 bg-gray-100 group-hover:bg-violet-100 rounded-lg flex items-center justify-center mr-3 transition-colors">
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
            {isAuthenticated && (
              <>
                <NavItem
                  label="Bookmarks"
                  isActive={pathname === '/user/mybookmarks'}
                  href="/user/mybookmarks"
                  icon={<Bookmark size={16} />}
                />
                <div className="relative">
                  <motion.button
                    onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                    className={`flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-300 rounded-xl border border-transparent ${
                      getRoleBasedNavItems().some(item => item.isActive)
                        ? 'text-violet-700 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200/50 shadow-sm'
                        : 'text-gray-600 hover:text-violet-700 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/50 hover:border-violet-200/30'
                    }`}
                    aria-expanded={isCategoryMenuOpen}
                    aria-label="Features"
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                  >
                    <Folder size={16} className="mr-2" />
                    Features
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
                        className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl z-20"
                      >
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-tr from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Folder size={16} className="text-white" />
                            </div>
                            <div className="text-sm font-semibold text-gray-900">Your Features</div>
                          </div>
                        </div>
                        {getRoleBasedNavItems().length > 0 ? (
                          <div className="py-2">
                            {getRoleBasedNavItems().map((item, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Link
                                  href={item.href}
                                  className={`flex items-center px-4 py-3 text-sm transition-all duration-200 group ${
                                    item.isActive
                                      ? 'bg-violet-50 text-violet-600'
                                      : 'text-gray-600 hover:bg-violet-50 hover:text-violet-600'
                                  }`}
                                  onClick={() => setIsCategoryMenuOpen(false)}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${
                                    item.isActive
                                      ? 'bg-violet-100'
                                      : 'bg-gray-100 group-hover:bg-violet-100'
                                  }`}>
                                    {item.icon}
                                  </div>
                                  <span className="font-medium">{item.label}</span>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-6 text-center text-gray-500">
                            <div className="text-sm">No features available</div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {isInitialized && isAuthenticated && user?.roleCapabilities?.canUploadProducts && (
              <button
                onClick={handleProductSubmit}
                className="hidden md:flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 rounded-2xl transition-colors duration-150 border border-violet-500/20 relative overflow-hidden group"
                aria-label="Submit a product"
              >
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                <Plus size={18} className="mr-2 relative z-10" />
                <span className="relative z-10">Submit Product</span>
              </button>
            )}
            <AuthSection
              userMenuRef={userMenuRef}
              setIsUserMenuOpen={setIsUserMenuOpen}
              isUserMenuOpen={isUserMenuOpen}
              handleLogout={handleLogout}
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
            className="w-full flex items-center h-12 px-5 rounded-2xl border border-gray-200/80 hover:border-violet-400/80 bg-gradient-to-r from-gray-50/90 to-white/90 hover:from-white hover:to-violet-50/50 text-gray-500 hover:text-violet-600 transition-all duration-150 relative group"
            aria-label="Search"
          >
            <Search size={18} className="mr-4 text-violet-500 group-hover:text-violet-600 transition-colors" />
            <span className="text-sm font-medium">Search products, startups...</span>
            <span className="absolute right-4 text-xs text-gray-400 bg-gray-100/80 group-hover:bg-violet-100/80 px-2.5 py-1 rounded-lg font-mono transition-colors border border-gray-200/50">⌘K</span>
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
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-11/12 max-w-sm bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-200/50 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    PB
                  </div>
                  <span className="font-semibold text-gray-900">ProductBazar</span>
                </div>
                <motion.button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <nav className="flex flex-col gap-2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Link
                      href="/products"
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        pathname === '/' || pathname === '/products'
                          ? 'bg-violet-100 text-violet-700'
                          : 'text-gray-600 hover:bg-violet-50 hover:text-violet-600'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Home size={18} className="mr-3" />
                      Home
                    </Link>
                  </motion.div>

                  <div className="pt-4">
                    <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Categories
                    </h3>
                    {categories.slice(0, 5).map((category, idx) => (
                      <motion.div
                        key={category._id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + idx * 0.05 }}
                      >
                        <Link
                          href={`/category/${
                            category.slug || category.name.toLowerCase().replace(/\s+/g, '-')
                          }`}
                          className="flex items-center px-4 py-3 text-sm text-gray-600 hover:bg-violet-50 hover:text-violet-600 rounded-xl transition-all duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div className="w-8 h-8 bg-gray-100 hover:bg-violet-100 rounded-lg flex items-center justify-center mr-3 transition-colors">
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
                      <div className="pt-4">
                        <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Quick Access
                        </h3>
                        {[
                          {
                            href: '/user/mybookmarks',
                            label: 'Bookmarks',
                            icon: Bookmark,
                            active: pathname === '/user/mybookmarks',
                          },
                          {
                            href: '/user/history',
                            label: 'Activity History',
                            icon: Clock,
                            active: pathname === '/user/history',
                          },
                        ].map((item, idx) => (
                          <motion.div
                            key={item.href}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + idx * 0.05 }}
                          >
                            <Link
                              href={item.href}
                              className={`flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                                item.active
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'text-gray-600 hover:bg-violet-50 hover:text-violet-600'
                              }`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <item.icon size={18} className="mr-3" />
                              {item.label}
                            </Link>
                          </motion.div>
                        ))}
                      </div>

                      {getRoleBasedNavItems().length > 0 && (
                        <div className="pt-4">
                          <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Your Features
                          </h3>
                          {getRoleBasedNavItems().map((item, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 + index * 0.05 }}
                            >
                              <Link
                                href={item.href}
                                className={`flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                                  item.isActive
                                    ? 'bg-violet-100 text-violet-700'
                                    : 'text-gray-600 hover:bg-violet-50 hover:text-violet-600'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <div className="mr-3">
                                  {item.icon}
                                </div>
                                <span className="font-medium">{item.label}</span>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </nav>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
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
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
                      className="flex-1 text-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="flex-1 text-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl transition-colors"
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

        /* Enhanced glass morphism effect */
        .glass-morphism {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #8b5cf6, #a855f7, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </>
  );
};

export default Header;
