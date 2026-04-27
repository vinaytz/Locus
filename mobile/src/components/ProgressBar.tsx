import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  progress: number; // 0..1
  height?: number;
  color?: string;
}

export function ProgressBar({ progress, height = 14, color = colors.green }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.surfaceAlt, overflow: 'hidden', flex: 1 },
  fill: { height: '100%' },
});
