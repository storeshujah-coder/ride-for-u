import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, User, Users, FileText, BarChart3, Settings,
  LogOut, Menu, X, Truck, Wallet,
} from 'lucide-react';
import { useStore } from '@/store/StoreContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vehicles', label: 'Vehicles', icon: Car },
  { to: '/drivers', label: 'Drivers', icon: User },
  { to: '/subcontractors', label: 'Subcontractors', icon: Users },
  { to: '/monthly-records', label: 'Monthly Records', icon: FileText },
  { to: '/expenses', label: 'Expenses', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('rfu-auth');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center flex-shrink-0">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-800 leading-tight">Ride for U</h1>
          <p className="text-[11px] text-slate-400 leading-tight">Transport Management</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-700'
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
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
            {settings.adminName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-slate-600">{settings.adminName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-64 bg-white shadow-xl animate-slide-in-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">Ride for U</span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
