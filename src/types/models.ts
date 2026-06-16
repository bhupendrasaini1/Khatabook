/* ======================================
   MODELS — Khatabook Domain Interfaces
   ====================================== */

import type {
  UserRole,
  TransactionStatus,
  RiskRating,
  PlanStatus,
  NotificationType,
  NotificationSeverity,
  EntityType,
  AuditAction,
  EntityStatus,
} from './enums';

/* --- Audit fields mixin --- */
export interface AuditFields {
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

/* --- User --- */
export interface User extends AuditFields {
  id?: number;
  orgId: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: EntityStatus;
  lastLoginAt?: string;
  avatarUrl?: string;
}

/* --- Organization --- */
export interface Organization extends AuditFields {
  id?: number;
  name: string;
  businessType: string;
  gstNumber: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  financialYearStart: number; // month 1-12
  status: EntityStatus;
}

/* --- Buyer --- */
export interface Buyer extends AuditFields {
  id?: number;
  orgId: number;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  creditLimit: number;
  creditDays: number;
  riskRating: RiskRating;
  paymentReliabilityScore: number; // 0-100
  relationshipScore: number; // 0-100
  categoryId?: number;
  status: EntityStatus;
}

/* --- Supplier --- */
export interface Supplier extends AuditFields {
  id?: number;
  orgId: number;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  paymentPriority: number; // 1-5
  paymentTerms: string;
  relationshipScore: number; // 0-100
  preferredPaymentMethod: string;
  categoryId?: number;
  status: EntityStatus;
}

/* --- Buyer Transaction --- */
export interface BuyerTransaction extends AuditFields {
  id?: number;
  orgId: number;
  buyerId: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  receivedAmount: number;
  outstandingAmount: number;
  collectionProbability: number; // 0-100
  paymentMethodId?: number;
  status: TransactionStatus;
  notes: string;
}

/* --- Supplier Transaction --- */
export interface SupplierTransaction extends AuditFields {
  id?: number;
  orgId: number;
  supplierId: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  priority: number; // 1-5
  paymentMethodId?: number;
  status: TransactionStatus;
  notes: string;
}

/* --- Payment Plan --- */
export interface PaymentPlan extends AuditFields {
  id?: number;
  orgId: number;
  weekStart: string;
  weekEnd: string;
  expectedCollections: number;
  plannedPayments: number;
  cashBuffer: number;
  status: PlanStatus;
}

/* --- Payment Mapping --- */
export interface PaymentMapping extends AuditFields {
  id?: number;
  orgId: number;
  planId: number;
  buyerTxId: number;
  supplierTxId: number;
  allocatedAmount: number;
  allocationScore: number;
}

/* --- Category --- */
export interface Category extends AuditFields {
  id?: number;
  orgId: number;
  name: string;
  type: 'buyer' | 'supplier' | 'both';
  status: EntityStatus;
}

/* --- Payment Method --- */
export interface PaymentMethod extends AuditFields {
  id?: number;
  orgId: number;
  name: string;
  status: EntityStatus;
}

/* --- Notification --- */
export interface Notification {
  id?: number;
  orgId: number;
  userId: number;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  read: boolean;
  entityType?: EntityType;
  entityId?: number;
  createdAt: string;
}

/* --- Audit Log --- */
export interface AuditLog {
  id?: number;
  orgId: number;
  userId: number;
  userName: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: number;
  entityName?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  createdAt: string;
}

/* --- Setting --- */
export interface Setting {
  id?: number;
  orgId: number;
  key: string;
  value: string;
}

/* ======================================
   DERIVED / COMPUTED TYPES
   ====================================== */

export interface DashboardStats {
  totalReceivables: number;
  totalPayables: number;
  availableCash: number;
  bufferAmount: number;
  collectionEfficiency: number;
  paymentEfficiency: number;
  overdueInvoicesBuyer: number;
  overdueInvoicesSupplier: number;
  highRiskCount: number;
  totalBuyers: number;
  totalSuppliers: number;
}

export interface WeeklyForecast {
  week: string;
  weekStart: string;
  weekEnd: string;
  incoming: number;
  outgoing: number;
  buffer: number;
}

export interface AllocationResult {
  buyerTxId: number;
  supplierTxId: number;
  buyerName: string;
  supplierName: string;
  amount: number;
  score: number;
}

export interface RiskAlert {
  id: string;
  type: 'buyer_risk' | 'overdue' | 'low_buffer' | 'concentration' | 'critical_delay';
  severity: NotificationSeverity;
  title: string;
  message: string;
  entityType?: EntityType;
  entityId?: number;
}
