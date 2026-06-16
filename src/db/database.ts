/* ======================================
   DATABASE — Dexie.js IndexedDB Schema
   ====================================== */

import Dexie, { type Table } from 'dexie';
import type {
  User,
  Organization,
  Buyer,
  Supplier,
  BuyerTransaction,
  SupplierTransaction,
  PaymentPlan,
  PaymentMapping,
  Category,
  PaymentMethod,
  Notification,
  AuditLog,
  Setting,
} from '@/types/models';

export class KhataBookDB extends Dexie {
  users!: Table<User, number>;
  organizations!: Table<Organization, number>;
  buyers!: Table<Buyer, number>;
  suppliers!: Table<Supplier, number>;
  buyerTransactions!: Table<BuyerTransaction, number>;
  supplierTransactions!: Table<SupplierTransaction, number>;
  paymentPlans!: Table<PaymentPlan, number>;
  paymentMappings!: Table<PaymentMapping, number>;
  categories!: Table<Category, number>;
  paymentMethods!: Table<PaymentMethod, number>;
  notifications!: Table<Notification, number>;
  auditLogs!: Table<AuditLog, number>;
  settings!: Table<Setting, number>;

  constructor() {
    super('KhataBookDB');

    this.version(1).stores({
      users: '++id, email, orgId, role, status',
      organizations: '++id, name, gstNumber, status',
      buyers: '++id, orgId, code, name, gstNumber, riskRating, status',
      suppliers: '++id, orgId, code, name, gstNumber, [orgId+status], priority, status',
      buyerTransactions: '++id, orgId, buyerId, invoiceNumber, dueDate, status, [orgId+status], [orgId+buyerId]',
      supplierTransactions: '++id, orgId, supplierId, invoiceNumber, dueDate, status, [orgId+status], [orgId+supplierId]',
      paymentPlans: '++id, orgId, weekStart, weekEnd, status, [orgId+status]',
      paymentMappings: '++id, orgId, planId, buyerTxId, supplierTxId, [orgId+planId]',
      categories: '++id, orgId, name, type, status',
      paymentMethods: '++id, orgId, name, status',
      notifications: '++id, orgId, userId, type, read, createdAt, [orgId+userId+read]',
      auditLogs: '++id, orgId, userId, action, entityType, entityId, createdAt',
      settings: '++id, orgId, key, [orgId+key]',
    });
  }
}

export const db = new KhataBookDB();
