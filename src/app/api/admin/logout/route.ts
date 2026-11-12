import type { NextRequest } from "next/server";
import { json, sameOrigin } from "@/lib/api";
import { ADMIN_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: "Request blocked" }, 403);
  const res = json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
