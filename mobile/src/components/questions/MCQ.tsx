import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { MCQQuestion } from '@/types';
import type { QuestionRendererProps } from './types';

export function MCQ({ question, onAnswered }: QuestionRendererProps<MCQQuestion>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (selected == null) return;
    setSubmitted(true);
    const correctIdx = question.content.correct_index;
    const correctText = question.content.options[correctIdx];
    onAnswered(selected === correctIdx, correctText);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.prompt}>{question.prompt}</Text>

      <View style={styles.list}>
        {question.content.options.map((opt, i) => {
          const isSel = selected === i;
          const isCorrect = submitted && i === question.content.correct_index;
          const isWrongPick = submitted && isSel && i !== question.content.correct_index;
          return (
            <Pressable
              key={`${i}-${opt}`}
              onPress={() => !submitted && setSelected(i)}
              style={[
                styles.card,
                isSel && !submitted && styles.cardSel,
                isCorrect && styles.cardCorrect,
                isWrongPick && styles.cardWrong,
              ]}
            >
              <View
                style={[
                  styles.bullet,
                  isSel && !submitted && styles.bulletSel,
                  isCorrect && styles.bulletCorrect,
                  isWrongPick && styles.bulletWrong,
                ]}
              >
                <Text
                  style={[
                    styles.bulletText,
                    isSel && !submitted && styles.bulletTextSel,
                    (isCorrect || isWrongPick) && styles.bulletTextOnFill,
                  ]}
                >
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={styles.label}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>

      {!submitted && (
        <Pressable
          disabled={selected == null}
          onPress={submit}
          style={[styles.checkBtn, selected == null && styles.checkBtnDisabled]}
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
  list: { gap: 10, marginTop: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardSel: { borderColor: colors.blue, backgroundColor: '#0E2F3D' },
  cardCorrect: { borderColor: colors.green, backgroundColor: '#0F2A14' },
  cardWrong: { borderColor: colors.red, backgroundColor: '#2A0F12' },
  bullet: {
    width: 30, height: 30, borderRadius: 8,
    borderWidth: 2, borderColor: colors.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  bulletSel: { borderColor: colors.blue },
  bulletCorrect: { borderColor: colors.green, backgroundColor: colors.green },
  bulletWrong: { borderColor: colors.red, backgroundColor: colors.red },
  bulletText: { color: colors.textMuted, fontWeight: '900' },
  bulletTextSel: { color: colors.blue },
  bulletTextOnFill: { color: '#fff' },
  label: { ...typography.h3, color: colors.text, flex: 1 },
  checkBtn: {
    marginTop: 'auto', marginVertical: 16,
    backgroundColor: colors.green, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  checkBtnDisabled: { backgroundColor: colors.surfaceAlt },
  checkText: { ...typography.button, color: '#fff' },
});
