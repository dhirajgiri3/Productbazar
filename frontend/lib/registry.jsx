"use client"

import React, { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

export default function StyledComponentsRegistry({ children }) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  // Server-side rendering
  if (typeof window === 'undefined') {
    const jsx = styledComponentsStyleSheet.collectStyles(children);
    useServerInsertedHTML(() => {
      const styles = styledComponentsStyleSheet.getStyleElement();
      styledComponentsStyleSheet.instance.clearTag();
      return <>{styles}</>;
    });
    return jsx;
  }

  // Client-side rendering
  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}