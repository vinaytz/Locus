import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import type { Exercise } from '@/types';

export type NodeStatus = 'locked' | 'active' | 'complete';

interface Props {
  exercise: Exercise;
  status: NodeStatus;
  offsetX: number;
  onPress?: () => void;
}

// One round 3D node along the sinusoidal path.
export function LessonNode({ exercise, status, offsetX, onPress }: Props) {
  const palette = palettes[status];

  return (
    <View style={[styles.row, { transform: [{ translateX: offsetX }] }]}>
      <Pressable
        onPress={status === 'locked' ? undefined : onPress}
        style={[styles.shadow, { backgroundColor: palette.shadow }]}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.face,
              { backgroundColor: palette.bg, transform: [{ translateY: pressed ? 3 : 0 }] },
            ]}
          >
            {status === 'locked' ? (
              <Ionicons name="lock-closed" size={28} color={colors.textDim} />
            ) : status === 'complete' ? (
              <Ionicons name="checkmark" size={32} color="#fff" />
            ) : (
              <Ionicons name="star" size={32} color="#fff" />
            )}
          </View>
        )}
      </Pressable>

      {status === 'active' && (
        <View style={styles.startBadge}>
          <Text style={styles.startText}>START</Text>
        </View>
      )}
    </View>
  );
}

const palettes: Record<NodeStatus, { bg: string; shadow: string }> = {
  locked: { bg: colors.lessonLocked, shadow: colors.lessonLockedShadow },
  active: { bg: colors.lessonActive, shadow: colors.lessonActiveShadow },
  complete: { bg: colors.lessonComplete, shadow: colors.lessonCompleteShadow },
};

const NODE = 76;
const styles = StyleSheet.create({
  row: { alignItems: 'center', justifyContent: 'center', marginVertical: 14 },
  shadow: { borderRadius: NODE, paddingBottom: 6 },
  face: {
    width: NODE,
    height: NODE,
    borderRadius: NODE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBadge: {
    position: 'absolute',
    top: -34,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startText: { color: colors.green, fontWeight: '900', letterSpacing: 1, fontSize: 12 },
});
