import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { backendMode } from "@/lib/env";
import { supabaseForUser, supabaseService } from "@/lib/supabase/server";
import { events as seedEvents, prices as seedPrices, type EventItem, type Price } from "@/content/practical";
import { destinations } from "@/content/destinations";
import { recipes as seedRecipes, type Recipe } from "@/content/food";
import { bucketSeed, type BucketActivity } from "@/content/bucket";
import { mediaSeed, type MediaItem } from "@/content/media";
import type { Itinerary } from "@/lib/validation";

export type Kind = "question" | "story";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export type Submission = {
  id: string;
  kind: Kind;
  name: string;
  email: string;
  destination: string;
  title: string | null;
  body: string;
  country: string | null;
  answer: string | null;
  status: SubmissionStatus;
  created_at: string;
};

/** What the public may see: no email, first name only. */
export type PublicSubmission = Pick<Submission, "id" | "kind" | "destination" | "title" | "body" | "country" | "answer" | "created_at"> & {
  firstName: string;
};

export function toPublic(s: Submission): PublicSubmission {
  return {
    id: s.id,
    kind: s.kind,
    destination: s.destination,
    title: s.title,
    body: s.body,
    country: s.country,
    answer: s.answer,
    created_at: s.created_at,
    firstName: s.name.split(" ")[0] ?? "Traveller",
  };
}

export class BackendUnavailable extends Error {
  constructor() {
    super("The database is not configured yet, so this can't be saved. Please try again later.");
  }
}

/* ---------------- Local JSON store (demo mode only) ---------------- */
type LocalDb = {
  submissions: Submission[];
  contacts: { id: string; name: string; email: string; topic: string; message: string; created_at: string }[];
  newsletter: { email: string; created_at: string }[];
  prices: Record<string, [number, number]>;
  /** null/undefined = use the seeded content files */
  events?: EventItem[] | null;
  featured?: string[] | null;
  recipeReview?: Record<string, { status: "draft" | "approved"; lastReviewed: string; reviewer?: string }>;
  bucket?: BucketActivity[] | null;
  media?: MediaItem[] | null;
  printPartners?: import("./print").PrintPartner[];
  printRequests?: LocalPrintRequest[];
};
export type LocalPrintRequest = { id: string; code: string; partnerId: string; userId: string | null; status: import("./print").PrintStatus; cancelTokenHash: string; imagePath: string | null; createdAt: string; updatedAt: string; expiresAt: string };
const DB_FILE = path.join(process.cwd(), ".data", "local-db.json");
let queue: Promise<unknown> = Promise.resolve();

export async function readLocal(): Promise<LocalDb> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as LocalDb;
  } catch {
    return { submissions: [], contacts: [], newsletter: [], prices: {} };
  }
}
export function writeLocal<T>(fn: (db: LocalDb) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await readLocal();
    const out = fn(db);
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), { mode: 0o600 });
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

/* ---------------- Public API used by routes ---------------- */
export async function createSubmission(input: Omit<Submission, "id" | "status" | "created_at" | "answer">) {
  const mode = backendMode();
  if (mode === "supabase") {
    // Insert as anonymous/visitor; RLS allows insert of status='pending' only.
    const sb = await supabaseForUser();
    const { error } = await sb.from("submissions").insert({ ...input, status: "pending" });
    if (error) throw new Error("Could not save your submission");
    return;
  }
  if (mode === "local") {
    await writeLocal((db) => {
      db.submissions.push({ ...input, id: randomUUID(), status: "pending", answer: null, created_at: new Date().toISOString() });
    });
    return;
  }
  throw new BackendUnavailable();
}

export async function listPublished(kind: Kind, limit = 12): Promise<PublicSubmission[]> {
  const mode = backendMode();
  if (mode === "supabase") {
    const sb = await supabaseForUser();
    const { data } = await sb
      .from("public_submissions")
      .select("id, kind, destination, title, body, country, answer, created_at, first_name")
      .eq("kind", kind)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((r) => ({ ...r, firstName: r.first_name })) as PublicSubmission[];
  }
  if (mode === "local") {
    const db = await readLocal();
    return db.submissions
      .filter((s) => s.kind === kind && s.status === "approved")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit)
      .map(toPublic);
  }
  return [];
}

/** Admin only — callers must have passed requireAdmin(). */
export async function adminListSubmissions(status: SubmissionStatus | "all" = "pending"): Promise<Submission[]> {
  const mode = backendMode();
  if (mode === "supabase") {
    let q = supabaseService().from("submissions").select("*").order("created_at", { ascending: false }).limit(200);
    if (status !== "all") q = q.eq("status", status);
    const { data } = await q;
    return (data ?? []) as Submission[];
  }
  if (mode === "local") {
    const db = await readLocal();
    return db.submissions.filter((s) => status === "all" || s.status === status).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return [];
}

export async function adminModerate(id: string, action: "approve" | "reject", answer?: string) {
  const status: SubmissionStatus = action === "approve" ? "approved" : "rejected";
  const mode = backendMode();
  if (mode === "supabase") {
    const { error, count } = await supabaseService()
      .from("submissions")
      .update({ status, answer: answer || null, moderated_at: new Date().toISOString() }, { count: "exact" })
      .eq("id", id);
    if (error) throw new Error("Update failed");
    return (count ?? 0) > 0;
  }
  if (mode === "local") {
    return writeLocal((db) => {
      const s = db.submissions.find((x) => x.id === id);
      if (!s) return false;
      s.status = status;
      if (answer !== undefined) s.answer = answer || null;
      return true;
    });
  }
  throw new BackendUnavailable();
}

export async function adminStats() {
  const all = await adminListSubmissions("all");
  return {
    pending: all.filter((s) => s.status === "pending").length,
    approved: all.filter((s) => s.status === "approved").length,
    rejected: all.filter((s) => s.status === "rejected").length,
    questions: all.filter((s) => s.kind === "question").length,
    stories: all.filter((s) => s.kind === "story").length,
  };
}

export async function saveContact(c: { name: string; email: string; topic: string; message: string }) {
  const mode = backendMode();
  if (mode === "supabase") {
    const { error } = await (await supabaseForUser()).from("contact_messages").insert(c);
    if (error) throw new Error("Could not send your message");
    return;
  }
  if (mode === "local") {
    await writeLocal((db) => void db.contacts.push({ ...c, id: randomUUID(), created_at: new Date().toISOString() }));
    return;
  }
  throw new BackendUnavailable();
}

export async function subscribe(email: string) {
  const mode = backendMode();
  if (mode === "supabase") {
    // Upsert-like: ignore duplicates so we never reveal whether an email is already subscribed.
    const { error } = await (await supabaseForUser()).from("newsletter_subscribers").insert({ email });
    if (error && error.code !== "23505") throw new Error("Could not subscribe");
    return;
  }
  if (mode === "local") {
    await writeLocal((db) => {
      if (!db.newsletter.some((n) => n.email === email)) db.newsletter.push({ email, created_at: new Date().toISOString() });
    });
    return;
  }
  throw new BackendUnavailable();
}

/* ---------------- Prices (admin-editable) ---------------- */
export async function getPrices(): Promise<Price[]> {
  const mode = backendMode();
  if (mode === "supabase") {
    const { data } = await (await supabaseForUser()).from("travel_prices").select("id, item, min_egp, max_egp, kind, status, last_verified, source_name, source_url");
    if (data?.length) {
      return data.map((r) => ({
        id: r.id,
        item: r.item,
        egp: [Number(r.min_egp), Number(r.max_egp)] as [number, number],
        kind: r.kind,
        status: r.status,
        lastVerified: r.last_verified,
        source: r.source_url ? { name: r.source_name, url: r.source_url } : undefined,
      }));
    }
  }
  if (mode === "local") {
    const db = await readLocal();
    return seedPrices.map((p) => (db.prices[p.id] ? { ...p, egp: db.prices[p.id], lastVerified: new Date().toISOString().slice(0, 10) } : p));
  }
  return seedPrices;
}

export async function adminUpdatePrice(id: string, min: number, max: number) {
  const mode = backendMode();
  const today = new Date().toISOString().slice(0, 10);
  if (mode === "supabase") {
    const { error, count } = await supabaseService()
      .from("travel_prices")
      .update({ min_egp: min, max_egp: max, last_verified: today }, { count: "exact" })
      .eq("id", id);
    if (error) throw new Error("Update failed");
    return (count ?? 0) > 0;
  }
  if (mode === "local") {
    if (!seedPrices.some((p) => p.id === id)) return false;
    return writeLocal((db) => {
      db.prices[id] = [min, max];
      return true;
    });
  }
  throw new BackendUnavailable();
}

/* ---------------- Itineraries (signed-in visitors, Supabase only) ---------------- */
export async function saveItineraryForUser(it: Itinerary) {
  const sb = await supabaseForUser();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return { ok: false as const, status: 401 };
  // user_id comes from the verified session, never from the request body (prevents IDOR).
  const { data, error } = await sb.from("itineraries").insert({ user_id: auth.user.id, title: it.title, data: it }).select("id").single();
  if (error) return { ok: false as const, status: 500 };
  return { ok: true as const, id: data.id as string };
}

export async function listItinerariesForUser() {
  const sb = await supabaseForUser();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  // RLS restricts rows to auth.uid() = user_id; the explicit filter is defence in depth.
  const { data } = await sb.from("itineraries").select("id, title, data, created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false });
  return data ?? [];
}

/* ---------------- Events (admin-managed) ---------------- */
type EventRow = { id: string; name: string; location: string; when_text: string; date_iso: string | null; description: string; status: EventItem["status"]; last_verified: string | null; source_name: string | null; source_url: string | null };
const fromRow = (r: EventRow): EventItem => ({
  id: r.id, name: r.name, where: r.location, when: r.when_text, dateISO: r.date_iso, description: r.description,
  status: r.status, lastVerified: r.last_verified, source: r.source_url ? { name: r.source_name ?? r.source_url, url: r.source_url } : undefined,
});
const toRow = (e: EventItem): EventRow => ({
  id: e.id, name: e.name, location: e.where, when_text: e.when, date_iso: e.dateISO, description: e.description,
  status: e.status, last_verified: e.lastVerified, source_name: e.source?.name ?? null, source_url: e.source?.url ?? null,
});
const byDate = (a: EventItem, b: EventItem) => (a.dateISO ?? "9999").localeCompare(b.dateISO ?? "9999");

export async function getEvents(): Promise<EventItem[]> {
  const mode = backendMode();
  if (mode === "supabase") {
    const { data } = await (await supabaseForUser()).from("events").select("*");
    if (data?.length) return (data as EventRow[]).map(fromRow).sort(byDate);
  }
  if (mode === "local") {
    const db = await readLocal();
    if (db.events) return [...db.events].sort(byDate);
  }
  return [...seedEvents].sort(byDate);
}

export async function adminUpsertEvent(e: EventItem) {
  const mode = backendMode();
  if (mode === "supabase") {
    const { error } = await supabaseService().from("events").upsert(toRow(e));
    if (error) throw new Error("Save failed");
    return;
  }
  if (mode === "local") {
    await writeLocal((db) => {
      const list = db.events ?? [...seedEvents];
      const i = list.findIndex((x) => x.id === e.id);
      if (i >= 0) list[i] = e;
      else list.push(e);
      db.events = list;
    });
    return;
  }
  throw new BackendUnavailable();
}

export async function adminDeleteEvent(id: string) {
  const mode = backendMode();
  if (mode === "supabase") {
    const { error, count } = await supabaseService().from("events").delete({ count: "exact" }).eq("id", id);
    if (error) throw new Error("Delete failed");
    return (count ?? 0) > 0;
  }
  if (mode === "local") {
    return writeLocal((db) => {
      const list = db.events ?? [...seedEvents];
      const next = list.filter((x) => x.id !== id);
      db.events = next;
      return next.length !== list.length;
    });
  }
  throw new BackendUnavailable();
}

/* ---------------- Featured destinations (homepage) ---------------- */
export const FEATURED_SLOTS = 5;
export const DEFAULT_FEATURED = ["giza", "luxor", "aswan", "dahab", "siwa"];
const validSlug = (s: string) => destinations.some((d) => d.slug === s);

export async function getFeatured(): Promise<string[]> {
  const mode = backendMode();
  let list: string[] | null = null;
  if (mode === "supabase") {
    const { data } = await (await supabaseForUser()).from("site_settings").select("value").eq("key", "featured_destinations").maybeSingle();
    list = Array.isArray(data?.value) ? (data.value as string[]) : null;
  } else if (mode === "local") {
    list = (await readLocal()).featured ?? null;
  }
  const clean = (list ?? DEFAULT_FEATURED).filter(validSlug);
  return clean.length === FEATURED_SLOTS ? clean : DEFAULT_FEATURED;
}

export async function adminSetFeatured(slugs: string[]) {
  const mode = backendMode();
  if (mode === "supabase") {
    const { error } = await supabaseService().from("site_settings").upsert({ key: "featured_destinations", value: slugs, updated_at: new Date().toISOString() });
    if (error) throw new Error("Save failed");
    return;
  }
  if (mode === "local") {
    await writeLocal((db) => void (db.featured = slugs));
    return;
  }
  throw new BackendUnavailable();
}

export async function deleteItineraryForUser(id: string) {
  const sb = await supabaseForUser();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return { ok: false as const, status: 401 };
  // Both RLS and the user_id filter stop anyone deleting another visitor's trip.
  const { error, count } = await sb.from("itineraries").delete({ count: "exact" }).eq("id", id).eq("user_id", auth.user.id);
  if (error) return { ok: false as const, status: 500 };
  return (count ?? 0) > 0 ? { ok: true as const } : { ok: false as const, status: 404 };
}

/* ---------------- Recipes: editorial review gate ---------------- */
type ReviewRow = { slug: string; status: "draft" | "approved"; last_reviewed: string; reviewer: string | null };

/** All recipes with their current review status. */
export async function getRecipes(): Promise<Recipe[]> {
  const mode = backendMode();
  let overrides: Record<string, Recipe["review"]> = {};
  if (mode === "supabase") {
    const { data } = await (await supabaseForUser()).from("recipes").select("slug, status, last_reviewed, reviewer");
    overrides = Object.fromEntries(((data ?? []) as ReviewRow[]).map((r) => [r.slug, { status: r.status, lastReviewed: r.last_reviewed, reviewer: r.reviewer ?? undefined }]));
  } else if (mode === "local") {
    overrides = (await readLocal()).recipeReview ?? {};
  }
  return seedRecipes.map((r) => (overrides[r.slug] ? { ...r, review: overrides[r.slug] } : r));
}

/**
 * Recipes visitors may see. On the live site only approved recipes are public.
 * In local demo mode drafts are shown too (clearly labelled) so the feature can be reviewed.
 */
export async function getVisibleRecipes(): Promise<Recipe[]> {
  const all = await getRecipes();
  return backendMode() === "local" ? all : all.filter((r) => r.review.status === "approved");
}

export async function adminSetRecipeReview(slug: string, status: "draft" | "approved", reviewer: string) {
  if (!seedRecipes.some((r) => r.slug === slug)) return false;
  const review = { status, lastReviewed: new Date().toISOString().slice(0, 10), reviewer };
  const mode = backendMode();
  if (mode === "supabase") {
    const { error } = await supabaseService().from("recipes").update({ status, last_reviewed: review.lastReviewed, reviewer }).eq("slug", slug);
    if (error) throw new Error("Update failed");
    return true;
  }
  if (mode === "local") {
    await writeLocal((db) => void ((db.recipeReview ??= {})[slug] = review));
    return true;
  }
  throw new BackendUnavailable();
}

/* ---------------- Bucket list: official activities (admin-managed) ---------------- */
type BucketRow = { id: string; data: BucketActivity };

/** All activities including unpublished ones — admin use. */
export async function getBucketAll(): Promise<BucketActivity[]> {
  const mode = backendMode();
  if (mode === "supabase") {
    const { data } = await (await supabaseForUser()).from("bucket_list_activities").select("id, data").order("created_at");
    if (data?.length) return (data as BucketRow[]).map((r) => ({ ...r.data, id: r.id }));
  }
  if (mode === "local") {
    const db = await readLocal();
    if (db.bucket) return db.bucket;
  }
  return bucketSeed;
}

/** What visitors see: published only, featured first. */
export async function getBucketPublished(): Promise<BucketActivity[]> {
  return (await getBucketAll()).filter((a) => a.published).sort((a, b) => Number(b.featured) - Number(a.featured));
}

export async function adminUpsertBucket(a: BucketActivity) {
  const mode = backendMode();
  if (mode === "supabase") {
    const { error } = await supabaseService()
      .from("bucket_list_activities")
      .upsert({ id: a.id, title: a.title, destination_slug: a.destination, published: a.published, featured: a.featured, data: a, last_reviewed: a.lastReviewed });
    if (error) throw new Error("Save failed");
    return;
  }
  if (mode === "local") {
    await writeLocal((db) => {
      const list = db.bucket ?? [...bucketSeed];
      const i = list.findIndex((x) => x.id === a.id);
      if (i >= 0) list[i] = { ...a, createdAt: list[i].createdAt };
      else list.push(a);
      db.bucket = list;
    });
    return;
  }
  throw new BackendUnavailable();
}

export async function adminDeleteBucket(id: string) {
  const mode = backendMode();
  if (mode === "supabase") {
    const { error, count } = await supabaseService().from("bucket_list_activities").delete({ count: "exact" }).eq("id", id);
    if (error) throw new Error("Delete failed");
    return (count ?? 0) > 0;
  }
  if (mode === "local") {
    return writeLocal((db) => {
      const list = db.bucket ?? [...bucketSeed];
      const next = list.filter((x) => x.id !== id);
      db.bucket = next;
      return next.length !== list.length;
    });
  }
  throw new BackendUnavailable();
}

/* ---------------- Bucket list: a signed-in visitor's own progress (Supabase only) ---------------- */
export type BucketProgress = Record<string, { added: boolean; done: boolean; fav: boolean; doneAt?: string }>;

export async function getMyBucket(): Promise<BucketProgress | null> {
  const sb = await supabaseForUser();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("user_bucket_list").select("activity_id, added, completed, favourite, completed_at").eq("user_id", auth.user.id);
  return Object.fromEntries(
    (data ?? []).map((r: { activity_id: string; added: boolean; completed: boolean; favourite: boolean; completed_at: string | null }) => [
      r.activity_id,
      { added: r.added, done: r.completed, fav: r.favourite, doneAt: r.completed_at ?? undefined },
    ]),
  );
}

/** Replace the signed-in visitor's progress. user_id always comes from the session, never the request. */
export async function saveMyBucket(progress: BucketProgress) {
  const sb = await supabaseForUser();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return { ok: false as const, status: 401 };
  const rows = Object.entries(progress).map(([activity_id, p]) => ({
    user_id: auth.user!.id,
    activity_id,
    added: p.added,
    completed: p.done,
    favourite: p.fav,
    completed_at: p.done ? (p.doneAt ?? new Date().toISOString()) : null,
  }));
  const del = await sb.from("user_bucket_list").delete().eq("user_id", auth.user.id);
  if (del.error) return { ok: false as const, status: 500 };
  if (rows.length) {
    const { error } = await sb.from("user_bucket_list").insert(rows);
    if (error) return { ok: false as const, status: 500 };
  }
  return { ok: true as const };
}

/* ---------------- Watch & Discover: media items (admin-managed) ---------------- */
type MediaRow = { id: string; data: MediaItem };

/** Every media item including drafts — admin use. */
export async function getMediaAll(): Promise<MediaItem[]> {
  const mode = backendMode();
  if (mode === "supabase") {
    const { data } = await (await supabaseForUser()).from("media_items").select("id, data").order("created_at");
    if (data?.length) return (data as MediaRow[]).map((r) => ({ ...r.data, id: r.id }));
  }
  if (mode === "local") {
    const db = await readLocal();
    if (db.media) return db.media;
  }
  return mediaSeed;
}

/**
 * What visitors see. On the live site only published items; in local demo mode drafts are
 * shown too, clearly labelled, so the feature can be reviewed before anything is approved.
 */
export async function getVisibleMedia(): Promise<MediaItem[]> {
  const all = await getMediaAll();
  const list = backendMode() === "local" ? all : all.filter((m) => m.status === "published");
  return list.sort((a, b) => Number(b.featured) - Number(a.featured));
}

export async function adminUpsertMedia(m: MediaItem) {
  const mode = backendMode();
  if (mode === "supabase") {
    const { error } = await supabaseService()
      .from("media_items")
      .upsert({ id: m.id, title: m.title, kind: m.kind, destinations: m.destinations, status: m.status, featured: m.featured, data: m, last_reviewed: m.lastReviewed });
    if (error) throw new Error("Save failed");
    return;
  }
  if (mode === "local") {
    await writeLocal((db) => {
      const list = db.media ?? [...mediaSeed];
      const i = list.findIndex((x) => x.id === m.id);
      if (i >= 0) list[i] = { ...m, createdAt: list[i].createdAt };
      else list.push(m);
      db.media = list;
    });
    return;
  }
  throw new BackendUnavailable();
}

export async function adminDeleteMedia(id: string) {
  const mode = backendMode();
  if (mode === "supabase") {
    const { error, count } = await supabaseService().from("media_items").delete({ count: "exact" }).eq("id", id);
    if (error) throw new Error("Delete failed");
    return (count ?? 0) > 0;
  }
  if (mode === "local") {
    return writeLocal((db) => {
      const list = db.media ?? [...mediaSeed];
      const next = list.filter((x) => x.id !== id);
      db.media = next;
      return next.length !== list.length;
    });
  }
  throw new BackendUnavailable();
}
