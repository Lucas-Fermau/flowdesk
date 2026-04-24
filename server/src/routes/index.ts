import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { workspacesController } from '../controllers/workspaces.controller';
import { projectsController } from '../controllers/projects.controller';
import { columnsController } from '../controllers/columns.controller';
import { tasksController } from '../controllers/tasks.controller';
import { commentsController } from '../controllers/comments.controller';
import { notificationsController } from '../controllers/notifications.controller';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

export const router = Router();

// Auth (public + protected)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);
router.get('/auth/me', authenticate, authController.me);
router.post('/auth/logout', authenticate, authController.logout);

// Everything below requires authentication
router.use(authenticate);

// Workspaces
router.get('/workspaces', workspacesController.list);
router.post('/workspaces', workspacesController.create);
router.get('/workspaces/:id', workspacesController.getById);
router.post('/workspaces/:id/invite', workspacesController.invite);
router.delete('/workspaces/:id/member/:memberId', workspacesController.removeMember);

// Projects
router.get('/projects/:workspaceId', projectsController.listByWorkspace);
router.post('/projects', projectsController.create);
router.get('/projects/single/:id', projectsController.getById);
router.put('/projects/:id', projectsController.update);
router.delete('/projects/:id', projectsController.remove);

// Columns
router.post('/columns', columnsController.create);
router.put('/columns/:id', columnsController.update);
router.delete('/columns/:id', columnsController.remove);

// Tasks
router.get('/tasks/:projectId', tasksController.listByProject);
router.post('/tasks', tasksController.create);
router.put('/tasks/:id', tasksController.update);
router.delete('/tasks/:id', tasksController.remove);
router.patch('/tasks/:id/move', tasksController.move);

// Comments
router.post('/comments', commentsController.create);
router.get('/comments/:taskId', commentsController.listByTask);

// Notifications
router.get('/notifications', notificationsController.list);
router.patch('/notifications/:id/read', notificationsController.markAsRead);
router.patch('/notifications/read-all', notificationsController.markAllAsRead);

// Dashboard
router.get('/dashboard/overview', dashboardController.overview);
