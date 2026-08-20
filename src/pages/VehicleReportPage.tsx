import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, FileText, Eye, EyeOff, Percent, Receipt, Building2, Pencil } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Select, EmptyState, Input } from '@/components/ui';
import { Modal } from '@/components/Modal';
import {
  formatPKR, formatMonth, formatDate, formatDateLong, dailyTotal,
  totalDuty, commissionAmount, afterCommission,
  generateMonthOptions, todayMonth,
} from '@/utils/calc';
import type { DailyRecord, DepartmentEntry, BusinessExpense } from '@/types';

export function VehicleReportPage() {
  const {
    vehicles, drivers, subcontractors, monthlyRecords, categories, departments, settings,
    getBusinessExpensesForVehicle, updateDailyRecord, updateDepartmentEntry, updateBusinessExpense,
    getRateForKm, canEditRecord,
  } = useStore();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [vehicleId, setVehicleId] = useState(searchParams.get('vehicle') || '');
  const [month, setMonth] = useState(searchParams.get('month') || todayMonth());
  const [showCommission, setShowCommission] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showDepartments, setShowDepartments] = useState(true);

  // Direct Edit States
  const [editDailyModalOpen, setEditDailyModalOpen] = useState(false);
  const [editDailyId, setEditDailyId] = useState('');
  const [editDailyDate, setEditDailyDate] = useState('');
  const [editDailyKm, setEditDailyKm] = useState('');
  const [editDailyAmount, setEditDailyAmount] = useState('');
  const [editDailyDetails, setEditDailyDetails] = useState('');

  const [editDeptModalOpen, setEditDeptModalOpen] = useState(false);
  const [editDeptEntryId, setEditDeptEntryId] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [editDeptPayment, setEditDeptPayment] = useState('');
  const [editDeptRemarks, setEditDeptRemarks] = useState('');

  const [editExpModalOpen, setEditExpModalOpen] = useState(false);
  const [editExpId, setEditExpId] = useState('');
  const [editExpDate, setEditExpDate] = useState('');
  const [editExpCatId, setEditExpCatId] = useState('');
  const [editExpAmount, setEditExpAmount] = useState('');
  const [editExpRemarks, setEditExpRemarks] = useState('');

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
  const actualExpenses = businessExps.reduce((s, e) => s + e.amount, 0);
  const deptEntries = record?.departments || [];
  const actualDeptPayments = deptEntries.reduce((s, d) => s + (Number(d.payment) || 0), 0);

  const commission = showCommission ? commissionAmount(duty, settings.commissionRate) : 0;
  const expenses = showExpenses ? actualExpenses : 0;
  const afterComm = duty - commission;
  const final = duty - commission - expenses;

  const sortedDaily = record ? [...record.dailyRecords].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const sortedDeptEntries = [...deptEntries];
  const sortedExpenses = [...businessExps].sort((a, b) => a.date.localeCompare(b.date));

  const handlePrint = () => {
    if (!vehicle) { toast('Select a vehicle first', 'error'); return; }
    const prevTitle = document.title;
    document.title = `Vehicle_Report_${vehicle.number.replace(/\s+/g, '_')}_${month}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  const getFinalLabel = () => {
    if (showCommission && showExpenses) return 'Final Net Amount';
    if (!showCommission && !showExpenses) return 'Total Bill Amount';
    if (!showCommission && showExpenses) return 'Total Bill (After Expenses)';
    return 'Net Amount (After Commission)';
  };

  // Direct Edit Handlers
  const openDirectEditDaily = (dr: DailyRecord) => {
    setEditDailyId(dr.id);
    setEditDailyDate(dr.date);
    setEditDailyKm(dr.km ? String(dr.km) : '');
    setEditDailyAmount(String(dr.amount));
    setEditDailyDetails(dr.details || '');
    setEditDailyModalOpen(true);
  };

  const handleDailyKmChange = (kmVal: string) => {
    setEditDailyKm(kmVal);
    const num = Number(kmVal);
    if (!isNaN(num) && num > 0) {
      const autoRate = getRateForKm(num);
      if (autoRate != null) {
        setEditDailyAmount(String(autoRate));
      }
    }
  };

  const handleSaveDirectDaily = async (e: FormEvent) => {
    e.preventDefault();
    if (!record) return;
    const amt = Number(editDailyAmount) || 0;
    if (amt <= 0) { toast('Amount must be greater than 0', 'error'); return; }
    const numKm = Number(editDailyKm) || undefined;
    await updateDailyRecord(record.id, editDailyId, {
      date: editDailyDate,
      km: numKm,
      amount: amt,
      details: editDailyDetails,
    });
    toast('Daily duty entry updated', 'success');
    setEditDailyModalOpen(false);
  };

  const openDirectEditDept = (de: DepartmentEntry) => {
    setEditDeptEntryId(de.id);
    setEditDeptId(de.departmentId);
    setEditDeptPayment(String(de.payment));
    setEditDeptRemarks(de.remarks || '');
    setEditDeptModalOpen(true);
  };

  const handleSaveDirectDept = async (e: FormEvent) => {
    e.preventDefault();
    if (!record) return;
    const pmt = Number(editDeptPayment) || 0;
    if (pmt <= 0) { toast('Payment must be greater than 0', 'error'); return; }
    const deptObj = departments.find((d) => d.id === editDeptId);
    await updateDepartmentEntry(record.id, editDeptEntryId, {
      departmentId: editDeptId,
      departmentName: deptObj?.name || '',
      payment: pmt,
      remarks: editDeptRemarks,
    });
    toast('Department payment updated', 'success');
    setEditDeptModalOpen(false);
  };

  const openDirectEditExp = (e: BusinessExpense) => {
    setEditExpId(e.id);
    setEditExpDate(e.date);
    setEditExpCatId(e.categoryId);
    setEditExpAmount(String(e.amount));
    setEditExpRemarks(e.remarks || '');
    setEditExpModalOpen(true);
  };

  const handleSaveDirectExp = async (e: FormEvent) => {
    e.preventDefault();
    const amt = Number(editExpAmount) || 0;
    if (amt <= 0) { toast('Amount must be greater than 0', 'error'); return; }
    await updateBusinessExpense(editExpId, {
      date: editExpDate,
      categoryId: editExpCatId,
      amount: amt,
      remarks: editExpRemarks,
    });
    toast('Expense updated', 'success');
    setEditExpModalOpen(false);
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Vehicle Report"
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
            label="Vehicle"
            value={vehicleId}
            onChange={setVehicleId}
            options={vehicles.map((v) => ({ value: v.id, label: `${v.number} — ${v.model}` }))}
            placeholder="Select vehicle"
            required
          />
          <Select
            label="Month"
            value={month}
            onChange={setMonth}
            options={generateMonthOptions(12).map((m) => ({ value: m, label: formatMonth(m) }))}
          />
        </div>

        {/* Toggles: Commission, Departments & Expenses */}
        <div className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
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
                  {showCommission ? 'Deducted & Shown' : 'Hidden & Excluded'}
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

          {/* Departments Toggle */}
          <div className="flex items-center justify-between gap-2 bg-slate-50/90 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${showDepartments ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                {showDepartments ? <Building2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  Departments ({deptEntries.length})
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {showDepartments ? 'Shown in Report' : 'Hidden from Report'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDepartments((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border shrink-0 ${
                showDepartments
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300 shadow-sm'
              }`}
            >
              {showDepartments ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showDepartments ? 'Show' : 'Hide'}</span>
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
                  Vehicle Expenses
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {showExpenses ? 'Deducted & Shown' : 'Hidden & Excluded'}
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

      {!vehicle ? (
        <Card className="p-8 print:hidden">
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="Select a vehicle"
            message="Choose a vehicle and month to view the report."
          />
        </Card>
      ) : (
        <Card className="p-8 print-area">
          {/* Report Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold tracking-wide text-slate-800">RIDE FOR U</h1>
            <p className="text-sm text-slate-500 mt-1">Transport Management System</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-3 text-xs text-slate-500">
              <span><strong className="text-slate-700">Report Type:</strong> Vehicle Report</span>
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
                    <th className="px-3 py-2 border-b border-slate-200 text-center w-12 print:hidden">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDaily.map((dr) => (
                    <tr key={dr.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-medium text-slate-700">{formatDate(dr.date)}</td>
                      <td className="px-3 py-2 text-slate-500">{dr.entryType}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {dr.entryType === 'detailed' && dr.routes.length > 0
                          ? dr.routes.map((r) => `${r.location} (${formatPKR(r.amount)})`).join(', ')
                          : dr.details || '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-700">{formatPKR(dailyTotal(dr))}</td>
                      <td className="px-3 py-2 text-center print:hidden">
                        {canEditRecord(dr) && (
                          <button
                            onClick={() => openDirectEditDaily(dr)}
                            className="p-1 rounded-md text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"
                            title="Direct Edit Entry"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-800">
                    <td className="px-3 py-2" colSpan={3}>TOTAL DUTY</td>
                    <td className="px-3 py-2 text-right">{formatPKR(duty)}</td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Departments Portion (Without Date Column) */}
          {showDepartments && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Departments</h2>
              {sortedDeptEntries.length === 0 ? (
                <p className="text-sm text-slate-400">No department entries for this month.</p>
              ) : (
                <table className="w-full text-sm border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase">
                      <th className="px-3 py-2 border-b border-slate-200">Department</th>
                      <th className="px-3 py-2 border-b border-slate-200">Remarks / Details</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Payment</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-center w-12 print:hidden">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDeptEntries.map((de) => {
                      const dept = departments.find((d) => d.id === de.departmentId);
                      return (
                        <tr key={de.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-semibold text-slate-800">{de.departmentName || dept?.name || 'Department'}</td>
                          <td className="px-3 py-2 text-slate-600">{de.remarks || '—'}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-800">{formatPKR(de.payment)}</td>
                          <td className="px-3 py-2 text-center print:hidden">
                            {canEditRecord(de) && (
                              <button
                                onClick={() => openDirectEditDept(de)}
                                className="p-1 rounded-md text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"
                                title="Direct Edit Department Payment"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-slate-800">
                      <td className="px-3 py-2" colSpan={2}>TOTAL DEPARTMENTS PAYMENT</td>
                      <td className="px-3 py-2 text-right">{formatPKR(actualDeptPayments)}</td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}

          {/* Expenses (Only shown if showExpenses is true) */}
          {showExpenses && (
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
                      <th className="px-3 py-2 border-b border-slate-200 text-center w-12 print:hidden">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedExpenses.map((e) => {
                      const cat = categories.find((c) => c.id === e.categoryId);
                      return (
                        <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-medium text-slate-700">{formatDate(e.date)}</td>
                          <td className="px-3 py-2 text-slate-600">{cat?.name || '—'}</td>
                          <td className="px-3 py-2 text-slate-600">{e.remarks || '—'}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-700">{formatPKR(e.amount)}</td>
                          <td className="px-3 py-2 text-center print:hidden">
                            {canEditRecord(e) && (
                              <button
                                onClick={() => openDirectEditExp(e)}
                                className="p-1 rounded-md text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"
                                title="Direct Edit Expense"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-slate-800">
                      <td className="px-3 py-2" colSpan={3}>TOTAL EXPENSES</td>
                      <td className="px-3 py-2 text-right">{formatPKR(actualExpenses)}</td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}

          {/* Final Summary (Only contains active/unhidden lines) */}
          <div className="border-t-2 border-slate-200 pt-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Final Summary</h2>
            <div className="max-w-sm ml-auto space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Total Duty</span>
                <span className="font-medium text-slate-800">{formatPKR(duty)}</span>
              </div>

              {/* Commission lines - ONLY if showCommission is true */}
              {showCommission && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Company Commission ({settings.commissionRate}%)</span>
                    <span className="font-medium text-red-600">−{formatPKR(commission)}</span>
                  </div>
                  {showExpenses && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-700 font-medium">After Commission</span>
                      <span className="font-bold text-slate-800">{formatPKR(afterComm)}</span>
                    </div>
                  )}
                </>
              )}

              {/* Expenses line - ONLY if showExpenses is true */}
              {showExpenses && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Total Expenses</span>
                  <span className="font-medium text-red-600">−{formatPKR(actualExpenses)}</span>
                </div>
              )}

              {/* Final Net Box */}
              <div className={`flex justify-between py-2.5 px-3 rounded-lg ${
                showCommission ? 'bg-sky-50 text-sky-800' : 'bg-emerald-50 text-emerald-800'
              }`}>
                <span className="font-bold">{getFinalLabel()}</span>
                <span className="font-bold text-base">{formatPKR(final)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Direct Edit Daily Duty Modal */}
      <Modal
        open={editDailyModalOpen}
        onClose={() => setEditDailyModalOpen(false)}
        title="Direct Edit Daily Duty Record"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditDailyModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDirectDaily as any}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Date" type="date" value={editDailyDate} onChange={setEditDailyDate} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="KM (Auto Rate)" type="number" value={editDailyKm} onChange={handleDailyKmChange} placeholder="e.g. 75" />
            <Input label="Duty Amount (PKR)" type="number" value={editDailyAmount} onChange={setEditDailyAmount} placeholder="10000" required />
          </div>
          <Input label="Details / Remarks" value={editDailyDetails} onChange={setEditDailyDetails} placeholder="Details" />
        </div>
      </Modal>

      {/* Direct Edit Department Payment Modal */}
      <Modal
        open={editDeptModalOpen}
        onClose={() => setEditDeptModalOpen(false)}
        title="Direct Edit Department Payment"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditDeptModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDirectDept as any}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Department"
            value={editDeptId}
            onChange={setEditDeptId}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Select department"
            required
          />
          <Input
            label="Payment Amount (PKR)"
            type="number"
            value={editDeptPayment}
            onChange={setEditDeptPayment}
            placeholder="15000"
            required
          />
          <Input
            label="Remarks / Details"
            value={editDeptRemarks}
            onChange={setEditDeptRemarks}
            placeholder="e.g. Monthly allocation"
          />
        </div>
      </Modal>

      {/* Direct Edit Expense Modal */}
      <Modal
        open={editExpModalOpen}
        onClose={() => setEditExpModalOpen(false)}
        title="Direct Edit Expense"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditExpModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDirectExp as any}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={editExpDate} onChange={setEditExpDate} required />
            <Select
              label="Category"
              value={editExpCatId}
              onChange={setEditExpCatId}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
              required
            />
          </div>
          <Input label="Amount (PKR)" type="number" value={editExpAmount} onChange={setEditExpAmount} placeholder="5000" required />
          <Input label="Remarks" value={editExpRemarks} onChange={setEditExpRemarks} placeholder="Diesel / Maintenance" />
        </div>
      </Modal>
    </div>
  );
}
