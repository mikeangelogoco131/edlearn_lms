import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../lib/api';

export default function AdminResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const initialEmail = params.get('email') || '';
  const initialToken = params.get('token') || '';

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const canSubmit = useMemo(() => {
    return (
      email.trim().length > 0 &&
      token.trim().length > 0 &&
      password.length >= 8 &&
      password === passwordConfirmation
    );
  }, [email, token, password, passwordConfirmation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.resetPassword({
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });

      setMessage(res.message || 'Password reset successfully.');

      setTimeout(() => {
        navigate('/admin/login');
      }, 700);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Reset failed.';
      setError(msg || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">EdLearn</span>
          </Link>
          <p className="text-muted-foreground">Set a new admin password</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Paste your reset token and choose a new password.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name.lastname@admin.edu.ph"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Reset Token</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste the reset token"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirmation">Confirm New Password</Label>
                <Input
                  id="passwordConfirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading || !canSubmit}>
                {loading ? 'Resetting…' : 'Reset Password'}
              </Button>
            </form>

            <p className="text-sm text-gray-500 text-center mt-6">
              <Link to="/admin/login" className="text-blue-600 hover:underline">
                Back to admin login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
