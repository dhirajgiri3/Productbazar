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
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set theme cookie for server-side rendering
  useEffect(() => {
    if (mounted && resolvedTheme) {
      document.cookie = `theme=${resolvedTheme}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [resolvedTheme, mounted]);

  // Simple theme toggle function
  const toggleTheme = useCallback(() => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);

    // Reset transition state after a short delay
    setTimeout(() => setIsTransitioning(false), 300);
  }, [resolvedTheme, setTheme, isTransitioning]);

  // Get the current theme with hydration safety
  const currentTheme = mounted ? resolvedTheme : undefined;
  const isDarkMode = mounted ? currentTheme === "dark" : false;

  // Value to be provided by the context
  const value = {
    theme: currentTheme,
    isDarkMode,
    toggleTheme,
    isTransitioning,
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
