import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AuthResponse,
  CompleteExerciseResponse,
  EnrollmentsResponse,
  Exam,
  Exercise,
  LeaderboardResponse,
  ProgressResponse,
  RefillHeartsResponse,
  Subject,
  Unit,
  UserStats,
  AuthUser,
} from '@/types';

const TOKEN_KEY = 'locus:token';

const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '') || 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let inMemoryToken: string | null = null;

async function loadToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  inMemoryToken = (await AsyncStorage.getItem(TOKEN_KEY)) || null;
  return inMemoryToken;
}

async function setToken(token: string | null) {
  inMemoryToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = await loadToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch (err: any) {
    throw new ApiError(0, `Network error: ${err?.message ?? 'unreachable'}`);
  }

  const text = await res.text();
  let data: any = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) || res.statusText || `HTTP ${res.status}`;
    throw new ApiError(res.status, Array.isArray(msg) ? msg.join(', ') : String(msg), data);
  }
  return data as T;
}

export const api = {
  baseUrl: BASE_URL,

  getToken: loadToken,
  setToken,
  clearToken: () => setToken(null),

  // ---- auth --------------------------------------------------------------
  register(input: { email: string; password: string; displayName: string; timezone?: string }) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }, false);
  },
  login(input: { email: string; password: string }) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }, false);
  },

  // ---- me ----------------------------------------------------------------
  me() {
    return request<AuthUser & { examEnrollments: any[]; subjectEnrollments: any[] }>('/me');
  },
  enrollments() {
    return request<EnrollmentsResponse>('/me/enrollments');
  },
  enrollExam(input: { examId: string; examDate: string }) {
    return request('/me/enrollments/exam', { method: 'POST', body: JSON.stringify(input) });
  },
  enrollSubject(input: { subjectId: string; difficulty: number }) {
    return request('/me/enrollments/subject', { method: 'POST', body: JSON.stringify(input) });
  },

  // ---- courses -----------------------------------------------------------
  listExams() { return request<Exam[]>('/courses/exams'); },
  listSubjects(level?: number) {
    const q = level ? `?level=${level}` : '';
    return request<Subject[]>(`/courses/subjects${q}`);
  },
  getSubject(id: string) {
    return request<Subject & { units: (Unit & { exercises: Exercise[] })[] }>(`/courses/subjects/${id}`);
  },
  getUnit(id: string) {
    return request<Unit & { exercises: Exercise[]; subject: Subject }>(`/courses/units/${id}`);
  },
  getExercise(id: string) {
    return request<Exercise & { questions: any[]; unit: Unit & { subject: Subject } }>(`/courses/exercises/${id}`);
  },

  // ---- gamification ------------------------------------------------------
  completeExercise(input: { exerciseId: string; results: boolean[] }) {
    return request<CompleteExerciseResponse>('/exercise/complete', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  stats() { return request<UserStats>('/stats'); },
  progress() { return request<ProgressResponse>('/me/progress'); },
  refillHeart(count = 1) {
    return request<RefillHeartsResponse>('/me/hearts/refill', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
  },

  // ---- leaderboard -------------------------------------------------------
  leaderboard() { return request<LeaderboardResponse>('/leaderboard'); },
  joinLeaderboard() { return request('/leaderboard/join', { method: 'POST' }); },
};
