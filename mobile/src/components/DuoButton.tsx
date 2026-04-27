import { Pressable, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { colors } from '@/theme/colors';
import { radius, typography } from '@/theme/typography';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

// Duolingo-style chunky 3D button (top face + dark bottom shadow face).
export function DuoButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  fullWidth = true,
}: Props) {
  const palette = paletteFor(variant, disabled);
  return (
    <View style={[styles.shadow, { backgroundColor: palette.shadow }, fullWidth && styles.full, style]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={({ pressed }) => [
          styles.face,
          { backgroundColor: palette.bg, transform: [{ translateY: pressed ? 2 : 0 }] },
        ]}
      >
        <Text style={[typography.button, { color: palette.text }]}>{label.toUpperCase()}</Text>
      </Pressable>
    </View>
  );
}

function paletteFor(variant: NonNullable<Props['variant']>, disabled?: boolean) {
  if (disabled) return { bg: colors.surfaceAlt, shadow: colors.surface, text: colors.textDim };
  switch (variant) {
    case 'secondary':
      return { bg: colors.bgElevated, shadow: colors.surface, text: colors.blue };
    case 'ghost':
      return { bg: 'transparent', shadow: 'transparent', text: colors.textMuted };
    case 'danger':
      return { bg: colors.red, shadow: colors.redDark, text: '#fff' };
    case 'primary':
    default:
      return { bg: colors.green, shadow: colors.greenShadow, text: '#fff' };
  }
}

const styles = StyleSheet.create({
  shadow: { borderRadius: radius.lg, paddingBottom: 4 },
  full: { alignSelf: 'stretch' },
  face: {
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
