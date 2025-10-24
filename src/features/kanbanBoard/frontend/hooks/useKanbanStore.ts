import { create } from 'zustand';

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  taskIds: string[];
}

interface KanbanState {
  columns: KanbanColumn[];
  tasks: Record<string, KanbanTask>;
  moveTask: (taskId: string, toColumnId: string, index: number) => void;
}

export const useKanbanStore = create<KanbanState>((set) => ({
  // Initial demo data
  columns: [
    { id: 'todo', title: 'To-Do', taskIds: ['t1', 't2'] },
    { id: 'inprogress', title: 'In Progress', taskIds: ['t3'] },
    { id: 'done', title: 'Done', taskIds: [] },
  ],
  tasks: {
    t1: { id: 't1', title: 'Design landing page' },
    t2: { id: 't2', title: 'Write marketing copy' },
    t3: { id: 't3', title: 'Set up CI pipeline' },
  },
  moveTask: (taskId, toColumnId, index) =>
    set((state) => {
      // Remove from any column
      const sourceCol = state.columns.find((c) => c.taskIds.includes(taskId));
      if (sourceCol) {
        sourceCol.taskIds = sourceCol.taskIds.filter((id) => id !== taskId);
      }
      // Insert into target
      const targetCol = state.columns.find((c) => c.id === toColumnId);
      if (targetCol) {
        targetCol.taskIds.splice(index, 0, taskId);
      }
      return { columns: [...state.columns] };
    }),
}));    