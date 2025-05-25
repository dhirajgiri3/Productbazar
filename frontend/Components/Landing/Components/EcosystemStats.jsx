"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users2, Rocket, BarChart3, CheckCircle } from "lucide-react";
import { DisplayCards } from "../../UI/DisplayCards/DisplayCards";
import GlobalButton from "../../UI/Buttons/GlobalButton";
import SectionLabel from "./Animations/SectionLabel";

const EcosystemStats = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.5 });

  // Stats cards with light theme styling
  const statsCards = [
    {
      icon: <Rocket className="size-6 text-violet-600" />,
      title: "Products Launched",
      description: "10,000+",
      date: "Growing Daily",
      iconClassName: "text-violet-500",
      titleClassName: "text-gray-900",
      className:
        "[grid-area:stack] hover:-translate-y-20 transition-all duration-700 ease-out",
    },
    {
      icon: <Users2 className="size-6 text-violet-600" />,
      title: "Community Members",
      description: "25,000+",
      date: "Growing Daily",
      iconClassName: "text-violet-500",
      titleClassName: "text-gray-900",
      className:
        "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-8 transition-all duration-700 ease-out",
    },
    {
      icon: <BarChart3 className="size-6 text-violet-600" />,
      title: "Connections Made",
      description: "50,000+",
      date: "Growing Daily",
      iconClassName: "text-violet-500",
      titleClassName: "text-gray-900",
      className:
        "[grid-area:stack] translate-x-24 translate-y-20 hover:-translate-y-4 transition-all duration-700 ease-out",
    },
    {
      icon: <CheckCircle className="size-6 text-violet-600" />,
      title: "User Satisfaction",
      description: "95%",
      date: "Based on feedback",
      iconClassName: "text-violet-500",
      titleClassName: "text-gray-900",
      className:
        "[grid-area:stack] translate-x-36 translate-y-28 hover:translate-y-12 transition-all duration-700 ease-out",
    },
  ];

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-white py-16"
    >
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[60%] -right-[5%] w-[30%] h-[40%] rounded-full bg-violet-200/20 blur-3xl"></div>
        <div className="absolute top-[30%] left-[60%] w-[20%] h-[20%] rounded-full bg-indigo-200/20 blur-2xl"></div>
        <div className="absolute top-[10%] right-[20%] w-[10%] h-[10%] rounded-full bg-violet-300/15 blur-xl animate-pulse-slow"></div>
        <div className="absolute bottom-[15%] left-[15%] w-[12%] h-[12%] rounded-full bg-indigo-300/15 blur-xl animate-pulse-slow"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-20">
          {/* Left column - Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7 }}
            className="w-full md:w-2/5 flex flex-col items-center md:items-start"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "show" : "hidden"}
              className="space-y-6 max-w-md"
            >
              <motion.div variants={itemVariants}>
                <SectionLabel
                  text="Ecosystem Statistics"
                  size="medium"
                  alignment="center"
                  variant="modern"
                  glowEffect={true}
                  animationStyle="fade"
                />
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-4xl font-bold text-gray-900 leading-tight"
              >
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  A Thriving Ecosystem,
                </span>{" "}
                <br />
                Growing Daily
              </motion.h2>

              <motion.p
                variants={itemVariants}
                className="text-base text-gray-600 leading-relaxed"
              >
                Join thousands of creators and enthusiasts in our vibrant
                community. Experience the power of connection and collaboration
                in a rapidly expanding marketplace.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-4 mt-8"
              >
                <GlobalButton
                  variant="primary"
                  href="/launch"
                  ariaLabel="Join the Product Bazar community"
                  size="md"
                  className="transform transition-all duration-300 hover:shadow-lg"
                >
                  Join Community
                </GlobalButton>
                <GlobalButton
                  variant="secondary"
                  href="/about"
                  ariaLabel="Learn more about Product Bazar"
                  size="md"
                  className="transform transition-all duration-300 hover:shadow-lg"
                >
                  Learn More
                </GlobalButton>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right column - Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
            }
            transition={{ duration: 0.9, delay: 0.3 }}
            className="w-full md:w-3/5 flex items-center justify-center perspective-[1500px]"
          >
            <div className="w-full max-w-xl relative transform-gpu">
              <div className="absolute h-40 w-40 inset-0 bg-gradient-to-r from-violet-100/30 to-indigo-100/30 rounded-3xl blur-3xl -z-10"></div>
              <DisplayCards cards={statsCards} />
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </section>
  );
};

export default EcosystemStats;