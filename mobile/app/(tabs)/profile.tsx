import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TopNav } from '@/components/TopNav';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { DuoButton } from '@/components/DuoButton';
import { SubjectIcon } from '@/components/SubjectIcon';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

// Stable hash → tile color so each course keeps the same color (mirrors TopNav).
const TILE_COLORS = ['#58CC02', '#1CB0F6', '#CE82FF', '#FF9600', '#FF4B82', '#2EC4B6', '#FFC800', '#FF4B4B'];
function tileColorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return TILE_COLORS[Math.abs(h) % TILE_COLORS.length];
}

const DIFFICULTY_LABEL: Record<number, string> = { 1: 'Casual', 2: 'Pro', 3: 'Expert' };
function difficultyLabel(d: number): string {
  return DIFFICULTY_LABEL[d] ?? `Difficulty ${d}`;
}

export default function ProfileScreen() {
  const { user, enrollments, signOut } = useAuth();
  const { currentStreak, totalXp, diamonds, longestStreak, hearts } = useProgress();
  const router = useRouter();

  const stats = [
    { icon: 'flame',   label: 'Day streak',     value: currentStreak,  color: colors.streak },
    { icon: 'flash',   label: 'Total XP',       value: totalXp,        color: colors.yellow },
    { icon: 'diamond', label: 'Diamonds',       value: diamonds,       color: colors.gem },
    { icon: 'trophy',  label: 'Longest streak', value: longestStreak,  color: colors.purple },
    { icon: 'heart',   label: 'Hearts',         value: hearts,         color: colors.red },
    { icon: 'school',  label: 'Courses',        value: (enrollments?.subjects.length ?? 0) + (enrollments?.exams.length ?? 0), color: colors.green },
  ] as const;

  const initial = (user?.displayName?.[0] ?? 'L').toUpperCase();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TopNav />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {user?.displayName ?? 'Learner'}
          </Text>
          <Text style={styles.email} numberOfLines={1}>{user?.email ?? ''}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="flame" size={14} color={colors.streak} />
              <Text style={styles.badgeText}>{currentStreak}-day streak</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="flash" size={14} color={colors.yellow} />
              <Text style={styles.badgeText}>{totalXp} XP</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statGrid}>
            {stats.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: s.color + '22', borderColor: s.color + '55' }]}>
                  <Ionicons name={s.icon as any} size={22} color={s.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My courses</Text>
            <Text style={styles.sectionCount}>
              {(enrollments?.subjects.length ?? 0) + (enrollments?.exams.length ?? 0)}
            </Text>
          </View>
          {enrollments?.subjects.map((e) => (
            <View key={e.subjectId} style={styles.row}>
              <View style={[styles.iconBubble, { backgroundColor: tileColorFor(e.subjectId) }]}>
                <SubjectIcon subject={e.subject} size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{e.subject.name}</Text>
                <Text style={styles.rowSub}>{difficultyLabel(e.difficulty)}</Text>
              </View>
            </View>
          ))}
          {enrollments?.exams.map((e) => (
            <View key={e.examId} style={styles.row}>
              <View style={[styles.iconBubble, { backgroundColor: tileColorFor(e.examId) }]}>
                <Ionicons name="flag" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{e.exam.title}</Text>
                <Text style={styles.rowSub}>Exam date • {String(e.examDate).slice(0, 10)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          ))}
          <DuoButton label="Add course" variant="secondary" onPress={() => router.push('/onboarding')} />
        </View>

        <View style={styles.section}>
          <DuoButton
            label="Log out"
            variant="danger"
            onPress={async () => {
              await signOut();
              router.replace('/auth');
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Hero card
  heroCard: {
    margin: 18,
    marginBottom: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: colors.divider,
    borderBottomWidth: 4,
  },
  avatarRing: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: colors.blue + '33',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 42, fontWeight: '900' },

  name: { ...typography.h1, color: colors.text, textAlign: 'center' },
  email: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.divider,
    borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  badgeText: { ...typography.caption, color: colors.text, fontWeight: '700' },

  // Sections
  section: { paddingHorizontal: 18, gap: 12, marginTop: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.h2, color: colors.text },
  sectionCount: { ...typography.body, color: colors.textMuted, fontWeight: '700' },

  // Stats grid (2 cols, icon left, value right)
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 2, borderColor: colors.divider,
    borderBottomWidth: 4,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  statIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  statValue: { ...typography.h1, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  // Course rows
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.bgElevated, borderRadius: 14, padding: 14,
    borderWidth: 2, borderColor: colors.divider,
    borderBottomWidth: 4,
  },
  iconBubble: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { ...typography.h3, color: colors.text },
  rowSub: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  levelPill: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.divider,
  },
  levelPillText: { ...typography.caption, color: colors.text, fontWeight: '800' },
});
