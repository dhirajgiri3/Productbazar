import React, { useState } from 'react';
import { Globe } from 'lucide-react';

const PrimaryButton = ({ 
  children, 
  href, 
  target, 
  rel, 
  className = '', 
  onClick, 
  ariaLabel,
  variant = 'default' // Options: 'default', 'outline', 'ghost'
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  // Split children to separate icons from text content
  const renderChildren = () => {
    return React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return (
          <span className="flex items-center justify-center transition-transform duration-300">
            {child}
          </span>
        );
      }
      return <span className="font-medium">{child}</span>;
    });
  };

  const baseClasses = "relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium transition-all duration-300 outline-none";
  
  const variantClasses = {
    default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    outline: "bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-50",
    ghost: "bg-transparent text-indigo-600 hover:bg-indigo-50"
  };
  
  const pressedClass = isPressed ? "scale-95" : "transform-gpu";
  
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${pressedClass} rounded-lg ${className}`}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => isPressed && setIsPressed(false)}
      onKeyDown={(e) => e.key === 'Enter' && setIsPressed(true)}
      onKeyUp={(e) => e.key === 'Enter' && setIsPressed(false)}
      onBlur={() => isPressed && setIsPressed(false)}
      tabIndex={0}
    >
      {/* Ripple overlay */}
      <span className="absolute inset-0 rounded-lg overflow-hidden">
        <span className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300" />
      </span>
      
      {/* Focus ring */}
      <span className="absolute inset-0 rounded-lg ring-0 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2" />
      
      {/* Content container */}
      <span className="relative flex items-center justify-center gap-2">
        {renderChildren()}
      </span>
    </a>
  );
};

// Demo Component
export default function ButtonDemo() {
  const product = {
    links: {
      website: "https://example.com"
    }
  };
  
  return (
    <div className="flex flex-col gap-8 p-8 bg-gray-50">
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-gray-800">Before: Original Button</h2>
        <div className="flex items-center justify-center h-20 bg-white rounded-lg shadow-sm p-4">
          {/* Original style approximation */}
          <a 
            href={product.links.website}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-purple-600 rounded-full shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <Globe size={18} /> 
            <span>Visit Website Now</span>
          </a>
        </div>
      </div>
    
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-gray-800">After: Enhanced Button Variants</h2>
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
          <PrimaryButton 
            href={product.links.website} 
            target="_blank" 
            rel="noopener noreferrer"
            variant="default"
          >
            <Globe size={18} /> Visit Website Now
          </PrimaryButton>
          
          <PrimaryButton 
            href={product.links.website}
            target="_blank" 
            rel="noopener noreferrer"
            variant="outline"
          >
            <Globe size={18} /> Visit Website Now
          </PrimaryButton>
          
          <PrimaryButton 
            href={product.links.website}
            target="_blank" 
            rel="noopener noreferrer"
            variant="ghost"
          >
            <Globe size={18} /> Visit Website Now
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}