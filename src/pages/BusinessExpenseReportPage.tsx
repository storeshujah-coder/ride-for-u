import { useState, useMemo } from 'react';
import { Printer, Wallet } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Select, EmptyState } from '@/components/ui';
import { formatPKR, formatMonth, formatDateLong, formatDate, generateMonthOptions } from '@/utils/calc';
import type { ExpenseFor } from '@/types';

const expenseForTypes: ExpenseFor[] = ['Vehicle', 'Driver', 'Subcontractor', 'Office', 'Other'];

export function BusinessExpenseReportPage() {
  const { businessExpenses, categories, vehicles, drivers, subcontractors } = useStore();
  const toast = useToast();
  const [month, setMonth] = useState(generateMonthOptions(1)[0]);

  const monthExpenses = useMemo(() => {
    return businessExpenses.filter((e) => e.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));
  }, [businessExpenses, month]);

  const expensesByType = useMemo(() => {
    const map: Record<ExpenseFor, typeof businessExpenses> = {
      Vehicle: [], Driver: [], Subcontractor: [], Office: [], Other: [],
    };
    monthExpenses.forEach((e) => { map[e.expenseFor].push(e); });
    return map;
  }, [monthExpenses]);

  const totalsByType = useMemo(() => {
    const map: Record<ExpenseFor, number> = { Vehicle: 0, Driver: 0, Subcontractor: 0, Office: 0, Other: 0 };
    monthExpenses.forEach((e) => { map[e.expenseFor] += e.amount; });
    return map;
  }, [monthExpenses]);

  const grandTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const getRelatedName = (e: { expenseFor: ExpenseFor; relatedToId: string; relatedToName: string }) => {
    if (e.expenseFor === 'Vehicle') return vehicles.find((v) => v.id === e.relatedToId)?.number || e.relatedToName;
    if (e.expenseFor === 'Driver') return drivers.find((d) => d.id === e.relatedToId)?.fullName || e.relatedToName;
    if (e.expenseFor === 'Subcontractor') return subcontractors.find((s) => s.id === e.relatedToId)?.name || e.relatedToName;
    return e.relatedToName;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Business Expense Report"
          backTo="/reports"
          action={<Button variant="secondary" onClick={handlePrint}><Printer className="w-4 h-4" /> Generate PDF</Button>}
        />
      </div>

      <Card className="p-5 mb-6 print:hidden">
        <Select label="Month" value={month} onChange={setMonth}
          options={generateMonthOptions(12).map((m) => ({ value: m, label: formatMonth(m) }))} />
      </Card>

      <Card className="p-8 print-area">
        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold tracking-wide text-slate-800">RIDE FOR U</h1>
          <p className="text-sm text-slate-500 mt-1">Transport Management System</p>
          <div className="flex justify-center gap-6 mt-3 text-xs text-slate-500">
            <span><strong className="text-slate-700">Report Type:</strong> Business Expense Report</span>
            <span><strong className="text-slate-700">Month:</strong> {formatMonth(month)}</span>
            <span><strong className="text-slate-700">Generated:</strong> {formatDateLong(new Date().toISOString().slice(0, 10))}</span>
          </div>
        </div>

        {monthExpenses.length === 0 ? (
          <EmptyState icon={<Wallet className="w-10 h-10" />} title="No expenses" message={`No business expenses for ${formatMonth(month)}.`} />
        ) : (
          <>
            {/* Summary by type */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Total Business Expenses</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {expenseForTypes.map((type) => (
                  <div key={type} className="border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-500 font-medium">{type} Expenses</p>
                    <p className="text-base font-bold text-slate-800 mt-1">{formatPKR(totalsByType[type])}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{expensesByType[type].length} expense{expensesByType[type].length !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 max-w-xs ml-auto">
                <div className="flex justify-between py-2 bg-sky-50 px-3 rounded">
                  <span className="font-bold text-sky-800">Total</span>
                  <span className="font-bold text-sky-800">{formatPKR(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Detailed table */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">All Expenses — {formatMonth(month)}</h2>
              <table className="w-full text-sm border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase">
                    <th className="px-3 py-2 border-b border-slate-200">Date</th>
                    <th className="px-3 py-2 border-b border-slate-200">Category</th>
                    <th className="px-3 py-2 border-b border-slate-200">Expense For</th>
                    <th className="px-3 py-2 border-b border-slate-200">Related To</th>
                    <th className="px-3 py-2 border-b border-slate-200">Payment Method</th>
                    <th className="px-3 py-2 border-b border-slate-200">Remarks</th>
                    <th className="px-3 py-2 border-b border-slate-200 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {monthExpenses.map((e) => {
                    const cat = categories.find((c) => c.id === e.categoryId);
                    return (
                      <tr key={e.id} className="border-b border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-700">{formatDate(e.date)}</td>
                        <td className="px-3 py-2 text-slate-600">{cat?.name || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{e.expenseFor}</td>
                        <td className="px-3 py-2 text-slate-600">{getRelatedName(e)}</td>
                        <td className="px-3 py-2 text-slate-500">{e.paymentMethod}</td>
                        <td className="px-3 py-2 text-slate-600">{e.remarks || '—'}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">{formatPKR(e.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-800">
                    <td className="px-3 py-2" colSpan={6}>GRAND TOTAL</td>
                    <td className="px-3 py-2 text-right">{formatPKR(grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
