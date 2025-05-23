"use client";

import React, { useState } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';
import clsx from 'clsx';

const SelectableTagsField = ({ 
  label, 
  name, 
  value = [], 
  onChange, 
  error, 
  icon: Icon, 
  description, 
  placeholder, 
  presetOptions = [],
  maxLength,
  disabled = false
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  // Handle adding a preset tag
  const handleAddPreset = (preset) => {
    if (!value.includes(preset)) {
      const newValue = [...value, preset];
      onChange({ target: { name, value: newValue } });
    }
    setShowPresets(false);
  };

  // Handle adding a custom tag
  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !value.includes(customTagInput.trim())) {
      const newValue = [...value, customTagInput.trim()];
      onChange({ target: { name, value: newValue } });
      setCustomTagInput('');
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tag) => {
    const newValue = value.filter(t => t !== tag);
    onChange({ target: { name, value: newValue } });
  };

  // Filter out already selected options
  const availablePresets = presetOptions.filter(option => !value.includes(option));

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={name} className={clsx("block text-sm font-medium text-left", error ? "text-red-600" : "text-gray-700")}>
          {label}
        </label>
        {maxLength && (
          <span className={clsx("text-xs", 
            value.length > (maxLength * 0.8) ? 
              value.length > maxLength ? "text-red-500" : "text-amber-500" 
              : "text-gray-400"
          )}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 mb-1.5 text-left">{description}</p>
      )}
      
      <div className="relative">
        <div className={clsx(
          "w-full py-1.5 px-3 rounded-md border bg-white min-h-[42px] flex flex-wrap gap-2 items-start",
          Icon && "pl-10",
          disabled ? "bg-gray-50 cursor-not-allowed" : "",
          error
            ? "border-red-300 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100"
            : "border-gray-200 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 hover:border-gray-300"
        )}>
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="w-4 h-4 text-gray-400" />
            </div>
          )}
          
          {Array.isArray(value) && value.map((tag, index) => (
            <span 
              key={index} 
              className="bg-violet-50 text-violet-700 text-xs px-2 py-1 rounded-md flex items-center"
            >
              {tag}
              {!disabled && (
                <button 
                  type="button" 
                  className="ml-1.5 text-violet-400 hover:text-violet-600"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <FiX size={12} />
                </button>
              )}
            </span>
          ))}
          
          {!disabled && (
            <div className="flex items-center flex-1 min-w-[120px]">
              <input
                type="text"
                className="flex-1 outline-none text-sm bg-transparent"
                placeholder={placeholder}
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customTagInput.trim()) {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
              />
              
              <button
                type="button"
                className="ml-2 text-violet-500 hover:text-violet-700"
                onClick={() => setShowPresets(!showPresets)}
              >
                <FiPlus size={16} />
              </button>
            </div>
          )}
        </div>
        
        {/* Preset options dropdown */}
        {showPresets && availablePresets.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2 border-b border-gray-100">
              <p className="text-xs text-gray-500">Select from common options or type your own</p>
            </div>
            <div className="p-2">
              <div className="flex flex-wrap gap-2">
                {availablePresets.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    className="bg-gray-50 hover:bg-violet-50 text-gray-700 hover:text-violet-700 text-xs px-2 py-1 rounded-md transition-colors"
                    onClick={() => handleAddPreset(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-1.5 flex items-start text-sm text-red-600">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default SelectableTagsField;
