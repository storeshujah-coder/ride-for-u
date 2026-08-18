import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { type ReactNode, useEffect, useMemo } from 'react';
import { StoreProvider, useStore } from '@/store/StoreContext';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/Confirm';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { VehiclesListPage } from '@/pages/VehiclesListPage';
import { VehicleFormPage } from '@/pages/VehicleFormPage';
import { VehicleDetailPage } from '@/pages/VehicleDetailPage';
import { DriversListPage } from '@/pages/DriversListPage';
import { DriverFormPage } from '@/pages/DriverFormPage';
import { DriverDetailPage } from '@/pages/DriverDetailPage';
import { SubcontractorsListPage } from '@/pages/SubcontractorsListPage';
import { SubcontractorFormPage } from '@/pages/SubcontractorFormPage';
import { SubcontractorDetailPage } from '@/pages/SubcontractorDetailPage';
import { MonthlyRecordsListPage } from '@/pages/MonthlyRecordsListPage';
import { MonthlyRecordAddPage } from '@/pages/MonthlyRecordAddPage';
import { MonthlyRecordDetailPage } from '@/pages/MonthlyRecordDetailPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { ReportsIndexPage } from '@/pages/ReportsIndexPage';
import { VehicleReportPage } from '@/pages/VehicleReportPage';
import { DriverReportPage } from '@/pages/DriverReportPage';
import { SubcontractorReportPage } from '@/pages/SubcontractorReportPage';
import { BusinessExpenseReportPage } from '@/pages/BusinessExpenseReportPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UsersListPage } from '@/pages/UsersListPage';
import { UserFormPage } from '@/pages/UserFormPage';
import type { ModuleKey, PermissionAction } from '@/types';
import { ALL_MODULES } from '@/types';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useStore();
  const location = useLocation();
  const hasAuth = sessionStorage.getItem('rfu-auth');
  if (!currentUser && !hasAuth) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

function PermissionGuard({
  module: m,
  action = 'view',
  children,
}: {
  module: ModuleKey;
  action?: PermissionAction;
  children: ReactNode;
}) {
  const { hasPermission, currentUser, canAccessModule } = useStore();
  const location = useLocation();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (!hasPermission(m, action)) {
    const fallback = useMemo(() => {
      for (const mod of ALL_MODULES as ModuleKey[]) {
        if (canAccessModule(mod)) {
          const map: Record<ModuleKey, string> = {
            dashboard: '/dashboard',
            vehicles: '/vehicles',
            drivers: '/drivers',
            subcontractors: '/subcontractors',
            monthlyRecords: '/monthly-records',
            expenses: '/expenses',
            reports: '/reports',
            users: '/users',
            settings: '/settings',
          };
          return map[mod] || '/dashboard';
        }
      }
      return null;
    }, [canAccessModule]);
    if (!fallback) return <Navigate to="/login" replace />;
    if (location.pathname !== fallback) return <Navigate to={fallback} replace />;
    return null;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { canAccessModule } = useStore();
  for (const mod of ALL_MODULES as ModuleKey[]) {
    if (canAccessModule(mod)) {
      const map: Record<ModuleKey, string> = {
        dashboard: '/dashboard',
        vehicles: '/vehicles',
        drivers: '/drivers',
        subcontractors: '/subcontractors',
        monthlyRecords: '/monthly-records',
        expenses: '/expenses',
        reports: '/reports',
        users: '/users',
        settings: '/settings',
      };
      return <Navigate to={map[mod]} replace />;
    }
  }
  return <Navigate to="/login" replace />;
}

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<PermissionGuard module="dashboard"><DashboardPage /></PermissionGuard>} />

          <Route path="/vehicles" element={<PermissionGuard module="vehicles"><VehiclesListPage /></PermissionGuard>} />
          <Route path="/vehicles/add" element={<PermissionGuard module="vehicles" action="add"><VehicleFormPage /></PermissionGuard>} />
          <Route path="/vehicles/:id" element={<PermissionGuard module="vehicles"><VehicleDetailPage /></PermissionGuard>} />

          <Route path="/drivers" element={<PermissionGuard module="drivers"><DriversListPage /></PermissionGuard>} />
          <Route path="/drivers/add" element={<PermissionGuard module="drivers" action="add"><DriverFormPage /></PermissionGuard>} />
          <Route path="/drivers/:id" element={<PermissionGuard module="drivers"><DriverDetailPage /></PermissionGuard>} />

          <Route path="/subcontractors" element={<PermissionGuard module="subcontractors"><SubcontractorsListPage /></PermissionGuard>} />
          <Route path="/subcontractors/add" element={<PermissionGuard module="subcontractors" action="add"><SubcontractorFormPage /></PermissionGuard>} />
          <Route path="/subcontractors/:id" element={<PermissionGuard module="subcontractors"><SubcontractorDetailPage /></PermissionGuard>} />

          <Route path="/monthly-records" element={<PermissionGuard module="monthlyRecords"><MonthlyRecordsListPage /></PermissionGuard>} />
          <Route path="/monthly-records/add" element={<PermissionGuard module="monthlyRecords" action="add"><MonthlyRecordAddPage /></PermissionGuard>} />
          <Route path="/monthly-records/:id" element={<PermissionGuard module="monthlyRecords"><MonthlyRecordDetailPage /></PermissionGuard>} />

          <Route path="/expenses" element={<PermissionGuard module="expenses"><ExpensesPage /></PermissionGuard>} />

          <Route path="/reports" element={<PermissionGuard module="reports"><ReportsIndexPage /></PermissionGuard>} />
          <Route path="/reports/vehicle" element={<PermissionGuard module="reports"><VehicleReportPage /></PermissionGuard>} />
          <Route path="/reports/driver" element={<PermissionGuard module="reports"><DriverReportPage /></PermissionGuard>} />
          <Route path="/reports/subcontractor" element={<PermissionGuard module="reports"><SubcontractorReportPage /></PermissionGuard>} />
          <Route path="/reports/business-expenses" element={<PermissionGuard module="reports"><BusinessExpenseReportPage /></PermissionGuard>} />

          <Route path="/users" element={<PermissionGuard module="users"><UsersListPage /></PermissionGuard>} />
          <Route path="/users/add" element={<PermissionGuard module="users" action="add"><UserFormPage /></PermissionGuard>} />
          <Route path="/users/:id" element={<PermissionGuard module="users" action="edit"><UserFormPage /></PermissionGuard>} />

          <Route path="/settings" element={<PermissionGuard module="settings"><SettingsPage /></PermissionGuard>} />
        </Route>
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </StoreProvider>
  );
}

export default App;
