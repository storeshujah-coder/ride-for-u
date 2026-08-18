import { useState, useMemo, useRef, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, Plus, Trash2, ChevronLeft, ChevronRight, Search, X, Car } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, EmptyState } from '@/components/ui';
import { formatPKR, formatMonth, daysInMonth, generateMonthOptions } from '@/utils/calc';
import type { DailyRecord, RouteEntry, MonthlyRecord, Vehicle } from '@/types';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayEntry {
  date: string;
  dayName: string;
  amount: string;
  details: string;
  routes: RouteEntry[];
  entryType: 'quick' | 'detailed';
}

function SearchableVehicleSelect({
  vehicles,
  value,
  onChange,
}: {
  vehicles: Vehicle[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedVehicles = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.toLowerCase().trim();
    return [...vehicles].sort((a, b) => {
      const aMatch = a.number.toLowerCase().includes(q) || a.model.toLowerCase().includes(q) ? 1 : 0;
      const bMatch = b.number.toLowerCase().includes(q) || b.model.toLowerCase().includes(q) ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      const aStarts = a.number.toLowerCase().startsWith(q) || a.model.toLowerCase().startsWith(q) ? 1 : 0;
      const bStarts = b.number.toLowerCase().startsWith(q) || b.model.toLowerCase().startsWith(q) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;
      return 0;
    });
  }, [vehicles, search]);

  const selectedVehicle = vehicles.find((v) => v.id === value);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Vehicle <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={open ? search : (selectedVehicle ? `${selectedVehicle.number} — ${selectedVehicle.model}` : '')}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(''); }}
          placeholder="Type vehicle number or model..."
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        {(search || value) && (
          <button
            type="button"
            onClick={() => { setSearch(''); onChange(''); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {sortedVehicles.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              <Car className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No vehicles found
            </div>
          ) : (
            sortedVehicles.map((v) => {
              const isMatch = search.trim() && (v.number.toLowerCase().includes(search.toLowerCase().trim()) || v.model.toLowerCase().includes(search.toLowerCase().trim()));
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => { onChange(v.id); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition border-l-2 ${
                    value === v.id
                      ? 'bg-sky-50 border-sky-500 text-sky-700 font-medium'
                      : isMatch
                      ? 'bg-amber-50/60 border-transparent hover:bg-amber-50 text-slate-800'
                      : 'border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{v.number}</span>
                      <span className="mx-1.5 text-slate-300">—</span>
                      <span className="text-slate-600">{v.model}</span>
                    </div>
                    {isMatch && (
                      <span className="text-[10px] uppercase tracking-wide text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                        Match
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {v.type} · {v.ownerType}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function MonthlyRecordAddPage() {
  const { vehicles, monthlyRecords, saveMonthlyRecordBulk } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [vehicleId, setVehicleId] = useState('');
  const [month, setMonth] = useState(generateMonthOptions(1)[0]);
  const [showTable, setShowTable] = useState(false);
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const monthOptions = useMemo(() => {
    const opts = generateMonthOptions(24);
    // Also include future months up to end of current year
    const d = new Date();
    for (let m = d.getMonth() + 1; m <= 11; m++) {
      const ym = `${d.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
      if (!opts.includes(ym)) opts.push(ym);
    }
    return opts;
  }, []);

  const buildDayEntries = (ym: string, existing?: MonthlyRecord): DayEntry[] => {
    const [y, m] = ym.split('-').map(Number);
    const days = daysInMonth(ym);
    const entries: DayEntry[] = [];
    for (let d = 1; d <= days; d++) {
      const dateStr = `${ym}-${String(d).padStart(2, '0')}`;
      const dayName = dayNames[new Date(y, m - 1, d).getDay()];
      const existingDr = existing?.dailyRecords.find((dr) => dr.date === dateStr);
      if (existingDr) {
        entries.push({
          date: dateStr,
          dayName,
          amount: String(existingDr.amount),
          details: existingDr.details,
          routes: existingDr.routes.map((r) => ({ ...r })),
          entryType: existingDr.entryType,
        });
      } else {
        entries.push({ date: dateStr, dayName, amount: '', details: '', routes: [], entryType: 'quick' });
      }
    }
    return entries;
  };

  const handleGenerate = (e: FormEvent) => {
    e.preventDefault();
    if (!vehicleId) { toast('Please select a vehicle', 'error'); return; }
    const existing = monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === month);
    setDayEntries(buildDayEntries(month, existing));
    setShowTable(true);
  };

  const updateDay = (index: number, patch: Partial<DayEntry>) => {
    setDayEntries((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const switchEntryType = (index: number, type: 'quick' | 'detailed') => {
    if (type === 'detailed') {
      const current = dayEntries[index];
      const routes: RouteEntry[] = current.routes.length > 0
        ? current.routes
        : [{ id: `rt-${Date.now()}-0`, location: '', amount: 0 }];
      updateDay(index, { entryType: 'detailed', routes });
    } else {
      const current = dayEntries[index];
      const total = current.routes.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      updateDay(index, { entryType: 'quick', amount: total > 0 ? String(total) : '', routes: [] });
    }
  };

  const addRoute = (dayIndex: number) => {
    setDayEntries((prev) => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      return { ...d, routes: [...d.routes, { id: `rt-${Date.now()}-${d.routes.length}`, location: '', amount: 0 }] };
    }));
  };

  const updateRoute = (dayIndex: number, routeId: string, patch: Partial<RouteEntry>) => {
    setDayEntries((prev) => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      return { ...d, routes: d.routes.map((r) => (r.id === routeId ? { ...r, ...patch } : r)) };
    }));
  };

  const removeRoute = (dayIndex: number, routeId: string) => {
    setDayEntries((prev) => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      return { ...d, routes: d.routes.filter((r) => r.id !== routeId) };
    }));
  };

  const totalDuty = dayEntries.reduce((s, d) => {
    if (d.entryType === 'detailed' && d.routes.length > 0) {
      return s + d.routes.reduce((rs, r) => rs + (Number(r.amount) || 0), 0);
    }
    return s + (Number(d.amount) || 0);
  }, 0);

  const filledDays = dayEntries.filter((d) => {
    if (d.entryType === 'detailed') return d.routes.some((r) => r.amount > 0 || r.location.trim() !== '');
    return Number(d.amount) > 0 || d.details.trim() !== '';
  }).length;

  const handleSave = async () => {
    if (!vehicleId) { toast('Please select a vehicle', 'error'); return; }
    setSaving(true);
    const dailyData: Omit<DailyRecord, 'id'>[] = dayEntries.map((d) => {
      if (d.entryType === 'detailed') {
        const validRoutes = d.routes.filter((r) => r.amount > 0 || r.location.trim() !== '');
        const total = validRoutes.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        return { date: d.date, amount: total, details: '', routes: validRoutes, entryType: 'detailed' as const };
      }
      return { date: d.date, amount: Number(d.amount) || 0, details: d.details, routes: [], entryType: 'quick' as const };
    });
    const rec = await saveMonthlyRecordBulk(vehicleId, month, dailyData);
    setSaving(false);
    toast(`Monthly record saved — ${filledDays} day${filledDays !== 1 ? 's' : ''} entered`, 'success');
    navigate(`/monthly-records/${rec.id}`);
  };

  const shiftMonth = (direction: number) => {
    const [y, m] = month.split('-').map(Number);
    const newDate = new Date(y, m - 1 + direction, 1);
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setMonth(newMonth);
    if (showTable && vehicleId) {
      const existing = monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === newMonth);
      setDayEntries(buildDayEntries(newMonth, existing));
    }
  };

  return (
    <div>
      <PageHeader title="Add Monthly Record" backTo="/monthly-records" />

      {vehicles.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No vehicles available"
            message="Add a vehicle first before creating a monthly record."
            action={<Link to="/vehicles/add"><Button>Add Vehicle</Button></Link>}
          />
        </Card>
      ) : (
        <>
          {/* Selection bar */}
          <Card className="p-5 mb-6">
            <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1 max-w-sm">
                <SearchableVehicleSelect vehicles={vehicles} value={vehicleId} onChange={setVehicleId} />
              </div>
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Month / Year</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => shiftMonth(-1)} className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition flex-shrink-0">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <button type="button" onClick={() => shiftMonth(1)} className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Button type="submit">{showTable ? 'Regenerate Table' : 'Generate Table'}</Button>
            </form>
          </Card>

          {/* Spreadsheet table */}
          {showTable && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">{formatMonth(month)}</h2>
                  <p className="text-sm text-slate-500">
                    {vehicles.find((v) => v.id === vehicleId)?.number} — {dayEntries.length} days · {filledDays} filled
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-lg bg-sky-50 border border-sky-100">
                    <span className="text-xs text-sky-600 font-medium">Total Duty: </span>
                    <span className="text-sm font-bold text-sky-700">{formatPKR(totalDuty)}</span>
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Monthly Record'}
                  </Button>
                </div>
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide border-b border-slate-200">
                        <th className="px-3 py-3 w-16">Date</th>
                        <th className="px-3 py-3 w-12">Day</th>
                        <th className="px-3 py-3 w-28">Type</th>
                        <th className="px-3 py-3 min-w-[200px]">Amount / Routes</th>
                        <th className="px-3 py-3 min-w-[180px]">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dayEntries.map((day, index) => {
                        const hasData = day.entryType === 'detailed'
                          ? day.routes.some((r) => r.amount > 0 || r.location.trim() !== '')
                          : Number(day.amount) > 0 || day.details.trim() !== '';
                        return (
                          <tr key={day.date} className={hasData ? 'bg-sky-50/30' : 'hover:bg-slate-50/50'}>
                            <td className="px-3 py-2 text-xs font-medium text-slate-600 whitespace-nowrap">
                              {String(index + 1).padStart(2, '0')} {day.date.slice(5, 7) === month.slice(5, 7) ? '' : ''}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-400">{day.dayName}</td>
                            <td className="px-3 py-2">
                              <select
                                value={day.entryType}
                                onChange={(e) => switchEntryType(index, e.target.value as 'quick' | 'detailed')}
                                className="px-2 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                              >
                                <option value="quick">Quick</option>
                                <option value="detailed">Detailed</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              {day.entryType === 'quick' ? (
                                <input
                                  type="number"
                                  value={day.amount}
                                  onChange={(e) => updateDay(index, { amount: e.target.value })}
                                  placeholder="0"
                                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                              ) : (
                                <div className="space-y-1.5">
                                  {day.routes.map((route) => {
                                    const routeTotal = day.routes.reduce((s, r) => s + (Number(r.amount) || 0), 0);
                                    return (
                                      <div key={route.id} className="flex gap-1.5 items-center">
                                        <input
                                          type="text"
                                          value={route.location}
                                          onChange={(e) => updateRoute(index, route.id, { location: e.target.value })}
                                          placeholder="Factory → DHA"
                                          className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-300 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        />
                                        <input
                                          type="number"
                                          value={route.amount || ''}
                                          onChange={(e) => updateRoute(index, route.id, { amount: Number(e.target.value) || 0 })}
                                          placeholder="0"
                                          className="w-20 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-300 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        />
                                        <button
                                          onClick={() => removeRoute(index, route.id)}
                                          className="p-1 rounded text-slate-300 hover:text-red-500"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                  {day.routes.length > 0 && (
                                    <div className="flex justify-between items-center px-1">
                                      <span className="text-xs text-slate-400">Total: <span className="font-medium text-slate-600">{formatPKR(day.routes.reduce((s, r) => s + (Number(r.amount) || 0), 0))}</span></span>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => addRoute(index)}
                                    className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                                  >
                                    <Plus className="w-3 h-3" /> Add Route
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {day.entryType === 'quick' ? (
                                <input
                                  type="text"
                                  value={day.details}
                                  onChange={(e) => updateDay(index, { details: e.target.value })}
                                  placeholder="Remarks..."
                                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                        <td className="px-3 py-3" colSpan={3}>TOTAL DUTY</td>
                        <td className="px-3 py-3 text-sm">{formatPKR(totalDuty)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>

              <div className="mt-4 flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="md">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Monthly Record'}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
