import { Link, useNavigate } from 'react-router-dom';
import { Car, User, Users, FileText, Wallet, TrendingUp } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Card } from '@/components/ui';
import { formatPKR, formatMonth, totalDuty, totalExpenses, todayMonth } from '@/utils/calc';

export function DashboardPage() {
  const { vehicles, drivers, subcontractors, monthlyRecords } = useStore();
  const navigate = useNavigate();
  const currentMonth = todayMonth();

  const currentMonthRecords = monthlyRecords.filter((r) => r.month === currentMonth);
  const currentExpenses = currentMonthRecords.reduce((s, r) => s + totalExpenses(r), 0);

  const recentRecords = [...monthlyRecords]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of your transport operations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[s.color]}`}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{s.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Recent Monthly Records</h3>
          </div>
          <Link to="/monthly-records" className="text-xs font-medium text-sky-600 hover:text-sky-700">
            View all
          </Link>
        </div>
        {recentRecords.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No records yet.</p>
        ) : (
          <div className="overflow-x-auto">
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
                      <td className="px-5 py-3 text-right text-slate-700">{formatPKR(totalDuty(r))}</td>
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
  );
}
