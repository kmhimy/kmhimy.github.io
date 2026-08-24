# Research Desk

A lightweight personal academic dashboard for daily use.

## What works now

- **Today's Focus** — keep up to three priorities for the day.
- **Tasks** — add, categorize, assign to projects, set due dates, complete and restore.
- **Done Today** — automatically records completed tasks.
- **Projects** — maintain a short list of active research threads.
- **Research Log** — record question/topic, progress, finding, and next step.
- **Quick Note** — automatically saves today's scratch note.
- **Weekly Review** — summarizes completed tasks, logs, open work and active projects.
- **Export / Import** — save the entire workspace as JSON.
- **Focus Mode** — hides everything except today's priorities.
- **Offline support** — basic PWA/service-worker cache.

## Important: where data is stored

Version 1 stores data in your browser using `localStorage`.

That means:

- It works without a server.
- Your data persists in the same browser.
- It does **not** automatically sync between computers or phones.
- Browser data can be lost if you clear site storage.

Use **Export data** regularly until cloud sync is added.

## Run locally

The simplest reliable way:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

Opening `index.html` directly will work for most features, but PWA/offline caching needs an HTTP server.

## Deploy free

You can upload this folder to:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel

For a private dashboard, do not publish sensitive research notes publicly. Before using this on a public URL, add authentication and cloud storage.

## Recommended Version 2

Use:

- Frontend: Next.js or the existing static UI
- Auth: Supabase Auth
- Database: Supabase Postgres
- Deployment: Cloudflare Pages or Vercel
- Private address: `desk.yourdomain.com`

Version 2 should add:

1. Login
2. Cross-device sync
3. Daily automatic archive
4. Search across logs
5. Project pages
6. Markdown / LaTeX notes
7. Weekly and monthly summaries
8. Optional calendar integration
