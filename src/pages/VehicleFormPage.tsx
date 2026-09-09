import { useState, useMemo, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Input, Select, SearchableSelect, Textarea } from '@/components/ui';
import type { VehicleType, OwnerType, EntityStatus } from '@/types';

const vehicleTypes: VehicleType[] = ['Car', 'Pickup', 'Shahzore'];
const statuses: EntityStatus[] = ['Active', 'Inactive', 'Maintenance'];

export function VehicleFormPage() {
  const { id } = useParams();
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

  // Check if the vehicle number already exists
  const normalizedInput = number.trim().toUpperCase().replace(/\s+/g, '');
  const duplicateVehicle = useMemo(() => {
    if (!normalizedInput) return null;
    return vehicles.find(
      (v) =>
        (!isEdit || v.id !== id) &&
        v.number.trim().toUpperCase().replace(/\s+/g, '') === normalizedInput
    );
  }, [vehicles, normalizedInput, isEdit, id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!number.trim()) {
      toast('Vehicle number is required', 'error');
      return;
    }

    if (duplicateVehicle) {
      toast(`Vehicle number "${duplicateVehicle.number}" already exists! Please use a unique vehicle number.`, 'error');
      return;
    }

    if (ownerType === 'Subcontractor' && !ownerId) {
      toast('Please select a subcontractor', 'error');
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

    try {
      if (isEdit && id) {
        await updateVehicle(id, data);
        toast('Vehicle updated successfully', 'success');
        navigate(`/vehicles/${id}`);
      } else {
        const v = await addVehicle(data);
        toast('Vehicle added successfully', 'success');
        navigate(`/vehicles/${v.id}`);
      }
    } catch (err: any) {
      toast(err?.message || 'Failed to save vehicle', 'error');
    }
  };

  const subcontractorOptions = useMemo(() => {
    return subcontractors.map((s) => ({
      value: s.id,
      label: s.name,
      phone: s.phone,
      cnic: s.cnic,
      badge: s.status,
    }));
  }, [subcontractors]);

  const driverOptions = useMemo(() => {
    return drivers.map((d) => ({
      value: d.id,
      label: d.fullName,
      phone: d.phone,
      cnic: d.cnic,
      badge: d.status,
    }));
  }, [drivers]);

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
            <div>
              <Input
                label="Vehicle Number"
                value={number}
                onChange={setNumber}
                placeholder="LEA-1234"
                required
                error={duplicateVehicle ? 'This vehicle already exists in the system!' : undefined}
              />
              {duplicateVehicle && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2.5 animate-fadeIn shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-700">Vehicle already exists!</p>
                    <p className="mt-0.5 text-red-600 leading-relaxed">
                      Vehicle with number <span className="font-mono font-bold text-red-800">{duplicateVehicle.number}</span> already exists ({duplicateVehicle.model || duplicateVehicle.type}, {duplicateVehicle.ownerType}).
                    </p>
                    <Link
                      to={`/vehicles/${duplicateVehicle.id}`}
                      target="_blank"
                      className="inline-block mt-1 text-sky-700 hover:text-sky-900 font-semibold underline"
                    >
                      View existing vehicle →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Select
              label="Vehicle Type"
              value={type}
              onChange={(v) => setType(v as VehicleType)}
              options={vehicleTypes.map((t) => ({ value: t, label: t }))}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Owner Type"
              value={ownerType}
              onChange={(v) => {
                const nextType = v as OwnerType;
                setOwnerType(nextType);
                if (nextType === 'Ride for U') setOwnerId('');
              }}
              options={[
                { value: 'Ride for U', label: 'Ride for U' },
                { value: 'Subcontractor', label: 'Subcontractor' },
              ]}
            />
            {ownerType === 'Subcontractor' && (
              <SearchableSelect
                label="Subcontractor"
                value={ownerId}
                onChange={setOwnerId}
                options={subcontractorOptions}
                placeholder="Search or select subcontractor..."
                searchPlaceholder="Type subcontractor name, phone, CNIC..."
                required
                addLink="/subcontractors/add"
                addLabel="Add Subcontractor"
                emptyText="No subcontractors found matching your search."
              />
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <SearchableSelect
              label="Driver"
              value={driverId}
              onChange={setDriverId}
              options={driverOptions}
              placeholder="Select driver (optional)..."
              searchPlaceholder="Type driver name, phone, CNIC..."
              addLink="/drivers/add"
              addLabel="Add Driver"
              emptyText="No drivers found"
            />
            <Input label="Model" value={model} onChange={setModel} placeholder="Suzuki Bolan 2022" />
          </div>

          <Select
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as EntityStatus)}
            options={statuses.map((s) => ({ value: s, label: s }))}
          />

          <Textarea label="Notes" value={notes} onChange={setNotes} placeholder="Any additional notes..." />

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={Boolean(duplicateVehicle)}>
              {isEdit ? 'Save Changes' : 'Add Vehicle'}
            </Button>
            <Link to={isEdit ? `/vehicles/${id}` : '/vehicles'}>
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
