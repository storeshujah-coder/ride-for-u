import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { type ReactNode, useEffect } from 'react';
import { StoreProvider } from '@/store/StoreContext';
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

function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = sessionStorage.getItem('rfu-auth');
  const location = useLocation();
  if (!auth) return <Navigate to="/login" replace />;
  return <>{children}</>;
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vehicles" element={<VehiclesListPage />} />
          <Route path="/vehicles/add" element={<VehicleFormPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/drivers" element={<DriversListPage />} />
          <Route path="/drivers/add" element={<DriverFormPage />} />
          <Route path="/drivers/:id" element={<DriverDetailPage />} />
          <Route path="/subcontractors" element={<SubcontractorsListPage />} />
          <Route path="/subcontractors/add" element={<SubcontractorFormPage />} />
          <Route path="/subcontractors/:id" element={<SubcontractorDetailPage />} />
          <Route path="/monthly-records" element={<MonthlyRecordsListPage />} />
          <Route path="/monthly-records/add" element={<MonthlyRecordAddPage />} />
          <Route path="/monthly-records/:id" element={<MonthlyRecordDetailPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/reports" element={<ReportsIndexPage />} />
          <Route path="/reports/vehicle" element={<VehicleReportPage />} />
          <Route path="/reports/driver" element={<DriverReportPage />} />
          <Route path="/reports/subcontractor" element={<SubcontractorReportPage />} />
          <Route path="/reports/business-expenses" element={<BusinessExpenseReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
