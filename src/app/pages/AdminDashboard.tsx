import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, BookOpen, CalendarDays, LayoutGrid, Menu, Megaphone, MessageSquare, Plus, Settings, TrendingUp, Users, Video, X } from 'lucide-react';
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
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { Drawer, DrawerTrigger, DrawerPortal, DrawerOverlay, DrawerContent, DrawerClose } from '../components/ui/drawer';
import {
	api,
	ApiAnalyticsAdmin,
	ApiCourse,
	ApiEnrollment,
	ApiEnrollmentCourse,
	ApiMessage,
	ApiProgram,
	ApiUser,
	ApiUserRole,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type AdminTab =
	| 'analytics'
	| 'calendar'
	| 'announcements'
	| 'messages'
	| 'users'
	| 'courses'
	| 'courseManagement'
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
		value === 'messages' ||
		value === 'users' ||
		value === 'courses' ||
		value === 'courseManagement' ||
		value === 'settings'
	);
}

const adminNavItems: Array<{ value: AdminTab; label: string; icon: typeof TrendingUp }> = [
	{ value: 'analytics', label: 'Analytics', icon: TrendingUp },
	{ value: 'calendar', label: 'Calendar', icon: CalendarDays },
	{ value: 'announcements', label: 'Announcements', icon: Megaphone },
	{ value: 'messages', label: 'Messages', icon: MessageSquare },
	{ value: 'users', label: 'User Management', icon: Users },
	{ value: 'courses', label: 'Class Management', icon: BookOpen },
	{ value: 'courseManagement', label: 'Course Management', icon: LayoutGrid },
	{ value: 'settings', label: 'System Settings', icon: Settings },
];

type MessageFolder = 'inbox' | 'sent' | 'drafts' | 'deleted';

function isMessageFolder(value: string | null): value is MessageFolder {
	return value === 'inbox' || value === 'sent' || value === 'drafts' || value === 'deleted';
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

type AdminSystemSettings = {
	academicTerm: {
		termName: string;
		schoolYear: string;
		semester: '1st Semester' | '2nd Semester' | 'Summer';
		startsOn: string;
		endsOn: string;
	};
	security: {
		minPasswordLength: number;
		requireComplexPassword: boolean;
		sessionTimeoutMinutes: number;
		lockoutAfterFailedLogins: number;
	};
	backup: {
		autoBackupEnabled: boolean;
		frequency: 'daily' | 'weekly' | 'monthly';
		retentionDays: number;
		lastBackupAt: string | null;
	};
};

const DEFAULT_SYSTEM_SETTINGS: AdminSystemSettings = {
	academicTerm: {
		termName: '',
		schoolYear: '',
		semester: '1st Semester',
		startsOn: '',
		endsOn: '',
	},
	security: {
		minPasswordLength: 8,
		requireComplexPassword: false,
		sessionTimeoutMinutes: 60,
		lockoutAfterFailedLogins: 5,
	},
	backup: {
		autoBackupEnabled: false,
		frequency: 'weekly',
		retentionDays: 30,
		lastBackupAt: null,
	},
};

function csvCell(value: unknown) {
	const str = value === null || value === undefined ? '' : String(value);
	const needsQuotes = /[\n\r,\"]/g.test(str);
	const escaped = str.replace(/\"/g, '""');
	return needsQuotes ? `"${escaped}"` : escaped;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function AdminDashboard() {
	const { user: me } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();

	const [activeTab, setActiveTab] = useState<AdminTab>(() => {
		const raw = searchParams.get('tab');
		return isAdminTab(raw) ? raw : 'analytics';
	});

	const [messageFolder, setMessageFolder] = useState<MessageFolder>(() => {
		const raw = searchParams.get('folder');
		return isMessageFolder(raw) ? raw : 'inbox';
	});
	const [messageComposeOpen, setMessageComposeOpen] = useState(() => searchParams.get('compose') === '1');
	const [messagesRefreshKey, setMessagesRefreshKey] = useState(0);
	const [messagesLoading, setMessagesLoading] = useState(false);
	const [messagesError, setMessagesError] = useState('');
	const [messages, setMessages] = useState<ApiMessage[]>([]);
	const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
	const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(() => new Set());

	const currentUserId = me?.id ? String(me.id) : null;
	const [chatUser, setChatUser] = useState<ApiUser | null>(null);
	const [chatThreadLoading, setChatThreadLoading] = useState(false);
	const [chatThreadError, setChatThreadError] = useState('');
	const [chatThreadMessages, setChatThreadMessages] = useState<ApiMessage[]>([]);
	const chatLastIsoRef = useRef<string | null>(null);
	const chatThreadScrollRef = useRef<HTMLDivElement | null>(null);
	const [chatReplyBody, setChatReplyBody] = useState('');
	const [chatReplySending, setChatReplySending] = useState(false);

	const [composeDraftId, setComposeDraftId] = useState<string | null>(null);
	const [composeTo, setComposeTo] = useState('');
	const [composeToUserId, setComposeToUserId] = useState<string | null>(null);
	const [composeSubject, setComposeSubject] = useState('');
	const [composeBody, setComposeBody] = useState('');
	const [composeSaving, setComposeSaving] = useState(false);
	const [composeError, setComposeError] = useState('');
	const [composeSuccess, setComposeSuccess] = useState('');
	const [composeSuggestions, setComposeSuggestions] = useState<ApiUser[]>([]);
	const [composeSuggestionsLoading, setComposeSuggestionsLoading] = useState(false);
	const [backups, setBackups] = useState<any[]>([]);
	const [backupsLoading, setBackupsLoading] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const selectedMessage = useMemo(() => {
		return selectedMessageId ? messages.find((m) => m.id === selectedMessageId) || null : null;
	}, [messages, selectedMessageId]);

	const mergeUniqueMessages = (prev: ApiMessage[], incoming: ApiMessage[]) => {
		if (!incoming.length) return prev;
		const seen = new Set(prev.map((m) => m.id));
		const merged = [...prev];
		for (const m of incoming) {
			if (!seen.has(m.id)) {
				seen.add(m.id);
				merged.push(m);
			}
		}
		merged.sort((a, b) => {
			const ai = a.sentAt || a.createdAt || '';
			const bi = b.sentAt || b.createdAt || '';
			if (ai === bi) return Number(a.id) - Number(b.id);
			return ai.localeCompare(bi);
		});
		return merged;
	};

	const loadChatThread = async (targetUserId: string, mode: 'replace' | 'append') => {
		setChatThreadError('');
		if (mode === 'replace') setChatThreadLoading(true);
		try {
			const after = mode === 'append' ? chatLastIsoRef.current : undefined;
			const res = await api.messageThread(targetUserId, { after: after || undefined, limit: 200 });
			if (!res) return;
			setChatThreadMessages((prev) => (mode === 'replace' ? res.data : mergeUniqueMessages(prev, res.data)));
			const last = res.data.length ? res.data[res.data.length - 1] : null;
			const lastIso = last ? last.sentAt || last.createdAt || null : null;
			if (lastIso) chatLastIsoRef.current = lastIso;

			for (const m of res.data) {
				if (m.status !== 'sent') continue;
				if (!m.recipient?.id || !currentUserId) continue;
				if (String(m.recipient.id) !== String(currentUserId)) continue;
				if (m.readAt) continue;
				api
					.messageRead(m.id)
					.then((readRes) => {
						setChatThreadMessages((prev) => prev.map((x) => (x.id === m.id ? readRes.data : x)));
						setMessages((prev) => prev.map((x) => (x.id === m.id ? readRes.data : x)));
					})
					.catch(() => undefined);
			}
		} catch (e: any) {
			setChatThreadError(e?.message || 'Failed to load chat.');
		} finally {
			setChatThreadLoading(false);
		}
	};

	const [analytics, setAnalytics] = useState<ApiAnalyticsAdmin>(EMPTY_ANALYTICS);
	const [userCounts, setUserCounts] = useState(() => ({
		totalUsers: 0,
		totalAdmins: 0,
		totalTeachers: 0,
		totalStudents: 0,
	}));

	const [courses, setCourses] = useState<ApiCourse[]>([]);
	const [manageCourses, setManageCourses] = useState<ApiCourse[]>([]);
	const [programs, setPrograms] = useState<ApiProgram[]>([]);
	const [programArchiveFilter, setProgramArchiveFilter] = useState<'active' | 'archived'>('active');
	const [teachers, setTeachers] = useState<ApiUser[]>([]);
	const [courseArchiveFilter, setCourseArchiveFilter] = useState<'active' | 'archived'>('active');

	const [manageCoursesPage, setManageCoursesPage] = useState(1);
	const manageCoursesPerPage = 10;
	const [manageCoursesSearch, setManageCoursesSearch] = useState('');

	const [programsPage, setProgramsPage] = useState(1);
	const programsPerPage = 10;
	const [programsSearch, setProgramsSearch] = useState('');

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
	const [pagedUsers, setPagedUsers] = useState<ApiUser[]>([]);
	const [usersTotal, setUsersTotal] = useState(0);
	const [usersPageCount, setUsersPageCount] = useState(1);
	const [usersError, setUsersError] = useState('');
	const [usersLoading, setUsersLoading] = useState(false);
	const [usersPage, setUsersPage] = useState(1);
	const usersPerPage = 10;
	const [usersSearch, setUsersSearch] = useState('');

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
			setAddStudentCourseId(courses[0]!.id);
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

	// Program (Course list) form state
	const [showProgramForm, setShowProgramForm] = useState(false);
	const [programFormMode, setProgramFormMode] = useState<'create' | 'edit'>('create');
	const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
	const [programSaving, setProgramSaving] = useState(false);
	const [programError, setProgramError] = useState('');
	const [programCode, setProgramCode] = useState('');
	const [programTitle, setProgramTitle] = useState('');

	const [systemSettings, setSystemSettings] = useState<AdminSystemSettings>(DEFAULT_SYSTEM_SETTINGS);
	const [settingsNotice, setSettingsNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(
		null,
	);

	const [reportType, setReportType] = useState<'analytics' | 'users' | 'enrollments'>('analytics');
	const [reportFormat, setReportFormat] = useState<'json' | 'csv'>('json');
	const [reportIncludeArchived, setReportIncludeArchived] = useState(false);
	const [reportGenerating, setReportGenerating] = useState(false);

	const dashboardReturnTo = `${location.pathname}${location.search}`;

	const setDashboardSearchParam = (key: string, value: string | null) => {
		const next = new URLSearchParams(searchParams);
		if (value === null) next.delete(key);
		else next.set(key, value);
		setSearchParams(next, { replace: true });
	};

	useEffect(() => {
		const rawTab = searchParams.get('tab');
		if (!rawTab) return;
		if (!isAdminTab(rawTab)) return;
		setActiveTab((prev) => (prev === rawTab ? prev : rawTab));
	}, [searchParams]);

	const resetCompose = () => {
		setComposeDraftId(null);
		setComposeTo('');
		setComposeToUserId(null);
		setComposeSubject('');
		setComposeBody('');
		setComposeError('');
		setComposeSuccess('');
		setComposeSuggestions([]);
	};

	const openCompose = (opts?: { draft?: ApiMessage | null }) => {
		setDashboardSearchParam('tab', 'messages');
		setActiveTab('messages');
		setDashboardSearchParam('compose', '1');
		setMessageComposeOpen(true);
		setSelectedMessageId(null);
		setComposeError('');
		setComposeSuccess('');

		if (opts?.draft) {
			const d = opts.draft;
			setComposeDraftId(d.id);
			setComposeToUserId(d.recipient?.id || null);
			setComposeTo(d.recipient ? `${d.recipient.name} <${d.recipient.email}>` : '');
			setComposeSubject(d.subject || '');
			setComposeBody(d.body || '');
		} else {
			resetCompose();
		}
	};

	const closeCompose = () => {
		setDashboardSearchParam('compose', null);
		setMessageComposeOpen(false);
		setComposeError('');
		setComposeSuccess('');
		setComposeSuggestions([]);
		setComposeSuggestionsLoading(false);
	};

	const parseEmail = (value: string): string | null => {
		const m = value.match(/<([^>]+)>/);
		if (m?.[1]) return m[1].trim();
		if (value.includes('@')) return value.trim();
		return null;
	};

	const syncComposeRecipientFromInput = (value: string) => {
		const email = parseEmail(value);
		if (!email) {
			setComposeToUserId(null);
			return;
		}
		const found = composeSuggestions.find((u) => u.email.toLowerCase() === email.toLowerCase());
		setComposeToUserId(found ? found.id : null);
	};

	const handleSelectMessage = async (m: ApiMessage) => {
		if (m.status === 'draft') {
			openCompose({ draft: m });
			return;
		}

		setSelectedMessageId(m.id);
		if (currentUserId) {
			const other =
				String(m.sender?.id || '') === String(currentUserId) ? (m.recipient as any) : (m.sender as any);
			if (other?.id && other?.name && other?.email && other?.role) {
				setChatUser({
					id: String(other.id),
					name: other.name,
					email: other.email,
					role: other.role,
				} as ApiUser);
			}
		}
		if (messageFolder === 'inbox' && !m.readAt) {
			try {
				const res = await api.messageRead(m.id);
				setMessages((prev) => prev.map((x) => (x.id === m.id ? res.data : x)));
			} catch {
				// ignore
			}
		}
	};

	useEffect(() => {
		if (activeTab !== 'messages') return;
		if (messageComposeOpen) return;
		if (!selectedMessage || selectedMessage.status === 'draft') {
			setChatThreadMessages([]);
			setChatThreadError('');
			chatLastIsoRef.current = null;
			return;
		}

		if (currentUserId) {
			const other =
				String(selectedMessage.sender?.id || '') === String(currentUserId)
					? (selectedMessage.recipient as any)
					: (selectedMessage.sender as any);
			if (other?.id) {
				setChatUser({
					id: String(other.id),
					name: other.name,
					email: other.email,
					role: other.role,
				} as ApiUser);
			}
		}
	}, [activeTab, currentUserId, messageComposeOpen, selectedMessage]);

	useEffect(() => {
		const el = chatThreadScrollRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [chatThreadMessages.length, chatThreadLoading]);

	useEffect(() => {
		if (activeTab !== 'messages') return;
		if (!chatUser?.id) return;
		if (messageComposeOpen) return;

		let cancelled = false;
		chatLastIsoRef.current = null;
		setChatThreadMessages([]);
		loadChatThread(chatUser.id, 'replace');

		const interval = window.setInterval(() => {
			if (cancelled) return;
			loadChatThread(chatUser.id, 'append');
		}, 3000);

		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, [activeTab, chatUser?.id, messageComposeOpen]);

	const handleSendChatReply = async () => {
		if (!chatUser?.id) return;
		const trimmed = chatReplyBody.trim();
		if (!trimmed) return;
		setChatReplySending(true);
		setChatThreadError('');
		try {
			const res = await api.messageCreate({ toUserId: chatUser.id, body: trimmed, status: 'sent', subject: null });
			setChatThreadMessages((prev) => mergeUniqueMessages(prev, [res.data]));
			setChatReplyBody('');
			const iso = res.data.sentAt || res.data.createdAt || null;
			if (iso) chatLastIsoRef.current = iso;
			if (messageFolder === 'sent') {
				setMessages((prev) => {
					const exists = prev.some((m) => m.id === res.data.id);
					return exists ? prev : [res.data, ...prev];
				});
			}
		} catch (e: any) {
			setChatThreadError(e?.message || 'Failed to send message.');
		} finally {
			setChatReplySending(false);
		}
	};

	const handleSaveDraft = async () => {
		setComposeError('');
		setComposeSuccess('');
		if (!composeToUserId) {
			setComposeError('Please select a recipient to save a draft.');
			return;
		}
		setComposeSaving(true);
		try {
			// Get teacher info for notification
			const teacher = composeSuggestions.find((u) => u.id === composeToUserId);
			const teacherName = teacher?.name || 'Teacher';

			if (composeDraftId) {
				await api.messageUpdate(composeDraftId, {
					toUserId: composeToUserId,
					subject: composeSubject || null,
					body: composeBody,
				});
			} else {
				await api.messageCreate({
					toUserId: composeToUserId,
					subject: composeSubject || null,
					body: composeBody,
					status: 'draft',
				});
			}
			setComposeSuccess(`✓ Draft saved for ${teacherName}`);
			setMessageFolder('drafts');
			setDashboardSearchParam('folder', 'drafts');
			closeCompose();
			setMessagesRefreshKey((k) => k + 1);
		} catch (e: any) {
			setComposeError(e?.message || 'Failed to save draft.');
		} finally {
			setComposeSaving(false);
		}
	};

	const handleSendMessage = async () => {
		setComposeError('');
		setComposeSuccess('');
		if (!composeToUserId) {
			setComposeError('Please select a recipient from the list.');
			return;
		}
		if (!composeBody.trim()) {
			setComposeError('Message body is required.');
			return;
		}

		setComposeSaving(true);
		try {
			// Get teacher info for notification
			const teacher = composeSuggestions.find((u) => u.id === composeToUserId);
			const teacherName = teacher?.name || 'Teacher';

			if (composeDraftId) {
				await api.messageUpdate(composeDraftId, {
					toUserId: composeToUserId,
					subject: composeSubject || null,
					body: composeBody,
					send: true,
				});
			} else {
				await api.messageCreate({
					toUserId: composeToUserId,
					subject: composeSubject || null,
					body: composeBody,
					status: 'sent',
				});
			}

			// Show success message with teacher name
			setComposeSuccess(`✓ Message sent to ${teacherName}`);

			// Try to send browser notification if available
			if ('Notification' in window && Notification.permission === 'granted') {
				try {
					new Notification('Message Sent', {
						body: `Your message to ${teacherName} has been sent successfully.`,
						icon: '/favicon.ico',
					});
				} catch (err) {
					// Ignore notification errors
				}
			}

			// Close compose after short delay
			setTimeout(() => {
				setMessageFolder('sent');
				setDashboardSearchParam('folder', 'sent');
				closeCompose();
				setMessagesRefreshKey((k) => k + 1);
			}, 1500);
		} catch (e: any) {
			setComposeError(e?.message || 'Failed to send message.');
		} finally {
			setComposeSaving(false);
		}
	};

	const handleTrashSelectedMessage = async () => {
		if (!selectedMessage) return;
		try {
			await api.messageTrash(selectedMessage.id);
			setSelectedMessageId(null);
			setMessagesRefreshKey((k) => k + 1);
		} catch {
			// ignore
		}
	};

	const toggleSelectedMessage = (id: string, checked: boolean) => {
		setSelectedMessageIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});
	};

	const handleBulkDeleteSelected = async () => {
		if (messageFolder === 'deleted') return;
		const ids = Array.from(selectedMessageIds);
		if (!ids.length) return;
		try {
			await Promise.allSettled(ids.map((id) => api.messageTrash(id)));
		} finally {
			setSelectedMessageIds(new Set());
			if (selectedMessageId && ids.includes(selectedMessageId)) {
				setSelectedMessageId(null);
				setChatUser(null);
				setChatThreadMessages([]);
				chatLastIsoRef.current = null;
			}
			setMessagesRefreshKey((k) => k + 1);
		}
	};

	const handleRestoreSelectedMessage = async () => {
		if (!selectedMessage) return;
		try {
			await api.messageRestore(selectedMessage.id);
			setSelectedMessageId(null);
			setMessagesRefreshKey((k) => k + 1);
		} catch {
			// ignore
		}
	};

	const handleSelectAll = () => {
		const allIds = messages.map((m) => m.id);
		setSelectedMessageIds(new Set(allIds));
	};

	const handleDeselectAll = () => {
		setSelectedMessageIds(new Set());
	};

	const handleDeleteAll = async () => {
		if (messageFolder === 'deleted') return;
		if (messages.length === 0) return;
		const confirmed = window.confirm(
			`Are you sure you want to delete all ${messages.length} message(s) in this folder? This action cannot be undone.`,
		);
		if (!confirmed) return;

		try {
			await Promise.allSettled(messages.map((m) => api.messageTrash(m.id)));
		} finally {
			setSelectedMessageIds(new Set());
			setSelectedMessageId(null);
			setChatUser(null);
			setChatThreadMessages([]);
			chatLastIsoRef.current = null;
			setMessagesRefreshKey((k) => k + 1);
		}
	};

	useEffect(() => {
		if (activeTab !== 'messages') return;
		const rawFolder = searchParams.get('folder');
		setMessageFolder(isMessageFolder(rawFolder) ? rawFolder : 'inbox');
		setMessageComposeOpen(searchParams.get('compose') === '1');
	}, [activeTab, searchParams]);

	useEffect(() => {
		if (activeTab !== 'messages') return;
		setSelectedMessageIds(new Set());
		setSelectedMessageId(null);
	}, [activeTab, messageFolder]);

	useEffect(() => {
		let cancelled = false;

		async function loadMessages() {
			if (activeTab !== 'messages') return;
			setMessagesError('');
			setMessagesLoading(true);
			try {
				const res = await api.messages({ folder: messageFolder, limit: 30 });
				if (cancelled) return;
				setMessages(res.data);
			} catch (e: any) {
				if (!cancelled) setMessagesError(e?.message || 'Failed to load messages.');
			} finally {
				if (!cancelled) setMessagesLoading(false);
			}
		}

		loadMessages();
		return () => {
			cancelled = true;
		};
	}, [activeTab, messageFolder, messagesRefreshKey]);

	useEffect(() => {
		let cancelled = false;
		const query = composeTo.trim();
		if (!messageComposeOpen) return;
		if (query.length < 1) {
			// Show all teachers if input is empty or just starting
			setComposeSuggestionsLoading(true);
			try {
				// Try to load teachers, fallback to all users if backend doesn't support role filter
				api.users({ role: 'teacher', page: 1, perPage: 15 })
					.then((res) => {
						if (cancelled || !res) return;
						setComposeSuggestions(res.data.filter((u) => u.role === 'teacher'));
						setComposeSuggestionsLoading(false);
					})
					.catch(() => {
						if (cancelled) return;
						setComposeSuggestions([]);
						setComposeSuggestionsLoading(false);
					});
			} catch {
				if (!cancelled) setComposeSuggestions([]);
			}
			return;
		}

		const handle = setTimeout(async () => {
			setComposeSuggestionsLoading(true);
			try {
				// Search for teachers matching query
				const res = await api.users({ q: query, role: 'teacher', page: 1, perPage: 15 });
				if (cancelled) return;
				// Filter for teachers only
				setComposeSuggestions(res.data.filter((u) => u.role === 'teacher'));
			} catch {
				if (!cancelled) setComposeSuggestions([]);
			} finally {
				if (!cancelled) setComposeSuggestionsLoading(false);
			}
		}, 250);

		return () => {
			cancelled = true;
			clearTimeout(handle);
		};
	}, [composeTo, messageComposeOpen]);

	const applyUserRoleFilter = (role: 'all' | ApiUserRole) => {
		setUserRoleFilter(role);
		setDashboardSearchParam('role', role === 'all' ? null : role);
	};

	const persistSystemSettings = async (next: AdminSystemSettings) => {
		setSettingsNotice(null);
		try {
			await api.updateSettings(next);
			setSystemSettings(next);
			setSettingsNotice({ type: 'success', message: 'Settings saved to server.' });
		} catch (e: any) {
			setSettingsNotice({ type: 'error', message: e.message || 'Failed to save settings.' });
		}
	};

	const generateReport = async () => {
		setSettingsNotice(null);
		setReportGenerating(true);
		try {
			const dateTag = new Date().toISOString().slice(0, 10);
			if (reportType === 'analytics') {
				const payload = analytics;
				if (reportFormat === 'json') {
					downloadTextFile(`analytics-report-${dateTag}.json`, JSON.stringify(payload, null, 2), 'application/json');
				} else {
					const rows = [
						['totalUsers', payload.totalUsers],
						['totalAdmins', payload.totalAdmins],
						['totalTeachers', payload.totalTeachers],
						['totalStudents', payload.totalStudents],
						['totalCourses', payload.totalCourses],
						['totalAssignments', payload.totalAssignments],
						['totalEnrollments', payload.totalEnrollments],
						['upcomingSessions', payload.upcomingSessions],
						['activeSessions', payload.activeSessions],
					];
					const csv = ['metric,value', ...rows.map((r) => `${csvCell(r[0])},${csvCell(r[1])}`)].join('\n');
					downloadTextFile(`analytics-report-${dateTag}.csv`, csv, 'text/csv');
				}
				setSettingsNotice({ type: 'success', message: 'Report generated.' });
				return;
			} else if (reportType === 'users') {
				const res = await api.users({ archived: reportIncludeArchived, limit: 5000 });
				const data = res.data;
				if (reportFormat === 'json') {
					downloadTextFile(`users-report-${dateTag}.json`, JSON.stringify(data, null, 2), 'application/json');
				} else {
					const headers = ['ID', 'Name', 'Email', 'Role', 'Status'];
					const rows = data.map((u) => [
						u.id,
						u.name,
						u.email,
						u.role,
						u.archivedAt ? 'Archived' : 'Active',
					]);
					const csv = [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
					downloadTextFile(`users-report-${dateTag}.csv`, csv, 'text/csv');
				}
				setSettingsNotice({ type: 'success', message: 'Report generated.' });
				return;
			} else if (reportType === 'enrollments') {
				const res = await api.allEnrollments();
				const data = res.data;
				if (reportFormat === 'json') {
					downloadTextFile(`enrollments-report-${dateTag}.json`, JSON.stringify(data, null, 2), 'application/json');
				} else {
					const headers = ['ID', 'Student Name', 'Student Email', 'Course Code', 'Course Title', 'Status', 'Enrolled At'];
					const rows = data.map((e: any) => [
						e.id, 
						e.student?.name || '—', 
						e.student?.email || '—', 
						e.course?.code || '—', 
						e.course?.title || '—',
						e.status,
						e.enrolledAt || '—'
					]);
					const csv = [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
					downloadTextFile(`enrollments-report-${dateTag}.csv`, csv, 'text/csv');
				}
				setSettingsNotice({ type: 'success', message: 'Report generated.' });
				return;
			} else if (reportType === 'courses') {
				const res = await api.courses({ archived: reportIncludeArchived });
				const data = res.data;
				if (reportFormat === 'json') {
					downloadTextFile(`courses-report-${dateTag}.json`, JSON.stringify(data, null, 2), 'application/json');
				} else {
					const headers = ['ID', 'Code', 'Title', 'Teacher', 'Term', 'Section', 'Students'];
					const rows = data.map((c) => [
						c.id,
						c.code,
						c.title,
						c.teacher,
						c.term,
						c.section,
						c.students,
					]);
					const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
					downloadTextFile(`courses-report-${dateTag}.csv`, csv, 'text/csv');
				}
				setSettingsNotice({ type: 'success', message: 'Report generated.' });
				return;
			}
		} catch (e: any) {
			setSettingsNotice({ type: 'error', message: e.message || 'Failed to generate report.' });
		} finally {
			setReportGenerating(false);
		}
	};

	useEffect(() => {
		if (activeTab !== 'settings') return;
		let cancelled = false;
		async function load() {
			try {
				const data = await api.settings();
				if (cancelled) return;
				// Merge with defaults in case some keys are missing
				setSystemSettings((prev) => ({
					academicTerm: { ...prev.academicTerm, ...(data.academicTerm || {}) },
					security: { ...prev.security, ...(data.security || {}) },
					backup: { ...prev.backup, ...(data.backup || {}) },
				}));
			} catch {
				// ignore, keep defaults
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [activeTab]);

	const refreshBackups = async () => {
		setBackupsLoading(true);
		try {
			const res = await api.backups();
			setBackups(res.data);
		} catch {
			// ignore
		} finally {
			setBackupsLoading(false);
		}
	};

	useEffect(() => {
		if (activeTab === 'settings') {
			refreshBackups();
		}
	}, [activeTab]);

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
		setCourseTeacherId(teachers.length ? teachers[0]!.id : '');
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
				const [analyticsRes, coursesRes, programsRes] = await Promise.all([
					api.analyticsAdmin({ archived: false }),
					api.courses({ archived: false }),
					api.programs({ archived: false }),
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
				setPrograms(programsRes.data);
			} catch {
				// Keep UI stable if API is unavailable
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, []);

	const resetProgramForm = () => {
		setProgramError('');
		setProgramFormMode('create');
		setEditingProgramId(null);
		setProgramCode('');
		setProgramTitle('');
	};

	const refreshPrograms = async (archived: boolean) => {
		try {
			const res = await api.programs({ archived });
			setPrograms(res.data);
		} catch {
			// Keep UI stable if API is unavailable
		}
	};

	useEffect(() => {
		refreshPrograms(programArchiveFilter === 'archived');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [programArchiveFilter]);

	useEffect(() => {
		let cancelled = false;
		async function loadTeachers() {
			try {
				const res = await api.users({ role: 'teacher', perPage: 10, archived: false });
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
		setUsersPage(1);
	}, [userRoleFilter, userArchiveFilter]);

	useEffect(() => {
		let cancelled = false;
		async function loadUsers() {
			setUsersLoading(true);
			setUsersError('');
			try {
				const res = await api.users({
					role: userRoleFilter === 'all' ? undefined : userRoleFilter,
					q: usersSearch.trim() ? usersSearch.trim() : undefined,
					page: usersPage,
					perPage: usersPerPage,
					archived: userArchiveFilter === 'archived',
				});
				if (!cancelled) {
					setPagedUsers(res.data);
					const total = res.meta?.total ?? res.data.length;
					const pages = res.meta?.pages ?? Math.max(1, Math.ceil(total / usersPerPage));
					setUsersTotal(total);
					setUsersPageCount(pages);
					if (usersPage > pages) setUsersPage(pages);
				}
			} catch (e) {
				if (!cancelled) {
					const msg = e instanceof Error ? e.message : 'Failed to load users.';
					setUsersError(msg);
					setPagedUsers([]);
					setUsersTotal(0);
					setUsersPageCount(1);
				}
			} finally {
				if (!cancelled) setUsersLoading(false);
			}
		}
		loadUsers();
		return () => {
			cancelled = true;
		};
	}, [userRoleFilter, userArchiveFilter, usersSearch, usersPage, usersRefreshKey]);

	useEffect(() => {
		let cancelled = false;
		async function loadStudentCourses() {
			const students = pagedUsers.filter((u) => u.role === 'student');
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
	}, [pagedUsers]);

	useEffect(() => {
		setManageCoursesPage(1);
	}, [courseArchiveFilter]);

	useEffect(() => {
		setProgramsPage(1);
	}, [programArchiveFilter]);

	const userPageButtons = useMemo(() => {
		return Array.from({ length: usersPageCount }, (_, idx) => idx + 1);
	}, [usersPageCount]);

	const filteredManageCourses = useMemo(() => {
		const q = manageCoursesSearch.trim().toLowerCase();
		if (!q) return manageCourses;
		return manageCourses.filter((course) => {
			const haystack = `${course.code ?? ''} ${course.title ?? ''}`.toLowerCase();
			return haystack.includes(q);
		});
	}, [manageCourses, manageCoursesSearch]);

	const filteredPrograms = useMemo(() => {
		const q = programsSearch.trim().toLowerCase();
		if (!q) return programs;
		return programs.filter((p) => {
			const haystack = `${p.code ?? ''} ${p.title ?? ''}`.toLowerCase();
			return haystack.includes(q);
		});
	}, [programs, programsSearch]);

	const manageCoursesPageCount = useMemo(() => {
		return Math.max(1, Math.ceil(filteredManageCourses.length / manageCoursesPerPage));
	}, [filteredManageCourses.length]);

	useEffect(() => {
		setManageCoursesPage((prev) => Math.min(manageCoursesPageCount, Math.max(1, prev)));
	}, [manageCoursesPageCount]);

	const manageCoursesPageButtons = useMemo(() => {
		return Array.from({ length: manageCoursesPageCount }, (_, idx) => idx + 1);
	}, [manageCoursesPageCount]);

	const pagedManageCourses = useMemo(() => {
		const start = (manageCoursesPage - 1) * manageCoursesPerPage;
		return filteredManageCourses.slice(start, start + manageCoursesPerPage);
	}, [filteredManageCourses, manageCoursesPage]);

	const programsPageCount = useMemo(() => {
		return Math.max(1, Math.ceil(filteredPrograms.length / programsPerPage));
	}, [filteredPrograms.length]);

	useEffect(() => {
		setProgramsPage((prev) => Math.min(programsPageCount, Math.max(1, prev)));
	}, [programsPageCount]);

	const programsPageButtons = useMemo(() => {
		return Array.from({ length: programsPageCount }, (_, idx) => idx + 1);
	}, [programsPageCount]);

	const pagedPrograms = useMemo(() => {
		const start = (programsPage - 1) * programsPerPage;
		return filteredPrograms.slice(start, start + programsPerPage);
	}, [filteredPrograms, programsPage]);

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
						<Input
							value={manageCoursesSearch}
							onChange={(e) => {
								setManageCoursesSearch(e.target.value);
								setManageCoursesPage(1);
							}}
							placeholder={itemLabel === 'Class' ? 'Search subject…' : 'Search course…'}
							className="w-full md:w-[260px]"
						/>
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
							{pagedManageCourses.map((course) => (
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

							{filteredManageCourses.length ? (
								<>
									<div className="mt-5 flex flex-wrap justify-center gap-2">
										{manageCoursesPageButtons.map((page) => {
											const isActive = page === manageCoursesPage;
											return (
												<Button
													key={page}
													size="sm"
													variant={isActive ? 'default' : 'outline'}
													onClick={() => setManageCoursesPage(page)}
													disabled={manageCoursesPageCount === 1}
												>
													{page}
												</Button>
											);
										})}
									</div>

									<div className="mt-3 flex justify-center">
										<Button
											variant="outline"
											disabled={manageCoursesPage >= manageCoursesPageCount}
											onClick={() =>
												setManageCoursesPage((prev) => Math.min(manageCoursesPageCount, prev + 1))
											}
										>
											Next
										</Button>
									</div>
								</>
							) : null}
						</div>
					</CardContent>
				</Card>
			</>
		);
	};

	const programManagementContent = () => {
		return (
			<>
				<div className="flex justify-between items-center mb-4">
					<div>
						<h3 className="text-lg font-semibold">Course Management</h3>
						<p className="text-sm text-gray-600">Manage available courses for student enrollment</p>
					</div>
					<div className="flex items-center gap-3">
						<Input
							value={programsSearch}
							onChange={(e) => {
								setProgramsSearch(e.target.value);
								setProgramsPage(1);
							}}
							placeholder="Search course…"
							className="w-full md:w-[260px]"
						/>
						<Select
							value={programArchiveFilter}
							onValueChange={(v) => {
								if (v === 'active' || v === 'archived') setProgramArchiveFilter(v);
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
								if (showProgramForm) {
									resetProgramForm();
									setShowProgramForm(false);
									return;
								}

								setShowProgramForm(true);
								setProgramFormMode('create');
								setProgramError('');
								setEditingProgramId(null);
								setProgramCode('');
								setProgramTitle('');
							}}
						>
							<Plus className="w-4 h-4 mr-2" />
							{showProgramForm ? 'Close' : 'Add Course'}
						</Button>
					</div>
				</div>

				{programError ? (
					<Alert variant="destructive">
						<AlertDescription>{programError}</AlertDescription>
					</Alert>
				) : null}

				{showProgramForm ? (
					<Card className="glass-card">
						<CardHeader>
							<div className="flex items-start justify-between gap-4">
								<div>
									<CardTitle>{programFormMode === 'edit' ? 'Edit Course' : 'Add Course'}</CardTitle>
									<CardDescription>Define the course code and its full name (e.g., BSIT)</CardDescription>
								</div>
								{programFormMode === 'edit' ? (
									<Button
										variant="outline"
										onClick={() => {
											resetProgramForm();
											setShowProgramForm(false);
										}}
										disabled={programSaving}
									>
										Cancel
									</Button>
								) : null}
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="program-code">Code</Label>
									<Input
										id="program-code"
										value={programCode}
										onChange={(e) => setProgramCode(e.target.value)}
										placeholder="e.g. BSIT"
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="program-title">Full Name</Label>
									<Input
										id="program-title"
										value={programTitle}
										onChange={(e) => setProgramTitle(e.target.value)}
										placeholder="e.g. Bachelor of Science in Information Technology"
										required
									/>
								</div>

								<div className="flex items-end">
									<Button
										className="bg-blue-600 hover:bg-blue-700"
										disabled={programSaving}
										onClick={async () => {
											setProgramError('');

											if (!programCode.trim() || !programTitle.trim()) {
												setProgramError('Course code and full name are required');
												return;
											}

											setProgramSaving(true);
											try {
												if (programFormMode === 'edit' && editingProgramId) {
													await api.updateProgram(editingProgramId, {
														code: programCode.trim(),
														title: programTitle.trim(),
													});
												} else {
													await api.createProgram({
														code: programCode.trim(),
														title: programTitle.trim(),
													});
												}

											await refreshPrograms(programArchiveFilter === 'archived');
											resetProgramForm();
											setShowProgramForm(false);
										} catch (e) {
											setProgramError(e instanceof Error ? e.message : 'Failed to save course');
										} finally {
											setProgramSaving(false);
										}
									}}
									>
										{programSaving ? 'Saving…' : programFormMode === 'edit' ? 'Save Changes' : 'Add Course'}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				) : null}

				<Card className="glass-card">
					<CardContent className="p-6">
						<div className="space-y-4">
							{filteredPrograms.length === 0 ? (
								<div className="text-sm text-muted-foreground">No courses found.</div>
							) : (
								pagedPrograms.map((p) => (
									<div key={p.id} className="flex items-center justify-between p-4 glass-item">
										<div className="flex-1">
											<div className="font-semibold">
												<span className="text-blue-600">{p.code}</span> - {p.title}
											</div>
										</div>
										<div className="flex items-center gap-2">
											<span
												className={`px-3 py-1 rounded-full text-xs font-medium ${
													p.status === 'active'
														? 'bg-green-100 text-green-700'
														: 'bg-gray-100 text-gray-700'
												}`}
											>
												{p.status}
											</span>

											<Button
												size="sm"
												onClick={() => {
													setProgramError('');
													setShowProgramForm(true);
													setProgramFormMode('edit');
													setEditingProgramId(p.id);
													setProgramCode(p.code || '');
													setProgramTitle(p.title || '');
												}}
											>
												Edit
											</Button>

											{programArchiveFilter === 'active' && p.status !== 'archived' ? (
												<Button
													variant="outline"
													size="sm"
													onClick={async () => {
														const ok = window.confirm(`Archive ${p.code} - ${p.title}?`);
														if (!ok) return;

														setProgramError('');
														try {
															await api.updateProgram(p.id, { status: 'archived' });
															await refreshPrograms(false);
														} catch (e) {
															setProgramError(e instanceof Error ? e.message : 'Failed to archive course');
														}
													}}
												>
													Archive
												</Button>
											) : null}

											{programArchiveFilter === 'archived' ? (
												<>
													<Button
														variant="outline"
														size="sm"
														onClick={async () => {
															const ok = window.confirm(`Unarchive ${p.code} - ${p.title}?`);
															if (!ok) return;

															setProgramError('');
															try {
																await api.updateProgram(p.id, { status: 'active' });
																await refreshPrograms(true);
															} catch (e) {
																setProgramError(e instanceof Error ? e.message : 'Failed to unarchive course');
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
																`Delete ${p.code} - ${p.title}? This will permanently remove the course.`,
															);
															if (!ok) return;

															setProgramError('');
															try {
																await api.deleteProgram(p.id);
																await refreshPrograms(true);
															} catch (e) {
																setProgramError(e instanceof Error ? e.message : 'Failed to delete course');
															}
														}}
													>
														Delete
													</Button>
												</>
											) : null}
										</div>
									</div>
								))
							)}

							{filteredPrograms.length ? (
								<>
									<div className="mt-5 flex flex-wrap justify-center gap-2">
										{programsPageButtons.map((page) => {
											const isActive = page === programsPage;
											return (
												<Button
													key={page}
													size="sm"
													variant={isActive ? 'default' : 'outline'}
													onClick={() => setProgramsPage(page)}
													disabled={programsPageCount === 1}
												>
													{page}
												</Button>
											);
										})}
									</div>

									<div className="mt-3 flex justify-center">
										<Button
											variant="outline"
											disabled={programsPage >= programsPageCount}
											onClick={() => setProgramsPage((prev) => Math.min(programsPageCount, prev + 1))}
										>
											Next
										</Button>
									</div>
								</>
							) : null}
						</div>
					</CardContent>
				</Card>
			</>
		);
	};

	return (
		<DashboardLayout title="Administrator Dashboard">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

				<Card className="glass-card">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Total Teachers</p>
								<p className="text-3xl font-bold">{analytics.totalTeachers}</p>
								<p className="text-xs text-gray-600 mt-1">Teacher accounts</p>
							</div>
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
								<Users className="w-6 h-6 text-blue-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
			{/* Mobile hamburger menu - visible only on mobile */}
			<div className="flex items-center justify-between lg:hidden mb-4">
				<h3 className="text-lg font-semibold">Admin Dashboard</h3>
				<Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
					<DrawerTrigger asChild>
						<Button variant="outline" size="icon" className="h-9 w-9">
							<Menu className="h-5 w-5" />
						</Button>
					</DrawerTrigger>
					<DrawerPortal>
						<DrawerOverlay />
						<DrawerContent className="max-w-xs">
							<div className="p-4 space-y-4">
								<div className="flex items-center justify-between mb-4">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Administrator</p>
										<h2 className="mt-2 text-lg font-bold text-gray-900">Dashboard</h2>
									</div>
									<DrawerClose asChild>
										<Button variant="ghost" size="icon" className="h-8 w-8">
											<X className="h-4 w-4" />
										</Button>
									</DrawerClose>
								</div>
								<div className="flex flex-col gap-2">
									{adminNavItems.map((item) => {
										const Icon = item.icon;
										const isActive = activeTab === item.value;
										return (
											<Button
												key={item.value}
												type="button"
												variant={isActive ? 'default' : 'ghost'}
												className="w-full justify-start gap-3 rounded-xl"
												onClick={() => {
													setActiveTab(item.value);
													setDashboardSearchParam('tab', item.value);
													setSidebarOpen(false); // Close drawer on mobile after selection
												}}
											>
												<Icon className="h-4 w-4" />
												<span>{item.label}</span>
											</Button>
										);
									})}
								</div>
							</div>
						</DrawerContent>
					</DrawerPortal>
				</Drawer>
			</div>

			{/* Desktop sidebar - hidden on mobile */}
			<aside className="hidden lg:block glass-card h-fit rounded-2xl border border-white/40 p-4 shadow-lg lg:sticky lg:top-6">
				<div className="mb-4 border-b border-white/30 pb-4">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Administrator</p>
					<h2 className="mt-2 text-lg font-bold text-gray-900">Dashboard sections</h2>
					<p className="mt-1 text-sm text-gray-600">Switch between the main admin areas from here.</p>
				</div>
				<div className="flex flex-col gap-2">
					{adminNavItems.map((item) => {
						const Icon = item.icon;
						const isActive = activeTab === item.value;
						return (
							<Button
								key={item.value}
								type="button"
								variant={isActive ? 'default' : 'ghost'}
								className="w-full justify-start gap-3 rounded-xl"
								onClick={() => {
									setActiveTab(item.value);
									setDashboardSearchParam('tab', item.value);
								}}
							>
								<Icon className="h-4 w-4" />
								<span>{item.label}</span>
							</Button>
						);
					})}
				</div>
			</aside>

				<div className="space-y-6">
					{activeTab === 'analytics' && (
						<div className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card className="glass-card">
							<CardHeader>
								<CardTitle>Total Students</CardTitle>
								<CardDescription>Last 10 days</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold mb-3">{analytics.totalStudents}</div>
								<ResponsiveContainer width="100%" height={240}>
									<AreaChart data={analytics.studentsTrend || []}>
										<defs>
											<linearGradient id="studentsTrendFill" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#a855f7" stopOpacity={0.55} />
												<stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="day" />
										<YAxis allowDecimals={false} />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="count"
											stroke="#a855f7"
											strokeWidth={3}
											fill="url(#studentsTrendFill)"
											dot={false}
											activeDot={{ r: 5 }}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card className="glass-card">
							<CardHeader>
								<CardTitle>Total Teachers</CardTitle>
								<CardDescription>Last 10 days</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold mb-3">{analytics.totalTeachers}</div>
								<ResponsiveContainer width="100%" height={240}>
									<LineChart data={analytics.teachersTrend || []}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="day" />
										<YAxis allowDecimals={false} />
										<Tooltip />
										<Line
											type="monotone"
											dataKey="count"
											stroke="#a855f7"
											strokeWidth={3}
											dot={{ r: 4 }}
											activeDot={{ r: 5 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card className="glass-card">
							<CardHeader>
								<CardTitle>Subject Enrollment</CardTitle>
								<CardDescription>Total assigned teachers per subject</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={analytics.subjectTeachers || []}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="subject" />
										<YAxis />
										<Tooltip />
										<Line
											type="monotone"
											dataKey="teachers"
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
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								<div className="p-4 glass-item">
									<div className="text-sm text-gray-600 mb-1">Total Students</div>
									<div className="text-2xl font-bold">{analytics.totalStudents}</div>
								</div>
								<div className="p-4 glass-item">
									<div className="text-sm text-gray-600 mb-1">Total Teachers</div>
									<div className="text-2xl font-bold">{analytics.totalTeachers}</div>
								</div>
								<div className="p-4 glass-item">
									<div className="text-sm text-gray-600 mb-1">Total Enrollments</div>
									<div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
								</div>
								<div className="p-4 glass-item">
									<div className="text-sm text-gray-600 mb-1">Total Assignments</div>
									<div className="text-2xl font-bold">{analytics.totalAssignments}</div>
								</div>
							</div>
						</CardContent>
					</Card>
					</div>
					)}

					{activeTab === 'calendar' && (
						<div className="space-y-6">
							<EventsCalendar canManage={true} />
						</div>
					)}

					{activeTab === 'announcements' && (
						<div className="space-y-6">
							<CourseAnnouncements courses={courses} canPost={true} />
						</div>
					)}

					{activeTab === 'messages' && (
						<div className="space-y-6">
					<div className="flex items-start justify-between gap-4 flex-wrap">
						<div>
							<h3 className="text-lg font-semibold">Messages</h3>
							<p className="text-sm text-gray-600">Inbox, sent, drafts, and deleted messages</p>
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<Button
								variant="outline"
								onClick={() => {
									setDashboardSearchParam('tab', 'analytics');
									setActiveTab('analytics');
								}}
								aria-label="Back to dashboard"
							>
								<ArrowLeft className="w-4 h-4" />
							</Button>
							{messageFolder !== 'deleted' ? (
								<div className="flex items-center gap-2 flex-wrap">
									<Button
										variant="outline"
										size="sm"
										disabled={messages.length === 0}
										onClick={handleSelectAll}
									>
										Select All
									</Button>
									<Button
										variant="outline"
										size="sm"
										disabled={selectedMessageIds.size === 0}
										onClick={handleDeselectAll}
									>
										Deselect All
									</Button>
									<Button
										variant="destructive"
										disabled={selectedMessageIds.size === 0}
										onClick={handleBulkDeleteSelected}
									>
										Delete Selected ({selectedMessageIds.size})
									</Button>
									<Button
										variant="destructive"
										disabled={messages.length === 0}
										onClick={handleDeleteAll}
									>
										Delete All
									</Button>
								</div>
							) : null}
							<Button className="bg-blue-600 hover:bg-blue-700" onClick={() => openCompose()}>
								<Plus className="w-4 h-4 mr-2" />
								Compose
							</Button>
						</div>
					</div>

					<div className="flex items-center gap-2 flex-wrap">
						<Button
							variant={messageFolder === 'inbox' ? 'default' : 'outline'}
							onClick={() => {
								setMessageFolder('inbox');
								setDashboardSearchParam('folder', 'inbox');
								setSelectedMessageId(null);
								closeCompose();
							}}
						>
							Inbox
						</Button>
						<Button
							variant={messageFolder === 'sent' ? 'default' : 'outline'}
							onClick={() => {
								setMessageFolder('sent');
								setDashboardSearchParam('folder', 'sent');
								setSelectedMessageId(null);
								closeCompose();
							}}
						>
							Sent
						</Button>
						<Button
							variant={messageFolder === 'drafts' ? 'default' : 'outline'}
							onClick={() => {
								setMessageFolder('drafts');
								setDashboardSearchParam('folder', 'drafts');
								setSelectedMessageId(null);
								closeCompose();
							}}
						>
							Drafts
						</Button>
						<Button
							variant={messageFolder === 'deleted' ? 'default' : 'outline'}
							onClick={() => {
								setMessageFolder('deleted');
								setDashboardSearchParam('folder', 'deleted');
								setSelectedMessageId(null);
								closeCompose();
							}}
						>
							Deleted
						</Button>
					</div>

					{messagesError ? (
						<Alert variant="destructive">
							<AlertDescription>{messagesError}</AlertDescription>
						</Alert>
					) : null}

					{messageComposeOpen ? (
						<Card className="glass-card">
							<CardHeader>
								<CardTitle>Compose Message</CardTitle>
								<CardDescription>Send a message to an individual user</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Send to Teacher</Label>
									<Input
										value={composeTo}
										placeholder="Search teacher by name or email…"
										onChange={(e) => setComposeTo(e.target.value)}
									/>
									{composeSuggestionsLoading ? (
										<div className="text-xs text-muted-foreground mt-2">Loading teachers…</div>
									) : composeSuggestions.length === 0 ? (
										<div className="text-xs text-muted-foreground mt-2">No teachers found</div>
									) : (
										<div className="mt-2 space-y-1 max-h-40 overflow-auto border rounded p-2 bg-slate-50">
											{composeSuggestions.map((u) => (
												<button
													type="button"
													key={u.id}
													onClick={() => {
														setComposeToUserId(u.id);
														setComposeTo(`${u.name} <${u.email}>`);
													}}
													className="w-full text-left px-3 py-2 rounded hover:bg-blue-100 transition text-sm"
												>
													<div className="font-medium">{u.name}</div>
													<div className="text-xs text-gray-600">{u.email}</div>
												</button>
											))}
										</div>
									)}
									{composeToUserId ? (
										<div className="text-xs text-green-600 mt-1">✓ Recipient selected</div>
									) : null}
								</div>

								<div className="space-y-2">
									<Label htmlFor="compose-subject">Subject (optional)</Label>
									<Input
										id="compose-subject"
										value={composeSubject}
										onChange={(e) => setComposeSubject(e.target.value)}
										placeholder="Subject"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="compose-body">Message</Label>
									<Textarea
										id="compose-body"
										value={composeBody}
										onChange={(e) => setComposeBody(e.target.value)}
										placeholder="Write your message…"
										rows={8}
									/>
								</div>

								{composeError ? (
									<Alert variant="destructive">
										<AlertDescription>{composeError}</AlertDescription>
									</Alert>
								) : null}
								{composeSuccess ? (
									<Alert>
										<AlertDescription>{composeSuccess}</AlertDescription>
									</Alert>
								) : null}

								<div className="flex items-center justify-end gap-2">
									<Button
										variant="outline"
										disabled={composeSaving}
										onClick={() => {
											closeCompose();
											resetCompose();
										}}
									>
										Cancel
									</Button>
									<Button
										variant="secondary"
										disabled={composeSaving || !composeToUserId}
										onClick={handleSaveDraft}
									>
										Save Draft
									</Button>
									<Button
										disabled={composeSaving || !composeToUserId}
										onClick={handleSendMessage}
										className="bg-blue-600 hover:bg-blue-700"
									>
										{composeSaving ? 'Sending…' : 'Send Message'}
									</Button>
								</div>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<Card className="glass-card">
								<CardHeader>
									<CardTitle>
										{messageFolder === 'inbox'
											? 'Inbox'
											: messageFolder === 'sent'
												? 'Sent'
												: messageFolder === 'drafts'
													? 'Drafts'
													: 'Deleted'}
									</CardTitle>
									<CardDescription>
										{messagesLoading
											? 'Loading…'
											: messages.length
												? `${messages.length} message(s)`
												: 'No messages.'}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{messages.length === 0 ? (
										<div className="text-sm text-muted-foreground">No messages found.</div>
									) : (
										<div className="space-y-2 max-h-[520px] overflow-auto">
											{messages.map((m) => {
												const iso = m.sentAt || m.createdAt;
												const when = iso ? new Date(iso).toLocaleString() : '—';
												const title = m.subject?.trim() ? m.subject.trim() : '(No subject)';
												const isUnread = messageFolder === 'inbox' && m.status === 'sent' && !m.readAt;
												const selected = selectedMessageId === m.id;
												const checked = selectedMessageIds.has(m.id);
												const partyLine =
													messageFolder === 'sent'
														? `To: ${m.recipient?.name || '—'}`
														: messageFolder === 'inbox'
															? `From: ${m.sender?.name || '—'}`
															: `From: ${m.sender?.name || '—'} • To: ${m.recipient?.name || '—'}`;

												return (
													<div key={m.id} className={`flex items-start justify-between gap-3 p-3 glass-item ${
														selected ? 'ring-2 ring-blue-600' : ''
													}`}>
														<button
															type="button"
															onClick={() => handleSelectMessage(m)}
															className="flex items-start gap-3 min-w-0 flex-1 text-left"
														>
															<Checkbox
																checked={checked}
																onCheckedChange={(v) => toggleSelectedMessage(m.id, v === true)}
																onClick={(e) => e.stopPropagation()}
															/>
															<div className="min-w-0">
																<div className="flex items-center gap-2">
																	<div className="font-medium truncate">{title}</div>
																	{m.status === 'draft' ? <Badge variant="secondary">Draft</Badge> : null}
																	{isUnread ? <Badge>Unread</Badge> : null}
																</div>
																<div className="text-xs text-gray-600 truncate">{partyLine}</div>
															</div>
														</button>
														<div className="flex items-center gap-2 whitespace-nowrap">
															<div className="text-xs text-gray-500">{when}</div>
															{messageFolder !== 'deleted' ? (
																<Button
																	size="sm"
																	variant="ghost"
																	onClick={(e) => {
																		e.stopPropagation();
																		setSelectedMessageId(m.id);
																		handleTrashSelectedMessage();
																	}}
																	className="text-red-600 hover:text-red-700 hover:bg-red-50"
																>
																	Delete
																</Button>
															) : null}
														</div>
													</div>
												);
											})}
										</div>
									)}
								</CardContent>
							</Card>

							<Card className="glass-card">
								<CardHeader>
									<div className="flex items-center justify-between gap-3">
										<CardTitle>{chatUser ? `Chat: ${chatUser.name}` : 'Chat'}</CardTitle>
										{chatUser ? (
											<Button
												variant="outline"
												onClick={() => {
													setSelectedMessageId(null);
													setChatUser(null);
													setChatThreadMessages([]);
													chatLastIsoRef.current = null;
												}}
											>
												<ArrowLeft className="w-4 h-4" />
											</Button>
										) : null}
									</div>
									<CardDescription>
										{chatUser ? chatUser.email : 'Select a message to start chatting.'}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{!selectedMessage ? (
										<div className="text-sm text-muted-foreground">No message selected.</div>
									) : selectedMessage.status === 'draft' ? (
										<div className="space-y-4">
											<div className="text-sm text-muted-foreground">This is a draft. Edit it to send.</div>
											<Button variant="secondary" onClick={() => openCompose({ draft: selectedMessage })}>
												Edit Draft
											</Button>
										</div>
									) : (
										<div className="space-y-4">
											{chatThreadError ? (
												<Alert variant="destructive">
													<AlertDescription>{chatThreadError}</AlertDescription>
												</Alert>
											) : null}

											<div ref={chatThreadScrollRef} className="max-h-[420px] overflow-auto space-y-2 p-1">
												{chatThreadLoading && chatThreadMessages.length === 0 ? (
													<div className="text-sm text-muted-foreground">Loading chat…</div>
												) : null}
												{chatThreadMessages.map((m) => {
													const mine = currentUserId && String(m.sender?.id || '') === String(currentUserId);
													const iso = m.sentAt || m.createdAt;
													const when = iso ? new Date(iso).toLocaleTimeString() : '';
													return (
														<div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
															<div className={`max-w-[80%] p-3 glass-item ${mine ? 'text-right' : ''}`}>
																<div className="text-sm whitespace-pre-wrap">{m.body}</div>
																<div className="text-[11px] text-gray-500 mt-1">{when}</div>
															</div>
														</div>
													);
												})}
											</div>

											<div className="space-y-2">
												<Textarea
													value={chatReplyBody}
													onChange={(e) => setChatReplyBody(e.target.value)}
													placeholder="Type a reply…"
													rows={3}
												/>
												<div className="flex items-center justify-end gap-2 flex-wrap">
													<Button
														className="bg-blue-600 hover:bg-blue-700"
														disabled={chatReplySending || !chatReplyBody.trim()}
														onClick={handleSendChatReply}
													>
														{chatReplySending ? 'Sending…' : 'Send'}
													</Button>
													{messageFolder === 'deleted' ? (
														<Button variant="secondary" onClick={handleRestoreSelectedMessage}>
															Restore
														</Button>
													) : (
														<Button variant="destructive" onClick={handleTrashSelectedMessage}>
															Delete
														</Button>
													)}
												</div>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					)}
					</div>
					)}

					{activeTab === 'users' && (
						<div className="space-y-6">
					<div className="flex items-start justify-between gap-4 flex-wrap">
						<div>
							<h3 className="text-lg font-semibold">User Management</h3>
							<p className="text-sm text-gray-600">Add, archive, and manage user accounts</p>
						</div>
						<div className="flex items-center gap-3">
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
						<Card
							className={`glass-card cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background hover:bg-primary/10 hover:border-primary/40 ${userRoleFilter === 'all' ? 'ring-2 ring-ring bg-primary/10 border-primary/50' : 'hover:ring-1 hover:ring-ring/40'}`}
							role="button"
							tabIndex={0}
							aria-pressed={userRoleFilter === 'all'}
							onClick={() => applyUserRoleFilter('all')}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									applyUserRoleFilter('all');
								}
							}}
						>
							<CardContent className="p-5">
								<div className="text-sm text-gray-600">Total Users</div>
								<div className="text-2xl font-bold">{userCounts.totalUsers}</div>
							</CardContent>
						</Card>
						<Card
							className={`glass-card cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background hover:bg-primary/10 hover:border-primary/40 ${userRoleFilter === 'student' ? 'ring-2 ring-ring bg-primary/10 border-primary/50' : 'hover:ring-1 hover:ring-ring/40'}`}
							role="button"
							tabIndex={0}
							aria-pressed={userRoleFilter === 'student'}
							onClick={() => applyUserRoleFilter('student')}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									applyUserRoleFilter('student');
								}
							}}
						>
							<CardContent className="p-5">
								<div className="text-sm text-gray-600">Students</div>
								<div className="text-2xl font-bold">{userCounts.totalStudents}</div>
							</CardContent>
						</Card>
						<Card
							className={`glass-card cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background hover:bg-primary/10 hover:border-primary/40 ${userRoleFilter === 'teacher' ? 'ring-2 ring-ring bg-primary/10 border-primary/50' : 'hover:ring-1 hover:ring-ring/40'}`}
							role="button"
							tabIndex={0}
							aria-pressed={userRoleFilter === 'teacher'}
							onClick={() => applyUserRoleFilter('teacher')}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									applyUserRoleFilter('teacher');
								}
							}}
						>
							<CardContent className="p-5">
								<div className="text-sm text-gray-600">Teachers</div>
								<div className="text-2xl font-bold">{userCounts.totalTeachers}</div>
							</CardContent>
						</Card>
						<Card
							className={`glass-card cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background hover:bg-primary/10 hover:border-primary/40 ${userRoleFilter === 'admin' ? 'ring-2 ring-ring bg-primary/10 border-primary/50' : 'hover:ring-1 hover:ring-ring/40'}`}
							role="button"
							tabIndex={0}
							aria-pressed={userRoleFilter === 'admin'}
							onClick={() => applyUserRoleFilter('admin')}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									applyUserRoleFilter('admin');
								}
							}}
						>
							<CardContent className="p-5">
								<div className="text-sm text-gray-600">Admins</div>
								<div className="text-2xl font-bold">{userCounts.totalAdmins}</div>
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
							<div className="flex items-start justify-between gap-4 flex-wrap">
								<div>
									<CardTitle>Users</CardTitle>
									<CardDescription>
										{usersLoading
											? 'Loading…'
											: usersTotal
												? `Showing ${pagedUsers.length} of ${usersTotal} user(s)`
												: 'No users found.'}
										{studentCourseLoading ? ' • Loading student courses…' : ''}
									</CardDescription>
								</div>
								<div className="w-full md:w-[280px]">
									<Input
										value={usersSearch}
										onChange={(e) => {
											setUsersSearch(e.target.value);
											setUsersPage(1);
										}}
										list="users-search-suggestions"
										placeholder={
											userRoleFilter === 'student'
												? 'Search student name…'
												: userRoleFilter === 'teacher'
													? 'Search teacher name…'
													: 'Search user name…'
										}
									/>
									<datalist id="users-search-suggestions">
										{Array.from(
											new Map(pagedUsers.map((u) => [u.name.trim().toLowerCase(), u])).values(),
										)
											.slice(0, 10)
											.map((u) => (
												<option key={u.id} value={u.name}>
													{u.email}
												</option>
											))}
									</datalist>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{pagedUsers.length === 0 ? (
									<div className="text-sm text-muted-foreground">No users found.</div>
								) : (
								pagedUsers.map((u) => {
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

							{usersTotal ? (
								<>
									<div className="mt-5 flex flex-wrap justify-center gap-2">
										{userPageButtons.map((page) => {
											const isActive = page === usersPage;
											return (
												<Button
													key={page}
													size="sm"
													variant={isActive ? 'default' : 'outline'}
													onClick={() => setUsersPage(page)}
													disabled={usersLoading}
												>
													{page}
												</Button>
											);
										})}
									</div>

									<div className="mt-3 flex justify-center">
										<Button
											variant="outline"
											disabled={usersLoading || usersPage >= usersPageCount}
											onClick={() => setUsersPage((prev) => Math.min(usersPageCount, prev + 1))}
										>
											Next
										</Button>
									</div>
								</>
							) : null}
						</CardContent>
					</Card>
					</div>
					)}

					{activeTab === 'courses' && (
						<div className="space-y-6">
					{courseManagementContent(
						'Class Management',
						'Manage subjects, sections, and academic terms',
						'full',
						'Class',
						true,
						true,
						true,
					)}
						</div>
					)}

					{activeTab === 'courseManagement' && (
						<div className="space-y-6">
							{programManagementContent()}
						</div>
					)}

					{activeTab === 'settings' && (
						<div className="space-y-6">
					<Card className="glass-card">
						<CardHeader>
							<CardTitle>System Settings</CardTitle>
							<CardDescription>Configure system-wide settings and permissions</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{settingsNotice ? (
								<Alert variant={settingsNotice.type === 'error' ? 'destructive' : 'default'}>
									<AlertDescription>{settingsNotice.message}</AlertDescription>
								</Alert>
							) : null}
							<div className="space-y-4">
								<div className="p-4 glass-item space-y-4">
									<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
										<div>
											<div className="font-semibold">Generate Report</div>
											<div className="text-sm text-gray-600">Export system data for records and auditing</div>
										</div>
										<Button variant="outline" onClick={generateReport} disabled={reportGenerating}>
											{reportGenerating ? 'Generating…' : 'Generate'}
										</Button>
									</div>

									<div className="grid gap-4 md:grid-cols-3">
										<div className="space-y-2">
											<Label>Report Type</Label>
											<Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
												<SelectTrigger>
													<SelectValue placeholder="Select" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="analytics">Analytics Summary</SelectItem>
													<SelectItem value="users">User Directory</SelectItem>
													<SelectItem value="enrollments">Enrollment Overview</SelectItem>
													<SelectItem value="courses">Courses</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label>Format</Label>
											<Select value={reportFormat} onValueChange={(v) => setReportFormat(v as any)}>
												<SelectTrigger>
													<SelectValue placeholder="Select" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="csv">CSV</SelectItem>
													<SelectItem value="json">JSON</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
											<div>
												<div className="text-sm font-medium">Include archived</div>
												<div className="text-xs text-gray-600">Optional</div>
											</div>
											<Switch
												checked={reportIncludeArchived}
												onCheckedChange={setReportIncludeArchived}
											/>
										</div>
									</div>
								</div>

								<div className="p-4 glass-item space-y-4">
									<div>
										<div className="font-semibold">Academic Term</div>
										<div className="text-sm text-gray-600">Set the active academic term details</div>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label>Term Name</Label>
											<Input
												placeholder="e.g., AY 2026-2027"
												value={systemSettings.academicTerm.termName}
												onChange={(e) =>
													setSystemSettings((prev) => ({
														...prev,
														academicTerm: { ...prev.academicTerm, termName: e.target.value },
													}))
												}
											/>
										</div>

										<div className="space-y-2">
											<Label>School Year</Label>
											<Input
												placeholder="e.g., 2026-2027"
												value={systemSettings.academicTerm.schoolYear}
												onChange={(e) =>
													setSystemSettings((prev) => ({
														...prev,
														academicTerm: { ...prev.academicTerm, schoolYear: e.target.value },
													}))
												}
											/>
										</div>
									</div>

									<div className="grid gap-4 md:grid-cols-3">
										<div className="space-y-2">
											<Label>Semester</Label>
											<Select
												value={systemSettings.academicTerm.semester}
												onValueChange={(v) =>
													setSystemSettings((prev) => ({
														...prev,
														academicTerm: { ...prev.academicTerm, semester: v as any },
													}))
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="1st Semester">1st Semester</SelectItem>
													<SelectItem value="2nd Semester">2nd Semester</SelectItem>
													<SelectItem value="Summer">Summer</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Starts On</Label>
											<Input
												type="date"
												value={systemSettings.academicTerm.startsOn}
												onChange={(e) =>
													setSystemSettings((prev) => ({
														...prev,
														academicTerm: { ...prev.academicTerm, startsOn: e.target.value },
													}))
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>Ends On</Label>
											<Input
												type="date"
												value={systemSettings.academicTerm.endsOn}
												onChange={(e) =>
													setSystemSettings((prev) => ({
														...prev,
														academicTerm: { ...prev.academicTerm, endsOn: e.target.value },
													}))
												}
											/>
										</div>
									</div>

									<div className="flex items-center justify-between gap-3">
										<div className="text-sm text-gray-600">
											{systemSettings.academicTerm.termName || systemSettings.academicTerm.schoolYear
												? 'Configured'
												: 'Not configured'}
										</div>
										<Button
											variant="outline"
											onClick={() => persistSystemSettings(systemSettings)}
										>
											Save Academic Term
										</Button>
									</div>
								</div>

								<div className="p-4 glass-item space-y-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<div className="font-semibold">Security Settings</div>
											<div className="text-sm text-gray-600">Password policy and session controls</div>
										</div>
										<div className="pt-1">
											<Settings className="h-4 w-4 text-gray-600" />
										</div>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label>Minimum Password Length</Label>
											<Input
												type="number"
												min={6}
												value={systemSettings.security.minPasswordLength}
												onChange={(e) =>
													setSystemSettings((prev) => ({
														...prev,
														security: {
															...prev.security,
															minPasswordLength: Number(e.target.value || 0),
														},
													}))
												}
											/>
										</div>

										<div className="space-y-2">
											<Label>Session Timeout (minutes)</Label>
											<Input
												type="number"
												min={5}
												value={systemSettings.security.sessionTimeoutMinutes}
												onChange={(e) =>
													setSystemSettings((prev) => ({
														...prev,
														security: {
															...prev.security,
															sessionTimeoutMinutes: Number(e.target.value || 0),
														},
													}))
												}
											/>
										</div>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
											<div>
												<div className="text-sm font-medium">Require complex password</div>
												<div className="text-xs text-gray-600">Upper/lowercase + number</div>
											</div>
											<Switch
												checked={systemSettings.security.requireComplexPassword}
												onCheckedChange={(checked) =>
													setSystemSettings((prev) => ({
														...prev,
														security: { ...prev.security, requireComplexPassword: checked },
													}))
												}
											/>
										</div>

										<div className="space-y-2">
											<Label>Lockout After Failed Logins</Label>
											<Input
												type="number"
												min={1}
												value={systemSettings.security.lockoutAfterFailedLogins}
												onChange={(e) =>
													setSystemSettings((prev) => ({
														...prev,
														security: {
															...prev.security,
															lockoutAfterFailedLogins: Number(e.target.value || 0),
														},
													}))
												}
											/>
										</div>
									</div>

									<div className="flex justify-end">
										<Button variant="outline" onClick={() => persistSystemSettings(systemSettings)}>
											Save Security Settings
										</Button>
									</div>
								</div>

								<div className="p-4 glass-item space-y-4">
									<div>
										<div className="font-semibold">Backup &amp; Recovery</div>
										<div className="text-sm text-gray-600">Configure backups and retention</div>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
											<div>
												<div className="text-sm font-medium">Automatic backups</div>
												<div className="text-xs text-gray-600">Enable scheduled backups</div>
											</div>
											<Switch
												checked={systemSettings.backup.autoBackupEnabled}
												onCheckedChange={(checked) =>
													setSystemSettings((prev) => ({
														...prev,
														backup: { ...prev.backup, autoBackupEnabled: checked },
													}))
												}
											/>
										</div>

										<div className="space-y-2">
											<Label>Retention (days)</Label>
											<Input
												type="number"
												min={1}
												value={systemSettings.backup.retentionDays}
												onChange={(e) =>
													setSystemSettings((prev) => ({
														...prev,
														backup: { ...prev.backup, retentionDays: Number(e.target.value || 0) },
													}))
												}
											/>
										</div>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label>Frequency</Label>
											<Select
												value={systemSettings.backup.frequency}
												onValueChange={(v) =>
													setSystemSettings((prev) => ({
														...prev,
														backup: { ...prev.backup, frequency: v as any },
													}))
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="daily">Daily</SelectItem>
													<SelectItem value="weekly">Weekly</SelectItem>
													<SelectItem value="monthly">Monthly</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="rounded-md border bg-background px-3 py-2">
											<div className="text-sm font-medium">Last backup</div>
											<div className="text-xs text-gray-600">
												{systemSettings.backup.lastBackupAt
													? new Date(systemSettings.backup.lastBackupAt).toLocaleString()
													: 'Never'}
											</div>
										</div>
									</div>

									<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
										<Button
											variant="outline"
											disabled={backupsLoading}
											onClick={async () => {
												setBackupsLoading(true);
												try {
													await api.createBackup();
													await refreshBackups();
													const next: AdminSystemSettings = {
														...systemSettings,
														backup: { ...systemSettings.backup, lastBackupAt: new Date().toISOString() },
													};
													persistSystemSettings(next);
													setSettingsNotice({ type: 'success', message: 'Backup created.' });
												} catch (err: any) {
													setSettingsNotice({ type: 'error', message: err.message || 'Backup failed.' });
												} finally {
													setBackupsLoading(false);
												}
											}}
										>
											Backup Now
										</Button>
										<Button variant="outline" onClick={() => persistSystemSettings(systemSettings)}>
											Save Backup Settings
										</Button>
									</div>

									<div className="pt-4 border-t space-y-3">
										<div className="text-sm font-medium">Available Backups</div>
										{backupsLoading && backups.length === 0 ? (
											<div className="text-xs text-muted-foreground italic">Loading backups...</div>
										) : backups.length === 0 ? (
											<div className="text-xs text-muted-foreground italic">No backups found.</div>
										) : (
											<div className="space-y-2">
												{backups.map((b) => (
													<div key={b.id} className="flex items-center justify-between p-2 rounded border bg-background/50">
														<div className="min-w-0">
															<div className="text-xs font-medium truncate">{b.filename}</div>
															<div className="text-[10px] text-muted-foreground">
																{(b.size / 1024).toFixed(1)} KB • {new Date(b.createdAt).toLocaleString()}
															</div>
														</div>
														<div className="flex items-center gap-1">
															<Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" asChild>
																<a href={api.backupDownloadUrl(b.filename)} download>Download</a>
															</Button>
															<Button 
																variant="ghost" 
																size="sm" 
																className="h-7 px-2 text-[10px] text-red-600 hover:text-red-700"
																onClick={async () => {
																	if (confirm('Delete this backup?')) {
																		try {
																			await api.deleteBackup(b.filename);
																			await refreshBackups();
																		} catch (err: any) {
																			alert(err.message || 'Delete failed');
																		}
																	}
																}}
															>
																Delete
															</Button>
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}
