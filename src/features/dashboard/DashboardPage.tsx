/* ======================================
   DASHBOARD PAGE — Main KPI & Charts View
   ====================================== */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft, ArrowUpRight, Wallet, ShieldAlert,
  TrendingUp, Clock, AlertTriangle, Plus, GitBranch, Calendar,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { db } from '@/db/database';
import { useAuthStore } from '@/stores/authStore';
import { TransactionStatus } from '@/types/enums';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  formatCurrency, formatCurrencyCompact, formatDate,
  getStatusBadgeVariant, getStatusLabel, calcPercentage,
} from '@/utils/helpers';
import { CHART_COLORS } from '@/types/constants';

export function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const orgId = user?.orgId || 1;

  // Live queries
  const buyerTxs = useLiveQuery(() =>
    db.buyerTransactions.where('orgId').equals(orgId).toArray(), [orgId]
  );
  const supplierTxs = useLiveQuery(() =>
    db.supplierTransactions.where('orgId').equals(orgId).toArray(), [orgId]
  );
  const buyers = useLiveQuery(() =>
    db.buyers.where('orgId').equals(orgId).toArray(), [orgId]
  );
  const suppliers = useLiveQuery(() =>
    db.suppliers.where('orgId').equals(orgId).toArray(), [orgId]
  );
  const plans = useLiveQuery(() =>
    db.paymentPlans.where('orgId').equals(orgId).toArray(), [orgId]
  );

  // Compute stats
  const stats = useMemo(() => {
    if (!buyerTxs || !supplierTxs) return null;

    const totalReceivables = buyerTxs.reduce((sum, t) => sum + t.outstandingAmount, 0);
    const totalPayables = supplierTxs.reduce((sum, t) => sum + t.outstandingAmount, 0);
    const totalBuyerAmount = buyerTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalSupplierAmount = supplierTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalReceived = buyerTxs.reduce((sum, t) => sum + t.receivedAmount, 0);
    const totalPaid = supplierTxs.reduce((sum, t) => sum + t.paidAmount, 0);

    const overdueB = buyerTxs.filter(t => t.status === TransactionStatus.Overdue).length;
    const overdueS = supplierTxs.filter(t => t.status === TransactionStatus.Overdue).length;
    const highRisk = buyerTxs.filter(t => t.collectionProbability < 50 && t.outstandingAmount > 0).length;

    return {
      totalReceivables,
      totalPayables,
      availableCash: totalReceived - totalPaid,
      bufferAmount: totalReceivables - totalPayables,
      collectionEfficiency: calcPercentage(totalReceived, totalBuyerAmount),
      paymentEfficiency: calcPercentage(totalPaid, totalSupplierAmount),
      overdueB,
      overdueS,
      highRisk,
    };
  }, [buyerTxs, supplierTxs]);

  // Weekly forecast chart data
  const forecastData = useMemo(() => {
    if (!plans) return [];
    return plans.map((p, i) => ({
      name: `Week ${i + 1}`,
      incoming: p.expectedCollections,
      outgoing: p.plannedPayments,
      buffer: p.cashBuffer,
    }));
  }, [plans]);

  // Top buyers by outstanding
  const topBuyers = useMemo(() => {
    if (!buyerTxs || !buyers) return [];
    const buyerMap = new Map(buyers.map(b => [b.id, b.name]));
    const grouped: Record<number, number> = {};
    buyerTxs.forEach(t => {
      if (t.outstandingAmount > 0) {
        grouped[t.buyerId] = (grouped[t.buyerId] || 0) + t.outstandingAmount;
      }
    });
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => ({
        name: buyerMap.get(Number(id)) || 'Unknown',
        amount,
      }));
  }, [buyerTxs, buyers]);

  // Top suppliers by outstanding
  const topSuppliers = useMemo(() => {
    if (!supplierTxs || !suppliers) return [];
    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
    const grouped: Record<number, number> = {};
    supplierTxs.forEach(t => {
      if (t.outstandingAmount > 0) {
        grouped[t.supplierId] = (grouped[t.supplierId] || 0) + t.outstandingAmount;
      }
    });
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => ({
        name: supplierMap.get(Number(id)) || 'Unknown',
        amount,
      }));
  }, [supplierTxs, suppliers]);

  // Risk distribution
  const riskDistribution = useMemo(() => {
    if (!buyerTxs) return [];
    const active = buyerTxs.filter(t => t.outstandingAmount > 0);
    const low = active.filter(t => t.collectionProbability >= 80).length;
    const medium = active.filter(t => t.collectionProbability >= 50 && t.collectionProbability < 80).length;
    const high = active.filter(t => t.collectionProbability >= 30 && t.collectionProbability < 50).length;
    const critical = active.filter(t => t.collectionProbability < 30).length;
    return [
      { name: 'Low', value: low, color: CHART_COLORS.emerald },
      { name: 'Medium', value: medium, color: CHART_COLORS.amber },
      { name: 'High', value: high, color: CHART_COLORS.rose },
      { name: 'Critical', value: critical, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [buyerTxs]);

  // Recent overdue transactions
  const recentOverdue = useMemo(() => {
    if (!buyerTxs || !buyers) return [];
    const buyerMap = new Map(buyers.map(b => [b.id, b.name]));
    return buyerTxs
      .filter(t => t.status === TransactionStatus.Overdue)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
      .map(t => ({ ...t, buyerName: buyerMap.get(t.buyerId) || 'Unknown' }));
  }, [buyerTxs, buyers]);

  if (!stats) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl animate-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Here&apos;s your cash flow overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Calendar size={16} />} onClick={() => navigate('/planning')}>
            Weekly Plan
          </Button>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => navigate('/transactions/buyer')}>
            New Transaction
          </Button>
        </div>
      </div>

      {/* KPI Cards — Bento grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <KPICard
          title="Total Receivables"
          value={formatCurrency(stats.totalReceivables)}
          subtitle={`From ${buyers?.length || 0} buyers`}
          icon={<ArrowDownLeft size={20} />}
          trend={8}
          accentColor="emerald"
        />
        <KPICard
          title="Total Payables"
          value={formatCurrency(stats.totalPayables)}
          subtitle={`To ${suppliers?.length || 0} suppliers`}
          icon={<ArrowUpRight size={20} />}
          trend={-3}
          accentColor="rose"
        />
        <KPICard
          title="Net Position"
          value={formatCurrency(stats.availableCash)}
          subtitle={stats.availableCash >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
          icon={<Wallet size={20} />}
          trend={12}
          accentColor={stats.availableCash >= 0 ? 'teal' : 'rose'}
        />
        <KPICard
          title="Buffer Amount"
          value={formatCurrency(stats.bufferAmount)}
          subtitle={stats.bufferAmount >= 0 ? 'Healthy buffer' : 'Cash deficit'}
          icon={<ShieldAlert size={20} />}
          accentColor={stats.bufferAmount >= 0 ? 'blue' : 'amber'}
        />
      </div>

      {/* Second row — Efficiency + Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <KPICard
          title="Collection Efficiency"
          value={`${stats.collectionEfficiency}%`}
          icon={<TrendingUp size={20} />}
          accentColor="teal"
        />
        <KPICard
          title="Payment Efficiency"
          value={`${stats.paymentEfficiency}%`}
          icon={<TrendingUp size={20} />}
          accentColor="violet"
        />
        <KPICard
          title="Overdue Invoices"
          value={`${stats.overdueB + stats.overdueS}`}
          subtitle={`${stats.overdueB} buyer, ${stats.overdueS} supplier`}
          icon={<Clock size={20} />}
          accentColor="amber"
        />
        <KPICard
          title="High Risk"
          value={`${stats.highRisk}`}
          subtitle="Low probability collections"
          icon={<AlertTriangle size={20} />}
          accentColor="rose"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Forecast — Area Chart */}
        <Card className="lg:col-span-2" hover={false} padding="lg">
          <CardHeader>
            <CardTitle>Weekly Cash Flow Forecast</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/planning')}>View All</Button>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradIncoming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.emerald} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOutgoing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.rose} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.rose} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} tickFormatter={(v) => formatCurrencyCompact(v)} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value: any) => [formatCurrency(value as number), '']}
                />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                <Area type="monotone" dataKey="incoming" name="Expected In" stroke={CHART_COLORS.emerald} fill="url(#gradIncoming)" strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.emerald }} />
                <Area type="monotone" dataKey="outgoing" name="Planned Out" stroke={CHART_COLORS.rose} fill="url(#gradOutgoing)" strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.rose }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Risk Distribution — Donut */}
        <Card hover={false} padding="lg">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <div className="h-72 flex items-center justify-center">
            {riskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500">No active transactions</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {riskDistribution.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-slate-400">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bar charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Buyers */}
        <Card hover={false} padding="lg">
          <CardHeader>
            <CardTitle>Top Buyers by Outstanding</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/buyers')}>View All</Button>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBuyers} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => formatCurrencyCompact(v)} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px' }} formatter={(value: any) => [formatCurrency(value as number), 'Outstanding']} />
                <Bar dataKey="amount" fill={CHART_COLORS.teal} radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Suppliers */}
        <Card hover={false} padding="lg">
          <CardHeader>
            <CardTitle>Top Suppliers by Outstanding</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/suppliers')}>View All</Button>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSuppliers} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => formatCurrencyCompact(v)} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px' }} formatter={(value: any) => [formatCurrency(value as number), 'Outstanding']} />
                <Bar dataKey="amount" fill={CHART_COLORS.amber} radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent overdue + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Overdue */}
        <Card className="lg:col-span-2" hover={false} padding="none">
          <div className="p-5 border-b border-slate-700/30">
            <h3 className="text-base font-semibold text-slate-100">Recent Overdue Invoices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Invoice</th>
                  <th>Due Date</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOverdue.length > 0 ? recentOverdue.map(tx => (
                  <tr key={tx.id}>
                    <td className="font-medium text-slate-200">{tx.buyerName}</td>
                    <td className="text-slate-400 font-mono text-xs">{tx.invoiceNumber}</td>
                    <td className="text-rose-400 text-sm">{formatDate(tx.dueDate)}</td>
                    <td className="font-semibold text-slate-200">{formatCurrency(tx.outstandingAmount)}</td>
                    <td><Badge variant={getStatusBadgeVariant(tx.status)} dot>{getStatusLabel(tx.status)}</Badge></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">No overdue invoices 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card hover={false} padding="lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {[
              { label: 'Add Buyer Transaction', icon: <ArrowDownLeft size={18} />, path: '/transactions/buyer', color: 'text-emerald-400' },
              { label: 'Add Supplier Transaction', icon: <ArrowUpRight size={18} />, path: '/transactions/supplier', color: 'text-amber-400' },
              { label: 'Create Weekly Plan', icon: <Calendar size={18} />, path: '/planning', color: 'text-blue-400' },
              { label: 'Open Flow Board', icon: <GitBranch size={18} />, path: '/flow-board', color: 'text-violet-400' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/40 border border-transparent hover:border-slate-700/40 transition-all duration-200 group"
              >
                <span className={`${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</span>
                <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
