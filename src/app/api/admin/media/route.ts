import type { NextRequest } from "next/server";
import { z } from "zod";
import { json, log, parseRequest } from "@/lib/api";
import { getAdmin } from "@/lib/auth";
import { mediaSchema } from "@/lib/validation";
import { adminDeleteMedia, adminUpsertMedia, getMediaAll } from "@/lib/store";
import { explainers, timeline } from "@/content/explainers";
import { publishBlockers, type MediaItem } from "@/content/media";

const LIMIT = { bucket: "admin", limit: 120, windowMs: 60_000 };

/** Create or update a Watch & Discover item. Admins only. */
export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, mediaSchema, LIMIT);
  if (!p.ok) return p.res;
  const existing = (await getMediaAll()).find((m) => m.id === p.data.id);
  const today = new Date().toISOString().slice(0, 10);

  let item: MediaItem = {
    ...p.data,
    provenance: p.data.kind === "original" ? "original-ai-assisted" : "curated-embed",
    createdAt: existing?.createdAt ?? today,
    lastReviewed: p.data.status === "published" ? today : (existing?.lastReviewed ?? null),
    // Never store an admin's email in a row the public can read.
    reviewer: p.data.status === "published" ? "Discover Egypt editor" : existing?.reviewer,
  };

  if (item.kind === "original") {
    // Originals are rendered from a script; their captions, transcript and chapters come from it.
    const e = explainers.find((x) => x.id === (item.explainerId ?? existing?.explainerId));
    if (!e) return json({ error: "Unknown film", fields: { explainerId: "Original films come from the explainer scripts" } }, 422);
    const t = timeline(e);
    item = { ...item, explainerId: e.id, durationSec: Math.round(t.duration), chapters: t.chapters.map((c) => ({ start: c.start, title: c.title })), transcript: t.cues.map((c) => ({ start: c.start, text: c.text })), youtubeId: undefined };
  }

  if (item.status === "published") {
    const blockers = publishBlockers(item);
    if (blockers.length) return json({ error: blockers[0], fields: { status: blockers.join(" ") } }, 422);
  }

  await adminUpsertMedia(item);
  log("admin.media_upsert", { admin: admin.id, id: item.id, status: item.status, created: !existing });
  return json({ ok: true, created: !existing });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, z.object({ id: z.string().regex(/^[a-z0-9-]{3,60}$/) }), LIMIT);
  if (!p.ok) return p.res;
  const ok = await adminDeleteMedia(p.data.id);
  if (!ok) return json({ error: "Item not found" }, 404);
  log("admin.media_delete", { admin: admin.id, id: p.data.id });
  return json({ ok: true });
}
