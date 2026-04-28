'use client';

import { useRouter } from 'next/navigation';
import { Moon, Sun, LogOut, Workflow } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Avatar } from '../ui/Avatar';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { disconnectSocket } from '@/hooks/useSocket';

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggle } = useThemeStore();
  const router = useRouter();

  const handleLogout = async () => {
    disconnectSocket();
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80 sm:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white">
          <Workflow className="h-4 w-4" />
        </div>
        <span className="font-bold tracking-tight">FlowDesk</span>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          aria-label="Alternar tema"
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <NotificationDropdown />

        {user ? (
          <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-800">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{user.role}</div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Sair"
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
