import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-xl font-bold text-brand-700 mb-1">Mini ERP</h1>
        <p className="text-sm text-slate-500 mb-6">Order & Inventory Management System</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 text-xs text-slate-400 border-t pt-4 space-y-1">
          <p>Seeded demo accounts (password: Password@123):</p>
          <p>admin@erp.test - manager@erp.test - sales@erp.test</p>
        </div>
      </div>
    </div>
  );
}
