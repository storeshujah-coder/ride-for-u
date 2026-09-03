import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, Settings as SettingsIcon, KeyRound, Lock, Eye, EyeOff, Gauge, Sun, Moon, Sparkles } from 'lucide-react';
import { useStore, DEFAULT_KM_SLABS } from '@/store/StoreContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import { PageHeader, Card, Button, Input } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatPKR } from '@/utils/calc';
import type { KmSlab } from '@/types';

export function SettingsPage() {
  const {
    settings, updateSettings,
    addKmSlab, updateKmSlab, deleteKmSlab,
    updatePassword, currentUser,
  } = useStore();
  const toast = useToast();
  const confirm = useConfirm();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [currency, setCurrency] = useState(settings.currency);
  const [commissionRate, setCommissionRate] = useState(String(settings.commissionRate));
  const [adminName, setAdminName] = useState(settings.adminName);
  const [appearance, setAppearance] = useState(settings.appearance);

  // KM Slabs state
  const [kmModalOpen, setKmModalOpen] = useState(false);
  const [editingKmId, setEditingKmId] = useState<string | null>(null);
  const [slabMinKm, setSlabMinKm] = useState('');
  const [slabMaxKm, setSlabMaxKm] = useState('');
  const [slabRate, setSlabRate] = useState('');
  const [slabDesc, setSlabDesc] = useState('');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const kmSlabs = (settings.kmRates && settings.kmRates.length > 0) ? settings.kmRates : DEFAULT_KM_SLABS;
  const isAutoPricingOn = settings.autoKmPricing !== false;

  const handleToggleAutoPricing = async () => {
    const nextState = !isAutoPricingOn;
    await updateSettings({ autoKmPricing: nextState });
    if (nextState) {
      toast('Auto KM Pricing Enabled (KM ke sath rate automatically lag jayega)', 'success');
    } else {
      toast('Auto KM Pricing Disabled (Ab KM ke sath automatic rate nahi lagega - manual mode)', 'info');
    }
  };

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

  const handleAppearanceChange = async (mode: 'light' | 'dark') => {
    setAppearance(mode);
    await updateSettings({ appearance: mode });
    toast(`Theme changed to ${mode} mode`, 'success');
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

  // KM Slab Handlers
  const openAddKmSlab = () => {
    setEditingKmId(null);
    setSlabMinKm('');
    setSlabMaxKm('');
    setSlabRate('');
    setSlabDesc('');
    setKmModalOpen(true);
  };

  const openEditKmSlab = (slab: KmSlab) => {
    setEditingKmId(slab.id);
    setSlabMinKm(String(slab.minKm));
    setSlabMaxKm(String(slab.maxKm));
    setSlabRate(String(slab.rate));
    setSlabDesc(slab.description || '');
    setKmModalOpen(true);
  };

  const handleKmSlabSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const min = Number(slabMinKm);
    const max = Number(slabMaxKm);
    const rate = Number(slabRate);

    if (isNaN(min) || isNaN(max) || min < 0 || max <= min) {
      toast('Please enter valid Min and Max KM (Max KM must be greater than Min KM)', 'error');
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      toast('Please enter a valid rate amount greater than 0', 'error');
      return;
    }

    const data = {
      minKm: min,
      maxKm: max,
      rate,
      description: slabDesc.trim() || `${min} to ${max} KM`,
    };

    if (editingKmId) {
      await updateKmSlab(editingKmId, data);
      toast('KM slab updated', 'success');
    } else {
      await addKmSlab(data);
      toast('KM slab added', 'success');
    }
    setKmModalOpen(false);
  };

  const handleDeleteKmSlab = (slab: KmSlab) => {
    confirm({
      title: 'Delete KM Slab',
      message: `Delete slab "${slab.minKm} - ${slab.maxKm} KM" (${formatPKR(slab.rate)})?`,
      onConfirm: async () => {
        await deleteKmSlab(slab.id);
        toast('KM slab deleted', 'success');
      },
    });
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your application preferences and KM distance rates" />

      <div className="mb-6">
        {/* General Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <SettingsIcon className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">General Settings</h3>
          </div>
          <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Company Name" value={companyName} onChange={setCompanyName} />
              <Input label="Currency" value={currency} onChange={setCurrency} placeholder="PKR" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Company Commission (%)" type="number" value={commissionRate} onChange={setCommissionRate} placeholder="2.5" />
              <Input label="Admin Name" value={adminName} onChange={setAdminName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Appearance / Theme</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAppearanceChange('light')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
                    appearance === 'light'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Sun className="w-4 h-4" /> Light Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleAppearanceChange('dark')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
                    appearance === 'dark'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Moon className="w-4 h-4" /> Dark Mode
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Toggle between crisp light mode and modern dark mode.</p>
            </div>
            <Button type="submit">Save General Settings</Button>
          </form>
        </Card>
      </div>

      {/* KM Pricing Slabs Section */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Distance / KM Pricing Slabs (کلومیٹر ریٹس)</h3>
              <p className="text-xs text-slate-500">Define payment rates for KM ranges. When enabled, entering KM in bill tables auto-fills the price.</p>
            </div>
          </div>
          <Button size="sm" onClick={openAddKmSlab}><Plus className="w-4 h-4" /> Add KM Slab</Button>
        </div>

        {/* Auto Price Toggle Switch */}
        <div className={`mb-5 p-4 rounded-xl border transition-all ${
          isAutoPricingOn 
            ? 'bg-emerald-50/70 border-emerald-200' 
            : 'bg-amber-50/70 border-amber-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                isAutoPricingOn ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-800">Auto KM Price Calculation (آٹو پرائسنگ)</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isAutoPricingOn 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-500 text-white shadow-xs'
                  }`}>
                    {isAutoPricingOn ? '✓ AUTO ON (فعال)' : '✕ AUTO OFF (بند)'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {isAutoPricingOn ? (
                    <span><strong>ON:</strong> Bill ya duty entry me KM likhne se rate <strong>automatically</strong> slab ke mutabiq lag jayega.</span>
                  ) : (
                    <span><strong>OFF:</strong> KM likhne par automatic price <strong>nahi</strong> lagegi. Aap manually apni marzi se amount likh sakte hain.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleToggleAutoPricing}
                className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                  isAutoPricingOn ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={isAutoPricingOn}
                title={isAutoPricingOn ? 'Click to turn OFF auto-pricing' : 'Click to turn ON auto-pricing'}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAutoPricingOn ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium uppercase tracking-wide border-b border-slate-200">
                <th className="px-4 py-3">KM Range</th>
                <th className="px-4 py-3">Description / Label</th>
                <th className="px-4 py-3 text-right">Fixed Payment / Rate</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kmSlabs.map((slab) => (
                <tr key={slab.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100">
                      {slab.minKm} — {slab.maxKm} KM
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{slab.description || `${slab.minKm} to ${slab.maxKm} KM`}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">{formatPKR(slab.rate)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEditKmSlab(slab)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition" title="Edit Slab"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteKmSlab(slab)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition" title="Delete Slab"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>


      {/* KM Slab Modal */}
      <Modal
        open={kmModalOpen}
        onClose={() => setKmModalOpen(false)}
        title={editingKmId ? 'Edit KM Pricing Slab' : 'Add KM Pricing Slab'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setKmModalOpen(false)}>Cancel</Button>
            <Button onClick={handleKmSlabSubmit as any}>{editingKmId ? 'Save' : 'Add Slab'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min KM"
              type="number"
              value={slabMinKm}
              onChange={setSlabMinKm}
              placeholder="e.g. 50"
              required
            />
            <Input
              label="Max KM"
              type="number"
              value={slabMaxKm}
              onChange={setSlabMaxKm}
              placeholder="e.g. 100"
              required
            />
          </div>
          <Input
            label="Rate / Payment (PKR)"
            type="number"
            value={slabRate}
            onChange={setSlabRate}
            placeholder="e.g. 10000"
            required
          />
          <Input
            label="Description / Label (Optional)"
            value={slabDesc}
            onChange={setSlabDesc}
            placeholder="e.g. 50 to 100 KM Trip Rate"
          />
        </div>
      </Modal>
    </div>
  );
}
