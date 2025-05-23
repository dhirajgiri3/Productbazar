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
import { useTheme } from "@/lib/contexts/theme-context";

// Section spacing component for consistent vertical rhythm
const SectionSpacing = ({ children, className = "", isFirst = false, isLast = false }) => (
  <div className={className}>
    {children}
  </div>
);

function Landing() {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex flex-col align-center justify-center bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Hero section doesn't need top margin */}
      <SectionSpacing isFirst={true}>
        <HeroSection isDarkMode={isDarkMode} />
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

      {/* FAQ section doesn't need bottom margin */}
      <SectionSpacing isLast={true}>
        <FaqSection />
      </SectionSpacing>
    </div>
  );
}

export default Landing;
