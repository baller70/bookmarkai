// Bookmark List - Container for draggable bookmark items
'use client';

import React, { useCallback } from 'react';
import { BookmarkData } from '../models/timeline.models';
import { BookmarkListItem } from './BookmarkListItem';
import {
  DndContext,
  closestCenter,
  useSensor,
  PointerSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface BookmarkListProps {
  boardId: string;
  bookmarks: BookmarkData[];
  isConnectorMode: boolean;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({
  boardId,
  bookmarks,
  isConnectorMode
}) => {
  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle bookmark reordering within the same board
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      const oldIndex = bookmarks.findIndex(bookmark => bookmark.id === active.id);
      const newIndex = bookmarks.findIndex(bookmark => bookmark.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder bookmarks array
        const reorderedBookmarks = arrayMove(bookmarks, oldIndex, newIndex);
        
        // Here you would typically update the backend/state
        // For now, just log the reordering
        console.log('Reorder bookmarks:', { 
          boardId, 
          from: oldIndex, 
          to: newIndex,
          reorderedBookmarks: reorderedBookmarks.map(b => ({ id: b.id, title: b.title }))
        });
        
        // TODO: Implement actual bookmark reordering in the backend
        // await updateBookmarkOrder(boardId, reorderedBookmarks);
      }
    }
  }, [boardId, bookmarks]);

  if (bookmarks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        <div className="text-center">
          <p>No bookmarks yet</p>
          <p className="text-xs mt-1">Click "Add Bookmark" to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={bookmarks.map(b => b.id)} 
            strategy={verticalListSortingStrategy}
          >
            {bookmarks.map((bookmark) => (
              <BookmarkListItem
                key={bookmark.id}
                bookmark={bookmark}
                isConnectorMode={isConnectorMode}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}; 