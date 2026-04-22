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
  | 'course_dropped';

export interface ApiNotification {
  id: string;
  type: ApiNotificationType;
  title: string;
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
  status: 'draft' | 'sent';
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
  if (envBaseUrl) return envBaseUrl;

  // In dev, prefer same-origin so Vite can proxy `/api/*` to Laravel.
  if ((import.meta as any).env?.DEV) return '';

  return DEFAULT_BASE_URL;
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

export const api = {
  async login(email: string, password: string) {
    return apiFetch<ApiLoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async loginWithGoogle(credential: string) {
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

  async courses(params?: { archived?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.archived === true) qs.set('archived', '1');
    if (params?.archived === false) qs.set('archived', '0');
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<ApiListResponse<ApiCourse>>(`/api/courses${suffix}`);
  },

  async programs(params?: { archived?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.archived === true) qs.set('archived', '1');
    if (params?.archived === false) qs.set('archived', '0');
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<ApiListResponse<ApiProgram>>(`/api/programs${suffix}`);
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
    return apiFetch<ApiItemResponse<ApiCourse>>(`/api/courses/${encodeURIComponent(courseId)}`);
  },

  async updateCourse(courseId: string, payload: Partial<ApiCourseUpsert>) {
    return apiFetch<ApiItemResponse<ApiCourse>>(`/api/courses/${encodeURIComponent(courseId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async courseSessions(courseId: string) {
    return apiFetch<ApiListResponse<ApiClassSession>>(
      `/api/courses/${encodeURIComponent(courseId)}/sessions`
    );
  },

  async courseAssignments(courseId: string) {
    return apiFetch<ApiListResponse<ApiAssignment>>(
      `/api/courses/${encodeURIComponent(courseId)}/assignments`
    );
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
    return apiFetch<ApiListResponse<ApiLesson>>(
      `/api/courses/${encodeURIComponent(courseId)}/lessons`,
    );
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
    return apiFetch<ApiItemResponse<ApiLesson>>(
      `/api/courses/${encodeURIComponent(courseId)}/lessons`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },

  async updateCourseLesson(courseId: string, lessonId: string, payload: Partial<{
    title: string;
    description: string | null;
    content: string | null;
    lesson_order: number;
    duration: string | null;
    status: string;
  }>) {
    return apiFetch<ApiItemResponse<ApiLesson>>(
      `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
  },

  async deleteCourseLesson(courseId: string, lessonId: string) {
    return apiFetch<ApiMessageResponse>(
      `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
      {
        method: 'DELETE',
      },
    );
  },

  async courseMaterials(courseId: string) {
    return apiFetch<ApiListResponse<ApiMaterial>>(
      `/api/courses/${encodeURIComponent(courseId)}/materials`,
    );
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
    return apiFetch<ApiListResponse<ApiAnnouncement>>(
      `/api/courses/${encodeURIComponent(courseId)}/announcements`
    );
  },

  async courseEnrollments(courseId: string) {
    return apiFetch<ApiListResponse<ApiEnrollment>>(
      `/api/courses/${encodeURIComponent(courseId)}/enrollments`,
    );
  },

  async enrollStudent(courseId: string, studentId: string) {
    return apiFetch<ApiItemResponse<ApiEnrollment>>(
      `/api/courses/${encodeURIComponent(courseId)}/enrollments`,
      {
        method: 'POST',
        body: JSON.stringify({ student_id: Number(studentId) }),
      },
    );
  },

  async dropEnrollment(courseId: string, enrollmentId: string) {
    return apiFetch<ApiMessageResponse>(
      `/api/courses/${encodeURIComponent(courseId)}/enrollments/${encodeURIComponent(enrollmentId)}`,
      {
        method: 'DELETE',
      },
    );
  },

  async deleteCourse(courseId: string) {
    return apiFetch<ApiMessageResponse>(`/api/courses/${encodeURIComponent(courseId)}`, {
      method: 'DELETE',
    });
  },

  async createCourseAnnouncement(courseId: string, payload: { title: string; body: string }) {
    return apiFetch<ApiItemResponse<ApiAnnouncement>>(
      `/api/courses/${encodeURIComponent(courseId)}/announcements`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },

  async notifications() {
    return apiFetch<ApiListResponse<ApiNotification>>('/api/notifications');
  },

  async messages(params?: { folder?: 'inbox' | 'sent' | 'drafts' | 'deleted'; q?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.folder) qs.set('folder', params.folder);
    if (params?.q) qs.set('q', params.q);
    if (typeof params?.limit === 'number') qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<ApiListResponse<ApiMessage>>(`/api/messages${suffix}`);
  },

  async messageThread(otherUserId: string, params?: { after?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.after) qs.set('after', params.after);
    if (typeof params?.limit === 'number') qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<ApiListResponse<ApiMessage>>(
      `/api/messages/thread/${encodeURIComponent(otherUserId)}${suffix}`,
    );
  },

  async chatUsers(params?: { q?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (typeof params?.limit === 'number') qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<ApiListResponse<ApiUser>>(`/api/chat/users${suffix}`);
  },

  async messageCreate(payload: { toUserId?: string | null; subject?: string | null; body: string; status?: 'draft' | 'sent' }) {
    return apiFetch<ApiItemResponse<ApiMessage>>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async messageUpdate(id: string, payload: { toUserId?: string | null; subject?: string | null; body?: string; send?: boolean }) {
    return apiFetch<ApiItemResponse<ApiMessage>>(`/api/messages/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async messageTrash(id: string) {
    return apiFetch<ApiMessageResponse>(`/api/messages/${encodeURIComponent(id)}/trash`, {
      method: 'POST',
    });
  },

  async messageRestore(id: string) {
    return apiFetch<ApiMessageResponse>(`/api/messages/${encodeURIComponent(id)}/restore`, {
      method: 'POST',
    });
  },

  async messageRead(id: string) {
    return apiFetch<ApiItemResponse<ApiMessage>>(`/api/messages/${encodeURIComponent(id)}/read`, {
      method: 'POST',
    });
  },

  async analyticsAdmin(params?: { archived?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.archived === true) qs.set('archived', '1');
    if (params?.archived === false) qs.set('archived', '0');
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<ApiItemResponse<ApiAnalyticsAdmin>>(`/api/analytics/admin${suffix}`);
  },

  async events(params?: { start?: string; end?: string }) {
    const qs = new URLSearchParams();
    if (params?.start) qs.set('start', params.start);
    if (params?.end) qs.set('end', params.end);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<ApiListResponse<ApiEvent>>(`/api/events${suffix}`);
  },

  async createEvent(payload: {
    title: string;
    description?: string | null;
    starts_at: string;
    ends_at?: string | null;
  }) {
    return apiFetch<ApiItemResponse<ApiEvent>>('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
    return apiFetch<ApiItemResponse<ApiEvent>>(`/api/events/${encodeURIComponent(eventId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteEvent(eventId: string) {
    return apiFetch<ApiMessageResponse>(`/api/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
    });
  },

  async users(params?: {
    role?: string;
    q?: string;
    limit?: number;
    archived?: boolean;
    page?: number;
    perPage?: number;
  }) {
    const qs = new URLSearchParams();
    if (params?.role) qs.set('role', params.role);
    if (params?.q) qs.set('q', params.q);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (typeof params?.page === 'number') qs.set('page', String(params.page));
    if (typeof params?.perPage === 'number') qs.set('per_page', String(params.perPage));
    if (params?.archived === true) qs.set('archived', '1');
    if (params?.archived === false) qs.set('archived', '0');
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<ApiListResponse<ApiUser>>(`/api/users${suffix}`);
  },

  async createUser(payload: { name: string; email: string; role: 'admin' | 'teacher' | 'student' }) {
    return apiFetch<ApiUser>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async user(userId: string) {
    return apiFetch<ApiUser>(`/api/users/${encodeURIComponent(userId)}`);
  },

  async userEnrollments(userId: string) {
    return apiFetch<ApiListResponse<ApiUserEnrollment>>(
      `/api/users/${encodeURIComponent(userId)}/enrollments`,
    );
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
    return apiFetch<ApiUser>(`/api/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
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
};
