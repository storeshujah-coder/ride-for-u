import type {
  Vehicle, Driver, Subcontractor, MonthlyRecord,
  ExpenseCategory, ActivityLog, Settings, SalaryRecord,
  BusinessExpense,
} from '@/types';

export const seedSettings: Settings = {
  companyName: 'Ride for U',
  currency: 'PKR',
  commissionRate: 2.5,
  adminName: 'Admin',
  appearance: 'light',
};

export const seedCategories: ExpenseCategory[] = [
  { id: 'cat-fuel', name: 'Fuel' },
  { id: 'cat-maintenance', name: 'Maintenance' },
  { id: 'cat-salary', name: 'Salary' },
  { id: 'cat-office', name: 'Office' },
  { id: 'cat-repair', name: 'Repair' },
  { id: 'cat-toll', name: 'Toll' },
  { id: 'cat-washing', name: 'Washing' },
  { id: 'cat-driver', name: 'Driver' },
  { id: 'cat-other', name: 'Other' },
];

export const seedSubcontractors: Subcontractor[] = [
  { id: 'sub-1', name: 'Muhammad Rashid', cnic: '35202-1234567-1', phone: '0300-1234567', address: 'House 12, Gulberg III, Lahore', joiningDate: '2024-01-15', status: 'Active', notes: 'Owns 3 vehicles', createdAt: '2024-01-15T08:00:00Z' },
  { id: 'sub-2', name: 'Abdul Karim', cnic: '35202-2345678-2', phone: '0301-2345678', address: 'House 45, Model Town, Lahore', joiningDate: '2024-03-20', status: 'Active', notes: 'Owns 2 vehicles', createdAt: '2024-03-20T08:00:00Z' },
  { id: 'sub-3', name: 'Iqbal Hussain', cnic: '35202-3456789-3', phone: '0302-3456789', address: 'House 78, Johar Town, Lahore', joiningDate: '2024-05-10', status: 'Active', notes: '', createdAt: '2024-05-10T08:00:00Z' },
  { id: 'sub-4', name: 'Saeed Ahmed', cnic: '35202-4567890-4', phone: '0303-4567890', address: 'House 90, DHA Phase 5, Lahore', joiningDate: '2024-06-01', status: 'Inactive', notes: 'On leave', createdAt: '2024-06-01T08:00:00Z' },
];

export const seedDrivers: Driver[] = [
  { id: 'drv-1', fullName: 'Ali Raza', fatherName: 'Ghulam Rasool', cnic: '35202-1111111-1', phone: '0301-1111111', address: 'Street 5, Walton, Lahore', license: 'LHR-2021-001', joiningDate: '2024-01-20', vehicleId: 'veh-1', status: 'Active', notes: '', createdAt: '2024-01-20T08:00:00Z' },
  { id: 'drv-2', fullName: 'Bilal Ahmad', fatherName: 'Muhammad Ashraf', cnic: '35202-2222222-2', phone: '0301-2222222', address: 'Street 10, Cantt, Lahore', license: 'LHR-2021-002', joiningDate: '2024-02-01', vehicleId: 'veh-2', status: 'Active', notes: '', createdAt: '2024-02-01T08:00:00Z' },
  { id: 'drv-3', fullName: 'Kamran Khan', fatherName: 'Sher Zaman', cnic: '35202-3333333-3', phone: '0301-3333333', address: 'Street 22, Faisal Town, Lahore', license: 'LHR-2020-003', joiningDate: '2024-01-25', vehicleId: 'veh-3', status: 'Active', notes: '', createdAt: '2024-01-25T08:00:00Z' },
  { id: 'drv-4', fullName: 'Naveed Anjum', fatherName: 'Anjum Ali', cnic: '35202-4444444-4', phone: '0301-4444444', address: 'Street 8, Township, Lahore', license: 'LHR-2022-004', joiningDate: '2024-03-10', vehicleId: 'veh-4', status: 'Active', notes: '', createdAt: '2024-03-10T08:00:00Z' },
  { id: 'drv-5', fullName: 'Rashid Mahmood', fatherName: 'Mahmood Ul Hasan', cnic: '35202-5555555-5', phone: '0301-5555555', address: 'Street 3, Green Town, Lahore', license: 'LHR-2021-005', joiningDate: '2024-02-15', vehicleId: 'veh-5', status: 'Active', notes: '', createdAt: '2024-02-15T08:00:00Z' },
  { id: 'drv-6', fullName: 'Tariq Mehmood', fatherName: 'Mehmood Akhtar', cnic: '35202-6666666-6', phone: '0301-6666666', address: 'Street 14, Sabzazar, Lahore', license: 'LHR-2020-006', joiningDate: '2024-04-01', vehicleId: 'veh-6', status: 'Active', notes: '', createdAt: '2024-04-01T08:00:00Z' },
  { id: 'drv-7', fullName: 'Usman Ghani', fatherName: 'Ghani Rehman', cnic: '35202-7777777-7', phone: '0301-7777777', address: 'Street 9, Bund Road, Lahore', license: 'LHR-2022-007', joiningDate: '2024-03-15', vehicleId: 'veh-7', status: 'Active', notes: '', createdAt: '2024-03-15T08:00:00Z' },
  { id: 'drv-8', fullName: 'Yasir Iqbal', fatherName: 'Iqbal Hussain', cnic: '35202-8888888-8', phone: '0301-8888888', address: 'Street 21, Shadbagh, Lahore', license: 'LHR-2021-008', joiningDate: '2024-05-01', vehicleId: 'veh-8', status: 'Active', notes: '', createdAt: '2024-05-01T08:00:00Z' },
  { id: 'drv-9', fullName: 'Zulfiqar Ali', fatherName: 'Ali Akbar', cnic: '35202-9999999-9', phone: '0301-9999999', address: 'Street 7, Baghbanpura, Lahore', license: 'LHR-2020-009', joiningDate: '2024-06-10', vehicleId: 'veh-9', status: 'Active', notes: '', createdAt: '2024-06-10T08:00:00Z' },
  { id: 'drv-10', fullName: 'Asif Jutt', fatherName: 'Jutt Ahmed', cnic: '35202-1010101-1', phone: '0301-1010101', address: 'Street 11, Harbanspura, Lahore', license: 'LHR-2022-010', joiningDate: '2024-07-01', vehicleId: 'veh-10', status: 'Maintenance', notes: 'Recovering from injury', createdAt: '2024-07-01T08:00:00Z' },
];

export const seedVehicles: Vehicle[] = [
  { id: 'veh-1', number: 'LEA-1234', type: 'Car', ownerType: 'Ride for U', driverId: 'drv-1', model: 'Suzuki Bolan 2022', status: 'Active', notes: '', createdAt: '2024-01-20T08:00:00Z' },
  { id: 'veh-2', number: 'LEA-5678', type: 'Car', ownerType: 'Subcontractor', ownerId: 'sub-1', driverId: 'drv-2', model: 'Suzuki Cultus 2021', status: 'Active', notes: '', createdAt: '2024-02-01T08:00:00Z' },
  { id: 'veh-3', number: 'LEB-2222', type: 'Pickup', ownerType: 'Subcontractor', ownerId: 'sub-1', driverId: 'drv-3', model: 'Suzuki Pickup 2020', status: 'Active', notes: '', createdAt: '2024-02-10T08:00:00Z' },
  { id: 'veh-4', number: 'LEC-3456', type: 'Shahzore', ownerType: 'Subcontractor', ownerId: 'sub-1', driverId: 'drv-4', model: 'Mazda Shahzore 2019', status: 'Active', notes: '', createdAt: '2024-02-20T08:00:00Z' },
  { id: 'veh-5', number: 'LPA-7890', type: 'Pickup', ownerType: 'Ride for U', driverId: 'drv-5', model: 'Suzuki Pickup 2023', status: 'Active', notes: '', createdAt: '2024-03-01T08:00:00Z' },
  { id: 'veh-6', number: 'LPA-4321', type: 'Pickup', ownerType: 'Ride for U', driverId: 'drv-6', model: 'Suzuki Pickup 2022', status: 'Active', notes: '', createdAt: '2024-03-15T08:00:00Z' },
  { id: 'veh-7', number: 'LSZ-1111', type: 'Shahzore', ownerType: 'Ride for U', driverId: 'drv-7', model: 'Mazda Shahzore 2021', status: 'Active', notes: '', createdAt: '2024-04-01T08:00:00Z' },
  { id: 'veh-8', number: 'LHR-8800', type: 'Car', ownerType: 'Subcontractor', ownerId: 'sub-2', driverId: 'drv-8', model: 'Toyota Corolla 2020', status: 'Active', notes: '', createdAt: '2024-04-10T08:00:00Z' },
  { id: 'veh-9', number: 'LHR-9900', type: 'Pickup', ownerType: 'Subcontractor', ownerId: 'sub-2', driverId: 'drv-9', model: 'Suzuki Pickup 2021', status: 'Active', notes: '', createdAt: '2024-05-01T08:00:00Z' },
  { id: 'veh-10', number: 'LPA-5566', type: 'Pickup', ownerType: 'Ride for U', driverId: 'drv-10', model: 'Suzuki Pickup 2022', status: 'Maintenance', notes: 'Engine overhaul', createdAt: '2024-06-01T08:00:00Z' },
];

export const seedSalaries: SalaryRecord[] = [
  { id: 'sal-1', driverId: 'drv-1', month: '2026-07', monthlySalary: 35000, paidAmount: 20000, salaryDate: '2026-07-31', remarks: 'Partial payment', createdAt: '2026-07-31T08:00:00Z' },
  { id: 'sal-2', driverId: 'drv-1', month: '2026-06', monthlySalary: 35000, paidAmount: 35000, salaryDate: '2026-06-30', remarks: 'Full payment', createdAt: '2026-06-30T08:00:00Z' },
  { id: 'sal-3', driverId: 'drv-2', month: '2026-07', monthlySalary: 32000, paidAmount: 32000, salaryDate: '2026-07-31', remarks: '', createdAt: '2026-07-31T08:00:00Z' },
  { id: 'sal-4', driverId: 'drv-3', month: '2026-07', monthlySalary: 38000, paidAmount: 25000, salaryDate: '2026-07-31', remarks: 'Remaining next month', createdAt: '2026-07-31T08:00:00Z' },
  { id: 'sal-5', driverId: 'drv-5', month: '2026-07', monthlySalary: 30000, paidAmount: 30000, salaryDate: '2026-07-31', remarks: '', createdAt: '2026-07-31T08:00:00Z' },
  { id: 'sal-6', driverId: 'drv-6', month: '2026-06', monthlySalary: 30000, paidAmount: 15000, salaryDate: '2026-06-30', remarks: '', createdAt: '2026-06-30T08:00:00Z' },
  { id: 'sal-7', driverId: 'drv-6', month: '2026-07', monthlySalary: 30000, paidAmount: 15000, salaryDate: '2026-07-31', remarks: 'Cleared previous + partial current', createdAt: '2026-07-31T08:00:00Z' },
];

function makeDailyRecords(month: string, baseAmount: number): any[] {
  const [y, m] = month.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const records: any[] = [];
  const routes = [
    ['Factory → DHA', 3000],
    ['DHA → Johar Town', 2500],
    ['Johar Town → Factory', 4500],
  ];
  for (let d = 1; d <= days; d++) {
    if (d % 7 === 0) continue; // skip some days
    const date = `${month}-${String(d).padStart(2, '0')}`;
    const amount = baseAmount + Math.round(Math.sin(d) * 1500 + d * 100);
    if (d % 3 === 0) {
      records.push({
        id: `dr-${month}-${d}`,
        date,
        amount,
        details: 'Full Day Duty',
        routes: [],
        entryType: 'quick' as const,
      });
    } else {
      const total = routes.reduce((s, r) => s + (r[1] as number), 0);
      records.push({
        id: `dr-${month}-${d}`,
        date,
        amount: total,
        details: '',
        routes: routes.map((r, i) => ({ id: `rt-${month}-${d}-${i}`, location: r[0], amount: r[1] as number })),
        entryType: 'detailed' as const,
      });
    }
  }
  return records;
}

function makeExpenses(vehicleId: string, month: string): any[] {
  const [y, m] = month.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  return [
    { id: `exp-${vehicleId}-${month}-1`, date: `${month}-03`, vehicleId, categoryId: 'cat-fuel', amount: 5000, remarks: 'Diesel', createdAt: `${month}-03T08:00:00Z` },
    { id: `exp-${vehicleId}-${month}-2`, date: `${month}-10`, vehicleId, categoryId: 'cat-driver', amount: 6000, remarks: 'Driver payment', createdAt: `${month}-10T08:00:00Z` },
    { id: `exp-${vehicleId}-${month}-3`, date: `${month}-15`, vehicleId, categoryId: 'cat-maintenance', amount: 3500, remarks: 'Oil change', createdAt: `${month}-15T08:00:00Z` },
    { id: `exp-${vehicleId}-${month}-4`, date: `${month}-${String(Math.min(days, 25)).padStart(2, '0')}`, vehicleId, categoryId: 'cat-washing', amount: 800, remarks: 'Weekly wash', createdAt: `${month}-25T08:00:00Z` },
  ];
}

function buildMonthlyRecords(): MonthlyRecord[] {
  const months = ['2026-06', '2026-07', '2026-08'];
  const records: MonthlyRecord[] = [];
  const baseAmounts: Record<string, number> = {
    'veh-1': 9000, 'veh-2': 9500, 'veh-3': 8500, 'veh-4': 11000,
    'veh-5': 8000, 'veh-6': 8200, 'veh-7': 12000, 'veh-8': 10000,
    'veh-9': 8800, 'veh-10': 8500,
  };
  seedVehicles.forEach((v) => {
    months.forEach((month) => {
      if (v.status === 'Maintenance' && month === '2026-08') return;
      records.push({
        id: `mr-${v.id}-${month}`,
        vehicleId: v.id,
        month,
        dailyRecords: makeDailyRecords(month, baseAmounts[v.id] || 8000),
        expenses: makeExpenses(v.id, month),
        createdAt: `${month}-01T08:00:00Z`,
      });
    });
  });
  return records;
}

export const seedMonthlyRecords: MonthlyRecord[] = buildMonthlyRecords();

export const seedBusinessExpenses: BusinessExpense[] = [
  // Vehicle expenses - August 2026
  { id: 'bexp-1', date: '2026-08-03', categoryId: 'cat-fuel', expenseFor: 'Vehicle', relatedToId: 'veh-1', relatedToName: 'LEA-1234', amount: 5000, paymentMethod: 'Cash', remarks: 'Diesel', createdAt: '2026-08-03T08:00:00Z' },
  { id: 'bexp-2', date: '2026-08-10', categoryId: 'cat-fuel', expenseFor: 'Vehicle', relatedToId: 'veh-2', relatedToName: 'LEA-5678', amount: 7000, paymentMethod: 'Cash', remarks: 'Diesel', createdAt: '2026-08-10T08:00:00Z' },
  { id: 'bexp-3', date: '2026-08-15', categoryId: 'cat-fuel', expenseFor: 'Vehicle', relatedToId: 'veh-1', relatedToName: 'LEA-1234', amount: 4500, paymentMethod: 'Bank Transfer', remarks: 'Fuel', createdAt: '2026-08-15T08:00:00Z' },
  { id: 'bexp-4', date: '2026-08-05', categoryId: 'cat-maintenance', expenseFor: 'Vehicle', relatedToId: 'veh-3', relatedToName: 'LEB-2222', amount: 3500, paymentMethod: 'Cash', remarks: 'Oil change', createdAt: '2026-08-05T08:00:00Z' },
  { id: 'bexp-5', date: '2026-08-12', categoryId: 'cat-maintenance', expenseFor: 'Vehicle', relatedToId: 'veh-1', relatedToName: 'LEA-1234', amount: 2200, paymentMethod: 'Cash', remarks: 'Filter replacement', createdAt: '2026-08-12T08:00:00Z' },
  { id: 'bexp-6', date: '2026-08-18', categoryId: 'cat-repair', expenseFor: 'Vehicle', relatedToId: 'veh-4', relatedToName: 'LEC-3456', amount: 8500, paymentMethod: 'Bank Transfer', remarks: 'Engine repair', createdAt: '2026-08-18T08:00:00Z' },
  { id: 'bexp-7', date: '2026-08-20', categoryId: 'cat-washing', expenseFor: 'Vehicle', relatedToId: 'veh-5', relatedToName: 'LPA-7890', amount: 800, paymentMethod: 'Cash', remarks: 'Weekly wash', createdAt: '2026-08-20T08:00:00Z' },
  { id: 'bexp-8', date: '2026-08-22', categoryId: 'cat-toll', expenseFor: 'Vehicle', relatedToId: 'veh-7', relatedToName: 'LSZ-1111', amount: 1200, paymentMethod: 'Cash', remarks: 'Toll tax', createdAt: '2026-08-22T08:00:00Z' },
  // Driver expenses - August 2026
  { id: 'bexp-9', date: '2026-08-31', categoryId: 'cat-salary', expenseFor: 'Driver', relatedToId: 'drv-1', relatedToName: 'Ali Raza', amount: 35000, paymentMethod: 'Cash', remarks: 'Monthly salary', createdAt: '2026-08-31T08:00:00Z' },
  { id: 'bexp-10', date: '2026-08-31', categoryId: 'cat-salary', expenseFor: 'Driver', relatedToId: 'drv-2', relatedToName: 'Bilal Ahmad', amount: 32000, paymentMethod: 'Bank Transfer', remarks: 'Monthly salary', createdAt: '2026-08-31T08:00:00Z' },
  { id: 'bexp-11', date: '2026-08-15', categoryId: 'cat-fuel', expenseFor: 'Driver', relatedToId: 'drv-3', relatedToName: 'Kamran Khan', amount: 2000, paymentMethod: 'Cash', remarks: 'Advance fuel', createdAt: '2026-08-15T08:00:00Z' },
  // Subcontractor expenses - August 2026
  { id: 'bexp-12', date: '2026-08-10', categoryId: 'cat-other', expenseFor: 'Subcontractor', relatedToId: 'sub-1', relatedToName: 'Muhammad Rashid', amount: 10000, paymentMethod: 'Bank Transfer', remarks: 'Other payment', createdAt: '2026-08-10T08:00:00Z' },
  { id: 'bexp-13', date: '2026-08-20', categoryId: 'cat-repair', expenseFor: 'Subcontractor', relatedToId: 'sub-2', relatedToName: 'Abdul Karim', amount: 5500, paymentMethod: 'Cash', remarks: 'Vehicle repair contribution', createdAt: '2026-08-20T08:00:00Z' },
  // Office expenses - August 2026
  { id: 'bexp-14', date: '2026-08-05', categoryId: 'cat-office', expenseFor: 'Office', relatedToId: 'office', relatedToName: 'Head Office', amount: 12000, paymentMethod: 'Bank Transfer', remarks: 'Office electricity bill', createdAt: '2026-08-05T08:00:00Z' },
  { id: 'bexp-15', date: '2026-08-10', categoryId: 'cat-office', expenseFor: 'Office', relatedToId: 'office', relatedToName: 'Head Office', amount: 8000, paymentMethod: 'Cash', remarks: 'Office rent', createdAt: '2026-08-10T08:00:00Z' },
  { id: 'bexp-16', date: '2026-08-18', categoryId: 'cat-office', expenseFor: 'Office', relatedToId: 'office', relatedToName: 'Head Office', amount: 3500, paymentMethod: 'Cash', remarks: 'Stationery and supplies', createdAt: '2026-08-18T08:00:00Z' },
  // Other expenses - August 2026
  { id: 'bexp-17', date: '2026-08-25', categoryId: 'cat-other', expenseFor: 'Other', relatedToId: 'other-internet', relatedToName: 'Internet Bill', amount: 2500, paymentMethod: 'Bank Transfer', remarks: 'Monthly internet', createdAt: '2026-08-25T08:00:00Z' },
  // July 2026 expenses
  { id: 'bexp-18', date: '2026-07-03', categoryId: 'cat-fuel', expenseFor: 'Vehicle', relatedToId: 'veh-1', relatedToName: 'LEA-1234', amount: 4800, paymentMethod: 'Cash', remarks: 'Diesel', createdAt: '2026-07-03T08:00:00Z' },
  { id: 'bexp-19', date: '2026-07-10', categoryId: 'cat-fuel', expenseFor: 'Vehicle', relatedToId: 'veh-2', relatedToName: 'LEA-5678', amount: 6500, paymentMethod: 'Cash', remarks: 'Diesel', createdAt: '2026-07-10T08:00:00Z' },
  { id: 'bexp-20', date: '2026-07-31', categoryId: 'cat-salary', expenseFor: 'Driver', relatedToId: 'drv-1', relatedToName: 'Ali Raza', amount: 35000, paymentMethod: 'Cash', remarks: 'Monthly salary', createdAt: '2026-07-31T08:00:00Z' },
  { id: 'bexp-21', date: '2026-07-05', categoryId: 'cat-office', expenseFor: 'Office', relatedToId: 'office', relatedToName: 'Head Office', amount: 11000, paymentMethod: 'Bank Transfer', remarks: 'Office electricity', createdAt: '2026-07-05T08:00:00Z' },
  { id: 'bexp-22', date: '2026-07-15', categoryId: 'cat-maintenance', expenseFor: 'Vehicle', relatedToId: 'veh-3', relatedToName: 'LEB-2222', amount: 3000, paymentMethod: 'Cash', remarks: 'Oil change', createdAt: '2026-07-15T08:00:00Z' },
];

export const seedActivity: ActivityLog[] = [
  { id: 'act-1', actor: 'Admin', date: '2026-08-14', time: '08:35 AM', action: 'Created monthly record for LEA-1234 — August 2026', entity: 'monthly-record', entityId: 'mr-veh-1-2026-08' },
  { id: 'act-2', actor: 'Admin', date: '2026-08-14', time: '08:42 AM', action: 'Edited Duty Amount', entity: 'daily-record', oldValue: 'Rs. 10,000', newValue: 'Rs. 12,000' },
  { id: 'act-3', actor: 'Admin', date: '2026-08-14', time: '08:51 AM', action: 'Edited Expense', entity: 'expense', oldValue: 'Rs. 5,000', newValue: 'Rs. 6,000' },
  { id: 'act-4', actor: 'Admin', date: '2026-08-14', time: '09:02 AM', action: 'Deleted Fuel Expense — Rs. 8,000', entity: 'expense' },
];
