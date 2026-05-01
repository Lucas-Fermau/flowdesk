'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Briefcase } from 'lucide-react';
import { workspacesApi } from '@/services/endpoints';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/services/api';

const schema = z.object({
  name: z.string().min(2, 'Mínimo de 2 caracteres'),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function WorkspacesPage() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (input: FormValues) =>
      workspacesApi.create({ name: input.name, description: input.description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace criado');
      setOpen(false);
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Erro ao criar'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const submit = handleSubmit(async (values) => {
    await createMutation.mutateAsync(values);
    reset();
  });

  const workspaces = data?.workspaces ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Workspaces</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Times e espaços de colaboração.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo workspace
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : workspaces.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sem workspaces ainda"
          description="Crie seu primeiro workspace para organizar projetos e equipe."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Criar workspace
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((w) => (
            <Link
              key={w.id}
              href={`/workspaces/${w.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/25">
                  <Users className="h-5 w-5" />
                </div>
                {w.myRole ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {w.myRole}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-4 line-clamp-1 font-semibold tracking-tight">{w.name}</h3>
              {w.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                  {w.description}
                </p>
              ) : null}
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {w._count?.projects ?? 0} projetos
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {w._count?.members ?? 0} membros
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo workspace">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Nome" {...register('name')} error={errors.name?.message} autoFocus />
          <Textarea
            label="Descrição (opcional)"
            rows={3}
            {...register('description')}
            error={errors.description?.message}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Criar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
