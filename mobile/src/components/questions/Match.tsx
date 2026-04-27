import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { MatchQuestion } from '@/types';
import type { QuestionRendererProps } from './types';

interface Tile {
  id: string;
  text: string;
  side: 'left' | 'right';
  /** Both sides of a correct pair share this key. */
  pairKey: string;
}

export function Match({ question, onAnswered }: QuestionRendererProps<MatchQuestion>) {
  const tiles = useMemo<Tile[]>(() => {
    const arr: Tile[] = [];
    question.content.left.forEach((l) => {
      const r = question.content.map[l];
      if (r == null) return;
      arr.push({ id: `L:${l}`, text: l, side: 'left', pairKey: l });
      arr.push({ id: `R:${l}`, text: r, side: 'right', pairKey: l });
    });
    return arr.sort(() => Math.random() - 0.5);
  }, [question.id]);

  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [pick, setPick] = useState<{ left?: Tile; right?: Tile }>({});
  const [wrong, setWrong] = useState<string[]>([]);

  const tap = (t: Tile) => {
    if (matched.has(t.id)) return;
    const next = { ...pick, [t.side]: t };
    if (next.left && next.right) {
      if (next.left.pairKey === next.right.pairKey) {
        const m = new Set(matched);
        m.add(next.left.id);
        m.add(next.right.id);
        setMatched(m);
        setPick({});
        if (m.size === tiles.length) {
          setTimeout(() => onAnswered(true), 200);
        }
      } else {
        setWrong([next.left.id, next.right.id]);
        setTimeout(() => { setWrong([]); setPick({}); }, 500);
      }
    } else {
      setPick(next);
    }
  };

  const lefts = tiles.filter((t) => t.side === 'left');
  const rights = tiles.filter((t) => t.side === 'right');

  return (
    <View style={styles.root}>
      <Text style={styles.prompt}>{question.prompt}</Text>
      <View style={styles.cols}>
        <Column tiles={lefts} pick={pick} matched={matched} wrong={wrong} onTap={tap} />
        <Column tiles={rights} pick={pick} matched={matched} wrong={wrong} onTap={tap} />
      </View>
    </View>
  );
}

function Column({
  tiles, pick, matched, wrong, onTap,
}: {
  tiles: Tile[];
  pick: { left?: Tile; right?: Tile };
  matched: Set<string>;
  wrong: string[];
  onTap: (t: Tile) => void;
}) {
  return (
    <View style={styles.col}>
      {tiles.map((t) => {
        const isPicked = pick.left?.id === t.id || pick.right?.id === t.id;
        const isMatched = matched.has(t.id);
        const isWrong = wrong.includes(t.id);
        return (
          <Pressable
            key={t.id}
            onPress={() => onTap(t)}
            style={[
              styles.tile,
              isPicked && styles.tilePicked,
              isWrong && styles.tileWrong,
              isMatched && styles.tileDone,
            ]}
          >
            <Text style={[
              styles.text,
              (isPicked || isWrong) && { color: colors.green },
              isMatched && styles.textDone,
            ]}>
              {t.text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  prompt: { ...typography.h2, color: colors.text, marginVertical: 16 },
  cols: { flexDirection: 'row', gap: 12, marginTop: 12 },
  col: { flex: 1, gap: 12 },
  tile: {
    borderWidth: 2, borderBottomWidth: 4,
    borderColor: colors.divider, backgroundColor: colors.surface,
    borderRadius: 12, paddingVertical: 18, paddingHorizontal: 8, alignItems: 'center',
  },
  tilePicked: { borderColor: colors.green, backgroundColor: '#102B14' },
  tileWrong: { borderColor: colors.red },
  tileDone: { opacity: 0.4 },
  text: { ...typography.h3, color: colors.text, textAlign: 'center' },
  textDone: { color: colors.textDim },
});
