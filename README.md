# ernest.dev

Portfolio of Ernest Uwaoma. Two ways to experience it: a visual editorial site and a full terminal, chosen on arrival with "Are you a techie, or a normal person?".

Built with Astro, React, GSAP, Lenis and a few React Bits components. Content is edited in a password protected admin panel (Keystatic) and every page is pre-rendered to plain HTML, so search engines see everything instantly.

## Run it locally

Requires Node 22.23 or newer (24 recommended).

```bash
npm install
npm run dev
```

Open http://localhost:4321. The admin panel is at http://localhost:4321/keystatic and edits files on your machine directly.

## Editing content

Everything on the site comes from the admin panel:

| Panel section | What it controls |
| --- | --- |
| Profile and contact | Name, headline, intro, about text, stats, email, WhatsApp, socials, CV, SEO title and description, availability |
| Skills and tools | Skill groups and levels (shown as dots on the site and bars in the terminal) |
| Projects | Every project, its links, stack, highlights, cover image and full case study. Tick "Featured" to show it on the home page |
| Work history | Jobs and roles. Leave "End" empty for a current role |
| Services | What you offer |
| Testimonials | Client quotes. The section appears on the home page once there is at least one |
| Notes (blog) | Articles. The Notes page and nav link appear once there is at least one published note |

Headline tip: wrap a word in `*stars*` for the italic serif and in `[brackets]` for orange. Example: `I build software that *actually* [ships.]`

On the live site, saving in the panel commits to GitHub and Vercel rebuilds the site in about a minute.

## Deploying to Vercel

1. Merge this branch into `main`.
2. In Vercel, import `Nexkeys/my-portfolio`. The framework is detected as Astro automatically.
3. Add these environment variables (Project Settings, Environment Variables):

| Variable | Value |
| --- | --- |
| `PUBLIC_SITE_URL` | Your live URL, for example `https://ernestuwaoma.vercel.app` |
| `ADMIN_PASSWORD` | The password for `/admin` |
| `ADMIN_SESSION_SECRET` | Any long random string |
| `KEYSTATIC_GITHUB_CLIENT_ID` | From the GitHub App (next section) |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | From the GitHub App |
| `KEYSTATIC_SECRET` | From the GitHub App setup, or any long random string |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | The GitHub App's slug |

4. Turn on Web Analytics in the Vercel project to see visitors.

## Admin panel setup (one time)

The live panel saves through a GitHub App, so it needs to be created once:

1. On your computer, run `PUBLIC_KEYSTATIC_STORAGE=github npm run dev` and open http://127.0.0.1:4321/keystatic.
2. Click "Create GitHub App", give it a name and confirm. Keystatic writes the four `KEYSTATIC_` values into a local `.env` file.
3. Install the new GitHub App on the `Nexkeys/my-portfolio` repository when GitHub asks.
4. In the GitHub App settings, add a callback URL for the live site: `https://YOUR-DOMAIN/api/keystatic/github/oauth/callback`.
5. Copy the four `KEYSTATIC_` values from `.env` into Vercel and redeploy.

After that, go to `https://YOUR-DOMAIN/admin`, enter your password, then sign in with GitHub once. Visit `/admin/logout` to sign out.

## Useful details

- The gate question shows once per browser session. Add `?mode=techie` or `?mode=normal` to any link to skip it.
- `Ctrl K` (or `/`) opens the command palette anywhere. The terminal has hidden commands too.
- SEO: canonical URLs, Open Graph and Twitter cards, JSON-LD (Person, WebSite, projects, breadcrumbs), `sitemap-index.xml`, `robots.txt` and `llms.txt` are generated on every build.
- The contact form never stores anything. It opens the visitor's own mail app or WhatsApp with their message filled in.
