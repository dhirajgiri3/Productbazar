'use client'

import React from 'react'

/**
 * Card Component
 * A versatile card component with customizable styling
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Optional CSS class names
 * @returns {JSX.Element} - Rendered component
 */
export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-neutral-200 bg-black shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export default Card
