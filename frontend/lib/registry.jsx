"use client"

import React, { useState, useEffect } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

export default function StyledComponentsRegistry({ children }) {
  // Create stylesheet instance
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      try {
        styledComponentsStyleSheet.seal()
      } catch (err) {
        console.warn('Failed to seal styled-components sheet:', err)
      }
    }
  }, [styledComponentsStyleSheet])

  // Insert styles into HTML on server
  useServerInsertedHTML(() => {
    try {
      const styles = styledComponentsStyleSheet.getStyleElement()
      styledComponentsStyleSheet.instance.clearTag()
      return <>{styles}</>
    } catch (err) {
      console.error('Failed to get style element:', err)
      return null
    }
  })

  // Return early for client-side rendering
  if (typeof window !== 'undefined') {
    return <>{children}</>
  }

  // Server-side rendering with error boundary
  try {
    return (
      <StyleSheetManager sheet={styledComponentsStyleSheet.instance} enableVendorPrefixes>
        {children}
      </StyleSheetManager>
    )
  } catch (err) {
    console.error('Failed to render styled components:', err)
    return <>{children}</>
  }
}