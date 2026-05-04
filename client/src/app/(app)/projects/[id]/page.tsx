'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCenter,
} from '@dnd-kit/core';
import { ArrowLeft } from 'lucide-react';
import { projectsApi, tasksApi, workspacesApi } from '@/services/endpoints';
import { Spinner } from '@/components/ui/Spinner';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { TaskCard } from '@/components/kanban/TaskCard';
import { TaskDetailModal } from '@/components/kanban/TaskDetailModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useSocketEvent, joinProjectRoom, leaveProjectRoom } from '@/hooks/useSocket';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/services/api';
import type { Column, Task, WorkspaceMember } from '@/types';

const newTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedTo: z.string().optional(),
});

type NewTaskValues = z.infer<typeof newTaskSchema>;

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [creatingInColumn, setCreatingInColumn] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: projectData } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id),
  });

  const { data: boardData, isLoading } = useQuery({
    queryKey: ['project-board', id],
    queryFn: () => tasksApi.listByProject(id),
  });

  const workspaceId = projectData?.project?.workspace?.id;

  const { data: workspaceData } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspacesApi.getById(workspaceId!),
    enabled: !!workspaceId,
  });

  useEffect(() => {
    joinProjectRoom(id);
    return () => leaveProjectRoom(id);
  }, [id]);

  useSocketEvent({
    event: 'task:created',
    callback: () => qc.invalidateQueries({ queryKey: ['project-board', id] }),
  });
  useSocketEvent({
    event: 'task:updated',
    callback: () => qc.invalidateQueries({ queryKey: ['project-board', id] }),
  });
  useSocketEvent({
    event: 'task:deleted',
    callback: () => qc.invalidateQueries({ queryKey: ['project-board', id] }),
  });
  useSocketEvent({
    event: 'task:moved',
    callback: () => qc.invalidateQueries({ queryKey: ['project-board', id] }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ taskId, columnId, position }: { taskId: string; columnId: string; position: number }) =>
      tasksApi.move(taskId, columnId, position),
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao mover');
      qc.invalidateQueries({ queryKey: ['project-board', id] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (input: NewTaskValues & { columnId: string }) =>
      tasksApi.create({
        columnId: input.columnId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        assignedTo: input.assignedTo || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-board', id] });
      toast.success('Tarefa criada');
      setCreatingInColumn(null);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro'),
  });

  const taskForm = useForm<NewTaskValues>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: { priority: 'medium' },
  });

  const columns: Column[] = boardData?.columns ?? [];
  const project = projectData?.project;
  const members: WorkspaceMember[] = workspaceData?.workspace?.members ?? [];
  const myRole = workspaceData?.workspace?.myRole;
  const canEdit = myRole !== undefined;
  const canDelete = myRole === 'owner' || myRole === 'admin' || myRole === 'manager';

  const tasksById = useMemo(() => {
    const map = new Map<string, Task>();
    columns.forEach((c) => c.tasks?.forEach((t) => map.set(t.id, t)));
    return map;
  }, [columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const t = tasksById.get(String(event.active.id));
    if (t) setActiveTask(t);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const draggedTask = tasksById.get(String(active.id));
    if (!draggedTask) return;

    let targetColumnId: string;
    let targetPosition: number;

    const overData = over.data.current as { type?: string; columnId?: string; task?: Task } | undefined;

    if (overData?.type === 'column') {
      targetColumnId = String(over.id);
      const col = columns.find((c) => c.id === targetColumnId);
      targetPosition = col?.tasks?.length ?? 0;
    } else if (overData?.type === 'task') {
      const overTask = overData.task!;
      targetColumnId = overTask.columnId;
      const col = columns.find((c) => c.id === targetColumnId);
      const overIdx = col?.tasks?.findIndex((t) => t.id === overTask.id) ?? 0;
      targetPosition = overIdx;
    } else {
      return;
    }

    if (
      draggedTask.columnId === targetColumnId &&
      draggedTask.position === targetPosition
    ) {
      return;
    }

    moveMutation.mutate({ taskId: draggedTask.id, columnId: targetColumnId, position: targetPosition });
  };

  const submitTask = taskForm.handleSubmit(async (values) => {
    if (!creatingInColumn) return;
    await createMutation.mutateAsync({ ...values, columnId: creatingInColumn });
    taskForm.reset({ priority: 'medium' });
  });

  if (isLoading || !project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col px-4 py-4 sm:px-6">
      <div className="mb-4">
        <Link
          href={`/workspaces/${project.workspaceId}`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {project.workspace?.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{project.name}</h1>
        {project.description ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{project.description}</p>
        ) : null}
      </div>

      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-3 pb-2">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onCreateTask={(cid) => {
                  taskForm.reset({ priority: 'medium' });
                  setCreatingInColumn(cid);
                }}
                onTaskClick={(t) => setOpenTask(t)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskDetailModal
        task={openTask}
        members={members}
        projectId={id}
        onClose={() => setOpenTask(null)}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <Modal
        open={!!creatingInColumn}
        onClose={() => setCreatingInColumn(null)}
        title="Nova tarefa"
      >
        <form onSubmit={submitTask} className="space-y-4">
          <Input
            label="Título"
            {...taskForm.register('title')}
            error={taskForm.formState.errors.title?.message}
            autoFocus
          />
          <Textarea
            label="Descrição (opcional)"
            rows={3}
            {...taskForm.register('description')}
          />
          <Select label="Prioridade" {...taskForm.register('priority')}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </Select>
          <Select label="Responsável" {...taskForm.register('assignedTo')}>
            <option value="">Não atribuído</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreatingInColumn(null)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Criar tarefa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
