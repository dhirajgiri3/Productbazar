import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Globe, Play, Eye, ExternalLink, ArrowUpRight, Star, Bookmark } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import NarrativeParagraph from '../Common/NarrativeParagraph';
import UpvoteButton from 'Components/UI/Buttons/Upvote/UpvoteButton';
import BookmarkButton from 'Components/UI/Buttons/Bookmark/BookmarkButton';
import { fadeInUp } from '../Constants';

const VisualSection = ({ product, thumbnailUrl, isOwner }) => {
  if (!product) return null;

  const buttonVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { 
      y: -2, 
      scale: 1.02,
      transition: { type: "spring", stiffness: 400, damping: 15 }
    },
    tap: { scale: 0.97 }
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <>
      <NarrativeParagraph delay={0.15} intent="lead">
        Every epic journey starts with a single step, or in this case, a single glance! Feast your
        eyes on <strong>{product.name}</strong> in its natural habitat (or, you know, a nicely
        rendered image).
      </NarrativeParagraph>

      {/* Hero Visual with Enhanced Container */}
      <motion.div variants={fadeInUp} className="my-10 md:my-14 relative">
        <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-white to-gray-50 p-1.5 border border-gray-100">
          {/* Fixed thumbnail aspect ratio and height */}
          <div className="relative w-full aspect-[16/9] md:aspect-[16/10] h-auto min-h-[320px] overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt={`Hero shot for the story of ${product.name}`}
              fill
              className="object-cover rounded-xl hover:scale-105 transition-transform duration-700 ease-out"
              priority
              quality={95}
              onError={e => {
                e.target.src = '/images/placeholder-story-error.png';
              }}
              sizes="(max-width: 640px) 100vw, 800px"
            />
            
            {/* Subtle overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent rounded-xl" />
          </div>

          {/* Enhanced Pricing Overlay */}
          {product.pricing?.type && product.pricing.type !== 'tbd' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-gray-800 px-3.5 py-1.5 rounded-full font-medium shadow-md border border-white/10 text-sm"
            >
              <span className="bg-gradient-to-r from-violet-500 to-indigo-600 bg-clip-text text-transparent">
                {product.pricing.type === 'free'
                  ? '✨ Free'
                  : product.pricing.type === 'paid'
                  ? `${product.pricing.currency || '$'}${product.pricing.amount}`
                  : product.pricing.type === 'subscription'
                  ? '📅 Subscription'
                  : product.pricing.type === 'freemium'
                  ? '🎯 Freemium'
                  : '💰 Pricing'}
              </span>
            </motion.div>
          )}
        </div>

        {/* Completely Redesigned Enhanced Actions Bar */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="mt-8"
        >
          {/* Main Action Card */}
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-6 mb-6"
          >
            {/* Primary CTA Section */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to explore?</h3>
              <p className="text-gray-600 text-sm mb-4">Take the next step with {product.name}</p>
              
              {product.links?.website && (
                <motion.a
                  href={product.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Globe size={20} strokeWidth={2} />
                  <span>Visit Website</span>
                  <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                  
                  {/* Enhanced shimmer effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/25 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
                </motion.a>
              )}
            </div>

            {/* Secondary Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {product.links?.demo && (
                <motion.a
                  href={product.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex items-center gap-3 bg-gray-50 hover:bg-violet-50 border border-gray-200 hover:border-violet-200 text-gray-700 hover:text-violet-700 px-4 py-3 rounded-xl font-medium transition-all duration-300 overflow-hidden"
                >
                  <div className="relative z-10 flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 w-8 h-8 bg-violet-100 group-hover:bg-violet-200 rounded-lg flex items-center justify-center transition-colors duration-300">
                      <Play size={16} className="text-violet-600" />
                    </div>
                    <span className="font-medium">Try Demo</span>
                    <ExternalLink size={14} className="ml-auto opacity-50 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-violet-500/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                </motion.a>
              )}

              {product.links?.github && (
                <motion.a
                  href={product.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 px-4 py-3 rounded-xl font-medium transition-all duration-300 overflow-hidden"
                >
                  <div className="relative z-10 flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-300">
                      <FaGithub size={16} className="text-gray-700" />
                    </div>
                    <span className="font-medium">View Code</span>
                    <ExternalLink size={14} className="ml-auto opacity-50 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-500/0 to-gray-500/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                </motion.a>
              )}

              {/* Owner Analytics Button */}
              {isOwner && (
                <motion.a
                  href={`/product/viewanalytics/${product._id}`}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 hover:border-amber-300 text-amber-800 hover:text-amber-900 px-4 py-3 rounded-xl font-medium transition-all duration-300 overflow-hidden"
                >
                  <div className="relative z-10 flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 group-hover:bg-amber-200 rounded-lg flex items-center justify-center transition-colors duration-300">
                      <Eye size={16} className="text-amber-600" />
                    </div>
                    <span className="font-medium">Analytics</span>
                    <ArrowUpRight size={14} className="ml-auto opacity-50 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                </motion.a>
              )}
            </div>
          </motion.div>

          {/* Enhanced Interaction Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                <Star size={20} className="text-amber-500" />
                Show Your Support
              </h4>
              <p className="text-gray-600 text-sm">Help others discover great products like this one</p>
            </div>

            {/* Enhanced Quick Interactions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative bg-white hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 border border-gray-200 hover:border-violet-200 rounded-xl p-3 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <UpvoteButton product={product} source="product_story_chapter1" showText={true} />
                
                {/* Subtle glow effect on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/0 to-indigo-500/0 group-hover:from-violet-500/5 group-hover:to-indigo-500/5 transition-all duration-300 pointer-events-none" />
              </motion.div>

              <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
              <div className="block sm:hidden h-px w-8 bg-gray-200"></div>

              <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative bg-white hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 border border-gray-200 hover:border-emerald-200 rounded-xl p-3 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <BookmarkButton product={product} source="product_story_chapter1" showText={true} />
                
                {/* Subtle glow effect on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-300 pointer-events-none" />
              </motion.div>
            </div>

            {/* Social Proof Hint */}
            <motion.div 
              variants={itemVariants}
              className="mt-6 text-center"
            >
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Bookmark size={12} />
                Join thousands who've discovered amazing products here
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default VisualSection;