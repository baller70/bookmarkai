// Connector Bead - Draggable bead for routing connector strings
'use client';

import React, { useState, useCallback } from 'react';
import { ConnectorBead as ConnectorBeadType } from '../models/timeline.models';

interface ConnectorBeadProps {
  bead: ConnectorBeadType;
  onDragStart?: (beadId: string, position: { x: number; y: number }) => void;
  onDragMove?: (beadId: string, position: { x: number; y: number }) => void;
  onDragEnd?: (beadId: string, position: { x: number; y: number }) => void;
  isEditing?: boolean;
}

export const ConnectorBead: React.FC<ConnectorBeadProps> = ({
  bead,
  onDragStart,
  onDragMove,
  onDragEnd,
  isEditing = false
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!isEditing) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    setIsDragging(true);
    onDragStart?.(bead.id, { x: bead.x, y: bead.y });

    const handleMouseMove = (e: MouseEvent) => {
      const newPosition = { x: e.clientX, y: e.clientY };
      onDragMove?.(bead.id, newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd?.(bead.id, { x: bead.x, y: bead.y });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [bead.id, bead.x, bead.y, isEditing, onDragStart, onDragMove, onDragEnd]);

  return (
    <circle
      cx={bead.x}
      cy={bead.y}
      r={isEditing ? 8 : 6}
      fill={isDragging ? "#3b82f6" : isEditing ? "#60a5fa" : "#94a3b8"}
      stroke={isEditing ? "#1d4ed8" : "#64748b"}
      strokeWidth={isEditing ? 2 : 1}
      className={`${
        isEditing 
          ? 'cursor-grab hover:fill-blue-400 transition-colors duration-200' 
          : 'pointer-events-none'
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      onMouseDown={handleMouseDown}
    />
  );
}; 