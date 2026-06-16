/* ======================================
   KPI CARD — Dashboard Metric Display
   ====================================== */

import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: number; // positive = up, negative = down, 0 = flat
  trendLabel?: string;
  accentColor?: 'teal' | 'emerald' | 'rose' | 'amber' | 'blue' | 'violet';
  className?: string;
}

const accentMap = {
  teal: {
    bg: 'from-teal-500/20 to-teal-600/5',
    icon: 'bg-teal-500/15 text-teal-400',
    glow: 'shadow-[0_0_30px_rgba(20,184,166,0.08)]',
    border: 'border-teal-500/10',
  },
  emerald: {
    bg: 'from-emerald-500/20 to-emerald-600/5',
    icon: 'bg-emerald-500/15 text-emerald-400',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.08)]',
    border: 'border-emerald-500/10',
  },
  rose: {
    bg: 'from-rose-500/20 to-rose-600/5',
    icon: 'bg-rose-500/15 text-rose-400',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.08)]',
    border: 'border-rose-500/10',
  },
  amber: {
    bg: 'from-amber-500/20 to-amber-600/5',
    icon: 'bg-amber-500/15 text-amber-400',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.08)]',
    border: 'border-amber-500/10',
  },
  blue: {
    bg: 'from-blue-500/20 to-blue-600/5',
    icon: 'bg-blue-500/15 text-blue-400',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.08)]',
    border: 'border-blue-500/10',
  },
  violet: {
    bg: 'from-violet-500/20 to-violet-600/5',
    icon: 'bg-violet-500/15 text-violet-400',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.08)]',
    border: 'border-violet-500/10',
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  accentColor = 'teal',
  className,
}: KPICardProps) {
  const accent = accentMap[accentColor];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border',
        'bg-gradient-to-br',
        accent.bg,
        accent.border,
        accent.glow,
        'p-5 transition-all duration-300 hover:scale-[1.02]',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/[0.02]" />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-50 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-lg', accent.icon)}>
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend > 0 ? (
            <TrendingUp size={14} className="text-emerald-400" />
          ) : trend < 0 ? (
            <TrendingDown size={14} className="text-rose-400" />
          ) : (
            <Minus size={14} className="text-slate-400" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              trend > 0 && 'text-emerald-400',
              trend < 0 && 'text-rose-400',
              trend === 0 && 'text-slate-400'
            )}
          >
            {trend > 0 && '+'}
            {trend}% {trendLabel || 'vs last week'}
          </span>
        </div>
      )}
    </div>
  );
}
