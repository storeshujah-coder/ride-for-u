import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  Vehicle, Driver, Subcontractor, MonthlyRecord, ExpenseCategory,
  ActivityLog, Settings, SalaryRecord, Expense, DailyRecord, RouteEntry,
  BusinessExpense, ExpenseFor, PaymentMethod,
} from '@/types';
import {
  seedVehicles, seedDrivers, seedSubcontractors, seedMonthlyRecords,
  seedCategories, seedActivity, seedSettings, seedSalaries,
  seedBusinessExpenses,
} from '@/data/seed';

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowParts(): { date: string; time: string } {
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const time = `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  return { date, time };
}

interface StoreContextValue {
  vehicles: Vehicle[];
  drivers: Driver[];
  subcontractors: Subcontractor[];
  monthlyRecords: MonthlyRecord[];
  categories: ExpenseCategory[];
  salaries: SalaryRecord[];
  activity: ActivityLog[];
  settings: Settings;

  addVehicle: (v: Omit<Vehicle, 'id' | 'createdAt'>) => Vehicle;
  updateVehicle: (id: string, v: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  addDriver: (d: Omit<Driver, 'id' | 'createdAt'>) => Driver;
  updateDriver: (id: string, d: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;

  addSubcontractor: (s: Omit<Subcontractor, 'id' | 'createdAt'>) => Subcontractor;
  updateSubcontractor: (id: string, s: Partial<Subcontractor>) => void;
  deleteSubcontractor: (id: string) => void;

  addSalary: (s: Omit<SalaryRecord, 'id' | 'createdAt'>) => SalaryRecord;
  updateSalary: (id: string, s: Partial<SalaryRecord>) => void;
  deleteSalary: (id: string) => void;

  getMonthlyRecord: (vehicleId: string, month: string) => MonthlyRecord | undefined;
  createMonthlyRecord: (vehicleId: string, month: string) => MonthlyRecord;
  addDailyRecord: (recordId: string, dr: Omit<DailyRecord, 'id'>) => void;
  updateDailyRecord: (recordId: string, drId: string, dr: Partial<DailyRecord>) => void;
  deleteDailyRecord: (recordId: string, drId: string) => void;

  addExpense: (recordId: string, e: Omit<Expense, 'id' | 'createdAt' | 'vehicleId'> & { vehicleId?: string }) => void;
  updateExpense: (recordId: string, eId: string, e: Partial<Expense>) => void;
  deleteExpense: (recordId: string, eId: string) => void;

  getAllExpenses: () => { expense: Expense; recordId: string }[];
  addStandaloneExpense: (vehicleId: string, date: string, categoryId: string, amount: number, remarks: string) => void;
  updateStandaloneExpense: (expenseId: string, patch: Partial<Expense>) => void;
  deleteStandaloneExpense: (expenseId: string) => void;

  businessExpenses: BusinessExpense[];
  addBusinessExpense: (e: Omit<BusinessExpense, 'id' | 'createdAt'>) => void;
  updateBusinessExpense: (id: string, patch: Partial<BusinessExpense>) => void;
  deleteBusinessExpense: (id: string) => void;
  getBusinessExpensesForEntity: (expenseFor: ExpenseFor, relatedToId: string, month?: string) => BusinessExpense[];
  getBusinessExpensesForVehicle: (vehicleId: string, month?: string) => BusinessExpense[];
  getBusinessExpensesForSubcontractor: (subId: string, month?: string) => BusinessExpense[];

  saveMonthlyRecordBulk: (vehicleId: string, month: string, dailyRecords: Omit<DailyRecord, 'id'>[]) => MonthlyRecord;

  addCategory: (name: string) => ExpenseCategory;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;

  updateSettings: (s: Partial<Settings>) => void;

  logActivity: (entry: Omit<ActivityLog, 'id' | 'actor' | 'date' | 'time'>) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(seedVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(seedDrivers);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>(seedSubcontractors);
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>(seedMonthlyRecords);
  const [categories, setCategories] = useState<ExpenseCategory[]>(seedCategories);
  const [salaries, setSalaries] = useState<SalaryRecord[]>(seedSalaries);
  const [activity, setActivity] = useState<ActivityLog[]>(seedActivity);
  const [settings, setSettings] = useState<Settings>(seedSettings);
  const [businessExpenses, setBusinessExpenses] = useState<BusinessExpense[]>(seedBusinessExpenses);

  const logActivity = useCallback((entry: Omit<ActivityLog, 'id' | 'actor' | 'date' | 'time'>) => {
    const { date, time } = nowParts();
    setActivity((prev) => [
      { id: uid('act'), actor: settings.adminName, date, time, ...entry },
      ...prev,
    ]);
  }, [settings.adminName]);

  // Vehicles
  const addVehicle = useCallback((v: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const vehicle: Vehicle = { ...v, id: uid('veh'), createdAt: new Date().toISOString() };
    setVehicles((prev) => [vehicle, ...prev]);
    logActivity({ action: `Created vehicle ${vehicle.number}`, entity: 'vehicle', entityId: vehicle.id });
    return vehicle;
  }, [logActivity]);

  const updateVehicle = useCallback((id: string, patch: Partial<Vehicle>) => {
    setVehicles((prev) => {
      const old = prev.find((x) => x.id === id);
      if (old) {
        const changes: string[] = [];
        (Object.keys(patch) as (keyof Vehicle)[]).forEach((k) => {
          if (old[k] !== patch[k] && k !== 'id' && k !== 'createdAt') {
            changes.push(`${String(k)}: "${String(old[k])}" → "${String(patch[k])}"`);
          }
        });
        if (changes.length) logActivity({ action: `Edited vehicle ${old.number} — ${changes.join(', ')}`, entity: 'vehicle', entityId: id });
      }
      return prev.map((x) => (x.id === id ? { ...x, ...patch } : x));
    });
  }, [logActivity]);

  const deleteVehicle = useCallback((id: string) => {
    setVehicles((prev) => {
      const v = prev.find((x) => x.id === id);
      if (v) logActivity({ action: `Deleted vehicle ${v.number}`, entity: 'vehicle', entityId: id });
      return prev.filter((x) => x.id !== id);
    });
    setMonthlyRecords((prev) => prev.filter((r) => r.vehicleId !== id));
    setDrivers((prev) => prev.map((d) => (d.vehicleId === id ? { ...d, vehicleId: undefined } : d)));
  }, [logActivity]);

  // Drivers
  const addDriver = useCallback((d: Omit<Driver, 'id' | 'createdAt'>) => {
    const driver: Driver = { ...d, id: uid('drv'), createdAt: new Date().toISOString() };
    setDrivers((prev) => [driver, ...prev]);
    if (driver.vehicleId) {
      setVehicles((prev) => prev.map((v) => (v.id === driver.vehicleId ? { ...v, driverId: driver.id } : v)));
    }
    logActivity({ action: `Created driver ${driver.fullName}`, entity: 'driver', entityId: driver.id });
    return driver;
  }, [logActivity]);

  const updateDriver = useCallback((id: string, patch: Partial<Driver>) => {
    setDrivers((prev) => {
      const old = prev.find((x) => x.id === id);
      if (old) {
        const changes: string[] = [];
        (Object.keys(patch) as (keyof Driver)[]).forEach((k) => {
          if (old[k] !== patch[k] && k !== 'id' && k !== 'createdAt') {
            changes.push(`${String(k)}: "${String(old[k])}" → "${String(patch[k])}"`);
          }
        });
        if (changes.length) logActivity({ action: `Edited driver ${old.fullName} — ${changes.join(', ')}`, entity: 'driver', entityId: id });
      }
      return prev.map((x) => (x.id === id ? { ...x, ...patch } : x));
    });
    if (patch.vehicleId !== undefined) {
      setVehicles((prev) => prev.map((v) => (v.driverId === id ? { ...v, driverId: undefined } : v)));
      if (patch.vehicleId) {
        setVehicles((prev) => prev.map((v) => (v.id === patch.vehicleId ? { ...v, driverId: id } : v)));
      }
    }
  }, [logActivity]);

  const deleteDriver = useCallback((id: string) => {
    setDrivers((prev) => {
      const d = prev.find((x) => x.id === id);
      if (d) logActivity({ action: `Deleted driver ${d.fullName}`, entity: 'driver', entityId: id });
      return prev.filter((x) => x.id !== id);
    });
    setVehicles((prev) => prev.map((v) => (v.driverId === id ? { ...v, driverId: undefined } : v)));
    setSalaries((prev) => prev.filter((s) => s.driverId !== id));
  }, [logActivity]);

  // Subcontractors
  const addSubcontractor = useCallback((s: Omit<Subcontractor, 'id' | 'createdAt'>) => {
    const sub: Subcontractor = { ...s, id: uid('sub'), createdAt: new Date().toISOString() };
    setSubcontractors((prev) => [sub, ...prev]);
    logActivity({ action: `Created subcontractor ${sub.name}`, entity: 'subcontractor', entityId: sub.id });
    return sub;
  }, [logActivity]);

  const updateSubcontractor = useCallback((id: string, patch: Partial<Subcontractor>) => {
    setSubcontractors((prev) => {
      const old = prev.find((x) => x.id === id);
      if (old) {
        const changes: string[] = [];
        (Object.keys(patch) as (keyof Subcontractor)[]).forEach((k) => {
          if (old[k] !== patch[k] && k !== 'id' && k !== 'createdAt') {
            changes.push(`${String(k)}: "${String(old[k])}" → "${String(patch[k])}"`);
          }
        });
        if (changes.length) logActivity({ action: `Edited subcontractor ${old.name} — ${changes.join(', ')}`, entity: 'subcontractor', entityId: id });
      }
      return prev.map((x) => (x.id === id ? { ...x, ...patch } : x));
    });
  }, [logActivity]);

  const deleteSubcontractor = useCallback((id: string) => {
    setSubcontractors((prev) => {
      const s = prev.find((x) => x.id === id);
      if (s) logActivity({ action: `Deleted subcontractor ${s.name}`, entity: 'subcontractor', entityId: id });
      return prev.filter((x) => x.id !== id);
    });
    setVehicles((prev) => prev.map((v) => (v.ownerId === id ? { ...v, ownerType: 'Ride for U', ownerId: undefined } : v)));
  }, [logActivity]);

  // Salaries
  const addSalary = useCallback((s: Omit<SalaryRecord, 'id' | 'createdAt'>) => {
    const sal: SalaryRecord = { ...s, id: uid('sal'), createdAt: new Date().toISOString() };
    setSalaries((prev) => [sal, ...prev]);
    logActivity({ action: `Added salary record for ${s.month}`, entity: 'salary', entityId: sal.id });
    return sal;
  }, [logActivity]);

  const updateSalary = useCallback((id: string, patch: Partial<SalaryRecord>) => {
    setSalaries((prev) => {
      const old = prev.find((x) => x.id === id);
      if (old) {
        const changes: string[] = [];
        (Object.keys(patch) as (keyof SalaryRecord)[]).forEach((k) => {
          if (old[k] !== patch[k] && k !== 'id' && k !== 'createdAt') {
            changes.push(`${String(k)}: "${String(old[k])}" → "${String(patch[k])}"`);
          }
        });
        if (changes.length) logActivity({ action: `Edited salary record — ${changes.join(', ')}`, entity: 'salary', entityId: id });
      }
      return prev.map((x) => (x.id === id ? { ...x, ...patch } : x));
    });
  }, [logActivity]);

  const deleteSalary = useCallback((id: string) => {
    setSalaries((prev) => {
      const s = prev.find((x) => x.id === id);
      if (s) logActivity({ action: `Deleted salary record for ${s.month}`, entity: 'salary', entityId: id });
      return prev.filter((x) => x.id !== id);
    });
  }, [logActivity]);

  // Monthly Records
  const getMonthlyRecord = useCallback((vehicleId: string, month: string) => {
    return monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === month);
  }, [monthlyRecords]);

  const createMonthlyRecord = useCallback((vehicleId: string, month: string) => {
    const existing = monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === month);
    if (existing) return existing;
    const rec: MonthlyRecord = {
      id: uid('mr'),
      vehicleId,
      month,
      dailyRecords: [],
      expenses: [],
      createdAt: new Date().toISOString(),
    };
    setMonthlyRecords((prev) => [rec, ...prev]);
    logActivity({ action: `Created monthly record for ${month}`, entity: 'monthly-record', entityId: rec.id });
    return rec;
  }, [monthlyRecords, logActivity]);

  const addDailyRecord = useCallback((recordId: string, dr: Omit<DailyRecord, 'id'>) => {
    const entry: DailyRecord = { ...dr, id: uid('dr') };
    setMonthlyRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      const dailyRecords = [...r.dailyRecords, entry].sort((a, b) => a.date.localeCompare(b.date));
      return { ...r, dailyRecords };
    }));
    logActivity({ action: `Added daily entry for ${dr.date} — Rs. ${dr.amount.toLocaleString()}`, entity: 'daily-record', entityId: recordId });
  }, [logActivity]);

  const updateDailyRecord = useCallback((recordId: string, drId: string, patch: Partial<DailyRecord>) => {
    setMonthlyRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      const old = r.dailyRecords.find((d) => d.id === drId);
      if (old) {
        if (patch.amount !== undefined && patch.amount !== old.amount) {
          logActivity({ action: `Edited Duty Amount`, entity: 'daily-record', entityId: drId, oldValue: `Rs. ${old.amount.toLocaleString()}`, newValue: `Rs. ${patch.amount.toLocaleString()}` });
        }
      }
      return {
        ...r,
        dailyRecords: r.dailyRecords.map((d) => (d.id === drId ? { ...d, ...patch } : d)),
      };
    }));
  }, [logActivity]);

  const deleteDailyRecord = useCallback((recordId: string, drId: string) => {
    setMonthlyRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      const dr = r.dailyRecords.find((d) => d.id === drId);
      if (dr) logActivity({ action: `Deleted daily entry for ${dr.date} — Rs. ${dr.amount.toLocaleString()}`, entity: 'daily-record', entityId: drId });
      return { ...r, dailyRecords: r.dailyRecords.filter((d) => d.id !== drId) };
    }));
  }, [logActivity]);

  // Expenses
  const addExpense = useCallback((recordId: string, e: Omit<Expense, 'id' | 'createdAt' | 'vehicleId'> & { vehicleId?: string }) => {
    const rec = monthlyRecords.find((r) => r.id === recordId);
    const vehicleId = e.vehicleId || rec?.vehicleId || '';
    const exp: Expense = { ...e, vehicleId, id: uid('exp'), createdAt: new Date().toISOString() };
    setMonthlyRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, expenses: [...r.expenses, exp] } : r)));
    logActivity({ action: `Added expense — Rs. ${exp.amount.toLocaleString()}`, entity: 'expense', entityId: exp.id });
  }, [monthlyRecords, logActivity]);

  const updateExpense = useCallback((recordId: string, eId: string, patch: Partial<Expense>) => {
    setMonthlyRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      const old = r.expenses.find((e) => e.id === eId);
      if (old && patch.amount !== undefined && patch.amount !== old.amount) {
        logActivity({ action: `Edited Expense`, entity: 'expense', entityId: eId, oldValue: `Rs. ${old.amount.toLocaleString()}`, newValue: `Rs. ${patch.amount.toLocaleString()}` });
      }
      return { ...r, expenses: r.expenses.map((e) => (e.id === eId ? { ...e, ...patch } : e)) };
    }));
  }, [logActivity]);

  const deleteExpense = useCallback((recordId: string, eId: string) => {
    setMonthlyRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      const e = r.expenses.find((x) => x.id === eId);
      if (e) logActivity({ action: `Deleted expense — Rs. ${e.amount.toLocaleString()}`, entity: 'expense', entityId: eId });
      return { ...r, expenses: r.expenses.filter((e) => e.id !== eId) };
    }));
  }, [logActivity]);

  // Standalone expense helpers (work across all monthly records)
  const getAllExpenses = useCallback(() => {
    const result: { expense: Expense; recordId: string }[] = [];
    monthlyRecords.forEach((r) => {
      r.expenses.forEach((e) => result.push({ expense: e, recordId: r.id }));
    });
    return result.sort((a, b) => b.expense.date.localeCompare(a.expense.date));
  }, [monthlyRecords]);

  const addStandaloneExpense = useCallback((vehicleId: string, date: string, categoryId: string, amount: number, remarks: string) => {
    const month = date.slice(0, 7);
    let rec = monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === month);
    if (!rec) {
      rec = {
        id: uid('mr'),
        vehicleId,
        month,
        dailyRecords: [],
        expenses: [],
        createdAt: new Date().toISOString(),
      };
      setMonthlyRecords((prev) => [rec!, ...prev]);
    }
    const exp: Expense = { vehicleId, date, categoryId, amount, remarks, id: uid('exp'), createdAt: new Date().toISOString() };
    setMonthlyRecords((prev) => prev.map((r) => (r.id === rec!.id ? { ...r, expenses: [...r.expenses, exp] } : r)));
    logActivity({ action: `Added expense — Rs. ${amount.toLocaleString()}`, entity: 'expense', entityId: exp.id });
  }, [monthlyRecords, logActivity]);

  const updateStandaloneExpense = useCallback((expenseId: string, patch: Partial<Expense>) => {
    setMonthlyRecords((prev) => prev.map((r) => {
      const old = r.expenses.find((e) => e.id === expenseId);
      if (!old) return r;
      if (patch.amount !== undefined && patch.amount !== old.amount) {
        logActivity({ action: `Edited Expense`, entity: 'expense', entityId: expenseId, oldValue: `Rs. ${old.amount.toLocaleString()}`, newValue: `Rs. ${patch.amount.toLocaleString()}` });
      }
      return { ...r, expenses: r.expenses.map((e) => (e.id === expenseId ? { ...e, ...patch } : e)) };
    }));
  }, [logActivity]);

  const deleteStandaloneExpense = useCallback((expenseId: string) => {
    setMonthlyRecords((prev) => prev.map((r) => {
      const e = r.expenses.find((x) => x.id === expenseId);
      if (e) logActivity({ action: `Deleted expense — Rs. ${e.amount.toLocaleString()}`, entity: 'expense', entityId: expenseId });
      return { ...r, expenses: r.expenses.filter((e) => e.id !== expenseId) };
    }));
  }, [logActivity]);

  // Bulk save monthly record (spreadsheet mode)
  const saveMonthlyRecordBulk = useCallback((vehicleId: string, month: string, dailyEntries: Omit<DailyRecord, 'id'>[]) => {
    const existing = monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === month);
    const newDaily: DailyRecord[] = dailyEntries
      .filter((d) => d.amount > 0 || d.details.trim() !== '' || (d.routes.length > 0 && d.routes.some((r) => r.amount > 0 || r.location.trim() !== '')))
      .map((d) => ({ ...d, id: uid('dr') }));
    if (existing) {
      setMonthlyRecords((prev) => prev.map((r) => (r.id === existing.id ? { ...r, dailyRecords: newDaily } : r)));
      logActivity({ action: `Updated monthly record for ${month} (${newDaily.length} entries)`, entity: 'monthly-record', entityId: existing.id });
      return existing;
    }
    const rec: MonthlyRecord = {
      id: uid('mr'),
      vehicleId,
      month,
      dailyRecords: newDaily,
      expenses: [],
      createdAt: new Date().toISOString(),
    };
    setMonthlyRecords((prev) => [rec, ...prev]);
    logActivity({ action: `Created monthly record for ${month} (${newDaily.length} entries)`, entity: 'monthly-record', entityId: rec.id });
    return rec;
  }, [monthlyRecords, logActivity]);

  // Business Expenses (general expense system)
  const addBusinessExpense = useCallback((e: Omit<BusinessExpense, 'id' | 'createdAt'>) => {
    const exp: BusinessExpense = { ...e, id: uid('bexp'), createdAt: new Date().toISOString() };
    setBusinessExpenses((prev) => [exp, ...prev]);
    const cat = categories.find((c) => c.id === e.categoryId);
    logActivity({ action: `Added ${cat?.name || 'expense'} — Rs. ${e.amount.toLocaleString()} for ${e.expenseFor}: ${e.relatedToName}`, entity: 'expense', entityId: exp.id });
  }, [categories, logActivity]);

  const updateBusinessExpense = useCallback((id: string, patch: Partial<BusinessExpense>) => {
    setBusinessExpenses((prev) => {
      const old = prev.find((e) => e.id === id);
      if (old && patch.amount !== undefined && patch.amount !== old.amount) {
        logActivity({ action: `Edited Expense`, entity: 'expense', entityId: id, oldValue: `Rs. ${old.amount.toLocaleString()}`, newValue: `Rs. ${patch.amount.toLocaleString()}` });
      }
      return prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
    });
  }, [logActivity]);

  const deleteBusinessExpense = useCallback((id: string) => {
    setBusinessExpenses((prev) => {
      const e = prev.find((x) => x.id === id);
      if (e) logActivity({ action: `Deleted expense — Rs. ${e.amount.toLocaleString()}`, entity: 'expense', entityId: id });
      return prev.filter((e) => e.id !== id);
    });
  }, [logActivity]);

  const getBusinessExpensesForEntity = useCallback((expenseFor: ExpenseFor, relatedToId: string, month?: string) => {
    return businessExpenses.filter((e) => {
      if (e.expenseFor !== expenseFor || e.relatedToId !== relatedToId) return false;
      if (month && !e.date.startsWith(month)) return false;
      return true;
    });
  }, [businessExpenses]);

  const getBusinessExpensesForVehicle = useCallback((vehicleId: string, month?: string) => {
    return getBusinessExpensesForEntity('Vehicle', vehicleId, month);
  }, [getBusinessExpensesForEntity]);

  const getBusinessExpensesForSubcontractor = useCallback((subId: string, month?: string) => {
    return getBusinessExpensesForEntity('Subcontractor', subId, month);
  }, [getBusinessExpensesForEntity]);

  // Categories
  const addCategory = useCallback((name: string) => {
    const cat: ExpenseCategory = { id: uid('cat'), name };
    setCategories((prev) => [...prev, cat]);
    logActivity({ action: `Created expense category "${name}"`, entity: 'category', entityId: cat.id });
    return cat;
  }, [logActivity]);

  const updateCategory = useCallback((id: string, name: string) => {
    setCategories((prev) => {
      const old = prev.find((c) => c.id === id);
      if (old) logActivity({ action: `Renamed category "${old.name}" → "${name}"`, entity: 'category', entityId: id });
      return prev.map((c) => (c.id === id ? { ...c, name } : c));
    });
  }, [logActivity]);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const c = prev.find((x) => x.id === id);
      if (c) logActivity({ action: `Deleted category "${c.name}"`, entity: 'category', entityId: id });
      return prev.filter((c) => c.id !== id);
    });
  }, [logActivity]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value: StoreContextValue = {
    vehicles, drivers, subcontractors, monthlyRecords, categories, salaries, activity, settings,
    addVehicle, updateVehicle, deleteVehicle,
    addDriver, updateDriver, deleteDriver,
    addSubcontractor, updateSubcontractor, deleteSubcontractor,
    addSalary, updateSalary, deleteSalary,
    getMonthlyRecord, createMonthlyRecord, addDailyRecord, updateDailyRecord, deleteDailyRecord,
    addExpense, updateExpense, deleteExpense,
    getAllExpenses, addStandaloneExpense, updateStandaloneExpense, deleteStandaloneExpense,
    businessExpenses, addBusinessExpense, updateBusinessExpense, deleteBusinessExpense,
    getBusinessExpensesForEntity, getBusinessExpensesForVehicle, getBusinessExpensesForSubcontractor,
    saveMonthlyRecordBulk,
    addCategory, updateCategory, deleteCategory,
    updateSettings, logActivity,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export type { RouteEntry };
