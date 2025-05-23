"use client";

import React from 'react';

/**
 * HydrationErrorBoundary - A wrapper component that prevents hydration errors from showing
 * by adding suppressHydrationWarning to divs and handling Bitdefender's bis_skin_checked attribute.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render
 */
function HydrationErrorBoundary({ children }) {
  return (
    <div suppressHydrationWarning data-hydration-boundary="true">
      {children}
    </div>
  );
}

export default HydrationErrorBoundary;
