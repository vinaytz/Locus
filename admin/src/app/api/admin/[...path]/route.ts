import { NextRequest, NextResponse } from 'next/server';
import { adminFetch } from '@/lib/admin-api';

// Catch-all proxy: forwards every /api/admin/* request from the browser to the
// real NestJS backend, attaching the admin token server-side. The browser
// never sees ADMIN_API_TOKEN.

async function proxy(req: NextRequest, params: { path: string[] }) {
  const path = `/admin/${params.path.join('/')}`;
  const search = req.nextUrl.search;
  const init: RequestInit = { method: req.method };
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    init.body = await req.text();
  }
  try {
    const data = await adminFetch(`${path}${search}`, init);
    return NextResponse.json(data ?? null);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message ?? 'Backend error' },
      { status: err?.status ?? 500 },
    );
  }
}

export const GET = (req: NextRequest, ctx: { params: { path: string[] } }) => proxy(req, ctx.params);
export const POST = (req: NextRequest, ctx: { params: { path: string[] } }) => proxy(req, ctx.params);
export const PUT = (req: NextRequest, ctx: { params: { path: string[] } }) => proxy(req, ctx.params);
export const PATCH = (req: NextRequest, ctx: { params: { path: string[] } }) => proxy(req, ctx.params);
export const DELETE = (req: NextRequest, ctx: { params: { path: string[] } }) => proxy(req, ctx.params);
