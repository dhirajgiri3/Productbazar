import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import NarrativeParagraph from "../Common/NarrativeParagraph";
import { fadeInUp } from "../Constants";

const MakerSection = ({ product, makerName }) => {
  if (!product || !product.maker) return null;
  
  return (
    <>
      <NarrativeParagraph delay={0.15} intent="lead">
        Who's the brilliant (and possibly slightly eccentric) architect
        behind <strong>{product.name}</strong>? Give it up for{" "}
        <strong>{makerName}</strong>!
      </NarrativeParagraph>
      <motion.div
        variants={fadeInUp}
        transition={{ delay: 0.2 }}
        className="mt-8 bg-gradient-to-br from-violet-50/40 via-white to-violet-50/30 rounded-2xl border border-violet-100/50 shadow-lg p-6 md:p-8 flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 hover:shadow-xl transition-shadow duration-300"
      >
        <motion.div
          className="flex-shrink-0 relative"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl relative bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center">
            {product.maker.profilePicture?.url ? (
              <Image
                src={product.maker.profilePicture.url}
                alt={`Profile picture of ${makerName}`}
                fill
                className="object-cover"
                onError={(e) => {
                  e.target.style.display = "none"; // Hide broken image icon
                }}
              />
            ) : (
              <span className="text-white text-4xl font-semibold">
                {makerName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "?"}
              </span>
            )}
          </div>
        </motion.div>
        <div className="flex-grow">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {makerName}
          </h3>
          <p className="text-violet-700 font-semibold text-base mb-2">
            {product.maker.bio ||
              product.makerProfile?.title ||
              "Wizard of Wires / Artisan Coder"}
          </p>
          {product.maker.tagline && (
            <NarrativeParagraph
              intent="quote"
              className="!mb-0 !pl-0 !border-l-0 before:!content-none"
            >
              "{product.maker.tagline}"
            </NarrativeParagraph>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default MakerSection;