// Domain types mirror the backend Prisma models.
export interface Subject {
  id: string;
  slug: string;
  name: string;
  level: number;
  displayName: string;
  icon?: string | null;
  description?: string | null;
  _count?: { units: number };
}

export interface Exam {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  subjects?: { subject: Subject; orderIndex: number }[];
}

export interface Unit {
  id: string;
  subjectId: string;
  title: string;
  orderIndex: number;
  description?: string | null;
  subject?: { id: string; name: string; displayName: string };
  _count?: { exercises: number };
}

export interface Exercise {
  id: string;
  unitId: string;
  title: string;
  duration: number;
  points: number;
  orderIndex: number;
  unit?: { id: string; title: string; subjectId: string };
  _count?: { questions: number };
}

export type QuestionType = 'MCQ' | 'MATCH' | 'REORDER' | 'COMPLETE' | 'TRANSLATE';

export interface Question {
  id: string;
  exerciseId: string;
  type: QuestionType | string;
  prompt: string;
  difficulty: string;
  points: number;
  content: unknown;
  explanation?: string | null;
}

export interface Overview {
  users: number;
  exams: number;
  subjects: number;
  units: number;
  exercises: number;
  questions: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
