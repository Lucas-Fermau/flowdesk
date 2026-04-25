export type GlobalRole = 'admin' | 'manager' | 'member';
export type WorkspaceRole = 'owner' | 'admin' | 'manager' | 'member';
export type ProjectStatus = 'active' | 'paused' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationType = 'task_assigned' | 'comment' | 'workspace_invite' | 'task_moved';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: GlobalRole;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  myRole?: WorkspaceRole;
  _count?: { projects: number; members: number };
  members?: WorkspaceMember[];
  projects?: Project[];
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  workspace?: { id: string; name: string };
  columns?: Column[];
  _count?: { columns: number };
}

export interface Column {
  id: string;
  projectId: string;
  name: string;
  order: number;
  createdAt: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  assignedTo: string | null;
  createdBy: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; name: string; email: string; avatar: string | null } | null;
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  content: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface DashboardOverview {
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    myAssignedTasks: number;
    totalProjects: number;
    totalWorkspaces: number;
  };
  productivity: Array<{ date: string; created: number }>;
  recentActivity: Array<{
    id: string;
    title: string;
    updatedAt: string;
    column: string;
    project: { id: string; name: string };
    assignee: { name: string; avatar: string | null } | null;
  }>;
  activeProjects: Array<{
    id: string;
    name: string;
    status: ProjectStatus;
    dueDate: string | null;
    workspaceId: string;
  }>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
