"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/contexts/theme-context";  

/**
 * Minimalistic SectionLabel Component with Shimmer Effect
 *
 * A clean, simple section label with a subtle shimmer animation
 * that runs continuously in the background.
 */
const SectionLabel = ({
  text,
  alignment = 'left',
  size = 'small', // Default to small for minimalism
  className = "",
  id,
  uppercase = false,
  animate = true,
  icon = null,
  variant = 'default',
  badge = null,
  animationStyle = 'fade'
}) => {
  const { isDarkMode } = useTheme();
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
    }
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
      bg: isDarkMode ? "bg-violet-900/20" : "bg-violet-50",
      text: isDarkMode ? "text-violet-200" : "text-violet-700",
      border: isDarkMode ? "border-violet-700/30" : "border-violet-200/70",
      dot: isDarkMode ? "bg-violet-400" : "bg-violet-500",
      badgeBg: isDarkMode ? "bg-violet-700/40" : "bg-violet-100",
      badgeText: isDarkMode ? "text-violet-100" : "text-violet-800",
      shimmer: isDarkMode ? "from-transparent via-violet-500/10 to-transparent" : "from-transparent via-violet-300/20 to-transparent",
    },
    glass: {
      bg: isDarkMode ? "bg-white/5" : "bg-black/5",
      text: isDarkMode ? "text-white/90" : "text-gray-700",
      border: isDarkMode ? "border-white/10" : "border-black/5",
      dot: isDarkMode ? "bg-white/70" : "bg-black/70",
      badgeBg: isDarkMode ? "bg-white/10" : "bg-black/5",
      badgeText: isDarkMode ? "text-white/90" : "text-black/70",
      shimmer: isDarkMode ? "from-transparent via-white/5 to-transparent" : "from-transparent via-black/5 to-transparent",
    },
    sunset: {
      bg: isDarkMode ? "bg-orange-900/20" : "bg-orange-50",
      text: isDarkMode ? "text-orange-200" : "text-orange-700",
      border: isDarkMode ? "border-orange-700/20" : "border-orange-200",
      dot: isDarkMode ? "bg-orange-400" : "bg-orange-500",
      badgeBg: isDarkMode ? "bg-orange-700/40" : "bg-orange-100",
      badgeText: isDarkMode ? "text-orange-100" : "text-orange-800",
      shimmer: isDarkMode ? "from-transparent via-orange-500/10 to-transparent" : "from-transparent via-orange-300/15 to-transparent",
    },
    modern: {
      bg: isDarkMode ? "bg-gray-800/30" : "bg-white/80",
      text: isDarkMode ? "text-gray-200" : "text-gray-700",
      border: isDarkMode ? "border-gray-700/20" : "border-gray-200/50",
      dot: isDarkMode ? "bg-violet-400" : "bg-violet-500",
      badgeBg: isDarkMode ? "bg-gray-700/40" : "bg-gray-100",
      badgeText: isDarkMode ? "text-gray-200" : "text-gray-700",
      shimmer: isDarkMode ? "from-transparent via-gray-400/5 to-transparent" : "from-transparent via-gray-400/10 to-transparent",
    },
    ocean: {
      bg: isDarkMode ? "bg-cyan-900/20" : "bg-cyan-50",
      text: isDarkMode ? "text-cyan-200" : "text-cyan-700",
      border: isDarkMode ? "border-cyan-700/20" : "border-cyan-200",
      dot: isDarkMode ? "bg-cyan-400" : "bg-cyan-500",
      badgeBg: isDarkMode ? "bg-cyan-700/40" : "bg-cyan-100",
      badgeText: isDarkMode ? "text-cyan-100" : "text-cyan-800",
      shimmer: isDarkMode ? "from-transparent via-cyan-500/10 to-transparent" : "from-transparent via-cyan-300/15 to-transparent",
    },
    ecosystem: {
      bg: isDarkMode ? "bg-blue-900/20" : "bg-blue-50", 
      text: isDarkMode ? "text-blue-200" : "text-blue-700",
      border: isDarkMode ? "border-blue-700/20" : "border-blue-200",
      dot: isDarkMode ? "bg-blue-400" : "bg-blue-500",
      badgeBg: isDarkMode ? "bg-blue-700/40" : "bg-blue-100",
      badgeText: isDarkMode ? "text-blue-200" : "text-blue-700",
      shimmer: isDarkMode ? "from-transparent via-blue-500/10 to-transparent" : "from-transparent via-blue-300/15 to-transparent",
    },
    features: {
      bg: isDarkMode ? "bg-indigo-900/20" : "bg-indigo-50",
      text: isDarkMode ? "text-indigo-200" : "text-indigo-700",
      border: isDarkMode ? "border-indigo-700/20" : "border-indigo-200",
      dot: isDarkMode ? "bg-indigo-400" : "bg-indigo-500",
      badgeBg: isDarkMode ? "bg-indigo-700/40" : "bg-indigo-100",
      badgeText: isDarkMode ? "text-indigo-200" : "text-indigo-700",
      shimmer: isDarkMode ? "from-transparent via-indigo-500/10 to-transparent" : "from-transparent via-indigo-300/15 to-transparent",
    },
    impact: {
      bg: isDarkMode ? "bg-green-900/20" : "bg-green-50",
      text: isDarkMode ? "text-green-200" : "text-green-700",
      border: isDarkMode ? "border-green-700/20" : "border-green-200",
      dot: isDarkMode ? "bg-green-400" : "bg-green-500",
      badgeBg: isDarkMode ? "bg-green-700/40" : "bg-green-100",
      badgeText: isDarkMode ? "text-green-200" : "text-green-700",
      shimmer: isDarkMode ? "from-transparent via-green-500/10 to-transparent" : "from-transparent via-green-300/15 to-transparent",
    }
  };

  // Get design variant
  const design = designVariants[variant] || designVariants.default;

  // Simplified animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const slideVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const dotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { delay: 0.1, duration: 0.2, ease: "easeOut" }
    }
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
        alignment === 'center' ? "flex justify-center" :
        alignment === 'right' ? "flex justify-end" : ""
      )}
    >
      <motion.div
        id={id}
        className={containerClasses}
        initial={animate && !hasAnimated ? "hidden" : "visible"}
        animate="visible"
        variants={animationStyle === 'slide' ? slideVariants : containerVariants}
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
            repeatDelay: 0.5
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

        {/* Label text - simple, without letter animations */}
        <span className="relative z-10 font-medium">
          {text}
        </span>

        {/* Simple badge (if provided) */}
        {badge && (
          <span className={cn(
            "ml-1.5 px-1.5 py-0.5 text-xs rounded-full relative z-10",
            design.badgeBg,
            design.badgeText,
            "text-[10px] font-medium"
          )}>
            {badge}
          </span>
        )}
      </motion.div>
    </div>
  );
};

export default SectionLabel;