import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, FileText } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Select, EmptyState } from '@/components/ui';
import {
  formatPKR, formatMonth, formatDate, formatDateLong, dailyTotal,
  totalDuty, totalExpenses, commissionAmount, afterCommission,
  generateMonthOptions, todayMonth,
} from '@/utils/calc';

export function VehicleReportPage() {
  const { vehicles, drivers, subcontractors, monthlyRecords, categories, settings, getBusinessExpensesForVehicle } = useStore();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [vehicleId, setVehicleId] = useState(searchParams.get('vehicle') || '');
  const [month, setMonth] = useState(searchParams.get('month') || todayMonth());

  useEffect(() => {
    const v = searchParams.get('vehicle');
    const m = searchParams.get('month');
    if (v) setVehicleId(v);
    if (m) setMonth(m);
  }, [searchParams]);

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const driver = drivers.find((d) => d.id === vehicle?.driverId);
  const owner = vehicle?.ownerType === 'Subcontractor'
    ? subcontractors.find((s) => s.id === vehicle.ownerId)?.name || '—'
    : 'Ride for U';
  const record = monthlyRecords.find((r) => r.vehicleId === vehicleId && r.month === month);
  const businessExps = vehicleId ? getBusinessExpensesForVehicle(vehicleId, month) : [];

  const duty = record ? totalDuty(record) : 0;
  const expenses = businessExps.reduce((s, e) => s + e.amount, 0);
  const commission = commissionAmount(duty, settings.commissionRate);
  const afterComm = afterCommission(duty, settings.commissionRate);
  const final = afterComm - expenses;

  const sortedDaily = record ? [...record.dailyRecords].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const sortedExpenses = [...businessExps].sort((a, b) => a.date.localeCompare(b.date));

  const handlePrint = () => {
    if (!vehicle) { toast('Select a vehicle first', 'error'); return; }
    window.print();
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Vehicle Report"
          backTo="/reports"
          action={<Button variant="secondary" onClick={handlePrint}><Printer className="w-4 h-4" /> Generate PDF</Button>}
        />
      </div>

      <Card className="p-5 mb-6 print:hidden">
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Vehicle" value={vehicleId} onChange={setVehicleId}
            options={vehicles.map((v) => ({ value: v.id, label: `${v.number} — ${v.model}` }))}
            placeholder="Select vehicle" required />
          <Select label="Month" value={month} onChange={setMonth}
            options={generateMonthOptions(12).map((m) => ({ value: m, label: formatMonth(m) }))} />
        </div>
      </Card>

      {!vehicle ? (
        <Card className="p-8 print:hidden">
          <EmptyState icon={<FileText className="w-10 h-10" />} title="Select a vehicle" message="Choose a vehicle and month to view the report." />
        </Card>
      ) : (
        <Card className="p-8 print-area">
          {/* Report Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold tracking-wide text-slate-800">RIDE FOR U</h1>
            <p className="text-sm text-slate-500 mt-1">Transport Management System</p>
            <div className="flex justify-center gap-6 mt-3 text-xs text-slate-500">
              <span><strong className="text-slate-700">Report Type:</strong> Vehicle Report</span>
              <span><strong className="text-slate-700">Month:</strong> {formatMonth(month)}</span>
              <span><strong className="text-slate-700">Generated:</strong> {formatDateLong(new Date().toISOString().slice(0, 10))}</span>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Vehicle Information</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><p className="text-xs text-slate-500">Vehicle Number</p><p className="font-medium text-slate-800">{vehicle.number}</p></div>
              <div><p className="text-xs text-slate-500">Type</p><p className="font-medium text-slate-800">{vehicle.type}</p></div>
              <div><p className="text-xs text-slate-500">Owner</p><p className="font-medium text-slate-800">{owner}</p></div>
              <div><p className="text-xs text-slate-500">Driver</p><p className="font-medium text-slate-800">{driver?.fullName || '—'}</p></div>
            </div>
          </div>

          {/* Daily Duty Records */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Daily Duty Records</h2>
            {sortedDaily.length === 0 ? (
              <p className="text-sm text-slate-400">No daily records for this month.</p>
            ) : (
              <table className="w-full text-sm border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase">
                    <th className="px-3 py-2 border-b border-slate-200">Date</th>
                    <th className="px-3 py-2 border-b border-slate-200">Type</th>
                    <th className="px-3 py-2 border-b border-slate-200">Details / Routes</th>
                    <th className="px-3 py-2 border-b border-slate-200 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDaily.map((dr) => (
                    <tr key={dr.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-700">{formatDate(dr.date)}</td>
                      <td className="px-3 py-2 text-slate-500">{dr.entryType}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {dr.entryType === 'detailed' && dr.routes.length > 0
                          ? dr.routes.map((r) => `${r.location} (${formatPKR(r.amount)})`).join(', ')
                          : dr.details || '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-700">{formatPKR(dailyTotal(dr))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-800">
                    <td className="px-3 py-2" colSpan={3}>TOTAL DUTY</td>
                    <td className="px-3 py-2 text-right">{formatPKR(duty)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Expenses */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Expenses</h2>
            {sortedExpenses.length === 0 ? (
              <p className="text-sm text-slate-400">No expenses for this month.</p>
            ) : (
              <table className="w-full text-sm border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase">
                    <th className="px-3 py-2 border-b border-slate-200">Date</th>
                    <th className="px-3 py-2 border-b border-slate-200">Category</th>
                    <th className="px-3 py-2 border-b border-slate-200">Remarks</th>
                    <th className="px-3 py-2 border-b border-slate-200 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExpenses.map((e) => {
                    const cat = categories.find((c) => c.id === e.categoryId);
                    return (
                      <tr key={e.id} className="border-b border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-700">{formatDate(e.date)}</td>
                        <td className="px-3 py-2 text-slate-600">{cat?.name || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{e.remarks || '—'}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">{formatPKR(e.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-800">
                    <td className="px-3 py-2" colSpan={3}>TOTAL EXPENSES</td>
                    <td className="px-3 py-2 text-right">{formatPKR(expenses)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Final Summary */}
          <div className="border-t-2 border-slate-200 pt-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Final Summary</h2>
            <div className="max-w-sm ml-auto space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">Total Duty</span><span className="font-medium text-slate-800">{formatPKR(duty)}</span></div>
              <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">Company Commission ({settings.commissionRate}%)</span><span className="font-medium text-red-600">−{formatPKR(commission)}</span></div>
              <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-700 font-medium">After Commission</span><span className="font-bold text-slate-800">{formatPKR(afterComm)}</span></div>
              <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">Total Expenses</span><span className="font-medium text-red-600">−{formatPKR(expenses)}</span></div>
              <div className="flex justify-between py-2 bg-sky-50 px-2 rounded"><span className="font-bold text-sky-800">Final Amount</span><span className="font-bold text-sky-800">{formatPKR(final)}</span></div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
