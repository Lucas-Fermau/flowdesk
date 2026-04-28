'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/endpoints';
import { useSocketEvent } from '@/hooks/useSocket';
import { cn, formatRelative } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';
import type { Notification } from '@/types';

export function NotificationDropdown() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  useSocketEvent({
    event: 'notification:new',
    callback: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const notifications: Notification[] = data?.notifications ?? [];
  const unread = data?.unread ?? 0;

  const markAll = async () => {
    await notificationsApi.markAllAsRead();
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markOne = async (id: string) => {
    await notificationsApi.markAsRead(id);
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificações"
        className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl animate-scale-in dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold tracking-tight">Notificações</h3>
            {unread > 0 ? (
              <button
                onClick={markAll}
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Marcar todas
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma notificação ainda.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((n) => (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => {
                          if (!n.read) markOne(n.id);
                          setOpen(false);
                        }}
                        className={cn(
                          'block px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                          !n.read && 'bg-brand-50/50 dark:bg-brand-500/5'
                        )}
                      >
                        <NotificationItem n={n} />
                      </Link>
                    ) : (
                      <div
                        className={cn(
                          'px-4 py-3',
                          !n.read && 'bg-brand-50/50 dark:bg-brand-500/5'
                        )}
                      >
                        <NotificationItem n={n} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationItem({ n }: { n: Notification }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/15">
        <Check className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
      </div>
      <div className="flex-1 text-sm">
        <p className="font-medium leading-snug">{n.content}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {formatRelative(n.createdAt)}
        </p>
      </div>
    </div>
  );
}
