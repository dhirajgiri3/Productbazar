"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useTheme as useNextTheme } from "next-themes";

// Create the theme context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(300); // Reduced from 400ms to 300ms for faster transitions

  // Effect to handle mounting state with performance optimizations
  useEffect(() => {
    // Use requestAnimationFrame for smoother initialization
    requestAnimationFrame(() => {
      setMounted(true);

      // Apply transition class to document root when mounted
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('theme-transition-ready');
        // Set CSS variable for transition duration
        document.documentElement.style.setProperty('--theme-transition-duration', `${transitionDuration}ms`);
      }
    });

    return () => {
      // Clean up transition class when unmounted
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('theme-transition-ready');
      }
    };
  }, []);

  // Update transition duration when it changes
  useEffect(() => {
    if (!mounted) return;

    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-transition-duration', `${transitionDuration}ms`);
    }
  }, [mounted, transitionDuration]);

  // Optimized function to toggle between light and dark themes
  const toggleTheme = useCallback(() => {
    if (isTransitioning) return; // Prevent multiple rapid toggles

    setIsTransitioning(true);

    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      // Add active transition class to enable all transitions
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('theme-transition-active');

        // Apply hardware acceleration hint during transition
        document.documentElement.style.setProperty('will-change', 'color, background-color, border-color, text-decoration-color, fill, stroke');

        // Set the theme immediately - the transition class is already applied
        setTheme(resolvedTheme === "dark" ? "light" : "dark");

        // Use a single timeout with transitionend fallback
        const transitionTimeout = setTimeout(() => {
          cleanupTransition();
        }, transitionDuration + 20); // Smaller buffer

        // Try to listen for the transition end event
        const transitionElement = document.documentElement;
        const handleTransitionEnd = () => {
          clearTimeout(transitionTimeout);
          cleanupTransition();
        };

        transitionElement.addEventListener('transitionend', handleTransitionEnd, { once: true });

        // Cleanup function
        function cleanupTransition() {
          transitionElement.removeEventListener('transitionend', handleTransitionEnd);
          document.documentElement.classList.remove('theme-transition-active');
          document.documentElement.style.removeProperty('will-change');
          setIsTransitioning(false);
        }
      }
    });
  }, [resolvedTheme, setTheme, isTransitioning, transitionDuration]);

  // Get the current theme
  const currentTheme = mounted ? resolvedTheme : "light";
  const isDarkMode = currentTheme === "dark";

  // Value to be provided by the context
  const value = {
    theme: currentTheme,
    isDarkMode,
    toggleTheme,
    isTransitioning,
    transitionDuration,
    setTransitionDuration,
    mounted,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
