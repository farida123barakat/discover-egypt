import type { NextRequest } from "next/server";
import { json, parseRequest } from "@/lib/api";
import { newsletterSchema } from "@/lib/validation";
import { BackendUnavailable, subscribe } from "@/lib/store";

export async function POST(req: NextRequest) {
  const p = await parseRequest(req, newsletterSchema, { bucket: "newsletter", limit: 5, windowMs: 10 * 60_000 });
  if (!p.ok) return p.res;
  try {
    await subscribe(p.data.email);
    // Same reply whether or not the address already existed (no account enumeration).
    return json({ ok: true, message: "You're on the list. You can unsubscribe at any time." }, 201);
  } catch (e) {
    return json({ error: e instanceof BackendUnavailable ? e.message : "Something went wrong. Please try again." }, e instanceof BackendUnavailable ? 503 : 500);
  }
}
