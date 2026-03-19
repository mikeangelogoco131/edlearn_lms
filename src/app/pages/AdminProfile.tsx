import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';

export default function AdminProfile() {
  const { user, updateMe, logout, isHydrating } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isHydrating) return;

    if (!user) {
      navigate('/admin/login');
      return;
    }

    if (user.role !== 'admin') {
      logout();
      navigate('/admin/login');
      return;
    }

    setName(user.name || '');
    setEmail(user.email || '');
  }, [user, isHydrating, navigate, logout]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!email.trim()) return false;
    if (newPassword || newPasswordConfirmation || currentPassword) {
      return (
        currentPassword.length > 0 &&
        newPassword.length >= 8 &&
        newPassword === newPasswordConfirmation
      );
    }
    return true;
  }, [name, email, currentPassword, newPassword, newPasswordConfirmation]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload: Parameters<typeof updateMe>[0] = {
        name: name.trim(),
        email: email.trim(),
      };

      if (newPassword || newPasswordConfirmation || currentPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
        payload.new_password_confirmation = newPasswordConfirmation;
      }

      await updateMe(payload);

      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
      setSuccess('Profile updated.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Update failed.';
      setError(message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Profile Settings">
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Admin Profile</CardTitle>
            <CardDescription>Update your account details and password.</CardDescription>
          </CardHeader>
          <CardContent>
            {isHydrating && (
              <div className="text-sm text-muted-foreground">Loading profile…</div>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    disabled={isHydrating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name.lastname@admin.edu.ph"
                    required
                    disabled={isHydrating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your email must stay in the <span className="font-medium">@admin.edu.ph</span>
                    {' '}domain.
                  </p>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Change Password</h3>
                  <p className="text-xs text-muted-foreground">Leave blank to keep your current password.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    disabled={isHydrating}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      disabled={isHydrating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPasswordConfirmation">Confirm New Password</Label>
                    <Input
                      id="newPasswordConfirmation"
                      type="password"
                      value={newPasswordConfirmation}
                      onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                      placeholder="Repeat new password"
                      disabled={isHydrating}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isHydrating || loading || !canSubmit}>
                  {loading ? 'Saving…' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
                  Back to Dashboard
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
