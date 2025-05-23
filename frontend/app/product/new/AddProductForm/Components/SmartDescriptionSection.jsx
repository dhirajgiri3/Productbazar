"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Eye, Edit2, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-hot-toast';

const SmartDescriptionSection = ({
  name,
  tagline,
  description,
  onChange,
  onBack,
  onNext,
  error
}) => {
  const [mode, setMode] = useState('write');
  const [suggestions, setSuggestions] = useState([]);
  const [generating, setGenerating] = useState(false);

  const generateSuggestions = async () => {
    if (!name || !tagline) {
      toast.error('Product name and tagline are required for suggestions');
      return;
    }

    setGenerating(true);
    try {
      // In a real scenario, this would be an API call
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            `## About ${name}\n${tagline}\n\n### Key Features\n- Feature 1\n- Feature 2\n- Feature 3\n\n### Why Choose Us\nExplain what makes your product unique...`,
            `# Introducing ${name}\n${tagline}\n\n## What We Offer\nDescribe your main offerings...\n\n## Benefits\n1. Benefit 1\n2. Benefit 2\n3. Benefit 3`,
            `# ${name}\n> ${tagline}\n\n## Overview\nAdd your product overview...\n\n## Features\n- [ ] Feature 1\n- [ ] Feature 2\n- [ ] Feature 3\n\n## Get Started\nExplain how to get started...`
          ]);
        }, 1500);
      });
      setSuggestions(response);
    } catch (error) {
      toast.error('Failed to generate suggestions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Product Description</h2>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setMode('write')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              mode === 'write'
                ? 'bg-white shadow text-violet-600'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <Edit2 size={16} />
            Write
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              mode === 'preview'
                ? 'bg-white shadow text-violet-600'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <Eye size={16} />
            Preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {mode === 'write' ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Description *
                  </label>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Supports Markdown
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="Describe your product..."
                  rows={12}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                />
                {error && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle size={16} />
                    {error}
                  </p>
                )}
              </div>

              <div className="space-y-3 bg-violet-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-violet-800">
                    Need inspiration?
                  </h3>
                  <button
                    onClick={generateSuggestions}
                    disabled={generating}
                    className="flex items-center gap-2 text-sm bg-violet-600 text-white px-3 py-1 rounded hover:bg-violet-700 transition-colors disabled:bg-violet-300"
                  >
                    <Sparkles size={16} />
                    {generating ? 'Generating...' : 'Generate Suggestions'}
                  </button>
                </div>

                {suggestions.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => onChange(suggestion)}
                        className="w-full p-3 text-left text-sm bg-white hover:bg-violet-100 rounded-lg transition-colors border border-violet-200"
                      >
                        {suggestion.substring(0, 100)}...
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="prose prose-violet max-w-none bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <ReactMarkdown>{description || '*No content yet*'}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-6 space-y-6 h-fit">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare size={20} className="text-violet-600" />
            Writing Tips
          </h3>

          <div className="space-y-4">
            {[
              { title: "Structure", items: ["Start with a clear overview", "List key features and benefits", "Include use cases or examples", "End with a call to action"] },
              { title: "Best Practices", items: ["Use clear, concise language", "Break text into sections", "Include relevant details", "Highlight unique selling points"] },
              { title: "Markdown Tips", items: ["**bold** for emphasis", "# Heading 1, ## Heading 2", "- or * for bullet points", "> for blockquotes"] }
            ].map((section, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-medium text-gray-700">{section.title}</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2">
                      <span className="text-violet-500">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

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
          disabled={!description}
          className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue
          <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default SmartDescriptionSection;
