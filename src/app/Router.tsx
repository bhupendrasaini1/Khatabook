/* ======================================
   APP ROUTER — React Router configuration
   ====================================== */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

// Auth pages
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';

// Feature pages
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { BuyersPage } from '@/features/buyers/BuyersPage';
import { SuppliersPage } from '@/features/suppliers/SuppliersPage';
import { BuyerTransactionsPage } from '@/features/transactions/BuyerTransactionsPage';
import { SupplierTransactionsPage } from '@/features/transactions/SupplierTransactionsPage';
import { PlanningPage } from '@/features/planning/PlanningPage';
import { FlowBoardPage } from '@/features/flow-board/FlowBoardPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { AuditPage } from '@/features/audit/AuditPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes inside layout shell */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/buyers" element={<BuyersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/transactions/buyer" element={<BuyerTransactionsPage />} />
          <Route path="/transactions/supplier" element={<SupplierTransactionsPage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/flow-board" element={<FlowBoardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/audit" element={<AuditPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
