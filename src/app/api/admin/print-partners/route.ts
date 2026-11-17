import type { NextRequest } from "next/server";
import { z } from "zod";
import { json, log, parseRequest } from "@/lib/api";
import { getAdmin } from "@/lib/auth";
import { printPartnerSchema } from "@/lib/validation";
import { adminDeletePartner, adminUpsertPartner } from "@/lib/print-store";

const LIMIT = { bucket: "admin", limit: 120, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, printPartnerSchema, LIMIT);
  if (!p.ok) return p.res;
  const saved = await adminUpsertPartner({ ...p.data, openingHours: p.data.openingHours ?? "", verificationNote: p.data.verificationNote ?? "" });
  log("admin.print_partner_upsert", { admin: admin.id, id: saved.id, live: saved.active && saved.verified });
  return json({ ok: true, id: saved.id });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, z.object({ id: z.string().uuid() }), LIMIT);
  if (!p.ok) return p.res;
  const r = await adminDeletePartner(p.data.id);
  if (r === "missing") return json({ error: "Partner not found" }, 404);
  if (r === "in-use") return json({ error: "This partner still has open print requests. Deactivate it instead." }, 409);
  log("admin.print_partner_delete", { admin: admin.id, id: p.data.id });
  return json({ ok: true });
}
