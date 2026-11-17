import "server-only";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { backendMode } from "@/lib/env";
import { supabaseForUser, supabaseService } from "@/lib/supabase/server";
import { BackendUnavailable, readLocal, writeLocal, type LocalPrintRequest } from "@/lib/store";
import { effectiveStatus, FINAL_STATUSES, isLive, newCancelToken, newCollectionCode, REQUEST_DAYS, toPublic, type PrintPartner, type PrintStatus, type PublicPartner } from "@/lib/print";

const JOBS_DIR = path.join(process.cwd(), ".data", "print-jobs");
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

type PartnerRow = { id: string; name: string; kind: PrintPartner["kind"]; destination_slug: string; address: string; opening_hours: string | null; verification_note?: string | null; verified: boolean; verified_on: string | null; active: boolean };
const fromRow = (r: PartnerRow): PrintPartner => ({ id: r.id, name: r.name, kind: r.kind, destination: r.destination_slug, address: r.address, openingHours: r.opening_hours ?? "", verificationNote: r.verification_note ?? undefined, verified: r.verified, verifiedOn: r.verified_on, active: r.active });
const toRow = (p: PrintPartner) => ({ id: p.id, name: p.name, kind: p.kind, destination_slug: p.destination, address: p.address, opening_hours: p.openingHours || null, verification_note: p.verificationNote || null, verified: p.verified, verified_on: p.verifiedOn, active: p.active });
const PUBLIC_COLS = "id, name, kind, destination_slug, address, opening_hours, verified, verified_on, active";

/** Partners visitors may use: verified AND active. Empty when nothing is set up — printing is then not offered. */
export async function listLivePartners(): Promise<PublicPartner[]> {
  const mode = backendMode();
  if (mode === "supabase") {
    const { data } = await (await supabaseForUser()).from("print_partners").select(PUBLIC_COLS).order("name");
    return ((data ?? []) as PartnerRow[]).map(fromRow).filter(isLive).map(toPublic);
  }
  if (mode === "local") return ((await readLocal()).printPartners ?? []).filter(isLive).map(toPublic);
  return [];
}

export async function adminListPartners(): Promise<PrintPartner[]> {
  const mode = backendMode();
  if (mode === "supabase") {
    const { data } = await supabaseService().from("print_partners").select("*").order("name");
    return ((data ?? []) as PartnerRow[]).map(fromRow);
  }
  if (mode === "local") return (await readLocal()).printPartners ?? [];
  return [];
}

export async function adminUpsertPartner(p: Omit<PrintPartner, "id"> & { id?: string }) {
  const item: PrintPartner = { ...p, id: p.id ?? randomUUID() };
  const mode = backendMode();
  if (mode === "supabase") {
    const { error } = await supabaseService().from("print_partners").upsert(toRow(item));
    if (error) throw new Error("Save failed");
    return item;
  }
  if (mode === "local") {
    await writeLocal((db) => {
      const list = db.printPartners ?? [];
      const i = list.findIndex((x) => x.id === item.id);
      if (i >= 0) list[i] = item;
      else list.push(item);
      db.printPartners = list;
    });
    return item;
  }
  throw new BackendUnavailable();
}

/** Deleting is refused while the partner still has open requests; deactivate instead. */
export async function adminDeletePartner(id: string): Promise<"ok" | "missing" | "in-use"> {
  const open = (await adminListPrintRequests()).some((r) => r.partnerId === id && !FINAL_STATUSES.includes(r.status));
  if (open) return "in-use";
  const mode = backendMode();
  if (mode === "supabase") {
    const sb = supabaseService();
    await sb.from("print_requests").delete().eq("partner_id", id);
    const { count } = await sb.from("print_partners").delete({ count: "exact" }).eq("id", id);
    return (count ?? 0) > 0 ? "ok" : "missing";
  }
  if (mode === "local") {
    return writeLocal((db) => {
      const before = db.printPartners?.length ?? 0;
      db.printPartners = (db.printPartners ?? []).filter((x) => x.id !== id);
      db.printRequests = (db.printRequests ?? []).filter((r) => r.partnerId !== id);
      return before !== db.printPartners.length ? "ok" : "missing";
    });
  }
  throw new BackendUnavailable();
}

/* ---------------- requests ---------------- */
type RequestRow = { id: string; code: string; partner_id: string; user_id: string | null; status: PrintStatus; cancel_token_hash: string; image_path: string | null; created_at: string; updated_at: string; expires_at: string };
const reqFromRow = (r: RequestRow): LocalPrintRequest => ({ id: r.id, code: r.code, partnerId: r.partner_id, userId: r.user_id, status: r.status, cancelTokenHash: r.cancel_token_hash, imagePath: r.image_path, createdAt: r.created_at, updatedAt: r.updated_at, expiresAt: r.expires_at });

export class PrintUnavailable extends Error {}

/** Create a request for a live partner. Returns the collection code and a one-time cancel token. */
export async function createPrintRequest(partnerId: string, image: Uint8Array, userId: string | null) {
  const partner = (await listLivePartners()).find((p) => p.id === partnerId);
  if (!partner) throw new PrintUnavailable();
  const id = randomUUID();
  const token = newCancelToken();
  const now = new Date();
  const expires = new Date(now.getTime() + REQUEST_DAYS * 86_400_000);
  const mode = backendMode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCollectionCode();
    if (mode === "supabase") {
      const sb = supabaseService();
      const imagePath = `${id}.jpg`;
      const up = await sb.storage.from("print-jobs").upload(imagePath, image, { contentType: "image/jpeg", upsert: false });
      if (up.error) throw new Error("Upload failed");
      const { error } = await sb.from("print_requests").insert({ id, code, partner_id: partnerId, user_id: userId, cancel_token_hash: hash(token), image_path: imagePath, expires_at: expires.toISOString() });
      if (!error) return { code, cancelToken: token, partner, expiresAt: expires.toISOString() };
      await sb.storage.from("print-jobs").remove([imagePath]);
      if (!/duplicate|unique/i.test(error.message)) throw new Error("Could not save the request");
      continue;
    }
    if (mode === "local") {
      const db = await readLocal();
      if ((db.printRequests ?? []).some((r) => r.code === code)) continue;
      await fs.mkdir(JOBS_DIR, { recursive: true });
      const imagePath = `${id}.jpg`;
      await fs.writeFile(path.join(JOBS_DIR, imagePath), image);
      await writeLocal((d) => {
        d.printRequests = [...(d.printRequests ?? []), { id, code, partnerId, userId, status: "requested", cancelTokenHash: hash(token), imagePath, createdAt: now.toISOString(), updatedAt: now.toISOString(), expiresAt: expires.toISOString() }];
      });
      return { code, cancelToken: token, partner, expiresAt: expires.toISOString() };
    }
    throw new BackendUnavailable();
  }
  throw new Error("Could not create a unique code");
}

async function findByCode(code: string): Promise<LocalPrintRequest | null> {
  const mode = backendMode();
  if (mode === "supabase") {
    const { data } = await supabaseService().from("print_requests").select("*").eq("code", code).maybeSingle();
    return data ? reqFromRow(data as RequestRow) : null;
  }
  if (mode === "local") return (await readLocal()).printRequests?.find((r) => r.code === code) ?? null;
  return null;
}

/** What anyone holding the code may see: status and where to collect. Nothing personal. */
export async function getPrintStatus(code: string) {
  const r = await findByCode(code);
  if (!r) return null;
  const partner = (await adminListPartners()).find((p) => p.id === r.partnerId);
  return {
    code: r.code,
    status: effectiveStatus(r.status, r.expiresAt),
    partner: partner ? { name: partner.name, kind: partner.kind, address: partner.address, openingHours: partner.openingHours, destination: partner.destination } : null,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
  };
}

async function removeImage(r: LocalPrintRequest) {
  if (!r.imagePath) return;
  if (backendMode() === "supabase") await supabaseService().storage.from("print-jobs").remove([r.imagePath]);
  else await fs.rm(path.join(JOBS_DIR, path.basename(r.imagePath)), { force: true });
}

async function setStatus(r: LocalPrintRequest, status: PrintStatus) {
  const dropImage = FINAL_STATUSES.includes(status);
  if (dropImage) await removeImage(r);
  const mode = backendMode();
  if (mode === "supabase") {
    const { error } = await supabaseService().from("print_requests").update({ status, ...(dropImage ? { image_path: null } : {}) }).eq("id", r.id);
    if (error) throw new Error("Update failed");
    return;
  }
  await writeLocal((db) => {
    const x = db.printRequests?.find((q) => q.id === r.id);
    if (x) {
      x.status = status;
      x.updatedAt = new Date().toISOString();
      if (dropImage) x.imagePath = null;
    }
  });
}

/** The visitor cancels with the token they were given; the postcard image is deleted. */
export async function cancelPrintRequest(code: string, token: string): Promise<"ok" | "missing" | "forbidden" | "final"> {
  const r = await findByCode(code);
  if (!r) return "missing";
  const a = Buffer.from(hash(token)),
    b = Buffer.from(r.cancelTokenHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "forbidden";
  if (FINAL_STATUSES.includes(effectiveStatus(r.status, r.expiresAt))) return "final";
  await setStatus(r, "cancelled");
  return "ok";
}

export async function adminListPrintRequests(): Promise<LocalPrintRequest[]> {
  const mode = backendMode();
  let list: LocalPrintRequest[] = [];
  if (mode === "supabase") {
    const { data } = await supabaseService().from("print_requests").select("*").order("created_at", { ascending: false }).limit(200);
    list = ((data ?? []) as RequestRow[]).map(reqFromRow);
  } else if (mode === "local") list = [...((await readLocal()).printRequests ?? [])].reverse();
  return list.map((r) => ({ ...r, status: effectiveStatus(r.status, r.expiresAt) }));
}

export async function adminSetPrintStatus(id: string, status: PrintStatus) {
  const r = (await adminListPrintRequests()).find((x) => x.id === id);
  if (!r) return false;
  await setStatus(r, status);
  return true;
}

export async function adminPrintImage(id: string): Promise<Uint8Array | null> {
  const r = (await adminListPrintRequests()).find((x) => x.id === id);
  if (!r?.imagePath) return null;
  if (backendMode() === "supabase") {
    const { data } = await supabaseService().storage.from("print-jobs").download(r.imagePath);
    return data ? new Uint8Array(await data.arrayBuffer()) : null;
  }
  try {
    return new Uint8Array(await fs.readFile(path.join(JOBS_DIR, path.basename(r.imagePath))));
  } catch {
    return null;
  }
}

/** Signed-in visitor (Supabase) — used to link a request to the account. */
export async function currentUserId() {
  if (backendMode() !== "supabase") return null;
  const { data } = await (await supabaseForUser()).auth.getUser();
  return data.user?.id ?? null;
}
