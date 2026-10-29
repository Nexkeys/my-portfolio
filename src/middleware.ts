import { defineMiddleware } from 'astro:middleware';
import { COOKIE, adminPassword, isValidSession } from './lib/auth';

const PROTECTED = ['/keystatic', '/api/keystatic'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return next();

  // Local editing works without a password while developing on your own machine.
  if (import.meta.env.DEV && !adminPassword()) return next();

  if (isValidSession(context.cookies.get(COOKIE)?.value)) return next();

  if (pathname.startsWith('/api/')) return new Response('Unauthorized', { status: 401 });
  return context.redirect(`/admin?next=${encodeURIComponent(pathname)}`, 302);
});
