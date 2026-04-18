import { z } from 'zod';

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const PROJECT_STATUSES = ['active', 'paused', 'archived'] as const;
export const WORKSPACE_ROLES = ['owner', 'admin', 'manager', 'member'] as const;

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const workspaceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'member']).default('member'),
});

export const projectSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(PROJECT_STATUSES).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const columnSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(80),
  order: z.number().int().min(0).optional(),
});

export const columnUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  order: z.number().int().min(0).optional(),
});

export const taskSchema = z.object({
  columnId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
});

export const taskMoveSchema = z.object({
  columnId: z.string().min(1),
  position: z.number().int().min(0),
});

export const commentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().min(1).max(2000),
});
