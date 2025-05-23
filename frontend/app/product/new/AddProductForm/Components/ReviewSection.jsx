"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  CheckCircle,
  ArrowLeft,
  Rocket,
  Camera,
  Tag,
  Link as LinkIcon,
  DollarSign,
  Globe,
  ExternalLink,
  AlertCircle,
  Video,
  Calendar
} from "lucide-react";

// Use standard icons instead of specialized ones
const GitHub = ExternalLink;
const Youtube = Video;
import LoaderComponent from "../../../../../Components/UI/LoaderComponent";

const ReviewSection = ({
  formData,
  categories,
  onBack,
  onSubmit,
  isSubmitting,
  error
}) => {
  const {
    name,
    tagline,
    description,
    category,
    thumbnail,
    galleryImages,
    tags,
    links,
    pricing
  } = formData;

  const selectedCategory = categories.find(c => c._id === category);

  // Format pricing display
  const formatPricing = () => {
    switch (pricing.type) {
      case "free":
        return "Free";
      case "contact":
        return "Contact for Pricing (Coming Soon)";
      case "freemium":
        return "Freemium (Coming Soon)";
      case "paid":
        return "One-time Purchase (Coming Soon)";
      case "subscription":
        return "Subscription (Coming Soon)";
      default:
        return "Pricing not specified";
    }
  };

  // Get icon for link type
  const getLinkIcon = (type) => {
    switch (type) {
      case "website": return <Globe size={16} className="text-blue-500" />;
      case "github": return <GitHub size={16} className="text-gray-700" />;
      case "demo": return <ExternalLink size={16} className="text-green-500" />;
      case "video": return <Youtube size={16} className="text-red-500" />;
      default: return <LinkIcon size={16} className="text-violet-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-100 flex items-center justify-center"
        >
          <Rocket size={32} className="text-violet-600" />
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Ready to Launch Your Product!
        </h2>

        <p className="text-gray-600 mb-4">
          Review your product details before submitting. Everything looks great!
        </p>
      </div>

      {/* Product Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Visual Preview */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-700 flex items-center gap-2">
              <Camera size={16} className="text-violet-600" />
              Product Preview
            </h3>
          </div>

          <div className="p-4 flex flex-col items-center">
            {thumbnail && (
              <div className="mb-4 w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={typeof thumbnail === "string" ? thumbnail : URL.createObjectURL(thumbnail)}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h3 className="text-lg font-bold text-gray-800 text-center mb-1">{name}</h3>
            <p className="text-sm text-gray-600 text-center mb-3">{tagline}</p>

            {selectedCategory && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800 mb-3">
                {selectedCategory.name}
              </span>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mb-3">
                {tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                    #{tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                    +{tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            <div className="w-full mt-2 flex justify-center">
              <button className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors">
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-700 flex items-center gap-2">
              <Check size={16} className="text-emerald-500" />
              Product Details
            </h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Basic Info */}
            <div className="space-y-1">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                Basic Information
              </h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-800">{name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tagline</p>
                    <p className="text-sm font-medium text-gray-800">{tagline}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category & Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h4 className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                  Category
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    <Tag size={14} className="text-violet-500" />
                    {selectedCategory?.name || "Not selected"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                  Pricing
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    {pricing.type === "free" ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <DollarSign size={14} className="text-emerald-500" />
                    )}
                    {formatPricing()}
                  </p>
                </div>
              </div>
            </div>

            {/* Links */}
            {Object.keys(links).length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                  Links
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="space-y-2">
                    {Object.entries(links).map(([type, url]) => (
                      <div key={type} className="flex items-center gap-2">
                        {getLinkIcon(type)}
                        <span className="text-xs font-medium text-gray-700 capitalize">
                          {type}:
                        </span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-600 hover:text-violet-800 truncate"
                        >
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                Description
              </h4>
              <div className="bg-gray-50 p-3 rounded-lg max-h-[200px] overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-gray-800 whitespace-pre-line">
                    {description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Images section removed as we now only use a single thumbnail */}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm flex items-center gap-1"
        >
          <AlertCircle size={14} /> {error}
        </motion.p>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-8 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-violet-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <LoaderComponent size="small" text="" color="white" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span>Launch Product</span>
              <Rocket size={20} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ReviewSection;
