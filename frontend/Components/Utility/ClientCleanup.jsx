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
    // Run cleanup on application startup - moved to useEffect to prevent hydration mismatch
    runAllCleanup();
  }, []);

  // This component doesn't render anything
  return null;
}
