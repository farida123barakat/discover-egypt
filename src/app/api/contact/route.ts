import type { NextRequest } from "next/server";
import { json, log, parseRequest } from "@/lib/api";
import { contactSchema } from "@/lib/validation";
import { BackendUnavailable, saveContact } from "@/lib/store";

export async function POST(req: NextRequest) {
  const p = await parseRequest(req, contactSchema, { bucket: "contact", limit: 5, windowMs: 10 * 60_000 });
  if (!p.ok) return p.res;
  const { name, email, topic, message } = p.data;
  try {
    await saveContact({ name, email, topic, message });
    log("contact.created", { topic });
    return json({ ok: true, message: "Message received. We aim to reply within a few working days." }, 201);
  } catch (e) {
    return json({ error: e instanceof BackendUnavailable ? e.message : "Something went wrong. Please try again." }, e instanceof BackendUnavailable ? 503 : 500);
  }
}
