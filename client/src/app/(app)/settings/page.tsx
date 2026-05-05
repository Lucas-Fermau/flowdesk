'use client';

import { Moon, Sun, Bell, Shield } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { theme, toggle } = useThemeStore();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configurações</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Personalize sua experiência no FlowDesk.
        </p>
      </div>

      <Section icon={theme === 'dark' ? Sun : Moon} title="Aparência" description="Escolha o tema da interface.">
        <Button onClick={toggle} variant="outline">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          Alternar para {theme === 'dark' ? 'claro' : 'escuro'}
        </Button>
      </Section>

      <Section icon={Bell} title="Notificações" description="Tempo real ativado via Socket.io.">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Você recebe notificações em tempo real sobre tarefas atribuídas, comentários e
          convites para workspaces enquanto a aba estiver aberta.
        </p>
      </Section>

      <Section icon={Shield} title="Segurança" description="Tokens JWT com rotação de refresh tokens.">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sua sessão é renovada automaticamente. Em caso de logout, todos os refresh tokens
          são invalidados via incremento de <code>tokenVersion</code>.
        </p>
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Moon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
