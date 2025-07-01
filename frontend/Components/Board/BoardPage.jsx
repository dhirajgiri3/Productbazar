"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MousePointer, 
  StickyNote as StickyNoteIcon, 
  Pen, 
  Trash2,
  Save,
  Download,
  Share2,
  Users,
  Undo,
  Redo
} from 'lucide-react';
import DrawingCanvas from './DrawingCanvas';
import StickyNote from './StickyNote';

const BoardPage = ({ projectId, projectData, onSave }) => {
  // State management
  const [currentTool, setCurrentTool] = useState('select');
  const [stickyNotes, setStickyNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [collaborators, setCollaborators] = useState([]);

  // Refs for state management
  const nextNoteId = useRef(1);
  const boardStateHistory = useRef([]);
  const currentHistoryIndex = useRef(-1);

  // Colors for sticky notes
  const noteColors = ['yellow', 'blue', 'green', 'pink', 'purple'];
  const [currentColor, setCurrentColor] = useState('yellow');

  // Handle canvas click based on current tool
  const handleCanvasClick = useCallback((clickData) => {
    const { x, y, tool } = clickData;

    switch (tool) {
      case 'sticky-note':
        createStickyNote(x, y);
        break;
      case 'select':
        // Clear selection when clicking on empty canvas
        setSelectedNoteId(null);
        break;
      default:
        break;
    }
  }, []);

  // Create a new sticky note
  const createStickyNote = useCallback((x, y) => {
    const newNote = {
      id: `note-${nextNoteId.current++}`,
      text: '',
      position: { x: x - 100, y: y - 100 }, // Center on click
      color: currentColor,
      createdAt: new Date().toISOString(),
    };

    setStickyNotes(prev => [...prev, newNote]);
    setSelectedNoteId(newNote.id);
    setIsUnsaved(true);
    saveToHistory();
  }, [currentColor]);

  // Update sticky note
  const updateStickyNote = useCallback((noteId, updates) => {
    setStickyNotes(prev =>
      prev.map(note =>
        note.id === noteId ? { ...note, ...updates } : note
      )
    );
    setIsUnsaved(true);
    saveToHistory();
  }, []);

  // Delete sticky note
  const deleteStickyNote = useCallback((noteId) => {
    setStickyNotes(prev => prev.filter(note => note.id !== noteId));
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
    setIsUnsaved(true);
    saveToHistory();
  }, [selectedNoteId]);

  // Handle note selection
  const handleNoteSelect = useCallback((noteId) => {
    setSelectedNoteId(noteId);
  }, []);

  // Handle drag start
  const handleNoteDragStart = useCallback((noteId) => {
    setSelectedNoteId(noteId);
  }, []);

  // Handle drag end
  const handleNoteDragEnd = useCallback((noteId) => {
    // Note position is updated in the note component itself
    // This is just for cleanup if needed
  }, []);

  // Save current state to history for undo/redo
  const saveToHistory = useCallback(() => {
    const currentState = {
      stickyNotes: [...stickyNotes],
      timestamp: Date.now()
    };

    // Remove any future history if we're not at the end
    if (currentHistoryIndex.current < boardStateHistory.current.length - 1) {
      boardStateHistory.current = boardStateHistory.current.slice(0, currentHistoryIndex.current + 1);
    }

    boardStateHistory.current.push(currentState);
    currentHistoryIndex.current = boardStateHistory.current.length - 1;

    // Limit history size
    if (boardStateHistory.current.length > 50) {
      boardStateHistory.current.shift();
      currentHistoryIndex.current--;
    }
  }, [stickyNotes]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (currentHistoryIndex.current > 0) {
      currentHistoryIndex.current--;
      const previousState = boardStateHistory.current[currentHistoryIndex.current];
      setStickyNotes(previousState.stickyNotes);
      setIsUnsaved(true);
    }
  }, []);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (currentHistoryIndex.current < boardStateHistory.current.length - 1) {
      currentHistoryIndex.current++;
      const nextState = boardStateHistory.current[currentHistoryIndex.current];
      setStickyNotes(nextState.stickyNotes);
      setIsUnsaved(true);
    }
  }, []);

  // Handle tool change
  const handleToolChange = useCallback((newTool) => {
    setCurrentTool(newTool);
    
    // Clear selection when changing tools
    if (newTool !== 'select') {
      setSelectedNoteId(null);
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle shortcuts if typing in input/textarea
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      // Handle shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
        }
      } else {
        // Delete selected note
        if (e.key === 'Delete' && selectedNoteId) {
          deleteStickyNote(selectedNoteId);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedNoteId, deleteStickyNote]);

  // Save board state
  const handleSave = useCallback(async () => {
    try {
      const boardData = {
        stickyNotes,
        lastModified: new Date().toISOString(),
      };
      
      await onSave?.(boardData);
      setIsUnsaved(false);
    } catch (error) {
      console.error('Failed to save board:', error);
    }
  }, [stickyNotes, onSave]);

  // Clear all notes
  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all notes?')) {
      setStickyNotes([]);
      setSelectedNoteId(null);
      setIsUnsaved(true);
      saveToHistory();
    }
  }, [saveToHistory]);

  // Initial history state
  useEffect(() => {
    if (boardStateHistory.current.length === 0) {
      saveToHistory();
    }
  }, [saveToHistory]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          {/* Tool selection */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleToolChange('select')}
              className={`
                p-2 rounded-md transition-colors
                ${currentTool === 'select' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
              title="Select Tool (V)"
            >
              <MousePointer size={18} />
            </button>
            <button
              onClick={() => handleToolChange('sticky-note')}
              className={`
                p-2 rounded-md transition-colors
                ${currentTool === 'sticky-note' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
              title="Sticky Note Tool (S)"
            >
              <StickyNoteIcon size={18} />
            </button>
            <button
              onClick={() => handleToolChange('draw')}
              className={`
                p-2 rounded-md transition-colors
                ${currentTool === 'draw' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
              title="Draw Tool (D)"
            >
              <Pen size={18} />
            </button>
          </div>

          {/* Color selection for sticky notes */}
          {currentTool === 'sticky-note' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Color:</span>
              <div className="flex space-x-1">
                {noteColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`
                      w-6 h-6 rounded-full border-2 
                      ${currentColor === color ? 'border-gray-800' : 'border-gray-300'}
                      ${color === 'yellow' ? 'bg-yellow-200' : ''}
                      ${color === 'blue' ? 'bg-blue-200' : ''}
                      ${color === 'green' ? 'bg-green-200' : ''}
                      ${color === 'pink' ? 'bg-pink-200' : ''}
                      ${color === 'purple' ? 'bg-purple-200' : ''}
                    `}
                    title={`${color.charAt(0).toUpperCase() + color.slice(1)} Note`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Undo/Redo */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleUndo}
              disabled={currentHistoryIndex.current <= 0}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={handleRedo}
              disabled={currentHistoryIndex.current >= boardStateHistory.current.length - 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo size={18} />
            </button>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Note count */}
          <span className="text-sm text-gray-600">
            {stickyNotes.length} note{stickyNotes.length !== 1 ? 's' : ''}
          </span>

          {/* Clear all */}
          <button
            onClick={handleClearAll}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
            title="Clear All Notes"
          >
            <Trash2 size={18} />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`
              px-3 py-2 rounded-md text-sm font-medium
              ${isUnsaved 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-600'
              }
            `}
            title="Save Board (Ctrl+S)"
          >
            <Save size={16} className="mr-1" />
            {isUnsaved ? 'Save' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Drawing Canvas */}
      <div className="flex-1 relative">
        <DrawingCanvas
          currentTool={currentTool}
          onCanvasClick={handleCanvasClick}
          onToolChange={handleToolChange}
        >
          {/* Render sticky notes */}
          <AnimatePresence>
            {stickyNotes.map(note => (
              <StickyNote
                key={note.id}
                id={note.id}
                initialText={note.text}
                initialPosition={note.position}
                color={note.color}
                isSelected={selectedNoteId === note.id}
                onUpdate={updateStickyNote}
                onDelete={deleteStickyNote}
                onSelect={handleNoteSelect}
                onDragStart={handleNoteDragStart}
                onDragEnd={handleNoteDragEnd}
              />
            ))}
          </AnimatePresence>
        </DrawingCanvas>
      </div>
    </div>
  );
};

export default BoardPage;