import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from '@/api/client';
import type { AuthUser, EnrollmentsResponse } from '@/types';

interface AuthState {
  user: AuthUser | null;
  enrollments: EnrollmentsResponse | null;
  loading: boolean;
  // True once we've finished bootstrapping (token check + /me).
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  register: (input: { email: string; password: string; displayName: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setEnrollments: (e: EnrollmentsResponse) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_CACHE_KEY = 'locus:user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    enrollments: null,
    loading: false,
    ready: false,
  });

  const loadEnrollments = useCallback(async () => {
    try {
      const e = await api.enrollments();
      setState((s) => ({ ...s, enrollments: e }));
    } catch (err) {
      // ignore, will retry later
    }
  }, []);

  const hydrateFromToken = useCallback(async () => {
    try {
      const me = await api.me();
      const user: AuthUser = {
        id: me.id,
        email: me.email,
        displayName: me.displayName,
        timezone: me.timezone,
        stats: (me as any).stats,
      };
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      setState((s) => ({ ...s, user }));
      await loadEnrollments();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await api.clearToken();
        await AsyncStorage.removeItem(USER_CACHE_KEY);
      }
      setState((s) => ({ ...s, user: null }));
    }
  }, [loadEnrollments]);

  useEffect(() => {
    (async () => {
      const token = await api.getToken();
      const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
      if (cached) {
        try { setState((s) => ({ ...s, user: JSON.parse(cached) })); } catch {}
      }
      if (token) await hydrateFromToken();
      setState((s) => ({ ...s, ready: true }));
    })();
  }, [hydrateFromToken]);

  const register: AuthContextValue['register'] = async (input) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const res = await api.register({ ...input, timezone: tz });
      await api.setToken(res.accessToken);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
      setState((s) => ({ ...s, user: res.user, loading: false }));
      await loadEnrollments();
    } catch (err) {
      setState((s) => ({ ...s, loading: false }));
      throw err;
    }
  };

  const login: AuthContextValue['login'] = async (input) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await api.login(input);
      await api.setToken(res.accessToken);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
      setState((s) => ({ ...s, user: res.user, loading: false }));
      await loadEnrollments();
    } catch (err) {
      setState((s) => ({ ...s, loading: false }));
      throw err;
    }
  };

  const signOut = async () => {
    await api.clearToken();
    await AsyncStorage.removeItem(USER_CACHE_KEY);
    setState({ user: null, enrollments: null, loading: false, ready: true });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      register,
      login,
      signOut,
      refresh: hydrateFromToken,
      setEnrollments: (e) => setState((s) => ({ ...s, enrollments: e })),
    }),
    [state, hydrateFromToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
