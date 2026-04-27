import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const ACTIVE_KEY = 'locus:active-subject';

interface CourseContextValue {
  /** Subject id currently being shown on the home/learning path. */
  activeSubjectId: string | null;
  setActiveSubjectId: (id: string) => void;
  ready: boolean;
}

const CourseContext = createContext<CourseContextValue | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const { enrollments, user } = useAuth();
  const [activeSubjectId, _setActiveSubjectId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Bootstrap once enrollments are available.
  useEffect(() => {
    if (!user) {
      _setActiveSubjectId(null);
      setReady(true);
      return;
    }
    if (!enrollments) return;

    (async () => {
      const stored = await AsyncStorage.getItem(ACTIVE_KEY);
      const enrolledIds = new Set<string>([
        ...enrollments.subjects.map((s) => s.subjectId),
        ...enrollments.exams.flatMap((e) => e.exam.subjects?.map((es) => es.subjectId) ?? []),
      ]);
      if (stored && enrolledIds.has(stored)) {
        _setActiveSubjectId(stored);
      } else {
        const fallback =
          enrollments.subjects[0]?.subjectId ??
          enrollments.exams[0]?.exam.subjects?.[0]?.subjectId ??
          null;
        _setActiveSubjectId(fallback);
        if (fallback) await AsyncStorage.setItem(ACTIVE_KEY, fallback);
      }
      setReady(true);
    })();
  }, [enrollments, user]);

  const setActiveSubjectId = (id: string) => {
    _setActiveSubjectId(id);
    AsyncStorage.setItem(ACTIVE_KEY, id).catch(() => {});
  };

  const value = useMemo<CourseContextValue>(
    () => ({ activeSubjectId, setActiveSubjectId, ready }),
    [activeSubjectId, ready],
  );

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error('useCourse must be used inside CourseProvider');
  return ctx;
}
