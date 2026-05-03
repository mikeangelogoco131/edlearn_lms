// Attendance types
export interface ApiAttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'late' | 'absent';
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
  student?: ApiUser;
}

export type ApiAttendanceStatus = 'present' | 'late' | 'absent';

export const attendanceApi = {
  // Teacher: Get attendance for a session
  async getSessionAttendance(sessionId: string) {
    return apiFetch<ApiAttendanceRecord[]>(`/api/sessions/${encodeURIComponent(sessionId)}/attendance`);
  },
  // Teacher: Update attendance for a student in a session
  async setAttendance(sessionId: string, studentId: string, status: ApiAttendanceStatus, remarks?: string) {
    return apiFetch<ApiAttendanceRecord>(
      `/api/sessions/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(studentId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, remarks }),
      }
    );
  },
  // Student: Get own attendance records
  async getMyAttendance() {
    return apiFetch<ApiAttendanceRecord[]>(`/api/me/attendance`);
  },
  // Teacher/Admin: Get attendance report for a course
  async getCourseAttendanceReport(courseId: string) {
    return apiFetch<ApiAttendanceRecord[]>(`/api/courses/${encodeURIComponent(courseId)}/attendance-report`);
  },
};
export type ApiUserRole = 'admin' | 'teacher' | 'student';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole;
  archivedAt?: string | null;
  avatarUrl?: string | null;
}

export interface ApiLoginResponse {
  token: string;
  user: ApiUser;
}

export interface ApiMessageResponse {
  message: string;
  debug_token?: string;
}

export interface ApiCourse {
  id: string;
  title: string;
  code: string;
  description: string;
  teacher: string;
  teacherId: string | null;
  students: number;
  term: string;
  section: string;
  schedule: string;
  status: 'active' | 'completed' | 'upcoming' | string;
  nextClass?: string | null;
  materials: number;
  assignments: number;
}

export interface ApiCourseUpsert {
  code: string;
  title: string;
  description?: string | null;
  section?: string | null;
  term?: string | null;
  schedule?: string | null;
  teacher_id?: number | string | null;
  status?: string;
  starts_on?: string | null;
  ends_on?: string | null;
}

export interface ApiClassSession {
  id: string;
  courseId: string;
  title: string;
  date: string | null;
  time: string | null;
  duration: string | null;
  status: 'scheduled' | 'live' | 'completed' | string;
  attendees?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  meetingUrl?: string | null;
}

export interface ApiAssignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  period?: string;
  weekInPeriod?: number;
  dueDate: string | null;
  points: number;
  submitted?: number | null;
  total?: number | null;
  status: 'draft' | 'published' | 'closed' | string;
  submissionType?: 'online_text' | 'file_upload' | 'text_and_file' | 'quiz' | string;
  rubric?: Array<{ name: string; weight: number }> | null;
  quizData?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      points: number;
    }>;
  } | null;
}

export interface ApiInboxNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  readAt: string | null;
  createdAt: string;
}

export interface ApiLesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  period?: string;
  weekInPeriod?: number;
  order: number;
  duration: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string | null;
}

export interface ApiMaterial {
  id: string;
  courseId: string;
  title: string;
  description: string;
  period?: string;
  weekInPeriod?: number;
  originalName: string;
  mimeType: string | null;
  sizeBytes: number;
  downloadPath: string;
  createdAt: string | null;
}

export interface ApiSubmissionStudent {
  id: string;
  name: string;
  email: string;
}

export interface ApiSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  student: ApiSubmissionStudent | null;
  status: string;
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  gradedAt: string | null;
  content: string | null;
  quizAnswers?: Array<{ questionIndex: number; answer: string }> | null;
  fileUrl?: string | null;
  originalFileName?: string | null;
  fileMimeType?: string | null;
  fileSizeBytes?: number | null;
}

export interface ApiCourseGradeRow {
  student: { id: string; name: string; email: string };
  computedPercent: number | null;
  gradedCount: number;
  possiblePoints: number;
  earnedPoints: number;
  finalGrade: number | null;
  remarks: string | null;
}

export interface ApiMyCourseGrade {
  computedPercent: number | null;
  gradedCount: number;
  possiblePoints: number;
  earnedPoints: number;
  finalGrade: number | null;
  remarks: string | null;
}

export interface ApiEvent {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
}

export interface ApiEnrollmentStudent {
  id: string;
  name: string;
  email: string;
}

export interface ApiEnrollmentCourse {
  id: string;
  code: string;
  title: string;
  status: string;
}

export interface ApiUserEnrollment {
  id: string;
  courseId: string;
  status: string;
  enrolledAt: string | null;
  course: ApiEnrollmentCourse | null;
}

export interface ApiEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  student: ApiEnrollmentStudent | null;
  status: string;
  enrolledAt: string | null;
}

export interface ApiAnalyticsAdmin {
  totalUsers: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  totalCourses: number;
  totalAssignments: number;
  totalEnrollments: number;
  upcomingSessions: number;
  activeSessions: number;
  weeklyEngagement: Array<{ day: string; hours: number }>;
  courseEnrollment: Array<{ course: string; students: number }>;
	subjectTeachers?: Array<{ subject: string; teachers: number }>;
	studentsTrend?: Array<{ day: string; count: number }>;
	teachersTrend?: Array<{ day: string; count: number }>;
}

export interface ApiAnnouncementAuthor {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole;
}

export interface ApiAnnouncement {
  id: string;
  courseId: string | null;
  title: string;
  body: string;
  isPinned: boolean;
  publishedAt: string | null;
  author: ApiAnnouncementAuthor | null;
}

export interface ApiNotificationCourse {
  id: string;
  code: string;
  title: string;
}

export interface ApiNotificationAuthor {
  id: string;
  name: string;
  role: ApiUserRole;
}

export interface ApiNotificationUser {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole;
}

export interface ApiNotificationEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
}

export type ApiNotificationType =
  | 'announcement'
  | 'teacher_message'
  | 'announcement_expiring'
  | 'user_added'
  | 'course_added'
  | 'class_session_added'
  | 'event_added'
  | 'event_ending'
  | 'course_assigned'
  | 'course_enrolled'
  | 'course_dropped'
  | 'assignment_added';

export interface ApiNotification {
  id: string;
  type: ApiNotificationType;
  title: string;
  message?: string; // Added for compatibility
  data?: any; // Added for URL navigation
  readAt?: string | null; // Added for read status
  createdAt?: string; // Added for date display
  publishedAt: string | null;
  isPinned: boolean;
  course: ApiNotificationCourse | null;
  author: ApiNotificationAuthor | null;
  user?: ApiNotificationUser | null;
  event?: ApiNotificationEvent | null;
  expiresAt?: string | null;
}

export interface ApiMessageParty {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole;
}

export interface ApiMessage {
  id: string;
  subject: string | null;
  body: string;
  status: 'draft' | 'sent' | 'deleted';
  sentAt: string | null;
  readAt: string | null;
  createdAt: string | null;
  sender: ApiMessageParty | null;
  recipient: ApiMessageParty | null;
}

export interface ApiProgram {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
}

export interface ApiProgramUpsert {
  code: string;
  title: string;
  description?: string | null;
  status?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  meta?: {
    total: number;
    page: number;
    perPage: number;
    pages: number;
  };
}

export interface ApiItemResponse<T> {
  data: T;
}

const DEFAULT_BASE_URL = 'http://127.0.0.1:8010';

export function getApiBaseUrl() {
  const envBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  // If deployed on the Vercel production domain, call Railway directly.
  try {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const host = window.location.hostname;
      if (host.includes('edlearn-lms.vercel.app')) {
        return 'https://edlearnlms-production.up.railway.app';
      }
    }
  } catch {
    // ignore access errors in non-browser environments
  }

  // In dev, prefer same-origin so Vite can proxy `/api/*` to Laravel.
  if ((import.meta as any).env?.DEV) return '';

  return DEFAULT_BASE_URL;
}

// Feature gate for dev fallbacks. Set VITE_ENABLE_DEV_FALLBACKS=1 in .env.local
// to enable the various getDev* fallback helpers during development.
function isDevFallbackEnabled() {
  const env = (import.meta as any).env as Record<string, any> | undefined;
  if (!env) return false;
  return !!(env?.DEV && (env?.VITE_ENABLE_DEV_FALLBACKS === '1' || env?.VITE_ENABLE_DEV_FALLBACKS === 'true'));
}

export function getToken(): string | null {
  try {
    const sessionToken = sessionStorage.getItem('edlearn_token');
    if (sessionToken) return sessionToken;
  } catch {
    // ignore
  }

  // One-time migration from localStorage -> sessionStorage
  try {
    const legacyToken = localStorage.getItem('edlearn_token');
    if (legacyToken) {
      sessionStorage.setItem('edlearn_token', legacyToken);
      localStorage.removeItem('edlearn_token');
      return legacyToken;
    }
  } catch {
    // ignore
  }

  return null;
}

export function setToken(token: string | null) {
  try {
    if (!token) sessionStorage.removeItem('edlearn_token');
    else sessionStorage.setItem('edlearn_token', token);
  } catch {
    // ignore
  }

  // Ensure legacy storage doesn't keep overriding sessions.
  try {
    localStorage.removeItem('edlearn_token');
  } catch {
    // ignore
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getToken();

  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  const isFormDataBody = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const method = (init.method || 'GET').toUpperCase();
  let res: Response;
  const url = `${baseUrl}${path}`;
  try {
    res = await fetch(url, {
      ...init,
      // Avoid stale cached GET responses (important for enrollment-driven UIs).
      cache: method === 'GET' ? 'no-store' : init.cache,
      headers,
    });
  } catch (err) {
    const originalMessage = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to reach the API server (${url}). ` +
        `Make sure the Laravel backend is running (README suggests http://127.0.0.1:8010) ` +
        `or set VITE_API_BASE_URL in .env.local. Original error: ${originalMessage}`,
    );
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    // In dev, the frontend hits the Vite dev server and relies on the proxy
    // in `vite.config.ts` to forward `/api/*` to Laravel. If Laravel isn't
    // running, Vite typically responds with a generic 500 (and a plain-text
    // body mentioning ECONNREFUSED / proxy errors). Convert that into a
    // clearer actionable message.
    if (baseUrl === '' && res.status >= 500 && !isJson && typeof payload === 'string') {
      const text = payload.toLowerCase();
      const looksLikeProxyFailure =
        text === '' ||
        text.includes('econnrefused') ||
        text.includes('socket hang up') ||
        (text.includes('proxy') && text.includes('error'));

      if (looksLikeProxyFailure) {
        throw new Error(
          `Failed to reach the API server (${DEFAULT_BASE_URL}). ` +
            `Make sure the Laravel backend is running on port 8010 (php artisan serve --host=127.0.0.1 --port=8010) ` +
            `or set VITE_API_BASE_URL in .env.local.`,
        );
      }
    }

    const message =
      (payload && typeof payload === 'object' && 'message' in payload && (payload as any).message) ||
      res.statusText ||
      'Request failed';
    throw new Error(String(message));
  }

  return payload as T;
}

function getDevCredentialLoginFallback(email: string, password: string): ApiLoginResponse | null {
  if (!(import.meta as any).env?.DEV) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  function buildDevUsers() {
    // 2 admins for testing: alice.johnson@admin.edu.ph / johnson, mike.goco@admin.edu.ph / goco
    const adminNames = ['Alice Johnson', 'Mike Goco'];
    const teacherAndStudentNames = [
      // Teachers (7)
      'Carol Nguyen', 'David Lee', 'Eve Martinez', 'Franklin Cruz', 'Grace Park', 'Hector Reyes', 'Ivy Chen',
      // Students (34 - one less since Micheal Goco is now admin)
      'Jack Wilson', 'Karen Davis', 'Leo Garcia', 'Maya Patel', 'Nina Brown', 'Oscar Rivera', 'Paul Kim',
      'Quinn Lopez', 'Rosa Flores', 'Samir Khan', 'Tina Ochoa', 'Uma Shah', 'Victor Santos', 'Wendy Li',
      'Xavier Gomez', 'Yara Silva', 'Zane Wright', 'Lara Santos', 'John Doe', 'Jane Roe',
      'Alexander Berg', 'Bella Costa', 'Carlos Diaz', 'Diana Ellis', 'Ethan Foster', 'Fiona Green',
      'Gabriel Harris', 'Hannah Ibarra', 'Isaac Jones', 'Julia Kim', 'Kevin Lee', 'Lauren Mitchell',
      'Marcus Nelson', 'Nicole Owen',
    ];

    const users: Array<{ email: string; password: string; user: ApiUser }> = [];

    // 2 admins for testing
    for (let i = 0; i < adminNames.length; i++) {
      const full = adminNames[i]!;
      const parts = full.split(' ');
      const first = parts[0]!.toLowerCase();
      const last = parts[parts.length - 1]!.toLowerCase();
      const local = `${first}.${last}`;
      users.push({
        email: `${local}@admin.edu.ph`,
        password: last,
        user: {
          id: `dev-admin-${i + 1}`,
          name: full,
          email: `${local}@admin.edu.ph`,
          role: 'admin',
        },
      });
    }

    // 7 teachers
    for (let i = 0; i < 7; i++) {
      const full = teacherAndStudentNames[i]!;
      const parts = full.split(' ');
      const first = parts[0]!.toLowerCase();
      const last = parts[parts.length - 1]!.toLowerCase();
      const local = `${first}.${last}`;
      users.push({
        email: `${local}@teacher.edu.ph`,
        password: last,
        user: {
          id: `dev-teacher-${i + 1}`,
          name: full,
          email: `${local}@teacher.edu.ph`,
          role: 'teacher',
        },
      });
    }

    // 34 students
    for (let i = 7; i < 41; i++) {
      const full = teacherAndStudentNames[i]!;
      const parts = full.split(' ');
      const first = parts[0]!.toLowerCase();
      const last = parts[parts.length - 1]!.toLowerCase();
      const local = `${first}.${last}`;
      users.push({
        email: `${local}@student.edu.ph`,
        password: last,
        user: {
          id: `dev-student-${i - 6}`,
          name: full,
          email: `${local}@student.edu.ph`,
          role: 'student',
        },
      });
    }

    return users;
  }

  const all = buildDevUsers();
  const match = all.find((u) => u.email.toLowerCase() === normalizedEmail && u.password === normalizedPassword);
  if (!match) return null;

  return {
    token: `dev-credential-token-${match.user.role}`,
    user: match.user,
  };
}

function getDevUserListFallback(params?: {
  role?: string;
  q?: string;
  limit?: number;
  archived?: boolean;
  page?: number;
  perPage?: number;
}): ApiListResponse<ApiUser> | null {
  if (!(import.meta as any).env?.DEV) return null;

  function buildDevUsersList(): ApiUser[] {
    // Get current logged-in user if available
    let currentUser: any = null;
    try {
      const stored = sessionStorage.getItem('edlearn_user');
      if (stored) {
        currentUser = JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    const users: ApiUser[] = [];

    // Add current logged-in admin only (instead of hardcoded names)
    if (currentUser && currentUser.role === 'admin') {
      users.push({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: 'admin',
      });
    }

    // All names for teachers and students (7 teachers + 34 students - Micheal Goco is now admin)
    const teacherAndStudentNames = [
      // Teachers (7)
      'Carol Nguyen', 'David Lee', 'Eve Martinez', 'Franklin Cruz', 'Grace Park', 'Hector Reyes', 'Ivy Chen',
      // Students (34 - removed Micheal Goco since they're now admin)
      'Jack Wilson', 'Karen Davis', 'Leo Garcia', 'Maya Patel', 'Nina Brown', 'Oscar Rivera', 'Paul Kim',
      'Quinn Lopez', 'Rosa Flores', 'Samir Khan', 'Tina Ochoa', 'Uma Shah', 'Victor Santos', 'Wendy Li',
      'Xavier Gomez', 'Yara Silva', 'Zane Wright', 'Lara Santos', 'John Doe', 'Jane Roe',
      'Alexander Berg', 'Bella Costa', 'Carlos Diaz', 'Diana Ellis', 'Ethan Foster', 'Fiona Green',
      'Gabriel Harris', 'Hannah Ibarra', 'Isaac Jones', 'Julia Kim', 'Kevin Lee', 'Lauren Mitchell',
      'Marcus Nelson', 'Nicole Owen',
    ];

    // 7 teachers
    for (let i = 0; i < 7; i++) {
      const full = teacherAndStudentNames[i]!;
      const parts = full.split(' ');
      const first = parts[0]!.toLowerCase();
      const last = parts[parts.length - 1]!.toLowerCase();
      const local = `${first}.${last}`;
      users.push({ id: `dev-teacher-${i + 1}`, name: full, email: `${local}@teacher.edu.ph`, role: 'teacher' });
    }

    // 34 students
    for (let i = 7; i < 41; i++) {
      const full = teacherAndStudentNames[i]!;
      const parts = full.split(' ');
      const first = parts[0]!.toLowerCase();
      const last = parts[parts.length - 1]!.toLowerCase();
      const local = `${first}.${last}`;
      users.push({ id: `dev-student-${i - 6}`, name: full, email: `${local}@student.edu.ph`, role: 'student' });
    }

    return users;
  }

  let mockUsers = buildDevUsersList();
  
  // Include newly created dev users from storage
  const createdUsers = readDevJson<ApiUser[]>(DEV_USERS_STORAGE_KEY, []);
  let allUsers = [...mockUsers, ...createdUsers];

  const editedUsers = readDevJson<Record<string, Partial<ApiUser>>>(DEV_USER_EDITS_STORAGE_KEY, {});
  allUsers = allUsers.map((user) => {
    const edited = editedUsers[String(user.id)];
    return edited ? { ...user, ...edited } : user;
  });

  let filtered = allUsers.slice();

  if (params?.role) {
    filtered = filtered.filter((u) => u.role === params.role);
  }

  if (params?.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }

  if (params?.archived === true) {
    filtered = [];
  }

  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 10;
  const limit = params?.limit ?? perPage;

  const start = (page - 1) * perPage;
  const end = start + (limit === perPage ? perPage : limit);
  const paged = filtered.slice(start, end);

  return {
    data: paged,
    meta: {
      total: filtered.length,
      page,
      perPage,
      pages: Math.max(1, Math.ceil(filtered.length / perPage)),
    },
  };
}

function getDevAnalyticsFallback(params?: {
  archived?: boolean;
}): ApiAnalyticsAdmin | null {
  if (!(import.meta as any).env?.DEV) return null;

  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  const weeklyEngagement = Array.from({ length: 7 }).map((_, i) => ({
    day: days[(now.getDay() - 6 + i) % 7] as string,
    hours: Math.floor(Math.random() * 8) + 2,
  }));

  const courseEnrollment = Array.from({ length: 10 }).map((_, i) => ({
    course: `COURSE-${i + 1}`,
    students: 10 + Math.floor(Math.random() * 30),
  }));

  // Exact counts: 2 admins + 7 teachers + 34 students = 43 total users
  let totalAdmins = 2;
  let totalTeachers = 7;
  let totalStudents = 34;
  
  // Count newly created users from localStorage
  try {
    const createdUsers = readDevJson<ApiUser[]>(DEV_USERS_STORAGE_KEY, []);
    for (const user of createdUsers) {
      if (user.role === 'admin') {
        totalAdmins += 1;
      } else if (user.role === 'teacher') {
        totalTeachers += 1;
      } else if (user.role === 'student') {
        totalStudents += 1;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
  
  // Count newly added students from sessionStorage (enrollments)
  try {
    for (let i = 1; i <= 9; i++) {
      const storageKey = `edlearn_added_enrollments_dev-course-${i}`;
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const added = JSON.parse(stored) as Array<{ status: string }>;
        const activeAdded = added.filter(e => e.status !== 'dropped').length;
        totalStudents += activeAdded;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
  
  const totalUsers = totalAdmins + totalTeachers + totalStudents;
  const totalCourses = courseEnrollment.length;

  // Calculate teachers per subject based on actual course assignments
  // Courses: CS101, CS201, MATH101, MATH201, BIO101, CHEM101, PHYS101, ENG101, HIST101
  // Teachers: Carol(1), David(2), Eve(3), Franklin(4), Grace(5), Hector(6), Ivy(7)
  // Mapping: CS(Carol,David), MATH(Eve,Franklin), BIO(Grace), CHEM(Hector), PHYS(Ivy), ENG(Carol), HIST(David)
  const subjectTeacherMap: { [key: string]: Set<number> } = {
    'Computer Science': new Set([1, 2]), // Carol, David teach CS101, CS201, ENG101
    'Mathematics': new Set([3, 4]), // Eve, Franklin teach MATH101, MATH201
    'Biology': new Set([5]), // Grace teaches BIO101
    'Chemistry': new Set([6]), // Hector teaches CHEM101
    'Physics': new Set([7]), // Ivy teaches PHYS101
    'History': new Set([2]), // David teaches HIST101 (already in CS)
  };

  // Add ENG to CS teacher, HIST to CS teacher
  subjectTeacherMap['Computer Science']!.add(1); // Carol for ENG101
  subjectTeacherMap['Computer Science']!.add(2); // David for HIST101

  const subjectTeachers = Object.entries(subjectTeacherMap).map(([subject, teacherSet]) => ({
    subject,
    teachers: teacherSet.size,
  }));

  return {
    totalUsers,
    totalAdmins,
    totalTeachers,
    totalStudents,
    totalCourses,
    totalAssignments: 40,
    totalEnrollments: totalStudents * 2,
    upcomingSessions: 8,
    activeSessions: 3,
    weeklyEngagement,
    courseEnrollment,
    subjectTeachers,
    studentsTrend: Array.from({ length: 30 }).map((_, i) => ({
      day: `Day ${i + 1}`,
      count: 10 + Math.floor(Math.random() * 10),
    })),
    teachersTrend: Array.from({ length: 30 }).map((_, i) => ({
      day: `Day ${i + 1}`,
      count: Math.max(1, Math.floor(Math.random() * 3)),
    })),
  };
}

function getDevAnalyticsTeacherFallback(): {
  totalCourses: number;
  totalStudents: number;
  upcomingSessions: number;
  assignments: number;
} | null {
  if (!(import.meta as any).env?.DEV) return null;

  // Get current teacher from sessionStorage
  let currentTeacherId: string | null = null;
  try {
    const userStr = sessionStorage.getItem('edlearn_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'teacher') {
        currentTeacherId = user.id;
      }
    }
  } catch (e) {
    // Ignore
  }

  if (!currentTeacherId) {
    return { totalCourses: 0, totalStudents: 0, upcomingSessions: 8, assignments: 0 };
  }

  // Get courses for this teacher
  const catalog = getDevCourseCatalog();
  const teacherCourses = catalog.filter((c) => c.teacherId === currentTeacherId);

  // Count students across all teacher's courses
  let totalStudents = 0;
  const teacherNames = ['Carol Nguyen', 'David Lee', 'Eve Martinez', 'Franklin Cruz', 'Grace Park', 'Hector Reyes', 'Ivy Chen'];
  const teacherIdx = parseInt(currentTeacherId.split('-').pop() || '0', 10) - 1;

  for (const course of teacherCourses) {
    const courseNum = parseInt(course.id.split('-').pop() || '0', 10) - 1;
    const studentsPerCourse = [4, 4, 4, 4, 4, 4, 3, 2, 1];
    const numStudents = studentsPerCourse[courseNum] || 3;
    totalStudents += numStudents;

    // Add any manually enrolled students from sessionStorage
    try {
      const storageKey = `edlearn_added_enrollments_${course.id}`;
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const added = JSON.parse(stored) as Array<{ status: string }>;
        const activeAdded = added.filter(e => e.status !== 'dropped').length;
        totalStudents += activeAdded;
      }
    } catch (e) {
      // Ignore
    }
  }

  return {
    totalCourses: teacherCourses.length,
    totalStudents,
    upcomingSessions: 8,
    assignments: teacherCourses.length * 3,
  };
}

function getDevCourseCatalog(): ApiCourse[] {
  const courses = [
    {
      title: 'Introduction to Computer Science',
      code: 'CS101',
      description: 'Fundamentals of programming, algorithms, and computer science principles. Learn how computers work and solve problems using code.',
      schedule: 'MWF 10:00 AM',
    },
    {
      title: 'Data Structures and Algorithms',
      code: 'CS201',
      description: 'Advanced programming concepts including trees, graphs, sorting, and searching algorithms. Build efficient and scalable software.',
      schedule: 'TTh 2:00 PM',
    },
    {
      title: 'Calculus I',
      code: 'MATH101',
      description: 'Limits, derivatives, and integrals. Foundation for advanced mathematics and scientific applications.',
      schedule: 'MWF 9:00 AM',
    },
    {
      title: 'Linear Algebra',
      code: 'MATH201',
      description: 'Vectors, matrices, and linear transformations. Essential for data science, physics, and engineering.',
      schedule: 'TTh 1:00 PM',
    },
    {
      title: 'Biology I: Cell and Molecular',
      code: 'BIO101',
      description: 'Study of cellular structure, genetics, and molecular biology. Understanding life at the molecular level.',
      schedule: 'MWF 1:00 PM',
    },
    {
      title: 'Chemistry: Fundamentals',
      code: 'CHEM101',
      description: 'Basic chemistry principles, atomic structure, bonding, and chemical reactions for scientific foundation.',
      schedule: 'TTh 10:00 AM',
    },
    {
      title: 'Physics I: Mechanics',
      code: 'PHYS101',
      description: 'Motion, forces, energy, and waves. Classical mechanics and foundational physics concepts.',
      schedule: 'MWF 2:00 PM',
    },
    {
      title: 'English Composition',
      code: 'ENG101',
      description: 'Develop critical writing and communication skills. Rhetoric, argumentation, and academic writing.',
      schedule: 'TTh 3:00 PM',
    },
    {
      title: 'World History',
      code: 'HIST101',
      description: 'Survey of major world events, civilizations, and cultural developments from ancient to modern times.',
      schedule: 'MWF 11:00 AM',
    },
    {
      title: 'Introduction to Psychology',
      code: 'PSY101',
      description: 'Human behavior, cognition, and mental processes. Principles and applications of psychological science.',
      schedule: 'TTh 11:00 AM',
    },
    {
      title: 'Principles of Economics',
      code: 'ECON101',
      description: 'Microeconomics and macroeconomics fundamentals. Supply, demand, and market systems.',
      schedule: 'MWF 3:00 PM',
    },
    {
      title: 'Art History',
      code: 'ART101',
      description: 'Visual arts across cultures and time periods. Understanding aesthetics, movements, and artistic expression.',
      schedule: 'TTh 2:00 PM',
    },
  ];

  // Actual teacher names from the dev user list
  const teacherNames = ['Carol Nguyen', 'David Lee', 'Eve Martinez', 'Franklin Cruz', 'Grace Park', 'Hector Reyes', 'Ivy Chen'];

  // Distribute all 34 students across 9 courses (approximately 3-4 per course)
  const studentDistribution = [4, 4, 4, 4, 4, 4, 3, 2, 1]; // Total = 34

  return courses.map((course, i) => {
    const idx = i + 1;
    const teacherIdx = (idx - 1) % teacherNames.length;
    const teacherName = teacherNames[teacherIdx];
    return {
      id: `dev-course-${idx}`,
      title: course.title,
      code: course.code,
      description: course.description,
      teacher: teacherName,
      teacherId: `dev-teacher-${teacherIdx + 1}`,
      students: studentDistribution[i] || 3, // Deterministic student count
      term: 'Spring 2026',
      section: String.fromCharCode(64 + ((idx % 4) + 1)),
      schedule: course.schedule,
      status: 'active',
      materials: 1 + (idx % 3), // 1-3 materials per course
      assignments: 1 + (idx % 3), // 1-3 assignments per course
    } as ApiCourse;
  });
}

function getDevCoursesFallback(params?: {
  archived?: boolean;
  available?: boolean;
}): ApiListResponse<ApiCourse> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const mockCourses = getDevCourseCatalog();

  let filtered = mockCourses.map((course) => {
    const enrollments = getDevCourseEnrollmentsFallback(course.id);
    if (!enrollments) return course;

    const activeCount = enrollments.data.filter((enrollment) => enrollment.status !== 'dropped').length;
    return { ...course, students: activeCount };
  });

  if (params?.archived === true) {
    filtered = [];
  }

  return {
    data: filtered,
    meta: {
      total: filtered.length,
      page: 1,
      perPage: 10,
      pages: Math.max(1, Math.ceil(filtered.length / 10)),
    },
  };
}

function getDevCourseFallback(courseId: string): ApiItemResponse<ApiCourse> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const course = getDevCourseCatalog().find((item) => item.id === courseId);
  if (!course) return null;

  const enrollments = getDevCourseEnrollmentsFallback(course.id);
  const activeCount = enrollments
    ? enrollments.data.filter((enrollment) => enrollment.status !== 'dropped').length
    : course.students;

  return { data: { ...course, students: activeCount } };
}

function getDevCourseLessonsFallback(courseId: string): ApiListResponse<ApiLesson> | null {
  if (!(import.meta as any).env?.DEV) return null;
  const catalog = getDevCourseCatalog();
  const course = catalog.find((c) => c.id === courseId);
  if (!course) return null;

  const defaultLessons: ApiLesson[] = Array.from({ length: 4 }).map((_, i) => ({
    id: `dev-lesson-${courseId}-${i + 1}`,
    courseId,
    title: `${course.title} - Lesson ${i + 1}`,
    description: `Lesson ${i + 1} for ${course.title}`,
    content: '',
    order: i + 1,
    duration: '45',
    status: 'published',
    period: 'prelim',
    weekInPeriod: ((i % 4) + 1),
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }));

  const storageKey = `${DEV_LESSONS_STORAGE_PREFIX}${courseId}`;
  const lessons = readDevJson<ApiLesson[]>(storageKey, defaultLessons)
    .map((lesson, index) => ({
      ...lesson,
      courseId,
      content: lesson.content ?? '',
      order: lesson.order ?? index + 1,
      status: lesson.status ?? 'published',
      publishedAt: lesson.publishedAt ?? null,
      createdAt: lesson.createdAt ?? new Date().toISOString(),
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    data: lessons,
    meta: { total: lessons.length, page: 1, perPage: lessons.length, pages: 1 },
  };
}

function getDevCreateCourseLessonFallback(
  courseId: string,
  payload: {
    title: string;
    description?: string | null;
    content?: string | null;
    lesson_order?: number;
    duration?: string | null;
    status?: string;
    period?: string | null;
    week_in_period?: number | null;
  },
): ApiItemResponse<ApiLesson> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const existing = getDevCourseLessonsFallback(courseId);
  if (!existing) return null;

  const storageKey = `${DEV_LESSONS_STORAGE_PREFIX}${courseId}`;
  const nextOrder = payload.lesson_order ?? (Math.max(0, ...existing.data.map((lesson) => lesson.order ?? 0)) + 1);

  const lesson: ApiLesson = {
    id: `dev-lesson-${courseId}-${Date.now()}`,
    courseId,
    title: payload.title,
    description: payload.description ?? '',
    content: payload.content ?? '',
    order: nextOrder,
    duration: payload.duration ?? null,
    status: payload.status ?? 'published',
    period: payload.period ?? 'prelim',
    weekInPeriod: payload.week_in_period ?? 1,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  writeDevJson(storageKey, [...existing.data, lesson]);
  return { data: lesson };
}

function getDevUpdateCourseLessonFallback(
  courseId: string,
  lessonId: string,
  payload: Partial<{
    title: string;
    description: string | null;
    content: string | null;
    lesson_order: number;
    duration: string | null;
    status: string;
  }>,
): ApiItemResponse<ApiLesson> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const existing = getDevCourseLessonsFallback(courseId);
  if (!existing) return null;

  const index = existing.data.findIndex((lesson) => String(lesson.id) === String(lessonId));
  if (index === -1) return null;

  const updated: ApiLesson = {
    ...existing.data[index]!,
    title: payload.title ?? existing.data[index]!.title,
    description: payload.description ?? existing.data[index]!.description,
    content: payload.content ?? existing.data[index]!.content,
    order: payload.lesson_order ?? existing.data[index]!.order,
    duration: payload.duration ?? existing.data[index]!.duration,
    status: payload.status ?? existing.data[index]!.status,
  } as ApiLesson;

  const next = existing.data.slice();
  next[index] = updated;
  const storageKey = `${DEV_LESSONS_STORAGE_PREFIX}${courseId}`;
  writeDevJson(storageKey, next);

  return { data: updated };
}

function getDevDeleteCourseLessonFallback(courseId: string, lessonId: string): ApiMessageResponse | null {
  if (!(import.meta as any).env?.DEV) return null;

  const existing = getDevCourseLessonsFallback(courseId);
  if (!existing) return null;

  const next = existing.data.filter((lesson) => String(lesson.id) !== String(lessonId));
  const storageKey = `${DEV_LESSONS_STORAGE_PREFIX}${courseId}`;
  writeDevJson(storageKey, next);

  return { message: 'Lesson deleted successfully' };
}

function getDevCourseSessionsFallback(courseId: string): ApiListResponse<ApiClassSession> | null {
  if (!(import.meta as any).env?.DEV) return null;
  const catalog = getDevCourseCatalog();
  const course = catalog.find((c) => c.id === courseId);
  if (!course) return null;

  const storageKey = `${DEV_CLASS_SESSIONS_STORAGE_PREFIX}${courseId}`;

  const now = Date.now();
  const defaultSessions: ApiClassSession[] = Array.from({ length: 3 }).map((_, i) => ({
    id: `dev-session-${courseId}-${i + 1}`,
    courseId,
    title: `${course.title} Session ${i + 1}`,
    date: new Date(now + i * 86400000).toISOString(),
    time: '10:00 AM',
    duration: '60',
    status: i === 0 ? 'live' : 'scheduled',
    startsAt: new Date(now + i * 86400000).toISOString(),
    endsAt: new Date(now + i * 86400000 + 60 * 60000).toISOString(),
    attendees: null,
    meetingUrl: `/classroom/${courseId}`,
  }));

  const sessions = readDevJson<ApiClassSession[]>(storageKey, defaultSessions)
    .map((session) => ({
      ...session,
      courseId,
      status: session.status || 'scheduled',
      startsAt: session.startsAt || null,
      endsAt: session.endsAt || null,
      date: session.date || (session.startsAt ? new Date(session.startsAt).toISOString() : null),
      time: session.time || (session.startsAt ? new Date(session.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null),
      duration: session.duration || null,
    }))
    .sort((a, b) => {
      const aStart = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const bStart = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      return aStart - bStart;
    });

  return {
    data: sessions,
    meta: { total: sessions.length, page: 1, perPage: sessions.length, pages: 1 },
  };
}

function getDevCreateCourseSessionFallback(
  courseId: string,
  payload: {
    title: string;
    starts_at: string;
    ends_at?: string | null;
    meeting_url?: string | null;
    status?: string | null;
    notes?: string | null;
  },
): ApiItemResponse<ApiClassSession> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const existing = getDevCourseSessionsFallback(courseId);
  if (!existing) return null;

  const startsAt = new Date(payload.starts_at);
  const endsAt = payload.ends_at ? new Date(payload.ends_at) : new Date(startsAt.getTime() + 60 * 60000);
  const id = `dev-session-${courseId}-${Date.now()}`;
  const session: ApiClassSession = {
    id,
    courseId,
    title: payload.title,
    date: startsAt.toISOString(),
    time: startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration: `${Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000))} min`,
    status: (payload.status as ApiClassSession['status']) || 'live',
    attendees: null,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    meetingUrl: payload.meeting_url || `/classroom/${courseId}`,
  };

  try {
    const storageKey = `${DEV_CLASS_SESSIONS_STORAGE_PREFIX}${courseId}`;
    const sessions = readDevJson<ApiClassSession[]>(storageKey, existing.data);
    sessions.push(session);
    writeDevJson(storageKey, sessions);
  } catch {
    // Ignore persistence errors
  }

  return { data: session };
}

function getDevUpdateCourseSessionFallback(
  courseId: string,
  sessionId: string,
  payload: {
    title?: string;
    starts_at?: string;
    ends_at?: string | null;
    meeting_url?: string | null;
    status?: string | null;
    notes?: string | null;
  },
): ApiItemResponse<ApiClassSession> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const storageKey = `${DEV_CLASS_SESSIONS_STORAGE_PREFIX}${courseId}`;
  const existing = getDevCourseSessionsFallback(courseId);
  if (!existing) return null;

  const idx = existing.data.findIndex((session) => String(session.id) === String(sessionId));
  if (idx === -1) return null;

  const previous = existing.data[idx]!;
  const startsAt = payload.starts_at ? new Date(payload.starts_at) : (previous.startsAt ? new Date(previous.startsAt) : new Date());
  const endsAt = payload.ends_at !== undefined
    ? (payload.ends_at ? new Date(payload.ends_at) : null)
    : (previous.endsAt ? new Date(previous.endsAt) : null);

  const updated: ApiClassSession = {
    ...previous,
    title: payload.title ?? previous.title,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt ? endsAt.toISOString() : null,
    date: startsAt.toISOString(),
    time: startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration: endsAt ? `${Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000))} min` : previous.duration,
    status: (payload.status as ApiClassSession['status']) || previous.status,
    meetingUrl: payload.meeting_url ?? previous.meetingUrl ?? `/classroom/${courseId}`,
  } as ApiClassSession;

  try {
    const sessions = readDevJson<ApiClassSession[]>(storageKey, existing.data);
    const persistedIndex = sessions.findIndex((session) => String(session.id) === String(sessionId));
    if (persistedIndex !== -1) {
      sessions[persistedIndex] = updated;
      writeDevJson(storageKey, sessions);
    }
  } catch {
    // Ignore persistence errors
  }

  return { data: updated };
}

function getDevClassroomMessagesFallback(sessionId: string): ApiListResponse<{
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  body: string;
  createdAt: string;
}> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const storageKey = `${DEV_CLASSROOM_MESSAGES_STORAGE_PREFIX}${sessionId}`;
  const messages = readDevJson<Array<{
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    body: string;
    createdAt: string;
  }>>(storageKey, []);

  return {
    data: messages,
    meta: {
      total: messages.length,
      page: 1,
      perPage: messages.length || 1,
      pages: 1,
    },
  };
}

function getDevClassroomParticipantsFallback(sessionId: string): ApiListResponse<{
  id: string;
  name: string;
  role: 'teacher' | 'student';
  isMuted: boolean;
  isVideoOn: boolean;
  isHandRaised: boolean;
}> | null {
  if (!(import.meta as any).env?.DEV) return null;

  let course = getDevCourseCatalog().find((candidate) => candidate.id === sessionId) || null;
  if (!course) {
    for (const candidate of getDevCourseCatalog()) {
      const sessions = getDevCourseSessionsFallback(candidate.id);
      if (sessions?.data.some((session) => String(session.id) === String(sessionId))) {
        course = candidate;
        break;
      }
    }
  }
  if (!course) return null;

  const participants: Array<{
    id: string;
    name: string;
    role: 'teacher' | 'student';
    isMuted: boolean;
    isVideoOn: boolean;
    isHandRaised: boolean;
  }> = [];

  const teacher = getDevAllUsers().find((user) => String(user.id) === String(course.teacherId)) || null;
  if (teacher) {
    participants.push({
      id: teacher.id,
      name: teacher.name,
      role: 'teacher',
      isMuted: false,
      isVideoOn: true,
      isHandRaised: false,
    });
  }

  const enrollments = getDevCourseEnrollmentsFallback(course.id);
  const studentIds = new Set(
    (enrollments?.data || [])
      .filter((enrollment) => enrollment.status !== 'dropped')
      .map((enrollment) => String(enrollment.student?.id || enrollment.studentId)),
  );

  for (const student of getDevAllUsers()) {
    if (student.role !== 'student') continue;
    if (!studentIds.has(String(student.id))) continue;
    participants.push({
      id: student.id,
      name: student.name,
      role: 'student',
      isMuted: true,
      isVideoOn: false,
      isHandRaised: false,
    });
  }

  return {
    data: participants,
    meta: {
      total: participants.length,
      page: 1,
      perPage: participants.length || 1,
      pages: 1,
    },
  };
}

function getDevSendClassroomMessageFallback(sessionId: string, body: string): ApiItemResponse<{
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  body: string;
  createdAt: string;
}> | null {
  if (!(import.meta as any).env?.DEV) return null;

  let currentUser: ApiUser | null = null;
  try {
    const stored = sessionStorage.getItem('edlearn_user');
    currentUser = stored ? (JSON.parse(stored) as ApiUser) : null;
  } catch {
    // Ignore
  }

  const message = {
    id: `dev-classroom-msg-${Date.now()}`,
    userId: currentUser?.id ? String(currentUser.id) : 'dev-user',
    userName: currentUser?.name || 'Current User',
    userRole: currentUser?.role || 'student',
    body,
    createdAt: new Date().toISOString(),
  };

  try {
    const storageKey = `${DEV_CLASSROOM_MESSAGES_STORAGE_PREFIX}${sessionId}`;
    const messages = readDevJson<Array<typeof message>>(storageKey, []);
    messages.push(message);
    writeDevJson(storageKey, messages);
  } catch {
    // Ignore persistence errors
  }

  return { data: message };
}

function getDevCourseAssignmentsFallback(courseId: string): ApiListResponse<ApiAssignment> | null {
  if (!(import.meta as any).env?.DEV) return null;
  const catalog = getDevCourseCatalog();
  const course = catalog.find((c) => c.id === courseId);
  if (!course) return null;

  const assignments: ApiAssignment[] = Array.from({ length: course.assignments }).map((_, i) => ({
    id: `dev-assignment-${courseId}-${i + 1}`,
    courseId,
    title: `${course.title} Assignment ${i + 1}`,
    description: `Auto-generated assignment ${i + 1}`,
    dueDate: new Date(Date.now() + (i + 3) * 86400000).toISOString(),
    points: 100,
    status: 'published',
  } as ApiAssignment));

  return { data: assignments, meta: { total: assignments.length, page: 1, perPage: assignments.length, pages: 1 } };
}

function getDevCourseMaterialsFallback(courseId: string): ApiListResponse<ApiMaterial> | null {
  if (!(import.meta as any).env?.DEV) return null;
  const catalog = getDevCourseCatalog();
  const course = catalog.find((c) => c.id === courseId);
  if (!course) return null;

  const materials: ApiMaterial[] = Array.from({ length: course.materials }).map((_, i) => ({
    id: `dev-material-${courseId}-${i + 1}`,
    courseId,
    title: `${course.title} Material ${i + 1}`,
    description: '',
    originalName: `${course.code}-material-${i + 1}.pdf`,
    mimeType: 'application/pdf',
    sizeBytes: 1024 * 1024,
    downloadPath: `/storage/dev/${courseId}/material-${i + 1}.pdf`,
    createdAt: new Date().toISOString(),
  }));

  return { data: materials, meta: { total: materials.length, page: 1, perPage: materials.length, pages: 1 } };
}

function getDevAllUsers(): ApiUser[] {
  // Build a deterministic dev user list matching other helpers
  const adminNames = ['Alice Johnson', 'Mike Goco'];
  const teacherAndStudentNames = [
    // Teachers (7)
    'Carol Nguyen', 'David Lee', 'Eve Martinez', 'Franklin Cruz', 'Grace Park', 'Hector Reyes', 'Ivy Chen',
    // Students (34)
    'Jack Wilson', 'Karen Davis', 'Leo Garcia', 'Maya Patel', 'Nina Brown', 'Oscar Rivera', 'Paul Kim',
    'Quinn Lopez', 'Rosa Flores', 'Samir Khan', 'Tina Ochoa', 'Uma Shah', 'Victor Santos', 'Wendy Li',
    'Xavier Gomez', 'Yara Silva', 'Zane Wright', 'Lara Santos', 'John Doe', 'Jane Roe',
    'Alexander Berg', 'Bella Costa', 'Carlos Diaz', 'Diana Ellis', 'Ethan Foster', 'Fiona Green',
    'Gabriel Harris', 'Hannah Ibarra', 'Isaac Jones', 'Julia Kim', 'Kevin Lee', 'Lauren Mitchell',
    'Marcus Nelson', 'Nicole Owen',
  ];

  const users: ApiUser[] = [];

  for (let i = 0; i < adminNames.length; i++) {
    const full = adminNames[i]!;
    const parts = full.split(' ');
    const first = parts[0]!.toLowerCase();
    const last = parts[parts.length - 1]!.toLowerCase();
    const local = `${first}.${last}`;
    users.push({ id: `dev-admin-${i + 1}`, name: full, email: `${local}@admin.edu.ph`, role: 'admin' });
  }

  for (let i = 0; i < 7; i++) {
    const full = teacherAndStudentNames[i]!;
    const parts = full.split(' ');
    const first = parts[0]!.toLowerCase();
    const last = parts[parts.length - 1]!.toLowerCase();
    const local = `${first}.${last}`;
    users.push({ id: `dev-teacher-${i + 1}`, name: full, email: `${local}@teacher.edu.ph`, role: 'teacher' });
  }

  for (let i = 7; i < teacherAndStudentNames.length; i++) {
    const full = teacherAndStudentNames[i]!;
    const parts = full.split(' ');
    const first = parts[0]!.toLowerCase();
    const last = parts[parts.length - 1]!.toLowerCase();
    const local = `${first}.${last}`;
    users.push({ id: `dev-student-${i - 6}`, name: full, email: `${local}@student.edu.ph`, role: 'student' });
  }

  return users;
}

function getDevCourseEnrollmentsFallback(courseId: string): ApiListResponse<ApiEnrollment> | null {
  if (!(import.meta as any).env?.DEV) return null;
  const catalog = getDevCourseCatalog();
  const course = catalog.find((c) => c.id === courseId);
  if (!course) return null;

  const all = getDevAllUsers();
  const studentUsers = all.filter((u) => u.role === 'student');
  
  // Extract course number from courseId (e.g., 'dev-course-1' -> 0)
  const courseNum = parseInt(courseId.split('-').pop() || '0', 10) - 1;
  const studentsPerCourse = [4, 4, 4, 4, 4, 4, 3, 2, 1]; // Matches distribution in catalog
  const numStudents = studentsPerCourse[courseNum] || 3;
  
  // Distribute students: course 0 gets students 0-3, course 1 gets 4-7, etc.
  let startIdx = 0;
  for (let i = 0; i < courseNum; i++) {
    startIdx += studentsPerCourse[i] || 3;
  }
  
  const courseStudents = studentUsers.slice(startIdx, startIdx + numStudents);
  const enrollments: ApiEnrollment[] = courseStudents.map((s, idx) => ({
    id: `${courseId}-enroll-${idx + 1}`,
    courseId,
    studentId: String(s.id),
    student: s,
    status: 'active',
    enrolledAt: new Date(Date.now() - idx * 86400000).toISOString(),
  }));

  // Add any manually enrolled students (stored in session)
  try {
    const storageKey = `edlearn_added_enrollments_${courseId}`;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const added = JSON.parse(stored) as ApiEnrollment[];
      enrollments.push(...added.filter(a => a.status !== 'dropped'));
    }
  } catch (e) {
    // Ignore storage errors
  }

  return { data: enrollments, meta: { total: enrollments.length, page: 1, perPage: enrollments.length, pages: 1 } };
}

function getDevEnrollStudentFallback(courseId: string, studentId: string): ApiItemResponse<ApiEnrollment> | null {
  if (!(import.meta as any).env?.DEV) return null;
  
  // Check both built-in dev users and newly created dev users from storage
  let student: ApiUser | undefined = getDevAllUsers().find((u) => u.id === studentId);
  if (!student) {
    const createdUsers = readDevJson<ApiUser[]>(DEV_USERS_STORAGE_KEY, []);
    student = createdUsers.find((u) => u.id === studentId);
  }
  if (!student) return null;

  const enrollment: ApiEnrollment = {
    id: `${courseId}-enroll-${Date.now()}`,
    courseId,
    studentId: String(student.id),
    student,
    status: 'active',
    enrolledAt: new Date().toISOString(),
  };

  // Store the new enrollment in session so it persists in fallback calls
  try {
    const storageKey = `edlearn_added_enrollments_${courseId}`;
    const stored = sessionStorage.getItem(storageKey);
    const added = stored ? JSON.parse(stored) : [];
    added.push(enrollment);
    sessionStorage.setItem(storageKey, JSON.stringify(added));
  } catch (e) {
    // Ignore storage errors
  }

  return { data: enrollment };
}

function getDevDropEnrollmentFallback(courseId: string, enrollmentId: string): ApiMessageResponse | null {
  if (!(import.meta as any).env?.DEV) return null;
  
  // Mark as dropped in session storage
  try {
    const storageKey = `edlearn_added_enrollments_${courseId}`;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const added = JSON.parse(stored) as ApiEnrollment[];
      const idx = added.findIndex(e => e.id === enrollmentId);
      if (idx !== -1) {
        added[idx]!.status = 'dropped';
        sessionStorage.setItem(storageKey, JSON.stringify(added));
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
  
  return { message: 'Enrollment removed successfully' };
}

function getDevUserEnrollmentsFallback(userId: string): ApiListResponse<ApiUserEnrollment> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const catalog = getDevCourseCatalog();
  const userEnrollments: ApiUserEnrollment[] = [];

  for (const course of catalog) {
    const courseEnrollments = getDevCourseEnrollmentsFallback(course.id);
    if (!courseEnrollments) continue;

    for (const enrollment of courseEnrollments.data) {
      const studentId = enrollment.student?.id ? String(enrollment.student.id) : '';
      if (studentId !== String(userId)) continue;
      if (enrollment.status === 'dropped') continue;

      userEnrollments.push({
        id: enrollment.id,
        courseId: course.id,
        status: enrollment.status === 'active' ? 'enrolled' : enrollment.status,
        enrolledAt: enrollment.enrolledAt ?? null,
        course: {
          id: course.id,
          code: course.code,
          title: course.title,
          status: course.status,
        },
      });
    }
  }

  return {
    data: userEnrollments,
    meta: {
      total: userEnrollments.length,
      page: 1,
      perPage: userEnrollments.length || 1,
      pages: 1,
    },
  };
}

function getDevUpdateCourseFallback(courseId: string, payload: Partial<ApiCourseUpsert>): ApiItemResponse<ApiCourse> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const course = getDevCourseCatalog().find((item) => item.id === courseId);
  if (!course) return null;

  // Get seed names for teacher lookup - only the 7 teachers
  const teacherNames = [
    'Carol Nguyen', 'David Lee', 'Eve Martinez', 'Franklin Cruz', 'Grace Park', 'Hector Reyes', 'Ivy Chen',
  ];

  // Handle teacher_id update
  let newTeacher = course.teacher;
  let newTeacherId = course.teacherId;
  if (payload.teacher_id !== undefined && payload.teacher_id !== null) {
    const teacherId = Number(payload.teacher_id);
    if (teacherId > 0 && teacherId <= teacherNames.length) {
      const teacherName = teacherNames[teacherId - 1]!;
      newTeacher = teacherName;
      newTeacherId = `dev-teacher-${teacherId}`;
    }
  }

  // Merge updates into the course
  const updated: ApiCourse = {
    ...course,
    code: payload.code ?? course.code,
    title: payload.title ?? course.title,
    description: payload.description ?? course.description,
    section: payload.section ?? course.section,
    term: payload.term ?? course.term,
    schedule: payload.schedule ?? course.schedule,
    status: payload.status ?? course.status,
    teacher: newTeacher,
    teacherId: newTeacherId,
  };

  return { data: updated };
}

function getDevCreateUserFallback(payload: {
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
}): ApiUser | null {
  if (!(import.meta as any).env?.DEV) return null;

  const id = `dev-user-${Date.now()}`;
  const user: ApiUser = {
    id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  };

  // Persist created user to localStorage for consistency across dev sessions
  try {
    const users = readDevJson<ApiUser[]>(DEV_USERS_STORAGE_KEY, []);
    users.push(user);
    writeDevJson(DEV_USERS_STORAGE_KEY, users);
  } catch (e) {
    // Ignore persistence errors
  }

  return user;
}

function getDevUserFallback(userId: string): ApiUser | null {
  if (!(import.meta as any).env?.DEV) return null;

  const all = getDevUserListFallback({ page: 1, perPage: 10000, limit: 10000 });
  if (!all) return null;

  return all.data.find((user) => String(user.id) === String(userId)) ?? null;
}

function getDevUpdateUserFallback(
  userId: string,
  payload: {
    name?: string;
    email?: string;
    new_password?: string;
    new_password_confirmation?: string;
  },
): ApiUser | null {
  if (!(import.meta as any).env?.DEV) return null;

  const existing = getDevUserFallback(userId);
  if (!existing) return null;

  const updated: ApiUser = {
    ...existing,
    name: payload.name ?? existing.name,
    email: payload.email ?? existing.email,
  };

  try {
    const createdUsers = readDevJson<ApiUser[]>(DEV_USERS_STORAGE_KEY, []);
    const createdIndex = createdUsers.findIndex((user) => String(user.id) === String(userId));

    if (createdIndex >= 0) {
      const existingCreatedUser = createdUsers[createdIndex]!;
      createdUsers[createdIndex] = {
        ...existingCreatedUser,
        name: updated.name,
        email: updated.email,
      };
      writeDevJson(DEV_USERS_STORAGE_KEY, createdUsers);
    } else {
      const edits = readDevJson<Record<string, Partial<ApiUser>>>(DEV_USER_EDITS_STORAGE_KEY, {});
      edits[String(userId)] = {
        ...(edits[String(userId)] ?? {}),
        name: updated.name,
        email: updated.email,
      };
      writeDevJson(DEV_USER_EDITS_STORAGE_KEY, edits);
    }

    const storedUser = sessionStorage.getItem('edlearn_user');
    if (storedUser) {
      const current = JSON.parse(storedUser) as ApiUser;
      if (String(current.id) === String(userId)) {
        sessionStorage.setItem(
          'edlearn_user',
          JSON.stringify({
            ...current,
            name: updated.name,
            email: updated.email,
          }),
        );
      }
    }
  } catch {
    // Ignore storage errors
  }

  return updated;
}

function getDevProgramsFallback(params?: {
  archived?: boolean;
}): ApiListResponse<ApiProgram> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const mockPrograms: ApiProgram[] = [
    {
      id: 'dev-program-1',
      code: 'CSBS',
      title: 'Bachelor of Science in Computer Science',
      description: 'Four-year program in computer science with focus on software development, algorithms, and systems.',
      status: 'active',
    },
    {
      id: 'dev-program-2',
      code: 'MATH',
      title: 'Bachelor of Science in Mathematics',
      description: 'Comprehensive study of pure and applied mathematics with research opportunities.',
      status: 'active',
    },
    {
      id: 'dev-program-3',
      code: 'SCIENCE',
      title: 'Bachelor of Science in Natural Sciences',
      description: 'Integrated program in physics, chemistry, biology, and earth sciences.',
      status: 'active',
    },
    {
      id: 'dev-program-4',
      code: 'LIBERAL',
      title: 'Bachelor of Arts in Liberal Arts',
      description: 'Interdisciplinary studies in humanities, social sciences, and sciences.',
      status: 'active',
    },
    {
      id: 'dev-program-5',
      code: 'BUSINESS',
      title: 'Bachelor of Business Administration',
      description: 'Business fundamentals, economics, management, and entrepreneurship.',
      status: 'active',
    },
    {
      id: 'dev-program-6',
      code: 'EDUCATION',
      title: 'Bachelor of Science in Education',
      description: 'Teacher preparation program with subject specializations and practical field work.',
      status: 'active',
    },
  ];

  let filtered = mockPrograms.slice();

  if (params?.archived === true) {
    filtered = [];
  }

  return {
    data: filtered,
    meta: {
      total: filtered.length,
      page: 1,
      perPage: 10,
      pages: Math.max(1, Math.ceil(filtered.length / 10)),
    },
  };
}

function getDevMessagesFallback(params?: {
  folder?: 'inbox' | 'sent' | 'drafts' | 'deleted';
  q?: string;
  limit?: number;
}): ApiListResponse<ApiMessage> | null {
  if (!(import.meta as any).env?.DEV) return null;

  // Get current user
  let currentUserId: string | null = null;
  try {
    const userStr = sessionStorage.getItem('edlearn_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      currentUserId = user.id || null;
    }
  } catch (e) {
    // Ignore
  }

  // Load message modifications (status changes, read status, etc) for mock messages
  const mods = readDevJson<Record<string, { status?: string; readAt?: string }>>(DEV_MESSAGE_MODS_KEY, {});

  // Load any locally-created or modified messages first
  const messageUpdates = new Map<string, ApiMessage>();
  for (const m of readDevJson<ApiMessage[]>(DEV_MESSAGE_STORAGE_KEY, [])) {
    messageUpdates.set(m.id, m);
  }

  const now = new Date();

  // Create mock inbox messages (from teachers to current user)
  const inboxMessages: ApiMessage[] = Array.from({ length: 16 }).map((_, i) => {
    const idx = i + 1;
    const minutesAgo = idx * 30;
    const mockId = `dev-msg-${idx}`;
    
    // If this message was modified/deleted, use the updated version from storage
    if (messageUpdates.has(mockId)) {
      return messageUpdates.get(mockId)!;
    }
    
    const baseMockMessage: ApiMessage = {
      id: mockId,
      subject: idx % 4 === 0 ? 'Reminder' : `Message ${idx}`,
      body: `This is a mock message body for message ${idx}`,
      status: 'sent', // incoming messages have status 'sent'
      sentAt: new Date(now.getTime() - minutesAgo * 60000).toISOString(),
      readAt: idx % 3 === 0 ? new Date(now.getTime() - (minutesAgo - 10) * 60000).toISOString() : null,
      createdAt: new Date(now.getTime() - minutesAgo * 60000).toISOString(),
      sender: { id: `dev-teacher-${(idx % 7) + 1}`, name: `Teacher ${idx}`, email: `teacher${(idx % 7) + 1}@dev.local`, role: 'teacher' },
      recipient: currentUserId ? { id: currentUserId, name: 'You', email: 'admin@dev.local', role: 'student' } : null,
    } as ApiMessage;

    // Apply any modifications (status changes, readAt)
    if (mods[mockId]) {
      if (mods[mockId].status !== undefined) {
        baseMockMessage.status = mods[mockId].status as any;
      }
      if (mods[mockId].readAt !== undefined) {
        baseMockMessage.readAt = mods[mockId].readAt;
      }
    }

    return baseMockMessage;
  });

  const allMessages: ApiMessage[] = [...inboxMessages];

  // Add any user-created messages (not modifications of mock messages)
  // Only add messages that aren't mock messages (don't match dev-msg-N pattern)
  for (const m of readDevJson<ApiMessage[]>(DEV_MESSAGE_STORAGE_KEY, [])) {
    if (!m.id.match(/^dev-msg-\d+$/)) {
      allMessages.push(m);
    }
  }

  let filtered = allMessages.slice();

  // Filter by folder
  if (params?.folder) {
    if (params.folder === 'inbox') {
      // Show received messages (not sent by current user and not drafts/deleted)
      filtered = filtered.filter((m) => m.status === 'sent' && String(m.sender?.id) !== String(currentUserId));
    } else if (params.folder === 'sent') {
      // Show sent messages (created by current user with status 'sent')
      filtered = filtered.filter((m) => m.status === 'sent' && String(m.sender?.id) === String(currentUserId));
    } else if (params.folder === 'drafts') {
      // Show draft messages
      filtered = filtered.filter((m) => m.status === 'draft');
    } else if (params.folder === 'deleted') {
      // Show deleted messages
      filtered = filtered.filter((m) => m.status === 'deleted');
    }
  }

  // Filter by search query
  if (params?.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (m) => m.subject?.toLowerCase().includes(q) || m.body.toLowerCase().includes(q) || m.sender?.name?.toLowerCase().includes(q),
    );
  }

  // Apply limit
  const limit = params?.limit ?? 10;
  return {
    data: filtered.slice(0, limit),
    meta: {
      total: filtered.length,
      page: 1,
      perPage: limit,
      pages: Math.max(1, Math.ceil(filtered.length / limit)),
    },
  };
}

// Helper function to get teacher info by ID
function getTeacherInfoById(teacherId: string): { name: string; email: string } | null {
  const teacherAndStudentNames = [
    // Teachers (7)
    'Carol Nguyen', 'David Lee', 'Eve Martinez', 'Franklin Cruz', 'Grace Park', 'Hector Reyes', 'Ivy Chen',
  ];

  const match = teacherId.match(/dev-teacher-(\d+)/);
  if (!match) return null;

  const idx = parseInt(match[1]!, 10) - 1; // Convert 1-indexed to 0-indexed
  if (idx < 0 || idx >= teacherAndStudentNames.length) return null;

  const full = teacherAndStudentNames[idx]!;
  const parts = full.split(' ');
  const first = parts[0]!.toLowerCase();
  const last = parts[parts.length - 1]!.toLowerCase();
  const email = `${first}.${last}@teacher.edu.ph`;

  return { name: full, email };
}

const DEV_MESSAGE_STORAGE_KEY = 'edlearn_dev_messages';
const DEV_MESSAGE_MODS_KEY = 'edlearn_message_mods';
const DEV_EVENTS_STORAGE_KEY = 'edlearn_dev_events';
const DEV_ANNOUNCEMENTS_STORAGE_KEY = 'edlearn_dev_announcements';
const DEV_USERS_STORAGE_KEY = 'edlearn_dev_users';
const DEV_USER_EDITS_STORAGE_KEY = 'edlearn_dev_user_edits';
const DEV_LESSONS_STORAGE_PREFIX = 'edlearn_dev_lessons_';
const DEV_CLASS_SESSIONS_STORAGE_PREFIX = 'edlearn_dev_class_sessions_';
const DEV_CLASSROOM_MESSAGES_STORAGE_PREFIX = 'edlearn_dev_classroom_messages_';

function readDevJson<T>(key: string, fallback: T): T {
  let localValue: any = undefined;
  let sessionValue: any = undefined;

  try {
    const shared = localStorage.getItem(key);
    if (shared) localValue = JSON.parse(shared);
  } catch {
    // Ignore
  }

  try {
    const session = sessionStorage.getItem(key);
    if (session) sessionValue = JSON.parse(session);
  } catch {
    // Ignore
  }

  if (Array.isArray(localValue) || Array.isArray(sessionValue)) {
    const merged: any[] = [];
    const seen = new Set<string>();
    for (const item of [...(Array.isArray(sessionValue) ? sessionValue : []), ...(Array.isArray(localValue) ? localValue : [])]) {
      const keyValue = item && typeof item === 'object' && 'id' in item ? String((item as any).id) : JSON.stringify(item);
      if (!seen.has(keyValue)) {
        seen.add(keyValue);
        merged.push(item);
      }
    }
    return merged as T;
  }

  if (
    localValue && typeof localValue === 'object' && !Array.isArray(localValue) ||
    sessionValue && typeof sessionValue === 'object' && !Array.isArray(sessionValue)
  ) {
    return { ...(sessionValue || {}), ...(localValue || {}) } as T;
  }

  if (localValue !== undefined) return localValue as T;
  if (sessionValue !== undefined) return sessionValue as T;

  return fallback;
}

function writeDevJson(key: string, value: unknown) {
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
  } catch {
    // Ignore
  }
  try {
    sessionStorage.setItem(key, serialized);
  } catch {
    // Ignore
  }
}

function getDevMessageCreateFallback(payload: {
  toUserId?: string | null;
  subject?: string | null;
  body: string;
  status?: 'draft' | 'sent';
}): ApiItemResponse<ApiMessage> | null {
  if (!(import.meta as any).env?.DEV) return null;

  // Get current user from sessionStorage
  let currentUser: any = null;
  try {
    const userStr = sessionStorage.getItem('edlearn_user');
    if (userStr) {
      currentUser = JSON.parse(userStr);
    }
  } catch (e) {
    // Ignore
  }

  // Get recipient info
  let recipient: ApiMessageParty | null = null;
  if (payload.toUserId) {
    // Look up teacher info by ID
    const teacherInfo = getTeacherInfoById(payload.toUserId);
    recipient = teacherInfo
      ? {
          id: payload.toUserId,
          name: teacherInfo.name,
          email: teacherInfo.email,
          role: 'teacher',
        }
      : {
          id: payload.toUserId,
          name: 'Recipient',
          email: `user-${payload.toUserId}@dev.local`,
          role: 'student',
        };
  }

  const message: ApiMessage = {
    id: `dev-msg-local-${Date.now()}`,
    subject: payload.subject || '(No subject)',
    body: payload.body,
    status: payload.status || 'sent',
    sentAt: payload.status === 'sent' ? new Date().toISOString() : null,
    readAt: null,
    createdAt: new Date().toISOString(),
    sender: currentUser
      ? {
          id: String(currentUser.id),
          name: currentUser.name,
          email: currentUser.email,
          role: (currentUser.role as ApiUserRole) || 'student',
        }
      : { id: 'dev-user', name: 'Current User', email: 'user@dev.local', role: 'student' },
    recipient,
  };

  // Store in sessionStorage
  try {
    const messages = readDevJson<ApiMessage[]>(DEV_MESSAGE_STORAGE_KEY, []);
    messages.push(message);
    writeDevJson(DEV_MESSAGE_STORAGE_KEY, messages);
  } catch (e) {
    // Ignore
  }

  return { data: message };
}

function getDevMessageUpdateFallback(
  id: string,
  payload: { toUserId?: string | null; subject?: string | null; body?: string; send?: boolean }
): ApiItemResponse<ApiMessage> | null {
  if (!(import.meta as any).env?.DEV) return null;

  try {
    const messages = readDevJson<ApiMessage[]>(DEV_MESSAGE_STORAGE_KEY, []);
    const idx = messages.findIndex((m) => m.id === id);
    if (idx !== -1) {
      const message = messages[idx]!;
      messages[idx] = {
        ...message,
        subject: payload.subject !== undefined ? payload.subject : message.subject,
        body: payload.body !== undefined ? payload.body : message.body,
        status: payload.send ? 'sent' : message.status,
        sentAt: payload.send && !message.sentAt ? new Date().toISOString() : message.sentAt,
      };
      writeDevJson(DEV_MESSAGE_STORAGE_KEY, messages);
      return { data: messages[idx]! };
    }
  } catch (e) {
    // Ignore
  }

  return null;
}

function getDevMessageTrashFallback(id: string): ApiMessageResponse | null {
  if (!(import.meta as any).env?.DEV) return null;

  try {
    // Track modifications to mock messages separately
    const mods = readDevJson<Record<string, { status: string }>>(DEV_MESSAGE_MODS_KEY, {});
    mods[id] = { status: 'deleted' };
    writeDevJson(DEV_MESSAGE_MODS_KEY, mods);

    // Also update if it's in edlearn_dev_messages
    const messages = readDevJson<ApiMessage[]>(DEV_MESSAGE_STORAGE_KEY, []);
    if (messages.length) {
      const idx = messages.findIndex((m) => m.id === id);
      if (idx !== -1) {
        messages[idx]!.status = 'deleted';
        writeDevJson(DEV_MESSAGE_STORAGE_KEY, messages);
      }
    }

    return { message: 'Message moved to trash' };
  } catch (e) {
    // Ignore
  }

  return null;
}

function getDevMessageRestoreFallback(id: string): ApiMessageResponse | null {
  if (!(import.meta as any).env?.DEV) return null;

  try {
    // Track modifications to mock messages separately
    const mods = readDevJson<Record<string, { status: string }>>(DEV_MESSAGE_MODS_KEY, {});
    mods[id] = { status: 'sent' };
    writeDevJson(DEV_MESSAGE_MODS_KEY, mods);

    // Also update if it's in edlearn_dev_messages
    const messages = readDevJson<ApiMessage[]>(DEV_MESSAGE_STORAGE_KEY, []);
    if (messages.length) {
      const idx = messages.findIndex((m) => m.id === id);
      if (idx !== -1) {
        messages[idx]!.status = 'sent';
        writeDevJson(DEV_MESSAGE_STORAGE_KEY, messages);
      }
    }

    return { message: 'Message restored' };
  } catch (e) {
    // Ignore
  }

  return null;
}

function getDevMessageReadFallback(id: string): ApiItemResponse<ApiMessage> | null {
  if (!(import.meta as any).env?.DEV) return null;

  try {
    // Track modifications to mock messages separately
    const mods = readDevJson<Record<string, { status?: string; readAt?: string }>>(DEV_MESSAGE_MODS_KEY, {});
    if (!mods[id]) mods[id] = {};
    mods[id].readAt = new Date().toISOString();
    writeDevJson(DEV_MESSAGE_MODS_KEY, mods);

    // Also update if it's in edlearn_dev_messages
    const messages = readDevJson<ApiMessage[]>(DEV_MESSAGE_STORAGE_KEY, []);
    if (messages.length) {
      const idx = messages.findIndex((m) => m.id === id);
      if (idx !== -1) {
        messages[idx]!.readAt = new Date().toISOString();
        writeDevJson(DEV_MESSAGE_STORAGE_KEY, messages);
        return { data: messages[idx]! };
      }
    }

    // Return a mock message with readAt set
    return {
      data: {
        id,
        subject: 'Message',
        body: 'Message body',
        status: 'sent',
        sentAt: new Date().toISOString(),
        readAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        sender: { id: 'dev-user', name: 'User', email: 'user@dev.local', role: 'student' },
        recipient: null,
      } as ApiMessage,
    };
  } catch (e) {
    // Ignore
  }

  return null;
}


async function getDevMessageThreadFallback(otherUserId: string) {
  if (!(import.meta as any).env?.DEV) return null;

  // Get current user
  let currentUserId: string | null = null;
  let currentUser: any = null;
  try {
    const userStr = sessionStorage.getItem('edlearn_user');
    if (userStr) {
      currentUser = JSON.parse(userStr);
      currentUserId = currentUser.id || null;
    }
  } catch (e) {
    // Ignore
  }

  // Load all messages and filter for conversation between current user and other user
  const allMessages: ApiMessage[] = [];
  
  try {
    allMessages.push(...readDevJson<ApiMessage[]>(DEV_MESSAGE_STORAGE_KEY, []));
  } catch (e) {
    // Ignore
  }

  // Filter for messages between current user and other user (in both directions)
  const threadMessages = allMessages.filter((m) => {
    const isFromCurrentToOther = String(m.sender?.id) === String(currentUserId) && String(m.recipient?.id) === String(otherUserId);
    const isFromOtherToCurrent = String(m.sender?.id) === String(otherUserId) && String(m.recipient?.id) === String(currentUserId);
    return (isFromCurrentToOther || isFromOtherToCurrent) && m.status !== 'draft';
  });

  return {
    data: threadMessages,
    meta: {
      total: threadMessages.length,
      limit: 20,
      pages: Math.max(1, Math.ceil(threadMessages.length / 20)),
    },
  };
}

async function getDevChatUsersFallback() {
  if (!(import.meta as any).env?.DEV) return null;

  // Get current user
  let currentUserId: string | null = null;
  try {
    const userStr = sessionStorage.getItem('edlearn_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      currentUserId = user.id || null;
    }
  } catch (e) {
    // Ignore
  }

  // Load all user-created messages and find unique users
  const userSet = new Set<string>();
  const userMap = new Map<string, { id: string; name: string; email: string; role: string }>();

  try {
    const messages = readDevJson<ApiMessage[]>(DEV_MESSAGE_STORAGE_KEY, []);
    for (const msg of messages) {
      // Add recipient if different from current user
      if (msg.recipient && String(msg.recipient.id) !== String(currentUserId) && String(msg.sender?.id) === String(currentUserId)) {
        userSet.add(String(msg.recipient.id));
        userMap.set(String(msg.recipient.id), {
          id: String(msg.recipient.id),
          name: msg.recipient.name || 'Unknown',
          email: msg.recipient.email || '',
          role: msg.recipient.role || 'unknown',
        });
      }
      // Add sender if different from current user
      if (msg.sender && String(msg.sender.id) !== String(currentUserId)) {
        userSet.add(String(msg.sender.id));
        userMap.set(String(msg.sender.id), {
          id: String(msg.sender.id),
          name: msg.sender.name || 'Unknown',
          email: msg.sender.email || '',
          role: msg.sender.role || 'unknown',
        });
      }
    }
  } catch (e) {
    // Ignore
  }

  const users = Array.from(userMap.values());

  return {
    data: users,
    meta: {
      total: users.length,
      limit: 20,
      pages: Math.max(1, Math.ceil(users.length / 20)),
    },
  };
}

function getDevNotificationsFallback(): ApiListResponse<ApiNotification> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const now = new Date();
  const types: ApiNotificationType[] = [
    'announcement',
    'teacher_message',
    'announcement_expiring',
    'user_added',
    'course_added',
    'class_session_added',
    'event_added',
    'assignment_added',
  ];

  const catalog = getDevCourseCatalog();

  const items: ApiNotification[] = Array.from({ length: 20 }).map((_, i) => {
    const idx = i + 1;
    const t = types[i % types.length]!;
    const courseIdx = (idx % 12);
    const course = catalog[courseIdx]!;
    return {
      id: `dev-notif-${idx}`,
      type: t,
      title: `${t.replace(/_/g, ' ')} notification ${idx}`,
      publishedAt: new Date(now.getTime() - idx * 3600000).toISOString(),
      isPinned: false,
      course: { id: course.id, code: course.code, title: course.title },
      author: { id: `dev-user-${(idx % 10) + 1}`, name: `User ${(idx % 10) + 1}`, role: 'teacher' },
      user: null,
      event: undefined,
    } as ApiNotification;
  });

  return {
    data: items,
    meta: {
      total: items.length,
      page: 1,
      perPage: 20,
      pages: 1,
    },
  };
}

function getDevEventsFallback(params?: { start?: string; end?: string }): ApiListResponse<ApiEvent> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const now = new Date();
  const defaultEvents: ApiEvent[] = [
    {
      id: 'dev-event-1',
      title: 'Spring Semester Starts',
      description: 'Beginning of spring semester 2026',
      startsAt: new Date(now.getFullYear(), now.getMonth(), 15, 9, 0).toISOString(),
      endsAt: new Date(now.getFullYear(), now.getMonth(), 15, 17, 0).toISOString(),
    },
    {
      id: 'dev-event-2',
      title: 'Mid-Term Exams',
      description: 'Mid-term examination week for all courses',
      startsAt: new Date(now.getFullYear(), now.getMonth() + 1, 10, 8, 0).toISOString(),
      endsAt: new Date(now.getFullYear(), now.getMonth() + 1, 14, 17, 0).toISOString(),
    },
    {
      id: 'dev-event-3',
      title: 'Faculty Meeting',
      description: 'Monthly faculty meeting',
      startsAt: new Date(now.getFullYear(), now.getMonth(), 20, 14, 0).toISOString(),
      endsAt: new Date(now.getFullYear(), now.getMonth(), 20, 15, 30).toISOString(),
    },
    {
      id: 'dev-event-4',
      title: 'Parent-Teacher Conference',
      description: 'Individual parent-teacher meetings',
      startsAt: new Date(now.getFullYear(), now.getMonth() + 1, 5, 15, 0).toISOString(),
      endsAt: new Date(now.getFullYear(), now.getMonth() + 1, 5, 19, 0).toISOString(),
    },
  ];

  // Load persisted events from localStorage
  const events: ApiEvent[] = readDevJson<ApiEvent[]>(DEV_EVENTS_STORAGE_KEY, defaultEvents);

  // Filter by date range if provided
  let filtered = events;
  if (params?.start || params?.end) {
    const startDate = params?.start ? new Date(params.start) : new Date(0);
    const endDate = params?.end ? new Date(params.end) : new Date(8640000000000000);
    filtered = events.filter((e) => {
      const eventStart = new Date(e.startsAt);
      return eventStart >= startDate && eventStart <= endDate;
    });
  }

  return {
    data: filtered,
    meta: { total: filtered.length, page: 1, perPage: filtered.length, pages: 1 },
  };
}

function getDevCreateEventFallback(payload: {
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at?: string | null;
}): ApiItemResponse<ApiEvent> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const id = `dev-event-${Date.now()}`;
  const event: ApiEvent = {
    id,
    title: payload.title,
    description: payload.description || null,
    startsAt: payload.starts_at,
    endsAt: payload.ends_at || null,
  };

  // Persist event to localStorage
  try {
    const events = readDevJson<ApiEvent[]>(DEV_EVENTS_STORAGE_KEY, []);
    events.push(event);
    writeDevJson(DEV_EVENTS_STORAGE_KEY, events);
  } catch (e) {
    // Ignore persistence errors
  }

  return { data: event };
}

function getDevUpdateEventFallback(
  eventId: string,
  payload: {
    title?: string;
    description?: string | null;
    starts_at?: string;
    ends_at?: string | null;
  },
): ApiItemResponse<ApiEvent> | null {
  if (!(import.meta as any).env?.DEV) return null;

  try {
    const events = readDevJson<ApiEvent[]>(DEV_EVENTS_STORAGE_KEY, []);
    const idx = events.findIndex((e) => e.id === eventId);
    
    if (idx !== -1) {
      const event = events[idx]!;
      events[idx] = {
        ...event,
        title: payload.title !== undefined ? payload.title : event.title,
        description: payload.description !== undefined ? payload.description : event.description,
        startsAt: payload.starts_at !== undefined ? payload.starts_at : event.startsAt,
        endsAt: payload.ends_at !== undefined ? payload.ends_at : event.endsAt,
      };
      writeDevJson(DEV_EVENTS_STORAGE_KEY, events);
      return { data: events[idx]! };
    }
  } catch (e) {
    // Ignore persistence errors
  }

  const event: ApiEvent = {
    id: eventId,
    title: payload.title || 'Event',
    description: payload.description || null,
    startsAt: payload.starts_at || new Date().toISOString(),
    endsAt: payload.ends_at || null,
  };

  return { data: event };
}

function getDevDeleteEventFallback(eventId: string): ApiMessageResponse | null {
  if (!(import.meta as any).env?.DEV) return null;

  try {
    const events = readDevJson<ApiEvent[]>(DEV_EVENTS_STORAGE_KEY, []);
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      events.splice(idx, 1);
      writeDevJson(DEV_EVENTS_STORAGE_KEY, events);
    }
  } catch (e) {
    // Ignore persistence errors
  }

  return { message: `Event ${eventId} deleted` };
}

function getDevCourseAnnouncementsFallback(courseId: string): ApiListResponse<ApiAnnouncement> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const catalog = getDevCourseCatalog();
  const course = catalog.find((c) => c.id === courseId);
  if (!course) return null;

  const now = new Date();
  const globalAnnouncements: ApiAnnouncement[] = [
    {
      id: 'dev-announce-global-1',
      courseId: null,
      title: 'Admin Announcement',
      body: 'This is a global announcement from the admin. Teachers and students can view it in their announcements tab.',
      isPinned: true,
      publishedAt: new Date(now.getTime() - 2 * 24 * 3600000).toISOString(),
      author: { id: '1', name: 'Admin User', email: 'mike.goco@admin.edu.ph', role: 'admin' },
    },
  ];

  const defaultAnnouncements: ApiAnnouncement[] = [
    {
      id: 'dev-announce-1',
      courseId: courseId,
      title: 'Welcome to the Course',
      body: 'Welcome to ' + course.title + '. We are excited to have you in this course. Please review the course syllabus and let me know if you have any questions.',
      isPinned: true,
      publishedAt: new Date(now.getTime() - 7 * 24 * 3600000).toISOString(),
      author: { id: '2', name: course.teacher, email: 'teacher@school.edu', role: 'teacher' },
    },
    {
      id: 'dev-announce-2',
      courseId: courseId,
      title: 'Assignment 1 Due Next Week',
      body: 'Please complete the first assignment by next Friday. Instructions are available in the course materials section.',
      isPinned: false,
      publishedAt: new Date(now.getTime() - 3 * 24 * 3600000).toISOString(),
      author: { id: '2', name: course.teacher, email: 'teacher@school.edu', role: 'teacher' },
    },
    {
      id: 'dev-announce-3',
      courseId: courseId,
      title: 'Exam Schedule Announced',
      body: 'The mid-term exam will be held on March 15, 2026 from 10:00 AM to 12:00 PM. Please review all materials covered in the first half of the semester.',
      isPinned: false,
      publishedAt: new Date(now.getTime() - 1 * 24 * 3600000).toISOString(),
      author: { id: '2', name: course.teacher, email: 'teacher@school.edu', role: 'teacher' },
    },
  ];

  // Load persisted announcements from localStorage, keyed by courseId
  const allAnnouncements = readDevJson<Record<string, ApiAnnouncement[]>>(DEV_ANNOUNCEMENTS_STORAGE_KEY, {});
  const announcements = [
    ...(allAnnouncements.__global__ || globalAnnouncements),
    ...(allAnnouncements[courseId] || defaultAnnouncements),
  ];

  return {
    data: announcements,
    meta: { total: announcements.length, page: 1, perPage: announcements.length, pages: 1 },
  };
}

function getDevGlobalAnnouncementsFallback(): ApiListResponse<ApiAnnouncement> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const now = new Date();
  const globalAnnouncements: ApiAnnouncement[] = [
    {
      id: 'dev-announce-global-1',
      courseId: null,
      title: 'Admin Announcement',
      body: 'This is a global announcement from the admin. Teachers and students can view it in their announcements tab.',
      isPinned: true,
      publishedAt: new Date(now.getTime() - 2 * 24 * 3600000).toISOString(),
      author: { id: '1', name: 'Admin User', email: 'mike.goco@admin.edu.ph', role: 'admin' },
    },
  ];

  // Load persisted announcements from localStorage
  const allAnnouncements = readDevJson<Record<string, ApiAnnouncement[]>>(DEV_ANNOUNCEMENTS_STORAGE_KEY, {});
  const announcements = allAnnouncements.__global__ || globalAnnouncements;

  return {
    data: announcements,
    meta: { total: announcements.length, page: 1, perPage: announcements.length, pages: 1 },
  };
}

function getDevCreateGlobalAnnouncementFallback(payload: { title: string; body: string }): ApiItemResponse<ApiAnnouncement> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const announcement: ApiAnnouncement = {
    id: `dev-announce-${Date.now()}`,
    courseId: null,
    title: payload.title,
    body: payload.body,
    isPinned: false,
    publishedAt: new Date().toISOString(),
    author: { id: 'dev-user-1', name: 'Current User', email: 'user@school.edu', role: 'admin' },
  };

  try {
    const allAnnouncements = readDevJson<Record<string, ApiAnnouncement[]>>(DEV_ANNOUNCEMENTS_STORAGE_KEY, {});
    if (!allAnnouncements.__global__) allAnnouncements.__global__ = [];
    allAnnouncements.__global__.push(announcement);
    writeDevJson(DEV_ANNOUNCEMENTS_STORAGE_KEY, allAnnouncements);
  } catch (e) {
    // ignore
  }

  return { data: announcement };
}

function getDevCreateCourseAnnouncementFallback(
  courseId: string,
  payload: { title: string; body: string },
): ApiItemResponse<ApiAnnouncement> | null {
  if (!(import.meta as any).env?.DEV) return null;

  const announcement: ApiAnnouncement = {
    id: `dev-announce-${Date.now()}`,
    courseId: courseId,
    title: payload.title,
    body: payload.body,
    isPinned: false,
    publishedAt: new Date().toISOString(),
    author: { id: 'dev-user-1', name: 'Current User', email: 'user@school.edu', role: 'teacher' },
  };

  // Persist announcement to localStorage
  try {
    const allAnnouncements = readDevJson<Record<string, ApiAnnouncement[]>>(DEV_ANNOUNCEMENTS_STORAGE_KEY, {});
    if (!allAnnouncements[courseId]) {
      allAnnouncements[courseId] = [];
    }
    allAnnouncements[courseId].push(announcement);
    writeDevJson(DEV_ANNOUNCEMENTS_STORAGE_KEY, allAnnouncements);
  } catch (e) {
    // Ignore persistence errors
  }

  return { data: announcement };
}

export const api = {
  async login(email: string, password: string) {
    try {
      return await apiFetch<ApiLoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      const fallback = getDevCredentialLoginFallback(email, password);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }

      throw err;
    }
  },

  async loginWithGoogle(credential: string) {
    // Dev-only quick access credentials should not depend on a running backend.
    if ((import.meta as any).env?.DEV && credential.startsWith('MOCK_GOOGLE_CREDENTIAL_')) {
      const role = credential.replace('MOCK_GOOGLE_CREDENTIAL_', '').toLowerCase() as ApiUserRole;
      const userByRole: Record<ApiUserRole, ApiUser> = {
        admin: {
          id: 'dev-admin',
          name: 'Admin User',
          email: 'admin@dev.local',
          role: 'admin',
        },
        teacher: {
          id: 'dev-teacher',
          name: 'Teacher User',
          email: 'teacher@dev.local',
          role: 'teacher',
        },
        student: {
          id: 'dev-student',
          name: 'Student User',
          email: 'student@dev.local',
          role: 'student',
        },
      };

      if (role in userByRole) {
        return {
          token: `dev-mock-token-${role}`,
          user: userByRole[role],
        };
      }
    }

    return apiFetch<ApiLoginResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },

  async me() {
    return apiFetch<ApiUser>('/api/me');
  },

  async updateMe(payload: {
    name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
    new_password_confirmation?: string;
  }) {
    return apiFetch<ApiUser>('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async uploadMyAvatar(file: File) {
    const form = new FormData();
    form.append('avatar', file);
    return apiFetch<ApiUser>('/api/me/avatar', {
      method: 'POST',
      body: form,
    });
  },

  async deleteMyAvatar() {
    return apiFetch<ApiUser>('/api/me/avatar', {
      method: 'DELETE',
    });
  },

  async forgotPassword(email: string) {
    return apiFetch<ApiMessageResponse>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(payload: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }) {
    return apiFetch<ApiMessageResponse>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async courses(params?: { archived?: boolean; available?: boolean }) {
    try {
      const qs = new URLSearchParams();
      if (params?.archived === true) qs.set('archived', '1');
      if (params?.archived === false) qs.set('archived', '0');
      if (params?.available === true) qs.set('available', '1');
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await apiFetch<ApiListResponse<ApiCourse>>(`/api/courses${suffix}`);
    } catch (err) {
      const fallback = getDevCoursesFallback(params);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async programs(params?: { archived?: boolean }) {
    try {
      const qs = new URLSearchParams();
      if (params?.archived === true) qs.set('archived', '1');
      if (params?.archived === false) qs.set('archived', '0');
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await apiFetch<ApiListResponse<ApiProgram>>(`/api/programs${suffix}`);
    } catch (err) {
      const fallback = getDevProgramsFallback(params);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async createProgram(payload: ApiProgramUpsert) {
    return apiFetch<ApiItemResponse<ApiProgram>>('/api/programs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProgram(programId: string, payload: Partial<ApiProgramUpsert>) {
    return apiFetch<ApiItemResponse<ApiProgram>>(`/api/programs/${encodeURIComponent(programId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteProgram(programId: string) {
    return apiFetch<ApiMessageResponse>(`/api/programs/${encodeURIComponent(programId)}`, {
      method: 'DELETE',
    });
  },

  async createCourse(payload: ApiCourseUpsert) {
    return apiFetch<ApiItemResponse<ApiCourse>>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async course(courseId: string) {
    try {
      return await apiFetch<ApiItemResponse<ApiCourse>>(`/api/courses/${encodeURIComponent(courseId)}`);
    } catch (err) {
      const fallback = getDevCourseFallback(courseId);
      if (fallback) {
        // In DEV, prefer returning the fallback course to keep the UI usable
        return fallback;
      }
      throw err;
    }
  },

  async session(sessionId: string) {
    try {
      return await apiFetch<ApiItemResponse<ApiClassSession>>(`/api/sessions/${encodeURIComponent(sessionId)}`);
    } catch (err) {
      const courseCatalog = getDevCourseCatalog();
      for (const course of courseCatalog) {
        const sessions = getDevCourseSessionsFallback(course.id);
        const found = sessions?.data.find((session) => String(session.id) === String(sessionId));
        if (found) {
          return { data: found } as ApiItemResponse<ApiClassSession>;
        }
      }
      throw err;
    }
  },

  async updateCourse(courseId: string, payload: Partial<ApiCourseUpsert>) {
    try {
      return await apiFetch<ApiItemResponse<ApiCourse>>(`/api/courses/${encodeURIComponent(courseId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const fallback = getDevUpdateCourseFallback(courseId, payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async courseSessions(courseId: string) {
    try {
      return await apiFetch<ApiListResponse<ApiClassSession>>(
        `/api/courses/${encodeURIComponent(courseId)}/sessions`
      );
    } catch (err) {
      const fallback = getDevCourseSessionsFallback(courseId);
      if (fallback) return fallback;
      throw err;
    }
  },

  async createCourseSession(courseId: string, payload: {
    title: string;
    starts_at: string;
    ends_at?: string | null;
    meeting_url?: string | null;
    status?: string | null;
    notes?: string | null;
  }) {
    try {
      return await apiFetch<ApiItemResponse<ApiClassSession>>(
        `/api/courses/${encodeURIComponent(courseId)}/sessions`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      const fallback = getDevCreateCourseSessionFallback(courseId, payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async updateCourseSession(courseId: string, sessionId: string, payload: {
    title?: string;
    starts_at?: string;
    ends_at?: string | null;
    meeting_url?: string | null;
    status?: string | null;
    notes?: string | null;
  }) {
    try {
      return await apiFetch<ApiItemResponse<ApiClassSession>>(
        `/api/courses/${encodeURIComponent(courseId)}/sessions/${encodeURIComponent(sessionId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      const fallback = getDevUpdateCourseSessionFallback(courseId, sessionId, payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async courseAssignments(courseId: string) {
    try {
      return await apiFetch<ApiListResponse<ApiAssignment>>(
        `/api/courses/${encodeURIComponent(courseId)}/assignments`
      );
    } catch (err) {
      const fallback = getDevCourseAssignmentsFallback(courseId);
      if (fallback) return fallback;
      throw err;
    }
  },

  async createCourseAssignment(courseId: string, payload: {
    title: string;
    description?: string | null;
    due_at?: string | null;
    points?: number;
    status?: string;
    period?: string | null;
    week_in_period?: number | null;
    submission_type?: string | null;
    rubric?: Array<{ name: string; weight: number }> | null;
    quiz_data?: {
      questions: Array<{
        question: string;
        options: string[];
        correctAnswer: string;
        points: number;
      }>;
    } | null;
  }) {
    return apiFetch<ApiItemResponse<ApiAssignment>>(
      `/api/courses/${encodeURIComponent(courseId)}/assignments`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },

  async updateCourseAssignment(courseId: string, assignmentId: string, payload: Partial<{
    title: string;
    description: string | null;
    due_at: string | null;
    points: number;
    status: string;
    period: string | null;
    week_in_period: number | null;
    submission_type: string | null;
    rubric: Array<{ name: string; weight: number }> | null;
    quiz_data: {
      questions: Array<{
        question: string;
        options: string[];
        correctAnswer: string;
        points: number;
      }>;
    } | null;
  }>) {
    return apiFetch<ApiItemResponse<ApiAssignment>>(
      `/api/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
  },

  async deleteCourseAssignment(courseId: string, assignmentId: string) {
    return apiFetch<ApiMessageResponse>(
      `/api/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}`,
      {
        method: 'DELETE',
      },
    );
  },

  async assignmentSubmissions(assignmentId: string) {
    return apiFetch<ApiListResponse<ApiSubmission>>(
      `/api/assignments/${encodeURIComponent(assignmentId)}/submissions`,
    );
  },

  async createSubmission(assignmentId: string, payload: { content?: string | null; file?: File | null; quiz_answers?: Array<{ questionIndex: number; answer: string }> | null; }) {
    const form = new FormData();
    if (payload.content !== undefined) form.append('content', payload.content ?? '');
    if (payload.file) form.append('file', payload.file);
    if (payload.quiz_answers !== undefined && payload.quiz_answers !== null) {
      payload.quiz_answers.forEach((q, i) => {
        form.append(`quiz_answers[${i}][questionIndex]`, String(q.questionIndex));
        form.append(`quiz_answers[${i}][answer]`, q.answer);
      });
    }
    return apiFetch<ApiItemResponse<ApiSubmission>>(
      `/api/assignments/${encodeURIComponent(assignmentId)}/submissions`,
      {
        method: 'POST',
        body: form,
      },
    );
  },

  async gradeSubmission(submissionId: string, payload: { grade: number; feedback?: string | null }) {
    return apiFetch<ApiItemResponse<ApiSubmission>>(
      `/api/submissions/${encodeURIComponent(submissionId)}/grade`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
  },

  async courseLessons(courseId: string) {
    try {
      return await apiFetch<ApiListResponse<ApiLesson>>(
        `/api/courses/${encodeURIComponent(courseId)}/lessons`
      );
    } catch (err) {
      const fallback = getDevCourseLessonsFallback(courseId);
      if (fallback) return fallback;
      throw err;
    }
  },

  async createCourseLesson(courseId: string, payload: {
    title: string;
    description?: string | null;
    content?: string | null;
    lesson_order?: number;
    duration?: string | null;
    status?: string;
    period?: string | null;
    week_in_period?: number | null;
  }) {
    try {
      return await apiFetch<ApiItemResponse<ApiLesson>>(
        `/api/courses/${encodeURIComponent(courseId)}/lessons`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      const fallback = getDevCreateCourseLessonFallback(courseId, payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async generateQuiz(courseId: string, payload: { lesson_id?: number | null; material_id?: number | null; count?: number; types?: string[] }) {
    return apiFetch<any>(`/api/courses/${encodeURIComponent(courseId)}/generate-quiz`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCourseLesson(courseId: string, lessonId: string, payload: Partial<{
    title: string;
    description: string | null;
    content: string | null;
    lesson_order: number;
    duration: string | null;
    status: string;
  }>) {
    try {
      return await apiFetch<ApiItemResponse<ApiLesson>>(
        `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      const fallback = getDevUpdateCourseLessonFallback(courseId, lessonId, payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async deleteCourseLesson(courseId: string, lessonId: string) {
    try {
      return await apiFetch<ApiMessageResponse>(
        `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
        {
          method: 'DELETE',
        },
      );
    } catch (err) {
      const fallback = getDevDeleteCourseLessonFallback(courseId, lessonId);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async courseMaterials(courseId: string) {
    try {
      return await apiFetch<ApiListResponse<ApiMaterial>>(
        `/api/courses/${encodeURIComponent(courseId)}/materials`
      );
    } catch (err) {
      const fallback = getDevCourseMaterialsFallback(courseId);
      if (fallback) return fallback;
      throw err;
    }
  },

  async uploadCourseMaterial(courseId: string, payload: { title?: string; description?: string; file: File; period?: string; week_in_period?: number }) {
    const form = new FormData();
    if (payload.title) form.set('title', payload.title);
    if (payload.description) form.set('description', payload.description);
    if (payload.period) form.set('period', payload.period);
    if (typeof payload.week_in_period === 'number') form.set('week_in_period', String(payload.week_in_period));
    form.set('file', payload.file);

    return apiFetch<ApiItemResponse<ApiMaterial>>(
      `/api/courses/${encodeURIComponent(courseId)}/materials`,
      {
        method: 'POST',
        body: form,
      },
    );
  },

  async deleteCourseMaterial(courseId: string, materialId: string) {
    return apiFetch<ApiMessageResponse>(
      `/api/courses/${encodeURIComponent(courseId)}/materials/${encodeURIComponent(materialId)}`,
      {
        method: 'DELETE',
      },
    );
  },

  async courseGrades(courseId: string) {
    return apiFetch<ApiListResponse<ApiCourseGradeRow>>(
      `/api/courses/${encodeURIComponent(courseId)}/grades`,
    );
  },

  async setCourseGrade(courseId: string, studentId: string, payload: { final_grade?: number | null; remarks?: string | null }) {
    return apiFetch<ApiItemResponse<{ studentId: string; finalGrade: number | null; remarks: string | null }>>(
      `/api/courses/${encodeURIComponent(courseId)}/grades/${encodeURIComponent(studentId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
  },

  async myCourseGrade(courseId: string) {
    return apiFetch<ApiItemResponse<ApiMyCourseGrade>>(
      `/api/courses/${encodeURIComponent(courseId)}/my-grade`,
    );
  },

  async courseAnnouncements(courseId: string) {
    try {
      return await apiFetch<ApiListResponse<ApiAnnouncement>>(
        `/api/courses/${encodeURIComponent(courseId)}/announcements`
      );
    } catch (err) {
      const fallback = getDevCourseAnnouncementsFallback(courseId);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async globalAnnouncements() {
    try {
      return await apiFetch<ApiListResponse<ApiAnnouncement>>('/api/announcements');
    } catch (err) {
      const fallback = getDevGlobalAnnouncementsFallback();
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async courseEnrollments(courseId: string) {
    try {
      return await apiFetch<ApiListResponse<ApiEnrollment>>(
        `/api/courses/${encodeURIComponent(courseId)}/enrollments`,
      );
    } catch (err) {
      const fallback = getDevCourseEnrollmentsFallback(courseId);
      if (fallback) return fallback;
      throw err;
    }
  },

  async allEnrollments() {
    return apiFetch<ApiListResponse<any>>('/api/enrollments');
  },

  async enrollStudent(courseId: string, studentId: string) {
    try {
      return await apiFetch<ApiItemResponse<ApiEnrollment>>(
        `/api/courses/${encodeURIComponent(courseId)}/enrollments`,
        {
          method: 'POST',
          body: JSON.stringify({ student_id: Number(studentId) }),
        },
      );
    } catch (err) {
      const fallback = getDevEnrollStudentFallback(courseId, studentId);
      if (fallback) return fallback;
      throw err;
    }
  },

  async selfEnroll(courseId: string) {
    return apiFetch<ApiItemResponse<ApiEnrollment>>(
      `/api/courses/${encodeURIComponent(courseId)}/self-enroll`,
      {
        method: 'POST',
      },
    );
  },

  async dropEnrollment(courseId: string, enrollmentId: string) {
    try {
      return await apiFetch<ApiMessageResponse>(
        `/api/courses/${encodeURIComponent(courseId)}/enrollments/${encodeURIComponent(enrollmentId)}`,
        {
          method: 'DELETE',
        },
      );
    } catch (err) {
      const fallback = getDevDropEnrollmentFallback(courseId, enrollmentId);
      if (fallback) return fallback;
      throw err;
    }
  },

  async deleteCourse(courseId: string) {
    return apiFetch<ApiMessageResponse>(`/api/courses/${encodeURIComponent(courseId)}`, {
      method: 'DELETE',
    });
  },

  async createCourseAnnouncement(courseId: string, payload: { title: string; body: string }) {
    try {
      return await apiFetch<ApiItemResponse<ApiAnnouncement>>(
        `/api/courses/${encodeURIComponent(courseId)}/announcements`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      const fallback = getDevCreateCourseAnnouncementFallback(courseId, payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async createGlobalAnnouncement(payload: { title: string; body: string }) {
    try {
      return await apiFetch<ApiItemResponse<ApiAnnouncement>>('/api/announcements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const fallback = getDevCreateGlobalAnnouncementFallback(payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async notifications() {
    try {
      return await apiFetch<ApiListResponse<ApiNotification>>('/api/notifications');
    } catch (err) {
      const fallback = getDevNotificationsFallback();
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async messages(params?: { folder?: 'inbox' | 'sent' | 'drafts' | 'deleted'; q?: string; limit?: number }) {
    try {
      const qs = new URLSearchParams();
      if (params?.folder) qs.set('folder', params.folder);
      if (params?.q) qs.set('q', params.q);
      if (typeof params?.limit === 'number') qs.set('limit', String(params.limit));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await apiFetch<ApiListResponse<ApiMessage>>(`/api/messages${suffix}`);
    } catch (err) {
      const fallback = getDevMessagesFallback(params);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async messageThread(otherUserId: string, params?: { after?: string; limit?: number }) {
      try {
        const qs = new URLSearchParams();
        if (params?.after) qs.set('after', params.after);
        if (typeof params?.limit === "number") qs.set('limit', String(params.limit));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return await apiFetch<ApiListResponse<ApiMessage>>(
          `/api/messages/thread/${encodeURIComponent(otherUserId)}${suffix}`,
        );
      } catch (error) {
        console.error('Failed to fetch message thread, using fallback:', error);
        return getDevMessageThreadFallback(otherUserId);
      }
    },

    async chatUsers(params?: { q?: string; limit?: number }) {
      try {
        const qs = new URLSearchParams();
        if (params?.q) qs.set('q', params.q);
        if (typeof params?.limit === "number") qs.set('limit', String(params.limit));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return await apiFetch<ApiListResponse<ApiUser>>(`/api/chat/users${suffix}`);
      } catch (error) {
        console.error('Failed to fetch chat users, using fallback:', error);
        return getDevChatUsersFallback();
      }
    },

    async messageCreate(payload: { toUserId?: string | null; subject?: string | null; body: string; status?: 'draft' | 'sent' }) {
    try {
      return await apiFetch<ApiItemResponse<ApiMessage>>('/api/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const fallback = getDevMessageCreateFallback(payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async messageUpdate(id: string, payload: { toUserId?: string | null; subject?: string | null; body?: string; send?: boolean }) {
    try {
      return await apiFetch<ApiItemResponse<ApiMessage>>(`/api/messages/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const fallback = getDevMessageUpdateFallback(id, payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async messageTrash(id: string) {
    try {
      return await apiFetch<ApiMessageResponse>(`/api/messages/${encodeURIComponent(id)}/trash`, {
        method: 'POST',
      });
    } catch (err) {
      const fallback = getDevMessageTrashFallback(id);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async messageRestore(id: string) {
    try {
      return await apiFetch<ApiMessageResponse>(`/api/messages/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
      });
    } catch (err) {
      const fallback = getDevMessageRestoreFallback(id);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async messageRead(id: string) {
    try {
      return await apiFetch<ApiItemResponse<ApiMessage>>(`/api/messages/${encodeURIComponent(id)}/read`, {
        method: 'POST',
      });
    } catch (err) {
      const fallback = getDevMessageReadFallback(id);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async analyticsAdmin(params?: { archived?: boolean }) {
    try {
      const qs = new URLSearchParams();
      if (params?.archived === true) qs.set('archived', '1');
      if (params?.archived === false) qs.set('archived', '0');
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await apiFetch<ApiItemResponse<ApiAnalyticsAdmin>>(`/api/analytics/admin${suffix}`);
    } catch (err) {
      const fallback = getDevAnalyticsFallback(params);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return { data: fallback };
      }
      throw err;
    }
  },

  async events(params?: { start?: string; end?: string }) {
    try {
      const qs = new URLSearchParams();
      if (params?.start) qs.set('start', params.start);
      if (params?.end) qs.set('end', params.end);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await apiFetch<ApiListResponse<ApiEvent>>(`/api/events${suffix}`);
    } catch (err) {
      const fallback = getDevEventsFallback(params);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async createEvent(payload: {
    title: string;
    description?: string | null;
    starts_at: string;
    ends_at?: string | null;
  }) {
    try {
      return await apiFetch<ApiItemResponse<ApiEvent>>('/api/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const fallback = getDevCreateEventFallback(payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async updateEvent(
    eventId: string,
    payload: {
      title?: string;
      description?: string | null;
      starts_at?: string;
      ends_at?: string | null;
    },
  ) {
    try {
      return await apiFetch<ApiItemResponse<ApiEvent>>(`/api/events/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const fallback = getDevUpdateEventFallback(eventId, payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async deleteEvent(eventId: string) {
    try {
      return await apiFetch<ApiMessageResponse>(`/api/events/${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      const fallback = getDevDeleteEventFallback(eventId);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async users(params?: {
    role?: string;
    q?: string;
    limit?: number;
    archived?: boolean;
    page?: number;
    perPage?: number;
  }) {
    try {
      const qs = new URLSearchParams();
      if (params?.role) qs.set('role', params.role);
      if (params?.q) qs.set('q', params.q);
      if (params?.limit) qs.set('limit', String(params.limit));
      if (typeof params?.page === 'number') qs.set('page', String(params.page));
      if (typeof params?.perPage === 'number') qs.set('per_page', String(params.perPage));
      if (params?.archived === true) qs.set('archived', '1');
      if (params?.archived === false) qs.set('archived', '0');
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await apiFetch<ApiListResponse<ApiUser>>(`/api/users${suffix}`);
    } catch (err) {
      const fallback = getDevUserListFallback(params);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }

      throw err;
    }
  },

  async createUser(payload: { name: string; email: string; role: 'admin' | 'teacher' | 'student' }) {
    try {
      return await apiFetch<ApiUser>('/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const fallback = getDevCreateUserFallback(payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async user(userId: string) {
    try {
      return await apiFetch<ApiUser>(`/api/users/${encodeURIComponent(userId)}`);
    } catch (err) {
      const fallback = getDevUserFallback(userId);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async userEnrollments(userId: string) {
    try {
      return await apiFetch<ApiListResponse<ApiUserEnrollment>>(
        `/api/users/${encodeURIComponent(userId)}/enrollments`,
      );
    } catch (err) {
      const fallback = getDevUserEnrollmentsFallback(userId);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async updateUser(
    userId: string,
    payload: {
      name?: string;
      email?: string;
      new_password?: string;
      new_password_confirmation?: string;
    },
  ) {
    try {
      return await apiFetch<ApiUser>(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const fallback = getDevUpdateUserFallback(userId, payload);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async archiveUser(userId: string) {
    return apiFetch<ApiMessageResponse>(`/api/users/${encodeURIComponent(userId)}/archive`, {
      method: 'PATCH',
    });
  },

  async unarchiveUser(userId: string) {
    return apiFetch<ApiMessageResponse>(`/api/users/${encodeURIComponent(userId)}/unarchive`, {
      method: 'PATCH',
    });
  },

  async deleteUser(userId: string) {
    return apiFetch<ApiMessageResponse>(`/api/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  },

  async settings() {
    return apiFetch<Record<string, any>>('/api/settings');
  },
  async updateSettings(settings: Record<string, any>) {
    return apiFetch<ApiMessageResponse>('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  },

  async analyticsTeacher() {
    try {
      return await apiFetch<ApiItemResponse<{
        totalCourses: number;
        totalStudents: number;
        upcomingSessions: number;
        assignments: number;
      }>>('/api/analytics/teacher');
    } catch (err) {
      const fallback = getDevAnalyticsTeacherFallback();
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return { data: fallback };
      }
      throw err;
    }
  },

  async analyticsStudent() {
    return apiFetch<ApiItemResponse<{
      totalCourses: number;
      upcomingSessions: number;
      avgGrade: number;
      attendanceRate: number;
      pendingTasks: number;
      progress: number;
      recentGrades?: Array<{ assignment: string; course: string; grade: number; points: number }>;
    }>>('/api/analytics/student');
  },

  async getClassroomMessages(sessionId: string) {
    try {
      return await apiFetch<ApiListResponse<{
        id: string;
        userId: string;
        userName: string;
        userRole: string;
        body: string;
        createdAt: string;
      }>>(`/api/sessions/${encodeURIComponent(sessionId)}/messages`);
    } catch (err) {
      const fallback = getDevClassroomMessagesFallback(sessionId);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async sendClassroomMessage(sessionId: string, body: string) {
    try {
      return await apiFetch<ApiItemResponse<{
        id: string;
        userId: string;
        userName: string;
        userRole: string;
        body: string;
        createdAt: string;
      }>>(`/api/sessions/${encodeURIComponent(sessionId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
    } catch (err) {
      const fallback = getDevSendClassroomMessageFallback(sessionId, body);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },
  async getClassroomParticipants(sessionId: string) {
    try {
      return await apiFetch<ApiListResponse<any>>(`/api/sessions/${encodeURIComponent(sessionId)}/participants`);
    } catch (err) {
      const fallback = getDevClassroomParticipantsFallback(sessionId);
      if (fallback && err instanceof Error && err.message.includes('Failed to reach the API server')) {
        return fallback;
      }
      throw err;
    }
  },

  async backups() {
    return apiFetch<ApiListResponse<{
      id: string;
      filename: string;
      size: number;
      createdAt: string;
    }>>('/api/backups');
  },

  async createBackup() {
    return apiFetch<ApiItemResponse<{
      id: string;
      filename: string;
      size: number;
      createdAt: string;
    }>>('/api/backups', {
      method: 'POST',
    });
  },

  async deleteBackup(filename: string) {
    return apiFetch<ApiItemResponse<any>>(`/api/backups/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
  },

  backupDownloadUrl(filename: string) {
    const baseUrl = getApiBaseUrl();
    const token = getToken();
    return `${baseUrl}/api/backups/${encodeURIComponent(filename)}/download?token=${token || ''}`;
  },

  async markNotificationAsRead(id: string) {
    return apiFetch<ApiItemResponse<any>>(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: 'POST',
    });
  },

  async markAllNotificationsAsRead() {
    return apiFetch<ApiItemResponse<any>>('/api/notifications/read-all', {
      method: 'POST',
    });
  },

  async deleteNotification(id: string) {
    return apiFetch<ApiItemResponse<any>>(`/api/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
