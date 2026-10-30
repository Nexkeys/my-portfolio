import { config, collection, fields, singleton } from '@keystatic/core';

const order = fields.integer({
  label: 'Sort order',
  description: 'Lower numbers show first.',
  defaultValue: 10
});

export default config({
  // Local files while developing, GitHub commits in production (or when forced for first time setup).
  storage:
    import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_STORAGE === 'github'
      ? { kind: 'github', repo: 'Nexkeys/my-portfolio' }
      : { kind: 'local' },
  ui: {
    brand: { name: 'ernest.dev' },
    navigation: {
      Site: ['profile', 'skills'],
      Work: ['projects', 'experience', 'services'],
      Writing: ['testimonials', 'notes']
    }
  },
  singletons: {
    profile: singleton({
      label: 'Profile and contact',
      path: 'src/content/profile',
      format: { data: 'yaml' },
      schema: {
        name: fields.text({ label: 'Full name' }),
        shortName: fields.text({ label: 'First name', description: 'Used in short greetings.' }),
        role: fields.text({ label: 'Role', description: 'One line, for example "Full stack software engineer".' }),
        headline: fields.text({
          label: 'Hero headline',
          description:
            'The big statement on the home page. Wrap one word in *stars* to make it italic and one in [brackets] to make it orange.',
          multiline: true
        }),
        intro: fields.text({ label: 'Short intro', multiline: true }),
        about: fields.array(fields.text({ label: 'Paragraph', multiline: true }), {
          label: 'About paragraphs',
          itemLabel: (p) => p.value.slice(0, 60)
        }),
        photo: fields.image({
          label: 'Your photo',
          description: 'Shown in the About section. A portrait (taller than wide) looks best, around 1200 by 1500.',
          directory: 'public/images/profile',
          publicPath: '/images/profile/'
        }),
        favouriteQuote: fields.text({
          label: 'Favourite quote',
          description: 'Shown large near the end of the home page. Leave empty to hide.',
          multiline: true
        }),
        saying: fields.text({
          label: 'Favourite saying',
          description: 'Shown in the footer and on the 404 page. Leave empty to hide.'
        }),
        statement: fields.text({
          label: 'Big statement',
          description: 'A single sentence revealed word by word on scroll, in the About section.',
          multiline: true
        }),
        location: fields.text({ label: 'Location' }),
        timezone: fields.text({ label: 'Time zone (IANA)', defaultValue: 'Africa/Lagos' }),
        available: fields.checkbox({ label: 'Available for work', defaultValue: true }),
        availabilityNote: fields.text({ label: 'Availability note' }),
        email: fields.text({ label: 'Email' }),
        phone: fields.text({ label: 'Phone (display)' }),
        whatsapp: fields.text({ label: 'WhatsApp number', description: 'Digits only with country code, for example 2348033004474.' }),
        bookingUrl: fields.url({ label: 'Book a call link (optional)', description: 'Calendly or Cal.com. Leave empty to hide the button.' }),
        github: fields.text({ label: 'GitHub username' }),
        socials: fields.array(
          fields.object({
            label: fields.text({ label: 'Label' }),
            url: fields.url({ label: 'URL' })
          }),
          { label: 'Social links', itemLabel: (p) => p.fields.label.value }
        ),
        stats: fields.array(
          fields.object({
            value: fields.integer({ label: 'Number' }),
            suffix: fields.text({ label: 'Suffix', defaultValue: '+' }),
            label: fields.text({ label: 'Label' })
          }),
          { label: 'Stats', itemLabel: (p) => `${p.fields.value.value}${p.fields.suffix.value} ${p.fields.label.value}` }
        ),
        cv: fields.file({
          label: 'CV (PDF)',
          directory: 'public/cv',
          publicPath: '/cv/'
        }),
        seoTitle: fields.text({ label: 'SEO title' }),
        seoDescription: fields.text({ label: 'SEO description', multiline: true })
      }
    }),
    skills: singleton({
      label: 'Skills and tools',
      path: 'src/content/skills',
      format: { data: 'yaml' },
      schema: {
        groups: fields.array(
          fields.object({
            name: fields.text({ label: 'Group name' }),
            items: fields.array(
              fields.object({
                name: fields.text({ label: 'Skill' }),
                level: fields.select({
                  label: 'Level',
                  options: [
                    { label: 'Expert', value: 'expert' },
                    { label: 'Strong', value: 'strong' },
                    { label: 'Solid', value: 'solid' },
                    { label: 'Learning', value: 'learning' }
                  ],
                  defaultValue: 'strong'
                })
              }),
              { label: 'Skills', itemLabel: (p) => `${p.fields.name.value} (${p.fields.level.value})` }
            )
          }),
          { label: 'Groups', itemLabel: (p) => p.fields.name.value }
        )
      }
    })
  },
  collections: {
    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'src/content/projects/*',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'year'],
      schema: {
        title: fields.slug({ name: { label: 'Project name' } }),
        tagline: fields.text({ label: 'Tagline', description: 'One short line.' }),
        summary: fields.text({ label: 'Summary', multiline: true, description: 'Two or three sentences for cards and search results.' }),
        category: fields.text({ label: 'Category', description: 'For example Fintech, Developer tool, Client work.' }),
        role: fields.text({ label: 'My role' }),
        year: fields.text({ label: 'Year', description: 'For example 2026 or 2024 to 2025.' }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Live', value: 'live' },
            { label: 'Open source', value: 'open-source' },
            { label: 'In progress', value: 'in-progress' },
            { label: 'Archived', value: 'archived' }
          ],
          defaultValue: 'live'
        }),
        client: fields.checkbox({ label: 'Client project', defaultValue: false }),
        featured: fields.checkbox({ label: 'Featured on home page', defaultValue: false }),
        order,
        liveUrl: fields.url({ label: 'Live site URL' }),
        repoUrl: fields.url({ label: 'GitHub repo URL', description: 'Only for public repos.' }),
        links: fields.array(
          fields.object({
            label: fields.text({ label: 'Label' }),
            url: fields.url({ label: 'URL' })
          }),
          { label: 'Other links', description: 'Play Store, releases, case study and so on.', itemLabel: (p) => p.fields.label.value }
        ),
        stack: fields.array(fields.text({ label: 'Tech' }), { label: 'Tech stack', itemLabel: (p) => p.value }),
        highlights: fields.array(fields.text({ label: 'Highlight', multiline: true }), {
          label: 'Highlights',
          itemLabel: (p) => p.value.slice(0, 60)
        }),
        cover: fields.image({
          label: 'Cover image',
          description: 'A screenshot works best, 1600 by 1000. Leave empty for a generated cover.',
          directory: 'public/images/projects',
          publicPath: '/images/projects/'
        }),
        body: fields.markdoc({ label: 'Case study' })
      }
    }),
    experience: collection({
      label: 'Work history',
      slugField: 'company',
      path: 'src/content/experience/*',
      format: { data: 'yaml' },
      columns: ['company', 'start'],
      schema: {
        company: fields.slug({ name: { label: 'Company' } }),
        role: fields.text({ label: 'Role' }),
        url: fields.url({ label: 'Company URL' }),
        location: fields.text({ label: 'Location' }),
        start: fields.text({ label: 'Start', description: 'For example Jul 2020.' }),
        end: fields.text({ label: 'End', description: 'Leave empty if this is your current role.' }),
        order,
        points: fields.array(fields.text({ label: 'Point', multiline: true }), {
          label: 'What I did',
          itemLabel: (p) => p.value.slice(0, 60)
        })
      }
    }),
    services: collection({
      label: 'Services',
      slugField: 'title',
      path: 'src/content/services/*',
      format: { data: 'yaml' },
      schema: {
        title: fields.slug({ name: { label: 'Service' } }),
        summary: fields.text({ label: 'Summary', multiline: true }),
        includes: fields.array(fields.text({ label: 'Item' }), { label: 'What is included', itemLabel: (p) => p.value }),
        order
      }
    }),
    testimonials: collection({
      label: 'Testimonials',
      slugField: 'name',
      path: 'src/content/testimonials/*',
      format: { data: 'yaml' },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        role: fields.text({ label: 'Role and company' }),
        quote: fields.text({ label: 'Quote', multiline: true }),
        order
      }
    }),
    notes: collection({
      label: 'Notes (blog)',
      slugField: 'title',
      path: 'src/content/notes/*',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Published', defaultValue: { kind: 'today' } }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        draft: fields.checkbox({ label: 'Draft (hidden from the site)', defaultValue: false }),
        body: fields.markdoc({ label: 'Body' })
      }
    })
  }
});
