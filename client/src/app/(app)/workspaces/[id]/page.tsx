'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Plus, UserPlus, X, Calendar } from 'lucide-react';
import { projectsApi, workspacesApi } from '@/services/endpoints';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/services/api';
import { formatDate } from '@/utils/cn';
import type { WorkspaceRole } from '@/types';

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'manager', 'member']),
});

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(2000).optional(),
  dueDate: z.string().optional(),
});

type InviteValues = z.infer<typeof inviteSchema>;
type ProjectValues = z.infer<typeof projectSchema>;

const STATUS_BADGE = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  archived: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export default function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['workspace', id],
    queryFn: () => workspacesApi.getById(id),
  });

  const inviteForm = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'member' },
  });
  const projectForm = useForm<ProjectValues>({ resolver: zodResolver(projectSchema) });

  const inviteMutation = useMutation({
    mutationFn: (input: InviteValues) =>
      workspacesApi.invite(id, input.email, input.role as WorkspaceRole),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', id] });
      toast.success('Convite enviado');
      setInviteOpen(false);
      inviteForm.reset();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro'),
  });

  const projectMutation = useMutation({
    mutationFn: (input: ProjectValues) =>
      projectsApi.create({
        workspaceId: id,
        name: input.name,
        description: input.description,
        dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', id] });
      toast.success('Projeto criado');
      setProjectOpen(false);
      projectForm.reset();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => workspacesApi.removeMember(id, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', id] });
      toast.success('Membro removido');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro'),
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const ws = data.workspace;
  const canManage = ws.myRole === 'owner' || ws.myRole === 'admin';
  const canCreate = canManage || ws.myRole === 'manager';

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Workspaces
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{ws.name}</h1>
            {ws.description ? (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{ws.description}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            {canManage ? (
              <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Convidar
              </Button>
            ) : null}
            {canCreate ? (
              <Button size="sm" onClick={() => setProjectOpen(true)}>
                <Plus className="h-4 w-4" />
                Novo projeto
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">
            Projetos <span className="text-slate-500 dark:text-slate-400">({ws.projects?.length ?? 0})</span>
          </h2>
          {(ws.projects?.length ?? 0) === 0 ? (
            <EmptyState icon={Briefcase} title="Sem projetos" description="Crie o primeiro projeto deste workspace." />
          ) : (
            <ul className="space-y-2">
              {ws.projects?.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold tracking-tight">{p.name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE[p.status]}`}
                        >
                          {p.status}
                        </span>
                      </div>
                      {p.description ? (
                        <p className="mt-0.5 line-clamp-1 text-sm text-slate-600 dark:text-slate-400">
                          {p.description}
                        </p>
                      ) : null}
                      {p.dueDate ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(p.dueDate)}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">
            Membros <span className="text-slate-500 dark:text-slate-400">({ws.members?.length ?? 0})</span>
          </h2>
          <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
            {ws.members?.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={m.user.name} src={m.user.avatar} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.user.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {m.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {m.role}
                  </span>
                  {canManage && m.role !== 'owner' ? (
                    <button
                      onClick={() => {
                        if (window.confirm(`Remover ${m.user.name}?`))
                          removeMemberMutation.mutate(m.id);
                      }}
                      aria-label="Remover"
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Convidar membro">
        <form onSubmit={inviteForm.handleSubmit((v) => inviteMutation.mutate(v))} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="email@empresa.com"
            {...inviteForm.register('email')}
            error={inviteForm.formState.errors.email?.message}
          />
          <Select
            label="Papel"
            {...inviteForm.register('role')}
            error={inviteForm.formState.errors.role?.message}
          >
            <option value="member">Member</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
          <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            O usuário precisa estar cadastrado no FlowDesk para receber o convite.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={inviteMutation.isPending}>
              Convidar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={projectOpen} onClose={() => setProjectOpen(false)} title="Novo projeto">
        <form onSubmit={projectForm.handleSubmit((v) => projectMutation.mutate(v))} className="space-y-4">
          <Input label="Nome" {...projectForm.register('name')} error={projectForm.formState.errors.name?.message} autoFocus />
          <Textarea
            label="Descrição (opcional)"
            rows={3}
            {...projectForm.register('description')}
          />
          <Input label="Prazo (opcional)" type="date" {...projectForm.register('dueDate')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setProjectOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={projectMutation.isPending}>
              Criar projeto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
