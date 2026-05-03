'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { commentsApi, tasksApi } from '@/services/endpoints';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/services/api';
import { useSocketEvent } from '@/hooks/useSocket';
import { formatRelative } from '@/utils/cn';
import type { Task, WorkspaceMember } from '@/types';

interface Props {
  task: Task | null;
  members: WorkspaceMember[];
  projectId: string;
  onClose: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function TaskDetailModal({ task, members, projectId, onClose, canEdit, canDelete }: Props) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<string | ''>('');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
      setAssignedTo(task.assignedTo ?? '');
    }
  }, [task]);

  const { data: commentsData } = useQuery({
    queryKey: ['comments', task?.id],
    queryFn: () => commentsApi.byTask(task!.id),
    enabled: !!task,
  });

  useSocketEvent({
    event: 'comment:new',
    callback: (payload: unknown) => {
      const p = payload as { taskId: string };
      if (p.taskId === task?.id) {
        qc.invalidateQueries({ queryKey: ['comments', task?.id] });
      }
    },
    enabled: !!task,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      tasksApi.update(task!.id, {
        title,
        description: description || null,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assignedTo: assignedTo || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-board', projectId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Tarefa atualizada');
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.remove(task!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-board', projectId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Tarefa excluída');
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro'),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.create(task!.id, content),
    onSuccess: () => {
      setCommentText('');
      qc.invalidateQueries({ queryKey: ['comments', task?.id] });
      qc.invalidateQueries({ queryKey: ['project-board', projectId] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro'),
  });

  if (!task) return null;

  const comments = commentsData?.comments ?? [];

  return (
    <Modal open={!!task} onClose={onClose} title="Detalhes da tarefa" size="xl">
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
          />
          <Textarea
            label="Descrição"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
          />

          <div className="rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Comentários ({comments.length})
            </div>
            <ul className="max-h-72 space-y-3 overflow-y-auto p-4">
              {comments.length === 0 ? (
                <li className="text-center text-xs text-slate-500 dark:text-slate-400">
                  Sem comentários ainda. Seja o primeiro!
                </li>
              ) : (
                comments.map((c) => (
                  <li key={c.id} className="flex gap-2.5">
                    <Avatar name={c.user.name} src={c.user.avatar} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{c.user.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatRelative(c.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
                        {c.content}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <div className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) commentMutation.mutate(commentText);
                }}
                placeholder="Escreva um comentário..."
                className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950"
              />
              <Button
                size="sm"
                disabled={!commentText.trim()}
                loading={commentMutation.isPending}
                onClick={() => commentMutation.mutate(commentText)}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <Select
            label="Responsável"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            disabled={!canEdit}
          >
            <option value="">Não atribuído</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name}
              </option>
            ))}
          </Select>
          <Select
            label="Prioridade"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Task['priority'])}
            disabled={!canEdit}
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </Select>
          <Input
            label="Prazo"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={!canEdit}
          />

          <div className="space-y-2 pt-2">
            {canEdit ? (
              <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending} className="w-full">
                Salvar alterações
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Excluir "${task.title}"?`)) deleteMutation.mutate();
                }}
                className="w-full"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            ) : null}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
