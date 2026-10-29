import type { APIRoute } from 'astro';
import { getExperience, getProfile, getProjects, getServices } from '../lib/content';

// A plain text summary for AI assistants and search tools (llmstxt.org).
export const GET: APIRoute = async ({ site }) => {
  const [profile, projects, experience, services] = await Promise.all([getProfile(), getProjects(), getExperience(), getServices()]);
  const url = (p: string) => new URL(p, site).href;
  const body = [
    `# ${profile.name}`,
    '',
    `> ${profile.role} based in ${profile.location}. ${profile.intro}`,
    '',
    ...profile.about,
    '',
    '## Projects',
    ...projects.map((p) => `- [${p.title}](${url(`/work/${p.slug}`)}): ${p.summary}`),
    '',
    '## Experience',
    ...experience.map((j) => `- ${j.role}, ${j.company} (${j.start || 'now'} to ${j.end || 'now'})`),
    '',
    '## Services',
    ...services.map((s) => `- ${s.title}: ${s.summary}`),
    '',
    '## Contact',
    `- Email: ${profile.email}`,
    `- WhatsApp: https://wa.me/${profile.whatsapp}`,
    ...profile.socials.map((s) => `- ${s.label}: ${s.url}`)
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
