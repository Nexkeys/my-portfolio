export interface TermProject {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  category: string;
  role: string;
  year: string;
  status: string;
  client: boolean;
  featured: boolean;
  liveUrl: string;
  repoUrl: string;
  links: { label: string; url: string }[];
  stack: string[];
  highlights: string[];
}

export interface TermJob {
  slug: string;
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  points: string[];
}

export interface TermData {
  profile: {
    name: string;
    shortName: string;
    role: string;
    intro: string;
    about: string[];
    location: string;
    timezone: string;
    available: boolean;
    availabilityNote: string;
    email: string;
    phone: string;
    whatsapp: string;
    bookingUrl: string;
    github: string;
    socials: { label: string; url: string }[];
    stats: { value: number; suffix: string; label: string }[];
    cvUrl: string;
  };
  projects: TermProject[];
  experience: TermJob[];
  skills: { name: string; items: { name: string; level: string }[] }[];
  services: { title: string; summary: string; includes: string[] }[];
  notes: { slug: string; title: string; date: string; excerpt: string }[];
}
