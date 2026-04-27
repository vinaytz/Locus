import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { Question } from '@/types';
import type { QuestionRendererProps } from './types';
import { MCQ } from './MCQ';
import { Translate } from './Translate';
import { Match } from './Match';
import { Complete } from './Complete';
import { Reorder } from './Reorder';

export function QuestionRenderer({ question, onAnswered }: QuestionRendererProps) {
  switch (question.type) {
    case 'MCQ':
      return <MCQ question={question} onAnswered={onAnswered} />;
    case 'TRANSLATE':
      return <Translate question={question} onAnswered={onAnswered} />;
    case 'MATCH':
      return <Match question={question} onAnswered={onAnswered} />;
    case 'COMPLETE':
      return <Complete question={question} onAnswered={onAnswered} />;
    case 'REORDER':
      return <Reorder question={question} onAnswered={onAnswered} />;
    default:
      return (
        <View style={styles.fallback}>
          <Text style={styles.text}>Unsupported question type: {(question as Question).type}</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  fallback: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  text: { ...typography.body, color: colors.textMuted },
});
