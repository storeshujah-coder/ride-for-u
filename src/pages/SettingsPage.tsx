import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, Settings as SettingsIcon, Tag, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import { PageHeader, Card, Button, Input } from '@/components/ui';
import { Modal } from '@/components/Modal';

export function SettingsPage() {
  const { settings, updateSettings, categories, addCategory, updateCategory, deleteCategory, updatePassword, currentUser } = useStore();
  const toast = useToast();
  const confirm = useConfirm();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [currency, setCurrency] = useState(settings.currency);
  const [commissionRate, setCommissionRate] = useState(String(settings.commissionRate));
  const [adminName, setAdminName] = useState(settings.adminName);
  const [appearance, setAppearance] = useState(settings.appearance);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [catName, setCatName] = useState('');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await updateSettings({
      companyName: companyName.trim() || 'Ride for U',
      currency: currency.trim() || 'PKR',
      commissionRate: Number(commissionRate) || 0,
      adminName: adminName.trim() || 'Admin',
      appearance,
    });
    toast('Settings saved successfully', 'success');
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast('Password must be at least 6 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }
    setPwdLoading(true);
    try {
      await updatePassword(newPassword);
      toast('Password updated successfully', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast(err?.message || 'Failed to update password', 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  const openAddCategory = () => { setEditingCat(null); setCatName(''); setCatModalOpen(true); };
  const openEditCategory = (cId: string) => {
    const c = categories.find((x) => x.id === cId);
    if (!c) return;
    setEditingCat(cId);
    setCatName(c.name);
    setCatModalOpen(true);
  };
  const handleCategorySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) { toast('Category name is required', 'error'); return; }
    if (editingCat) { await updateCategory(editingCat, catName.trim()); toast('Category updated', 'success'); }
    else { await addCategory(catName.trim()); toast('Category added', 'success'); }
    setCatModalOpen(false);
  };
  const handleDeleteCategory = (cId: string) => {
    const c = categories.find((x) => x.id === cId);
    confirm({
      title: 'Delete Category',
      message: `Delete category "${c?.name}"?`,
      onConfirm: async () => { await deleteCategory(cId); toast('Category deleted', 'success'); },
    });
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your application preferences and security" />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <SettingsIcon className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">General Settings</h3>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <Input label="Company Name" value={companyName} onChange={setCompanyName} />
            <Input label="Currency" value={currency} onChange={setCurrency} placeholder="PKR" />
            <Input label="Company Commission (%)" type="number" value={commissionRate} onChange={setCommissionRate} placeholder="2.5" />
            <Input label="Admin Name" value={adminName} onChange={setAdminName} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Appearance</label>
              <div className="flex gap-2">
                {(['light', 'dark'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAppearance(mode)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition capitalize ${
                      appearance === mode
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">Dark mode is a visual preference only.</p>
            </div>
            <Button type="submit">Save Settings</Button>
          </form>
        </Card>

        <div className="space-y-6">
          {/* Change Password Card */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-semibold text-slate-700">Change Password</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Update password for logged in account ({currentUser?.email || 'admin@rideforu.com'}).
            </p>
            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={pwdLoading}>
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </Card>

          {/* Expense Categories */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Expense Categories</h3>
              </div>
              <Button size="sm" variant="secondary" onClick={openAddCategory}><Plus className="w-4 h-4" /> Add Category</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No categories yet.</p>
              ) : (
                categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                    <span className="text-sm font-medium text-slate-700">{c.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEditCategory(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? 'Edit Category' : 'Add Category'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCatModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCategorySubmit as any}>{editingCat ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <Input label="Category Name" value={catName} onChange={setCatName} placeholder="Fuel" required />
      </Modal>
    </div>
  );
}

