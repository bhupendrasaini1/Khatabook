/* ======================================
   EMPTY STATE — Zero-data display
   ====================================== */

import { type ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6', className)}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 text-center max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}
