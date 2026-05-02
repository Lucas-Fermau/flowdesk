'use client';

import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import type { Column, Task } from '@/types';

interface Props {
  column: Column;
  onCreateTask: (columnId: string) => void;
  onTaskClick: (task: Task) => void;
}

export function KanbanColumn({ column, onCreateTask, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  const tasks = column.tasks ?? [];

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">{column.name}</h3>
          <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onCreateTask(column.id)}
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Adicionar tarefa"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto rounded-lg border bg-slate-100/50 p-2 transition-colors dark:bg-slate-900/40 ${
          isOver
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-500">
              Sem tarefas
            </div>
          ) : (
            tasks.map((t) => <TaskCard key={t.id} task={t} onClick={onTaskClick} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}
