// Domain types mirror the backend Prisma schema (NestJS @ /api).
// Keep these aligned with backend `prisma/schema.prisma` and DTOs.

export type ID = string;

// ---- Auth -----------------------------------------------------------------
export interface AuthUser {
  id: ID;
  email: string;
  displayName: string;
  timezone: string;
  stats?: UserStats;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

// ---- Stats ----------------------------------------------------------------
export interface UserStats {
  userId: ID;
  totalXp: number;
  diamonds: number;
  hearts: number;
  /** ISO timestamp when the next heart will regenerate, or null if at MAX. */
  nextHeartAt: string | null;
  /** Server-driven config so the client doesn't hardcode duplicates. */
  heartRegenIntervalMs?: number;
  maxHearts?: number;
  heartRefillCostDiamonds?: number;
  currentLeagueIndex: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export const MAX_HEARTS = 5;
export const HEART_REFILL_COST = 10;
export const HEART_REGEN_INTERVAL_MS = 30 * 60 * 1000;

// ---- Courses --------------------------------------------------------------
export interface Subject {
  id: ID;
  slug: string;
  name: string;
  level: number; // 1..3
  displayName: string;
  icon?: string | null;
  description?: string | null;
}

export interface Exam {
  id: ID;
  slug: string;
  title: string;
  description?: string | null;
  subjects?: { subjectId: ID; orderIndex: number; subject: Subject }[];
}

export interface Unit {
  id: ID;
  subjectId: ID;
  title: string;
  description?: string | null;
  orderIndex: number;
  exercises?: Exercise[];
}

export interface Exercise {
  id: ID;
  unitId: ID;
  title: string;
  duration: number;
  points: number;
  orderIndex: number;
  questions?: Question[];
  unit?: Unit & { subject?: Subject };
}

// ---- Questions ------------------------------------------------------------
export type QuestionType = 'MCQ' | 'MATCH' | 'REORDER' | 'COMPLETE' | 'TRANSLATE';
export type Difficulty = 'easy' | 'medium' | 'hard';

interface QuestionBase {
  id: ID;
  exerciseId: ID;
  type: QuestionType;
  prompt: string;
  difficulty: Difficulty;
  points: number;
  explanation?: string | null;
}

export interface MCQQuestion extends QuestionBase {
  type: 'MCQ';
  content: { options: string[]; correct_index: number };
}

export interface CompleteQuestion extends QuestionBase {
  type: 'COMPLETE';
  // Prompt contains "___" placeholders; `blanks` are the ordered correct words.
  content: { blanks: string[] };
}

export interface MatchQuestion extends QuestionBase {
  type: 'MATCH';
  content: { left: string[]; right: string[]; map: Record<string, string> };
}

export interface ReorderQuestion extends QuestionBase {
  type: 'REORDER';
  content: { items: string[]; order?: number[] };
}

export interface TranslateQuestion extends QuestionBase {
  type: 'TRANSLATE';
  content: { sentence: string; bank: string[]; answer: string[] };
}

export type Question =
  | MCQQuestion
  | CompleteQuestion
  | MatchQuestion
  | ReorderQuestion
  | TranslateQuestion;

// ---- Enrollments ----------------------------------------------------------
export interface ExamEnrollment {
  userId: ID;
  examId: ID;
  examDate: string;
  exam: Exam;
}

export interface SubjectEnrollment {
  userId: ID;
  subjectId: ID;
  difficulty: number;
  subject: Subject;
}

export interface EnrollmentsResponse {
  exams: ExamEnrollment[];
  subjects: SubjectEnrollment[];
}

// ---- Exercise completion --------------------------------------------------
export interface CompleteExerciseResponse {
  attemptId: ID;
  scorePct: number;
  isPerfect: boolean;
  xpAwarded: number;
  diamondsAwarded: number;
  unitCompleted: boolean;
  heartsLost: number;
  streak: { value: number; bonusAwarded: boolean; outcome: string };
  totals: {
    totalXp: number;
    diamonds: number;
    hearts: number;
    nextHeartAt: string | null;
    currentStreak: number;
  };
}

export interface RefillHeartsResponse {
  hearts: number;
  diamonds: number;
  spent: number;
  refilled: number;
  nextHeartAt: string | null;
}

export interface ProgressResponse {
  completedExerciseIds: ID[];
}

// ---- Leaderboard ----------------------------------------------------------
export interface LeaderboardGroup {
  id: ID;
  leagueTier: number;
  state: 'WAITING' | 'ACTIVE' | 'CLOSED';
  filledCount: number;
  capacity: number;
  startedAt: string | null;
  endsAt: string | null;
  secondsRemaining: number | null;
}

export interface LeaderboardRankRow {
  userId: ID;
  seasonXp: number;
  rank: number;
  displayName: string;
}

export interface LeaderboardResponse {
  group: LeaderboardGroup;
  me: { userId: ID; seasonXp: number };
  ranking: LeaderboardRankRow[];
}
