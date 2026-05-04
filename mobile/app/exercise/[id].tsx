import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View, Vibration } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/api/client';
import { useProgress } from '@/context/ProgressContext';
import { ProgressBar } from '@/components/ProgressBar';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { DuoButton } from '@/components/DuoButton';
import { OutOfHearts } from '@/components/OutOfHearts';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { CompleteExerciseResponse, Exercise, Question } from '@/types';

type LoadedExercise = Exercise & { questions: Question[] };

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeExercise, loseHeart, hearts } = useProgress();

  const [exercise, setExercise] = useState<LoadedExercise | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [done, setDone] = useState<CompleteExerciseResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getExercise(id)
      .then((ex) => {
        // Shuffle questions on every entry so re-attempts feel fresh.
        const shuffled = [...(ex as LoadedExercise).questions].sort(() => Math.random() - 0.5);
        setExercise({ ...(ex as LoadedExercise), questions: shuffled });
      })
      .catch((err) => setError(err?.message ?? 'Failed to load'));
  }, [id]);

  // Celebratory vibration when the lesson finishes.
  useEffect(() => {
    if (done) Vibration.vibrate([0, 80, 60, 80, 60, 160]);
  }, [done]);

  // Hard gate: out of hearts → show full-screen wait/refill UI.
  if (hearts === 0 && !done) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={28} color={colors.textMuted} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
        <OutOfHearts onBack={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.summary}>
          <Text style={styles.title}>{error}</Text>
          <DuoButton label="Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={colors.green} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const total = exercise.questions.length;
  const question = exercise.questions[index];
  const progress = (index + (feedback !== 'idle' ? 1 : 0)) / total;

  const handleAnswered = (correct: boolean, answer?: string) => {
    setFeedback(correct ? 'correct' : 'wrong');
    setCorrectAnswer(answer ?? null);
    setResults((r) => [...r, correct]);
    if (!correct) {
      // Short "buzz" pattern for a wrong answer.
      Vibration.vibrate([0, 60, 40, 80]);
      loseHeart();
    }
  };

  const next = async () => {
    // If user just lost their last heart, the screen-level OutOfHearts gate
    // will render on the next pass — don't try to submit a partial run.
    if (hearts === 0) return;
    if (index + 1 >= total) {
      setSubmitting(true);
      try {
        const res = await completeExercise(exercise.id, [...results]);
        setDone(res);
      } catch (err: any) {
        Alert.alert('Could not save progress', err?.message ?? 'Try again');
      } finally {
        setSubmitting(false);
      }
    } else {
      setIndex((i) => i + 1);
      setFeedback('idle');
      setCorrectAnswer(null);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.summary}>
          <Text style={styles.celebrate}>🎉</Text>
          <Text style={styles.title}>Lesson complete!</Text>
          <View style={styles.statsRow}>
            <Stat label="TOTAL XP" value={`+${done.xpAwarded}`} color={colors.yellow} />
            <Stat label="ACCURACY" value={`${done.scorePct}%`} color={colors.green} />
            {done.diamondsAwarded > 0 && (
              <Stat label="DIAMONDS" value={`+${done.diamondsAwarded}`} color={colors.gem} />
            )}
          </View>
          {done.streak.bonusAwarded && (
            <Text style={styles.bonus}>🔥 {done.streak.value}-day streak bonus!</Text>
          )}
          {done.unitCompleted && (
            <Text style={styles.bonus}>🏆 Unit completed!</Text>
          )}
          <DuoButton label="Continue" onPress={() => router.replace('/(tabs)/home')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={28} color={colors.textMuted} />
        </Pressable>
        <ProgressBar progress={progress} />
        <View style={styles.heartRow}>
          <Ionicons name="heart" size={20} color={colors.red} />
          <Text style={styles.heartText}>{hearts}</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <QuestionRenderer key={question.id} question={question} onAnswered={handleAnswered} />
      </View>

      {feedback !== 'idle' && (
        <View style={[styles.feedback, feedback === 'correct' ? styles.fbOk : styles.fbBad]}>
          <Text style={[styles.fbTitle, feedback === 'correct' ? styles.fbOkText : styles.fbBadText]}>
            {feedback === 'correct' ? 'Nice!' : 'Correct answer:'}
          </Text>
          {feedback === 'wrong' && !!correctAnswer && (
            <Text style={styles.fbAnswer}>{correctAnswer}</Text>
          )}
          {feedback === 'wrong' && !!question.explanation && (
            <Text style={styles.fbHint}>{question.explanation}</Text>
          )}
          <DuoButton
            label={submitting ? 'Saving…' : 'Continue'}
            onPress={next}
            disabled={submitting}
            variant={feedback === 'wrong' ? 'danger' : 'primary'}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color }]}>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  heartRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heartText: { ...typography.h3, color: colors.red },
  feedback: { padding: 16, gap: 10, borderTopWidth: 2 },
  fbOk: { backgroundColor: '#0F2A14', borderTopColor: colors.green },
  fbBad: { backgroundColor: '#2A0F12', borderTopColor: colors.red },
  fbTitle: { ...typography.h2 },
  fbOkText: { color: colors.green },
  fbBadText: { color: colors.red },
  fbAnswer: { ...typography.h3, color: colors.text },
  fbHint: { color: colors.text, ...typography.body },

  summary: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 18 },
  celebrate: { fontSize: 96 },
  title: { ...typography.display, color: colors.text, textAlign: 'center' },
  bonus: { ...typography.h3, color: colors.streak },
  statsRow: { flexDirection: 'row', gap: 12, marginVertical: 12, alignSelf: 'stretch' },
  statCard: {
    flex: 1, borderWidth: 2, borderRadius: 14, padding: 12,
    backgroundColor: colors.bgElevated,
  },
  statLabel: { ...typography.caption },
  statValue: { ...typography.h1, color: colors.text },
});
