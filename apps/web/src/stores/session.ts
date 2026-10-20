import { create } from 'zustand';
import type { SessionState, StepResult, User } from '@tizao/shared';
import { api, getStoredUser, getToken, setAuth } from '../api';

interface SessionStore {
  token: string | null;
  user: User | null;
  session: SessionState | null;
  lastResult: StepResult | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  start: () => Promise<void>;
  submit: (stepId: string, input: Record<string, number | string>) => Promise<void>;
  reset: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  token: getToken(),
  user: getStoredUser(),
  session: null,
  lastResult: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const data = await api.login(username, password);
      setAuth(data.token, data.user);
      set({ token: data.token, user: data.user, loading: false, session: null, lastResult: null });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : '登录失败' });
    }
  },

  logout: () => {
    setAuth(null, null);
    set({ token: null, user: null, session: null, lastResult: null, error: null });
  },

  start: async () => {
    set({ loading: true, error: null });
    try {
      const session = await api.start();
      set({ session, loading: false, lastResult: null });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : '无法开始实验' });
    }
  },

  submit: async (stepId, input) => {
    const session = get().session;
    if (!session) return;
    set({ loading: true, error: null });
    try {
      const result = await api.submit(session.sessionId, { stepId, input });
      const updated = await api.session(session.sessionId);
      set({ session: updated, lastResult: result, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : '提交失败' });
    }
  },

  reset: async () => {
    const session = get().session;
    if (!session) return;
    set({ loading: true, error: null });
    try {
      const updated = await api.reset(session.sessionId);
      set({ session: updated, lastResult: null, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : '重置失败' });
    }
  },

  refresh: async () => {
    const session = get().session;
    if (!session) return;
    try {
      const updated = await api.session(session.sessionId);
      set({ session: updated });
    } catch {
      // 会话失效时保持当前界面，用户可重新开始
    }
  }
}));
