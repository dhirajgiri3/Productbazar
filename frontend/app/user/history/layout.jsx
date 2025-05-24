"use client";

// app/user/history/layout.jsx
import { useEffect } from 'react';

// Add a client-side script to help with caching and preventing duplicate requests
export default function HistoryLayout({ children }) {
  useEffect(() => {
    // Clear stale history cache on page load
    try {
      const lastVisit = sessionStorage.getItem('historyPageLastVisit');
      const now = Date.now();
      // If last visit was more than 5 minutes ago, clear cache
      if (!lastVisit || (now - parseInt(lastVisit)) > 300000) {
        // Find and clear all history-related cache items
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('viewHistory') || key.includes('history')) {
            sessionStorage.removeItem(key);
          }
        });
      }
      // Update last visit timestamp
      sessionStorage.setItem('historyPageLastVisit', now.toString());
    } catch (e) {
      console.warn('Error managing history cache:', e);
    }
  }, []);

  return (
    <div className="bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}