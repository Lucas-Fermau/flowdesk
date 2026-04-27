'use client';

import { avatarColor, cn, initials } from '@/utils/cn';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeClass[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        avatarColor(name),
        sizeClass[size],
        className
      )}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({
  users,
  max = 3,
  size = 'sm',
}: {
  users: Array<{ name: string; avatar?: string | null }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}) {
  const visible = users.slice(0, max);
  const extra = users.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <Avatar
          key={i}
          name={u.name}
          src={u.avatar}
          size={size}
          className="ring-2 ring-white dark:ring-slate-900"
        />
      ))}
      {extra > 0 ? (
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 ring-2 ring-white dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-900',
            sizeClass[size]
          )}
        >
          +{extra}
        </div>
      ) : null}
    </div>
  );
}
