'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

const baseFieldClass =
  'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm shadow-sm placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className, ...props },
  ref
) {
  const fieldId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      ) : null}
      <input
        id={fieldId}
        ref={ref}
        className={cn(
          baseFieldClass,
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
            : 'border-slate-200 dark:border-slate-700',
          className
        )}
        {...props}
      />
      {error ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className, ...props },
  ref
) {
  const fieldId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      ) : null}
      <textarea
        id={fieldId}
        ref={ref}
        className={cn(
          baseFieldClass,
          'min-h-[88px] resize-y',
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700',
          className
        )}
        {...props}
      />
      {error ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, className, children, ...props },
  ref
) {
  const fieldId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      ) : null}
      <select
        id={fieldId}
        ref={ref}
        className={cn(
          baseFieldClass,
          'pr-8 cursor-pointer',
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
});
