import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProgress } from '@/context/ProgressContext';
import { DuoButton } from '@/components/DuoButton';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { HEART_REFILL_COST, MAX_HEARTS } from '@/types';

export default function ShopScreen() {
  const router = useRouter();
  const { diamonds, hearts, refillHeart } = useProgress();
  const [busy, setBusy] = useState(false);

  const full = hearts >= MAX_HEARTS;
  const canAfford = diamonds >= HEART_REFILL_COST;

  const onRefill = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await refillHeart(1);
    } catch (e: any) {
      Alert.alert('Refill failed', e?.message ?? 'Try again');
    } finally {
      setBusy(false);
    }
  };

  const refillLabel = full
    ? 'Full'
    : !canAfford
      ? `Need ${HEART_REFILL_COST} 💎`
      : busy
        ? 'Refilling…'
        : `Refill (${HEART_REFILL_COST} 💎)`;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}><Ionicons name="close" size={28} color={colors.text} /></Pressable>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.gemRow}>
          <Ionicons name="diamond" size={18} color={colors.gem} />
          <Text style={[styles.title, { color: colors.gem }]}>{diamonds}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={styles.section}>Power-Ups</Text>
        <View style={styles.card}>
          <Text style={{ fontSize: 56 }}>❤️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Refill Heart</Text>
            <Text style={styles.cardText}>You have {hearts}/{MAX_HEARTS} hearts.</Text>
            <Text style={styles.cardText}>Costs {HEART_REFILL_COST} diamonds per heart.</Text>
          </View>
          <DuoButton
            label={refillLabel}
            fullWidth={false}
            onPress={onRefill}
            disabled={full || !canAfford || busy}
          />
        </View>

        <Text style={styles.note}>
          Diamonds are earned by completing exercises with full marks, hitting 7-day streak milestones, and finishing units.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: colors.divider },
  title: { ...typography.h2, color: colors.text },
  gemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  section: { ...typography.h2, color: colors.text },
  note: { ...typography.body, color: colors.textMuted, padding: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 2, borderColor: colors.divider, borderRadius: 14,
    padding: 14, backgroundColor: colors.bgElevated,
  },
  cardTitle: { ...typography.h3, color: colors.text },
  cardText: { ...typography.body, color: colors.textMuted },
});
