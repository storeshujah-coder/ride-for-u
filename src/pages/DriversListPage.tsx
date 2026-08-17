import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, User } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useConfirm } from '@/components/Confirm';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, StatusBadge, EmptyState } from '@/components/ui';

export function DriversListPage() {
  const { drivers, vehicles, deleteDriver } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [search, setSearch] = useState('');

  const filtered = drivers.filter((d) =>
    d.fullName.toLowerCase().includes(search.toLowerCase()) ||
    d.cnic.includes(search) ||
    d.phone.includes(search)
  );

  const vehicleNumber = (d: typeof drivers[0]) =>
    vehicles.find((v) => v.id === d.vehicleId)?.number || '—';

  const handleDelete = (id: string, name: string) => {
    confirm({
      title: 'Delete Driver',
      message: `Are you sure you want to delete driver ${name}?`,
      onConfirm: () => {
        deleteDriver(id);
        toast(`Driver ${name} deleted`, 'success');
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Drivers"
        subtitle={`${drivers.length} driver${drivers.length !== 1 ? 's' : ''} total`}
        action={<Link to="/drivers/add"><Button><Plus className="w-4 h-4" /> Add Driver</Button></Link>}
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
            icon={<User className="w-10 h-10" />}
            title="No drivers found"
            message={search ? "Try a different search." : "Add your first driver to get started."}
            action={!search && <Link to="/drivers/add"><Button><Plus className="w-4 h-4" /> Add Driver</Button></Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">CNIC</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Assigned Vehicle</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3">
                      <Link to={`/drivers/${d.id}`} className="font-medium text-slate-700 hover:text-sky-600">{d.fullName}</Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{d.cnic}</td>
                    <td className="px-5 py-3 text-slate-600">{d.phone}</td>
                    <td className="px-5 py-3 text-slate-600">{vehicleNumber(d)}</td>
                    <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/drivers/${d.id}`} className="p-1.5 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition"><Eye className="w-4 h-4" /></Link>
                        <Link to={`/drivers/${d.id}?edit=1`} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"><Pencil className="w-4 h-4" /></Link>
                        <button onClick={() => handleDelete(d.id, d.fullName)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
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
