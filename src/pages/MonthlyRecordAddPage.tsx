import { useState, useMemo, useRef, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, Plus, Trash2, ChevronLeft, ChevronRight, Search, X, Car, Building2, Wallet, Layers, Keyboard } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, RouteLocationInput, EmptyState } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatPKR, formatMonth, daysInMonth, generateMonthOptions, commissionAmount, afterCommission } from '@/utils/calc';
import type { DailyRecord, RouteEntry, MonthlyRecord, Vehicle, PaymentMethod } from '@/types';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayEntry {
  date: string;
  dayName: string;
  km: string;
  amount: string;
  details: string;
  routes: RouteEntry[];
  entryType: 'quick' | 'detailed';
}

interface FormDepartmentRow {
  id: string;
  departmentId: string;
  payment: string;
  remarks: string;
}

interface FormExpenseRow {
  id: string;
  date: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  amount: string;
  remarks: string;
}

function buildDayEntries(monthStr: string, existingRecord?: MonthlyRecord): DayEntry[] {
  const count = daysInMonth(monthStr);
  const existingMap = new Map<string, DailyRecord>();
  if (existingRecord) {
    existingRecord.dailyRecords.forEach((d) => existingMap.set(d.date, d));
  }
  const entries: DayEntry[] = [];
  for (let d = 1; d <= count; d++) {
    const dayNum = String(d).padStart(2, '0');
    const dateStr = `${monthStr}-${dayNum}`;
    const dateObj = new Date(Number(monthStr.slice(0, 4)), Number(monthStr.slice(5, 7)) - 1, d);
    const dayName = dayNames[dateObj.getDay()];
    const rec = existingMap.get(dateStr);
    if (rec) {
      entries.push({
        date: dateStr,
        dayName,
        km: rec.km ? String(rec.km) : '',
        amount: rec.amount ? String(rec.amount) : '',
        details: rec.details || '',
        routes: rec.routes || [],
        entryType: rec.entryType || 'quick',
      });
    } else {
      entries.push({
        date: dateStr,
        dayName,
        km: '',
        amount: '',
        details: '',
        routes: [],
        entryType: 'quick',
      });
    }
  }
  return entries;
}

function isCursorAtEnd(input: HTMLInputElement | HTMLSelectElement): boolean {
  if (!input) return true;
  if (input instanceof HTMLSelectElement) return true;
  if (!input.value) return true;
  try {
    if (input.selectionStart != null && input.selectionEnd != null) {
      return input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
    }
  } catch {
    return true;
  }
  return true;
}

function isCursorAtStart(input: HTMLInputElement | HTMLSelectElement): boolean {
  if (!input) return true;
  if (input instanceof HTMLSelectElement) return true;
  if (!input.value) return true;
  try {
    if (input.selectionStart != null && input.selectionEnd != null) {
      return input.selectionStart === 0 && input.selectionEnd === 0;
    }
  } catch {
    return true;
  }
  return true;
}

function focusCell(targetId: string, selectAll = true) {
  requestAnimationFrame(() => {
    const el = document.getElementById(targetId) as HTMLInputElement | HTMLSelectElement | null;
    if (el) {
      el.focus();
      if (selectAll && 'select' in el && typeof el.select === 'function') {
        try {
          el.select();
        } catch {}
      }
    }
  });
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
  const {
    vehicles,
    monthlyRecords,
    departments,
    categories,
    settings,
    saveMonthlyRecordBulk,
    addDepartmentEntry,
    updateDepartmentEntry,
    deleteDepartmentEntry,
    addDepartment,
    addBusinessExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    getRateForKm,
  } = useStore();

  const toast = useToast();
  const navigate = useNavigate();

  const [vehicleId, setVehicleId] = useState('');
  const [month, setMonth] = useState(generateMonthOptions(1)[0]);
  const [showTable, setShowTable] = useState(false);
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [deptRows, setDeptRows] = useState<FormDepartmentRow[]>([]);
  const [expenseRows, setExpenseRows] = useState<FormExpenseRow[]>([]);
  const [saving, setSaving] = useState(false);

  // Quick department modal state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptNotes, setNewDeptNotes] = useState('');

  // Quick category modal state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleGenerate = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!vehicleId) {
      toast('Please select a vehicle', 'error');
      return;
    }
    const existing = monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === month);
    setDayEntries(buildDayEntries(month, existing));

    if (existing && existing.departments && existing.departments.length > 0) {
      setDeptRows(
        existing.departments.map((d) => ({
          id: d.id,
          departmentId: d.departmentId,
          payment: String(d.payment || ''),
          remarks: d.remarks || '',
        }))
      );
    } else {
      setDeptRows([]);
    }

    if (existing && existing.expenses && existing.expenses.length > 0) {
      setExpenseRows(
        existing.expenses.map((exp) => ({
          id: exp.id,
          date: exp.date || `${month}-01`,
          categoryId: exp.categoryId,
          paymentMethod: 'Cash',
          amount: String(exp.amount || ''),
          remarks: exp.remarks || '',
        }))
      );
    } else {
      setExpenseRows([]);
    }

    setShowTable(true);
    setTimeout(() => {
      focusCell('cell-km-0');
    }, 100);
  };

  const updateDay = (index: number, patch: Partial<DayEntry>) => {
    setDayEntries((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const handleKmChange = (index: number, kmVal: string) => {
    const numKm = Number(kmVal);
    const updates: Partial<DayEntry> = { km: kmVal };
    if (!isNaN(numKm) && numKm > 0) {
      const autoRate = getRateForKm(numKm);
      if (autoRate != null) {
        updates.amount = String(autoRate);
      }
    }
    updateDay(index, updates);
  };

  const handleRouteKmChange = (dayIndex: number, routeId: string, kmVal: string) => {
    const numKm = Number(kmVal);
    const autoRate = !isNaN(numKm) && numKm > 0 ? getRateForKm(numKm) : null;
    setDayEntries((prev) => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      return {
        ...d,
        routes: d.routes.map((r) => {
          if (r.id !== routeId) return r;
          return {
            ...r,
            km: !isNaN(numKm) && numKm > 0 ? numKm : undefined,
            amount: autoRate != null ? autoRate : r.amount,
          };
        }),
      };
    }));
  };

  const switchEntryType = (index: number, newType: 'quick' | 'detailed') => {
    if (newType === 'detailed') {
      const current = dayEntries[index];
      const initialRoutes: RouteEntry[] = current.routes.length > 0
        ? current.routes
        : [{ id: `rt-${Date.now()}-0`, location: current.details || '', amount: Number(current.amount) || 0 }];
      updateDay(index, { entryType: 'detailed', routes: initialRoutes, details: '' });
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

  // Keyboard navigation for daily duty table
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    dayIndex: number,
    field: 'type' | 'km' | 'amount' | 'details' | 'route-start' | 'route-end' | 'route-km' | 'route-amount',
    routeIndex = 0
  ) => {
    // 1. Ctrl + Enter -> Add new route to this day (or switch to detailed and add route)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const currentDay = dayEntries[dayIndex];
      if (currentDay.entryType === 'quick') {
        const initialRoutes: RouteEntry[] = [
          { id: `rt-${Date.now()}-0`, location: currentDay.details || '', amount: Number(currentDay.amount) || 0 },
          { id: `rt-${Date.now()}-1`, location: '', amount: 0 },
        ];
        updateDay(dayIndex, { entryType: 'detailed', routes: initialRoutes, details: '' });
        setTimeout(() => {
          focusCell(`cell-route-start-${dayIndex}-1`);
        }, 60);
      } else {
        addRoute(dayIndex);
        const newIdx = currentDay.routes.length;
        setTimeout(() => {
          focusCell(`cell-route-start-${dayIndex}-${newIdx}`);
        }, 60);
      }
      return;
    }

    // 2. Simple Enter -> Move to next date row
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const nextDayIndex = dayIndex + 1;
      if (nextDayIndex < dayEntries.length) {
        const nextDay = dayEntries[nextDayIndex];
        if (nextDay.entryType === 'quick') {
          if (field === 'km' || field === 'route-km') focusCell(`cell-km-${nextDayIndex}`);
          else if (field === 'amount' || field === 'route-amount') focusCell(`cell-amount-${nextDayIndex}`);
          else if (field === 'details') focusCell(`cell-details-${nextDayIndex}`);
          else if (field === 'route-start') focusCell(`cell-km-${nextDayIndex}`);
          else if (field === 'route-end') focusCell(`cell-amount-${nextDayIndex}`);
          else focusCell(`cell-km-${nextDayIndex}`);
        } else {
          // Next day is detailed
          if (field === 'route-start' || field === 'km') focusCell(`cell-route-start-${nextDayIndex}-0`);
          else if (field === 'route-end') focusCell(`cell-route-end-${nextDayIndex}-0`);
          else if (field === 'route-km') focusCell(`cell-route-km-${nextDayIndex}-0`);
          else if (field === 'route-amount' || field === 'amount') focusCell(`cell-route-amount-${nextDayIndex}-0`);
          else focusCell(`cell-route-start-${nextDayIndex}-0`);
        }
      } else {
        // Reached the end of daily entries table
        if (deptRows.length > 0) {
          focusCell(`cell-dept-payment-0`);
        } else if (expenseRows.length > 0) {
          focusCell(`cell-exp-amount-0`);
        }
      }
      return;
    }

    // 3. ArrowDown -> Move down to same column in next row
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextDayIndex = dayIndex + 1;
      if (nextDayIndex < dayEntries.length) {
        const nextDay = dayEntries[nextDayIndex];
        if (nextDay.entryType === 'quick') {
          if (field === 'type') focusCell(`cell-type-${nextDayIndex}`);
          else if (field === 'km' || field === 'route-km') focusCell(`cell-km-${nextDayIndex}`);
          else if (field === 'amount' || field === 'route-amount') focusCell(`cell-amount-${nextDayIndex}`);
          else if (field === 'details') focusCell(`cell-details-${nextDayIndex}`);
          else if (field === 'route-start') focusCell(`cell-km-${nextDayIndex}`);
          else if (field === 'route-end') focusCell(`cell-amount-${nextDayIndex}`);
          else focusCell(`cell-km-${nextDayIndex}`);
        } else {
          const targetRouteIdx = Math.max(0, Math.min(routeIndex, nextDay.routes.length - 1));
          if (field === 'type') focusCell(`cell-type-${nextDayIndex}`);
          else if (field === 'km' || field === 'route-km') focusCell(`cell-route-km-${nextDayIndex}-${targetRouteIdx}`);
          else if (field === 'amount' || field === 'route-amount') focusCell(`cell-route-amount-${nextDayIndex}-${targetRouteIdx}`);
          else if (field === 'route-start') focusCell(`cell-route-start-${nextDayIndex}-${targetRouteIdx}`);
          else if (field === 'route-end') focusCell(`cell-route-end-${nextDayIndex}-${targetRouteIdx}`);
          else if (field === 'details') focusCell(`cell-route-amount-${nextDayIndex}-${targetRouteIdx}`);
          else focusCell(`cell-route-start-${nextDayIndex}-0`);
        }
      }
      return;
    }

    // 4. ArrowUp -> Move up to same column in previous row
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevDayIndex = dayIndex - 1;
      if (prevDayIndex >= 0) {
        const prevDay = dayEntries[prevDayIndex];
        if (prevDay.entryType === 'quick') {
          if (field === 'type') focusCell(`cell-type-${prevDayIndex}`);
          else if (field === 'km' || field === 'route-km') focusCell(`cell-km-${prevDayIndex}`);
          else if (field === 'amount' || field === 'route-amount') focusCell(`cell-amount-${prevDayIndex}`);
          else if (field === 'details') focusCell(`cell-details-${prevDayIndex}`);
          else if (field === 'route-start') focusCell(`cell-km-${prevDayIndex}`);
          else if (field === 'route-end') focusCell(`cell-amount-${prevDayIndex}`);
          else focusCell(`cell-km-${prevDayIndex}`);
        } else {
          const targetRouteIdx = Math.max(0, Math.min(routeIndex, prevDay.routes.length - 1));
          if (field === 'type') focusCell(`cell-type-${prevDayIndex}`);
          else if (field === 'km' || field === 'route-km') focusCell(`cell-route-km-${prevDayIndex}-${targetRouteIdx}`);
          else if (field === 'amount' || field === 'route-amount') focusCell(`cell-route-amount-${prevDayIndex}-${targetRouteIdx}`);
          else if (field === 'route-start') focusCell(`cell-route-start-${prevDayIndex}-${targetRouteIdx}`);
          else if (field === 'route-end') focusCell(`cell-route-end-${prevDayIndex}-${targetRouteIdx}`);
          else if (field === 'details') focusCell(`cell-route-amount-${prevDayIndex}-${targetRouteIdx}`);
          else focusCell(`cell-route-start-${prevDayIndex}-0`);
        }
      }
      return;
    }

    // 5. ArrowRight -> When cursor is at end of input or empty
    if (e.key === 'ArrowRight') {
      const target = e.currentTarget;
      if (isCursorAtEnd(target)) {
        e.preventDefault();
        const day = dayEntries[dayIndex];
        if (day.entryType === 'quick') {
          if (field === 'type') focusCell(`cell-km-${dayIndex}`);
          else if (field === 'km') focusCell(`cell-amount-${dayIndex}`);
          else if (field === 'amount') focusCell(`cell-details-${dayIndex}`);
          else if (field === 'details' && dayIndex + 1 < dayEntries.length) {
            const nextDay = dayEntries[dayIndex + 1];
            if (nextDay.entryType === 'quick') focusCell(`cell-km-${dayIndex + 1}`);
            else focusCell(`cell-route-start-${dayIndex + 1}-0`);
          }
        } else {
          // Detailed mode
          if (field === 'type') focusCell(`cell-route-start-${dayIndex}-0`);
          else if (field === 'route-start') focusCell(`cell-route-end-${dayIndex}-${routeIndex}`);
          else if (field === 'route-end') focusCell(`cell-route-km-${dayIndex}-${routeIndex}`);
          else if (field === 'route-km') focusCell(`cell-route-amount-${dayIndex}-${routeIndex}`);
          else if (field === 'route-amount') {
            if (routeIndex + 1 < day.routes.length) {
              focusCell(`cell-route-start-${dayIndex}-${routeIndex + 1}`);
            } else if (dayIndex + 1 < dayEntries.length) {
              const nextDay = dayEntries[dayIndex + 1];
              if (nextDay.entryType === 'quick') focusCell(`cell-km-${dayIndex + 1}`);
              else focusCell(`cell-route-start-${dayIndex + 1}-0`);
            }
          }
        }
      }
      return;
    }

    // 6. ArrowLeft -> When cursor is at start of input or empty
    if (e.key === 'ArrowLeft') {
      const target = e.currentTarget;
      if (isCursorAtStart(target)) {
        e.preventDefault();
        const day = dayEntries[dayIndex];
        if (day.entryType === 'quick') {
          if (field === 'details') focusCell(`cell-amount-${dayIndex}`);
          else if (field === 'amount') focusCell(`cell-km-${dayIndex}`);
          else if (field === 'km') focusCell(`cell-type-${dayIndex}`);
          else if (field === 'type' && dayIndex > 0) {
            const prevDay = dayEntries[dayIndex - 1];
            if (prevDay.entryType === 'quick') focusCell(`cell-details-${dayIndex - 1}`);
            else focusCell(`cell-route-amount-${dayIndex - 1}-${prevDay.routes.length - 1}`);
          }
        } else {
          // Detailed mode
          if (field === 'route-amount') focusCell(`cell-route-km-${dayIndex}-${routeIndex}`);
          else if (field === 'route-km') focusCell(`cell-route-end-${dayIndex}-${routeIndex}`);
          else if (field === 'route-end') focusCell(`cell-route-start-${dayIndex}-${routeIndex}`);
          else if (field === 'route-start') {
            if (routeIndex > 0) {
              focusCell(`cell-route-amount-${dayIndex}-${routeIndex - 1}`);
            } else {
              focusCell(`cell-type-${dayIndex}`);
            }
          } else if (field === 'type' && dayIndex > 0) {
            const prevDay = dayEntries[dayIndex - 1];
            if (prevDay.entryType === 'quick') focusCell(`cell-details-${dayIndex - 1}`);
            else focusCell(`cell-route-amount-${dayIndex - 1}-${prevDay.routes.length - 1}`);
          }
        }
      }
      return;
    }
  };

  // Department row handlers
  const addDeptRow = () => {
    setDeptRows((prev) => [
      ...prev,
      {
        id: `tmp-dept-${Date.now()}-${prev.length}`,
        departmentId: departments[0]?.id || '',
        payment: '',
        remarks: '',
      },
    ]);
  };

  const updateDeptRow = (id: string, patch: Partial<FormDepartmentRow>) => {
    setDeptRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeDeptRow = (id: string) => {
    setDeptRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeptKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    idx: number,
    field: 'dept' | 'payment' | 'remarks'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx + 1 < deptRows.length) {
        focusCell(`cell-dept-payment-${idx + 1}`);
      } else {
        addDeptRow();
        setTimeout(() => {
          focusCell(`cell-dept-payment-${idx + 1}`);
        }, 50);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx + 1 < deptRows.length) {
        if (field === 'payment') focusCell(`cell-dept-payment-${idx + 1}`);
        else if (field === 'remarks') focusCell(`cell-dept-remarks-${idx + 1}`);
        else focusCell(`cell-dept-select-${idx + 1}`);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) {
        if (field === 'payment') focusCell(`cell-dept-payment-${idx - 1}`);
        else if (field === 'remarks') focusCell(`cell-dept-remarks-${idx - 1}`);
        else focusCell(`cell-dept-select-${idx - 1}`);
      }
    } else if (e.key === 'ArrowRight' && isCursorAtEnd(e.currentTarget)) {
      if (field === 'dept') focusCell(`cell-dept-payment-${idx}`);
      else if (field === 'payment') focusCell(`cell-dept-remarks-${idx}`);
    } else if (e.key === 'ArrowLeft' && isCursorAtStart(e.currentTarget)) {
      if (field === 'remarks') focusCell(`cell-dept-payment-${idx}`);
      else if (field === 'payment') focusCell(`cell-dept-select-${idx}`);
    }
  };

  // Expense row handlers
  const addExpenseRow = () => {
    setExpenseRows((prev) => [
      ...prev,
      {
        id: `tmp-exp-${Date.now()}-${prev.length}`,
        date: `${month}-01`,
        categoryId: categories[0]?.id || '',
        paymentMethod: 'Cash',
        amount: '',
        remarks: '',
      },
    ]);
  };

  const updateExpenseRow = (id: string, patch: Partial<FormExpenseRow>) => {
    setExpenseRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeExpenseRow = (id: string) => {
    setExpenseRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleExpenseKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    idx: number,
    field: 'date' | 'cat' | 'method' | 'amount' | 'remarks'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx + 1 < expenseRows.length) {
        focusCell(`cell-exp-amount-${idx + 1}`);
      } else {
        addExpenseRow();
        setTimeout(() => {
          focusCell(`cell-exp-amount-${idx + 1}`);
        }, 50);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx + 1 < expenseRows.length) {
        if (field === 'amount') focusCell(`cell-exp-amount-${idx + 1}`);
        else if (field === 'remarks') focusCell(`cell-exp-remarks-${idx + 1}`);
        else if (field === 'date') focusCell(`cell-exp-date-${idx + 1}`);
        else focusCell(`cell-exp-amount-${idx + 1}`);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) {
        if (field === 'amount') focusCell(`cell-exp-amount-${idx - 1}`);
        else if (field === 'remarks') focusCell(`cell-exp-remarks-${idx - 1}`);
        else if (field === 'date') focusCell(`cell-exp-date-${idx - 1}`);
        else focusCell(`cell-exp-amount-${idx - 1}`);
      }
    } else if (e.key === 'ArrowRight' && isCursorAtEnd(e.currentTarget)) {
      if (field === 'date') focusCell(`cell-exp-cat-${idx}`);
      else if (field === 'cat') focusCell(`cell-exp-method-${idx}`);
      else if (field === 'method') focusCell(`cell-exp-amount-${idx}`);
      else if (field === 'amount') focusCell(`cell-exp-remarks-${idx}`);
    } else if (e.key === 'ArrowLeft' && isCursorAtStart(e.currentTarget)) {
      if (field === 'remarks') focusCell(`cell-exp-amount-${idx}`);
      else if (field === 'amount') focusCell(`cell-exp-method-${idx}`);
      else if (field === 'method') focusCell(`cell-exp-cat-${idx}`);
      else if (field === 'cat') focusCell(`cell-exp-date-${idx}`);
    }
  };

  // Quick department create
  const handleCreateQuickDept = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!newDeptName.trim()) {
      toast('Department name is required', 'error');
      return;
    }
    const created = await addDepartment(newDeptName.trim(), newDeptNotes.trim());
    toast(`Department "${created.name}" created`, 'success');
    setNewDeptName('');
    setNewDeptNotes('');
    setDeptModalOpen(false);
  };

  // Quick category create
  const handleCreateQuickCat = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) {
      toast('Category name is required', 'error');
      return;
    }
    const created = await addCategory(newCatName.trim());
    toast(`Expense category "${created.name}" created`, 'success');
    setNewCatName('');
    setCatModalOpen(false);
  };

  // Live Totals Calculations
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

  const commission = commissionAmount(totalDuty, settings.commissionRate);
  const afterComm = afterCommission(totalDuty, settings.commissionRate);
  const totalDeptPayments = deptRows.reduce((s, r) => s + (Number(r.payment) || 0), 0);
  const totalVehicleExpenses = expenseRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const finalNetBill = afterComm - totalVehicleExpenses;

  // Unified Save Handler
  const handleSave = async () => {
    if (!vehicleId) {
      toast('Please select a vehicle', 'error');
      return;
    }
    setSaving(true);
    try {
      // 1. Prepare daily entries
      const dailyData: Omit<DailyRecord, 'id'>[] = dayEntries.map((d) => {
        const numKm = Number(d.km) || undefined;
        if (d.entryType === 'detailed') {
          const validRoutes = d.routes.filter((r) => r.amount > 0 || r.location.trim() !== '');
          const total = validRoutes.reduce((s, r) => s + (Number(r.amount) || 0), 0);
          return {
            date: d.date,
            km: numKm,
            amount: total,
            details: '',
            routes: validRoutes,
            entryType: 'detailed' as const,
          };
        }
        return {
          date: d.date,
          km: numKm,
          amount: Number(d.amount) || 0,
          details: d.details,
          routes: [],
          entryType: 'quick' as const,
        };
      });

      // 2. Save bulk daily records
      const rec = await saveMonthlyRecordBulk(vehicleId, month, dailyData);

      // 3. Save Department Payments
      const validDepts = deptRows.filter((dr) => Number(dr.payment) > 0 && dr.departmentId);
      const existingDepts = rec.departments || [];
      const existingDeptIds = new Set(existingDepts.map((d) => d.id));

      for (const dr of validDepts) {
        const deptObj = departments.find((d) => d.id === dr.departmentId);
        const deptName = deptObj?.name || '';
        const pmt = Number(dr.payment);

        if (dr.id && existingDeptIds.has(dr.id)) {
          await updateDepartmentEntry(rec.id, dr.id, {
            departmentId: dr.departmentId,
            departmentName: deptName,
            payment: pmt,
            remarks: dr.remarks || '',
          });
        } else {
          await addDepartmentEntry(rec.id, {
            departmentId: dr.departmentId,
            departmentName: deptName,
            payment: pmt,
            remarks: dr.remarks || '',
            date: `${month}-01`,
          });
        }
      }

      // Delete removed department entries if any
      const currentFormDeptIds = new Set(validDepts.map((d) => d.id).filter(Boolean));
      for (const ed of existingDepts) {
        if (!currentFormDeptIds.has(ed.id)) {
          await deleteDepartmentEntry(rec.id, ed.id);
        }
      }

      // 4. Save Vehicle Expenses
      const validExpenses = expenseRows.filter((er) => Number(er.amount) > 0 && er.categoryId);
      const existingExpenses = rec.expenses || [];
      const existingExpIds = new Set(existingExpenses.map((e) => e.id));
      const vehicle = vehicles.find((v) => v.id === vehicleId);

      for (const er of validExpenses) {
        const amt = Number(er.amount);
        if (er.id && existingExpIds.has(er.id)) {
          await updateExpense(rec.id, er.id, {
            date: er.date || `${month}-01`,
            categoryId: er.categoryId,
            amount: amt,
            remarks: er.remarks || '',
          });
        } else {
          await addBusinessExpense({
            date: er.date || `${month}-01`,
            categoryId: er.categoryId,
            expenseFor: 'Vehicle',
            relatedToId: vehicleId,
            relatedToName: vehicle?.number || vehicleId,
            amount: amt,
            paymentMethod: er.paymentMethod || 'Cash',
            remarks: er.remarks || '',
          });
        }
      }

      // Delete removed expenses if any
      const currentFormExpIds = new Set(validExpenses.map((e) => e.id).filter(Boolean));
      for (const ee of existingExpenses) {
        if (!currentFormExpIds.has(ee.id)) {
          await deleteExpense(rec.id, ee.id);
        }
      }

      toast(
        `Monthly record saved with ${filledDays} duty entries, ${validDepts.length} department allocations, and ${validExpenses.length} expenses`,
        'success'
      );
      navigate(`/monthly-records/${rec.id}`);
    } catch (err: any) {
      console.error('Save Monthly Record Error:', err);
      toast(err.message || 'Failed to save monthly record', 'error');
    } finally {
      setSaving(false);
    }
  };

  const shiftMonth = (direction: number) => {
    const [y, m] = month.split('-').map(Number);
    const newDate = new Date(y, m - 1 + direction, 1);
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setMonth(newMonth);
    if (showTable && vehicleId) {
      const existing = monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === newMonth);
      setDayEntries(buildDayEntries(newMonth, existing));

      if (existing?.departments?.length) {
        setDeptRows(
          existing.departments.map((d) => ({
            id: d.id,
            departmentId: d.departmentId,
            payment: String(d.payment || ''),
            remarks: d.remarks || '',
          }))
        );
      } else {
        setDeptRows([]);
      }

      if (existing?.expenses?.length) {
        setExpenseRows(
          existing.expenses.map((exp) => ({
            id: exp.id,
            date: exp.date || `${newMonth}-01`,
            categoryId: exp.categoryId,
            paymentMethod: 'Cash',
            amount: String(exp.amount || ''),
            remarks: exp.remarks || '',
          }))
        );
      } else {
        setExpenseRows([]);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Add Monthly Record (ماہانہ بل ریکارڈ)" backTo="/monthly-records" />

      {vehicles.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No vehicles available"
            message="Add a vehicle first before creating a monthly record."
            action={
              <Link to="/vehicles/add">
                <Button>Add Vehicle</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Selection Bar */}
          <Card className="p-5">
            <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1 max-w-sm">
                <SearchableVehicleSelect vehicles={vehicles} value={vehicleId} onChange={setVehicleId} />
              </div>
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Month / Year</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition flex-shrink-0"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition flex-shrink-0"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Button type="submit">{showTable ? 'Regenerate Table' : 'Generate Table'}</Button>
            </form>
          </Card>

          {/* All-in-One Form (Daily Dates Table -> Departments -> Expenses -> Save Bar) */}
          {showTable && (
            <div className="space-y-6">
              {/* Top Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">{formatMonth(month)}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
                      {vehicles.find((v) => v.id === vehicleId)?.number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dayEntries.length} total days · {filledDays} duty entries filled
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-lg bg-sky-50 border border-sky-100 text-right">
                    <div className="text-[11px] text-sky-600 font-medium uppercase tracking-wider">Total Duty</div>
                    <div className="text-sm font-bold text-sky-700">{formatPKR(totalDuty)}</div>
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4" /> {saving ? 'Saving Record...' : 'Save Monthly Record'}
                  </Button>
                </div>
              </div>

              {/* 1. Daily Duty Dates Table */}
              <Card className="overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                    <Layers className="w-4 h-4 text-sky-600" />
                    <span>Daily Duty Entries (تاریخ وار ڈیوٹی ریکارڈ)</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {filledDays} of {dayEntries.length} days entered
                  </span>
                </div>

                {/* Keyboard Navigation Hints Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-sky-50/90 border-b border-sky-100 text-xs text-sky-900">
                  <div className="flex flex-wrap items-center gap-2.5 font-medium">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-200 text-sky-950 font-mono text-[11px] font-bold">
                      <Keyboard className="w-3.5 h-3.5" /> Shortcuts
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-white rounded border border-sky-200 font-semibold shadow-xs">Enter</kbd> Next Date
                    </span>
                    <span className="text-sky-300">·</span>
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-white rounded border border-sky-200 font-semibold shadow-xs">Ctrl + Enter</kbd> Add New Route (+ روٹ)
                    </span>
                    <span className="text-sky-300">·</span>
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-white rounded border border-sky-200 font-semibold shadow-xs">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white rounded border border-sky-200 font-semibold shadow-xs">↓</kbd> <kbd className="px-1.5 py-0.5 bg-white rounded border border-sky-200 font-semibold shadow-xs">←</kbd> <kbd className="px-1.5 py-0.5 bg-white rounded border border-sky-200 font-semibold shadow-xs">→</kbd> Navigate Boxes
                    </span>
                  </div>
                  <span className="text-sky-700 text-[11px] hidden lg:inline">
                    Mouse کے بغیر تیزی سے ڈیٹا انٹری کریں
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/70 text-left text-xs text-slate-500 font-medium uppercase tracking-wide border-b border-slate-200">
                        <th className="px-3 py-3 w-16">Date</th>
                        <th className="px-3 py-3 w-12">Day</th>
                        <th className="px-3 py-3 w-24">Type</th>
                        <th className="px-3 py-3 w-28">
                          {settings.autoKmPricing !== false ? 'KM (Auto Rate)' : 'KM (Manual)'}
                        </th>
                        <th className="px-3 py-3 min-w-[340px]">Amount / Routes (PKR)</th>
                        <th className="px-3 py-3 min-w-[180px]">Details / Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dayEntries.map((day, index) => {
                        const hasData =
                          day.entryType === 'detailed'
                            ? day.routes.some((r) => r.amount > 0 || r.location.trim() !== '')
                            : Number(day.amount) > 0 || day.details.trim() !== '';
                        return (
                          <tr key={day.date} className={hasData ? 'bg-sky-50/30' : 'hover:bg-slate-50/50'}>
                            <td className="px-3 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-400 font-medium">{day.dayName}</td>
                            <td className="px-3 py-2">
                              <select
                                id={`cell-type-${index}`}
                                value={day.entryType}
                                onChange={(e) => switchEntryType(index, e.target.value as 'quick' | 'detailed')}
                                onKeyDown={(e) => handleCellKeyDown(e, index, 'type')}
                                className="px-2 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                              >
                                <option value="quick">Quick</option>
                                <option value="detailed">Detailed</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              {day.entryType === 'quick' ? (
                                <input
                                  id={`cell-km-${index}`}
                                  type="number"
                                  value={day.km}
                                  onChange={(e) => handleKmChange(index, e.target.value)}
                                  onKeyDown={(e) => handleCellKeyDown(e, index, 'km')}
                                  placeholder="e.g. 75"
                                  className="w-full px-2.5 py-1.5 rounded-md border border-sky-200 bg-sky-50/40 text-sm font-semibold text-sky-800 placeholder-slate-300 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {day.entryType === 'quick' ? (
                                <input
                                  id={`cell-amount-${index}`}
                                  type="number"
                                  value={day.amount}
                                  onChange={(e) => updateDay(index, { amount: e.target.value })}
                                  onKeyDown={(e) => handleCellKeyDown(e, index, 'amount')}
                                  placeholder="0"
                                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-semibold"
                                />
                              ) : (
                                <div className="space-y-1.5">
                                  {day.routes.map((route, rIdx) => {
                                    return (
                                      <div key={route.id} className="flex gap-1.5 items-center">
                                        <RouteLocationInput
                                          startId={`cell-route-start-${index}-${rIdx}`}
                                          endId={`cell-route-end-${index}-${rIdx}`}
                                          onStartKeyDown={(e) => handleCellKeyDown(e, index, 'route-start', rIdx)}
                                          onEndKeyDown={(e) => handleCellKeyDown(e, index, 'route-end', rIdx)}
                                          location={route.location}
                                          onChange={(newLoc) => updateRoute(index, route.id, { location: newLoc })}
                                          startPlaceholder="Start (e.g. Factory)"
                                          endPlaceholder="Destination (e.g. DHA)"
                                          className="flex-1 min-w-[190px]"
                                          size="sm"
                                        />
                                        <input
                                          id={`cell-route-km-${index}-${rIdx}`}
                                          type="number"
                                          value={route.km || ''}
                                          onChange={(e) => handleRouteKmChange(index, route.id, e.target.value)}
                                          onKeyDown={(e) => handleCellKeyDown(e, index, 'route-km', rIdx)}
                                          placeholder="KM"
                                          className="w-14 sm:w-16 px-2 py-1.5 rounded-md border border-sky-200 bg-sky-50/40 text-xs font-semibold text-sky-800 placeholder-slate-300 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shrink-0"
                                          title="Enter KM for auto rate"
                                        />
                                        <input
                                          id={`cell-route-amount-${index}-${rIdx}`}
                                          type="number"
                                          value={route.amount || ''}
                                          onChange={(e) =>
                                            updateRoute(index, route.id, { amount: Number(e.target.value) || 0 })
                                          }
                                          onKeyDown={(e) => handleCellKeyDown(e, index, 'route-amount', rIdx)}
                                          placeholder="Rate"
                                          className="w-16 sm:w-20 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-300 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-semibold shrink-0"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeRoute(index, route.id)}
                                          className="p-1 rounded text-slate-300 hover:text-red-500 shrink-0"
                                          title="Remove Route"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                  {day.routes.length > 0 && (
                                    <div className="flex justify-between items-center px-1">
                                      <span className="text-xs text-slate-400">
                                        Total:{' '}
                                        <span className="font-semibold text-slate-700">
                                          {formatPKR(
                                            day.routes.reduce((s, r) => s + (Number(r.amount) || 0), 0)
                                          )}
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => addRoute(index)}
                                    className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                                  >
                                    <Plus className="w-3 h-3" /> Add Route (یا Ctrl+Enter)
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {day.entryType === 'quick' ? (
                                <input
                                  id={`cell-details-${index}`}
                                  type="text"
                                  value={day.details}
                                  onChange={(e) => updateDay(index, { details: e.target.value })}
                                  onKeyDown={(e) => handleCellKeyDown(e, index, 'details')}
                                  placeholder="Remarks / Location..."
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
                        <td className="px-3 py-3" colSpan={4}>
                          TOTAL DUTY
                        </td>
                        <td className="px-3 py-3 text-sm text-sky-700">{formatPKR(totalDuty)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>

              {/* 2. Directly Below: Department Payments Section */}
              <Card className="overflow-hidden border-indigo-100 shadow-sm">
                <div className="px-5 py-4 bg-gradient-to-r from-indigo-50/80 to-sky-50/50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <Building2 className="w-4.5 h-4.5 text-indigo-600" />
                      <span>Department Payments (محکمہ کی ادائیگیاں)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assign bill payment allocations to departments for this vehicle
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeptModalOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 font-medium px-2.5 py-1.5 rounded-lg transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Dept
                    </button>
                    <Button size="sm" onClick={addDeptRow} variant="secondary">
                      <Plus className="w-4 h-4" /> Add Department Payment
                    </Button>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  {deptRows.length === 0 ? (
                    <div className="p-6 text-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50">
                      <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600">No department payments added for this bill</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Click "+ Add Department Payment" to allocate payment shares to departments.
                      </p>
                      <button
                        type="button"
                        onClick={addDeptRow}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-3 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add First Department Payment
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 hidden sm:grid">
                        <div className="col-span-4">Department</div>
                        <div className="col-span-3">Payment (PKR)</div>
                        <div className="col-span-4">Remarks / Notes</div>
                        <div className="col-span-1 text-center">Action</div>
                      </div>

                      {deptRows.map((row, idx) => (
                        <div
                          key={row.id}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-lg border border-slate-200 bg-white items-center hover:border-indigo-200 transition"
                        >
                          <div className="sm:col-span-4">
                            <label className="text-xs text-slate-500 font-medium sm:hidden mb-1 block">
                              Department:
                            </label>
                            <select
                              id={`cell-dept-select-${idx}`}
                              value={row.departmentId}
                              onChange={(e) => updateDeptRow(row.id, { departmentId: e.target.value })}
                              onKeyDown={(e) => handleDeptKeyDown(e, idx, 'dept')}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                            >
                              <option value="">Select Department...</option>
                              {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="text-xs text-slate-500 font-medium sm:hidden mb-1 block">
                              Payment Amount:
                            </label>
                            <input
                              id={`cell-dept-payment-${idx}`}
                              type="number"
                              value={row.payment}
                              onChange={(e) => updateDeptRow(row.id, { payment: e.target.value })}
                              onKeyDown={(e) => handleDeptKeyDown(e, idx, 'payment')}
                              placeholder="Amount (PKR)"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="text-xs text-slate-500 font-medium sm:hidden mb-1 block">Remarks:</label>
                            <input
                              id={`cell-dept-remarks-${idx}`}
                              type="text"
                              value={row.remarks}
                              onChange={(e) => updateDeptRow(row.id, { remarks: e.target.value })}
                              onKeyDown={(e) => handleDeptKeyDown(e, idx, 'remarks')}
                              placeholder="e.g. Accounts share, Shift payment..."
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="sm:col-span-1 flex justify-end sm:justify-center">
                            <button
                              type="button"
                              onClick={() => removeDeptRow(row.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete Department Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Subtotal Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 mt-3">
                        <span className="text-xs font-bold text-indigo-900">
                          Total Departments Allocated ({deptRows.length} payment{deptRows.length !== 1 ? 's' : ''}):
                        </span>
                        <span className="text-sm font-bold text-indigo-700">{formatPKR(totalDeptPayments)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 3. Directly Below: Vehicle Expenses Section */}
              <Card className="overflow-hidden border-amber-100 shadow-sm">
                <div className="px-5 py-4 bg-gradient-to-r from-amber-50/80 to-orange-50/50 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <Wallet className="w-4.5 h-4.5 text-amber-600" />
                      <span>Vehicle Expenses (گاڑی کے اخراجات)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Record fuel, repairs, maintenance, and other vehicle expenses for {formatMonth(month)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCatModalOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 font-medium px-2.5 py-1.5 rounded-lg transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Category
                    </button>
                    <Button size="sm" onClick={addExpenseRow} variant="secondary">
                      <Plus className="w-4 h-4" /> Add Expense
                    </Button>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  {expenseRows.length === 0 ? (
                    <div className="p-6 text-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50">
                      <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600">No expenses recorded for this vehicle & month</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Click "+ Add Expense" to record fuel, repairs, maintenance, or other costs.
                      </p>
                      <button
                        type="button"
                        onClick={addExpenseRow}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 font-semibold px-3 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add First Expense
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 hidden sm:grid">
                        <div className="col-span-2">Date</div>
                        <div className="col-span-3">Category</div>
                        <div className="col-span-2">Method</div>
                        <div className="col-span-2">Amount (PKR)</div>
                        <div className="col-span-2">Remarks</div>
                        <div className="col-span-1 text-center">Action</div>
                      </div>

                      {expenseRows.map((row, idx) => (
                        <div
                          key={row.id}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-lg border border-slate-200 bg-white items-center hover:border-amber-200 transition"
                        >
                          <div className="sm:col-span-2">
                            <label className="text-xs text-slate-500 font-medium sm:hidden mb-1 block">Date:</label>
                            <input
                              id={`cell-exp-date-${idx}`}
                              type="date"
                              value={row.date}
                              onChange={(e) => updateExpenseRow(row.id, { date: e.target.value })}
                              onKeyDown={(e) => handleExpenseKeyDown(e, idx, 'date')}
                              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="text-xs text-slate-500 font-medium sm:hidden mb-1 block">Category:</label>
                            <select
                              id={`cell-exp-cat-${idx}`}
                              value={row.categoryId}
                              onChange={(e) => updateExpenseRow(row.id, { categoryId: e.target.value })}
                              onKeyDown={(e) => handleExpenseKeyDown(e, idx, 'cat')}
                              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                            >
                              <option value="">Select Category...</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-xs text-slate-500 font-medium sm:hidden mb-1 block">Payment:</label>
                            <select
                              id={`cell-exp-method-${idx}`}
                              value={row.paymentMethod}
                              onChange={(e) =>
                                updateExpenseRow(row.id, { paymentMethod: e.target.value as PaymentMethod })
                              }
                              onKeyDown={(e) => handleExpenseKeyDown(e, idx, 'method')}
                              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-xs text-slate-500 font-medium sm:hidden mb-1 block">Amount:</label>
                            <input
                              id={`cell-exp-amount-${idx}`}
                              type="number"
                              value={row.amount}
                              onChange={(e) => updateExpenseRow(row.id, { amount: e.target.value })}
                              onKeyDown={(e) => handleExpenseKeyDown(e, idx, 'amount')}
                              placeholder="0"
                              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-semibold"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-xs text-slate-500 font-medium sm:hidden mb-1 block">Remarks:</label>
                            <input
                              id={`cell-exp-remarks-${idx}`}
                              type="text"
                              value={row.remarks}
                              onChange={(e) => updateExpenseRow(row.id, { remarks: e.target.value })}
                              onKeyDown={(e) => handleExpenseKeyDown(e, idx, 'remarks')}
                              placeholder="e.g. Fuel 50L, Tyre repair"
                              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div className="sm:col-span-1 flex justify-end sm:justify-center">
                            <button
                              type="button"
                              onClick={() => removeExpenseRow(row.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete Expense Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Subtotal Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-50/60 rounded-lg border border-amber-100 mt-3">
                        <span className="text-xs font-bold text-amber-900">
                          Total Vehicle Expenses ({expenseRows.length} item{expenseRows.length !== 1 ? 's' : ''}):
                        </span>
                        <span className="text-sm font-bold text-amber-700">{formatPKR(totalVehicleExpenses)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 4. Directly Below: Final Live Summary & Save Action Bar */}
              <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl border-slate-700">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Monthly Bill Live Summary (بل کا خلاصہ)</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      {formatMonth(month)} · {vehicles.find((v) => v.id === vehicleId)?.number}
                    </span>
                  </div>

                  {/* Summary Metric Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                      <div className="text-[11px] text-slate-400 uppercase font-medium">Total Duty</div>
                      <div className="text-base font-bold text-sky-400 mt-1">{formatPKR(totalDuty)}</div>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                      <div className="text-[11px] text-slate-400 uppercase font-medium">
                        Commission ({settings.commissionRate}%)
                      </div>
                      <div className="text-sm font-medium text-slate-300 mt-1">-{formatPKR(commission)}</div>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                      <div className="text-[11px] text-slate-400 uppercase font-medium">After Commission</div>
                      <div className="text-base font-bold text-white mt-1">{formatPKR(afterComm)}</div>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                      <div className="text-[11px] text-slate-400 uppercase font-medium">Dept. Allocated</div>
                      <div className="text-base font-semibold text-indigo-300 mt-1">
                        {formatPKR(totalDeptPayments)}
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                      <div className="text-[11px] text-slate-400 uppercase font-medium">Expenses Total</div>
                      <div className="text-base font-semibold text-amber-400 mt-1">
                        -{formatPKR(totalVehicleExpenses)}
                      </div>
                    </div>

                    <div className="bg-sky-600/30 p-3 rounded-lg border border-sky-500/50 text-center">
                      <div className="text-[11px] text-sky-300 uppercase font-bold tracking-wide">Net Bill Amount</div>
                      <div className="text-base font-extrabold text-sky-200 mt-1">{formatPKR(finalNetBill)}</div>
                    </div>
                  </div>

                  {/* Main Save Button Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-700/80">
                    <div className="text-xs text-slate-300">
                      Saving will update all daily duty dates, department payment allocations, and vehicle expenses simultaneously.
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      size="md"
                      className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-bold px-8 shadow-lg shadow-sky-900/50"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving Everything...' : 'Save Monthly Record (مکمل ریکارڈ محفوظ کریں)'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Quick Add Department Modal */}
      <Modal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title="Add New Department (نیا محکمہ بنائیں)"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateQuickDept()}>Create Department</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateQuickDept} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="e.g. Accounts, HR, Operations"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Description</label>
            <input
              type="text"
              value={newDeptNotes}
              onChange={(e) => setNewDeptNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </form>
      </Modal>

      {/* Quick Add Expense Category Modal */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Add Expense Category (اخراجات کی کیٹیگری)"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCatModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateQuickCat()}>Create Category</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateQuickCat} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Fuel, Maintenance, Tyre, Toll Tax"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              autoFocus
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
