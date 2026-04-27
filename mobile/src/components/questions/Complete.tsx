import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { CompleteQuestion } from '@/types';
import type { QuestionRendererProps } from './types';

const BLANK_RE = /_{2,}|\[blank\]/i;

/**
 * Renders a fill-in-the-blanks question. Backend supplies `blanks` ordered
 * to match the underscores in `prompt`. We split prompt → tokens, render a
 * tile for each blank with a word bank derived from blanks + a few decoys.
 */
export function Complete({ question, onAnswered }: QuestionRendererProps<CompleteQuestion>) {
  const blanks = question.content.blanks ?? [];
  const segments = useMemo(() => {
    // Split keeping blanks as separate items
    const parts: string[] = [];
    let rest = question.prompt;
    while (BLANK_RE.test(rest)) {
      const match = rest.match(BLANK_RE)!;
      parts.push(rest.slice(0, match.index!));
      parts.push('___');
      rest = rest.slice(match.index! + match[0].length);
    }
    parts.push(rest);
    // If no blanks in prompt, append slots so user still has a target.
    if (parts.filter((p) => p === '___').length === 0 && blanks.length) {
      blanks.forEach(() => { parts.push('___'); });
    }
    return parts;
  }, [question.prompt, blanks.length]);

  const bank = useMemo(() => {
    const decoys = ['none', 'all', 'always', 'never'].filter((w) => !blanks.includes(w));
    return [...blanks, ...decoys.slice(0, Math.max(0, 4 - blanks.length))]
      .sort(() => Math.random() - 0.5);
  }, [question.id]);

  const [picked, setPicked] = useState<(string | null)[]>(() =>
    Array(segments.filter((s) => s === '___').length).fill(null),
  );
  const [submitted, setSubmitted] = useState(false);

  const setSlot = (slot: number, word: string) => {
    if (submitted) return;
    setPicked((p) => p.map((v, i) => (i === slot ? word : v)));
  };

  const submit = () => {
    setSubmitted(true);
    const correct =
      picked.length === blanks.length &&
      picked.every((w, i) => (w ?? '').toLowerCase().trim() === blanks[i].toLowerCase().trim());
    onAnswered(correct, blanks.join(', '));
  };

  let blankIdx = -1;
  return (
    <View style={styles.root}>
      <Text style={styles.label}>Fill in the blanks</Text>
      <View style={styles.sentence}>
        {segments.map((seg, i) => {
          if (seg === '___') {
            blankIdx += 1;
            const idx = blankIdx;
            const val = picked[idx];
            return (
              <Pressable
                key={`blank-${i}`}
                onPress={() => !submitted && setSlot(idx, '')}
                style={styles.slot}
              >
                <Text style={styles.slotText}>{val || ' '}</Text>
              </Pressable>
            );
          }
          return seg ? <Text key={i} style={styles.fragment}>{seg}</Text> : null;
        })}
      </View>

      <View style={styles.bank}>
        {bank.map((w, i) => {
          const used = picked.includes(w);
          return (
            <Pressable
              key={`${w}-${i}`}
              disabled={submitted || used}
              onPress={() => {
                const next = picked.findIndex((p) => p == null || p === '');
                if (next >= 0) setSlot(next, w);
              }}
              style={[styles.tile, used && styles.tileUsed]}
            >
              <Text style={[styles.tileText, used && styles.tileTextUsed]}>{w}</Text>
            </Pressable>
          );
        })}
      </View>

      {!submitted && (
        <Pressable
          disabled={picked.some((p) => !p)}
          onPress={submit}
          style={[styles.checkBtn, picked.some((p) => !p) && styles.checkBtnDisabled]}
        >
          <Text style={styles.checkText}>CHECK</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  label: { ...typography.caption, color: colors.textMuted, marginTop: 16, letterSpacing: 1 },
  sentence: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginVertical: 16 },
  fragment: { ...typography.h3, color: colors.text },
  slot: {
    minWidth: 90,
    borderBottomWidth: 2, borderColor: colors.blue,
    paddingHorizontal: 6, paddingVertical: 4,
  },
  slotText: { ...typography.h3, color: colors.text, textAlign: 'center' },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 'auto' },
  tile: {
    borderWidth: 2, borderBottomWidth: 4, borderColor: colors.divider,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  tileUsed: { opacity: 0.3 },
  tileText: { ...typography.h3, color: colors.text },
  tileTextUsed: { color: colors.textDim },
  checkBtn: {
    marginVertical: 16, backgroundColor: colors.green,
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  checkBtnDisabled: { backgroundColor: colors.surfaceAlt },
  checkText: { ...typography.button, color: '#fff' },
});
