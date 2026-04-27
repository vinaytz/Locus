import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCourse } from '@/context/CourseContext';
import { useProgress } from '@/context/ProgressContext';
import { SubjectIcon } from '@/components/SubjectIcon';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { ExamEnrollment, Subject, SubjectEnrollment } from '@/types';

const LEAGUE_NAMES = [
  'Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby',
  'Emerald', 'Amethyst', 'Pearl', 'Obsidian', 'Diamond',
];

// Stable hash → tile color mapping so each subject keeps the same color.
const TILE_COLORS = [
  '#58CC02', // green
  '#1CB0F6', // blue
  '#CE82FF', // purple
  '#FF9600', // orange
  '#FF4B82', // pink
  '#2EC4B6', // teal
  '#FFC800', // yellow
  '#FF4B4B', // red
];

function tileColorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return TILE_COLORS[Math.abs(h) % TILE_COLORS.length];
}

interface TopNavProps {
  onAddCourse?: () => void;
}

export function TopNav({ onAddCourse }: TopNavProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { enrollments } = useAuth();
  const { activeSubjectId, setActiveSubjectId } = useCourse();
  const { currentStreak, diamonds, hearts, currentLeagueIndex } = useProgress();

  const [laneOpen, setLaneOpen] = useState(false);
  const [examPickerFor, setExamPickerFor] = useState<ExamEnrollment | null>(null);

  const standaloneSubjects: SubjectEnrollment[] = enrollments?.subjects ?? [];
  const exams: ExamEnrollment[] = enrollments?.exams ?? [];

  // The subject powering the top-left "level" indicator.
  const activeSubject: Subject | undefined = useMemo(() => {
    if (!activeSubjectId) return undefined;
    const s = standaloneSubjects.find((e) => e.subjectId === activeSubjectId)?.subject;
    if (s) return s;
    for (const ex of exams) {
      const found = ex.exam.subjects?.find((es) => es.subjectId === activeSubjectId)?.subject;
      if (found) return found;
    }
    return undefined;
  }, [activeSubjectId, standaloneSubjects, exams]);

  const leagueName = LEAGUE_NAMES[currentLeagueIndex] ?? 'Diamond';

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Single metrics bar — taps on the subject icon open the course picker. */}
      <View style={styles.metrics}>
        <Pressable
          style={styles.metric}
          onPress={() => setLaneOpen((o) => !o)}
          hitSlop={8}
        >
          <View
            style={[
              styles.subjectChip,
              { backgroundColor: activeSubject ? tileColorFor(activeSubject.id) : colors.surfaceAlt },
            ]}
          >
            <SubjectIcon subject={activeSubject} size={22} color="#fff" />
          </View>
        </Pressable>

        <Pressable style={styles.metric} onPress={() => router.push('/streak')} hitSlop={8}>
          <Ionicons name="flame" size={26} color={colors.streak} />
          <Text style={[styles.metricVal, { color: colors.streak }]}>{currentStreak}</Text>
        </Pressable>

        <Pressable style={styles.metric} onPress={() => router.push('/shop')} hitSlop={8}>
          <Ionicons name="diamond" size={24} color={colors.gem} />
          <Text style={[styles.metricVal, { color: colors.gem }]}>{diamonds}</Text>
        </Pressable>

        <Pressable style={styles.metric} onPress={() => router.push('/shop')} hitSlop={8}>
          <Ionicons name="heart" size={24} color={colors.red} />
          <Text style={[styles.metricVal, { color: colors.red }]}>{hearts}</Text>
        </Pressable>

        <View style={styles.maxBadge}>
          <Text style={styles.maxBadgeText}>{leagueName.toUpperCase()}</Text>
        </View>
      </View>

      {/* Subject lane — only visible when user taps the subject chip. */}
      {laneOpen && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lane}
        >
          {standaloneSubjects.map(({ subject }) => {
            const active = subject.id === activeSubjectId;
            return (
              <Pressable
                key={subject.id}
                onPress={() => {
                  setActiveSubjectId(subject.id);
                  setLaneOpen(false);
                }}
                style={styles.laneItem}
              >
                <View
                  style={[
                    styles.laneTile,
                    { backgroundColor: tileColorFor(subject.id) },
                    active && styles.laneTileActive,
                  ]}
                >
                  <SubjectIcon subject={subject} size={28} color="#fff" />
                </View>
                <Text
                  style={[styles.laneLabel, active && styles.laneLabelActive]}
                  numberOfLines={1}
                >
                  {subject.name}
                </Text>
              </Pressable>
            );
          })}
          {exams.map((ex) => {
            const containsActive = ex.exam.subjects?.some(
              (es) => es.subjectId === activeSubjectId,
            );
            return (
              <Pressable
                key={ex.examId}
                onPress={() => setExamPickerFor(ex)}
                style={styles.laneItem}
              >
                <View
                  style={[
                    styles.laneTile,
                    { backgroundColor: tileColorFor(ex.examId) },
                    containsActive && styles.laneTileActive,
                  ]}
                >
                  <Text style={styles.laneTileIcon}>🎯</Text>
                </View>
                <Text
                  style={[styles.laneLabel, containsActive && styles.laneLabelActive]}
                  numberOfLines={1}
                >
                  {ex.exam.title}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              setLaneOpen(false);
              (onAddCourse ?? (() => router.push('/onboarding')))();
            }}
            style={styles.laneItem}
          >
            <View style={[styles.laneTile, styles.laneTileAdd]}>
              <Ionicons name="add" size={26} color={colors.textMuted} />
            </View>
            <Text style={styles.laneLabel} numberOfLines={1}>Add</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Exam → subject picker popup, opened from a lane exam tile. */}
      <Modal
        visible={!!examPickerFor}
        transparent
        animationType="fade"
        onRequestClose={() => setExamPickerFor(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setExamPickerFor(null)}>
          <Pressable style={styles.examSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.examHeader}>
              <Text style={styles.examTitle}>{examPickerFor?.exam.title}</Text>
              <Text style={styles.examSub}>Pick a subject to study</Text>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {(examPickerFor?.exam.subjects ?? []).map(({ subject }) => {
                const active = subject.id === activeSubjectId;
                return (
                  <Pressable
                    key={subject.id}
                    style={[styles.examRow, active && styles.examRowActive]}
                    onPress={() => {
                      setActiveSubjectId(subject.id);
                      setExamPickerFor(null);
                      setLaneOpen(false);
                    }}
                  >
                    <View
                      style={[styles.examRowIcon, { backgroundColor: tileColorFor(subject.id) }]}
                    >
                      <SubjectIcon subject={subject} size={20} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.examRowTitle}>
                        {subject.name}
                      </Text>
                      {subject.level ? (
                        <Text style={styles.examRowSub}>Level {subject.level}</Text>
                      ) : null}
                    </View>
                    {active && <Ionicons name="checkmark" size={20} color={colors.green} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 8,
  },
  // Metrics bar
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricVal: { ...typography.h2 },
  subjectChip: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectChipIcon: { fontSize: 22 },
  maxBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  maxBadgeText: { ...typography.caption, color: colors.yellow, fontWeight: '800' },

  // Subject lane (toggled by tapping the subject chip)
  lane: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 12,
  },
  laneItem: { alignItems: 'center', width: 72, gap: 4 },
  laneTile: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  laneTileActive: {
    borderWidth: 2,
    borderColor: '#fff',
    borderBottomWidth: 4,
  },
  laneTileAdd: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.surfaceAlt,
  },
  laneTileIcon: { fontSize: 28 },
  laneLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  laneLabelActive: { color: colors.text, fontWeight: '800' },

  // Course picker modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  examSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  examHeader: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  examTitle: { ...typography.h2, color: colors.text },
  examSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  examRowActive: { backgroundColor: colors.surface },
  examRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examRowTitle: { ...typography.body, color: colors.text, fontWeight: '700' },
  examRowSub: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  sectionLabel: {
    ...typography.caption,
    color: colors.textDim,
    fontWeight: '800',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
    letterSpacing: 1,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  addRowIcon: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.surfaceAlt,
    borderStyle: 'dashed',
  },
});
