import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useStore } from '@/store/StoreContext';
import { Modal } from '@/components/Modal';
import { Button, Input } from '@/components/ui';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const { login, resetPasswordForEmail } = useStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast('Please enter email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user) {
        sessionStorage.setItem('rfu-auth', 'true');
        toast(`Welcome, ${user.fullName}`, 'success');
        navigate('/dashboard');
      } else {
        toast('Invalid email or password', 'error');
      }
    } catch (err: any) {
      toast(err?.message || 'Login failed. Please check your Supabase connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast('Please enter your email address', 'error');
      return;
    }
    setResetLoading(true);
    try {
      await resetPasswordForEmail(resetEmail.trim());
      toast('Password reset link has been sent to your email address.', 'success');
      setForgotOpen(false);
      setResetEmail('');
    } catch (err: any) {
      toast(err?.message || 'Failed to send password reset email.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-600/20 mb-4">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Ride for U</h1>
          <p className="text-sm text-slate-500 mt-1">Transport Management System</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rideforu.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email.trim());
                    setForgotOpen(true);
                  }}
                  className="text-xs text-sky-600 hover:text-sky-700 hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition disabled:opacity-60 shadow-sm"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Forgot Password"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForgotOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword as any} disabled={resetLoading}>
              {resetLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleResetPassword} className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-sky-50 border border-sky-100 rounded-lg text-sky-800 text-xs mb-3">
            <KeyRound className="w-5 h-5 shrink-0 text-sky-600" />
            <span>Enter your registered account email. We'll send you a password reset link to create a new password.</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="admin@rideforu.com"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

