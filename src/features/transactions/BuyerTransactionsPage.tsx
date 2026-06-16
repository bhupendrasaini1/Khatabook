/* ======================================
   BUYER TRANSACTIONS PAGE
   ====================================== */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowDownLeft, Plus, Search, DollarSign } from 'lucide-react';
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
import { formatCurrency, formatDate, getStatusBadgeVariant, getStatusLabel, cn } from '@/utils/helpers';
import type { BuyerTransaction } from '@/types/models';
import { format, addDays } from 'date-fns';

export function BuyerTransactionsPage() {
  const { user } = useAuthStore();
  const orgId = user?.orgId || 1;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState<BuyerTransaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    buyerId: 0, invoiceNumber: '', invoiceDate: today,
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    amount: 0, collectionProbability: 80, notes: '',
  });

  const buyers = useLiveQuery(() => db.buyers.where('orgId').equals(orgId).and(b => b.status === EntityStatus.Active).toArray(), [orgId]);
  const transactions = useLiveQuery(() => db.buyerTransactions.where('orgId').equals(orgId).toArray(), [orgId]);

  const buyerMap = new Map(buyers?.map(b => [b.id, b.name]) || []);

  const filtered = transactions?.filter(t => {
    const matchSearch = buyerMap.get(t.buyerId)?.toLowerCase().includes(search.toLowerCase()) ||
      t.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));

  const handleSave = async () => {
    const now = new Date().toISOString();
    await db.buyerTransactions.add({
      orgId, buyerId: form.buyerId, invoiceNumber: form.invoiceNumber,
      invoiceDate: form.invoiceDate, dueDate: form.dueDate,
      amount: form.amount, receivedAmount: 0, outstandingAmount: form.amount,
      collectionProbability: form.collectionProbability,
      status: TransactionStatus.Pending, notes: form.notes,
      createdBy: user?.email || '', createdAt: now, updatedBy: user?.email || '', updatedAt: now,
    });
    setModalOpen(false);
    setForm({ buyerId: 0, invoiceNumber: '', invoiceDate: today, dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'), amount: 0, collectionProbability: 80, notes: '' });
  };

  const handleRecordPayment = async () => {
    if (!paymentModal?.id) return;
    const newReceived = paymentModal.receivedAmount + paymentAmount;
    const newOutstanding = paymentModal.amount - newReceived;
    let status: TransactionStatus;
    if (newReceived >= paymentModal.amount) status = TransactionStatus.Received;
    else if (newReceived > 0) status = TransactionStatus.PartiallyReceived;
    else status = paymentModal.status;

    await db.buyerTransactions.update(paymentModal.id, {
      receivedAmount: newReceived, outstandingAmount: Math.max(0, newOutstanding),
      status, updatedBy: user?.email || '', updatedAt: new Date().toISOString(),
    });
    setPaymentModal(null);
    setPaymentAmount(0);
  };

  const totalOutstanding = filtered?.reduce((s, t) => s + t.outstandingAmount, 0) || 0;
  const totalAmount = filtered?.reduce((s, t) => s + t.amount, 0) || 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Buyer Transactions</h1>
          <p className="text-sm text-slate-400">Outstanding: <span className="text-emerald-400 font-semibold">{formatCurrency(totalOutstanding)}</span> of {formatCurrency(totalAmount)}</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Add Transaction</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input placeholder="Search by buyer or invoice..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={16} />} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', TransactionStatus.Pending, TransactionStatus.PartiallyReceived, TransactionStatus.Received, TransactionStatus.Overdue].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                statusFilter === s
                  ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              )}
            >
              {s === 'all' ? 'All' : getStatusLabel(s as TransactionStatus)}
            </button>
          ))}
        </div>
      </div>

      {filtered && filtered.length > 0 ? (
        <Card hover={false} padding="none">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Buyer</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Received</th>
                  <th>Outstanding</th>
                  <th>Prob.</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id} className={tx.status === TransactionStatus.Overdue ? 'bg-rose-500/[0.03]' : ''}>
                    <td className="font-mono text-xs text-teal-400">{tx.invoiceNumber}</td>
                    <td className="font-medium text-slate-200">{buyerMap.get(tx.buyerId) || '—'}</td>
                    <td className="text-slate-400 text-sm">{formatDate(tx.invoiceDate)}</td>
                    <td className={cn('text-sm', tx.status === TransactionStatus.Overdue ? 'text-rose-400' : 'text-slate-400')}>{formatDate(tx.dueDate)}</td>
                    <td>{formatCurrency(tx.amount)}</td>
                    <td className="text-emerald-400">{formatCurrency(tx.receivedAmount)}</td>
                    <td className="font-semibold">{formatCurrency(tx.outstandingAmount)}</td>
                    <td>
                      <span className={cn('text-xs font-medium', tx.collectionProbability >= 70 ? 'text-emerald-400' : tx.collectionProbability >= 40 ? 'text-amber-400' : 'text-rose-400')}>
                        {tx.collectionProbability}%
                      </span>
                    </td>
                    <td><Badge variant={getStatusBadgeVariant(tx.status)} dot>{getStatusLabel(tx.status)}</Badge></td>
                    <td>
                      {tx.outstandingAmount > 0 && (
                        <button onClick={() => { setPaymentModal(tx); setPaymentAmount(tx.outstandingAmount); }} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 transition-colors" title="Record Payment">
                          <DollarSign size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState icon={<ArrowDownLeft size={28} />} title="No transactions found" description="Add your first buyer transaction"
          action={<Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Add Transaction</Button>}
        />
      )}

      {/* Add Transaction Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Buyer Transaction" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Buyer" value={form.buyerId} onChange={e => setForm({ ...form, buyerId: Number(e.target.value) })}
            placeholder="Select buyer" options={buyers?.map(b => ({ value: b.id!, label: b.name })) || []} />
          <Input label="Invoice Number" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} />
          <Input label="Invoice Date" type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} />
          <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          <Input label="Amount (₹)" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
          <Input label="Collection Probability (%)" type="number" value={form.collectionProbability} onChange={e => setForm({ ...form, collectionProbability: Number(e.target.value) })} />
          <div className="sm:col-span-2">
            <Input label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Add Transaction</Button>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title="Record Payment" size="sm">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-800/50 text-sm">
            <p className="text-slate-400">Invoice: <span className="text-slate-200">{paymentModal?.invoiceNumber}</span></p>
            <p className="text-slate-400">Outstanding: <span className="text-emerald-400 font-semibold">{formatCurrency(paymentModal?.outstandingAmount || 0)}</span></p>
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
