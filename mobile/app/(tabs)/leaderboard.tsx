import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TopNav } from '@/components/TopNav';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { LeaderboardResponse } from '@/types';

const TIER_NAMES = [
  'Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby', 'Emerald', 'Amethyst', 'Pearl', 'Obsidian', 'Diamond',
];

function fmtTime(secs: number | null): string {
  if (secs == null) return '—';
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((secs % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function avatarColor(id: string): string {
  const palette = [colors.blue, colors.green, colors.purple, colors.orange, colors.red, colors.yellow];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.leaderboard();
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load leaderboard');
    }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const tier = data?.group.leagueTier ?? 1;
  const tierName = TIER_NAMES[Math.min(TIER_NAMES.length - 1, Math.max(0, tier - 1))];
  const isWaiting = data?.group.state === 'WAITING';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TopNav />

      <View style={styles.header}>
        <Text style={styles.league}>{tierName} League</Text>
        <View style={styles.row}>
          <Ionicons name="time" color={colors.textMuted} size={16} />
          <Text style={styles.sub}>
            {isWaiting
              ? `Waiting for opponents (${data?.group.filledCount}/${data?.group.capacity})`
              : `Ends in ${fmtTime(data?.group.secondsRemaining ?? null)}`}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.green} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={data?.ranking ?? []}
          keyExtractor={(d) => d.userId}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
          renderItem={({ item }) => {
            const isMe = item.userId === user?.id;
            return (
              <View style={[styles.entry, isMe && styles.entryMe]}>
                <Text style={[styles.rank, item.rank <= 3 && { color: rankColor(item.rank) }]}>
                  {item.rank}
                </Text>
                <View style={[styles.avatar, { backgroundColor: avatarColor(item.userId) }]}>
                  <Text style={styles.avatarText}>{(item.displayName[0] || '?').toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.displayName}{isMe ? ' (you)' : ''}</Text>
                </View>
                <Text style={styles.xp}>{item.seasonXp} XP</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.error}>
              {isWaiting ? 'Earn some XP — your league will start once 12 learners join.' : 'No participants yet.'}
            </Text>
          }
          ListHeaderComponent={
            !isWaiting ? (
              <View style={styles.zone}>
                <Ionicons name="arrow-up" color={colors.green} size={16} />
                <Text style={styles.zoneText}>PROMOTION ZONE — TOP 5</Text>
                <Ionicons name="arrow-up" color={colors.green} size={16} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function rankColor(r: number) {
  if (r === 1) return colors.yellow;
  if (r === 2) return '#C0C0C0';
  return '#CD7F32';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  league: { ...typography.display, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sub: { ...typography.caption, color: colors.textMuted },
  error: { color: colors.textMuted, padding: 24, textAlign: 'center' },
  entry: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12,
  },
  entryMe: { backgroundColor: colors.bgElevated },
  rank: { ...typography.h3, color: colors.textMuted, width: 26 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  name: { ...typography.h3, color: colors.text },
  xp: { ...typography.h3, color: colors.textMuted },
  zone: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  zoneText: { color: colors.green, fontWeight: '900', letterSpacing: 1, fontSize: 13 },
});
