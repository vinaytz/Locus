'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/client-api';
import type { Exercise, Paginated, Question, QuestionType } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { RowActions } from '@/components/row-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type McqOption = { id: string; label: string; emoji?: string };
type MatchPair = { left: string; right: string };

interface EditorState {
  type: QuestionType;
  prompt: string;
  difficulty: string;
  points: number;
  explanation: string;
  // MCQ
  mcqWord: string;
  mcqOptions: McqOption[];
  mcqCorrectId: string;
  // TRANSLATE
  trSentence: string;
  trBank: string[];
  trAnswer: string[];
  // MATCH
  matchPairs: MatchPair[];
  // COMPLETE
  cBefore: string;
  cAfter: string;
  cOptions: string[];
  cAnswer: string;
  // REORDER
  rItems: string[];
  rOrder: string;
}

const empty: EditorState = {
  type: 'MCQ', prompt: '', difficulty: 'easy', points: 10, explanation: '',
  mcqWord: '', mcqOptions: [
    { id: 'a', label: '' }, { id: 'b', label: '' }, { id: 'c', label: '' }, { id: 'd', label: '' },
  ], mcqCorrectId: 'a',
  trSentence: '', trBank: [''], trAnswer: [''],
  matchPairs: [{ left: '', right: '' }, { left: '', right: '' }],
  cBefore: '', cAfter: '', cOptions: [''], cAnswer: '',
  rItems: [''], rOrder: '',
};

export default function QuestionsPageWrapper() {
  return <Suspense fallback={null}><QuestionsPage /></Suspense>;
}

function QuestionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const exerciseId = searchParams.get('exerciseId') ?? '';

  const [rows, setRows] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState<EditorState>(empty);
  const [activeExercise, setActiveExercise] = useState(exerciseId);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const exQs = exerciseId ? `&exerciseId=${exerciseId}` : '';
      const [q, x] = await Promise.all([
        api.get<Paginated<Question>>(`/questions?page=${page}&limit=${limit}${exQs}`),
        api.get<Paginated<Exercise>>('/exercises?page=1&limit=200'),
      ]);
      setRows(q.items); setTotal(q.total); setExercises(x.items);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { setPage(1); }, [exerciseId]);
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [exerciseId, page, limit]);

  function openNew() {
    if (!exerciseId && exercises.length === 0) {
      toast.error('Create an exercise first');
      return;
    }
    setEditing(null);
    setActiveExercise(exerciseId || exercises[0]?.id || '');
    setForm(empty);
    setOpen(true);
  }
  function openEdit(q: Question) {
    setEditing(q);
    setActiveExercise(q.exerciseId);
    setForm(hydrate(q));
    setOpen(true);
  }
  async function save() {
    if (!activeExercise) return toast.error('Pick an exercise');
    if (!form.prompt) return toast.error('Prompt is required');
    let content: unknown;
    try { content = serialize(form); }
    catch (e: any) { return toast.error(e.message); }
    setSaving(true);
    try {
      const body = {
        exerciseId: activeExercise,
        type: form.type,
        prompt: form.prompt,
        difficulty: form.difficulty,
        points: form.points,
        content,
        explanation: form.explanation || null,
      };
      if (editing) await api.put(`/questions/${editing.id}`, body);
      else await api.post('/questions', body);
      toast.success(editing ? 'Updated' : 'Created');
      setOpen(false);
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    try { await api.del(`/questions/${id}`); toast.success('Deleted'); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  const filterLabel = useMemo(() => {
    if (!exerciseId) return 'All exercises';
    return exercises.find((x) => x.id === exerciseId)?.title ?? 'Filtered';
  }, [exerciseId, exercises]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Questions"
        description={`Authored questions. Showing: ${filterLabel}.`}
        actionLabel="New question"
        onAction={openNew}
      />

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Label className="text-xs">Filter by exercise</Label>
          <Select
            value={exerciseId || 'all'}
            onValueChange={(v) => router.push(v === 'all' ? '/questions' : `/questions?exerciseId=${v}`)}
          >
            <SelectTrigger className="w-96"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All exercises</SelectItem>
              {exercises.map((x) => (
                <SelectItem key={x.id} value={x.id}>{x.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Type</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>}
              {!loading && rows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No questions yet.</TableCell></TableRow>
              )}
              {rows.map((q) => (
                <TableRow key={q.id}>
                  <TableCell><Badge variant="outline">{q.type}</Badge></TableCell>
                  <TableCell className="max-w-xl">
                    <div className="line-clamp-2 text-sm">{q.prompt}</div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{q.difficulty}</Badge></TableCell>
                  <TableCell>{q.points}</TableCell>
                  <TableCell>
                    <RowActions onEdit={() => openEdit(q)} onDelete={() => remove(q.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page} limit={limit} total={total}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit question' : 'New question'}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Exercise</Label>
                <Select value={activeExercise} onValueChange={setActiveExercise}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {exercises.map((x) => (
                      <SelectItem key={x.id} value={x.id}>{x.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as QuestionType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCQ">MCQ</SelectItem>
                    <SelectItem value="TRANSLATE">Translate</SelectItem>
                    <SelectItem value="MATCH">Match pairs</SelectItem>
                    <SelectItem value="COMPLETE">Complete sentence</SelectItem>
                    <SelectItem value="REORDER">Reorder words</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Prompt</Label>
              <Textarea rows={2} value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                placeholder='e.g. "Which one of these is "the apple"?"' />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Points</Label>
                <Input type="number" value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
              </div>
              <div />
            </div>

            <div className="rounded-md border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold">Content · {form.type}</h3>
              <TypeEditor form={form} setForm={setForm} />
            </div>

            <div className="space-y-1.5">
              <Label>Explanation (optional)</Label>
              <Textarea rows={2} value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TypeEditor({ form, setForm }: { form: EditorState; setForm: (f: EditorState) => void }) {
  switch (form.type) {
    case 'MCQ': return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Word / phrase shown</Label>
          <Input value={form.mcqWord} onChange={(e) => setForm({ ...form, mcqWord: e.target.value })} placeholder="apple" />
        </div>
        <Label>Options (pick the correct one)</Label>
        {form.mcqOptions.map((o, i) => (
          <div key={o.id} className="flex items-center gap-2">
            <input
              type="radio" className="h-4 w-4 accent-primary"
              checked={form.mcqCorrectId === o.id}
              onChange={() => setForm({ ...form, mcqCorrectId: o.id })}
            />
            <Input className="w-16" value={o.id}
              onChange={(e) => updateMcq(form, setForm, i, { id: e.target.value })} />
            <Input className="w-20" value={o.emoji ?? ''} placeholder="emoji"
              onChange={(e) => updateMcq(form, setForm, i, { emoji: e.target.value })} />
            <Input className="flex-1" value={o.label} placeholder="label"
              onChange={(e) => updateMcq(form, setForm, i, { label: e.target.value })} />
            <Button size="icon" variant="ghost"
              onClick={() => setForm({ ...form, mcqOptions: form.mcqOptions.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline"
          onClick={() => setForm({ ...form, mcqOptions: [...form.mcqOptions, { id: String.fromCharCode(97 + form.mcqOptions.length), label: '' }] })}>
          <Plus className="h-4 w-4 mr-1" /> Add option
        </Button>
      </div>
    );
    case 'TRANSLATE': return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Sentence to translate</Label>
          <Input value={form.trSentence} onChange={(e) => setForm({ ...form, trSentence: e.target.value })} />
        </div>
        <ListEditor label="Word bank" items={form.trBank}
          onChange={(items) => setForm({ ...form, trBank: items })} placeholder="word" />
        <ListEditor label="Correct order" items={form.trAnswer}
          onChange={(items) => setForm({ ...form, trAnswer: items })} placeholder="word" />
      </div>
    );
    case 'MATCH': return (
      <div className="space-y-2">
        <Label>Pairs</Label>
        {form.matchPairs.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={p.left} placeholder="left"
              onChange={(e) => updatePair(form, setForm, i, { left: e.target.value })} />
            <span className="text-muted-foreground">↔</span>
            <Input value={p.right} placeholder="right"
              onChange={(e) => updatePair(form, setForm, i, { right: e.target.value })} />
            <Button size="icon" variant="ghost"
              onClick={() => setForm({ ...form, matchPairs: form.matchPairs.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline"
          onClick={() => setForm({ ...form, matchPairs: [...form.matchPairs, { left: '', right: '' }] })}>
          <Plus className="h-4 w-4 mr-1" /> Add pair
        </Button>
      </div>
    );
    case 'COMPLETE': return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Before blank</Label>
            <Input value={form.cBefore} onChange={(e) => setForm({ ...form, cBefore: e.target.value })} placeholder="I ___" />
          </div>
          <div className="space-y-1.5">
            <Label>After blank</Label>
            <Input value={form.cAfter} onChange={(e) => setForm({ ...form, cAfter: e.target.value })} placeholder="apple" />
          </div>
        </div>
        <ListEditor label="Options" items={form.cOptions}
          onChange={(items) => setForm({ ...form, cOptions: items })} />
        <div className="space-y-1.5">
          <Label>Correct answer</Label>
          <Input value={form.cAnswer} onChange={(e) => setForm({ ...form, cAnswer: e.target.value })} />
        </div>
      </div>
    );
    case 'REORDER': return (
      <div className="space-y-3">
        <ListEditor label="Items (display order)" items={form.rItems}
          onChange={(items) => setForm({ ...form, rItems: items })} />
        <div className="space-y-1.5">
          <Label>Correct order (zero-based indexes, comma separated)</Label>
          <Input value={form.rOrder} onChange={(e) => setForm({ ...form, rOrder: e.target.value })} placeholder="2,0,1,3" />
        </div>
      </div>
    );
  }
}

function updateMcq(form: EditorState, set: (f: EditorState) => void, i: number, patch: Partial<McqOption>) {
  const next = [...form.mcqOptions];
  next[i] = { ...next[i], ...patch };
  set({ ...form, mcqOptions: next });
}
function updatePair(form: EditorState, set: (f: EditorState) => void, i: number, patch: Partial<MatchPair>) {
  const next = [...form.matchPairs];
  next[i] = { ...next[i], ...patch };
  set({ ...form, matchPairs: next });
}

function ListEditor({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (i: string[]) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {items.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={v} placeholder={placeholder}
            onChange={(e) => { const n = [...items]; n[i] = e.target.value; onChange(n); }} />
          <Button size="icon" variant="ghost"
            onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...items, ''])}>
        <Plus className="h-4 w-4 mr-1" /> Add
      </Button>
    </div>
  );
}

function serialize(f: EditorState): unknown {
  switch (f.type) {
    case 'MCQ': {
      const opts = f.mcqOptions.filter((o) => o.id && o.label);
      if (opts.length < 2) throw new Error('At least 2 MCQ options required');
      if (!opts.find((o) => o.id === f.mcqCorrectId)) throw new Error('Pick a correct option');
      return { word: f.mcqWord, options: opts.map((o) => ({ id: o.id, label: o.label, emoji: o.emoji || undefined })), correctId: f.mcqCorrectId };
    }
    case 'TRANSLATE': {
      const bank = f.trBank.map((s) => s.trim()).filter(Boolean);
      const answer = f.trAnswer.map((s) => s.trim()).filter(Boolean);
      if (!f.trSentence) throw new Error('Sentence required');
      if (answer.length === 0) throw new Error('Answer required');
      return { sentence: f.trSentence, bank, answer };
    }
    case 'MATCH': {
      const pairs = f.matchPairs.filter((p) => p.left && p.right);
      if (pairs.length < 2) throw new Error('At least 2 pairs required');
      return { pairs };
    }
    case 'COMPLETE': {
      const options = f.cOptions.map((s) => s.trim()).filter(Boolean);
      if (!f.cAnswer) throw new Error('Answer required');
      return { before: f.cBefore, after: f.cAfter, options, answer: f.cAnswer };
    }
    case 'REORDER': {
      const items = f.rItems.map((s) => s.trim()).filter(Boolean);
      const order = f.rOrder.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
      if (items.length < 2) throw new Error('At least 2 items required');
      if (order.length !== items.length) throw new Error('Order length must match items');
      return { items, order };
    }
  }
}

function hydrate(q: Question): EditorState {
  const c: any = q.content ?? {};
  const base: EditorState = {
    ...empty,
    type: (q.type as QuestionType) ?? 'MCQ',
    prompt: q.prompt,
    difficulty: q.difficulty,
    points: q.points,
    explanation: q.explanation ?? '',
  };
  switch (base.type) {
    case 'MCQ': return { ...base,
      mcqWord: c.word ?? '',
      mcqOptions: Array.isArray(c.options) && c.options.length ? c.options : empty.mcqOptions,
      mcqCorrectId: c.correctId ?? 'a' };
    case 'TRANSLATE': return { ...base,
      trSentence: c.sentence ?? '',
      trBank: c.bank ?? [''],
      trAnswer: c.answer ?? [''] };
    case 'MATCH': return { ...base,
      matchPairs: Array.isArray(c.pairs) && c.pairs.length ? c.pairs : empty.matchPairs };
    case 'COMPLETE': return { ...base,
      cBefore: c.before ?? '', cAfter: c.after ?? '',
      cOptions: c.options ?? [''], cAnswer: c.answer ?? '' };
    case 'REORDER': return { ...base,
      rItems: c.items ?? [''],
      rOrder: Array.isArray(c.order) ? c.order.join(',') : '' };
    default: return base;
  }
}
