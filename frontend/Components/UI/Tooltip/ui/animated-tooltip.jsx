// components/ui/animated-tooltip.jsx
"use client";

import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";

export const AnimatedTooltip = ({ items }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);

  // Rotate the tooltip
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig
  );

  // Translate the tooltip
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig
  );

  const handleMouseMove = (event) => {
    const halfWidth = event.target.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  return (
    <>
      {items.map((item) => (
        <div
          className="-mr-4 relative group" // Use group-hover for more complex hover effects if needed
          key={item.id} // Using ID for key is more robust
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute -top-16 -left-1/2 translate-x-1/2 flex text-xs flex-col items-center justify-center rounded-md bg-black z-50 shadow-xl px-4 py-2"
              >
                {/* Tooltip content */}
                <div className="font-bold text-white relative z-30 text-base">
                  {item.name}
                </div>
                <div className="text-white text-xs">{item.designation}</div>

                {/* Replicating ::before and ::after with divs for the gradient lines */}
                <div className="absolute -bottom-px left-[40%] w-[20%] h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                <div className="absolute -bottom-px left-[20%] w-[40%] h-px bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

              </motion.div>
            )}
          </AnimatePresence>

          <img
            onMouseMove={handleMouseMove}
            src={item.image}
            alt={item.name}
            className="object-cover h-11 w-11 border-2 border-white rounded-full group-hover:scale-105 group-hover:z-30 transition-transform duration-500"
          />
        </div>
      ))}
    </>
  );
};