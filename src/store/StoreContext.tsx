import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type {
  Vehicle, Driver, Subcontractor, MonthlyRecord, ExpenseCategory,
  ActivityLog, Settings, SalaryRecord, Expense, DailyRecord, RouteEntry,
  BusinessExpense, ExpenseFor, PaymentMethod,
  User, ModuleKey, PermissionAction, PermissionSet, EntityStatus,
} from '@/types';
import { emptyPermissions, superAdminPermissions, ALL_MODULES } from '@/types';
import { supabase } from '@/lib/supabase';

const AUTH_STORAGE_KEY = 'rfu-auth-user';

// ==================================================
// DB <-> TS Type Mappers
// ==================================================

function toVehicle(row: any): Vehicle {
  return {
    id: String(row.id),
    number: row.vehicle_number,
    type: row.vehicle_type as Vehicle['type'],
    ownerType: row.owner_type as Vehicle['ownerType'],
    ownerId: row.subcontractor_id ? String(row.subcontractor_id) : undefined,
    driverId: row.driver_id ? String(row.driver_id) : undefined,
    model: row.model || '',
    status: row.status as EntityStatus,
    notes: row.notes || '',
    createdAt: typeof row.created_at === 'string' ? row.created_at : row.created_at?.toISOString?.() || new Date().toISOString(),
  };
}

function toDriver(row: any): Driver {
  return {
    id: String(row.id),
    fullName: row.full_name,
    fatherName: row.father_name || '',
    cnic: row.cnic || '',
    phone: row.phone || '',
    address: row.address || '',
    license: row.driving_license || '',
    joiningDate: typeof row.joining_date === 'string' ? row.joining_date : String(row.joining_date || ''),
    vehicleId: row.assigned_vehicle_id ? String(row.assigned_vehicle_id) : undefined,
    status: row.status as EntityStatus,
    notes: row.notes || '',
    createdAt: typeof row.created_at === 'string' ? row.created_at : row.created_at?.toISOString?.() || new Date().toISOString(),
  };
}

function toSubcontractor(row: any): Subcontractor {
  return {
    id: String(row.id),
    name: row.name,
    cnic: row.cnic || '',
    phone: row.phone || '',
    address: row.address || '',
    joiningDate: typeof row.joining_date === 'string' ? row.joining_date : String(row.joining_date || ''),
    status: row.status as EntityStatus,
    notes: row.notes || '',
    createdAt: typeof row.created_at === 'string' ? row.created_at : row.created_at?.toISOString?.() || new Date().toISOString(),
  };
}

function toSalary(row: any): SalaryRecord {
  return {
    id: String(row.id),
    driverId: String(row.driver_id),
    month: row.month,
    monthlySalary: Number(row.monthly_salary) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    salaryDate: typeof row.salary_date === 'string' ? row.salary_date : String(row.salary_date || ''),
    remarks: row.remarks || '',
    createdAt: typeof row.created_at === 'string' ? row.created_at : row.created_at?.toISOString?.() || new Date().toISOString(),
  };
}

function toCategory(row: any): ExpenseCategory {
  return {
    id: String(row.id),
    name: row.name,
  };
}

function toSettings(row: any): Settings {
  return {
    companyName: row.company_name || 'Ride for U',
    currency: row.currency || 'Rs.',
    commissionRate: Number(row.commission_rate) || 2.5,
    adminName: row.admin_name || 'Super Admin',
    appearance: (row.appearance || 'light') as 'light' | 'dark',
  };
}

function toUser(row: any, permissions: PermissionSet): User {
  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    password: '',
    role: row.role,
    status: row.status as EntityStatus,
    permissions,
    createdAt: typeof row.created_at === 'string' ? row.created_at : row.created_at?.toISOString?.() || new Date().toISOString(),
  };
}

function toBusinessExpense(row: any, vMap: Map<string, Vehicle>, dMap: Map<string, Driver>, sMap: Map<string, Subcontractor>): BusinessExpense {
  let relatedToId: string = '';
  let relatedToName: string = row.related_name || '';
  if (row.expense_for === 'Vehicle' && row.vehicle_id) {
    relatedToId = String(row.vehicle_id);
    const v = vMap.get(relatedToId);
    if (v) relatedToName = v.number;
  } else if (row.expense_for === 'Driver' && row.driver_id) {
    relatedToId = String(row.driver_id);
    const d = dMap.get(relatedToId);
    if (d) relatedToName = d.fullName;
  } else if (row.expense_for === 'Subcontractor' && row.subcontractor_id) {
    relatedToId = String(row.subcontractor_id);
    const s = sMap.get(relatedToId);
    if (s) relatedToName = s.name;
  } else if (row.expense_for === 'Office') {
    relatedToId = 'office';
    relatedToName = 'Office';
  } else if (row.expense_for === 'Other') {
    relatedToId = row.related_name || 'other';
    relatedToName = row.related_name || 'Other';
  }
  return {
    id: String(row.id),
    date: typeof row.expense_date === 'string' ? row.expense_date : String(row.expense_date || ''),
    categoryId: String(row.category_id),
    expenseFor: row.expense_for as ExpenseFor,
    relatedToId,
    relatedToName,
    amount: Number(row.amount) || 0,
    paymentMethod: (row.payment_method || 'Cash') as PaymentMethod,
    remarks: row.remarks || '',
    createdAt: typeof row.created_at === 'string' ? row.created_at : row.created_at?.toISOString?.() || new Date().toISOString(),
  };
}

function toActivityLog(row: any): ActivityLog {
  const createdAt = row.created_at ? new Date(row.created_at) : new Date();
  const date = createdAt.toISOString().slice(0, 10);
  let h = createdAt.getHours();
  const m = createdAt.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const time = `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  const oldVal = row.old_data ? JSON.stringify(row.old_data) : undefined;
  const newVal = row.new_data ? JSON.stringify(row.new_data) : undefined;
  return {
    id: String(row.id),
    actor: row.actor_name || 'System',
    date,
    time,
    action: row.action_description || `${row.action} ${row.entity_type}`,
    entity: row.entity_type || '',
    entityId: row.entity_id || undefined,
    oldValue: oldVal,
    newValue: newVal,
  };
}

function toDailyRecord(row: any, routesMap: Map<string, RouteEntry[]>): DailyRecord {
  return {
    id: String(row.id),
    date: typeof row.record_date === 'string' ? row.record_date : String(row.record_date || ''),
    amount: Number(row.amount) || 0,
    details: row.details || '',
    entryType: row.entry_type as 'quick' | 'detailed',
    routes: routesMap.get(String(row.id)) || [],
  };
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
  businessExpenses: BusinessExpense[];

  users: User[];
  currentUser: User | null;

  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  getCurrentUser: () => User | null;
  hasPermission: (module: ModuleKey, action: PermissionAction) => boolean;
  canAccessModule: (module: ModuleKey) => boolean;

  addUser: (u: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  updateUser: (id: string, patch: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUserPermissions: (id: string, permissions: PermissionSet) => Promise<void>;
  setUserStatus: (id: string, status: EntityStatus) => Promise<void>;

  addVehicle: (v: Omit<Vehicle, 'id' | 'createdAt'>) => Promise<Vehicle>;
  updateVehicle: (id: string, v: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  addDriver: (d: Omit<Driver, 'id' | 'createdAt'>) => Promise<Driver>;
  updateDriver: (id: string, d: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;

  addSubcontractor: (s: Omit<Subcontractor, 'id' | 'createdAt'>) => Promise<Subcontractor>;
  updateSubcontractor: (id: string, s: Partial<Subcontractor>) => Promise<void>;
  deleteSubcontractor: (id: string) => Promise<void>;

  addSalary: (s: Omit<SalaryRecord, 'id' | 'createdAt'>) => Promise<SalaryRecord>;
  updateSalary: (id: string, s: Partial<SalaryRecord>) => Promise<void>;
  deleteSalary: (id: string) => Promise<void>;

  getMonthlyRecord: (vehicleId: string, month: string) => MonthlyRecord | undefined;
  createMonthlyRecord: (vehicleId: string, month: string) => Promise<MonthlyRecord>;
  addDailyRecord: (recordId: string, dr: Omit<DailyRecord, 'id'>) => Promise<void>;
  updateDailyRecord: (recordId: string, drId: string, dr: Partial<DailyRecord>) => Promise<void>;
  deleteDailyRecord: (recordId: string, drId: string) => Promise<void>;

  addExpense: (recordId: string, e: Omit<Expense, 'id' | 'createdAt' | 'vehicleId'> & { vehicleId?: string }) => Promise<void>;
  updateExpense: (recordId: string, eId: string, e: Partial<Expense>) => Promise<void>;
  deleteExpense: (recordId: string, eId: string) => Promise<void>;

  getAllExpenses: () => { expense: Expense; recordId: string }[];
  addStandaloneExpense: (vehicleId: string, date: string, categoryId: string, amount: number, remarks: string) => Promise<void>;
  updateStandaloneExpense: (expenseId: string, patch: Partial<Expense>) => Promise<void>;
  deleteStandaloneExpense: (expenseId: string) => Promise<void>;

  addBusinessExpense: (e: Omit<BusinessExpense, 'id' | 'createdAt'>) => Promise<void>;
  updateBusinessExpense: (id: string, patch: Partial<BusinessExpense>) => Promise<void>;
  deleteBusinessExpense: (id: string) => Promise<void>;
  getBusinessExpensesForEntity: (expenseFor: ExpenseFor, relatedToId: string, month?: string) => BusinessExpense[];
  getBusinessExpensesForVehicle: (vehicleId: string, month?: string) => BusinessExpense[];
  getBusinessExpensesForSubcontractor: (subId: string, month?: string) => BusinessExpense[];

  saveMonthlyRecordBulk: (vehicleId: string, month: string, dailyRecords: Omit<DailyRecord, 'id'>[]) => Promise<MonthlyRecord>;

  addCategory: (name: string) => Promise<ExpenseCategory>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  updateSettings: (s: Partial<Settings>) => Promise<void>;

  logActivity: (entry: Omit<ActivityLog, 'id' | 'actor' | 'date' | 'time'>) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function buildMonthlyRecords(
  mrRows: any[],
  dailyRows: any[],
  routeRows: any[],
  expenses: BusinessExpense[]
): MonthlyRecord[] {
  const routesByDaily = new Map<string, RouteEntry[]>();
  for (const r of routeRows) {
    const drId = String(r.daily_record_id);
    const arr = routesByDaily.get(drId) || [];
    arr.push({ id: String(r.id), location: r.location, amount: Number(r.amount) || 0 });
    routesByDaily.set(drId, arr);
  }
  const dailiesByMr = new Map<string, DailyRecord[]>();
  for (const d of dailyRows) {
    const mrId = String(d.monthly_record_id);
    const arr = dailiesByMr.get(mrId) || [];
    arr.push(toDailyRecord(d, routesByDaily));
    dailiesByMr.set(mrId, arr);
  }
  return mrRows.map((mr) => {
    const monthStr = `${mr.year}-${String(mr.month).padStart(2, '0')}`;
    const vid = String(mr.vehicle_id);
    const recExpenses: Expense[] = expenses
      .filter((e) => e.expenseFor === 'Vehicle' && e.relatedToId === vid && e.date.startsWith(monthStr))
      .map((e) => ({
        id: e.id,
        date: e.date,
        vehicleId: vid,
        categoryId: e.categoryId,
        amount: e.amount,
        remarks: e.remarks,
        createdAt: e.createdAt,
      }));
    return {
      id: String(mr.id),
      vehicleId: vid,
      month: monthStr,
      dailyRecords: (dailiesByMr.get(String(mr.id)) || []).sort((a, b) => a.date.localeCompare(b.date)),
      expenses: recExpenses,
      createdAt: typeof mr.created_at === 'string' ? mr.created_at : mr.created_at?.toISOString?.() || new Date().toISOString(),
    };
  });
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<Settings>({
    companyName: 'Ride for U', currency: 'Rs.', commissionRate: 2.5, adminName: 'Super Admin', appearance: 'light',
  });
  const [businessExpenses, setBusinessExpenses] = useState<BusinessExpense[]>([]);

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      const { data: v } = await supabase.from('vehicles').select('*');
      if (v) setVehicles(v.map(toVehicle));

      const { data: d } = await supabase.from('drivers').select('*');
      if (d) setDrivers(d.map(toDriver));

      const { data: s } = await supabase.from('subcontractors').select('*');
      if (s) setSubcontractors(s.map(toSubcontractor));

      const { data: sal } = await supabase.from('driver_salaries').select('*');
      if (sal) setSalaries(sal.map(toSalary));

      const { data: cats } = await supabase.from('expense_categories').select('*');
      if (cats) setCategories(cats.map(toCategory));

      const { data: mr } = await supabase.from('monthly_records').select('*');
      const { data: drs } = await supabase.from('daily_records').select('*');
      const { data: rts } = await supabase.from('daily_routes').select('*');

      const { data: setR } = await supabase.from('settings').select('*').limit(1);
      if (setR && setR[0]) setSettings(toSettings(setR[0]));

      const { data: bex } = await supabase.from('expenses').select('*');
      const vMap = new Map<string, Vehicle>();
      if (v) v.forEach((x: any) => vMap.set(String(x.id), toVehicle(x)));
      const dMap = new Map<string, Driver>();
      if (d) d.forEach((x: any) => dMap.set(String(x.id), toDriver(x)));
      const sMap = new Map<string, Subcontractor>();
      if (s) s.forEach((x: any) => sMap.set(String(x.id), toSubcontractor(x)));
      const businessArr = (bex || []).map((row: any) => toBusinessExpense(row, vMap, dMap, sMap));
      setBusinessExpenses(businessArr);

      const mrList = buildMonthlyRecords(mr || [], drs || [], rts || [], businessArr);
      setMonthlyRecords(mrList);

      const { data: act } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500);
      if (act) setActivity(act.map(toActivityLog));
    } catch (e) {
      console.error('loadAllData error:', e);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (!profiles) return;
      const userList: User[] = [];
      for (const p of profiles) {
        const { data: permData, error } = await supabase.rpc('get_user_permissions', { p_profile_id: p.id });
        const perms: PermissionSet = error || !permData ? emptyPermissions() : (permData as PermissionSet);
        userList.push(toUser(p, perms));
      }
      setUsers(userList);
    } catch (e) {
      console.error('loadUsers error:', e);
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setCurrentUser(null);
      return;
    }
    const { data: profileRows } = await supabase.from('profiles').select('*').eq('id', authUser.id).limit(1);
    if (!profileRows || !profileRows[0]) {
      setCurrentUser(null);
      return;
    }
    const { data: permData } = await supabase.rpc('get_user_permissions', { p_profile_id: authUser.id });
    const perms: PermissionSet = !permData ? emptyPermissions() : (permData as PermissionSet);
    const u = toUser(profileRows[0], perms);
    setCurrentUser(u);
    try { sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u)); } catch {}
  }, []);

  // Initial auth check
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await refreshCurrentUser();
        await loadUsers();
        await loadAllData();
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setVehicles([]); setDrivers([]); setSubcontractors([]);
        setMonthlyRecords([]); setCategories([]); setSalaries([]);
        setActivity([]); setBusinessExpenses([]); setUsers([]);
      } else if (event === 'SIGNED_IN' && session) {
        (async () => {
          await refreshCurrentUser();
          await loadUsers();
          await loadAllData();
        })();
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [refreshCurrentUser, loadUsers, loadAllData]);

  const hasPermission = useCallback((module: ModuleKey, action: PermissionAction): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return !!currentUser.permissions[module]?.[action];
  }, [currentUser]);

  const canAccessModule = useCallback((module: ModuleKey): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    const m = currentUser.permissions[module];
    if (!m) return false;
    return m.view || m.add || m.edit || m.delete;
  }, [currentUser]);

  const logActivity = useCallback((entry: Omit<ActivityLog, 'id' | 'actor' | 'date' | 'time'>) => {
    const d = new Date();
    const date = d.toISOString().slice(0, 10);
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const time = `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
    const actorName = currentUser?.fullName || settings.adminName;
    setActivity((prev) => [
      { id: `act-${Date.now()}`, actor: actorName, date, time, ...entry },
      ...prev,
    ]);
  }, [currentUser, settings.adminName]);

  // ==================================================
  // AUTH
  // ==================================================

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Supabase signInWithPassword error:', error);
      throw new Error(error.message || 'Invalid email or password');
    }
    if (!data.user) return null;

    const { data: profileRows, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .limit(1);

    if (profileErr) {
      console.error('Profile fetch error:', profileErr);
      throw new Error(`Failed to load user profile: ${profileErr.message}`);
    }

    if (!profileRows || !profileRows[0]) {
      await supabase.auth.signOut();
      throw new Error('User profile record not found. Please contact an administrator.');
    }
    if (profileRows[0].status !== 'Active') {
      await supabase.auth.signOut();
      throw new Error('This account is inactive. Please contact an administrator.');
    }
    const { data: permData } = await supabase.rpc('get_user_permissions', { p_profile_id: data.user.id });
    const perms: PermissionSet = !permData ? emptyPermissions() : (permData as PermissionSet);
    const u = toUser(profileRows[0], perms);
    setCurrentUser(u);
    try { sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u)); } catch {}
    await loadUsers();
    await loadAllData();
    return u;
  }, [loadUsers, loadAllData]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    try { sessionStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
    try { sessionStorage.removeItem('rfu-auth'); } catch {}
  }, []);

  const getCurrentUser = useCallback((): User | null => currentUser, [currentUser]);

  // ==================================================
  // USERS
  // ==================================================

  const addUser = useCallback(async (u: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const res = await supabase.auth.signUp({
      email: u.email,
      password: u.password || 'rfuTemp123!',
      options: { data: { full_name: u.fullName, role: u.role } },
    });
    if (res.error) {
      console.warn('signUp failed for new user:', res.error.message);
    }

    await loadUsers();
    const found = users.find((x) => x.email === u.email) || users[0];
    if (found) {
      logActivity({ action: `Created user ${u.fullName}`, entity: 'user', entityId: found.id });
      return found;
    }
    const newUser: User = {
      id: `usr-${Date.now()}`,
      fullName: u.fullName,
      email: u.email,
      password: '',
      role: u.role,
      status: u.status,
      permissions: u.role === 'super_admin' ? superAdminPermissions() : emptyPermissions(),
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [newUser, ...prev]);
    logActivity({ action: `Created user ${newUser.fullName}`, entity: 'user', entityId: newUser.id });
    return newUser;
  }, [loadUsers, users, logActivity]);

  const updateUser = useCallback(async (id: string, patch: Partial<User>) => {
    const profilePatch: any = {};
    if (patch.fullName !== undefined) profilePatch.full_name = patch.fullName;
    if (patch.email !== undefined) profilePatch.email = patch.email;
    if (patch.status !== undefined) profilePatch.status = patch.status;
    if (patch.role !== undefined) profilePatch.role = patch.role;
    if (Object.keys(profilePatch).length) {
      await supabase.from('profiles').update(profilePatch).eq('id', id);
    }
    setUsers((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (currentUser?.id === id) setCurrentUser((cu) => (cu ? { ...cu, ...patch } : cu));
    const old = users.find((x) => x.id === id);
    if (old) {
      const changes: string[] = [];
      (Object.keys(patch) as (keyof User)[]).forEach((k) => {
        if (k === 'permissions' || k === 'id' || k === 'createdAt' || k === 'password') return;
        if ((old as any)[k] !== (patch as any)[k]) {
          changes.push(`${String(k)}: ${String((old as any)[k])} → ${String((patch as any)[k])}`);
        }
      });
      if (changes.length) logActivity({ action: `Edited user ${old.fullName} — ${changes.join(', ')}`, entity: 'user', entityId: id });
    }
  }, [currentUser, users, logActivity]);

  const updateUserPermissions = useCallback(async (id: string, permissions: PermissionSet) => {
    // Clear existing permissions
    await supabase.from('user_permissions').delete().eq('profile_id', id);
    const { data: allPerms } = await supabase.from('permissions').select('id, module_key, action');
    if (allPerms) {
      const toInsert: any[] = [];
      for (const mod of ALL_MODULES) {
        const p = permissions[mod];
        if (!p) continue;
        (['view', 'add', 'edit', 'delete'] as const).forEach((act) => {
          if (p[act]) {
            const match = allPerms.find((x: any) => x.module_key === mod && x.action === act);
            if (match) toInsert.push({ profile_id: id, permission_id: match.id });
          }
        });
        // Special: settings manage_categories
        if (mod === 'settings' && (p as any).manage_categories) {
          const match = allPerms.find((x: any) => x.module_key === mod && x.action === 'manage_categories');
          if (match) toInsert.push({ profile_id: id, permission_id: match.id });
        }
        // Special: users manage_permissions
        if (mod === 'users' && (p as any).manage_permissions) {
          const match = allPerms.find((x: any) => x.module_key === mod && x.action === 'manage_permissions');
          if (match) toInsert.push({ profile_id: id, permission_id: match.id });
        }
        // Special: reports generate
        if (mod === 'reports' && (p as any).generate) {
          const match = allPerms.find((x: any) => x.module_key === mod && x.action === 'generate');
          if (match) toInsert.push({ profile_id: id, permission_id: match.id });
        }
      }
      if (toInsert.length) await supabase.from('user_permissions').insert(toInsert);
    }
    setUsers((prev) => prev.map((x) => (x.id === id ? { ...x, permissions } : x)));
    if (currentUser?.id === id) setCurrentUser((cu) => (cu ? { ...cu, permissions } : cu));
    logActivity({ action: `Updated permissions for user`, entity: 'user', entityId: id });
    await loadUsers();
  }, [currentUser, logActivity, loadUsers]);

  const setUserStatus = useCallback(async (id: string, status: EntityStatus) => {
    await supabase.from('profiles').update({ status }).eq('id', id);
    setUsers((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    logActivity({ action: `${status === 'Active' ? 'Enabled' : 'Disabled'} user`, entity: 'user', entityId: id });
  }, [logActivity]);

  const deleteUser = useCallback(async (id: string) => {
    const u = users.find((x) => x.id === id);
    if (u) {
      // Delete user_permissions first
      await supabase.from('user_permissions').delete().eq('profile_id', id);
      // Note: deleting from auth.users requires service role; we just mark profile inactive for safety
      await supabase.from('profiles').update({ status: 'Inactive' }).eq('id', id);
      logActivity({ action: `Deleted user ${u.fullName}`, entity: 'user', entityId: id });
    }
    setUsers((prev) => prev.filter((x) => x.id !== id));
  }, [users, logActivity]);

  // ==================================================
  // VEHICLES
  // ==================================================

  const addVehicle = useCallback(async (v: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> => {
    const row: any = {
      vehicle_number: v.number,
      vehicle_type: v.type,
      owner_type: v.ownerType,
      subcontractor_id: v.ownerId || null,
      driver_id: v.driverId || null,
      model: v.model,
      status: v.status,
      notes: v.notes,
    };
    const { data } = await supabase.from('vehicles').insert(row).select().single();
    const vehicle = data ? toVehicle(data) : { ...v, id: `veh-${Date.now()}`, createdAt: new Date().toISOString() };
    setVehicles((prev) => [vehicle, ...prev]);
    logActivity({ action: `Created vehicle ${vehicle.number}`, entity: 'vehicle', entityId: vehicle.id });
    return vehicle;
  }, [logActivity]);

  const updateVehicle = useCallback(async (id: string, patch: Partial<Vehicle>) => {
    const row: any = {};
    if (patch.number !== undefined) row.vehicle_number = patch.number;
    if (patch.type !== undefined) row.vehicle_type = patch.type;
    if (patch.ownerType !== undefined) row.owner_type = patch.ownerType;
    if (patch.ownerId !== undefined) row.subcontractor_id = patch.ownerId || null;
    if (patch.driverId !== undefined) row.driver_id = patch.driverId || null;
    if (patch.model !== undefined) row.model = patch.model;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.notes !== undefined) row.notes = patch.notes;
    if (Object.keys(row).length) await supabase.from('vehicles').update(row).eq('id', id);
    setVehicles((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const old = vehicles.find((x) => x.id === id);
    if (old) {
      const changes: string[] = [];
      (Object.keys(patch) as (keyof Vehicle)[]).forEach((k) => {
        if (k === 'id' || k === 'createdAt') return;
        if ((old as any)[k] !== (patch as any)[k]) {
          changes.push(`${String(k)}: ${String((old as any)[k])} → ${String((patch as any)[k])}`);
        }
      });
      if (changes.length) logActivity({ action: `Edited vehicle ${old.number} — ${changes.join(', ')}`, entity: 'vehicle', entityId: id });
    }
  }, [vehicles, logActivity]);

  const deleteVehicle = useCallback(async (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    await supabase.from('vehicles').delete().eq('id', id);
    if (v) logActivity({ action: `Deleted vehicle ${v.number}`, entity: 'vehicle', entityId: id });
    setVehicles((prev) => prev.filter((x) => x.id !== id));
    setMonthlyRecords((prev) => prev.filter((r) => r.vehicleId !== id));
    setDrivers((prev) => prev.map((d) => (d.vehicleId === id ? { ...d, vehicleId: undefined } : d)));
  }, [vehicles, logActivity]);

  // ==================================================
  // DRIVERS
  // ==================================================

  const addDriver = useCallback(async (d: Omit<Driver, 'id' | 'createdAt'>): Promise<Driver> => {
    const row: any = {
      full_name: d.fullName,
      father_name: d.fatherName,
      cnic: d.cnic,
      phone: d.phone,
      address: d.address,
      driving_license: d.license,
      joining_date: d.joiningDate,
      assigned_vehicle_id: d.vehicleId || null,
      status: d.status,
      notes: d.notes,
    };
    const { data } = await supabase.from('drivers').insert(row).select().single();
    const driver = data ? toDriver(data) : { ...d, id: `drv-${Date.now()}`, createdAt: new Date().toISOString() };
    setDrivers((prev) => [driver, ...prev]);
    if (driver.vehicleId) {
      setVehicles((prev) => prev.map((v) => (v.id === driver.vehicleId ? { ...v, driverId: driver.id } : v)));
    }
    logActivity({ action: `Created driver ${driver.fullName}`, entity: 'driver', entityId: driver.id });
    return driver;
  }, [logActivity]);

  const updateDriver = useCallback(async (id: string, patch: Partial<Driver>) => {
    const row: any = {};
    if (patch.fullName !== undefined) row.full_name = patch.fullName;
    if (patch.fatherName !== undefined) row.father_name = patch.fatherName;
    if (patch.cnic !== undefined) row.cnic = patch.cnic;
    if (patch.phone !== undefined) row.phone = patch.phone;
    if (patch.address !== undefined) row.address = patch.address;
    if (patch.license !== undefined) row.driving_license = patch.license;
    if (patch.joiningDate !== undefined) row.joining_date = patch.joiningDate;
    if (patch.vehicleId !== undefined) row.assigned_vehicle_id = patch.vehicleId || null;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.notes !== undefined) row.notes = patch.notes;
    if (Object.keys(row).length) await supabase.from('drivers').update(row).eq('id', id);
    setDrivers((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (patch.vehicleId !== undefined) {
      setVehicles((prev) => prev.map((v) => (v.driverId === id ? { ...v, driverId: undefined } : v)));
      if (patch.vehicleId) {
        setVehicles((prev) => prev.map((v) => (v.id === patch.vehicleId ? { ...v, driverId: id } : v)));
      }
    }
    const old = drivers.find((x) => x.id === id);
    if (old) {
      const changes: string[] = [];
      (Object.keys(patch) as (keyof Driver)[]).forEach((k) => {
        if (k === 'id' || k === 'createdAt') return;
        if ((old as any)[k] !== (patch as any)[k]) {
          changes.push(`${String(k)}: ${String((old as any)[k])} → ${String((patch as any)[k])}`);
        }
      });
      if (changes.length) logActivity({ action: `Edited driver ${old.fullName} — ${changes.join(', ')}`, entity: 'driver', entityId: id });
    }
  }, [drivers, logActivity]);

  const deleteDriver = useCallback(async (id: string) => {
    const d = drivers.find((x) => x.id === id);
    await supabase.from('drivers').delete().eq('id', id);
    if (d) logActivity({ action: `Deleted driver ${d.fullName}`, entity: 'driver', entityId: id });
    setDrivers((prev) => prev.filter((x) => x.id !== id));
    setVehicles((prev) => prev.map((v) => (v.driverId === id ? { ...v, driverId: undefined } : v)));
    setSalaries((prev) => prev.filter((s) => s.driverId !== id));
  }, [drivers, logActivity]);

  // ==================================================
  // SUBCONTRACTORS
  // ==================================================

  const addSubcontractor = useCallback(async (s: Omit<Subcontractor, 'id' | 'createdAt'>): Promise<Subcontractor> => {
    const row: any = {
      name: s.name,
      cnic: s.cnic,
      phone: s.phone,
      address: s.address,
      joining_date: s.joiningDate,
      status: s.status,
      notes: s.notes,
    };
    const { data } = await supabase.from('subcontractors').insert(row).select().single();
    const sub = data ? toSubcontractor(data) : { ...s, id: `sub-${Date.now()}`, createdAt: new Date().toISOString() };
    setSubcontractors((prev) => [sub, ...prev]);
    logActivity({ action: `Created subcontractor ${sub.name}`, entity: 'subcontractor', entityId: sub.id });
    return sub;
  }, [logActivity]);

  const updateSubcontractor = useCallback(async (id: string, patch: Partial<Subcontractor>) => {
    const row: any = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.cnic !== undefined) row.cnic = patch.cnic;
    if (patch.phone !== undefined) row.phone = patch.phone;
    if (patch.address !== undefined) row.address = patch.address;
    if (patch.joiningDate !== undefined) row.joining_date = patch.joiningDate;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.notes !== undefined) row.notes = patch.notes;
    if (Object.keys(row).length) await supabase.from('subcontractors').update(row).eq('id', id);
    setSubcontractors((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const old = subcontractors.find((x) => x.id === id);
    if (old) {
      const changes: string[] = [];
      (Object.keys(patch) as (keyof Subcontractor)[]).forEach((k) => {
        if (k === 'id' || k === 'createdAt') return;
        if ((old as any)[k] !== (patch as any)[k]) {
          changes.push(`${String(k)}: ${String((old as any)[k])} → ${String((patch as any)[k])}`);
        }
      });
      if (changes.length) logActivity({ action: `Edited subcontractor ${old.name} — ${changes.join(', ')}`, entity: 'subcontractor', entityId: id });
    }
  }, [subcontractors, logActivity]);

  const deleteSubcontractor = useCallback(async (id: string) => {
    const s = subcontractors.find((x) => x.id === id);
    await supabase.from('subcontractors').delete().eq('id', id);
    if (s) logActivity({ action: `Deleted subcontractor ${s.name}`, entity: 'subcontractor', entityId: id });
    setSubcontractors((prev) => prev.filter((x) => x.id !== id));
    setVehicles((prev) => prev.map((v) => (v.ownerId === id ? { ...v, ownerType: 'Ride for U' as const, ownerId: undefined } : v)));
  }, [subcontractors, logActivity]);

  // ==================================================
  // SALARIES
  // ==================================================

  const addSalary = useCallback(async (s: Omit<SalaryRecord, 'id' | 'createdAt'>): Promise<SalaryRecord> => {
    const row: any = {
      driver_id: s.driverId,
      month: s.month,
      monthly_salary: s.monthlySalary,
      paid_amount: s.paidAmount,
      salary_date: s.salaryDate,
      remarks: s.remarks,
    };
    const { data } = await supabase.from('driver_salaries').insert(row).select().single();
    const sal = data ? toSalary(data) : { ...s, id: `sal-${Date.now()}`, createdAt: new Date().toISOString() };
    setSalaries((prev) => [sal, ...prev]);
    logActivity({ action: `Added salary record for ${s.month}`, entity: 'salary', entityId: sal.id });
    return sal;
  }, [logActivity]);

  const updateSalary = useCallback(async (id: string, patch: Partial<SalaryRecord>) => {
    const row: any = {};
    if (patch.driverId !== undefined) row.driver_id = patch.driverId;
    if (patch.month !== undefined) row.month = patch.month;
    if (patch.monthlySalary !== undefined) row.monthly_salary = patch.monthlySalary;
    if (patch.paidAmount !== undefined) row.paid_amount = patch.paidAmount;
    if (patch.salaryDate !== undefined) row.salary_date = patch.salaryDate;
    if (patch.remarks !== undefined) row.remarks = patch.remarks;
    if (Object.keys(row).length) await supabase.from('driver_salaries').update(row).eq('id', id);
    setSalaries((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const old = salaries.find((x) => x.id === id);
    if (old) {
      const changes: string[] = [];
      (Object.keys(patch) as (keyof SalaryRecord)[]).forEach((k) => {
        if (k === 'id' || k === 'createdAt') return;
        if ((old as any)[k] !== (patch as any)[k]) {
          changes.push(`${String(k)}: ${String((old as any)[k])} → ${String((patch as any)[k])}`);
        }
      });
      if (changes.length) logActivity({ action: `Edited salary record — ${changes.join(', ')}`, entity: 'salary', entityId: id });
    }
  }, [salaries, logActivity]);

  const deleteSalary = useCallback(async (id: string) => {
    const s = salaries.find((x) => x.id === id);
    await supabase.from('driver_salaries').delete().eq('id', id);
    if (s) logActivity({ action: `Deleted salary record for ${s.month}`, entity: 'salary', entityId: id });
    setSalaries((prev) => prev.filter((x) => x.id !== id));
  }, [salaries, logActivity]);

  // ==================================================
  // MONTHLY RECORDS
  // ==================================================

  const getMonthlyRecord = useCallback((vehicleId: string, month: string) => {
    return monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === month);
  }, [monthlyRecords]);

  const createMonthlyRecord = useCallback(async (vehicleId: string, month: string): Promise<MonthlyRecord> => {
    const existing = monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === month);
    if (existing) return existing;
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const mo = Number(monthStr);
    const { data } = await supabase.from('monthly_records').insert({
      vehicle_id: vehicleId, month: mo, year, created_by: currentUser?.id || null,
    }).select().single();
    const rec: MonthlyRecord = {
      id: data?.id ? String(data.id) : `mr-${Date.now()}`,
      vehicleId,
      month,
      dailyRecords: [],
      expenses: [],
      createdAt: data?.created_at ? (typeof data.created_at === 'string' ? data.created_at : data.created_at.toISOString()) : new Date().toISOString(),
    };
    setMonthlyRecords((prev) => [rec, ...prev]);
    logActivity({ action: `Created monthly record for ${month}`, entity: 'monthly-record', entityId: rec.id });
    return rec;
  }, [monthlyRecords, currentUser, logActivity]);

  const addDailyRecord = useCallback(async (recordId: string, dr: Omit<DailyRecord, 'id'>) => {
    const rec = monthlyRecords.find((r) => r.id === recordId);
    const [yearStr, monthStr] = (rec?.month || '2000-01').split('-');
    const mrId = (async () => {
      if (rec) return recordId;
      return recordId;
    })();
    const row: any = {
      monthly_record_id: recordId,
      record_date: dr.date,
      entry_type: dr.entryType,
      amount: dr.amount,
      details: dr.details,
    };
    const { data } = await supabase.from('daily_records').insert(row).select().single();
    const entry: DailyRecord = { ...dr, id: data?.id ? String(data.id) : `dr-${Date.now()}` };
    if (dr.routes && dr.routes.length) {
      const routesToInsert = dr.routes.map((r) => ({ daily_record_id: entry.id, location: r.location, amount: r.amount }));
      await supabase.from('daily_routes').insert(routesToInsert);
    }
    setMonthlyRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      const dailyRecords = [...r.dailyRecords, entry].sort((a, b) => a.date.localeCompare(b.date));
      return { ...r, dailyRecords };
    }));
    logActivity({ action: `Added daily entry for ${dr.date} — Rs. ${dr.amount.toLocaleString()}`, entity: 'daily-record', entityId: recordId });
  }, [monthlyRecords, logActivity]);

  const updateDailyRecord = useCallback(async (recordId: string, drId: string, patch: Partial<DailyRecord>) => {
    const row: any = {};
    if (patch.date !== undefined) row.record_date = patch.date;
    if (patch.entryType !== undefined) row.entry_type = patch.entryType;
    if (patch.amount !== undefined) row.amount = patch.amount;
    if (patch.details !== undefined) row.details = patch.details;
    if (Object.keys(row).length) await supabase.from('daily_records').update(row).eq('id', drId);
    if (patch.routes) {
      await supabase.from('daily_routes').delete().eq('daily_record_id', drId);
      if (patch.routes.length) {
        await supabase.from('daily_routes').insert(patch.routes.map((r) => ({ daily_record_id: drId, location: r.location, amount: r.amount })));
      }
    }
    setMonthlyRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      const old = r.dailyRecords.find((d) => d.id === drId);
      if (old && patch.amount !== undefined && patch.amount !== old.amount) {
        logActivity({ action: `Edited Duty Amount`, entity: 'daily-record', entityId: drId, oldValue: `Rs. ${old.amount.toLocaleString()}`, newValue: `Rs. ${patch.amount.toLocaleString()}` });
      }
      return {
        ...r,
        dailyRecords: r.dailyRecords.map((d) => (d.id === drId ? { ...d, ...patch } : d)),
      };
    }));
  }, [logActivity]);

  const deleteDailyRecord = useCallback(async (recordId: string, drId: string) => {
    await supabase.from('daily_records').delete().eq('id', drId);
    setMonthlyRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      const dr = r.dailyRecords.find((d) => d.id === drId);
      if (dr) logActivity({ action: `Deleted daily entry for ${dr.date} — Rs. ${dr.amount.toLocaleString()}`, entity: 'daily-record', entityId: drId });
      return { ...r, dailyRecords: r.dailyRecords.filter((d) => d.id !== drId) };
    }));
  }, [logActivity]);

  // ==================================================
  // EXPENSES (old vehicle-monthly expenses mapped to business expenses for Vehicle)
  // ==================================================

  const addExpense = useCallback(async (recordId: string, e: Omit<Expense, 'id' | 'createdAt' | 'vehicleId'> & { vehicleId?: string }) => {
    const rec = monthlyRecords.find((r) => r.id === recordId);
    const vehicleId = e.vehicleId || rec?.vehicleId || '';
    const cat = categories.find((c) => c.id === e.categoryId);
    const row: any = {
      expense_date: e.date,
      category_id: e.categoryId,
      expense_for: 'Vehicle',
      vehicle_id: vehicleId || null,
      driver_id: null,
      subcontractor_id: null,
      related_name: '',
      amount: e.amount,
      payment_method: 'Cash',
      remarks: e.remarks,
      created_by: currentUser?.id || null,
    };
    const { data } = await supabase.from('expenses').insert(row).select().single();
    const expId = data?.id ? String(data.id) : `exp-${Date.now()}`;
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    const bexp: BusinessExpense = {
      id: expId,
      date: e.date,
      categoryId: e.categoryId,
      expenseFor: 'Vehicle',
      relatedToId: vehicleId,
      relatedToName: vehicle?.number || vehicleId,
      amount: e.amount,
      paymentMethod: 'Cash',
      remarks: e.remarks,
      createdAt: new Date().toISOString(),
    };
    setBusinessExpenses((prev) => [bexp, ...prev]);
    const month = rec?.month || e.date.slice(0, 7);
    setMonthlyRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      const exp: Expense = { vehicleId, id: expId, date: e.date, categoryId: e.categoryId, amount: e.amount, remarks: e.remarks, createdAt: new Date().toISOString() };
      return { ...r, expenses: [...r.expenses, exp] };
    }));
    logActivity({ action: `Added ${cat?.name || 'expense'} — Rs. ${e.amount.toLocaleString()}`, entity: 'expense', entityId: expId });
  }, [monthlyRecords, categories, vehicles, currentUser, logActivity]);

  const updateExpense = useCallback(async (recordId: string, eId: string, patch: Partial<Expense>) => {
    const row: any = {};
    if (patch.date !== undefined) row.expense_date = patch.date;
    if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
    if (patch.amount !== undefined) row.amount = patch.amount;
    if (patch.remarks !== undefined) row.remarks = patch.remarks;
    if (Object.keys(row).length) await supabase.from('expenses').update(row).eq('id', eId);
    setBusinessExpenses((prev) => prev.map((e) => (e.id === eId ? {
      ...e,
      date: patch.date ?? e.date,
      categoryId: patch.categoryId ?? e.categoryId,
      amount: patch.amount ?? e.amount,
      remarks: patch.remarks ?? e.remarks,
    } : e)));
    setMonthlyRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      const old = r.expenses.find((e) => e.id === eId);
      if (old && patch.amount !== undefined && patch.amount !== old.amount) {
        logActivity({ action: `Edited Expense`, entity: 'expense', entityId: eId, oldValue: `Rs. ${old.amount.toLocaleString()}`, newValue: `Rs. ${patch.amount.toLocaleString()}` });
      }
      return { ...r, expenses: r.expenses.map((e) => (e.id === eId ? { ...e, ...patch } : e)) };
    }));
  }, [logActivity]);

  const deleteExpense = useCallback(async (recordId: string, eId: string) => {
    await supabase.from('expenses').delete().eq('id', eId);
    setBusinessExpenses((prev) => prev.filter((e) => e.id !== eId));
    setMonthlyRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      const e = r.expenses.find((x) => x.id === eId);
      if (e) logActivity({ action: `Deleted expense — Rs. ${e.amount.toLocaleString()}`, entity: 'expense', entityId: eId });
      return { ...r, expenses: r.expenses.filter((ex) => ex.id !== eId) };
    }));
  }, [logActivity]);

  const getAllExpenses = useCallback((): { expense: Expense; recordId: string }[] => {
    const result: { expense: Expense; recordId: string }[] = [];
    monthlyRecords.forEach((r) => {
      r.expenses.forEach((e) => result.push({ expense: e, recordId: r.id }));
    });
    return result.sort((a, b) => b.expense.date.localeCompare(a.expense.date));
  }, [monthlyRecords]);

  const addStandaloneExpense = useCallback(async (vehicleId: string, date: string, categoryId: string, amount: number, remarks: string) => {
    const month = date.slice(0, 7);
    let rec = monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === month);
    if (!rec) rec = await createMonthlyRecord(vehicleId, month);
    await addExpense(rec.id, { date, categoryId, amount, remarks, vehicleId });
  }, [monthlyRecords, createMonthlyRecord, addExpense]);

  const updateStandaloneExpense = useCallback(async (expenseId: string, patch: Partial<Expense>) => {
    const row: any = {};
    if (patch.date !== undefined) row.expense_date = patch.date;
    if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
    if (patch.amount !== undefined) row.amount = patch.amount;
    if (patch.remarks !== undefined) row.remarks = patch.remarks;
    if (patch.vehicleId !== undefined) row.vehicle_id = patch.vehicleId;
    if (Object.keys(row).length) await supabase.from('expenses').update(row).eq('id', expenseId);
    const oldBexp = businessExpenses.find((e) => e.id === expenseId);
    if (oldBexp && patch.amount !== undefined && patch.amount !== oldBexp.amount) {
      logActivity({ action: `Edited Expense`, entity: 'expense', entityId: expenseId, oldValue: `Rs. ${oldBexp.amount.toLocaleString()}`, newValue: `Rs. ${patch.amount.toLocaleString()}` });
    }
    setBusinessExpenses((prev) => prev.map((e) => {
      if (e.id !== expenseId) return e;
      return {
        ...e,
        date: patch.date ?? e.date,
        categoryId: patch.categoryId ?? e.categoryId,
        amount: patch.amount ?? e.amount,
        remarks: patch.remarks ?? e.remarks,
      };
    }));
    setMonthlyRecords((prev) => prev.map((r) => ({ ...r, expenses: r.expenses.map((e) => (e.id === expenseId ? { ...e, ...patch } : e)) })));
  }, [businessExpenses, logActivity]);

  const deleteStandaloneExpense = useCallback(async (expenseId: string) => {
    await supabase.from('expenses').delete().eq('id', expenseId);
    const e = businessExpenses.find((x) => x.id === expenseId);
    if (e) logActivity({ action: `Deleted expense — Rs. ${e.amount.toLocaleString()}`, entity: 'expense', entityId: expenseId });
    setBusinessExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    setMonthlyRecords((prev) => prev.map((r) => ({ ...r, expenses: r.expenses.filter((ex) => ex.id !== expenseId) })));
  }, [businessExpenses, logActivity]);

  // ==================================================
  // BUSINESS EXPENSES
  // ==================================================

  const addBusinessExpense = useCallback(async (e: Omit<BusinessExpense, 'id' | 'createdAt'>) => {
    const row: any = {
      expense_date: e.date,
      category_id: e.categoryId,
      expense_for: e.expenseFor,
      vehicle_id: e.expenseFor === 'Vehicle' ? (e.relatedToId || null) : null,
      driver_id: e.expenseFor === 'Driver' ? (e.relatedToId || null) : null,
      subcontractor_id: e.expenseFor === 'Subcontractor' ? (e.relatedToId || null) : null,
      related_name: e.relatedToName || '',
      amount: e.amount,
      payment_method: e.paymentMethod,
      remarks: e.remarks,
      created_by: currentUser?.id || null,
    };
    const { data } = await supabase.from('expenses').insert(row).select().single();
    const exp: BusinessExpense = { ...e, id: data?.id ? String(data.id) : `bexp-${Date.now()}`, createdAt: new Date().toISOString() };
    setBusinessExpenses((prev) => [exp, ...prev]);
    const cat = categories.find((c) => c.id === e.categoryId);
    logActivity({ action: `Added ${cat?.name || 'expense'} — Rs. ${e.amount.toLocaleString()} for ${e.expenseFor}: ${e.relatedToName}`, entity: 'expense', entityId: exp.id });
    // If Vehicle, also push into matching monthly record expenses
    if (e.expenseFor === 'Vehicle') {
      const vid = e.relatedToId;
      const month = e.date.slice(0, 7);
      setMonthlyRecords((prev) => prev.map((r) => {
        if (!(r.vehicleId === vid && r.month === month)) return r;
        const expItem: Expense = { id: exp.id, date: e.date, vehicleId: vid, categoryId: e.categoryId, amount: e.amount, remarks: e.remarks, createdAt: exp.createdAt };
        return { ...r, expenses: [...r.expenses, expItem] };
      }));
    }
  }, [categories, currentUser, logActivity]);

  const updateBusinessExpense = useCallback(async (id: string, patch: Partial<BusinessExpense>) => {
    const row: any = {};
    if (patch.date !== undefined) row.expense_date = patch.date;
    if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
    if (patch.expenseFor !== undefined) row.expense_for = patch.expenseFor;
    if (patch.relatedToName !== undefined) row.related_name = patch.relatedToName;
    if (patch.amount !== undefined) row.amount = patch.amount;
    if (patch.paymentMethod !== undefined) row.payment_method = patch.paymentMethod;
    if (patch.remarks !== undefined) row.remarks = patch.remarks;
    if (patch.expenseFor === 'Vehicle' && patch.relatedToId !== undefined) row.vehicle_id = patch.relatedToId;
    if (patch.expenseFor === 'Driver' && patch.relatedToId !== undefined) row.driver_id = patch.relatedToId;
    if (patch.expenseFor === 'Subcontractor' && patch.relatedToId !== undefined) row.subcontractor_id = patch.relatedToId;
    if (Object.keys(row).length) await supabase.from('expenses').update(row).eq('id', id);
    const old = businessExpenses.find((e) => e.id === id);
    if (old && patch.amount !== undefined && patch.amount !== old.amount) {
      logActivity({ action: `Edited Expense`, entity: 'expense', entityId: id, oldValue: `Rs. ${old.amount.toLocaleString()}`, newValue: `Rs. ${patch.amount.toLocaleString()}` });
    }
    setBusinessExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, [businessExpenses, logActivity]);

  const deleteBusinessExpense = useCallback(async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    const e = businessExpenses.find((x) => x.id === id);
    if (e) logActivity({ action: `Deleted expense — Rs. ${e.amount.toLocaleString()}`, entity: 'expense', entityId: id });
    setBusinessExpenses((prev) => prev.filter((e) => e.id !== id));
  }, [businessExpenses, logActivity]);

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

  // ==================================================
  // SAVE MONTHLY BULK
  // ==================================================

  const saveMonthlyRecordBulk = useCallback(async (vehicleId: string, month: string, dailyEntries: Omit<DailyRecord, 'id'>[]): Promise<MonthlyRecord> => {
    const [yearStr, monthStr] = month.split('-');
    const yr = Number(yearStr);
    const mo = Number(monthStr);
    const filtered = dailyEntries.filter((d) => d.amount > 0 || d.details.trim() !== '' || (d.routes.length > 0 && d.routes.some((r) => r.amount > 0 || r.location.trim() !== '')));
    const rpcData = filtered.map((d) => ({
      date: d.date,
      entry_type: d.entryType,
      amount: d.amount,
      details: d.details,
      routes: d.routes,
    }));
    const { error: rpcErr } = await supabase.rpc('save_monthly_record_bulk', {
      p_vehicle_id: vehicleId,
      p_month: mo,
      p_year: yr,
      p_daily_records: rpcData,
    });
    if (rpcErr) {
      console.error('save_monthly_record_bulk RPC error', rpcErr);
      // Fallback: manual
      await createMonthlyRecord(vehicleId, month);
    }
    // Reload monthly records from DB to ensure correct state
    const { data: mr } = await supabase.from('monthly_records').select('*');
    const { data: drs } = await supabase.from('daily_records').select('*');
    const { data: rts } = await supabase.from('daily_routes').select('*');
    const mrList = buildMonthlyRecords(mr || [], drs || [], rts || [], businessExpenses);
    setMonthlyRecords(mrList);
    const existing = mrList.find((r) => r.vehicleId === vehicleId && r.month === month);
    if (existing) {
      logActivity({ action: `Updated monthly record for ${month} (${existing.dailyRecords.length} entries)`, entity: 'monthly-record', entityId: existing.id });
      return existing;
    }
    const rec: MonthlyRecord = { id: `mr-${Date.now()}`, vehicleId, month, dailyRecords: [], expenses: [], createdAt: new Date().toISOString() };
    logActivity({ action: `Created monthly record for ${month} (0 entries)`, entity: 'monthly-record', entityId: rec.id });
    return rec;
  }, [businessExpenses, createMonthlyRecord, logActivity]);

  // ==================================================
  // CATEGORIES
  // ==================================================

  const addCategory = useCallback(async (name: string): Promise<ExpenseCategory> => {
    const { data } = await supabase.from('expense_categories').insert({ name }).select().single();
    const cat = data ? toCategory(data) : { id: `cat-${Date.now()}`, name };
    setCategories((prev) => [...prev, cat]);
    logActivity({ action: `Created expense category "${name}"`, entity: 'category', entityId: cat.id });
    return cat;
  }, [logActivity]);

  const updateCategory = useCallback(async (id: string, name: string) => {
    await supabase.from('expense_categories').update({ name }).eq('id', id);
    setCategories((prev) => {
      const old = prev.find((c) => c.id === id);
      if (old) logActivity({ action: `Renamed category "${old.name}" → "${name}"`, entity: 'category', entityId: id });
      return prev.map((c) => (c.id === id ? { ...c, name } : c));
    });
  }, [logActivity]);

  const deleteCategory = useCallback(async (id: string) => {
    await supabase.from('expense_categories').delete().eq('id', id);
    setCategories((prev) => {
      const c = prev.find((x) => x.id === id);
      if (c) logActivity({ action: `Deleted category "${c.name}"`, entity: 'category', entityId: id });
      return prev.filter((c) => c.id !== id);
    });
  }, [logActivity]);

  // ==================================================
  // SETTINGS
  // ==================================================

  const updateSettings = useCallback(async (s: Partial<Settings>) => {
    const row: any = {};
    if (s.companyName !== undefined) row.company_name = s.companyName;
    if (s.currency !== undefined) row.currency = s.currency;
    if (s.commissionRate !== undefined) row.commission_rate = s.commissionRate;
    if (s.adminName !== undefined) row.admin_name = s.adminName;
    if (s.appearance !== undefined) row.appearance = s.appearance;
    if (Object.keys(row).length) {
      const { data: existing } = await supabase.from('settings').select('id').limit(1);
      if (existing && existing[0]) {
        await supabase.from('settings').update(row).eq('id', existing[0].id);
      } else {
        await supabase.from('settings').insert(row);
      }
    }
    setSettings((prev) => ({ ...prev, ...s }));
  }, []);

  const value: StoreContextValue = {
    vehicles, drivers, subcontractors, monthlyRecords, categories, salaries, activity, settings, businessExpenses,
    users, currentUser,
    login, logout, getCurrentUser, hasPermission, canAccessModule,
    addUser, updateUser, deleteUser, updateUserPermissions, setUserStatus,
    addVehicle, updateVehicle, deleteVehicle,
    addDriver, updateDriver, deleteDriver,
    addSubcontractor, updateSubcontractor, deleteSubcontractor,
    addSalary, updateSalary, deleteSalary,
    getMonthlyRecord, createMonthlyRecord, addDailyRecord, updateDailyRecord, deleteDailyRecord,
    addExpense, updateExpense, deleteExpense,
    getAllExpenses, addStandaloneExpense, updateStandaloneExpense, deleteStandaloneExpense,
    addBusinessExpense, updateBusinessExpense, deleteBusinessExpense,
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
