import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { requireWorkspaceMember } from '../middleware/auth';
import { taskSchema, taskMoveSchema, taskUpdateSchema } from '../schemas';
import { emitToProject, emitToUser } from '../lib/socket';

async function loadColumnWithProject(columnId: string) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { project: true },
  });
  if (!column) throw new HttpError(404, 'Coluna não encontrada');
  return column;
}

async function loadTaskWithContext(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      column: { include: { project: true } },
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });
  if (!task) throw new HttpError(404, 'Tarefa não encontrada');
  return task;
}

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, avatar: true } },
  _count: { select: { comments: true } },
} as const;

export const tasksController = {
  async listByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.projectId },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: {
              tasks: {
                orderBy: { position: 'asc' },
                include: taskInclude,
              },
            },
          },
        },
      });
      if (!project) throw new HttpError(404, 'Projeto não encontrado');
      await requireWorkspaceMember(project.workspaceId, req.userId!);
      res.json({ columns: project.columns });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = taskSchema.parse(req.body);
      const column = await loadColumnWithProject(data.columnId);
      await requireWorkspaceMember(column.project.workspaceId, req.userId!);

      const last = await prisma.task.findFirst({
        where: { columnId: data.columnId },
        orderBy: { position: 'desc' },
      });

      const task = await prisma.task.create({
        data: {
          columnId: data.columnId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          assignedTo: data.assignedTo ?? null,
          createdBy: req.userId!,
          position: last ? last.position + 1 : 0,
        },
        include: taskInclude,
      });

      if (task.assignedTo && task.assignedTo !== req.userId) {
        const notification = await prisma.notification.create({
          data: {
            userId: task.assignedTo,
            type: 'task_assigned',
            content: `Você foi atribuído à tarefa "${task.title}"`,
            link: `/projects/${column.projectId}`,
          },
        });
        emitToUser(task.assignedTo, 'notification:new', notification);
      }

      emitToProject(column.projectId, 'task:created', { columnId: data.columnId, task });
      res.status(201).json({ task });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await loadTaskWithContext(req.params.id);
      await requireWorkspaceMember(existing.column.project.workspaceId, req.userId!);
      const data = taskUpdateSchema.parse(req.body);

      const previousAssignee = existing.assignedTo;
      const task = await prisma.task.update({
        where: { id: req.params.id },
        data: {
          ...data,
          dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
        },
        include: taskInclude,
      });

      if (
        task.assignedTo &&
        task.assignedTo !== previousAssignee &&
        task.assignedTo !== req.userId
      ) {
        const notification = await prisma.notification.create({
          data: {
            userId: task.assignedTo,
            type: 'task_assigned',
            content: `Você foi atribuído à tarefa "${task.title}"`,
            link: `/projects/${existing.column.projectId}`,
          },
        });
        emitToUser(task.assignedTo, 'notification:new', notification);
      }

      emitToProject(existing.column.projectId, 'task:updated', task);
      res.json({ task });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await loadTaskWithContext(req.params.id);
      await requireWorkspaceMember(existing.column.project.workspaceId, req.userId!, [
        'owner',
        'admin',
        'manager',
      ]);
      await prisma.task.delete({ where: { id: req.params.id } });
      emitToProject(existing.column.projectId, 'task:deleted', {
        id: existing.id,
        columnId: existing.columnId,
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async move(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await loadTaskWithContext(req.params.id);
      await requireWorkspaceMember(existing.column.project.workspaceId, req.userId!);
      const data = taskMoveSchema.parse(req.body);

      const targetColumn = await loadColumnWithProject(data.columnId);
      if (targetColumn.projectId !== existing.column.projectId) {
        throw new HttpError(400, 'Coluna pertence a outro projeto');
      }

      const sourceColumnId = existing.columnId;
      const targetColumnId = data.columnId;
      const targetPosition = data.position;

      // Re-position siblings using transactions
      await prisma.$transaction(async (tx) => {
        if (sourceColumnId === targetColumnId) {
          // Same column reorder
          const peers = await tx.task.findMany({
            where: { columnId: sourceColumnId, NOT: { id: existing.id } },
            orderBy: { position: 'asc' },
          });
          peers.splice(targetPosition, 0, existing as never);
          await Promise.all(
            peers.map((t, idx) =>
              tx.task.update({ where: { id: t.id }, data: { position: idx, columnId: targetColumnId } })
            )
          );
        } else {
          // Moving across columns
          const targetPeers = await tx.task.findMany({
            where: { columnId: targetColumnId },
            orderBy: { position: 'asc' },
          });
          targetPeers.splice(targetPosition, 0, existing as never);
          await Promise.all(
            targetPeers.map((t, idx) =>
              tx.task.update({
                where: { id: t.id },
                data: { position: idx, columnId: targetColumnId },
              })
            )
          );
          // Re-pack source column
          const sourcePeers = await tx.task.findMany({
            where: { columnId: sourceColumnId, NOT: { id: existing.id } },
            orderBy: { position: 'asc' },
          });
          await Promise.all(
            sourcePeers.map((t, idx) =>
              tx.task.update({ where: { id: t.id }, data: { position: idx } })
            )
          );
        }
      });

      const moved = await prisma.task.findUnique({
        where: { id: existing.id },
        include: taskInclude,
      });

      emitToProject(existing.column.projectId, 'task:moved', {
        taskId: existing.id,
        sourceColumnId,
        targetColumnId,
        position: targetPosition,
      });

      res.json({ task: moved });
    } catch (err) {
      next(err);
    }
  },
};
