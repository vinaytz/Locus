import type { Question } from '@/types';

export interface QuestionRendererProps<T extends Question = Question> {
  question: T;
  /**
   * Called when the learner submits an answer.
   * `correctAnswer` is a human-readable string of the right answer to show on
   * the wrong-answer feedback bar (optional — auto-derived in the renderer
   * when omitted by a question type).
   */
  onAnswered: (correct: boolean, correctAnswer?: string) => void;
}
