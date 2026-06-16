/* ======================================
   LOGIN PAGE — Authentication Entry
   ====================================== */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, Eye, EyeOff, ArrowRight, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/', { replace: true });
      } else {
        setError('Invalid email or password. Try the demo credentials.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@paymentflow.ai');
    setPassword('demo123');
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/3 rounded-full blur-3xl" />

      {/* Left — Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
        <div className="max-w-lg space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-teal-500/30">
              <Wallet size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Khatabook</h1>
              <p className="text-sm text-teal-400 font-medium tracking-wide">Cash Flow Pro</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Smart Cash Flow<br />
              <span className="text-gradient">Management</span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Transform your manual ledger into an intelligent cash flow system.
              Track receivables, manage payables, and make smarter payment decisions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Track Receivables', desc: 'Know who will pay you' },
              { label: 'Manage Payables', desc: 'Prioritize supplier payments' },
              { label: 'Visual Flow Board', desc: 'Map buyer-to-supplier flows' },
              { label: 'Risk Alerts', desc: 'Identify financial risks early' },
            ].map((feat) => (
              <div key={feat.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-sm font-semibold text-slate-200">{feat.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Payment Flow AI</h1>
            <p className="text-sm text-slate-400 mt-1">Sign in to your account to continue</p>
          </div>

          {/* Demo credential button */}
          <button
            onClick={fillDemo}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-teal-500/20 bg-teal-500/5 text-teal-400 text-sm font-medium hover:bg-teal-500/10 hover:border-teal-500/30 transition-all duration-200 group"
          >
            <Zap size={16} className="group-hover:animate-pulse-soft" />
            Fill Demo Credentials
          </button>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-teal-500 focus:ring-teal-500/20" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-teal-400 hover:text-teal-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 animate-fade-in">
                {error}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              iconRight={!loading ? <ArrowRight size={18} /> : undefined}
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
