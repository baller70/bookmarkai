import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Folder as FolderIcon, GripVertical } from 'lucide-react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
}

export interface BookmarkBoardData {
  label: string;
  bookmarks: BookmarkItem[];
  logo?: string; // optional background logo url
  updateBookmarks?: (items: BookmarkItem[]) => void;
  onBookmarkClick?: (bookmark: BookmarkItem) => void;
}

const SortableBookmarkRow: React.FC<{ item: BookmarkItem; onBookmarkClick?: (bookmark: BookmarkItem) => void }> = ({ item, onBookmarkClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging and not clicking the drag handle
    if (!isDragging && onBookmarkClick) {
      e.stopPropagation();
      onBookmarkClick(item);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only stop propagation if we're actually dragging via the grip handle
    // This allows React Flow to handle node dragging when clicking elsewhere
    const target = e.target as HTMLElement;
    const isGripHandle = target.closest('[data-grip-handle]');
    if (isGripHandle) {
      e.stopPropagation();
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center space-x-2 py-1 px-2 rounded-lg hover:bg-gray-100 cursor-pointer"
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {/* drag handle */}
      <GripVertical
        {...listeners}
        data-grip-handle="true"
        className="h-4 w-4 text-gray-500 flex-shrink-0 cursor-grab active:cursor-grabbing" />

      {/* favicon letter box */}
      <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center text-[10px] font-bold ring-1 ring-gray-300">
        {item.title.charAt(0).toUpperCase()}
      </div>

      {/* title */}
      <span className="truncate flex-1 text-sm font-medium text-gray-900 uppercase">
        {item.title}
      </span>
    </li>
  );
};

export const BoardNode: React.FC<NodeProps<BookmarkBoardData>> = ({ data, selected }) => {
  const { label, bookmarks, logo, updateBookmarks, onBookmarkClick } = data;

  // Configure sensors with activation distance to reduce conflicts
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before activating drag
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
    const newIndex = bookmarks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(bookmarks, oldIndex, newIndex);
    updateBookmarks?.(newOrder);
  };

  return (
    <div
      className={`w-80 h-80 rounded-xl border-2 relative overflow-hidden select-none shadow-md bg-white transition-colors ${
        selected ? 'border-blue-500' : 'border-gray-300'
      }`}
    >
      {/* faint background logo */}
      {logo && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${logo})`, opacity: 0.05 }}
        />
      )}

      {/* content */}
      <div className="p-3 h-full flex flex-col justify-between relative z-10">
        {/* top icon + title */}
        <div>
          <FolderIcon className="h-12 w-12 text-blue-600 mb-2" />
          <h3 className="font-bold text-gray-900 uppercase text-sm truncate">
            {label}
          </h3>
        </div>

        {/* bookmark list draggable */}
        <div className="mt-2 flex-1 overflow-y-auto pr-1">
          {bookmarks.length === 0 ? (
            <p className="text-xs italic text-gray-400">No bookmarks yet</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={bookmarks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1">
                  {bookmarks.slice(0, 10).map((item) => (
                    <SortableBookmarkRow key={item.id} item={item} onBookmarkClick={onBookmarkClick} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* React Flow handles - Made bigger and more visible */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-10 h-10 bg-blue-500 border-4 border-white rounded-full z-20 shadow-lg hover:bg-blue-600 hover:scale-110 transition-all duration-200" 
        style={{ top: -20 }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-10 h-10 bg-blue-500 border-4 border-white rounded-full z-20 shadow-lg hover:bg-blue-600 hover:scale-110 transition-all duration-200" 
        style={{ bottom: -20 }}
      />
    </div>
  );
}; 