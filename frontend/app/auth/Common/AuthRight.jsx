// components/auth/auth-right.jsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { AnimatedTooltipPreview } from "Components/UI/Tooltip/Tooltip";

function AuthRight({ title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full flex flex-col justify-center items-center p-6 md:p-12 lg:p-16"
    >
      <div className="max-w-md mx-auto">
        <AnimatedTooltipPreview />

        <motion.h1
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-8 text-2xl font-light tracking-tight text-center text-white/95"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-4 text-sm text-white/60 leading-relaxed text-center"
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
}

export default AuthRight;