import { Link, useNavigate } from 'react-router-dom';
import {
  Car, User, Users, FileText, Wallet, TrendingUp,
  Bell, ArrowRight, Clock, CheckCircle2,
} from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Card } from '@/components/ui';
import { NotificationBell } from '@/components/NotificationBell';
import { formatPKR, formatMonth, totalDuty, totalExpenses, todayMonth } from '@/utils/calc';

export function DashboardPage() {
  const {
    vehicles,
    drivers,
    subcontractors,
    monthlyRecords,
    currentUser,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
  } = useStore();
  const navigate = useNavigate();
  const currentMonth = todayMonth();

  const isSuper = currentUser?.role === 'super_admin';

  const currentMonthRecords = monthlyRecords.filter((r) => r.month === currentMonth);
  const currentExpenses = currentMonthRecords.reduce((s, r) => s + totalExpenses(r), 0);

  const recentRecords = [...monthlyRecords]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  const recentNotifications = [...notifications]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const stats = [
    { label: 'Total Vehicles', value: vehicles.length, icon: Car, color: 'sky' },
    { label: 'Total Drivers', value: drivers.length, icon: User, color: 'emerald' },
    { label: 'Total Subcontractors', value: subcontractors.length, icon: Users, color: 'violet' },
    { label: 'Current Month Records', value: currentMonthRecords.length, icon: FileText, color: 'amber' },
    { label: 'Current Month Expenses', value: formatPKR(currentExpenses), icon: Wallet, color: 'rose' },
  ];

  const colorMap: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    if (!notif.isRead) {
      markNotificationAsRead(notif.id);
    }
    if (notif.targetUrl) {
      navigate(notif.targetUrl);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of your transport operations & live staff activity
          </p>
        </div>

        {/* Action Buttons: Notification Bell (Super Admin only) */}
        {isSuper && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Notifications:</span>
              <NotificationBell align="right" />
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 transition hover:shadow-md">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[s.color]}`}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{s.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Grid: Recent Records & Live Activity Feed (Feed for Super Admin) */}
      <div className={`grid grid-cols-1 ${isSuper ? 'lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
        {/* Recent Monthly Records */}
        <div className={isSuper ? 'lg:col-span-2' : 'w-full'}>

          <Card className="overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Recent Monthly Records</h3>
              </div>
              <Link to="/monthly-records" className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentRecords.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
                <FileText className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No records yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Create your first monthly duty record to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                      <th className="px-5 py-3">Vehicle</th>
                      <th className="px-5 py-3">Month</th>
                      <th className="px-5 py-3 text-right">Total Duty</th>
                      <th className="px-5 py-3 text-right">Expenses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentRecords.map((r) => {
                      const vehicle = vehicles.find((v) => v.id === r.vehicleId);
                      return (
                        <tr
                          key={r.id}
                          onClick={() => navigate(`/monthly-records/${r.id}`)}
                          className="hover:bg-slate-50 cursor-pointer transition"
                        >
                          <td className="px-5 py-3 font-medium text-slate-700">{vehicle?.number || '—'}</td>
                          <td className="px-5 py-3 text-slate-600">{formatMonth(r.month)}</td>
                          <td className="px-5 py-3 text-right text-slate-700 font-medium">{formatPKR(totalDuty(r))}</td>
                          <td className="px-5 py-3 text-right text-slate-600">{formatPKR(totalExpenses(r))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Live Staff Notifications Feed */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-semibold text-slate-700">Recent Activity & Alerts</h3>
              </div>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                  {unreadNotificationsCount} unread
                </span>
              )}
            </div>

            <div className="flex-1 p-3 space-y-2">
              {recentNotifications.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No activity yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Staff operations will show up here in real-time.
                  </p>
                </div>
              ) : (
                recentNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 rounded-xl cursor-pointer transition border text-left flex items-start gap-2.5 ${
                      n.isRead
                        ? 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/60'
                        : 'bg-sky-50 hover:bg-sky-100/80 border-sky-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-bold text-slate-700">
                          {n.actorName}
                        </span>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                        )}
                      </div>
                      <p className={`text-xs leading-snug line-clamp-2 ${n.isRead ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                        {n.message}
                      </p>
                      {n.entityTitle && (
                        <p className="text-[11px] text-sky-700 mt-1 truncate">
                          ↳ {n.entityTitle}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

