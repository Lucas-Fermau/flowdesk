import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { requireWorkspaceMember } from '../middleware/auth';
import { columnSchema, columnUpdateSchema } from '../schemas';

async function projectGuard(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new HttpError(404, 'Projeto não encontrado');
  await requireWorkspaceMember(project.workspaceId, userId, [
    'owner',
    'admin',
    'manager',
  ]);
  return project;
}

export const columnsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = columnSchema.parse(req.body);
      await projectGuard(data.projectId, req.userId!);
      const last = await prisma.column.findFirst({
        where: { projectId: data.projectId },
        orderBy: { order: 'desc' },
      });
      const column = await prisma.column.create({
        data: {
          projectId: data.projectId,
          name: data.name,
          order: data.order ?? (last ? last.order + 1 : 0),
        },
      });
      res.status(201).json({ column });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await prisma.column.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new HttpError(404, 'Coluna não encontrada');
      await projectGuard(existing.projectId, req.userId!);
      const data = columnUpdateSchema.parse(req.body);
      const column = await prisma.column.update({
        where: { id: req.params.id },
        data,
      });
      res.json({ column });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await prisma.column.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new HttpError(404, 'Coluna não encontrada');
      await projectGuard(existing.projectId, req.userId!);
      await prisma.column.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
