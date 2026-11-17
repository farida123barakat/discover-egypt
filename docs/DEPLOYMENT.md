# Deployment guide

> **Not deployed yet.** These are the steps. Nothing here has been run against a real Supabase project or Vercel account.

## What you need

| Item | Where | Cost |
| --- | --- | --- |
| GitHub repository | already set up (private) | free |
| Supabase project | supabase.com → New project (region: Frankfurt `eu-central-1` is closest to Egypt) | free tier to test, Pro for launch |
| Vercel account linked to GitHub | vercel.com | Hobby is for non-commercial use; a ministry site needs Pro/Enterprise |
| Domain name | e.g. a subdomain the Ministry controls | — |
| SMTP provider for sign-in emails | e.g. Resend, Postmark, SES (Supabase's built-in email is rate-limited) | low |

## 1. Run locally first

```bash
npm ci
cp .env.example .env.local
npm run check        # typecheck, lint, unit + DB tests, build
npm run test:e2e     # browser tests (set CHROME_PATH if needed)
```

## 2. Create the database

1. Create the Supabase project. Save the database password in a password manager.
2. Install the CLI: `npm i -g supabase`, then `supabase login` and `supabase link --project-ref <your-ref>`.
3. Apply the schema: `supabase db push` (runs `supabase/migrations/*`).
4. Load content: `npm run db:seed:generate`, then paste `supabase/seed.sql` into **SQL Editor** and run it (or `psql "$DATABASE_URL" -f supabase/seed.sql`).
5. Check: **Table editor** shows `destinations` (16 rows) and every table shows **RLS enabled**, including `memories`, `print_partners` and `print_requests`.

## 3. Configure auth

1. **Authentication → URL configuration:** Site URL = `https://your-domain`; Redirect URLs = `https://your-domain/auth/callback`.
2. **Authentication → Providers → Email:** enable; turn *Confirm email* on.
3. **Authentication → SMTP:** add your SMTP provider.
4. Create the first admin: **Authentication → Users → Add user** (strong password), then in SQL Editor:
   ```sql
   update public.user_profiles set role = 'admin' where id = (select id from auth.users where email = 'admin@your-domain');
   ```
5. Turn on **MFA** for admin accounts (Authentication → Multi-factor).

## 4. Deploy to Vercel

1. Vercel → **Add New Project** → import the GitHub repo. Framework: Next.js (auto).
2. **Environment variables** (Production and Preview):

| Name | Value | Exposed to browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain` | yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | yes (safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | yes (safe, RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | **no — server only** |
| `CRON_SECRET` | 16+ random characters (`openssl rand -hex 24`). Vercel Cron sends it to `/api/cron/print-sweep` | **no — server only** |

   Do **not** set `DEMO_LOCAL_MODE`, `LOCAL_ADMIN_PASSWORD` or `SESSION_SECRET` in production. Local mode is refused on Vercel production anyway.
3. Deploy. Then verify on the live URL:
   - every page loads; photos and map tiles appear (CSP allows them);
   - submit a question → it appears in `/admin` → publish → it appears on `/community`;
   - `/admin` redirects to login when signed out;
   - response headers include `Content-Security-Policy` and `Strict-Transport-Security` (check at securityheaders.com).

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
