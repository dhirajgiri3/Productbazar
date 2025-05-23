"use client";

import React from "react";
import LoginLeft from "./LoginLeft";
import AuthRight from "../../Common/AuthRight";
import guestOnly from "../../RouteProtector/guestOnly";
import { motion } from "framer-motion";

function Login() {
  return (
    <div className="min-h-screen h-full flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-50 to-gray-100">
      {/* Enhanced animated background */}
      <AnimatedBackground />

      {/* Glass overlay with refined blur */}
      <div className="absolute inset-0 backdrop-blur-[1px] bg-white/5 z-0"></div>

      {/* Main content container */}
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-10 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-7xl mx-auto w-full">
          {/* Left column - Login form with enhanced animation */}
          <motion.div
            className="w-full flex justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.1,
            }}
          >
            <LoginLeft />
          </motion.div>

          {/* Right column - Branding area with enhanced visuals */}
          <motion.div
            className="w-full hidden lg:block"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="rounded-3xl overflow-hidden relative h-full">
              {/* Advanced layered gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/80 to-indigo-700/90 mix-blend-multiply z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-pink-500/30 z-20 opacity-60"></div>

              {/* Decorative patterns with improved aesthetics */}
              <div className="absolute inset-0 opacity-20 z-0 pattern-dots"></div>
              <div className="absolute inset-0 bg-noise opacity-5"></div>

              <div
                className="rounded-3xl p-10 md:p-12 relative z-20 backdrop-blur-md border border-white/10 shadow-2xl 
                bg-gradient-to-br from-white/20 to-white/5 h-full flex flex-col justify-center"
              >
                <AuthRight
                  title={
                    <>
                      Welcome Back to{" "}
                      <span className="text-white font-bold inline-block relative">
                        Product Bazar
                        <span className="absolute -bottom-1 left-0 w-full h-1 bg-white/40 rounded-full"></span>
                      </span>
                    </>
                  }
                  description="Log in to access your personalized dashboard, connect with innovative creators, and discover exciting new products."
                  showAnimation={true}
                />

                {/* Enhanced floating 3D elements */}
                <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
                <div className="absolute right-1/4 top-1/4 w-20 h-20 bg-pink-400/20 rounded-full blur-xl"></div>

                {/* Animated mesh gradient */}
                <div className="absolute inset-0 z-0 opacity-30 overflow-hidden rounded-3xl">
                  <div className="mesh-gradient"></div>
                </div>

                {/* Interactive particles */}
                <div className="particles-container absolute inset-0 z-10 opacity-40"></div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Enhanced decorative elements */}
      <motion.div
        className="absolute top-16 left-8 w-64 h-64 bg-violet-200 rounded-full opacity-30 blur-3xl"
        animate={{
          x: [0, 10, 0],
          y: [0, -15, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-16 right-16 w-80 h-80 bg-indigo-200 rounded-full opacity-20 blur-3xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 10,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-purple-200 rounded-full opacity-15 blur-2xl"
        animate={{
          x: [0, 15, 0],
          y: [0, 15, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 12,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// Enhanced animated background component with modern visuals
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Improved floating gradient circles with better colors */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-violet-300/20 to-indigo-400/20 blur-3xl"
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 15,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-violet-400/15 to-fuchsia-300/15 blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, 20, 0],
          scale: [1, 1.2, 1],
          rotate: [0, -5, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 18,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      <motion.div
        className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-blue-300/15 to-indigo-300/15 blur-3xl"
        animate={{
          x: [0, 60, 0],
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 20,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <motion.div
        className="absolute bottom-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-gradient-to-r from-pink-300/10 to-purple-300/10 blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 17,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Advanced subtle grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.01]" />

      {/* Enhanced dot pattern overlay */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.015]" />

      {/* Subtle directional light ray effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-violet-200/20 to-transparent blur-3xl opacity-30" />

      {/* Side light accent */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-tl from-indigo-200/20 to-transparent blur-3xl opacity-20" />
    </div>
  );
}

export default guestOnly(Login);
