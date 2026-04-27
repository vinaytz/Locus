import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { ReorderQuestion } from '@/types';
import type { QuestionRendererProps } from './types';

/**
 * "Put these in order" — backend supplies `items` already in correct order.
 * We shuffle for display and let the user tap-to-pick into the answer area.
 */
export function Reorder({ question, onAnswered }: QuestionRendererProps<ReorderQuestion>) {
  const correct = question.content.items;
  const shuffled = useMemo(
    () => correct.map((it, i) => ({ it, i })).sort(() => Math.random() - 0.5),
    [question.id],
  );
  const [pickedIdx, setPickedIdx] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    setSubmitted(true);
    const answer = pickedIdx.map((i) => shuffled[i].it);
    const ok = answer.length === correct.length && answer.every((v, i) => v === correct[i]);
    onAnswered(ok, correct.map((c, i) => `${i + 1}. ${c}`).join('  '));
  };

  const pick = (i: number) => !submitted && !pickedIdx.includes(i) && setPickedIdx((p) => [...p, i]);
  const unpick = (slot: number) =>
    !submitted && setPickedIdx((p) => p.filter((_, i) => i !== slot));

  return (
    <View style={styles.root}>
      <Text style={styles.prompt}>{question.prompt}</Text>

      <View style={styles.answer}>
        {pickedIdx.map((i, slot) => (
          <Pressable key={`${i}-${slot}`} onPress={() => unpick(slot)} style={styles.tile}>
            <Text style={styles.tileText}>{slot + 1}. {shuffled[i].it}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.divider} />

      <View style={styles.bank}>
        {shuffled.map((s, i) => {
          const used = pickedIdx.includes(i);
          return (
            <Pressable
              key={`${s.it}-${i}`}
              disabled={used || submitted}
              onPress={() => pick(i)}
              style={[styles.tile, used && styles.tileUsed]}
            >
              <Text style={[styles.tileText, used && styles.tileTextUsed]}>{s.it}</Text>
            </Pressable>
          );
        })}
      </View>

      {!submitted && (
        <Pressable
          disabled={pickedIdx.length !== correct.length}
          onPress={submit}
          style={[styles.checkBtn, pickedIdx.length !== correct.length && styles.checkBtnDisabled]}
        >
          <Text style={styles.checkText}>CHECK</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  prompt: { ...typography.h2, color: colors.text, marginVertical: 16 },
  answer: { minHeight: 60, gap: 8, marginTop: 12 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 12 },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    backgroundColor: colors.bgElevated,
    borderWidth: 2, borderBottomWidth: 4,
    borderColor: colors.divider, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  tileUsed: { opacity: 0.3 },
  tileText: { ...typography.h3, color: colors.text },
  tileTextUsed: { color: colors.textDim },
  checkBtn: {
    marginTop: 'auto', marginVertical: 16,
    backgroundColor: colors.green, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  checkBtnDisabled: { backgroundColor: colors.surfaceAlt },
  checkText: { ...typography.button, color: '#fff' },
});
