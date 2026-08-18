export type VehicleType = 'Car' | 'Pickup' | 'Shahzore';
export type OwnerType = 'Ride for U' | 'Subcontractor';
export type EntityStatus = 'Active' | 'Inactive' | 'Maintenance';

export type PermissionAction = 'view' | 'add' | 'edit' | 'delete';

export type ModuleKey =
  | 'dashboard'
  | 'vehicles'
  | 'drivers'
  | 'subcontractors'
  | 'monthlyRecords'
  | 'expenses'
  | 'reports'
  | 'settings'
  | 'users';

export interface ModulePermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export type PermissionSet = Record<ModuleKey, ModulePermissions>;

export type UserRole = 'super_admin' | 'staff';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  status: EntityStatus;
  permissions: PermissionSet;
  createdAt: string;
}

export const ALL_MODULES: ModuleKey[] = [
  'dashboard',
  'vehicles',
  'drivers',
  'subcontractors',
  'monthlyRecords',
  'expenses',
  'reports',
  'settings',
  'users',
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  vehicles: 'Vehicles',
  drivers: 'Drivers',
  subcontractors: 'Subcontractors',
  monthlyRecords: 'Monthly Records',
  expenses: 'Expenses',
  reports: 'Reports',
  settings: 'Settings',
  users: 'Users',
};

export function emptyPermissions(): PermissionSet {
  return ALL_MODULES.reduce((acc, m) => {
    acc[m] = { view: false, add: false, edit: false, delete: false };
    return acc;
  }, {} as PermissionSet);
}

export function superAdminPermissions(): PermissionSet {
  return ALL_MODULES.reduce((acc, m) => {
    acc[m] = { view: true, add: true, edit: true, delete: true };
    return acc;
  }, {} as PermissionSet);
}

export interface Vehicle {
  id: string;
  number: string;
  type: VehicleType;
  ownerType: OwnerType;
  ownerId?: string; // subcontractor id when ownerType === 'Subcontractor'
  driverId?: string;
  model: string;
  status: EntityStatus;
  notes: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  fullName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  address: string;
  license: string;
  joiningDate: string;
  vehicleId?: string;
  status: EntityStatus;
  notes: string;
  createdAt: string;
}

export interface SalaryRecord {
  id: string;
  driverId: string;
  month: string; // YYYY-MM
  monthlySalary: number;
  paidAmount: number;
  salaryDate: string;
  remarks: string;
  createdAt: string;
}

export interface Subcontractor {
  id: string;
  name: string;
  cnic: string;
  phone: string;
  address: string;
  joiningDate: string;
  status: EntityStatus;
  notes: string;
  createdAt: string;
}

export interface RouteEntry {
  id: string;
  location: string;
  amount: number;
}

export interface DailyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  details: string;
  routes: RouteEntry[];
  entryType: 'quick' | 'detailed';
}

export interface Expense {
  id: string;
  date: string;
  vehicleId: string;
  categoryId: string;
  amount: number;
  remarks: string;
  createdAt: string;
}

export type ExpenseFor = 'Vehicle' | 'Driver' | 'Subcontractor' | 'Office' | 'Other';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Cheque' | 'Other';

export interface BusinessExpense {
  id: string;
  date: string;
  categoryId: string;
  expenseFor: ExpenseFor;
  relatedToId: string;
  relatedToName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  remarks: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface MonthlyRecord {
  id: string;
  vehicleId: string;
  month: string; // YYYY-MM
  dailyRecords: DailyRecord[];
  expenses: Expense[];
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actor: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
}

export interface Settings {
  companyName: string;
  currency: string;
  commissionRate: number; // percentage e.g. 2.5
  adminName: string;
  appearance: 'light' | 'dark';
}
