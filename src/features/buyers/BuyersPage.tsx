/* ======================================
   BUYER MANAGEMENT PAGE
   ====================================== */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Users, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { db } from '@/db/database';
import { useAuthStore } from '@/stores/authStore';
import { RiskRating, EntityStatus } from '@/types/enums';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, getRiskBadgeVariant, cn } from '@/utils/helpers';
import type { Buyer } from '@/types/models';

const defaultBuyer: Partial<Buyer> = {
  code: '', name: '', contactPerson: '', phone: '', email: '', address: '',
  gstNumber: '', creditLimit: 100000, creditDays: 30, riskRating: RiskRating.Low,
  paymentReliabilityScore: 80, relationshipScore: 75, status: EntityStatus.Active,
};

export function BuyersPage() {
  const { user } = useAuthStore();
  const orgId = user?.orgId || 1;
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Partial<Buyer>>(defaultBuyer);
  const [isEditing, setIsEditing] = useState(false);

  const buyers = useLiveQuery(() =>
    db.buyers.where('orgId').equals(orgId).toArray(), [orgId]
  );

  const buyerTxs = useLiveQuery(() =>
    db.buyerTransactions.where('orgId').equals(orgId).toArray(), [orgId]
  );

  const filtered = buyers?.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase())
  );

  const getOutstanding = (buyerId: number) =>
    buyerTxs?.filter(t => t.buyerId === buyerId).reduce((s, t) => s + t.outstandingAmount, 0) || 0;

  const handleSave = async () => {
    const now = new Date().toISOString();
    if (isEditing && editingBuyer.id) {
      await db.buyers.update(editingBuyer.id, { ...editingBuyer, updatedBy: user?.email || '', updatedAt: now });
    } else {
      const count = (await db.buyers.where('orgId').equals(orgId).count()) + 1;
      await db.buyers.add({
        ...defaultBuyer, ...editingBuyer, orgId,
        code: editingBuyer.code || `BUY${String(count).padStart(3, '0')}`,
        createdBy: user?.email || '', createdAt: now, updatedBy: user?.email || '', updatedAt: now,
      } as Buyer);
    }
    setModalOpen(false);
    setEditingBuyer(defaultBuyer);
  };

  const handleEdit = (b: Buyer) => {
    setEditingBuyer(b);
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await db.buyers.update(id, { status: EntityStatus.Inactive });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Buyers</h1>
          <p className="text-sm text-slate-400">{buyers?.length || 0} total buyers</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { setEditingBuyer(defaultBuyer); setIsEditing(false); setModalOpen(true); }}>
          Add Buyer
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search buyers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={16} />}
        />
      </div>

      {/* Table */}
      {filtered && filtered.length > 0 ? (
        <Card hover={false} padding="none">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Credit Limit</th>
                  <th>Outstanding</th>
                  <th>Risk</th>
                  <th>Reliability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.filter(b => b.status === EntityStatus.Active).map((b) => (
                  <tr key={b.id}>
                    <td className="font-mono text-xs text-teal-400">{b.code}</td>
                    <td className="font-medium text-slate-200">{b.name}</td>
                    <td className="text-slate-400 text-sm">{b.contactPerson}</td>
                    <td>{formatCurrency(b.creditLimit)}</td>
                    <td className="font-semibold">{formatCurrency(getOutstanding(b.id!))}</td>
                    <td><Badge variant={getRiskBadgeVariant(b.riskRating)} dot>{b.riskRating}</Badge></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', b.paymentReliabilityScore >= 70 ? 'bg-emerald-400' : b.paymentReliabilityScore >= 40 ? 'bg-amber-400' : 'bg-rose-400')}
                            style={{ width: `${b.paymentReliabilityScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{b.paymentReliabilityScore}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-700/50 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(b.id!)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<Users size={28} />}
          title="No buyers found"
          description="Add your first buyer to start tracking receivables"
          action={<Button icon={<Plus size={16} />} onClick={() => { setEditingBuyer(defaultBuyer); setIsEditing(false); setModalOpen(true); }}>Add Buyer</Button>}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Edit Buyer' : 'Add New Buyer'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Buyer Code" value={editingBuyer.code || ''} onChange={e => setEditingBuyer({ ...editingBuyer, code: e.target.value })} placeholder="Auto-generated if empty" />
          <Input label="Buyer Name" value={editingBuyer.name || ''} onChange={e => setEditingBuyer({ ...editingBuyer, name: e.target.value })} placeholder="Business name" required />
          <Input label="Contact Person" value={editingBuyer.contactPerson || ''} onChange={e => setEditingBuyer({ ...editingBuyer, contactPerson: e.target.value })} placeholder="Primary contact" />
          <Input label="Phone" value={editingBuyer.phone || ''} onChange={e => setEditingBuyer({ ...editingBuyer, phone: e.target.value })} placeholder="+91..." />
          <Input label="Email" type="email" value={editingBuyer.email || ''} onChange={e => setEditingBuyer({ ...editingBuyer, email: e.target.value })} placeholder="email@company.com" />
          <Input label="GST Number" value={editingBuyer.gstNumber || ''} onChange={e => setEditingBuyer({ ...editingBuyer, gstNumber: e.target.value })} placeholder="07AAACR..." />
          <Input label="Credit Limit (₹)" type="number" value={editingBuyer.creditLimit || 0} onChange={e => setEditingBuyer({ ...editingBuyer, creditLimit: Number(e.target.value) })} />
          <Input label="Credit Days" type="number" value={editingBuyer.creditDays || 30} onChange={e => setEditingBuyer({ ...editingBuyer, creditDays: Number(e.target.value) })} />
          <Select label="Risk Rating" value={editingBuyer.riskRating || RiskRating.Low} onChange={e => setEditingBuyer({ ...editingBuyer, riskRating: e.target.value as RiskRating })} options={[
            { value: RiskRating.Low, label: 'Low' }, { value: RiskRating.Medium, label: 'Medium' },
            { value: RiskRating.High, label: 'High' }, { value: RiskRating.Critical, label: 'Critical' },
          ]} />
          <Input label="Reliability Score" type="number" value={editingBuyer.paymentReliabilityScore || 80} onChange={e => setEditingBuyer({ ...editingBuyer, paymentReliabilityScore: Number(e.target.value) })} hint="0-100" />
          <Input label="Relationship Score" type="number" value={editingBuyer.relationshipScore || 75} onChange={e => setEditingBuyer({ ...editingBuyer, relationshipScore: Number(e.target.value) })} hint="0-100" />
          <div className="sm:col-span-2">
            <Input label="Address" value={editingBuyer.address || ''} onChange={e => setEditingBuyer({ ...editingBuyer, address: e.target.value })} placeholder="Full address" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Add Buyer'}</Button>
        </div>
      </Modal>
    </div>
  );
}
