import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { TermData, TermProject } from './types';
import './terminal.css';

type Line = { id: number; node: ReactNode; echo?: boolean };
type Theme = 'ember' | 'amber' | 'matrix' | 'paper';
type Flow = {
  step: number;
  values: string[];
};

const THEMES: Theme[] = ['ember', 'amber', 'matrix', 'paper'];
const USER = 'guest';
const HOST = 'ernest';

const BANNER = String.raw`███████ ██████  ███    ██ ███████ ███████ ████████
██      ██   ██ ████   ██ ██      ██         ██
█████   ██████  ██ ██  ██ █████   ███████    ██
██      ██   ██ ██  ██ ██ ██           ██    ██
███████ ██   ██ ██   ████ ███████ ███████    ██`;

const LOGO = String.raw`  ▄▄▄▄▄▄▄▄
  █▀▀▀▀▀▀▀
  █▄▄▄▄▄
  █▀▀▀▀▀
  █▄▄▄▄▄▄▄
  ▀▀▀▀▀▀▀▀`;

const FLOW_PROMPTS = [
  'your name',
  'what are we building? (subject)',
  'tell me a bit more',
  'send with email or whatsapp? [e/w]'
];

const LEVEL: Record<string, number> = { expert: 10, strong: 8, solid: 6, learning: 3 };

function clock(tz: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date());
  } catch {
    return new Date().toTimeString().slice(0, 5);
  }
}

function pad(s: string, n: number) {
  return s.length >= n ? s + ' ' : s + ' '.repeat(n - s.length);
}

function setMode(mode: 'techie' | 'normal') {
  (window as any).edSetMode?.(mode);
}

export default function Terminal({ data }: { data: TermData }) {
  const { profile, projects, experience, skills, services, notes } = data;
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('~');
  const [theme, setTheme] = useState<Theme>('ember');
  const [flow, setFlow] = useState<Flow | null>(null);
  const [booting, setBooting] = useState(false);
  const [time, setTime] = useState(() => clock(profile.timezone));
  const [matrix, setMatrix] = useState(false);
  const historyRef = useRef<string[]>([]);
  const histIdx = useRef(-1);
  const idRef = useRef(0);
  const booted = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const execRef = useRef<(cmd: string) => void>(() => {});

  const bySlug = useMemo(() => new Map(projects.map((p) => [p.slug, p])), [projects]);
  const jobBySlug = useMemo(() => new Map(experience.map((j) => [j.slug, j])), [experience]);

  const push = useCallback((node: ReactNode, echo = false) => {
    setLines((l) => [...l, { id: ++idRef.current, node, echo }]);
  }, []);

  /* ---------- mode wiring ---------- */
  useEffect(() => {
    const onMode = (e: Event) => setOpen((e as CustomEvent).detail === 'techie');
    window.addEventListener('ed:mode', onMode);
    if ((window as any).edMode === 'techie') setOpen(true);
    try {
      const saved = localStorage.getItem('ed-term-theme') as Theme | null;
      if (saved && THEMES.includes(saved)) setTheme(saved);
    } catch {}
    return () => window.removeEventListener('ed:mode', onMode);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setTime(clock(profile.timezone)), 15000);
    return () => clearInterval(t);
  }, [open, profile.timezone]);

  /* keep the terminal sized to the visible viewport, so the mobile keyboard never covers the prompt */
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    const fit = () => {
      if (rootRef.current) rootRef.current.style.height = `${vv ? vv.height : window.innerHeight}px`;
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    };
    fit();
    vv?.addEventListener('resize', fit);
    window.addEventListener('resize', fit);
    return () => {
      vv?.removeEventListener('resize', fit);
      window.removeEventListener('resize', fit);
    };
  }, [open]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, booting]);

  useEffect(() => {
    if (open && !booting) inputRef.current?.focus({ preventScroll: true });
  }, [open, booting]);

  /* ---------- small output primitives ---------- */
  const Run = ({ cmd, children }: { cmd: string; children?: ReactNode }) => (
    <button type="button" className="t-run" onClick={() => execRef.current(cmd)}>
      {children ?? cmd}
    </button>
  );

  const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
    <a className="t-link" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span aria-hidden="true"> ↗</span>
    </a>
  );

  const ProjectCard = ({ p }: { p: TermProject }) => (
    <div className="t-card">
      <div className="t-card-head">
        <span className="t-strong">{p.title}</span>
        <span className="t-mute">
          {p.category} · {p.year}
        </span>
        <span className={`t-status s-${p.status}`}>● {p.status.replace('-', ' ')}</span>
      </div>
      <div className="t-mute">{p.tagline}</div>
      <p className="t-p">{p.summary}</p>
      {p.highlights.length > 0 && (
        <ul className="t-list">
          {p.highlights.map((h) => (
            <li key={h}>
              <span className="t-accent">›</span> {h}
            </li>
          ))}
        </ul>
      )}
      <div className="t-kv">
        <span className="t-mute">role </span>
        {p.role}
      </div>
      <div className="t-kv">
        <span className="t-mute">stack</span> {p.stack.join(', ')}
      </div>
      <div className="t-actions">
        {p.liveUrl && <Ext href={p.liveUrl}>live site</Ext>}
        {p.repoUrl && <Ext href={p.repoUrl}>source</Ext>}
        {p.links.map((l) => (
          <Ext key={l.url} href={l.url}>
            {l.label.toLowerCase()}
          </Ext>
        ))}
        <a className="t-link" href={`/work/${p.slug}`} onClick={() => setMode('normal')}>
          case study
        </a>
      </div>
    </div>
  );

  const projectRows = (list: TermProject[]) => (
    <div className="t-grid">
      {list.map((p) => (
        <div className="t-row" key={p.slug}>
          <Run cmd={`open ${p.slug}`}>{p.slug}/</Run>
          <span className="t-dim-on-mobile">{p.tagline}</span>
          <span className={`t-status s-${p.status}`}>
            {p.status === 'live' ? '● live' : p.status === 'open-source' ? '◆ oss' : p.status === 'in-progress' ? '◐ wip' : '○ arch'}
          </span>
        </div>
      ))}
    </div>
  );

  /* ---------- filesystem ---------- */
  const fs = useMemo(() => {
    const root = ['about.md', 'contact.md', 'cv.pdf', 'skills.json', 'services.md', 'projects/', 'experience/'];
    if (notes.length) root.push('notes/');
    return {
      '~': root,
      '~/projects': projects.map((p) => `${p.slug}.md`),
      '~/experience': experience.map((j) => `${j.slug}.log`),
      '~/notes': notes.map((n) => `${n.slug}.md`)
    } as Record<string, string[]>;
  }, [projects, experience, notes]);

  const resolve = (arg: string) => {
    const clean = arg.replace(/^\.\//, '').replace(/\/$/, '');
    if (clean === '~' || clean === '') return '~';
    if (clean === '..') return '~';
    if (clean.startsWith('~/')) return clean;
    return cwd === '~' ? `~/${clean}` : `${cwd}/${clean}`;
  };

  /* ---------- content renderers ---------- */
  const about = () => (
    <div className="t-block">
      <div className="t-h"># about.md</div>
      {profile.about.map((p, i) => (
        <p className="t-p" key={i}>
          {p}
        </p>
      ))}
    </div>
  );

  const contact = () => (
    <div className="t-block">
      <div className="t-h"># contact.md</div>
      <div className="t-kv">
        <span className="t-mute">{pad('email', 10)}</span>
        <a className="t-link" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
      </div>
      <div className="t-kv">
        <span className="t-mute">{pad('whatsapp', 10)}</span>
        <Ext href={`https://wa.me/${profile.whatsapp}`}>{profile.phone}</Ext>
      </div>
      {profile.bookingUrl && (
        <div className="t-kv">
          <span className="t-mute">{pad('call', 10)}</span>
          <Ext href={profile.bookingUrl}>book a call</Ext>
        </div>
      )}
      <div className="t-kv">
        <span className="t-mute">{pad('based', 10)}</span>
        {profile.location} · {time} local
      </div>
      <div className="t-gap" />
      <div className="t-mute">
        or run <Run cmd="hire" /> to write a message right here.
      </div>
    </div>
  );

  const skillBars = () => (
    <div className="t-block">
      {skills.map((g) => (
        <div key={g.name} className="t-skillgroup">
          <div className="t-h">{g.name.toLowerCase()}</div>
          {g.items.map((s) => {
            const n = LEVEL[s.level] ?? 5;
            return (
              <div className="t-bar-row" key={s.name}>
                <span className="t-bar-name">{s.name.toLowerCase()}</span>
                <span className="t-bar" aria-hidden="true">
                  <span className="t-bar-fill">{'█'.repeat(n)}</span>
                  <span className="t-bar-empty">{'░'.repeat(10 - n)}</span>
                </span>
                <span className="t-mute">{s.level}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const experienceList = () => (
    <div className="t-block">
      {experience.map((j) => (
        <div key={j.slug} className="t-job">
          <div>
            <span className="t-accent">{pad(`${j.start || 'now'} to ${j.end || 'now'}`, 22)}</span>
            <Run cmd={`cat experience/${j.slug}.log`}>
              <span className="t-strong">{j.company}</span>
            </Run>
          </div>
          <div className="t-mute t-indent">{j.role}</div>
        </div>
      ))}
    </div>
  );

  const jobDetail = (slug: string) => {
    const j = jobBySlug.get(slug);
    if (!j) return null;
    return (
      <div className="t-block">
        <div>
          <span className="t-strong">{j.company}</span> <span className="t-mute">· {j.role}</span>
        </div>
        <div className="t-mute">
          {j.start || 'now'} to {j.end || 'now'} · {j.location}
        </div>
        <ul className="t-list">
          {j.points.map((p) => (
            <li key={p}>
              <span className="t-accent">›</span> {p}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const servicesList = () => (
    <div className="t-block">
      {services.map((s, i) => (
        <div key={s.title} className="t-svc">
          <div>
            <span className="t-accent">{String(i + 1).padStart(2, '0')}</span> <span className="t-strong">{s.title}</span>
          </div>
          <div className="t-indent t-p">{s.summary}</div>
          <div className="t-indent t-mute">{s.includes.join(' · ')}</div>
        </div>
      ))}
    </div>
  );

  const neofetch = () => (
    <div className="t-neo">
      <pre className="t-logo" aria-hidden="true">
        {LOGO}
      </pre>
      <div>
        <div>
          <span className="t-accent">{USER}</span>@<span className="t-accent">{HOST}</span>
        </div>
        <div className="t-mute">{'-'.repeat(18)}</div>
        {[
          ['name', profile.name],
          ['role', profile.role],
          ['host', 'NexKeys'],
          ['location', profile.location],
          ['uptime', `${profile.stats[0]?.value ?? 6}+ years shipping`],
          ['packages', `${projects.length} projects`],
          ['editor', 'Dahl Studio'],
          ['shell', 'portfolio-sh 2.0'],
          ['status', profile.available ? 'available for work' : 'heads down']
        ].map(([k, v]) => (
          <div key={k}>
            <span className="t-accent">{pad(k, 10)}</span>
            {v}
          </div>
        ))}
        <div className="t-swatches" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );

  /* ---------- commands ---------- */
  type Cmd = { desc: string; run: (args: string[], raw: string) => ReactNode | void; hidden?: boolean; args?: () => string[] };

  const startFlow = () => {
    setFlow({ step: 0, values: [] });
    push(
      <div className="t-block">
        <div>
          <span className="t-accent">hire</span> · four quick questions. <span className="t-mute">ctrl+c to cancel</span>
        </div>
      </div>
    );
  };

  const commands: Record<string, Cmd> = {
    help: {
      desc: 'list every command',
      run: () => (
        <div className="t-help">
          {Object.entries(commands)
            .filter(([, c]) => !c.hidden)
            .map(([name, c]) => (
              <div className="t-row t-row-help" key={name}>
                <Run cmd={name} />
                <span className="t-mute">{c.desc}</span>
              </div>
            ))}
          <div className="t-gap" />
          <div className="t-mute">
            tab completes · ↑ ↓ history · ctrl+l clears · there may be a few hidden commands.
          </div>
        </div>
      )
    },
    whoami: {
      desc: 'the short version',
      run: () => (
        <div>
          {profile.name} <span className="t-mute">//</span> {profile.role.toLowerCase()} <span className="t-mute">//</span>{' '}
          {profile.location}
          <div className="t-p">{profile.intro}</div>
        </div>
      )
    },
    about: { desc: 'the longer version', run: () => about() },
    projects: {
      desc: 'featured work, add --all for everything',
      run: (args) => {
        const all = args.includes('--all') || args.includes('-a');
        const list = all ? projects : projects.filter((p) => p.featured);
        return (
          <div className="t-block">
            {projectRows(list)}
            <div className="t-gap" />
            <div className="t-mute">
              {all ? `${projects.length} projects. ` : `${list.length} featured of ${projects.length}. run `}
              {!all && <Run cmd="projects --all" />}
              {!all && ' for the rest. '}
              click a name or run <span className="t-strong">open &lt;name&gt;</span>
            </div>
          </div>
        );
      }
    },
    open: {
      desc: 'open a project, for example open sellapage',
      args: () => projects.map((p) => p.slug),
      run: (args) => {
        const slug = (args[0] || '').replace(/\/$/, '').replace(/\.md$/, '').replace(/^projects\//, '');
        const p = bySlug.get(slug);
        if (!slug) return <span className="t-err">usage: open &lt;project&gt;. try {projects[0]?.slug}</span>;
        if (!p) return <span className="t-err">open: no project named "{slug}". run projects --all</span>;
        return <ProjectCard p={p} />;
      }
    },
    experience: { desc: 'where I have worked', run: () => experienceList() },
    skills: { desc: 'what I work with', run: () => skillBars() },
    services: { desc: 'what I can build for you', run: () => servicesList() },
    contact: { desc: 'every way to reach me', run: () => contact() },
    hire: { desc: 'write me a message from here', run: () => startFlow() },
    email: {
      desc: 'open your mail app',
      run: () => {
        window.location.href = `mailto:${profile.email}`;
        return <span className="t-ok">opening mail to {profile.email}</span>;
      }
    },
    whatsapp: {
      desc: 'chat on WhatsApp',
      run: () => {
        window.open(`https://wa.me/${profile.whatsapp}`, '_blank', 'noopener');
        return <span className="t-ok">opening WhatsApp</span>;
      }
    },
    cv: {
      desc: 'download my CV',
      run: () =>
        profile.cvUrl ? (
          <div>
            <a className="t-link" href={profile.cvUrl} download>
              download cv.pdf
            </a>{' '}
            <span className="t-mute">or</span> <Ext href={profile.cvUrl}>view it</Ext>
          </div>
        ) : (
          <span className="t-mute">cv not uploaded yet</span>
        )
    },
    socials: {
      desc: 'find me online',
      run: () => (
        <div className="t-block">
          {profile.socials.map((s) => (
            <div key={s.url}>
              <span className="t-mute">{pad(s.label.toLowerCase(), 11)}</span>
              <Ext href={s.url}>{s.url.replace(/^https?:\/\/(www\.)?/, '')}</Ext>
            </div>
          ))}
        </div>
      )
    },
    github: { desc: 'live stats from GitHub', run: () => <GithubOut user={profile.github} /> },
    notes: {
      desc: 'things I have written',
      hidden: notes.length === 0,
      run: () => (
        <div className="t-block">
          {notes.map((n) => (
            <div key={n.slug}>
              <span className="t-mute">{n.date} </span>
              <a className="t-link" href={`/notes/${n.slug}`} onClick={() => setMode('normal')}>
                {n.title}
              </a>
            </div>
          ))}
        </div>
      )
    },
    neofetch: { desc: 'system info, portfolio edition', run: () => neofetch() },
    ls: {
      desc: 'list files',
      args: () => ['projects', 'experience', ...(notes.length ? ['notes'] : [])],
      run: (args) => {
        const target = resolve(args.find((a) => !a.startsWith('-')) || '.');
        const dir = target === '~/.' || target === `${cwd}/.` ? cwd : target;
        const list = fs[dir];
        if (!list) return <span className="t-err">ls: {args[0]}: no such directory</span>;
        if (dir === '~/projects') return projectRows(projects);
        return (
          <div className="t-ls">
            {list.map((f) =>
              f.endsWith('/') ? (
                <Run key={f} cmd={`cd ${f}`}>
                  <span className="t-dir">{f}</span>
                </Run>
              ) : (
                <Run key={f} cmd={`cat ${dir === '~' ? '' : dir.slice(2) + '/'}${f}`}>
                  {f}
                </Run>
              )
            )}
          </div>
        );
      }
    },
    cd: {
      desc: 'change directory',
      args: () => ['projects', 'experience', '..', '~', ...(notes.length ? ['notes'] : [])],
      run: (args) => {
        const target = resolve(args[0] || '~');
        if (!fs[target]) return <span className="t-err">cd: {args[0]}: no such directory</span>;
        setCwd(target);
      }
    },
    pwd: { desc: 'where am I', run: () => <span>{cwd.replace('~', '/home/guest')}</span> },
    cat: {
      desc: 'read a file',
      args: () => [...fs[cwd], ...(cwd === '~' ? projects.map((p) => `projects/${p.slug}.md`) : [])],
      run: (args) => {
        const arg = args[0];
        if (!arg) return <span className="t-err">usage: cat &lt;file&gt;</span>;
        const path = resolve(arg);
        const name = path.split('/').pop() || '';
        if (path.startsWith('~/projects/')) {
          const p = bySlug.get(name.replace(/\.md$/, ''));
          if (p) return <ProjectCard p={p} />;
        }
        if (path.startsWith('~/experience/')) {
          const out = jobDetail(name.replace(/\.log$/, ''));
          if (out) return out;
        }
        if (path.startsWith('~/notes/')) {
          const n = notes.find((x) => `${x.slug}.md` === name);
          if (n)
            return (
              <div className="t-block">
                <div className="t-strong">{n.title}</div>
                <p className="t-p">{n.excerpt}</p>
                <a className="t-link" href={`/notes/${n.slug}`} onClick={() => setMode('normal')}>
                  read the full note
                </a>
              </div>
            );
        }
        switch (path) {
          case '~/about.md':
            return about();
          case '~/contact.md':
            return contact();
          case '~/services.md':
            return servicesList();
          case '~/skills.json':
            return (
              <pre className="t-pre">
                {JSON.stringify(
                  Object.fromEntries(skills.map((g) => [g.name, g.items.map((i) => i.name)])),
                  null,
                  2
                )}
              </pre>
            );
          case '~/cv.pdf':
            return (
              <span>
                <span className="t-mute">binary file. </span>
                <Run cmd="cv">run cv</Run>
              </span>
            );
        }
        if (fs[path]) return <span className="t-err">cat: {arg}: is a directory</span>;
        return <span className="t-err">cat: {arg}: no such file</span>;
      }
    },
    tree: {
      desc: 'everything at once',
      run: () => (
        <pre className="t-pre">
          {'~\n' +
            fs['~']
              .map((f, i, a) => {
                const last = i === a.length - 1;
                const branch = last ? '└── ' : '├── ';
                const dir = f.endsWith('/') ? fs[`~/${f.slice(0, -1)}`] : null;
                const kids = dir
                  ? dir.map((k, j) => `${last ? '    ' : '│   '}${j === dir.length - 1 ? '└── ' : '├── '}${k}`).join('\n')
                  : '';
                return branch + f + (kids ? '\n' + kids : '');
              })
              .join('\n')}
        </pre>
      )
    },
    theme: {
      desc: `switch colours: ${THEMES.join(', ')}`,
      args: () => THEMES,
      run: (args) => {
        const next = (args[0] as Theme) || THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
        if (!THEMES.includes(next)) return <span className="t-err">theme: pick one of {THEMES.join(', ')}</span>;
        setTheme(next);
        try {
          localStorage.setItem('ed-term-theme', next);
        } catch {}
        return <span className="t-ok">theme set to {next}</span>;
      }
    },
    history: {
      desc: 'what you typed',
      run: () => (
        <div>
          {historyRef.current.map((h, i) => (
            <div key={i}>
              <span className="t-mute">{String(i + 1).padStart(3, ' ')} </span>
              {h}
            </div>
          ))}
        </div>
      )
    },
    date: { desc: 'time in Lagos', run: () => <span>{new Date().toLocaleString('en-GB', { timeZone: profile.timezone, dateStyle: 'full', timeStyle: 'short' })} (Lagos)</span> },
    echo: { desc: 'say something', hidden: true, run: (_a, raw) => <span>{raw.replace(/^echo\s*/, '')}</span> },
    clear: { desc: 'clear the screen', run: () => setLines([]) },
    man: {
      desc: 'manual for a command',
      args: () => Object.keys(commands),
      run: (args) => {
        const c = commands[args[0] || ''];
        if (!c) return <span className="t-err">what manual page do you want? try man open</span>;
        return (
          <div>
            <span className="t-strong">{args[0]}</span> <span className="t-mute">· {c.desc}</span>
          </div>
        );
      }
    },
    gui: {
      desc: 'switch to the visual site',
      run: () => {
        setTimeout(() => setMode('normal'), 250);
        return <span className="t-ok">switching to the visual site...</span>;
      }
    },
    exit: { desc: 'leave the terminal', hidden: true, run: () => commands.gui.run([], '') },
    sudo: {
      desc: '',
      hidden: true,
      run: (args) => {
        if (args.join(' ').startsWith('hire')) {
          startFlow();
          return;
        }
        return (
          <span className="t-err">
            {USER} is not in the sudoers file. this incident will be reported to {profile.shortName.toLowerCase()}.
          </span>
        );
      }
    },
    rm: {
      desc: '',
      hidden: true,
      run: () => <span className="t-err">nice try. everything here is backed up on GitHub anyway.</span>
    },
    vim: { desc: '', hidden: true, run: () => <span className="t-mute">you are now stuck in vim. just kidding, type anything.</span> },
    coffee: {
      desc: '',
      hidden: true,
      run: () => (
        <pre className="t-pre">{`   ( (\n    ) )\n  ........\n  |      |]\n  \\      /\n   \`----'   brewing. good code needs coffee.`}</pre>
      )
    },
    matrix: {
      desc: '',
      hidden: true,
      run: () => {
        setMatrix(true);
        setTimeout(() => setMatrix(false), 4200);
        return <span className="t-ok">wake up, {USER}...</span>;
      }
    },
    ping: { desc: '', hidden: true, run: () => <span>pong. {profile.shortName.toLowerCase()} usually replies within a day.</span> },
    banner: { desc: '', hidden: true, run: () => <Banner /> }
  };

  const Banner = () => (
    <pre className="t-banner" aria-label={profile.name}>
      {BANNER}
    </pre>
  );

  /* ---------- hire flow ---------- */
  const advanceFlow = (value: string) => {
    if (!flow) return;
    const prompt = FLOW_PROMPTS[flow.step];
    push(
      <div>
        <span className="t-accent">? </span>
        <span className="t-mute">{prompt} › </span>
        {value}
      </div>,
      true
    );
    if (!value.trim() && flow.step < 3) {
      push(<span className="t-err">this one is needed, try again.</span>);
      return;
    }
    const values = [...flow.values, value.trim()];
    if (flow.step < 3) {
      setFlow({ step: flow.step + 1, values });
      return;
    }
    const via = value.trim().toLowerCase();
    if (!['e', 'w', 'email', 'whatsapp'].includes(via)) {
      push(<span className="t-err">type e for email or w for whatsapp.</span>);
      return;
    }
    const [name, subject, message] = values;
    const body = `${message}\n\n${name}`;
    setFlow(null);
    if (via.startsWith('w')) {
      const text = `Hi ${profile.shortName}, I'm ${name}.\n\n*${subject}*\n${message}`;
      window.open(`https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      push(<span className="t-ok">✓ WhatsApp opened with your message. just press send.</span>);
    } else {
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      push(<span className="t-ok">✓ your mail app is open with everything filled in. just press send.</span>);
    }
  };

  /* ---------- execution ---------- */
  const promptNode = (cmd: string, dir = cwd) => (
    <div className="t-echo">
      <span className="t-user">
        {USER}@{HOST}
      </span>{' '}
      <span className="t-cwd">{dir}</span> <span className="t-sym">$</span> {cmd}
    </div>
  );

  const execute = (raw: string) => {
    const cmdline = raw.trim();
    push(promptNode(cmdline), true);
    if (!cmdline) return;
    historyRef.current = [...historyRef.current.filter((h) => h !== cmdline), cmdline].slice(-50);
    histIdx.current = -1;
    const [name, ...args] = cmdline.split(/\s+/);
    const key = name.toLowerCase();
    const c = commands[key];
    if (!c) {
      const near = Object.keys(commands).find((k) => !commands[k].hidden && (k.startsWith(key.slice(0, 2)) || key.startsWith(k)));
      // plain project names work as a shortcut for open
      if (bySlug.has(key.replace(/\/$/, ''))) {
        push(<ProjectCard p={bySlug.get(key.replace(/\/$/, ''))!} />);
        return;
      }
      push(
        <span className="t-err">
          command not found: {name}.{' '}
          {near ? (
            <>
              did you mean <Run cmd={near} />?
            </>
          ) : (
            <>
              try <Run cmd="help" />
            </>
          )}
        </span>
      );
      return;
    }
    const out = c.run(args, cmdline);
    if (out !== undefined && out !== null) push(out);
  };

  execRef.current = execute;

  /* ---------- boot ---------- */
  useEffect(() => {
    if (!open || booted.current) return;
    booted.current = true;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const steps: ReactNode[] = [
      <span>
        <span className="t-ok">[ ok ]</span> mounting /home/{USER}
      </span>,
      <span>
        <span className="t-ok">[ ok ]</span> indexing {projects.length} projects, {experience.length} roles
      </span>,
      <span>
        <span className="t-ok">[ ok ]</span> linking github.com/{profile.github}
      </span>,
      <span>
        <span className="t-ok">[ ok ]</span> session ready
      </span>
    ];
    const timers: number[] = [];
    const skip = () => {
      timers.forEach(clearTimeout);
      welcome();
    };
    const welcome = () => {
      window.removeEventListener('keydown', skip);
      setLines([]);
      push(<Banner />);
      push(
        <div className="t-mute">
          last login: {new Date().toDateString().toLowerCase()} from your browser
        </div>
      );
      push(
        <div className="t-welcome">
          welcome. I'm {profile.shortName}, {profile.role.toLowerCase()} in {profile.location.split(',')[0]}.
          <br />
          start with <Run cmd="help" />, <Run cmd="projects" />, <Run cmd="neofetch" /> or <Run cmd="hire" />.
        </div>
      );
      setBooting(false);
    };
    if (reduce) {
      welcome();
      return;
    }
    setBooting(true);
    steps.forEach((s, i) => timers.push(window.setTimeout(() => push(s), 110 + i * 150)));
    timers.push(window.setTimeout(welcome, 110 + steps.length * 150 + 180));
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ---------- keyboard ---------- */
  const complete = () => {
    const parts = input.split(/\s+/);
    if (parts.length <= 1) {
      const opts = Object.keys(commands).filter((k) => !commands[k].hidden && k.startsWith(parts[0]));
      if (opts.length === 1) setInput(opts[0] + ' ');
      else if (opts.length > 1) {
        push(promptNode(input), true);
        push(<div className="t-ls">{opts.map((o) => <span key={o}>{o}</span>)}</div>);
      }
      return;
    }
    const c = commands[parts[0]];
    const pool = c?.args?.() ?? [];
    const last = parts[parts.length - 1];
    const opts = pool.filter((o) => o.startsWith(last));
    if (opts.length === 1) setInput([...parts.slice(0, -1), opts[0]].join(' ') + (opts[0].endsWith('/') ? '' : ' '));
    else if (opts.length > 1) {
      push(promptNode(input), true);
      push(<div className="t-ls">{opts.map((o) => <span key={o}>{o}</span>)}</div>);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = input;
      setInput('');
      if (flow) advanceFlow(v);
      else execute(v);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (!flow) complete();
    } else if (e.key === 'ArrowUp' && !flow) {
      e.preventDefault();
      const h = historyRef.current;
      if (!h.length) return;
      histIdx.current = histIdx.current < 0 ? h.length - 1 : Math.max(0, histIdx.current - 1);
      setInput(h[histIdx.current]);
    } else if (e.key === 'ArrowDown' && !flow) {
      e.preventDefault();
      const h = historyRef.current;
      if (histIdx.current < 0) return;
      histIdx.current += 1;
      if (histIdx.current >= h.length) {
        histIdx.current = -1;
        setInput('');
      } else setInput(h[histIdx.current]);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === 'c' && e.ctrlKey && !window.getSelection()?.toString()) {
      e.preventDefault();
      push(promptNode(input + '^C'), true);
      setInput('');
      if (flow) {
        setFlow(null);
        push(<span className="t-mute">cancelled.</span>);
      }
    }
  };

  const focusInput = () => {
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus({ preventScroll: true });
  };

  if (!open) return null;

  const featured = projects.filter((p) => p.featured).slice(0, 6);
  const chips = ['help', 'projects', 'about', 'experience', 'skills', 'services', 'contact', 'hire', 'neofetch', 'gui'];

  return (
    <div
      ref={rootRef}
      className={`term theme-${theme}`}
      role="dialog"
      aria-modal="true"
      aria-label="Terminal version of the site"
      data-lenis-prevent
    >
      <header className="term-bar">
        <div className="term-tabs">
          <span className="term-tab on">
            {USER}@{HOST}: {cwd}
          </span>
          <span className="term-tab hide-sm">{flow ? 'hire' : 'zsh'}</span>
        </div>
        <div className="term-tools">
          <button type="button" onClick={() => execute('theme')} className="term-tool" title="Cycle colour theme">
            theme
          </button>
          <button type="button" onClick={() => setMode('normal')} className="term-tool term-gui" title="Switch to the visual site">
            <span className="hide-sm">visual site</span>
            <span className="show-sm">gui</span>
            <span aria-hidden="true"> ×</span>
          </button>
        </div>
      </header>

      <div className="term-body">
        <div className="term-main" onClick={focusInput}>
          <div className="term-scroll" ref={scrollRef} role="log" aria-live="polite">
            {lines.map((l) => (
              <div key={l.id} className={l.echo ? 'term-line echo' : 'term-line'}>
                {l.node}
              </div>
            ))}
            {!booting && (
              <label className="term-input-row">
                {flow ? (
                  <span className="t-flow">
                    <span className="t-accent">? </span>
                    <span className="t-mute">{FLOW_PROMPTS[flow.step]} › </span>
                  </span>
                ) : (
                  <span className="t-prompt">
                    <span className="t-user">
                      {USER}@{HOST}
                    </span>{' '}
                    <span className="t-cwd">{cwd}</span> <span className="t-sym">$</span>
                  </span>
                )}
                <span className="term-input-wrap">
                  <input
                    ref={inputRef}
                    className="term-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKey}
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    enterKeyHint="send"
                    aria-label={flow ? FLOW_PROMPTS[flow.step] : 'Type a command'}
                  />
                  <span className="term-ghost" aria-hidden="true">
                    {input}
                    <span className="term-caret" />
                  </span>
                </span>
              </label>
            )}
          </div>
          <nav className="term-chips" aria-label="Quick commands">
            {chips.map((c) => (
              <button
                type="button"
                key={c}
                onClick={(e) => {
                  e.stopPropagation();
                  if (flow) return;
                  execute(c);
                }}
              >
                {c}
              </button>
            ))}
          </nav>
        </div>

        <aside className="term-side" aria-label="Status">
          <section>
            <h2>status</h2>
            <p>
              <span className={profile.available ? 't-live' : 't-mute'}>●</span>{' '}
              {profile.available ? profile.availabilityNote.toLowerCase() : 'not taking new work'}
            </p>
            <p className="t-mute">
              {profile.location.split(',')[0].toLowerCase()} · {time}
            </p>
          </section>
          <section>
            <h2>featured</h2>
            {featured.map((p) => (
              <p key={p.slug}>
                <Run cmd={`open ${p.slug}`}>{p.slug}</Run>
              </p>
            ))}
          </section>
          <section>
            <h2>try</h2>
            {['neofetch', 'cat about.md', 'ls projects', 'sudo hire ernest', 'theme matrix'].map((c) => (
              <p key={c}>
                <Run cmd={c} />
              </p>
            ))}
          </section>
          <section>
            <h2>keys</h2>
            <p className="t-mute">tab · complete</p>
            <p className="t-mute">↑ ↓ · history</p>
            <p className="t-mute">ctrl l · clear</p>
            <p className="t-mute">ctrl k · palette</p>
          </section>
        </aside>
      </div>

      <footer className="term-status">
        <span className="st-mode">{flow ? 'HIRE' : 'GUEST'}</span>
        <span className="st-seg">{cwd}</span>
        <span className="st-seg hide-sm">⎇ main</span>
        <span className="st-grow" />
        <span className="st-seg hide-sm">{theme}</span>
        <span className="st-seg">
          <span className={profile.available ? 't-live' : 't-mute'}>●</span> {time} wat
        </span>
      </footer>

      {matrix && <MatrixRain />}
    </div>
  );
}

function GithubOut({ user }: { user: string }) {
  const [state, setState] = useState<{ status: 'load' | 'ok' | 'err'; u?: any; repos?: any[] }>({ status: 'load' });
  useEffect(() => {
    let live = true;
    Promise.all([
      fetch(`https://api.github.com/users/${user}`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=6`).then((r) => (r.ok ? r.json() : Promise.reject()))
    ])
      .then(([u, repos]) => live && setState({ status: 'ok', u, repos }))
      .catch(() => live && setState({ status: 'err' }));
    return () => {
      live = false;
    };
  }, [user]);
  if (state.status === 'load') return <span className="t-mute">fetching github.com/{user}...</span>;
  if (state.status === 'err')
    return (
      <span className="t-err">
        github is rate limiting this browser right now. see{' '}
        <a className="t-link" href={`https://github.com/${user}`} target="_blank" rel="noopener noreferrer">
          github.com/{user}
        </a>
      </span>
    );
  const { u, repos = [] } = state;
  return (
    <div className="t-block">
      <div>
        <span className="t-strong">{u.login}</span> <span className="t-mute">· {u.public_repos} public repos · {u.followers} followers</span>
      </div>
      <div className="t-gap" />
      <div className="t-mute">recently pushed</div>
      {repos.map((r: any) => (
        <div className="t-row" key={r.id}>
          <a className="t-link" href={r.html_url} target="_blank" rel="noopener noreferrer">
            {r.name}
          </a>
          <span className="t-mute">{r.language ?? ''}</span>
          <span className="t-mute">{new Date(r.pushed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
      ))}
    </div>
  );
}

function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = c.offsetWidth * dpr;
    c.height = c.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const size = 14;
    const cols = Math.ceil(c.offsetWidth / size);
    const drops = Array.from({ length: cols }, () => Math.random() * -50);
    const chars = 'アイウエオカキクケコサシスセソ01ERNEST<>/{}';
    let raf = 0;
    const draw = () => {
      ctx.fillStyle = 'rgba(5,8,5,0.14)';
      ctx.fillRect(0, 0, c.offsetWidth, c.offsetHeight);
      ctx.fillStyle = '#5fd38d';
      ctx.font = `${size}px monospace`;
      drops.forEach((y, i) => {
        ctx.fillText(chars[(Math.random() * chars.length) | 0], i * size, y * size);
        drops[i] = y * size > c.offsetHeight && Math.random() > 0.975 ? 0 : y + 1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="term-matrix" aria-hidden="true" />;
}
