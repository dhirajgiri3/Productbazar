"use client";

import BoardTest from '../../Components/Board/BoardTest';

export default function TestBoardPage() {
  return (
    <div className="h-screen">
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <h1 className="text-lg font-semibold text-gray-800">
          Board Component Test
        </h1>
        <p className="text-sm text-gray-600">
          Testing sticky note event handling
        </p>
      </div>
      <div className="h-[calc(100vh-80px)]">
        <BoardTest />
      </div>
    </div>
  );
}