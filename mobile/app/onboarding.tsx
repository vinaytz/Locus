import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { DuoButton } from '@/components/DuoButton';
import { SubjectIcon } from '@/components/SubjectIcon';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { Exam, Subject } from '@/types';

const DIFFICULTY_META: Record<number, { label: string; sub: string; emoji: string }> = {
  1: { label: 'Casual',  sub: 'A few minutes a day',     emoji: '🌱' },
  2: { label: 'Pro',     sub: 'Steady daily progress',   emoji: '🚀' },
  3: { label: 'Expert',  sub: "I'm here to grind",       emoji: '🔥' },
};

const SUBJECT_COLOR: Record<string, string> = {
  Physics: '#FF9600',
  Chemistry: '#FFC800',
  Mathematics: '#1CB0F6',
  Biology: '#58CC02',
  Computing: '#CE82FF',
  English: '#FF4B82',
  History: '#A56A3F',
  Geography: '#2EC4B6',
};

const colorFor = (name: string) => SUBJECT_COLOR[name] ?? '#1CB0F6';

function plusDays(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { enrollments, setEnrollments } = useAuth();
  const [tab, setTab] = useState<'subject' | 'exam'>('subject');
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [examModal, setExamModal] = useState<Exam | null>(null);
  const [examDate, setExamDate] = useState(plusDays(90));
  const [subjectGroupModal, setSubjectGroupModal] = useState<{ name: string; list: Subject[] } | null>(null);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.listExams(), api.listSubjects()])
      .then(([e, s]) => { setExams(e); setSubjects(s); })
      .catch((err) => Alert.alert('Could not load courses', err?.message ?? 'Network error'))
      .finally(() => setLoading(false));
  }, []);

  const groupedSubjects = useMemo(() => {
    const map = new Map<string, Subject[]>();
    subjects.forEach((s) => {
      const arr = map.get(s.name) ?? [];
      arr.push(s);
      map.set(s.name, arr);
    });
    return Array.from(map.entries()).map(([name, list]) => ({
      name,
      list: list.sort((a, b) => a.level - b.level),
    }));
  }, [subjects]);

  const refreshEnrollments = async () => {
    try {
      const e = await api.enrollments();
      setEnrollments(e);
    } catch {}
  };

  const submitExam = async () => {
    if (!examModal) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
      Alert.alert('Invalid date', 'Use format YYYY-MM-DD');
      return;
    }
    setSubmitting(true);
    try {
      await api.enrollExam({ examId: examModal.id, examDate });
      await refreshEnrollments();
      setExamModal(null);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Enrollment failed', err?.message ?? 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  const submitSubject = async () => {
    if (!subjectGroupModal) return;
    // Map difficulty (1/2/3) → the matching Subject row by level.
    // Fall back to the highest available level if difficulty is missing.
    const target =
      subjectGroupModal.list.find((s) => s.level === difficulty) ??
      subjectGroupModal.list[subjectGroupModal.list.length - 1];
    if (!target) return;
    setSubmitting(true);
    try {
      await api.enrollSubject({ subjectId: target.id, difficulty });
      await refreshEnrollments();
      setSubjectGroupModal(null);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Enrollment failed', err?.message ?? 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🦉</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>What's your goal?</Text>
          <Text style={styles.sub}>Pick a subject to learn, or an exam to prep for.</Text>
        </View>
      </View>

      {/* Segmented tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'subject' && styles.tabActive]}
          onPress={() => setTab('subject')}
        >
          <Ionicons
            name="book"
            size={16}
            color={tab === 'subject' ? colors.blue : colors.textMuted}
          />
          <Text style={[styles.tabText, tab === 'subject' && styles.tabTextActive]}>Subjects</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'exam' && styles.tabActive]}
          onPress={() => setTab('exam')}
        >
          <Ionicons
            name="trophy"
            size={16}
            color={tab === 'exam' ? colors.blue : colors.textMuted}
          />
          <Text style={[styles.tabText, tab === 'exam' && styles.tabTextActive]}>Exams</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.green} style={{ marginTop: 40 }} />
      ) : tab === 'subject' ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {groupedSubjects.map((g) => {
            const c = colorFor(g.name);
            const sample = g.list[0];
            return (
              <Pressable
                key={g.name}
                onPress={() => {
                  setSubjectGroupModal(g);
                  // Pre-select existing enrollment difficulty for this subject
                  // group if any, otherwise default to the lowest available level.
                  const existing = enrollments?.subjects.find(
                    (e) => e.subject.name === g.name,
                  );
                  setDifficulty(existing?.difficulty ?? g.list[0]?.level ?? 1);
                }}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={[styles.subjectIconBubble, { backgroundColor: c }]}>
                  <SubjectIcon subject={sample} size={24} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{g.name}</Text>
                  {!!sample?.description && (
                    <Text style={styles.cardSub} numberOfLines={2}>{sample.description}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { setExamModal(item); setExamDate(plusDays(90)); }}
              style={({ pressed }) => [styles.examCard, pressed && styles.cardPressed]}
            >
              <View style={styles.examIcon}>
                <Text style={{ fontSize: 28 }}>🎯</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!!item.description && (
                  <Text style={styles.cardSub} numberOfLines={2}>{item.description}</Text>
                )}
                {!!item.subjects?.length && (
                  <View style={styles.chipsRow}>
                    {item.subjects.slice(0, 4).map((es) => (
                      <View key={es.subjectId} style={styles.chip}>
                        <SubjectIcon subject={es.subject} size={12} color={colors.text} />
                        <Text style={styles.chipText}>{es.subject.name}</Text>
                      </View>
                    ))}
                    {item.subjects.length > 4 && (
                      <Text style={styles.chipMore}>+{item.subjects.length - 4}</Text>
                    )}
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}

      {/* Subject difficulty picker */}
      <Modal
        visible={!!subjectGroupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setSubjectGroupModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalGrip} />
            <Text style={styles.modalTitle}>{subjectGroupModal?.name}</Text>
            <Text style={styles.modalSub}>How intense do you want it?</Text>
            <View style={styles.diffCol}>
              {[1, 2, 3].map((d) => {
                const meta = DIFFICULTY_META[d];
                const active = difficulty === d;
                const available = subjectGroupModal?.list.some((s) => s.level === d) ?? false;
                return (
                  <Pressable
                    key={d}
                    onPress={() => available && setDifficulty(d)}
                    disabled={!available}
                    style={[
                      styles.diffRow,
                      active && styles.diffRowActive,
                      !available && styles.diffRowDisabled,
                    ]}
                  >
                    <Text style={styles.diffEmoji}>{meta.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.diffTitle, active && styles.diffTitleActive]}>
                        {meta.label}
                      </Text>
                      <Text style={styles.diffSub}>
                        {available ? meta.sub : 'Coming soon'}
                      </Text>
                    </View>
                    {active && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.green} />
                    )}
                  </Pressable>
                );
              })}
            </View>
            <DuoButton
              label={submitting ? 'Enrolling…' : 'Start learning'}
              onPress={submitSubject}
              disabled={submitting}
            />
            <Pressable onPress={() => setSubjectGroupModal(null)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Exam date picker */}
      <Modal
        visible={!!examModal}
        transparent
        animationType="slide"
        onRequestClose={() => setExamModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalGrip} />
            <Text style={styles.modalTitle}>{examModal?.title}</Text>
            <Text style={styles.modalSub}>When is your exam?</Text>
            <View style={styles.input}>
              <Ionicons name="calendar" size={18} color={colors.textMuted} />
              <TextInput
                value={examDate}
                onChangeText={setExamDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textDim}
                style={styles.field}
              />
            </View>
            <DuoButton
              label={submitting ? 'Enrolling…' : 'Lock it in'}
              onPress={submitExam}
              disabled={submitting}
            />
            <Pressable onPress={() => setExamModal(null)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  heroEmoji: { fontSize: 56 },
  title: { ...typography.display, color: colors.text },
  sub: { ...typography.body, color: colors.textMuted, marginTop: 4 },

  tabs: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 16,
    backgroundColor: colors.bgElevated,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: '#0E2F3D' },
  tabText: { ...typography.h3, color: colors.textMuted },
  tabTextActive: { color: colors.blue },

  listContent: { paddingTop: 18, paddingBottom: 32, gap: 12 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: colors.divider,
    borderBottomWidth: 4,
  },
  cardPressed: { transform: [{ translateY: 1 }], borderBottomWidth: 2 },
  cardTitle: { ...typography.h3, color: colors.text },
  cardSub: { ...typography.body, color: colors.textMuted, marginTop: 2 },

  subjectIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.divider,
    borderBottomWidth: 4,
  },
  examIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  chipText: { ...typography.caption, color: colors.text },
  chipMore: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    gap: 14,
    borderTopWidth: 1,
    borderColor: colors.divider,
  },
  modalGrip: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceAlt,
    marginBottom: 6,
  },
  modalTitle: { ...typography.h1, color: colors.text },
  modalSub: { ...typography.body, color: colors.textMuted },
  modalCancel: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 8,
    fontWeight: '700',
  },

  diffCol: { gap: 10 },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.divider,
    backgroundColor: colors.bgElevated,
  },
  diffRowActive: { borderColor: colors.green, backgroundColor: '#102B14' },
  diffRowDisabled: { opacity: 0.4 },
  diffEmoji: { fontSize: 26 },
  diffTitle: { ...typography.h3, color: colors.textMuted },
  diffTitleActive: { color: colors.green },
  diffSub: { ...typography.caption, color: colors.textDim, marginTop: 2 },

  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: colors.divider,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  field: { flex: 1, color: colors.text, ...typography.body },
});
