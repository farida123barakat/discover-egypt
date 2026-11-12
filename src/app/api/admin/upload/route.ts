import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { json, log, sameOrigin } from "@/lib/api";
import { getAdmin } from "@/lib/auth";
import { backendMode } from "@/lib/env";
import { supabaseService } from "@/lib/supabase/server";
import { detectImageType, MAX_UPLOAD_BYTES } from "@/lib/files";

/** Admin photo upload to the Supabase `destination-photos` bucket. Type is checked by magic bytes, not by name. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: "Request blocked" }, 403);
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  if (backendMode() !== "supabase") return json({ error: "Photo storage needs Supabase. See DEPLOYMENT.md." }, 501);

  const form = await req.formData();
  const file = form.get("file");
  const alt = String(form.get("alt") ?? "").trim();
  if (!(file instanceof File)) return json({ error: "Choose a file" }, 422);
  if (alt.length < 10) return json({ error: "Describe the photo in at least 10 characters (alt text)" }, 422);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: "Files must be 5 MB or smaller" }, 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return json({ error: "Only JPEG, PNG or WebP images are allowed" }, 415);

  const path = `${randomUUID()}.${type.ext}`; // random name: never trust the uploaded filename
  const sb = supabaseService();
  const { error } = await sb.storage.from("destination-photos").upload(path, bytes, { contentType: type.mime, upsert: false });
  if (error) return json({ error: "Upload failed" }, 500);
  await sb.from("media").insert({ path, alt, uploaded_by: admin.id });
  log("admin.upload", { admin: admin.id, path });
  return json({ ok: true, path }, 201);
}
