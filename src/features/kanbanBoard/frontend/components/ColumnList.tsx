import React from 'react';
import { useKanbanStore } from '../hooks/useKanbanStore';
import { KanbanColumn } from './KanbanColumn';

export const ColumnList: React.FC = () => {
  const { columns } = useKanbanStore();

  return (
    <div className="flex items-start space-x-4 overflow-x-auto pb-4 custom-scrollbar">
      {columns.map((col) => (
        <KanbanColumn key={col.id} columnId={col.id} />
      ))}
    </div>
  );
}; 