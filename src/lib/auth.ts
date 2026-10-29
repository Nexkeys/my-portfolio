import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'ed_admin';
const WEEK = 60 * 60 * 24 * 7;

const env = (key: string): string | undefined =>
  (typeof process !== 'undefined' ? process.env[key] : undefined) ?? (import.meta.env as Record<string, string | undefined>)[key];

export const adminPassword = () => env('ADMIN_PASSWORD');
const secret = () => env('ADMIN_SESSION_SECRET') || `pw:${adminPassword() ?? ''}`;

const sign = (value: string) => createHmac('sha256', secret()).update(value).digest('base64url');

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function checkPassword(input: string) {
  const pw = adminPassword();
  if (!pw) return false;
  return safeEqual(sign(`pw:${input}`), sign(`pw:${pw}`));
}

export function createSession() {
  const expires = Math.floor(Date.now() / 1000) + WEEK;
  return { value: `${expires}.${sign(String(expires))}`, maxAge: WEEK };
}

export function isValidSession(token: string | undefined) {
  if (!token || !adminPassword()) return false;
  const [expires, sig] = token.split('.');
  if (!expires || !sig || Number(expires) < Date.now() / 1000) return false;
  return safeEqual(sig, sign(expires));
}
