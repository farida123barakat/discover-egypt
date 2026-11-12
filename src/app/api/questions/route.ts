import type { NextRequest } from "next/server";
import { json, log, parseRequest } from "@/lib/api";
import { questionSchema } from "@/lib/validation";
import { BackendUnavailable, createSubmission } from "@/lib/store";

export async function POST(req: NextRequest) {
  const p = await parseRequest(req, questionSchema, { bucket: "question", limit: 5, windowMs: 10 * 60_000 });
  if (!p.ok) return p.res;
  const { name, email, destination, question } = p.data;
  try {
    await createSubmission({ kind: "question", name, email, destination, title: null, body: question, country: null });
    log("submission.created", { kind: "question" });
    return json({ ok: true, message: "Thank you! A local expert will review your question. Approved answers appear on the site." }, 201);
  } catch (e) {
    return json({ error: e instanceof BackendUnavailable ? e.message : "Something went wrong. Please try again." }, e instanceof BackendUnavailable ? 503 : 500);
  }
}
