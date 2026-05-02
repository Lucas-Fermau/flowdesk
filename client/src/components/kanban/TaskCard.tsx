'use client';

import { Calendar, MessageSquare } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar } from '../ui/Avatar';
import { cn, formatDate } from '@/utils/cn';
import type { Task } from '@/types';

const PRIORITY_BAR = {
  low: 'bg-slate-300 dark:bg-slate-600',
  medium: 'bg-sky-400',
  high: 'bg-amber-400',
  urgent: 'bg-red-500',
};

const PRIORITY_LABEL = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

interface Props {
  task: Task;
  onClick?: (task: Task) => void;
}

export function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(task)}
      className={cn(
        'group relative cursor-grab overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900',
        isDragging && 'ring-2 ring-brand-500'
      )}
    >
      <div className={cn('absolute left-0 top-0 h-full w-0.5', PRIORITY_BAR[task.priority])} />
      <div className="flex items-start justify-between gap-2 pl-1">
        <h4 className="line-clamp-2 text-sm font-medium leading-snug">{task.title}</h4>
        {task.assignee ? (
          <Avatar name={task.assignee.name} src={task.assignee.avatar} size="xs" />
        ) : null}
      </div>
      {task.description ? (
        <p className="mt-1 line-clamp-2 pl-1 text-xs text-slate-500 dark:text-slate-400">
          {task.description}
        </p>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2 pl-1 text-xs text-slate-500 dark:text-slate-400">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
            task.priority === 'urgent'
              ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
              : task.priority === 'high'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          )}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>
        <div className="flex items-center gap-2">
          {(task._count?.comments ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {task._count?.comments}
            </span>
          ) : null}
          {task.dueDate ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5',
                overdue && 'font-medium text-red-600 dark:text-red-400'
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
