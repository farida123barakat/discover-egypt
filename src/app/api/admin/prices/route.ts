import type { NextRequest } from "next/server";
import { json, log, parseRequest } from "@/lib/api";
import { getAdmin } from "@/lib/auth";
import { priceUpdateSchema } from "@/lib/validation";
import { adminUpdatePrice } from "@/lib/store";

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, priceUpdateSchema, { bucket: "admin", limit: 120, windowMs: 60_000 });
  if (!p.ok) return p.res;
  const ok = await adminUpdatePrice(p.data.id, p.data.min, p.data.max);
  if (!ok) return json({ error: "Price not found" }, 404);
  log("admin.price_update", { admin: admin.id, id: p.data.id });
  return json({ ok: true });
}
