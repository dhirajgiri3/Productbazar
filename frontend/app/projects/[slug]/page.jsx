// ProjectDetailPage.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  FolderKanban,
  User,
  Users,
  Calendar,
  Tag,
  ExternalLink,
  GitBranch,
  ThumbsUp,
  Eye,
  ChevronLeft,
  Share2,
  Briefcase,
  Building,
  Star,
  ArrowRight,
  X,
  Mail,
  Phone,
  Globe,
  Grid,
  Maximize,
  ChevronRight,
  Linkedin,
  Edit,
  Trash2,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Download,
  StarIcon
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { useProject } from "@/lib/contexts/project-context";
import LoaderComponent from "../../../Components/UI/LoaderComponent";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "Components/UI/Badge/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "../../../Components/UI/DropdownMenu/DropdownMenu";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const sidebarVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      delay: 0.2,
    },
  },
};

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    currentProject,
    loading,
    error,
    fetchProjectBySlug,

    trackShare,
    deleteProject,
  } = useProject();
  const [activeImage, setActiveImage] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [fullScreenImageSrc, setFullScreenImageSrc] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs for scroll animations
  const headerRef = useRef(null);
  const { scrollY } = useScroll();

  // Transform values for parallax effect
  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0.5]);
  const headerY = useTransform(scrollY, [0, 200], [0, 50]);
  const titleY = useTransform(scrollY, [0, 200], [0, -30]);
  const titleScale = useTransform(scrollY, [0, 200], [1, 0.9]);

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (slug && isMounted) {
        try {
          await fetchProjectBySlug(slug);
        } catch (err) {
          // Error is already handled in fetchProjectBySlug
          console.log("Error caught in component:", err.message);
        }
      }
    };

    loadProject();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [slug, fetchProjectBySlug]);

  useEffect(() => {
    if (currentProject) {
      setActiveImage(
        currentProject.thumbnail ||
          (currentProject.gallery?.length > 0
            ? currentProject.gallery[0].url
            : null)
      );

      // Ensure smooth scrolling
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentProject, user]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const calculateDuration = (startDate, endDate, isCurrent) => {
    if (!startDate) return "Not specified";
    const start = new Date(startDate);
    const end = isCurrent ? new Date() : endDate ? new Date(endDate) : null;
    if (!end) return "Start date only";
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? "s" : ""}`;
    if (diffMonths > 0)
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: currentProject.title,
        text: `Check out this project: ${currentProject.title}`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        trackShare(currentProject._id, "web");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
        trackShare(currentProject._id, "clipboard");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        toast.error("Failed to share project");
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!currentProject || !currentProject._id) return;

    try {
      setIsDeleting(true);
      const success = await deleteProject(currentProject._id);

      if (success) {
        toast.success("Project deleted successfully");
        router.push("/projects");
      } else {
        toast.error("Failed to delete project");
        setShowDeleteModal(false);
      }
    } catch (error) {
      toast.error("An error occurred while deleting the project");
      console.error("Error deleting project:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const openFullScreenImage = (imageUrl) => {
    setFullScreenImage(true);
    setFullScreenImageSrc(imageUrl);
    document.body.style.overflow = "hidden";
  };

  const closeFullScreenImage = () => {
    setFullScreenImage(false);
    setFullScreenImageSrc(null);
    document.body.style.overflow = "";
  };

  const getOwnerTypeLabel = (ownerType) => {
    const types = {
      freelancer: "Freelancer",
      agency: "Agency",
      jobseeker: "Job Seeker",
      startupOwner: "Startup Owner",
    };
    return types[ownerType] || "Creator";
  };

  // Get next and previous images for gallery navigation
  const getAdjacentImages = () => {
    if (!currentProject || !currentProject.gallery)
      return { prev: null, next: null };

    let images = [];
    if (currentProject.thumbnail) images.push(currentProject.thumbnail);
    if (currentProject.gallery.length > 0) {
      images = [...images, ...currentProject.gallery.map((img) => img.url)];
    }

    const currentIndex = images.findIndex((img) => img === fullScreenImageSrc);
    return {
      prev: currentIndex > 0 ? images[currentIndex - 1] : null,
      next: currentIndex < images.length - 1 ? images[currentIndex + 1] : null,
    };
  };

  const { prev, next } = fullScreenImage
    ? getAdjacentImages()
    : { prev: null, next: null };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoaderComponent size="large" />
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-white rounded-xl border border-gray-100"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Project Not Found
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/projects")}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg transition-all duration-300"
          >
            Browse All Projects
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Improved Full-screen image modal with fixed image display */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={closeFullScreenImage}
          >
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all z-50 border border-white/10"
              onClick={(e) => {
                e.stopPropagation();
                closeFullScreenImage();
              }}
            >
              <X size={24} />
            </motion.button>

            {prev && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute left-4 p-3 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all z-50 border border-white/10"
                whileHover={{ scale: 1.1, x: -3 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFullScreenImageSrc(prev);
                }}
              >
                <ChevronLeft size={28} />
              </motion.button>
            )}

            {next && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute right-4 p-3 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all z-50 border border-white/10"
                whileHover={{ scale: 1.1, x: 3 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFullScreenImageSrc(next);
                }}
              >
                <ChevronRight size={28} />
              </motion.button>
            )}

            {/* Fixed image display with proper source */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full max-w-6xl max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {fullScreenImageSrc && (
                <div className="relative w-full h-full">
                  <img
                    src={fullScreenImageSrc}
                    alt={currentProject.title}
                    className="object-contain w-full h-full select-none"
                  />
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              className="absolute bottom-6 left-0 right-0 text-center text-white text-sm backdrop-blur-md bg-black/40 py-2 mx-auto max-w-lg rounded-full border border-white/10 font-medium"
            >
              {currentProject.title} •{" "}
              {currentProject.category ||
                getOwnerTypeLabel(currentProject.ownerType)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Enhanced Hero Section with Parallax */}
        <motion.div
          ref={headerRef}
          style={{ opacity: headerOpacity, y: headerY }}
          className="relative w-full overflow-hidden"
        >
          {/* Background with improved gradient overlay */}
          <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] w-full overflow-hidden">
            {activeImage ? (
              <div className="absolute inset-0">
                <motion.div
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1.0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full w-full"
                >
                  <Image
                    src={activeImage}
                    alt={currentProject.title}
                    layout="fill"
                    objectFit="cover"
                    className="transition-all duration-700"
                    priority
                  />
                </motion.div>

                {/* Enhanced gradient overlay with softer transitions */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/60 via-violet-300/30 to-white"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-violet-800/20 to-white"></div>
                <div className="absolute inset-0 backdrop-filter backdrop-blur-[5px]"></div>

                {/* Subtle texture overlay */}
                <div
                  className="absolute inset-0 opacity-5 mix-blend-soft-light"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z' fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                  }}
                ></div>
              </div>
            ) : (
              <div className="absolute inset-0">
                {/* Elegant gradient background when no image is present */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-900/50 to-white">
                  <div className="absolute inset-0 backdrop-filter backdrop-blur-[2px]"></div>
                  <div
                    className="absolute inset-0 opacity-5 mix-blend-soft-light"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Hero Content with enhanced styling */}
            <div className="container mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-16 md:pb-20 pt-24 relative z-20">
              <motion.div
                style={{ y: titleY, scale: titleScale }}
                className="max-w-4xl"
              >
                {/* Back to Projects Button */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <Link
                    href="/projects"
                    className="group inline-flex items-center text-white transition-all mb-8 backdrop-blur-md bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/10"
                  >
                    <motion.span
                      initial={{ x: 0 }}
                      whileHover={{ x: -3 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronLeft size={16} className="mr-2" />
                    </motion.span>
                    <span>Back to Projects</span>
                  </Link>
                </motion.div>

                {/* Category and Feature Tags */}
                <motion.div
                  className="flex flex-wrap items-center gap-3 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                >
                  <motion.span
                    whileHover={{ y: -2 }}
                    className="text-sm font-medium text-white bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
                  >
                    {currentProject.category ||
                      getOwnerTypeLabel(currentProject.ownerType)}
                  </motion.span>

                  {currentProject.featured && (
                    <motion.span
                      whileHover={{ y: -2 }}
                      className="text-sm font-medium text-white bg-amber-500/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center border border-amber-400/20"
                    >
                      <motion.div
                        animate={{ rotate: [0, 15, 0, -15, 0] }}
                        transition={{
                          duration: 1.5,
                          delay: 1,
                          repeat: Infinity,
                          repeatDelay: 4,
                        }}
                      >
                        <StarIcon size={14} className="mr-1.5 text-amber-300" />
                      </motion.div>
                      Featured
                    </motion.span>
                  )}
                </motion.div>

                {/* Project Title and Date */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
                >
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-tight drop-shadow-sm">
                    {currentProject.title}
                  </h1>

                  {/* Project metadata with elegant buttons */}
                  <motion.div
                    className="flex flex-wrap items-center gap-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                      className="text-gray-900 flex items-center backdrop-blur-md bg-white/90 px-5 py-2.5 rounded-full border border-white/20"
                    >
                      <Calendar size={14} className="mr-2.5 text-indigo-600" />
                      <span className="font-medium text-sm">
                        {formatDate(currentProject.createdAt)}
                      </span>
                    </motion.span>

                    {currentProject.projectUrl && (
                      <motion.a
                        href={currentProject.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                        className="flex items-center backdrop-blur-md bg-white/90 px-5 py-2.5 rounded-full text-gray-900 border border-white/20"
                      >
                        <ExternalLink size={14} className="mr-2.5 text-indigo-600" />
                        <span className="font-medium text-sm">
                          View Project
                        </span>
                      </motion.a>
                    )}

                    {currentProject.repositoryUrl && (
                      <motion.a
                        href={currentProject.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                        className="flex items-center backdrop-blur-md bg-white/90 px-5 py-2.5 rounded-full text-gray-900 border border-white/20"
                      >
                        <GitBranch size={14} className="mr-2.5 text-indigo-600" />
                        <span className="font-medium text-sm">
                          View Repository
                        </span>
                      </motion.a>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>

            {/* Decorative bottom edge with gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-10"></div>
          </div>
        </motion.div>

        <div className="container mx-auto px-4 sm:px-6 -mt-12 sm:-mt-20 relative z-30">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 pb-16"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main content */}
              <motion.div
                className="lg:col-span-2 space-y-8 mt-4"
                variants={containerVariants}
              >
                {/* Project Header with Action Buttons */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start gap-6 mb-6 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]"
                >
                  <div className="space-y-4 w-full sm:w-3/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                        {currentProject.category || "Project"}
                      </Badge>
                      <span className="text-gray-400 text-sm flex items-center">
                        <Clock size={14} className="mr-1" />
                        {formatDate(currentProject.updatedAt)}
                      </span>
                    </div>

                    <div className="prose prose-lg max-w-none">
                      <p className="text-gray-700 leading-relaxed line-clamp-3">
                        {currentProject.description}
                      </p>
                    </div>

                    {/* Project stats/meta info */}
                    <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-gray-500">
                      {currentProject.tasks && (
                        <div className="flex items-center gap-2">
                          <CheckSquare size={16} />
                          <span>
                            {getCompletedTasksCount(currentProject.tasks)}/
                            {currentProject.tasks.length} tasks
                          </span>
                        </div>
                      )}
                      {currentProject.collaborators?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>
                            {currentProject.collaborators.length} collaborator
                            {currentProject.collaborators.length !== 1
                              ? "s"
                              : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 ml-auto mt-4 sm:mt-0 w-full sm:w-auto">
                    {/* Action buttons container */}
                    <div className="flex flex-wrap gap-2 justify-end">
                      {/* Share Button */}
                      <motion.button
                        onClick={handleShare}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all duration-300 border border-gray-100 flex items-center gap-2 text-sm font-medium relative overflow-hidden group"
                      >
                        {/* Background animation on hover */}
                        <motion.span
                          className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        />
                        <motion.div
                          className="relative z-10 text-indigo-500"
                          whileHover={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                        >
                          <Share2 size={16} />
                        </motion.div>
                        <span className="relative z-10">Share</span>
                      </motion.button>

                      {/* Project Management Buttons - Only visible to project owner or users with permission */}
                      {isAuthenticated && currentProject && (
                        <>
                          {/* More actions dropdown menu with enhanced animations */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <motion.button
                                whileHover={{ scale: 1.05, rotate: 15 }}
                                whileTap={{ scale: 0.95, rotate: 0 }}
                                className="relative px-3 py-2 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all duration-300 border border-gray-100 overflow-hidden group"
                              >
                                <motion.span
                                  className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                  initial={{ scale: 0, opacity: 0 }}
                                  whileHover={{ scale: 1, opacity: 1 }}
                                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                />
                                <MoreHorizontal size={18} className="text-indigo-500 relative z-10" />
                              </motion.button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-56"
                              sideOffset={8}
                            >
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.05 }}
                              >
                                <DropdownMenuLabel>
                                  Project Actions
                                </DropdownMenuLabel>
                              </motion.div>
                              <DropdownMenuSeparator />

                              {/* Edit Project Option */}
                              {(currentProject.owner === user?._id ||
                                currentProject.collaborators?.some(
                                  (collab) =>
                                    collab.user === user?._id &&
                                    (collab.role === "owner" ||
                                      collab.permissions?.canEdit)
                                )) && (
                                <motion.div
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2, delay: 0.1 }}
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(`/projects/${slug}/edit`)
                                    }
                                    className="group"
                                  >
                                    <motion.div
                                      className="mr-2 text-indigo-500 group-hover:text-indigo-600 transition-all duration-200"
                                      whileHover={{ rotate: 15 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                      <Edit size={16} />
                                    </motion.div>
                                    <span>Edit Project</span>
                                  </DropdownMenuItem>
                                </motion.div>
                              )}

                              {/* Manage Collaborators Option */}
                              {(currentProject.owner === user?._id ||
                                currentProject.collaborators?.some(
                                  (collab) =>
                                    collab.user === user?._id &&
                                    (collab.role === "owner" ||
                                      collab.permissions?.canInvite)
                                )) && (
                                <motion.div
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2, delay: 0.15 }}
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/projects/${slug}/collaborators`
                                      )
                                    }
                                    className="group"
                                  >
                                    <motion.div
                                      className="mr-2 text-indigo-500 group-hover:text-indigo-600 transition-all duration-200"
                                      whileHover={{ scale: 1.1 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                      <Users size={16} />
                                    </motion.div>
                                    <span>Manage Collaborators</span>
                                  </DropdownMenuItem>
                                </motion.div>
                              )}

                              {/* Export Project Option */}
                              <motion.div
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: 0.2 }}
                              >
                                <DropdownMenuItem className="group">
                                  <motion.div
                                    className="mr-2 text-indigo-500 group-hover:text-indigo-600 transition-all duration-200"
                                    whileHover={{ y: -2 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                  >
                                    <Download size={16} />
                                  </motion.div>
                                  <span>Export Project</span>
                                </DropdownMenuItem>
                              </motion.div>

                              <DropdownMenuSeparator />

                              {/* Delete Project Option */}
                              {(currentProject.owner === user?._id ||
                                currentProject.collaborators?.some(
                                  (collab) =>
                                    collab.user === user?._id &&
                                    (collab.role === "owner" ||
                                      collab.permissions?.canDelete)
                                )) && (
                                <motion.div
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2, delay: 0.25 }}
                                >
                                  <DropdownMenuItem
                                    onClick={() => setShowDeleteModal(true)}
                                    className="text-red-600 focus:text-red-600 group"
                                  >
                                    <motion.div
                                      className="mr-2 group-hover:text-red-700 transition-all duration-200"
                                      whileHover={{ rotate: 20 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                      <Trash2 size={16} />
                                    </motion.div>
                                    <span>Delete Project</span>
                                  </DropdownMenuItem>
                                </motion.div>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Enhanced Gallery Grid with Fixed Display */}
                <motion.div variants={itemVariants} className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 border-l-4 border-violet-500 pl-3">
                      Project Gallery
                    </h2>
                    {activeImage && (
                      <button
                        onClick={() => openFullScreenImage(activeImage)}
                        className="flex items-center text-violet-600 hover:text-violet-700 transition-colors text-sm group"
                      >
                        <Maximize
                          size={16}
                          className="mr-1 group-hover:scale-110 transition-transform"
                        />
                        <span>View Fullscreen</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Featured Image */}
                    {activeImage && (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => openFullScreenImage(activeImage)}
                        className="md:col-span-2 row-span-2 relative aspect-video md:aspect-auto md:h-96 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 cursor-pointer group"
                      >
                        <img
                          src={activeImage}
                          alt={currentProject.title}
                          className="rounded-xl w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                            <Maximize size={24} className="text-violet-600" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Thumbnails Grid */}
                    <motion.div
                      variants={containerVariants}
                      className="grid grid-cols-2 md:grid-cols-1 gap-4 h-fit"
                    >
                      {currentProject.thumbnail &&
                        (currentProject.gallery?.length > 0 ? true : false) && (
                          <motion.div
                            variants={gridItemVariants}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setActiveImage(currentProject.thumbnail);
                            }}
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                              activeImage === currentProject.thumbnail
                                ? "border-violet-500 ring-2 ring-violet-200"
                                : "border-gray-100 hover:border-violet-200"
                            }`}
                          >
                            <img
                              src={currentProject.thumbnail}
                              alt="Thumbnail"
                              className="object-cover w-full h-full"
                            />
                            {activeImage === currentProject.thumbnail && (
                              <div className="absolute inset-0 bg-violet-500/10"></div>
                            )}
                          </motion.div>
                        )}

                      {currentProject.gallery
                        ?.slice(0, 3)
                        .map((image, index) => (
                          <motion.div
                            key={index}
                            variants={gridItemVariants}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveImage(image.url)}
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                              activeImage === image.url
                                ? "border-violet-500 ring-2 ring-violet-200"
                                : "border-gray-100 hover:border-violet-200"
                            }`}
                          >
                            <img
                              src={image.url}
                              alt={
                                image.caption || `Gallery image ${index + 1}`
                              }
                              className="object-cover w-full h-full"
                            />
                            {activeImage === image.url && (
                              <div className="absolute inset-0 bg-violet-500/10"></div>
                            )}
                          </motion.div>
                        ))}

                      {currentProject.gallery?.length > 3 && (
                        <motion.button
                          variants={gridItemVariants}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            openFullScreenImage(
                              activeImage || currentProject.gallery[0].url
                            )
                          }
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-gray-100 bg-violet-50 flex flex-col items-center justify-center"
                        >
                          <Grid size={24} className="text-violet-600 mb-1" />
                          <span className="text-sm font-medium text-violet-700">
                            +{currentProject.gallery.length - 3} more
                          </span>
                        </motion.button>
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Project Details with Modern Minimalistic Design */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100"
                >
                  <h2 className="text-2xl font-medium text-gray-800 mb-8 flex items-center gap-3">
                    <span className="h-6 w-1 bg-violet-500 rounded-full"></span>
                    Project Details
                  </h2>

                  <div className="space-y-12">
                    {/* Project Journey */}
                    {(currentProject.challenge ||
                      currentProject.solution ||
                      currentProject.results) && (
                      <div className="relative space-y-10 pl-8 before:content-[''] before:absolute before:left-[9px] before:top-4 before:bottom-4 before:w-[1px] before:bg-violet-200">
                        {currentProject.challenge && (
                          <motion.section
                            variants={listItemVariants}
                            className="relative"
                          >
                            <div className="absolute -left-8 top-0 w-4 h-4 rounded-full bg-violet-500 ring-4 ring-violet-50"></div>
                            <h3 className="text-lg font-medium text-violet-700 mb-3">
                              The Challenge
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              {currentProject.challenge}
                            </p>
                          </motion.section>
                        )}

                        {currentProject.solution && (
                          <motion.section
                            variants={listItemVariants}
                            className="relative"
                          >
                            <div className="absolute -left-8 top-0 w-4 h-4 rounded-full bg-violet-500 ring-4 ring-violet-50"></div>
                            <h3 className="text-lg font-medium text-violet-700 mb-3">
                              The Solution
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              {currentProject.solution}
                            </p>
                          </motion.section>
                        )}

                        {currentProject.results && (
                          <motion.section
                            variants={listItemVariants}
                            className="relative"
                          >
                            <div className="absolute -left-8 top-0 w-4 h-4 rounded-full bg-violet-500 ring-4 ring-violet-50"></div>
                            <h3 className="text-lg font-medium text-violet-700 mb-3">
                              The Results
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              {currentProject.results}
                            </p>
                          </motion.section>
                        )}
                      </div>
                    )}

                    {/* Key Achievements */}
                    {currentProject.achievements?.length > 0 && (
                      <section className="pt-2">
                        <h3 className="text-lg font-medium text-gray-800 mb-6 flex items-center gap-2">
                          <span className="h-4 w-1 bg-green-400 rounded-full"></span>
                          Key Achievements
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentProject.achievements.map(
                            (achievement, index) => (
                              <motion.div
                                key={index}
                                variants={listItemVariants}
                                whileHover={{ y: -2 }}
                                className="flex items-start p-4 rounded-lg bg-white border border-green-100 shadow-sm hover:shadow transition-all"
                              >
                                <span className="w-6 h-6 rounded-full bg-green-50 text-green-600 inline-flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-sm">
                                  ✓
                                </span>
                                <span className="text-gray-600">
                                  {achievement}
                                </span>
                              </motion.div>
                            )
                          )}
                        </div>
                      </section>
                    )}

                    {/* Technologies & Skills */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* Technologies Used */}
                      {currentProject.technologies?.length > 0 && (
                        <section>
                          <h3 className="text-lg font-medium text-gray-800 mb-6 flex items-center gap-2">
                            <span className="h-4 w-1 bg-blue-400 rounded-full"></span>
                            Technologies
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {currentProject.technologies.map((tech, index) => (
                              <motion.span
                                key={index}
                                variants={listItemVariants}
                                whileHover={{ y: -2 }}
                                className="px-4 py-2 rounded-full text-sm text-blue-600 bg-blue-50 border border-blue-100"
                              >
                                {tech}
                              </motion.span>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Skills Demonstrated */}
                      {currentProject.skills?.length > 0 && (
                        <section>
                          <h3 className="text-lg font-medium text-gray-800 mb-6 flex items-center gap-2">
                            <span className="h-4 w-1 bg-purple-400 rounded-full"></span>
                            Skills
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {currentProject.skills.map((skill, index) => (
                              <motion.span
                                key={index}
                                variants={listItemVariants}
                                whileHover={{ y: -2 }}
                                className="px-4 py-2 rounded-full text-sm text-gray-600 bg-gray-50 border border-gray-200"
                              >
                                {skill}
                              </motion.span>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>

                    {/* Project Timeline - Simplified Version */}
                    {(currentProject.startDate || currentProject.endDate) && (
                      <section className="pt-2">
                        <h3 className="text-lg font-medium text-gray-800 mb-6 flex items-center gap-2">
                          <span className="h-4 w-1 bg-amber-400 rounded-full"></span>
                          Timeline
                        </h3>

                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                          <div className="flex flex-col md:flex-row items-start gap-8">
                            <div className="flex items-center gap-6">
                              <div className="flex flex-col items-center">
                                <div className="text-sm text-gray-500 mb-1">
                                  Started
                                </div>
                                <div className="font-medium text-gray-800 px-4 py-2 bg-amber-50 rounded-lg border border-amber-100">
                                  {formatDate(currentProject.startDate)}
                                </div>
                              </div>

                              {currentProject.endDate &&
                              !currentProject.current ? (
                                <>
                                  <div className="flex items-center">
                                    <div className="h-px w-10 bg-amber-200"></div>
                                    <div className="w-2 h-2 bg-amber-300 rounded-full"></div>
                                    <div className="h-px w-10 bg-amber-200"></div>
                                  </div>

                                  <div className="flex flex-col items-center">
                                    <div className="text-sm text-gray-500 mb-1">
                                      Completed
                                    </div>
                                    <div className="font-medium text-gray-800 px-4 py-2 bg-amber-50 rounded-lg border border-amber-100">
                                      {formatDate(currentProject.endDate)}
                                    </div>
                                  </div>
                                </>
                              ) : currentProject.current ? (
                                <>
                                  <div className="flex items-center">
                                    <div className="h-px w-10 bg-gradient-to-r from-amber-200 to-green-200"></div>
                                    <motion.div
                                      className="w-2 h-2 bg-green-400 rounded-full"
                                      animate={{ scale: [1, 1.5, 1] }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                      }}
                                    ></motion.div>
                                    <div className="h-px w-10 bg-green-200"></div>
                                  </div>

                                  <div className="flex flex-col items-center">
                                    <div className="text-sm text-gray-500 mb-1">
                                      Status
                                    </div>
                                    <div className="font-medium text-green-600 px-4 py-2 bg-green-50 rounded-lg border border-green-100 flex items-center gap-2">
                                      <motion.div
                                        className="w-1.5 h-1.5 bg-green-500 rounded-full"
                                        animate={{ scale: [1, 1.5, 1] }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                        }}
                                      ></motion.div>
                                      Ongoing
                                    </div>
                                  </div>
                                </>
                              ) : null}
                            </div>

                            <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-600 text-sm border border-gray-100">
                              <span className="font-medium">Duration:</span>{" "}
                              {calculateDuration(
                                currentProject.startDate,
                                currentProject.endDate,
                                currentProject.current
                              )}
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Project Links */}
                    {(currentProject.projectUrl ||
                      currentProject.repositoryUrl) && (
                      <section className="pt-2">
                        <h3 className="text-lg font-medium text-gray-800 mb-6 flex items-center gap-2">
                          <span className="h-4 w-1 bg-violet-400 rounded-full"></span>
                          Project Links
                        </h3>
                        <div className="flex flex-wrap gap-4">
                          {currentProject.projectUrl && (
                            <motion.a
                              href={currentProject.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ y: -2 }}
                              className="flex items-center gap-2 px-5 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg border border-violet-100 shadow-sm transition-colors group"
                            >
                              <ExternalLink size={16} />
                              <span>View Live Project</span>
                              <ArrowRight
                                size={14}
                                className="opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all"
                              />
                            </motion.a>
                          )}

                          {currentProject.repositoryUrl && (
                            <motion.a
                              href={currentProject.repositoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ y: -2 }}
                              className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shadow-sm transition-colors group"
                            >
                              <GitBranch size={16} />
                              <span>View Repository</span>
                              <ArrowRight
                                size={14}
                                className="opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all"
                              />
                            </motion.a>
                          )}
                        </div>
                      </section>
                    )}
                  </div>
                </motion.div>

                {/* Simplified Client Testimonial */}
                {currentProject.client?.testimonial?.content && (
                  <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 mt-8"
                  >
                    <h2 className="text-2xl font-medium text-gray-800 mb-8 flex items-center gap-3">
                      <span className="h-6 w-1 bg-violet-500 rounded-full"></span>
                      Client Testimonial
                    </h2>

                    <div className="relative mx-auto max-w-3xl">
                      <div className="absolute -top-2 -left-2 text-5xl text-violet-200 font-serif">
                        "
                      </div>
                      <blockquote className="relative z-10 pt-6 px-6 text-gray-600 text-lg italic leading-relaxed">
                        {currentProject.client.testimonial.content}
                      </blockquote>
                    </div>

                    {(currentProject.client.testimonial.author ||
                      currentProject.client.testimonial.position) && (
                      <div className="mt-6 flex justify-end">
                        <div className="inline-flex items-center py-2 px-4 bg-violet-50 rounded-lg border border-violet-100">
                          <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-500 mr-3">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {currentProject.client.testimonial.author}
                            </p>
                            {currentProject.client.testimonial.position && (
                              <p className="text-sm text-gray-500">
                                {currentProject.client.testimonial.position}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>

              {/* Enhanced Sidebar with Fixed Creator Contact */}
              <motion.div variants={sidebarVariants} className="space-y-6 mt-4">
                {/* Owner Information with Banner */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-violet-500 to-purple-600 relative">
                    <div
                      className="absolute inset-0 opacity-20 mix-blend-overlay"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                      }}
                    ></div>
                  </div>

                  <div className="px-6 pt-0 pb-6 -mt-12">
                    <div className="flex flex-col items-center mb-5">
                      <div className="relative group mb-3">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm group-hover:border-violet-100 transition-colors">
                          {currentProject.ownerData?.profilePicture?.url ? (
                            <img
                              src={currentProject.ownerData.profilePicture.url}
                              alt={`${currentProject.ownerData.firstName} ${currentProject.ownerData.lastName}`}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-violet-50 flex items-center justify-center">
                              <User size={32} className="text-violet-300" />
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-2 right-0 bg-violet-100 text-violet-600 rounded-full p-1 border-2 border-white">
                          <User size={14} />
                        </div>
                      </div>

                      <h2 className="text-xl font-semibold text-gray-800 text-center">
                        About the Creator
                      </h2>

                      <h3 className="font-medium text-gray-900 text-lg mt-1 text-center">
                        {currentProject.ownerData
                          ? `${currentProject.ownerData.firstName} ${currentProject.ownerData.lastName}`
                          : "Anonymous"}
                      </h3>

                      <span className="text-sm text-violet-600 font-medium bg-violet-50 px-4 py-1 rounded-full mt-2">
                        {getOwnerTypeLabel(currentProject.ownerType)}
                      </span>
                    </div>

                    {currentProject.ownerData?.bio && (
                      <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {currentProject.ownerData.bio}
                        </p>
                      </div>
                    )}

                    {currentProject.role && (
                      <div className="flex items-start mb-5 p-4 rounded-lg bg-gradient-to-r from-violet-50 to-white border border-violet-100">
                        <Briefcase
                          size={18}
                          className="text-violet-500 mr-3 mt-0.5"
                        />
                        <div>
                          <span className="block text-xs text-violet-600 uppercase font-medium tracking-wider mb-1">
                            Role in Project
                          </span>
                          <span className="text-sm text-gray-700 font-medium">
                            {currentProject.role}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Updated Contact Creator button instead of messaging */}
                    <motion.a
                      href={`/user/${
                        currentProject.ownerData?.username ||
                        currentProject.owner
                      }`}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <span>View Creator Profile</span>
                      <ArrowRight size={16} />
                    </motion.a>

                    {/* Contact Options */}
                    {(currentProject.ownerData?.email ||
                      currentProject.ownerData?.phone ||
                      currentProject.ownerData?.website) && (
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-3">
                          Contact Options
                        </h4>
                        <div className="space-y-2">
                          {currentProject.ownerData?.email && (
                            <a
                              href={`mailto:${currentProject.ownerData.email}`}
                              className="flex items-center text-gray-700 hover:text-violet-600 transition-colors group"
                            >
                              <Mail
                                size={16}
                                className="mr-2 text-violet-400"
                              />
                              <span className="text-sm group-hover:underline">
                                {currentProject.ownerData.email}
                              </span>
                            </a>
                          )}

                          {currentProject.ownerData?.phone && (
                            <a
                              href={`tel:${currentProject.ownerData.phone}`}
                              className="flex items-center text-gray-700 hover:text-violet-600 transition-colors group"
                            >
                              <Phone
                                size={16}
                                className="mr-2 text-violet-400"
                              />
                              <span className="text-sm group-hover:underline">
                                {currentProject.ownerData.phone}
                              </span>
                            </a>
                          )}

                          {currentProject.ownerData?.website && (
                            <a
                              href={currentProject.ownerData.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-gray-700 hover:text-violet-600 transition-colors group"
                            >
                              <Globe
                                size={16}
                                className="mr-2 text-violet-400"
                              />
                              <span className="text-sm group-hover:underline">
                                {currentProject.ownerData.website.replace(
                                  /^https?:\/\//,
                                  ""
                                )}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Social Media */}
                    {(currentProject.ownerData?.twitter ||
                      currentProject.ownerData?.linkedin ||
                      currentProject.ownerData?.github) && (
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-3">
                          Connect
                        </h4>
                        <div className="flex gap-3">
                          {currentProject.ownerData?.twitter && (
                            <a
                              href={currentProject.ownerData.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-50 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100"
                            >
                              <div className="text-blue-400">𝕏</div>
                            </a>
                          )}

                          {currentProject.ownerData?.linkedin && (
                            <a
                              href={currentProject.ownerData.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-50 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100"
                            >
                              <Linkedin size={20} />
                            </a>
                          )}

                          {currentProject.ownerData?.github && (
                            <a
                              href={currentProject.ownerData.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-50 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-100"
                            >
                              <GitBranch size={20} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Information Card */}
                {currentProject.client &&
                  (currentProject.client.name ||
                    currentProject.client.industry ||
                    currentProject.client.website) && (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="h-12 bg-gradient-to-r from-gray-500 to-gray-600 relative">
                        <div
                          className="absolute inset-0 opacity-20 mix-blend-overlay"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                          }}
                        ></div>
                      </div>

                      <div className="px-6 py-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                          <Building size={18} className="mr-2 text-gray-500" />
                          Client Information
                        </h2>

                        {currentProject.client.logo && (
                          <div className="flex justify-center mb-5">
                            <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center p-2 bg-white">
                              <img
                                src={currentProject.client.logo}
                                alt={`${currentProject.client.name} logo`}
                                className="object-contain w-full h-full"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          {currentProject.client.name && (
                            <div className="flex items-start p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100">
                              <Building
                                size={16}
                                className="text-gray-500 mr-3 mt-0.5"
                              />
                              <div>
                                <span className="block text-xs text-gray-500 uppercase font-medium tracking-wider mb-1">
                                  Client
                                </span>
                                <span className="text-sm text-gray-700 font-medium">
                                  {currentProject.client.name}
                                </span>
                              </div>
                            </div>
                          )}

                          {currentProject.client.industry && (
                            <div className="flex items-start p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100">
                              <Briefcase
                                size={16}
                                className="text-gray-500 mr-3 mt-0.5"
                              />
                              <div>
                                <span className="block text-xs text-gray-500 uppercase font-medium tracking-wider mb-1">
                                  Industry
                                </span>
                                <span className="text-sm text-gray-700 font-medium">
                                  {currentProject.client.industry}
                                </span>
                              </div>
                            </div>
                          )}

                          {currentProject.client.website && (
                            <div className="flex items-start p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100">
                              <ExternalLink
                                size={16}
                                className="text-gray-500 mr-3 mt-0.5"
                              />
                              <div>
                                <span className="block text-xs text-gray-500 uppercase font-medium tracking-wider mb-1">
                                  Website
                                </span>
                                <a
                                  href={currentProject.client.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors group flex items-center"
                                >
                                  {currentProject.client.website.replace(
                                    /^https?:\/\//,
                                    ""
                                  )}
                                  <ArrowRight
                                    size={12}
                                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add this function to the component - place it before the return statement */}
      {function calculateDuration(startDate, endDate, isCurrent) {
        if (!startDate) return "Not specified";

        const start = new Date(startDate);
        const end = isCurrent ? new Date() : endDate ? new Date(endDate) : null;

        if (!end) return "Start date only";

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffYears > 0) {
          const remainingMonths = diffMonths - diffYears * 12;
          return `${diffYears} year${diffYears !== 1 ? "s" : ""}${
            remainingMonths > 0
              ? ` and ${remainingMonths} month${
                  remainingMonths !== 1 ? "s" : ""
                }`
              : ""
          }`;
        } else if (diffMonths > 0) {
          return `${diffMonths} month${diffMonths !== 1 ? "s" : ""}`;
        } else {
          return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
        }
      }}
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Delete Project
                </h3>
                <p className="text-gray-600">
                  Are you sure you want to delete this project? This action
                  cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:bg-red-400 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-pulse">Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete Project</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
