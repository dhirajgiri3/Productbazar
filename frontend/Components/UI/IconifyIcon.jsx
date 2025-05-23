"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * A component to render Iconify icons from URLs
 * 
 * @param {Object} props
 * @param {string} props.iconUrl - The URL of the Iconify icon
 * @param {string} props.alt - Alt text for the icon
 * @param {number} props.size - Size of the icon (width and height)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.color - Color override for the icon
 */
const IconifyIcon = ({ 
  iconUrl, 
  alt = "Icon", 
  size = 24, 
  className = "", 
  color = null 
}) => {
  const [svgContent, setSvgContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!iconUrl) {
      setError(true);
      setIsLoading(false);
      return;
    }

    // Check if it's an Iconify URL
    const isIconifyUrl = iconUrl.includes('api.iconify.design') || 
                         iconUrl.includes('icon?') || 
                         iconUrl.endsWith('.svg');

    if (!isIconifyUrl) {
      // Not an Iconify URL, don't try to fetch it
      setError(true);
      setIsLoading(false);
      return;
    }

    const fetchIcon = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(iconUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch icon: ${response.status}`);
        }
        
        const svgText = await response.text();
        setSvgContent(svgText);
        setError(false);
      } catch (err) {
        console.error("Error fetching icon:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIcon();
  }, [iconUrl]);

  // If there's an error or we're still loading, show a fallback
  if (error || !iconUrl) {
    return (
      <div 
        className={`inline-flex items-center justify-center bg-gray-100 rounded-md ${className}`}
        style={{ width: size, height: size }}
        title={alt}
      >
        <svg 
          width={size * 0.6} 
          height={size * 0.6} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 4L20 20H4L12 4Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className={`inline-flex items-center justify-center bg-gray-50 rounded-md animate-pulse ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // If we have SVG content, render it directly
  if (svgContent) {
    // Apply color override if provided
    let processedSvg = svgContent;
    if (color) {
      // Simple color replacement for fill and stroke attributes
      processedSvg = processedSvg
        .replace(/fill="[^"]*"/g, `fill="${color}"`)
        .replace(/stroke="[^"]*"/g, `stroke="${color}"`);
    }

    return (
      <div 
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: processedSvg }}
        title={alt}
      />
    );
  }

  // Fallback to Image component if we couldn't process the SVG
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Image
        src={iconUrl}
        alt={alt}
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  );
};

export default IconifyIcon;
