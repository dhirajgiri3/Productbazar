"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
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
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { useProduct } from "@/lib/contexts/product-context";
import { useCategories } from "@/lib/contexts/category-context";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import OnboardingBanner from "./OnboardingBanner.jsx";
import SearchModal from "../Modal/Search/SearchModal.jsx";
import CategoryIcon from "../UI/CategoryIcon";
import ThemeToggle from "../UI/ThemeToggle/ThemeToggle";

const NavItem = ({ label, isActive, href, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: -3 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    whileHover={{ y: -1 }}
    whileTap={{ y: 0 }}
    className="relative"
  >
    <Link
      href={href || "#"}
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium transition-all flex items-center ${
        isActive
          ? "text-violet-600 dark:text-violet-400"
          : "text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-300"
      }`}
    >
      <span>{label}</span>
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-400 dark:to-indigo-400 rounded-full shadow-sm dark:shadow-violet-500/20"
          layoutId="navIndicator"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  </motion.div>
);

const NewBadge = () => (
  <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-600 dark:text-green-400 rounded-full ring-1 ring-inset ring-green-500/20 dark:ring-green-500/30 shadow-sm">
    New
  </span>
);

// ProfilePicture component with stable rendering
const ProfilePicture = ({ user, size = 36, className = "" }) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(null);

  useEffect(() => {
    setImgError(false);
    setIsLoading(true);
    setCurrentSrc(null);
  }, [user?._id, user?.profilePicture?.url]);

  const getProfilePictureUrl = useCallback(() => {
    if (!user) {
      return `https://ui-avatars.com/api/?name=Guest&background=8B5CF6&color=fff&size=${size * 2}&format=png&rounded=true`;
    }
    if (!imgError) {
      const profileUrl = user.profilePicture?.url || (typeof user.profilePicture === "string" ? user.profilePicture : "");
      if (profileUrl && profileUrl.trim() && profileUrl !== "/Assets/Image/Profile.png") {
        return profileUrl;
      }
    }
    const firstName = user.firstName || "User";
    const lastName = user.lastName || "";
    const initials = `${firstName}+${lastName}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=8B5CF6&color=fff&size=${size * 2}&format=png&rounded=true`;
  }, [user, imgError, size]);

  const handleImageLoad = () => setIsLoading(false);
  const handleImageError = () => {
    setImgError(true);
    setIsLoading(false);
  };

  const imageUrl = getProfilePictureUrl();

  useEffect(() => {
    if (imageUrl && imageUrl.trim()) {
      setCurrentSrc(imageUrl);
    }
  }, [imageUrl]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {isLoading && (
        <div
          className="absolute inset-0 bg-violet-100 dark:bg-violet-900/30 rounded-full animate-pulse"
          style={{ width: size, height: size }}
        />
      )}
      {currentSrc ? (
        <Image
          src={currentSrc}
          alt={`${user?.firstName || "User"}'s profile`}
          width={size}
          height={size}
          className={`object-cover rounded-full transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
          style={{ width: size, height: size }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority={size > 30}
          unoptimized={currentSrc.includes("ui-avatars.com")}
        />
      ) : (
        <div
          className="bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-violet-600 dark:text-violet-300 text-xs font-medium">
            {user?.firstName?.[0] || "U"}
            {user?.lastName?.[0] || ""}
          </span>
        </div>
      )}
    </div>
  );
};

// Authentication section to handle user menu and login/signup
const AuthSection = ({ userMenuRef, setIsUserMenuOpen, isUserMenuOpen, handleLogout, pathname }) => {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2 animate-pulse" aria-hidden="true">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center space-x-2 animate-pulse" aria-hidden="true">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div ref={userMenuRef} className="relative">
        <motion.button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="flex items-center space-x-1 focus:outline-none group"
          aria-expanded={isUserMenuOpen}
          aria-haspopup="true"
          aria-label="User menu"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div
            className="rounded-full overflow-hidden border-2 border-gray-200/80 dark:border-gray-700/80 group-hover:border-violet-300 dark:group-hover:border-violet-500 transition-all duration-200 relative shadow-sm"
            whileHover={{ rotate: [0, -2, 2, 0] }}
            transition={{ duration: 0.3 }}
          >
            <ProfilePicture user={user} size={36} className="w-9 h-9" />
            <motion.div className="absolute inset-0 bg-gradient-to-tr from-violet-400/5 to-indigo-500/5 dark:from-violet-600/10 dark:to-indigo-700/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </motion.div>
          <motion.div
            animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="text-gray-500 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors"
          >
            <ChevronDown size={15} className="opacity-70" />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {isUserMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              transition={{
                duration: 0.15,
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
              className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 border border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-lg dark:shadow-black/20 overflow-hidden z-20 backdrop-blur-xl"
              role="menu"
            >
              <motion.div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
              <div className="p-3.5 border-b border-gray-200/80 dark:border-gray-700/80">
                <div className="flex items-center">
                  <div className="mr-3 flex-shrink-0">
                    <ProfilePicture
                      user={user}
                      size={40}
                      className="w-10 h-10 border border-gray-200/80 dark:border-gray-700/80 shadow-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white flex items-center">
                      {user.firstName || "User"} {user.lastName || ""}
                      {user.role && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full ring-1 ring-inset ring-violet-500/20 dark:ring-violet-500/30">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {user.email || user.phone || "No contact info"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="py-1">
                {[
                  {
                    href: user.username
                      ? `/user/${user.username}`
                      : user._id
                      ? `/user/profile/${user._id}`
                      : "/app",
                    label: "Your Profile",
                    icon: User,
                    delay: 0.03,
                  },
                  {
                    href: user.username
                      ? `/user/${user.username}/products`
                      : user._id
                      ? `/user/profile/${user._id}/products`
                      : "/app",
                    label: "Your Products",
                    icon: Briefcase,
                    delay: 0.06,
                  },
                  {
                    href: "/user/history",
                    label: "View History",
                    icon: Clock,
                    delay: 0.09,
                  },
                  ...(user.roleCapabilities?.canApplyToJobs
                    ? [
                        {
                          href: "/profile/applications",
                          label: "My Applications",
                          icon: FileText,
                          isNew: true,
                          delay: 0.12,
                        },
                      ]
                    : []),
                  ...(user.roleCapabilities?.canPostJobs
                    ? [
                        {
                          href: "/user/myjobs",
                          label: "My Jobs",
                          icon: Briefcase,
                          delay: 0.15,
                        },
                      ]
                    : []),
                  ...(user.roleCapabilities?.canShowcaseProjects
                    ? [
                        {
                          href: "/projects",
                          label: "My Projects",
                          icon: Layers,
                          delay: 0.18,
                        },
                      ]
                    : []),
                  {
                    href: "/user/settings",
                    label: "Settings",
                    icon: Settings,
                    delay: 0.21,
                  },
                ].map((item) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: item.delay }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-violet-50/70 dark:hover:bg-violet-800/30 hover:text-violet-700 dark:hover:text-violet-300 transition-all duration-150 rounded-md mx-1 my-0.5"
                      onClick={() => setIsUserMenuOpen(false)}
                      role="menuitem"
                    >
                      <item.icon
                        size={16}
                        className="mr-3 text-violet-500 dark:text-violet-400 opacity-80"
                      />
                      {item.label}
                      {item.isNew && <NewBadge />}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="py-1 border-t border-gray-200/80 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/30">
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.24 }}
                >
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 transition-all duration-150 rounded-md mx-1 my-0.5"
                    role="menuitem"
                  >
                    <LogOut size={16} className="mr-3 opacity-80" /> Log Out
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 md:space-x-3">
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
      >
        <Link
          href="/auth/login"
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all border border-gray-200/80 dark:border-gray-700/80 hover:border-violet-300 dark:hover:border-violet-700 shadow-sm"
        >
          Log In
        </Link>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
        className="relative overflow-hidden rounded-full shadow-md hover:shadow-lg transition-all group"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        />
        <Link
          href="/auth/register"
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 font-medium rounded-full transition-all relative z-10 block"
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
    refreshUserData,
  } = useAuth();
  const {} = useProduct();
  const { categories = [] } = useCategories();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const searchQuery = "";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [isHoveredLogo, setIsHoveredLogo] = useState(false);
  const [userDataKey, setUserDataKey] = useState(0);

  const userMenuRef = useRef(null);
  const roleMenuRef = useRef(null);
  const categoryMenuRef = useRef(null);

  useOnClickOutside(userMenuRef, () => setIsUserMenuOpen(false));
  useOnClickOutside(roleMenuRef, () => setShowRoleMenu(false));
  useOnClickOutside(categoryMenuRef, () => setShowCategoryMenu(false));

  const getRoleBasedNavItems = useCallback(() => {
    if (!user || !user.roleCapabilities) return [];
    const items = [];
    const isPrimaryAdmin = user.role === "admin";
    const isSecondaryAdmin = user.secondaryRoles?.includes("admin");

    if (isPrimaryAdmin || isSecondaryAdmin) {
      items.push({
        label: "Admin Dashboard",
        href: "/admin/users",
        isActive: pathname.startsWith("/admin"),
        icon: <Users size={16} />,
        isNew: true,
      });
    }
    if (user.roleCapabilities.canApplyToJobs) {
      items.push({
        label: "Jobs",
        href: "/jobs",
        isActive: pathname.startsWith("/jobs") && !pathname.includes("/post"),
        icon: <Briefcase size={16} />,
      });
      items.push({
        label: "My Applications",
        href: "/profile/applications",
        isActive: pathname.startsWith("/profile/applications"),
        icon: <FileText size={16} />,
      });
    }
    if (user.roleCapabilities.canPostJobs) {
      items.push({
        label: "Post Job",
        href: "/jobs/post",
        isActive: pathname === "/jobs/post",
        icon: <Plus size={16} />,
      });
      items.push({
        label: "My Jobs",
        href: "/user/myjobs",
        isActive: pathname === "/user/myjobs",
        icon: <Briefcase size={16} />,
      });
    }
    if (user.roleCapabilities.canShowcaseProjects) {
      items.push({
        label: "Projects",
        href: "/projects",
        isActive: pathname.startsWith("/projects"),
        icon: <Layers size={16} />,
      });
    }
    if (user.roleCapabilities.canOfferServices) {
      items.push({
        label: "Services",
        href: "/services",
        isActive: pathname.startsWith("/services"),
        icon: <Code size={16} />,
      });
    }
    if (user.roleCapabilities.canInvest) {
      items.push({
        label: "Invest",
        href: "/invest",
        isActive: pathname.startsWith("/invest"),
        icon: <DollarSign size={16} />,
      });
    }
    return items;
  }, [user, pathname]);

  const handleUserDataRefresh = useCallback(async () => {
    if (refreshUserData) {
      try {
        await refreshUserData(true);
        setUserDataKey((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      }
    }
  }, [refreshUserData]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && user) {
      console.log("Header - User data:", {
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        profilePictureType: typeof user.profilePicture,
        hasProfilePictureUrl: !!user.profilePicture?.url,
        userDataKey,
      });
    }
  }, [user, userDataKey]);

  useEffect(() => {
    const handleLoginSuccess = () => {
      if (typeof refreshUserData === "function") {
        refreshUserData(true).catch((err) => {
          console.error("Error refreshing user data:", err);
        });
      }
    };

    const handleUserUpdated = () => {
      setUserDataKey((prev) => prev + 1);
    };

    const handleUserRefreshed = () => {
      setUserDataKey((prev) => prev + 1);
    };

    window.addEventListener("auth:login-success", handleLoginSuccess);
    window.addEventListener("auth:user-updated", handleUserUpdated);
    window.addEventListener("auth:user-refreshed", handleUserRefreshed);

    return () => {
      window.removeEventListener("auth:login-success", handleLoginSuccess);
      window.removeEventListener("auth:user-updated", handleUserUpdated);
      window.removeEventListener("auth:user-refreshed", handleUserRefreshed);
    };
  }, [refreshUserData]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !user) {
      setShowOnboardingBanner(false);
      return;
    }
    const allStepsCompleted = user.isEmailVerified && user.isPhoneVerified && user.isProfileCompleted;
    if (allStepsCompleted) {
      setShowOnboardingBanner(false);
      if (nextStep) refreshNextStep();
    } else if (nextStep) {
      setShowOnboardingBanner(true);
    } else {
      refreshNextStep();
      setShowOnboardingBanner(false);
    }
  }, [isInitialized, isAuthenticated, user, nextStep, refreshNextStep]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const handleProductSubmit = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to submit a product");
      router.push("/auth/login");
      return;
    }
    if (nextStep && (nextStep.type === "email_verification" || nextStep.type === "phone_verification")) {
      toast.error("Please verify your contact information first");
      handleCompleteOnboarding();
      return;
    }
    if (user?.roleCapabilities?.canUploadProducts) {
      router.push("/product/new");
    } else {
      toast.error("Your current role doesn't allow product submissions");
      router.push("/user/settings");
    }
  };

  const handleCompleteOnboarding = () => {
    if (!nextStep) return;
    if (nextStep.type === "email_verification") router.push("/auth/verify-email");
    else if (nextStep.type === "phone_verification") router.push("/auth/verify-phone");
    else if (nextStep.type === "profile_completion") router.push("/complete-profile");
  };

  return (
    <>
      <AnimatePresence>
        {showOnboardingBanner && nextStep ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, type: "spring" }}
          >
            <OnboardingBanner
              nextStep={nextStep}
              onComplete={() => {
                setShowOnboardingBanner(false);
                handleCompleteOnboarding();
              }}
              onSkip={() => {
                setShowOnboardingBanner(false);
                skipProfileCompletion();
              }}
              onRefresh={async () => {
                toast.loading("Refreshing verification status...", { id: "refresh-toast" });
                try {
                  const result = await Promise.resolve(refreshNextStep());
                  setTimeout(() => {
                    toast.success(result ? "Verification status updated" : "All steps completed!", {
                      id: "refresh-toast",
                    });
                  }, 500);
                } catch (error) {
                  toast.error("Failed to refresh status", { id: "refresh-toast" });
                }
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <header className="bg-white/90 dark:bg-gray-900/90 sticky top-0 z-40 border-b border-gray-200/80 dark:border-gray-800/80 backdrop-blur-lg shadow-sm dark:shadow-gray-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center">
            <motion.div
              className="relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/products" aria-label="Go to Home">
                <motion.div
                  className="w-10 h-10 bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold relative overflow-hidden group shadow-md shadow-violet-500/20 dark:shadow-violet-500/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, rotate: -10, y: 5 }}
                  animate={{ opacity: 1, rotate: 0, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                  onHoverStart={() => setIsHoveredLogo(true)}
                  onHoverEnd={() => setIsHoveredLogo(false)}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <motion.span
                      className="absolute text-md font-bold tracking-wider"
                      initial={{ y: 0 }}
                      animate={{ y: isHoveredLogo ? -30 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      PB
                    </motion.span>
                    <motion.div
                      className="absolute text-white"
                      initial={{ y: 30 }}
                      animate={{ y: isHoveredLogo ? 0 : 30 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <Home size={20} strokeWidth={2.5} />
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            <div className="relative hidden sm:block ml-4">
              <motion.button
                className="flex items-center relative rounded-full border border-gray-200/80 dark:border-gray-700/80 px-3.5 py-2 w-64 md:w-80 transition-all hover:border-violet-300 dark:hover:border-violet-700 group dark:shadow-gray-950/10"
                onClick={() => setIsSearchModalOpen(true)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 30 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-violet-50/50 to-indigo-50/50 dark:from-violet-900/10 dark:to-indigo-900/10 opacity-0 rounded-full group-hover:opacity-100"
                  transition={{ duration: 0.2 }}
                />
                <motion.div
                  className="text-gray-400 dark:text-gray-500 mr-2 relative group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Search size={16} />
                </motion.div>
                <span className="text-gray-600 dark:text-gray-400 text-sm flex-1 text-left group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors relative z-10">
                  Search products, startups, etc...
                </span>
                <motion.div
                  className="hidden md:flex items-center border border-gray-200 dark:border-gray-700 rounded-md px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-500 relative z-10 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm group-hover:border-violet-300 dark:group-hover:border-violet-700 group-hover:text-violet-600 dark:group-hover:text-violet-400 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/20"
                  transition={{ duration: 0.2 }}
                >
                  ⌘K
                </motion.div>
              </motion.button>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <NavItem label="Home" isActive={pathname === "/" || pathname === "/products"} href="/products" />

            <div className="relative" ref={categoryMenuRef}>
              <motion.button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center relative ${
                  pathname.startsWith("/category")
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-300"
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span>Categories</span>
                <motion.div
                  animate={{ rotate: showCategoryMenu ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="ml-1"
                >
                  <ChevronDown size={15} className="opacity-70" />
                </motion.div>
                {pathname.startsWith("/category") && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-400 dark:to-indigo-400 rounded-full shadow-sm dark:shadow-violet-500/20"
                    layoutId="navIndicator"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
              <AnimatePresence>
                {showCategoryMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.98 }}
                    transition={{ duration: 0.15, type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 border border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-lg dark:shadow-black/20 overflow-hidden z-20 backdrop-blur-xl"
                  >
                    <motion.div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
                    <div className="p-3.5 border-b border-gray-200/80 dark:border-gray-700/80">
                      <div className="flex items-center">
                        <div className="mr-3 flex-shrink-0 p-2 rounded-full bg-violet-50 dark:bg-violet-500/10 shadow-sm">
                          <Grid size={18} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Browse Categories</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Discover products by category</div>
                        </div>
                      </div>
                    </div>
                    {categories.length > 0 ? (
                      <div className="max-h-[calc(100vh-250px)] overflow-y-auto hide-scrollbar">
                        {categories.slice(0, 8).map((category, index) => (
                          <motion.div
                            key={category._id || index}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <Link
                              href={`/category/${category.slug || category.name.toLowerCase().replace(/\s+/g, "-")}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-violet-50/70 dark:hover:bg-violet-800/30 hover:text-violet-700 dark:hover:text-violet-300 transition-all duration-150 rounded-md mx-1 my-0.5"
                              onClick={() => setShowCategoryMenu(false)}
                            >
                              <span className="mr-3 text-violet-500 dark:text-violet-400 opacity-80">
                                <CategoryIcon icon={category.icon} name={category.name} size={16} />
                              </span>
                              <span>{category.name}</span>
                            </Link>
                          </motion.div>
                        ))}
                        <div className="px-4 py-3 border-t border-gray-200/80 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/30">
                          <Link
                            href="/categories"
                            className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 font-medium flex items-center justify-center transition-colors group"
                            onClick={() => setShowCategoryMenu(false)}
                          >
                            View All Categories{" "}
                            <motion.div className="ml-1" initial={{ x: 0 }} whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                              <ArrowRight size={14} />
                            </motion.div>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 italic">Loading categories...</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isAuthenticated && (
              <>
                <NavItem label="Bookmarks" isActive={pathname === "/user/mybookmarks"} href="/user/mybookmarks" />
                <div className="relative" ref={roleMenuRef}>
                  <motion.button
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className={`px-3 py-2 text-sm font-medium transition-colors flex items-center relative ${
                      getRoleBasedNavItems().some((item) => item.isActive)
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-300"
                    }`}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span>Features</span>
                    <motion.div
                      animate={{ rotate: showRoleMenu ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="ml-1"
                    >
                      <ChevronDown size={15} className="opacity-70" />
                    </motion.div>
                    {getRoleBasedNavItems().some((item) => item.isActive) && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-400 dark:to-indigo-400 rounded-full shadow-sm dark:shadow-violet-500/20"
                        layoutId="navIndicator"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                  <AnimatePresence>
                    {showRoleMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: 0.15, type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 border border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-lg dark:shadow-black/20 overflow-hidden z-20 backdrop-blur-xl"
                      >
                        <motion.div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
                        <div className="p-3.5 border-b border-gray-200/80 dark:border-gray-700/80">
                          <div className="flex items-center">
                            <div className="mr-3 flex-shrink-0 p-2 rounded-full bg-violet-50 dark:bg-violet-500/10 shadow-sm">
                              <Folder size={18} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Your Features</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Role-specific features</div>
                            </div>
                          </div>
                        </div>
                        {getRoleBasedNavItems().length > 0 ? (
                          <div className="max-h-[calc(100vh-250px)] overflow-y-auto hide-scrollbar py-1">
                            {getRoleBasedNavItems().map((item, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                              >
                                <Link
                                  href={item.href}
                                  className={`flex items-center px-4 py-2 text-sm transition-all duration-150 rounded-md mx-1 my-0.5 ${
                                    item.isActive
                                      ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium"
                                      : "text-gray-600 dark:text-gray-300 hover:bg-violet-50/70 dark:hover:bg-violet-800/30 hover:text-violet-700 dark:hover:text-violet-300"
                                  }`}
                                  onClick={() => setShowRoleMenu(false)}
                                >
                                  <span className="mr-3 text-violet-500 dark:text-violet-400 opacity-80">{item.icon}</span>
                                  <span>{item.label}</span>
                                  {item.isNew && <NewBadge />}
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 italic">
                            No features available for your role(s).
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            {isInitialized && isAuthenticated && user?.roleCapabilities?.canUploadProducts && (
              <motion.button
                onClick={handleProductSubmit}
                className="hidden md:flex items-center justify-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full px-5 py-2 text-sm font-medium relative overflow-hidden group shadow-md hover:shadow-lg transition-all"
                aria-label="Submit a product"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                <motion.div className="relative z-10 flex items-center">
                  <motion.div className="mr-1.5" initial={{ rotate: 0 }} whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                    <Plus size={16} />
                  </motion.div>
                  <span>Submit Product</span>
                </motion.div>
              </motion.button>
            )}

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ThemeToggle
                size="small"
                instanceId="header"
                className="shadow-sm rounded-full p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              />
            </motion.div>

            <AuthSection
              userMenuRef={userMenuRef}
              setIsUserMenuOpen={setIsUserMenuOpen}
              isUserMenuOpen={isUserMenuOpen}
              handleLogout={handleLogout}
              pathname={pathname}
            />

            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-full md:hidden focus:outline-none transition-all relative border border-transparent hover:border-violet-200/50 dark:hover:border-violet-700/50"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence initial={false} mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="header-mobile-close"
                    initial={{ rotate: -45, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 45, opacity: 0 }}
                    transition={{ duration: 0.15, type: "spring", stiffness: 400, damping: 25 }}
                    className="relative z-10"
                  >
                    <X size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="header-mobile-menu"
                    initial={{ rotate: 45, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -45, opacity: 0 }}
                    transition={{ duration: 0.15, type: "spring", stiffness: 400, damping: 25 }}
                    className="relative z-10"
                  >
                    <Menu size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        <div className="px-4 pb-3 sm:hidden border-t border-gray-200/80 dark:border-gray-800/80">
          <motion.button
            onClick={() => setIsSearchModalOpen(true)}
            className="w-full mt-2 relative rounded-full border border-gray-200/80 dark:border-gray-700/80 flex items-center py-2.5 px-3.5 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all group overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, type: "spring" }}
          >
            <motion.div className="absolute inset-0 bg-gradient-to-r from-violet-50/50 to-indigo-50/50 dark:from-violet-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full" />
            <motion.div className="text-gray-400 dark:text-gray-500 mr-2 relative z-10 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">
              <Search size={16} />
            </motion.div>
            <span className="text-gray-600 dark:text-gray-400 text-sm flex-1 text-left group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors relative z-10">
              Search products, startups...
            </span>
          </motion.button>
        </div>

        <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} initialQuery={searchQuery} />
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="header-mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/40 dark:bg-black/60 backdrop-blur-md md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 35, stiffness: 350 }}
              className="absolute top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white/95 dark:bg-gray-900/95 shadow-xl dark:shadow-black/30 overflow-hidden border-l border-gray-200/80 dark:border-gray-700/80 flex flex-col backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
              <div className="flex-1 overflow-y-auto p-4 pt-6 hide-scrollbar">
                <motion.nav
                  className="flex flex-col space-y-1"
                  initial="hidden"
                  animate="visible"
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
                >
                  {[
                    {
                      href: "/",
                      label: "Home",
                      icon: Home,
                      activeCondition: pathname === "/" || pathname === "/products",
                    },
                  ].map((item) => (
                    <motion.div key={item.href} variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-3 py-2.5 rounded-lg text-base transition-all ${
                          item.activeCondition
                            ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-violet-700 dark:hover:text-violet-300"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon
                          size={18}
                          className={`mr-3 ${item.activeCondition ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400 opacity-80"}`}
                        />
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}

                  <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="pt-4">
                    <div className="px-3 py-2 mb-1">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categories</h3>
                    </div>
                    {categories.length > 0 ? (
                      <div className="space-y-1">
                        {categories.slice(0, 5).map((category, idx) => (
                          <motion.div
                            key={category._id || idx}
                            variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <Link
                              href={`/category/${category.slug || category.name.toLowerCase().replace(/\s+/g, "-")}`}
                              className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-violet-50/70 dark:hover:bg-violet-800/30 hover:text-violet-700 dark:hover:text-violet-300 rounded-lg transition-all duration-150"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <div className="mr-3 flex-shrink-0 w-5 h-5 flex items-center justify-center text-violet-500 dark:text-violet-400 opacity-80">
                                <CategoryIcon icon={category.icon} name={category.name} size={16} />
                              </div>
                              <span className="text-sm font-medium">{category.name}</span>
                            </Link>
                          </motion.div>
                        ))}
                        <motion.div
                          variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }}
                          className="px-3 py-2"
                        >
                          <Link
                            href="/categories"
                            className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium flex items-center group transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            View All Categories{" "}
                            <motion.div className="ml-1" initial={{ x: 0 }} whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                              <ArrowRight size={14} />
                            </motion.div>
                          </Link>
                        </motion.div>
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">Loading...</div>
                    )}
                  </motion.div>

                  {isAuthenticated && (
                    <>
                      {[
                        {
                          href: "/user/mybookmarks",
                          label: "Bookmarks",
                          icon: Bookmark,
                          activeCondition: pathname === "/user/mybookmarks",
                        },
                        {
                          href: "/user/history",
                          label: "History",
                          icon: Clock,
                          activeCondition: pathname === "/user/history",
                        },
                      ].map((item) => (
                        <motion.div
                          key={item.href}
                          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                          className="pt-2"
                        >
                          <Link
                            href={item.href}
                            className={`flex items-center px-3 py-2.5 rounded-lg text-base transition-colors ${
                              item.activeCondition
                                ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-semibold"
                                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50"
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <item.icon
                              size={20}
                              className={`mr-3 ${item.activeCondition ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"}`}
                            />
                            {item.label}
                          </Link>
                        </motion.div>
                      ))}

                      {getRoleBasedNavItems().length > 0 && (
                        <motion.div
                          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                          className="pt-4"
                        >
                          <div className="px-3 py-2 mb-1">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Your Features
                            </h3>
                          </div>
                          {getRoleBasedNavItems().map((item, index) => (
                            <motion.div
                              key={`role-${index}`}
                              variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                              transition={{ delay: index * 0.03 }}
                            >
                              <Link
                                href={item.href}
                                className={`flex items-center px-3 py-2.5 rounded-lg text-base transition-colors ${
                                  item.isActive
                                    ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-semibold"
                                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50"
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <span className={`mr-3 ${item.isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"}`}>
                                  {item.icon}
                                </span>
                                {item.label}
                                {item.isNew && <NewBadge />}
                              </Link>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.nav>
              </div>

              <motion.div
                className="p-4 border-t border-gray-200/80 dark:border dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-800/30 backdrop-blur-sm"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {isAuthenticated && user?.roleCapabilities?.canUploadProducts && (
                  <motion.button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleProductSubmit();
                    }}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-full px-4 py-3 text-sm font-medium transition-all flex items-center justify-center relative overflow-hidden group mb-3 shadow-md hover:shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    />
                    <motion.div className="relative z-10 flex items-center">
                      <motion.div className="mr-2" initial={{ rotate: 0 }} whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                        <Plus size={16} />
                      </motion.div>
                      <span>Submit Product</span>
                    </motion.div>
                  </motion.button>
                )}
                {isAuthenticated ? (
                  <motion.button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full border border-gray-200/80 dark:border-gray-700/80 hover:bg-gray-100/80 dark:hover:bg-gray-700/40 text-gray-600 dark:text-gray-300 rounded-full px-4 py-3 text-sm font-medium transition-all flex items-center justify-center shadow-sm"
                    whileHover={{ scale: 1.02, borderColor: "rgba(124, 58, 237, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut size={16} className="mr-2 text-gray-500 dark:text-gray-400 opacity-80" />
                    Log Out
                  </motion.button>
                ) : (
                  <div className="flex space-x-3">
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        href="/auth/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex-1 text-center border border-gray-200/80 dark:border-gray-700/80 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/70 dark:hover:bg-violet-900/20 text-gray-600 dark:text-gray-300 hover:text-violet-700 dark:hover:text-violet-300 rounded-full px-3 py-2.5 text-sm font-medium transition-all flex items-center justify-center w-full shadow-sm"
                      >
                        <User size={16} className="mr-1.5 opacity-70" /> Log In
                      </Link>
                    </motion.div>
                    <motion.div
                      className="flex-1 relative overflow-hidden rounded-full shadow-md hover:shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      />
                      <Link
                        href="/auth/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex-1 text-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-full px-3 py-2.5 text-sm font-medium transition-all flex items-center justify-center w-full relative z-10"
                      >
                        <Plus size={16} className="mr-1.5" /> Sign Up
                      </Link>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;