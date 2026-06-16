/* ======================================
   APP — Root Component
   ====================================== */

import { useEffect, useState } from 'react';
import { AppRouter } from './Router';
import { seedDatabase } from '@/db/seed';
import { useAuthStore } from '@/stores/authStore';

export function App() {
  const [dbReady, setDbReady] = useState(false);
  const { checkSession } = useAuthStore();

  useEffect(() => {
    async function init() {
      try {
        await seedDatabase();
        await checkSession();
      } catch (err) {
        console.error('DB init error:', err);
      } finally {
        setDbReady(true);
      }
    }
    init();
  }, [checkSession]);

  if (!dbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-mesh">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-teal-500/30 animate-pulse-soft">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-200">Initializing Khatabook</h2>
            <p className="text-sm text-slate-500 mt-1">Setting up local database...</p>
          </div>
        </div>
      </div>
    );
  }

  return <AppRouter />;
}
