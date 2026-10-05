import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/FormField';
import { Boxes, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-forest-bg flex flex-col items-center justify-center p-4">
      {/* Brand Icon Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-full bg-mint-primary text-forest-dark flex items-center justify-center font-bold text-lg shadow-flat">
          <Boxes className="w-6 h-6 text-forest-dark" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-forest leading-none">
            SIMS
          </h1>
          <p className="text-xs text-forest-muted mt-1">Sales & Inventory Management</p>
        </div>
      </div>

      {/* Soft low-contrast mint card as requested in user adjustment 5 */}
      <div className="w-full max-w-md bg-forest-surface border border-forest-border p-6 sm:p-8 rounded-card shadow-flat flex flex-col gap-6">
        <div>
          <h2 className="font-serif text-xl font-medium text-forest">Welcome Back</h2>
          <p className="text-xs text-forest-muted mt-1">
            Sign in with your enterprise credentials to access the system.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-input bg-white border border-forest text-xs text-forest flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Email Address" required>
            <Input
              type="email"
              placeholder="user@sims.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </FormField>

          <FormField label="Password" required>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Sign In to SIMS
          </Button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-forest-border flex flex-col gap-2.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-forest-muted text-center">
            One-Click Demo Roles
          </span>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@sims.local', 'Admin@123456')}
              className="flex flex-col items-center justify-center p-2 rounded-input bg-white hover:bg-forest-border/40 border border-forest-border text-[11px] text-forest transition-colors gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-forest" />
              <span className="font-medium">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('manager@sims.local', 'Manager@123456')}
              className="flex flex-col items-center justify-center p-2 rounded-input bg-white hover:bg-forest-border/40 border border-forest-border text-[11px] text-forest transition-colors gap-1"
            >
              <Briefcase className="w-3.5 h-3.5 text-forest" />
              <span className="font-medium">Manager</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('sales@sims.local', 'Sales@123456')}
              className="flex flex-col items-center justify-center p-2 rounded-input bg-white hover:bg-forest-border/40 border border-forest-border text-[11px] text-forest transition-colors gap-1"
            >
              <UserCheck className="w-3.5 h-3.5 text-forest" />
              <span className="font-medium">Sales Rep</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
