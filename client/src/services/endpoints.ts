import { apiFetch } from './api';
import type {
  AuthResponse,
  Column,
  Comment,
  DashboardOverview,
  Notification,
  Project,
  Task,
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    }),
  register: (name: string, email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
      skipAuth: true,
    }),
  me: () => apiFetch<{ user: User }>('/auth/me'),
  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
};

export const workspacesApi = {
  list: () => apiFetch<{ workspaces: Workspace[] }>('/workspaces'),
  create: (data: { name: string; description?: string }) =>
    apiFetch<{ workspace: Workspace }>('/workspaces', { method: 'POST', body: data }),
  getById: (id: string) => apiFetch<{ workspace: Workspace }>(`/workspaces/${id}`),
  invite: (id: string, email: string, role: WorkspaceRole) =>
    apiFetch<{ member: WorkspaceMember }>(`/workspaces/${id}/invite`, {
      method: 'POST',
      body: { email, role },
    }),
  removeMember: (id: string, memberId: string) =>
    apiFetch<void>(`/workspaces/${id}/member/${memberId}`, { method: 'DELETE' }),
};

export const projectsApi = {
  listByWorkspace: (workspaceId: string) =>
    apiFetch<{ projects: Project[] }>(`/projects/${workspaceId}`),
  getById: (id: string) => apiFetch<{ project: Project }>(`/projects/single/${id}`),
  create: (data: {
    workspaceId: string;
    name: string;
    description?: string;
    dueDate?: string | null;
  }) => apiFetch<{ project: Project }>('/projects', { method: 'POST', body: data }),
  update: (id: string, data: Partial<{ name: string; description: string | null; status: string; dueDate: string | null }>) =>
    apiFetch<{ project: Project }>(`/projects/${id}`, { method: 'PUT', body: data }),
  remove: (id: string) => apiFetch<void>(`/projects/${id}`, { method: 'DELETE' }),
};

export const columnsApi = {
  create: (data: { projectId: string; name: string }) =>
    apiFetch<{ column: Column }>('/columns', { method: 'POST', body: data }),
  update: (id: string, data: Partial<{ name: string; order: number }>) =>
    apiFetch<{ column: Column }>(`/columns/${id}`, { method: 'PUT', body: data }),
  remove: (id: string) => apiFetch<void>(`/columns/${id}`, { method: 'DELETE' }),
};

export const tasksApi = {
  listByProject: (projectId: string) =>
    apiFetch<{ columns: Column[] }>(`/tasks/${projectId}`),
  create: (data: {
    columnId: string;
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string | null;
    assignedTo?: string | null;
  }) => apiFetch<{ task: Task }>('/tasks', { method: 'POST', body: data }),
  update: (id: string, data: Partial<{ title: string; description: string | null; priority: string; dueDate: string | null; assignedTo: string | null }>) =>
    apiFetch<{ task: Task }>(`/tasks/${id}`, { method: 'PUT', body: data }),
  remove: (id: string) => apiFetch<void>(`/tasks/${id}`, { method: 'DELETE' }),
  move: (id: string, columnId: string, position: number) =>
    apiFetch<{ task: Task }>(`/tasks/${id}/move`, {
      method: 'PATCH',
      body: { columnId, position },
    }),
};

export const commentsApi = {
  byTask: (taskId: string) =>
    apiFetch<{ comments: Comment[] }>(`/comments/${taskId}`),
  create: (taskId: string, content: string) =>
    apiFetch<{ comment: Comment }>('/comments', {
      method: 'POST',
      body: { taskId, content },
    }),
};

export const notificationsApi = {
  list: () =>
    apiFetch<{ notifications: Notification[]; unread: number }>('/notifications'),
  markAsRead: (id: string) =>
    apiFetch<{ notification: Notification }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllAsRead: () => apiFetch<void>('/notifications/read-all', { method: 'PATCH' }),
};

export const dashboardApi = {
  overview: () => apiFetch<DashboardOverview>('/dashboard/overview'),
};
