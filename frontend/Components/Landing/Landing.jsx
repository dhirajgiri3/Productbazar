"use client";

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
