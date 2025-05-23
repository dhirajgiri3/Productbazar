import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import NarrativeParagraph from "../Common/NarrativeParagraph";
import { staggerContainer } from "../Constants";

const FeaturesSection = ({ product }) => {
  if (!product || (!product.tags?.length && !product.features?.length)) {
    return null;
  }
  
  return (
    <>
      <NarrativeParagraph delay={0.15} intent="lead">
        What magical ingredients give <strong>{product.name}</strong>{" "}
        its unique flair? What powers does it wield? Let's peek into the
        alchemist's notes...
      </NarrativeParagraph>

      {/* Tags/Features Display */}
      <motion.div
        variants={staggerContainer}
        className="mt-8 space-y-4"
      >
        {product.tags &&
          product.tags.map((tag, index) => (
            <motion.div
              key={`tag-${index}`}
              className="group flex items-center gap-3 p-4 bg-white border border-dashed border-violet-200 rounded-lg hover:border-solid hover:border-violet-300 hover:bg-violet-50/50 transition-all cursor-default"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.07 }}
              whileHover={{ scale: 1.02, x: 0 }}
            >
              <Zap
                size={18}
                className="text-violet-500 group-hover:text-violet-600 transition-colors flex-shrink-0"
              />
              <span className="text-base font-medium text-gray-700 group-hover:text-gray-800">
                {tag}
              </span>
            </motion.div>
          ))}
      </motion.div>

      <NarrativeParagraph
        delay={0.2 + (product.tags?.length || 0) * 0.07}
        intent="aside"
        className="mt-6"
      >
        These are just some highlights – the real magic often lies in
        how they combine!
      </NarrativeParagraph>
    </>
  );
};

export default FeaturesSection;