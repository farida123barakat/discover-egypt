# Architecture

## In one picture

```
Browser ──► Next.js on Vercel ──────────────► Supabase
            │  pages (server components)        Postgres + Row Level Security
            │  API routes (/api/*)               Auth (email links, admin accounts)
            │  middleware: CSP nonce, session    Storage (destination photos)
            │
            ├── src/content  (typed editorial content, versioned in git)
            └── src/lib/store.ts  (one data layer, 3 back-end modes)
```

## Key decisions

**1. Content lives in typed files, data lives in the database.**
Destinations, food, history, walks and practical information are TypeScript files in `src/content`. They are reviewed in pull requests, type-checked, and rendered on the server. `scripts/generate-seed.ts` turns the same files into `supabase/seed.sql`, so there is one source of truth.
Things that change often or come from people (submissions, prices, events, featured slots, itineraries) live in Postgres.

**2. One data layer, three modes** (`src/lib/env.ts`, `src/lib/store.ts`):

| Mode | When | Storage |
| --- | --- | --- |
| `supabase` | Supabase variables are set | Postgres with RLS |
| `local` | `DEMO_LOCAL_MODE=true`, no Supabase, **not** Vercel production | `.data/local-db.json` |
| `none` | Neither | Read-only site; forms explain that saving is unavailable |

This lets the whole app — including admin moderation — run and be tested with no external accounts, without fake responses.

**3. Personal data stays on the device by default.**
Favourites, stamps, packing lists and the draft trip are in `localStorage`. An account is optional and only syncs trips. This means less personal data to protect, and no sign-up wall.

**4. Server-side checks for everything that matters.**
Every API route uses `parseRequest()` in `src/lib/api.ts`: same-origin check, JSON only, rate limit, size limit, zod validation, honeypot. Admin routes call `getAdmin()` first. The database repeats the rules with RLS (defence in depth).

**5. Itineraries are stored as one JSON document per trip.**
A trip is edited and validated as a unit (`itinerarySchema`). Ownership, access and size limits are relational and enforced by RLS and constraints. Normalised `itinerary_days` / `itinerary_activities` tables would add joins without a current query that needs them.

## Main modules

| File | Responsibility |
| --- | --- |
| `src/lib/recommend.ts` | Pure, deterministic scoring for Find Your Egypt, with human-readable reasons |
| `src/lib/budget.ts` | Budget presets and totals (estimates) |
| `src/lib/sun.ts` | Sunrise, sunset and golden hour (NOAA approximation) |
| `src/lib/validation.ts` | All zod schemas, shared by client and server |
| `src/lib/auth.ts` | Admin identity (Supabase role, or signed local cookie) |
| `src/lib/store.ts` | Every read and write to storage |
| `src/middleware.ts` | Per-request CSP nonce, Supabase session refresh |
| `src/components/*` | One file per feature area; small reusable parts in `ui.tsx` |

## External services

| Service | Use | Limits and fallback |
| --- | --- | --- |
| Supabase | Database, auth, storage | Free tier pauses after inactivity; use Pro for production |
| OpenStreetMap tiles | Maps | Usage policy limits heavy traffic; for real launch use a commercial tile provider (MapTiler, Stadia) — change one URL in `EgyptMapInner.tsx` and the CSP |
| Wikimedia Commons | Photos (hot-linked thumbnails) | For launch, copy approved photos to Supabase Storage to control availability |
| ExchangeRate-API (open) | Exchange rates | Daily updates, attribution required, rate-limited; cached 6 h. On failure the user enters a rate — no invented values |
| Browser speech synthesis | Arabic pronunciation | Only offered when the browser supports it |
