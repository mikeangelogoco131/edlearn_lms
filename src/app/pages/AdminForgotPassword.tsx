import { useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../lib/api';

export default function AdminForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [debugToken, setDebugToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDebugToken(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message || 'If an account exists, a reset token has been created.');
      setDebugToken(res.debug_token || null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed.';
      setError(msg || 'Request failed.');
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
          <p className="text-muted-foreground">Admin password reset</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>Enter your admin email to request a reset token.</CardDescription>
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

            {debugToken && (
              <Alert className="mb-4">
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Debug reset token</div>
                    <div className="text-xs break-all text-muted-foreground">{debugToken}</div>
                    <Link
                      to={`/admin/reset-password?email=${encodeURIComponent(
                        email,
                      )}&token=${encodeURIComponent(debugToken)}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Continue to reset password
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name.lastname@admin.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? 'Requesting…' : 'Request Reset'}
              </Button>
            </form>

            <p className="text-sm text-gray-500 text-center mt-6">
              Remembered your password?{' '}
              <Link to="/admin/login" className="text-blue-600 hover:underline">
                Back to admin login
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-500 text-center mt-4">
          In production, connect email delivery to send reset links.
        </p>
      </div>
    </div>
  );
}
