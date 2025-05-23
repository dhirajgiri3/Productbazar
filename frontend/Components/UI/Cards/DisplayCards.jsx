"use client";

import React from "react";
import { cn } from "../../../lib/utils";
import { Sparkles } from "lucide-react";

function DisplayCard({
  className,
  icon = <Sparkles className="size-5 text-violet-50" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-violet-500",
  titleClassName = "text-violet-600",
}) {
  return (
    <div
      className={cn(
        "relative flex h-40 w-[24rem] -skew-y-[5deg] select-none flex-col justify-between rounded-2xl border border-violet-300/30 bg-white/50 backdrop-blur-xl px-6 py-5 transition-all duration-700 hover:border-violet-200/60 hover:bg-white/70 group",
        className
      )}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-700 rounded-2xl"></div>

      {/* Content header */}
      <div className="flex items-center gap-3 z-10">
        <span className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 p-2 shadow-md shadow-violet-300/30 group-hover:shadow-violet-300/50 transition-all duration-500 group-hover:scale-110">
          {icon}
        </span>
        <p
          className={cn(
            "text-base font-semibold tracking-wide text-violet-700 group-hover:text-violet-800 transition-colors duration-500",
            titleClassName
          )}
        >
          {title}
        </p>
      </div>

      {/* Main stat */}
      <p className="whitespace-nowrap text-3xl font-bold tracking-tight text-gray-800 group-hover:text-gray-900 transition-colors duration-500 pl-2">
        {description}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center z-10">
        <p className="text-violet-500 text-xs font-medium pl-2">{date}</p>

        {/* Animated indicator dots */}
        <div className="flex gap-1 mr-2">
          <span className="size-1.5 rounded-full bg-violet-300 animate-pulse"></span>
          <span className="size-1.5 rounded-full bg-violet-400 animate-pulse delay-75"></span>
          <span className="size-1.5 rounded-full bg-violet-500 animate-pulse delay-150"></span>
        </div>
      </div>

      {/* Animated border glow on hover */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-violet-300/0 via-violet-300/30 to-violet-300/0 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-700"></div>
    </div>
  );
}

function DisplayCards({ cards }) {
  const defaultCards = [
    {
      className:
        "[grid-area:stack] hover:-translate-y-4 transition-all duration-700 ease-out",
    },
    {
      className:
        "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-4 transition-all duration-700 ease-out",
    },
    {
      className:
        "[grid-area:stack] translate-x-24 translate-y-20 hover:-translate-y-4 transition-all duration-700 ease-out",
    },
    {
      className:
        "[grid-area:stack] translate-x-36 translate-y-28 hover:-translate-y-4 transition-all duration-700 ease-out",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 perspective-[2000px] h-[420px] transform-gpu rotate-y-[-10deg] hover:rotate-y-0 transition-all duration-1000">
      {/* Enhanced background effects */}
      <div className="absolute w-[90%] h-[90%] rounded-full bg-violet-300/10 blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute w-[40%] h-[40%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/10 blur-2xl -z-10 animate-ping-slow"></div>

      {/* Cards with staggered reveal animations */}
      {displayCards.map((cardProps, index) => (
        <DisplayCard
          key={index}
          {...cardProps}
          style={{
            // Add subtle 3D rotations
            transform: `${
              cardProps.className.includes("translate") ? "" : ""
            } rotateX(${index * 2}deg) rotateZ(${index * -1}deg)`,
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// Add a subtle pulse animation for background elements
const pulseKeyframes = `
@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

@keyframes ping-slow {
  0% {
    transform: scale(0.9);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.4;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.6;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 6s infinite;
}

.animate-ping-slow {
  animation: ping-slow 8s infinite;
}
`;

// Inject the custom animation keyframes
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = pulseKeyframes;
  document.head.appendChild(style);
}

export { DisplayCard, DisplayCards };
export default DisplayCards;
