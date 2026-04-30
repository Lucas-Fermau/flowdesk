'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Users,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { dashboardApi } from '@/services/endpoints';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { ProductivityChart } from '@/components/dashboard/DashboardCharts';
import { formatRelative, cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.overview(),
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const cards: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
  }> = [
    {
      label: 'Total de tarefas',
      value: data.stats.totalTasks,
      icon: ListTodo,
      iconBg: 'bg-brand-100 dark:bg-brand-500/15',
      iconColor: 'text-brand-600 dark:text-brand-400',
    },
    {
      label: 'Concluídas',
      value: data.stats.completedTasks,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Atrasadas',
      value: data.stats.overdueTasks,
      icon: AlertTriangle,
      iconBg: 'bg-red-100 dark:bg-red-500/15',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Atribuídas a mim',
      value: data.stats.myAssignedTasks,
      icon: UserCheck,
      iconBg: 'bg-amber-100 dark:bg-amber-500/15',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Projetos',
      value: data.stats.totalProjects,
      icon: Briefcase,
      iconBg: 'bg-violet-100 dark:bg-violet-500/15',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Workspaces',
      value: data.stats.totalWorkspaces,
      icon: Users,
      iconBg: 'bg-cyan-100 dark:bg-cyan-500/15',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
  ];

  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Olá, <span className="gradient-text">{firstName}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Aqui está um panorama do que está acontecendo nas suas equipes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {c.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">
                    {c.value}
                  </p>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.iconBg}`}>
                  <Icon className={`h-4 w-4 ${c.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductivityChart data={data.productivity} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold tracking-tight">Projetos ativos</h3>
          <ul className="mt-3 space-y-2">
            {data.activeProjects.length === 0 ? (
              <li className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Nenhum projeto ativo
              </li>
            ) : (
              data.activeProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="group flex items-center justify-between rounded-lg p-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      {p.dueDate ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Vence {new Date(p.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold tracking-tight">Atividade recente</h3>
        {data.recentActivity.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Sem atividade recente
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentActivity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  {a.assignee ? (
                    <Avatar name={a.assignee.name} src={a.assignee.avatar} size="sm" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                      ?
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <Link
                        href={`/projects/${a.project.id}`}
                        className="hover:underline"
                      >
                        {a.project.name}
                      </Link>
                      {' · '}
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                          a.column === 'Concluído'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        )}
                      >
                        {a.column}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatRelative(a.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
