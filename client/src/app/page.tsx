'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Workflow, CheckCircle2, Zap, Users, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-500/15"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10"
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/30">
            <Workflow className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">FlowDesk</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Começar grátis</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <section className="py-16 text-center sm:py-24">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Plataforma de gestão de projetos
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            <span className="gradient-text">Organize sua equipe</span>
            <br />
            sem complicação.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">
            Workspaces, projetos, Kanban e colaboração em tempo real em uma única
            plataforma. Profissional como Linear, simples como Trello.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg">
                Criar conta grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Já tenho conta
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Use <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">admin@flowdesk.com</code>
            {' / '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">123456</code> para testar agora.
          </p>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, title: 'Workspaces', desc: 'Equipes, papéis e permissões granulares.' },
            { icon: Workflow, title: 'Kanban real', desc: 'Drag-and-drop fluido com persistência.' },
            { icon: Zap, title: 'Tempo real', desc: 'Socket.io + invalidação de cache.' },
            { icon: BarChart3, title: 'Dashboard', desc: 'Métricas e produtividade semanal.' },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
              </div>
            );
          })}
        </section>

        <section className="mb-20 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold tracking-tight">Por dentro</h2>
          <ul className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            {[
              'JWT com rotação de refresh tokens',
              'RBAC em 3 níveis (admin/manager/member)',
              'Real-time com Socket.io e fallback gracioso',
              'Postgres + Prisma com schema dedicado',
              'Drag-and-drop persistido com @dnd-kit',
              'Dashboard com gráficos via Recharts',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white/50 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-500">
        FlowDesk · projeto de portfólio · Next.js 15 · Express · Prisma · Socket.io
      </footer>
    </div>
  );
}
