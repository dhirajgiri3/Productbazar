import React from "react";

const SectionWrapper = ({
  children,
  className = "",
  id,
  background = "default",
  fullWidth = false,
  pattern = false
}) => {
  // Enhanced background styles
  const getBgClasses = () => {
    switch (background) {
      case 'gradient':
        return 'bg-gradient-to-b from-violet-100/30 to-fuchsia-100/30 backdrop-blur-[1px]';
      case 'light':
        return 'bg-white/80 backdrop-blur-[1px]';
      case 'dark':
        return 'bg-gray-900/95 text-white backdrop-blur-[1px]';
      case 'transparent':
        return 'bg-transparent';
      default:
        return 'bg-white/80 backdrop-blur-[1px]';
    }
  };

  // Get pattern classes based on theme
  const getPatternClasses = () => {
    if (!pattern) return '';
    return 'bg-grid-violet-100/[0.3] dark:bg-grid-gray-700/[0.15] bg-[size:30px_30px] grid-fade-mask';
  };

  return (
    <section
      id={id}
      className={`relative ${getBgClasses()} ${getPatternClasses()} ${className} transition-colors duration-300 py-16 md:py-24 lg:py-28`}
    >
      {/* Add subtle noise texture for dark mode */}
      {background !== 'transparent' && (
        <div
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"
          style={{ opacity: 0.015 }}
          aria-hidden="true"
        ></div>
      )}

      {/* Content container */}
      <div className={`relative z-10 w-full mx-auto`}>
        {children}
      </div>
    </section>
  );
};

export default SectionWrapper;
