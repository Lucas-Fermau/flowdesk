import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { requireWorkspaceMember } from '../middleware/auth';
import { inviteMemberSchema, workspaceSchema } from '../schemas';
import { emitToUser } from '../lib/socket';

export const workspacesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const memberships = await prisma.workspaceMember.findMany({
        where: { userId: req.userId },
        include: {
          workspace: {
            include: {
              _count: { select: { projects: true, members: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      const workspaces = memberships.map((m) => ({
        ...m.workspace,
        myRole: m.role,
      }));
      res.json({ workspaces });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = workspaceSchema.parse(req.body);
      const workspace = await prisma.workspace.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: req.userId!,
          members: {
            create: { userId: req.userId!, role: 'owner' },
          },
        },
        include: { _count: { select: { projects: true, members: true } } },
      });
      res.status(201).json({ workspace: { ...workspace, myRole: 'owner' } });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await requireWorkspaceMember(req.params.id, req.userId!);
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.params.id },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          projects: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      if (!workspace) throw new HttpError(404, 'Workspace não encontrado');
      res.json({ workspace: { ...workspace, myRole: member.role } });
    } catch (err) {
      next(err);
    }
  },

  async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await requireWorkspaceMember(req.params.id, req.userId!, [
        'owner',
        'admin',
      ]);
      const data = inviteMemberSchema.parse(req.body);

      const invitee = await prisma.user.findUnique({ where: { email: data.email } });
      if (!invitee) {
        throw new HttpError(
          404,
          'Usuário não encontrado. O convidado precisa estar cadastrado.'
        );
      }

      const existing = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: req.params.id, userId: invitee.id } },
      });
      if (existing) throw new HttpError(409, 'Usuário já é membro do workspace');

      const newMember = await prisma.workspaceMember.create({
        data: {
          workspaceId: req.params.id,
          userId: invitee.id,
          role: data.role,
        },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      });

      const workspace = await prisma.workspace.findUnique({ where: { id: req.params.id } });

      const notification = await prisma.notification.create({
        data: {
          userId: invitee.id,
          type: 'workspace_invite',
          content: `Você foi adicionado ao workspace "${workspace?.name}"`,
          link: `/workspaces/${req.params.id}`,
        },
      });

      emitToUser(invitee.id, 'notification:new', notification);
      void member;
      res.status(201).json({ member: newMember });
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      await requireWorkspaceMember(req.params.id, req.userId!, ['owner', 'admin']);
      const target = await prisma.workspaceMember.findUnique({
        where: { id: req.params.memberId },
      });
      if (!target || target.workspaceId !== req.params.id) {
        throw new HttpError(404, 'Membro não encontrado');
      }
      if (target.role === 'owner') {
        throw new HttpError(400, 'Não é possível remover o dono do workspace');
      }
      await prisma.workspaceMember.delete({ where: { id: req.params.memberId } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
