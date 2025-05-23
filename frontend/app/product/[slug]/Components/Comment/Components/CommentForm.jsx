// GitHub Copilot: Current Date/Time: 2025-04-20 15:17:05 UTC | User: dhirajgiri3
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar } from '@mui/material'; // Assuming Material UI is used
import { motion } from 'framer-motion';
import { FaUser, FaPaperPlane, FaTimes, FaMarkdown } from 'react-icons/fa';

// Custom hook for auto-resizing textarea
const useAutosizeTextArea = (textAreaRef, value) => {
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "0px"; // Reset height
      const scrollHeight = textAreaRef.current.scrollHeight;
      // Set height based on scroll height, add buffer for border/padding if needed
      textAreaRef.current.style.height = Math.max(60, scrollHeight + 2) + "px"; // Min height 60px
    }
  }, [textAreaRef, value]);
};

// Comment Form Component
const CommentForm = ({
  user,
  onSubmit,
  initialContent = '',
  placeholder = "Add a comment...",
  submitLabel = "Post",
  onCancel, // Optional: If provided, shows a cancel button (for replies/edits)
  isSubmitting = false,
  autoFocus = false,
  maxLength = 1000
}) => {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef(null);

  useAutosizeTextArea(textareaRef, content);

  // Sync with initialContent changes (for edits)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Focus management
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end for edits
      if (initialContent) {
          const len = initialContent.length;
          textareaRef.current.setSelectionRange(len, len);
      }
    }
  }, [autoFocus, initialContent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length > maxLength || isSubmitting) return;
    onSubmit(trimmedContent);
    // Clear only if it's a new comment/reply form, not an edit form
    if (!initialContent) {
       setContent('');
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (content.trim() && content.length <= maxLength && !isSubmitting) {
        e.preventDefault();
        onSubmit(content.trim());
        if (!initialContent) setContent('');
      }
    }
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  }, [content, maxLength, onSubmit, onCancel, isSubmitting, initialContent]);

  const charCount = content.length;
  const isOverLimit = charCount > maxLength;

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3 w-full">
      {/* Show avatar only for top-level new comment form (when onCancel is not present) */}
      {!onCancel && user && (
          <Avatar
            src={user?.profilePicture?.url}
            alt={user?.firstName || 'User'}
            sx={{ width: 36, height: 36, bgcolor: 'secondary.light', fontSize: '0.875rem' }}
            className="mt-1 flex-shrink-0"
          >
            {user?.firstName?.charAt(0) || <FaUser size={16} />}
          </Avatar>
      )}

      <div className="flex-grow space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={maxLength + 50} // Allow typing over limit slightly but show error
            className={`w-full p-3 text-sm border rounded-lg focus:outline-none transition duration-200 min-h-[60px] resize-none bg-gray-50 placeholder-gray-500 text-gray-800
              focus:border-violet-400 focus:ring-1 focus:ring-violet-300
              ${isOverLimit ? "border-red-400 focus:ring-red-300" : "border-gray-200"}
              ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}
            `}
            placeholder={placeholder}
            disabled={isSubmitting}
            rows={1} // Start small
            required
            aria-label="Comment text"
          />

          {/* Minimal character count - shown when near/over limit */}
          {(charCount > maxLength * 0.8 || isOverLimit) && (
             <div
               className={`absolute bottom-1.5 right-1.5 text-[10px] font-mono px-1 rounded ${
                 isOverLimit ? "text-red-600" : "text-gray-500"
               }`}
             >
               {charCount}/{maxLength}
             </div>
           )}
        </div>

        {/* Buttons and Hints */}
        <div className="flex justify-between items-center gap-2 flex-wrap">
          {/* Markdown hint */}
          <div className="text-xs text-gray-400 flex items-center gap-1 tooltip-container">
             <FaMarkdown size={12} />
             <span className="hidden sm:inline">Markdown</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onCancel && (
              <motion.button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                disabled={isSubmitting}
              >
                Cancel
              </motion.button>
            )}

            <motion.button
              type="submit"
              className={`px-4 py-1.5 text-xs font-semibold text-white rounded-md transition-all flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 ${
                !content.trim() || isOverLimit || isSubmitting
                  ? 'bg-violet-300 cursor-not-allowed'
                  : 'bg-violet-500 hover:bg-violet-600 shadow-sm'
              }`}
              disabled={isSubmitting || !content.trim() || isOverLimit}
              whileHover={!isSubmitting && content.trim() && !isOverLimit ? { scale: 1.03 } : {}}
              whileTap={!isSubmitting && content.trim() && !isOverLimit ? { scale: 0.97 } : {}}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </>
              ) : (
                <>
                  <span>{submitLabel}</span>
                  <FaPaperPlane size={10} />
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Keyboard shortcuts hint - subtle */}
        {/* {isFocused && ( // Consider removing this for less clutter
          <div className="text-[10px] text-gray-400 dark:text-gray-500 text-right mt-1">
            {onCancel ? "Esc to cancel • " : ""}Ctrl+Enter to submit
          </div>
        )} */}
      </div>
    </form>
  );
};

export default CommentForm;