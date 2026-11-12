# Feature completion checklist

Status as of **13 November 2026**. Test references point to `tests/` (Vitest) and `e2e/` (Playwright).

**Legend**
- ✅ **Fully implemented and tested**
- 🔑 **Implemented, needs external credentials** (works in code; needs a Supabase project or a key to run for real)
- 🟡 **Partially implemented** (a working, smaller version; the gap is described)
- ❌ **Not implemented**

---

## ✅ Fully implemented and tested

| Feature | Tested by |
| --- | --- |
| Six main sections: Home, Discover, Plan, Experience, Travel Smart, My Egypt | e2e a11y scans of every page |
| **Find Your Egypt** quiz: interests, environment, style, pace, days, month → ranked matches with reasons | `unit/recommend`, e2e journey 1 |
| **Destination explorer** map: category filters, select a place, nearby highlights, save | e2e journey 2 |
| Destination pages for 16 places with attractions, best months, photo tip, passport fact | e2e a11y `/discover/siwa` |
| **Smart Trip Builder**: name, dates, days, style, travellers, destination per day, add, reorder and remove activities, estimated budget, save | e2e journey 3 |
| **Daily budget calculator**: 4 styles, 5 adjustable categories, daily and total, labelled as estimate with last-checked date | `unit/budget`, e2e journey 4 |
| Save destinations and attractions; **Egypt Travel Passport** stamps | e2e journey 5 |
| **Ask a Local** with a moderation queue: submit → pending → admin answers → published (first name only, no email) | `api/routes`, e2e journeys 6–7 |
| **Traveller stories** with moderation (same pipeline as questions) | `api/routes` (shared store), db RLS tests |
| Itinerary **PDF download** and print | e2e journey 8 |
| Walk Through Time timeline linked to real places, plus a version for children | a11y scan `/discover` |
| **Golden Hour Finder** (NOAA sun-position maths, Cairo time) | `unit/budget-sun-files` |
| Monthly weather and crowd chart; events calendar; Ramadan guide | a11y scan `/discover` |
| Taste Egypt food guide (photo, ingredients, price range, vegetarian, background) and food safety advice | a11y scan `/experience` |
| Decode Egypt: numerals, phrases, pronunciation, speech (when the browser supports it), quiz | a11y scan `/experience` |
| Etiquette: mosques and churches, clothing, photos, bargaining, tipping | a11y scan `/experience` |
| Egypt Through the Senses: generated soundscapes, **only play when pressed**, volume control | a11y scan `/experience` |
| Travel Smart: emergency numbers and embassies (with sources), Cairo Metro and women-only carriages, walking routes on a map, solo women guidance, accessibility (no unverified claims), fair price guide | a11y scan `/travel-smart` |
| Packing checklist; suggested routes and travel times; preparation guide | a11y scan `/plan` |
| Contact, newsletter and question/story forms: labels, validation (client and server), field errors, success messages, honeypot, rate limit, consent | `unit/validation-auth`, `api/routes`, e2e "forms show helpful errors" |
| **Admin** (local mode): sign-in, moderation, price editor, **event manager** (add, edit, delete; "verified" requires a source), **featured destinations** | `api/routes`, e2e journeys 6–7 |
| Admin closed to visitors (pages redirect, APIs return 401) | `api/routes`, e2e |
| Security: CSRF origin check, JSON-only APIs, rate limits, CSP with nonces, security headers, signed httpOnly admin cookie, upload type check by magic bytes | `api/routes`, `unit/*` |
| **Database**: schema, constraints, indexes, Row Level Security (no self-promotion to admin, no access to others' trips, public sees only approved posts without emails) | `db/rls` (12 tests on real Postgres via PGlite) |
| Accessibility: skip link, keyboard, focus styles, text size and high-contrast controls, reduced motion, WCAG 2.2 AA axe scan | e2e `a11y` (14 tests) |
| Responsive layout and mobile navigation (no sideways scrolling) | e2e `responsive` (Pixel 7) |

## 🔑 Implemented, needs external credentials

| Feature | What is needed |
| --- | --- |
| Supabase back end for all submissions, prices, events, featured slots | A Supabase project + the three Supabase variables (see DEPLOYMENT.md). Schema and RLS are tested; the live connection has **not** been run against a real project. |
| **Visitor accounts**: email sign-in link, save trips to the cloud, load and delete them on any device | Supabase Auth + an SMTP provider for production email volume |
| **Admin sign-in with Supabase Auth** and roles | Supabase project; promote an admin with one SQL line |
| **Photo uploads** (JPEG/PNG/WebP, 5 MB, checked by content, random file names) | Supabase Storage bucket (created by the migration) |
| **Live exchange rates** (EUR/USD/GBP → EGP) | No key needed, but needs internet access from the server. If the provider fails, the converter asks for a manual rate and never invents one. |

## 🟡 Partially implemented

| Feature | What works | What is missing |
| --- | --- | --- |
| Admin content management | Prices, events, featured destinations, moderation, photo upload | Editing destination text, attractions and historical stories in the dashboard. Today these are edited in `src/content` and re-seeded. |
| Admin analytics | Counts of pending, published, rejected, questions, stories | Traffic and usage analytics (deliberately no tracking) |
| Contact messages | Stored safely (write-only for the public) | No inbox view in the dashboard; read them in Supabase |
| Newsletter | Collects consented emails without revealing who is subscribed | Sending and unsubscribe links need an email service |
| My Egypt sync | Trips sync with an account | Favourites, stamps and packing lists stay on the device |
| Photography | Golden Hour Finder and a photo tip per destination | Not a dedicated "photography locations" page |
| Arabic / RTL | Architecture ready (`lang`/`dir` on the root, content separated) | No Arabic translation yet |
| Official information | Sourced items show source and date | Several items are honestly marked **awaiting verification** (e.g. accessibility per site, some event dates, monument ticket prices). They need checking with official sources before launch. |

## ❌ Not implemented (evaluated and deprioritised)

| Idea | Why not now |
| --- | --- |
| The Perfect 24 Hours | Needs reliable opening hours per site, which could not be verified |
| Choose Your Own Egyptian Adventure | High writing cost, lower planning value than the trip builder |
| What Am I Looking At? | Needs image recognition or a large verified landmark dataset |
| Taste Your Way Through Egypt (food map) | The food guide covers the content; a map needs verified restaurant data |
| Egypt in Your Pocket (offline) | A service worker conflicts with per-request CSP nonces; needs separate design |
| Email notifications to askers | Needs an email provider |
