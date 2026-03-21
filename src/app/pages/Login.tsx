import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { BookOpen, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen flex items-center justify-center p-4">
      <ImageWithFallback
        src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=2000&q=80"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-background/70 via-background/35 to-background/70" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-primary/5" />

      <div className="absolute left-4 top-4 z-10">
        <Button type="button" variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">EdLearn</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name.lastname@teacher.edu.ph or name.lastname@student.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 flex justify-center">
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/login">Admin Login</Link>
              </Button>
            </div>

            <p className="text-sm text-gray-500 text-center mt-4">
              Don't have an account?{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Contact your administrator
              </a>
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-500 text-center mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
