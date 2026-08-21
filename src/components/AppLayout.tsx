import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Car, User, Users, FileText, BarChart3, Settings,
  LogOut, Menu, X, Truck, Wallet, Shield, Crown, Sparkles,
} from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { NotificationBell } from '@/components/NotificationBell';
import type { ModuleKey } from '@/types';
import { MODULE_LABELS } from '@/types';

const NAV_ITEMS: { to: string; label: string; icon: typeof Car; module: ModuleKey }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { to: '/vehicles', label: 'Vehicles', icon: Car, module: 'vehicles' },
  { to: '/drivers', label: 'Drivers', icon: User, module: 'drivers' },
  { to: '/subcontractors', label: 'Subcontractors', icon: Users, module: 'subcontractors' },
  { to: '/monthly-records', label: 'Monthly Records', icon: FileText, module: 'monthlyRecords' },
  { to: '/expenses', label: 'Expenses', icon: Wallet, module: 'expenses' },
  { to: '/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
  { to: '/users', label: 'Users', icon: Shield, module: 'users' },
  { to: '/settings', label: 'Settings', icon: Settings, module: 'settings' },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings, currentUser, canAccessModule, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (settings.appearance === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.appearance]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter((item) => canAccessModule(item.module));
  const isSuper = currentUser?.role === 'super_admin';

  // Determine current active section name
  const currentNav = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to));
  const pageTitle = currentNav ? currentNav.label : 'Transport Management';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-600/20">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-800 leading-tight">Ride for U</h1>
          <p className="text-[11px] text-slate-400 leading-tight">Transport Management</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-100 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
              isSuper
                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {isSuper ? (
              <Crown className="w-4 h-4" />
            ) : (
              (currentUser?.fullName?.charAt(0).toUpperCase() || settings.adminName?.charAt(0).toUpperCase() || 'U')
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-700 truncate">
              {currentUser?.fullName || settings.adminName}
            </div>
            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isSuper ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {isSuper ? 'Super Admin' : currentUser?.role === 'staff' ? 'Staff' : 'User'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex print:bg-white print:block">
      <aside className="hidden lg:flex w-60 flex-shrink-0 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30 print:hidden">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 print:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-64 bg-white shadow-xl animate-slide-in-left print:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-60 min-w-0 print:ml-0 print:p-0 flex flex-col min-h-screen">
        {/* Top Header Bar (Desktop & Mobile) */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile branding */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">Ride for U</span>
            </div>

            {/* Desktop Section Breadcrumb / Title */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 text-sm">{pageTitle}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-400">{settings.companyName}</span>
            </div>
          </div>

          {/* Right Header Actions: Notification Bell + User Profile indicator */}
          <div className="flex items-center gap-3">
            {/* Notification Bell (Super Admin only) */}
            {isSuper && <NotificationBell align="right" />}


            {/* Desktop User Avatar / Status pill */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isSuper ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isSuper ? <Crown className="w-3.5 h-3.5" /> : (currentUser?.fullName?.charAt(0) || 'U')}
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                  {currentUser?.fullName || settings.adminName}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isSuper ? 'Super Admin' : 'Staff'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto print:p-0 print:m-0 print:max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

