"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Minimalistic SectionLabel Component with Shimmer Effect
 *
 * A clean, simple section label with a subtle shimmer animation
 * that runs continuously in the background.
 */
const SectionLabel = ({
  text,
  alignment = "left",
  size = "small", // Default to small for minimalism
  className = "",
  id,
  uppercase = false,
  animate = true,
  icon = null,
  variant = "default",
  badge = null,
  animationStyle = "fade",
}) => {
  const [hasAnimated, setHasAnimated] = useState(false);

  // Simplified size variants
  const sizeVariants = {
    small: {
      base: "text-xs",
      padding: "px-2.5 py-1",
      iconSize: "w-2.5 h-2.5 mr-1",
    },
    medium: {
      base: "text-xs",
      padding: "px-3 py-1.5",
      iconSize: "w-3 h-3 mr-1.5",
    },
  };

  // Alignment classes
  const alignmentClasses = {
    left: "text-left",
    center: "text-center mx-auto",
    right: "text-right ml-auto",
  };

  // Simplified design variants
  const designVariants = {
    default: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-200/70",
      dot: "bg-violet-500",
      badgeBg: "bg-violet-100",
      badgeText: "text-violet-800",
      shimmer: "from-transparent via-violet-300/20 to-transparent",
    },
    glass: {
      bg: "bg-black/5",
      text: "text-gray-700",
      border: "border-black/5",
      dot: "bg-black/70",
      badgeBg: "bg-black/5",
      badgeText: "text-black/70",
      shimmer: "from-transparent via-black/5 to-transparent",
    },
    sunset: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      dot: "bg-orange-500",
      badgeBg: "bg-orange-100",
      badgeText: "text-orange-800",
      shimmer: "from-transparent via-orange-300/15 to-transparent",
    },
    modern: {
      bg: "bg-white/80",
      text: "text-gray-700",
      border: "border-gray-200/50",
      dot: "bg-violet-500",
      badgeBg: "bg-gray-100",
      badgeText: "text-gray-700",
      shimmer: "from-transparent via-gray-400/10 to-transparent",
    },
    ocean: {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-200",
      dot: "bg-cyan-500",
      badgeBg: "bg-cyan-100",
      badgeText: "text-cyan-800",
      shimmer: "from-transparent via-cyan-300/15 to-transparent",
    },
    ecosystem: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      dot: "bg-blue-500",
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-700",
      shimmer: "from-transparent via-blue-300/15 to-transparent",
    },
    features: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
      dot: "bg-indigo-500",
      badgeBg: "bg-indigo-100",
      badgeText: "text-indigo-700",
      shimmer: "from-transparent via-indigo-300/15 to-transparent",
    },
    impact: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      dot: "bg-green-500",
      badgeBg: "bg-green-100",
      badgeText: "text-green-700",
      shimmer: "from-transparent via-green-300/15 to-transparent",
    },
  };

  // Get design variant
  const design = designVariants[variant] || designVariants.default;

  // Simplified animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const slideVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const dotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { delay: 0.1, duration: 0.2, ease: "easeOut" },
    },
  };

  // Reset animation when text changes
  useEffect(() => {
    setHasAnimated(false);
  }, [text]);

  // Mark as animated once animation completes
  const handleAnimationComplete = () => {
    setHasAnimated(true);
  };

  // Combine classes for minimal styling
  const containerClasses = cn(
    "relative inline-flex items-center justify-center overflow-hidden",
    "rounded-full",
    sizeVariants[size].padding,
    sizeVariants[size].base,
    design.text,
    design.bg,
    "font-medium",
    design.border,
    "border",
    "mb-3",
    alignmentClasses[alignment],
    uppercase ? "uppercase tracking-wide" : "tracking-normal",
    className
  );

  return (
    <div
      className={cn(
        "relative",
        alignment === "center"
          ? "flex justify-center"
          : alignment === "right"
          ? "flex justify-end"
          : ""
      )}
    >
      <motion.div
        id={id}
        className={containerClasses}
        initial={animate && !hasAnimated ? "hidden" : "visible"}
        animate="visible"
        variants={animationStyle === "slide" ? slideVariants : containerVariants}
        onAnimationComplete={handleAnimationComplete}
        whileHover={{ y: -1 }}
      >
        {/* Shimmering effect */}
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-r",
            design.shimmer,
            "rounded-full"
          )}
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
            ease: "linear",
            repeatDelay: 0.5,
          }}
        />

        {/* Dot accent */}
        <motion.span
          className={cn("w-1.5 h-1.5 rounded-full relative z-10", design.dot, "mr-1.5")}
          variants={dotVariants}
        />

        {/* Icon (if provided) */}
        {icon && (
          <span className={cn(sizeVariants[size].iconSize, "relative z-10")}>
            {icon}
          </span>
        )}

        {/* Label text */}
        <span className="relative z-10 font-medium">{text}</span>

        {/* Simple badge (if provided) */}
        {badge && (
          <span
            className={cn(
              "ml-1.5 px-1.5 py-0.5 text-xs rounded-full relative z-10",
              design.badgeBg,
              design.badgeText,
              "text-[10px] font-medium"
            )}
          >
            {badge}
          </span>
        )}
      </motion.div>
    </div>
  );
};

export default SectionLabel;