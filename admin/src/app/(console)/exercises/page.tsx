'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/client-api';
import type { Exercise, Paginated, Unit } from '@/lib/types';
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type Form = { unitId: string; title: string; duration: number; points: number; orderIndex: number };
const empty: Form = { unitId: '', title: '', duration: 60, points: 10, orderIndex: 0 };

export default function ExercisesPageWrapper() {
  return <Suspense fallback={null}><ExercisesPage /></Suspense>;
}

function ExercisesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const unitId = searchParams.get('unitId') ?? '';

  const [rows, setRows] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const unitQs = unitId ? `&unitId=${unitId}` : '';
      const [e, u] = await Promise.all([
        api.get<Paginated<Exercise>>(`/exercises?page=${page}&limit=${limit}${unitQs}`),
        api.get<Paginated<Unit>>('/units?page=1&limit=200'),
      ]);
      setRows(e.items); setTotal(e.total); setUnits(u.items);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { setPage(1); }, [unitId]);
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [unitId, page, limit]);

  function openNew() {
    setEditing(null);
    setForm({ ...empty, unitId: unitId || units[0]?.id || '', orderIndex: rows.length });
    setOpen(true);
  }
  function openEdit(x: Exercise) {
    setEditing(x);
    setForm({
      unitId: x.unitId, title: x.title,
      duration: x.duration, points: x.points, orderIndex: x.orderIndex,
    });
    setOpen(true);
  }
  async function save() {
    if (!form.unitId || !form.title) return toast.error('Unit and title required');
    setSaving(true);
    try {
      if (editing) await api.put(`/exercises/${editing.id}`, form);
      else await api.post('/exercises', form);
      toast.success(editing ? 'Updated' : 'Created');
      setOpen(false);
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    try { await api.del(`/exercises/${id}`); toast.success('Deleted'); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  const filterLabel = useMemo(() => {
    if (!unitId) return 'All units';
    return units.find((u) => u.id === unitId)?.title ?? 'Filtered';
  }, [unitId, units]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exercises"
        description={`Lessons inside a unit. Showing: ${filterLabel}.`}
        actionLabel="New exercise"
        onAction={openNew}
      />

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Label className="text-xs">Filter by unit</Label>
          <Select
            value={unitId || 'all'}
            onValueChange={(v) => router.push(v === 'all' ? '/exercises' : `/exercises?unitId=${v}`)}
          >
            <SelectTrigger className="w-96"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All units</SelectItem>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.subject?.displayName ? `${u.subject.displayName} · ` : ''}{u.title}
                </SelectItem>
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
                <TableHead className="w-16">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead className="w-48 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>}
              {!loading && rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No exercises.</TableCell></TableRow>
              )}
              {rows.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="text-muted-foreground">{x.orderIndex}</TableCell>
                  <TableCell className="font-medium">{x.title}</TableCell>
                  <TableCell className="text-sm">{x.unit?.title ?? '—'}</TableCell>
                  <TableCell>{x.duration}s</TableCell>
                  <TableCell>{x.points}</TableCell>
                  <TableCell>{x._count?.questions ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Link href={`/questions?exerciseId=${x.id}`}>
                        <Button size="sm" variant="outline">Questions</Button>
                      </Link>
                      <RowActions onEdit={() => openEdit(x)} onDelete={() => remove(x.id)} />
                    </div>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit exercise' : 'New exercise'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={form.unitId} onValueChange={(v) => setForm({ ...form, unitId: v })}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.subject?.displayName ? `${u.subject.displayName} · ` : ''}{u.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Duration (s)</Label>
                <Input type="number" value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Points</Label>
                <Input type="number" value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Input type="number" value={form.orderIndex}
                  onChange={(e) => setForm({ ...form, orderIndex: Number(e.target.value) })} />
              </div>
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
