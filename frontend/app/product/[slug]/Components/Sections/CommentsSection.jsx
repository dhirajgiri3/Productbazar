import React from "react";
import { motion } from "framer-motion";
import NarrativeParagraph from "../Common/NarrativeParagraph";
import CommentSection from "../Comment/CommentSection";
import { fadeInUp } from "../Constants";

const CommentsSection = ({ product, isAuthenticated, onCommentCountChange }) => {
  if (!product) return null;
  
  return (
    <>
      <NarrativeParagraph delay={0.15} intent="lead">
        The story isn't complete without *your* voice! What did you think?
        Questions? Epiphanies? Funny anecdotes? Drop them below and join
        the conversation around <strong>{product.name}</strong>.
      </NarrativeParagraph>
      <motion.div variants={fadeInUp} className="mt-8">
        <CommentSection
          productSlug={product.slug}
          productId={product._id}
          isAuthenticated={isAuthenticated}
          onCommentCountChange={onCommentCountChange}
        />
      </motion.div>
    </>
  );
};

export default CommentsSection;