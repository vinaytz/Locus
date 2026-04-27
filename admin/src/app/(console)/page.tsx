import { adminFetch } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Boxes, GraduationCap, ListTodo, PencilRuler, Users } from 'lucide-react';
import type { Overview } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STATS: { key: keyof Overview; label: string; icon: any; color: string }[] = [
  { key: 'users', label: 'Learners', icon: Users, color: 'text-sky-400' },
  { key: 'exams', label: 'Exams', icon: GraduationCap, color: 'text-violet-400' },
  { key: 'subjects', label: 'Subjects', icon: BookOpen, color: 'text-emerald-400' },
  { key: 'units', label: 'Units', icon: Boxes, color: 'text-amber-400' },
  { key: 'exercises', label: 'Exercises', icon: ListTodo, color: 'text-rose-400' },
  { key: 'questions', label: 'Questions', icon: PencilRuler, color: 'text-fuchsia-400' },
];

export default async function DashboardPage() {
  let overview: Overview = { users: 0, exams: 0, subjects: 0, units: 0, exercises: 0, questions: 0 };
  let error: string | null = null;
  try {
    overview = await adminFetch<Overview>('/admin/overview');
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Live counters from the production database. Use the sidebar to manage content.
        </p>
      </header>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-destructive">
            Could not reach backend: {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overview[s.key].toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick start</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Create a <strong className="text-foreground">Subject</strong> (e.g. "Spanish 1").</p>
          <p>2. Add <strong className="text-foreground">Units</strong> to it (chapters).</p>
          <p>3. Add <strong className="text-foreground">Exercises</strong> to each unit.</p>
          <p>4. Add <strong className="text-foreground">Questions</strong> (MCQ, Match, Translate, Complete) to each exercise.</p>
          <p>5. Optionally bundle subjects into an <strong className="text-foreground">Exam</strong>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
