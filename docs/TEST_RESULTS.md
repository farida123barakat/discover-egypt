# Test results

## Latest run: against a real database, 17 November 2026

Run [44173142384](https://github.com/farida123barakat/discover-egypt/actions/runs/44173142384) on branch `accounts-and-real-database`. The CI job "Real Supabase (local)" starts the actual Supabase stack (Postgres 17, Auth, Storage and a test mailbox), applies every migration and the seed, and runs the site against it. No demo mode and no mocks.

| Check | Result |
| --- | --- |
| Every public table has row-level security on, seed loaded | ✅ |
| Sign-in and accounts (`e2e-supabase/auth.spec.ts`): sign-up with a real confirmation email, duplicate sign-up looks identical, wrong password, sign in/out, forgotten password via email link (old password stops working), unknown-address reset looks identical, new-password page guarded, magic link, broken links and open-redirect attempts | ✅ **9 / 9** |
| Data and permissions (`e2e-supabase/data.spec.ts`): trips private to each visitor, bucket-list sync, memory backup to the visitor's own storage folder and restore on a second device, admin-only dashboard and admin APIs (401 for visitors), photo upload (401 anonymous/visitor, 415 fake PNG), moderation, recipe approval, bucket activities, draft films hidden | ✅ **7 / 7** |
| Recorded demo tour (`e2e-supabase/demo.spec.ts`) | ✅ published to the [`demo` branch](https://github.com/farida123barakat/discover-egypt/tree/demo) |
| Same run: type check, lint, 202 Vitest tests (14 files), build, 58 local-mode Playwright tests, dependency audit | ✅ |

The only failures on the way were in the new tests themselves (ambiguous selectors, such as Next.js's hidden route announcer also having `role="alert"`), not in the app.

## Earlier run: GitHub Actions, 17 November 2026

Run [44158408773](https://github.com/farida123barakat/discover-egypt/actions/runs/44158408773) on branch `memory-hunt-finish` (commit `3aa2a24`), Ubuntu, Node 22, Playwright Chromium, production build, local demo mode. Every push and pull request now runs the same checks (`.github/workflows/ci.yml`).

| Check | Result |
| --- | --- |
| Type check, lint (`npm run check`) | ✅ 0 errors |
| Vitest: unit, API and database permission tests (13 files) | ✅ **191 / 191** |
| Production build | ✅ 37 routes |
| Playwright: journeys, Memory Hunt (incl. Memory Passport PDFs), accessibility (axe on 23 pages), mobile | ✅ **58 / 58** (one flaky on the first attempt, see below) |
| Dependency audit (`npm audit --omit=dev`) | ✅ 0 vulnerabilities |

### Bugs the new CI found and fixed (17 November)

1. **Unread response bodies kept requests open.** The print status page never read the body of a 404, so the browser never considered the request finished and the page never went idle (the accessibility scan waited forever). Every Memory Hunt fetch now reads its response body to the end. There's a regression test.
2. **Admin sign-in limit tripped by the test suite itself.** Sign-in allows 5 attempts per 15 minutes per address; five test files sign in and CI retries, so later files were refused. Each admin test file now acts as its own visitor address. The limit is unchanged.
3. **Sign-in relied on a refresh-then-redirect** to reach the dashboard. It now goes to `/admin` directly.
4. **Hieroglyph uploads raced hydration in tests:** a file chosen before the page hydrated was lost. The tests choose it again until the photo step appears (a person can't be that fast).
5. **Memory Passport stamps could show points the points total didn't count** (a memory with neither photo nor words). They now follow the same rule.

### Still to look at

- In-app link navigation is occasionally slow on CI runners (seen on Watch & Discover and on the album's "Check the status" link); the tests pass on retry. The print-flow test now checks the link and opens the status page directly. Worth profiling on the real deployment.
- Not covered by automated tests: a hosted Supabase project (the local stack is the same software), real photos and map tiles, screen readers (NVDA/VoiceOver), Safari and Firefox.

## Earlier run (13 November 2026)

Recorded in a Linux sandbox (Node 22, system Google Chrome, production build, local demo mode).

## Summary

| Suite | Command | Result |
| --- | --- | --- |
| Type check | `npm run typecheck` | ✅ 0 errors |
| Lint (incl. jsx-a11y) | `npm run lint` | ✅ 0 problems |
| Unit tests (recommendations, budget, sun times, uploads, validation, rate limit, admin tokens) | `npm test` | ✅ |
| API integration tests (CSRF, content type, validation, honeypot, rate limit, admin auth, moderation flow, events) | `npm test` | ✅ |
| **Database permission tests** — real migration + seed on Postgres (PGlite), RLS as `anon` / `authenticated` | `npm test` | ✅ 12/12 |
| Watch & Discover: explainer timelines (ordered, non-overlapping cues inside chapters), WebVTT output, publishing rules, admin media API (auth, 5–15 min rule, scripted captions cannot be overwritten, no admin email stored) | `npm test` | ✅ |
| **Vitest total** | `npm test` | ✅ **110 / 110** |
| End-to-end: 8 required user journeys + access control + form errors | `npm run test:e2e` | ✅ |
| Accessibility: axe WCAG 2.0/2.1/2.2 A+AA on 19 pages, skip link, text size | `npm run test:e2e` | ✅ |
| Responsive: mobile menu + no horizontal scroll on 6 pages (Pixel 7) | `npm run test:e2e` | ✅ |
| Watch & Discover: video plays, English captions track showing with cues, chapter and transcript seek, `text/vtt` and `video/mp4` served, no YouTube request before play, admin publishing flow | `npm run test:e2e` | ✅ 6 / 6 |
| **Playwright total** | `npm run test:e2e` | ✅ **51 / 51** |
| Production build | `npm run build` | ✅ |
| Dependency audit | `npm audit --omit=dev` | ✅ 0 vulnerabilities |

## Bugs the tests found and fixed

1. **Golden Hour Finder showed wrong times** — sunrise and sunset were swapped and half a day off (day count not rounded in the sunrise equation).
2. **History lovers did not see Luxor** in their top four — hidden-gem bonus outweighed it; added a "depth" factor for places worth several days.
3. **Map tiles were blocked** by the Content Security Policy (wrong OpenStreetMap host).
4. **Interactive pages would break in production** — statically prerendered pages can't receive CSP nonces; all pages now render per request.
5. **Soundscape descriptions were almost invisible** (contrast 1.05:1) on the Experience page.
6. **Text-size buttons** had accessible names that did not match their visible labels (WCAG 2.5.3).
7. **Two dependency vulnerabilities** (PostCSS bundled with Next.js) — patched via npm `overrides`.

## Not covered by automated tests

- A live Supabase project (auth emails, storage uploads, service-role queries). The schema and RLS are tested on real Postgres; the network calls are not.
- Real photos and map tiles: the sandbox has no outbound internet. All 36 photo files were verified to exist with matching licences via the Wikimedia Commons API.
- Screen-reader testing with NVDA/VoiceOver, and Safari/Firefox. Recommended before launch.

## Raw output

The log below is from an **earlier run (12 November, 23:20 UTC)**, made before several suites were added. That is why it shows 50 Vitest and 24 Playwright tests while the summary above shows 110 and 51. The full log of the run behind the summary is not in the repository. The next run should paste its complete output here.

```
Recorded 2026-11-12T23:20Z on Node v22.23.4, Chrome (system)

$ npm run typecheck && npm run lint
OK — 0 type errors, 0 lint problems

$ npm run build
 ✓ Compiled successfully in 5.9s
   Generating static pages (0/25) ...
   Generating static pages (6/25) 
   Generating static pages (12/25) 
   Generating static pages (18/25) 
 ✓ Generating static pages (25/25)

$ npm test
 Test Files  5 passed (5)
      Tests  50 passed (50)

$ CHROME_PATH=/usr/bin/google-chrome npm run test:e2e
  ✓   1 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /
  ✓   2 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /discover
  ✓   3 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /discover/siwa
  ✓   4 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /plan
  ✓   5 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /experience
  ✓   6 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /travel-smart
  ✓   7 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /my-egypt
  ✓   8 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /community
  ✓   9 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /contact
  ✓  10 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /account
  ✓  11 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /privacy
  ✓  12 [desktop] › e2e/a11y.spec.ts:7:3 › no WCAG 2.2 A/AA violations on /admin/login
  ✓  13 [desktop] › e2e/a11y.spec.ts:19:1 › keyboard: skip link moves focus to the main content
  ✓  14 [desktop] › e2e/a11y.spec.ts:28:1 › text size control enlarges text
  ✓  15 [desktop] › e2e/journeys.spec.ts:3:1 › 1. a first-time visitor discovers Egypt through the preference quiz
  ✓  16 [desktop] › e2e/journeys.spec.ts:20:1 › 2. a visitor explores destinations using the interactive map
  ✓  17 [desktop] › e2e/journeys.spec.ts:30:1 › 3. a visitor builds and saves an itinerary
  ✓  18 [desktop] › e2e/journeys.spec.ts:43:1 › 4. a visitor calculates a travel budget
  ✓  19 [desktop] › e2e/journeys.spec.ts:54:1 › 5. a visitor saves destinations
  ✓  20 [desktop] › e2e/journeys.spec.ts:62:1 › 6–7. a visitor submits a question and an admin publishes it
  ✓  21 [desktop] › e2e/journeys.spec.ts:92:1 › 8. a visitor downloads their itinerary as a PDF
  ✓  22 [desktop] › e2e/journeys.spec.ts:101:1 › admin pages and APIs are closed to visitors
  ✓  23 [desktop] › e2e/journeys.spec.ts:108:1 › forms show helpful errors
  ✓  24 [mobile] › e2e/responsive.spec.ts:3:1 › mobile navigation opens, is keyboard-closable and has no sideways scroll
  24 passed

$ npm audit --omit=dev
found 0 vulnerabilities
```

8. **The demo database leaked state between runs** — the recipe-approval test only passed on a fresh database; it now resets the recipe first.
9. **An admin's email was stored in publicly readable review records** (recipes) — reviews are now recorded as "Discover Egypt editor".
