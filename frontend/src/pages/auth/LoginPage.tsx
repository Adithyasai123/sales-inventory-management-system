import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/FormField';
import { SimsLogo } from '../../components/ui/SimsLogo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Layers,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setError(null);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-bg text-text selection:bg-accent selection:text-white">
      {/* LEFT SIDE: Brand Showcase (Desktop/Tablet Large) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative overflow-hidden bg-slate-950 flex-col justify-between p-10 xl:p-14">
        {/* Background Stock Photo with Overlay */}
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80"
          alt="Modern smart warehouse logistics"
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out hover:scale-100 opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061120] via-[#0A1B33]/80 to-[#0A1B33]/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061120]/90 via-transparent to-transparent" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SimsLogo size={42} className="shadow-lg" />
            <div>
              <span className="text-xl font-bold text-white tracking-wide block leading-none font-serif">
                SIMS
              </span>
              <span className="text-[11px] text-blue-200/80 uppercase tracking-wider block mt-1 font-medium">
                Sales &amp; Inventory Management
              </span>
            </div>
          </div>
        </div>

        {/* Showcase Content */}
        <div className="relative z-10 space-y-6 max-w-xl my-auto pt-10">
          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-semibold text-white leading-tight font-serif">
              Intelligent Inventory Control &amp; Sales Orchestration.
            </h2>
            <p className="text-blue-100/80 text-sm xl:text-base leading-relaxed">
              Track multi-warehouse stock velocity in real-time, enforce automated manager approval
              thresholds, and accelerate fulfillment cycles.
            </p>
          </div>

          {/* Feature Highlights Glass Cards */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md transition-colors hover:bg-white/15">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white text-xs font-semibold">Real-Time Stock Velocity</div>
                <div className="text-blue-200/70 text-[11px]">
                  Instant reorder alerts, movement logs, and catalog sync
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md transition-colors hover:bg-white/15">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white text-xs font-semibold">Multi-Tier Approval Workflows</div>
                <div className="text-blue-200/70 text-[11px]">
                  Role-based threshold routing with complete audit trail
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md transition-colors hover:bg-white/15">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white text-xs font-semibold">Executive Analytics &amp; KPIs</div>
                <div className="text-blue-200/70 text-[11px]">
                  Visual sales trends, customer distribution, and margins
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="relative z-10 text-[11px] text-blue-200/60 flex items-center justify-between border-t border-white/10 pt-4">
          <span>SIMS Sales &amp; Inventory Management</span>
          <span>Fast, Reliable &amp; Secure</span>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form (Responsive) */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between min-h-screen p-6 sm:p-10 lg:p-12 xl:p-16 relative bg-bg overflow-y-auto">
        {/* Top Header Row */}
        <div className="flex items-center justify-between w-full">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2.5">
            <SimsLogo size={34} />
            <div>
              <span className="font-bold text-text text-base leading-none font-serif block">
                SIMS
              </span>
              <span className="text-[10px] text-muted block mt-0.5">Sales &amp; Inventory</span>
            </div>
          </div>
          <div className="hidden lg:block" />

          {/* Theme Toggle Button */}
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/* Central Login Card */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text font-serif">
              Welcome back
            </h1>
            <p className="text-caption text-muted mt-1.5 text-sm">
              Sign in with your enterprise credentials to access your workspace.
            </p>
          </div>

          {error && (
            <div className="p-3.5 mb-6 rounded-card bg-dangerSoft text-danger text-caption flex items-start gap-2.5 border border-danger/30 shadow-sm animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label="Email Address" required>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="manager@sims.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-9"
                  autoFocus
                  autoComplete="username"
                />
                <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </FormField>

            <FormField label="Password" required>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-9 pr-10"
                  autoComplete="current-password"
                />
                <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full mt-2 font-medium"
            >
              Login
            </Button>
          </form>
        </div>

        {/* Clean Footer Notice */}
        <div className="w-full text-center text-xs text-muted pt-4 border-t border-border/40">
          SIMS Sales &amp; Inventory Management System
        </div>
      </div>
    </div>
  );
};
