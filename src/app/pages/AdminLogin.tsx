import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AlertCircle, BookOpen, Eye, EyeOff, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role !== 'admin') {
        logout();
        setError('This account is not an administrator.');
        return;
      }

      navigate('/admin');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign in failed.';
      setError(message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Violet/purple background gradient */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.2) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 110%, rgba(99,102,241,0.12) 0%, transparent 60%)',
        }}
      />
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%237c3aed' fill-opacity='0.06'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3Cpath d='M0 0h1v40H0zM39 0h1v40h-1zM0 0v1h40V0zM0 39v1h40v-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Admin badge */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  boxShadow: '0 8px 32px rgba(124,58,237,0.45)',
                }}
              >
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              {/* Admin shield badge */}
              <div
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
              >
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight block">EdLearn</span>
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Administrator Portal</span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl border p-8"
          style={{
            background: 'var(--card)',
            boxShadow: '0 8px 40px rgba(124,58,237,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Admin access indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200 dark:bg-violet-950/40 dark:border-violet-800 mb-6">
            <Shield className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Admin Access — Restricted Area</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-1">Admin Sign In</h1>
            <p className="text-sm text-muted-foreground">Use your administrator credentials to continue</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-5 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-semibold">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="name.lastname@admin.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-border/60 bg-muted/40 focus:bg-background transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-password" className="text-sm font-semibold">Password</Label>
                <Link
                  to="/admin/forgot-password"
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline underline-offset-2"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-border/60 bg-muted/40 focus:bg-background transition-colors pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold text-white border-0 shadow-none"
              style={{
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
              }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In as Admin'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/40 text-center">
            <p className="text-sm text-muted-foreground">
              Teacher or Student?{' '}
              <Link to="/login" className="font-semibold text-violet-600 dark:text-violet-400 hover:underline underline-offset-2">
                Go to main login
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/60 text-center mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
