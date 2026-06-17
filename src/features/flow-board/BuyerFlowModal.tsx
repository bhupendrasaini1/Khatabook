/* ======================================
   BUYER FLOW MODAL — Custom Hinglish Modal
   ====================================== */

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Clock, Star, Check } from 'lucide-react';
import { db } from '@/db/database';
import { Modal } from '@/components/ui/Modal';
import { TransactionStatus, RiskRating } from '@/types/enums';
import { formatCurrency } from '@/utils/helpers';
import { useAuthStore } from '@/stores/authStore';

interface BuyerFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyer: {
    id: number;
    name: string;
    riskRating: RiskRating;
    paymentReliabilityScore: number;
    orgId: number;
  };
  outstandingAmount: number;
  probability: number;
  onStartFlow: () => void;
  onClearFlow: () => void;
  hasMapping: boolean;
}

// Hinglish preset ratings mapping
const RATING_PRESETS = [
  { label: '💎 Advance Raja', risk: RiskRating.Low, score: 95, stars: 5, desc: 'Paisa pehle hi de deta hai' },
  { label: '✅ Time Ka Pakka', risk: RiskRating.Low, score: 85, stars: 4, desc: 'Commitment matlab commitment' },
  { label: '📦 Maal Pe Paisa', risk: RiskRating.Medium, score: 65, stars: 3, desc: 'Delivery ke waqt mil jata hai' },
  { label: '⏳ Thoda Late', risk: RiskRating.Medium, score: 50, stars: 2, desc: 'Dega, par do-chaar din peeche' },
  { label: '🙏 Bhagwan Bharose', risk: RiskRating.Critical, score: 25, stars: 1, desc: 'Kab dega, pata nahi' },
];

export function BuyerFlowModal({
  isOpen,
  onClose,
  buyer,
  outstandingAmount,
  probability,
  onStartFlow,
  onClearFlow,
  hasMapping,
}: BuyerFlowModalProps) {
  const { user } = useAuthStore();
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      setEditAmount(outstandingAmount.toString());
      // Find matching preset
      const currentPreset = RATING_PRESETS.find(
        (p) => p.risk === buyer.riskRating || Math.abs(p.score - buyer.paymentReliabilityScore) < 10
      );
      setSelectedRating(currentPreset?.label || '⏳ Thoda Late');
      setSuccessMessage(null);
    }
  }, [isOpen, outstandingAmount, buyer, probability]);

  const activePreset = RATING_PRESETS.find((p) => p.label === selectedRating) || RATING_PRESETS[3];

  // Update transaction amount in DB
  const handleUpdateAmount = async () => {
    const newAmt = parseFloat(editAmount);
    if (isNaN(newAmt) || newAmt < 0) return;

    try {
      const txs = await db.buyerTransactions.where('buyerId').equals(buyer.id).toArray();
      const pendingTx = txs.find((t) => t.outstandingAmount > 0);

      if (pendingTx) {
        await db.buyerTransactions.update(pendingTx.id!, {
          outstandingAmount: newAmt,
          amount: newAmt + pendingTx.receivedAmount,
          updatedBy: user?.email || 'system',
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new pending transaction
        await db.buyerTransactions.add({
          orgId: buyer.orgId,
          buyerId: buyer.id,
          invoiceNumber: `INV-${Date.now()}`,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          amount: newAmt,
          receivedAmount: 0,
          outstandingAmount: newAmt,
          collectionProbability: activePreset.score,
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
      console.error('Failed to update buyer transaction amount', err);
    }
  };

  // Update Rating Preset in DB
  const handleSelectRating = async (presetLabel: string) => {
    setSelectedRating(presetLabel);
    const preset = RATING_PRESETS.find((p) => p.label === presetLabel);
    if (!preset) return;

    try {
      await db.buyers.update(buyer.id, {
        riskRating: preset.risk,
        paymentReliabilityScore: preset.score,
        updatedBy: user?.email || 'system',
        updatedAt: new Date().toISOString(),
      });

      // Also update any pending transactions probability
      const txs = await db.buyerTransactions.where('buyerId').equals(buyer.id).toArray();
      const pendingTx = txs.find((t) => t.outstandingAmount > 0);
      if (pendingTx) {
        await db.buyerTransactions.update(pendingTx.id!, {
          collectionProbability: preset.score,
          updatedAt: new Date().toISOString(),
        });
      }
      triggerSuccess('Rating updated successfully!');
    } catch (err) {
      console.error('Failed to update buyer rating', err);
    }
  };

  // Record a payment mark
  const handleMarkPayment = async (type: string, isLate: boolean) => {
    try {
      const txs = await db.buyerTransactions.where('buyerId').equals(buyer.id).toArray();
      const pendingTx = txs.find((t) => t.outstandingAmount > 0);
      if (!pendingTx) return;

      const received = pendingTx.receivedAmount + pendingTx.outstandingAmount;
      await db.buyerTransactions.update(pendingTx.id!, {
        receivedAmount: received,
        outstandingAmount: 0,
        status: TransactionStatus.Received,
        notes: `Paid marked as: ${type}`,
        updatedBy: user?.email || 'system',
        updatedAt: new Date().toISOString(),
      });

      // Adjust reliability score based on how they paid
      let scoreAdjustment = 0;
      if (type.includes('Advance')) scoreAdjustment = 5;
      else if (type.includes('Time Pe')) scoreAdjustment = 2;
      else if (type.includes('Late')) scoreAdjustment = -5;
      else if (type.includes('Bahut Late')) scoreAdjustment = -10;

      const newScore = Math.max(0, Math.min(100, buyer.paymentReliabilityScore + scoreAdjustment));
      let newRisk = RiskRating.Medium;
      if (newScore >= 80) newRisk = RiskRating.Low;
      else if (newScore < 40) newRisk = RiskRating.Critical;

      await db.buyers.update(buyer.id, {
        paymentReliabilityScore: newScore,
        riskRating: newRisk,
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
              <h2 className="text-2xl font-bold text-slate-50">{buyer.name}</h2>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-amber-400 flex items-center gap-1.5 shadow-sm">
                🙏 {activePreset.label.split(' ').slice(1).join(' ')}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
              <span>{activePreset.desc}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center text-emerald-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < activePreset.stars ? 'currentColor' : 'none'}
                    className={i < activePreset.stars ? 'text-emerald-400' : 'text-slate-700'}
                  />
                ))}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium">{activePreset.score}/100</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {/* Handled by Modal primitive or custom header, but we render inline design */}
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
            <Check size={16} />
            {successMessage}
          </div>
        )}

        {/* Input Container: IS HAFTE AANA HAI */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 mb-6 relative hover:border-emerald-500/20 transition-colors">
          <label className="block text-[10px] font-semibold text-emerald-400/80 tracking-wider uppercase mb-1">
            IS HAFTE AANA HAI
          </label>
          <div className="flex items-center justify-between">
            {isEditingAmount ? (
              <div className="flex items-center gap-2 w-full">
                <span className="text-2xl font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold text-xl w-36 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button
                  onClick={handleUpdateAmount}
                  className="px-3 py-1 bg-emerald-500 text-slate-950 font-semibold rounded text-sm hover:bg-emerald-400 transition-colors"
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
                  className="p-2 bg-slate-900/60 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 rounded-lg border border-slate-800 transition-all shadow-sm"
                >
                  <Pencil size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Section 1: Payment Marking Options */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Paisa aa gaya? Kaise diya — mark karo (isi se rating banti hai):
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleMarkPayment('💎 Advance Diya', false)}
              className="py-2.5 px-3 bg-slate-950/30 border border-slate-800/60 rounded-xl text-left text-sm text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
            >
              <span>💎</span> Advance Diya
            </button>
            <button
              onClick={() => handleMarkPayment('✅ Time Pe Diya', false)}
              className="py-2.5 px-3 bg-slate-950/30 border border-slate-800/60 rounded-xl text-left text-sm text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
            >
              <span>✅</span> Time Pe Diya
            </button>
            <button
              onClick={() => handleMarkPayment('📦 Maal Pe Diya', false)}
              className="py-2.5 px-3 bg-slate-950/30 border border-slate-800/60 rounded-xl text-left text-sm text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
            >
              <span>📦</span> Delivery Pe Diya
            </button>
            <button
              onClick={() => handleMarkPayment('⏳ 2-3 Din Late', true)}
              className="py-2.5 px-3 bg-slate-950/30 border border-slate-800/60 rounded-xl text-left text-sm text-slate-300 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all flex items-center gap-2"
            >
              <span>⏳</span> 2-3 Din Late
            </button>
            <button
              onClick={() => handleMarkPayment('🙏 Bahut Late Diya', true)}
              className="py-2.5 px-3 bg-slate-950/30 border border-slate-800/60 rounded-xl text-left text-sm text-slate-300 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all flex items-center gap-2 col-span-2"
            >
              <span>🙏</span> Bahut Late Diya
            </button>
          </div>
        </div>

        {/* Section 2: Rating Presets Selection */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Rating khud set karo (aap inko pehle se jaante ho)
          </h3>
          <div className="flex flex-wrap gap-2">
            {RATING_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleSelectRating(preset.label)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  selectedRating === preset.label
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
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => {
              onStartFlow();
              onClose();
            }}
            className="flex-1 py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-center rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>→</span> Iska Flow Banao
          </button>
          {hasMapping && (
            <button
              onClick={() => {
                onClearFlow();
                onClose();
              }}
              className="py-3 px-4 bg-slate-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Trash2 size={16} />
              <span>Hatao</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
