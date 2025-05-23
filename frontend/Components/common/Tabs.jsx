// src/components/common/Tabs.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const Tabs = ({ tabs, activeTab, onChange, className = "", size = "md", fullWidth = false, variant = "default" }) => {
  const [hoveredTab, setHoveredTab] = useState(null);

  const sizeClasses = {
    sm: "text-xs py-1.5 px-3",
    md: "text-sm py-2 px-4",
    lg: "text-base py-2.5 px-6",
  };

  const tabClass = sizeClasses[size] || sizeClasses.md;

  // Different tab styles
  const variants = {
    default: {
      container: "bg-gray-100 p-1 rounded-lg",
      tab: (isActive) => `relative rounded-md font-medium transition-all ${isActive ? 'text-gray-800' : 'text-gray-500 hover:text-gray-700'}`,
      indicator: "absolute inset-0 bg-white rounded-md shadow-sm"
    },
    minimal: {
      container: "border-b border-gray-200",
      tab: (isActive) => `relative font-medium transition-all ${isActive ? 'text-violet-600 border-b-2 border-violet-500' : 'text-gray-500 hover:text-violet-500 border-b-2 border-transparent'}`,
      indicator: "absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full"
    },
    pills: {
      container: "flex gap-1",
      tab: (isActive) => `relative rounded-full font-medium transition-all ${isActive ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:bg-gray-100 hover:text-violet-600'}`,
      indicator: "absolute inset-0 bg-violet-100 rounded-full"
    },
    modern: {
      container: "bg-gray-50/80 backdrop-blur-sm p-1 rounded-xl border border-gray-100",
      tab: (isActive) => `relative rounded-lg font-medium transition-all ${isActive ? 'text-violet-700' : 'text-gray-500 hover:text-violet-600'}`,
      indicator: "absolute inset-0 bg-white rounded-lg shadow-sm border border-violet-100/50"
    }
  };

  // Get the correct variant styling
  const variantStyle = variants[variant] || variants.default;

  return (
    <div className={className}>
      <div className={`${variantStyle.container} flex ${fullWidth ? 'w-full' : 'inline-flex'}`}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`${tabClass} ${variantStyle.tab(isActive)} ${fullWidth ? 'flex-1' : ''}`}
              whileHover={{ scale: variant === 'minimal' ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <motion.div
                  layoutId={`tab-indicator-${variant}`}
                  className={variantStyle.indicator}
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Hover effect for non-active tabs */}
              {!isActive && isHovered && variant !== 'minimal' && (
                <motion.div
                  layoutId={`tab-hover-${tab.id}`}
                  className="absolute inset-0 bg-gray-100/80 rounded-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}

              <span className="relative z-10 flex items-center justify-center gap-1.5">
                {tab.icon && <tab.icon className="w-4 h-4" />}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
                    {tab.count}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;