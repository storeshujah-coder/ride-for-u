import { useState, useMemo, type FormEvent } from 'react';
import { Plus, Search, Pencil, Trash2, Wallet, Tag, ChevronLeft } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useConfirm } from '@/components/Confirm';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Input, Select, EmptyState } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatPKR, formatDate, formatMonth, generateMonthOptions, todayMonth } from '@/utils/calc';
import type { BusinessExpense, ExpenseFor, PaymentMethod } from '@/types';

const expenseForOptions: ExpenseFor[] = ['Vehicle', 'Driver', 'Subcontractor', 'Office', 'Other'];
const paymentMethodOptions: PaymentMethod[] = ['Cash', 'Bank Transfer', 'Cheque', 'Other'];

export function ExpensesPage() {
  const {
    vehicles, drivers, subcontractors, categories, businessExpenses,
    addBusinessExpense, updateBusinessExpense, deleteBusinessExpense,
    addCategory, updateCategory, deleteCategory,
  } = useStore();
  const confirm = useConfirm();
  const toast = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryMonth, setCategoryMonth] = useState(todayMonth());

  // Filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterFor, setFilterFor] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterSubcontractor, setFilterSubcontractor] = useState('');

  // Expense modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expCategory, setExpCategory] = useState('');
  const [expFor, setExpFor] = useState<ExpenseFor>('Vehicle');
  const [expRelatedId, setExpRelatedId] = useState('');
  const [expRelatedName, setExpRelatedName] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPayment, setExpPayment] = useState<PaymentMethod>('Cash');
  const [expRemarks, setExpRemarks] = useState('');

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [catName, setCatName] = useState('');

  // Category summary cards
  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const catExpenses = businessExpenses.filter((e) => e.categoryId === cat.id);
      const total = catExpenses.reduce((s, e) => s + e.amount, 0);
      return { category: cat, total, count: catExpenses.length };
    });
  }, [categories, businessExpenses]);

  // Filtered expenses for main table
  const filteredExpenses = useMemo(() => {
    return businessExpenses
      .filter((e) => {
        if (filterCategory && e.categoryId !== filterCategory) return false;
        if (filterFor && e.expenseFor !== filterFor) return false;
        if (filterVehicle && !(e.expenseFor === 'Vehicle' && e.relatedToId === filterVehicle)) return false;
        if (filterDriver && !(e.expenseFor === 'Driver' && e.relatedToId === filterDriver)) return false;
        if (filterSubcontractor && !(e.expenseFor === 'Subcontractor' && e.relatedToId === filterSubcontractor)) return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        if (search) {
          const cat = categories.find((c) => c.id === e.categoryId)?.name || '';
          const match =
            cat.toLowerCase().includes(search.toLowerCase()) ||
            e.relatedToName.toLowerCase().includes(search.toLowerCase()) ||
            e.expenseFor.toLowerCase().includes(search.toLowerCase()) ||
            e.remarks.toLowerCase().includes(search.toLowerCase());
          return match;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [businessExpenses, filterCategory, filterFor, filterVehicle, filterDriver, filterSubcontractor, dateFrom, dateTo, search, categories]);

  const totalAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  // Category detail view expenses
  const categoryDetailExpenses = useMemo(() => {
    if (!selectedCategory) return [];
    return businessExpenses
      .filter((e) => e.categoryId === selectedCategory && e.date.startsWith(categoryMonth))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [businessExpenses, selectedCategory, categoryMonth]);

  const categoryDetailTotal = categoryDetailExpenses.reduce((s, e) => s + e.amount, 0);
  const selectedCatName = categories.find((c) => c.id === selectedCategory)?.name || '';

  // Expense form helpers
  const relatedOptions = useMemo(() => {
    if (expFor === 'Vehicle') return vehicles.map((v) => ({ value: v.id, label: v.number }));
    if (expFor === 'Driver') return drivers.map((d) => ({ value: d.id, label: d.fullName }));
    if (expFor === 'Subcontractor') return subcontractors.map((s) => ({ value: s.id, label: s.name }));
    if (expFor === 'Office') return [{ value: 'office', label: 'Head Office' }];
    return [];
  }, [expFor, vehicles, drivers, subcontractors]);

  const openAddExpense = () => {
    setEditingExpenseId(null);
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpCategory(categories[0]?.id || '');
    setExpFor('Vehicle');
    setExpRelatedId('');
    setExpRelatedName('');
    setExpAmount('');
    setExpPayment('Cash');
    setExpRemarks('');
    setExpenseModalOpen(true);
  };

  const openEditExpense = (exp: BusinessExpense) => {
    setEditingExpenseId(exp.id);
    setExpDate(exp.date);
    setExpCategory(exp.categoryId);
    setExpFor(exp.expenseFor);
    setExpRelatedId(exp.relatedToId);
    setExpRelatedName(exp.relatedToName);
    setExpAmount(String(exp.amount));
    setExpPayment(exp.paymentMethod);
    setExpRemarks(exp.remarks);
    setExpenseModalOpen(true);
  };

  const handleExpenseSubmit = (e: FormEvent) => {
    e.preventDefault();
    const amt = Number(expAmount) || 0;
    if (amt <= 0) { toast('Amount must be greater than 0', 'error'); return; }
    if (!expCategory) { toast('Category is required', 'error'); return; }
    let relatedId = expRelatedId;
    let relatedName = expRelatedName;
    if (expFor === 'Vehicle') {
      relatedName = vehicles.find((v) => v.id === relatedId)?.number || relatedName;
    } else if (expFor === 'Driver') {
      relatedName = drivers.find((d) => d.id === relatedId)?.fullName || relatedName;
    } else if (expFor === 'Subcontractor') {
      relatedName = subcontractors.find((s) => s.id === relatedId)?.name || relatedName;
    } else if (expFor === 'Office') {
      relatedId = 'office';
      relatedName = 'Head Office';
    }
    if (expFor !== 'Other' && !relatedId) { toast('Please select a related item', 'error'); return; }
    const data = {
      date: expDate, categoryId: expCategory, expenseFor: expFor,
      relatedToId: relatedId, relatedToName: relatedName,
      amount: amt, paymentMethod: expPayment, remarks: expRemarks,
    };
    if (editingExpenseId) {
      updateBusinessExpense(editingExpenseId, data);
      toast('Expense updated', 'success');
    } else {
      addBusinessExpense(data);
      toast('Expense added', 'success');
    }
    setExpenseModalOpen(false);
  };

  const handleDeleteExpense = (exp: BusinessExpense) => {
    const catName = categories.find((c) => c.id === exp.categoryId)?.name || '';
    confirm({
      title: 'Delete Expense',
      message: `Delete ${catName} expense — ${formatPKR(exp.amount)} for ${exp.relatedToName}?`,
      onConfirm: () => { deleteBusinessExpense(exp.id); toast('Expense deleted', 'success'); },
    });
  };

  // Category handlers
  const openAddCategory = () => { setEditingCat(null); setCatName(''); setCatModalOpen(true); };
  const openEditCategory = (cId: string) => {
    const c = categories.find((x) => x.id === cId);
    if (!c) return;
    setEditingCat(cId); setCatName(c.name); setCatModalOpen(true);
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

  // CATEGORY DETAIL VIEW
  if (selectedCategory) {
    return (
      <div>
        <PageHeader
          title={`${selectedCatName} Expenses`}
          subtitle={`${formatMonth(categoryMonth)} — ${categoryDetailExpenses.length} expense${categoryDetailExpenses.length !== 1 ? 's' : ''}`}
          backTo="/expenses"
          action={
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={categoryMonth}
                onChange={(e) => setCategoryMonth(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <Button onClick={openAddExpense}><Plus className="w-4 h-4" /> Add Expense</Button>
            </div>
          }
        />

        {/* Category Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-xs text-slate-500 font-medium">Category</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{selectedCatName}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500 font-medium">Selected Month</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{formatMonth(categoryMonth)}</p>
          </Card>
          <Card className="p-4 bg-sky-50">
            <p className="text-xs text-sky-600 font-medium">Total Expenses</p>
            <p className="text-lg font-bold text-sky-700 mt-0.5">{formatPKR(categoryDetailTotal)}</p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">{selectedCatName} Expenses — {formatMonth(categoryMonth)}</h3>
          </div>
          {categoryDetailExpenses.length === 0 ? (
            <EmptyState icon={<Wallet className="w-10 h-10" />} title="No expenses" message={`No ${selectedCatName} expenses for ${formatMonth(categoryMonth)}.`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Expense For</th>
                    <th className="px-5 py-3">Related To</th>
                    <th className="px-5 py-3">Payment Method</th>
                    <th className="px-5 py-3">Remarks</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryDetailExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-medium text-slate-700">{formatDate(exp.date)}</td>
                      <td className="px-5 py-3 text-slate-600">{exp.expenseFor}</td>
                      <td className="px-5 py-3 text-slate-600">{exp.relatedToName}</td>
                      <td className="px-5 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{exp.paymentMethod}</span></td>
                      <td className="px-5 py-3 text-slate-600">{exp.remarks || '—'}</td>
                      <td className="px-5 py-3 text-right font-medium text-slate-700">{formatPKR(exp.amount)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditExpense(exp)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteExpense(exp)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold text-slate-800">
                    <td className="px-5 py-3" colSpan={5}>Total {selectedCatName} Expenses</td>
                    <td className="px-5 py-3 text-right">{formatPKR(categoryDetailTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        {renderExpenseModal()}
        {renderCategoryModal()}
      </div>
    );
  }

  // MAIN EXPENSES PAGE
  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`${businessExpenses.length} expense${businessExpenses.length !== 1 ? 's' : ''} total`}
        action={<Button onClick={openAddExpense}><Plus className="w-4 h-4" /> Add Expense</Button>}
      />

      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {categoryStats.map(({ category, total, count }) => (
          <button
            key={category.id}
            onClick={() => { setSelectedCategory(category.id); setCategoryMonth(todayMonth()); }}
            className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-300 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition">
                <Tag className="w-4 h-4 text-sky-600" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{category.name}</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{formatPKR(total)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{count} expense{count !== 1 ? 's' : ''}</p>
          </button>
        ))}
        <button
          onClick={openAddCategory}
          className="text-left bg-white border border-dashed border-slate-300 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50/30 transition flex flex-col items-center justify-center gap-1"
        >
          <Plus className="w-5 h-5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Add Category</span>
        </button>
      </div>

      {/* Main Expense Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 space-y-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
            <select value={filterFor} onChange={(e) => setFilterFor(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
              <option value="">All Types</option>
              {expenseForOptions.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
              <option value="">All Vehicles</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.number}</option>)}
            </select>
            <select value={filterDriver} onChange={(e) => setFilterDriver(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
              <option value="">All Drivers</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
            </select>
            <select value={filterSubcontractor} onChange={(e) => setFilterSubcontractor(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
              <option value="">All Subcontractors</option>
              {subcontractors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Categories management bar */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1"><Tag className="w-3 h-3" /> Categories:</span>
            {categories.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-600">
                {c.name}
                <button onClick={() => openEditCategory(c.id)} className="text-slate-300 hover:text-amber-500"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => handleDeleteCategory(c.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              </span>
            ))}
            <button onClick={openAddCategory} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-sky-50 border border-sky-200 text-xs text-sky-600 hover:bg-sky-100 transition">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-10 h-10" />}
            title="No expenses found"
            message="Add your first expense to get started."
            action={<Button onClick={openAddExpense}><Plus className="w-4 h-4" /> Add Expense</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Expense For</th>
                  <th className="px-5 py-3">Related To</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Payment Method</th>
                  <th className="px-5 py-3">Remarks</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const cat = categories.find((c) => c.id === exp.categoryId);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-medium text-slate-700 whitespace-nowrap">{formatDate(exp.date)}</td>
                      <td className="px-5 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{cat?.name || '—'}</span></td>
                      <td className="px-5 py-3 text-slate-600">{exp.expenseFor}</td>
                      <td className="px-5 py-3 text-slate-600">{exp.relatedToName}</td>
                      <td className="px-5 py-3 text-right font-medium text-slate-700">{formatPKR(exp.amount)}</td>
                      <td className="px-5 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-100">{exp.paymentMethod}</span></td>
                      <td className="px-5 py-3 text-slate-600 max-w-[150px] truncate">{exp.remarks || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditExpense(exp)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteExpense(exp)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-slate-800">
                  <td className="px-5 py-3" colSpan={4}>TOTAL</td>
                  <td className="px-5 py-3 text-right">{formatPKR(totalAmount)}</td>
                  <td className="px-5 py-3" colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {renderExpenseModal()}
      {renderCategoryModal()}
    </div>
  );

  function renderExpenseModal() {
    return (
      <Modal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title={editingExpenseId ? 'Edit Expense' : 'Add Expense'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleExpenseSubmit as any}>{editingExpenseId ? 'Save' : 'Add Expense'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Date" type="date" value={expDate} onChange={setExpDate} required />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Button type="button" variant="secondary" onClick={openAddCategory}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Expense For" value={expFor} onChange={(v) => { setExpFor(v as ExpenseFor); setExpRelatedId(''); setExpRelatedName(''); }}
              options={expenseForOptions.map((f) => ({ value: f, label: f }))} />
            {expFor === 'Other' ? (
              <Input label="Related To (name)" value={expRelatedName} onChange={setExpRelatedName} placeholder="Enter name" />
            ) : (
              <Select label="Related To" value={expRelatedId} onChange={setExpRelatedId}
                options={relatedOptions} placeholder="Select..." />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount" type="number" value={expAmount} onChange={setExpAmount} placeholder="5000" />
            <Select label="Payment Method" value={expPayment} onChange={(v) => setExpPayment(v as PaymentMethod)}
              options={paymentMethodOptions.map((p) => ({ value: p, label: p }))} />
          </div>
          <Input label="Remarks" value={expRemarks} onChange={setExpRemarks} placeholder="Diesel" />
        </div>
      </Modal>
    );
  }

  function renderCategoryModal() {
    return (
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
    );
  }
}
