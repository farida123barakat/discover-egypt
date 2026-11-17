# Feature completion checklist

Status as of **17 November 2026**. Test references point to `tests/` (Vitest) and `e2e/` (Playwright).

**Legend**
- ✅ **Fully implemented and tested**
- 🔑 **Implemented, needs external credentials** (works in code; needs a Supabase project or a key to run for real)
- 🟡 **Partially implemented** (a working, smaller version; the gap is described)
- ❌ **Not implemented**

> **17 November:** all checks, including the Memory Hunt and Memory Passport tests, run in GitHub Actions on every push and pass. See docs/TEST_RESULTS.md.

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
| **Watch & Discover**: 3 original animated explainers (no narration; captions on by default), WebVTT captions and chapters, follow-along transcript with click-to-seek, sources and credits per film; click-to-load YouTube embeds (privacy-enhanced, captions requested); films on destination pages; admin add/edit/publish/feature/delete with publishing rules (length 5–15 min for embeds, sources, destination, captions note); drafts hidden on the live site | `unit/media`, `api/routes` (watch & discover), e2e `watch` (video plays, captions showing, chapter and transcript seek, YouTube loads nothing before click, admin flow), a11y `/watch`, `/watch/*` |
| **Hieroglyphics Explorer**: scan or upload a single sign and get an honest match ("most likely", "not sure", or "couldn't find a clear sign"), all on the device; camera flow; 57-sign library with search and filters; lessons; quiz; draw-the-sign challenge; name in a cartouche (labelled as a modern spelling) | `unit/hieroglyphs`, e2e `hieroglyphs` (7 tests, including a fake camera), a11y `/hieroglyphs` |
| **Taste Egypt by region**: choose a region or share a rounded location (denied location falls back gracefully); dishes per region; recipes with filters, save, servings scaling and print; recipe drafts hidden on the live site until an admin approves them | `unit/food`, `api/routes` (recipe review gate), e2e `taste` (5 tests), a11y `/taste`, `/taste/koshari` |
| **Egypt bucket list**: 18 experiences, add / complete / undo, badges, "in season" view, progress on the device and synced to an account when signed in; admin create, edit, publish, feature and delete | `unit/bucket`, e2e `bucket` (visitor and admin flows), a11y `/bucket-list` |
| **Egypt Memory Hunt**: 20 challenges with filters (destination, kind, travelling as, hide completed); save a memory (photo, caption, story, date, destination) privately in IndexedDB; photos re-encoded on the device so EXIF/GPS is removed; optional "use my location" rounded on the device; points and 8 achievements; live postcard preview in 5 designs with optional Arabic; print-ready A6 PDF with 3 mm bleed, JPEG image, share sheet; album PDF; edit and delete; summary in My Egypt | `unit/memory-hunt` (points, achievements, templates, text wrapping, EXIF removal, codes), e2e `memory-hunt` journey (pick, capture, album, both PDFs, edit, delete), a11y and mobile checks on `/memory-hunt`, `/new`, `/album` |
| **Memory Passport** (print it like a passport): a souvenir booklet at passport size (88 × 125 mm) drawn on the device — navy cover with a gold eye-of-Horus emblem, traveller page (optional name, photo, journey, places, points, signature line), ink stamps shaped by kind of challenge (round, cartouche, postage edge, hexagon, sunset, dashed), a page per memory with the photo mounted, gold-seal endorsements for achievements, note pages; flip-through preview of facing pages; **A4 booklet PDF in saddle-stitch order** (print double-sided, fold, staple) with crop and fold marks, or **print-shop PDF** with 3 mm bleed; marked "Souvenir · not a travel document", no state emblem, number or machine-readable zone | `unit/passport` (19 tests: page plan, multiple-of-four padding, stamp order and points, saddle-stitch imposition, spreads, screen-reader text, dates), e2e `memory-hunt` (preview, flip, name, both PDFs and their page counts); every page rendered in Chrome without errors |
| **Memory Hunt printing** (local mode): visitors choose a verified, active partner, give consent, get a collection code + QR code, follow the status and cancel; the option is hidden when no partner is live; 501 explained when there's no back end; admins add, verify, activate and deactivate partners and run the queue (requested → printing → ready → collected); images deleted on collection, cancellation or expiry (daily sweep) | `api/print` (18 tests: same-origin, 5-per-hour limit, consent, JPEG only, wrong token 403, closed request 409, admin 401, partner in use 409, expiry sweep and cron secret), e2e `memory-hunt` print flow, db RLS tests |
| **Admin** (local mode): sign-in, moderation, price editor, **event manager** (add, edit, delete; "verified" requires a source), **featured destinations**, recipe review, bucket-list manager, printing partners and print queue | `api/routes`, `api/print`, e2e journeys 6–7, `bucket`, `memory-hunt` |
| Admin closed to visitors (pages redirect, APIs return 401) | `api/routes`, e2e |
| Security: CSRF origin check, JSON-only APIs, rate limits, CSP with nonces, security headers, signed httpOnly admin cookie, upload type check by magic bytes | `api/routes`, `unit/*` |
| **Database**: schema, constraints, indexes, Row Level Security (no self-promotion to admin, no access to others' trips, public sees only approved posts without emails; memories owner-only with no admin access, storage folder policies, partners visible only when verified and active, verification note column-revoked, print requests server-side only) | `db/rls` (on real Postgres via PGlite, including 12 Memory Hunt tests) |
| Accessibility: skip link, keyboard, focus styles, text size and high-contrast controls, reduced motion, WCAG 2.2 AA axe scan | e2e `a11y` (14 tests) |
| Responsive layout and mobile navigation (no sideways scrolling) | e2e `responsive` (Pixel 7) |

## 🔑 Implemented, needs external credentials

| Feature | What is needed |
| --- | --- |
| Supabase back end for all submissions, prices, events, featured slots | A Supabase project + the three Supabase variables (see DEPLOYMENT.md). Schema and RLS are tested; the live connection has **not** been run against a real project. |
| **Visitor accounts**: email sign-in link, save trips to the cloud, load and delete them on any device | Supabase Auth + an SMTP provider for production email volume |
| **Admin sign-in with Supabase Auth** and roles | Supabase project; promote an admin with one SQL line |
| **Photo uploads** (JPEG/PNG/WebP, 5 MB, checked by content, random file names) | Supabase Storage bucket (created by the migration) |
| **Memory Hunt cloud backup**: back up, restore and delete memories and photos in the visitor's own account | Supabase Auth and Storage. Policies tested on PGlite; uploads not yet run against a real project |
| **Memory Hunt printing on Supabase**: print jobs in the private `print-jobs` bucket; daily expiry sweep | Supabase project, `CRON_SECRET` on Vercel, and at least one real, verified partner (none exist yet) |
| **Live exchange rates** (EUR/USD/GBP → EGP) | No key needed, but needs internet access from the server. If the provider fails, the converter asks for a manual rate and never invents one. |

## 🟡 Partially implemented

| Feature | What works | What is missing |
| --- | --- | --- |
| Admin content management | Prices, events, featured destinations, moderation, photo upload | Editing destination text, attractions and historical stories in the dashboard. Today these are edited in `src/content` and re-seeded. |
| Admin analytics | Counts of pending, published, rejected, questions, stories | Traffic and usage analytics (deliberately no tracking) |
| Contact messages | Stored safely (write-only for the public) | No inbox view in the dashboard; read them in Supabase |
| Newsletter | Collects consented emails without revealing who is subscribed | Sending and unsubscribe links need an email service |
| My Egypt sync | Trips and bucket-list progress sync with an account; memories can be backed up | Favourites, stamps and packing lists stay on the device |
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
