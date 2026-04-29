'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiError } from '@/services/api';
import { toast } from '@/hooks/useToast';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success('Bem-vindo de volta!');
      router.replace('/dashboard');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Falha ao entrar');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <>
      <h1 className="text-center text-2xl font-bold tracking-tight">
        <span className="gradient-text">Entrar</span>
      </h1>
      <p className="mt-1 text-center text-sm text-slate-600 dark:text-slate-400">
        Acesse sua conta FlowDesk
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Entrar
        </Button>
      </form>

      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/40 dark:text-slate-400">
        <strong>Conta de teste:</strong>
        <div>Admin: <code>admin@flowdesk.com</code> / <code>123456</code></div>
        <div>Manager: <code>manager@flowdesk.com</code> / <code>123456</code></div>
        <div>Member: <code>member@flowdesk.com</code> / <code>123456</code></div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        Não tem conta?{' '}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Criar uma
        </Link>
      </p>
    </>
  );
}
