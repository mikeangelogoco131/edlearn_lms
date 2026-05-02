import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { BookOpen, AlertCircle, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const navigateByRole = (role: string) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'teacher') navigate('/teacher');
    else navigate('/student');
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      navigateByRole(user.role);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign in failed.';
      setError(message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Decorative gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_80%_110%,rgba(20,184,166,0.12)_0%,transparent_60%)]" />
      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M0%200h40v40H0z%22%2F%3E%3Cpath%20d%3D%22M0%200h1v40H0zM39%200h1v40h-1zM0%200v1h40V0zM0%2039v1h40v-1z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />

      {/* Back button */}
      <div className="absolute left-4 top-4 z-10">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center pulse-glow bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_100%)] shadow-[0_8px_32px_rgba(99,102,241,0.4)]">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">EdLearn</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-[0_8px_40px_rgba(99,102,241,0.1),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Enter your credentials to access your dashboard</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-5 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="yourname@school.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-border/60 bg-muted/40 focus:bg-background transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline underline-offset-2"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
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
              className={`w-full h-11 rounded-xl font-semibold text-white border-0 ${loading ? 'bg-slate-400 shadow-none' : 'bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_100%)] shadow-[0_4px_20px_rgba(99,102,241,0.4)]'}`}
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
              ) : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 flex flex-col gap-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-11 rounded-xl border-border/60 hover:bg-muted/50 gap-3"
              onClick={async () => {
                setError('');
                setLoading(true);
                try {
                  const { user } = await api.loginWithGoogle('MOCK_GOOGLE_CREDENTIAL_STUDENT');
                  navigateByRole(user.role);
                } catch (err: any) {
                  setError(err.message || 'Google sign-in failed.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Quick Access (Dev Only)</p>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] h-8 border border-border/40 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                  onClick={async () => {
                    setError('');
                    setLoading(true);
                    try {
                      const { user } = await api.loginWithGoogle('MOCK_GOOGLE_CREDENTIAL_ADMIN');
                      navigateByRole(user.role);
                    } catch (err: any) {
                      setError(err.message || 'Login failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Admin
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] h-8 border border-border/40 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                  onClick={async () => {
                    setError('');
                    setLoading(true);
                    try {
                      const { user } = await api.loginWithGoogle('MOCK_GOOGLE_CREDENTIAL_TEACHER');
                      navigateByRole(user.role);
                    } catch (err: any) {
                      setError(err.message || 'Login failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Teacher
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] h-8 border border-border/40 hover:bg-green-50 hover:text-green-600 rounded-lg"
                  onClick={async () => {
                    setError('');
                    setLoading(true);
                    try {
                      const { user } = await api.loginWithGoogle('MOCK_GOOGLE_CREDENTIAL_STUDENT');
                      navigateByRole(user.role);
                    } catch (err: any) {
                      setError(err.message || 'Login failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Student
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Need access?{' '}
                <a href="#" className="font-semibold text-primary hover:underline underline-offset-2">
                  Contact admin
                </a>
              </p>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-[10px] h-7 font-semibold border-border/60">
                <Link to="/admin/login">Admin Portal</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          {['Secure & encrypted', 'Role-based access', 'FERPA compliant'].map(item => (
            <div key={item} className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              {item}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/60 text-center mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
