// Infinity Board - Draggable board container with bookmark list
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GripVertical,
  Edit3,
  Trash2,
  Plus,
  Calendar,
  FolderOpen,
} from 'lucide-react';
import { InfinityBoard as InfinityBoardType, BookmarkData, ConnectorEditState } from '../models/timeline.models';
import { useTimelineData } from '../hooks/useTimelineData';
import { useDragAndRoute } from '../hooks/useDragAndRoute';
import { BookmarkList } from './BookmarkList';

interface InfinityBoardProps {
  board: InfinityBoardType;
  bookmarks: BookmarkData[];
  isConnectorMode: boolean;
  isSelected: boolean;
  gridSize?: number;
  snapToGrid?: boolean;
  connectorEditState: ConnectorEditState;
  onSelectSourceBoard: (boardId: string) => void;
  onSelectTargetBoard: (boardId: string) => void;
}

export const InfinityBoard: React.FC<InfinityBoardProps> = ({
  board,
  bookmarks,
  isConnectorMode,
  isSelected,
  gridSize = 12,
  snapToGrid = false,
  connectorEditState,
  onSelectSourceBoard,
  onSelectTargetBoard
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(board.title);
  const [isDragging, setIsDragging] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartBoardPos = useRef({ x: 0, y: 0 });

  const { updateBoard, deleteBoard, createBookmark } = useTimelineData();
  const { startDrag, updateDrag, endDrag } = useDragAndRoute();

  // Handle board drag with proper event handling
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (isEditingTitle || isConnectorMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStartPos.current = { x: event.clientX, y: event.clientY };
    dragStartBoardPos.current = { x: board.position.x, y: board.position.y };
    setIsDragging(true);
    startDrag('board', board.id, board.position);

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      const newPosition = {
        x: dragStartBoardPos.current.x + deltaX,
        y: dragStartBoardPos.current.y + deltaY
      };
      
      updateDrag(newPosition);
      
      // Update board position in real-time with transform
      if (boardRef.current) {
        boardRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      }
    };

    const handleMouseUp = async (e: MouseEvent) => {
      e.preventDefault();
      
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      let finalPosition = {
        x: dragStartBoardPos.current.x + deltaX,
        y: dragStartBoardPos.current.y + deltaY
      };

      // Snap to grid if enabled
      if (snapToGrid) {
        finalPosition = {
          x: Math.round(finalPosition.x / gridSize) * gridSize,
          y: Math.round(finalPosition.y / gridSize) * gridSize
        };
      }

      try {
        await updateBoard(board.id, { position: finalPosition });
      } catch (error) {
        console.error('Failed to update board position:', error);
      }

      setIsDragging(false);
      endDrag();
      
      if (boardRef.current) {
        boardRef.current.style.transform = '';
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [board, isEditingTitle, isConnectorMode, updateBoard, startDrag, updateDrag, endDrag, gridSize, snapToGrid]);

  // Handle connection node clicks
  const handleConnectionNodeClick = useCallback((event: React.MouseEvent, side: 'left' | 'right' | 'top' | 'bottom') => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Connection node clicked:', { 
      boardId: board.id, 
      side, 
      isConnectorMode, 
      currentState: connectorEditState 
    });
    
    if (!isConnectorMode) return;
    
    if (!connectorEditState.sourceBoardId) {
      console.log('Setting source board:', board.id);
      onSelectSourceBoard(board.id);
    } else if (connectorEditState.sourceBoardId !== board.id && !connectorEditState.targetBoardId) {
      console.log('Setting target board:', board.id);
      onSelectTargetBoard(board.id);
    } else {
      console.log('Connection conditions not met:', {
        sourceBoardId: connectorEditState.sourceBoardId,
        targetBoardId: connectorEditState.targetBoardId,
        currentBoardId: board.id
      });
    }
  }, [isConnectorMode, connectorEditState, onSelectSourceBoard, onSelectTargetBoard, board.id]);

  // Handle title editing
  const handleTitleSubmit = useCallback(async () => {
    if (tempTitle.trim() && tempTitle !== board.title) {
      try {
        await updateBoard(board.id, { title: tempTitle.trim() });
      } catch (error) {
        console.error('Failed to update board title:', error);
        setTempTitle(board.title);
      }
    }
    setIsEditingTitle(false);
  }, [tempTitle, board.title, board.id, updateBoard]);

  const handleTitleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleTitleSubmit();
    } else if (event.key === 'Escape') {
      setTempTitle(board.title);
      setIsEditingTitle(false);
    }
  }, [handleTitleSubmit, board.title]);

  // Handle board deletion
  const handleDeleteBoard = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${board.title}"? This will also delete all bookmarks in this board.`)) {
      try {
        await deleteBoard(board.id);
      } catch (error) {
        console.error('Failed to delete board:', error);
      }
    }
  }, [board.id, board.title, deleteBoard]);

  // Handle adding new bookmark
  const handleAddBookmark = useCallback(async () => {
    try {
      const title = `Bookmark ${bookmarks.length + 1}`;
      await createBookmark(board.id, title);
    } catch (error) {
      console.error('Failed to create bookmark:', error);
    }
  }, [board.id, bookmarks.length, createBookmark]);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div
      ref={boardRef}
      className={`absolute select-none ${isDragging ? 'z-50' : 'z-10'}`}
      style={{
        left: board.position.x,
        top: board.position.y,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease'
      }}
    >
      {/* Connection Nodes */}
      {isConnectorMode && (
        <>
          {/* Left connection node */}
          <div
            className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-pointer hover:bg-blue-600 shadow-lg z-20"
            onClick={(e) => handleConnectionNodeClick(e, 'left')}
            title="Connect from left side"
          />
          
          {/* Right connection node */}
          <div
            className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-pointer hover:bg-blue-600 shadow-lg z-20"
            onClick={(e) => handleConnectionNodeClick(e, 'right')}
            title="Connect from right side"
          />
          
          {/* Top connection node */}
          <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-pointer hover:bg-blue-600 shadow-lg z-20"
            onClick={(e) => handleConnectionNodeClick(e, 'top')}
            title="Connect from top"
          />
          
          {/* Bottom connection node */}
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-pointer hover:bg-blue-600 shadow-lg z-20"
            onClick={(e) => handleConnectionNodeClick(e, 'bottom')}
            title="Connect from bottom"
          />
        </>
      )}

      <Card 
        className={`
          w-80 min-h-96 max-h-[600px] flex flex-col
          border-2 border-dashed border-gray-300 
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'bg-white'}
          ${isConnectorMode ? 'cursor-pointer hover:border-blue-400' : ''}
          ${isDragging ? 'shadow-lg' : 'shadow-md'}
          transition-all duration-200
        `}
      >
        {/* Board Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            {/* Drag Handle */}
            <div 
              className="cursor-move p-1 rounded hover:bg-gray-100"
              onMouseDown={handleMouseDown}
              title="Drag to move board"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            {/* Board Actions */}
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingTitle(true)}
                title="Edit title"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteBoard}
                title="Delete board"
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Board Title */}
          {isEditingTitle ? (
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              className="text-lg font-semibold"
              autoFocus
            />
          ) : (
            <h3 
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={() => setIsEditingTitle(true)}
            >
              {board.title}
            </h3>
          )}

          {/* Timestamp */}
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Calendar className="h-3 w-3 mr-1" />
            {formatTimestamp(board.timestamp)}
          </div>
        </div>

        {/* Bookmarks Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-sm text-gray-600">
                <FolderOpen className="h-4 w-4 mr-1" />
                Bookmarks ({bookmarks.length})
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddBookmark}
                title="Add bookmark"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bookmark List */}
          <div className="flex-1 px-4 pb-4">
            <BookmarkList 
              bookmarks={bookmarks}
              boardId={board.id}
              isConnectorMode={isConnectorMode}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}; 