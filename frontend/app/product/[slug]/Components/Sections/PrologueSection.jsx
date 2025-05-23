import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { fadeInUp } from "../Constants";

const PrologueSection = ({ product }) => {
  if (!product) return null;
  
  return (
    <motion.header
      variants={fadeInUp}
      className="mb-20 md:mb-28 text-center border-b-2 border-dashed border-violet-200 pb-12"
    >
      <motion.span
        className="inline-block px-5 py-1.5 bg-gradient-to-r from-violet-100 to-violet-100 text-violet-800 rounded-full text-sm font-normal mb-7 border border-violet-200/70 tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {product.categoryName || "Mystery Item"}
      </motion.span>

      {/* Product Name - The Title */}
      <h1 className="text-3xl sm:text-4xl md:text-[3rem] font-extrabold text-gray-900 leading-tight mb-6 tracking-tighter pb-1">
        {product.name}
      </h1>

      {/* Tagline - The Subtitle */}
      <p className="text-md text-gray-700 font-normal leading-relaxed max-w-2xl mx-auto">
        {product.tagline ||
          `Come closer, adventurer, and behold this intriguing find!`}
      </p>

      {/* Featured Badge */}
      {product.featured && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            delay: 0.4,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="mt-7 inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-medium bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/30"
        >
          <Star className="w-5 h-5 animate-pulse" /> Chosen by the Crowd!
        </motion.div>
      )}
    </motion.header>
  );
};

export default PrologueSection;