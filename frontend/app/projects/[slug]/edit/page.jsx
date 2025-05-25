"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/auth-context";
import { useProject } from "@/lib/contexts/project-context";
import ProjectForm from "../../add/ProjectForm";
import LoaderComponent from "Components/UI/LoaderComponent";

export default function EditProjectPage() {
  const { slug } = useParams();
  const { user, authLoading, isInitialized } = useAuth();
  const { currentProject, loading, error, fetchProjectBySlug } = useProject();
  const [pageLoading, setPageLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadProject = async () => {
      if (!slug) return;
      
      try {
        await fetchProjectBySlug(slug);
      } catch (err) {
        console.error("Error loading project:", err);
        toast.error("Failed to load project");
      }
    };

    if (isInitialized && !authLoading) {
      loadProject();
    }
  }, [slug, fetchProjectBySlug, isInitialized, authLoading]);

  useEffect(() => {
    if (authLoading || !isInitialized || loading) {
      return;
    }

    setPageLoading(false);

    if (!user) {
      toast.error("Please log in to edit a project", { icon: '🔑' });
      router.push(`/auth/login?redirect=/projects/${slug}/edit`);
      return;
    }

    // Check if user has permission to showcase projects
    if (user.roleCapabilities && !user.roleCapabilities.canShowcaseProjects) {
      toast.error("Your account type doesn't have permission to edit projects", { icon: '🚫' });
      router.push(`/projects/${slug}`);
      return;
    }

    // Check if user has completed profile
    if (!user.isProfileCompleted) {
      toast.error("Please complete your profile before editing a project", { icon: '📝' });
      router.push("/complete-profile");
      return;
    }

    // Check if user has permission to edit this project
    if (currentProject) {
      const isOwner = currentProject.owner === user._id;
      const hasEditPermission = currentProject.collaborators?.some(
        collab => collab.user === user._id && 
        (collab.role === 'owner' || collab.permissions?.canEdit)
      );

      if (isOwner || hasEditPermission) {
        setHasPermission(true);
      } else {
        toast.error("You don't have permission to edit this project", { icon: '🚫' });
        router.push(`/projects/${slug}`);
      }
    }
  }, [user, router, authLoading, isInitialized, currentProject, loading, slug]);

  if (pageLoading || authLoading || !isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderComponent size="large" />
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-white rounded-xl border border-gray-100"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Project Not Found
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            The project you're trying to edit doesn't exist or has been removed.
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

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-white rounded-xl border border-gray-100"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Permission Denied
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            You don't have permission to edit this project.
          </p>
          <button
            onClick={() => router.push(`/projects/${slug}`)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg transition-all duration-300"
          >
            View Project
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 py-12 px-4">
      <motion.div
        className="max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-12">
          <motion.h1
            className="text-4xl font-bold text-gray-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Edit Project
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Update your project details and showcase your work
          </motion.p>
        </div>

        <ProjectForm user={user} project={currentProject} isEditing={true} />
      </motion.div>
    </div>
  );
}
