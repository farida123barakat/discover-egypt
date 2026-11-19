# Deployment guide

The site is **front-end only by default**: no database, no accounts, nothing to pay for. You need a free hosting account and nothing else. Supabase is an optional add-on for later (see [Optional: add a database](#optional-add-a-database-supabase-free-plan)).

## Front-end only (the default)

| What visitors get | How it works without a database |
| --- | --- |
| Every page, map, recipe, hieroglyph lesson, film, quiz and planner | Content ships with the site |
| Saved trips, favourites, stamps, bucket list, packing list | Saved in the visitor's browser |
| Memory Hunt album, postcards and the printable passport (PDF) | Saved in the browser, with **Save backup file / Restore from a file** on the album page to move it to another phone |
| Contact, Ask a local and Share your story | The form checks what's typed, then opens the visitor's own email app with the message ready to send to `CONTACT_EMAIL`. Without `CONTACT_EMAIL` the forms are replaced by a short note |

Switched off without a database (and hidden, so nothing looks broken): sign-in and accounts, the admin dashboard, publishing community answers on the site, the monthly newsletter, and ordering printed passports by post.

### Deploy it (Vercel Hobby, free)

1. Sign in to [vercel.com](https://vercel.com) with GitHub → **Add New → Project** → import `discover-egypt`. Framework: Next.js (detected).
2. Environment variables, both optional:

   | Name | Value |
   | --- | --- |
   | `CONTACT_EMAIL` | The address that contact and community emails should go to, e.g. `hello@your-domain` |
   | `NEXT_PUBLIC_SITE_URL` | Your address, e.g. `https://discover-egypt.vercel.app` (used for page metadata and share previews) |

   Leave every `SUPABASE` variable unset. The build stops if only some of them are set, so a half-finished database setup can't go live by accident.
3. **Deploy.** Check the live site: pages and photos load, the header has no "Sign in" link, there is no "Demo mode" notice, and the contact form opens your email app.

Any host that runs Node 22 also works: `npm ci && npm run build && npm start`.

## 1. Run locally first

```bash
npm ci
cp .env.example .env.local
npm run check        # typecheck, lint, unit + DB tests, build
npm run test:e2e     # browser tests (set CHROME_PATH if needed)
```

### Optional: run with a real local Supabase

Needs Docker. This is what CI does for its real-backend tests.

```bash
npx supabase start          # Postgres, Auth, Storage and a test mailbox, with our migrations and seed
npx supabase status         # shows the API URL and the publishable and secret keys
```

Put the URL and keys in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`, set `DEMO_LOCAL_MODE=false`, and run `npm run dev`. Sign-up and reset emails land in the local mailbox at <http://127.0.0.1:54324>. Run the real-backend browser tests with `npx playwright test -c playwright.supabase.config.ts`.

## Optional: add a database (Supabase, free plan)

Only needed if you want accounts, the admin dashboard, published community answers or postal printing. Steps 2–4 below; skip them for the front-end-only site.

## 2. Create the database (Supabase, free plan)

The app uses **Supabase**: Postgres with sign-in and file storage built in. The free plan costs nothing and needs no card (500 MB database, 1 GB files at the time of writing). Free projects **pause after a week without activity**; the daily Vercel cron in step 4 touches the database every day, which keeps it awake.

1. Sign up at [supabase.com](https://supabase.com) → **New project**. Region: Frankfurt (`eu-central-1`) is closest to Egypt. Save the database password in a password manager.
2. **Project Settings → API Keys**. Copy the **Project URL**, the **Publishable key** (`sb_publishable_…`) and a **Secret key** (`sb_secret_…`). If you only see the older `anon` and `service_role` keys, those work too (use the `…_ANON_KEY` / `…_SERVICE_ROLE_KEY` variable names), but Supabase is retiring them.
3. Apply the schema and content, either way:
   - **With the CLI** (`npx supabase login`, `npx supabase link --project-ref <your-ref>`, then `npx supabase db push`, then `psql "<connection string>" -f supabase/seed.sql`), or
   - **In the browser**: SQL Editor → paste and run each file in `supabase/migrations/` in name order, then `supabase/seed.sql`.
4. Check: **Table editor** lists `destinations` (16 rows), `recipes`, `bucket_list_activities`, `media_items`, and every table shows **RLS enabled**. **Storage** lists `destination-photos` (public), `memories` and `print-jobs` (private).

## 3. Configure sign-in (Supabase Auth)

1. **Authentication → URL Configuration**: *Site URL* = `https://your-domain` (your Vercel URL to start with). *Redirect URLs*: add `https://your-domain/auth/callback**` and, for local work, `http://localhost:3000/auth/callback**`.
2. **Authentication → Providers → Email**: enabled, **Confirm email** on, and set the **minimum password length** to **10**, the same as the app's own rule.
3. **Authentication → Emails → SMTP**: Supabase's built-in email is only for testing and sends very few messages per hour. For real visitors add an SMTP provider; several have free plans (for example Resend, Brevo or Postmark's developer tier).
4. Create the first administrator: **Authentication → Users → Add user** (email, a strong password, *Auto confirm*), then in **SQL Editor**:
   ```sql
   update public.user_profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
   ```
5. Turn on **multi-factor authentication** for that account (Authentication → Multi-factor).

What visitors get: create an account with email confirmation, sign in with a password or an emailed link, reset a forgotten password (`/account/new-password`), and sign out. All of it is tested against a real Supabase in CI (`e2e-supabase/`).

## 4. Deploy to Vercel with the database

Hobby is free for personal, non-commercial projects.

1. Sign in to [vercel.com](https://vercel.com) with GitHub → **Add New → Project** → import `discover-egypt`. Framework: Next.js (detected).
2. **Environment variables** (Production and Preview):

| Name | Value | Exposed to browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain` (your `*.vercel.app` URL at first) | yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | yes (safe) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) | yes (safe: RLS protects data) |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_…`) | **no — server only** |
| `CRON_SECRET` | 16+ random characters (`openssl rand -hex 24`). Vercel Cron sends it to `/api/cron/print-sweep` | **no — server only** |

   Do **not** set `DEMO_LOCAL_MODE`, `LOCAL_ADMIN_PASSWORD` or `SESSION_SECRET` in production. Local demo mode is refused on Vercel production, and **the build stops with a clear message if only some of the Supabase variables are set**.
3. **Deploy.** Then update Supabase's *Site URL* and *Redirect URLs* (step 3.1) to the real address.
4. Check on the live site:
   - pages, photos and map tiles load; there is **no "Demo mode" notice** in the bottom-left corner (it appears only without a real database);
   - create an account → the confirmation email arrives → you're signed in; sign out; sign in; reset the password;
   - submit a question → it appears in `/admin` → publish → it appears on `/community`;
   - `/admin` sends signed-out visitors to the login page, and ordinary accounts are told they aren't administrators;
   - response headers include `Content-Security-Policy` and `Strict-Transport-Security` (securityheaders.com).

## 5. Domain and HTTPS

Vercel → Project → **Domains** → add the domain and create the DNS records it shows (CNAME `cname.vercel-dns.com` for a subdomain, or A record for the apex). Vercel issues and renews TLS certificates automatically. HSTS is already sent by the app; only submit the domain to the HSTS preload list once HTTPS works on every subdomain.

## 6. Storage

The migration creates the public `destination-photos` bucket (5 MB, JPEG/PNG/WebP only). Visitors cannot upload: only the server, after an admin check, writes with the service role key.

The Memory Hunt migration adds two **private** buckets (5 MB, JPEG only):

| Bucket | Who can read and write | Holds |
| --- | --- | --- |
| `memories` | Each signed-in visitor, only inside a folder named after their own user id (`<user id>/<memory id>.jpg`). Nobody else, admins included. | Optional backups of memory photos |
| `print-jobs` | The server only (service role). No policies for `anon` or `authenticated`. | Postcard images waiting to be printed; deleted when a job is collected, cancelled or expires |

After `supabase db push`, check under **Storage** that both buckets exist and are *not* public, and under **Storage → Policies** that `memories` has the four "memories: owner …" policies and `print-jobs` has none.

## 7. Egypt Memory Hunt

Migration `20261117000000_memory_hunt.sql` creates:

- `memories`: optional cloud backup of a visitor's memories. Row Level Security allows the owner only (select, insert, update, delete). There is deliberately no admin policy.
- `print_partners`: places that print postcards. Visitors can read a partner only while it is `verified` **and** `active`; the internal `verification_note` column is not granted to `anon` or `authenticated` at all.
- `print_requests`: one row per print, with a random collection code and a hash of the visitor's cancel token. Created and looked up through the server only.

Memories themselves need no setup: they live in each visitor's browser. Backup appears in the album once Supabase Auth is configured (step 3).

### Add and verify a printing partner

Printing is hidden from visitors until at least one partner is live.

1. Agree the arrangement with the place directly (who prints, opening hours for collection, any cost to the visitor). Get it in writing.
2. Sign in to `/admin` → **Printing partners** → **Add partner**. Enter the name, kind, destination, the address visitors should go to and the collection hours.
3. Tick **Partnership verified**, set **Verified on**, and note *how* you verified it (who you spoke to, and the document). The note is required and never shown publicly.
4. Tick **Active**. The partner now appears in the album's "Print at a partner" option.
5. To pause a partner, use **Deactivate**. A partner with open print requests cannot be deleted.

### Run the print queue

`/admin` → **Postcard print requests** lists open jobs. Search by collection code when a visitor arrives, **Open postcard** to download the image for printing, then **Start printing → Mark ready → Mark collected**. Collected, cancelled and expired jobs have their image deleted straight away.

Requests that are never collected expire after 30 days. Their images are deleted by `vercel.json`'s daily cron (`/api/cron/print-sweep`, needs `CRON_SECRET`), and also whenever a print is requested or an admin opens the dashboard. Vercel Hobby runs crons once a day, which is enough.

### Local demo mode

With `DEMO_LOCAL_MODE=true`, printing works end to end: partners and requests are stored in `.data/local-db.json` and postcard images in `.data/print-jobs/`. Without any back end (no Supabase and no demo mode), `/api/print/partners` returns an empty list, so the album hides the print option, and `POST /api/print/requests` returns 501, which the album explains in plain words.

## 8. Monitoring, backups, recovery

- **Errors:** add Sentry (`npx @sentry/wizard -i nextjs`) and add its domain to `connect-src` in `src/middleware.ts`.
- **Logs:** API routes write structured JSON lines (no personal data). Use a Vercel log drain to keep them.
- **Uptime:** an external monitor on `/` and `/api/rates`.
- **Backups:** Supabase Pro has daily backups; enable **Point-in-Time Recovery** for a public service. Test a restore into a separate project every quarter.
- **Rollback:** Vercel → Deployments → *Promote* a previous deployment. Database changes should be additive so old code still works.
- **Dependencies:** Dependabot is configured in `.github/dependabot.yml`, and CI (`.github/workflows/ci.yml`) runs `npm run check`, the browser tests and `npm run audit:deps` on every push and pull request.

## 9. Before public launch

- Verify every item marked *awaiting verification* with official sources (see FEATURES.md).
- Replace the in-memory rate limiter with a shared one (Upstash Redis) — see SECURITY.md.
- Switch map tiles to a commercial provider.
- Get the privacy policy reviewed (data controller, retention, legal basis).
- Commission an independent penetration test.
