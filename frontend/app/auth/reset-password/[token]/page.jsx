'use client';

import React from 'react';
import ResetPasswordForm from './components/ResetPasswordForm';

function ResetPasswordPage({ params }) {
  const { token } = params;
  
  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-8 w-full bg-bg">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}

export default ResetPasswordPage;
