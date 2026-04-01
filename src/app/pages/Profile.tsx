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
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

function roleDomain(role: string) {
	switch (role) {
		case 'admin':
			return '@admin.edu.ph';
		case 'teacher':
			return '@teacher.edu.ph';
		case 'student':
		default:
			return '@student.edu.ph';
	}
}

export default function Profile() {
	const { user, updateMe, uploadMyAvatar, deleteMyAvatar, isHydrating } = useAuth();
	const navigate = useNavigate();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');

	const [loading, setLoading] = useState(false);
	const [avatarLoading, setAvatarLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	useEffect(() => {
		if (isHydrating) return;
		if (!user) {
			navigate('/login');
			return;
		}
		if (user.role === 'admin') {
			navigate('/admin/profile');
			return;
		}

		setName(user.name || '');
		setEmail(user.email || '');
	}, [user, isHydrating, navigate]);

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

	const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setError('');
		setSuccess('');
		setAvatarLoading(true);
		try {
			await uploadMyAvatar(file);
			setSuccess('Profile photo updated.');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Upload failed.';
			setError(message || 'Upload failed.');
		} finally {
			setAvatarLoading(false);
			// allow re-uploading the same file
			e.target.value = '';
		}
	};

	const handleRemoveAvatar = async () => {
		setError('');
		setSuccess('');
		setAvatarLoading(true);
		try {
			await deleteMyAvatar();
			setSuccess('Profile photo removed.');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Remove failed.';
			setError(message || 'Remove failed.');
		} finally {
			setAvatarLoading(false);
		}
	};

	const title = user?.role === 'teacher' ? 'Teacher Profile' : 'Student Profile';
	const backTo = user?.role === 'teacher' ? '/teacher' : '/student';
	const domain = roleDomain(user?.role || 'student');

	return (
		<DashboardLayout title="Profile Settings">
			<div className="max-w-2xl">
				<Card>
					<CardHeader>
						<CardTitle>{title}</CardTitle>
						<CardDescription>Update your account details and password.</CardDescription>
					</CardHeader>
					<CardContent>
						{isHydrating ? <div className="text-sm text-muted-foreground">Loading profile…</div> : null}

						{error ? (
							<Alert variant="destructive" className="mb-4">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						) : null}

						{success ? (
							<Alert className="mb-4">
								<CheckCircle2 className="h-4 w-4" />
								<AlertDescription>{success}</AlertDescription>
							</Alert>
						) : null}

						<form onSubmit={handleSave} className="space-y-6">
							<div className="space-y-3">
								<Label>Profile Photo</Label>
								<div className="flex items-center gap-4">
									<Avatar className="w-16 h-16">
										{user?.avatarUrl ? (
											<AvatarImage src={user.avatarUrl} alt={user.name || 'Profile photo'} />
										) : null}
										<AvatarFallback>{user?.name ? user.name.trim().slice(0, 1).toUpperCase() : 'U'}</AvatarFallback>
									</Avatar>

									<div className="flex-1 space-y-2">
										<Input
											type="file"
											accept="image/*"
											onChange={handleAvatarChange}
											disabled={isHydrating || avatarLoading}
										/>
										<div className="flex items-center gap-2">
											<Button
												type="button"
												variant="outline"
												onClick={handleRemoveAvatar}
												disabled={isHydrating || avatarLoading || !user?.avatarUrl}
											>
												{avatarLoading ? 'Working…' : 'Remove Photo'}
											</Button>
											<p className="text-xs text-muted-foreground">PNG/JPG up to 2MB.</p>
										</div>
									</div>
								</div>
							</div>

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
										placeholder={`name.lastname${domain}`}
										required
										disabled={isHydrating}
									/>
									<p className="text-xs text-muted-foreground">
										Your email must stay in the <span className="font-medium">{domain}</span> domain.
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
								<Button type="button" variant="outline" onClick={() => navigate(backTo)}>
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
