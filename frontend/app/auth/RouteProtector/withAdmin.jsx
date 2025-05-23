"use client";

import React, { useEffect, memo } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter } from "next/navigation";

const withAdmin = (Component) => {
  const AdminProtectedComponent = memo((props) => {
    const { user, authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (authLoading) return;

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Check if user has admin role either as primary or secondary role
      const isPrimaryAdmin = user.role === "admin";
      const isSecondaryAdmin = user.secondaryRoles && user.secondaryRoles.includes("admin");

      if (!isPrimaryAdmin && !isSecondaryAdmin) {
        router.push("/unauthorized");
      }
    }, [authLoading, user, router]);

    // Only render when we're sure it's an admin (primary or secondary role)
    if (authLoading || !user) return null;

    // Check admin status
    const isPrimaryAdmin = user.role === "admin";
    const isSecondaryAdmin = user.secondaryRoles && user.secondaryRoles.includes("admin");

    // Don't render if not an admin
    if (!isPrimaryAdmin && !isSecondaryAdmin) return null;

    return <Component {...props} />;
  });

  // Preserve the original component's display name for debugging
  const componentName = Component.displayName || Component.name || "Component";
  AdminProtectedComponent.displayName = `withAdmin(${componentName})`;

  return AdminProtectedComponent;
};

export default withAdmin;
