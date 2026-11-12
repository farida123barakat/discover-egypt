import type { NextRequest } from "next/server";
import { json, log, parseRequest } from "@/lib/api";
import { getAdmin } from "@/lib/auth";
import { featuredSchema } from "@/lib/validation";
import { adminSetFeatured } from "@/lib/store";

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, featuredSchema, { bucket: "admin", limit: 60, windowMs: 60_000 });
  if (!p.ok) return p.res;
  await adminSetFeatured(p.data.slugs);
  log("admin.featured_update", { admin: admin.id });
  return json({ ok: true });
}
