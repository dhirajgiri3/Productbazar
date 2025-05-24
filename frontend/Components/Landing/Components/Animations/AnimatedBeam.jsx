"use client";

import React from "react";
import { motion } from "framer-motion";
import { useEffect, useId, useState } from "react";
import { cn } from "../../../../lib/utils";

export const AnimatedBeam = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration: durationProp,
  delay = 0,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#ffaa40",
  gradientStopColor = "#9c40ff",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
  pulseEffect = true,
  pulseSpeed = 5, // New parameter for controlling pulse animation speed
  glowEffect = false,
  extendPath = 1,
}) => {
  const id = useId();
  const [pathD, setPathD] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  // SSR-safe: use a fixed duration for SSR, randomize on client
  const [duration, setDuration] = useState(durationProp ?? 5);
  useEffect(() => {
    if (typeof window !== 'undefined' && durationProp === undefined) {
      setDuration(Math.random() * 3 + 4);
    }
  }, [durationProp]);

  // Enhanced gradient coordinates for smoother animation
  const gradientCoordinates = reverse
    ? {
        x1: ["85%", "0%"],
        x2: ["100%", "15%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }
    : {
        x1: ["15%", "100%"],
        x2: ["0%", "85%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      };

  // Improved pulse animation for path width with smoother transitions
  const pulseWidth = pulseEffect
    ? [pathWidth, pathWidth * 1.3, pathWidth]
    : pathWidth;

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const rectA = fromRef.current.getBoundingClientRect();
        const rectB = toRef.current.getBoundingClientRect();

        const svgWidth = containerRect.width;
        const svgHeight = containerRect.height;
        setSvgDimensions({ width: svgWidth, height: svgHeight });

        // Calculate base points
        const startX =
          rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
        const startY =
          rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
        const endX =
          rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
        const endY =
          rectB.top - containerRect.top + rectB.height / 2 + endYOffset;

        // Calculate control point with curvature
        const controlY = startY - curvature;

        // Apply path extension if needed
        let adjustedStartX = startX;
        let adjustedStartY = startY;
        let adjustedEndX = endX;
        let adjustedEndY = endY;

        if (extendPath !== 1) {
          // Extend the path by scaling from the midpoint
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          // Scale start and end points from the midpoint
          adjustedStartX = midX - (midX - startX) * extendPath;
          adjustedStartY = midY - (midY - startY) * extendPath;
          adjustedEndX = midX + (endX - midX) * extendPath;
          adjustedEndY = midY + (endY - midY) * extendPath;
        }

        // Create the path with adjusted points
        const d = `M ${adjustedStartX},${adjustedStartY} Q ${
          (adjustedStartX + adjustedEndX) / 2
        },${controlY} ${adjustedEndX},${adjustedEndY}`;

        setPathD(d);
      }
    };

    // Initialize ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      // When resize is detected, recalculate the path
      updatePath();
    });

    // Observe the container element
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Call the updatePath initially to set the initial path
    updatePath();

    // Clean up the observer on component unmount
    return () => {
      resizeObserver.disconnect();
    };
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
    extendPath, // Include extendPath in dependencies
  ]);

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute left-0 top-0 transform-gpu stroke-2",
        className
      )}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      {/* Base path with subtle opacity */}
      <motion.path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />

      {/* Enhanced glow effect with improved visuals */}
      {glowEffect && (
        <>
          {/* Outer glow */}
          <motion.path
            d={pathD}
            stroke={gradientStartColor}
            strokeWidth={pathWidth * 4}
            strokeOpacity={0.03}
            strokeLinecap="round"
            filter="blur(4px)"
            animate={{
              strokeOpacity: [0.02, 0.05, 0.02],
              strokeWidth: [pathWidth * 3.5, pathWidth * 4.5, pathWidth * 3.5]
            }}
            transition={{
              duration: pulseSpeed * 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              repeatType: "mirror",
              delay: 0.2
            }}
          />

          {/* Inner glow */}
          <motion.path
            d={pathD}
            stroke={gradientStopColor}
            strokeWidth={pathWidth * 2.5}
            strokeOpacity={0.06}
            strokeLinecap="round"
            filter="blur(2px)"
            animate={{
              strokeOpacity: [0.04, 0.09, 0.04],
              strokeWidth: [pathWidth * 2, pathWidth * 3, pathWidth * 2]
            }}
            transition={{
              duration: pulseSpeed * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              repeatType: "mirror"
            }}
          />
        </>
      )}

      {/* Animated gradient path with customizable pulse effect */}
      <motion.path
        d={pathD}
        animate={{ strokeWidth: pulseWidth }}
        transition={{
          duration: pulseSpeed, // Use the custom pulse speed
          repeat: Infinity,
          ease: "easeInOut",
          repeatType: "mirror"
        }}
        stroke={`url(#${id})`}
        strokeOpacity="1"
        strokeLinecap="round"
      />

      <defs>
        {/* Filter for glow effect */}
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Enhanced gradient with better color transitions */}
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits={"userSpaceOnUse"}
          initial={{
            x1: "0%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY
          }}
        >
          <stop
            stopColor={gradientStartColor}
            stopOpacity="0"
          />
          <stop
            offset="15%"
            stopColor={gradientStartColor}
            stopOpacity="0.4"
          />
          <stop
            offset="50%"
            stopColor={gradientStopColor}
            stopOpacity="0.6"
          />
          <stop
            offset="100%"
            stopColor={gradientStopColor}
            stopOpacity="0"
          />
        </motion.linearGradient>
      </defs>
    </svg>
  );
};
