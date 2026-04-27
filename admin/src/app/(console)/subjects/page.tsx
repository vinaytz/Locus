'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/client-api';
import type { Paginated, Subject } from '@/lib/types';
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

type Form = {
  slug: string; name: string; displayName: string;
  level: number; icon: string; description: string;
};
const empty: Form = { slug: '', name: '', displayName: '', level: 1, icon: '', description: '' };

export default function SubjectsPage() {
  const [rows, setRows] = useState<Subject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Subject>>(`/subjects?page=${page}&limit=${limit}`);
      setRows(res.items); setTotal(res.total);
    }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [page, limit]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(s: Subject) {
    setEditing(s);
    setForm({
      slug: s.slug, name: s.name, displayName: s.displayName,
      level: s.level, icon: s.icon ?? '', description: s.description ?? '',
    });
    setOpen(true);
  }
  async function save() {
    if (!form.slug || !form.name || !form.displayName) {
      toast.error('Slug, name and display name are required');
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, icon: form.icon || null, description: form.description || null };
      if (editing) await api.put(`/subjects/${editing.id}`, body);
      else await api.post('/subjects', body);
      toast.success(editing ? 'Subject updated' : 'Subject created');
      setOpen(false);
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    try { await api.del(`/subjects/${id}`); toast.success('Deleted'); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Top-level courses (e.g. Spanish, Algebra). Each has units and exercises."
        actionLabel="New subject"
        onAction={openNew}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Units</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Loading…</TableCell></TableRow>
              )}
              {!loading && rows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">No subjects yet. Create your first one.</TableCell></TableRow>
              )}
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.icon} {s.displayName}</div>
                    <div className="text-xs text-muted-foreground">{s.name}</div>
                  </TableCell>
                  <TableCell><code className="text-xs text-muted-foreground">{s.slug}</code></TableCell>
                  <TableCell><Badge variant="secondary">L{s.level}</Badge></TableCell>
                  <TableCell>{s._count?.units ?? 0}</TableCell>
                  <TableCell>
                    <RowActions onEdit={() => openEdit(s)} onDelete={() => remove(s.id)} />
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
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit subject' : 'New subject'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Slug" hint="e.g. spanish-1">
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </Field>
              <Field label="Internal name">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
            </div>
            <Field label="Display name">
              <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Level">
                <Select value={String(form.level)} onValueChange={(v) => setForm({ ...form, level: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 — Beginner</SelectItem>
                    <SelectItem value="2">Level 2 — Intermediate</SelectItem>
                    <SelectItem value="3">Level 3 — Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Icon (emoji)">
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🇪🇸" />
              </Field>
            </div>
            <Field label="Description">
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
