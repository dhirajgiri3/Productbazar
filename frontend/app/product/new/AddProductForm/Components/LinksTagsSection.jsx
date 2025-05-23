"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  ExternalLink,
  Tag,
  Plus,
  X,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Link as LinkIcon,
  Trash2,
  Video,
} from "lucide-react";

// Use standard icons instead of specialized ones
const GitHub = ExternalLink;
const Youtube = Video;
import { toast } from "react-hot-toast";

const LinksTagsSection = ({
  links,
  setLinks,
  tags,
  setTags,
  category,
  setCategory,
  categories,
  onBack,
  onNext,
  error,
}) => {
  const [tagInput, setTagInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlType, setUrlType] = useState("website");

  const linkTypes = [
    { id: "website", icon: Globe, label: "Website", placeholder: "https://yourproduct.com" },
    { id: "github", icon: GitHub, label: "GitHub", placeholder: "https://github.com/username/repo" },
    { id: "demo", icon: ExternalLink, label: "Demo", placeholder: "https://demo.yourproduct.com" },
    { id: "video", icon: Youtube, label: "Video", placeholder: "https://youtube.com/watch?v=..." },
  ];

  const handleAddTag = () => {
    if (!tagInput.trim()) return;

    const newTag = tagInput.trim().toLowerCase();

    if (tags.includes(newTag)) {
      toast.error("This tag already exists");
      return;
    }

    if (tags.length >= 10) {
      toast.error("Maximum 10 tags allowed");
      return;
    }

    setTags([...tags, newTag]);
    setTagInput("");
  };

  const handleRemoveTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "," || e.key === " ") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddLink = () => {
    if (!urlInput.trim()) return;

    try {
      // Simple URL validation
      new URL(urlInput);

      setLinks({ ...links, [urlType]: urlInput });
      setUrlInput("");
      toast.success(`${urlType.charAt(0).toUpperCase() + urlType.slice(1)} URL added`);
    } catch (error) {
      toast.error("Please enter a valid URL");
    }
  };

  const handleRemoveLink = (type) => {
    const newLinks = { ...links };
    delete newLinks[type];
    setLinks(newLinks);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      {/* Links Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Links</h2>
        <p className="text-gray-600">
          Add relevant links to your product. At least one link is recommended.
        </p>

        <div className="grid gap-4">
          {/* Link Input */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <select
                value={urlType}
                onChange={(e) => setUrlType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                {linkTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={linkTypes.find(type => type.id === urlType)?.placeholder || "Enter URL"}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div className="sm:col-span-1">
              <button
                onClick={handleAddLink}
                disabled={!urlInput.trim()}
                className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-violet-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Link
              </button>
            </div>
          </div>

          {/* Link Display */}
          {Object.keys(links).length > 0 && (
            <div className="space-y-3 mt-2">
              {Object.entries(links).map(([type, url]) => {
                const linkType = linkTypes.find(link => link.id === type);
                const Icon = linkType?.icon || LinkIcon;

                return (
                  <div key={type} className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg">
                    <Icon size={18} className="text-violet-600 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-gray-700">
                        {linkType?.label || type}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {url}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveLink(type)}
                      className="p-1.5 bg-red-100 text-red-500 rounded-md hover:bg-red-200 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Category Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Category</h2>
        <p className="text-gray-600">
          Select the most relevant category for your product.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setCategory(cat._id)}
              className={`p-3 rounded-lg border transition-all flex flex-col items-center justify-center text-center gap-2 h-24 ${
                category === cat._id
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-gray-200 hover:border-violet-300 text-gray-700"
              }`}
            >
              {category === cat._id && (
                <CheckCircle size={16} className="text-violet-600 absolute top-2 right-2" />
              )}
              <span className="text-sm font-medium">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Tags Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Tags</h2>
        <p className="text-gray-600">
          Add tags to help users discover your product. Press Enter, comma, or space after each tag.
        </p>

        <div className="grid gap-4">
          {/* Tag Input */}
          <div className="flex gap-3">
            <div className="flex-grow">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tags (max 10)"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  maxLength={30}
                />
              </div>
            </div>
            <button
              onClick={handleAddTag}
              disabled={!tagInput.trim() || tags.length >= 10}
              className="px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-violet-300 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} />
              Add Tag
            </button>
          </div>

          {/* Tags Display */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 text-violet-800 rounded-full"
                >
                  <Tag size={14} />
                  <span className="text-sm">{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(index)}
                    className="ml-1 text-violet-600 hover:text-violet-800"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
          className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-300"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <button
          onClick={onNext}
          disabled={!category}
          className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue
          <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default LinksTagsSection;
