import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { api, ApiCourse, ApiUser, ApiUserEnrollment } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function AdminUserDetails() {
  const { user, logout, isHydrating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const [params] = useSearchParams();

  const isEdit = params.get('edit') === '1';
  const from =
    (typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : null) || '/admin?tab=users';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [record, setRecord] = useState<ApiUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [enrollments, setEnrollments] = useState<ApiUserEnrollment[]>([]);
  const [courseId, setCourseId] = useState<string>('');
  const [initialCourseId, setInitialCourseId] = useState<string>('');

  useEffect(() => {
    if (isHydrating) return;

    if (!user) {
      navigate('/admin/login');
      return;
    }

    if (user.role !== 'admin') {
      logout();
      navigate('/admin/login');
    }
  }, [user, isHydrating, navigate, logout]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userId) return;
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        const res = await api.user(userId);
        if (cancelled) return;
        setRecord(res);
        setName(res.name);
        setEmail(res.email);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load user.';
        if (!cancelled) setError(msg || 'Failed to load user.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        const res = await api.courses({ archived: false });
        if (!cancelled) setCourses(res.data);
      } catch {
        // Keep UI stable if API is unavailable
      }
    }

    loadCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadEnrollments() {
      if (!userId) return;
      if (!isEdit) return;
      if (record?.role !== 'student') {
        if (!cancelled) {
          setEnrollments([]);
          setCourseId('');
          setInitialCourseId('');
        }
        return;
      }

      try {
        const res = await api.userEnrollments(userId);
        if (cancelled) return;
        setEnrollments(res.data);

        const firstWithCourse = res.data.find((e) => e.course) ?? null;
        const enrolledCourseId = firstWithCourse?.courseId || '';
        setInitialCourseId(enrolledCourseId);
        if (enrolledCourseId) setCourseId(enrolledCourseId);
      } catch {
        if (!cancelled) {
          setEnrollments([]);
          setInitialCourseId('');
        }
      }
    }

    loadEnrollments();
    return () => {
      cancelled = true;
    };
  }, [userId, isEdit, record?.role]);

  useEffect(() => {
    if (!isEdit) return;
    if (record?.role !== 'student') return;
    if (courseId) return;
    if (courses.length) setCourseId(courses[0].id);
  }, [isEdit, record?.role, courseId, courses]);

  const canSave = useMemo(() => {
    if (!isEdit) return false;
    if (!name.trim() || !email.trim()) return false;
    if (newPassword || newPasswordConfirmation) {
      return newPassword.length >= 8 && newPassword === newPasswordConfirmation;
    }
    return true;
  }, [isEdit, name, email, newPassword, newPasswordConfirmation]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const next = await api.updateUser(userId, {
        name: name.trim(),
        email: email.trim(),
        ...(newPassword
          ? { new_password: newPassword, new_password_confirmation: newPasswordConfirmation }
          : {}),
      });

      const shouldUpdateEnrollment = next.role === 'student' && !!courseId && courseId !== initialCourseId;

      if (shouldUpdateEnrollment) {
        try {
          // Refresh the current enrollment list before mutating, so we don't rely on stale state.
          const current = await api.userEnrollments(userId);
          await Promise.all(
            current.data
              .filter((e) => e.status === 'enrolled' && e.courseId !== courseId)
              .map((e) => api.dropEnrollment(e.courseId, e.id)),
          );
          await api.enrollStudent(courseId, userId);
          const refreshed = await api.userEnrollments(userId);
          setEnrollments(refreshed.data);
          const firstWithCourse = refreshed.data.find((e) => e.course) ?? null;
          const enrolledCourseId = firstWithCourse?.courseId || '';
          setInitialCourseId(enrolledCourseId);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to update course enrollment.';
          setError(`User updated, but course enrollment failed: ${msg}`);
        }
      }

      setRecord(next);
      setNewPassword('');
      setNewPasswordConfirmation('');
      setSuccess('User updated.');

      // If we were in edit mode, keep the URL as-is.
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed.';
      setError(msg || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title={isEdit ? 'Edit User' : 'View User'}>
      <div className="max-w-2xl">
        <div className="mb-4">
          <Button asChild variant="ghost" className="gap-2">
            <Link to={from}>
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{isEdit ? 'Edit User' : 'User Details'}</CardTitle>
            <CardDescription>
              {record ? (
                <span>
                  Role: <span className="capitalize font-medium">{record.role}</span>
                </span>
              ) : (
                ' '
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
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

            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEdit}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!isEdit}
                    />
                  </div>

                  {isEdit && record?.role === 'student' ? (
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select
                        value={courseId}
                        onValueChange={setCourseId}
                        disabled={!isEdit || courses.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={courses.length ? 'Select a course' : 'No courses available'} />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.code} • {c.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>

                {isEdit && (
                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold">Reset Password (optional)</h3>
                      <p className="text-xs text-muted-foreground">Leave blank to keep current password.</p>
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
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {isEdit ? (
                    <Button type="submit" disabled={saving || !canSave}>
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/users/${encodeURIComponent(userId || '')}?edit=1`, {
                          state: { from },
                        })
                      }
                    >
                      Edit
                    </Button>
                  )}

                  <Button type="button" variant="outline" onClick={() => navigate(from)}>
                    Close
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
