import { useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, User, Plus, Wallet } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useConfirm } from '@/components/Confirm';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, StatusBadge, Input, Select } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { ActivityHistory } from '@/components/ActivityHistory';
import { DriverFormPage } from '@/pages/DriverFormPage';
import { formatPKR, formatMonth, salaryRemaining, generateMonthOptions, formatDateLong } from '@/utils/calc';
import type { SalaryRecord } from '@/types';

export function DriverDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('edit') === '1';
  const { drivers, vehicles, salaries, deleteDriver, addSalary, updateSalary, deleteSalary, canEditRecord, canDeleteRecord } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryRecord | null>(null);
  const [salMonth, setSalMonth] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [salaryDate, setSalaryDate] = useState('');
  const [remarks, setRemarks] = useState('');

  if (isEdit) return <DriverFormPage />;

  const driver = drivers.find((d) => d.id === id);

  if (!driver) {
    return (
      <div>
        <PageHeader title="Driver Not Found" backTo="/drivers" />
        <Card className="p-8 text-center text-slate-500">This driver no longer exists.</Card>
      </div>
    );
  }

  const vehicle = vehicles.find((v) => v.id === driver.vehicleId);
  const driverSalaries = salaries.filter((s) => s.driverId === driver.id).sort((a, b) => b.month.localeCompare(a.month));
  const totalRemaining = driverSalaries.reduce((s, r) => s + salaryRemaining(r.monthlySalary, r.paidAmount), 0);

  const handleDelete = () => {
    confirm({
      title: 'Delete Driver',
      message: `Delete ${driver.fullName}? This removes all salary records.`,
      onConfirm: () => {
        deleteDriver(driver.id);
        toast(`Driver ${driver.fullName} deleted`, 'success');
        navigate('/drivers');
      },
    });
  };

  const openAddSalary = () => {
    setEditingSalary(null);
    setSalMonth(generateMonthOptions(1)[0]);
    setMonthlySalary('');
    setPaidAmount('');
    setSalaryDate(new Date().toISOString().slice(0, 10));
    setRemarks('');
    setModalOpen(true);
  };

  const openEditSalary = (s: SalaryRecord) => {
    setEditingSalary(s);
    setSalMonth(s.month);
    setMonthlySalary(String(s.monthlySalary));
    setPaidAmount(String(s.paidAmount));
    setSalaryDate(s.salaryDate);
    setRemarks(s.remarks);
    setModalOpen(true);
  };

  const handleSalarySubmit = (e: FormEvent) => {
    e.preventDefault();
    const ms = Number(monthlySalary) || 0;
    const pa = Number(paidAmount) || 0;
    if (!salMonth) { toast('Month is required', 'error'); return; }
    const data = { driverId: driver.id, month: salMonth, monthlySalary: ms, paidAmount: pa, salaryDate, remarks };
    if (editingSalary) {
      updateSalary(editingSalary.id, data);
      toast('Salary record updated', 'success');
    } else {
      addSalary(data);
      toast('Salary record added', 'success');
    }
    setModalOpen(false);
  };

  const handleSalaryDelete = (s: SalaryRecord) => {
    confirm({
      title: 'Delete Salary Record',
      message: `Delete salary record for ${formatMonth(s.month)}?`,
      onConfirm: () => { deleteSalary(s.id); toast('Salary record deleted', 'success'); },
    });
  };

  const infoRows = [
    { label: 'Full Name', value: driver.fullName },
    { label: 'Father Name', value: driver.fatherName || '—' },
    { label: 'CNIC', value: driver.cnic || '—' },
    { label: 'Phone', value: driver.phone || '—' },
    { label: 'Address', value: driver.address || '—' },
    { label: 'License', value: driver.license || '—' },
    { label: 'Joining Date', value: driver.joiningDate ? formatDateLong(driver.joiningDate) : '—' },
    { label: 'Assigned Vehicle', value: vehicle ? <Link to={`/vehicles/${vehicle.id}`} className="text-sky-600 hover:underline">{vehicle.number}</Link> : 'Unassigned' },
    { label: 'Status', value: <StatusBadge status={driver.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title={driver.fullName}
        subtitle={driver.phone}
        backTo="/drivers"
        action={
          <div className="flex gap-2">
            {canEditRecord(driver) && (
              <Link to={`/drivers/${driver.id}?edit=1`}><Button variant="secondary"><Pencil className="w-4 h-4" /> Edit</Button></Link>
            )}
            {canDeleteRecord(driver) && (
              <Button variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4" /> Delete</Button>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Driver Information</h3>
          </div>
          <dl className="space-y-3">
            {infoRows.map((row) => (
              <div key={row.label} className="flex justify-between items-center text-sm gap-4">
                <dt className="text-slate-500 flex-shrink-0">{row.label}</dt>
                <dd className="font-medium text-slate-700 text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
          {driver.notes && <div className="mt-4 pt-4 border-t border-slate-100"><p className="text-xs text-slate-500 mb-1">Notes</p><p className="text-sm text-slate-700">{driver.notes}</p></div>}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Salary Records</h3>
            </div>
            <Button size="sm" onClick={openAddSalary}><Plus className="w-4 h-4" /> Add Salary</Button>
          </div>
          {driverSalaries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No salary records yet.</p>
          ) : (
            <>
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 flex justify-between items-center text-sm">
                <span className="text-amber-700 font-medium">Total Remaining Salary</span>
                <span className="font-bold text-amber-700">{formatPKR(totalRemaining)}</span>
              </div>
              <div className="space-y-2">
                {driverSalaries.map((s) => {
                  const remaining = salaryRemaining(s.monthlySalary, s.paidAmount);
                  return (
                    <div key={s.id} className="border border-slate-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{formatMonth(s.month)}</span>
                        <div className="flex gap-1">
                          {canEditRecord(s) && (
                            <button onClick={() => openEditSalary(s)} className="p-1 rounded text-slate-400 hover:bg-amber-50 hover:text-amber-600" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                          )}
                          {canDeleteRecord(s) && (
                            <button onClick={() => handleSalaryDelete(s)} className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-slate-500">Salary:</span><span className="text-slate-700">{formatPKR(s.monthlySalary)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Paid:</span><span className="text-emerald-600">{formatPKR(s.paidAmount)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Remaining:</span><span className={remaining > 0 ? 'text-red-600 font-medium' : 'text-slate-700'}>{formatPKR(remaining)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Date:</span><span className="text-slate-700">{formatDateLong(s.salaryDate)}</span></div>
                      </div>
                      {s.remarks && <p className="text-xs text-slate-400 mt-2 italic">{s.remarks}</p>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      <ActivityHistory entity="driver" entityId={driver.id} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSalary ? 'Edit Salary Record' : 'Add Salary Record'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSalarySubmit as any}>{editingSalary ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Month" value={salMonth} onChange={setSalMonth}
            options={generateMonthOptions(12).map((m) => ({ value: m, label: formatMonth(m) }))} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monthly Salary" type="number" value={monthlySalary} onChange={setMonthlySalary} placeholder="35000" />
            <Input label="Paid Amount" type="number" value={paidAmount} onChange={setPaidAmount} placeholder="20000" />
          </div>
          <Input label="Salary Date" type="date" value={salaryDate} onChange={setSalaryDate} />
          <Input label="Remarks" value={remarks} onChange={setRemarks} placeholder="Partial payment..." />
          {monthlySalary && paidAmount && (
            <div className="px-3 py-2 rounded-lg bg-slate-50 flex justify-between text-sm">
              <span className="text-slate-500">Remaining Amount</span>
              <span className="font-bold text-slate-700">{formatPKR((Number(monthlySalary) || 0) - (Number(paidAmount) || 0))}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
