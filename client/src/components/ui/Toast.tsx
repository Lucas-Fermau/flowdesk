'use client';

import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToasts } from '@/hooks/useToast';
import { cn } from '@/utils/cn';

const variantStyles = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-slate-900 text-white dark:bg-slate-800',
};

const variantIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastViewport() {
  const { toasts, dismiss } = useToasts();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = variantIcons[t.variant];
        return (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={cn(
              'pointer-events-auto flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-slide-up',
              variantStyles[t.variant]
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t.message}
          </button>
        );
      })}
    </div>
  );
}
