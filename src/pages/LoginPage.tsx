import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useStore } from '@/store/StoreContext';
import { Modal } from '@/components/Modal';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password modal state (3-step verification flow)
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP, 3: New Password
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const { login, resetPasswordForEmail, updatePassword } = useStore();

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

  const openForgotModal = () => {
    setResetEmail(email.trim());
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotStep(1);
    setForgotOpen(true);
  };

  // Step 1: Send Verification Code to Email
  const handleSendCode = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      toast('Please enter a valid email address', 'error');
      return;
    }
    setResetLoading(true);
    try {
      await resetPasswordForEmail(resetEmail.trim());
      toast('Verification code sent to your email! Please check inbox / spam.', 'success');
      setForgotStep(2);
    } catch (err: any) {
      toast(err?.message || 'Failed to send verification code.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Verify OTP / Code
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const cleanToken = otpCode.trim();
    if (!cleanToken || cleanToken.length < 4) {
      toast('Please enter the verification code sent to your email', 'error');
      return;
    }
    setResetLoading(true);
    try {
      // 1. Try verify with type 'recovery'
      let { data, error } = await supabase.auth.verifyOtp({
        email: resetEmail.trim(),
        token: cleanToken,
        type: 'recovery',
      });

      // 2. Fallback try with type 'email' if recovery token type fails
      if (error) {
        const fallback = await supabase.auth.verifyOtp({
          email: resetEmail.trim(),
          token: cleanToken,
          type: 'email',
        });
        if (!fallback.error) {
          data = fallback.data;
          error = null;
        }
      }

      if (error) {
        throw new Error(error.message || 'Invalid or expired verification code');
      }

      toast('Code verified successfully! Please enter your new password.', 'success');
      setForgotStep(3);
    } catch (err: any) {
      toast(err?.message || 'Invalid or expired verification code.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 3: Save New Password
  const handleSaveNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast('Password must be at least 6 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }
    setResetLoading(true);
    try {
      await updatePassword(newPassword.trim());
      toast('Password reset successfully! You can now log in.', 'success');
      setEmail(resetEmail.trim());
      setPassword(newPassword.trim());
      setForgotOpen(false);
    } catch (err: any) {
      toast(err?.message || 'Failed to update password.', 'error');
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
                  placeholder="mijaztransport1@gmail.com"
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
                  onClick={openForgotModal}
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

      {/* Forgot Password 3-Step Verification Modal */}
      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title={
          forgotStep === 1
            ? 'Forgot Password'
            : forgotStep === 2
            ? 'Enter Verification Code'
            : 'Set New Password'
        }
        size="sm"
        footer={
          forgotStep === 1 ? (
            <>
              <Button variant="secondary" onClick={() => setForgotOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendCode as any} disabled={resetLoading}>
                {resetLoading ? 'Sending Code...' : 'Send Verification Code'}
              </Button>
            </>
          ) : forgotStep === 2 ? (
            <>
              <Button variant="secondary" onClick={() => setForgotStep(1)}>
                Back
              </Button>
              <Button onClick={handleVerifyOtp as any} disabled={resetLoading}>
                {resetLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setForgotOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNewPassword as any} disabled={resetLoading}>
                {resetLoading ? 'Saving...' : 'Update Password'}
              </Button>
            </>
          )
        }
      >
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                forgotStep >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span className="text-xs font-medium text-slate-700">Email</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                forgotStep >= 2 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span className="text-xs font-medium text-slate-700">Verify Code</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                forgotStep >= 3 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span className="text-xs font-medium text-slate-700">New Password</span>
          </div>
        </div>

        {/* Step 1: Request Verification Code */}
        {forgotStep === 1 && (
          <form onSubmit={handleSendCode} className="space-y-3.5">
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg text-sky-800 text-xs">
              <KeyRound className="w-4 h-4 inline-block mr-1 text-sky-600 align-text-bottom" />
              Enter your registered account email. A 6-digit verification code will be sent to your email to verify your identity.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="mijaztransport1@gmail.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </form>
        )}

        {/* Step 2: Enter Verification Code */}
        {forgotStep === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-3.5">
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg text-sky-800 text-xs">
              <ShieldCheck className="w-4 h-4 inline-block mr-1 text-sky-600 align-text-bottom" />
              We sent a verification code to <strong>{resetEmail}</strong>. Please enter the 6-digit code below.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Code (OTP)</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                required
                maxLength={8}
                autoFocus
                className="w-full text-center text-lg font-bold tracking-widest py-2.5 rounded-lg border border-sky-300 bg-sky-50/30 text-slate-800 placeholder-slate-300 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setForgotStep(1)}
                className="text-slate-500 hover:text-slate-700 underline"
              >
                Change Email
              </button>
              <button
                type="button"
                onClick={() => handleSendCode()}
                disabled={resetLoading}
                className="text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Resend Code
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {forgotStep === 3 && (
          <form onSubmit={handleSaveNewPassword} className="space-y-3.5">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 inline-block mr-1 text-emerald-600 align-text-bottom" />
              Code verified successfully! Please enter and confirm your new password.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  autoFocus
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
