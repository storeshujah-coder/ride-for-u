import { useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Input, Select, Textarea } from '@/components/ui';
import type { EntityStatus } from '@/types';

const statuses: EntityStatus[] = ['Active', 'Inactive', 'Maintenance'];

export function DriverFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('edit') === '1' || Boolean(id && searchParams.get('edit'));
  const { drivers, vehicles, addDriver, updateDriver } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const existing = id ? drivers.find((d) => d.id === id) : undefined;

  const [fullName, setFullName] = useState(existing?.fullName || '');
  const [fatherName, setFatherName] = useState(existing?.fatherName || '');
  const [cnic, setCnic] = useState(existing?.cnic || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [license, setLicense] = useState(existing?.license || '');
  const [joiningDate, setJoiningDate] = useState(existing?.joiningDate || '');
  const [vehicleId, setVehicleId] = useState(existing?.vehicleId || '');
  const [status, setStatus] = useState<EntityStatus>(existing?.status || 'Active');
  const [notes, setNotes] = useState(existing?.notes || '');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast('Full name is required', 'error');
      return;
    }
    const data = {
      fullName: fullName.trim(),
      fatherName: fatherName.trim(),
      cnic: cnic.trim(),
      phone: phone.trim(),
      address: address.trim(),
      license: license.trim(),
      joiningDate,
      vehicleId: vehicleId || undefined,
      status,
      notes: notes.trim(),
    };
    if (isEdit && id) {
      await updateDriver(id, data);
      toast('Driver updated successfully', 'success');
      navigate(`/drivers/${id}`);
    } else {
      const d = await addDriver(data);
      toast('Driver added successfully', 'success');
      navigate(`/drivers/${d.id}`);
    }
  };

  const vehicleOptions = vehicles.map((v) => ({ value: v.id, label: `${v.number} — ${v.model}` }));

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Driver' : 'Add Driver'}
        subtitle={isEdit ? existing?.fullName : 'Enter driver details'}
        backTo={isEdit ? `/drivers/${id}` : '/drivers'}
      />

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={fullName} onChange={setFullName} placeholder="Ali Raza" required />
            <Input label="Father Name" value={fatherName} onChange={setFatherName} placeholder="Ghulam Rasool" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="CNIC" value={cnic} onChange={setCnic} placeholder="35202-1234567-1" />
            <Input label="Phone" value={phone} onChange={setPhone} placeholder="0300-1234567" />
          </div>
          <Input label="Address" value={address} onChange={setAddress} placeholder="Street, Area, City" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Driving License" value={license} onChange={setLicense} placeholder="LHR-2021-001" />
            <Input label="Joining Date" type="date" value={joiningDate} onChange={setJoiningDate} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Assigned Vehicle</label>
              <div className="flex gap-2">
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">No vehicle assigned</option>
                  {vehicleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Link to="/vehicles/add"><Button type="button" variant="secondary"><Plus className="w-4 h-4" /></Button></Link>
              </div>
              {vehicles.length === 0 && <p className="text-xs text-slate-400 mt-1">No vehicles yet. Click + to add one.</p>}
            </div>
            <Select label="Status" value={status} onChange={(v) => setStatus(v as EntityStatus)}
              options={statuses.map((s) => ({ value: s, label: s }))} />
          </div>
          <Textarea label="Notes" value={notes} onChange={setNotes} placeholder="Any additional notes..." />

          <div className="flex gap-3 pt-2">
            <Button type="submit">{isEdit ? 'Save Changes' : 'Add Driver'}</Button>
            <Link to={isEdit ? `/drivers/${id}` : '/drivers'}><Button type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
