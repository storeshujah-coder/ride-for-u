import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, Car, FileText } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useConfirm } from '@/components/Confirm';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, StatusBadge } from '@/components/ui';
import { ActivityHistory } from '@/components/ActivityHistory';
import { VehicleFormPage } from '@/pages/VehicleFormPage';
import { formatPKR, formatMonth, totalDuty, totalExpenses } from '@/utils/calc';

export function VehicleDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('edit') === '1';
  const { vehicles, drivers, subcontractors, monthlyRecords, deleteVehicle } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();

  const vehicle = vehicles.find((v) => v.id === id);

  if (isEdit) return <VehicleFormPage />;

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Vehicle Not Found" backTo="/vehicles" />
        <Card className="p-8 text-center text-slate-500">This vehicle no longer exists.</Card>
      </div>
    );
  }

  const driver = drivers.find((d) => d.id === vehicle.driverId);
  const owner = vehicle.ownerType === 'Subcontractor'
    ? subcontractors.find((s) => s.id === vehicle.ownerId)?.name || '—'
    : 'Ride for U';

  const vehicleRecords = monthlyRecords
    .filter((r) => r.vehicleId === vehicle.id)
    .sort((a, b) => b.month.localeCompare(a.month));

  const handleDelete = () => {
    confirm({
      title: 'Delete Vehicle',
      message: `Delete ${vehicle.number}? This removes all its monthly records.`,
      onConfirm: () => {
        deleteVehicle(vehicle.id);
        toast(`Vehicle ${vehicle.number} deleted`, 'success');
        navigate('/vehicles');
      },
    });
  };

  const infoRows = [
    { label: 'Vehicle Number', value: vehicle.number },
    { label: 'Vehicle Type', value: vehicle.type },
    { label: 'Owner', value: owner },
    { label: 'Driver', value: driver?.fullName || 'Unassigned' },
    { label: 'Model', value: vehicle.model || '—' },
    { label: 'Status', value: <StatusBadge status={vehicle.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title={vehicle.number}
        subtitle={vehicle.model}
        backTo="/vehicles"
        action={
          <div className="flex gap-2">
            <Link to={`/vehicles/${vehicle.id}?edit=1`}>
              <Button variant="secondary"><Pencil className="w-4 h-4" /> Edit</Button>
            </Link>
            <Button variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4" /> Delete</Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Vehicle Information</h3>
          </div>
          <dl className="space-y-3">
            {infoRows.map((row) => (
              <div key={row.label} className="flex justify-between items-center text-sm">
                <dt className="text-slate-500">{row.label}</dt>
                <dd className="font-medium text-slate-700">{row.value}</dd>
              </div>
            ))}
          </dl>
          {vehicle.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{vehicle.notes}</p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Monthly Records</h3>
            </div>
            <Link to="/monthly-records/add">
              <Button size="sm" variant="secondary">+ New Record</Button>
            </Link>
          </div>
          {vehicleRecords.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No monthly records yet.</p>
          ) : (
            <div className="space-y-2">
              {vehicleRecords.map((r) => (
                <Link
                  key={r.id}
                  to={`/monthly-records/${r.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition"
                >
                  <span className="text-sm font-medium text-slate-700">{formatMonth(r.month)}</span>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Duty: {formatPKR(totalDuty(r))}</p>
                    <p className="text-xs text-slate-400">Expenses: {formatPKR(totalExpenses(r))}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ActivityHistory entity="vehicle" entityId={vehicle.id} />
    </div>
  );
}
