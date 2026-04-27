'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-500', className)} />;
}

export function FullPageSpinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <Spinner />
        {label}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/60" />;
}
