import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileText } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { PageHeader, Card, Button, EmptyState } from '@/components/ui';
import { formatPKR, formatMonth, totalDuty, totalExpenses } from '@/utils/calc';

export function MonthlyRecordsListPage() {
  const { monthlyRecords, vehicles } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');

  const filtered = monthlyRecords
    .filter((r) => {
      const v = vehicles.find((x) => x.id === r.vehicleId);
      if (vehicleFilter && r.vehicleId !== vehicleFilter) return false;
      if (search) {
        const match = v?.number.toLowerCase().includes(search.toLowerCase()) || formatMonth(r.month).toLowerCase().includes(search.toLowerCase());
        return match;
      }
      return true;
    })
    .sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div>
      <PageHeader
        title="Monthly Records"
        subtitle={`${monthlyRecords.length} record${monthlyRecords.length !== 1 ? 's' : ''} total`}
        action={<Link to="/monthly-records/add"><Button><Plus className="w-4 h-4" /> Add Monthly Record</Button></Link>}
      />

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vehicle or month..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.number}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="No monthly records found"
            message="Add a monthly record to get started."
            action={<Link to="/monthly-records/add"><Button><Plus className="w-4 h-4" /> Add Monthly Record</Button></Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Month</th>
                  <th className="px-5 py-3 text-center">Entries</th>
                  <th className="px-5 py-3 text-right">Total Duty</th>
                  <th className="px-5 py-3 text-right">Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const v = vehicles.find((x) => x.id === r.vehicleId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => navigate(`/monthly-records/${r.id}`)}>
                      <td className="px-5 py-3">
                        <Link to={`/monthly-records/${r.id}`} className="font-medium text-slate-700 hover:text-sky-600" onClick={(e) => e.stopPropagation()}>
                          {v?.number || '—'}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{formatMonth(r.month)}</td>
                      <td className="px-5 py-3 text-center text-slate-600">{r.dailyRecords.length}</td>
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
  );
}
