'use client';

import Link from 'next/link';
import { Workflow } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-brand-300/40 blur-3xl dark:bg-brand-500/20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl dark:bg-violet-500/15"
      />
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lg shadow-brand-500/30">
              <Workflow className="h-6 w-6" />
            </div>
            <span className="text-lg font-bold tracking-tight">FlowDesk</span>
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-7 shadow-xl shadow-slate-200/50 dark:border-slate-800/70 dark:bg-slate-900 dark:shadow-black/30">
          {children}
        </div>
      </div>
    </div>
  );
}
