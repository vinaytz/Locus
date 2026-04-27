// Edge-runtime compatible HMAC using Web Crypto. Used by both the login route
// (Node) and the middleware (Edge), so it must avoid `node:crypto`.

const SECRET = process.env.AUTH_SECRET ?? 'dev-secret';
export const SESSION_COOKIE = 'admin_session';

const enc = new TextEncoder();

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return bufToHex(new Uint8Array(sig));
}

function bufToHex(buf: Uint8Array): string {
  let out = '';
  for (const b of buf) out += b.toString(16).padStart(2, '0');
  return out;
}

function toBase64Url(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
}

export async function makeToken(username: string): Promise<string> {
  const payload = `${username}.${Date.now()}`;
  const sig = await hmac(payload);
  return toBase64Url(`${payload}.${sig}`);
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const decoded = fromBase64Url(token);
    const parts = decoded.split('.');
    if (parts.length !== 3) return false;
    const [user, ts, sig] = parts;
    const expected = await hmac(`${user}.${ts}`);
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  } catch {
    return false;
  }
}
