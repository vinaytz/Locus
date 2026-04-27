import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api } from '@/api/client';
import type { CompleteExerciseResponse, RefillHeartsResponse, UserStats } from '@/types';
import { HEART_REGEN_INTERVAL_MS, MAX_HEARTS } from '@/types';
import { useAuth } from './AuthContext';

interface ProgressState {
  totalXp: number;
  diamonds: number;
  currentStreak: number;
  longestStreak: number;
  currentLeagueIndex: number;
  /** Authoritative hearts value mirrored from backend `UserStats`. */
  hearts: number;
  /** ISO time of next heart regen, or null if at MAX. */
  nextHeartAt: string | null;
  ready: boolean;
}

interface ProgressContextValue extends ProgressState {
  refresh: () => Promise<void>;
  completeExercise: (
    exerciseId: string,
    results: boolean[],
  ) => Promise<CompleteExerciseResponse>;
  /** Optimistically decrement hearts client-side for immediate feedback during an exercise. */
  loseHeart: () => void;
  /** Spend diamonds to buy hearts. Resolves with server-confirmed totals. */
  refillHeart: (count?: number) => Promise<RefillHeartsResponse>;
  maxHearts: number;
  /** ms until next heart, or 0 if hearts are full. Updates every second. */
  msToNextHeart: number;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

const DEFAULT: ProgressState = {
  totalXp: 0,
  diamonds: 0,
  currentStreak: 0,
  longestStreak: 0,
  currentLeagueIndex: 1,
  hearts: MAX_HEARTS,
  nextHeartAt: null,
  ready: false,
};

function fromStats(s: UserStats): Partial<ProgressState> {
  return {
    totalXp: s.totalXp,
    diamonds: s.diamonds,
    hearts: s.hearts,
    nextHeartAt: s.nextHeartAt ?? null,
    currentStreak: s.currentStreak,
    longestStreak: s.longestStreak,
    currentLeagueIndex: s.currentLeagueIndex,
  };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<ProgressState>(DEFAULT);
  const [now, setNow] = useState(() => Date.now());
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setState({ ...DEFAULT, ready: true });
      return;
    }
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const stats = await api.stats();
      setState((s) => ({ ...s, ...fromStats(stats), ready: true }));
    } catch {
      setState((s) => ({ ...s, ready: true }));
    } finally {
      refreshingRef.current = false;
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Re-sync when app returns to foreground so background regen lands instantly.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') refresh(); });
    return () => sub.remove();
  }, [refresh]);

  // Local 1-Hz tick for the countdown UI; also auto-grants a heart locally
  // when the timer crosses zero so the UI is snappy without re-fetching.
  useEffect(() => {
    if (state.hearts >= MAX_HEARTS || !state.nextHeartAt) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const due = new Date(state.nextHeartAt!).getTime();
      if (t >= due) {
        // Optimistically grant +1 and roll the timer forward; backend will
        // confirm on next refresh.
        setState((s) => {
          if (s.hearts >= MAX_HEARTS) return s;
          const newHearts = s.hearts + 1;
          if (newHearts >= MAX_HEARTS) return { ...s, hearts: MAX_HEARTS, nextHeartAt: null };
          return {
            ...s,
            hearts: newHearts,
            nextHeartAt: new Date(due + HEART_REGEN_INTERVAL_MS).toISOString(),
          };
        });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state.hearts, state.nextHeartAt]);

  const completeExercise: ProgressContextValue['completeExercise'] = async (
    exerciseId,
    results,
  ) => {
    const res = await api.completeExercise({ exerciseId, results });
    setState((s) => ({
      ...s,
      totalXp: res.totals.totalXp,
      diamonds: res.totals.diamonds,
      hearts: res.totals.hearts,
      nextHeartAt: res.totals.nextHeartAt,
      currentStreak: res.totals.currentStreak,
    }));
    return res;
  };

  const loseHeart = () =>
    setState((s) => {
      const newHearts = Math.max(0, s.hearts - 1);
      // If we just dropped from MAX, start the visible regen timer locally;
      // backend will reconcile on next refresh.
      const nextHeartAt =
        newHearts >= MAX_HEARTS
          ? null
          : s.nextHeartAt ?? new Date(Date.now() + HEART_REGEN_INTERVAL_MS).toISOString();
      return { ...s, hearts: newHearts, nextHeartAt };
    });

  const refillHeart: ProgressContextValue['refillHeart'] = async (count = 1) => {
    const res = await api.refillHeart(count);
    setState((s) => ({
      ...s,
      hearts: res.hearts,
      diamonds: res.diamonds,
      nextHeartAt: res.nextHeartAt,
    }));
    return res;
  };

  const msToNextHeart = useMemo(() => {
    if (state.hearts >= MAX_HEARTS || !state.nextHeartAt) return 0;
    return Math.max(0, new Date(state.nextHeartAt).getTime() - now);
  }, [state.hearts, state.nextHeartAt, now]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      ...state,
      refresh,
      completeExercise,
      loseHeart,
      refillHeart,
      maxHearts: MAX_HEARTS,
      msToNextHeart,
    }),
    [state, refresh, msToNextHeart],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
