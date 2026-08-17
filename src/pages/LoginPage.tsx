import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Mail, Lock } from 'lucide-react';
import { useToast } from '@/components/Toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || password.length < 3) {
      toast('Please enter valid email and password', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      sessionStorage.setItem('rfu-auth', 'true');
      toast('Welcome to Ride for U', 'success');
      navigate('/dashboard');
    }, 400);
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
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
          <p className="text-xs text-slate-400 text-center mt-4">
            Demo mode — any valid email and password will sign you in.
          </p>
        </div>
      </div>
    </div>
  );
}
