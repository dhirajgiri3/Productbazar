import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import NarrativeParagraph from "../Common/NarrativeParagraph";
import SimilarProductsSection from "../SimilarProductsSection";
import { fadeInUp } from "../Constants";

const RelatedSection = ({ product, router }) => {
  if (!product || !product._id) return null;
  
  return (
    <>
      <NarrativeParagraph delay={0.15}>
        Did the tale of <strong>{product.name}</strong> spark your
        curiosity? Perhaps these related legends and artifacts will
        catch your eye...
      </NarrativeParagraph>
      <motion.div variants={fadeInUp} className="mt-8">
        <SimilarProductsSection
          productId={product._id}
          limit={3}
          tags={product.tags || []}
          category={product.category?.slug}
        />
      </motion.div>
      {/* Category Link */}
      <div className="mt-14 text-center border-t border-dashed border-violet-200 pt-10">
        <NarrativeParagraph delay={0.2} className="mb-6">
          Or continue exploring the{" "}
          <strong className="text-violet-700">
            {product.categoryName || "Uncharted Territories"}
          </strong>{" "}
          category!
        </NarrativeParagraph>
        <motion.button
          onClick={() =>
            router.push(
              `/category/${product.category?.slug || "general"}`
            )
          }
          whileHover={{
            scale: 1.03,
            y: -2,
            boxShadow: "0 6px 15px rgba(124, 58, 237, 0.2)",
          }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors shadow-md"
        >
          Venture Forth into {product.categoryName || "Category"}
          <ArrowRight size={18} />
        </motion.button>
      </div>
    </>
  );
};

export default RelatedSection;