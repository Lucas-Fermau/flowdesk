'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, User, Workflow } from 'lucide-react';
import { cn } from '@/utils/cn';

const items = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/workspaces', icon: Users, label: 'Workspaces' },
  { href: '/profile', icon: User, label: 'Perfil' },
  { href: '/settings', icon: Settings, label: 'Configurações' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5 dark:border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/30">
          <Workflow className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-bold tracking-tight">FlowDesk</div>
          <div className="-mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Gestão de equipes
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="rounded-lg bg-gradient-to-br from-brand-50 to-violet-50 p-3 text-xs dark:from-brand-500/10 dark:to-violet-500/10">
          <p className="font-semibold tracking-tight">Equipe ativa</p>
          <p className="mt-0.5 text-slate-600 dark:text-slate-400">
            Real-time com Socket.io
          </p>
        </div>
      </div>
    </aside>
  );
}
