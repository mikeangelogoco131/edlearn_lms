import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { BookOpen, Plus, Settings, TrendingUp, Users, Video } from 'lucide-react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { CourseAnnouncements } from '../components/CourseAnnouncements';
import { DashboardLayout } from '../components/DashboardLayout';
import { EventsCalendar } from '../components/EventsCalendar';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import {
	api,
	ApiAnalyticsAdmin,
	ApiCourse,
	ApiEnrollment,
	ApiEnrollmentCourse,
	ApiUser,
	ApiUserRole,
} from '../lib/api';

type AdminTab =
	| 'analytics'
	| 'calendar'
	| 'announcements'
	| 'users'
	| 'courses'
	| 'settings';

const EMPTY_ANALYTICS: ApiAnalyticsAdmin = {
	totalUsers: 0,
	totalAdmins: 0,
	totalTeachers: 0,
	totalStudents: 0,
	totalCourses: 0,
	totalAssignments: 0,
	totalEnrollments: 0,
	upcomingSessions: 0,
	activeSessions: 0,
	weeklyEngagement: [],
	courseEnrollment: [],
};

function isAdminTab(value: string | null): value is AdminTab {
	if (!value) return false;
	return (
		value === 'analytics' ||
		value === 'calendar' ||
		value === 'announcements' ||
		value === 'users' ||
		value === 'courses' ||
		value === 'settings'
	);
}

function roleDomain(role: ApiUserRole) {
	switch (role) {
		case 'student':
			return '@student.edu.ph';
		case 'teacher':
			return '@teacher.edu.ph';
		case 'admin':
			return '@admin.edu.ph';
	}
}

function roleBadgeVariant(role: ApiUserRole): 'default' | 'secondary' | 'outline' {
	if (role === 'admin') return 'secondary';
	if (role === 'teacher') return 'default';
	return 'outline';
}

export default function AdminDashboard() {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();

	const [activeTab, setActiveTab] = useState<AdminTab>(() => {
		const raw = searchParams.get('tab');
		return isAdminTab(raw) ? raw : 'analytics';
	});

	const [analytics, setAnalytics] = useState<ApiAnalyticsAdmin>(EMPTY_ANALYTICS);
	const [userCounts, setUserCounts] = useState(() => ({
		totalUsers: 0,
		totalAdmins: 0,
		totalTeachers: 0,
		totalStudents: 0,
	}));

	const [courses, setCourses] = useState<ApiCourse[]>([]);
	const [manageCourses, setManageCourses] = useState<ApiCourse[]>([]);
	const [teachers, setTeachers] = useState<ApiUser[]>([]);
	const [courseArchiveFilter, setCourseArchiveFilter] = useState<'active' | 'archived'>('active');

	const [userRoleFilter, setUserRoleFilter] = useState<'all' | ApiUserRole>(() => {
		const raw = searchParams.get('role');
		if (raw === 'student' || raw === 'teacher' || raw === 'admin') return raw;
		return 'all';
	});
	const [userArchiveFilter, setUserArchiveFilter] = useState<'active' | 'archived'>(() => {
		const raw = searchParams.get('archived');
		return raw === '1' ? 'archived' : 'active';
	});
	const [usersRefreshKey, setUsersRefreshKey] = useState(0);
	const [recentUsers, setRecentUsers] = useState<ApiUser[]>([]);
	const [usersError, setUsersError] = useState('');
	const [usersLoading, setUsersLoading] = useState(false);

	const [studentCourseByUserId, setStudentCourseByUserId] = useState<
		Record<string, ApiEnrollmentCourse | null>
	>({});
	const [studentCountsByUserId, setStudentCountsByUserId] = useState<
		Record<string, { enrolled: number; present: number }>
	>({});
	const [studentCourseLoading, setStudentCourseLoading] = useState(false);

	const [showAddUser, setShowAddUser] = useState(false);
	const [addingUser, setAddingUser] = useState(false);
	const [addUserError, setAddUserError] = useState('');
	const [addUserSuccess, setAddUserSuccess] = useState('');
	const [addName, setAddName] = useState('');
	const [addEmail, setAddEmail] = useState('');
	const [addRole, setAddRole] = useState<ApiUserRole>('student');
	const [addStudentCourseId, setAddStudentCourseId] = useState<string>('');

	const addPasswordPreview = useMemo(() => {
		const parts = addName.trim().split(/\s+/).filter(Boolean);
		return parts.length ? parts[parts.length - 1] : '';
	}, [addName]);

	useEffect(() => {
		if (addRole !== 'student') {
			setAddStudentCourseId('');
			return;
		}
		if (!addStudentCourseId && courses.length) {
			setAddStudentCourseId(courses[0].id);
		}
	}, [addRole, addStudentCourseId, courses]);

	// Shared course/class form state (scoped via courseFormContext).
	const [showCourseForm, setShowCourseForm] = useState(false);
	const [courseFormMode, setCourseFormMode] = useState<'create' | 'edit'>('create');
	const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
	const [courseSaving, setCourseSaving] = useState(false);
	const [courseError, setCourseError] = useState('');
	const [courseCode, setCourseCode] = useState('');
	const [courseTitle, setCourseTitle] = useState('');
	const [courseDescription, setCourseDescription] = useState('');
	const [courseSection, setCourseSection] = useState('');
	const [courseTerm, setCourseTerm] = useState('');
	const [courseSchedule, setCourseSchedule] = useState('');
	const [courseTeacherId, setCourseTeacherId] = useState<string>('');

	const [enrollFromCourseId, setEnrollFromCourseId] = useState<string>('');
	const [enrollFromRoster, setEnrollFromRoster] = useState<ApiEnrollment[]>([]);
	const [enrollFromLoading, setEnrollFromLoading] = useState(false);
	const [enrollFromError, setEnrollFromError] = useState('');

	const dashboardReturnTo = `${location.pathname}${location.search}`;

	const setDashboardSearchParam = (key: string, value: string | null) => {
		const next = new URLSearchParams(searchParams);
		if (value === null) next.delete(key);
		else next.set(key, value);
		setSearchParams(next, { replace: true });
	};

	const resetCourseForm = () => {
		setEditingCourseId(null);
		setCourseFormMode('create');
		setCourseError('');
		setCourseCode('');
		setCourseTitle('');
		setCourseDescription('');
		setCourseSection('');
		setCourseTerm('');
		setCourseSchedule('');
		setCourseTeacherId(teachers[0]?.id || '');
		setEnrollFromCourseId('');
		setEnrollFromRoster([]);
		setEnrollFromLoading(false);
		setEnrollFromError('');
	};

	const refreshActiveCourses = async () => {
		try {
			const res = await api.courses({ archived: false });
			setCourses(res.data);
		} catch {
			// Keep UI stable if API is unavailable
		}
	};

	const refreshManageCourses = async (archived: boolean) => {
		try {
			const res = await api.courses({ archived });
			setManageCourses(res.data);
		} catch {
			// Keep UI stable if API is unavailable
		}
	};

	useEffect(() => {
		let cancelled = false;
		async function load() {
			try {
				const [analyticsRes, coursesRes] = await Promise.all([
					api.analyticsAdmin({ archived: false }),
					api.courses({ archived: false }),
				]);

				if (cancelled) return;

				setAnalytics(analyticsRes.data);
				setUserCounts({
					totalUsers: analyticsRes.data.totalUsers,
					totalAdmins: analyticsRes.data.totalAdmins,
					totalTeachers: analyticsRes.data.totalTeachers,
					totalStudents: analyticsRes.data.totalStudents,
				});
				setCourses(coursesRes.data);
				setManageCourses(coursesRes.data);
			} catch {
				// Keep UI stable if API is unavailable
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		async function loadTeachers() {
			try {
				const res = await api.users({ role: 'teacher', limit: 1000, archived: false });
				if (!cancelled) setTeachers(res.data);
			} catch {
				// Keep UI stable if API is unavailable
			}
		}
		loadTeachers();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		refreshManageCourses(courseArchiveFilter === 'archived');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [courseArchiveFilter]);

	useEffect(() => {
		let cancelled = false;
		async function loadEnrollFromRoster() {
			if (!enrollFromCourseId) {
				setEnrollFromRoster([]);
				setEnrollFromError('');
				setEnrollFromLoading(false);
				return;
			}

			setEnrollFromLoading(true);
			setEnrollFromError('');
			try {
				const res = await api.courseEnrollments(enrollFromCourseId);
				if (cancelled) return;
				setEnrollFromRoster(res.data);
			} catch (e) {
				const msg = e instanceof Error ? e.message : 'Failed to load students from selected course.';
				if (!cancelled) {
					setEnrollFromRoster([]);
					setEnrollFromError(msg);
				}
			} finally {
				if (!cancelled) setEnrollFromLoading(false);
			}
		}

		loadEnrollFromRoster();
		return () => {
			cancelled = true;
		};
	}, [enrollFromCourseId]);

	useEffect(() => {
		let cancelled = false;
		async function loadCounts() {
			try {
				const res = await api.analyticsAdmin({ archived: userArchiveFilter === 'archived' });
				if (cancelled) return;
				setUserCounts({
					totalUsers: res.data.totalUsers,
					totalAdmins: res.data.totalAdmins,
					totalTeachers: res.data.totalTeachers,
					totalStudents: res.data.totalStudents,
				});
			} catch {
				// Keep UI stable if API is unavailable
			}
		}
		loadCounts();
		return () => {
			cancelled = true;
		};
	}, [userArchiveFilter, usersRefreshKey]);

	useEffect(() => {
		let cancelled = false;
		async function loadUsers() {
			setUsersLoading(true);
			setUsersError('');
			try {
				const res = await api.users({
					role: userRoleFilter === 'all' ? undefined : userRoleFilter,
					limit: 10,
					archived: userArchiveFilter === 'archived',
				});
				if (!cancelled) setRecentUsers(res.data);
			} catch (e) {
				if (!cancelled) {
					const msg = e instanceof Error ? e.message : 'Failed to load users.';
					setUsersError(msg);
					setRecentUsers([]);
				}
			} finally {
				if (!cancelled) setUsersLoading(false);
			}
		}
		loadUsers();
		return () => {
			cancelled = true;
		};
	}, [userRoleFilter, userArchiveFilter, usersRefreshKey]);

	useEffect(() => {
		let cancelled = false;
		async function loadStudentCourses() {
			const students = recentUsers.filter((u) => u.role === 'student');
			if (!students.length) {
				setStudentCourseByUserId({});
				setStudentCountsByUserId({});
				setStudentCourseLoading(false);
				return;
			}

			setStudentCourseLoading(true);
			try {
				const results = await Promise.allSettled(
					students.map(async (s) => {
						const res = await api.userEnrollments(s.id);
						const withCourse = res.data.filter((e) => e.course);
						const firstWithCourse = withCourse[0] ?? null;
						const enrolledCount = withCourse.filter((e) => e.status === 'enrolled').length;
						return {
							userId: s.id,
							course: firstWithCourse?.course ?? null,
							enrolledCount,
						};
					}),
				);

				if (cancelled) return;

				const courseMap: Record<string, ApiEnrollmentCourse | null> = {};
				const countsMap: Record<string, { enrolled: number; present: number }> = {};
				for (const r of results) {
					if (r.status !== 'fulfilled') continue;
					courseMap[r.value.userId] = r.value.course;
					// Attendance API not available; present mirrors enrolled.
					countsMap[r.value.userId] = { enrolled: r.value.enrolledCount, present: r.value.enrolledCount };
				}
				setStudentCourseByUserId(courseMap);
				setStudentCountsByUserId(countsMap);
			} finally {
				if (!cancelled) setStudentCourseLoading(false);
			}
		}

		loadStudentCourses();
		return () => {
			cancelled = true;
		};
	}, [recentUsers]);

	const courseManagementContent = (
		headerTitle: string,
		headerDescription: string,
		mode: 'full' | 'minimal' = 'full',
		itemLabel: 'Course' | 'Class' = 'Course',
		includeTeacher: boolean = true,
		allowDeleteInArchived: boolean = true,
		enableCourseEnroll: boolean = false,
	) => {
		const isFormOpenHere = showCourseForm;
		const formContext = 'class';

		return (
			<>
				<div className="flex justify-between items-center mb-4">
					<div>
						<h3 className="text-lg font-semibold">{headerTitle}</h3>
						<p className="text-sm text-gray-600">{headerDescription}</p>
					</div>
					<div className="flex items-center gap-3">
						<Select
							value={courseArchiveFilter}
							onValueChange={(v) => {
								if (v === 'active' || v === 'archived') setCourseArchiveFilter(v);
							}}
						>
							<SelectTrigger className="w-[160px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="archived">Archived</SelectItem>
							</SelectContent>
						</Select>

						<Button
							className="bg-blue-600 hover:bg-blue-700"
							onClick={() => {
								if (isFormOpenHere) {
									resetCourseForm();
									setShowCourseForm(false);
									return;
								}

								setShowCourseForm(true);
								setCourseFormMode('create');
								setCourseError('');
								setEditingCourseId(null);
								setCourseCode('');
								setCourseTitle('');
								setCourseDescription('');
								setCourseSection('');
								setCourseTerm('');
								setCourseSchedule('');
								setCourseTeacherId(includeTeacher ? teachers[0]?.id || '' : '');
								setEnrollFromCourseId('');
							}}
						>
							<Plus className="w-4 h-4 mr-2" />
							{isFormOpenHere ? 'Close' : `Create ${itemLabel}`}
						</Button>
					</div>
				</div>

				{courseError ? (
					<Alert variant="destructive">
						<AlertDescription>{courseError}</AlertDescription>
					</Alert>
				) : null}

				{isFormOpenHere ? (
					<Card className="glass-card">
						<CardHeader>
							<div className="flex items-start justify-between gap-4">
								<div>
									<CardTitle>
										{courseFormMode === 'edit' ? `Edit ${itemLabel}` : `Create ${itemLabel}`}
									</CardTitle>
									<CardDescription>
										{courseFormMode === 'edit'
											? includeTeacher
												? 'Update course details, teacher assignment, or status'
												: 'Update course details or status'
											: includeTeacher
												? 'Add a new course for the selected teacher'
												: 'Add a new course'}
									</CardDescription>
								</div>
								{courseFormMode === 'edit' ? (
									<Button
										variant="outline"
										onClick={() => {
											resetCourseForm();
											setShowCourseForm(false);
										}}
										disabled={courseSaving}
									>
										Cancel
									</Button>
								) : null}
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor={`${formContext}-course-code`}>Code</Label>
									<Input
										id={`${formContext}-course-code`}
										value={courseCode}
										onChange={(e) => setCourseCode(e.target.value)}
										placeholder="e.g. CS 101"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor={`${formContext}-course-title`}>Title</Label>
									<Input
										id={`${formContext}-course-title`}
										value={courseTitle}
										onChange={(e) => setCourseTitle(e.target.value)}
										placeholder="e.g. Introduction to Computer Science"
									/>
								</div>

								{mode === 'full' ? (
									<>
										<div className="space-y-2 md:col-span-2">
											<Label htmlFor={`${formContext}-course-description`}>Description (optional)</Label>
											<Textarea
												id={`${formContext}-course-description`}
												value={courseDescription}
												onChange={(e) => setCourseDescription(e.target.value)}
												placeholder="Optional course description"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor={`${formContext}-course-section`}>Section (optional)</Label>
											<Input
												id={`${formContext}-course-section`}
												value={courseSection}
												onChange={(e) => setCourseSection(e.target.value)}
												placeholder="e.g. BSIT-2A"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor={`${formContext}-course-term`}>Term (optional)</Label>
											<Input
												id={`${formContext}-course-term`}
												value={courseTerm}
												onChange={(e) => setCourseTerm(e.target.value)}
												placeholder="e.g. Spring 2026"
											/>
										</div>

										<div className="space-y-2 md:col-span-2">
											<Label htmlFor={`${formContext}-course-schedule`}>Schedule (optional)</Label>
											<Input
												id={`${formContext}-course-schedule`}
												value={courseSchedule}
												onChange={(e) => setCourseSchedule(e.target.value)}
												placeholder="e.g. Mon/Wed 9:00 AM"
											/>
										</div>
									</>
								) : null}

								{includeTeacher ? (
									<div className="space-y-2">
										<Label>Teacher</Label>
										<Select value={courseTeacherId} onValueChange={setCourseTeacherId}>
											<SelectTrigger className="mt-2">
												<SelectValue placeholder="Select a teacher" />
											</SelectTrigger>
											<SelectContent>
												{teachers.map((t) => (
													<SelectItem key={t.id} value={t.id}>
														{t.name} • {t.email}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								) : null}

								{enableCourseEnroll ? (
									<div className="space-y-2 md:col-span-2">
										<Label>Course Enroll</Label>
										<Select value={enrollFromCourseId} onValueChange={setEnrollFromCourseId}>
											<SelectTrigger className="mt-2">
												<SelectValue placeholder="Select a course to pull students from" />
											</SelectTrigger>
											<SelectContent>
												{courses
													.filter((c) => c.status !== 'archived')
													.map((c) => (
														<SelectItem key={c.id} value={c.id}>
															{c.code} • {c.title}
														</SelectItem>
													))}
											</SelectContent>
										</Select>

										{enrollFromCourseId ? (
											<div className="mt-3">
												{enrollFromLoading ? (
													<div className="text-sm text-muted-foreground">Loading students…</div>
												) : enrollFromError ? (
													<Alert variant="destructive">
														<AlertDescription>{enrollFromError}</AlertDescription>
													</Alert>
												) : enrollFromRoster.filter((e) => e.status === 'enrolled').length === 0 ? (
													<div className="text-sm text-muted-foreground">
														No enrolled students found in the selected course.
													</div>
												) : (
													<div className="space-y-2">
														<div className="text-sm text-muted-foreground">
															These students will be enrolled into this {itemLabel.toLowerCase()} when you save.
														</div>
														<div className="max-h-48 overflow-auto space-y-2">
															{enrollFromRoster
																.filter((e) => e.status === 'enrolled')
																.map((e) => (
																	<div
																		key={e.id}
																		className="flex items-center justify-between p-3 glass-item"
																	>
																		<div>
																			<div className="font-medium">{e.student?.name || 'Unknown student'}</div>
																			<div className="text-sm text-gray-600">{e.student?.email || '—'}</div>
																		</div>
																		<div className="text-xs text-gray-500">Enrolled</div>
																	</div>
																))}
														</div>
													</div>
												)}
											</div>
										) : null}
									</div>
								) : null}

								<div className="flex items-end">
									<Button
										className="bg-blue-600 hover:bg-blue-700"
										disabled={courseSaving}
										onClick={async () => {
											setCourseError('');

											if (!courseCode.trim() || !courseTitle.trim()) {
												setCourseError('Course code and title are required');
												return;
											}
											if (includeTeacher && !courseTeacherId) {
												setCourseError('Please select a teacher');
												return;
											}

											setCourseSaving(true);
											try {
												const payload =
													mode === 'full'
														? {
																code: courseCode.trim(),
																title: courseTitle.trim(),
																description: courseDescription.trim() ? courseDescription.trim() : null,
																section: courseSection.trim() ? courseSection.trim() : null,
																term: courseTerm.trim() ? courseTerm.trim() : null,
																schedule: courseSchedule.trim() ? courseSchedule.trim() : null,
																...(includeTeacher && courseTeacherId
																	? { teacher_id: Number(courseTeacherId) }
																	: {}),
															}
														: {
																code: courseCode.trim(),
																title: courseTitle.trim(),
																...(includeTeacher && courseTeacherId
																	? { teacher_id: Number(courseTeacherId) }
																	: {}),
															};

												const saved =
													courseFormMode === 'edit' && editingCourseId
														? await api.updateCourse(editingCourseId, payload)
														: await api.createCourse(payload);

												const targetCourseId = saved.data.id;

												if (enableCourseEnroll && enrollFromCourseId) {
													try {
														const roster = await api.courseEnrollments(enrollFromCourseId);
														const toEnroll = roster.data.filter((e) => e.status === 'enrolled');
														for (const e of toEnroll) {
															await api.enrollStudent(targetCourseId, e.studentId);
														}
													} catch (enrollErr) {
														const msg =
															enrollErr instanceof Error
																? enrollErr.message
																: 'Failed to enroll students from selected course';
														setCourseError(msg);
													}
												}

												await Promise.all([
													refreshActiveCourses(),
													refreshManageCourses(courseArchiveFilter === 'archived'),
												]);
												resetCourseForm();
												setShowCourseForm(false);
											} catch (e) {
												setCourseError(e instanceof Error ? e.message : `Failed to save ${itemLabel.toLowerCase()}`);
											} finally {
												setCourseSaving(false);
											}
										}}
									>
										{courseSaving
											? 'Saving…'
											: courseFormMode === 'edit'
												? 'Save Changes'
												: `Create ${itemLabel}`}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				) : null}

				<Card className="glass-card">
					<CardContent className="p-6">
						<div className="space-y-4">
							{manageCourses.map((course) => (
								<div key={course.id} className="flex items-center justify-between p-4 glass-item">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<span className="font-semibold text-blue-600">{course.code}</span>
											<span className="font-semibold">{course.title}</span>
										</div>
										{mode === 'full' ? (
											<>
												<div className="text-sm text-gray-600">
													{course.teacher} • {course.section} • {course.students} students
												</div>
												<div className="text-xs text-gray-500 mt-1">{course.schedule}</div>
											</>
										) : null}
									</div>
									<div className="flex items-center gap-2">
										<span
											className={`px-3 py-1 rounded-full text-xs font-medium ${
												course.status === 'active'
													? 'bg-green-100 text-green-700'
													: 'bg-gray-100 text-gray-700'
											}`}
										>
											{course.status}
										</span>
										<Button
											size="sm"
											onClick={() => {
												setCourseError('');
												setShowCourseForm(true);
												setCourseFormMode('edit');
												setEditingCourseId(course.id);
												setCourseCode(course.code || '');
												setCourseTitle(course.title || '');
												setCourseDescription(course.description || '');
												setCourseSection(course.section || '');
												setCourseTerm(course.term || '');
												setCourseSchedule(course.schedule || '');
												setCourseTeacherId(course.teacherId || teachers[0]?.id || '');
												setEnrollFromCourseId('');
											}}
										>
											Edit
										</Button>

										{courseArchiveFilter === 'active' && course.status !== 'archived' ? (
											<Button
												variant="outline"
												size="sm"
												onClick={async () => {
													const ok = window.confirm(`Archive ${course.code} - ${course.title}?`);
													if (!ok) return;

													setCourseError('');
													try {
														await api.updateCourse(course.id, { status: 'archived' });
														await Promise.all([
															refreshActiveCourses(),
															refreshManageCourses(false),
														]);
													} catch (e) {
														setCourseError(e instanceof Error ? e.message : 'Failed to archive course');
													}
												}}
											>
												Archive
											</Button>
										) : null}

										{courseArchiveFilter === 'archived' ? (
											<Button
												variant="outline"
												size="sm"
												onClick={async () => {
													const ok = window.confirm(`Unarchive ${course.code} - ${course.title}?`);
													if (!ok) return;

													setCourseError('');
													try {
														await api.updateCourse(course.id, { status: 'active' });
														await Promise.all([
															refreshActiveCourses(),
															refreshManageCourses(true),
														]);
													} catch (e) {
														setCourseError(e instanceof Error ? e.message : 'Failed to unarchive course');
													}
												}}
											>
												Unarchive
											</Button>
										) : null}

										{courseArchiveFilter === 'archived' && allowDeleteInArchived ? (
											<Button
												variant="destructive"
												size="sm"
												onClick={async () => {
													const ok = window.confirm(
														`Delete ${course.code} - ${course.title}? This will permanently remove the course.`,
													);
													if (!ok) return;

													setCourseError('');
													try {
														await api.deleteCourse(course.id);
														await Promise.all([
															refreshActiveCourses(),
															refreshManageCourses(true),
														]);
													} catch (e) {
														setCourseError(e instanceof Error ? e.message : 'Failed to delete course');
													}
												}}
											>
												Delete
											</Button>
										) : null}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</>
		);
	};

	return (
		<DashboardLayout title="Administrator Dashboard">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<Card className="glass-card">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Total Users</p>
								<p className="text-3xl font-bold">{analytics.totalUsers}</p>
								<p className="text-xs text-gray-600 mt-1">Registered accounts</p>
							</div>
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
								<Users className="w-6 h-6 text-blue-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="glass-card">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Active Classes</p>
								<p className="text-3xl font-bold">{analytics.totalCourses}</p>
								<p className="text-xs text-gray-600 mt-1">Total classes created</p>
							</div>
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
								<BookOpen className="w-6 h-6 text-green-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="glass-card">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Upcoming Sessions</p>
								<p className="text-3xl font-bold">{analytics.upcomingSessions}</p>
								<p className="text-xs text-gray-600 mt-1">Scheduled sessions</p>
							</div>
							<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
								<Video className="w-6 h-6 text-purple-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="glass-card">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Total Students</p>
								<p className="text-3xl font-bold">{analytics.totalStudents}</p>
								<p className="text-xs text-gray-600 mt-1">Student accounts</p>
							</div>
							<div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
								<TrendingUp className="w-6 h-6 text-orange-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(v) => {
					if (!isAdminTab(v)) return;
					setActiveTab(v);
					setDashboardSearchParam('tab', v);
				}}
				className="space-y-6"
			>
				<TabsList>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
					<TabsTrigger value="calendar">Calendar</TabsTrigger>
					<TabsTrigger value="announcements">Announcements</TabsTrigger>
					<TabsTrigger value="users">User Management</TabsTrigger>
					<TabsTrigger value="courses">Class Management</TabsTrigger>
					<TabsTrigger value="settings">System Settings</TabsTrigger>
				</TabsList>

				<TabsContent value="analytics" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card className="glass-card">
							<CardHeader>
								<CardTitle>Weekly Engagement Hours</CardTitle>
								<CardDescription>Total platform usage by day</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={analytics.weeklyEngagement}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="day" />
										<YAxis />
										<Tooltip />
										<Line
											type="monotone"
											dataKey="hours"
											stroke="#3b82f6"
											strokeWidth={3}
											dot={false}
											activeDot={{ r: 5 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card className="glass-card">
							<CardHeader>
								<CardTitle>Course Enrollment</CardTitle>
								<CardDescription>Students per course</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<AreaChart data={analytics.courseEnrollment}>
										<defs>
											<linearGradient id="courseEnrollmentFill" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
												<stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="course" />
										<YAxis />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="students"
											stroke="#10b981"
											strokeWidth={3}
											fill="url(#courseEnrollmentFill)"
										/>
									</AreaChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>

					<Card className="glass-card">
						<CardHeader>
							<CardTitle>System Performance</CardTitle>
							<CardDescription>Key metrics overview</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="p-4 glass-item">
									<div className="text-sm text-gray-600 mb-1">Total Enrollments</div>
									<div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
								</div>
								<div className="p-4 glass-item">
									<div className="text-sm text-gray-600 mb-1">Total Teachers</div>
									<div className="text-2xl font-bold">{analytics.totalTeachers}</div>
								</div>
								<div className="p-4 glass-item">
									<div className="text-sm text-gray-600 mb-1">Total Assignments</div>
									<div className="text-2xl font-bold">{analytics.totalAssignments}</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="calendar" className="space-y-6">
					<EventsCalendar canManage={true} />
				</TabsContent>

				<TabsContent value="announcements" className="space-y-6">
					<CourseAnnouncements courses={courses} canPost={true} />
				</TabsContent>

				<TabsContent value="users" className="space-y-6">
					<div className="flex items-start justify-between gap-4 flex-wrap">
						<div>
							<h3 className="text-lg font-semibold">User Management</h3>
							<p className="text-sm text-gray-600">Add, archive, and manage user accounts</p>
						</div>
						<div className="flex items-center gap-3">
							<Select
								value={userRoleFilter}
								onValueChange={(v) => {
									if (v === 'all' || v === 'student' || v === 'teacher' || v === 'admin') {
										setUserRoleFilter(v);
										setDashboardSearchParam('role', v === 'all' ? null : v);
									}
								}}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Roles</SelectItem>
									<SelectItem value="student">Students</SelectItem>
									<SelectItem value="teacher">Teachers</SelectItem>
									<SelectItem value="admin">Admins</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={userArchiveFilter}
								onValueChange={(v) => {
									if (v === 'active' || v === 'archived') {
										setUserArchiveFilter(v);
										setDashboardSearchParam('archived', v === 'archived' ? '1' : null);
									}
								}}
							>
								<SelectTrigger className="w-[160px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="archived">Archived</SelectItem>
								</SelectContent>
							</Select>

							<Button
								className="bg-blue-600 hover:bg-blue-700"
								onClick={() => {
									setShowAddUser((s) => !s);
									setAddUserError('');
									setAddUserSuccess('');
								}}
							>
								<Plus className="w-4 h-4 mr-2" />
								{showAddUser ? 'Close' : 'Add User'}
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<Card className="glass-card">
							<CardContent className="p-5">
								<div className="text-sm text-gray-600">Total Users</div>
								<div className="text-2xl font-bold">{userCounts.totalUsers}</div>
							</CardContent>
						</Card>
						<Card className="glass-card">
							<CardContent className="p-5">
								<div className="text-sm text-gray-600">Admins</div>
								<div className="text-2xl font-bold">{userCounts.totalAdmins}</div>
							</CardContent>
						</Card>
						<Card className="glass-card">
							<CardContent className="p-5">
								<div className="text-sm text-gray-600">Teachers</div>
								<div className="text-2xl font-bold">{userCounts.totalTeachers}</div>
							</CardContent>
						</Card>
						<Card className="glass-card">
							<CardContent className="p-5">
								<div className="text-sm text-gray-600">Students</div>
								<div className="text-2xl font-bold">{userCounts.totalStudents}</div>
							</CardContent>
						</Card>
					</div>

					{usersError ? (
						<Alert variant="destructive">
							<AlertDescription>{usersError}</AlertDescription>
						</Alert>
					) : null}

					{showAddUser ? (
						<Card className="glass-card">
							<CardHeader>
								<CardTitle>Add User</CardTitle>
								<CardDescription>
									Email domain must match the selected role. Password will be the last name.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{addUserError ? (
									<Alert variant="destructive">
										<AlertDescription>{addUserError}</AlertDescription>
									</Alert>
								) : null}
								{addUserSuccess ? (
									<Alert>
										<AlertDescription>{addUserSuccess}</AlertDescription>
									</Alert>
								) : null}

								<form
									className="grid grid-cols-1 md:grid-cols-2 gap-4"
									onSubmit={async (e) => {
										e.preventDefault();
										setAddUserError('');
										setAddUserSuccess('');

										if (!addName.trim()) {
											setAddUserError('Full name is required.');
											return;
										}

										if (!addEmail.trim()) {
											setAddUserError('Email is required.');
											return;
										}

										const domain = roleDomain(addRole);
										if (!addEmail.trim().toLowerCase().endsWith(domain)) {
											setAddUserError(`Email must end with ${domain}`);
											return;
										}

										setAddingUser(true);
										try {
											const created = await api.createUser({
												name: addName.trim(),
												email: addEmail.trim(),
												role: addRole,
											});

											if (addRole === 'student' && addStudentCourseId) {
												try {
													await api.enrollStudent(addStudentCourseId, created.id);
												} catch (err) {
													const msg = err instanceof Error ? err.message : 'Failed to enroll student.';
													setAddUserError(`User created, but enrollment failed: ${msg}`);
												}
											}

											const selectedCourse =
												addRole === 'student' && addStudentCourseId
													? courses.find((c) => c.id === addStudentCourseId)
													: null;

											setAddUserSuccess(
												addPasswordPreview
													? `User created. Password is last name: ${addPasswordPreview}${selectedCourse ? ` • Enrolled in: ${selectedCourse.code} - ${selectedCourse.title}` : ''}`
													: `User created.${selectedCourse ? ` Enrolled in: ${selectedCourse.code} - ${selectedCourse.title}` : ''}`,
											);
											setAddName('');
											setAddEmail('');
											setAddRole('student');
											setAddStudentCourseId(courses[0]?.id || '');
											setUsersRefreshKey((k) => k + 1);
										} catch (e2) {
											const msg = e2 instanceof Error ? e2.message : 'Failed to add user.';
											setAddUserError(msg || 'Failed to add user.');
										} finally {
											setAddingUser(false);
										}
									}}
								>
									<div className="space-y-2">
										<Label htmlFor="addName">Full Name</Label>
										<Input
											id="addName"
											value={addName}
											onChange={(e) => setAddName(e.target.value)}
											placeholder="Juan Dela Cruz"
											required
										/>
										{addPasswordPreview ? (
											<div className="text-xs text-muted-foreground">
												Password will be: <span className="font-medium">{addPasswordPreview}</span>
											</div>
										) : null}
									</div>

									<div className="space-y-2">
										<Label htmlFor="addEmail">Email</Label>
										<Input
											id="addEmail"
											type="email"
											value={addEmail}
											onChange={(e) => setAddEmail(e.target.value)}
											placeholder={`name.lastname${roleDomain(addRole)}`}
											required
										/>
									</div>

									<div className="space-y-2">
										<Label>Role</Label>
										<Select value={addRole} onValueChange={(v) => setAddRole(v as ApiUserRole)}>
											<SelectTrigger className="mt-2">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="student">Student</SelectItem>
												<SelectItem value="teacher">Teacher</SelectItem>
												<SelectItem value="admin">Admin</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{addRole === 'student' ? (
										<div className="space-y-2">
											<Label>Enroll to Course</Label>
											<Select value={addStudentCourseId} onValueChange={setAddStudentCourseId}>
												<SelectTrigger className="mt-2">
													<SelectValue placeholder="Select a course" />
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

									<div className="flex items-end">
										<Button className="bg-blue-600 hover:bg-blue-700" type="submit" disabled={addingUser}>
											{addingUser ? 'Creating…' : 'Create User'}
										</Button>
									</div>
								</form>
							</CardContent>
						</Card>
					) : null}

					<Card className="glass-card">
						<CardHeader>
							<CardTitle>Users</CardTitle>
							<CardDescription>
								{usersLoading ? 'Loading…' : `Showing ${recentUsers.length} user(s)`}
								{studentCourseLoading ? ' • Loading student courses…' : ''}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{recentUsers.length === 0 ? (
									<div className="text-sm text-muted-foreground">No users found.</div>
								) : (
									recentUsers.map((u) => {
										const studentCourse = u.role === 'student' ? studentCourseByUserId[u.id] : null;
										const studentCounts = u.role === 'student' ? studentCountsByUserId[u.id] : null;
										return (
											<div key={u.id} className="p-4 glass-item">
												<div className="flex items-start justify-between gap-4">
													<div className="min-w-0">
														<div className="flex items-center gap-2">
															<div className="font-semibold truncate">{u.name}</div>
															<Badge variant={roleBadgeVariant(u.role)} className="capitalize">
																{u.role}
															</Badge>
															{u.archivedAt ? <Badge variant="secondary">Archived</Badge> : null}
														</div>
														<div className="text-sm text-gray-600 truncate">{u.email}</div>
														{u.role === 'student' ? (
															<div className="text-xs text-gray-500 mt-1">
																Course:{' '}
																{studentCourse ? `${studentCourse.code} - ${studentCourse.title}` : 'Unavailable'}
																{studentCounts ? ` • Enrolled: ${studentCounts.enrolled} • Present: ${studentCounts.present}` : ''}
															</div>
														) : null}
													</div>

													<div className="flex items-center gap-2">
														<Button
															size="sm"
															onClick={() =>
																navigate(`/admin/users/${encodeURIComponent(u.id)}?edit=1`, {
																	state: { from: dashboardReturnTo },
																})
															}
														>
															Edit
														</Button>

														{userArchiveFilter === 'active' ? (
															<Button
																variant="outline"
																size="sm"
																onClick={async () => {
																	const ok = window.confirm(
																		`Archive ${u.name}? They will no longer appear in the active user list.`,
																	);
																	if (!ok) return;

																	try {
																		await api.archiveUser(u.id);
																		setUsersRefreshKey((k) => k + 1);
																	} catch {
																		// Keep UI stable if API is unavailable
																	}
																}}
															>
																Archive
															</Button>
														) : (
															<>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={async () => {
																		const ok = window.confirm(`Unarchive ${u.name}?`);
																		if (!ok) return;

																		try {
																			await api.unarchiveUser(u.id);
																			setUsersRefreshKey((k) => k + 1);
																		} catch {
																			// Keep UI stable if API is unavailable
																		}
																	}}
																>
																	Unarchive
																</Button>
																<Button
																	variant="destructive"
																	size="sm"
																	onClick={async () => {
																		const ok = window.confirm(
																			`Delete ${u.name}? This will permanently remove the user from the system.`,
																		);
																		if (!ok) return;

																		try {
																			await api.deleteUser(u.id);
																			setUsersRefreshKey((k) => k + 1);
																		} catch {
																			// Keep UI stable if API is unavailable
																		}
																	}}
																>
																	Delete
																</Button>
															</>
														)}
													</div>
												</div>
											</div>
										);
									})
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="courses" className="space-y-6">
					{courseManagementContent(
						'Class Management',
						'Manage subjects, sections, and academic terms',
						'full',
						'Class',
						true,
						true,
						true,
					)}
				</TabsContent>

				<TabsContent value="settings" className="space-y-6">
					<Card className="glass-card">
						<CardHeader>
							<CardTitle>System Settings</CardTitle>
							<CardDescription>Configure system-wide settings and permissions</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 glass-item">
									<div>
										<div className="font-semibold">Academic Term</div>
										<div className="text-sm text-gray-600">Not configured</div>
									</div>
									<Button variant="outline">Change Term</Button>
								</div>

								<div className="flex items-center justify-between p-4 glass-item">
									<div>
										<div className="font-semibold">Storage Limit</div>
										<div className="text-sm text-gray-600">Not configured</div>
									</div>
									<Button variant="outline">Manage Storage</Button>
								</div>

								<div className="flex items-center justify-between p-4 glass-item">
									<div>
										<div className="font-semibold">Security Settings</div>
										<div className="text-sm text-gray-600">Not configured</div>
									</div>
									<Button variant="outline">
										<Settings className="w-4 h-4 mr-2" />
										Configure
									</Button>
								</div>

								<div className="flex items-center justify-between p-4 glass-item">
									<div>
										<div className="font-semibold">Backup & Recovery</div>
										<div className="text-sm text-gray-600">Not configured</div>
									</div>
									<Button variant="outline">Backup Now</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</DashboardLayout>
	);
}