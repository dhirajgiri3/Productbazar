"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { motion } from "framer-motion";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import SearchModal from "Components/Modal/Search/SearchModal";

const heroVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      when: "beforeChildren",
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1.0],
    },
  },
};

// Content variations based on user type
const getHeroContent = (userType = "general") => {
  const content = {
    general: {
      headline: "Discover Innovative Products & Ideas",
      subheadline:
        "Explore a curated marketplace of cutting-edge products and groundbreaking startup ventures.",
    },
    freelancer: {
      headline: "Find the Right Tools & Your Next Opportunity",
      subheadline:
        "Access essential tools, resources, and exciting freelance projects to elevate your career.",
    },
    jobSeeker: {
      headline: "Unlock Your Potential at Leading Startups",
      subheadline:
        "Browse job openings at dynamic startups and take the next step in your professional journey.",
    },
    investor: {
      headline: "Discover the Next Big Thing: Invest in Promising Startups",
      subheadline:
        "Identify high-growth potential startups and connect directly with founders to fuel innovation.",
    },
    startupOwner: {
      headline: "Showcase Your Innovation & Grow Your Business",
      subheadline:
        "Reach a passionate community of early adopters, investors, and talent eager to support your vision.",
    },
  };

  return content[userType] || content.general;
};

const HeroSection = ({ onSearch }) => {
  const router = useRouter();
  const { user } = useAuth();
  const userType = user?.role || "general";
  const heroContent = getHeroContent(userType);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 px-6 sm:px-8 py-12 sm:py-16 md:py-24 text-center shadow-xl mb-12 border border-violet-400/20"
      variants={heroVariants}
      initial="hidden"
      animate="visible"
      id="hero"
    >
      {/* Enhanced background decoration elements with more visual interest */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[10%] right-[5%] w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-[40%] right-[15%] w-40 h-40 bg-purple-300/10 rounded-full blur-2xl animate-pulse-slow"></div>
        <div className="absolute bottom-[30%] left-[15%] w-32 h-32 bg-violet-300/10 rounded-full blur-2xl animate-float-delayed"></div>

        {/* Additional decorative elements */}
        <div className="absolute top-[20%] right-[30%] w-24 h-24 bg-white/5 rounded-full blur-xl animate-float-slow"></div>
        <div className="absolute bottom-[15%] left-[30%] w-20 h-20 bg-indigo-300/10 rounded-full blur-xl animate-pulse-delayed"></div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/0 opacity-30"></div>
        <div className="absolute inset-0 bg-[url('https://sdmntprwestus.oaiusercontent.com/files/00000000-9ea8-6230-8198-1fa857bd40c1/raw?se=2025-04-14T15%3A38%3A42Z&sp=r&sv=2024-08-04&sr=b&scid=3328526e-d174-561d-9b28-5d0135323a84&skoid=72d71449-cf2f-4f10-a498-f160460104ee&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-04-14T08%3A57%3A00Z&ske=2025-04-15T08%3A57%3A00Z&sks=b&skv=2024-08-04&sig=%2BgwJuHN07Mi8j1/ajKYwHqPRvDISOyWFc1ETeO1Sj%2BE%3D')] bg-repeat bg-[length:80px_80px] opacity-10"></div>
      </div>

      <motion.div
        className="relative z-10 max-w-4xl mx-auto"
        variants={itemVariants}
      >
        {/* Enhanced eyebrow label */}
        <motion.div
          className="inline-flex items-center px-4 py-1.5 mb-6 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 shadow-lg"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <Sparkles className="w-4 h-4 mr-2 animate-pulse-slow" />
          <span className="text-sm font-medium">Discover What's Next</span>
        </motion.div>

        <motion.h1
          className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 md:mb-8 leading-tight tracking-tight"
          variants={itemVariants}
        >
          {heroContent.headline}
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-white/80 mx-auto mb-8 md:mb-10 max-w-2xl leading-relaxed"
          variants={itemVariants}
        >
          {heroContent.subheadline}
        </motion.p>

        <motion.div
          className="w-full max-w-2xl mx-auto"
          variants={itemVariants}
        >
          {/* Enhanced search form with improved visual design */}
          <div className="relative group">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300 opacity-70 group-hover:opacity-100 -z-10"></div>
            <button
              onClick={handleSearchClick}
              className="w-full flex items-center pl-6 pr-16 py-4 sm:py-5 rounded-full text-gray-500 shadow-xl bg-white text-base transition-all duration-300 border border-transparent hover:border-violet-200 group-hover:shadow-violet-500/20 text-left"
            >
              <span>
                {userType === "jobSeeker" ? "Search for jobs, companies, skills..." :
                userType === "investor" ? "Search for startups, founders, industries..." :
                userType === "startupOwner" ? "Search for tools, talent, investors..." :
                "Search for products, startups, skills, jobs..."}
              </span>
            </button>
            <motion.div
              className="absolute right-2.5 top-2.5 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 active:from-violet-800 active:to-violet-900 text-white p-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-violet-500/50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-5 h-5" />
            </motion.div>
          </div>

          {/* Search Modal */}
          <SearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            initialQuery={searchQuery}
          />

          {/* Enhanced quick search tags with personalized suggestions */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {/* Dynamic tags based on user type */}
            {(userType === "jobSeeker" ?
              ["Remote Jobs", "Tech Startups", "Developer", "Product Manager", "Marketing"] :
             userType === "investor" ?
              ["AI Startups", "Fintech", "SaaS", "Pre-seed", "B2B"] :
             userType === "startupOwner" ?
              ["Funding", "Growth Tools", "Marketing", "Talent", "SaaS Tools"] :
              ["AI Tools", "SaaS", "Design", "Dev Tools", "Productivity"]
            ).map(
              (tag, index) => (
                <motion.button
                  key={tag}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white/90 text-sm rounded-full transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/30 shadow-sm hover:shadow-white/10"
                  onClick={() => {
                    setSearchQuery(tag);
                    if (onSearch) {
                      onSearch(tag);
                    } else {
                      router.push(`/search?q=${encodeURIComponent(tag)}`);
                    }
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (index * 0.1) }}
                >
                  {tag}
                </motion.button>
              )
            )}
          </div>
        </motion.div>

        {/* Enhanced scroll indicator with improved visual design */}
        <motion.div
          className="mt-10 flex justify-center"
          variants={itemVariants}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <motion.a
            href="#trending"
            className="flex items-center text-white/90 hover:text-white transition-colors gap-2 px-5 py-2 rounded-full hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/30 shadow-sm hover:shadow-white/10 group"
            whileHover={{ y: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="font-medium">Explore trending products</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="inline-block"
            >
              <ArrowRight className="w-4 h-4 group-hover:text-violet-200 transition-colors" />
            </motion.span>
          </motion.a>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default HeroSection;
