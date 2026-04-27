import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { TranslateQuestion } from '@/types';
import type { QuestionRendererProps } from './types';

export function Translate({ question, onAnswered }: QuestionRendererProps<TranslateQuestion>) {
  const bank = useMemo(
    () => [...question.content.bank].sort(() => Math.random() - 0.5),
    [question.id],
  );
  const [submitted, setSubmitted] = useState(false);
  const [pickedIdx, setPickedIdx] = useState<number[]>([]);

  const submit = () => {
    setSubmitted(true);
    const answer = pickedIdx.map((i) => bank[i]).join(' ').toLowerCase().trim();
    const truth = question.content.answer.join(' ').toLowerCase().trim();
    onAnswered(answer === truth, question.content.answer.join(' '));
  };

  const pick = (i: number) => !submitted && setPickedIdx((p) => [...p, i]);
  const unpick = (idx: number) =>
    !submitted && setPickedIdx((p) => p.filter((_, i) => i !== idx));

  return (
    <View style={styles.root}>
      <Text style={styles.prompt}>{question.prompt}</Text>

      <View style={styles.bubbleRow}>
        <View style={styles.bear} />
        <View style={styles.bubble}>
          <Text style={styles.sentence}>{question.content.sentence}</Text>
        </View>
      </View>

      <View style={styles.answerArea}>
        {pickedIdx.map((i, slot) => (
          <Pressable key={`${i}-${slot}`} onPress={() => unpick(slot)} style={styles.tile}>
            <Text style={styles.tileText}>{bank[i]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.divider} />

      <View style={styles.bankRow}>
        {bank.map((w, i) => {
          const used = pickedIdx.includes(i);
          return (
            <Pressable
              key={`${w}-${i}`}
              onPress={() => !used && pick(i)}
              style={[styles.tile, used && styles.tileUsed]}
            >
              <Text style={[styles.tileText, used && styles.tileTextUsed]}>{w}</Text>
            </Pressable>
          );
        })}
      </View>

      {!submitted && (
        <Pressable
          disabled={pickedIdx.length === 0}
          onPress={submit}
          style={[styles.checkBtn, pickedIdx.length === 0 && styles.checkBtnDisabled]}
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
  bubbleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bear: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#7B4B2A' },
  bubble: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14,
    padding: 12, borderWidth: 2, borderColor: colors.divider,
  },
  sentence: { ...typography.h3, color: colors.text },
  answerArea: { minHeight: 60, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 12 },
  bankRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
