// Server-side admin API proxy. We deliberately keep ADMIN_API_TOKEN on the
// server only and re-export thin helpers used by route handlers.

const BASE = process.env.BACKEND_URL ?? 'http://localhost:3000';
const TOKEN = process.env.ADMIN_API_TOKEN ?? '';

export interface ApiError {
  status: number;
  message: string;
}

export async function adminFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-admin-token': TOKEN,
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch {}
    throw Object.assign(new Error(`Backend ${res.status}: ${body}`), {
      status: res.status,
    });
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
