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
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-8 w-full bg-bg">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
