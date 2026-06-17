/* ======================================
   SUPPLIER FLOW MODAL — Custom Hinglish Modal
   ====================================== */

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Clock, Check } from 'lucide-react';
import { db } from '@/db/database';
import { Modal } from '@/components/ui/Modal';
import { TransactionStatus } from '@/types/enums';
import { formatCurrency } from '@/utils/helpers';
import { useAuthStore } from '@/stores/authStore';

interface SupplierFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: {
    id: number;
    name: string;
    paymentPriority: number;
    orgId: number;
  };
  outstandingAmount: number;
  onClearFlow: () => void;
  hasMapping: boolean;
}

// Hinglish priority settings mapping
const PRIORITY_PRESETS = [
  { label: '🔴 Time Pe Chahiye', priority: 1, bullet: '🔴', desc: 'Date pe date nahi chalega', textColor: 'text-rose-400', bgColor: 'bg-rose-500/10' },
  { label: '🟡 1-2 Din Theek', priority: 3, bullet: '🟡', desc: 'Thoda adjustments chalta hai', textColor: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { label: '🟢 Relation Wala', priority: 5, bullet: '🟢', desc: 'Apna banda hai, adjust kar lega', textColor: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
];

export function SupplierFlowModal({
  isOpen,
  onClose,
  supplier,
  outstandingAmount,
  onClearFlow,
  hasMapping,
}: SupplierFlowModalProps) {
  const { user } = useAuthStore();
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<number>(3);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      setEditAmount(outstandingAmount.toString());
      setSelectedPriority(supplier.paymentPriority);
      setSuccessMessage(null);
    }
  }, [isOpen, outstandingAmount, supplier]);

  const activePreset = PRIORITY_PRESETS.find((p) => p.priority === selectedPriority) || PRIORITY_PRESETS[1];

  // Update outstanding amount in DB
  const handleUpdateAmount = async () => {
    const newAmt = parseFloat(editAmount);
    if (isNaN(newAmt) || newAmt < 0) return;

    try {
      const txs = await db.supplierTransactions.where('supplierId').equals(supplier.id).toArray();
      const pendingTx = txs.find((t) => t.outstandingAmount > 0);

      if (pendingTx) {
        await db.supplierTransactions.update(pendingTx.id!, {
          outstandingAmount: newAmt,
          amount: newAmt + pendingTx.paidAmount,
          updatedBy: user?.email || 'system',
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new pending transaction
        await db.supplierTransactions.add({
          orgId: supplier.orgId,
          supplierId: supplier.id,
          invoiceNumber: `PO-${Date.now()}`,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          amount: newAmt,
          paidAmount: 0,
          outstandingAmount: newAmt,
          priority: selectedPriority,
          status: TransactionStatus.Pending,
          notes: 'Added via Flow Board',
          createdBy: user?.email || 'system',
          createdAt: new Date().toISOString(),
          updatedBy: user?.email || 'system',
          updatedAt: new Date().toISOString(),
        });
      }
      setIsEditingAmount(false);
      triggerSuccess('Amount updated successfully!');
    } catch (err) {
      console.error('Failed to update supplier transaction amount', err);
    }
  };

  // Update Priority Preset in DB
  const handleSelectPriority = async (prio: number) => {
    setSelectedPriority(prio);

    try {
      await db.suppliers.update(supplier.id, {
        paymentPriority: prio,
        updatedBy: user?.email || 'system',
        updatedAt: new Date().toISOString(),
      });

      // Also update any pending transactions priority
      const txs = await db.supplierTransactions.where('supplierId').equals(supplier.id).toArray();
      const pendingTx = txs.find((t) => t.outstandingAmount > 0);
      if (pendingTx) {
        await db.supplierTransactions.update(pendingTx.id!, {
          priority: prio,
          updatedAt: new Date().toISOString(),
        });
      }
      triggerSuccess('Priority updated successfully!');
    } catch (err) {
      console.error('Failed to update supplier priority', err);
    }
  };

  // Record a payment mark
  const handleMarkPayment = async (type: string) => {
    try {
      const txs = await db.supplierTransactions.where('supplierId').equals(supplier.id).toArray();
      const pendingTx = txs.find((t) => t.outstandingAmount > 0);
      if (!pendingTx) return;

      const paid = pendingTx.paidAmount + pendingTx.outstandingAmount;
      await db.supplierTransactions.update(pendingTx.id!, {
        paidAmount: paid,
        outstandingAmount: 0,
        status: TransactionStatus.Paid,
        notes: `Paid marked as: ${type}`,
        updatedBy: user?.email || 'system',
        updatedAt: new Date().toISOString(),
      });

      triggerSuccess(`Marked as paid (${type})! Outstanding cleared.`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to mark payment', err);
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="bg-slate-900 border border-slate-800 text-slate-100 max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-50">{supplier.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 shadow-sm border-slate-700/80 bg-slate-800 ${activePreset.textColor}`}>
                {activePreset.bullet} {activePreset.label.split(' ').slice(1).join(' ')}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{activePreset.desc}</p>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
            <Check size={16} />
            {successMessage}
          </div>
        )}

        {/* Input Container: IS HAFTE DENA HAI */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 mb-6 relative hover:border-amber-500/20 transition-colors">
          <label className="block text-[10px] font-semibold text-amber-400/80 tracking-wider uppercase mb-1">
            IS HAFTE DENA HAI
          </label>
          <div className="flex items-center justify-between">
            {isEditingAmount ? (
              <div className="flex items-center gap-2 w-full">
                <span className="text-2xl font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold text-xl w-36 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                <button
                  onClick={handleUpdateAmount}
                  className="px-3 py-1 bg-amber-500 text-slate-950 font-semibold rounded text-sm hover:bg-amber-400 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingAmount(false);
                    setEditAmount(outstandingAmount.toString());
                  }}
                  className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-sm hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span className="text-3xl font-black text-slate-50">{formatCurrency(outstandingAmount)}</span>
                <button
                  onClick={() => setIsEditingAmount(true)}
                  className="p-2 bg-slate-900/60 text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 rounded-lg border border-slate-800 transition-all shadow-sm"
                >
                  <Pencil size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Section 1: Payment Mark Options */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Payment de diya? Kaise gaya — mark karo:
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleMarkPayment('Time Pe De Diya')}
              className="py-2.5 px-3 bg-slate-950/30 border border-slate-800/60 rounded-xl text-left text-sm text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
            >
              <span>✅</span> Time Pe De Diya
            </button>
            <button
              onClick={() => handleMarkPayment('Late Diya — Chal Gaya')}
              className="py-2.5 px-3 bg-slate-950/30 border border-slate-800/60 rounded-xl text-left text-sm text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
            >
              <span>🟢</span> Late Diya — Chal Gaya
            </button>
            <button
              onClick={() => handleMarkPayment('Late Diya — Naraz Hue')}
              className="py-2.5 px-3 bg-slate-950/30 border border-slate-800/60 rounded-xl text-left text-sm text-slate-300 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all flex items-center gap-2 col-span-2"
            >
              <span>🔴</span> Late Diya — Naraz Hue
            </button>
          </div>
        </div>

        {/* Section 2: Rating Presets Selection */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Rating khud set karo (aap inko pehle se jaante ho)
          </h3>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleSelectPriority(preset.priority)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  selectedPriority === preset.priority
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Payment History Summary */}
        <div className="mb-6 p-4 rounded-xl border border-slate-800/60 bg-slate-950/20 flex gap-3 items-start">
          <Clock size={16} className="text-slate-500 mt-0.5 flex-none" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300 block mb-0.5">Payment History</span>
            Abhi koi record nahi — shuruaati rating aapke andaaze se set hai. Jaise-jaise payments mark karoge, yeh khud seekhega.
          </div>
        </div>

        {/* Footer Actions */}
        {hasMapping && (
          <div className="mt-8">
            <button
              onClick={() => {
                onClearFlow();
                onClose();
              }}
              className="w-full py-3 px-4 bg-slate-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
            >
              <Trash2 size={16} />
              <span>Hatao</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
