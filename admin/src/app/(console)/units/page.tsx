'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/client-api';
import type { Paginated, Subject, Unit } from '@/lib/types';
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type Form = { subjectId: string; title: string; orderIndex: number; description: string };
const empty: Form = { subjectId: '', title: '', orderIndex: 0, description: '' };

export default function UnitsPageWrapper() {
  return <Suspense fallback={null}><UnitsPage /></Suspense>;
}

function UnitsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subjectId = searchParams.get('subjectId') ?? '';

  const [rows, setRows] = useState<Unit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const subjectQs = subjectId ? `&subjectId=${subjectId}` : '';
      const [u, s] = await Promise.all([
        api.get<Paginated<Unit>>(`/units?page=${page}&limit=${limit}${subjectQs}`),
        api.get<Paginated<Subject>>('/subjects?page=1&limit=200'),
      ]);
      setRows(u.items); setTotal(u.total); setSubjects(s.items);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { setPage(1); }, [subjectId]);
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [subjectId, page, limit]);

  function openNew() {
    setEditing(null);
    setForm({ ...empty, subjectId: subjectId || subjects[0]?.id || '', orderIndex: rows.length });
    setOpen(true);
  }
  function openEdit(u: Unit) {
    setEditing(u);
    setForm({
      subjectId: u.subjectId, title: u.title,
      orderIndex: u.orderIndex, description: u.description ?? '',
    });
    setOpen(true);
  }
  async function save() {
    if (!form.subjectId || !form.title) return toast.error('Subject and title required');
    setSaving(true);
    try {
      const body = { ...form, description: form.description || null };
      if (editing) await api.put(`/units/${editing.id}`, body);
      else await api.post('/units', body);
      toast.success(editing ? 'Updated' : 'Created');
      setOpen(false);
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    try { await api.del(`/units/${id}`); toast.success('Deleted'); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  const filterLabel = useMemo(() => {
    if (!subjectId) return 'All subjects';
    return subjects.find((s) => s.id === subjectId)?.displayName ?? 'Filtered';
  }, [subjectId, subjects]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Units"
        description={`Chapters that group exercises. Showing: ${filterLabel}.`}
        actionLabel="New unit"
        onAction={openNew}
      />

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Label className="text-xs">Filter by subject</Label>
          <Select
            value={subjectId || 'all'}
            onValueChange={(v) => router.push(v === 'all' ? '/units' : `/units?subjectId=${v}`)}
          >
            <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.icon} {s.displayName}</SelectItem>
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
                <TableHead>Subject</TableHead>
                <TableHead>Exercises</TableHead>
                <TableHead className="w-48 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>}
              {!loading && rows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No units.</TableCell></TableRow>
              )}
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-muted-foreground">{u.orderIndex}</TableCell>
                  <TableCell>
                    <div className="font-medium">{u.title}</div>
                    {u.description && <div className="text-xs text-muted-foreground line-clamp-1">{u.description}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{u.subject?.displayName ?? '—'}</TableCell>
                  <TableCell>{u._count?.exercises ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Link href={`/exercises?unitId=${u.id}`}>
                        <Button size="sm" variant="outline">Exercises</Button>
                      </Link>
                      <RowActions onEdit={() => openEdit(u)} onDelete={() => remove(u.id)} />
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
          <DialogHeader><DialogTitle>{editing ? 'Edit unit' : 'New unit'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.icon} {s.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Order</Label>
              <Input type="number" value={form.orderIndex}
                onChange={(e) => setForm({ ...form, orderIndex: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
