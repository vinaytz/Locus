import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { Unit } from '@/types';

interface Props {
  unit: Unit;
  index: number;
  onGuide?: () => void;
}

// The orange "UNIT N — Title" sticky banner.
export function UnitHeader({ unit, index, onGuide }: Props) {
  const palette = colors.unitPalette[index % colors.unitPalette.length];
  return (
    <View style={[styles.shadow, { backgroundColor: palette.shadow }]}>
      <View style={[styles.face, { backgroundColor: palette.bg }]}>
        <View style={styles.left}>
          <Text style={styles.section}>UNIT {unit.orderIndex + 1}</Text>
          <Text style={styles.title}>{unit.title}</Text>
          {!!unit.description && <Text style={styles.desc} numberOfLines={2}>{unit.description}</Text>}
        </View>
        <Pressable style={styles.guide} onPress={onGuide} hitSlop={8}>
          <Ionicons name="reader" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: 16, paddingBottom: 4, marginHorizontal: 16, marginTop: 12 },
  face: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 8,
  },
  left: { flex: 1 },
  section: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  title: { ...typography.h2, color: '#fff' },
  desc: { ...typography.body, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  guide: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.25)',
  },
});
