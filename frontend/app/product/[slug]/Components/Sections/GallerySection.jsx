import React from "react";
import { motion } from "framer-motion";
import { Camera, PlusIcon } from "lucide-react";
import NarrativeParagraph from "../Common/NarrativeParagraph";
import OptimizedGallery from "../OptimizedGallery";
import eventBus, { EVENT_TYPES } from "@/lib/utils/event-bus";

const GallerySection = ({ product, isOwner, onEditModalOpen }) => {
  if (!product) return null;

  if (product.gallery && product.gallery.length > 0) {
    return (
      <>
        <NarrativeParagraph delay={0.15} intent="lead">
          Talk is cheap, pixels are priceless! Embark on a visual tour
          through the world of <strong>{product.name}</strong>. Prepare
          for potential awe.
        </NarrativeParagraph>

        <OptimizedGallery
          images={product.gallery}
          productName={product.name}
          isOwner={isOwner}
          onManageClick={() => {
            onEditModalOpen();
            setTimeout(() => {
              eventBus.publish(EVENT_TYPES.SWITCH_MODAL_TAB, {
                tab: "gallery",
              });
            }, 150);
          }}
        />
      </>
    );
  } else {
    // If no gallery, mention it playfully
    return (
      <>
        <NarrativeParagraph delay={0.15} intent="aside">
          Hmm, it seems the camera crew hasn't arrived yet, or the photos
          are still developing. We're eager to see the visuals for{" "}
          <strong>{product.name}</strong> when they're ready!
        </NarrativeParagraph>

        {isOwner && (
          <motion.div
            className="mt-8 flex flex-col items-center rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 p-8 text-center shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-4 rounded-full bg-violet-100">
              <Camera className="h-12 w-12 text-violet-500" />
            </div>
            <p className="mt-4 text-lg font-semibold text-violet-800">
              Time to showcase your creation!
            </p>
            <p className="mt-2 text-gray-600 max-w-md">
              Add images to bring <strong>{product.name}</strong> to life.
              High-quality visuals can significantly increase engagement.
            </p>
            <motion.button
              onClick={() => {
                onEditModalOpen();
                setTimeout(() => {
                  eventBus.publish(EVENT_TYPES.SWITCH_MODAL_TAB, {
                    tab: "gallery",
                  });
                }, 150);
              }}
              className="mt-6 flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 font-medium text-white transition-all hover:bg-violet-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusIcon className="h-5 w-5" />
              Add Images
            </motion.button>
          </motion.div>
        )}
      </>
    );
  }
};

export default GallerySection;