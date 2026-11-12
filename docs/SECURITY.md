# Security review and known risks

This is an honest self-review, **not** a certification. The application has not had an external penetration test.

## Controls in place

| Threat | Control | Where |
| --- | --- | --- |
| **SQL injection** | No SQL strings built from input. Supabase client uses parameterised PostgREST calls. Seed SQL is generated from trusted repo files with quoting. | `src/lib/store.ts` |
| **XSS** | React escapes all output; the codebase contains no `dangerouslySetInnerHTML` or `innerHTML` with user data. Strict **CSP** with per-request nonces and `strict-dynamic`; `object-src 'none'`, `base-uri 'self'`. Control characters stripped from input. | `src/middleware.ts`, `validation.ts` |
| **CSRF** | State-changing APIs require a same-origin `Origin` header **and** `application/json` (cross-site forms can't send JSON without a CORS preflight, which is never allowed). Admin cookie is `SameSite=Strict`. | `src/lib/api.ts` |
| **Broken access control** | Every admin page and route calls `getAdmin()` on the server. RLS repeats the rules in the database. | `src/lib/auth.ts`, migration |
| **IDOR** | `user_id` is taken from the verified session, never from the request. RLS `user_id = auth.uid()` on all itinerary operations. Tested. | `store.ts`, `tests/db/rls.test.ts` |
| **Privilege escalation** | No update policy on `user_profiles`; new users are always `visitor`. Tested. | migration |
| **Auth abuse** | Rate limits on admin login (5 / 15 min), forms (3–5 per 10 min) and trip saving; sign-in emails use Supabase Auth's own limits. Constant-time password comparison. Same reply whether or not an email has an account. | routes, `auth.ts`, `AccountPanel.tsx` |
| **Spam** | Honeypot field (bots get a fake success), rate limits, required consent, length limits, moderation before anything is public. | `validation.ts`, `api.ts` |
| **Malicious uploads** | Admin-only; type checked by magic bytes (not file name or MIME header); SVG/HTML refused; 5 MB cap; random file name; bucket restricted to image MIME types. | `upload/route.ts`, `files.ts` |
| **Sensitive data exposure** | Public view shows first name only, never email. Contact and newsletter tables are write-only for the public. Service-role key is server-only (`server-only` import guard). Logs contain no personal data. | migration, `store.ts` |
| **Open redirect** | `/auth/callback` only accepts local paths for `next`. | `auth/callback/route.ts` |
| **Session security** | Supabase cookies managed by `@supabase/ssr`; local admin cookie is HMAC-signed, `httpOnly`, `Secure` in production, `SameSite=Strict`, 8-hour expiry. | `auth.ts` |
| **Headers** | HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`, COOP. `X-Powered-By` removed. | `next.config.ts` |
| **Dependencies** | `npm audit --omit=dev`: 0 vulnerabilities (13 Nov 2026), after pinning PostCSS ≥ 8.5.23 via `overrides`. | `package.json` |
| **Secrets** | None in code or git history; `.env*` ignored except `.env.example` (placeholders). | `.gitignore` |

## Remaining production risks

| Risk | Severity | Recommendation |
| --- | --- | --- |
| Rate limits are **in memory, per server instance**. On Vercel each instance counts separately, so limits are weaker. | Medium | Use Upstash Redis (`@upstash/ratelimit`); same interface. |
| No CAPTCHA. Honeypot + rate limit stop simple bots, not targeted ones. | Medium | Add Cloudflare Turnstile to public forms; add its domain to the CSP. |
| `style-src 'unsafe-inline'` is needed by Leaflet and animations. | Low | Acceptable with nonce-based `script-src`; revisit if libraries allow. |
| Hot-linked third-party images and map tiles (Wikimedia, OSM) can see visitor IPs and could go offline. | Low | Self-host approved photos in Supabase Storage; commercial tile provider. |
| Supabase admin accounts are protected by password only by default. | Medium | Enforce MFA for admins (Supabase Auth MFA + check `aal2` in `getAdmin`). |
| Local demo mode stores data in a JSON file with one shared password. | Low (dev only) | Refused on Vercel production by code; never enable on a public server. |
| No audit log table for admin actions (only structured logs). | Low | Add an `admin_audit` table written by admin routes. |
| Data retention not automated. | Low | Scheduled job to delete rejected submissions and old contact messages after 12 months. |
| Not externally tested. | — | Independent penetration test and DPIA before launch. |

## Reporting

Report security issues privately through the contact form with topic "Something else" and the word SECURITY in the message. Do not open public issues for vulnerabilities.
