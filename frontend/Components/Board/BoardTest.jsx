"use client";

import React from 'react';
import { useState } from 'react';
import StickyNote from './StickyNote';
import DrawingCanvas from './DrawingCanvas';

// Simple test component to verify our board components work
const BoardTest = () => {
  const [notes, setNotes] = useState([
    {
      id: 'test-1',
      text: 'Test Note 1',
      position: { x: 100, y: 100 },
      color: 'yellow'
    },
    {
      id: 'test-2', 
      text: 'Test Note 2',
      position: { x: 350, y: 150 },
      color: 'blue'
    }
  ]);

  const [currentTool, setCurrentTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);

  const handleCanvasClick = ({ x, y, tool }) => {
    if (tool === 'sticky-note') {
      const newNote = {
        id: `note-${Date.now()}`,
        text: '',
        position: { x: x - 100, y: y - 100 },
        color: 'yellow'
      };
      setNotes(prev => [...prev, newNote]);
    }
  };

  const updateNote = (id, updates) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ));
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return (
    <div className="w-full h-screen">
      <DrawingCanvas
        currentTool={currentTool}
        onCanvasClick={handleCanvasClick}
        onToolChange={setCurrentTool}
      >
        {notes.map(note => (
          <StickyNote
            key={note.id}
            id={note.id}
            initialText={note.text}
            initialPosition={note.position}
            color={note.color}
            isSelected={selectedId === note.id}
            onUpdate={updateNote}
            onDelete={deleteNote}
            onSelect={setSelectedId}
          />
        ))}
      </DrawingCanvas>
    </div>
  );
};

export default BoardTest;