'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Props {
  page: number;
  limit: number;
  total: number;
  onPageChange: (p: number) => void;
  onLimitChange?: (l: number) => void;
  pageSizes?: number[];
}

export function Pagination({
  page, limit, total, onPageChange, onLimitChange,
  pageSizes = [10, 20, 50, 100],
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
      <div className="text-muted-foreground">
        {total === 0 ? 'No results' : <>Showing <span className="text-foreground font-medium">{from}–{to}</span> of <span className="text-foreground font-medium">{total}</span></>}
      </div>
      <div className="flex items-center gap-4">
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Rows</span>
            <Select value={String(limit)} onValueChange={(v) => onLimitChange(Number(v))}>
              <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                {pageSizes.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="text-muted-foreground">Page {page} / {totalPages}</div>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8"
            disabled={page <= 1} onClick={() => onPageChange(1)} aria-label="First page">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8"
            disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8"
            disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8"
            disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} aria-label="Last page">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
