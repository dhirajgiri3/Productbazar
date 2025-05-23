"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 border-b border-border">
        <div className="container mx-auto">
          <Link href="/">
            <div className="flex items-center">
              <Image
                src="/Assets/Image/logo/pb-logo.png"
                alt="Product Bazar Logo"
                width={50}
                height={50}
                className="object-contain"
                quality={100}
                priority
              />
              <span className="ml-2 text-xl font-bold text-primary">
                Product Bazar
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-border">
        <div className="container mx-auto text-center text-sm text-secondary">
          <p>© {new Date().getFullYear()} Product Bazar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default AuthLayout;