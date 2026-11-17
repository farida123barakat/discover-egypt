import type { NextRequest } from "next/server";
import { json, log, parseRequest } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { CODE_RE, normaliseCode } from "@/lib/print";
import { cancelPrintRequest, getPrintStatus } from "@/lib/print-store";
import { cancelPrintSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ code: string }> };

/** Status for a collection code. Rate limited so codes cannot be guessed by brute force. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const rl = rateLimit(`print-status:${clientIp(req.headers)}`, 30, 60_000);
  if (!rl.ok) return json({ error: "Too many lookups" }, 429, { "Retry-After": String(rl.retryAfter) });
  const code = normaliseCode(decodeURIComponent((await params).code));
  if (!CODE_RE.test(code)) return json({ error: "Not found" }, 404);
  const s = await getPrintStatus(code);
  return s ? json(s) : json({ error: "Not found" }, 404);
}

/** Cancel with the one-time token from the original request. Deletes the postcard image. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const p = await parseRequest(req, cancelPrintSchema, { bucket: "print-cancel", limit: 20, windowMs: 60_000 });
  if (!p.ok) return p.res;
  const code = normaliseCode(decodeURIComponent((await params).code));
  if (!CODE_RE.test(code)) return json({ error: "Not found" }, 404);
  const r = await cancelPrintRequest(code, p.data.token);
  if (r === "missing") return json({ error: "Not found" }, 404);
  if (r === "forbidden") return json({ error: "Not allowed" }, 403);
  if (r === "final") return json({ error: "This request is already closed" }, 409);
  log("print.cancelled");
  return json({ ok: true });
}
