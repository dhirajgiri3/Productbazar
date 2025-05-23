"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const ProductImage = ({ src, alt, className, width = 1280, height = 720 }) => {
  const [error, setError] = useState(false);
  const fallbackImage = '/Assets/placeholder-product.jpg'; // Create this placeholder image
  
  // Handle hydration errors from browser extensions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Remove bis_skin_checked attributes from this component
      const cleanup = () => {
        const container = document.querySelector(`.${className}`);
        if (container) {
          if (container.hasAttribute('bis_skin_checked')) {
            container.removeAttribute('bis_skin_checked');
          }
          
          // Also clean child elements
          const children = container.querySelectorAll('[bis_skin_checked]');
          children.forEach(child => {
            child.removeAttribute('bis_skin_checked');
          });
        }
      };
      
      // Run initially and set up an observer
      cleanup();
      
      // Set up observer for future changes
      const observer = new MutationObserver(cleanup);
      observer.observe(document.body, { 
        attributes: true,
        attributeFilter: ['bis_skin_checked'],
        subtree: true
      });
      
      return () => observer.disconnect();
    }
  }, [className]);

  return (
    <div className={`relative ${className}`} suppressHydrationWarning>
      <Image
        src={error ? fallbackImage : src}
        alt={alt}
        width={width}
        height={height}
        className="object-cover w-full h-full"
        onError={() => setError(true)}
        priority={true} // Prioritize loading for above-the-fold images
        quality={75} // Slightly reduce quality for better performance
        loading="eager" // Load immediately
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Image unavailable</p>
        </div>
      )}
    </div>
  );
};

export default ProductImage;
