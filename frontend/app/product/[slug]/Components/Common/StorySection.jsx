import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

// Section Component - Enhanced for Narrative Flow with Consistent Theme
const StorySection = ({
  title,
  icon: Icon,
  children,
  className = "",
  delay = 0,
  id = "",
  chapterNumber,
}) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <motion.section
      id={id}
      ref={sectionRef}
      className={`mb-24 md:mb-32 relative ${className}`}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.8,
        delay: isInView ? delay : 0,
        ease: "easeOut",
      }}
    >
      {/* Chapter Indicator */}
      {chapterNumber && (
        <motion.div
          className="mb-6 flex items-center gap-3 opacity-90"
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: isInView ? delay + 0.1 : 0, duration: 0.6 }}
        >
          <span className="text-xs font-semibold text-violet-700 bg-violet-100 px-3 py-1 rounded-full border border-violet-200/70">
            CHAPTER {chapterNumber}
          </span>
          <div className="h-px w-12 bg-violet-300 rounded-full"></div>
        </motion.div>
      )}

      {/* Icon and Title Block */}
      <div className="flex items-center gap-4 mb-8">
        <motion.div
          className="p-3 bg-violet-100 rounded-lg text-violet-600 flex-shrink-0"
          whileHover={{
            scale: 1.08,
            boxShadow: "0 6px 15px -3px rgba(124, 58, 237, 0.15)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <Icon size={24} />
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
          {title}
        </h2>
      </div>

      {/* Content Area */}
      <div className="prose prose-lg lg:prose-xl prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-gray-800 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-violet-700 prose-a:font-medium hover:prose-a:text-violet-800 prose-a:transition-colors prose-strong:text-gray-800 prose-strong:font-semibold max-w-none">
        {children}
      </div>
    </motion.section>
  );
};

export default StorySection;