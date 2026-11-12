import type { NextRequest } from "next/server";
import { json, log, parseRequest } from "@/lib/api";
import { getAdmin } from "@/lib/auth";
import { eventDeleteSchema, eventSchema } from "@/lib/validation";
import { adminDeleteEvent, adminUpsertEvent } from "@/lib/store";

const LIMIT = { bucket: "admin", limit: 120, windowMs: 60_000 };

/** Create or update an event. Marking it "verified" stamps today's date as last verified. */
export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, eventSchema, LIMIT);
  if (!p.ok) return p.res;
  const { sourceName, sourceUrl, ...e } = p.data;
  if (e.status === "verified" && !sourceUrl) return json({ error: "Verified events need a source link", fields: { sourceUrl: "Add the official source" } }, 422);
  await adminUpsertEvent({
    ...e,
    lastVerified: e.status === "verified" ? new Date().toISOString().slice(0, 10) : null,
    source: sourceUrl ? { name: sourceName || sourceUrl, url: sourceUrl } : undefined,
  });
  log("admin.event_upsert", { admin: admin.id, id: e.id });
  return json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, eventDeleteSchema, LIMIT);
  if (!p.ok) return p.res;
  const ok = await adminDeleteEvent(p.data.id);
  if (!ok) return json({ error: "Event not found" }, 404);
  log("admin.event_delete", { admin: admin.id, id: p.data.id });
  return json({ ok: true });
}
