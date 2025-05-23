"use client";
import React from "react";
import RegisterLeft from "./RegisterLeft";
import AuthRight from "../../Common/AuthRight";
import guestOnly from "../../RouteProtector/guestOnly";
import { motion } from "framer-motion";
import AnimatedBackground from "./AnimatedBackground";

function Register() {
  return (
    <div className="min-h-screen h-full py-8 bg-gray-50 relative overflow-hidden flex items-center justify-center">
      {/* Animated background with improved visuals */}
      <AnimatedBackground />

      {/* Main layout container with responsive grid */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16 relative z-10 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-7xl mx-auto w-full">
          {/* Left column - Registration form */}
          <motion.div
            className="w-full flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <RegisterLeft />
          </motion.div>

          {/* Right column - Branding/Welcome area */}
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
                      Join {" "}
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

        {/* Mobile-only branding message */}
        <motion.div
          className="lg:hidden text-center mt-8 text-gray-600 absolute bottom-6 left-0 right-0 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-sm bg-white/50 backdrop-blur-sm py-3 px-4 rounded-xl shadow-sm mx-auto max-w-md">
            Join{" "}
            <span className="text-violet-600 font-semibold">Product Bazar</span>{" "}
            today and connect with innovative creators worldwide.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default guestOnly(Register);
