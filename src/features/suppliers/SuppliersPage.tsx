/* ======================================
   SUPPLIER MANAGEMENT PAGE
   ====================================== */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Truck, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { db } from '@/db/database';
import { useAuthStore } from '@/stores/authStore';
import { EntityStatus } from '@/types/enums';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, getPriorityLabel, getPriorityBadgeVariant } from '@/utils/helpers';
import type { Supplier } from '@/types/models';

const defaultSupplier: Partial<Supplier> = {
  code: '', name: '', contactPerson: '', phone: '', email: '', address: '',
  gstNumber: '', paymentPriority: 3, paymentTerms: 'Net 30', relationshipScore: 75,
  preferredPaymentMethod: 'Bank Transfer (NEFT/RTGS)', status: EntityStatus.Active,
};

export function SuppliersPage() {
  const { user } = useAuthStore();
  const orgId = user?.orgId || 1;
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Supplier>>(defaultSupplier);
  const [isEditing, setIsEditing] = useState(false);

  const suppliers = useLiveQuery(() => db.suppliers.where('orgId').equals(orgId).toArray(), [orgId]);
  const supplierTxs = useLiveQuery(() => db.supplierTransactions.where('orgId').equals(orgId).toArray(), [orgId]);

  const filtered = suppliers?.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  const getOutstanding = (supplierId: number) =>
    supplierTxs?.filter(t => t.supplierId === supplierId).reduce((s, t) => s + t.outstandingAmount, 0) || 0;

  const handleSave = async () => {
    const now = new Date().toISOString();
    if (isEditing && editing.id) {
      await db.suppliers.update(editing.id, { ...editing, updatedBy: user?.email || '', updatedAt: now });
    } else {
      const count = (await db.suppliers.where('orgId').equals(orgId).count()) + 1;
      await db.suppliers.add({
        ...defaultSupplier, ...editing, orgId,
        code: editing.code || `SUP${String(count).padStart(3, '0')}`,
        createdBy: user?.email || '', createdAt: now, updatedBy: user?.email || '', updatedAt: now,
      } as Supplier);
    }
    setModalOpen(false);
    setEditing(defaultSupplier);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Suppliers</h1>
          <p className="text-sm text-slate-400">{suppliers?.length || 0} total suppliers</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { setEditing(defaultSupplier); setIsEditing(false); setModalOpen(true); }}>
          Add Supplier
        </Button>
      </div>

      <div className="max-w-md">
        <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
      </div>

      {filtered && filtered.length > 0 ? (
        <Card hover={false} padding="none">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Priority</th>
                  <th>Terms</th>
                  <th>Outstanding</th>
                  <th>Relationship</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.filter(s => s.status === EntityStatus.Active).map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs text-teal-400">{s.code}</td>
                    <td className="font-medium text-slate-200">{s.name}</td>
                    <td className="text-slate-400 text-sm">{s.contactPerson}</td>
                    <td><Badge variant={getPriorityBadgeVariant(s.paymentPriority)} dot>{getPriorityLabel(s.paymentPriority)}</Badge></td>
                    <td className="text-slate-400 text-sm">{s.paymentTerms}</td>
                    <td className="font-semibold">{formatCurrency(getOutstanding(s.id!))}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-400 rounded-full" style={{ width: `${s.relationshipScore}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{s.relationshipScore}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditing(s); setIsEditing(true); setModalOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-700/50 transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => db.suppliers.update(s.id!, { status: EntityStatus.Inactive })} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState icon={<Truck size={28} />} title="No suppliers found" description="Add your first supplier to track payables"
          action={<Button icon={<Plus size={16} />} onClick={() => { setEditing(defaultSupplier); setIsEditing(false); setModalOpen(true); }}>Add Supplier</Button>}
        />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Edit Supplier' : 'Add New Supplier'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Supplier Code" value={editing.code || ''} onChange={e => setEditing({ ...editing, code: e.target.value })} placeholder="Auto-generated" />
          <Input label="Supplier Name" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} required />
          <Input label="Contact Person" value={editing.contactPerson || ''} onChange={e => setEditing({ ...editing, contactPerson: e.target.value })} />
          <Input label="Phone" value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} />
          <Input label="Email" type="email" value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} />
          <Input label="GST Number" value={editing.gstNumber || ''} onChange={e => setEditing({ ...editing, gstNumber: e.target.value })} />
          <Select label="Payment Priority" value={editing.paymentPriority || 3} onChange={e => setEditing({ ...editing, paymentPriority: Number(e.target.value) })} options={[
            { value: 1, label: 'P1 — Critical' }, { value: 2, label: 'P2 — High' }, { value: 3, label: 'P3 — Medium' },
            { value: 4, label: 'P4 — Low' }, { value: 5, label: 'P5 — Optional' },
          ]} />
          <Input label="Payment Terms" value={editing.paymentTerms || ''} onChange={e => setEditing({ ...editing, paymentTerms: e.target.value })} />
          <Input label="Relationship Score" type="number" value={editing.relationshipScore || 75} onChange={e => setEditing({ ...editing, relationshipScore: Number(e.target.value) })} hint="0-100" />
          <Select label="Payment Method" value={editing.preferredPaymentMethod || ''} onChange={e => setEditing({ ...editing, preferredPaymentMethod: e.target.value })} options={[
            { value: 'Cash', label: 'Cash' }, { value: 'Bank Transfer (NEFT/RTGS)', label: 'Bank Transfer (NEFT/RTGS)' },
            { value: 'UPI', label: 'UPI' }, { value: 'Cheque', label: 'Cheque' },
          ]} />
          <div className="sm:col-span-2">
            <Input label="Address" value={editing.address || ''} onChange={e => setEditing({ ...editing, address: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Add Supplier'}</Button>
        </div>
      </Modal>
    </div>
  );
}
