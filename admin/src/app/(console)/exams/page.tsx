'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/client-api';
import type { Exam, Paginated, Subject } from '@/lib/types';
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

type Form = { slug: string; title: string; description: string };
const empty: Form = { slug: '', title: '', description: '' };

export default function ExamsPage() {
  const [rows, setRows] = useState<Exam[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [linkOpen, setLinkOpen] = useState<Exam | null>(null);
  const [linkIds, setLinkIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [e, s] = await Promise.all([
        api.get<Paginated<Exam>>(`/exams?page=${page}&limit=${limit}`),
        api.get<Paginated<Subject>>('/subjects?page=1&limit=200'),
      ]);
      setRows(e.items); setTotal(e.total); setSubjects(s.items);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [page, limit]);

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(e: Exam) {
    setEditing(e);
    setForm({ slug: e.slug, title: e.title, description: e.description ?? '' });
    setOpen(true);
  }
  async function save() {
    if (!form.slug || !form.title) return toast.error('Slug and title required');
    setSaving(true);
    try {
      const body = { ...form, description: form.description || null };
      if (editing) await api.put(`/exams/${editing.id}`, body);
      else await api.post('/exams', body);
      toast.success(editing ? 'Updated' : 'Created');
      setOpen(false);
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    try { await api.del(`/exams/${id}`); toast.success('Deleted'); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  function openLink(e: Exam) {
    setLinkOpen(e);
    setLinkIds((e.subjects ?? []).map((x) => x.subject.id));
  }
  function toggleLink(id: string) {
    setLinkIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }
  async function saveLinks() {
    if (!linkOpen) return;
    try {
      await api.patch(`/exams/${linkOpen.id}/subjects`, { subjectIds: linkIds });
      toast.success('Subjects updated');
      setLinkOpen(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams"
        description="Bundles of subjects (e.g. JEE, SAT). Each can group several subjects."
        actionLabel="New exam"
        onAction={openNew}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead className="w-48 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>}
              {!loading && rows.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No exams yet.</TableCell></TableRow>
              )}
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="font-medium">{e.title}</div>
                    {e.description && <div className="text-xs text-muted-foreground line-clamp-1">{e.description}</div>}
                  </TableCell>
                  <TableCell><code className="text-xs text-muted-foreground">{e.slug}</code></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(e.subjects ?? []).map((s) => (
                        <Badge key={s.subject.id} variant="secondary">{s.subject.displayName}</Badge>
                      ))}
                      {(e.subjects ?? []).length === 0 && <span className="text-xs text-muted-foreground">none</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => openLink(e)}>Subjects</Button>
                      <RowActions onEdit={() => openEdit(e)} onDelete={() => remove(e.id)} />
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
          <DialogHeader><DialogTitle>{editing ? 'Edit exam' : 'New exam'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(ev) => setForm({ ...form, slug: ev.target.value })} placeholder="jee-main" />
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(ev) => setForm({ ...form, title: ev.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(ev) => setForm({ ...form, description: ev.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkOpen} onOpenChange={(o) => !o && setLinkOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage subjects · {linkOpen?.title}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {subjects.length === 0 && <p className="text-sm text-muted-foreground">No subjects exist. Create some first.</p>}
            {subjects.map((s) => (
              <label key={s.id} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={linkIds.includes(s.id)}
                  onChange={() => toggleLink(s.id)}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{s.icon} {s.displayName}</div>
                  <div className="text-xs text-muted-foreground">{s.slug} · L{s.level}</div>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(null)}>Cancel</Button>
            <Button onClick={saveLinks}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
