import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import NarrativeParagraph from "../Common/NarrativeParagraph";

const OriginSection = ({ product, formattedDate, makerName, launchedDateFormatted }) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  if (!product) return null;
  
  return (
    <>
      <NarrativeParagraph delay={0.15} intent="lead">
        So, how did{" "}
        <strong className="text-violet-800">{product.name}</strong> leap
        from a twinkle in someone's eye to... well, <em>this</em>? Every
        invention has a backstory, often involving late nights, caffeine,
        and possibly a rubber duck.
      </NarrativeParagraph>

      <NarrativeParagraph delay={0.2}>
        Our tale begins approximately{" "}
        <strong className="text-violet-700">{formattedDate}</strong>, when{" "}
        <strong className="text-violet-700">{makerName}</strong> (our
        protagonist!) decided the world needed this creation.{" "}
        {launchedDateFormatted && (
          <>
            It officially saw the light of day on{" "}
            <strong className="text-violet-700">
              {launchedDateFormatted}
            </strong>
            .
          </>
        )}{" "}
        What problem was itching to be solved? What dream fueled its
        creation? Let's hear the maker's words (or our best guess):
      </NarrativeParagraph>

      {/* Description Area */}
      <motion.div
        className={`relative mt-8 text-gray-700 leading-relaxed whitespace-pre-line transition-all duration-700 ease-in-out overflow-hidden rounded-lg border border-violet-100 bg-white/70 p-6 shadow-sm ${
          isDescriptionExpanded ? "max-h-[9999px]" : "max-h-72"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        {product.description ||
          "The scrolls detailing the full origin story are currently sealed... perhaps guarded by a dragon? Or maybe the maker's just shy. Either way, the essence is clear: it's something awesome!"}
      </motion.div>

      {/* Expand/Collapse */}
      {product.description && product.description.length > 350 && (
        <div className="relative mt-[-2rem] pt-10 flex justify-center">
          {!isDescriptionExpanded && (
            <div className="absolute bottom-10 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
          )}
          <motion.button
            onClick={() =>
              setIsDescriptionExpanded(!isDescriptionExpanded)
            }
            className="flex items-center gap-2 px-4 py-2 bg-violet-50 hover:bg-violet-100 rounded-full text-violet-700 hover:text-violet-800 transition-colors font-semibold text-base group relative z-10"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {isDescriptionExpanded
              ? "Condense the Tale"
              : "Unfurl the Full Scroll"}
            <motion.div
              animate={{ rotate: isDescriptionExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isDescriptionExpanded ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </motion.div>
          </motion.button>
        </div>
      )}
    </>
  );
};

export default OriginSection;