import { NextRequest, NextResponse } from 'next/server';
import { makeToken, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return NextResponse.json(
      { message: 'Server is missing ADMIN_USERNAME / ADMIN_PASSWORD env vars.' },
      { status: 500 },
    );
  }

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await makeToken(username), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
