"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/lib/contexts/auth-context";
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';

export default function AdminLayout({ children }) {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Check if user has admin role either as primary or secondary role
    const isPrimaryAdmin = user.role === 'admin';
    const isSecondaryAdmin = user.secondaryRoles && user.secondaryRoles.includes('admin');

    if (!isPrimaryAdmin && !isSecondaryAdmin) {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <FiLoader className="animate-spin text-violet-600 w-6 h-6" />
          <span className="text-gray-700">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-amber-50 text-amber-800 p-4 rounded-lg">
          <div className="flex items-center">
            <FiAlertTriangle className="mr-2" />
            <span>Authentication required to access this page.</span>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has admin role either as primary or secondary role
  const isPrimaryAdmin = user.role === 'admin';
  const isSecondaryAdmin = user.secondaryRoles && user.secondaryRoles.includes('admin');

  if (!isPrimaryAdmin && !isSecondaryAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-amber-50 text-amber-800 p-4 rounded-lg">
          <div className="flex items-center">
            <FiAlertTriangle className="mr-2" />
            <span>Only administrators can access this page.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
