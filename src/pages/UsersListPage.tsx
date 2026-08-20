import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, ShieldBan, ShieldCheck, Users as UsersIcon, Crown, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useConfirm } from '@/components/Confirm';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { PageHeader, Card, Button, StatusBadge, EmptyState } from '@/components/ui';
import { ALL_MODULES, MODULE_LABELS, type ModuleKey } from '@/types';

export function UsersListPage() {
  const { users, currentUser, deleteUser, setUserStatus, setUserPassword } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [search, setSearch] = useState('');

  // Password reset modal
  const [pwdTarget, setPwdTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);


  const filtered = useMemo(
    () =>
      users.filter((u) =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  const permissionSummary = (permissions: typeof currentUser extends null ? never : NonNullable<typeof currentUser>['permissions']) => {
    const modules: string[] = [];
    (ALL_MODULES as ModuleKey[]).forEach((m) => {
      const anyPerm =
        permissions[m].view || permissions[m].add || permissions[m].edit || permissions[m].delete;
      if (anyPerm) modules.push(MODULE_LABELS[m]);
    });
    return modules;
  };

  const handleToggleStatus = (id: string, name: string, current: 'Active' | 'Inactive' | 'Maintenance') => {
    const next = current === 'Active' ? 'Inactive' : 'Active';
    confirm({
      title: next === 'Active' ? 'Enable User' : 'Disable User',
      message: `Are you sure you want to ${next === 'Active' ? 'enable' : 'disable'} ${name}?`,
      onConfirm: () => {
        setUserStatus(id, next);
        toast(`User ${next === 'Active' ? 'enabled' : 'disabled'}`, 'success');
      },
    });
  };

  const handleDelete = (id: string, name: string, isSuper: boolean) => {
    if (isSuper) {
      toast('Super Admin cannot be deleted', 'error');
      return;
    }
    confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete user ${name}? This action cannot be undone.`,
      onConfirm: () => {
        deleteUser(id);
        toast(`User ${name} deleted`, 'success');
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${users.length} user${users.length !== 1 ? 's' : ''} total`}
        action={
          <Link to="/users/add">
            <Button>
              <Plus className="w-4 h-4" /> Add User
            </Button>
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
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-10 h-10" />}
            title="No users found"
            message={search ? 'Try a different search.' : 'Add your first staff user.'}
            action={
              !search && (
                <Link to="/users/add">
                  <Button>
                    <Plus className="w-4 h-4" /> Add User
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Permissions</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const isSuper = u.role === 'super_admin';
                  const modules = permissionSummary(u.permissions);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                              isSuper
                                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isSuper ? (
                              <Crown className="w-4 h-4" />
                            ) : (
                              u.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-700">{u.fullName}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isSuper
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isSuper ? <Crown className="w-3 h-3" /> : <UsersIcon className="w-3 h-3" />}
                          {isSuper ? 'Super Admin' : 'Staff'}
                        </span>
                      </td>
                      <td className="px-5 py-3 max-w-sm">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                            <ShieldCheck className="w-3 h-3" /> Full Access
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {modules.length === 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                <ShieldBan className="w-3 h-3" /> No permissions
                              </span>
                            ) : (
                              modules.map((m) => (
                                <span
                                  key={m}
                                  className="inline-flex text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded"
                                >
                                  {m}
                                </span>
                              ))
                            )}
                            {u.canManageOthers && (
                              <span className="inline-flex text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                Can Manage All Records
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200">
                              <Crown className="w-3.5 h-3.5 text-amber-600" /> Protected Super Admin
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setPwdTarget({ id: u.id, name: u.fullName, email: u.email });
                                  setNewPassword('');
                                  setShowPwd(false);
                                }}
                                title="Set / Change Password"
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <Link
                                to={`/users/${u.id}?edit=1`}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"
                                title="Edit User"
                              >
                                <Pencil className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleToggleStatus(u.id, u.fullName, u.status)}
                                title={u.status === 'Active' ? 'Disable' : 'Enable'}
                                className={`p-1.5 rounded-lg transition ${
                                  u.status === 'Active'
                                    ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                                    : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                                }`}
                              >
                                {u.status === 'Active' ? (
                                  <ShieldBan className="w-4 h-4" />
                                ) : (
                                  <ShieldCheck className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(u.id, u.fullName, isSuper)}
                                disabled={isSelf}
                                title="Delete"
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Set / Reset Password Modal */}
      <Modal
        open={Boolean(pwdTarget)}
        onClose={() => setPwdTarget(null)}
        title={`Set Password for ${pwdTarget?.name}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPwdTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!newPassword.trim()) {
                  toast('Please enter a new password', 'error');
                  return;
                }
                if (!pwdTarget) return;
                setPwdLoading(true);
                try {
                  await setUserPassword(pwdTarget.id, newPassword.trim());
                  toast(`Password updated successfully for ${pwdTarget.name}!`, 'success');
                  setPwdTarget(null);
                } catch (err: any) {
                  const msg = err?.message || '';
                  if (msg.includes('schema cache') || msg.includes('admin_set_user_password') || msg.includes('function')) {
                    toast('Please run fix_auth_and_permissions.sql in Supabase SQL Editor to enable direct password setting.', 'error');
                  } else {
                    toast(msg || 'Failed to update password', 'error');
                  }
                } finally {
                  setPwdLoading(false);
                }
              }}
              disabled={pwdLoading}
            >
              {pwdLoading ? 'Saving...' : 'Save Password'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg text-xs text-sky-800">
            <span className="font-semibold block mb-0.5">Account: {pwdTarget?.name} ({pwdTarget?.email})</span>
            Set a new login password directly. The staff user will be able to sign in immediately with this password.
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (e.g. staff123)"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

