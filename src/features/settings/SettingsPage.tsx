/* ======================================
   SETTINGS PAGE
   ====================================== */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Settings, Building2, Palette, Bell, Shield } from 'lucide-react';
import { db } from '@/db/database';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function SettingsPage() {
  const { user } = useAuthStore();
  const orgId = user?.orgId || 1;

  const org = useLiveQuery(() => db.organizations.get(orgId), [orgId]);
  const [saved, setSaved] = useState(false);

  const handleSaveOrg = async () => {
    if (org?.id) {
      await db.organizations.update(org.id, { ...org, updatedAt: new Date().toISOString() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Settings</h1>
        <p className="text-sm text-slate-400">Manage your organization and preferences</p>
      </div>

      {/* Organization */}
      <Card hover={false} padding="lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-teal-400" />
            <CardTitle>Organization Details</CardTitle>
          </div>
        </CardHeader>
        {org && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Organization Name" value={org.name} readOnly />
            <Input label="Business Type" value={org.businessType} readOnly />
            <Input label="GST Number" value={org.gstNumber || 'Not set'} readOnly />
            <Input label="Currency" value={org.currency} readOnly />
            <Input label="Phone" value={org.phone || 'Not set'} readOnly />
            <Input label="Email" value={org.email} readOnly />
            <div className="sm:col-span-2">
              <Input label="Address" value={org.address || 'Not set'} readOnly />
            </div>
          </div>
        )}
      </Card>

      {/* Preferences */}
      <Card hover={false} padding="lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-violet-400" />
            <CardTitle>Appearance</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
            <div>
              <p className="text-sm font-medium text-slate-200">Dark Mode</p>
              <p className="text-xs text-slate-500">Use dark theme throughout the app</p>
            </div>
            <div 
              className="w-10 h-6 rounded-full bg-teal-500 relative cursor-pointer opacity-80"
              onClick={() => {
                alert('Khatabook is exclusively optimized for Dark Mode to reduce eye strain during financial analysis. Light mode is currently disabled.');
              }}
            >
              <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" />
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card hover={false} padding="lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-amber-400" />
            <CardTitle>Notifications</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-3">
          {['Payment due reminders', 'Overdue alerts', 'Low buffer warnings', 'High-risk alerts'].map(label => (
            <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
              <p className="text-sm text-slate-300">{label}</p>
              <div className="w-10 h-6 rounded-full bg-teal-500 relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Data */}
      <Card hover={false} padding="lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-rose-400" />
            <CardTitle>Data Management</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
            <div>
              <p className="text-sm font-medium text-slate-200">Storage Used</p>
              <p className="text-xs text-slate-500">IndexedDB local storage</p>
            </div>
            <span className="text-sm text-teal-400 font-medium">~2.5 MB</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">Export All Data</Button>
            <Button variant="danger" size="sm">Clear All Data</Button>
          </div>
        </div>
      </Card>

      {saved && (
        <div className="fixed bottom-6 right-6 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-sm text-emerald-400 animate-fade-in">
          ✓ Settings saved
        </div>
      )}
    </div>
  );
}
