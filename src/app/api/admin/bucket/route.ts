import type { NextRequest } from "next/server";
import { z } from "zod";
import { json, log, parseRequest } from "@/lib/api";
import { getAdmin } from "@/lib/auth";
import { photos } from "@/content/images";
import { bucketSchema } from "@/lib/validation";
import { adminDeleteBucket, adminUpsertBucket, getBucketAll } from "@/lib/store";

const LIMIT = { bucket: "admin", limit: 120, windowMs: 60_000 };

/** Create or update an official bucket-list activity. Admins only. */
export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, bucketSchema, LIMIT);
  if (!p.ok) return p.res;
  if (p.data.photo && !(p.data.photo in photos)) return json({ error: "Unknown photo", fields: { photo: "Choose a photo from the library" } }, 422);
  const existing = (await getBucketAll()).find((a) => a.id === p.data.id);
  const today = new Date().toISOString().slice(0, 10);
  await adminUpsertBucket({
    ...p.data,
    photo: p.data.photo as never,
    createdAt: existing?.createdAt ?? today,
    lastReviewed: today,
  });
  log("admin.bucket_upsert", { admin: admin.id, id: p.data.id, created: !existing });
  return json({ ok: true, created: !existing });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, z.object({ id: z.string().regex(/^[a-z0-9-]{3,60}$/) }), LIMIT);
  if (!p.ok) return p.res;
  const ok = await adminDeleteBucket(p.data.id);
  if (!ok) return json({ error: "Activity not found" }, 404);
  log("admin.bucket_delete", { admin: admin.id, id: p.data.id });
  return json({ ok: true });
}
