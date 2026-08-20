import { useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, FileText, Wallet, Route, Zap, Building2 } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useConfirm } from '@/components/Confirm';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Input, Select, Textarea } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatPKR, formatMonth, formatDate, totalDuty, totalExpenses, dailyTotal, commissionAmount, afterCommission, generateMonthOptions, daysInMonth } from '@/utils/calc';
import type { DailyRecord, RouteEntry, Department, DepartmentEntry } from '@/types';

export function MonthlyRecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    monthlyRecords, vehicles, drivers, categories, departments, settings,
    createMonthlyRecord, addDailyRecord, updateDailyRecord, deleteDailyRecord,
    addExpense, updateExpense, deleteExpense, addCategory, updateCategory, deleteCategory,
    addDepartment, updateDepartment, deleteDepartment,
    addDepartmentEntry, updateDepartmentEntry, deleteDepartmentEntry,
    getRateForKm, canEditRecord, canDeleteRecord,
  } = useStore();
  const confirm = useConfirm();
  const toast = useToast();

  const record = monthlyRecords.find((r) => r.id === id);
  const [tab, setTab] = useState<'daily' | 'departments' | 'expenses'>('daily');

  // Daily entry modal
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'quick' | 'detailed'>('quick');
  const [editingDaily, setEditingDaily] = useState<DailyRecord | null>(null);
  const [entryDate, setEntryDate] = useState('');
  const [entryKm, setEntryKm] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryRemarks, setEntryRemarks] = useState('');
  const [routes, setRoutes] = useState<RouteEntry[]>([]);

  // Expense modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [expDate, setExpDate] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expRemarks, setExpRemarks] = useState('');

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [catName, setCatName] = useState('');

  // Department modal (manage departments list)
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptNotes, setDeptNotes] = useState('');

  // Department Entry modal (assign payment to department for this bill)
  const [deptEntryModalOpen, setDeptEntryModalOpen] = useState(false);
  const [editingDeptEntry, setEditingDeptEntry] = useState<string | null>(null);
  const [deptEntryDeptId, setDeptEntryDeptId] = useState('');
  const [deptEntryPayment, setDeptEntryPayment] = useState('');
  const [deptEntryRemarks, setDeptEntryRemarks] = useState('');

  if (!record) {
    return (
      <div>
        <PageHeader title="Record Not Found" backTo="/monthly-records" />
        <Card className="p-8 text-center text-slate-500">This monthly record no longer exists.</Card>
      </div>
    );
  }

  const vehicle = vehicles.find((v) => v.id === record.vehicleId);
  const driver = drivers.find((d) => d.id === vehicle?.driverId);
  const duty = totalDuty(record);
  const expenses = totalExpenses(record);
  const commission = commissionAmount(duty, settings.commissionRate);
  const afterComm = afterCommission(duty, settings.commissionRate);
  const final = afterComm - expenses;

  const sortedDaily = [...record.dailyRecords].sort((a, b) => a.date.localeCompare(b.date));
  const sortedExpenses = [...record.expenses].sort((a, b) => a.date.localeCompare(b.date));

  // Daily entry handlers
  const openQuickEntry = () => {
    setEditingDaily(null);
    setEntryType('quick');
    setEntryDate(record.month + '-01');
    setEntryKm('');
    setEntryAmount('');
    setEntryRemarks('');
    setRoutes([]);
    setEntryModalOpen(true);
  };

  const openEditDaily = (dr: DailyRecord) => {
    setEditingDaily(dr);
    setEntryType(dr.entryType);
    setEntryDate(dr.date);
    setEntryKm(dr.km ? String(dr.km) : '');
    setEntryAmount(String(dr.amount));
    setEntryRemarks(dr.details);
    setRoutes(dr.routes.map((r) => ({ ...r })));
    setEntryModalOpen(true);
  };

  const handleEntryKmChange = (kmVal: string) => {
    setEntryKm(kmVal);
    const num = Number(kmVal);
    if (!isNaN(num) && num > 0) {
      const autoRate = getRateForKm(num);
      if (autoRate != null) {
        setEntryAmount(String(autoRate));
      }
    }
  };

  const handleRouteKmChange = (routeId: string, kmVal: string) => {
    const num = Number(kmVal);
    const autoRate = !isNaN(num) && num > 0 ? getRateForKm(num) : null;
    setRoutes((prev) => prev.map((r) => {
      if (r.id !== routeId) return r;
      return {
        ...r,
        km: !isNaN(num) && num > 0 ? num : undefined,
        amount: autoRate != null ? autoRate : r.amount,
      };
    }));
  };

  const addRoute = () => {
    setRoutes((prev) => [...prev, { id: `rt-${Date.now()}-${prev.length}`, location: '', amount: 0 }]);
  };

  const updateRoute = (rid: string, patch: Partial<RouteEntry>) => {
    setRoutes((prev) => prev.map((r) => (r.id === rid ? { ...r, ...patch } : r)));
  };

  const removeRoute = (rid: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== rid));
  };

  const routesTotal = routes.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const handleEntrySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!entryDate) { toast('Date is required', 'error'); return; }
    const numKm = Number(entryKm) || undefined;
    if (entryType === 'quick') {
      const amt = Number(entryAmount) || 0;
      if (amt <= 0) { toast('Amount must be greater than 0', 'error'); return; }
      const data = { date: entryDate, km: numKm, amount: amt, details: entryRemarks, routes: [], entryType: 'quick' as const };
      if (editingDaily) updateDailyRecord(record.id, editingDaily.id, data);
      else addDailyRecord(record.id, data);
    } else {
      if (routes.length === 0) { toast('Add at least one route', 'error'); return; }
      const total = routes.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const data = { date: entryDate, km: numKm, amount: total, details: '', routes, entryType: 'detailed' as const };
      if (editingDaily) updateDailyRecord(record.id, editingDaily.id, data);
      else addDailyRecord(record.id, data);
    }
    toast(editingDaily ? 'Daily entry updated' : 'Daily entry added', 'success');
    setEntryModalOpen(false);
  };

  const handleDeleteDaily = (dr: DailyRecord) => {
    confirm({
      title: 'Delete Daily Entry',
      message: `Delete entry for ${formatDate(dr.date)} — ${formatPKR(dailyTotal(dr))}?`,
      onConfirm: () => { deleteDailyRecord(record.id, dr.id); toast('Daily entry deleted', 'success'); },
    });
  };

  // Expense handlers
  const openAddExpense = () => {
    setEditingExpense(null);
    setExpDate(record.month + '-01');
    setExpCategory(categories[0]?.id || '');
    setExpAmount('');
    setExpRemarks('');
    setExpenseModalOpen(true);
  };

  const openEditExpense = (eId: string) => {
    const exp = record.expenses.find((x) => x.id === eId);
    if (!exp) return;
    setEditingExpense(eId);
    setExpDate(exp.date);
    setExpCategory(exp.categoryId);
    setExpAmount(String(exp.amount));
    setExpRemarks(exp.remarks);
    setExpenseModalOpen(true);
  };

  const handleExpenseSubmit = (e: FormEvent) => {
    e.preventDefault();
    const amt = Number(expAmount) || 0;
    if (amt <= 0) { toast('Amount must be greater than 0', 'error'); return; }
    if (!expCategory) { toast('Category is required', 'error'); return; }
    const data = { date: expDate, categoryId: expCategory, amount: amt, remarks: expRemarks };
    if (editingExpense) updateExpense(record.id, editingExpense, data);
    else addExpense(record.id, data);
    toast(editingExpense ? 'Expense updated' : 'Expense added', 'success');
    setExpenseModalOpen(false);
  };

  const handleDeleteExpense = (eId: string) => {
    const exp = record.expenses.find((x) => x.id === eId);
    const catName = categories.find((c) => c.id === exp?.categoryId)?.name || '';
    confirm({
      title: 'Delete Expense',
      message: `Delete ${catName} expense — ${formatPKR(exp?.amount || 0)}?`,
      onConfirm: () => { deleteExpense(record.id, eId); toast('Expense deleted', 'success'); },
    });
  };

  // Category handlers
  const openAddCategory = () => { setEditingCat(null); setCatName(''); setCatModalOpen(true); };
  const openEditCategory = (cId: string) => {
    const c = categories.find((x) => x.id === cId);
    if (!c) return;
    setEditingCat(cId);
    setCatName(c.name);
    setCatModalOpen(true);
  };
  const handleCategorySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) { toast('Category name is required', 'error'); return; }
    if (editingCat) { updateCategory(editingCat, catName.trim()); toast('Category updated', 'success'); }
    else { addCategory(catName.trim()); toast('Category added', 'success'); }
    setCatModalOpen(false);
  };
  const handleDeleteCategory = (cId: string) => {
    const c = categories.find((x) => x.id === cId);
    confirm({
      title: 'Delete Category',
      message: `Delete category "${c?.name}"?`,
      onConfirm: () => { deleteCategory(cId); toast('Category deleted', 'success'); },
    });
  };

  // Department handlers
  const openAddDepartment = () => { setEditingDept(null); setDeptName(''); setDeptNotes(''); setDeptModalOpen(true); };
  const openEditDepartment = (dId: string) => {
    const d = departments.find((x) => x.id === dId);
    if (!d) return;
    setEditingDept(dId);
    setDeptName(d.name);
    setDeptNotes(d.notes || '');
    setDeptModalOpen(true);
  };
  const handleDepartmentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) { toast('Department name is required', 'error'); return; }
    if (editingDept) {
      await updateDepartment(editingDept, deptName.trim(), deptNotes.trim());
      toast('Department updated', 'success');
    } else {
      await addDepartment(deptName.trim(), deptNotes.trim());
      toast('Department added', 'success');
    }
    setDeptModalOpen(false);
  };
  const handleDeleteDepartment = (dId: string) => {
    const d = departments.find((x) => x.id === dId);
    confirm({
      title: 'Delete Department',
      message: `Delete department "${d?.name}"?`,
      onConfirm: async () => { await deleteDepartment(dId); toast('Department deleted', 'success'); },
    });
  };

  // Department Entry handlers
  const openAddDeptEntry = () => {
    setEditingDeptEntry(null);
    setDeptEntryDeptId(departments[0]?.id || '');
    setDeptEntryPayment('');
    setDeptEntryRemarks('');
    setDeptEntryModalOpen(true);
  };
  const openEditDeptEntry = (entry: DepartmentEntry) => {
    setEditingDeptEntry(entry.id);
    setDeptEntryDeptId(entry.departmentId);
    setDeptEntryPayment(String(entry.payment));
    setDeptEntryRemarks(entry.remarks || '');
    setDeptEntryModalOpen(true);
  };
  const handleDeptEntrySubmit = async (e: FormEvent) => {
    e.preventDefault();
    const pmt = Number(deptEntryPayment) || 0;
    if (pmt <= 0) { toast('Payment amount must be greater than 0', 'error'); return; }
    if (!deptEntryDeptId) { toast('Please select a department', 'error'); return; }
    const deptObj = departments.find((d) => d.id === deptEntryDeptId);
    const data = {
      departmentId: deptEntryDeptId,
      departmentName: deptObj?.name || '',
      payment: pmt,
      remarks: deptEntryRemarks,
    };
    if (editingDeptEntry) {
      await updateDepartmentEntry(record.id, editingDeptEntry, data);
      toast('Department payment updated', 'success');
    } else {
      await addDepartmentEntry(record.id, data);
      toast('Department payment recorded', 'success');
    }
    setDeptEntryModalOpen(false);
  };
  const handleDeleteDeptEntry = (entryId: string) => {
    const entry = (record.departments || []).find((x) => x.id === entryId);
    confirm({
      title: 'Delete Department Payment',
      message: `Delete payment entry for ${entry?.departmentName || 'Department'} (${formatPKR(entry?.payment || 0)})?`,
      onConfirm: async () => {
        await deleteDepartmentEntry(record.id, entryId);
        toast('Department payment entry deleted', 'success');
      },
    });
  };

  const sortedDeptEntries = [...(record.departments || [])];
  const totalDeptPayments = (record.departments || []).reduce((s, d) => s + (Number(d.payment) || 0), 0);

  const summaryRows = [
    { label: 'Total Duty', value: formatPKR(duty), bold: true },
    { label: `Company Commission (${settings.commissionRate}%)`, value: formatPKR(commission) },
    { label: 'After Commission', value: formatPKR(afterComm), bold: true },
    { label: 'Departments Total', value: formatPKR(totalDeptPayments), bold: true },
    { label: 'Total Expenses', value: formatPKR(expenses) },
    { label: 'Final Amount', value: formatPKR(final), bold: true, highlight: true },
  ];

  return (
    <div>
      <PageHeader
        title={`${vehicle?.number || 'Vehicle'} — ${formatMonth(record.month)}`}
        subtitle={driver ? `Driver: ${driver.fullName}` : 'No driver assigned'}
        backTo="/monthly-records"
        action={<Link to={`/reports/vehicle?vehicle=${record.vehicleId}&month=${record.month}`}><Button variant="secondary">View Report</Button></Link>}
      />

      {/* Summary */}
      <Card className="p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {summaryRows.map((row) => (
            <div key={row.label} className={`text-center px-2 py-3 rounded-lg ${row.highlight ? 'bg-sky-50' : ''}`}>
              <p className="text-xs text-slate-500 font-medium">{row.label}</p>
              <p className={`mt-1 ${row.bold ? 'text-base font-bold' : 'text-sm font-medium'} ${row.highlight ? 'text-sky-700' : 'text-slate-800'}`}>{row.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'daily' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText className="w-4 h-4" /> Daily Duty Records
        </button>
        <button
          onClick={() => setTab('departments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'departments' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Building2 className="w-4 h-4" /> Departments ({record.departments?.length || 0})
        </button>
        <button
          onClick={() => setTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'expenses' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Wallet className="w-4 h-4" /> Expenses ({record.expenses.length})
        </button>
      </div>

      {/* Daily Records Tab */}
      {tab === 'daily' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Daily Duty Records</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setEntryType('quick'); openQuickEntry(); }}>
                <Zap className="w-4 h-4" /> Quick Entry
              </Button>
              <Button size="sm" onClick={() => { setEntryType('detailed'); openQuickEntry(); }}>
                <Route className="w-4 h-4" /> Detailed Entry
              </Button>
            </div>
          </div>
          {sortedDaily.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No daily records yet. Add a Quick or Detailed entry.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Details / Routes</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedDaily.map((dr) => (
                    <tr key={dr.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-medium text-slate-700">{formatDate(dr.date)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${dr.entryType === 'quick' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}`}>
                          {dr.entryType === 'quick' ? 'Quick' : 'Detailed'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 max-w-xs">
                        {dr.entryType === 'detailed' && dr.routes.length > 0 ? (
                          <div className="space-y-0.5">
                            {dr.routes.map((r) => (
                              <div key={r.id} className="text-xs flex justify-between">
                                <span>{r.location}</span>
                                <span className="text-slate-500">{formatPKR(r.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ) : dr.details || '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-700">{formatPKR(dailyTotal(dr))}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canEditRecord(dr) && (
                            <button onClick={() => openEditDaily(dr)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition" title="Edit Entry"><Pencil className="w-4 h-4" /></button>
                          )}
                          {canDeleteRecord(dr) && (
                            <button onClick={() => handleDeleteDaily(dr)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition" title="Delete Entry"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold text-slate-800">
                    <td className="px-5 py-3" colSpan={3}>TOTAL DUTY</td>
                    <td className="px-5 py-3 text-right">{formatPKR(duty)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Departments Tab */}
      {tab === 'departments' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Department Payments</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage departments and assign payments to departments for this monthly bill</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={openAddDepartment}><Plus className="w-4 h-4" /> Department</Button>
              <Button size="sm" onClick={openAddDeptEntry}><Plus className="w-4 h-4" /> Record Payment</Button>
            </div>
          </div>

          {/* Departments list bar */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Departments:</span>
              {departments.map((d) => (
                <span key={d.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-700 font-medium shadow-xs">
                  <Building2 className="w-3 h-3 text-sky-600" />
                  {d.name}
                  <button onClick={() => openEditDepartment(d.id)} className="text-slate-300 hover:text-amber-500 transition ml-0.5" title="Edit Department"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDeleteDepartment(d.id)} className="text-slate-300 hover:text-red-500 transition" title="Delete Department"><Trash2 className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>

          {sortedDeptEntries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No department payments recorded for this month. Click "Record Payment" to add.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Remarks / Details</th>
                    <th className="px-5 py-3 text-right">Payment</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedDeptEntries.map((de) => {
                    const dept = departments.find((d) => d.id === de.departmentId);
                    return (
                      <tr key={de.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                            <Building2 className="w-3 h-3" />
                            {de.departmentName || dept?.name || 'Department'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{de.remarks || '—'}</td>
                        <td className="px-5 py-3 text-right font-medium text-slate-800">{formatPKR(de.payment)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {canEditRecord(de) && (
                              <button onClick={() => openEditDeptEntry(de)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition" title="Edit Entry"><Pencil className="w-4 h-4" /></button>
                            )}
                            {canDeleteRecord(de) && (
                              <button onClick={() => handleDeleteDeptEntry(de.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition" title="Delete Entry"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-800">
                    <td className="px-5 py-3" colSpan={2}>TOTAL DEPARTMENTS PAYMENT</td>
                    <td className="px-5 py-3 text-right">{formatPKR(totalDeptPayments)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Expenses</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={openAddCategory}><Plus className="w-4 h-4" /> Category</Button>
              <Button size="sm" onClick={openAddExpense}><Plus className="w-4 h-4" /> Add Expense</Button>
            </div>
          </div>

          {/* Categories list */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Categories:</span>
              {categories.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-600">
                  {c.name}
                  <button onClick={() => openEditCategory(c.id)} className="text-slate-300 hover:text-amber-500"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDeleteCategory(c.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>

          {sortedExpenses.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No expenses yet. Add an expense to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Remarks</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedExpenses.map((e) => {
                    const cat = categories.find((c) => c.id === e.categoryId);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3 font-medium text-slate-700">{formatDate(e.date)}</td>
                        <td className="px-5 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{cat?.name || '—'}</span></td>
                        <td className="px-5 py-3 text-slate-600">{e.remarks || '—'}</td>
                        <td className="px-5 py-3 text-right font-medium text-slate-700">{formatPKR(e.amount)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {canEditRecord(e) && (
                              <button onClick={() => openEditExpense(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition" title="Edit Expense"><Pencil className="w-4 h-4" /></button>
                            )}
                            {canDeleteRecord(e) && (
                              <button onClick={() => handleDeleteExpense(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition" title="Delete Expense"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold text-slate-800">
                    <td className="px-5 py-3" colSpan={3}>TOTAL EXPENSES</td>
                    <td className="px-5 py-3 text-right">{formatPKR(expenses)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Daily Entry Modal */}
      <Modal
        open={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        title={editingDaily ? `Edit ${entryType === 'quick' ? 'Quick' : 'Detailed'} Entry` : `New ${entryType === 'quick' ? 'Quick' : 'Detailed'} Entry`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEntryModalOpen(false)}>Cancel</Button>
            <Button onClick={handleEntrySubmit as any}>{editingDaily ? 'Save' : 'Add Entry'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Date" type="date" value={entryDate} onChange={setEntryDate} required />
          {entryType === 'quick' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input label="KM (Auto Rate)" type="number" value={entryKm} onChange={handleEntryKmChange} placeholder="e.g. 75" />
                <Input label="Amount (PKR)" type="number" value={entryAmount} onChange={setEntryAmount} placeholder="10000" required />
              </div>
              <Input label="Remarks" value={entryRemarks} onChange={setEntryRemarks} placeholder="Full Day Duty" />
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Routes</label>
                <Button type="button" size="sm" variant="secondary" onClick={addRoute}><Plus className="w-4 h-4" /> Add Route</Button>
              </div>
              <div className="space-y-2">
                {routes.map((r) => (
                  <div key={r.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={r.location}
                      onChange={(e) => updateRoute(r.id, { location: e.target.value })}
                      placeholder="Factory → DHA"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                    <input
                      type="number"
                      value={r.km || ''}
                      onChange={(e) => handleRouteKmChange(r.id, e.target.value)}
                      placeholder="KM"
                      className="w-20 px-3 py-2 rounded-lg border border-sky-200 bg-sky-50/40 text-xs font-semibold text-sky-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      title="Enter KM for auto rate"
                    />
                    <input
                      type="number"
                      value={r.amount || ''}
                      onChange={(e) => updateRoute(r.id, { amount: Number(e.target.value) || 0 })}
                      placeholder="3000"
                      className="w-24 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                    />
                    <button onClick={() => removeRoute(r.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {routes.length === 0 && <p className="text-sm text-slate-400 text-center py-2">No routes added yet.</p>}
              </div>
              {routes.length > 0 && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-slate-50 flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Total</span>
                  <span className="font-bold text-slate-700">{formatPKR(routesTotal)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Expense Modal */}
      <Modal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleExpenseSubmit as any}>{editingExpense ? 'Save' : 'Add Expense'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={expDate} onChange={setExpDate} required />
            <Select label="Category" value={expCategory} onChange={setExpCategory}
              options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select category" required />
          </div>
          <Input label="Amount" type="number" value={expAmount} onChange={setExpAmount} placeholder="5000" />
          <Input label="Remarks" value={expRemarks} onChange={setExpRemarks} placeholder="Diesel" />
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? 'Edit Category' : 'Add Category'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCatModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCategorySubmit as any}>{editingCat ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <Input label="Category Name" value={catName} onChange={setCatName} placeholder="Fuel" required />
      </Modal>

      {/* Department Modal (Manage Department Name) */}
      <Modal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Add Department'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeptModalOpen(false)}>Cancel</Button>
            <Button onClick={handleDepartmentSubmit as any}>{editingDept ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Department Name" value={deptName} onChange={setDeptName} placeholder="e.g. Accounts, Operations, HR" required />
          <Input label="Notes (Optional)" value={deptNotes} onChange={setDeptNotes} placeholder="Optional description" />
        </div>
      </Modal>

      {/* Department Payment Entry Modal */}
      <Modal
        open={deptEntryModalOpen}
        onClose={() => setDeptEntryModalOpen(false)}
        title={editingDeptEntry ? 'Edit Department Payment' : 'Record Department Payment'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeptEntryModalOpen(false)}>Cancel</Button>
            <Button onClick={handleDeptEntrySubmit as any}>{editingDeptEntry ? 'Save' : 'Record Payment'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Department"
            value={deptEntryDeptId}
            onChange={setDeptEntryDeptId}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Select department"
            required
          />
          <Input
            label="Payment Amount (PKR)"
            type="number"
            value={deptEntryPayment}
            onChange={setDeptEntryPayment}
            placeholder="15000"
            required
          />
          <Input
            label="Remarks / Details"
            value={deptEntryRemarks}
            onChange={setDeptEntryRemarks}
            placeholder="e.g. Monthly allocation / Department duty payment"
          />
        </div>
      </Modal>
    </div>
  );
}
