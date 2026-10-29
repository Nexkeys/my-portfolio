import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

declare global {
  interface Window {
    edMode: 'techie' | 'normal';
    edSetMode: (mode: 'techie' | 'normal') => void;
  }
}

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- smooth scroll ---------- */
const lenis = reduce ? null : new Lenis({ duration: 1.1, anchors: { offset: -72 }, autoRaf: false });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const lock = (on: boolean) => {
  if (on) lenis?.stop();
  else lenis?.start();
  document.body.style.overflow = on ? 'hidden' : '';
};

/* ---------- modes ---------- */
const gate = document.querySelector<HTMLElement>('[data-gate]');
let introPlayed = false;

function setMode(mode: 'techie' | 'normal') {
  window.edMode = mode;
  try {
    sessionStorage.setItem('ed-mode', mode);
  } catch {}
  const gateOpen = root.dataset.gate === 'open';
  if (mode === 'techie') {
    root.dataset.mode = 'techie';
    lock(true);
  } else {
    delete root.dataset.mode;
    lock(false);
  }
  window.dispatchEvent(new CustomEvent('ed:mode', { detail: mode }));
  if (gateOpen) closeGate(mode === 'normal');
  else if (mode === 'normal') playIntro();
}
window.edSetMode = setMode;

function closeGate(intro: boolean) {
  if (!gate) return;
  const done = () => {
    delete root.dataset.gate;
    gsap.set(gate, { clearProps: 'all' });
    if (intro) playIntro();
  };
  if (reduce) return done();
  gsap.to(gate, { yPercent: -100, duration: 0.9, ease: 'expo.inOut', onComplete: done });
}

if (root.dataset.gate === 'open' && gate) {
  lock(true);
  if (!reduce) {
    gsap.from(gate.querySelectorAll('[data-g]'), {
      yPercent: 110,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.08,
      delay: 0.1
    });
  }
  const onKey = (e: KeyboardEvent) => {
    if (root.dataset.gate !== 'open' || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 't') setMode('techie');
    if (k === 'n' || k === 'enter') setMode('normal');
  };
  window.addEventListener('keydown', onKey);
}

document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-mode-set]');
  if (btn) setMode(btn.dataset.modeSet as 'techie' | 'normal');
});

if (root.dataset.mode === 'techie') lock(true);

/* ---------- hero intro ---------- */
function playIntro() {
  if (introPlayed) return;
  introPlayed = true;
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero || reduce) {
    hero?.classList.add('ready');
    return;
  }
  document.fonts.ready.then(() => {
    hero.classList.add('ready');
    const title = hero.querySelector<HTMLElement>('[data-hero-title]');
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if (title) {
      const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'h-line' });
      tl.from(split.lines, { yPercent: 105, duration: 1.3, stagger: 0.09 });
    }
    tl.from(hero.querySelectorAll('[data-hero-fade]'), { y: 24, opacity: 0, duration: 1, stagger: 0.07 }, '-=0.95');
  });
}
if (root.dataset.gate !== 'open' && root.dataset.mode !== 'techie') playIntro();
else if (root.dataset.mode === 'techie') document.querySelector('[data-hero]')?.classList.add('ready');

/* ---------- scroll reveals ---------- */
if (!reduce) {
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 36,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      delay: Number(el.dataset.revealDelay || 0),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });
  gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
    gsap.from(group.children, {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.07,
      scrollTrigger: { trigger: group, start: 'top 85%', once: true }
    });
  });
  // the footer wordmark drifts in as you reach the bottom
  const word = document.querySelector('.f-word');
  if (word) {
    gsap.from(word, {
      yPercent: 40,
      opacity: 0.2,
      ease: 'none',
      scrollTrigger: { trigger: word, start: 'top bottom', end: 'bottom bottom', scrub: true }
    });
  }
}

/* ---------- nav ---------- */
const nav = document.querySelector<HTMLElement>('[data-nav]');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  if (!nav) return;
  nav.classList.toggle('is-scrolled', y > 10);
  const menuOpen = nav.querySelector('[data-menu-toggle]')?.getAttribute('aria-expanded') === 'true';
  nav.classList.toggle('is-hidden', !menuOpen && y > 400 && y > lastY);
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const menu = document.getElementById('mobile-menu');
const setMenu = (open: boolean) => {
  if (!menuBtn || !menu) return;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.hidden = !open;
  lock(open);
  if (open && !reduce) gsap.from(menu.querySelectorAll('.m-link, .m-foot'), { y: 30, opacity: 0, stagger: 0.05, duration: 0.7, ease: 'expo.out' });
};
menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
menu?.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-menu-close]')) setMenu(false);
});

/* ---------- theme ---------- */
document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));
function toggleTheme() {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  const apply = () => {
    root.dataset.theme = next;
    try {
      localStorage.setItem('ed-theme', next);
    } catch {}
  };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition && !reduce) doc.startViewTransition(apply);
  else apply();
}

/* ---------- local clock ---------- */
const clocks = document.querySelectorAll<HTMLElement>('[data-clock]');
const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
const tick = () => clocks.forEach((c) => (c.textContent = fmt.format(new Date())));
tick();
setInterval(tick, 20000);

/* ---------- command palette ---------- */
type PItem = { label: string; hint: string; group: string; href?: string; action?: string; external?: boolean; keywords?: string };
const palette = document.querySelector<HTMLElement>('[data-palette]');
const pInput = document.querySelector<HTMLInputElement>('[data-palette-input]');
const pList = document.querySelector<HTMLElement>('[data-palette-list]');
const pItems: PItem[] = JSON.parse(document.getElementById('palette-data')?.textContent || '[]');
let pSel = 0;
let pFiltered: PItem[] = pItems;
let pReturn: HTMLElement | null = null;

const renderPalette = () => {
  if (!pList) return;
  const q = (pInput?.value || '').trim().toLowerCase();
  pFiltered = q
    ? pItems.filter((i) => `${i.label} ${i.hint} ${i.keywords || ''}`.toLowerCase().includes(q))
    : pItems;
  pSel = Math.min(pSel, Math.max(0, pFiltered.length - 1));
  let group = '';
  pList.innerHTML = '';
  if (!pFiltered.length) {
    pList.innerHTML = '<li class="p-empty">Nothing matches that. Try "work" or "email".</li>';
    return;
  }
  pFiltered.forEach((item, i) => {
    if (item.group !== group) {
      group = item.group;
      const g = document.createElement('li');
      g.className = 'p-group';
      g.setAttribute('role', 'presentation');
      g.textContent = group;
      pList.appendChild(g);
    }
    const li = document.createElement('li');
    li.className = 'p-item';
    li.id = `p-${i}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', String(i === pSel));
    const label = document.createElement('span');
    label.textContent = item.label;
    const hint = document.createElement('small');
    hint.textContent = item.hint;
    li.append(label, hint);
    li.addEventListener('click', () => runItem(item));
    li.addEventListener('mousemove', () => {
      if (pSel !== i) {
        pSel = i;
        markSel();
      }
    });
    pList.appendChild(li);
  });
  pInput?.setAttribute('aria-activedescendant', `p-${pSel}`);
};
const markSel = () => {
  pList?.querySelectorAll('.p-item').forEach((el, i) => el.setAttribute('aria-selected', String(i === pSel)));
  pList?.querySelector(`#p-${pSel}`)?.scrollIntoView({ block: 'nearest' });
  pInput?.setAttribute('aria-activedescendant', `p-${pSel}`);
};
const openPalette = () => {
  if (!palette) return;
  pReturn = document.activeElement as HTMLElement;
  palette.hidden = false;
  if (pInput) pInput.value = '';
  pSel = 0;
  renderPalette();
  pInput?.focus();
  lenis?.stop();
};
const closePalette = () => {
  if (!palette || palette.hidden) return;
  palette.hidden = true;
  if (window.edMode !== 'techie' && root.dataset.gate !== 'open') lenis?.start();
  pReturn?.focus?.();
};
const runItem = (item: PItem) => {
  closePalette();
  if (item.action === 'copy-email') {
    const email = item.hint;
    navigator.clipboard?.writeText(email).then(() => toast(`Copied ${email}`), () => (location.href = `mailto:${email}`));
    return;
  }
  if (item.action === 'techie') return setMode('techie');
  if (item.action === 'theme') return toggleTheme();
  if (item.href) {
    if (item.action === 'download') {
      const a = document.createElement('a');
      a.href = item.href;
      a.download = '';
      a.click();
      return;
    }
    if (item.external) window.open(item.href, '_blank', 'noopener');
    else {
      if (window.edMode === 'techie') setMode('normal');
      const url = new URL(item.href, location.href);
      if (url.pathname === location.pathname && url.hash && lenis) lenis.scrollTo(url.hash);
      else location.href = item.href;
    }
  }
};
pInput?.addEventListener('input', () => {
  pSel = 0;
  renderPalette();
});
pInput?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    pSel = (pSel + 1) % Math.max(1, pFiltered.length);
    markSel();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    pSel = (pSel - 1 + pFiltered.length) % Math.max(1, pFiltered.length);
    markSel();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const item = pFiltered[pSel];
    if (item) runItem(item);
  }
});
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-palette-open]')) openPalette();
  if (t.closest('[data-palette-close]')) closePalette();
});
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (palette?.hidden) openPalette();
    else closePalette();
  } else if (e.key === 'Escape') {
    if (palette && !palette.hidden) closePalette();
    else if (menu && !menu.hidden) setMenu(false);
  } else if (e.key === '/' && !isTyping(e.target) && window.edMode !== 'techie' && root.dataset.gate !== 'open') {
    e.preventDefault();
    openPalette();
  }
});
function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

/* ---------- toast ---------- */
function toast(msg: string) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => {
    t.classList.remove('in');
    setTimeout(() => t.remove(), 400);
  }, 2600);
}
(window as any).edToast = toast;

/* ---------- cursor ---------- */
const cursor = document.querySelector<HTMLElement>('.cursor');
if (cursor && fine && !reduce) {
  const label = cursor.querySelector<HTMLElement>('.cursor-label')!;
  const x = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    x(e.clientX);
    y(e.clientY);
    cursor.classList.remove('hidden');
    const t = e.target as HTMLElement;
    const lab = t.closest<HTMLElement>('[data-cursor]');
    cursor.classList.toggle('has-label', !!lab);
    if (lab) label.textContent = lab.dataset.cursor || '';
    cursor.classList.toggle('is-link', !lab && !!t.closest('a, button, [role="button"], label, summary'));
    cursor.classList.toggle('is-text', !!t.closest('input, textarea'));
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('hidden'));
  window.addEventListener('ed:mode', (e) => {
    cursor.style.display = (e as CustomEvent).detail === 'techie' ? 'none' : '';
  });
  if (root.dataset.mode === 'techie') cursor.style.display = 'none';
}

/* ---------- work list hover preview ---------- */
const preview = document.querySelector<HTMLElement>('[data-preview]');
const rows = document.querySelectorAll<HTMLElement>('[data-preview-src]');
if (preview && rows.length && fine && !reduce) {
  const px = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' });
  const py = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' });
  const rot = gsap.quickTo(preview, 'rotation', { duration: 0.8, ease: 'power3' });
  let lastX = 0;
  const list = preview.parentElement!;
  list.addEventListener('pointermove', (e) => {
    const r = list.getBoundingClientRect();
    px(e.clientX - r.left);
    py(e.clientY - r.top);
    rot(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.6));
    lastX = e.clientX;
  });
  rows.forEach((row) => {
    row.addEventListener('pointerenter', (e) => {
      if (Number(gsap.getProperty(preview, 'opacity')) < 0.05) {
        const r = list.getBoundingClientRect();
        gsap.set(preview, { x: e.clientX - r.left, y: e.clientY - r.top });
        px(e.clientX - r.left);
        py(e.clientY - r.top);
      }
      const id = row.dataset.previewSrc;
      preview.querySelectorAll<HTMLElement>('[data-preview-item]').forEach((el) => {
        el.classList.toggle('on', el.dataset.previewItem === id);
      });
      gsap.to(preview, { scale: 1, opacity: 1, duration: 0.5, ease: 'expo.out' });
    });
  });
  list.addEventListener('pointerleave', () => gsap.to(preview, { scale: 0.6, opacity: 0, duration: 0.4, ease: 'power3' }));
}

/* ---------- live GitHub strip ---------- */
const gh = document.querySelector<HTMLElement>('[data-github]');
if (gh) {
  const user = gh.dataset.github!;
  const load = () =>
    Promise.all([
      fetch(`https://api.github.com/users/${user}`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=4`).then((r) => (r.ok ? r.json() : Promise.reject()))
    ])
      .then(([u, repos]) => {
        gh.querySelector('[data-gh-repos]')!.textContent = String(u.public_repos);
        gh.querySelector('[data-gh-followers]')!.textContent = String(u.followers);
        const last = repos[0] ? new Date(repos[0].pushed_at) : null;
        gh.querySelector('[data-gh-since]')!.textContent = last
          ? last.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          : '-';
        const list = gh.querySelector('[data-gh-list]')!;
        list.innerHTML = '';
        repos.forEach((r: any) => {
          const a = document.createElement('a');
          a.href = r.html_url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.className = 'gh-repo';
          const name = document.createElement('span');
          name.textContent = r.name;
          const meta = document.createElement('small');
          meta.className = 'mono';
          meta.textContent = `${r.language ?? 'code'} · ${new Date(r.pushed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
          a.append(name, meta);
          list.appendChild(a);
        });
        gh.classList.add('loaded');
      })
      .catch(() => gh.classList.add('failed'));
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      load();
    }
  }, { rootMargin: '300px' });
  io.observe(gh);
}

/* ---------- contact form: opens the visitor's own mail app or WhatsApp ---------- */
const form = document.querySelector<HTMLFormElement>('[data-contact]');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitter = (e as SubmitEvent).submitter as HTMLButtonElement | null;
    const via = submitter?.value || 'email';
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const subject = String(data.get('subject') || '').trim();
    const message = String(data.get('message') || '').trim();
    const email = form.dataset.email!;
    const wa = form.dataset.whatsapp!;
    if (via === 'whatsapp') {
      const text = `Hi ${form.dataset.first}, I'm ${name}.\n\n*${subject}*\n${message}`;
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      toast('WhatsApp is open with your message. Just press send.');
    } else {
      location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message}\n\n${name}`)}`;
      toast('Your mail app is open with everything filled in. Just press send.');
    }
  });
}

/* ---------- konami ---------- */
const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let pos = 0;
window.addEventListener('keydown', (e) => {
  pos = e.key === code[pos] ? pos + 1 : e.key === code[0] ? 1 : 0;
  if (pos === code.length) {
    pos = 0;
    root.classList.toggle('konami');
    toast(root.classList.contains('konami') ? 'Cheat code accepted. Everything is a little more fun now.' : 'Back to business.');
  }
});

/* ---------- console hello ---------- */
console.log(
  '%cernest.dev%c\nCurious? Press Ctrl K, or type ?mode=techie after the URL.\nSay hi: ernestuwaoma3@gmail.com',
  'font: 600 20px system-ui; color: #ff5a1f',
  'font: 13px ui-monospace, monospace; color: #888'
);
