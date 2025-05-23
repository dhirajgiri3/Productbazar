import React from "react";
import { motion } from "framer-motion";
import { Share2, Globe } from "lucide-react";
import { fadeInUp } from "../Constants";

const ProductFooter = ({ product, showToast }) => {
  if (!product) return null;
  
  return (
    <>
      <motion.div
        variants={fadeInUp}
        className="mt-20 pt-10 border-t border-violet-100 flex flex-wrap justify-center items-center gap-4 text-sm"
      >
        {/* Share Button */}
        <motion.button
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-50 to-violet-100/80 text-violet-700 border border-violet-200/80 rounded-lg hover:shadow-md hover:border-violet-300 transition-all font-medium"
          onClick={() => {
            // Basic share functionality
            if (navigator.share) {
              navigator
                .share({
                  title: product.name,
                  text: product.tagline || `Check out ${product.name} on Product Bazar!`,
                  url: window.location.href,
                })
                .catch(console.error);
            } else {
              // Fallback for browsers that don't support navigator.share
              navigator.clipboard.writeText(window.location.href);
              showToast("info", "Link copied to clipboard!", 2000);
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Share2 size={16} /> Spread the Legend
        </motion.button>
      </motion.div>

      {/* Enhanced Footer with CTA Reminder */}
      <motion.div
        variants={fadeInUp}
        transition={{ delay: 0.2 }}
        className="text-center text-xs text-violet-500 mt-24"
      >
        {/* Final CTA Reminder */}
        {product.links?.website && (
          <motion.div
            className="mb-12 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <p className="text-gray-700 mb-4 text-base">
              Ready to experience <strong className="text-violet-700">{product.name}</strong> for yourself?
            </p>
            <motion.a
              href={product.links.website}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{
                y: -3,
                scale: 1.03,
                boxShadow: "0 8px 20px rgba(124, 58, 237, 0.3)",
              }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white rounded-xl transition-all shadow-md text-base font-semibold dark:text-white dark:hover:text-white"
            >
              <Globe size={18} /> Visit Website Now
            </motion.a>
          </motion.div>
        )}

        <p className="font-medium text-base text-violet-600 mb-1">
          ~ Fin ~
        </p>
        <p>This tale was brought to you by Product Bazar.</p>
        <p>
          Enjoying the stories?{" "}
          <a href="/feedback" className="text-violet-500 hover:underline">
            Share your thoughts!
          </a>
        </p>
      </motion.div>
    </>
  );
};

export default ProductFooter;