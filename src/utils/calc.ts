import type { MonthlyRecord, DailyRecord, Expense } from '@/types';

export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

export function formatNumber(amount: number): string {
  return amount.toLocaleString('en-PK');
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${monthNames[m - 1]} ${y}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = monthNames[d.getMonth()].slice(0, 3);
  return `${dd} ${mm}`;
}

export function formatDateLong(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

export function todayMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function dailyTotal(dr: DailyRecord): number {
  if (dr.entryType === 'detailed' && dr.routes.length > 0) {
    return dr.routes.reduce((s, r) => s + r.amount, 0);
  }
  return dr.amount;
}

export function totalDuty(record: MonthlyRecord): number {
  return record.dailyRecords.reduce((s, d) => s + dailyTotal(d), 0);
}

export function totalExpenses(record: MonthlyRecord): number {
  return record.expenses.reduce((s, e) => s + e.amount, 0);
}

export function commissionAmount(totalDutyVal: number, rate: number): number {
  return Math.round((totalDutyVal * rate) / 100);
}

export function afterCommission(totalDutyVal: number, rate: number): number {
  return totalDutyVal - commissionAmount(totalDutyVal, rate);
}

export function finalAmount(record: MonthlyRecord, rate: number): number {
  return afterCommission(totalDuty(record), rate) - totalExpenses(record);
}

export function salaryRemaining(monthlySalary: number, paidAmount: number): number {
  return monthlySalary - paidAmount;
}

export function generateMonthOptions(count: number = 12): string[] {
  const months: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export function daysInMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
