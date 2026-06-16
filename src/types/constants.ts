/* ======================================
   CONSTANTS — App-wide constant values
   ====================================== */

export const APP_NAME = 'Payment Flow AI';
export const APP_DESCRIPTION = 'Intelligent Cash Flow Management';
export const DEFAULT_CURRENCY = '₹';
export const DEFAULT_CURRENCY_CODE = 'INR';

/* Pagination */
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/* Allocation Engine Weights */
export const ALLOCATION_WEIGHTS = {
  supplierPriority: 0.30,
  buyerConfidence: 0.25,
  relationshipScore: 0.20,
  dueDateUrgency: 0.15,
  outstandingWeight: 0.10,
} as const;

/* Risk Thresholds */
export const RISK_THRESHOLDS = {
  overdueDaysHigh: 30,
  overdueDaysMedium: 15,
  collectionProbabilityLow: 50,
  cashBufferCriticalPercent: 10,
  concentrationRiskPercent: 40,
  minCashBufferPercent: 5,
} as const;

/* Date formats */
export const DATE_FORMAT = 'dd MMM yyyy';
export const DATE_FORMAT_SHORT = 'dd/MM/yyyy';
export const DATE_FORMAT_INPUT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = 'dd MMM yyyy, hh:mm a';

/* Status colors mapping */
export const STATUS_COLORS = {
  pending: 'neutral',
  partially_received: 'warning',
  received: 'success',
  partially_paid: 'warning',
  paid: 'success',
  overdue: 'danger',
} as const;

/* Risk colors */
export const RISK_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
} as const;

/* Priority labels */
export const PRIORITY_LABELS: Record<number, string> = {
  1: 'P1 — Critical',
  2: 'P2 — High',
  3: 'P3 — Medium',
  4: 'P4 — Low',
  5: 'P5 — Optional',
};

/* Chart colors */
export const CHART_COLORS = {
  teal: '#14b8a6',
  emerald: '#10b981',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#64748b',
  cyan: '#06b6d4',
} as const;

/* Navigation items */
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { label: 'Buyers', path: '/buyers', icon: 'Users' },
  { label: 'Suppliers', path: '/suppliers', icon: 'Truck' },
  { label: 'Buyer Transactions', path: '/transactions/buyer', icon: 'ArrowDownLeft' },
  { label: 'Supplier Transactions', path: '/transactions/supplier', icon: 'ArrowUpRight' },
  { label: 'Weekly Planning', path: '/planning', icon: 'Calendar' },
  { label: 'Flow Board', path: '/flow-board', icon: 'GitBranch' },
  { label: 'Reports', path: '/reports', icon: 'FileBarChart' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
  { label: 'Audit Logs', path: '/audit', icon: 'ScrollText' },
] as const;
