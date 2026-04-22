import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { requireWorkspaceMember } from '../middleware/auth';
import { commentSchema } from '../schemas';
import { emitToProject, emitToUser } from '../lib/socket';

export const commentsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = commentSchema.parse(req.body);
      const task = await prisma.task.findUnique({
        where: { id: data.taskId },
        include: { column: { include: { project: true } } },
      });
      if (!task) throw new HttpError(404, 'Tarefa não encontrada');
      await requireWorkspaceMember(task.column.project.workspaceId, req.userId!);

      const comment = await prisma.comment.create({
        data: {
          taskId: data.taskId,
          userId: req.userId!,
          content: data.content,
        },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      });

      if (task.assignedTo && task.assignedTo !== req.userId) {
        const notification = await prisma.notification.create({
          data: {
            userId: task.assignedTo,
            type: 'comment',
            content: `Novo comentário em "${task.title}"`,
            link: `/projects/${task.column.projectId}`,
          },
        });
        emitToUser(task.assignedTo, 'notification:new', notification);
      }

      emitToProject(task.column.projectId, 'comment:new', { taskId: data.taskId, comment });
      res.status(201).json({ comment });
    } catch (err) {
      next(err);
    }
  },

  async listByTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await prisma.task.findUnique({
        where: { id: req.params.taskId },
        include: { column: { include: { project: true } } },
      });
      if (!task) throw new HttpError(404, 'Tarefa não encontrada');
      await requireWorkspaceMember(task.column.project.workspaceId, req.userId!);

      const comments = await prisma.comment.findMany({
        where: { taskId: req.params.taskId },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      });
      res.json({ comments });
    } catch (err) {
      next(err);
    }
  },
};
