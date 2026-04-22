import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';

export const notificationsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      const unread = await prisma.notification.count({
        where: { userId: req.userId, read: false },
      });
      res.json({ notifications, unread });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const target = await prisma.notification.findUnique({ where: { id: req.params.id } });
      if (!target || target.userId !== req.userId) {
        throw new HttpError(404, 'Notificação não encontrada');
      }
      const notification = await prisma.notification.update({
        where: { id: req.params.id },
        data: { read: true },
      });
      res.json({ notification });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.userId, read: false },
        data: { read: true },
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
