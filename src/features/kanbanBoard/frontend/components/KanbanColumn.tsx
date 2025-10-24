import React from 'react';
import {
  DndContext,
  closestCenter,
  useSensor,
  PointerSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useKanbanStore } from '../hooks/useKanbanStore';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  columnId: string;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ columnId }) => {
  const { columns, tasks, moveTask } = useKanbanStore();
  const column = columns.find((c) => c.id === columnId)!;

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    if (active.id === over.id) return;

    const overIndex = column.taskIds.findIndex((id) => id === over.id);
    moveTask(active.id as string, columnId, overIndex);
  };

  return (
    <div className="w-80 shrink-0 px-2">
      <div className="rounded-2xl bg-gradient-to-t from-white to-gray-50 border border-gray-200 p-4 shadow-xl">
        {/* Column header */}
        <h3 className="font-audiowide text-lg text-gray-800 mb-4">{column.title}</h3>

        {/* Task list */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={column.taskIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              {column.taskIds.map((taskId) => (
                <TaskCard key={taskId} id={taskId} title={tasks[taskId].title} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}; 