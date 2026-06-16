/* ======================================
   WEEKLY PLANNING PAGE
   ====================================== */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Calendar, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { db } from '@/db/database';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatCurrencyCompact, formatDate, cn } from '@/utils/helpers';
import { CHART_COLORS } from '@/types/constants';

export function PlanningPage() {
  const { user } = useAuthStore();
  const orgId = user?.orgId || 1;

  const plans = useLiveQuery(() => db.paymentPlans.where('orgId').equals(orgId).toArray(), [orgId]);
  const buyerTxs = useLiveQuery(() => db.buyerTransactions.where('orgId').equals(orgId).toArray(), [orgId]);
  const supplierTxs = useLiveQuery(() => db.supplierTransactions.where('orgId').equals(orgId).toArray(), [orgId]);
  const buyers = useLiveQuery(() => db.buyers.where('orgId').equals(orgId).toArray(), [orgId]);
  const suppliers = useLiveQuery(() => db.suppliers.where('orgId').equals(orgId).toArray(), [orgId]);

  const buyerMap = new Map(buyers?.map(b => [b.id, b.name]) || []);
  const supplierMap = new Map(suppliers?.map(s => [s.id, s.name]) || []);

  const chartData = useMemo(() =>
    plans?.map((p, i) => ({
      name: `Week ${i + 1}`,
      incoming: p.expectedCollections,
      outgoing: p.plannedPayments,
      buffer: p.cashBuffer,
    })) || [], [plans]);

  const activePlan = plans?.[0];

  // Collect pending buyer txs and supplier txs
  const pendingBuyerTxs = buyerTxs?.filter(t => t.outstandingAmount > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 10) || [];
  const pendingSupplierTxs = supplierTxs?.filter(t => t.outstandingAmount > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 10) || [];

  const totalExpected = pendingBuyerTxs.reduce((s, t) => s + (t.outstandingAmount * t.collectionProbability / 100), 0);
  const totalPlanned = pendingSupplierTxs.reduce((s, t) => s + t.outstandingAmount, 0);
  const buffer = totalExpected - totalPlanned;

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Weekly Cash Flow Planning</h1>
        <p className="text-sm text-slate-400 mt-0.5">Plan and forecast your cash flow across weeks</p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover={false} glow="emerald" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400"><ArrowDownLeft size={20} /></div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Expected Collections</p>
              <p className="text-xl font-bold text-slate-50">{formatCurrency(Math.round(totalExpected))}</p>
              <p className="text-xs text-slate-500">Weighted by probability</p>
            </div>
          </div>
        </Card>
        <Card hover={false} glow="rose" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-400"><ArrowUpRight size={20} /></div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Planned Payments</p>
              <p className="text-xl font-bold text-slate-50">{formatCurrency(totalPlanned)}</p>
            </div>
          </div>
        </Card>
        <Card hover={false} glow={buffer >= 0 ? 'teal' : 'rose'} padding="md">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-lg', buffer >= 0 ? 'bg-teal-500/15 text-teal-400' : 'bg-rose-500/15 text-rose-400')}><ShieldCheck size={20} /></div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Cash Buffer</p>
              <p className={cn('text-xl font-bold', buffer >= 0 ? 'text-teal-400' : 'text-rose-400')}>{formatCurrency(Math.round(buffer))}</p>
              <p className="text-xs text-slate-500">{buffer >= 0 ? '✅ Healthy' : '⚠️ Cash deficit'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 4-Week Forecast Chart */}
      <Card hover={false} padding="lg">
        <CardHeader>
          <CardTitle>4-Week Forecast</CardTitle>
          {activePlan && <Badge variant="success" dot>Active Plan: {formatDate(activePlan.weekStart)}</Badge>}
        </CardHeader>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS.emerald} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_COLORS.emerald} stopOpacity={0} /></linearGradient>
                <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS.rose} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_COLORS.rose} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} tickFormatter={(v) => formatCurrencyCompact(v)} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px' }} formatter={(value: any) => [formatCurrency(value as number), '']} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Area type="monotone" dataKey="incoming" name="Incoming" stroke={CHART_COLORS.emerald} fill="url(#gIn)" strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.emerald }} />
              <Area type="monotone" dataKey="outgoing" name="Outgoing" stroke={CHART_COLORS.rose} fill="url(#gOut)" strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.rose }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Week</th><th>Period</th><th>Incoming</th><th>Outgoing</th><th>Buffer</th><th>Status</th></tr></thead>
            <tbody>
              {plans?.map((p, i) => (
                <tr key={p.id}>
                  <td className="font-medium text-slate-200">Week {i + 1}</td>
                  <td className="text-slate-400 text-sm">{formatDate(p.weekStart)} — {formatDate(p.weekEnd)}</td>
                  <td className="text-emerald-400 font-semibold">{formatCurrency(p.expectedCollections)}</td>
                  <td className="text-rose-400 font-semibold">{formatCurrency(p.plannedPayments)}</td>
                  <td className={cn('font-bold', p.cashBuffer >= 0 ? 'text-teal-400' : 'text-rose-400')}>{formatCurrency(p.cashBuffer)}</td>
                  <td><Badge variant={p.cashBuffer >= 0 ? 'success' : 'danger'} dot>{p.cashBuffer >= 0 ? 'Healthy' : 'Deficit'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Split view: Expected Collections vs Planned Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card hover={false} padding="none">
          <div className="p-5 border-b border-slate-700/30 flex items-center gap-2">
            <ArrowDownLeft size={18} className="text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-100">Expected Collections</h3>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="table-base">
              <thead><tr><th>Buyer</th><th>Invoice</th><th>Amount</th><th>Prob.</th><th>Weighted</th></tr></thead>
              <tbody>
                {pendingBuyerTxs.map(tx => (
                  <tr key={tx.id}>
                    <td className="text-slate-200 text-sm">{buyerMap.get(tx.buyerId) || '—'}</td>
                    <td className="font-mono text-xs text-slate-400">{tx.invoiceNumber}</td>
                    <td>{formatCurrency(tx.outstandingAmount)}</td>
                    <td className={cn('text-xs', tx.collectionProbability >= 70 ? 'text-emerald-400' : 'text-amber-400')}>{tx.collectionProbability}%</td>
                    <td className="text-emerald-400 font-semibold">{formatCurrency(Math.round(tx.outstandingAmount * tx.collectionProbability / 100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card hover={false} padding="none">
          <div className="p-5 border-b border-slate-700/30 flex items-center gap-2">
            <ArrowUpRight size={18} className="text-amber-400" />
            <h3 className="text-base font-semibold text-slate-100">Planned Payments</h3>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="table-base">
              <thead><tr><th>Supplier</th><th>Invoice</th><th>Outstanding</th><th>Due</th><th>Priority</th></tr></thead>
              <tbody>
                {pendingSupplierTxs.map(tx => (
                  <tr key={tx.id}>
                    <td className="text-slate-200 text-sm">{supplierMap.get(tx.supplierId) || '—'}</td>
                    <td className="font-mono text-xs text-slate-400">{tx.invoiceNumber}</td>
                    <td>{formatCurrency(tx.outstandingAmount)}</td>
                    <td className="text-sm text-slate-400">{formatDate(tx.dueDate)}</td>
                    <td><Badge variant={getPriorityBadgeVariant(tx.priority)} dot>{getPriorityLabel(tx.priority)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Import helpers used above
import { getPriorityLabel, getPriorityBadgeVariant } from '@/utils/helpers';
