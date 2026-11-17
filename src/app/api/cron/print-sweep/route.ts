import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { json, log } from "@/lib/api";
import { sweepPrintJobs } from "@/lib/print-store";

/**
 * Daily housekeeping (see vercel.json): deletes postcard images of print requests that expired
 * without being collected. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; without the
 * secret configured the route refuses every call.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const ok = secret.length >= 16 && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return json({ error: "Not authorised" }, 401);
  const swept = await sweepPrintJobs();
  log("cron.print_sweep", { swept });
  return json({ ok: true, swept });
}
