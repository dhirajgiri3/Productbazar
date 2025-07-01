"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, X, Check, Trash2 } from 'lucide-react';

const StickyNote = ({
  id,
  initialText = '',
  initialPosition = { x: 0, y: 0 },
  color = 'yellow',
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  isSelected = false,
  onSelect,
}) => {
  const [text, setText] = useState(initialText);
  const [position, setPosition] = useState(initialPosition);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const noteRef = useRef(null);
  const textareaRef = useRef(null);
  const dragStartRef = useRef(null);

  // Color variants for sticky notes
  const colorVariants = {
    yellow: 'bg-yellow-200 border-yellow-300 text-yellow-800',
    blue: 'bg-blue-200 border-blue-300 text-blue-800',
    green: 'bg-green-200 border-green-300 text-green-800',
    pink: 'bg-pink-200 border-pink-300 text-pink-800',
    purple: 'bg-purple-200 border-purple-300 text-purple-800',
  };

  // Handle double-click to edit with proper event handling
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only enter edit mode if not already dragging
    if (!isDragging) {
      setIsEditing(true);
      onSelect?.(id);
    }
  }, [isDragging, id, onSelect]);

  // Handle single click with proper event handling
  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only select if not editing or dragging
    if (!isEditing && !isDragging) {
      onSelect?.(id);
    }
  }, [isEditing, isDragging, id, onSelect]);

  // Handle mouse down for drag initiation
  const handleMouseDown = useCallback((e) => {
    // Don't start drag if clicking on edit controls or in edit mode
    if (isEditing || e.target.closest('.edit-controls')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const rect = noteRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    onSelect?.(id);
    
    // Add event listeners for drag
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isEditing, id, onSelect]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e) => {
    if (!dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Start drag state if moved enough distance
    if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      setIsDragging(true);
      onDragStart?.(id);
    }

    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      };
      setPosition(newPosition);
    }
  }, [isDragging, dragOffset, id, onDragStart]);

  // Handle mouse up to end drag
  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.(id);
      onUpdate?.(id, { position, text });
    }

    dragStartRef.current = null;
  }, [isDragging, id, position, text, onDragEnd, onUpdate, handleMouseMove]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Handle save edit
  const handleSaveEdit = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    setIsEditing(false);
    onUpdate?.(id, { text, position });
  }, [id, text, position, onUpdate]);

  // Handle cancel edit
  const handleCancelEdit = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    setText(initialText);
    setIsEditing(false);
  }, [initialText]);

  // Handle delete with proper event handling
  const handleDelete = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    onDelete?.(id);
  }, [id, onDelete]);

  // Handle textarea events
  const handleTextareaKeyDown = useCallback((e) => {
    e.stopPropagation(); // Prevent canvas from receiving key events
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const handleTextareaClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent canvas click when editing
  }, []);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <motion.div
      ref={noteRef}
      className={`
        absolute select-none cursor-move
        ${colorVariants[color]} 
        ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-75' : ''}
        ${isDragging ? 'shadow-lg scale-105 z-50' : 'shadow-md z-10'}
        transition-shadow duration-200
      `}
      style={{
        left: position.x,
        top: position.y,
        width: '200px',
        height: '200px',
      }}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ 
        scale: 1, 
        rotate: isDragging ? 5 : 0,
      }}
      exit={{ scale: 0, rotate: -10 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Sticky note content */}
      <div className="w-full h-full p-3 rounded-lg border-2 border-dashed">
        {/* Edit controls */}
        <AnimatePresence>
          {(isSelected || isEditing) && (
            <motion.div
              className="edit-controls absolute -top-2 -right-2 flex gap-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                    title="Save"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDoubleClick}
                    className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text content */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            onClick={handleTextareaClick}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-sm leading-tight"
            placeholder="Enter your note..."
            style={{ color: 'inherit' }}
          />
        ) : (
          <div className="w-full h-full text-sm leading-tight overflow-hidden">
            {text || 'Double-click to edit'}
          </div>
        )}
      </div>

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg pointer-events-none" />
      )}
    </motion.div>
  );
};

export default StickyNote;