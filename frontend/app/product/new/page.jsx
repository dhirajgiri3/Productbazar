"use client";

import { useEffect, useState } from "react";
import AddProductForm from "./AddProductForm/AddProductForm";
import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Rocket, ArrowRight, Sparkles } from "lucide-react";
import InteractiveBackground from "Components/UI/Background/InteractiveBackground";
import LoaderComponent from "Components/UI/LoaderComponent";

// Animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.2,
      duration: 0.6,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function AddProductPage() {
  const { user, nextStep, authLoading, isInitialized } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !isInitialized) {
      return;
    }
    setLoading(false);

    if (!user) {
      toast.error("Please log in to submit a product", { icon: "🔑" });
      router.push("/auth/login?redirect=/product/new");
      return;
    }

    // Check if user has the capability to upload products
    if (user.roleCapabilities && !user.roleCapabilities.canUploadProducts) {
      toast.error(
        "Your account type doesn't have permission to upload products",
        { icon: "🚫" }
      );
      router.push("/");
      return;
    }

    if (nextStep) {
      const redirectMap = {
        email_verification: "/auth/verify-email",
        phone_verification: "/auth/verify-phone",
        profile_completion: "/complete-profile",
      };

      if (redirectMap[nextStep.type]) {
        toast.error(nextStep.message || "Please complete onboarding first", {
          icon: "📝",
        });
        router.push(redirectMap[nextStep.type]);
      }
    }
  }, [user, nextStep, router, authLoading, isInitialized]);

  // Enhanced Loading State
  if (loading || authLoading || !isInitialized) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <InteractiveBackground />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <LoaderComponent message="Preparing Your Launch Pad..." />
        </div>
      </div>
    );
  }

  // Should not be reached if redirect works, but good fallback
  if (!user)
    return (
      <div className="fixed inset-0 overflow-hidden">
        <InteractiveBackground />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <p className="text-red-500 text-xl font-medium">
                Redirecting to login...
              </p>
              <p className="text-gray-500 mt-2">
                You'll need to sign in to add your product
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );

  return (
    <motion.div
      className="min-h-screen overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* Creative background with interactive elements */}
      <div className="fixed inset-0">
        <InteractiveBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white/70 pointer-events-none"></div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-radial from-violet-200/30 via-transparent to-transparent blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-radial from-purple-200/30 via-transparent to-transparent blur-3xl opacity-50 animate-pulse [animation-delay:1.5s]"></div>
        <div className="absolute top-40 right-1/4 w-40 h-40 bg-gradient-radial from-indigo-200/20 via-transparent to-transparent blur-3xl opacity-40 animate-pulse [animation-delay:0.7s]"></div>
      </div>

      <div className="relative min-h-screen z-10">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <motion.div
            className="mb-10 text-center max-w-3xl mx-auto"
            variants={itemVariants}
          >
            <div className="inline-flex items-center justify-center p-2 mb-4 bg-gradient-to-r from-violet-50 via-purple-50 to-white rounded-full border border-violet-100">
              <span className="px-4 py-1.5 text-sm font-medium text-violet-700 bg-white rounded-full flex items-center">
                <Sparkles size={16} className="mr-2 text-violet-500" />
                Create & Share Your Innovation
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">
              Launch Your Product
            </h1>

            <p className="mt-6 text-md sm:text-md text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Share your creation with our community of makers and early
              adopters. The journey from idea to launch is just a few steps
              away.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <motion.div
                className="flex items-center justify-center bg-white/80 backdrop-blur-sm px-5 py-3 rounded-lg border border-violet-100"
                whileHover={{
                  y: -3,
                }}
              >
                <Rocket size={18} className="mr-2 text-violet-600" />
                <span className="text-gray-700">Follow our guided process</span>
              </motion.div>

              <motion.div
                className="flex items-center justify-center bg-white/80 backdrop-blur-sm px-5 py-3 rounded-lg border border-violet-100"
                whileHover={{
                  y: -3,
                }}
              >
                <ArrowRight size={18} className="mr-2 text-violet-600" />
                <span className="text-gray-700">Let's launch in minutes</span>
              </motion.div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <AddProductForm />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
