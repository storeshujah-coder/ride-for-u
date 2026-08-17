import { useState } from 'react';
import { Printer, Users } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Select, EmptyState } from '@/components/ui';
import {
  formatPKR, formatMonth, formatDateLong, formatDate,
  totalDuty, commissionAmount, afterCommission,
  generateMonthOptions,
} from '@/utils/calc';

export function SubcontractorReportPage() {
  const { subcontractors, vehicles, monthlyRecords, drivers, settings, categories, getBusinessExpensesForVehicle, getBusinessExpensesForSubcontractor } = useStore();
  const toast = useToast();
  const [subId, setSubId] = useState('');
  const [month, setMonth] = useState(generateMonthOptions(1)[0]);

  const sub = subcontractors.find((s) => s.id === subId);
  const subVehicles = vehicles.filter((v) => v.ownerId === subId);

  const vehicleData = subVehicles.map((v) => {
    const record = monthlyRecords.find((r) => r.vehicleId === v.id && r.month === month);
    const duty = record ? totalDuty(record) : 0;
    const vehExpenses = getBusinessExpensesForVehicle(v.id, month);
    const expenses = vehExpenses.reduce((s, e) => s + e.amount, 0);
    const commission = commissionAmount(duty, settings.commissionRate);
    const afterComm = afterCommission(duty, settings.commissionRate);
    const final = afterComm - expenses;
    const driver = drivers.find((d) => d.id === v.driverId);
    return { vehicle: v, driver, record, duty, expenses, vehExpenses, commission, afterComm, final };
  });

  const subExpenses = subId ? getBusinessExpensesForSubcontractor(subId, month) : [];
  const subExpensesTotal = subExpenses.reduce((s, e) => s + e.amount, 0);

  const totalDutyAll = vehicleData.reduce((s, v) => s + v.duty, 0);
  const totalCommissionAll = vehicleData.reduce((s, v) => s + v.commission, 0);
  const totalVehicleExpensesAll = vehicleData.reduce((s, v) => s + v.expenses, 0);
  const totalExpensesAll = totalVehicleExpensesAll + subExpensesTotal;
  const totalFinalAll = vehicleData.reduce((s, v) => s + v.final, 0) - subExpensesTotal;

  const handlePrint = () => {
    if (!sub) { toast('Select a subcontractor first', 'error'); return; }
    window.print();
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Subcontractor Report"
          backTo="/reports"
          action={<Button variant="secondary" onClick={handlePrint}><Printer className="w-4 h-4" /> Generate PDF</Button>}
        />
      </div>

      <Card className="p-5 mb-6 print:hidden">
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Subcontractor" value={subId} onChange={setSubId}
            options={subcontractors.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Select subcontractor" required />
          <Select label="Month" value={month} onChange={setMonth}
            options={generateMonthOptions(12).map((m) => ({ value: m, label: formatMonth(m) }))} />
        </div>
      </Card>

      {!sub ? (
        <Card className="p-8 print:hidden">
          <EmptyState icon={<Users className="w-10 h-10" />} title="Select a subcontractor" message="Choose a subcontractor and month to view the report." />
        </Card>
      ) : (
        <Card className="p-8 print-area">
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold tracking-wide text-slate-800">RIDE FOR U</h1>
            <p className="text-sm text-slate-500 mt-1">Transport Management System</p>
            <div className="flex justify-center gap-6 mt-3 text-xs text-slate-500">
              <span><strong className="text-slate-700">Report Type:</strong> Subcontractor Report</span>
              <span><strong className="text-slate-700">Month:</strong> {formatMonth(month)}</span>
              <span><strong className="text-slate-700">Generated:</strong> {formatDateLong(new Date().toISOString().slice(0, 10))}</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Subcontractor Information</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-slate-500">Name</p><p className="font-medium text-slate-800">{sub.name}</p></div>
              <div><p className="text-xs text-slate-500">CNIC</p><p className="font-medium text-slate-800">{sub.cnic || '—'}</p></div>
              <div><p className="text-xs text-slate-500">Phone</p><p className="font-medium text-slate-800">{sub.phone || '—'}</p></div>
              <div><p className="text-xs text-slate-500">Vehicles</p><p className="font-medium text-slate-800">{subVehicles.length}</p></div>
            </div>
          </div>

          {subVehicles.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No vehicles assigned to this subcontractor.</p>
          ) : (
            <div className="space-y-5">
              {vehicleData.map((vd) => (
                <div key={vd.vehicle.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-800">{vd.vehicle.number} — {vd.vehicle.type}</h3>
                    <span className="text-xs text-slate-500">Driver: {vd.driver?.fullName || '—'}</span>
                  </div>
                  {!vd.record ? (
                    <p className="text-sm text-slate-400">No record for {formatMonth(month)}.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm mb-3">
                        <div><p className="text-xs text-slate-500">Total Duty</p><p className="font-medium text-slate-800">{formatPKR(vd.duty)}</p></div>
                        <div><p className="text-xs text-slate-500">Commission ({settings.commissionRate}%)</p><p className="font-medium text-red-600">−{formatPKR(vd.commission)}</p></div>
                        <div><p className="text-xs text-slate-500">After Commission</p><p className="font-medium text-slate-800">{formatPKR(vd.afterComm)}</p></div>
                        <div><p className="text-xs text-slate-500">Expenses</p><p className="font-medium text-red-600">−{formatPKR(vd.expenses)}</p></div>
                        <div><p className="text-xs text-slate-500">Final Amount</p><p className="font-bold text-sky-700">{formatPKR(vd.final)}</p></div>
                      </div>
                      {vd.vehExpenses.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-slate-500 mb-1">Vehicle Expenses:</p>
                          <div className="space-y-0.5">
                            {vd.vehExpenses.sort((a, b) => a.date.localeCompare(b.date)).map((e) => {
                              const cat = categories.find((c) => c.id === e.categoryId);
                              return (
                                <div key={e.id} className="text-xs flex justify-between text-slate-500">
                                  <span>{formatDate(e.date)} — {cat?.name || '—'} — {e.remarks || ''}</span>
                                  <span>{formatPKR(e.amount)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {subExpenses.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Subcontractor Direct Expenses</h2>
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
                      {subExpenses.sort((a, b) => a.date.localeCompare(b.date)).map((e) => {
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
                        <td className="px-3 py-2" colSpan={4}>TOTAL SUBCONTRACTOR EXPENSES</td>
                        <td className="px-3 py-2 text-right">{formatPKR(subExpensesTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="border-t-2 border-slate-200 pt-4">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Final Summary</h2>
                <div className="max-w-sm ml-auto space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">Total Duty (All Vehicles)</span><span className="font-medium text-slate-800">{formatPKR(totalDutyAll)}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">Total Commission</span><span className="font-medium text-red-600">−{formatPKR(totalCommissionAll)}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">Vehicle Expenses</span><span className="font-medium text-red-600">−{formatPKR(totalVehicleExpensesAll)}</span></div>
                  {subExpensesTotal > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">Subcontractor Expenses</span><span className="font-medium text-red-600">−{formatPKR(subExpensesTotal)}</span></div>
                  )}
                  <div className="flex justify-between py-2 bg-sky-50 px-2 rounded"><span className="font-bold text-sky-800">Total Final Amount</span><span className="font-bold text-sky-800">{formatPKR(totalFinalAll)}</span></div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
