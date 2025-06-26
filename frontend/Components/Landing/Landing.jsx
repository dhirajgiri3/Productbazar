"use client";

import { useEffect } from 'react';
import toast from 'react-hot-toast';
// React is automatically imported in Next.js
import HeroSection from "./Components/HeroSection";
import DashboardPreview from "./Components/DashboardPreview";
import Why from "./Components/Why";
import Impact from "./Components/Impact";
import Spotlight from "./Components/Spotlight";
import EcosystemStats from "./Components/EcosystemStats";
import { ProductBazarEcosystemConnector } from "./Components/ProductBazarEcosystemConnector";
import FeaturesSection from "./Components/FeaturesSection";
import TestimonialsSection from "./Components/TestimonialsSection";
import FaqSection from "./Components/FaqSection";

// Section spacing component for consistent vertical rhythm and centering
const SectionSpacing = ({ children, className = "" }) => (
  <div className={`w-full flex flex-col items-center justify-center ${className}`}>
    <div className="mx-auto w-full">
      {children}
    </div>
  </div>
);

function Landing() {
  // Handle Google OAuth success notification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const authSuccess = params.get('auth');
      
      if (authSuccess === 'success') {
        toast.success('Successfully signed in with Google!', {
          duration: 4000,
          position: 'top-center',
        });
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-white min-h-screen w-full">
      <SectionSpacing>
        <HeroSection />
      </SectionSpacing>

      <SectionSpacing>
        <DashboardPreview />
      </SectionSpacing>

      <SectionSpacing>
        <FeaturesSection />
      </SectionSpacing>

      <SectionSpacing>
        <Why />
      </SectionSpacing>

      <SectionSpacing>
        <Impact />
      </SectionSpacing>

      <SectionSpacing>
        <Spotlight />
      </SectionSpacing>

      <SectionSpacing>
        <TestimonialsSection />
      </SectionSpacing>

      <SectionSpacing>
        <EcosystemStats />
      </SectionSpacing>

      <SectionSpacing>
        <ProductBazarEcosystemConnector />
      </SectionSpacing>

      <SectionSpacing>
        <FaqSection />
      </SectionSpacing>
    </div>
  );
}

export default Landing;
