import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const CONCLUIDO_NAMES = ['Concluído', 'Concluido', 'Done', 'Completed'];

export const dashboardController = {
  async overview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const memberships = await prisma.workspaceMember.findMany({
        where: { userId },
        select: { workspaceId: true },
      });
      const workspaceIds = memberships.map((m) => m.workspaceId);

      const projects = await prisma.project.findMany({
        where: { workspaceId: { in: workspaceIds } },
        select: { id: true, name: true, status: true, dueDate: true, workspaceId: true },
      });
      const projectIds = projects.map((p) => p.id);

      const allColumns = await prisma.column.findMany({
        where: { projectId: { in: projectIds } },
        select: { id: true, name: true, projectId: true },
      });
      const doneColumnIds = allColumns
        .filter((c) => CONCLUIDO_NAMES.includes(c.name))
        .map((c) => c.id);
      const allColumnIds = allColumns.map((c) => c.id);

      const [totalTasks, completedTasks, overdueTasks, myAssignedTasks] = await Promise.all([
        prisma.task.count({ where: { columnId: { in: allColumnIds } } }),
        prisma.task.count({ where: { columnId: { in: doneColumnIds } } }),
        prisma.task.count({
          where: {
            columnId: { in: allColumnIds },
            NOT: { columnId: { in: doneColumnIds } },
            dueDate: { lt: new Date() },
          },
        }),
        prisma.task.count({ where: { assignedTo: userId } }),
      ]);

      // Productivity for last 7 days (tasks created per day)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const recentTasks = await prisma.task.findMany({
        where: {
          columnId: { in: allColumnIds },
          createdAt: { gte: sevenDaysAgo },
        },
        select: { createdAt: true },
      });

      const productivity: Array<{ date: string; created: number }> = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(sevenDaysAgo.getDate() + i);
        const dateKey = d.toISOString().slice(0, 10);
        const count = recentTasks.filter(
          (t) => t.createdAt.toISOString().slice(0, 10) === dateKey
        ).length;
        productivity.push({ date: dateKey, created: count });
      }

      const recentActivity = await prisma.task.findMany({
        where: { columnId: { in: allColumnIds } },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        include: {
          column: { select: { name: true, project: { select: { id: true, name: true } } } },
          assignee: { select: { name: true, avatar: true } },
        },
      });

      const activeProjects = projects
        .filter((p) => p.status === 'active')
        .slice(0, 6);

      res.json({
        stats: {
          totalTasks,
          completedTasks,
          overdueTasks,
          myAssignedTasks,
          totalProjects: projects.length,
          totalWorkspaces: workspaceIds.length,
        },
        productivity,
        recentActivity: recentActivity.map((t) => ({
          id: t.id,
          title: t.title,
          updatedAt: t.updatedAt,
          column: t.column.name,
          project: t.column.project,
          assignee: t.assignee,
        })),
        activeProjects,
      });
    } catch (err) {
      next(err);
    }
  },
};
