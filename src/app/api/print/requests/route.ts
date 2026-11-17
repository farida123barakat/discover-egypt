import type { NextRequest } from "next/server";
import { json, log, sameOrigin } from "@/lib/api";
import { backendMode } from "@/lib/env";
import { detectImageType, MAX_UPLOAD_BYTES } from "@/lib/files";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createPrintRequest, currentUserId, PrintUnavailable } from "@/lib/print-store";

/**
 * Ask a partner to print a postcard. Sends only the finished postcard image — no name, email,
 * caption text or location. Returns a random collection code and a one-time cancel token.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: "Request blocked" }, 403);
  if (backendMode() === "none") return json({ error: "Printing is not available" }, 501);
  const rl = rateLimit(`print:${clientIp(req.headers)}`, 5, 60 * 60_000);
  if (!rl.ok) return json({ error: "You've asked for several prints. Please try again later." }, 429, { "Retry-After": String(rl.retryAfter) });
  if (!req.headers.get("content-type")?.includes("multipart/form-data")) return json({ error: "Unsupported content type" }, 415);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Invalid upload" }, 400);
  }
  const partnerId = String(form.get("partnerId") ?? "");
  const consent = form.get("consent") === "yes";
  const file = form.get("postcard");
  if (!consent) return json({ error: "Please confirm that the partner may see and print this postcard", fields: { consent: "Required" } }, 422);
  if (!/^[0-9a-f-]{36}$/.test(partnerId)) return json({ error: "Choose where to collect it", fields: { partnerId: "Required" } }, 422);
  if (!(file instanceof File)) return json({ error: "Postcard missing" }, 422);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: "The postcard image is too large" }, 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (detectImageType(bytes)?.mime !== "image/jpeg") return json({ error: "Only JPEG postcards can be printed" }, 415);

  try {
    const r = await createPrintRequest(partnerId, bytes, await currentUserId());
    log("print.requested", { partner: partnerId }); // never log the code or token
    return json({ ok: true, ...r }, 201);
  } catch (e) {
    if (e instanceof PrintUnavailable) return json({ error: "That printing partner is not available right now" }, 409);
    return json({ error: "Could not create the print request" }, 500);
  }
}
