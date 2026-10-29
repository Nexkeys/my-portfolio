import type { APIRoute } from 'astro';
import { getNotes, getProfile } from '../lib/content';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  const [notes, profile] = await Promise.all([getNotes(), getProfile()]);
  const items = notes
    .map(
      (n) => `<item><title>${esc(n.title)}</title><link>${new URL(`/notes/${n.slug}`, site).href}</link><guid>${new URL(`/notes/${n.slug}`, site).href}</guid>${n.date ? `<pubDate>${new Date(n.date).toUTCString()}</pubDate>` : ''}<description>${esc(n.excerpt)}</description></item>`
    )
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(profile.name)}, notes</title><link>${site}</link><description>${esc(profile.seoDescription)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
