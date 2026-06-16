/* ======================================
   SUPPLIER TRANSACTIONS PAGE
   ====================================== */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowUpRight, Plus, Search, DollarSign } from 'lucide-react';
import { db } from '@/db/database';
import { useAuthStore } from '@/stores/authStore';
import { TransactionStatus, EntityStatus } from '@/types/enums';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, getStatusBadgeVariant, getStatusLabel, getPriorityLabel, getPriorityBadgeVariant, cn } from '@/utils/helpers';
import type { SupplierTransaction } from '@/types/models';
import { format, addDays } from 'date-fns';

export function SupplierTransactionsPage() {
  const { user } = useAuthStore();
  const orgId = user?.orgId || 1;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState<SupplierTransaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    supplierId: 0, invoiceNumber: '', invoiceDate: today,
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    amount: 0, priority: 3, notes: '',
  });

  const suppliers = useLiveQuery(() => db.suppliers.where('orgId').equals(orgId).and(s => s.status === EntityStatus.Active).toArray(), [orgId]);
  const transactions = useLiveQuery(() => db.supplierTransactions.where('orgId').equals(orgId).toArray(), [orgId]);

  const supplierMap = new Map(suppliers?.map(s => [s.id, s.name]) || []);

  const filtered = transactions?.filter(t => {
    const matchSearch = supplierMap.get(t.supplierId)?.toLowerCase().includes(search.toLowerCase()) || t.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));

  const handleSave = async () => {
    const now = new Date().toISOString();
    await db.supplierTransactions.add({
      orgId, supplierId: form.supplierId, invoiceNumber: form.invoiceNumber,
      invoiceDate: form.invoiceDate, dueDate: form.dueDate,
      amount: form.amount, paidAmount: 0, outstandingAmount: form.amount,
      priority: form.priority, status: TransactionStatus.Pending, notes: form.notes,
      createdBy: user?.email || '', createdAt: now, updatedBy: user?.email || '', updatedAt: now,
    });
    setModalOpen(false);
  };

  const handleRecordPayment = async () => {
    if (!paymentModal?.id) return;
    const newPaid = paymentModal.paidAmount + paymentAmount;
    const newOutstanding = paymentModal.amount - newPaid;
    let status: TransactionStatus;
    if (newPaid >= paymentModal.amount) status = TransactionStatus.Paid;
    else if (newPaid > 0) status = TransactionStatus.PartiallyPaid;
    else status = paymentModal.status;
    await db.supplierTransactions.update(paymentModal.id, {
      paidAmount: newPaid, outstandingAmount: Math.max(0, newOutstanding), status,
      updatedBy: user?.email || '', updatedAt: new Date().toISOString(),
    });
    setPaymentModal(null);
    setPaymentAmount(0);
  };

  const totalOutstanding = filtered?.reduce((s, t) => s + t.outstandingAmount, 0) || 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Supplier Transactions</h1>
          <p className="text-sm text-slate-400">Outstanding: <span className="text-amber-400 font-semibold">{formatCurrency(totalOutstanding)}</span></p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Add Transaction</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={16} />} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', TransactionStatus.Pending, TransactionStatus.PartiallyPaid, TransactionStatus.Paid, TransactionStatus.Overdue].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', statusFilter === s ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent')}>
              {s === 'all' ? 'All' : getStatusLabel(s as TransactionStatus)}
            </button>
          ))}
        </div>
      </div>

      {filtered && filtered.length > 0 ? (
        <Card hover={false} padding="none">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Invoice</th><th>Supplier</th><th>Date</th><th>Due Date</th><th>Amount</th><th>Paid</th><th>Outstanding</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id} className={tx.status === TransactionStatus.Overdue ? 'bg-rose-500/[0.03]' : ''}>
                    <td className="font-mono text-xs text-teal-400">{tx.invoiceNumber}</td>
                    <td className="font-medium text-slate-200">{supplierMap.get(tx.supplierId) || '—'}</td>
                    <td className="text-slate-400 text-sm">{formatDate(tx.invoiceDate)}</td>
                    <td className={cn('text-sm', tx.status === TransactionStatus.Overdue ? 'text-rose-400' : 'text-slate-400')}>{formatDate(tx.dueDate)}</td>
                    <td>{formatCurrency(tx.amount)}</td>
                    <td className="text-emerald-400">{formatCurrency(tx.paidAmount)}</td>
                    <td className="font-semibold">{formatCurrency(tx.outstandingAmount)}</td>
                    <td><Badge variant={getPriorityBadgeVariant(tx.priority)} dot>{getPriorityLabel(tx.priority)}</Badge></td>
                    <td><Badge variant={getStatusBadgeVariant(tx.status)} dot>{getStatusLabel(tx.status)}</Badge></td>
                    <td>
                      {tx.outstandingAmount > 0 && (
                        <button onClick={() => { setPaymentModal(tx); setPaymentAmount(tx.outstandingAmount); }} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 transition-colors"><DollarSign size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState icon={<ArrowUpRight size={28} />} title="No transactions found" description="Add your first supplier transaction" action={<Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Add Transaction</Button>} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Supplier Transaction" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Supplier" value={form.supplierId} onChange={e => setForm({ ...form, supplierId: Number(e.target.value) })} placeholder="Select supplier" options={suppliers?.map(s => ({ value: s.id!, label: s.name })) || []} />
          <Input label="Invoice Number" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} />
          <Input label="Invoice Date" type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} />
          <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          <Input label="Amount (₹)" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
          <Select label="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} options={[{ value: 1, label: 'P1' }, { value: 2, label: 'P2' }, { value: 3, label: 'P3' }, { value: 4, label: 'P4' }, { value: 5, label: 'P5' }]} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Add Transaction</Button>
        </div>
      </Modal>

      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title="Record Payment" size="sm">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-800/50 text-sm">
            <p className="text-slate-400">Invoice: <span className="text-slate-200">{paymentModal?.invoiceNumber}</span></p>
            <p className="text-slate-400">Outstanding: <span className="text-amber-400 font-semibold">{formatCurrency(paymentModal?.outstandingAmount || 0)}</span></p>
          </div>
          <Input label="Payment Amount (₹)" type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setPaymentModal(null)}>Cancel</Button>
          <Button variant="success" onClick={handleRecordPayment}>Record Payment</Button>
        </div>
      </Modal>
    </div>
  );
}
