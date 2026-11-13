# Discover Egypt

**A thousand stories. One destination.**

A full-stack tourism platform concept for Egypt. It helps visitors **get inspired**, **plan a trip** and **travel well** once they arrive.

> **Status:** concept and student project. It is **not** an official Ministry of Tourism and Antiquities website and is **not deployed**. Official facts are shown with a "last verified" date and a source, or are labelled *awaiting verification*.

---

## Try it in 3 minutes (no accounts needed)

```bash
npm install
cp .env.example .env.local      # local demo mode is already switched on
npm run dev                     # open http://localhost:3000
```

- **Admin:** go to `/admin` and sign in with `LOCAL_ADMIN_PASSWORD` from `.env.local`.
- **Demo data:** submissions are saved to `.data/local-db.json` (git-ignored).

**Example journey:** take the quiz on **Discover** → build a trip on **Plan** → save it → download the PDF in **My Egypt** → ask a question on **Ask a Local** → publish it from **/admin**.

---

## What is inside

| Area | Highlights |
| --- | --- |
| **Home** | Cinematic hero, Find Your Egypt quiz, featured places (chosen by admins), in-season picks, hidden gems, food, events, traveller stories |
| **Discover** | Preference quiz with reasons for each match, interactive Leaflet map with filters, *Walk Through Time* timeline (with a kids' version), climate & crowd chart, **Golden Hour Finder**, events calendar, Ramadan guide |
| **Plan** | Smart Trip Builder (day-by-day timeline, reorder activities), budget calculator (4 styles, 5 categories), live currency converter with manual fallback, packing list, suggested routes |
| **Experience** | Food guide (price, vegetarian, background), Egyptian Arabic trainer with quiz and speech, etiquette, optional soundscapes (play only on request) |
| **Travel Smart** | Emergency numbers, Cairo Metro and women-only carriages, walking routes on a map, accessibility (no unverified claims), fair price guide |
| **My Egypt** | Saved places, Egypt Travel Passport stamps, itinerary, PDF download and print, packing list; optional account to sync trips |
| **Watch & Discover** | Three original animated explainers (Great Pyramid, Nile seasons, moving Abu Simbel) with captions on by default, chapters, a follow-along transcript and sources; click-to-load YouTube embeds from creators' own channels; films on each destination page |
| **Admin** | Moderation queue (answer and publish), price editor, event manager, featured destinations, photo upload |

Full status: **[FEATURES.md](FEATURES.md)**.

---

## Tech stack

**Next.js 15** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS 4** · **Framer Motion** · **Supabase** (Postgres, Auth, Storage) · **Leaflet + OpenStreetMap** · **jsPDF** · **zod** · **Vitest** · **Playwright + axe-core**

Why these choices: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` · `npm run lint` | TypeScript and ESLint |
| `npm test` | Unit, API and **database permission** tests (Vitest + PGlite) |
| `npm run test:e2e` | End-to-end, accessibility and mobile tests (Playwright). If Playwright can't download a browser, set `CHROME_PATH=/path/to/chrome` |
| `npm run media:render` | Re-render the original explainer films, captions and chapters into `public/media` (needs ffmpeg + Chrome) |
| `npm run db:seed:generate` | Rebuild `supabase/seed.sql` from `src/content` |
| `npm run audit:deps` | Check production dependencies for vulnerabilities |
| `npm run check` | Typecheck, lint, test and build in one go |

Latest results: **[docs/TEST_RESULTS.md](docs/TEST_RESULTS.md)**.

---

## Project structure

```
src/
  app/            pages and API routes (app router)
  components/     reusable UI (one file per feature area)
  content/        ALL editorial content, typed — edit text here, not in components
  lib/            logic: recommendations, budget, sun times, validation, auth, data store
supabase/
  migrations/     database schema + Row Level Security
  seed.sql        generated from src/content
tests/            unit, API and database tests
e2e/              Playwright user journeys, accessibility, responsive
docs/             architecture, deployment, security, test results
```

---

## Going to production

Step by step, including what accounts and keys you need: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

Security measures and known risks: **[docs/SECURITY.md](docs/SECURITY.md)**.

---

## Content and credits

- Photos: Wikimedia Commons, each with author and licence (see `/credits`). Every file was checked against the Commons API on 13 Nov 2026.
- Map data © OpenStreetMap contributors.
- Exchange rates: ExchangeRate-API open endpoint (attribution required).

Arabic and right-to-left support: the layout sets `lang` and `dir` at the root, and all copy lives in `src/content`, so a `[locale]` segment can be added later.
