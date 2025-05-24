'use client';

import { Suspense } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

// Registry and Styles
import StyledComponentsRegistry from '../lib/registry';
import GlobalStyle from '../styles/global';

// Context Providers
import { AuthProvider } from '../lib/contexts/auth-context';
import { ToastProvider } from '../lib/contexts/toast-context';
import { CategoryProvider } from '../lib/contexts/category-context';
import { ProductProvider } from '../lib/contexts/product-context';
import { ProjectProvider } from '../lib/contexts/project-context';
import { RecommendationProvider } from '../lib/contexts/recommendation-context';
import { SocketProvider } from '../lib/contexts/socket-context';
import { ViewProvider } from '../lib/contexts/view-context';
import { ThemeProvider } from '../lib/contexts/theme-context';

// Layout Components
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import ErrorBoundary from '../Components/ErrorBoundary';
import ClientOnly from '../Components/ClientOnly';
import ClientCleanup from '../Components/Utility/ClientCleanup';

// Simple loading spinner
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

// Minimal header skeleton
const HeaderSkeleton = () => (
  <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
      <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="flex items-center space-x-4">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

export function Providers({ children }) {
  return (
    <ErrorBoundary>
      <StyledComponentsRegistry>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="pb-theme"
          forcedTheme={undefined}
        >
          <ThemeProvider>
            <GlobalStyle />

            <ToastProvider>
              <AuthProvider>
                <CategoryProvider>
                  <ProjectProvider>
                    <ProductProvider>
                      <RecommendationProvider>
                        <SocketProvider>
                          <ViewProvider>
                            {/* Header */}
                            <ClientOnly fallback={<HeaderSkeleton />}>
                              <Header />
                            </ClientOnly>

                            {/* Main content */}
                            <main className="min-h-screen">
                              <ErrorBoundary>
                                <Suspense fallback={<LoadingSpinner />}>
                                  {children}
                                </Suspense>
                              </ErrorBoundary>
                            </main>

                            {/* Footer */}
                            <ClientOnly fallback={null}>
                              <Footer />
                            </ClientOnly>

                            {/* Toast notifications */}
                            <ClientOnly fallback={null}>
                              <Toaster
                                position="bottom-right"
                                toastOptions={{
                                  duration: 3000,
                                  style: {
                                    background: 'var(--background, #fff)',
                                    color: 'var(--foreground, #363636)',
                                    border: '1px solid var(--border, #e5e7eb)',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                  },
                                  success: {
                                    iconTheme: { primary: '#22c55e', secondary: '#ffffff' },
                                  },
                                  error: {
                                    iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
                                  },
                                }}
                              />
                            </ClientOnly>

                            {/* Client-side cleanup for browser extensions */}
                            <ClientCleanup />
                          </ViewProvider>
                        </SocketProvider>
                      </RecommendationProvider>
                    </ProductProvider>
                  </ProjectProvider>
                </CategoryProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </NextThemesProvider>
      </StyledComponentsRegistry>
    </ErrorBoundary>
  );
}
