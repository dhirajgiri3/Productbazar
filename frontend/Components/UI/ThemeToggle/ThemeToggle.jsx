"use client";

import React, { useState, useCallback, memo, useEffect } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/contexts/theme-context";

// Memoized ThemeToggle component with enhanced animations
const ThemeToggle = memo(({ className = "", size = "default", instanceId = "main" }) => {
  const { isDarkMode, toggleTheme, mounted } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimationControls();

  // Generate stars with deterministic positioning to prevent hydration mismatch
  const [starsPositions] = useState(() =>
    Array.from({ length: 5 }, (_, i) => ({
      x: [20, -30, 35, -25, 15][i], // Deterministic positions
      y: [-20, 25, -35, 30, -15][i],
      delay: [0.1, 0.3, 0.5, 0.2, 0.4][i], // Deterministic delays
      size: [0.3, 0.5, 0.4, 0.6, 0.35][i] // Deterministic sizes
    }))
  );

  // Generate sun rays with deterministic positioning
  const [sunRays] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      angle: (i * 45) % 360, // Evenly spaced around the sun
      length: [1.0, 0.8, 1.2, 0.9, 1.1, 0.85, 1.15, 0.95][i], // Deterministic lengths
      delay: [0.0, 0.1, 0.05, 0.15, 0.08, 0.12, 0.03, 0.18][i], // Deterministic delays
    }))
  );

  // Memoized handlers
  const handleHoverStart = useCallback(() => setIsHovered(true), []);
  const handleHoverEnd = useCallback(() => setIsHovered(false), []);

  // Enhanced mount animation
  useEffect(() => {
    if (mounted) {
      controls.start({
        scale: [1, 1.05, 1],
        transition: {
          duration: 1.2,
          times: [0, 0.5, 1],
          ease: [0.34, 1.56, 0.64, 1] // Spring-like ease
        }
      });
    }
  }, [mounted, controls]);

  if (!mounted) return null;

  // Size variants with slightly larger options
  const sizeClasses = {
    small: "w-10 h-10",
    default: "w-12 h-12",
    large: "w-14 h-14",
  };

  const iconSizes = {
    small: 18,
    default: 20,
    large: 24,
  };

  // Enhanced button animations
  const buttonVariants = {
    initial: { scale: 1 },
    pressed: { scale: 0.9 },
  };

  // Enhanced icon animations
  const iconVariants = {
    initial: { y: -8, opacity: 0, rotate: -20, scale: 0.7 },
    animate: {
      y: 0,
      opacity: 1,
      rotate: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20,
        duration: 0.35
      }
    },
    exit: {
      y: 8,
      opacity: 0,
      rotate: 20,
      scale: 0.7,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    hover: {
      scale: 1.1,
      rotate: isDarkMode ? -5 : 5,
      transition: {
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1] // Spring-like ease
      }
    }
  };

  // Enhanced star animation
  const starVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: (custom) => ({
      scale: [0, custom.size, 0],
      opacity: [0, 0.8, 0],
      transition: {
        delay: custom.delay,
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut"
      }
    })
  };

  // Sun ray animation
  const rayVariants = {
    initial: { scaleY: 0.5, opacity: 0.3 },
    animate: (custom) => ({
      scaleY: [0.5, 1.2, 0.5],
      opacity: [0.3, 0.7, 0.3],
      transition: {
        delay: custom.delay,
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut"
      }
    })
  };

  const currentIconSize = iconSizes[size] || iconSizes.default;

  return (      <motion.button
      onClick={toggleTheme}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      className={`relative rounded-full flex items-center justify-center will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all duration-300 ease-out theme-toggle
        ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-800 to-gray-900 text-violet-300 hover:from-gray-700 hover:to-gray-800 border border-gray-700 focus-visible:ring-violet-500 focus-visible:ring-offset-gray-900"
            : "bg-gradient-to-br from-white to-gray-50 text-amber-500 hover:from-gray-50 hover:to-white border border-gray-200 focus-visible:ring-amber-500 focus-visible:ring-offset-white"
        }
        ${sizeClasses[size] || sizeClasses.default}
        ${className}`}
      variants={buttonVariants}
      initial="initial"
      animate={controls}
      whileHover="hover"
      whileTap="pressed"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        willChange: "transform",
        transform: "translateZ(0)", // Force hardware acceleration
      }}
    >
      {/* Background glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-full opacity-0 ${
          isDarkMode ? "bg-violet-600" : "bg-amber-400"
        }`}
        animate={{
          opacity: isHovered ? 0.15 : 0
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Main icon animation */}
      <AnimatePresence initial={false} mode="wait">
        {isDarkMode ? (
          <motion.div
            key={`dark-${instanceId}`}
            className="relative flex items-center justify-center"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover={isHovered ? "hover" : ""}
            style={{ willChange: "transform, opacity" }}
          >
            <Moon
              size={currentIconSize}
              strokeWidth={1.5}
              className="text-violet-300" // Changed to violet to match landing page
              fill="rgba(139, 92, 246, 0.1)" // violet-500 with low alpha
            />

            {/* Stars around the moon */}
            {starsPositions.map((pos, i) => (
              <motion.div
                key={i}
                className="absolute"
                custom={pos}
                variants={starVariants}
                initial="initial"
                animate="animate"
                style={{
                  top: `calc(50% + ${pos.y}px)`,
                  left: `calc(50% + ${pos.x}px)`,
                  width: Math.max(1, currentIconSize * 0.1 * pos.size),
                  height: Math.max(1, currentIconSize * 0.1 * pos.size),
                  borderRadius: "50%",
                  background: "rgba(216, 180, 254, 0.9)", // violet-300
                }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={`light-${instanceId}`}
            className="relative flex items-center justify-center"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover={isHovered ? "hover" : ""}
            style={{ willChange: "transform, opacity" }}
          >
            <Sun
              size={currentIconSize}
              strokeWidth={1.5}
              className="text-amber-500"
              fill="rgba(245, 158, 11, 0.1)" // amber-500 with low alpha
            />

            {/* Sun rays */}
            {sunRays.map((ray, i) => (
              <motion.div
                key={i}
                className="absolute bg-amber-400"
                custom={ray}
                variants={rayVariants}
                initial="initial"
                animate="animate"
                style={{
                  width: '1.5px',
                  height: `${currentIconSize * 0.5 * ray.length}px`,
                  borderRadius: '1px',
                  transformOrigin: 'center bottom',
                  transform: `rotate(${ray.angle}deg) translateY(-${currentIconSize * 0.75}px)`,
                  opacity: 0.6,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

ThemeToggle.displayName = "ThemeToggle";

export default ThemeToggle;