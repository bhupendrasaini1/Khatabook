/* ======================================
   SIDEBAR — Main Navigation
   ====================================== */

import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Truck, ArrowDownLeft, ArrowUpRight,
  Calendar, GitBranch, FileBarChart, Settings, ScrollText,
  X, ChevronLeft, ChevronRight, Wallet,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/utils/helpers';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={20} />,
  Users: <Users size={20} />,
  Truck: <Truck size={20} />,
  ArrowDownLeft: <ArrowDownLeft size={20} />,
  ArrowUpRight: <ArrowUpRight size={20} />,
  Calendar: <Calendar size={20} />,
  GitBranch: <GitBranch size={20} />,
  FileBarChart: <FileBarChart size={20} />,
  Settings: <Settings size={20} />,
  ScrollText: <ScrollText size={20} />,
};

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { label: 'Buyers', path: '/buyers', icon: 'Users' },
  { label: 'Suppliers', path: '/suppliers', icon: 'Truck' },
  { type: 'divider' as const, label: 'Transactions' },
  { label: 'Buyer Txns', path: '/transactions/buyer', icon: 'ArrowDownLeft' },
  { label: 'Supplier Txns', path: '/transactions/supplier', icon: 'ArrowUpRight' },
  { type: 'divider' as const, label: 'Planning' },
  { label: 'Weekly Plan', path: '/planning', icon: 'Calendar' },
  { label: 'Flow Board', path: '/flow-board', icon: 'GitBranch' },
  { type: 'divider' as const, label: 'Insights' },
  { label: 'Reports', path: '/reports', icon: 'FileBarChart' },
  { label: 'Audit Logs', path: '/audit', icon: 'ScrollText' },
  { type: 'divider' as const, label: 'System' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapse } = useAppStore();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full flex flex-col',
          'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950',
          'border-r border-slate-800/80',
          'transition-all duration-300 ease-out',
          // Desktop
          'lg:relative lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]',
          // Mobile
          sidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full w-[280px]',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800/60 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Wallet size={18} className="text-white" />
          </div>
          <div className={cn("flex flex-col transition-all duration-300 overflow-hidden", sidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            <h1 className="text-base font-bold text-slate-100 tracking-tight">Payment Flow AI</h1>
            <span className="text-[10px] uppercase tracking-widest text-teal-500 font-semibold">Workspace</span>
          </div>

          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 lg:hidden"
          >
            <X size={18} />
          </button>

          {/* Desktop collapse */}
          <button
            onClick={toggleSidebarCollapse}
            className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 hidden lg:flex"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item, idx) => {
            if ('type' in item && item.type === 'divider') {
              if (sidebarCollapsed) {
                return <div key={idx} className="h-px bg-slate-800/60 my-3" />;
              }
              return (
                <div key={idx} className="pt-4 pb-1.5 px-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                    {item.label}
                  </span>
                </div>
              );
            }

            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path!);

            return (
              <NavLink
                key={item.path}
                to={item.path!}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                  'transition-all duration-200',
                  'group relative',
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/15'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                  sidebarCollapsed && 'justify-center px-0'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-teal-400 rounded-r-full" />
                )}

                <span className="flex-shrink-0">{iconMap[item.icon!]}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}

                {/* Collapsed tooltip */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-800/60">
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-teal-500/5 border border-teal-500/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
              <span className="text-xs text-slate-400">Offline Ready</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
