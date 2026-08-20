import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, Users, Car, FileText } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useConfirm } from '@/components/Confirm';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, StatusBadge } from '@/components/ui';
import { ActivityHistory } from '@/components/ActivityHistory';
import { SubcontractorFormPage } from '@/pages/SubcontractorFormPage';
import { formatPKR, formatMonth, totalDuty, totalExpenses } from '@/utils/calc';

export function SubcontractorDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('edit') === '1';
  const { subcontractors, vehicles, monthlyRecords, deleteSubcontractor, canEditRecord, canDeleteRecord } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();

  if (isEdit) return <SubcontractorFormPage />;

  const sub = subcontractors.find((s) => s.id === id);

  if (!sub) {
    return (
      <div>
        <PageHeader title="Subcontractor Not Found" backTo="/subcontractors" />
        <Card className="p-8 text-center text-slate-500">This subcontractor no longer exists.</Card>
      </div>
    );
  }

  const subVehicles = vehicles.filter((v) => v.ownerId === sub.id);
  const subRecords = monthlyRecords.filter((r) => subVehicles.some((v) => v.id === r.vehicleId));

  const handleDelete = () => {
    confirm({
      title: 'Delete Subcontractor',
      message: `Delete ${sub.name}? Their vehicles will revert to Ride for U ownership.`,
      onConfirm: () => { deleteSubcontractor(sub.id); toast(`Subcontractor ${sub.name} deleted`, 'success'); navigate('/subcontractors'); },
    });
  };

  const infoRows = [
    { label: 'Name', value: sub.name },
    { label: 'CNIC', value: sub.cnic || '—' },
    { label: 'Phone', value: sub.phone || '—' },
    { label: 'Address', value: sub.address || '—' },
    { label: 'Joining Date', value: sub.joiningDate || '—' },
    { label: 'Status', value: <StatusBadge status={sub.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title={sub.name}
        subtitle={`${subVehicles.length} vehicle${subVehicles.length !== 1 ? 's' : ''}`}
        backTo="/subcontractors"
        action={
          <div className="flex gap-2">
            {canEditRecord(sub) && (
              <Link to={`/subcontractors/${sub.id}?edit=1`}><Button variant="secondary"><Pencil className="w-4 h-4" /> Edit</Button></Link>
            )}
            {canDeleteRecord(sub) && (
              <Button variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4" /> Delete</Button>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Basic Information</h3>
          </div>
          <dl className="space-y-3">
            {infoRows.map((row) => (
              <div key={row.label} className="flex justify-between items-center text-sm gap-4">
                <dt className="text-slate-500 flex-shrink-0">{row.label}</dt>
                <dd className="font-medium text-slate-700 text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
          {sub.notes && <div className="mt-4 pt-4 border-t border-slate-100"><p className="text-xs text-slate-500 mb-1">Notes</p><p className="text-sm text-slate-700">{sub.notes}</p></div>}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Vehicles</h3>
          </div>
          {subVehicles.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No vehicles assigned to this subcontractor.</p>
          ) : (
            <div className="space-y-2">
              {subVehicles.map((v) => (
                <Link key={v.id} to={`/vehicles/${v.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                  <span className="text-sm font-medium text-slate-700">{v.number}</span>
                  <span className="text-xs text-slate-500">{v.type} — {v.model}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Monthly Vehicle Records</h3>
        </div>
        {subRecords.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No monthly records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                  <th className="px-4 py-2.5">Vehicle</th>
                  <th className="px-4 py-2.5">Month</th>
                  <th className="px-4 py-2.5 text-right">Total Duty</th>
                  <th className="px-4 py-2.5 text-right">Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subRecords.sort((a, b) => b.month.localeCompare(a.month)).map((r) => {
                  const v = subVehicles.find((x) => x.id === r.vehicleId);
                  return (
                    <tr key={r.id} onClick={() => navigate(`/monthly-records/${r.id}`)} className="hover:bg-slate-50 cursor-pointer transition">
                      <td className="px-4 py-2.5 font-medium text-slate-700">{v?.number || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{formatMonth(r.month)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-700">{formatPKR(totalDuty(r))}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{formatPKR(totalExpenses(r))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ActivityHistory entity="subcontractor" entityId={sub.id} />
    </div>
  );
}
