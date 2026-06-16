/* ======================================
   PROFILE PAGE
   ====================================== */

import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { User, Mail, Shield, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Profile</h1>
        <p className="text-sm text-slate-400">Your account information</p>
      </div>

      {/* Avatar + Name */}
      <Card hover={false} padding="lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/20">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user?.name}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <Badge variant="info" className="mt-1">{user?.role?.replace('_', ' ')}</Badge>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card hover={false} padding="lg">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
            <User size={16} className="text-slate-500" />
            <div><p className="text-xs text-slate-500">Full Name</p><p className="text-sm text-slate-200">{user?.name}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
            <Mail size={16} className="text-slate-500" />
            <div><p className="text-xs text-slate-500">Email</p><p className="text-sm text-slate-200">{user?.email}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
            <Shield size={16} className="text-slate-500" />
            <div><p className="text-xs text-slate-500">Role</p><p className="text-sm text-slate-200">{user?.role?.replace('_', ' ')?.replace(/\b\w/g, c => c.toUpperCase())}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
            <Clock size={16} className="text-slate-500" />
            <div><p className="text-xs text-slate-500">Last Login</p><p className="text-sm text-slate-200">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}</p></div>
          </div>
        </div>
      </Card>
    </div>
  );
}
