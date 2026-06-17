/* ======================================
   FLOW BOARD — Buyer-Supplier Mapping Canvas
   ====================================== */

import { useMemo, useCallback, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, Position,
  MarkerType, Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Star, ArrowRight, X, Plus } from 'lucide-react';

import { db } from '@/db/database';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatCurrencyCompact, cn } from '@/utils/helpers';
import { RiskRating, TransactionStatus, EntityStatus } from '@/types/enums';
import type { Buyer, Supplier } from '@/types/models';

// Custom Hinglish Modals
import { BuyerFlowModal } from './BuyerFlowModal';
import { SupplierFlowModal } from './SupplierFlowModal';

// Hinglish preset ratings mapping
const RATING_PRESETS = [
  { label: '💎 Advance Raja', risk: RiskRating.Low, score: 95, stars: 5, desc: 'Paisa pehle hi de deta hai' },
  { label: '✅ Time Ka Pakka', risk: RiskRating.Low, score: 85, stars: 4, desc: 'Commitment matlab commitment' },
  { label: '📦 Maal Pe Paisa', risk: RiskRating.Medium, score: 65, stars: 3, desc: 'Delivery ke waqt mil jata hai' },
  { label: '⏳ Thoda Late', risk: RiskRating.Medium, score: 50, stars: 2, desc: 'Dega, par do-chaar din peeche' },
  { label: '🙏 Bhagwan Bharose', risk: RiskRating.Critical, score: 25, stars: 1, desc: 'Kab dega, pata nahi' },
];

const PRIORITY_PRESETS = [
  { label: '🔴 Time Pe Chahiye', priority: 1, bullet: '🔴', desc: 'Date pe date nahi chalega', textColor: 'text-rose-400', bgColor: 'bg-rose-500/10' },
  { label: '🟡 1-2 Din Theek', priority: 3, bullet: '🟡', desc: 'Thoda adjustments chalta hai', textColor: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { label: '🟢 Relation Wala', priority: 5, bullet: '🟢', desc: 'Apna banda hai, adjust kar lega', textColor: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
];

function getBuyerPreset(risk: RiskRating, score: number) {
  return RATING_PRESETS.find(p => p.risk === risk || Math.abs(p.score - score) < 10) || RATING_PRESETS[3];
}

function getSupplierPreset(priority: number) {
  return PRIORITY_PRESETS.find(p => p.priority === priority) || PRIORITY_PRESETS[1];
}

/* --- Custom Header Node --- */
function HeaderNode({ data }: { data: { label: string } }) {
  return (
    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-1.5 w-[220px] select-none">
      {data.label}
    </div>
  );
}

/* --- Custom Buyer Node --- */
function BuyerNode({ data }: { data: { 
  label: string; 
  outstanding: number; 
  preset: typeof RATING_PRESETS[0];
  isConnecting: boolean;
  allocationStatus: string;
} }) {
  return (
    <div className={cn(
      "px-4 py-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border shadow-lg min-w-[220px] relative transition-all duration-300",
      data.isConnecting 
        ? "border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-[1.03]" 
        : "border-slate-800/80 hover:border-slate-700"
    )}>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-emerald-400 !border-0" />
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
          {data.preset.label.split(' ').slice(1).join(' ')}
        </span>
        <span className="text-[10px] text-slate-500 flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={10}
              fill={i < data.preset.stars ? '#10b981' : 'none'}
              className={i < data.preset.stars ? 'text-emerald-400' : 'text-slate-700'}
            />
          ))}
        </span>
      </div>
      <p className="text-sm font-bold text-slate-100 truncate">{data.label}</p>
      <p className="text-lg font-extrabold text-emerald-400 mt-1">{formatCurrency(data.outstanding)}</p>
      <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px]">
        <span className="text-slate-400 font-medium">{data.preset.score}/100 score</span>
        <span className={cn("font-semibold", data.allocationStatus.includes('pura') ? "text-emerald-400 font-bold" : "text-slate-400")}>
          {data.allocationStatus}
        </span>
      </div>
    </div>
  );
}

/* --- Custom Supplier Node --- */
function SupplierNode({ data }: { data: { 
  label: string; 
  outstanding: number; 
  preset: typeof PRIORITY_PRESETS[0];
  isConnectingActive: boolean;
  coverageStatus: string;
} }) {
  return (
    <div className={cn(
      "px-4 py-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border shadow-lg min-w-[220px] relative transition-all duration-300",
      data.isConnectingActive
        ? "border-amber-400/80 animate-pulse cursor-pointer hover:scale-[1.03] hover:border-amber-400"
        : "border-slate-800/80 hover:border-slate-700"
    )}>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-amber-400 !border-0" />
      <div className="flex items-center gap-1.5 mb-2">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-slate-800", data.preset.textColor, data.preset.bgColor)}>
          {data.preset.bullet} {data.preset.label.split(' ').slice(1).join(' ')}
        </span>
      </div>
      <p className="text-sm font-bold text-slate-100 truncate">{data.label}</p>
      <p className="text-lg font-extrabold text-amber-400 mt-1">{formatCurrency(data.outstanding)}</p>
      <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px]">
        <span className="text-slate-500 truncate max-w-[120px]">{data.preset.desc}</span>
        <span className={cn("font-semibold", data.coverageStatus.includes('pura') ? "text-emerald-400 font-bold" : "text-slate-400")}>
          {data.coverageStatus}
        </span>
      </div>
    </div>
  );
}

const defaultBuyer: Partial<Buyer> = {
  code: '', name: '', contactPerson: '', phone: '', email: '', address: '',
  gstNumber: '', creditLimit: 100000, creditDays: 30, riskRating: RiskRating.Low,
  paymentReliabilityScore: 80, relationshipScore: 75, status: EntityStatus.Active,
};

const defaultSupplier: Partial<Supplier> = {
  code: '', name: '', contactPerson: '', phone: '', email: '', address: '',
  gstNumber: '', paymentPriority: 3, paymentTerms: 'Net 30', relationshipScore: 75,
  preferredPaymentMethod: 'Bank Transfer (NEFT/RTGS)', status: EntityStatus.Active,
};

const nodeTypes = {
  buyerNode: BuyerNode,
  supplierNode: SupplierNode,
  headerNode: HeaderNode,
};

export function FlowBoardPage() {
  const { user } = useAuthStore();
  const orgId = user?.orgId || 1;

  // DB queries
  const buyers = useLiveQuery(() => db.buyers.where('orgId').equals(orgId).toArray(), [orgId]);
  const suppliers = useLiveQuery(() => db.suppliers.where('orgId').equals(orgId).toArray(), [orgId]);
  const buyerTxs = useLiveQuery(() => db.buyerTransactions.where('orgId').equals(orgId).toArray(), [orgId]);
  const supplierTxs = useLiveQuery(() => db.supplierTransactions.where('orgId').equals(orgId).toArray(), [orgId]);
  const settings = useLiveQuery(() => db.settings.where('orgId').equals(orgId).toArray(), [orgId]);

  // State
  const [connectingBuyerId, setConnectingBuyerId] = useState<number | null>(null);
  const [activeBuyerModal, setActiveBuyerModal] = useState<any | null>(null);
  const [activeSupplierModal, setActiveSupplierModal] = useState<any | null>(null);

  // Add Buyer/Supplier Form States
  const [buyerModalOpen, setBuyerModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [newBuyer, setNewBuyer] = useState<Partial<Buyer>>(defaultBuyer);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>(defaultSupplier);
  const [newBuyerWeeklyAmount, setNewBuyerWeeklyAmount] = useState<number>(10000);
  const [newSupplierWeeklyAmount, setNewSupplierWeeklyAmount] = useState<number>(10000);

  // Additional Transaction Details States
  const [buyerInvoiceNumber, setBuyerInvoiceNumber] = useState('');
  const [buyerInvoiceDate, setBuyerInvoiceDate] = useState('');
  const [buyerDueDate, setBuyerDueDate] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');

  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState('');
  const [supplierDueDate, setSupplierDueDate] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  const openBuyerAddModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dueStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setNewBuyer(defaultBuyer);
    setNewBuyerWeeklyAmount(10000);
    setBuyerInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setBuyerInvoiceDate(todayStr);
    setBuyerDueDate(dueStr);
    setBuyerNotes('Added via Flow Board');
    setBuyerModalOpen(true);
  };

  const openSupplierAddModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dueStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setNewSupplier(defaultSupplier);
    setNewSupplierWeeklyAmount(10000);
    setSupplierInvoiceNumber(`PO-${Date.now().toString().slice(-6)}`);
    setSupplierInvoiceDate(todayStr);
    setSupplierDueDate(dueStr);
    setSupplierNotes('Added via Flow Board');
    setSupplierModalOpen(true);
  };

  const handleSaveBuyer = async () => {
    const now = new Date().toISOString();
    const count = (await db.buyers.where('orgId').equals(orgId).count()) + 1;
    const buyerId = await db.buyers.add({
      ...defaultBuyer, ...newBuyer, orgId,
      code: newBuyer.code || `BUY${String(count).padStart(3, '0')}`,
      createdBy: user?.email || '', createdAt: now, updatedBy: user?.email || '', updatedAt: now,
    } as Buyer);

    if (newBuyerWeeklyAmount > 0) {
      await db.buyerTransactions.add({
        orgId,
        buyerId,
        invoiceNumber: buyerInvoiceNumber || `INV-${Date.now()}`,
        invoiceDate: buyerInvoiceDate || new Date().toISOString().split('T')[0],
        dueDate: buyerDueDate || new Date().toISOString().split('T')[0],
        amount: newBuyerWeeklyAmount,
        receivedAmount: 0,
        outstandingAmount: newBuyerWeeklyAmount,
        collectionProbability: getBuyerPreset(newBuyer.riskRating || RiskRating.Low, newBuyer.paymentReliabilityScore || 80).score,
        status: TransactionStatus.Pending,
        notes: buyerNotes || 'Initial weekly amount set via Flow Board',
        createdBy: user?.email || '',
        createdAt: now,
        updatedBy: user?.email || '',
        updatedAt: now,
      });
    }

    setBuyerModalOpen(false);
  };

  const handleSaveSupplier = async () => {
    const now = new Date().toISOString();
    const count = (await db.suppliers.where('orgId').equals(orgId).count()) + 1;
    const supplierId = await db.suppliers.add({
      ...defaultSupplier, ...newSupplier, orgId,
      code: newSupplier.code || `SUP${String(count).padStart(3, '0')}`,
      createdBy: user?.email || '', createdAt: now, updatedBy: user?.email || '', updatedAt: now,
    } as Supplier);

    if (newSupplierWeeklyAmount > 0) {
      await db.supplierTransactions.add({
        orgId,
        supplierId,
        invoiceNumber: supplierInvoiceNumber || `PO-${Date.now()}`,
        invoiceDate: supplierInvoiceDate || new Date().toISOString().split('T')[0],
        dueDate: supplierDueDate || new Date().toISOString().split('T')[0],
        amount: newSupplierWeeklyAmount,
        paidAmount: 0,
        outstandingAmount: newSupplierWeeklyAmount,
        priority: newSupplier.paymentPriority || 3,
        status: TransactionStatus.Pending,
        notes: supplierNotes || 'Initial weekly amount set via Flow Board',
        createdBy: user?.email || '',
        createdAt: now,
        updatedBy: user?.email || '',
        updatedAt: now,
      });
    }

    setSupplierModalOpen(false);
  };

  // Manual flow edges parsing from settings
  const flowEdgesSetting = settings?.find(s => s.key === 'flow_edges');
  const manualEdges = useMemo(() => {
    if (!flowEdgesSetting?.value) return [];
    try {
      return JSON.parse(flowEdgesSetting.value) as { buyerId: number; supplierId: number }[];
    } catch (e) {
      console.error('Failed to parse manual flow edges setting', e);
      return [];
    }
  }, [flowEdgesSetting]);

  // DB Handlers
  const handleCreateEdge = useCallback(async (buyerId: number, supplierId: number) => {
    const setting = await db.settings.where({ orgId, key: 'flow_edges' }).first();
    let currentEdges: { buyerId: number; supplierId: number }[] = [];
    if (setting) {
      try {
        currentEdges = JSON.parse(setting.value);
      } catch (e) {}
    }

    // Map buyer to supplier (overwriting any existing mapping for this buyer)
    currentEdges = currentEdges.filter(e => e.buyerId !== buyerId);
    currentEdges.push({ buyerId, supplierId });

    const newValue = JSON.stringify(currentEdges);
    if (setting) {
      await db.settings.update(setting.id!, { value: newValue });
    } else {
      await db.settings.add({
        orgId,
        key: 'flow_edges',
        value: newValue,
        createdBy: user?.email || 'system',
        createdAt: new Date().toISOString(),
        updatedBy: user?.email || 'system',
        updatedAt: new Date().toISOString(),
      });
    }
  }, [orgId, user]);

  const handleClearBuyerEdge = useCallback(async (buyerId: number) => {
    const setting = await db.settings.where({ orgId, key: 'flow_edges' }).first();
    if (setting) {
      try {
        let currentEdges = JSON.parse(setting.value) as { buyerId: number; supplierId: number }[];
        currentEdges = currentEdges.filter(e => e.buyerId !== buyerId);
        await db.settings.update(setting.id!, { value: JSON.stringify(currentEdges) });
      } catch (e) {}
    }
  }, [orgId]);

  const handleClearSupplierEdges = useCallback(async (supplierId: number) => {
    const setting = await db.settings.where({ orgId, key: 'flow_edges' }).first();
    if (setting) {
      try {
        let currentEdges = JSON.parse(setting.value) as { buyerId: number; supplierId: number }[];
        currentEdges = currentEdges.filter(e => e.supplierId !== supplierId);
        await db.settings.update(setting.id!, { value: JSON.stringify(currentEdges) });
      } catch (e) {}
    }
  }, [orgId]);

  // Compute Outstanding Amounts
  const buyerOutstanding = useMemo(() => {
    const map = new Map<number, number>();
    buyerTxs?.forEach(t => {
      if (t.outstandingAmount > 0) {
        map.set(t.buyerId, (map.get(t.buyerId) || 0) + t.outstandingAmount);
      }
    });
    return map;
  }, [buyerTxs]);

  const supplierOutstanding = useMemo(() => {
    const map = new Map<number, number>();
    supplierTxs?.forEach(t => {
      if (t.outstandingAmount > 0) {
        map.set(t.supplierId, (map.get(t.supplierId) || 0) + t.outstandingAmount);
      }
    });
    return map;
  }, [supplierTxs]);

  // Set connecting state source display name
  const connectingBuyerName = useMemo(() => {
    if (connectingBuyerId === null || !buyers) return '';
    return buyers.find(b => b.id === connectingBuyerId)?.name || '';
  }, [connectingBuyerId, buyers]);

  // Generate Node/Edge data for ReactFlow canvas
  const { nodes, edges, stats } = useMemo(() => {
    if (!buyers || !suppliers || !buyerTxs || !supplierTxs) {
      return { nodes: [], edges: [], stats: { totalAllocated: 0, unallocatedBuyer: 0, unfundedSupplier: 0 } };
    }

    const buyerNodes: Node[] = [];
    const supplierNodes: Node[] = [];
    const allEdges: Edge[] = [];

    // Filter active elements
    const activeBuyers = buyers.filter(b => buyerOutstanding.has(b.id!));
    const activeSuppliers = suppliers.filter(s => supplierOutstanding.has(s.id!));

    const mappedBuyerIds = new Set(manualEdges.map(e => e.buyerId));
    const mappedSupplierIds = new Set(manualEdges.map(e => e.supplierId));

    // Calculate Stats
    let totalAllocated = 0;
    activeBuyers.forEach(b => {
      if (mappedBuyerIds.has(b.id!)) {
        totalAllocated += buyerOutstanding.get(b.id!) || 0;
      }
    });

    let unallocatedBuyer = 0;
    activeBuyers.forEach(b => {
      if (!mappedBuyerIds.has(b.id!)) {
        unallocatedBuyer += buyerOutstanding.get(b.id!) || 0;
      }
    });

    let unfundedSupplier = 0;
    activeSuppliers.forEach(s => {
      if (!mappedSupplierIds.has(s.id!)) {
        unfundedSupplier += supplierOutstanding.get(s.id!) || 0;
      }
    });

    // --- Create Buyer Nodes (Left side) ---
    // Header Node
    buyerNodes.push({
      id: 'header-buyers',
      type: 'headerNode',
      position: { x: 50, y: 10 },
      data: { label: 'BUYERS' },
      selectable: false,
    });

    activeBuyers.forEach((b, i) => {
      const outstanding = buyerOutstanding.get(b.id!) || 0;
      const isConnecting = connectingBuyerId === b.id;
      const preset = getBuyerPreset(b.riskRating, b.paymentReliabilityScore);
      const isMapped = mappedBuyerIds.has(b.id!);
      const allocationStatus = isMapped ? 'pura allocate ✔' : `₹${formatCurrencyCompact(outstanding)} bacha hai`;

      buyerNodes.push({
        id: `buyer-${b.id}`,
        type: 'buyerNode',
        position: { x: 50, y: 80 + i * 180 },
        data: {
          label: b.name,
          outstanding,
          preset,
          isConnecting,
          allocationStatus,
        },
        sourcePosition: Position.Right,
      });
    });

    // --- Create Supplier Nodes (Right side) ---
    // Sort suppliers: Big (>=20k) first, then Small (<20k)
    const bigSuppliers = activeSuppliers.filter(s => (supplierOutstanding.get(s.id!) || 0) >= 20000);
    const smallSuppliers = activeSuppliers.filter(s => (supplierOutstanding.get(s.id!) || 0) < 20000);

    // Big Suppliers Header
    supplierNodes.push({
      id: 'header-big-suppliers',
      type: 'headerNode',
      position: { x: 600, y: 10 },
      data: { label: 'BIG PAYMENT • ₹20,000+' },
      selectable: false,
    });

    let yOffset = 80;
    bigSuppliers.forEach((s) => {
      const outstanding = supplierOutstanding.get(s.id!) || 0;
      const preset = getSupplierPreset(s.paymentPriority);
      const isCovered = mappedSupplierIds.has(s.id!);
      const coverageStatus = isCovered ? 'pura covered ✔' : 'not covered';

      supplierNodes.push({
        id: `supplier-${s.id}`,
        type: 'supplierNode',
        position: { x: 600, y: yOffset },
        data: {
          label: s.name,
          outstanding,
          preset,
          isConnectingActive: connectingBuyerId !== null,
          coverageStatus,
        },
        targetPosition: Position.Left,
      });
      yOffset += 180;
    });

    // Small Suppliers Header
    yOffset += 20;
    supplierNodes.push({
      id: 'header-small-suppliers',
      type: 'headerNode',
      position: { x: 600, y: yOffset },
      data: { label: 'SMALL PAYMENT' },
      selectable: false,
    });

    yOffset += 60;
    smallSuppliers.forEach((s) => {
      const outstanding = supplierOutstanding.get(s.id!) || 0;
      const preset = getSupplierPreset(s.paymentPriority);
      const isCovered = mappedSupplierIds.has(s.id!);
      const coverageStatus = isCovered ? 'pura covered ✔' : 'not covered';

      supplierNodes.push({
        id: `supplier-${s.id}`,
        type: 'supplierNode',
        position: { x: 600, y: yOffset },
        data: {
          label: s.name,
          outstanding,
          preset,
          isConnectingActive: connectingBuyerId !== null,
          coverageStatus,
        },
        targetPosition: Position.Left,
      });
      yOffset += 180;
    });

    // --- Create Custom Edges ---
    manualEdges.forEach((edge) => {
      const buyer = activeBuyers.find(b => b.id === edge.buyerId);
      const supplier = activeSuppliers.find(s => s.id === edge.supplierId);
      if (buyer && supplier) {
        const buyerAmount = buyerOutstanding.get(buyer.id!) || 0;
        allEdges.push({
          id: `e-${buyer.id}-${supplier.id}`,
          source: `buyer-${buyer.id}`,
          target: `supplier-${supplier.id}`,
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
          label: formatCurrencyCompact(buyerAmount),
          labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 600 },
          labelBgStyle: { fill: '#1e293b', stroke: 'rgba(16,185,129,0.2)', strokeWidth: 1 },
          labelBgPadding: [6, 4],
          labelBgBorderRadius: 6,
        });
      }
    });

    return {
      nodes: [...buyerNodes, ...supplierNodes],
      edges: allEdges,
      stats: { totalAllocated, unallocatedBuyer, unfundedSupplier },
    };
  }, [buyers, suppliers, buyerOutstanding, supplierOutstanding, manualEdges, connectingBuyerId]);

  // React Flow Node Click Interaction handler
  const onNodeClick = useCallback((_: any, node: Node) => {
    // Prevent actions on headers
    if (node.id.startsWith('header-')) return;

    if (node.id.startsWith('buyer-')) {
      const buyerId = parseInt(node.id.replace('buyer-', ''));
      if (connectingBuyerId !== null) {
        // Change selection of connection source buyer
        setConnectingBuyerId(buyerId);
      } else {
        // Open Buyer Details Modal
        const buyerObj = buyers?.find(b => b.id === buyerId);
        if (buyerObj) {
          setActiveBuyerModal({
            buyer: buyerObj,
            outstandingAmount: buyerOutstanding.get(buyerId) || 0,
            probability: buyerObj.paymentReliabilityScore,
          });
        }
      }
    } else if (node.id.startsWith('supplier-')) {
      const supplierId = parseInt(node.id.replace('supplier-', ''));
      if (connectingBuyerId !== null) {
        // Map the connecting buyer to this supplier
        handleCreateEdge(connectingBuyerId, supplierId);
        setConnectingBuyerId(null);
      } else {
        // Open Supplier Details Modal
        const supplierObj = suppliers?.find(s => s.id === supplierId);
        if (supplierObj) {
          setActiveSupplierModal({
            supplier: supplierObj,
            outstandingAmount: supplierOutstanding.get(supplierId) || 0,
          });
        }
      }
    }
  }, [connectingBuyerId, buyers, suppliers, buyerOutstanding, supplierOutstanding, handleCreateEdge]);

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-4 animate-fade-in flex-1 min-h-0 relative">
      
      {/* Connecting Flow Instruction Banner */}
      {connectingBuyerId !== null && (
        <div className="flex-none p-3 bg-slate-900 border border-emerald-500/30 rounded-xl flex items-center justify-between text-sm shadow-xl shadow-emerald-500/5 z-10 animate-slide-in">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ArrowRight size={18} className="animate-pulse" />
            <span>{connectingBuyerName} ka paisa kahan bhejna hai? Supplier pe tap karo</span>
          </div>
          <button 
            onClick={() => setConnectingBuyerId(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Title Header */}
      <div className="flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Flow Board</h1>
          <p className="text-sm text-slate-400">Buyer-to-Supplier payment allocation canvas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button icon={<Plus size={16} />} onClick={openBuyerAddModal}>
            Add Buyer
          </Button>
          <Button icon={<Plus size={16} />} onClick={openSupplierAddModal}>
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="flex-none grid grid-cols-3 gap-3">
        <Card hover={false} padding="sm" className="bg-slate-900/60 border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Total Allocated</p>
          <p className="text-lg font-bold text-teal-400 mt-0.5">{formatCurrency(stats.totalAllocated)}</p>
        </Card>
        <Card hover={false} padding="sm" className="bg-slate-900/60 border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Unallocated (Buyers)</p>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatCurrency(stats.unallocatedBuyer)}</p>
        </Card>
        <Card hover={false} padding="sm" className="bg-slate-900/60 border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Unfunded (Suppliers)</p>
          <p className="text-lg font-bold text-rose-400 mt-0.5">{formatCurrency(stats.unfundedSupplier)}</p>
        </Card>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-slate-800/60 relative bg-slate-950/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ animated: true }}
          className="bg-slate-950/50"
        >
          <Background color="rgba(148,163,184,0.03)" gap={24} size={1.5} />
          <Controls 
            className="!bg-slate-900 !border-slate-800 shadow-xl overflow-hidden rounded-lg [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!fill-slate-400 hover:[&>button]:!bg-slate-800" 
            showInteractive={false} 
          />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(n) => {
              if (n.type === 'buyerNode') return '#10b981';
              if (n.type === 'supplierNode') return '#f59e0b';
              return '#475569';
            }}
            maskColor="rgba(15,23,42,0.6)"
            className="!bg-slate-900 !border-slate-800 shadow-xl rounded-lg overflow-hidden !w-40 !h-24"
          />
        </ReactFlow>
      </div>

      {/* Custom Buyer Modal */}
      {activeBuyerModal && (
        <BuyerFlowModal
          isOpen={true}
          onClose={() => setActiveBuyerModal(null)}
          buyer={activeBuyerModal.buyer}
          outstandingAmount={activeBuyerModal.outstandingAmount}
          probability={activeBuyerModal.probability}
          onStartFlow={() => setConnectingBuyerId(activeBuyerModal.buyer.id)}
          onClearFlow={() => handleClearBuyerEdge(activeBuyerModal.buyer.id)}
          hasMapping={manualEdges.some(e => e.buyerId === activeBuyerModal.buyer.id)}
        />
      )}

      {/* Custom Supplier Modal */}
      {activeSupplierModal && (
        <SupplierFlowModal
          isOpen={true}
          onClose={() => setActiveSupplierModal(null)}
          supplier={activeSupplierModal.supplier}
          outstandingAmount={activeSupplierModal.outstandingAmount}
          onClearFlow={() => handleClearSupplierEdges(activeSupplierModal.supplier.id)}
          hasMapping={manualEdges.some(e => e.supplierId === activeSupplierModal.supplier.id)}
        />
      )}

      {/* Add New Buyer Modal */}
      <Modal isOpen={buyerModalOpen} onClose={() => setBuyerModalOpen(false)} title="Add New Buyer" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <Input label="Buyer Code" value={newBuyer.code || ''} onChange={e => setNewBuyer({ ...newBuyer, code: e.target.value })} placeholder="Auto-generated if empty" />
          <Input label="Buyer Name" value={newBuyer.name || ''} onChange={e => setNewBuyer({ ...newBuyer, name: e.target.value })} placeholder="Business name" required />
          <Input label="Contact Person" value={newBuyer.contactPerson || ''} onChange={e => setNewBuyer({ ...newBuyer, contactPerson: e.target.value })} placeholder="Primary contact" />
          <Input label="Phone" value={newBuyer.phone || ''} onChange={e => setNewBuyer({ ...newBuyer, phone: e.target.value })} placeholder="+91..." />
          <Input label="Email" type="email" value={newBuyer.email || ''} onChange={e => setNewBuyer({ ...newBuyer, email: e.target.value })} placeholder="email@company.com" />
          <Input label="GST Number" value={newBuyer.gstNumber || ''} onChange={e => setNewBuyer({ ...newBuyer, gstNumber: e.target.value })} placeholder="07AAACR..." />
          <Input label="Credit Limit (₹)" type="number" value={newBuyer.creditLimit || 0} onChange={e => setNewBuyer({ ...newBuyer, creditLimit: Number(e.target.value) })} />
          <Input label="Credit Days" type="number" value={newBuyer.creditDays || 30} onChange={e => setNewBuyer({ ...newBuyer, creditDays: Number(e.target.value) })} />
          <Select label="Risk Rating" value={newBuyer.riskRating || RiskRating.Low} onChange={e => setNewBuyer({ ...newBuyer, riskRating: e.target.value as RiskRating })} options={[
            { value: RiskRating.Low, label: 'Low' }, { value: RiskRating.Medium, label: 'Medium' },
            { value: RiskRating.High, label: 'High' }, { value: RiskRating.Critical, label: 'Critical' },
          ]} />
          <Input label="Reliability Score" type="number" value={newBuyer.paymentReliabilityScore || 80} onChange={e => setNewBuyer({ ...newBuyer, paymentReliabilityScore: Number(e.target.value) })} hint="0-100" />
          <Input label="Relationship Score" type="number" value={newBuyer.relationshipScore || 75} onChange={e => setNewBuyer({ ...newBuyer, relationshipScore: Number(e.target.value) })} hint="0-100" />
          <div className="sm:col-span-2">
            <Input label="Address" value={newBuyer.address || ''} onChange={e => setNewBuyer({ ...newBuyer, address: e.target.value })} placeholder="Full address" />
          </div>

          {/* Transaction Section */}
          <div className="sm:col-span-2 border-t border-slate-800/80 pt-4 mt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
              <span>📊</span> Initial Transaction Details (Flow Board Node Inflow)
            </h4>
          </div>
          <Input label="Weekly Inflow Amount (₹)" type="number" value={newBuyerWeeklyAmount} onChange={e => setNewBuyerWeeklyAmount(Number(e.target.value))} />
          <Input label="Invoice Number" value={buyerInvoiceNumber} onChange={e => setBuyerInvoiceNumber(e.target.value)} />
          <Input label="Invoice Date" type="date" value={buyerInvoiceDate} onChange={e => setBuyerInvoiceDate(e.target.value)} />
          <Input label="Due Date" type="date" value={buyerDueDate} onChange={e => setBuyerDueDate(e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Notes" value={buyerNotes} onChange={e => setBuyerNotes(e.target.value)} placeholder="e.g. Added via Flow Board" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
          <Button variant="secondary" onClick={() => setBuyerModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveBuyer}>Add Buyer</Button>
        </div>
      </Modal>

      {/* Add New Supplier Modal */}
      <Modal isOpen={supplierModalOpen} onClose={() => setSupplierModalOpen(false)} title="Add New Supplier" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <Input label="Supplier Code" value={newSupplier.code || ''} onChange={e => setNewSupplier({ ...newSupplier, code: e.target.value })} placeholder="Auto-generated" />
          <Input label="Supplier Name" value={newSupplier.name || ''} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} required />
          <Input label="Contact Person" value={newSupplier.contactPerson || ''} onChange={e => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })} />
          <Input label="Phone" value={newSupplier.phone || ''} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
          <Input label="Email" type="email" value={newSupplier.email || ''} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} />
          <Input label="GST Number" value={newSupplier.gstNumber || ''} onChange={e => setNewSupplier({ ...newSupplier, gstNumber: e.target.value })} />
          <Select label="Payment Priority" value={newSupplier.paymentPriority || 3} onChange={e => setNewSupplier({ ...newSupplier, paymentPriority: Number(e.target.value) })} options={[
            { value: 1, label: 'P1 — Critical' }, { value: 2, label: 'P2 — High' }, { value: 3, label: 'P3 — Medium' },
            { value: 4, label: 'P4 — Low' }, { value: 5, label: 'P5 — Optional' },
          ]} />
          <Input label="Payment Terms" value={newSupplier.paymentTerms || ''} onChange={e => setNewSupplier({ ...newSupplier, paymentTerms: e.target.value })} />
          <Input label="Relationship Score" type="number" value={newSupplier.relationshipScore || 75} onChange={e => setNewSupplier({ ...newSupplier, relationshipScore: Number(e.target.value) })} hint="0-100" />
          <Select label="Payment Method" value={newSupplier.preferredPaymentMethod || ''} onChange={e => setNewSupplier({ ...newSupplier, preferredPaymentMethod: e.target.value })} options={[
            { value: 'Cash', label: 'Cash' }, { value: 'Bank Transfer (NEFT/RTGS)', label: 'Bank Transfer (NEFT/RTGS)' },
            { value: 'UPI', label: 'UPI' }, { value: 'Cheque', label: 'Cheque' },
          ]} />
          <div className="sm:col-span-2">
            <Input label="Address" value={newSupplier.address || ''} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} />
          </div>

          {/* Transaction Section */}
          <div className="sm:col-span-2 border-t border-slate-800/80 pt-4 mt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <span>📊</span> Initial Transaction Details (Flow Board Node Outflow)
            </h4>
          </div>
          <Input label="Weekly Outflow Amount (₹)" type="number" value={newSupplierWeeklyAmount} onChange={e => setNewSupplierWeeklyAmount(Number(e.target.value))} />
          <Input label="PO Number / Invoice Number" value={supplierInvoiceNumber} onChange={e => setSupplierInvoiceNumber(e.target.value)} />
          <Input label="PO Date" type="date" value={supplierInvoiceDate} onChange={e => setSupplierInvoiceDate(e.target.value)} />
          <Input label="Due Date" type="date" value={supplierDueDate} onChange={e => setSupplierDueDate(e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Notes" value={supplierNotes} onChange={e => setSupplierNotes(e.target.value)} placeholder="e.g. Added via Flow Board" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
          <Button variant="secondary" onClick={() => setSupplierModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSupplier}>Add Supplier</Button>
        </div>
      </Modal>
    </div>
  );
}
