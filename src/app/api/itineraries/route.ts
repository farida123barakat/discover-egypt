import type { NextRequest } from "next/server";
import { json, parseRequest } from "@/lib/api";
import { itinerarySchema } from "@/lib/validation";
import { backendMode } from "@/lib/env";
import { z } from "zod";
import { deleteItineraryForUser, listItinerariesForUser, saveItineraryForUser } from "@/lib/store";

export async function GET() {
  if (backendMode() !== "supabase") return json({ error: "Accounts are not enabled" }, 501);
  const list = await listItinerariesForUser();
  if (!list) return json({ error: "Sign in required" }, 401);
  return json({ itineraries: list });
}

export async function POST(req: NextRequest) {
  if (backendMode() !== "supabase") return json({ error: "Accounts are not enabled" }, 501);
  const p = await parseRequest(req, itinerarySchema, { bucket: "itinerary", limit: 20, windowMs: 10 * 60_000 });
  if (!p.ok) return p.res;
  const r = await saveItineraryForUser(p.data);
  if (!r.ok) return json({ error: r.status === 401 ? "Sign in required" : "Could not save" }, r.status);
  return json({ ok: true, id: r.id }, 201);
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(req: NextRequest) {
  if (backendMode() !== "supabase") return json({ error: "Accounts are not enabled" }, 501);
  const p = await parseRequest(req, deleteSchema, { bucket: "itinerary", limit: 20, windowMs: 10 * 60_000 });
  if (!p.ok) return p.res;
  const r = await deleteItineraryForUser(p.data.id);
  if (!r.ok) return json({ error: r.status === 401 ? "Sign in required" : r.status === 404 ? "Trip not found" : "Could not delete" }, r.status);
  return json({ ok: true });
}
