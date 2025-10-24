import React from 'react';
import { Plus, ZoomIn, ZoomOut, ChevronLeft } from 'lucide-react';

interface ToolbarProps {
  onAddColumn: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddColumn, zoomIn, zoomOut, resetZoom }) => (
  <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg sticky top-0 z-40">
    <div className="flex items-center space-x-2 font-audiowide text-lg">
      <ChevronLeft className="h-5 w-5" />
      <span>My Kanban Board</span>
    </div>

    <div className="flex items-center space-x-2">
      <button
        onClick={zoomOut}
        className="p-2 rounded-md hover:bg-white/20 transition-colors"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <button
        onClick={zoomIn}
        className="p-2 rounded-md hover:bg-white/20 transition-colors"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
      <button
        onClick={resetZoom}
        className="px-3 py-1 rounded-md bg-white text-indigo-600 font-semibold hover:bg-gray-100 transition-colors"
      >
        Reset
      </button>

      <button
        onClick={onAddColumn}
        className="ml-4 flex items-center space-x-1 bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-md font-medium"
      >
        <Plus className="h-4 w-4" />
        <span>Add Column</span>
      </button>
    </div>
  </div>
); 