import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Save, Check, ShieldCheck, Shield, LayoutDashboard, Car, User, Users, FileText, Wallet, BarChart3, Settings, Crown } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { PageHeader, Card, Button, Input, Select } from '@/components/ui';
import {
  ALL_MODULES,
  MODULE_LABELS,
  emptyPermissions,
  superAdminPermissions,
  type ModuleKey,
  type PermissionAction,
  type PermissionSet,
  type EntityStatus,
  type UserRole,
} from '@/types';

const statuses: EntityStatus[] = ['Active', 'Inactive'];

const MODULE_ICONS: Record<ModuleKey, typeof Car> = {
  dashboard: LayoutDashboard,
  vehicles: Car,
  drivers: User,
  subcontractors: Users,
  monthlyRecords: FileText,
  expenses: Wallet,
  reports: BarChart3,
  settings: Settings,
  users: Shield,
};

function clonePerms(p: PermissionSet): PermissionSet {
  return ALL_MODULES.reduce((acc, m) => {
    acc[m] = { ...p[m] };
    return acc;
  }, {} as PermissionSet);
}

export function UserFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('edit') === '1' && Boolean(id);
  const { users, addUser, updateUser, updateUserPermissions } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const existing = id ? users.find((u) => u.id === id) : undefined;
  const isSuperAdmin = existing?.role === 'super_admin';

  const [fullName, setFullName] = useState(existing?.fullName || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(existing?.role || 'staff');
  const [status, setStatus] = useState<EntityStatus>(existing?.status || 'Active');
  const [canManageOthers, setCanManageOthers] = useState<boolean>(Boolean(existing?.canManageOthers));
  const [permissions, setPermissions] = useState<PermissionSet>(
    existing ? clonePerms(existing.permissions) : emptyPermissions()
  );

  useEffect(() => {
    if (isSuperAdmin) {
      toast('Super Admin is protected and cannot be edited.', 'error');
      navigate('/users');
    }
  }, [isSuperAdmin, navigate, toast]);

  if (isSuperAdmin) {
    return (
      <div>
        <PageHeader title="Protected Account" backTo="/users" />
        <Card className="p-8 text-center text-slate-600">
          Super Admin account is protected and cannot be modified from the user management panel.
        </Card>
      </div>
    );
  }

  const toggleAction = (module: ModuleKey, action: PermissionAction, val: boolean) => {
    setPermissions((prev) => {
      const next = clonePerms(prev);
      next[module][action] = val;
      if (action !== 'view' && val && !next[module].view) next[module].view = true;
      if (action === 'view' && !val) {
        next[module].add = false;
        next[module].edit = false;
        next[module].delete = false;
      }
      return next;
    });
  };

  const setModuleAll = (module: ModuleKey, val: boolean) => {
    setPermissions((prev) => {
      const next = clonePerms(prev);
      next[module] = { view: val, add: val, edit: val, delete: val };
      return next;
    });
  };

  const setAllModules = (val: boolean) => {
    setPermissions(
      ALL_MODULES.reduce((acc, m) => {
        acc[m] = { view: val, add: val, edit: val, delete: val };
        return acc;
      }, {} as PermissionSet)
    );
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast('Name and email are required', 'error');
      return;
    }
    if (!isEdit && !password.trim()) {
      toast('Password is required for new users', 'error');
      return;
    }
    if (email && !email.includes('@')) {
      toast('Please enter a valid email', 'error');
      return;
    }
    const finalPerms = role === 'super_admin' ? superAdminPermissions() : permissions;

    setSubmitting(true);
    try {
      if (!isEdit) {
        const u = await addUser({
          fullName: fullName.trim(),
          email: email.trim(),
          password: password,
          role,
          status,
          permissions: finalPerms,
          canManageOthers: role === 'staff' ? canManageOthers : false,
        });
        toast('User created successfully!', 'success');
        navigate('/users');
        return;
      }

      if (existing && id) {
        await updateUser(id, {
          fullName: fullName.trim(),
          email: email.trim(),
          role,
          status,
          canManageOthers: role === 'staff' ? canManageOthers : false,
          ...(password.trim() ? { password } : {}),
        });
        await updateUserPermissions(id, finalPerms);
        toast('User updated successfully!', 'success');
        navigate('/users');
      }
    } catch (err: any) {
      console.error('User save error:', err);
      toast(err?.message || 'Failed to save user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit User' : 'Add User'}
        subtitle={isEdit ? existing?.fullName : 'Create a new staff user'}
        backTo="/users"
      />

      <form onSubmit={handleSubmit}>
        <Card className="p-6 mb-6 max-w-3xl">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Account Details</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <Input label="Full Name" value={fullName} onChange={setFullName} placeholder="Ahmed Khan" required />
            <Input label="Email" value={email} onChange={setEmail} placeholder="ahmed@rideforu.com" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <Input
              label={isEdit ? 'Password (leave blank to keep current)' : 'Password'}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />
            <Select
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as EntityStatus)}
              options={statuses.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div className="grid sm:grid-cols-1 gap-4">
            <div>
              <Select
                label="Role"
                value={role}
                onChange={(v) => setRole(v as UserRole)}
                options={[
                  { value: 'staff', label: 'Staff User' },
                  { value: 'super_admin', label: 'Super Admin' },
                ]}
                required
              />
              {role === 'super_admin' && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 mt-1.5 px-2 py-1 rounded flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Super Admin has full access to all modules automatically.
                </p>
              )}
            </div>
          </div>

          {role === 'staff' && (
            <div className="mt-5 p-4 rounded-xl border border-sky-100 bg-sky-50/60 flex items-start gap-3">
              <div className="pt-0.5">
                <input
                  id="canManageOthers"
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  checked={canManageOthers}
                  onChange={(e) => setCanManageOthers(e.target.checked)}
                />
              </div>
              <label htmlFor="canManageOthers" className="cursor-pointer select-none">
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  Can manage other staff records
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  {canManageOthers
                    ? 'ON — This user can edit and delete bills/records created by any staff member.'
                    : 'OFF — This user can only edit and delete bills/records they created themselves.'}
                </span>
              </label>
            </div>
          )}
        </Card>

        {role === 'staff' && (
          <Card className="p-6 mb-6 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Permissions</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tick the actions each user can perform on each module
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllModules(true)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition hover:text-slate-800"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setAllModules(false)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition hover:text-slate-800"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 font-medium uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-semibold">Module</th>
                    <th className="px-3 py-3 text-center font-semibold">
                      <label className="inline-flex items-center justify-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          checked={ALL_MODULES.every((m) => permissions[m].view)}
                          onChange={(e) =>
                            setPermissions((prev) => {
                              const val = e.target.checked;
                              const next = clonePerms(prev);
                              ALL_MODULES.forEach((m) => (next[m].view = val));
                              return next;
                            })
                          }
                        />
                        View
                      </label>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      <label className="inline-flex items-center justify-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          checked={ALL_MODULES.every((m) => permissions[m].add)}
                          onChange={(e) =>
                            setPermissions((prev) => {
                              const val = e.target.checked;
                              const next = clonePerms(prev);
                              ALL_MODULES.forEach((m) => {
                                next[m].add = val;
                                if (val) next[m].view = true;
                              });
                              return next;
                            })
                          }
                        />
                        Add
                      </label>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      <label className="inline-flex items-center justify-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          checked={ALL_MODULES.every((m) => permissions[m].edit)}
                          onChange={(e) =>
                            setPermissions((prev) => {
                              const val = e.target.checked;
                              const next = clonePerms(prev);
                              ALL_MODULES.forEach((m) => {
                                next[m].edit = val;
                                if (val) next[m].view = true;
                              });
                              return next;
                            })
                          }
                        />
                        Edit
                      </label>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      <label className="inline-flex items-center justify-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          checked={ALL_MODULES.every((m) => permissions[m].delete)}
                          onChange={(e) =>
                            setPermissions((prev) => {
                              const val = e.target.checked;
                              const next = clonePerms(prev);
                              ALL_MODULES.forEach((m) => {
                                next[m].delete = val;
                                if (val) next[m].view = true;
                              });
                              return next;
                            })
                          }
                        />
                        Delete
                      </label>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold w-28">All</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ALL_MODULES.map((m) => {
                    const Icon = MODULE_ICONS[m];
                    const p = permissions[m];
                    const allChecked = p.view && p.add && p.edit && p.delete;
                    return (
                      <tr key={m} className="hover:bg-slate-50/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-slate-700">{MODULE_LABELS[m]}</span>
                          </div>
                        </td>
                        {(['view', 'add', 'edit', 'delete'] as PermissionAction[]).map((a) => (
                          <td key={a} className="px-3 py-3 text-center">
                            <label className="inline-flex items-center justify-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                checked={p[a]}
                                onChange={(e) => toggleAction(m, a, e.target.checked)}
                              />
                            </label>
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setModuleAll(m, !allChecked)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                              allChecked
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {allChecked ? <Check className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                            {allChecked ? 'On' : 'Toggle'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link to="/users">
            <Button variant="secondary" disabled={submitting}>Cancel</Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create User')}
          </Button>
        </div>
      </form>
    </div>
  );
}
