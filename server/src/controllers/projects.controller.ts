import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { requireWorkspaceMember } from '../middleware/auth';
import { projectSchema, projectUpdateSchema } from '../schemas';

const DEFAULT_COLUMNS = [
  { name: 'Backlog', order: 0 },
  { name: 'Em andamento', order: 1 },
  { name: 'Revisão', order: 2 },
  { name: 'Concluído', order: 3 },
];

export const projectsController = {
  async listByWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId;
      await requireWorkspaceMember(workspaceId, req.userId!);
      const projects = await prisma.project.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { columns: true } },
        },
      });
      res.json({ projects });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: {
          workspace: { select: { id: true, name: true } },
          columns: {
            orderBy: { order: 'asc' },
            include: {
              tasks: {
                orderBy: { position: 'asc' },
                include: {
                  assignee: {
                    select: { id: true, name: true, email: true, avatar: true },
                  },
                  _count: { select: { comments: true } },
                },
              },
            },
          },
        },
      });
      if (!project) throw new HttpError(404, 'Projeto não encontrado');
      await requireWorkspaceMember(project.workspaceId, req.userId!);
      res.json({ project });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = projectSchema.parse(req.body);
      await requireWorkspaceMember(data.workspaceId, req.userId!, [
        'owner',
        'admin',
        'manager',
      ]);
      const project = await prisma.project.create({
        data: {
          workspaceId: data.workspaceId,
          name: data.name,
          description: data.description,
          status: data.status,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          columns: { create: DEFAULT_COLUMNS },
        },
        include: { _count: { select: { columns: true } } },
      });
      res.status(201).json({ project });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new HttpError(404, 'Projeto não encontrado');
      await requireWorkspaceMember(existing.workspaceId, req.userId!, [
        'owner',
        'admin',
        'manager',
      ]);
      const data = projectUpdateSchema.parse(req.body);
      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          ...data,
          dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
        },
      });
      res.json({ project });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new HttpError(404, 'Projeto não encontrado');
      await requireWorkspaceMember(existing.workspaceId, req.userId!, [
        'owner',
        'admin',
      ]);
      await prisma.project.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
