import { useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, FileText, Wallet, Route, Zap } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useConfirm } from '@/components/Confirm';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Input, Select, Textarea } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatPKR, formatMonth, formatDate, totalDuty, totalExpenses, dailyTotal, commissionAmount, afterCommission, generateMonthOptions, daysInMonth } from '@/utils/calc';
import type { DailyRecord, RouteEntry } from '@/types';

export function MonthlyRecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    monthlyRecords, vehicles, drivers, categories, settings,
    createMonthlyRecord, addDailyRecord, updateDailyRecord, deleteDailyRecord,
    addExpense, updateExpense, deleteExpense, addCategory, updateCategory, deleteCategory,
  } = useStore();
  const confirm = useConfirm();
  const toast = useToast();

  const record = monthlyRecords.find((r) => r.id === id);
  const [tab, setTab] = useState<'daily' | 'expenses'>('daily');

  // Daily entry modal
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'quick' | 'detailed'>('quick');
  const [editingDaily, setEditingDaily] = useState<DailyRecord | null>(null);
  const [entryDate, setEntryDate] = useState('');
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
    setEntryAmount('');
    setEntryRemarks('');
    setRoutes([]);
    setEntryModalOpen(true);
  };

  const openEditDaily = (dr: DailyRecord) => {
    setEditingDaily(dr);
    setEntryType(dr.entryType);
    setEntryDate(dr.date);
    setEntryAmount(String(dr.amount));
    setEntryRemarks(dr.details);
    setRoutes(dr.routes.map((r) => ({ ...r })));
    setEntryModalOpen(true);
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
    if (entryType === 'quick') {
      const amt = Number(entryAmount) || 0;
      if (amt <= 0) { toast('Amount must be greater than 0', 'error'); return; }
      const data = { date: entryDate, amount: amt, details: entryRemarks, routes: [], entryType: 'quick' as const };
      if (editingDaily) updateDailyRecord(record.id, editingDaily.id, data);
      else addDailyRecord(record.id, data);
    } else {
      if (routes.length === 0) { toast('Add at least one route', 'error'); return; }
      const total = routes.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const data = { date: entryDate, amount: total, details: '', routes, entryType: 'detailed' as const };
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

  const summaryRows = [
    { label: 'Total Duty', value: formatPKR(duty), bold: true },
    { label: `Company Commission (${settings.commissionRate}%)`, value: formatPKR(commission) },
    { label: 'After Commission', value: formatPKR(afterComm), bold: true },
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          onClick={() => setTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'expenses' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Wallet className="w-4 h-4" /> Expenses
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
                          <button onClick={() => openEditDaily(dr)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteDaily(dr)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
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
                            <button onClick={() => openEditExpense(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteExpense(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
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
              <Input label="Amount" type="number" value={entryAmount} onChange={setEntryAmount} placeholder="10000" />
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
                      value={r.amount || ''}
                      onChange={(e) => updateRoute(r.id, { amount: Number(e.target.value) || 0 })}
                      placeholder="3000"
                      className="w-24 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
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
    </div>
  );
}
