import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Layers, Lock, Mail, ShieldCheck, Boxes, Zap } from 'lucide-react';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { email: 'admin@erp.test', role: 'Admin' },
  { email: 'manager@erp.test', role: 'Manager' },
  { email: 'sales@erp.test', role: 'Sales User' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('admin@erp.test');
  const [password, setPassword] = useState('Password@123');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => {
      signIn(token, user);
      toast.success(`Welcome back, ${user.name}`);
      navigate('/');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-100">
      <div className="relative hidden lg:flex flex-col justify-between bg-slate-950 text-white p-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(129,140,248,0.25), transparent 40%)',
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <Layers size={20} />
          </div>
          <span className="font-semibold text-lg">Mini ERP</span>
        </div>

        <div className="relative space-y-8 max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            Order &amp; inventory management, built for correctness under load.
          </h1>
          <ul className="space-y-4 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <ShieldCheck size={18} className="text-brand-400 mt-0.5 shrink-0" />
              Role-based access for Admins, Managers, and Sales teams.
            </li>
            <li className="flex items-start gap-3">
              <Boxes size={18} className="text-brand-400 mt-0.5 shrink-0" />
              Concurrency-safe stock deduction - never oversell, ever.
            </li>
            <li className="flex items-start gap-3">
              <Zap size={18} className="text-brand-400 mt-0.5 shrink-0" />
              Live inventory updates pushed the moment an order commits.
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">&copy; {new Date().getFullYear()} Mini ERP</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Layers size={20} className="text-white" />
            </div>
            <span className="font-semibold text-lg text-slate-800">Mini ERP</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1 mb-8">Welcome back - please enter your details.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full !py-2.5" disabled={mutation.isPending}>
              {mutation.isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Demo accounts (password: Password@123)
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => setEmail(acc.email)}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                >
                  <span className="text-slate-600 font-mono text-xs">{acc.email}</span>
                  <span className="badge bg-slate-100 text-slate-600">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
