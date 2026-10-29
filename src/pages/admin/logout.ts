import type { APIRoute } from 'astro';
import { COOKIE } from '../../lib/auth';

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(COOKIE, { path: '/' });
  return redirect('/admin', 302);
};
