/* ======================================
   BADGE — Status Badge Component
   ====================================== */

import { type ReactNode } from 'react';
import { cn } from '@/utils/helpers';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'neutral', dot = false, className }: BadgeProps) {
  return (
    <span className={cn(`badge badge-${variant}`, className)}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger' && 'bg-rose-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'neutral' && 'bg-slate-400'
          )}
        />
      )}
      {children}
    </span>
  );
}
