"use client";

import React, { useRef, useState, useId, useEffect, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "./Animations/AnimatedBeam";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import * as LucideIcons from "lucide-react";
import { useTheme } from "@/lib/contexts/theme-context";
import SectionLabel from "./Animations/SectionLabel";
import { useReducedMotion } from "framer-motion";

// Water ripple filter component with client-side only particle generation
const WaterRippleFilter = ({ children }) => {
  const [particles, setParticles] = useState([]);
  const [isClient, setIsClient] = useState(false);
  // SSR-safe: use a fixed seed for SSR, and Date.now() for client
  const [seed, setSeed] = useState(12345); // deterministic for SSR
  const seedRef = useRef(seed);

  useEffect(() => {
    setIsClient(true);
    // Only set seed on client
    setSeed(Date.now());
  }, []);

  // Pseudo-random number generator with seed
  const seededRandom = () => {
    seedRef.current = (seedRef.current * 9301 + 49297) % 233280;
    return seedRef.current / 233280;
  };

  useEffect(() => {
    if (!isClient) return;
    const generateParticle = () => {
      const width = 2 + seededRandom() * 5;
      const height = 2 + seededRandom() * 6;
      const left = seededRandom() * 100;
      const top = seededRandom() * 100;
      const opacity = 0.1 + seededRandom() * 0.3;

      return {
        width: `${width.toFixed(6)}px`,
        height: `${height.toFixed(6)}px`,
        left: `${left.toFixed(6)}%`,
        top: `${top.toFixed(6)}%`,
        opacity: opacity.toFixed(16),
        filter: "blur(0.5px)",
      };
    };

    const initialParticles = Array.from({ length: 20 }, generateParticle);
    setParticles(initialParticles);
  }, [isClient, seed]);

  // Return a static placeholder during SSR
  if (!isClient) {
    return <div className="relative w-full h-full">{children}</div>;
  }

  return (
    <div className="relative w-full h-full">
      {particles.map((style, index) => (
        <motion.div
          key={`particle-${seedRef.current}-${index}`}
          className="absolute rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-300"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: style.opacity }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            ease: "easeOut",
          }}
          style={style}
        />
      ))}
      {children}
    </div>
  );
};

// Enhanced Circle component with improved accessibility, animations and theme support
const Circle = React.forwardRef(
  (
    {
      className,
      children,
      tooltipText,
      icon,
      iconColor,
      label,
      accentColor,
      index = 0,
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const tooltipId = useId();
    const circleId = useId();
    const { isDarkMode, theme } = useTheme();
    const prefersReducedMotion = useReducedMotion();

    // Motion values for smoother animations with spring physics
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 150, damping: 15 });
    const springY = useSpring(y, { stiffness: 150, damping: 15 });

    // Derived motion values for tilt effect (disabled with reduced motion)
    const rotateX = useTransform(
      springY,
      [-50, 50],
      prefersReducedMotion ? [0, 0] : [5, -5]
    );
    const rotateY = useTransform(
      springX,
      [-50, 50],
      prefersReducedMotion ? [0, 0] : [-5, 5]
    );

    // Improved entry animation with staggered timing
    useEffect(() => {
      if (prefersReducedMotion) {
        setIsMounted(true);
        return;
      }

      const timer = setTimeout(() => {
        setIsMounted(true);
      }, 100 + index * 100); // Slightly faster staggering

      return () => clearTimeout(timer);
    }, [index, prefersReducedMotion]);

    // Enhanced mouse move handler for 3D effect (disabled with reduced motion)
    const handleMouseMove = (event) => {
      if (prefersReducedMotion) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate distance from center (normalized to -50 to 50 range)
      const distanceX = event.clientX - centerX;
      const distanceY = event.clientY - centerY;

      // Apply movement with intensity proportional to distance from center
      x.set(distanceX * 0.5);
      y.set(distanceY * 0.5);
    };

    // Reset position on mouse leave for smoother transition
    const handleMouseLeave = () => {
      setIsHovered(false);
      // Smoothly animate back to neutral position
      x.set(0);
      y.set(0);
    };

    // Handle key interaction for accessibility
    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsHovered(!isHovered);
      }
    };

    // Determine active state (hover or focus)
    const isActive = isHovered || isFocused;

    // Get color values based on accent color
    const getColorValue = (colorName, shade) => {
      const colorMap = {
        blue: {
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        emerald: {
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        amber: {
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        rose: {
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
        purple: {
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        cyan: {
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
      };

      return colorMap[colorName]?.[shade] || "";
    };

    return (
      <motion.div
        ref={ref}
        id={circleId}
        className={cn(
          "z-10 flex items-center justify-center rounded-full relative transition-all cursor-pointer overflow-hidden",
          "will-change-transform perspective-1000 sm:size-14 md:size-16 lg:size-18",
          className
        )}
        style={{
          background: !isActive
            ? isDarkMode
              ? "rgb(31, 41, 55)"
              : "rgb(255, 255, 255)"
            : undefined,
          rotateX: rotateX, // Apply 3D rotation
          rotateY: rotateY,
          transformStyle: "preserve-3d",
        }}
        initial={{
          opacity: prefersReducedMotion ? 1 : 0,
          scale: prefersReducedMotion ? 1 : 0.9,
          y: prefersReducedMotion ? 0 : 15,
        }}
        animate={
          isMounted
            ? {
                opacity: 1,
                scale: 1,
                y: 0,
              }
            : {}
        }
        whileHover={prefersReducedMotion ? {} : { scale: 1.08 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
        transition={{
          type: "spring",
          stiffness: 500, // More responsive spring
          damping: 25,
          mass: 0.8, // Lighter mass for quicker response
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={handleMouseLeave}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseMove={handleMouseMove}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={isActive}
        aria-describedby={tooltipId}
        aria-label={`${label} - ${tooltipText}`}
      >
        {/* Improved gradient border with animation */}
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0 }}
          animate={{
            opacity: isActive ? 1 : 0,
            scale: isActive ? 1 : 0.9,
          }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 rounded-full p-[2px]"
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${getColorValue(
                    accentColor,
                    300
                  )}ee, ${getColorValue(accentColor, 500)}ee, ${getColorValue(
                    accentColor,
                    600
                  )}ee)`
                : "none",
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: isDarkMode
                  ? "rgb(31, 41, 55)"
                  : "rgb(255, 255, 255)",
              }}
            />
          </div>
        </motion.div>

        {/* Improved ripple effect with SVG filter */}
        <AnimatePresence>
          {isActive && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Multiple ripples with staggered timing */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `${getColorValue(
                      accentColor,
                      isDarkMode ? 400 : 300
                    )}${isDarkMode ? "15" : "10"}`,
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [0.8, 1.8],
                    opacity: [isDarkMode ? 0.7 : 0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeOut",
                    delay: i * 0.4,
                    repeat: Infinity,
                    repeatDelay: 0.2,
                  }}
                />
              ))}

              {/* Subtle glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full blur-md"
                style={{
                  background: `${getColorValue(
                    accentColor,
                    isDarkMode ? 300 : 200
                  )}${isDarkMode ? "25" : "20"}`,
                }}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  opacity: isActive
                    ? isDarkMode
                      ? 0.8
                      : 0.6
                    : isDarkMode
                    ? 0.5
                    : 0.3,
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Non-active border with subtle gradient - enhanced for better light theme contrast */}
        {!isActive && (
          <div
            className="absolute inset-0 rounded-full border"
            style={{
              borderColor: isDarkMode
                ? "rgba(75, 85, 99, 0.3)"
                : "rgba(209, 213, 219, 0.8)",
              background: isDarkMode
                ? "linear-gradient(to bottom, rgba(55, 65, 81, 0.5), rgba(31, 41, 55, 0.8))"
                : "linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(249, 250, 251, 0.9))",
            }}
          />
        )}

        {/* Enhanced icon with better animations */}
        <motion.div
          className="relative z-10 transform-gpu"
          animate={
            isActive && !prefersReducedMotion
              ? {
                  scale: 1.15,
                  y: isActive ? -1 : 0,
                  rotate:
                    label === "Job Seekers" || label === "Users"
                      ? isActive
                        ? 5
                        : 0
                      : label === "Startups" || label === "Innovators"
                      ? isActive
                        ? -5
                        : 0
                      : 0,
                }
              : { scale: 1, y: 0, rotate: 0 }
          }
          transition={{
            scale: { type: "spring", stiffness: 400, damping: 10 },
            y: { duration: 0.2 },
            rotate: {
              duration: 0.5,
              repeat: isActive && !prefersReducedMotion ? Infinity : 0,
              repeatType: "reverse",
              repeatDelay: 1.5,
              ease: "easeInOut",
            },
          }}
        >
          {/* Icon wrapper with glow effect */}
          <div
            className="relative"
            style={{
              color: isActive
                ? getColorValue(accentColor, isDarkMode ? 400 : 600)
                : isDarkMode
                ? getColorValue(accentColor, 300)
                : getColorValue(accentColor, 600),
            }}
          >
            {React.createElement(icon, {
              className: `sm:w-5 sm:h-5 md:w-6 md:h-6 drop-shadow-sm transform-gpu transition-colors duration-300`,
              strokeWidth: isActive ? 2 : 1.8,
              "aria-hidden": "true",
            })}

            {/* Subtle glow behind icon when active */}
            {isActive && !prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 rounded-full blur-md -z-10"
                style={{
                  background: `${getColorValue(
                    accentColor,
                    isDarkMode ? 300 : 200
                  )}${isDarkMode ? "30" : "20"}`,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
        </motion.div>

        {/* Enhanced label with better transitions and contrast */}
        <motion.span
          className="text-xs font-medium absolute text-center w-full -bottom-7 transition-colors duration-300"
          style={{
            color: isActive
              ? getColorValue(accentColor, isDarkMode ? 400 : 600)
              : isDarkMode
              ? "rgba(229, 231, 235, 0.9)"
              : "rgba(55, 65, 81, 0.9)",
            fontWeight: isActive ? 600 : 500,
            textShadow: isDarkMode ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
          }}
          animate={
            !prefersReducedMotion
              ? {
                  y: isActive ? -1 : 2,
                  scale: isActive ? 1.05 : 1,
                }
              : {}
          }
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          {label}
        </motion.span>

        {children}

        {/* Modernized tooltip with improved design, contrast, and animation */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              id={tooltipId}
              className="absolute -top-16 left-1/2 transform -translate-x-1/2 px-4 py-2.5 rounded-lg z-20 w-max max-w-[12rem] sm:max-w-[14rem] text-center"
              style={{
                background: isDarkMode
                  ? "rgba(31, 41, 55, 0.95)"
                  : "rgba(255, 255, 255, 0.97)",
                backdropFilter: "blur(8px)",
                color: isDarkMode
                  ? "rgba(255, 255, 255, 0.95)"
                  : "rgba(31, 41, 55, 0.95)",
                boxShadow: isDarkMode
                  ? "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)"
                  : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
                border: isDarkMode
                  ? "1px solid rgba(75, 85, 99, 0.3)"
                  : "1px solid rgba(209, 213, 219, 0.8)",
              }}
              initial={{
                opacity: 0,
                y: prefersReducedMotion ? 0 : -8,
                scale: prefersReducedMotion ? 1 : 0.95,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: prefersReducedMotion ? 0 : -8,
                scale: prefersReducedMotion ? 1 : 0.95,
              }}
              transition={{
                duration: 0.25,
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
              role="tooltip"
              aria-hidden={!isActive}
            >
              {/* Sequentially revealed tooltip text */}
              <motion.div
                className="text-xs font-medium"
                style={{
                  color: isDarkMode
                    ? "rgba(255, 255, 255, 0.95)"
                    : "rgba(31, 41, 55, 0.95)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {tooltipText}
              </motion.div>

              {/* Enhanced tooltip arrow with improved shadow and animation */}
              <motion.div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2.5 h-2.5"
                style={{
                  background: isDarkMode
                    ? "rgba(31, 41, 55, 0.95)"
                    : "rgba(255, 255, 255, 0.97)",
                  borderRight: isDarkMode
                    ? "1px solid rgba(75, 85, 99, 0.3)"
                    : "1px solid rgba(209, 213, 219, 0.8)",
                  borderBottom: isDarkMode
                    ? "1px solid rgba(75, 85, 99, 0.3)"
                    : "1px solid rgba(209, 213, 219, 0.8)",
                  boxShadow: isDarkMode
                    ? "2px 2px 5px -2px rgba(0, 0, 0, 0.1)"
                    : "2px 2px 5px -2px rgba(0, 0, 0, 0.03)",
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

Circle.displayName = "Circle";

export function ProductBazarEcosystemConnector() {
  const containerRef = useRef(null);
  const centerRef = useRef(null);
  const [containerVisible, setContainerVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { isDarkMode } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // Individual refs for ecosystem members
  const refs = {
    startups: useRef(null),
    investors: useRef(null),
    agencies: useRef(null),
    jobSeekers: useRef(null),
    innovators: useRef(null),
    users: useRef(null),
  };

  // Spring animation for header elements with improved physics
  const headerSpring = useSpring(0, { stiffness: 100, damping: 20 });
  const headerScale = useTransform(headerSpring, [0, 1], [0.97, 1]);
  const headerY = useTransform(headerSpring, [0, 1], [10, 0]);

  // Mouse parallax effect for background elements
  const handleMouseMove = (e) => {
    if (!containerRef.current || prefersReducedMotion) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  useEffect(() => {
    // Improved loading effect with smoother timing and reduced motion support
    const timer = setTimeout(
      () => {
        setContainerVisible(true);
        headerSpring.set(1);
      },
      prefersReducedMotion ? 0 : 300
    );

    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  // Add keyboard navigation support
  useEffect(() => {
    const handleKeyNavigation = (e) => {
      // Tab key navigation is handled natively
      // Arrow key navigation for the ecosystem circles
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        return;

      e.preventDefault();

      const activeElement = document.activeElement;
      const isCircle = activeElement?.getAttribute("role") === "button";

      if (!isCircle) return;

      // Very basic circle navigation based on indices
      // This could be improved with a more sophisticated focus management system
      const circleElements = Array.from(
        document.querySelectorAll('[role="button"]')
      );
      const currentIndex = circleElements.indexOf(activeElement);

      let nextIndex;
      switch (e.key) {
        case "ArrowRight":
          nextIndex = (currentIndex + 1) % circleElements.length;
          break;
        case "ArrowLeft":
          nextIndex =
            (currentIndex - 1 + circleElements.length) % circleElements.length;
          break;
        case "ArrowUp":
          nextIndex =
            (currentIndex - 3 + circleElements.length) % circleElements.length;
          break;
        case "ArrowDown":
          nextIndex = (currentIndex + 3) % circleElements.length;
          break;
      }

      circleElements[nextIndex]?.focus();
    };

    window.addEventListener("keydown", handleKeyNavigation);
    return () => window.removeEventListener("keydown", handleKeyNavigation);
  }, []);

  // Helper function to get color values - enhanced with full range
  const getColorValue = (colorName, shade) => {
    const colorMap = {
      blue: {
        100: "#dbeafe",
        200: "#bfdbfe",
        300: "#93c5fd",
        400: "#60a5fa",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
        800: "#1e40af",
        900: "#1e3a8a",
      },
      emerald: {
        100: "#d1fae5",
        200: "#a7f3d0",
        300: "#6ee7b7",
        400: "#34d399",
        500: "#10b981",
        600: "#059669",
        700: "#047857",
        800: "#065f46",
        900: "#064e3b",
      },
      amber: {
        100: "#fef3c7",
        200: "#fde68a",
        300: "#fcd34d",
        400: "#fbbf24",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
        800: "#92400e",
        900: "#78350f",
      },
      rose: {
        100: "#ffe4e6",
        200: "#fecdd3",
        300: "#fda4af",
        400: "#fb7185",
        500: "#f43f5e",
        600: "#e11d48",
        700: "#be123c",
        800: "#9f1239",
        900: "#881337",
      },
      purple: {
        100: "#ede9fe",
        200: "#ddd6fe",
        300: "#c4b5fd",
        400: "#a78bfa",
        500: "#8b5cf6",
        600: "#7c3aed",
        700: "#6d28d9",
        800: "#5b21b6",
        900: "#4c1d95",
      },
      cyan: {
        100: "#cffafe",
        200: "#a5f3fc",
        300: "#67e8f9",
        400: "#22d3ee",
        500: "#06b6d4",
        600: "#0891b2",
        700: "#0e7490",
        800: "#155e75",
        900: "#164e63",
      },
    };

    return colorMap[colorName]?.[shade] || "";
  };

  // Enhanced ecosystem members data with improved light/dark theme colors
  const ecosystemMembers = [
    {
      id: "startups",
      name: "Startups",
      ref: refs.startups,
      accentColor: "blue",
      icon: LucideIcons.Rocket,
      iconColor: isDarkMode ? "text-blue-400" : "text-blue-600",
      gradientFrom: getColorValue("blue", isDarkMode ? 500 : 400),
      gradientTo: getColorValue("blue", isDarkMode ? 300 : 600),
      tooltip:
        "Early-stage companies showcasing innovative products and connecting with their target audience",
    },
    {
      id: "investors",
      name: "Investors",
      ref: refs.investors,
      accentColor: "emerald",
      icon: LucideIcons.DollarSign,
      iconColor: isDarkMode ? "text-emerald-400" : "text-emerald-600",
      gradientFrom: getColorValue("emerald", isDarkMode ? 500 : 400),
      gradientTo: getColorValue("emerald", isDarkMode ? 300 : 600),
      tooltip:
        "Angels and VCs discovering promising startups and innovative products to invest in",
    },
    {
      id: "agencies",
      name: "Agencies",
      ref: refs.agencies,
      accentColor: "amber",
      icon: LucideIcons.Building,
      iconColor: isDarkMode ? "text-amber-400" : "text-amber-600",
      gradientFrom: getColorValue("amber", isDarkMode ? 500 : 400),
      gradientTo: getColorValue("amber", isDarkMode ? 300 : 600),
      tooltip:
        "Design and development agencies offering specialized services to product creators",
    },
    {
      id: "jobSeekers",
      name: "Job Seekers",
      ref: refs.jobSeekers,
      accentColor: "rose",
      icon: LucideIcons.Briefcase,
      iconColor: isDarkMode ? "text-rose-400" : "text-rose-600",
      gradientFrom: getColorValue("rose", isDarkMode ? 500 : 400),
      gradientTo: getColorValue("rose", isDarkMode ? 300 : 600),
      tooltip:
        "Professionals finding opportunities in innovative companies and startups",
    },
    {
      id: "innovators",
      name: "Innovators",
      ref: refs.innovators,
      accentColor: "purple",
      icon: LucideIcons.Lightbulb,
      iconColor: isDarkMode ? "text-purple-400" : "text-purple-600",
      gradientFrom: getColorValue("purple", isDarkMode ? 500 : 400),
      gradientTo: getColorValue("purple", isDarkMode ? 300 : 600),
      tooltip:
        "Creative minds developing new ideas and solutions to transform industries",
    },
    {
      id: "users",
      name: "Users",
      ref: refs.users,
      accentColor: "cyan",
      icon: LucideIcons.Users,
      iconColor: isDarkMode ? "text-cyan-400" : "text-cyan-600",
      gradientFrom: getColorValue("cyan", isDarkMode ? 500 : 400),
      gradientTo: getColorValue("cyan", isDarkMode ? 300 : 600),
      tooltip:
        "Community members discovering and engaging with products that improve their lives",
    },
  ];

  // Enhanced beam animation configuration with improved theme adaptation
  const beamConfigs = [
    {
      from: "startups",
      curvature: -85,
      endYOffset: -12,
      delay: 0.6,
      duration: 6.5,
      reverse: false,
      intensity: isDarkMode ? 1.3 : 0.9, // Reduced intensity for light theme
      pulseSpeed: 4.5,
      extendPath: 1.05,
      particleEffect: !prefersReducedMotion,
      particleOpacity: isDarkMode ? 0.6 : 0.3, // Reduced opacity for light theme
    },
    {
      from: "investors",
      curvature: -45,
      endYOffset: -6,
      delay: 1.0,
      duration: 7.0,
      reverse: false,
      intensity: isDarkMode ? 1.4 : 1.0,
      pulseSpeed: 5.0,
      extendPath: 1.08,
      particleEffect: !prefersReducedMotion,
      particleOpacity: isDarkMode ? 0.6 : 0.3,
    },
    {
      from: "agencies",
      curvature: 45,
      endYOffset: 6,
      delay: 1.4,
      duration: 7.5,
      reverse: true,
      intensity: isDarkMode ? 1.5 : 1.1,
      pulseSpeed: 5.5,
      extendPath: 1.06,
      particleEffect: !prefersReducedMotion,
      particleOpacity: isDarkMode ? 0.6 : 0.3,
    },
    {
      from: "jobSeekers",
      curvature: 85,
      endYOffset: 12,
      delay: 1.8,
      duration: 7.2,
      reverse: false,
      intensity: isDarkMode ? 1.3 : 0.9,
      pulseSpeed: 4.8,
      extendPath: 1.04,
      particleEffect: !prefersReducedMotion,
      particleOpacity: isDarkMode ? 0.6 : 0.3,
    },
    {
      from: "innovators",
      curvature: -85,
      endYOffset: -12,
      delay: 2.2,
      duration: 6.8,
      reverse: true,
      intensity: isDarkMode ? 1.4 : 1.0,
      pulseSpeed: 5.2,
      extendPath: 1.07,
      particleEffect: !prefersReducedMotion,
      particleOpacity: isDarkMode ? 0.6 : 0.3,
    },
    {
      from: "users",
      curvature: 85,
      endYOffset: 12,
      delay: 2.6,
      duration: 7.0,
      reverse: true,
      intensity: isDarkMode ? 1.5 : 1.1,
      pulseSpeed: 5.0,
      extendPath: 1.05,
      particleEffect: !prefersReducedMotion,
      particleOpacity: isDarkMode ? 0.6 : 0.3,
    },
  ];

  return (
    <section
      className="relative w-full flex flex-col items-center justify-center min-h-[600px] md:min-h-[700px] lg:min-h-[800px] py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      aria-label="Product Bazar Ecosystem Visualization"
      role="region"
    >
      {/* Custom SVG filters for water ripple effects */}
      <WaterRippleFilter />

      {/* Animated grid pattern - improved for better light theme visibility */}
      <motion.div
        className={`absolute inset-0 ${
          isDarkMode ? "bg-grid-purple-300/[0.15]" : "bg-grid-purple-600/[0.07]"
        } grid-fade-mask z-0 opacity-20 transition-colors duration-300`}
        style={{
          backgroundSize: "24px 24px",
          filter: isDarkMode ? "none" : "url(#soft-shadow-light)",
        }}
        animate={
          !prefersReducedMotion
            ? {
                backgroundPosition: ["0px 0px", "24px 24px"],
              }
            : {}
        }
        transition={{
          duration: 20,
          ease: "linear",
          repeat: Infinity,
        }}
      />

      {/* Floating particles in background - improved for light theme */}
      {!prefersReducedMotion && containerVisible && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {Array.from({ length: 20 }).map((_, i) => {
            // Using a deterministic approach instead of Math.random()
            const seed = i * 12345;
            const pseudoRandom1 = ((seed * 9301 + 49297) % 233280) / 233280;
            const pseudoRandom2 = (((seed + 1) * 9301 + 49297) % 233280) / 233280;
            const pseudoRandom3 = (((seed + 2) * 9301 + 49297) % 233280) / 233280;
            const pseudoRandom4 = (((seed + 3) * 9301 + 49297) % 233280) / 233280;

            const width = pseudoRandom1 * 6 + 2;
            const height = pseudoRandom2 * 6 + 2;
            const left = pseudoRandom3 * 100;
            const top = pseudoRandom4 * 100;
            const opacity = (pseudoRandom1 * 0.3) + (isDarkMode ? 0.2 : 0.1);

            return (
              <motion.div
                key={i}
                className={`absolute rounded-full bg-gradient-to-br transition-colors duration-300 ${
                  i % 6 === 0
                    ? `${
                        isDarkMode
                          ? "from-blue-400/15 to-blue-500/5"
                          : "from-blue-300/20 to-blue-400/10"
                      }`
                    : i % 6 === 1
                    ? `${
                        isDarkMode
                          ? "from-emerald-400/15 to-emerald-500/5"
                          : "from-emerald-300/20 to-emerald-400/10"
                      }`
                    : i % 6 === 2
                    ? `${
                        isDarkMode
                          ? "from-amber-400/15 to-amber-500/5"
                          : "from-amber-300/20 to-amber-400/10"
                      }`
                    : i % 6 === 3
                    ? `${
                        isDarkMode
                          ? "from-rose-400/15 to-rose-500/5"
                          : "from-rose-300/20 to-rose-400/10"
                      }`
                    : i % 6 === 4
                    ? `${
                        isDarkMode
                          ? "from-purple-400/15 to-purple-500/5"
                          : "from-purple-300/20 to-purple-400/10"
                      }`
                    : `${
                        isDarkMode
                          ? "from-cyan-400/15 to-cyan-500/5"
                          : "from-cyan-300/20 to-cyan-400/10"
                      }`
                }`}
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  opacity: opacity,
                  filter: isDarkMode ? "none" : "blur(0.5px)",
                }}
                animate={{
                  y: -30,
                  x: pseudoRandom1 * 20 - 10,
                  opacity: isDarkMode ? 0.5 : 0.3,
                }}
                transition={{
                  duration: pseudoRandom2 * 10 + 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: pseudoRandom3 * 5,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Header section */}
        <motion.div
          className="text-center relative z-10 mb-8 md:mb-12 w-full flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >


          {/* Subtitle */}
          <div className="mb-3">
            <SectionLabel
              text="Connecting the Innovation Ecosystem"
              size="medium"
              alignment="center"
              variant="connector"
            />
          </div>

          {/* Main title */}
          <div className="mb-5">
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${
              isDarkMode ? "text-gray-50" : "text-gray-800"
            } tracking-tight transition-colors duration-300`}>
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${
                isDarkMode
                  ? "from-violet-400 via-purple-400 to-violet-400"
                  : "from-violet-600 via-purple-600 to-violet-600"
              } transition-colors duration-300`}>
                Product Bazar
              </span>

              {" "}
              <span className={`${
                isDarkMode ? "text-gray-200" : "text-gray-800"
              } transition-colors duration-300`}>
                Ecosystem
              </span>
            </h2>
          </div>

          {/* Description */}
          <div className="relative">
            <p className={`${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            } text-sm md:text-base max-w-lg mx-auto leading-relaxed transition-colors duration-300`}>
              Connect with every part of our vibrant ecosystem to grow your
              product, find opportunities, and reach new heights in the tech
              innovation landscape
            </p>
          </div>
        </motion.div>

        {/* Main ecosystem diagram */}
        <div className="relative w-full max-w-[500px] mx-auto flex items-center justify-center">
          <div
            className="grid grid-cols-3 grid-rows-3 w-full aspect-square place-items-center gap-4 sm:gap-6 md:gap-8"
            role="group"
            aria-label="Ecosystem members connected to Product Bazar"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Top row */}
            <div className="col-start-1 col-span-1 row-start-1 flex items-center justify-center">
              <Circle
                ref={refs.startups}
                tooltipText={ecosystemMembers[0].tooltip}
                icon={ecosystemMembers[0].icon}
                iconColor={ecosystemMembers[0].iconColor}
                label={ecosystemMembers[0].name}
                accentColor={ecosystemMembers[0].accentColor}
                index={0}
              />
            </div>

            <div className="col-start-3 col-span-1 row-start-1 flex items-center justify-center">
              <Circle
                ref={refs.innovators}
                tooltipText={ecosystemMembers[4].tooltip}
                icon={ecosystemMembers[4].icon}
                iconColor={ecosystemMembers[4].iconColor}
                label={ecosystemMembers[4].name}
                accentColor={ecosystemMembers[4].accentColor}
                index={4}
              />
            </div>

            {/* Middle row */}
            <div className="col-start-1 col-span-1 row-start-2 flex items-center justify-center">
              <Circle
                ref={refs.investors}
                tooltipText={ecosystemMembers[1].tooltip}
                icon={ecosystemMembers[1].icon}
                iconColor={ecosystemMembers[1].iconColor}
                label={ecosystemMembers[1].name}
                accentColor={ecosystemMembers[1].accentColor}
                index={1}
              />
            </div>

            {/* Modernized center logo with automatic ripple effect but no rotating line */}
            <div className="col-start-2 col-span-1 row-start-2 flex items-center justify-center">
              <div
                ref={centerRef}
                className={`z-10 flex items-center justify-center rounded-full ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } relative size-20 md:size-24 lg:size-28 shadow-lg transition-colors duration-300`}
                tabIndex={0}
                role="button"
                aria-label="Product Bazar - Central Hub"
              >
                {/* Gradient border */}
                <div className="absolute inset-0 rounded-full p-[2px] overflow-hidden">
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${
                    isDarkMode
                      ? "from-violet-400 to-purple-600"
                      : "from-violet-500 to-purple-700"
                  } transition-colors duration-300`}>
                    <div className={`absolute inset-[2px] rounded-full ${
                      isDarkMode ? "bg-gray-800" : "bg-white"
                    } transition-colors duration-300`} />
                  </div>
                </div>

                {/* Central content */}
                <div className="flex flex-col items-center justify-center z-10">
                  <div className={`text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
                    isDarkMode
                      ? "from-violet-400 to-purple-400"
                      : "from-violet-600 to-purple-600"
                  } transition-colors duration-300`}>
                    PB
                  </div>
                  <div className={`text-xs md:text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  } font-medium mt-0.5 transition-colors duration-300`}>
                    connect
                  </div>
                </div>

                <motion.span
                  className={`text-xs md:text-sm font-medium absolute w-full text-center -bottom-8 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  } transition-colors duration-300`}
                  animate={
                    !prefersReducedMotion
                      ? {
                          y: isHovering ? -2 : 0,
                          scale: isHovering ? 1.05 : 1,
                          fontWeight: isHovering ? "600" : "500",
                        }
                      : {}
                  }
                  transition={{ duration: 0.2 }}
                >
                  Product Bazar
                </motion.span>

                {/* Continuous ripple effect that animates automatically - WITHOUT rotating line effect */}
                {!prefersReducedMotion && (
                  <motion.div
                    className="absolute -inset-6 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: containerVisible ? 1 : 0 }}
                  >
                    {/* Multiple ripples with staggered timing and natural physics */}
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`absolute inset-0 rounded-full border ${
                          isDarkMode
                            ? "border-purple-400/30"
                            : "border-purple-500/20"
                        } opacity-0`}
                        initial={{
                          scale: 1,
                          opacity: 0.6,
                        }}
                        animate={{
                          scale: 1.8 + i * 0.1,
                          opacity: 0,
                        }}
                        transition={{
                          duration: 2 + i * 0.3,
                          ease: "easeOut",
                          delay: i * 0.5,
                          repeat: Infinity,
                          repeatDelay: 0.1,
                        }}
                        style={{ filter: "url(#water-ripple)" }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="col-start-3 col-span-1 row-start-2">
              <Circle
                ref={refs.agencies}
                tooltipText={ecosystemMembers[2].tooltip}
                icon={ecosystemMembers[2].icon}
                iconColor={ecosystemMembers[2].iconColor}
                label={ecosystemMembers[2].name}
                accentColor={ecosystemMembers[2].accentColor}
                index={2}
              />
            </div>

            {/* Bottom row */}
            <div className="col-start-1 col-span-1 row-start-3">
              <Circle
                ref={refs.jobSeekers}
                tooltipText={ecosystemMembers[3].tooltip}
                icon={ecosystemMembers[3].icon}
                iconColor={ecosystemMembers[3].iconColor}
                label={ecosystemMembers[3].name}
                accentColor={ecosystemMembers[3].accentColor}
                index={3}
              />
            </div>

            <div className="col-start-3 col-span-1 row-start-3">
              <Circle
                ref={refs.users}
                tooltipText={ecosystemMembers[5].tooltip}
                icon={ecosystemMembers[5].icon}
                iconColor={ecosystemMembers[5].iconColor}
                label={ecosystemMembers[5].name}
                accentColor={ecosystemMembers[5].accentColor}
                index={5}
              />
            </div>
          </div>
        </div>

        {/* Enhanced animated beams with optimized effects and particle animation */}
        {containerVisible &&
          !prefersReducedMotion &&
          beamConfigs.map((config) => {
            const member = ecosystemMembers.find((m) => m.id === config.from);
            if (!member) return null;

            return (
              <AnimatedBeam
                key={config.from}
                containerRef={containerRef}
                fromRef={refs[config.from]}
                toRef={centerRef}
                curvature={config.curvature}
                endYOffset={config.endYOffset}
                reverse={config.reverse}
                className={`text-${member.accentColor}-${
                  isDarkMode ? "400" : "500"
                }`}
                duration={config.duration}
                delay={config.delay}
                pathWidth={0.7 * (config.intensity || 1)}
                pathOpacity={isDarkMode ? 0.15 : 0.1 * (config.intensity || 1)}
                gradientStartColor={member.gradientFrom}
                gradientStopColor={member.gradientTo}
                pulseEffect={true}
                pulseSpeed={config.pulseSpeed || 5}
                glowEffect={true}
                extendPath={config.extendPath || 1}
                particleEffect={config.particleEffect || false}
                particleCount={6}
                particleSpeed={config.duration * 0.8}
                particleSize={3}
                particleOpacity={
                  config.particleOpacity || (isDarkMode ? 0.6 : 0.3)
                }
              />
            );
          })}

        {/* Enhanced accessibility features */}
        <div className="sr-only" aria-live="polite">
          <h2>Product Bazar Ecosystem Visualization</h2>
          <p>
            An interactive diagram showing how Product Bazar connects startups,
            investors, agencies, job seekers, innovators, and users in a
            collaborative ecosystem centered around product innovation.
          </p>
          <ul>
            {ecosystemMembers.map((member) => (
              <li key={member.id}>
                {member.name}: {member.tooltip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default ProductBazarEcosystemConnector;
