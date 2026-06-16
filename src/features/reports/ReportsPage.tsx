/* ======================================
   REPORTS PAGE
   ====================================== */

import { useLiveQuery } from 'dexie-react-hooks';
import { FileBarChart, Download, ArrowDownLeft, ArrowUpRight, TrendingUp, Users, Truck, Clock, History } from 'lucide-react';
import { db } from '@/db/database';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, getStatusBadgeVariant, getStatusLabel } from '@/utils/helpers';

const reportCards = [
  { title: 'Outstanding Receivables', desc: 'All pending amounts from buyers', icon: <ArrowDownLeft size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { title: 'Outstanding Payables', desc: 'All pending amounts to suppliers', icon: <ArrowUpRight size={20} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { title: 'Cash Flow Forecast', desc: '4-week projection of cash flow', icon: <TrendingUp size={20} />, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { title: 'Buyer Performance', desc: 'Reliability and payment history', icon: <Users size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { title: 'Supplier Performance', desc: 'Payment terms and history', icon: <Truck size={20} />, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { title: 'Overdue Report', desc: 'All overdue invoices', icon: <Clock size={20} />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { title: 'Payment History', desc: 'All completed payments', icon: <History size={20} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

export function ReportsPage() {
  const { user } = useAuthStore();
  const orgId = user?.orgId || 1;

  const buyerTxs = useLiveQuery(() => db.buyerTransactions.where('orgId').equals(orgId).toArray(), [orgId]);
  const supplierTxs = useLiveQuery(() => db.supplierTransactions.where('orgId').equals(orgId).toArray(), [orgId]);
  const buyers = useLiveQuery(() => db.buyers.where('orgId').equals(orgId).toArray(), [orgId]);
  const suppliers = useLiveQuery(() => db.suppliers.where('orgId').equals(orgId).toArray(), [orgId]);

  const buyerMap = new Map(buyers?.map(b => [b.id, b.name]) || []);
  const supplierMap = new Map(suppliers?.map(s => [s.id, s.name]) || []);

  const outstandingBuyerTxs = buyerTxs?.filter(t => t.outstandingAmount > 0).sort((a, b) => b.outstandingAmount - a.outstandingAmount) || [];
  const outstandingSupplierTxs = supplierTxs?.filter(t => t.outstandingAmount > 0).sort((a, b) => b.outstandingAmount - a.outstandingAmount) || [];

  const totalReceivable = outstandingBuyerTxs.reduce((s, t) => s + t.outstandingAmount, 0);
  const totalPayable = outstandingSupplierTxs.reduce((s, t) => s + t.outstandingAmount, 0);

  const handleExportCSV = (data: Array<Record<string, unknown>>, filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Reports</h1>
        <p className="text-sm text-slate-400">Generate and export financial reports</p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {reportCards.map((r) => (
          <Card key={r.title} glow="teal" padding="md" className="cursor-pointer">
            <div className={`p-2.5 rounded-lg ${r.bg} ${r.color} w-fit mb-3`}>{r.icon}</div>
            <h3 className="text-sm font-semibold text-slate-200">{r.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
          </Card>
        ))}
      </div>

      {/* Outstanding Receivables */}
      <Card hover={false} padding="none">
        <div className="p-5 border-b border-slate-700/30 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Outstanding Receivables</h3>
            <p className="text-xs text-slate-400">Total: <span className="text-emerald-400 font-semibold">{formatCurrency(totalReceivable)}</span></p>
          </div>
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() =>
            handleExportCSV(outstandingBuyerTxs.map(t => ({ Buyer: buyerMap.get(t.buyerId), Invoice: t.invoiceNumber, DueDate: t.dueDate, Amount: t.amount, Received: t.receivedAmount, Outstanding: t.outstandingAmount, Status: t.status })), 'receivables')
          }>Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Buyer</th><th>Invoice</th><th>Due Date</th><th>Amount</th><th>Received</th><th>Outstanding</th><th>Status</th></tr></thead>
            <tbody>
              {outstandingBuyerTxs.slice(0, 10).map(tx => (
                <tr key={tx.id}>
                  <td className="text-slate-200 font-medium">{buyerMap.get(tx.buyerId)}</td>
                  <td className="font-mono text-xs text-slate-400">{tx.invoiceNumber}</td>
                  <td className="text-sm text-slate-400">{formatDate(tx.dueDate)}</td>
                  <td>{formatCurrency(tx.amount)}</td>
                  <td className="text-emerald-400">{formatCurrency(tx.receivedAmount)}</td>
                  <td className="font-semibold">{formatCurrency(tx.outstandingAmount)}</td>
                  <td><Badge variant={getStatusBadgeVariant(tx.status)} dot>{getStatusLabel(tx.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Outstanding Payables */}
      <Card hover={false} padding="none">
        <div className="p-5 border-b border-slate-700/30 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Outstanding Payables</h3>
            <p className="text-xs text-slate-400">Total: <span className="text-amber-400 font-semibold">{formatCurrency(totalPayable)}</span></p>
          </div>
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() =>
            handleExportCSV(outstandingSupplierTxs.map(t => ({ Supplier: supplierMap.get(t.supplierId), Invoice: t.invoiceNumber, DueDate: t.dueDate, Amount: t.amount, Paid: t.paidAmount, Outstanding: t.outstandingAmount, Status: t.status })), 'payables')
          }>Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Supplier</th><th>Invoice</th><th>Due Date</th><th>Amount</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr></thead>
            <tbody>
              {outstandingSupplierTxs.slice(0, 10).map(tx => (
                <tr key={tx.id}>
                  <td className="text-slate-200 font-medium">{supplierMap.get(tx.supplierId)}</td>
                  <td className="font-mono text-xs text-slate-400">{tx.invoiceNumber}</td>
                  <td className="text-sm text-slate-400">{formatDate(tx.dueDate)}</td>
                  <td>{formatCurrency(tx.amount)}</td>
                  <td className="text-emerald-400">{formatCurrency(tx.paidAmount)}</td>
                  <td className="font-semibold">{formatCurrency(tx.outstandingAmount)}</td>
                  <td><Badge variant={getStatusBadgeVariant(tx.status)} dot>{getStatusLabel(tx.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
