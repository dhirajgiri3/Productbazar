import React from "react";
import { motion } from "framer-motion";
import { Eye, ThumbsUp, Bookmark, MessageCircle } from "lucide-react";
import NarrativeParagraph from "../Common/NarrativeParagraph";
import NarrativeStat from "../Common/NarrativeStats";
import { interpretStats } from "../Utils/Stats";
import { staggerContainer } from "../Constants";

const StatsSection = ({ product, displayViewCount, displayUpvoteCount, displayBookmarkCount, displayCommentCount }) => {
  if (!product) return null;
  
  return (
    <>
      <NarrativeParagraph delay={0.15} intent="lead">
        A product launched is like a message in a bottle tossed into the
        vast ocean of the internet. Has anyone found it? What are the
        whispers saying? Let's tune into the frequency of the Bazaar...
      </NarrativeParagraph>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 my-12"
      >
        <NarrativeStat
          icon={Eye}
          value={displayViewCount}
          label={
            displayViewCount === 1 ? "Lone Explorer" : "Curious Eyes"
          }
          delay={0.2}
          color="peach"
        />
        <NarrativeStat
          icon={ThumbsUp}
          value={displayUpvoteCount}
          label={
            displayUpvoteCount === 1 ? "First Applause" : "Appreciations"
          }
          delay={0.25}
          color="slate"
        />
        <NarrativeStat
          icon={Bookmark}
          value={displayBookmarkCount}
          label={
            displayBookmarkCount === 1
              ? "Treasure Marked"
              : "Saved Quests"
          }
          delay={0.3}
          color="rose"
        />
        <NarrativeStat
          icon={MessageCircle}
          value={displayCommentCount}
          label={
            displayCommentCount === 1 ? "First Word" : "Conversations"
          }
          delay={0.35}
          color="amber"
        />
      </motion.div>

      {/* Narrative interpretation */}
      <NarrativeParagraph delay={0.4} intent="highlight">
        {interpretStats(
          displayViewCount,
          displayUpvoteCount,
          displayBookmarkCount,
          displayCommentCount,
          product.name
        )}
      </NarrativeParagraph>

      <NarrativeParagraph delay={0.45}>
        Remember, every view, upvote, comment, and bookmark shapes the
        ongoing saga of <strong>{product.name}</strong>! Don't be shy, add
        your voice to the chorus.
      </NarrativeParagraph>
    </>
  );
};

export default StatsSection;