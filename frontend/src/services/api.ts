const hostname = window.location.hostname;
const API_BASE_URL = `http://${hostname}:8000/api`;

export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const endpoints = {
  auth: {
    login: `${API_BASE_URL}/auth/login/`,
    register: `${API_BASE_URL}/auth/register/`,
    refresh: `${API_BASE_URL}/auth/token/refresh/`,
    me: `${API_BASE_URL}/users/me/`,
  },
  venues: {
    list: `${API_BASE_URL}/venues/`,
    detail: (id: string | number) => `${API_BASE_URL}/venues/${id}/`,
    free: `${API_BASE_URL}/venues/free/`,
  },
  timetable: {
    list: `${API_BASE_URL}/timetable/`,
    upload: `${API_BASE_URL}/timetable/upload/`,
    courses: `${API_BASE_URL}/timetable/courses/`,
    // Student: personalised schedule filtered by program/year/stream
    studentSchedule: `${API_BASE_URL}/timetable/student-schedule/`,
    // Lecturer: their assigned timetable, with optional ?day= filter
    mySchedule: (day?: string) =>
      day
        ? `${API_BASE_URL}/timetable/my-schedule/?day=${day}`
        : `${API_BASE_URL}/timetable/my-schedule/`,
  },
  attendance: {
    checkin: `${API_BASE_URL}/attendance/checkin/`,
    records: `${API_BASE_URL}/attendance/records/`,
    sessions: `${API_BASE_URL}/attendance/sessions/`,
    active: `${API_BASE_URL}/attendance/active/`,
    reports: `${API_BASE_URL}/attendance/reports/`,
    session: (sessionId: string) =>
      `${API_BASE_URL}/attendance/records/?session=${sessionId}`,
  },
  sessions: {
    start: `${API_BASE_URL}/attendance/sessions/`,
    end: (sessionId: string) =>
      `${API_BASE_URL}/attendance/sessions/${sessionId}/`,
  },
  admin: {
    users: `${API_BASE_URL}/users/`,
    userDetail: (id: string | number) => `${API_BASE_URL}/users/${id}/`,
    stats: `${API_BASE_URL}/dashboard/stats/`,
  },
};

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('access_token');
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Only set application/json if body is not FormData and Content-Type is not already defined
  if (!(options?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  if (response.status === 204) return {} as T;
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
  }
  return response.json();
}