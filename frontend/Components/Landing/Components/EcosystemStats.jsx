"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users2, Rocket, BarChart3, CheckCircle } from "lucide-react";
import { DisplayCards } from "../../UI/DisplayCards/DisplayCards";
import GlobalButton from "../../UI/Buttons/GlobalButton";
import { useTheme } from "@/lib/contexts/theme-context";
import SectionLabel from "./Animations/SectionLabel";

const EcosystemStats = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.5 });
  const { isDarkMode } = useTheme(); // Add theme context

  // All four cards in a single array for the DisplayCards component
  const statsCards = [
    {
      icon: <Rocket className="size-5 text-violet-50 dark:text-violet-900" />,
      title: "Products Launched",
      description: "10,000+",
      date: "Growing Daily",
      iconClassName: "text-violet-500 dark:text-violet-400",
      titleClassName: "text-violet-600 dark:text-violet-300",
      className:
        "[grid-area:stack] hover:-translate-y-20 transition-all duration-700 ease-out",
    },
    {
      icon: <Users2 className="size-5 text-violet-50 dark:text-violet-900" />,
      title: "Community Members",
      description: "25,000+",
      date: "Growing Daily",
      iconClassName: "text-violet-500 dark:text-violet-400",
      titleClassName: "text-violet-600 dark:text-violet-300",
      className:
        "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-8 transition-all duration-700 ease-out",
    },
    {
      icon: <BarChart3 className="size-5 text-violet-50 dark:text-violet-900" />,
      title: "Connections Made",
      description: "50,000+",
      date: "Growing Daily",
      iconClassName: "text-violet-500 dark:text-violet-400",
      titleClassName: "text-violet-600 dark:text-violet-300",
      className:
        "[grid-area:stack] translate-x-24 translate-y-20 hover:-translate-y-4 transition-all duration-700 ease-out",
    },
    {
      icon: <CheckCircle className="size-5 text-violet-50 dark:text-violet-900" />,
      title: "User Satisfaction",
      description: "95%",
      date: "Based on feedback",
      iconClassName: "text-violet-500 dark:text-violet-400",
      titleClassName: "text-violet-600 dark:text-violet-300",
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
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-300 py-12 lg:py-16"
    >
      {/* Enhanced background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[60%] -right-[5%] w-[30%] h-[40%] rounded-full bg-violet-300/20 dark:bg-violet-700/20 blur-3xl transition-colors duration-300"></div>
        <div className="absolute top-[30%] left-[60%] w-[20%] h-[20%] rounded-full bg-violet-500/20 dark:bg-violet-600/15 blur-2xl transition-colors duration-300"></div>
        <div className="absolute top-[10%] right-[20%] w-[10%] h-[10%] rounded-full bg-violet-500/15 dark:bg-violet-500/15 blur-xl animate-pulse-slow transition-colors duration-300"></div>
        <div className="absolute bottom-[15%] left-[15%] w-[12%] h-[12%] rounded-full bg-violet-600/15 dark:bg-violet-500/15 blur-xl animate-pulse-slow transition-colors duration-300"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Two-column layout with improved spacing and alignment */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 lg:gap-20">
          {/* Left column - Enhanced text content */}
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
                className="text-4xl font-bold text-gray-900 dark:text-gray-50 leading-tight transition-colors duration-300"
              >
                <span className="bg-gradient-to-r from-violet-700 to-violet-500 dark:from-violet-500 dark:to-violet-400 bg-clip-text text-transparent transition-colors duration-300">
                  A Thriving Ecosystem,
                </span>{" "}
                <br />
                Growing Daily
              </motion.h2>

              <motion.p
                variants={itemVariants}
                className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed transition-colors duration-300"
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
                  className="transform transition-all duration-300"
                >
                  Join Community
                </GlobalButton>
                <GlobalButton
                  variant="secondary"
                  href="/about"
                  ariaLabel="Learn more about Product Bazar"
                  size="md"
                  className="transform transition-all duration-300"
                >
                  Learn More
                </GlobalButton>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right column - Enhanced Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
            }
            transition={{ duration: 0.9, delay: 0.3 }}
            className="w-full md:w-3/5 flex items-center justify-center perspective-[1500px]"
          >
            <div className="w-full max-w-xl relative transform-gpu">
              <div className="absolute h-40 w-40 inset-0 bg-gradient-to-r from-violet-100/40 via-violet-200/30 to-violet-100/40 dark:from-violet-800/20 dark:via-violet-700/15 dark:to-violet-800/20 rounded-3xl blur-3xl -z-10 transition-colors duration-300"></div>
              <DisplayCards cards={statsCards} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EcosystemStats;