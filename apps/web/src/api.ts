import type {
  AiReviewResponse,
  LoginResponse,
  SessionState,
  StepResult,
  StepSubmit,
  User
} from '@tizao/shared';

const TOKEN_KEY = 'tizao.token';
const USER_KEY = 'tizao.user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setAuth(token: string | null, user: User | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);

  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined)
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (data as { message?: string }).message ?? `请求失败（${response.status}）`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  me: () => request<{ user: User }>('/auth/me'),

  start: () => request<SessionState>('/experiment/start', { method: 'POST' }),

  session: (id: number) => request<SessionState>(`/experiment/${id}`),

  submit: (sessionId: number, payload: StepSubmit) =>
    request<StepResult>(`/experiment/${sessionId}/step/${payload.stepId}`, {
      method: 'POST',
      body: JSON.stringify({ input: payload.input })
    }),

  reset: (id: number) => request<SessionState>(`/experiment/${id}/reset`, { method: 'POST' }),

  review: (input: Record<string, number | string>, sessionId?: number) =>
    request<AiReviewResponse>('/ai/review', {
      method: 'POST',
      body: JSON.stringify({ input, sessionId })
    }),

  report: (sessionId: number) =>
    request<{ reportId: number; contentMd: string }>('/ai/report', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    })
};
