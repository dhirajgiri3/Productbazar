"use client";

import React, { useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";

/**
 * HOC to protect routes that require a completed profile with proper verification
 */
const withCompleteProfile = (WrappedComponent) => {
  const WithCompleteProfile = memo((props) => {
    const { user, isInitialized, authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Skip effect if auth is still initializing
      if (!isInitialized || authLoading) return;
      
      // Handle authentication redirects in priority order
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      
      if (!user.isProfileCompleted) {
        router.replace("/complete-profile");
        return;
      }
      
      // Consolidated verification checks
      const needsEmailVerification = user.email && !user.isEmailVerified;
      const needsPhoneVerification = user.phone && !user.isPhoneVerified;
      
      if (needsEmailVerification && needsPhoneVerification) {
        router.replace("/auth/verify-both");
        return;
      }
      
      if (needsEmailVerification) {
        router.replace("/auth/verify-email");
        return;
      }
      
      if (needsPhoneVerification) {
        router.replace("/auth/verify-phone");
        return;
      }
    }, [user, isInitialized, authLoading, router]);

    // Show loading state for any condition that would trigger a redirect
    if (!isInitialized || 
        authLoading || 
        !user || 
        !user.isProfileCompleted || 
        (user.email && !user.isEmailVerified) || 
        (user.phone && !user.isPhoneVerified)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-bg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    // Only render the component when all conditions are met
    return <WrappedComponent {...props} />;
  });

  // Preserve the display name for debugging
  const componentName = WrappedComponent.displayName || WrappedComponent.name || "Component";
  WithCompleteProfile.displayName = `withCompleteProfile(${componentName})`;

  return WithCompleteProfile;
};

export default withCompleteProfile;
