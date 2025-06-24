'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import { useAuth } from '@/lib/contexts/auth-context';

function ForgotPasswordPage() {
  const { user, isInitialized } = useAuth();
  const router = useRouter();

  // Redirect authenticated users away from forgot password page
  useEffect(() => {
    if (isInitialized && user) {
      router.push(`/user/${user.username}`);
    }
  }, [user, isInitialized, router]);

  // Show loading or the form
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 to-purple-50">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/10 to-purple-300/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative text-center">
          <div className="bg-white/80 backdrop-blur-sm border border-violet-100 rounded-3xl p-8 shadow-2xl shadow-primary/10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-50 to-purple-50">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-8 w-full">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
