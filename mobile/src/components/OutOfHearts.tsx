import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DuoButton } from './DuoButton';
import { useProgress } from '@/context/ProgressContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { HEART_REFILL_COST } from '@/types';

function formatMs(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface OutOfHeartsProps {
  onBack: () => void;
  onRefilled?: () => void;
}

/**
 * Full-screen "out of hearts" gate, Duolingo-style.
 * Shows a live countdown to the next heart and a refill action.
 */
export function OutOfHearts({ onBack, onRefilled }: OutOfHeartsProps) {
  const { msToNextHeart, diamonds, refillHeart } = useProgress();
  const canRefill = diamonds >= HEART_REFILL_COST;

  const onRefill = async () => {
    try {
      await refillHeart(1);
      onRefilled?.();
    } catch (e: any) {
      // Surface failure but keep gate open.
      console.warn('Refill failed', e?.message);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.heart}>💔</Text>
        <Text style={styles.title}>You ran out of hearts!</Text>
        <Text style={styles.body}>
          Practice makes perfect — but you're out of hearts. Wait for them to refill or get more in
          the shop.
        </Text>

        <View style={styles.timerCard}>
          <Ionicons name="time-outline" size={20} color={colors.textMuted} />
          <Text style={styles.timerLabel}>Next heart in</Text>
          <Text style={styles.timer}>{formatMs(msToNextHeart)}</Text>
        </View>

        <View style={styles.actions}>
          <DuoButton
            label={`Refill 1 heart  ·  ${HEART_REFILL_COST} 💎`}
            onPress={onRefill}
            disabled={!canRefill}
          />
          {!canRefill && (
            <Text style={styles.note}>You need {HEART_REFILL_COST} 💎 to refill a heart.</Text>
          )}
          <Pressable style={styles.secondary} onPress={onBack}>
            <Text style={styles.secondaryText}>Back to home</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 14 },
  heart: { fontSize: 96 },
  title: { ...typography.display, color: colors.text, textAlign: 'center' },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  timerCard: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  timerLabel: { ...typography.body, color: colors.textMuted },
  timer: { ...typography.h2, color: colors.red, marginLeft: 4 },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 12 },
  note: { ...typography.caption, color: colors.textDim, textAlign: 'center' },
  secondary: { paddingVertical: 14, alignItems: 'center' },
  secondaryText: { ...typography.h3, color: colors.textMuted },
});
