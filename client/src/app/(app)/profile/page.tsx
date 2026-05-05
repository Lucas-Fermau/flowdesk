'use client';

import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Perfil</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Suas informações pessoais.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} src={user.avatar} size="lg" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{user.name}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Papel global
            </dt>
            <dd className="mt-1 text-sm font-medium capitalize">{user.role}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Conta criada em
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
