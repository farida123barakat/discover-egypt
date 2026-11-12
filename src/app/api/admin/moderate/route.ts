import type { NextRequest } from "next/server";
import { json, log, parseRequest } from "@/lib/api";
import { getAdmin } from "@/lib/auth";
import { moderationSchema } from "@/lib/validation";
import { adminModerate } from "@/lib/store";

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, moderationSchema, { bucket: "admin", limit: 120, windowMs: 60_000 });
  if (!p.ok) return p.res;
  const found = await adminModerate(p.data.id, p.data.action, p.data.answer);
  if (!found) return json({ error: "Submission not found" }, 404);
  log("admin.moderate", { admin: admin.id, action: p.data.action, kind: p.data.kind });
  return json({ ok: true });
}
