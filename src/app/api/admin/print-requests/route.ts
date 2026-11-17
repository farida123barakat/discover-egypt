import type { NextRequest } from "next/server";
import { json, log, parseRequest } from "@/lib/api";
import { getAdmin } from "@/lib/auth";
import { printStatusSchema } from "@/lib/validation";
import { adminSetPrintStatus } from "@/lib/print-store";

/** Track a print job: requested → printing → ready → collected (or cancelled). Final states delete the image. */
export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const p = await parseRequest(req, printStatusSchema, { bucket: "admin", limit: 120, windowMs: 60_000 });
  if (!p.ok) return p.res;
  if (!(await adminSetPrintStatus(p.data.id, p.data.status))) return json({ error: "Request not found" }, 404);
  log("admin.print_status", { admin: admin.id, id: p.data.id, status: p.data.status });
  return json({ ok: true });
}
