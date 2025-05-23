"use client";

import { useEffect, useLayoutEffect } from 'react';
import { removeExtensionAttributes, setupExtensionAttributeCleaner } from '@/lib/utils/dom-cleaner';

/**
 * HydrationSuppressor component
 * 
 * This component handles hydration issues caused by browser extensions that
 * inject attributes into the DOM, like Bitdefender's bis_skin_checked.
 * 
 * Wrap your main content in this component to automatically handle these issues.
 */
export default function HydrationSuppressor({ children }) {
  // Use the safe version of useLayoutEffect that works in both client and server
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
  
  // Remove extension attributes immediately after mount
  useIsomorphicLayoutEffect(() => {
    removeExtensionAttributes();
  }, []);
  
  // Set up continuous cleaning of attributes
  useEffect(() => {
    const observer = setupExtensionAttributeCleaner();
    
    // Cleanup when component unmounts
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);
  
  return (
    <div suppressHydrationWarning={true}>
      {children}
    </div>
  );
}
