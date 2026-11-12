import type { NextRequest } from "next/server";
import { z } from "zod";
import { json, log, parseRequest } from "@/lib/api";
import { backendMode } from "@/lib/env";
import { ADMIN_COOKIE, adminCookieOptions, checkLocalAdminPassword, createLocalAdminToken } from "@/lib/auth";

/** Local demo mode only. With Supabase, admins sign in through Supabase Auth on /admin/login. */
export async function POST(req: NextRequest) {
  if (backendMode() !== "local") return json({ error: "Not available" }, 404);
  const p = await parseRequest(req, z.object({ password: z.string().min(1).max(200) }), { bucket: "admin-login", limit: 5, windowMs: 15 * 60_000 });
  if (!p.ok) return p.res;
  if (!checkLocalAdminPassword(p.data.password)) {
    log("admin.login_failed");
    return json({ error: "Incorrect password" }, 401);
  }
  log("admin.login");
  const res = json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createLocalAdminToken(), adminCookieOptions);
  return res;
}
