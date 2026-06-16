/* ======================================
   UTILS — Formatting and helper functions
   ====================================== */

import { format, parseISO, differenceInDays, isAfter } from 'date-fns';
import { DATE_FORMAT, DEFAULT_CURRENCY } from '@/types/constants';
import { TransactionStatus, type RiskRating } from '@/types/enums';

/** Format number as Indian currency (₹1,23,456) */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return `${amount < 0 ? '-' : ''}${DEFAULT_CURRENCY}${formatted}`;
}

/** Format number as compact (₹1.2L, ₹3.5Cr) */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 10000000) return `${DEFAULT_CURRENCY}${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${DEFAULT_CURRENCY}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${DEFAULT_CURRENCY}${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}

/** Format date string */
export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), DATE_FORMAT);
  } catch {
    return dateStr;
  }
}

/** Calculate days until due (negative = overdue) */
export function daysUntilDue(dueDate: string): number {
  return differenceInDays(parseISO(dueDate), new Date());
}

/** Check if a date is overdue */
export function isOverdue(dueDate: string): boolean {
  return isAfter(new Date(), parseISO(dueDate));
}

/** Calculate percentage */
export function calcPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/** Get status display label */
export function getStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    [TransactionStatus.Pending]: 'Pending',
    [TransactionStatus.PartiallyReceived]: 'Partial',
    [TransactionStatus.Received]: 'Received',
    [TransactionStatus.PartiallyPaid]: 'Partial',
    [TransactionStatus.Paid]: 'Paid',
    [TransactionStatus.Overdue]: 'Overdue',
  };
  return labels[status] || status;
}

/** Get badge variant for status */
export function getStatusBadgeVariant(status: TransactionStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const map: Record<TransactionStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    [TransactionStatus.Pending]: 'neutral',
    [TransactionStatus.PartiallyReceived]: 'warning',
    [TransactionStatus.Received]: 'success',
    [TransactionStatus.PartiallyPaid]: 'warning',
    [TransactionStatus.Paid]: 'success',
    [TransactionStatus.Overdue]: 'danger',
  };
  return map[status] || 'neutral';
}

/** Get risk badge variant */
export function getRiskBadgeVariant(risk: RiskRating): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  };
  return map[risk] || 'info';
}

/** Priority label */
export function getPriorityLabel(p: number): string {
  const labels: Record<number, string> = {
    1: 'P1',
    2: 'P2',
    3: 'P3',
    4: 'P4',
    5: 'P5',
  };
  return labels[p] || `P${p}`;
}

/** Priority badge variant */
export function getPriorityBadgeVariant(p: number): 'danger' | 'warning' | 'info' | 'neutral' {
  if (p <= 1) return 'danger';
  if (p <= 2) return 'warning';
  if (p <= 3) return 'info';
  return 'neutral';
}

/** Generate a unique code */
export function generateCode(prefix: string, num: number): string {
  return `${prefix}${String(num).padStart(3, '0')}`;
}

/** Truncate text */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/** Class names helper (simplified cn) */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
