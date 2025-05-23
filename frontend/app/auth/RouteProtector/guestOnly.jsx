"use client";

import React, { useEffect, memo } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter } from "next/navigation";

const guestOnly = (Component) => {
  const GuestOnlyComponent = memo((props) => {
    const { user, authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (authLoading) return;
      
      if (user) {
        // Determine redirect path based on user state and redirect immediately
        const redirectPath = !user.isProfileCompleted 
          ? "/complete-profile" 
          : !user.isPhoneVerified 
            ? "/auth/verify-phone" 
            : user.username 
              ? `/user/${user.username}` 
              : "/products";
            
        router.push(redirectPath);
      }
    }, [authLoading, user, router]);

    // If user exists and we're not loading, don't render component during redirect
    if (user && !authLoading) return null;

    // Only render when we're sure it's a guest
    return <Component {...props} />;
  });

  // Preserve the original component's display name for debugging
  const componentName = Component.displayName || Component.name || "Component";
  GuestOnlyComponent.displayName = `guestOnly(${componentName})`;

  return GuestOnlyComponent;
};

export default guestOnly;
