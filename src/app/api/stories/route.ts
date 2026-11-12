import type { NextRequest } from "next/server";
import { json, log, parseRequest } from "@/lib/api";
import { storySchema } from "@/lib/validation";
import { BackendUnavailable, createSubmission } from "@/lib/store";

export async function POST(req: NextRequest) {
  const p = await parseRequest(req, storySchema, { bucket: "story", limit: 3, windowMs: 10 * 60_000 });
  if (!p.ok) return p.res;
  const { name, email, country, title, story, destination } = p.data;
  try {
    await createSubmission({ kind: "story", name, email, destination, title, body: story, country });
    log("submission.created", { kind: "story" });
    return json({ ok: true, message: "Thank you for sharing! Your story will appear once our team has reviewed it." }, 201);
  } catch (e) {
    return json({ error: e instanceof BackendUnavailable ? e.message : "Something went wrong. Please try again." }, e instanceof BackendUnavailable ? 503 : 500);
  }
}
