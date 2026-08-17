import { useState } from 'react';
import { Printer, User } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Select, EmptyState } from '@/components/ui';
import { ActivityHistory } from '@/components/ActivityHistory';
import { formatPKR, formatMonth, formatDateLong, formatDate, salaryRemaining, generateMonthOptions } from '@/utils/calc';

export function DriverReportPage() {
  const { drivers, vehicles, salaries, settings, categories, businessExpenses, getBusinessExpensesForEntity } = useStore();
  const toast = useToast();
  const [driverId, setDriverId] = useState('');
  const [month, setMonth] = useState(generateMonthOptions(1)[0]);

  const driver = drivers.find((d) => d.id === driverId);
  const vehicle = vehicles.find((v) => v.id === driver?.vehicleId);
  const driverSalaries = salaries.filter((s) => s.driverId === driverId);

  const monthSalary = driverSalaries.find((s) => s.month === month);
  const allRemaining = driverSalaries.reduce((s, r) => s + salaryRemaining(r.monthlySalary, r.paidAmount), 0);
  const driverExpenses = driverId ? getBusinessExpensesForEntity('Driver', driverId, month) : [];
  const driverExpensesTotal = driverExpenses.reduce((s, e) => s + e.amount, 0);

  const handlePrint = () => {
    if (!driver) { toast('Select a driver first', 'error'); return; }
    window.print();
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Driver Report"
          backTo="/reports"
          action={<Button variant="secondary" onClick={handlePrint}><Printer className="w-4 h-4" /> Generate PDF</Button>}
        />
      </div>

      <Card className="p-5 mb-6 print:hidden">
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Driver" value={driverId} onChange={setDriverId}
            options={drivers.map((d) => ({ value: d.id, label: d.fullName }))}
            placeholder="Select driver" required />
          <Select label="Month" value={month} onChange={setMonth}
            options={generateMonthOptions(12).map((m) => ({ value: m, label: formatMonth(m) }))} />
        </div>
      </Card>

      {!driver ? (
        <Card className="p-8 print:hidden">
          <EmptyState icon={<User className="w-10 h-10" />} title="Select a driver" message="Choose a driver and month to view the report." />
        </Card>
      ) : (
        <Card className="p-8 print-area">
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold tracking-wide text-slate-800">RIDE FOR U</h1>
            <p className="text-sm text-slate-500 mt-1">Transport Management System</p>
            <div className="flex justify-center gap-6 mt-3 text-xs text-slate-500">
              <span><strong className="text-slate-700">Report Type:</strong> Driver Report</span>
              <span><strong className="text-slate-700">Month:</strong> {formatMonth(month)}</span>
              <span><strong className="text-slate-700">Generated:</strong> {formatDateLong(new Date().toISOString().slice(0, 10))}</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Driver Information</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-slate-500">Full Name</p><p className="font-medium text-slate-800">{driver.fullName}</p></div>
              <div><p className="text-xs text-slate-500">Father Name</p><p className="font-medium text-slate-800">{driver.fatherName || '—'}</p></div>
              <div><p className="text-xs text-slate-500">CNIC</p><p className="font-medium text-slate-800">{driver.cnic || '—'}</p></div>
              <div><p className="text-xs text-slate-500">Phone</p><p className="font-medium text-slate-800">{driver.phone || '—'}</p></div>
              <div><p className="text-xs text-slate-500">License</p><p className="font-medium text-slate-800">{driver.license || '—'}</p></div>
              <div><p className="text-xs text-slate-500">Assigned Vehicle</p><p className="font-medium text-slate-800">{vehicle?.number || '—'}</p></div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Salary Records</h2>
            {driverSalaries.length === 0 ? (
              <p className="text-sm text-slate-400">No salary records.</p>
            ) : (
              <table className="w-full text-sm border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase">
                    <th className="px-3 py-2 border-b border-slate-200">Month</th>
                    <th className="px-3 py-2 border-b border-slate-200 text-right">Monthly Salary</th>
                    <th className="px-3 py-2 border-b border-slate-200 text-right">Paid Amount</th>
                    <th className="px-3 py-2 border-b border-slate-200 text-right">Remaining</th>
                    <th className="px-3 py-2 border-b border-slate-200">Salary Date</th>
                    <th className="px-3 py-2 border-b border-slate-200">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {driverSalaries.sort((a, b) => b.month.localeCompare(a.month)).map((s) => (
                    <tr key={s.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-700">{formatMonth(s.month)}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatPKR(s.monthlySalary)}</td>
                      <td className="px-3 py-2 text-right text-emerald-600">{formatPKR(s.paidAmount)}</td>
                      <td className={`px-3 py-2 text-right font-medium ${salaryRemaining(s.monthlySalary, s.paidAmount) > 0 ? 'text-red-600' : 'text-slate-700'}`}>{formatPKR(salaryRemaining(s.monthlySalary, s.paidAmount))}</td>
                      <td className="px-3 py-2 text-slate-600">{formatDateLong(s.salaryDate)}</td>
                      <td className="px-3 py-2 text-slate-600">{s.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-800">
                    <td className="px-3 py-2" colSpan={3}>Total Remaining Salary</td>
                    <td className="px-3 py-2 text-right">{formatPKR(allRemaining)}</td>
                    <td className="px-3 py-2" colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Driver Expenses — {formatMonth(month)}</h2>
            {driverExpenses.length === 0 ? (
              <p className="text-sm text-slate-400">No driver expenses for {formatMonth(month)}.</p>
            ) : (
              <table className="w-full text-sm border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase">
                    <th className="px-3 py-2 border-b border-slate-200">Date</th>
                    <th className="px-3 py-2 border-b border-slate-200">Category</th>
                    <th className="px-3 py-2 border-b border-slate-200">Payment Method</th>
                    <th className="px-3 py-2 border-b border-slate-200">Remarks</th>
                    <th className="px-3 py-2 border-b border-slate-200 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {driverExpenses.sort((a, b) => a.date.localeCompare(b.date)).map((e) => {
                    const cat = categories.find((c) => c.id === e.categoryId);
                    return (
                      <tr key={e.id} className="border-b border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-700">{formatDate(e.date)}</td>
                        <td className="px-3 py-2 text-slate-600">{cat?.name || '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{e.paymentMethod}</td>
                        <td className="px-3 py-2 text-slate-600">{e.remarks || '—'}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">{formatPKR(e.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-800">
                    <td className="px-3 py-2" colSpan={4}>TOTAL DRIVER EXPENSES</td>
                    <td className="px-3 py-2 text-right">{formatPKR(driverExpensesTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <div className="print:hidden">
            <ActivityHistory entity="driver" entityId={driver.id} />
          </div>
        </Card>
      )}
    </div>
  );
}
