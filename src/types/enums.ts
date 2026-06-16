/* ======================================
   ENUMS — Khatabook Domain Enumerations
   ====================================== */

export enum UserRole {
  SuperAdmin = 'super_admin',
  OrgAdmin = 'org_admin',
  Accountant = 'accountant',
  FinanceManager = 'finance_manager',
  Viewer = 'viewer',
}

export enum TransactionStatus {
  Pending = 'pending',
  PartiallyReceived = 'partially_received',
  Received = 'received',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Overdue = 'overdue',
}

export enum RiskRating {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum PaymentPriority {
  P1 = 1,
  P2 = 2,
  P3 = 3,
  P4 = 4,
  P5 = 5,
}

export enum PlanStatus {
  Draft = 'draft',
  Active = 'active',
  Approved = 'approved',
  Completed = 'completed',
}

export enum NotificationType {
  PaymentDue = 'payment_due',
  Overdue = 'overdue',
  LowBuffer = 'low_buffer',
  HighRisk = 'high_risk',
  System = 'system',
  AllocationComplete = 'allocation_complete',
}

export enum NotificationSeverity {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
}

export enum EntityType {
  Buyer = 'buyer',
  Supplier = 'supplier',
  BuyerTransaction = 'buyer_transaction',
  SupplierTransaction = 'supplier_transaction',
  PaymentPlan = 'payment_plan',
  PaymentMapping = 'payment_mapping',
  Organization = 'organization',
  User = 'user',
  Category = 'category',
  PaymentMethod = 'payment_method',
  Setting = 'setting',
}

export enum AuditAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Login = 'login',
  Logout = 'logout',
  Allocate = 'allocate',
  Approve = 'approve',
  Export = 'export',
}

export enum EntityStatus {
  Active = 'active',
  Inactive = 'inactive',
  Deleted = 'deleted',
}
