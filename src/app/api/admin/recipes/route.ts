import type { NextRequest } from "next/server";
import { z } from "zod";
import { json, log, parseRequest } from "@/lib/api";
import { getAdmin } from "@/lib/auth";
import { adminSetRecipeReview } from "@/lib/store";

const schema = z.object({ slug: z.string().regex(/^[a-z0-9-]{2,60}$/), status: z.enum(["draft", "approved"]) });

/** Approve (publish) or return a recipe to draft. Only approved recipes are public on the live site. */
export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, schema, { bucket: "admin", limit: 120, windowMs: 60_000 });
  if (!p.ok) return p.res;
  const ok = await adminSetRecipeReview(p.data.slug, p.data.status, admin.email ?? "admin");
  if (!ok) return json({ error: "Recipe not found" }, 404);
  log("admin.recipe_review", { admin: admin.id, slug: p.data.slug, status: p.data.status });
  return json({ ok: true });
}
