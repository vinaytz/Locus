import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopNav } from '@/components/TopNav';
import { UnitHeader } from '@/components/UnitHeader';
import { LessonNode, NodeStatus } from '@/components/LessonNode';
import { DuoButton } from '@/components/DuoButton';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useCourse } from '@/context/CourseContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { Subject, Unit, Exercise } from '@/types';

function sinOffset(index: number, amplitude = 90, period = 6) {
  return Math.sin((index / period) * Math.PI * 2) * amplitude;
}

type SubjectDetail = Subject & { units: (Unit & { exercises: Exercise[] })[] };

export default function HomeScreen() {
  const router = useRouter();
  const { enrollments, refresh } = useAuth();
  const { activeSubjectId } = useCourse();
  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [completed, setCompleted] = useState<Record<string, true>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [s, prog] = await Promise.all([api.getSubject(id), api.progress()]);
      setSubject(s);
      const map: Record<string, true> = {};
      prog.completedExerciseIds.forEach((eid) => { map[eid] = true; });
      setCompleted(map);
    } finally { setLoading(false); }
  }, []);

  // Re-fetch subject + progress whenever home regains focus or active subject changes.
  useFocusEffect(useCallback(() => {
    if (activeSubjectId) loadAll(activeSubjectId);
  }, [activeSubjectId, loadAll]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), activeSubjectId ? loadAll(activeSubjectId) : Promise.resolve()]);
    setRefreshing(false);
  };

  if (!enrollments || (!enrollments.subjects.length && !enrollments.exams.length)) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <TopNav />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No course yet</Text>
          <Text style={styles.emptySub}>Pick a subject or exam to get started.</Text>
          <DuoButton label="Browse courses" onPress={() => router.push('/onboarding')} />
        </View>
      </SafeAreaView>
    );
  }

  // Determine the first uncompleted exercise across all units of this subject.
  const flat = subject?.units.flatMap((u) => u.exercises) ?? [];
  const firstActiveId = flat.find((e) => !completed[e.id])?.id;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TopNav />

      {loading && !subject ? (
        <ActivityIndicator color={colors.green} style={{ marginTop: 40 }} />
      ) : !subject ? null : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
        >
          {subject.units.map((unit, unitIdx) => (
            <View key={unit.id}>
              <UnitHeader unit={unit} index={unitIdx} />
              <View style={styles.path}>
                {unit.exercises.map((ex, i) => {
                  const status: NodeStatus = completed[ex.id]
                    ? 'complete'
                    : ex.id === firstActiveId
                      ? 'active'
                      : 'locked';
                  return (
                    <LessonNode
                      key={ex.id}
                      exercise={ex}
                      status={status}
                      offsetX={sinOffset(i)}
                      onPress={() =>
                        router.push({
                          pathname: '/exercise/[id]',
                          params: { id: ex.id },
                        })
                      }
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  path: { paddingTop: 20, paddingBottom: 12, alignItems: 'center' },
  empty: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { ...typography.h1, color: colors.text },
  emptySub: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
