"use client";

import { useEffect } from 'react';
import runAllCleanup from '../../lib/utils/cleanup-utils';

/**
 * ClientCleanup component
 *
 * This component handles client-side cleanup operations that need to run
 * after the component mounts to prevent hydration mismatches.
 *
 * It runs cleanup utilities for stale data and browser extension attributes.
 */
export default function ClientCleanup() {
  useEffect(() => {
    // Run cleanup on application startup
    runAllCleanup();

    // Clean up browser extension attributes that cause hydration issues
    const cleanupExtensionAttributes = () => {
      const elements = document.querySelectorAll('[bis_skin_checked]');
      elements.forEach(el => {
        el.removeAttribute('bis_skin_checked');
      });
    };

    // Clean immediately
    cleanupExtensionAttributes();

    // Set up observer to clean attributes added after initial load
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
          mutation.target.removeAttribute('bis_skin_checked');
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['bis_skin_checked'],
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
