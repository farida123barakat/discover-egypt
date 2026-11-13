import type { NextRequest } from "next/server";
import { json, parseRequest } from "@/lib/api";
import { backendMode } from "@/lib/env";
import { bucketProgressSchema } from "@/lib/validation";
import { getMyBucket, saveMyBucket } from "@/lib/store";

/** A signed-in visitor's own bucket-list progress. Guests keep progress on their device only. */
export async function GET() {
  if (backendMode() !== "supabase") return json({ error: "Accounts are not enabled" }, 501);
  const progress = await getMyBucket();
  if (!progress) return json({ error: "Sign in required" }, 401);
  return json({ progress });
}

export async function PUT(req: NextRequest) {
  if (backendMode() !== "supabase") return json({ error: "Accounts are not enabled" }, 501);
  const p = await parseRequest(req, bucketProgressSchema, { bucket: "bucket-sync", limit: 30, windowMs: 10 * 60_000 });
  if (!p.ok) return p.res;
  const r = await saveMyBucket(p.data);
  if (!r.ok) return json({ error: r.status === 401 ? "Sign in required" : "Could not save" }, r.status);
  return json({ ok: true });
}
