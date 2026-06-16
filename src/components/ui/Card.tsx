/* ======================================
   CARD — Glassmorphic Card Component
   ====================================== */

import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glow?: 'teal' | 'emerald' | 'rose' | 'none';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  children,
  hover = true,
  glow = 'none',
  padding = 'md',
  className,
  ...props
}: CardProps) {
  const glowMap = {
    teal: 'hover:shadow-[0_0_20px_rgba(20,184,166,0.12)]',
    emerald: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]',
    rose: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.12)]',
    none: '',
  };

  return (
    <div
      className={cn(
        hover ? 'glass-card' : 'glass-card-static',
        paddingStyles[padding],
        glow !== 'none' && glowMap[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* Card sub-components */
export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-base font-semibold text-slate-100', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-slate-400', className)}>
      {children}
    </p>
  );
}
