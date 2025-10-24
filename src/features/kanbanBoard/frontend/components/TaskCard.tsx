import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface TaskCardProps {
  id: string;
  title: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ id, title }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group relative rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 select-none"
    >
      {/* gradient border on hover */}
      <div className="absolute inset-0 rounded-xl pointer-events-none group-hover:border-2 group-hover:border-indigo-500 group-hover:shadow-indigo-200/50" />

      <div className="p-3 flex items-start space-x-2 relative z-10">
        <GripVertical
          {...listeners}
          className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
        <p className="text-sm font-medium text-gray-900 truncate flex-1">
          {title}
        </p>
      </div>
    </div>
  );
}; 