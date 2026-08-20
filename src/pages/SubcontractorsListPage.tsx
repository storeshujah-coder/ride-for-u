import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Building2 } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useConfirm } from '@/components/Confirm';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, StatusBadge, EmptyState } from '@/components/ui';

export function SubcontractorsListPage() {
  const { subcontractors, vehicles, deleteSubcontractor, canEditRecord, canDeleteRecord } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [search, setSearch] = useState('');

  const filtered = subcontractors.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.cnic.includes(search) ||
    s.phone.includes(search)
  );

  const vehicleCount = (subId: string) => vehicles.filter((v) => v.ownerId === subId).length;

  const handleDelete = (id: string, name: string) => {
    confirm({
      title: 'Delete Subcontractor',
      message: `Are you sure you want to delete subcontractor ${name}? Associated vehicles will have their owner reset.`,
      onConfirm: () => {
        deleteSubcontractor(id);
        toast(`Subcontractor ${name} deleted`, 'success');
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Subcontractors"
        subtitle={`${subcontractors.length} subcontractor${subcontractors.length !== 1 ? 's' : ''} total`}
        action={<Link to="/subcontractors/add"><Button><Plus className="w-4 h-4" /> Add Subcontractor</Button></Link>}
      />

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, CNIC, or phone..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-10 h-10" />}
            title="No subcontractors found"
            message={search ? "Try a different search." : "Add your first subcontractor to get started."}
            action={!search && <Link to="/subcontractors/add"><Button><Plus className="w-4 h-4" /> Add Subcontractor</Button></Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">CNIC</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Vehicles</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3"><Link to={`/subcontractors/${s.id}`} className="font-medium text-slate-700 hover:text-sky-600">{s.name}</Link></td>
                    <td className="px-5 py-3 text-slate-600">{s.cnic}</td>
                    <td className="px-5 py-3 text-slate-600">{s.phone}</td>
                    <td className="px-5 py-3 text-slate-600">{vehicleCount(s.id)}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/subcontractors/${s.id}`} className="p-1.5 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition" title="View"><Eye className="w-4 h-4" /></Link>
                        {canEditRecord(s) && (
                          <Link to={`/subcontractors/${s.id}?edit=1`} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition" title="Edit"><Pencil className="w-4 h-4" /></Link>
                        )}
                        {canDeleteRecord(s) && (
                          <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
