/* ======================================
   FLOW BOARD — Buyer-Supplier Mapping Canvas
   ====================================== */

import { useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, Position,
  MarkerType, Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { db } from '@/db/database';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatCurrencyCompact, getRiskBadgeVariant, getPriorityBadgeVariant, getPriorityLabel, cn } from '@/utils/helpers';
import { ALLOCATION_WEIGHTS } from '@/types/constants';

/* --- Custom Buyer Node --- */
function BuyerNode({ data }: { data: { label: string; outstanding: number; probability: number; risk: string } }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 min-w-[180px] relative">
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-emerald-400 !border-0" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Buyer</span>
      </div>
      <p className="text-sm font-semibold text-slate-100 truncate">{data.label}</p>
      <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(data.outstanding)}</p>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full', data.probability >= 70 ? 'bg-emerald-400' : data.probability >= 40 ? 'bg-amber-400' : 'bg-rose-400')} style={{ width: `${data.probability}%` }} />
          </div>
          <span className="text-[10px] text-slate-400">{data.probability}%</span>
        </div>
        <Badge variant={getRiskBadgeVariant(data.risk as never)} className="text-[10px] py-0 px-1.5">{data.risk}</Badge>
      </div>
    </div>
  );
}

/* --- Custom Supplier Node --- */
function SupplierNode({ data }: { data: { label: string; outstanding: number; priority: number } }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 shadow-lg shadow-amber-500/5 min-w-[180px] relative">
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-amber-400 !border-0" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Supplier</span>
      </div>
      <p className="text-sm font-semibold text-slate-100 truncate">{data.label}</p>
      <p className="text-lg font-bold text-amber-400 mt-1">{formatCurrency(data.outstanding)}</p>
      <div className="mt-2">
        <Badge variant={getPriorityBadgeVariant(data.priority)} className="text-[10px]">{getPriorityLabel(data.priority)}</Badge>
      </div>
    </div>
  );
}

const nodeTypes = {
  buyerNode: BuyerNode,
  supplierNode: SupplierNode,
};

export function FlowBoardPage() {
  const { user } = useAuthStore();
  const orgId = user?.orgId || 1;

  const buyers = useLiveQuery(() => db.buyers.where('orgId').equals(orgId).toArray(), [orgId]);
  const suppliers = useLiveQuery(() => db.suppliers.where('orgId').equals(orgId).toArray(), [orgId]);
  const buyerTxs = useLiveQuery(() => db.buyerTransactions.where('orgId').equals(orgId).toArray(), [orgId]);
  const supplierTxs = useLiveQuery(() => db.supplierTransactions.where('orgId').equals(orgId).toArray(), [orgId]);

  const { nodes, edges, stats } = useMemo(() => {
    if (!buyers || !suppliers || !buyerTxs || !supplierTxs) return { nodes: [], edges: [], stats: { totalAllocated: 0, unallocatedBuyer: 0, unfundedSupplier: 0 } };

    const buyerNodes: Node[] = [];
    const supplierNodes: Node[] = [];
    const allEdges: Edge[] = [];

    // Buyer outstanding by buyer
    const buyerOutstanding = new Map<number, number>();
    const buyerAvgProb = new Map<number, number>();
    buyerTxs.forEach(t => {
      if (t.outstandingAmount > 0) {
        buyerOutstanding.set(t.buyerId, (buyerOutstanding.get(t.buyerId) || 0) + t.outstandingAmount);
        buyerAvgProb.set(t.buyerId, t.collectionProbability);
      }
    });

    // Supplier outstanding
    const supplierOutstanding = new Map<number, number>();
    const supplierPriority = new Map<number, number>();
    supplierTxs.forEach(t => {
      if (t.outstandingAmount > 0) {
        supplierOutstanding.set(t.supplierId, (supplierOutstanding.get(t.supplierId) || 0) + t.outstandingAmount);
        supplierPriority.set(t.supplierId, t.priority);
      }
    });

    // Create buyer nodes (left side)
    const activeBuyers = buyers.filter(b => buyerOutstanding.has(b.id!));
    activeBuyers.forEach((b, i) => {
      buyerNodes.push({
        id: `buyer-${b.id}`,
        type: 'buyerNode',
        position: { x: 50, y: i * 200 + 50 },
        data: {
          label: b.name,
          outstanding: buyerOutstanding.get(b.id!) || 0,
          probability: buyerAvgProb.get(b.id!) || 0,
          risk: b.riskRating,
        },
        sourcePosition: Position.Right,
      });
    });

    // Create supplier nodes (right side)
    const activeSuppliers = suppliers.filter(s => supplierOutstanding.has(s.id!));
    activeSuppliers.forEach((s, i) => {
      supplierNodes.push({
        id: `supplier-${s.id}`,
        type: 'supplierNode',
        position: { x: 600, y: i * 200 + 50 },
        data: {
          label: s.name,
          outstanding: supplierOutstanding.get(s.id!) || 0,
          priority: supplierPriority.get(s.id!) || 3,
        },
        targetPosition: Position.Left,
      });
    });

    // Auto-allocate: simple greedy allocation
    let totalAllocated = 0;
    const buyerRemaining = new Map(buyerOutstanding);
    const supplierRemaining = new Map(supplierOutstanding);

    // Sort suppliers by priority (ascending = P1 first)
    const sortedSuppliers = activeSuppliers.sort((a, b) => (a.paymentPriority) - (b.paymentPriority));
    // Sort buyers by probability (descending)
    const sortedBuyers = activeBuyers.sort((a, b) => (b.paymentReliabilityScore) - (a.paymentReliabilityScore));

    for (const supplier of sortedSuppliers) {
      let needed = supplierRemaining.get(supplier.id!) || 0;
      if (needed <= 0) continue;

      for (const buyer of sortedBuyers) {
        let available = buyerRemaining.get(buyer.id!) || 0;
        if (available <= 0) continue;

        const allocated = Math.min(available, needed);
        if (allocated > 0) {
          allEdges.push({
            id: `e-${buyer.id}-${supplier.id}`,
            source: `buyer-${buyer.id}`,
            target: `supplier-${supplier.id}`,
            animated: true,
            style: { stroke: '#14b8a6', strokeWidth: Math.max(1.5, Math.min(4, allocated / 50000)) },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#14b8a6' },
            label: formatCurrencyCompact(allocated),
            labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 600 },
            labelBgStyle: { fill: '#1e293b', stroke: 'rgba(148,163,184,0.1)', strokeWidth: 1 },
            labelBgPadding: [6, 4] as [number, number],
            labelBgBorderRadius: 6,
          });

          buyerRemaining.set(buyer.id!, available - allocated);
          supplierRemaining.set(supplier.id!, needed - allocated);
          totalAllocated += allocated;
          needed -= allocated;
        }
        if (needed <= 0) break;
      }
    }

    const unallocatedBuyer = Array.from(buyerRemaining.values()).reduce((s, v) => s + v, 0);
    const unfundedSupplier = Array.from(supplierRemaining.values()).reduce((s, v) => s + v, 0);

    return {
      nodes: [...buyerNodes, ...supplierNodes],
      edges: allEdges,
      stats: { totalAllocated, unallocatedBuyer, unfundedSupplier },
    };
  }, [buyers, suppliers, buyerTxs, supplierTxs]);



  return (
    <div className="p-4 lg:p-6 flex flex-col gap-4 animate-fade-in flex-1 min-h-0">
      <div className="flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Flow Board</h1>
          <p className="text-sm text-slate-400">Buyer-to-Supplier payment allocation canvas</p>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex-none grid grid-cols-3 gap-3">
        <Card hover={false} padding="sm">
          <p className="text-xs text-slate-400">Total Allocated</p>
          <p className="text-lg font-bold text-teal-400">{formatCurrency(stats.totalAllocated)}</p>
        </Card>
        <Card hover={false} padding="sm">
          <p className="text-xs text-slate-400">Unallocated (Buyers)</p>
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(stats.unallocatedBuyer)}</p>
        </Card>
        <Card hover={false} padding="sm">
          <p className="text-xs text-slate-400">Unfunded (Suppliers)</p>
          <p className="text-lg font-bold text-rose-400">{formatCurrency(stats.unfundedSupplier)}</p>
        </Card>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-slate-800/60 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ animated: true }}
          className="bg-slate-950/50"
        >
          <Background color="rgba(148,163,184,0.05)" gap={24} size={2} />
          <Controls 
            className="!bg-slate-900 !border-slate-800 shadow-xl overflow-hidden rounded-lg [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!fill-slate-400 hover:[&>button]:!bg-slate-800" 
            showInteractive={false} 
          />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(n) => n.id.startsWith('buyer') ? '#10b981' : '#f59e0b'}
            maskColor="rgba(15,23,42,0.6)"
            className="!bg-slate-900 !border-slate-800 shadow-xl rounded-lg overflow-hidden !w-40 !h-24"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
