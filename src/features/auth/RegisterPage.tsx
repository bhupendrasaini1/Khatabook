/* ======================================
   REGISTER PAGE
   ====================================== */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { db } from '@/db/database';
import { UserRole, EntityStatus } from '@/types/enums';
import { useAuthStore } from '@/stores/authStore';

export function RegisterPage() {
  const [form, setForm] = useState({ orgName: '', name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const existing = await db.users.where('email').equals(form.email).first();
      if (existing) {
        setError('An account with this email already exists');
        setLoading(false);
        return;
      }

      const now = new Date().toISOString();
      const orgId = await db.organizations.add({
        name: form.orgName,
        businessType: 'General',
        gstNumber: '',
        address: '',
        phone: '',
        email: form.email,
        currency: 'INR',
        financialYearStart: 4,
        status: EntityStatus.Active,
        createdBy: form.email,
        createdAt: now,
        updatedBy: form.email,
        updatedAt: now,
      });

      await db.users.add({
        orgId,
        name: form.name,
        email: form.email,
        passwordHash: form.password,
        role: UserRole.OrgAdmin,
        status: EntityStatus.Active,
        lastLoginAt: now,
        createdBy: form.email,
        createdAt: now,
        updatedBy: form.email,
        updatedAt: now,
      });

      await login(form.email, form.password);
      navigate('/', { replace: true });
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-mesh p-6 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-float" />

      <div className="w-full max-w-md space-y-6 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Wallet size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Khatabook</h1>
            <p className="text-xs text-teal-400 font-medium">Cash Flow Pro</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">Create your account</h2>
          <p className="text-sm text-slate-400 mt-1">Start managing your cash flow in minutes</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Organization Name"
            value={form.orgName}
            onChange={(e) => setForm({ ...form, orgName: e.target.value })}
            placeholder="Your business name"
            required
          />
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your full name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@company.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Min. 6 characters"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Re-enter password"
            required
          />

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 animate-fade-in">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading} iconRight={!loading ? <ArrowRight size={18} /> : undefined}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
