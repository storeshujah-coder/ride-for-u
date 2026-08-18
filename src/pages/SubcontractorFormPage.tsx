import { useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Input, Select, Textarea } from '@/components/ui';
import type { EntityStatus } from '@/types';

const statuses: EntityStatus[] = ['Active', 'Inactive', 'Maintenance'];

export function SubcontractorFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('edit') === '1' || Boolean(id && searchParams.get('edit'));
  const { subcontractors, addSubcontractor, updateSubcontractor } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const existing = id ? subcontractors.find((s) => s.id === id) : undefined;

  const [name, setName] = useState(existing?.name || '');
  const [cnic, setCnic] = useState(existing?.cnic || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [joiningDate, setJoiningDate] = useState(existing?.joiningDate || '');
  const [status, setStatus] = useState<EntityStatus>(existing?.status || 'Active');
  const [notes, setNotes] = useState(existing?.notes || '');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('Name is required', 'error'); return; }
    const data = {
      name: name.trim(),
      cnic: cnic.trim(),
      phone: phone.trim(),
      address: address.trim(),
      joiningDate,
      status,
      notes: notes.trim(),
    };
    if (isEdit && id) {
      await updateSubcontractor(id, data);
      toast('Subcontractor updated successfully', 'success');
      navigate(`/subcontractors/${id}`);
    } else {
      const s = await addSubcontractor(data);
      toast('Subcontractor added successfully', 'success');
      navigate(`/subcontractors/${s.id}`);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Subcontractor' : 'Add Subcontractor'}
        subtitle={isEdit ? existing?.name : 'Enter subcontractor details'}
        backTo={isEdit ? `/subcontractors/${id}` : '/subcontractors'}
      />

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Name" value={name} onChange={setName} placeholder="Muhammad Rashid" required />
            <Input label="CNIC" value={cnic} onChange={setCnic} placeholder="35202-1234567-1" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Phone" value={phone} onChange={setPhone} placeholder="0300-1234567" />
            <Input label="Joining Date" type="date" value={joiningDate} onChange={setJoiningDate} />
          </div>
          <Input label="Address" value={address} onChange={setAddress} placeholder="Street, Area, City" />
          <Select label="Status" value={status} onChange={(v) => setStatus(v as EntityStatus)}
            options={statuses.map((s) => ({ value: s, label: s }))} />
          <Textarea label="Notes" value={notes} onChange={setNotes} placeholder="Any additional notes..." />

          <div className="flex gap-3 pt-2">
            <Button type="submit">{isEdit ? 'Save Changes' : 'Add Subcontractor'}</Button>
            <Link to={isEdit ? `/subcontractors/${id}` : '/subcontractors'}><Button type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
