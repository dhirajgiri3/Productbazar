"use client";

import { useState, useEffect } from 'react';
import { Folder } from 'lucide-react';
import IconifyIcon from './IconifyIcon';

/**
 * A component to render category icons with consistent styling
 * Handles different icon formats (Iconify URLs, emoji, etc.)
 * 
 * @param {Object} props
 * @param {string} props.icon - The icon URL or emoji
 * @param {string} props.name - Category name (for alt text)
 * @param {number} props.size - Size of the icon
 * @param {string} props.className - Additional CSS classes
 */
const CategoryIcon = ({ 
  icon, 
  name = "Category", 
  size = 20,
  className = "" 
}) => {
  const [iconType, setIconType] = useState('unknown');
  
  useEffect(() => {
    if (!icon) {
      setIconType('none');
      return;
    }
    
    // Check if it's an emoji (simple check)
    if (icon.length <= 4) {
      setIconType('emoji');
      return;
    }
    
    // Check if it's an Iconify URL
    if (icon.includes('api.iconify.design') || 
        icon.includes('icon?') || 
        icon.endsWith('.svg')) {
      setIconType('iconify');
      return;
    }
    
    // Check if it's a regular image URL
    if (icon.startsWith('http') || 
        icon.startsWith('/') || 
        icon.includes('.png') || 
        icon.includes('.jpg') || 
        icon.includes('.jpeg') || 
        icon.includes('.webp')) {
      setIconType('image');
      return;
    }
    
    setIconType('unknown');
  }, [icon]);

  // Render based on icon type
  switch (iconType) {
    case 'iconify':
      return (
        <IconifyIcon 
          iconUrl={icon} 
          alt={name} 
          size={size} 
          className={`text-violet-500 ${className}`}
        />
      );
      
    case 'emoji':
      return (
        <div 
          className={`flex items-center justify-center ${className}`}
          style={{ fontSize: size * 0.9 }}
          title={name}
        >
          {icon}
        </div>
      );
      
    case 'image':
      return (
        <div 
          className={`w-${size/4} h-${size/4} rounded-md overflow-hidden ${className}`}
          style={{ width: size, height: size }}
        >
          <img 
            src={icon} 
            alt={name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
            }}
          />
        </div>
      );
      
    case 'none':
    case 'unknown':
    default:
      return (
        <div className={`w-${size/4} h-${size/4} bg-violet-100 rounded-md flex items-center justify-center text-violet-500 ${className}`}
             style={{ width: size, height: size }}>
          <Folder size={size * 0.7} />
        </div>
      );
  }
};

export default CategoryIcon;
