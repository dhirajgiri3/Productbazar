"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiHeart, FiTag, FiX, FiPlus } from "react-icons/fi";

const SkillsInterestsSection = ({ formData, setFormData, validationErrors, setValidationErrors, setHasUnsavedChanges }) => {
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const handleAddTag = (type, input, setInput) => {
    if (!input.trim()) return;
    
    const tag = input.trim();
    const currentTags = formData[type] || [];
    
    // Check if tag already exists
    if (currentTags.some(t => typeof t === 'string' ? t.toLowerCase() === tag.toLowerCase() : t.name.toLowerCase() === tag.toLowerCase())) {
      return;
    }
    
    // Format interests as objects with name and strength
    if (type === 'interests') {
      const updatedTags = [...currentTags, { name: tag, strength: 5 }];
      setFormData(prev => ({ ...prev, [type]: updatedTags }));
    } else {
      const updatedTags = [...currentTags, tag];
      setFormData(prev => ({ ...prev, [type]: updatedTags }));
    }
    
    setInput("");
    setHasUnsavedChanges(true);
  };

  const handleRemoveTag = (type, index) => {
    const updatedTags = [...formData[type]];
    updatedTags.splice(index, 1);
    setFormData(prev => ({ ...prev, [type]: updatedTags }));
    setHasUnsavedChanges(true);
  };

  const handleKeyDown = (e, type, input, setInput) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(type, input, setInput);
    }
  };

  // Predefined options
  const skillOptions = [
    "JavaScript", "React", "Node.js", "Python", "Java", "C++", "Ruby", "PHP", "Swift", "Kotlin",
    "UI/UX Design", "Product Management", "Marketing", "Sales", "Customer Support", "Data Analysis",
    "Machine Learning", "Artificial Intelligence", "Blockchain", "Cloud Computing", "DevOps"
  ];
  
  const interestOptions = [
    "Technology", "Business", "Design", "Marketing", "Finance", "Education", "Health", "Science",
    "Art", "Music", "Sports", "Travel", "Food", "Fashion", "Photography", "Writing", "Reading",
    "Gaming", "Fitness", "Meditation"
  ];

  const handlePredefinedOption = (type, option) => {
    if (type === 'skills') {
      handleAddTag(type, option, setSkillInput);
    } else {
      handleAddTag(type, option, setInterestInput);
    }
  };

  // Get display name for interest (handle both string and object formats)
  const getInterestName = (interest) => {
    if (typeof interest === 'string') return interest;
    return interest.name || '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Skills Section */}
      <motion.div 
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden relative"
        whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        transition={{ duration: 0.2 }}
      >
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-full opacity-20 -mr-8 -mt-8"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 rounded-md bg-violet-100 flex items-center justify-center mr-3">
              <FiTag className="h-4 w-4 text-violet-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Skills</h4>
          </div>
          
          <div className="space-y-4">
            {/* Input field */}
            <div className="relative">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'skills', skillInput, setSkillInput)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                placeholder="Add a skill and press Enter"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <FiTag className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag('skills', skillInput, setSkillInput)}
                className="absolute right-3 top-2.5 text-violet-500 hover:text-violet-600"
                disabled={!skillInput.trim()}
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Tags display */}
            <div className="flex flex-wrap gap-2">
              {formData.skills && formData.skills.map((skill, index) => (
                <motion.span
                  key={`${skill}-${index}`}
                  className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium border border-violet-100 flex items-center group"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ y: -2 }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag('skills', index)}
                    className="ml-1.5 text-violet-400 hover:text-violet-600 transition-colors"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </motion.span>
              ))}
              {(!formData.skills || formData.skills.length === 0) && (
                <p className="text-sm text-gray-500 italic">No skills added yet</p>
              )}
            </div>
            
            {/* Predefined options */}
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Suggested skills:</p>
              <div className="flex flex-wrap gap-2">
                {skillOptions.slice(0, 10).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handlePredefinedOption('skills', option)}
                    className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium hover:bg-violet-50 hover:text-violet-600 transition-colors"
                  >
                    + {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Interests Section */}
      <motion.div 
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden relative"
        whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        transition={{ duration: 0.2 }}
      >
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full opacity-20 -mr-8 -mt-8"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 rounded-md bg-indigo-100 flex items-center justify-center mr-3">
              <FiHeart className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Interests</h4>
          </div>
          
          <div className="space-y-4">
            {/* Input field */}
            <div className="relative">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'interests', interestInput, setInterestInput)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-gray-900 text-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Add an interest and press Enter"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <FiHeart className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag('interests', interestInput, setInterestInput)}
                className="absolute right-3 top-2.5 text-indigo-500 hover:text-indigo-600"
                disabled={!interestInput.trim()}
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Tags display */}
            <div className="flex flex-wrap gap-2">
              {formData.interests && formData.interests.map((interest, index) => (
                <motion.span
                  key={`${typeof interest === 'string' ? interest : interest.name}-${index}`}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100 flex items-center group"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ y: -2 }}
                >
                  {getInterestName(interest)}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag('interests', index)}
                    className="ml-1.5 text-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </motion.span>
              ))}
              {(!formData.interests || formData.interests.length === 0) && (
                <p className="text-sm text-gray-500 italic">No interests added yet</p>
              )}
            </div>
            
            {/* Predefined options */}
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Suggested interests:</p>
              <div className="flex flex-wrap gap-2">
                {interestOptions.slice(0, 10).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handlePredefinedOption('interests', option)}
                    className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    + {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SkillsInterestsSection;
