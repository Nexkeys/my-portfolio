import { createReader } from '@keystatic/core/reader';
import Markdoc from '@markdoc/markdoc';
import keystaticConfig from '../../keystatic.config';

const reader = createReader(process.cwd(), keystaticConfig);

const byOrder = <T extends { order: number | null }>(a: T, b: T) => (a.order ?? 99) - (b.order ?? 99);

export async function getProfile() {
  const profile = await reader.singletons.profile.readOrThrow();
  return profile;
}

export async function getSkills() {
  const skills = await reader.singletons.skills.read();
  return skills?.groups ?? [];
}

export async function getProjects() {
  const entries = await reader.collections.projects.all();
  return entries
    .map(({ slug, entry }) => ({ slug, ...entry }))
    .sort(byOrder);
}

export type Project = Awaited<ReturnType<typeof getProjects>>[number];

export async function getExperience() {
  const entries = await reader.collections.experience.all();
  return entries.map(({ slug, entry }) => ({ slug, ...entry })).sort(byOrder);
}

export async function getServices() {
  const entries = await reader.collections.services.all();
  return entries.map(({ slug, entry }) => ({ slug, ...entry })).sort(byOrder);
}

export async function getTestimonials() {
  const entries = await reader.collections.testimonials.all();
  return entries.map(({ slug, entry }) => ({ slug, ...entry })).sort(byOrder);
}

export async function getNotes() {
  const entries = await reader.collections.notes.all();
  return entries
    .map(({ slug, entry }) => ({ slug, ...entry }))
    .filter((n) => !n.draft)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

export async function renderBody(body: () => Promise<{ node: any }>) {
  const { node } = await body();
  const errors = Markdoc.validate(node);
  if (errors.length) console.warn(errors);
  return Markdoc.renderers.html(Markdoc.transform(node));
}

/** Headline markup: *word* becomes italic serif, [word] becomes accent. */
export function headlineHtml(text: string) {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]/g, '<span class="accent">$1</span>');
}

export function plainHeadline(text: string) {
  return text.replace(/[*[\]]/g, '');
}

export const statusLabel: Record<string, string> = {
  live: 'Live',
  'open-source': 'Open source',
  'in-progress': 'In progress',
  archived: 'Archived'
};

export function projectHref(p: { liveUrl: string | null; repoUrl: string | null }) {
  return p.liveUrl || p.repoUrl || '';
}
