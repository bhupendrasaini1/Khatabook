/* ======================================
   HEADER — Top Bar
   ====================================== */

import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, User, LogOut, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';

const pathLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/buyers': 'Buyer Management',
  '/suppliers': 'Supplier Management',
  '/transactions/buyer': 'Buyer Transactions',
  '/transactions/supplier': 'Supplier Transactions',
  '/planning': 'Weekly Planning',
  '/flow-board': 'Flow Board',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/audit': 'Audit Logs',
};

export function Header() {
  const { toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pageTitle = pathLabels[location.pathname] || 'Khatabook';

  // Build breadcrumbs
  const breadcrumbs = location.pathname === '/'
    ? [{ label: 'Dashboard', path: '/' }]
    : location.pathname.split('/').filter(Boolean).map((seg, idx, arr) => ({
        label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
        path: '/' + arr.slice(0, idx + 1).join('/'),
      }));

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight size={14} className="text-slate-600" />}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? 'text-slate-200 font-medium'
                    : 'text-slate-500 hover:text-slate-300 cursor-pointer'
                }
                onClick={() => idx < breadcrumbs.length - 1 && navigate(crumb.path)}
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </div>

        {/* Mobile title */}
        <span className="sm:hidden text-sm font-medium text-slate-200">{pageTitle}</span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className={`hidden md:flex items-center transition-all duration-300 ${searchFocused ? 'w-64' : 'w-48'}`}>
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search... (Ctrl+K)"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
            />
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse-soft" />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="hidden sm:block text-sm text-slate-300 font-medium max-w-[120px] truncate">
              {user?.name || 'User'}
            </span>
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl glass-card-static overflow-hidden animate-scale-in shadow-xl">
              <div className="p-3 border-b border-slate-700/50">
                <p className="text-sm font-medium text-slate-200">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/40 transition-colors"
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  onClick={() => { logout(); navigate('/login'); setUserMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
