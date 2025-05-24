"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/auth-context";
import ProjectForm from "./ProjectForm";
import LoaderComponent from "Components/UI/LoaderComponent";

export default function AddProjectPage() {
  const { user, authLoading, isInitialized } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !isInitialized) {
      return;
    }
    setLoading(false);

    if (!user) {
      toast.error("Please log in to add a project", { icon: '🔑' });
      router.push("/auth/login?redirect=/projects/add");
      return;
    }

    // Check if user has permission to showcase projects
    if (user.roleCapabilities && !user.roleCapabilities.canShowcaseProjects) {
      toast.error("Your account type doesn't have permission to showcase projects", { icon: '🚫' });
      router.push("/projects");
      return;
    }

    // Check if user has completed profile
    if (!user.isProfileCompleted) {
      toast.error("Please complete your profile before adding a project", { icon: '📝' });
      router.push("/complete-profile");
      return;
    }
  }, [user, router, authLoading, isInitialized]);

  if (loading || authLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderComponent size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <motion.div
        className="max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-12">
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Showcase Your Project
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Share your work with the community and potential clients or employers
          </motion.p>
        </div>

        <ProjectForm user={user} />
      </motion.div>
    </div>
  );
}
