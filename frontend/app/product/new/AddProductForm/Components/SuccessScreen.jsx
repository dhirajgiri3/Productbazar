"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Rocket, ExternalLink, ArrowLeft } from "lucide-react";
import { Balloons } from "../../../../../Components/UI/balloons";
import SuccessConfetti from "../../../../complete-profile/Components/SuccessConfetti";
import { useRouter } from "next/navigation";

const SuccessScreen = ({ productData, onReset }) => {
  const router = useRouter();
  const balloonsRef = useRef(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger combined celebration effects
  useEffect(() => {
    console.log("Success screen mounted, preparing to trigger animations");

    // Delay the animations slightly to ensure the component is fully mounted
    const mainTimer = setTimeout(() => {
      // First trigger the balloons with the new celebration effect
      if (balloonsRef.current) {
        console.log("Launching balloon animation");
        try {
          balloonsRef.current.launchAnimation();
        } catch (error) {
          console.error("Error launching balloon animation:", error);
        }
      } else {
        console.warn("Balloon ref is not available");
      }

      // Then trigger confetti with a slight delay
      setTimeout(() => {
        console.log("Triggering confetti animation");
        setShowConfetti(true);
      }, 300);
    }, 300); // Delay the start of animations

    return () => {
      clearTimeout(mainTimer);
      // Clean up animations if component unmounts
      if (balloonsRef.current && balloonsRef.current.cleanupAnimations) {
        balloonsRef.current.cleanupAnimations();
      }
    };
  }, []);

  // Navigate to product page
  const handleViewProduct = () => {
    if (productData && productData.slug) {
      router.push(`/product/${productData.slug}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Balloons container with enhanced celebration effect */}
      <Balloons
        ref={balloonsRef}
        type="celebration"
        className="absolute inset-0"
        colors={[
          "#8B5CF6", // Violet (primary)
          "#A78BFA", // Light Violet
          "#C4B5FD", // Lighter Violet
          "#7C3AED", // Purple
          "#6D28D9", // Indigo
          "#4F46E5", // Blue
          "#F472B6", // Pink
          "#EC4899", // Hot Pink
          "#F59E0B", // Amber
          "#10B981", // Emerald
        ]}
      />

      {/* Success confetti animation */}
      {showConfetti && <SuccessConfetti trigger={showConfetti} duration={5000} />}

      {/* Success content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="text-center max-w-md z-10 bg-white bg-opacity-90 p-8 rounded-2xl shadow-lg border border-violet-100"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-100 flex items-center justify-center">
          <Rocket size={32} className="text-violet-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Product Launched Successfully!
        </h2>

        <p className="text-gray-600 mb-8">
          Your product has been submitted and is now live on ProductBazar. Share it with the world!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleViewProduct}
            className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>View Your Product</span>
            <ExternalLink size={18} />
          </button>

          <button
            onClick={onReset}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            <span>Add Another Product</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SuccessScreen;
