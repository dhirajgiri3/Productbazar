"use client";

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DrawingCanvas = ({
  children,
  onCanvasClick,
  currentTool = 'select', // 'select', 'sticky-note', 'draw'
  onToolChange,
  className = '',
  width = '100%',
  height = '100vh',
}) => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState(null);

  // Handle canvas click with proper target detection
  const handleCanvasClick = useCallback((e) => {
    // Check if click was on the canvas background (not on child elements)
    const clickedElement = e.target;
    const isCanvasBackground = clickedElement === canvasRef.current;
    
    // Only process canvas clicks if:
    // 1. Clicked on canvas background (not child elements)
    // 2. Not currently dragging
    // 3. Not in the middle of other interactions
    if (isCanvasBackground && !isDragging && !dragState) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      onCanvasClick?.({
        x,
        y,
        tool: currentTool,
        originalEvent: e
      });
    }
  }, [onCanvasClick, currentTool, isDragging, dragState]);

  // Handle mouse down for potential drag operations
  const handleMouseDown = useCallback((e) => {
    // Check if the mousedown is on a draggable element
    const target = e.target;
    const isDraggableElement = target.closest('[data-draggable="true"]') || 
                              target.closest('.sticky-note') ||
                              target.closest('[draggable="true"]');

    if (isDraggableElement) {
      setDragState({
        element: isDraggableElement,
        startTime: Date.now(),
        startX: e.clientX,
        startY: e.clientY
      });
    }
  }, []);

  // Handle mouse move to detect actual dragging
  const handleMouseMove = useCallback((e) => {
    if (dragState && !isDragging) {
      const deltaX = Math.abs(e.clientX - dragState.startX);
      const deltaY = Math.abs(e.clientY - dragState.startY);
      const deltaTime = Date.now() - dragState.startTime;
      
      // Start drag if moved enough distance or time elapsed
      if ((deltaX > 5 || deltaY > 5) || deltaTime > 150) {
        setIsDragging(true);
      }
    }
  }, [dragState, isDragging]);

  // Handle mouse up to end drag state
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      // Small delay to prevent immediate canvas clicks after drag
      setTimeout(() => {
        setIsDragging(false);
        setDragState(null);
      }, 50);
    } else {
      setDragState(null);
    }
  }, [isDragging]);

  // Prevent context menu on canvas
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Handle key events for tool switching
  const handleKeyDown = useCallback((e) => {
    // Only handle if canvas is focused or no other input is active
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key) {
      case 'v':
      case 'V':
        onToolChange?.('select');
        break;
      case 's':
      case 'S':
        onToolChange?.('sticky-note');
        break;
      case 'd':
      case 'D':
        onToolChange?.('draw');
        break;
      case 'Escape':
        onToolChange?.('select');
        break;
    }
  }, [onToolChange]);

  // Add global event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove, handleMouseUp, handleKeyDown]);

  // Update cursor based on current tool
  const getCursorStyle = () => {
    switch (currentTool) {
      case 'sticky-note':
        return 'crosshair';
      case 'draw':
        return 'crosshair';
      case 'select':
      default:
        return 'default';
    }
  };

  return (
    <motion.div
      ref={canvasRef}
      className={`
        relative overflow-hidden bg-gray-50 
        ${className}
      `}
      style={{
        width,
        height,
        cursor: getCursorStyle(),
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      data-testid="drawing-canvas"
    >
      {/* Grid background pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Tool indicator */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 text-sm font-medium text-gray-700 border">
        Tool: {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}
        {currentTool === 'sticky-note' && (
          <div className="text-xs text-gray-500 mt-1">
            Click anywhere to create a note
          </div>
        )}
      </div>

      {/* Drag state indicator */}
      {isDragging && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white rounded-lg px-3 py-2 text-sm font-medium shadow-md">
          Dragging...
        </div>
      )}

      {/* Canvas children (sticky notes, drawings, etc.) */}
      <div className="relative w-full h-full">
        {children}
      </div>

      {/* Tool shortcuts hint */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600 border">
        <div className="font-medium mb-1">Shortcuts:</div>
        <div>V - Select, S - Sticky Note, D - Draw, Esc - Select</div>
      </div>
    </motion.div>
  );
};

export default DrawingCanvas;