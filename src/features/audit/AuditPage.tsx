/* ======================================
   AUDIT LOGS PAGE
   ====================================== */

import { ScrollText, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

// In V1, audit logs are lightweight — future versions will track all changes
const mockLogs = [
  { id: 1, time: 'Today, 2:30 PM', user: 'Deepanshu', action: 'Login', entity: 'User', desc: 'Logged in to the system', color: 'info' as const },
  { id: 2, time: 'Today, 2:32 PM', user: 'Deepanshu', action: 'View', entity: 'Dashboard', desc: 'Viewed dashboard', color: 'neutral' as const },
  { id: 3, time: 'Today, 2:35 PM', user: 'Deepanshu', action: 'Create', entity: 'Buyer Transaction', desc: 'Created invoice INV-2025-036', color: 'success' as const },
  { id: 4, time: 'Today, 2:40 PM', user: 'Deepanshu', action: 'Update', entity: 'Buyer', desc: 'Updated credit limit for Rajesh Electronics', color: 'info' as const },
  { id: 5, time: 'Today, 2:45 PM', user: 'Deepanshu', action: 'Allocate', entity: 'Payment Plan', desc: 'Auto-allocated Week 1 payments', color: 'warning' as const },
  { id: 6, time: 'Today, 3:00 PM', user: 'Deepanshu', action: 'Export', entity: 'Report', desc: 'Exported Outstanding Receivables as CSV', color: 'neutral' as const },
];

export function AuditPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Audit Logs</h1>
        <p className="text-sm text-slate-400">Activity trail and change history</p>
      </div>

      <Card hover={false} padding="none">
        <div className="p-5 border-b border-slate-700/30 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Activity Feed</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors">
            <Filter size={14} /> Filter
          </button>
        </div>
        <div className="divide-y divide-slate-800/40">
          {sampleLogs.map(log => (
            <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-800/20 transition-colors">
              <div className="mt-1">
                <Badge variant={log.color}>{log.action}</Badge>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200">{log.desc}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{log.user}</span>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-slate-500">{log.entity}</span>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-slate-500">{log.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
