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
5. Check: **Table editor** shows `destinations` (16 rows) and every table shows **RLS enabled**.

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

## 7. Monitoring, backups, recovery

- **Errors:** add Sentry (`npx @sentry/wizard -i nextjs`) and add its domain to `connect-src` in `src/middleware.ts`.
- **Logs:** API routes write structured JSON lines (no personal data). Use a Vercel log drain to keep them.
- **Uptime:** an external monitor on `/` and `/api/rates`.
- **Backups:** Supabase Pro has daily backups; enable **Point-in-Time Recovery** for a public service. Test a restore into a separate project every quarter.
- **Rollback:** Vercel → Deployments → *Promote* a previous deployment. Database changes should be additive so old code still works.
- **Dependencies:** enable GitHub Dependabot; run `npm run audit:deps` in CI.

## 8. Before public launch

- Verify every item marked *awaiting verification* with official sources (see FEATURES.md).
- Replace the in-memory rate limiter with a shared one (Upstash Redis) — see SECURITY.md.
- Switch map tiles to a commercial provider.
- Get the privacy policy reviewed (data controller, retention, legal basis).
- Commission an independent penetration test.
