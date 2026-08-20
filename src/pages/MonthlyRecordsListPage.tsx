import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Calendar, Filter, X, Car } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { PageHeader, Card, Button, EmptyState } from '@/components/ui';
import { formatPKR, formatMonth, totalDuty, totalExpenses } from '@/utils/calc';

const MONTH_NAMES = [
  { value: '', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function MonthlyRecordsListPage() {
  const { monthlyRecords, vehicles } = useStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Extract all unique years from records + current year
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<string>();
    yearsSet.add(String(currentYear));
    monthlyRecords.forEach((r) => {
      if (r.month && r.month.length >= 4) {
        yearsSet.add(r.month.slice(0, 4));
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [monthlyRecords]);

  const hasActiveFilters = Boolean(search || vehicleFilter || selectedYear || selectedMonth);

  const resetFilters = () => {
    setSearch('');
    setVehicleFilter('');
    setSelectedYear('');
    setSelectedMonth('');
  };

  const filtered = useMemo(() => {
    return monthlyRecords
      .filter((r) => {
        const v = vehicles.find((x) => x.id === r.vehicleId);
        if (vehicleFilter && r.vehicleId !== vehicleFilter) return false;
        if (selectedYear && !r.month.startsWith(selectedYear)) return false;
        if (selectedMonth && r.month.slice(5, 7) !== selectedMonth) return false;
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const match =
            (v?.number || '').toLowerCase().includes(q) ||
            (v?.model || '').toLowerCase().includes(q) ||
            formatMonth(r.month).toLowerCase().includes(q) ||
            r.month.includes(q);
          return match;
        }
        return true;
      })
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [monthlyRecords, vehicles, vehicleFilter, selectedYear, selectedMonth, search]);

  const filteredTotalDuty = useMemo(() => {
    return filtered.reduce((s, r) => s + totalDuty(r), 0);
  }, [filtered]);

  const filteredTotalExpenses = useMemo(() => {
    return filtered.reduce((s, r) => s + totalExpenses(r), 0);
  }, [filtered]);

  return (
    <div>
      <PageHeader
        title="Monthly Records"
        subtitle={`${monthlyRecords.length} total monthly bill record${monthlyRecords.length !== 1 ? 's' : ''}`}
        action={
          <Link to="/monthly-records/add">
            <Button>
              <Plus className="w-4 h-4" /> Add Monthly Record
            </Button>
          </Link>
        }
      />

      <Card className="overflow-hidden mb-6">
        {/* Filters Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
              <Filter className="w-4 h-4 text-sky-600" />
              <span>Filter Monthly Records</span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vehicle or month..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Vehicle Select Filter */}
            <div className="relative">
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.number} ({v.model})
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
              >
                <option value="">All Years (سب سال)</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} {m.value ? `(${m.value})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Status & Summary Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500 font-medium">Active Filters:</span>
              {selectedYear && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 font-medium border border-sky-100">
                  Year: {selectedYear}
                  <button onClick={() => setSelectedYear('')} className="hover:text-sky-900"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedMonth && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 font-medium border border-sky-100">
                  Month: {MONTH_NAMES.find((m) => m.value === selectedMonth)?.label}
                  <button onClick={() => setSelectedMonth('')} className="hover:text-sky-900"><X className="w-3 h-3" /></button>
                </span>
              )}
              {vehicleFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                  Vehicle: {vehicles.find((v) => v.id === vehicleFilter)?.number}
                  <button onClick={() => setVehicleFilter('')} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-100">
                  Search: "{search}"
                  <button onClick={() => setSearch('')} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
                </span>
              )}
              <span className="ml-auto text-slate-600 font-semibold">
                Showing {filtered.length} of {monthlyRecords.length} records · Total Duty: {formatPKR(filteredTotalDuty)}
              </span>
            </div>
          )}
        </div>

        {/* Table Content */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="No monthly records found"
            message={
              hasActiveFilters
                ? 'No records match your selected month, year, or vehicle filter.'
                : 'Add a monthly record to get started.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Link to="/monthly-records/add">
                  <Button>
                    <Plus className="w-4 h-4" /> Add Monthly Record
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide border-b border-slate-200">
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Month / Year</th>
                  <th className="px-5 py-3 text-center">Days / Entries</th>
                  <th className="px-5 py-3 text-right">Total Duty</th>
                  <th className="px-5 py-3 text-right">Expenses</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const v = vehicles.find((x) => x.id === r.vehicleId);
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 transition cursor-pointer"
                      onClick={() => navigate(`/monthly-records/${r.id}`)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 shrink-0">
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              to={`/monthly-records/${r.id}`}
                              className="font-semibold text-slate-800 hover:text-sky-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {v?.number || '—'}
                            </Link>
                            <p className="text-xs text-slate-400">{v?.model || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formatMonth(r.month)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-600 font-medium">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-700">
                          {r.dailyRecords.length} days
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-800 font-bold">
                        {formatPKR(totalDuty(r))}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-600 font-medium">
                        {formatPKR(totalExpenses(r))}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/monthly-records/${r.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-sky-600 hover:text-sky-800 font-semibold px-2.5 py-1.5 rounded bg-sky-50 hover:bg-sky-100 transition"
                        >
                          View Bill →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                  <td className="px-5 py-3" colSpan={3}>
                    TOTAL ({filtered.length} Record{filtered.length !== 1 ? 's' : ''})
                  </td>
                  <td className="px-5 py-3 text-right text-sky-700">
                    {formatPKR(filteredTotalDuty)}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-700">
                    {formatPKR(filteredTotalExpenses)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
