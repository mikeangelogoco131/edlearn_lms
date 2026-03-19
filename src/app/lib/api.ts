export type ApiUserRole = 'admin' | 'teacher' | 'student';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole;
  archivedAt?: string | null;
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
  dueDate: string | null;
  points: number;
  submitted?: number | null;
  total?: number | null;
  status: 'pending' | 'graded' | 'overdue' | string;
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

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}

const DEFAULT_BASE_URL = 'http://127.0.0.1:8010';

function getBaseUrl() {
  return (import.meta as any).env?.VITE_API_BASE_URL || DEFAULT_BASE_URL;
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
  const baseUrl = getBaseUrl();
  const token = getToken();

  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
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

  async users(params?: { role?: string; limit?: number; archived?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.role) qs.set('role', params.role);
    if (params?.limit) qs.set('limit', String(params.limit));
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
