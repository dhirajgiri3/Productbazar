'use client'

import React, { useRef, useEffect } from 'react'

/**
 * Spotlight Component
 * Creates a spotlight effect that follows mouse movement
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Optional CSS class names for positioning
 * @param {string} props.fill - Color of the spotlight (default: 'white')
 * @returns {JSX.Element} - Rendered component
 */
export function Spotlight({ className = "", fill = "white" }) {
  const spotlightRef = useRef(null)
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!spotlightRef.current) return
      
      const spotlightElement = spotlightRef.current
      const rect = spotlightElement.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      // Update the radial gradient position
      spotlightElement.style.background = `radial-gradient(600px circle at ${x}px ${y}px, ${fill}10, transparent 40%)`
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [fill])
  
  return (
    <div 
      ref={spotlightRef}
      className={`pointer-events-none absolute inset-0 z-0 transition duration-300 ${className}`}
    />
  )
}

export default Spotlight
