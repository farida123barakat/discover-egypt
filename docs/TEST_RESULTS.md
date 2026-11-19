# Test results

## Latest: 19 November 2026, on `main`

CI run [44480859813](https://github.com/farida123barakat/discover-egypt/actions/runs/44480859813) and Pages run [44480859905](https://github.com/farida123barakat/discover-egypt/actions/runs/44480859905), commit `e6154a7`. Every push to `main` runs both (`.github/workflows/ci.yml`, `.github/workflows/pages.yml`).

| Suite | Where | Result |
| --- | --- | --- |
| Type check, lint, production build | `npm run check` | ✅ |
| Unit, API and database-permission tests (Vitest, real Postgres via PGlite) | `npm test` | ✅ **213 / 213** (17 files) |
| Browser tests: user journeys, admin, accessibility (axe, WCAG 2.2 AA), mobile, Watch & Discover, Memory Hunt, and the **front-end-only site** with no database | `npm run test:e2e` | ✅ **64 / 64** |
| Against a **real local Supabase** (Auth with real emails, Storage, row-level security) plus the recorded demo | `playwright.supabase.config.ts` | ✅ **17 / 17** |
| The **GitHub Pages build** served under `/discover-egypt/`: 21 pages load with nothing missing, links stay inside the site, films, album backup, currency converter | `playwright.pages.config.ts` | ✅ **6 / 6** |
| Dependency audit | `npm audit --omit=dev` | ✅ 0 vulnerabilities |

The recorded demo (video and screenshots) is on the [`demo` branch](https://github.com/farida123barakat/discover-egypt/tree/demo).

## Bugs the tests found and fixed

### 17 November (first CI runs)

1. **Unread response bodies kept requests open.** The print status page never read the body of a 404, so the browser never considered the request finished and the page never went idle (the accessibility scan waited forever). Every Memory Hunt fetch now reads its response body to the end. There's a regression test.
2. **Admin sign-in limit tripped by the test suite itself.** Sign-in allows 5 attempts per 15 minutes per address; five test files sign in and CI retries, so later files were refused. Each admin test file now acts as its own visitor address. The limit is unchanged.
3. **Sign-in relied on a refresh-then-redirect** to reach the dashboard. It now goes to `/admin` directly.
4. **Hieroglyph uploads raced hydration in tests:** a file chosen before the page hydrated was lost. The tests choose it again until the photo step appears (a person can't be that fast).
5. **Memory Passport stamps could show points the points total didn't count** (a memory with neither photo nor words). They now follow the same rule.

### 13 November (first test runs)

1. **Golden Hour Finder showed wrong times** — sunrise and sunset were swapped and half a day off (day count not rounded in the sunrise equation).
2. **History lovers did not see Luxor** in their top four — hidden-gem bonus outweighed it; added a "depth" factor for places worth several days.
3. **Map tiles were blocked** by the Content Security Policy (wrong OpenStreetMap host).
4. **Interactive pages would break in production** — statically prerendered pages can't receive CSP nonces; all pages now render per request.
5. **Soundscape descriptions were almost invisible** (contrast 1.05:1) on the Experience page.
6. **Text-size buttons** had accessible names that did not match their visible labels (WCAG 2.5.3).
7. **Two dependency vulnerabilities** (PostCSS bundled with Next.js) — patched via npm `overrides`.

## Still to look at

- In-app link navigation is occasionally slow on CI runners (seen on Watch & Discover and on the album's "Check the status" link); the tests pass on retry. The print-flow test now checks the link and opens the status page directly. Worth profiling on the real deployment.
- Not covered by automated tests: a hosted Supabase project (the local stack is the same software), real photos and map tiles, screen readers (NVDA/VoiceOver), Safari and Firefox.

## Not covered by automated tests

- A hosted Supabase project. The same software runs locally in CI (above), but not the hosted service itself.
- Photos and map tiles are loaded by the browser tests on CI runners, but each photo is not checked one by one. All 82 photos were verified to exist, with their licence and author, through the Wikimedia Commons API.
- Screen-reader testing with NVDA/VoiceOver, and Safari/Firefox. Recommended before launch.
