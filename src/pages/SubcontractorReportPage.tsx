import { useState } from 'react';
import { Printer, Users, Eye, EyeOff, Percent, Receipt } from 'lucide-react';
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
  const [showCommission, setShowCommission] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);

  const sub = subcontractors.find((s) => s.id === subId);
  const subVehicles = vehicles.filter((v) => v.ownerId === subId);

  const vehicleData = subVehicles.map((v) => {
    const record = monthlyRecords.find((r) => r.vehicleId === v.id && r.month === month);
    const duty = record ? totalDuty(record) : 0;
    const vehExpenses = getBusinessExpensesForVehicle(v.id, month);
    const actualExpenses = vehExpenses.reduce((s, e) => s + e.amount, 0);
    const commission = showCommission ? commissionAmount(duty, settings.commissionRate) : 0;
    const expenses = showExpenses ? actualExpenses : 0;
    const afterComm = duty - commission;
    const final = duty - commission - expenses;
    const driver = drivers.find((d) => d.id === v.driverId);
    return { vehicle: v, driver, record, duty, actualExpenses, expenses, vehExpenses, commission, afterComm, final };
  });

  const subExpenses = subId ? getBusinessExpensesForSubcontractor(subId, month) : [];
  const subExpensesTotal = showExpenses ? subExpenses.reduce((s, e) => s + e.amount, 0) : 0;

  const totalDutyAll = vehicleData.reduce((s, v) => s + v.duty, 0);
  const totalCommissionAll = vehicleData.reduce((s, v) => s + v.commission, 0);
  const totalVehicleExpensesAll = vehicleData.reduce((s, v) => s + v.expenses, 0);
  const totalExpensesAll = totalVehicleExpensesAll + subExpensesTotal;
  const totalFinalAll = totalDutyAll - totalCommissionAll - totalExpensesAll;

  const handlePrint = () => {
    if (!sub) { toast('Select a subcontractor first', 'error'); return; }
    const prevTitle = document.title;
    document.title = `Subcontractor_Report_${sub.name.replace(/\s+/g, '_')}_${month}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  const getFinalLabel = () => {
    if (showCommission && showExpenses) return 'Total Final Net Amount';
    if (!showCommission && !showExpenses) return 'Total Bill Amount';
    if (!showCommission && showExpenses) return 'Total Bill (After Expenses)';
    return 'Net Amount (After Commission)';
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Subcontractor Report"
          backTo="/reports"
          action={
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4" /> Generate PDF / Print
            </Button>
          }
        />
      </div>

      <Card className="p-5 mb-6 print:hidden">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <Select
            label="Subcontractor"
            value={subId}
            onChange={setSubId}
            options={subcontractors.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Select subcontractor"
            required
          />
          <Select
            label="Month"
            value={month}
            onChange={setMonth}
            options={generateMonthOptions(12).map((m) => ({ value: m, label: formatMonth(m) }))}
          />
        </div>

        {/* Toggles: Commission & Expenses */}
        <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          {/* Commission Toggle */}
          <div className="flex items-center justify-between gap-2 bg-slate-50/90 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${showCommission ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-500'}`}>
                {showCommission ? <Percent className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  Commission ({settings.commissionRate}%)
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {showCommission ? 'Deducted & Shown in Summary' : 'Hidden & Excluded'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCommission((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border shrink-0 ${
                showCommission
                  ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300 shadow-sm'
              }`}
            >
              {showCommission ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showCommission ? 'Show' : 'Hide'}</span>
            </button>
          </div>

          {/* Expenses Toggle */}
          <div className="flex items-center justify-between gap-2 bg-slate-50/90 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${showExpenses ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                {showExpenses ? <Receipt className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  Expenses
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {showExpenses ? 'Deducted & Shown in Report' : 'Hidden & Excluded'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowExpenses((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border shrink-0 ${
                showExpenses
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300 shadow-sm'
              }`}
            >
              {showExpenses ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showExpenses ? 'Show' : 'Hide'}</span>
            </button>
          </div>
        </div>
      </Card>

      {!sub ? (
        <Card className="p-8 print:hidden">
          <EmptyState
            icon={<Users className="w-10 h-10" />}
            title="Select a subcontractor"
            message="Choose a subcontractor and month to view the report."
          />
        </Card>
      ) : (
        <Card className="p-8 print-area">
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold tracking-wide text-slate-800">RIDE FOR U</h1>
            <p className="text-sm text-slate-500 mt-1">Transport Management System</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-3 text-xs text-slate-500">
              <span><strong className="text-slate-700">Report Type:</strong> Subcontractor Report</span>
              <span><strong className="text-slate-700">Month:</strong> {formatMonth(month)}</span>
              {showCommission && (
                <span>
                  <strong className="text-slate-700">Commission:</strong>{' '}
                  <span className="text-sky-700 font-semibold">{settings.commissionRate}%</span>
                </span>
              )}
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
                      <div className="grid grid-cols-2 sm:grid-cols-auto gap-3 text-sm mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                        <div><p className="text-xs text-slate-500">Total Duty</p><p className="font-medium text-slate-800">{formatPKR(vd.duty)}</p></div>
                        {showCommission && (
                          <>
                            <div><p className="text-xs text-slate-500">Commission ({settings.commissionRate}%)</p><p className="font-medium text-red-600">−{formatPKR(vd.commission)}</p></div>
                            {showExpenses && <div><p className="text-xs text-slate-500">After Commission</p><p className="font-medium text-slate-800">{formatPKR(vd.afterComm)}</p></div>}
                          </>
                        )}
                        {showExpenses && (
                          <div><p className="text-xs text-slate-500">Expenses</p><p className="font-medium text-red-600">−{formatPKR(vd.actualExpenses)}</p></div>
                        )}
                        <div>
                          <p className="text-xs text-slate-500">
                            {showCommission && showExpenses ? 'Final Amount' : 'Net Vehicle Bill'}
                          </p>
                          <p className="font-bold text-sky-700">{formatPKR(vd.final)}</p>
                        </div>
                      </div>

                      {showExpenses && vd.vehExpenses.length > 0 && (
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

              {showExpenses && subExpenses.length > 0 && (
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

              {/* Final Summary (Only contains active/unhidden rows) */}
              <div className="border-t-2 border-slate-200 pt-4">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Final Summary</h2>
                <div className="max-w-sm ml-auto space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Total Duty (All Vehicles)</span>
                    <span className="font-medium text-slate-800">{formatPKR(totalDutyAll)}</span>
                  </div>

                  {showCommission && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Total Commission ({settings.commissionRate}%)</span>
                      <span className="font-medium text-red-600">−{formatPKR(totalCommissionAll)}</span>
                    </div>
                  )}

                  {showExpenses && (
                    <>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">Vehicle Expenses</span>
                        <span className="font-medium text-red-600">−{formatPKR(totalVehicleExpensesAll)}</span>
                      </div>
                      {subExpensesTotal > 0 && (
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-600">Subcontractor Expenses</span>
                          <span className="font-medium text-red-600">−{formatPKR(subExpensesTotal)}</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className={`flex justify-between py-2.5 px-3 rounded-lg ${
                    showCommission ? 'bg-sky-50 text-sky-800' : 'bg-emerald-50 text-emerald-800'
                  }`}>
                    <span className="font-bold">{getFinalLabel()}</span>
                    <span className="font-bold text-base">{formatPKR(totalFinalAll)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}


