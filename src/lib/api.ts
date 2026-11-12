import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { ZodType } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors } from "@/lib/validation";

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/**
 * CSRF defence for state-changing requests: require JSON and a same-origin Origin header.
 * Browsers always send Origin on cross-site POSTs, and cross-site JSON needs a CORS preflight we never allow.
 */
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type Parsed<T> = { ok: true; data: T } | { ok: false; res: NextResponse };

export async function parseRequest<T>(
  req: NextRequest,
  schema: ZodType<T>,
  opts: { bucket: string; limit: number; windowMs: number },
): Promise<Parsed<T>> {
  if (!sameOrigin(req)) return { ok: false, res: json({ error: "Request blocked" }, 403) };
  if (!req.headers.get("content-type")?.includes("application/json"))
    return { ok: false, res: json({ error: "Unsupported content type" }, 415) };

  const rl = rateLimit(`${opts.bucket}:${clientIp(req.headers)}`, opts.limit, opts.windowMs);
  if (!rl.ok)
    return {
      ok: false,
      res: json({ error: "Too many requests. Please wait a moment and try again." }, 429, { "Retry-After": String(rl.retryAfter) }),
    };

  const text = await req.text();
  if (text.length > 20_000) return { ok: false, res: json({ error: "Request too large" }, 413) };
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, res: json({ error: "Invalid JSON" }, 400) };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = fieldErrors(result.error);
    if (errors.website) return { ok: false, res: json({ ok: true }, 200) }; // silently drop bots
    return { ok: false, res: json({ error: "Please check the highlighted fields", fields: errors }, 422) };
  }
  return { ok: true, data: result.data };
}

export function log(event: string, meta: Record<string, unknown> = {}) {
  // Structured log line without personal data — picked up by Vercel / any log drain.
  console.info(JSON.stringify({ at: new Date().toISOString(), event, ...meta }));
}
