import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Car } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useConfirm } from '@/components/Confirm';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, StatusBadge, EmptyState } from '@/components/ui';

export function VehiclesListPage() {
  const { vehicles, drivers, subcontractors, deleteVehicle } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = vehicles.filter((v) =>
    v.number.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  );

  const ownerName = (v: typeof vehicles[0]) => {
    if (v.ownerType === 'Ride for U') return 'Ride for U';
    return subcontractors.find((s) => s.id === v.ownerId)?.name || '—';
  };

  const driverName = (v: typeof vehicles[0]) => {
    return drivers.find((d) => d.id === v.driverId)?.fullName || '—';
  };

  const handleDelete = (id: string, number: string) => {
    confirm({
      title: 'Delete Vehicle',
      message: `Are you sure you want to delete vehicle ${number}? This will also remove its monthly records.`,
      onConfirm: () => {
        deleteVehicle(id);
        toast(`Vehicle ${number} deleted`, 'success');
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Vehicles"
        subtitle={`${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} total`}
        action={
          <Link to="/vehicles/add">
            <Button><Plus className="w-4 h-4" /> Add Vehicle</Button>
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by number or model..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Car className="w-10 h-10" />}
            title="No vehicles found"
            message={search ? "Try a different search." : "Add your first vehicle to get started."}
            action={!search && <Link to="/vehicles/add"><Button><Plus className="w-4 h-4" /> Add Vehicle</Button></Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                  <th className="px-5 py-3">Vehicle Number</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3">Model</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3">
                      <Link to={`/vehicles/${v.id}`} className="font-medium text-slate-700 hover:text-sky-600">
                        {v.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{v.type}</td>
                    <td className="px-5 py-3 text-slate-600">{ownerName(v)}</td>
                    <td className="px-5 py-3 text-slate-600">{driverName(v)}</td>
                    <td className="px-5 py-3 text-slate-600">{v.model}</td>
                    <td className="px-5 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/vehicles/${v.id}`} className="p-1.5 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link to={`/vehicles/${v.id}?edit=1`} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(v.id, v.number)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
