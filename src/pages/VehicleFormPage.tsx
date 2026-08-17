import { useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Input, Select, Textarea } from '@/components/ui';
import type { Vehicle, VehicleType, OwnerType, EntityStatus } from '@/types';

const vehicleTypes: VehicleType[] = ['Car', 'Pickup', 'Shahzore'];
const statuses: EntityStatus[] = ['Active', 'Inactive', 'Maintenance'];

export function VehicleFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const { vehicles, drivers, subcontractors, addVehicle, updateVehicle } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const existing = isEdit ? vehicles.find((v) => v.id === id) : undefined;

  const [number, setNumber] = useState(existing?.number || '');
  const [type, setType] = useState<VehicleType>(existing?.type || 'Car');
  const [ownerType, setOwnerType] = useState<OwnerType>(existing?.ownerType || 'Ride for U');
  const [ownerId, setOwnerId] = useState(existing?.ownerId || '');
  const [driverId, setDriverId] = useState(existing?.driverId || '');
  const [model, setModel] = useState(existing?.model || '');
  const [status, setStatus] = useState<EntityStatus>(existing?.status || 'Active');
  const [notes, setNotes] = useState(existing?.notes || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!number.trim()) {
      toast('Vehicle number is required', 'error');
      return;
    }
    const data = {
      number: number.trim().toUpperCase(),
      type,
      ownerType,
      ownerId: ownerType === 'Subcontractor' ? ownerId : undefined,
      driverId: driverId || undefined,
      model: model.trim(),
      status,
      notes: notes.trim(),
    };
    if (isEdit && id) {
      updateVehicle(id, data);
      toast('Vehicle updated successfully', 'success');
      navigate(`/vehicles/${id}`);
    } else {
      const v = addVehicle(data);
      toast('Vehicle added successfully', 'success');
      navigate(`/vehicles/${v.id}`);
    }
  };

  const driverOptions = drivers.map((d) => ({ value: d.id, label: d.fullName }));
  const subcontractorOptions = subcontractors.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
        subtitle={isEdit ? existing?.number : 'Enter vehicle details'}
        backTo={isEdit ? `/vehicles/${id}` : '/vehicles'}
      />

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Vehicle Number" value={number} onChange={setNumber} placeholder="LEA-1234" required />
            <Select label="Vehicle Type" value={type} onChange={(v) => setType(v as VehicleType)}
              options={vehicleTypes.map((t) => ({ value: t, label: t }))} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Owner Type" value={ownerType} onChange={(v) => setOwnerType(v as OwnerType)}
              options={[{ value: 'Ride for U', label: 'Ride for U' }, { value: 'Subcontractor', label: 'Subcontractor' }]} />
            {ownerType === 'Subcontractor' && (
              <Select label="Subcontractor" value={ownerId} onChange={setOwnerId}
                options={subcontractorOptions} placeholder="Select subcontractor" required />
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Driver</label>
              <div className="flex gap-2">
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">No driver assigned</option>
                  {driverOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Link to="/drivers/add">
                  <Button type="button" variant="secondary" size="md"><Plus className="w-4 h-4" /></Button>
                </Link>
              </div>
              {drivers.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">No drivers yet. Click + to add one.</p>
              )}
            </div>
            <Input label="Model" value={model} onChange={setModel} placeholder="Suzuki Bolan 2022" />
          </div>

          <Select label="Status" value={status} onChange={(v) => setStatus(v as EntityStatus)}
            options={statuses.map((s) => ({ value: s, label: s }))} />

          <Textarea label="Notes" value={notes} onChange={setNotes} placeholder="Any additional notes..." />

          <div className="flex gap-3 pt-2">
            <Button type="submit">{isEdit ? 'Save Changes' : 'Add Vehicle'}</Button>
            <Link to={isEdit ? `/vehicles/${id}` : '/vehicles'}>
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
