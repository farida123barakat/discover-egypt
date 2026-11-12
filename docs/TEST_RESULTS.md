# Test results

Recorded **13 November 2026** in a Linux sandbox (Node 22, system Google Chrome, production build, local demo mode).

## Summary

| Suite | Command | Result |
| --- | --- | --- |
| Type check | `npm run typecheck` | ✅ 0 errors |
| Lint (incl. jsx-a11y) | `npm run lint` | ✅ 0 problems |
| Unit tests (recommendations, budget, sun times, uploads, validation, rate limit, admin tokens) | `npm test` | ✅ |
| API integration tests (CSRF, content type, validation, honeypot, rate limit, admin auth, moderation flow, events) | `npm test` | ✅ |
| **Database permission tests** — real migration + seed on Postgres (PGlite), RLS as `anon` / `authenticated` | `npm test` | ✅ 12/12 |
| **Vitest total** | `npm test` | ✅ **50 / 50** |
| End-to-end: 8 required user journeys + access control + form errors | `npm run test:e2e` | ✅ |
| Accessibility: axe WCAG 2.0/2.1/2.2 A+AA on 12 pages, skip link, text size | `npm run test:e2e` | ✅ |
| Responsive: mobile menu + no horizontal scroll on 6 pages (Pixel 7) | `npm run test:e2e` | ✅ |
| **Playwright total** | `npm run test:e2e` | ✅ **24 / 24** |
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
