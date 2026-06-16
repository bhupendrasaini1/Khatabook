/* ======================================
   SEED DATA — Realistic Indian Business Demo Data
   ====================================== */

import { db } from './database';
import { UserRole, TransactionStatus, RiskRating, PlanStatus, EntityStatus } from '@/types/enums';
import { format, subDays, addDays } from 'date-fns';

const now = () => new Date().toISOString();
const dateStr = (d: Date) => format(d, 'yyyy-MM-dd');
const today = new Date();

const audit = (user = 'system') => ({
  createdBy: user,
  createdAt: now(),
  updatedBy: user,
  updatedAt: now(),
});

export async function seedDatabase(): Promise<void> {
  const orgCount = await db.organizations.count();
  if (orgCount > 0) return; // Already seeded

  await db.transaction('rw',
    [db.organizations, db.users, db.categories, db.paymentMethods,
     db.buyers, db.suppliers, db.buyerTransactions, db.supplierTransactions,
     db.paymentPlans, db.settings],
    async () => {
      // --- Organization ---
      const orgId = await db.organizations.add({
        name: 'Payment Flow AI',
        businessType: 'Wholesaler',
        gstNumber: '07AAACS1234F1ZH',
        address: '42, Chandni Chowk, Old Delhi, Delhi 110006',
        phone: '+91 98765 43210',
        email: 'info@paymentflow.ai',
        currency: 'INR',
        financialYearStart: 4,
        status: EntityStatus.Active,
        ...audit(),
      });

      // --- User ---
      await db.users.add({
        orgId,
        name: 'Deepanshu',
        email: 'admin@paymentflow.ai',
        passwordHash: 'demo123', // In V1, plaintext for demo
        role: UserRole.OrgAdmin,
        status: EntityStatus.Active,
        lastLoginAt: now(),
        ...audit(),
      });

      // --- Categories ---
      const catData = [
        { name: 'Retail', type: 'both' as const },
        { name: 'Distributor', type: 'both' as const },
        { name: 'Manufacturer', type: 'supplier' as const },
        { name: 'Wholesaler', type: 'both' as const },
        { name: 'E-commerce', type: 'buyer' as const },
      ];
      for (const cat of catData) {
        await db.categories.add({ orgId, ...cat, status: EntityStatus.Active, ...audit() });
      }

      // --- Payment Methods ---
      const pmData = ['Cash', 'Bank Transfer (NEFT/RTGS)', 'UPI', 'Cheque', 'Demand Draft'];
      for (const pm of pmData) {
        await db.paymentMethods.add({ orgId, name: pm, status: EntityStatus.Active, ...audit() });
      }

      // --- Buyers ---
      const buyers = [
        { code: 'BUY001', name: 'Rajesh Electronics', contactPerson: 'Rajesh Kumar', phone: '+91 98111 22334', email: 'rajesh@electronics.com', address: 'Lajpat Nagar, Delhi', gstNumber: '07AABCR1234E1ZQ', creditLimit: 500000, creditDays: 30, riskRating: RiskRating.Low, paymentReliabilityScore: 92, relationshipScore: 88 },
        { code: 'BUY002', name: 'Gupta Stores', contactPerson: 'Amit Gupta', phone: '+91 99876 54321', email: 'amit@guptastores.com', address: 'Karol Bagh, Delhi', gstNumber: '07AABCG5678F1ZR', creditLimit: 300000, creditDays: 15, riskRating: RiskRating.Low, paymentReliabilityScore: 85, relationshipScore: 90 },
        { code: 'BUY003', name: 'Sharma Trading Co.', contactPerson: 'Vikram Sharma', phone: '+91 88765 43210', email: 'vikram@sharmatrading.com', address: 'Sadar Bazaar, Delhi', gstNumber: '07AABCS9012G1ZS', creditLimit: 700000, creditDays: 45, riskRating: RiskRating.Medium, paymentReliabilityScore: 68, relationshipScore: 75 },
        { code: 'BUY004', name: 'Modern Retail Hub', contactPerson: 'Priya Mehta', phone: '+91 77654 32109', email: 'priya@modernretail.com', address: 'Connaught Place, Delhi', gstNumber: '07AABCM3456H1ZT', creditLimit: 1000000, creditDays: 30, riskRating: RiskRating.Low, paymentReliabilityScore: 95, relationshipScore: 92 },
        { code: 'BUY005', name: 'Delhi Wholesale Mart', contactPerson: 'Suresh Jain', phone: '+91 66543 21098', email: 'suresh@delhiwholesale.com', address: 'Nehru Place, Delhi', gstNumber: '07AABCD7890I1ZU', creditLimit: 400000, creditDays: 30, riskRating: RiskRating.High, paymentReliabilityScore: 42, relationshipScore: 55 },
        { code: 'BUY006', name: 'Quick Commerce Ltd.', contactPerson: 'Neha Singh', phone: '+91 55432 10987', email: 'neha@quickcommerce.com', address: 'Gurgaon, Haryana', gstNumber: '06AABCQ1234J1ZV', creditLimit: 800000, creditDays: 15, riskRating: RiskRating.Low, paymentReliabilityScore: 88, relationshipScore: 82 },
        { code: 'BUY007', name: 'Patel Distributors', contactPerson: 'Hitesh Patel', phone: '+91 44321 09876', email: 'hitesh@pateldist.com', address: 'Noida, UP', gstNumber: '09AABCP5678K1ZW', creditLimit: 250000, creditDays: 30, riskRating: RiskRating.Medium, paymentReliabilityScore: 62, relationshipScore: 70 },
        { code: 'BUY008', name: 'Star Enterprises', contactPerson: 'Mohammed Asif', phone: '+91 33210 98765', email: 'asif@starenterprise.com', address: 'Old Delhi, Delhi', gstNumber: '07AABCS9012L1ZX', creditLimit: 600000, creditDays: 45, riskRating: RiskRating.Critical, paymentReliabilityScore: 28, relationshipScore: 40 },
        { code: 'BUY009', name: 'Sunrise Retail Chain', contactPerson: 'Kavita Reddy', phone: '+91 22109 87654', email: 'kavita@sunriseretail.com', address: 'Faridabad, Haryana', gstNumber: '06AABCS3456M1ZY', creditLimit: 900000, creditDays: 30, riskRating: RiskRating.Low, paymentReliabilityScore: 91, relationshipScore: 85 },
        { code: 'BUY010', name: 'Metro Cash & Carry', contactPerson: 'Rajan Khanna', phone: '+91 11098 76543', email: 'rajan@metrocash.com', address: 'Ghaziabad, UP', gstNumber: '09AABCM7890N1ZZ', creditLimit: 1500000, creditDays: 60, riskRating: RiskRating.Medium, paymentReliabilityScore: 72, relationshipScore: 78 },
      ];

      const buyerIds: number[] = [];
      for (const b of buyers) {
        const id = await db.buyers.add({ orgId, ...b, status: EntityStatus.Active, ...audit() });
        buyerIds.push(id);
      }

      // --- Suppliers ---
      const suppliers = [
        { code: 'SUP001', name: 'Tata Consumer Products', contactPerson: 'Anand Tiwari', phone: '+91 98001 11111', email: 'anand@tataconsumer.com', address: 'Mumbai, Maharashtra', gstNumber: '27AABCT1234A1ZA', paymentPriority: 1, paymentTerms: 'Net 30', relationshipScore: 95, preferredPaymentMethod: 'Bank Transfer (NEFT/RTGS)' },
        { code: 'SUP002', name: 'Hindustan Unilever', contactPerson: 'Sandeep Rao', phone: '+91 98002 22222', email: 'sandeep@hul.com', address: 'Mumbai, Maharashtra', gstNumber: '27AABCH5678B1ZB', paymentPriority: 1, paymentTerms: 'Net 15', relationshipScore: 90, preferredPaymentMethod: 'Bank Transfer (NEFT/RTGS)' },
        { code: 'SUP003', name: 'ITC Limited', contactPerson: 'Ramesh Verma', phone: '+91 98003 33333', email: 'ramesh@itc.com', address: 'Kolkata, West Bengal', gstNumber: '19AABCI9012C1ZC', paymentPriority: 2, paymentTerms: 'Net 30', relationshipScore: 85, preferredPaymentMethod: 'Bank Transfer (NEFT/RTGS)' },
        { code: 'SUP004', name: 'Dabur India', contactPerson: 'Pooja Malhotra', phone: '+91 98004 44444', email: 'pooja@dabur.com', address: 'Ghaziabad, UP', gstNumber: '09AABCD3456D1ZD', paymentPriority: 2, paymentTerms: 'Net 45', relationshipScore: 78, preferredPaymentMethod: 'Cheque' },
        { code: 'SUP005', name: 'Marico Ltd.', contactPerson: 'Vivek Nair', phone: '+91 98005 55555', email: 'vivek@marico.com', address: 'Mumbai, Maharashtra', gstNumber: '27AABCM7890E1ZE', paymentPriority: 3, paymentTerms: 'Net 30', relationshipScore: 72, preferredPaymentMethod: 'UPI' },
        { code: 'SUP006', name: 'Godrej Consumer Products', contactPerson: 'Sanjay Mishra', phone: '+91 98006 66666', email: 'sanjay@godrej.com', address: 'Mumbai, Maharashtra', gstNumber: '27AABCG1234F1ZF', paymentPriority: 3, paymentTerms: 'Net 30', relationshipScore: 80, preferredPaymentMethod: 'Bank Transfer (NEFT/RTGS)' },
        { code: 'SUP007', name: 'Parle Products', contactPerson: 'Deepak Shah', phone: '+91 98007 77777', email: 'deepak@parle.com', address: 'Mumbai, Maharashtra', gstNumber: '27AABCP5678G1ZG', paymentPriority: 4, paymentTerms: 'Net 60', relationshipScore: 68, preferredPaymentMethod: 'Cheque' },
        { code: 'SUP008', name: 'Emami Ltd.', contactPerson: 'Ritu Agarwal', phone: '+91 98008 88888', email: 'ritu@emami.com', address: 'Kolkata, West Bengal', gstNumber: '19AABCE9012H1ZH', paymentPriority: 5, paymentTerms: 'Net 45', relationshipScore: 60, preferredPaymentMethod: 'UPI' },
      ];

      const supplierIds: number[] = [];
      for (const s of suppliers) {
        const id = await db.suppliers.add({ orgId, ...s, status: EntityStatus.Active, ...audit() });
        supplierIds.push(id);
      }

      // --- Buyer Transactions ---
      const buyerTxData = [
        // Rajesh Electronics — reliable, mostly paid
        { buyerIdx: 0, inv: 'INV-2025-001', daysAgo: 45, amount: 125000, received: 125000, prob: 100 },
        { buyerIdx: 0, inv: 'INV-2025-012', daysAgo: 20, amount: 85000, received: 50000, prob: 90 },
        { buyerIdx: 0, inv: 'INV-2025-025', daysAgo: 5, amount: 95000, received: 0, prob: 92 },
        // Gupta Stores — reliable
        { buyerIdx: 1, inv: 'INV-2025-002', daysAgo: 30, amount: 65000, received: 65000, prob: 100 },
        { buyerIdx: 1, inv: 'INV-2025-015', daysAgo: 12, amount: 48000, received: 20000, prob: 85 },
        { buyerIdx: 1, inv: 'INV-2025-028', daysAgo: 3, amount: 72000, received: 0, prob: 88 },
        // Sharma Trading — medium risk
        { buyerIdx: 2, inv: 'INV-2025-003', daysAgo: 60, amount: 180000, received: 100000, prob: 65 },
        { buyerIdx: 2, inv: 'INV-2025-018', daysAgo: 25, amount: 145000, received: 0, prob: 60 },
        { buyerIdx: 2, inv: 'INV-2025-030', daysAgo: 8, amount: 92000, received: 0, prob: 70 },
        // Modern Retail Hub — excellent
        { buyerIdx: 3, inv: 'INV-2025-004', daysAgo: 35, amount: 250000, received: 250000, prob: 100 },
        { buyerIdx: 3, inv: 'INV-2025-020', daysAgo: 15, amount: 180000, received: 180000, prob: 100 },
        { buyerIdx: 3, inv: 'INV-2025-032', daysAgo: 5, amount: 220000, received: 0, prob: 95 },
        // Delhi Wholesale Mart — high risk
        { buyerIdx: 4, inv: 'INV-2025-005', daysAgo: 50, amount: 95000, received: 30000, prob: 40 },
        { buyerIdx: 4, inv: 'INV-2025-022', daysAgo: 18, amount: 78000, received: 0, prob: 45 },
        // Quick Commerce — reliable
        { buyerIdx: 5, inv: 'INV-2025-006', daysAgo: 10, amount: 320000, received: 320000, prob: 100 },
        { buyerIdx: 5, inv: 'INV-2025-033', daysAgo: 3, amount: 185000, received: 0, prob: 88 },
        // Patel Distributors — medium
        { buyerIdx: 6, inv: 'INV-2025-007', daysAgo: 40, amount: 55000, received: 55000, prob: 100 },
        { buyerIdx: 6, inv: 'INV-2025-024', daysAgo: 15, amount: 68000, received: 25000, prob: 65 },
        // Star Enterprises — critical risk
        { buyerIdx: 7, inv: 'INV-2025-008', daysAgo: 75, amount: 210000, received: 50000, prob: 25 },
        { buyerIdx: 7, inv: 'INV-2025-026', daysAgo: 30, amount: 145000, received: 0, prob: 30 },
        // Sunrise Retail — reliable
        { buyerIdx: 8, inv: 'INV-2025-009', daysAgo: 20, amount: 175000, received: 175000, prob: 100 },
        { buyerIdx: 8, inv: 'INV-2025-034', daysAgo: 5, amount: 290000, received: 0, prob: 90 },
        // Metro Cash & Carry — medium
        { buyerIdx: 9, inv: 'INV-2025-010', daysAgo: 55, amount: 420000, received: 300000, prob: 70 },
        { buyerIdx: 9, inv: 'INV-2025-027', daysAgo: 20, amount: 350000, received: 100000, prob: 72 },
        { buyerIdx: 9, inv: 'INV-2025-035', daysAgo: 7, amount: 280000, received: 0, prob: 75 },
      ];

      for (const tx of buyerTxData) {
        const invoiceDate = subDays(today, tx.daysAgo);
        const buyer = buyers[tx.buyerIdx];
        const dueDate = addDays(invoiceDate, buyer.creditDays);
        const outstanding = tx.amount - tx.received;
        let status: TransactionStatus;
        if (tx.received >= tx.amount) status = TransactionStatus.Received;
        else if (dueDate < today && tx.received < tx.amount) status = TransactionStatus.Overdue;
        else if (tx.received > 0) status = TransactionStatus.PartiallyReceived;
        else status = TransactionStatus.Pending;

        await db.buyerTransactions.add({
          orgId,
          buyerId: buyerIds[tx.buyerIdx],
          invoiceNumber: tx.inv,
          invoiceDate: dateStr(invoiceDate),
          dueDate: dateStr(dueDate),
          amount: tx.amount,
          receivedAmount: tx.received,
          outstandingAmount: outstanding,
          collectionProbability: tx.prob,
          status,
          notes: '',
          ...audit(),
        });
      }

      // --- Supplier Transactions ---
      const supplierTxData = [
        // Tata Consumer — P1
        { supplierIdx: 0, inv: 'PO-2025-001', daysAgo: 30, amount: 180000, paid: 180000, priority: 1 },
        { supplierIdx: 0, inv: 'PO-2025-015', daysAgo: 10, amount: 145000, paid: 0, priority: 1 },
        { supplierIdx: 0, inv: 'PO-2025-028', daysAgo: 3, amount: 120000, paid: 0, priority: 1 },
        // Hindustan Unilever — P1
        { supplierIdx: 1, inv: 'PO-2025-002', daysAgo: 20, amount: 220000, paid: 220000, priority: 1 },
        { supplierIdx: 1, inv: 'PO-2025-018', daysAgo: 8, amount: 195000, paid: 0, priority: 1 },
        // ITC — P2
        { supplierIdx: 2, inv: 'PO-2025-003', daysAgo: 40, amount: 165000, paid: 100000, priority: 2 },
        { supplierIdx: 2, inv: 'PO-2025-020', daysAgo: 12, amount: 138000, paid: 0, priority: 2 },
        // Dabur — P2
        { supplierIdx: 3, inv: 'PO-2025-004', daysAgo: 35, amount: 95000, paid: 95000, priority: 2 },
        { supplierIdx: 3, inv: 'PO-2025-022', daysAgo: 15, amount: 78000, paid: 30000, priority: 2 },
        // Marico — P3
        { supplierIdx: 4, inv: 'PO-2025-005', daysAgo: 25, amount: 85000, paid: 85000, priority: 3 },
        { supplierIdx: 4, inv: 'PO-2025-024', daysAgo: 8, amount: 62000, paid: 0, priority: 3 },
        // Godrej — P3
        { supplierIdx: 5, inv: 'PO-2025-006', daysAgo: 30, amount: 110000, paid: 50000, priority: 3 },
        { supplierIdx: 5, inv: 'PO-2025-025', daysAgo: 5, amount: 92000, paid: 0, priority: 3 },
        // Parle — P4
        { supplierIdx: 6, inv: 'PO-2025-007', daysAgo: 45, amount: 55000, paid: 55000, priority: 4 },
        { supplierIdx: 6, inv: 'PO-2025-026', daysAgo: 10, amount: 48000, paid: 0, priority: 4 },
        // Emami — P5
        { supplierIdx: 7, inv: 'PO-2025-008', daysAgo: 20, amount: 42000, paid: 42000, priority: 5 },
        { supplierIdx: 7, inv: 'PO-2025-027', daysAgo: 7, amount: 35000, paid: 0, priority: 5 },
      ];

      for (const tx of supplierTxData) {
        const invoiceDate = subDays(today, tx.daysAgo);
        const supplier = suppliers[tx.supplierIdx];
        const termDays = parseInt(supplier.paymentTerms.replace(/\D/g, '')) || 30;
        const dueDate = addDays(invoiceDate, termDays);
        const outstanding = tx.amount - tx.paid;
        let status: TransactionStatus;
        if (tx.paid >= tx.amount) status = TransactionStatus.Paid;
        else if (dueDate < today && tx.paid < tx.amount) status = TransactionStatus.Overdue;
        else if (tx.paid > 0) status = TransactionStatus.PartiallyPaid;
        else status = TransactionStatus.Pending;

        await db.supplierTransactions.add({
          orgId,
          supplierId: supplierIds[tx.supplierIdx],
          invoiceNumber: tx.inv,
          invoiceDate: dateStr(invoiceDate),
          dueDate: dateStr(dueDate),
          amount: tx.amount,
          paidAmount: tx.paid,
          outstandingAmount: outstanding,
          priority: tx.priority,
          status,
          notes: '',
          ...audit(),
        });
      }

      // --- Payment Plans (4-week forecast) ---
      const weekStarts = [
        today,
        addDays(today, 7),
        addDays(today, 14),
        addDays(today, 21),
      ];
      const forecastData = [
        { incoming: 350000, outgoing: 300000 },
        { incoming: 420000, outgoing: 360000 },
        { incoming: 390000, outgoing: 340000 },
        { incoming: 450000, outgoing: 380000 },
      ];

      for (let i = 0; i < 4; i++) {
        await db.paymentPlans.add({
          orgId,
          weekStart: dateStr(weekStarts[i]),
          weekEnd: dateStr(addDays(weekStarts[i], 6)),
          expectedCollections: forecastData[i].incoming,
          plannedPayments: forecastData[i].outgoing,
          cashBuffer: forecastData[i].incoming - forecastData[i].outgoing,
          status: i === 0 ? PlanStatus.Active : PlanStatus.Draft,
          ...audit(),
        });
      }

      // --- Settings ---
      await db.settings.bulkAdd([
        { orgId, key: 'theme', value: 'dark', ...audit() },
        { orgId, key: 'minCashBuffer', value: '50000', ...audit() },
        { orgId, key: 'autoAllocateEnabled', value: 'true', ...audit() },
        { orgId, key: 'notificationsEnabled', value: 'true', ...audit() },
      ]);
    }
  );
}
