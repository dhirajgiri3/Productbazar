"use client";

import React, { useEffect, memo } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter } from "next/navigation";
import LoaderComponent from "../../../Components/UI/LoaderComponent";

const withAuth = (Component, { requireLoader = true } = {}) => {
  const AuthProtectedComponent = memo((props) => {
    const { user, authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (authLoading) return;

      if (!user) {
        router.push("/auth/login");
      }
    }, [authLoading, user, router]);

    // Don't render anything during loading if loader is required
    if (authLoading && requireLoader) {
      return <div className="flex justify-center items-center min-h-screen">
        <LoaderComponent text="Loading" size="small" />
      </div>;
    }

    // Don't render the component if not authenticated
    if (!authLoading && !user) return null;

    // Only render component when authenticated
    return <Component {...props} />;
  });

  // Preserve the original component's display name for debugging
  const componentName = Component.displayName || Component.name || "Component";
  AuthProtectedComponent.displayName = `withAuth(${componentName})`;

  return AuthProtectedComponent;
};

export default withAuth;
