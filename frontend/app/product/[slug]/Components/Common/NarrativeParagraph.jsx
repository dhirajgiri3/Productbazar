import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

// Narrative Text Component - Supports more intents for storytelling variation
const NarrativeParagraph = ({
  children,
  className = "",
  delay = 0,
  intent = "default",
}) => {
  const textRef = useRef(null);
  const isInView = useInView(textRef, { once: true, amount: 0.3 });

  const intentClasses = {
    default: "mb-6 text-gray-700",
    lead: "mb-8 text-md text-gray-700 font-light tracking-wide",
    quote:
      "mb-8 relative pl-6 before:content-['\"\"'] before:absolute before:left-0 before:top-0 before:text-6xl before:text-violet-200 before:font-serif italic text-gray-600",
    highlight:
      "mb-8 p-5 bg-slate-50/80 border-l-4 border-slate-200 rounded-r-lg text-gray-700",
    aside:
      "mb-6 text-sm text-gray-500 italic pl-4 border-l-2 border-violet-300",
  };

  return (
    <motion.p
      ref={textRef}
      className={`${intentClasses[intent]} ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: isInView ? delay : 0,
        duration: 0.9,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.p>
  );
};

export default NarrativeParagraph;