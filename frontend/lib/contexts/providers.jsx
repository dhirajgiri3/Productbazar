"use client";

import React from "react";
import { AuthProvider } from "../Auth/AuthContext";
import { ToastProvider } from "../Toast/ToastContext";
import { ProductProvider } from "../Product/ProductContext";
import { RecommendationProvider } from "../Recommendation/RecommendationContext";
import { ViewProvider } from "../View/ViewContext";
import { Toaster } from "react-hot-toast";
import StyledComponentsRegistry from "../registry";// Assuming you still need styled-components
import GlobalStyleComponent from "../../public/Assets/Style/GlobalStyle"; // Assuming you still need styled-components

// This component establishes the client boundary and provides context
export default function ClientProviders({ children }) {
  return (
    // Use Fragments to avoid adding extra DOM nodes here
    <>
      {/* If using Styled Components, Registry goes near the top of client boundary */}
      <StyledComponentsRegistry>
        <GlobalStyleComponent />
        <ToastProvider>
          <AuthProvider>
            <ProductProvider>
              <RecommendationProvider>
                <ViewProvider>
                  {children} {/* Render Header, main, Footer passed from layout */}
                  <Toaster /> {/* Toaster needs to be within a client component */}
                </ViewProvider>
              </RecommendationProvider>
            </ProductProvider>
          </AuthProvider>
        </ToastProvider>
      </StyledComponentsRegistry>
    </>
  );
}