import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProgress } from '@/context/ProgressContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export default function StreakScreen() {
  const router = useRouter();
  const { currentStreak, longestStreak } = useProgress();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}><Ionicons name="close" size={28} color={colors.text} /></Pressable>
        <Text style={styles.title}>Streak</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <View style={styles.heroRow}>
          <View>
            <View style={styles.society}><Text style={styles.societyText}>STREAK</Text></View>
            <Text style={styles.streak}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>day{currentStreak === 1 ? '' : 's'} in a row</Text>
          </View>
          <Text style={styles.fire}>🔥</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="trophy" size={28} color={colors.purple} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Longest streak</Text>
            <Text style={styles.cardSub}>{longestStreak} day{longestStreak === 1 ? '' : 's'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Ionicons name="information-circle" size={28} color={colors.blue} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>How streaks work</Text>
            <Text style={styles.cardSub}>
              Complete one exercise per day to keep your streak going. Every 7 days you earn a diamond bonus.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { ...typography.h2, color: colors.text },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  society: { backgroundColor: colors.yellow, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  societyText: { color: '#7B5400', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  streak: { color: colors.streak, fontSize: 80, fontWeight: '900', lineHeight: 90 },
  streakLabel: { color: colors.streak, ...typography.h2 },
  fire: { fontSize: 110 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderWidth: 2, borderColor: colors.divider,
    borderRadius: 14, backgroundColor: colors.bgElevated,
  },
  cardTitle: { ...typography.h3, color: colors.text },
  cardSub: { ...typography.body, color: colors.textMuted, marginTop: 2 },
});
